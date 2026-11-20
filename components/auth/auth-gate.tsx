"use client";

import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import { useSampleMode } from "@/lib/sample-mode";
import { Splash } from "./auth-layout";
import { SignInScreen } from "./sign-in-screen";
import { ResetPasswordScreen, VerifyEmailScreen } from "./email-link-screens";
import { FamilyCodeScreen } from "./family-code-screen";

/**
 * Shows the app only to signed-in family members. Signed-out visitors get the
 * sign-in screen; signed-in people who haven't joined get the family code
 * screen (and can still explore the sample family).
 */
export function AuthGate({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<Splash />}>
      <LinkLanding>
        <Gate>{children}</Gate>
      </LinkLanding>
    </Suspense>
  );
}

/** The pages the links in our emails open, shown whether or not anyone is signed in. */
function LinkLanding({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const code = useSearchParams().get("code");
  if (code && pathname === "/verify-email") return <VerifyEmailScreen code={code} />;
  if (code && pathname === "/reset-password") return <ResetPasswordScreen code={code} />;
  return <>{children}</>;
}

function Gate({ children }: { children: ReactNode }) {
  const { sample } = useSampleMode();
  // The front door stays the sign-in screen; visitors exploring the sample see the rest.
  const pathname = usePathname();
  const exploring = sample && pathname !== "/";
  return (
    <>
      <AuthLoading>
        <Splash />
      </AuthLoading>
      <Unauthenticated>{exploring ? children : <SignInScreen />}</Unauthenticated>
      <Authenticated>
        <MemberGate>{children}</MemberGate>
      </Authenticated>
    </>
  );
}

function MemberGate({ children }: { children: ReactNode }) {
  const me = useQuery(api.users.me);
  const { sample } = useSampleMode();
  if (me === undefined) return <Splash />;
  if (!me.signedIn) return <SignInScreen />;
  if (!me.member && !sample) return <FamilyCodeScreen name={me.name} />;
  return <>{children}</>;
}
