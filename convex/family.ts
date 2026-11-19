import { ConvexError, v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { personFields } from "./schema";

// A family tree is shown as a whole, so the whole tree is loaded at once,
// capped so a runaway table can't blow the query limits.
const MAX_PEOPLE = 2000;
const MAX_LINKS = 4000;

async function loadTree(ctx: QueryCtx) {
  const [people, parentLinks, partnerships] = await Promise.all([
    ctx.db.query("people").take(MAX_PEOPLE),
    ctx.db.query("parentLinks").take(MAX_LINKS),
    ctx.db.query("partnerships").take(MAX_LINKS),
  ]);
  return { people, parentLinks, partnerships };
}

export const getTree = query({
  args: {},
  handler: async (ctx) => {
    const tree = await loadTree(ctx);
    const people = await Promise.all(
      tree.people.map(async (p) => ({
        ...p,
        photoUrl: p.photoId ? await ctx.storage.getUrl(p.photoId) : null,
      })),
    );
    return { ...tree, people };
  },
});

// ---------- Settings ----------

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db.query("settings").first();
    return {
      familyName: row?.familyName ?? null,
      clanName: row?.clanName ?? null,
      clanPraise: row?.clanPraise ?? null,
      whatsappGroupUrl: row?.whatsappGroupUrl ?? null,
    };
  },
});

export const setFamilyName = mutation({
  args: { familyName: v.string() },
  handler: async (ctx, { familyName }) => {
    const name = familyName.trim();
    const row = await ctx.db.query("settings").first();
    const value = name === "" ? undefined : name;
    if (row) await ctx.db.patch("settings", row._id, { familyName: value });
    else await ctx.db.insert("settings", { familyName: value });
    return null;
  },
});

/** Updates only the settings passed; an empty string clears that setting. */
export const updateSettings = mutation({
  args: {
    clanName: v.optional(v.string()),
    clanPraise: v.optional(v.string()),
    whatsappGroupUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(args)) {
      if (value === undefined) continue;
      const trimmed = value.trim();
      patch[key] = trimmed === "" ? undefined : trimmed;
    }
    const url = patch.whatsappGroupUrl;
    if (url && !/^https:\/\/(chat\.whatsapp\.com|wa\.me)\//.test(url)) {
      throw new ConvexError("Paste the group's invite link. It starts with https://chat.whatsapp.com/");
    }
    const row = await ctx.db.query("settings").first();
    if (row) await ctx.db.patch("settings", row._id, patch);
    else await ctx.db.insert("settings", patch);
    return null;
  },
});

/** Dev helper (internal): renames a place in birthplaces and homes. */
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

/** Dev helper (internal): renames a surname across the tree. */
export const renameSurname = internalMutation({
  args: { from: v.string(), to: v.string() },
  handler: async (ctx, { from, to }) => {
    for await (const p of ctx.db
      .query("people")
      .withIndex("by_lastName_and_firstName", (q) => q.eq("lastName", from))) {
      await ctx.db.patch("people", p._id, { lastName: to });
    }
    return null;
  },
});

/** The tree as the family assistant sees it. */
export const treeForAssistant = internalQuery({
  args: {},
  handler: async (ctx) => {
    const tree = await loadTree(ctx);
    const photoCounts: Record<string, number> = {};
    for (const p of tree.people) {
      const photos = await ctx.db
        .query("photos")
        .withIndex("by_personId", (q) => q.eq("personId", p._id))
        .take(100);
      photoCounts[p._id] = photos.length + (p.photoId ? 1 : 0);
    }
    const settings = await ctx.db.query("settings").first();
    const gatherings = [];
    for (const g of await ctx.db.query("gatherings").take(200)) {
      const photos = await ctx.db
        .query("gatheringPhotos")
        .withIndex("by_gatheringId", (q) => q.eq("gatheringId", g._id))
        .take(1000);
      gatherings.push({
        title: g.title,
        kind: g.kind,
        date: g.date ?? null,
        place: g.place ?? null,
        story: g.story ?? null,
        peopleIds: g.peopleIds,
        photoCount: photos.length,
      });
    }
    // Contact details (phone numbers, social handles) are deliberately not sent to the assistant.
    const CONTACT_KEYS = new Set(["whatsapp", "instagram", "facebook", "tiktok", "linkedin"]);
    const people = tree.people.map(
      (p) => Object.fromEntries(Object.entries(p).filter(([k]) => !CONTACT_KEYS.has(k))) as typeof p,
    );
    return {
      ...tree,
      people,
      photoCounts,
      familyName: settings?.familyName ?? null,
      familyClan: settings?.clanName ?? null,
      familyClanPraise: settings?.clanPraise ?? null,
      gatherings,
    };
  },
});

