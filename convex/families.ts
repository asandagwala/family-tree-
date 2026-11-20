import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { canAccess, requireAccess } from "./lib/access";
import { newFamilyCode, normalizeCode } from "./lib/familyCodes";
import { checkLength, limitOrThrow, MAX_LENGTH, rateLimiter, waitText } from "./lib/security";

/**
 * Families: each one is a private tree with a name, clan details, a WhatsApp
 * group and a family code. Relatives join with the code; nobody sees a
 * family they haven't joined.
 */

// ---------- Joining ----------

async function requireUser(ctx: MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("Please sign in first.");
  return userId;
}

/**
 * Join an existing family's tree with its family code.
 *
 * A wrong code is returned rather than thrown: a thrown error would also undo
 * the rate limiter's count, letting someone guess codes without limit.
 */
export const joinFamily = mutation({
  args: { code: v.string() },
  returns: v.union(v.object({ ok: v.literal(true) }), v.object({ ok: v.literal(false), error: v.string() })),
  handler: async (ctx, { code }) => {
    const userId = await requireUser(ctx);
    const { ok, retryAfter } = await rateLimiter.limit(ctx, "joinFamilyAttempt", { key: userId });
    if (!ok) {
      return { ok: false as const, error: `Too many tries. Please wait ${waitText(retryAfter ?? 0)} and try again.` };
    }
    const typed = normalizeCode(code);
    const family =
      typed.length > 0 && typed.length <= MAX_LENGTH.code
        ? await ctx.db
            .query("families")
            .withIndex("by_code", (q) => q.eq("code", typed))
            .unique()
        : null;
    if (!family)
      return { ok: false as const, error: "We couldn't find a family with that code. Check it and try again." };
    await ctx.db.patch("users", userId, { familyId: family._id });
    return { ok: true as const };
  },
});

/** Start a new family tree; the caller joins it and gets its code to share. */
export const startFamily = mutation({
  args: { familyName: v.string() },
  handler: async (ctx, { familyName }) => {
    const userId = await requireUser(ctx);
    const name = familyName.trim();
    if (!name) throw new ConvexError("Enter the family name, e.g. Rubuluza.");
    checkLength(name, MAX_LENGTH.name, "family name");
    await limitOrThrow(ctx, "startFamily", userId, "new family trees today");
    const familyId = await ctx.db.insert("families", { name, code: await newFamilyCode(ctx, name) });
    await ctx.db.patch("users", userId, { familyId });
    return null;
  },
});

// ---------- The family's details ----------

/** The caller's family: its name, clan, WhatsApp group and family code (all null when they have none). */
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const space = await canAccess(ctx, false);
    const family = space && !space.sample ? await ctx.db.get("families", space.familyId) : null;
    return {
      familyName: family?.name ?? null,
      familyCode: family?.code ?? null,
      clanName: family?.clanName ?? null,
      clanPraise: family?.clanPraise ?? null,
      whatsappGroupUrl: family?.whatsappGroupUrl ?? null,
    };
  },
});

async function requireFamily(ctx: MutationCtx) {
  const space = await requireAccess(ctx, false);
  if (space.sample) throw new ConvexError("Join or start a family first.");
  return space.familyId;
}

export const setFamilyName = mutation({
  args: { familyName: v.string() },
  handler: async (ctx, { familyName }) => {
    const familyId = await requireFamily(ctx);
    const name = familyName.trim();
    checkLength(name, MAX_LENGTH.name, "family name");
    if (!name) throw new ConvexError("Give the family a name.");
    await ctx.db.patch("families", familyId, { name });
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
    const familyId = await requireFamily(ctx);
    const patch: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(args)) {
      if (value === undefined) continue;
      const trimmed = value.trim();
      patch[key] = trimmed === "" ? undefined : trimmed;
    }
    checkLength(patch.clanName, MAX_LENGTH.name, "clan name");
    checkLength(patch.clanPraise, MAX_LENGTH.story, "izithakazelo");
    checkLength(patch.whatsappGroupUrl, MAX_LENGTH.link, "group link");
    const url = patch.whatsappGroupUrl;
    if (url && !/^https:\/\/(chat\.whatsapp\.com|wa\.me)\//.test(url)) {
      throw new ConvexError("Paste the group's invite link. It starts with https://chat.whatsapp.com/");
    }
    await ctx.db.patch("families", familyId, patch);
    return null;
  },
});
