import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

/** Rules shared by the functions that change people and how they're related. */

/** Trims strings and drops optional fields left blank (names are always kept). */
export function cleanFields<T extends Record<string, unknown>>(fields: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed !== "" || key === "firstName" || key === "lastName") out[key] = trimmed;
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out as T;
}

export function requireFirstName(firstName: string) {
  if (firstName.trim() === "") throw new ConvexError("A first name is required.");
}

export async function requirePerson(ctx: MutationCtx, id: Id<"people">) {
  const person = await ctx.db.get("people", id);
  if (!person) throw new ConvexError("That person no longer exists.");
  return person;
}

/** Whether two people are in the same tree (missing people count as not). */
export async function sameTree(ctx: MutationCtx, a: Id<"people">, b: Id<"people">) {
  const [x, y] = await Promise.all([ctx.db.get("people", a), ctx.db.get("people", b)]);
  return !!x && !!y && !!x.sample === !!y.sample && x.familyId === y.familyId;
}

/** A partnership is stored once, with the lower id as personA. */
export function orderPair(a: Id<"people">, b: Id<"people">) {
  return a < b ? { personA: a, personB: b } : { personA: b, personB: a };
}

/** True when `ancestorId` is `personId` or one of their ancestors. */
export async function isAncestor(ctx: MutationCtx, ancestorId: Id<"people">, personId: Id<"people">) {
  const seen = new Set<Id<"people">>();
  const stack: Id<"people">[] = [personId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === ancestorId) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    const links = await ctx.db
      .query("parentLinks")
      .withIndex("by_childId", (q) => q.eq("childId", current))
      .take(2);
    for (const link of links) stack.push(link.parentId);
  }
  return false;
}
