"use client";

import {
  useCompletePasswordRecovery,
  useCompleteSignUpWithEmailPassword,
  useSignInWithEmailPassword,
  useSignUpWithEmailPassword,
  useStartPasswordRecovery,
  type CompletePasswordRecoveryResult,
  type CompletePasswordRecoveryState,
  type CompleteSignUpState,
} from "@convex-dev/auth/methods/email-password/react";
import { useOauth, useSignInWithGoogle, type OauthFlowError } from "@convex-dev/auth/methods/google/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from "convex/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import { errorMessage } from "@/lib/people";
import { useSampleMode } from "@/lib/sample-mode";
import { UmbhacoBand } from "./beadwork";
import { LogoMark } from "./logo";
import { btnPrimary, btnSecondary, inputCls } from "./ui/modal";

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
  return (
    <>
      <AuthLoading>
        <Splash />
      </AuthLoading>
      <Unauthenticated>
        <SignInScreen />
      </Unauthenticated>
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

function Splash() {
  return (
    <div className="grid h-full place-items-center bg-cream">
      <LogoMark size={40} className="animate-pulse text-forest" />
    </div>
  );
}

/** Words on the left, the archive photograph on the right, umbhaco hem below. */
function AuthLayout({ children }: { children: ReactNode }) {
  return (
    // Exactly one screen tall: the words, the photograph and the hem all fit without scrolling.
    <div className="@container flex h-full flex-col bg-cream text-ink">
      <div className="flex min-h-0 flex-1 flex-col @3xl:flex-row">
        <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-6 py-5 @xl:px-14 @3xl:py-6 @5xl:px-20">
          <div className="mb-4 flex items-center gap-3">
            <LogoMark className="text-forest" />
            <span>
              <span className="block font-display text-2xl font-semibold leading-none">Imvelaphi</span>
              <span className="mt-1 block text-[11px] uppercase tracking-[0.2em] text-moss">Family archive</span>
            </span>
          </div>
          {children}
        </div>
        {/* On wide screens the panel takes the portrait's own shape, so the photo is barely enlarged. */}
        <div className="relative order-first h-20 shrink-0 @xl:h-44 @3xl:order-2 @3xl:aspect-[500/688] @3xl:h-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/heritage/beadwork.jpg"
            alt="A woman wearing beaded collars and a beaded panel"
            className="absolute inset-0 h-full w-full object-cover object-[50%_45%]"
          />
        </div>
      </div>
      <UmbhacoBand height={30} />
    </div>
  );
}

function Heading({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <>
      <p className="text-xs uppercase tracking-[0.3em] text-bead-blue-deep">{eyebrow}</p>
      <h1 className="mt-3 max-w-xl font-display text-4xl font-semibold leading-[1.04] @xl:text-5xl @5xl:text-6xl">{children}</h1>
    </>
  );
}

function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-800">
      {children}
    </p>
  );
}

type SignInError = Extract<
  Awaited<ReturnType<ReturnType<typeof useSignInWithEmailPassword>["signIn"]>>,
  { status: "error" }
>["userError"];
type SignUpError = Extract<
  Awaited<ReturnType<ReturnType<typeof useSignUpWithEmailPassword>["signUp"]>>,
  { success: false }
>["userError"];
type RecoveryError = Extract<
  Awaited<ReturnType<ReturnType<typeof useStartPasswordRecovery>["startPasswordRecovery"]>>,
  { success: false }
>["userError"];
type VerifyError = Extract<CompleteSignUpState, { status: "error" }>["userError"];
type ResetLinkError = Extract<CompletePasswordRecoveryState, { status: "error" }>["userError"];
type ResetError = Extract<CompletePasswordRecoveryResult, { status: "error" }>["userError"];
type AuthError = SignInError | SignUpError | RecoveryError | VerifyError | ResetLinkError | ResetError | OauthFlowError;

const TRY_AGAIN = "Something went wrong. Please try again.";

/** A plain-language message for every way signing in can fail. */
function authMessage(e: AuthError): string {
  switch (e.error) {
    case "INVALID_CREDENTIALS":
    case "USER_NOT_FOUND":
      return "That email and password don't match. Check them, or create an account.";
    case "RATE_LIMITED":
      return `Too many tries. Wait ${Math.max(1, Math.ceil(e.retryAfterMs / 60000))} minute(s) and try again.`;
    case "INVALID_EMAIL":
      return "That doesn't look like an email address.";
    case "EMAIL_TAKEN":
      return "There's already an account with that email. Sign in instead.";
    case "EMAIL_NOT_FOUND":
      return "There's no account with that email address.";
    case "PASSWORD_TOO_SHORT":
      return "Use a longer password.";
    case "PASSWORD_TOO_LONG":
      return "That password is too long.";
    case "PASSWORD_HAS_SURROUNDING_WHITESPACE":
      return "Remove the spaces at the start or end of your password.";
    case "PASSWORD_TOO_COMMON":
      return "That password is too easy to guess. Choose another one.";
    case "MISSING_SECRET":
      return "Open the link in the same browser you used to sign up or ask for the reset.";
    case "INVALID_CHALLENGE":
    case "INCORRECT_CODE":
    case "EXPIRED":
    case "INVALID_FLOW":
      return "This link has expired or was already used. Please start again.";
    case "ACCESS_DENIED":
      return "Google sign-in was cancelled.";
    case "OTHER_ERROR":
      return TRY_AGAIN;
    default:
      e satisfies never;
      return TRY_AGAIN;
  }
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z"
      />
      <path
        fill="#FBBC05"
        d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.2 1.5-5 2.3-8.2 2.3-6.2 0-11.5-4.1-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}

