import { defineApp } from "convex/server";
import { v } from "convex/values";

// GEMINI_API_KEY (from Google AI Studio) powers the family assistant:
//   npx convex env set GEMINI_API_KEY
// GEMINI_MODEL optionally pins one Gemini model.
const app = defineApp({
  env: {
    GEMINI_API_KEY: v.optional(v.string()),
    GEMINI_MODEL: v.optional(v.string()),
  },
});

export default app;
