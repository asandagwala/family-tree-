import Anthropic from "@anthropic-ai/sdk";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { action, env } from "./_generated/server";

const INSTRUCTIONS = `You are the family historian for a private family tree app. Family members ask you questions about their relatives, and you answer from the family records below.

How to answer:
- Use only the records (the family tree and the family album). If something isn't recorded, say so plainly and suggest which detail someone could add to the tree. Never invent names, dates, places or stories.
- You may reason from the records: ages, how two people are related (cousin, grand-aunt, in-law), who is the eldest, where the family comes from, gaps worth filling.
- When you mention a person, link them as a Markdown link with their id: [Nomvula Ntshona](person:ID). Link each person the first time you mention them.
- Write warmly and briefly, like a knowledgeable relative: a few sentences or a short bulleted list. No headings, no tables.
- Treat clan names (iziduko) with respect; they matter to the family.
- Ages: someone with a death date is not living; compute ages from today's date given below.`;

function describeTree(tree: {
  people: Doc<"people">[];
  parentLinks: Doc<"parentLinks">[];
  partnerships: Doc<"partnerships">[];
  photoCounts: Record<string, number>;
  familyName: string | null;
  gatherings: {
    title: string;
    kind: string;
    date: string | null;
    place: string | null;
    story: string | null;
    peopleIds: string[];
    photoCount: number;
  }[];
}) {
  const name = new Map(tree.people.map((p) => [p._id as string, `${p.firstName} ${p.lastName}`.trim()]));
  const ref = (id: string) => `${name.get(id) ?? "unknown"} (${id})`;
  const parents = new Map<string, string[]>();
  const children = new Map<string, string[]>();
  const partners = new Map<string, string[]>();
  const push = (m: Map<string, string[]>, k: string, val: string) => m.set(k, [...(m.get(k) ?? []), val]);
  for (const l of tree.parentLinks) {
    push(parents, l.childId, l.parentId);
    push(children, l.parentId, l.childId);
  }
  for (const p of tree.partnerships) {
    push(partners, p.personA, p.personB);
    push(partners, p.personB, p.personA);
  }

  if (tree.people.length === 0) {
    return tree.familyName ? `The ${tree.familyName} family tree is empty.` : "The family tree is empty.";
  }
  const lines = tree.people.map((p) => {
    const facts = [
      `gender: ${p.gender}`,
      p.birthDate && `born: ${p.birthDate}${p.birthPlace ? ` in ${p.birthPlace}` : ""}`,
      !p.birthDate && p.birthPlace && `birthplace: ${p.birthPlace}`,
      p.deathDate ? `died: ${p.deathDate}` : "no death recorded",
      p.clanName && `clan name (isiduko): ${p.clanName}`,
      p.occupation && `occupation: ${p.occupation}`,
      p.currentPlace && `lives in: ${p.currentPlace}`,
      `photos: ${tree.photoCounts[p._id] ?? 0}`,
      `parents: ${(parents.get(p._id) ?? []).map(ref).join(", ") || "none recorded"}`,
      `partners: ${(partners.get(p._id) ?? []).map(ref).join(", ") || "none recorded"}`,
      `children: ${(children.get(p._id) ?? []).map(ref).join(", ") || "none recorded"}`,
      p.notes && `story: ${p.notes.replace(/\s+/g, " ")}`,
    ].filter(Boolean);
    return `- ${ref(p._id)}\n  ${facts.join("\n  ")}`;
  });
  const heading = tree.familyName ? `The ${tree.familyName} family` : "Family";
  const album = tree.gatherings.length
    ? `\n\nFamily album (${tree.gatherings.length} gatherings):\n` +
      tree.gatherings
        .map((g) => {
          const facts = [
            `kind: ${g.kind}`,
            g.date && `date: ${g.date}`,
            g.place && `place: ${g.place}`,
            `people there: ${g.peopleIds.map(ref).join(", ") || "not recorded"}`,
            `photos: ${g.photoCount}`,
            g.story && `story: ${g.story.replace(/\s+/g, " ")}`,
          ].filter(Boolean);
          return `- ${g.title}\n  ${facts.join("\n  ")}`;
        })
        .join("\n")
    : "";
  return `${heading} records (${tree.people.length} people):\n${lines.join("\n")}${album}`;
}

export const ask = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      }),
    ),
  },
  handler: async (ctx, { messages }): Promise<{ ok: boolean; text: string }> => {
    if (!env.ANTHROPIC_API_KEY) {
      return {
        ok: false,
        text: "The family assistant isn't switched on yet. Add an Anthropic API key with `npx convex env set ANTHROPIC_API_KEY <your key>` and ask again.",
      };
    }
    const recent = messages.slice(-20);
    if (recent.length === 0 || recent[recent.length - 1].role !== "user") {
      return { ok: false, text: "Ask me something about the family." };
    }

    const tree = await ctx.runQuery(internal.family.treeForAssistant, {});
    const today = new Date().toISOString().slice(0, 10);
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

    try {
      const response = await client.beta.messages.create({
        model: "claude-opus-5-5",
        max_tokens: 16000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low" },
        cache_control: { type: "ephemeral" },
        system: [
          { type: "text", text: INSTRUCTIONS },
          { type: "text", text: describeTree(tree) },
          { type: "text", text: `Today's date: ${today}.` },
        ],
        messages: recent,
      });

      if (response.stop_reason === "refusal") {
        return { ok: false, text: "I can't help with that one. Try asking about someone in the family." };
      }
      const text = response.content
        .flatMap((b) => (b.type === "text" ? [b.text] : []))
        .join("")
        .trim();
      return { ok: true, text: text || "I couldn't find an answer in the family records." };
    } catch (error) {
      if (error instanceof Anthropic.AuthenticationError) {
        return { ok: false, text: "The assistant's API key was rejected. Check ANTHROPIC_API_KEY in Convex." };
      }
      if (error instanceof Anthropic.RateLimitError) {
        return { ok: false, text: "The assistant is busy right now. Please try again in a moment." };
      }
      if (error instanceof Anthropic.APIError) {
        console.error("Claude API error", error.status, error.message);
        return { ok: false, text: "The assistant ran into a problem. Please try again." };
      }
      throw error;
    }
  },
});
