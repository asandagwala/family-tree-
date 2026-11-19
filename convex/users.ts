import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { vGoogleProfile } from "@convex-dev/auth/methods/google/server";
import { components } from "./_generated/api";
import { env, internalMutation, mutation, query } from "./_generated/server";

// New accounts start outside the family until they enter the family code.
export const createUserGoogle = internalMutation({
  args: { method: v.object({ name: v.literal("google"), profile: vGoogleProfile }) },
  returns: v.id("users"),
  handler: async (ctx, { method: { profile } }) => {
    return await ctx.db.insert("users", { member: false, name: profile.name, email: profile.email });
  },
});

export const createUserEmail = internalMutation({
  args: { method: v.object({ name: v.literal("emailPassword"), profile: v.object({}) }) },
  returns: v.id("users"),
  handler: async (ctx) => {
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
    const email = user?.email ?? (await ctx.runQuery(components.authEmail.verifiedEmails.getPrimaryEmail, { userId }));
    // Greet by first name when Google gave one, otherwise by email address.
    const firstName = user?.name?.split(" ")[0];
    return { signedIn: true as const, member: !!user?.member, name: firstName ?? email ?? null };
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
