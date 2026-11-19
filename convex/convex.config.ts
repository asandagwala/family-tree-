import { defineApp } from "convex/server";
import { v } from "convex/values";
import auth from "@convex-dev/auth/convex.config.js";
import authGoogle from "@convex-dev/auth/components/google/convex.config.js";
import authEmail from "@convex-dev/auth/components/email/convex.config.js";
import authPassword from "@convex-dev/auth/components/password/convex.config.js";
import resend from "@convex-dev/resend/convex.config.js";

// Set secrets with `npx convex env set NAME` (it prompts for the value):
// - GEMINI_API_KEY (Google AI Studio) powers the family assistant; GEMINI_MODEL
//   optionally pins one model.
// - AUTH_GOOGLE_CLIENT_ID / AUTH_GOOGLE_CLIENT_SECRET come from Google Cloud.
// - RESEND_API_KEY and RESEND_FROM send the email confirmation and reset links.
// - SITE_URL is where the app is served (the links in emails point there).
const app = defineApp({
  env: {
    GEMINI_API_KEY: v.optional(v.string()),
    GEMINI_MODEL: v.optional(v.string()),
    AUTH_GOOGLE_CLIENT_ID: v.string(),
    AUTH_GOOGLE_CLIENT_SECRET: v.string(),
    RESEND_API_KEY: v.optional(v.string()),
    RESEND_FROM: v.optional(v.string()),
    SITE_URL: v.optional(v.string()),
  },
});
app.use(auth);
app.use(authGoogle, {
  httpPrefix: "/oauth/google",
  env: { CLIENT_ID: app.env.AUTH_GOOGLE_CLIENT_ID, CLIENT_SECRET: app.env.AUTH_GOOGLE_CLIENT_SECRET },
});
app.use(authEmail);
app.use(authPassword);
app.use(resend);

export default app;