type Mode = "signIn" | "signUp" | "forgot";

function SignInScreen() {
  const { signIn: signInWithGoogle } = useSignInWithGoogle(api.auth);
  const { flowError } = useOauth();
  const { signIn, pending: signingIn } = useSignInWithEmailPassword(api.auth);
  const { signUp, pending: signingUp } = useSignUpWithEmailPassword(api.auth);
  const { startPasswordRecovery, pending: sending } = useStartPasswordRecovery(api.auth);
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ to: string; why: "confirm" | "reset" } | null>(null);
  const [leaving, setLeaving] = useState(false);
  const pending = signingIn || signingUp || sending || leaving;

  function switchTo(next: Mode) {
    setMode(next);
    setError(null);
  }

  async function google() {
    setError(null);
    setLeaving(true);
    const result = await signInWithGoogle();
    if (result.status === "error") {
      setLeaving(false);
      setError(authMessage(result.userError));
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (mode === "signIn") {
      const result = await signIn({ email, password });
      if (result.status === "error") setError(authMessage(result.userError));
    } else if (mode === "signUp") {
      const result = await signUp({ email, password });
      if (result.success) setSent({ to: email, why: "confirm" });
      else setError(authMessage(result.userError));
    } else {
      const result = await startPasswordRecovery({ email });
      if (result.success) setSent({ to: result.sentTo, why: "reset" });
      else setError(authMessage(result.userError));
    }
  }

  if (sent) {
    return (
      <AuthLayout>
        <Heading eyebrow="Check your email">
          We sent you a <span className="italic text-ochre-deep">link</span>
        </Heading>
        <p className="mt-3 max-w-md leading-relaxed text-ink/70 @xl:text-lg">
          Open the email we sent to <strong className="font-medium text-ink">{sent.to}</strong> and click the link{" "}
          {sent.why === "confirm" ? "to confirm your address" : "to choose a new password"}. Open it in this same
          browser.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(null);
            switchTo("signIn");
          }}
          className="mt-5 self-start text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Back to sign in
        </button>
      </AuthLayout>
    );
  }

  const shownError = error ?? (flowError ? authMessage(flowError) : null);

  return (
    <AuthLayout>
      <Heading eyebrow="Imvelaphi · where we come from">
        Welcome to the family <span className="italic text-ochre-deep">archive</span>
      </Heading>
      <p className="mt-3 max-w-md leading-relaxed text-ink/70 @xl:text-lg">
        {mode === "forgot"
          ? "Enter your email address and we'll send you a link to choose a new password."
          : "Sign in with your Google account or your email address."}
      </p>

      <div className="mt-5 max-w-md space-y-3">
        {mode !== "forgot" && (
          <>
            <button type="button" onClick={() => void google()} disabled={pending} className={`${btnSecondary} w-full`}>
              <GoogleMark /> Continue with Google
            </button>
            <div className="flex items-center gap-3 py-1 text-xs uppercase tracking-wider text-muted">
              <span className="h-px flex-1 bg-ink/10" /> or <span className="h-px flex-1 bg-ink/10" />
            </div>
          </>
        )}

        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            disabled={pending}
            aria-label="Email address"
            placeholder="Email address"
            className={inputCls}
          />
          {mode !== "forgot" && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signUp" ? "new-password" : "current-password"}
              required
              disabled={pending}
              aria-label="Password"
              placeholder="Password"
              className={inputCls}
            />
          )}
          <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>
            {mode === "signIn" && (signingIn ? "Signing in…" : "Sign in with email")}
            {mode === "signUp" && (signingUp ? "Creating your account…" : "Create account")}
            {mode === "forgot" && (sending ? "Sending…" : "Send me a reset link")}
          </button>
          {shownError && <ErrorNote>{shownError}</ErrorNote>}
        </form>

        <div className="flex flex-wrap justify-between gap-2 px-1 text-sm text-muted">
          {mode === "signIn" ? (
            <>
              <button type="button" onClick={() => switchTo("signUp")} className="hover:text-ink hover:underline">
                New here? Create an account
              </button>
              <button type="button" onClick={() => switchTo("forgot")} className="hover:text-ink hover:underline">
                Forgot password?
              </button>
            </>
          ) : (
            <button type="button" onClick={() => switchTo("signIn")} className="hover:text-ink hover:underline">
              {mode === "signUp" ? "Already have an account? Sign in" : "Back to sign in"}
            </button>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}

function LinkFailed({ eyebrow, message }: { eyebrow: string; message: string }) {
  const router = useRouter();
  return (
    <AuthLayout>
      <Heading eyebrow={eyebrow}>
        That link didn&apos;t <span className="italic text-ochre-deep">work</span>
      </Heading>
      <div className="mt-5 max-w-md space-y-4">
        <ErrorNote>{message}</ErrorNote>
        <button type="button" onClick={() => router.replace("/")} className={btnSecondary}>
          Back to sign in
        </button>
      </div>
    </AuthLayout>
  );
}

/** Landing page of the link in the confirmation email. */
function VerifyEmailScreen({ code }: { code: string }) {
  const state = useCompleteSignUpWithEmailPassword(api.auth, { emailCode: code });
  const router = useRouter();
  useEffect(() => {
    if (state.status === "complete") router.replace("/overview");
  }, [state.status, router]);
  if (state.status === "error") {
    return <LinkFailed eyebrow="Confirming your email" message={authMessage(state.userError)} />;
  }
  return <Splash />;
}

/** Landing page of the link in the password reset email. */
function ResetPasswordScreen({ code }: { code: string }) {
  const state = useCompletePasswordRecovery(api.auth, { emailCode: code });
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (state.status === "complete") router.replace("/overview");
  }, [state.status, router]);

  if (state.status === "error") {
    return <LinkFailed eyebrow="Reset your password" message={authMessage(state.userError)} />;
  }
  if (state.status !== "ready") return <Splash />;

  const { completePasswordRecovery, pending } = state;
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const result = await completePasswordRecovery({ newPassword: password });
    if (result.status === "error") setError(authMessage(result.userError));
  }

  return (
    <AuthLayout>
      <Heading eyebrow="Reset your password">
        Choose a new <span className="italic text-ochre-deep">password</span>
      </Heading>
      <form onSubmit={submit} className="mt-5 max-w-md space-y-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          disabled={pending}
          aria-label="New password"
          placeholder="New password"
          className={inputCls}
        />
        <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>
          {pending ? "Saving…" : "Save and sign in"}
        </button>
        {error && <ErrorNote>{error}</ErrorNote>}
      </form>
    </AuthLayout>
  );
}

