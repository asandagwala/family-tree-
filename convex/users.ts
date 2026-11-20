import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { vGoogleProfile } from "@convex-dev/auth/methods/google/server";
import { components } from "./_generated/api";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import { checkLength, limitOrThrow, MAX_LENGTH, rateLimiter, waitText } from "./security";

// New accounts start outside any family until they join or start one.
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

/** Who is signed in, and which family they belong to. */
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

// No 0/O, 1/I/L: easy to read out over the phone.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 8; // 31^8 codes: far too many to guess

/** Upper case, without spaces, so "rubuluza-7kq4 mx2p" finds RUBULUZA-7KQ4MX2P. */
function normalizeCode(code: string) {
  return code.toUpperCase().replace(/\s+/g, "");
}

function randomPart() {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

/** A new, unused family code that starts with the family name. */
export async function newFamilyCode(ctx: MutationCtx, familyName: string) {
  const prefix =
    familyName
      .normalize("NFKD")
      .replace(/[^A-Za-z]/g, "")
      .toUpperCase()
      .slice(0, 12) || "FAMILY";
  for (;;) {
    const code = `${prefix}-${randomPart()}`;
    const taken = await ctx.db
      .query("families")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();
    if (!taken) return code;
  }
}

async function requireUser(ctx: MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new ConvexError("Please sign in first.");
  return userId;
}

/** Join an existing family's tree with its family code. */
export const joinFamily = mutation({
  args: { code: v.string() },
  // A wrong code is returned rather than thrown: a thrown error would also undo
  // the rate limiter's count, letting someone guess codes without limit.
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
    if (!family) return { ok: false as const, error: "We couldn't find a family with that code. Check it and try again." };
    await ctx.db.patch("users", userId, { familyId: family._id });
    return { ok: true as const };
  },
});

/** Start a new family tree; the caller gets its family code to share. */
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
