import { GoogleGenAI, type Content } from "@google/genai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";
import { action, env, internalAction } from "./_generated/server";

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
  familyClan: string | null;
  familyClanPraise: string | null;
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
  const clan = [
    tree.familyClan && `Family isiduko: ${tree.familyClan}`,
    tree.familyClanPraise && `Izithakazelo: ${tree.familyClanPraise.replace(/\s+/g, " ")}`,
  ]
    .filter(Boolean)
    .join("; ");
  const heading = (tree.familyName ? `The ${tree.familyName} family` : "Family") + (clan ? ` (${clan})` : "");
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

// Tried in order. A busy model (429/503) gets one quick retry before the next is
// tried; a model this key can't use (404) is skipped. Set GEMINI_MODEL to pin one.
// Check what a key can use with `npx convex run assistant:availableModels`.
// The lite models answer family questions well and stay available when the
// larger flash models are overloaded, so they go first.
const DEFAULT_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.5-flash",
];
const BUSY_RETRY_MS = 800;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const NOT_SET_UP =
  "The family assistant isn't switched on yet. Add your Google AI Studio key with `npx convex env set GEMINI_API_KEY` and ask again.";

export const ask = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
      }),
    ),
    sample: v.optional(v.boolean()),
  },
  handler: async (ctx, { messages, sample }): Promise<{ ok: boolean; text: string }> => {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) return { ok: false, text: NOT_SET_UP };

    const recent = messages.slice(-20);
    if (recent.length === 0 || recent[recent.length - 1].role !== "user") {
      return { ok: false, text: "Ask me something about the family." };
    }

    const tree = await ctx.runQuery(internal.family.treeForAssistant, { sample });
    const today = new Date().toISOString().slice(0, 10);
    const systemInstruction = `${INSTRUCTIONS}

${describeTree(tree)}

Today's date: ${today}.`;
    // Gemini calls the assistant "model", and a conversation must start with the user.
    const firstUser = recent.findIndex((m) => m.role === "user");
    const contents: Content[] = recent.slice(firstUser).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const ai = new GoogleGenAI({ apiKey });
    const models = env.GEMINI_MODEL ? [env.GEMINI_MODEL] : DEFAULT_MODELS;
    let lastError: unknown;
    for (const model of models) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents,
            config: { systemInstruction, temperature: 0.3 },
          });
          const text = (response.text ?? "").trim();
          if (!text) {
            return { ok: false, text: "I couldn't answer that one. Try asking about someone in the family." };
          }
          return { ok: true, text };
        } catch (error) {
          lastError = error;
          const status = (error as { status?: number }).status;
          if (status === 400 || status === 401 || status === 403) {
            console.error("Gemini rejected the request", status, error);
            return {
              ok: false,
              text: "The assistant's key was rejected. Check GEMINI_API_KEY in your Convex settings.",
            };
          }
          console.warn(`Gemini model ${model} failed (attempt ${attempt + 1})`, status, error);
          // Busy (429/5xx) or a dropped connection (no status): worth one retry.
          const busy = status === undefined || status === 429 || status >= 500;
          if (!busy) break; // e.g. 404: this key can't use the model, so move on
          if (attempt === 0) await sleep(BUSY_RETRY_MS);
        }
      }
    }
    console.error("All Gemini models failed", lastError);
    return { ok: false, text: "The assistant is busy right now. Please try again in a moment." };
  },
});

/** Lists the Gemini models this deployment's key can use for chat.
 *  Run with `npx convex run assistant:availableModels` (add --prod for production). */
export const availableModels = internalAction({
  args: {},
  handler: async (): Promise<string[]> => {
    if (!env.GEMINI_API_KEY) return [];
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const names: string[] = [];
    for await (const model of await ai.models.list()) {
      if (model.name && model.supportedActions?.includes("generateContent")) {
        names.push(model.name.replace(/^models\//, ""));
      }
    }
    return names;
  },
});
