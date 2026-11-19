import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { internalQuery, type MutationCtx, type QueryCtx } from "./_generated/server";

/**
 * Who may touch what:
 * - the sample family: anyone signed in (so it can be shown to visitors);
 * - the real family: only signed-in members who entered the family code.
 */
export async function canAccess(ctx: QueryCtx | MutationCtx, sample: boolean): Promise<boolean> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return false;
  if (sample) return true;
  const user = await ctx.db.get("users", userId);
  return !!user?.member;
}

/** For writes: refuse with a message the app can show. */
export async function requireAccess(ctx: QueryCtx | MutationCtx, sample: boolean) {
  if (await canAccess(ctx, sample)) return;
  const signedIn = !!(await getAuthUserId(ctx));
  throw new ConvexError(
    signedIn ? "Enter the family code to change the family archive." : "Please sign in first.",
  );
}

/** For actions, which can't read the database directly. */
export const check = internalQuery({
  args: { sample: v.boolean() },
  handler: async (ctx, { sample }) => await canAccess(ctx, sample),
});

/** Whether a person belongs to the sample family (unknown people count as real). */
export async function personIsSample(ctx: QueryCtx | MutationCtx, id: Id<"people">) {
  return !!(await ctx.db.get("people", id))?.sample;
}

/** Whether a gathering belongs to the sample family (unknown ones count as real). */
export async function gatheringIsSample(ctx: QueryCtx | MutationCtx, id: Id<"gatherings">) {
  return !!(await ctx.db.get("gatherings", id))?.sample;
}
