import { convexAuthNextjsProxy } from "@/lib/convexAuth";

// Refreshes the session before each page renders. Pages decide for themselves
// what a signed-out visitor sees, so no redirects here.
export default convexAuthNextjsProxy();

export const config = {
  // Keep the auth routes, Next internals and static files out of the proxy.
  matcher: ["/((?!auth/|_next/static|_next/image|favicon.ico|heritage/).*)"],
};
