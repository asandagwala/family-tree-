import { internalMutation } from "./_generated/server";
import { newFamilyCode } from "./lib/familyCodes";

/**
 * One-off data migrations, run by hand from the CLI when a deployment's data
 * needs to move to a new shape. Internal: the app can't call them.
 */

/**
 * One-off (internal): before families, a deployment held one family. This
 * puts that family's people, gatherings, details and members into a family
 * row, and returns its new family code. Run once per deployment with
 * `npx convex run migrations:intoFamilies` (add `--prod` for the live site).
 */
export const intoFamilies = internalMutation({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("settings").first();
    const people = [];
    for await (const p of ctx.db.query("people")) if (!p.sample && !p.familyId) people.push(p);
    const gatherings = [];
    for await (const g of ctx.db.query("gatherings")) if (!g.sample && !g.familyId) gatherings.push(g);
    const members = [];
    for await (const u of ctx.db.query("users")) if (u.member !== undefined) members.push(u);
    if (!settings && people.length === 0 && gatherings.length === 0 && members.length === 0) {
      return { moved: false as const };
    }

    // Name the family as it was set, or after its most common surname.
    const counts = new Map<string, number>();
    for (const p of people) if (p.lastName) counts.set(p.lastName, (counts.get(p.lastName) ?? 0) + 1);
    const commonest = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const name = settings?.familyName ?? commonest ?? "Family";

    const familyId = await ctx.db.insert("families", {
      name,
      code: await newFamilyCode(ctx, name),
      clanName: settings?.clanName,
      clanPraise: settings?.clanPraise,
      whatsappGroupUrl: settings?.whatsappGroupUrl,
    });
    for (const p of people) await ctx.db.patch("people", p._id, { familyId });
    for (const g of gatherings) await ctx.db.patch("gatherings", g._id, { familyId });
    for (const u of members) {
      await ctx.db.patch("users", u._id, { member: undefined, ...(u.member ? { familyId } : {}) });
    }
    for await (const row of ctx.db.query("settings")) await ctx.db.delete("settings", row._id);

    const family = await ctx.db.get("families", familyId);
    return {
      moved: true as const,
      family: name,
      code: family?.code,
      people: people.length,
      gatherings: gatherings.length,
      members: members.filter((u) => u.member).length,
    };
  },
});

/** One-off (internal): marks everyone currently in the tree as the sample
 *  family, for deployments where the sample was loaded into the real tree. */
export const moveAllToSample = internalMutation({
  args: {},
  handler: async (ctx) => {
    let people = 0;
    for await (const p of ctx.db.query("people")) {
      if (!p.sample) {
        await ctx.db.patch("people", p._id, { sample: true });
        people++;
      }
    }
    let gatherings = 0;
    for await (const g of ctx.db.query("gatherings")) {
      if (!g.sample) {
        await ctx.db.patch("gatherings", g._id, { sample: true });
        gatherings++;
      }
    }
    return { people, gatherings };
  },
});
