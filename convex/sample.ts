import { mutation } from "./_generated/server";
import { insertSampleFamily, repairSampleFamily } from "./lib/sampleFamily";
import { peopleIn } from "./lib/tree";

/**
 * Make sure the sample family exists. Anyone may call this, visitors too: it
 * is the same made-up family for everyone, and once it exists it only repairs
 * older copies (see lib/sampleFamily.ts).
 */
export const loadSampleFamily = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await peopleIn(ctx, { sample: true });
    if (existing.length > 0) await repairSampleFamily(ctx, existing);
    else await insertSampleFamily(ctx);
    return null;
  },
});
