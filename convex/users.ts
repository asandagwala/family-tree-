import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { components } from "./_generated/api";
import { env, internalMutation, mutation, query } from "./_generated/server";

export const createUser = internalMutation({
  args: {
    method: v.object({ name: v.literal("usernamePasskey"), profile: v.object({}) }),
  },
  returns: v.id("users"),
  handler: async (ctx) => {
    // New accounts start outside the family until they enter the family code.
    return await ctx.db.insert("users", { member: false });
  },
});

/** Who is signed in, and whether they have joined the family. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { signedIn: false as const };
    const user = await ctx.db.get("users", userId);
    const username = await ctx.runQuery(components.authUsername.public.getUsername, { userId });
    return { signedIn: true as const, member: !!user?.member, username: username ?? null };
  },
});

/** Compare without revealing, through timing, how much of the code was right. */
function sameCode(a: string, b: string) {
  const x = a.trim().toLowerCase();
  const y = b.trim().toLowerCase();
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    diff |= (x.charCodeAt(i) || 0) ^ (y.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/** Join the family by entering the family code. */
export const joinFamily = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Please sign in first.");
    const expected = env.FAMILY_CODE;
    if (!expected) {
      throw new ConvexError("The family code hasn't been set up yet. Ask whoever manages the archive.");
    }
    if (!sameCode(code, expected)) throw new ConvexError("That code isn't right. Check it and try again.");
    await ctx.db.patch("users", userId, { member: true });
    return null;
  },
});
