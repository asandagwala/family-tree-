import { internalQuery, query } from "./_generated/server";
import { canAccess, spaceArg, vSpace } from "./lib/access";
import { gatheringsIn, loadTree } from "./lib/tree";

/** Reading a whole family tree: for the app's pages, and for the assistant. */

/** The caller's tree (or the sample): everyone, their photos' URLs, and how they're related. */
export const getTree = query({
  args: spaceArg,
  handler: async (ctx, { sample }) => {
    const space = await canAccess(ctx, !!sample);
    if (!space) return { people: [], parentLinks: [], partnerships: [] };
    const tree = await loadTree(ctx, space);
    const people = await Promise.all(
      tree.people.map(async (p) => ({
        ...p,
        photoUrl: p.photoId ? await ctx.storage.getUrl(p.photoId) : null,
      })),
    );
    return { ...tree, people };
  },
});

// Contact details (phone numbers, social handles) are never sent to the assistant.
const CONTACT_KEYS = new Set(["whatsapp", "instagram", "facebook", "tiktok", "linkedin"]);

/** The tree as the family assistant sees it: people, relationships, photo counts and the album. */
export const treeForAssistant = internalQuery({
  args: { space: vSpace },
  handler: async (ctx, { space }) => {
    const tree = await loadTree(ctx, space);
    const photoCounts: Record<string, number> = {};
    for (const p of tree.people) {
      const photos = await ctx.db
        .query("photos")
        .withIndex("by_personId", (q) => q.eq("personId", p._id))
        .take(100);
      photoCounts[p._id] = photos.length + (p.photoId ? 1 : 0);
    }
    const family = space.sample ? null : await ctx.db.get("families", space.familyId);
    const gatherings = [];
    for (const g of await gatheringsIn(ctx, space, 200)) {
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
    const people = tree.people.map(
      (p) => Object.fromEntries(Object.entries(p).filter(([k]) => !CONTACT_KEYS.has(k))) as typeof p,
    );
    return {
      ...tree,
      people,
      photoCounts,
      familyName: family?.name ?? null,
      familyClan: family?.clanName ?? null,
      familyClanPraise: family?.clanPraise ?? null,
      gatherings,
    };
  },
});
