import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { gatheringKind } from "./schema";
import {
  canAccess,
  canAccessGathering,
  canAccessPerson,
  inSpace,
  requireAccess,
  requireGatheringAccess,
  spaceArg,
  spaceFields,
  type Space,
} from "./lib/access";
import { checkLength, MAX_LENGTH, requireImage } from "./lib/security";
import { gatheringsIn } from "./lib/tree";

/**
 * The family album: gatherings (weddings, umemulo, funerals, reunions...) with
 * their photos and who was there.
 */

const MAX_GATHERINGS = 500;
const MAX_PHOTOS_PER_GATHERING = 1000;
const MAX_PEOPLE_PER_GATHERING = 300;
const PREVIEW_PHOTOS = 4;

const gatheringFields = {
  title: v.string(),
  kind: gatheringKind,
  date: v.optional(v.string()),
  place: v.optional(v.string()),
  story: v.optional(v.string()),
  peopleIds: v.array(v.id("people")),
};

function clean(fields: {
  title: string;
  kind: Doc<"gatherings">["kind"];
  date?: string;
  place?: string;
  story?: string;
  peopleIds: Id<"people">[];
}) {
  const title = fields.title.trim();
  if (!title) throw new ConvexError("Give the gathering a name.");
  checkLength(title, MAX_LENGTH.title, "gathering's name");
  checkLength(fields.date?.trim(), MAX_LENGTH.date, "date");
  checkLength(fields.place?.trim(), MAX_LENGTH.place, "place");
  checkLength(fields.story?.trim(), MAX_LENGTH.story, "story");
  const opt = (s?: string) => (s && s.trim() ? s.trim() : undefined);
  const peopleIds = [...new Set(fields.peopleIds)];
  if (peopleIds.length > MAX_PEOPLE_PER_GATHERING) {
    throw new ConvexError(`A gathering can list up to ${MAX_PEOPLE_PER_GATHERING} people.`);
  }
  return {
    title,
    kind: fields.kind,
    date: opt(fields.date),
    place: opt(fields.place),
    story: opt(fields.story),
    peopleIds,
  };
}

/** Everyone tagged in a gathering must be in the same tree as the gathering. */
async function requirePeopleIn(ctx: MutationCtx, space: Space, peopleIds: Id<"people">[]) {
  for (const id of peopleIds) {
    const person = await ctx.db.get("people", id);
    if (!person || !inSpace(person, space)) {
      throw new ConvexError("Only people from this family's tree can be tagged.");
    }
  }
}

async function photosOf(ctx: QueryCtx, gatheringId: Id<"gatherings">, limit: number) {
  return await ctx.db
    .query("gatheringPhotos")
    .withIndex("by_gatheringId", (q) => q.eq("gatheringId", gatheringId))
    .order("desc")
    .take(limit);
}

/** All gatherings, newest first, each with a cover and a few preview photos. */
export const listGatherings = query({
  args: spaceArg,
  handler: async (ctx, { sample }) => {
    const space = await canAccess(ctx, !!sample);
    if (!space) return [];
    const gatherings = await gatheringsIn(ctx, space, MAX_GATHERINGS);
    const rows = await Promise.all(
      gatherings.map(async (g) => {
        const photos = await photosOf(ctx, g._id, MAX_PHOTOS_PER_GATHERING);
        const coverStorage = g.coverId ?? photos[0]?.storageId;
        const previews = await Promise.all(
          photos.slice(0, PREVIEW_PHOTOS).map((p) => ctx.storage.getUrl(p.storageId)),
        );
        return {
          ...g,
          photoCount: photos.length,
          coverUrl: coverStorage ? await ctx.storage.getUrl(coverStorage) : null,
          previewUrls: previews.filter((u): u is string => !!u),
        };
      }),
    );
    // Newest first; undated gatherings last.
    return rows.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || b._creationTime - a._creationTime);
  },
});

export const getGathering = query({
  args: { id: v.id("gatherings") },
  handler: async (ctx, { id }) => {
    if (!(await canAccessGathering(ctx, id))) return null;
    const g = await ctx.db.get("gatherings", id);
    if (!g) return null;
    const photos = await photosOf(ctx, id, MAX_PHOTOS_PER_GATHERING);
    return {
      ...g,
      coverUrl: g.coverId ? await ctx.storage.getUrl(g.coverId) : null,
      photos: await Promise.all(photos.map(async (p) => ({ ...p, url: await ctx.storage.getUrl(p.storageId) }))),
    };
  },
});

