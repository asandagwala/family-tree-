import { defineApp } from "convex/server";
import { v } from "convex/values";

// ANTHROPIC_API_KEY powers the family assistant. Set it with:
//   npx convex env set ANTHROPIC_API_KEY sk-ant-...
const app = defineApp({
  env: {
    ANTHROPIC_API_KEY: v.optional(v.string()),
  },
});

export default app;