/** After signing in: join a family's tree with its code, or start a new one. */
function FamilyCodeScreen({ name }: { name: string | null }) {
  const joinFamily = useMutation(api.users.joinFamily);
  const startFamily = useMutation(api.users.startFamily);
  const loadSample = useMutation(api.family.loadSampleFamily);
  const { signOut } = useAuthActions();
  const { enterSample } = useSampleMode();
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function switchMode() {
    setStarting(!starting);
    setValue("");
    setError(null);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (starting) await startFamily({ familyName: value });
      else await joinFamily({ code: value });
      router.push("/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      {starting ? (
        <Heading eyebrow={`Welcome${name ? `, ${name}` : ""}`}>
          Start your family&apos;s <span className="italic text-ochre-deep">tree</span>
        </Heading>
      ) : (
        <Heading eyebrow={`Welcome${name ? `, ${name}` : ""}`}>
          Enter the family <span className="italic text-ochre-deep">code</span>
        </Heading>
      )}
      <p className="mt-3 max-w-md leading-relaxed text-ink/70 @xl:text-lg">
        {starting
          ? "Give your family's name. You'll get a family code to share, so relatives can join the same tree."
          : "Each family's archive is private. Ask a relative for your family code: it connects your account to your family's tree, and you only need to enter it once."}
      </p>
      <form onSubmit={submit} className="mt-5 max-w-md space-y-3">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          autoComplete="off"
          autoCapitalize={starting ? "words" : "characters"}
          aria-label={starting ? "Family name" : "Family code"}
          placeholder={starting ? "Family name, e.g. Rubuluza" : "Family code"}
          className={inputCls}
        />
        <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
          {starting ? (busy ? "Starting…" : "Start the family tree") : busy ? "Checking…" : "Join the family"}
        </button>
        {error && <ErrorNote>{error}</ErrorNote>}
        <button type="button" onClick={switchMode} className="px-1 text-sm text-muted hover:text-ink hover:underline">
          {starting ? "Have a family code? Join your family" : "No code yet? Start a new family tree"}
        </button>
      </form>
      <div className="mt-5 flex max-w-md flex-wrap items-center gap-3 border-t border-ink/10 pt-4">
        <button
          type="button"
          onClick={() =>
            loadSample()
              .then(() => {
                enterSample();
                router.push("/overview");
              })
              .catch((e) => setError(errorMessage(e)))
          }
          className={btnSecondary}
        >
          Explore a sample family
        </button>
        <button
          type="button"
          onClick={() => void signOut().then(() => router.push("/"))}
          className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Sign out
        </button>
      </div>
    </AuthLayout>
  );
}
