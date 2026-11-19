import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v, type Infer } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalQuery, type MutationCtx, type QueryCtx } from "./_generated/server";

/**
 * Who may touch what:
 * - the sample family: anyone signed in (so it can be shown to visitors);
 * - a real family: only signed-in people who joined it with its family code.
 *
 * A "space" is the tree a request works in: the sample, or one family.
 */
export const vSpace = v.union(
  v.object({ sample: v.literal(true) }),
  v.object({ sample: v.literal(false), familyId: v.id("families") }),
);
export type Space = Infer<typeof vSpace>;

/** Rows that belong to a space: people and gatherings. */
type Scoped = { sample?: boolean; familyId?: Id<"families"> };

export function inSpace(doc: Scoped, space: Space): boolean {
  return space.sample ? !!doc.sample : !doc.sample && doc.familyId === space.familyId;
}

/** The fields that put a new row in a space. */
export function spaceFields(space: Space): Scoped {
  return space.sample ? { sample: true } : { familyId: space.familyId };
}

/** The space the caller may use, or null when they may not. */
export async function canAccess(ctx: QueryCtx | MutationCtx, sample: boolean): Promise<Space | null> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  if (sample) return { sample: true };
  const user = await ctx.db.get("users", userId);
  return user?.familyId ? { sample: false, familyId: user.familyId } : null;
}

async function refuse(ctx: QueryCtx | MutationCtx): Promise<never> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("Please sign in first.");
  const user = await ctx.db.get("users", userId);
  throw new ConvexError(
    user?.familyId ? "That isn't part of your family's tree." : "Join or start a family to change the family archive.",
  );
}

/** For writes: the caller's space, or an error the app can show. */
export async function requireAccess(ctx: QueryCtx | MutationCtx, sample: boolean): Promise<Space> {
  return (await canAccess(ctx, sample)) ?? (await refuse(ctx));
}

/** The caller's space when the row is in it. A missing row checks against the
 *  caller's own family, so the caller reports that it no longer exists. */
async function accessTo(ctx: QueryCtx | MutationCtx, doc: Scoped | null): Promise<Space | null> {
  const space = await canAccess(ctx, !!doc?.sample);
  if (!space || !doc) return space;
  return inSpace(doc, space) ? space : null;
}

export async function canAccessPerson(ctx: QueryCtx | MutationCtx, id: Id<"people">) {
  return await accessTo(ctx, await ctx.db.get("people", id));
}

export async function requirePersonAccess(ctx: QueryCtx | MutationCtx, id: Id<"people">): Promise<Space> {
  return (await canAccessPerson(ctx, id)) ?? (await refuse(ctx));
}

export async function canAccessGathering(ctx: QueryCtx | MutationCtx, id: Id<"gatherings">) {
  return await accessTo(ctx, await ctx.db.get("gatherings", id));
}

export async function requireGatheringAccess(ctx: QueryCtx | MutationCtx, id: Id<"gatherings">): Promise<Space> {
  return (await canAccessGathering(ctx, id)) ?? (await refuse(ctx));
}

/** For actions, which can't read the database directly. */
export const check = internalQuery({
  args: { sample: v.boolean() },
  returns: v.union(vSpace, v.null()),
  handler: async (ctx, { sample }) => await canAccess(ctx, sample),
});
