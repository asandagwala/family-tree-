import { components, internal } from "./_generated/api";
import { env } from "./_generated/server";
import { setupConvexAuth } from "@convex-dev/auth/server";
import { setupGoogle } from "@convex-dev/auth/methods/google/server";
import { setupEmailPassword } from "@convex-dev/auth/methods/email-password/server";

const LOCAL = "http://localhost:3000";
/** Where the app is served; links in emails point here. */
const SITE_URL = (env.SITE_URL ?? LOCAL).replace(/\/$/, "");

const auth = setupConvexAuth({ component: components.auth });
export const { signOut, refreshSession, isAuthenticated } = auth;

export const { startSignInWithGoogle, completeSignInWithGoogle } = setupGoogle(auth, {
  component: components.authGoogle,
  allowedRedirectOrigins: [...new Set([SITE_URL, LOCAL])],
}).attachUserCallbacks({ createUser: internal.users.createUserGoogle });

export const {
  signUpWithEmailPassword,
  completeSignUpWithEmailPassword,
  signInWithEmailPassword,
  changePassword,
  startPasswordRecovery,
  checkPasswordRecovery,
  completePasswordRecovery,
  startChangeEmail,
  completeChangeEmail,
} = setupEmailPassword(auth, {
  component: components.authEmail,
  passwordComponent: components.authPassword,
  emailSender: {
    kind: "resend",
    sendEmail: components.resend.lib.sendEmail,
    apiKey: env.RESEND_API_KEY ?? "",
    // Resend's test sender only delivers to the account owner's own address;
    // set RESEND_FROM to an address on a domain verified with Resend.
    from: env.RESEND_FROM ?? "Imvelaphi <onboarding@resend.dev>",
  },
  urls: {
    signUp: `${SITE_URL}/verify-email`,
    changeEmail: `${SITE_URL}/confirm-email`,
    recovery: `${SITE_URL}/reset-password`,
  },
}).attachUserCallbacks({ createUser: internal.users.createUserEmail });
