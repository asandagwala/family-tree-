import type { QueryCtx } from "../_generated/server";
import { inSpace, type Space } from "./access";

/**
 * Reading a whole family tree. A tree is shown as a whole, so it is loaded at
 * once, capped so a runaway table can't blow the query limits.
 */
export const MAX_PEOPLE = 2000;

/** Everyone in a space: one family's people, or the sample family. */
export async function peopleIn(ctx: QueryCtx, space: Space) {
  const rows = await ctx.db
    .query("people")
    .withIndex("by_familyId", (q) => q.eq("familyId", space.sample ? undefined : space.familyId))
    .take(MAX_PEOPLE);
  return rows.filter((p) => inSpace(p, space));
}

/** A space's gatherings (album events), up to `limit`. */
export async function gatheringsIn(ctx: QueryCtx, space: Space, limit: number) {
  const rows = await ctx.db
    .query("gatherings")
    .withIndex("by_familyId", (q) => q.eq("familyId", space.sample ? undefined : space.familyId))
    .take(limit);
  return rows.filter((g) => inSpace(g, space));
}

/** A space's people with the parent links and partnerships between them. */
export async function loadTree(ctx: QueryCtx, space: Space) {
  const people = await peopleIn(ctx, space);
  const ids = new Set<string>(people.map((p) => p._id));
  // Each link is found from its child (parent links) or its lower id (partnerships),
  // so every link is read exactly once.
  const [links, pairs] = await Promise.all([
    Promise.all(
      people.map((p) => ctx.db.query("parentLinks").withIndex("by_childId", (q) => q.eq("childId", p._id)).take(2)),
    ),
    Promise.all(
      people.map((p) =>
        ctx.db
          .query("partnerships")
          .withIndex("by_personA_and_personB", (q) => q.eq("personA", p._id))
          .take(20),
      ),
    ),
  ]);
  return {
    people,
    parentLinks: links.flat().filter((l) => ids.has(l.parentId)),
    partnerships: pairs.flat().filter((p) => ids.has(p.personB)),
  };
}
