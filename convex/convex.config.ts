import { defineApp } from "convex/server";
import { v } from "convex/values";
import auth from "@convex-dev/auth/convex.config.js";
import authPasskey from "@convex-dev/auth/components/passkey/convex.config.js";
import authUsername from "@convex-dev/auth/components/username/convex.config.js";

// GEMINI_API_KEY (from Google AI Studio) powers the family assistant:
//   npx convex env set GEMINI_API_KEY
// GEMINI_MODEL optionally pins one Gemini model.
// FAMILY_CODE is the secret a new member enters once to see the real archive:
//   npx convex env set FAMILY_CODE
// PASSKEY_RP_ID / PASSKEY_ORIGIN must match the domain the app is served from
// (defaults cover localhost during development).
const app = defineApp({
  env: {
    GEMINI_API_KEY: v.optional(v.string()),
    GEMINI_MODEL: v.optional(v.string()),
    FAMILY_CODE: v.optional(v.string()),
    PASSKEY_RP_ID: v.optional(v.string()),
    PASSKEY_ORIGIN: v.optional(v.string()), // comma-separated for several origins
  },
});
app.use(auth);
app.use(authPasskey);
app.use(authUsername);

export default app;
