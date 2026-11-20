import { GoogleGenAI, type Content } from "@google/genai";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action, env, internalAction } from "./_generated/server";
import { describeTree, INSTRUCTIONS } from "./lib/assistantPrompt";
import { MAX_LENGTH, rateLimiter, waitText } from "./lib/security";

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
    const space = await ctx.runQuery(internal.users.currentSpace, { sample: !!sample });
    if (!space) {
      return { ok: false, text: "Please sign in, and enter the family code, to ask about the family." };
    }
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) return { ok: false, text: NOT_SET_UP };

    // Keep the conversation small: every word sent costs a Gemini call.
    const recent = messages.slice(-20).map((m) => ({ ...m, content: m.content.slice(0, 4000) }));
    if (recent.length === 0 || recent[recent.length - 1].role !== "user") {
      return { ok: false, text: "Ask me something about the family." };
    }
    if (messages[messages.length - 1].content.length > MAX_LENGTH.question) {
      return { ok: false, text: `That question is too long. Please keep it under ${MAX_LENGTH.question} characters.` };
    }
    const userId = await ctx.runQuery(internal.users.currentUserId, {});
    for (const name of ["askAssistantPerMinute", "askAssistant"] as const) {
      const { ok, retryAfter } = await rateLimiter.limit(ctx, name, { key: userId! });
      if (!ok) {
        return { ok: false, text: `You've asked a lot of questions. Please wait ${waitText(retryAfter ?? 0)} and ask again.` };
      }
    }

    const tree = await ctx.runQuery(internal.tree.treeForAssistant, { space });
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
