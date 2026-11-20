import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { personFields } from "./schema";
import { requireAccess, requirePersonAccess, spaceArg, spaceFields } from "./lib/access";
import { cleanFields, isAncestor, orderPair, requireFirstName, requirePerson, sameTree } from "./lib/people";
import { checkPersonFields } from "./lib/security";
import { gatheringsIn } from "./lib/tree";

/** Adding, editing and removing people, and recording who is whose parent or partner. */

// ---------- People ----------

export const createPerson = mutation({
  args: { ...personFields, ...spaceArg },
  handler: async (ctx, { sample, ...args }) => {
    const space = await requireAccess(ctx, !!sample);
    requireFirstName(args.firstName);
    checkPersonFields(args);
    return await ctx.db.insert("people", { ...cleanFields(args), ...spaceFields(space) });
  },
});

export const updatePerson = mutation({
  args: { id: v.id("people"), ...personFields },
  handler: async (ctx, { id, ...rest }) => {
    await requirePersonAccess(ctx, id);
    requireFirstName(rest.firstName);
    checkPersonFields(rest);
    // Patch every editable field so cleared ones are removed, while the
    // profile photo is left alone.
    const cleared: Record<string, unknown> = {};
    for (const key of Object.keys(personFields)) cleared[key] = undefined;
    await ctx.db.patch("people", id, { ...cleared, ...cleanFields(rest) });
    return null;
  },
});

/** Removes a person with their relationships, photos and album tags. */
export const deletePerson = mutation({
  args: { id: v.id("people") },
  handler: async (ctx, { id }) => {
    const space = await requirePersonAccess(ctx, id);
    for await (const link of ctx.db
      .query("parentLinks")
      .withIndex("by_parentId_and_childId", (q) => q.eq("parentId", id))) {
      await ctx.db.delete("parentLinks", link._id);
    }
    for await (const link of ctx.db.query("parentLinks").withIndex("by_childId", (q) => q.eq("childId", id))) {
      await ctx.db.delete("parentLinks", link._id);
    }
    for await (const p of ctx.db
      .query("partnerships")
      .withIndex("by_personA_and_personB", (q) => q.eq("personA", id))) {
      await ctx.db.delete("partnerships", p._id);
    }
    for await (const p of ctx.db.query("partnerships").withIndex("by_personB", (q) => q.eq("personB", id))) {
      await ctx.db.delete("partnerships", p._id);
    }
    for await (const photo of ctx.db.query("photos").withIndex("by_personId", (q) => q.eq("personId", id))) {
      await ctx.storage.delete(photo.storageId);
      await ctx.db.delete("photos", photo._id);
    }
    for (const g of await gatheringsIn(ctx, space, 500)) {
      if (g.peopleIds.includes(id)) {
        await ctx.db.patch("gatherings", g._id, { peopleIds: g.peopleIds.filter((p) => p !== id) });
      }
    }
    const person = await ctx.db.get("people", id);
    if (person?.photoId) await ctx.storage.delete(person.photoId);
    await ctx.db.delete("people", id);
    return null;
  },
});

// ---------- Parents and children ----------

export const addParent = mutation({
  args: { childId: v.id("people"), parentId: v.id("people") },
  handler: async (ctx, { childId, parentId }) => {
    await requirePersonAccess(ctx, childId);
    if (!(await sameTree(ctx, childId, parentId))) {
      throw new ConvexError("Those two people are in different family trees.");
    }
    if (childId === parentId) throw new ConvexError("A person can't be their own parent.");
    await requirePerson(ctx, childId);
    await requirePerson(ctx, parentId);

    const existing = await ctx.db
      .query("parentLinks")
      .withIndex("by_childId", (q) => q.eq("childId", childId))
      .take(3);
    if (existing.some((l) => l.parentId === parentId)) return null;
    if (existing.length >= 2) throw new ConvexError("This person already has two parents.");
    if (await isAncestor(ctx, childId, parentId)) {
      throw new ConvexError("That would make someone their own ancestor.");
    }
    await ctx.db.insert("parentLinks", { parentId, childId });
    return null;
  },
});

export const removeParent = mutation({
  args: { childId: v.id("people"), parentId: v.id("people") },
  handler: async (ctx, { childId, parentId }) => {
    await requirePersonAccess(ctx, childId);
    const link = await ctx.db
      .query("parentLinks")
      .withIndex("by_parentId_and_childId", (q) => q.eq("parentId", parentId).eq("childId", childId))
      .unique();
    if (link) await ctx.db.delete("parentLinks", link._id);
    return null;
  },
});

// ---------- Partners ----------

export const addPartner = mutation({
  args: { personId: v.id("people"), partnerId: v.id("people") },
  handler: async (ctx, { personId, partnerId }) => {
    await requirePersonAccess(ctx, personId);
    if (!(await sameTree(ctx, personId, partnerId))) {
      throw new ConvexError("Those two people are in different family trees.");
    }
    if (personId === partnerId) throw new ConvexError("A person can't partner with themselves.");
    await requirePerson(ctx, personId);
    await requirePerson(ctx, partnerId);
    const pair = orderPair(personId, partnerId);
    const existing = await ctx.db
      .query("partnerships")
      .withIndex("by_personA_and_personB", (q) => q.eq("personA", pair.personA).eq("personB", pair.personB))
      .unique();
    if (!existing) await ctx.db.insert("partnerships", pair);
    return null;
  },
});

export const removePartner = mutation({
  args: { personId: v.id("people"), partnerId: v.id("people") },
  handler: async (ctx, { personId, partnerId }) => {
    await requirePersonAccess(ctx, personId);
    const pair = orderPair(personId, partnerId);
    const existing = await ctx.db
      .query("partnerships")
      .withIndex("by_personA_and_personB", (q) => q.eq("personA", pair.personA).eq("personB", pair.personB))
      .unique();
    if (existing) await ctx.db.delete("partnerships", existing._id);
    return null;
  },
});
