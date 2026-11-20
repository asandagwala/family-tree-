import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { canAccessPerson, requireAccess, requirePersonAccess } from "./lib/access";
import { requirePerson } from "./lib/people";
import { checkLength, limitOrThrow, MAX_LENGTH, requireImage } from "./lib/security";

/**
 * A person's portrait and their photo gallery. (Album photos of gatherings
 * live in album.ts.) Uploading is two steps: the app asks for an upload URL,
 * sends the file there, then saves the returned storage id with one of these
 * functions, which checks it really is a photo.
 */

/** A one-time URL to upload one file to. Saving it afterwards checks which tree it belongs to. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAccess(ctx, true); // any signed-in person may upload
    const userId = await getAuthUserId(ctx);
    await limitOrThrow(ctx, "upload", userId!, "uploads");
    return await ctx.storage.generateUploadUrl();
  },
});

/** Set (or with null, remove) a person's portrait. */
export const setProfilePhoto = mutation({
  args: { personId: v.id("people"), storageId: v.union(v.id("_storage"), v.null()) },
  handler: async (ctx, { personId, storageId }) => {
    await requirePersonAccess(ctx, personId);
    const person = await requirePerson(ctx, personId);
    if (storageId) await requireImage(ctx, storageId);
    if (person.photoId && person.photoId !== storageId) {
      // Keep the old portrait if it also lives in the gallery.
      const inGallery = await ctx.db
        .query("photos")
        .withIndex("by_personId", (q) => q.eq("personId", personId))
        .take(500);
      if (!inGallery.some((ph) => ph.storageId === person.photoId)) await ctx.storage.delete(person.photoId);
    }
    await ctx.db.patch("people", personId, { photoId: storageId ?? undefined });
    return null;
  },
});

/** A person's gallery, newest first, with URLs to show each photo. */
export const listPhotos = query({
  args: { personId: v.id("people") },
  handler: async (ctx, { personId }) => {
    if (!(await canAccessPerson(ctx, personId))) return [];
    const photos = await ctx.db
      .query("photos")
      .withIndex("by_personId", (q) => q.eq("personId", personId))
      .order("desc")
      .take(200);
    return await Promise.all(photos.map(async (ph) => ({ ...ph, url: await ctx.storage.getUrl(ph.storageId) })));
  },
});

export const addPhoto = mutation({
  args: { personId: v.id("people"), storageId: v.id("_storage"), caption: v.optional(v.string()) },
  handler: async (ctx, { personId, storageId, caption }) => {
    await requirePersonAccess(ctx, personId);
    await requirePerson(ctx, personId);
    await requireImage(ctx, storageId);
    const trimmed = caption?.trim();
    checkLength(trimmed, MAX_LENGTH.caption, "caption");
    return await ctx.db.insert("photos", { personId, storageId, caption: trimmed || undefined });
  },
});

export const deletePhoto = mutation({
  args: { photoId: v.id("photos") },
  handler: async (ctx, { photoId }) => {
    const photo = await ctx.db.get("photos", photoId);
    if (!photo) return null;
    await requirePersonAccess(ctx, photo.personId);
    const person = await ctx.db.get("people", photo.personId);
    // Don't delete the file if it is still the profile portrait.
    if (person?.photoId !== photo.storageId) await ctx.storage.delete(photo.storageId);
    await ctx.db.delete("photos", photoId);
    return null;
  },
});
