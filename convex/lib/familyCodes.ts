import type { MutationCtx } from "../_generated/server";

/**
 * Family codes: what a relative types to join a family's tree, e.g.
 * RUBULUZA-7KQ4MX2P. The family name makes it recognisable; the random part
 * makes it impossible to guess.
 */

// No 0/O, 1/I/L: easy to read out over the phone.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 8; // 31^8 ≈ 850 billion codes

/** Upper case, without spaces, so "rubuluza-7kq4 mx2p" finds RUBULUZA-7KQ4MX2P. */
export function normalizeCode(code: string) {
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