/** Trims strings and drops optional fields left blank. */
function clean<T extends Record<string, unknown>>(fields: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed !== "" || key === "firstName" || key === "lastName") {
        out[key] = trimmed;
      }
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out as T;
}

function requireName(firstName: string) {
  if (firstName.trim() === "") {
    throw new ConvexError("A first name is required.");
  }
}

export const createPerson = mutation({
  args: personFields,
  handler: async (ctx, args) => {
    requireName(args.firstName);
    const fields = clean(args);
    return await ctx.db.insert("people", fields);
  },
});

export const updatePerson = mutation({
  args: { id: v.id("people"), ...personFields },
  handler: async (ctx, { id, ...rest }) => {
    requireName(rest.firstName);
    const fields = clean(rest);
    // Patch every editable field so cleared ones are removed, while the
    // profile photo is left alone.
    const patch: Record<string, unknown> = {};
    for (const key of Object.keys(personFields)) patch[key] = undefined;
    await ctx.db.patch("people", id, { ...patch, ...fields });
    return null;
  },
});

export const deletePerson = mutation({
  args: { id: v.id("people") },
  handler: async (ctx, { id }) => {
    for await (const link of ctx.db
      .query("parentLinks")
      .withIndex("by_parentId_and_childId", (q) => q.eq("parentId", id))) {
      await ctx.db.delete("parentLinks", link._id);
    }
    for await (const link of ctx.db
      .query("parentLinks")
      .withIndex("by_childId", (q) => q.eq("childId", id))) {
      await ctx.db.delete("parentLinks", link._id);
    }
    for await (const p of ctx.db
      .query("partnerships")
      .withIndex("by_personA_and_personB", (q) => q.eq("personA", id))) {
      await ctx.db.delete("partnerships", p._id);
    }
    for await (const p of ctx.db
      .query("partnerships")
      .withIndex("by_personB", (q) => q.eq("personB", id))) {
      await ctx.db.delete("partnerships", p._id);
    }
    for await (const photo of ctx.db
      .query("photos")
      .withIndex("by_personId", (q) => q.eq("personId", id))) {
      await ctx.storage.delete(photo.storageId);
      await ctx.db.delete("photos", photo._id);
    }
    for (const g of await ctx.db.query("gatherings").take(500)) {
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

async function requirePerson(ctx: MutationCtx, id: Id<"people">) {
  const person = await ctx.db.get("people", id);
  if (!person) throw new ConvexError("That person no longer exists.");
  return person;
}

/** True when `ancestorId` is `personId` or one of its ancestors. */
async function isAncestor(
  ctx: MutationCtx,
  ancestorId: Id<"people">,
  personId: Id<"people">,
) {
  const seen = new Set<Id<"people">>();
  const stack: Id<"people">[] = [personId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === ancestorId) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    const links = await ctx.db
      .query("parentLinks")
      .withIndex("by_childId", (q) => q.eq("childId", current))
      .take(2);
    for (const link of links) stack.push(link.parentId);
  }
  return false;
}

export const addParent = mutation({
  args: { childId: v.id("people"), parentId: v.id("people") },
  handler: async (ctx, { childId, parentId }) => {
    if (childId === parentId) {
      throw new ConvexError("A person can't be their own parent.");
    }
    await requirePerson(ctx, childId);
    await requirePerson(ctx, parentId);

    const existing = await ctx.db
      .query("parentLinks")
      .withIndex("by_childId", (q) => q.eq("childId", childId))
      .take(3);
    if (existing.some((l) => l.parentId === parentId)) return null;
    if (existing.length >= 2) {
      throw new ConvexError("This person already has two parents.");
    }
    // Would the child become their own ancestor?
    if (await isAncestor(ctx, childId, parentId)) {
      throw new ConvexError(
        "That would make someone their own ancestor.",
      );
    }
    await ctx.db.insert("parentLinks", { parentId, childId });
    return null;
  },
});

export const removeParent = mutation({
  args: { childId: v.id("people"), parentId: v.id("people") },
  handler: async (ctx, { childId, parentId }) => {
    const link = await ctx.db
      .query("parentLinks")
      .withIndex("by_parentId_and_childId", (q) =>
        q.eq("parentId", parentId).eq("childId", childId),
      )
      .unique();
    if (link) await ctx.db.delete("parentLinks", link._id);
    return null;
  },
});

function orderPair(a: Id<"people">, b: Id<"people">) {
  return a < b ? { personA: a, personB: b } : { personA: b, personB: a };
}

export const addPartner = mutation({
  args: { personId: v.id("people"), partnerId: v.id("people") },
  handler: async (ctx, { personId, partnerId }) => {
    if (personId === partnerId) {
      throw new ConvexError("A person can't partner with themselves.");
    }
    await requirePerson(ctx, personId);
    await requirePerson(ctx, partnerId);
    const pair = orderPair(personId, partnerId);
    const existing = await ctx.db
      .query("partnerships")
      .withIndex("by_personA_and_personB", (q) =>
        q.eq("personA", pair.personA).eq("personB", pair.personB),
      )
      .unique();
    if (!existing) await ctx.db.insert("partnerships", pair);
    return null;
  },
});

export const removePartner = mutation({
  args: { personId: v.id("people"), partnerId: v.id("people") },
  handler: async (ctx, { personId, partnerId }) => {
    const pair = orderPair(personId, partnerId);
    const existing = await ctx.db
      .query("partnerships")
      .withIndex("by_personA_and_personB", (q) =>
        q.eq("personA", pair.personA).eq("personB", pair.personB),
      )
      .unique();
    if (existing) await ctx.db.delete("partnerships", existing._id);
    return null;
  },
});

/** Fills an empty tree with a three-generation example family. */
export const loadSampleFamily = mutation({
  args: {},
  handler: async (ctx) => {
    const any = await ctx.db.query("people").first();
    if (any) throw new ConvexError("The tree already has people in it.");

    type P = {
      firstName: string;
      lastName: string;
      gender: "female" | "male";
      birthDate?: string;
      deathDate?: string;
      birthPlace?: string;
      currentPlace?: string;
      clanName?: string;
      occupation?: string;
      notes?: string;
    };
    const add = (p: P) => ctx.db.insert("people", p);
    const link = (parentId: Id<"people">, childId: Id<"people">) =>
      ctx.db.insert("parentLinks", { parentId, childId });
    const marry = (a: Id<"people">, b: Id<"people">) =>
      ctx.db.insert("partnerships", orderPair(a, b));

    const mzwandile = await add({
      firstName: "Mzwandile", lastName: "Ntshona", gender: "male",
      birthDate: "1934-06-12", deathDate: "2008-09-03", birthPlace: "Qumbu",
      clanName: "Jola", occupation: "Farmer and herdsman",
      notes: "Kept cattle on the family land outside Qumbu for over fifty years. Known for his stories by the fire and for walking everywhere, even in his seventies.",
    });
    const nomvula = await add({
      firstName: "Nomvula", lastName: "Ntshona", gender: "female",
      birthDate: "1938-11-27", birthPlace: "Tsolo", currentPlace: "Qumbu",
      clanName: "Mpondomise", occupation: "Beadworker",
      notes: "A celebrated beadworker. Many of the family's ceremonial collars and headpieces were made by her hand.",
    });
    const lwazi = await add({
      firstName: "Lwazi", lastName: "Sondlo", gender: "male",
      birthDate: "1940-02-18", deathDate: "2015-07-21", birthPlace: "Engcobo",
      clanName: "Tshawe", occupation: "Teacher and school principal",
      notes: "Taught at the village school for 38 years and later became its principal.",
    });
    const thandeka = await add({
      firstName: "Thandeka", lastName: "Sondlo", gender: "female",
      birthDate: "1944-12-05", birthPlace: "Mthatha", currentPlace: "Engcobo",
      clanName: "Dlamini", occupation: "Seamstress",
    });
    await marry(mzwandile, nomvula);
    await marry(lwazi, thandeka);

    const luthando = await add({
      firstName: "Luthando", lastName: "Ntshona", gender: "male",
      birthDate: "1964-03-30", birthPlace: "Qumbu", currentPlace: "Cape Town",
      clanName: "Jola", occupation: "Civil engineer",
      notes: "First in the family to go to university. Moved to Cape Town in 1989.",
    });
    const nosipho = await add({
      firstName: "Nosipho", lastName: "Ntshona", gender: "female",
      birthDate: "1968-08-14", birthPlace: "Qumbu", currentPlace: "Mthatha",
      clanName: "Jola", occupation: "Nurse",
    });
    const ayanda = await add({
      firstName: "Ayanda", lastName: "Ntshona", gender: "female",
      birthDate: "1967-12-09", birthPlace: "Engcobo", currentPlace: "Cape Town",
      clanName: "Tshawe", occupation: "High school teacher",
      notes: "Born Ayanda Sondlo; took the Ntshona name on marrying Luthando. Followed her father into teaching.",
    });
    const siyabonga = await add({
      firstName: "Siyabonga", lastName: "Sondlo", gender: "male",
      birthDate: "1971-05-02", birthPlace: "Mthatha", currentPlace: "Gqeberha",
      clanName: "Tshawe", occupation: "Musician",
    });
    for (const c of [luthando, nosipho]) {
      await link(mzwandile, c);
      await link(nomvula, c);
    }
    for (const c of [ayanda, siyabonga]) {
      await link(lwazi, c);
      await link(thandeka, c);
    }
    await marry(luthando, ayanda);

    const lindiwe = await add({
      firstName: "Lindiwe", lastName: "Ntshona", gender: "female",
      birthDate: "1993-01-22", birthPlace: "Cape Town", currentPlace: "Johannesburg",
      clanName: "Jola", occupation: "Software engineer",
    });
    const anele = await add({
      firstName: "Anele", lastName: "Ntshona", gender: "male",
      birthDate: "1997-12-01", birthPlace: "Cape Town", currentPlace: "East London",
      clanName: "Jola", occupation: "Architecture student",
    });
    const zintle = await add({
      firstName: "Zintle", lastName: "Sondlo", gender: "female",
      birthDate: "2002-04-17", birthPlace: "Gqeberha", currentPlace: "Makhanda",
      clanName: "Tshawe", occupation: "University student",
    });
    for (const c of [lindiwe, anele]) {
      await link(luthando, c);
      await link(ayanda, c);
    }
    await link(siyabonga, zintle);
    return null;
  },
});

// ---------- Photos ----------

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
});

export const setProfilePhoto = mutation({
  args: { personId: v.id("people"), storageId: v.union(v.id("_storage"), v.null()) },
  handler: async (ctx, { personId, storageId }) => {
    const person = await requirePerson(ctx, personId);
    if (person.photoId && person.photoId !== storageId) {
      // Keep the old portrait if it also lives in the gallery.
      const inGallery = await ctx.db
        .query("photos")
        .withIndex("by_personId", (q) => q.eq("personId", personId))
        .take(500);
      if (!inGallery.some((ph) => ph.storageId === person.photoId)) {
        await ctx.storage.delete(person.photoId);
      }
    }
    await ctx.db.patch("people", personId, { photoId: storageId ?? undefined });
    return null;
  },
});

export const listPhotos = query({
  args: { personId: v.id("people") },
  handler: async (ctx, { personId }) => {
    const photos = await ctx.db
      .query("photos")
      .withIndex("by_personId", (q) => q.eq("personId", personId))
      .order("desc")
      .take(200);
    return await Promise.all(
      photos.map(async (ph) => ({ ...ph, url: await ctx.storage.getUrl(ph.storageId) })),
    );
  },
});

export const addPhoto = mutation({
  args: {
    personId: v.id("people"),
    storageId: v.id("_storage"),
    caption: v.optional(v.string()),
  },
  handler: async (ctx, { personId, storageId, caption }) => {
    await requirePerson(ctx, personId);
    const trimmed = caption?.trim();
    return await ctx.db.insert("photos", {
      personId,
      storageId,
      caption: trimmed ? trimmed : undefined,
    });
  },
});

export const deletePhoto = mutation({
  args: { photoId: v.id("photos") },
  handler: async (ctx, { photoId }) => {
    const photo = await ctx.db.get("photos", photoId);
    if (!photo) return null;
    const person = await ctx.db.get("people", photo.personId);
    // Don't delete the file if it is still the profile portrait.
    if (person?.photoId !== photo.storageId) await ctx.storage.delete(photo.storageId);
    await ctx.db.delete("photos", photoId);
    return null;
  },
});

/** Dev helper (not callable from the app): empties the whole tree and the
 *  family settings. Run with
 *  `npx convex run family:clearAll`. */
export const clearAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    for await (const ph of ctx.db.query("gatheringPhotos")) {
      await ctx.storage.delete(ph.storageId);
      await ctx.db.delete("gatheringPhotos", ph._id);
    }
    for await (const g of ctx.db.query("gatherings")) await ctx.db.delete("gatherings", g._id);
    for await (const row of ctx.db.query("settings")) await ctx.db.delete("settings", row._id);
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
