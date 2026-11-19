import { setupConvexAuthServer } from "@convex-dev/auth/ssr";
import { api } from "@/convex/_generated/api";

/** Server-side auth handlers mounted at /auth/signin, /auth/refresh and /auth/signout. */
export const auth = setupConvexAuthServer({
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
  refreshSession: api.auth.refreshSession,
  signOut: api.auth.signOut,
  // Every function that creates a session; anything else is refused.
  signIn: [api.auth.finishSignUpWithUsernamePasskey, api.auth.finishSignInWithUsernamePasskey],
  cookieOptions: { secure: process.env.NODE_ENV === "production" },
});