/** Gatherings a person was at, newest first. */
export const gatheringsFor = query({
  args: { personId: v.id("people") },
  handler: async (ctx, { personId }) => {
    const space = await canAccessPerson(ctx, personId);
    if (!space) return [];
    const all = await gatheringsIn(ctx, space, MAX_GATHERINGS);
    const mine = all.filter((g) => g.peopleIds.includes(personId));
    return mine.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")).map((g) => ({
      _id: g._id,
      title: g.title,
      kind: g.kind,
      date: g.date,
      place: g.place,
    }));
  },
});

export const createGathering = mutation({
  args: { ...gatheringFields, ...spaceArg },
  handler: async (ctx, { sample, ...args }) => {
    const space = await requireAccess(ctx, !!sample);
    const fields = clean(args);
    await requirePeopleIn(ctx, space, fields.peopleIds);
    return await ctx.db.insert("gatherings", { ...fields, ...spaceFields(space) });
  },
});

export const updateGathering = mutation({
  args: { id: v.id("gatherings"), ...gatheringFields },
  handler: async (ctx, { id, ...rest }) => {
    const space = await requireGatheringAccess(ctx, id);
    await requireGathering(ctx, id);
    const fields = clean(rest);
    await requirePeopleIn(ctx, space, fields.peopleIds);
    // Patch with every field so cleared ones are removed; the cover stays.
    await ctx.db.patch("gatherings", id, {
      title: fields.title,
      kind: fields.kind,
      date: fields.date,
      place: fields.place,
      story: fields.story,
      peopleIds: fields.peopleIds,
    });
    return null;
  },
});

export const deleteGathering = mutation({
  args: { id: v.id("gatherings") },
  handler: async (ctx, { id }) => {
    await requireGatheringAccess(ctx, id);
    for await (const photo of ctx.db
      .query("gatheringPhotos")
      .withIndex("by_gatheringId", (q) => q.eq("gatheringId", id))) {
      await ctx.storage.delete(photo.storageId);
      await ctx.db.delete("gatheringPhotos", photo._id);
    }
    await ctx.db.delete("gatherings", id);
    return null;
  },
});

export const addGatheringPhoto = mutation({
  args: { gatheringId: v.id("gatherings"), storageId: v.id("_storage"), caption: v.optional(v.string()) },
  handler: async (ctx, { gatheringId, storageId, caption }) => {
    await requireGatheringAccess(ctx, gatheringId);
    await requireGathering(ctx, gatheringId);
    await requireImage(ctx, storageId);
    const trimmed = caption?.trim();
    checkLength(trimmed, MAX_LENGTH.caption, "caption");
    return await ctx.db.insert("gatheringPhotos", { gatheringId, storageId, caption: trimmed || undefined });
  },
});

export const deleteGatheringPhoto = mutation({
  args: { photoId: v.id("gatheringPhotos") },
  handler: async (ctx, { photoId }) => {
    const owned = await ctx.db.get("gatheringPhotos", photoId);
    if (owned) await requireGatheringAccess(ctx, owned.gatheringId);
    const photo = await ctx.db.get("gatheringPhotos", photoId);
    if (!photo) return null;
    const g = await ctx.db.get("gatherings", photo.gatheringId);
    if (g?.coverId === photo.storageId) await ctx.db.patch("gatherings", g._id, { coverId: undefined });
    await ctx.storage.delete(photo.storageId);
    await ctx.db.delete("gatheringPhotos", photoId);
    return null;
  },
});

export const setGatheringCover = mutation({
  args: { gatheringId: v.id("gatherings"), storageId: v.id("_storage") },
  handler: async (ctx, { gatheringId, storageId }) => {
    await requireGatheringAccess(ctx, gatheringId);
    await requireGathering(ctx, gatheringId);
    // The cover must be one of this gathering's own photos.
    const own = await ctx.db
      .query("gatheringPhotos")
      .withIndex("by_gatheringId", (q) => q.eq("gatheringId", gatheringId))
      .take(MAX_PHOTOS_PER_GATHERING);
    if (!own.some((p) => p.storageId === storageId)) {
      throw new ConvexError("Choose the cover from this gathering's photos.");
    }
    await ctx.db.patch("gatherings", gatheringId, { coverId: storageId });
    return null;
  },
});

async function requireGathering(ctx: MutationCtx, id: Id<"gatherings">) {
  const g = await ctx.db.get("gatherings", id);
  if (!g) throw new ConvexError("That gathering no longer exists.");
  return g;
}
