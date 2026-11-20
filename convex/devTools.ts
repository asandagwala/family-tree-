import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Developer helpers. They are internal: the app can't call them, only someone
 * with the deployment's dashboard or CLI, e.g. `npx convex run devTools:clearAll`.
 * They act on every family at once, so use them on a development deployment.
 */

/** Rename a place in every birthplace, home and story. */
export const renamePlace = internalMutation({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, { from, to }) => {
    for await (const p of ctx.db.query("people")) {
      const patch: { birthPlace?: string; currentPlace?: string; notes?: string } = {};
      if (p.birthPlace === from) patch.birthPlace = to;
      if (p.currentPlace === from) patch.currentPlace = to;
      if (p.notes?.includes(from)) patch.notes = p.notes.split(from).join(to);
      if (Object.keys(patch).length) await ctx.db.patch("people", p._id, patch);
    }
    return null;
  },
});

/** Rename a surname for everyone who has it. */
export const renameSurname = internalMutation({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, { from, to }) => {
    for await (const p of ctx.db.query("people").withIndex("by_lastName_and_firstName", (q) => q.eq("lastName", from))) {
      await ctx.db.patch("people", p._id, { lastName: to });
    }
    return null;
  },
});

/** Empty every tree, album and family, deleting their photos too. Accounts are kept. */
export const clearAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    for await (const ph of ctx.db.query("gatheringPhotos")) {
      await ctx.storage.delete(ph.storageId);
      await ctx.db.delete("gatheringPhotos", ph._id);
    }
    for await (const g of ctx.db.query("gatherings")) await ctx.db.delete("gatherings", g._id);
    for await (const f of ctx.db.query("families")) await ctx.db.delete("families", f._id);
    for (const table of ["parentLinks", "partnerships", "photos", "people"] as const) {
      for await (const doc of ctx.db.query(table)) {
        if (table === "photos" && "storageId" in doc) await ctx.storage.delete(doc.storageId);
        if (table === "people" && "photoId" in doc && doc.photoId) await ctx.storage.delete(doc.photoId);
        await ctx.db.delete(table, doc._id);
      }
    }
    return null;
  },
});
