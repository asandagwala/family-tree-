import { getAuthUserId } from "@convex-dev/auth/server";
import { vGoogleProfile } from "@convex-dev/auth/methods/google/server";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { vSpace, writableSpace } from "./lib/access";

/**
 * Accounts. Signing in itself is handled by Convex Auth (see auth.ts); these
 * are the app's own records of who is signed in and which family they joined.
 */

// ---------- Called by Convex Auth when someone signs in for the first time ----------

/** New accounts start outside any family until they join or start one. */
export const createUserGoogle = internalMutation({
  args: { method: v.object({ name: v.literal("google"), profile: vGoogleProfile }) },
  returns: v.id("users"),
  handler: async (ctx, { method: { profile } }) => {
    return await ctx.db.insert("users", { name: profile.name, email: profile.email });
  },
});

export const createUserEmail = internalMutation({
  args: { method: v.object({ name: v.literal("emailPassword"), profile: v.object({}) }) },
  returns: v.id("users"),
  handler: async (ctx) => {
    return await ctx.db.insert("users", {});
  },
});

// ---------- For the app ----------

/** Who is signed in, whether they have joined a family, and what to call them. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { signedIn: false as const };
    const user = await ctx.db.get("users", userId);
    const email = user?.email ?? (await ctx.runQuery(components.authEmail.verifiedEmails.getPrimaryEmail, { userId }));
    // Greet by first name when Google gave one, otherwise by email address.
    const firstName = user?.name?.split(" ")[0];
    return { signedIn: true as const, member: !!user?.familyId, name: firstName ?? email ?? null };
  },
});

// ---------- For actions, which can't read the database themselves ----------

/** The signed-in user's id, or null. */
export const currentUserId = internalQuery({
  args: {},
  returns: v.union(v.id("users"), v.null()),
  handler: async (ctx) => await getAuthUserId(ctx),
});

/**
 * The space a signed-in caller may use, or null. Used by the assistant, which
 * needs an account even for the sample, since every question costs a Gemini call.
 */
export const currentSpace = internalQuery({
  args: { sample: v.boolean() },
  returns: v.union(vSpace, v.null()),
  handler: async (ctx, { sample }) => await writableSpace(ctx, sample),
});
