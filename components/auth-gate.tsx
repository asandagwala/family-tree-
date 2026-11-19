"use client";

import { useSignInWithUsernamePasskey } from "@convex-dev/auth/methods/username-passkey/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, AuthLoading, Unauthenticated, useMutation, useQuery } from "convex/react";
import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
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
  if (!me.member && !sample) return <FamilyCodeScreen username={me.username} />;
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
    <div className="@container flex min-h-full flex-col bg-cream text-ink">
      <div className="grid flex-1 @3xl:grid-cols-[1.25fr_1fr]">
        <div className="flex flex-col justify-center px-8 pb-16 pt-10 @xl:px-14 @3xl:pb-24 @5xl:px-20">
          <div className="mb-8 flex items-center gap-3">
            <LogoMark className="text-forest" />
            <span>
              <span className="block font-display text-2xl font-semibold leading-none">Imvelaphi</span>
              <span className="mt-1 block text-[11px] uppercase tracking-[0.2em] text-moss">Family archive</span>
            </span>
          </div>
          {children}
        </div>
        <div className="relative order-first h-56 @xl:h-72 @3xl:order-2 @3xl:h-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/heritage/gathering.jpg"
            alt="Women gathered on the grass beside a thatched rondavel"
            className="duotone absolute inset-0 h-full w-full object-cover object-[50%_65%]"
          />
        </div>
      </div>
      <UmbhacoBand height={30} />
    </div>
  );
}

type SignInResult = Awaited<ReturnType<ReturnType<typeof useSignInWithUsernamePasskey>["signIn"]>>;
type SignInError = Extract<SignInResult, { status: "error" }>["userError"];

/** A plain-language message for every way a passkey sign-in can fail. */
function signInMessage(e: SignInError): string | null {
  switch (e.error) {
    case "CEREMONY_ABORTED":
      return null; // the person closed the prompt themselves; nothing to explain
    case "ALREADY_PENDING":
      return "Your device is already asking for a passkey. Finish or cancel that first.";
    case "WEBAUTHN_UNSUPPORTED":
      return "This browser doesn't support passkeys. Try a recent Chrome, Safari or Edge, or use your phone.";
    case "PASSKEY_ALREADY_REGISTERED":
      return "This device already has a passkey for the archive. Sign in with the username you chose before.";
    case "USERNAME_TAKEN":
      return "That username is already taken. Try another one.";
    case "USERNAME_TOO_SHORT":
      return "That username is too short.";
    case "USERNAME_TOO_LONG":
      return "That username is too long.";
    case "USERNAME_HAS_SURROUNDING_WHITESPACE":
      return "Remove the spaces at the start or end of your username.";
    case "USERNAME_HAS_INVALID_CHARACTERS":
      return "That username has characters that aren't allowed. Try letters and numbers.";
    case "CHALLENGE_EXPIRED":
      return "The sign-in took too long and expired. Please try again.";
    case "UNKNOWN_CREDENTIAL":
      return "That passkey isn't recognised here. Check your username, or sign up with a new one.";
    case "PROTOCOL_ERROR":
    case "OTHER_ERROR":
      return "Something went wrong signing you in. Please try again.";
    default:
      e satisfies never;
      return "Something went wrong signing you in. Please try again.";
  }
}

function SignInScreen() {
  const { signIn, pending, autofill } = useSignInWithUsernamePasskey(api.auth);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const autofillError = autofill.lastError ? signInMessage(autofill.lastError) : null;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const result = await signIn({ username });
    if (result.status === "error") setError(signInMessage(result.userError));
  }

  return (
    <AuthLayout>
      <p className="text-xs uppercase tracking-[0.3em] text-bead-blue-deep">Imvelaphi · where we come from</p>
      <h1 className="mt-5 max-w-xl font-display text-5xl font-semibold leading-[1.04] @xl:text-6xl">
        Welcome to the family <span className="italic text-ochre-deep">archive</span>
      </h1>
      <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/70">
        Sign in with your username. Your phone or computer confirms it&apos;s you with a fingerprint, your face or your
        PIN, so there&apos;s no password to remember.
      </p>
      <form onSubmit={submit} className="mt-8 max-w-md space-y-3">
        <label className="block">
          <span className="mb-1.5 block px-1 text-xs font-medium uppercase tracking-wider text-muted">Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username webauthn"
            autoCapitalize="none"
            spellCheck={false}
            required
            disabled={pending}
            placeholder="e.g. lindiwe"
            className={inputCls}
          />
        </label>
        <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>
          <KeyRound size={16} /> {pending ? "Waiting for your passkey…" : "Continue with a passkey"}
        </button>
        {(error ?? autofillError) && (
          <p role="alert" className="rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-800">
            {error ?? autofillError}
          </p>
        )}
        <p className="px-1 text-sm text-muted">
          New here? Choose a username and your device will set up a passkey for you.
        </p>
      </form>
    </AuthLayout>
  );
}

function FamilyCodeScreen({ username }: { username: string | null }) {
  const joinFamily = useMutation(api.users.joinFamily);
  const loadSample = useMutation(api.family.loadSampleFamily);
  const { signOut } = useAuthActions();
  const { enterSample } = useSampleMode();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await joinFamily({ code });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <p className="text-xs uppercase tracking-[0.3em] text-bead-blue-deep">
        Molo{username ? `, ${username}` : ""}
      </p>
      <h1 className="mt-5 max-w-xl font-display text-5xl font-semibold leading-[1.04] @xl:text-6xl">
        Enter the family <span className="italic text-ochre-deep">code</span>
      </h1>
      <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/70">
        The archive is private to the family. Ask a relative for the family code; you only need to enter it once.
      </p>
      <form onSubmit={submit} className="mt-8 max-w-md space-y-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          autoComplete="off"
          aria-label="Family code"
          placeholder="Family code"
          className={inputCls}
        />
        <button type="submit" disabled={busy} className={`${btnPrimary} w-full`}>
          {busy ? "Checking…" : "Join the family"}
        </button>
        {error && (
          <p role="alert" className="rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-800">
            {error}
          </p>
        )}
      </form>
      <div className="mt-8 flex max-w-md flex-wrap items-center gap-3 border-t border-ink/10 pt-6">
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
