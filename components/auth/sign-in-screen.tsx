"use client";

import {
  useSignInWithEmailPassword,
  useSignUpWithEmailPassword,
  useStartPasswordRecovery,
} from "@convex-dev/auth/methods/email-password/react";
import { useOauth, useSignInWithGoogle } from "@convex-dev/auth/methods/google/react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/convex/_generated/api";
import { errorMessage } from "@/lib/people";
import { useSampleMode } from "@/lib/sample-mode";
import { btnPrimary, btnSecondary } from "@/components/ui/modal";
import { AuthLayout, ErrorNote, Heading } from "./auth-layout";
import { authMessage } from "./auth-errors";
import { PasswordInput } from "./password-input";
import { LabeledInput } from "@/components/ui/labeled-input";

/** The front door for visitors: Google, email and password, or a look at the sample family. */

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

export function SignInScreen() {
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
  const loadSample = useMutation(api.sample.loadSampleFamily);
  const { enterSample } = useSampleMode();
  const router = useRouter();

  function explore() {
    loadSample()
      .then(() => {
        enterSample();
        router.push("/overview");
      })
      .catch((e) => setError(errorMessage(e)));
  }

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

      <div className="mt-4 max-w-md space-y-3">
        {mode !== "forgot" && (
          <>
            <button type="button" onClick={() => void google()} disabled={pending} className={`${btnSecondary} w-full`}>
              <GoogleMark /> Continue with Google
            </button>
            <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted">
              <span className="h-px flex-1 bg-ink/10" /> or <span className="h-px flex-1 bg-ink/10" />
            </div>
          </>
        )}

        <form onSubmit={submit} className="space-y-3">
          <LabeledInput
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            disabled={pending}
          />
          {mode !== "forgot" && (
            <PasswordInput
              value={password}
              onChange={setPassword}
              autoComplete={mode === "signUp" ? "new-password" : "current-password"}
              disabled={pending}
              label="Password"
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
        <p className="border-t border-ink/10 px-1 pt-2 text-sm text-muted">
          Just looking?{" "}
          <button type="button" onClick={explore} className="font-medium text-ink underline-offset-4 hover:underline">
            Explore a sample family
          </button>{" "}
          without signing in.
        </p>
      </div>
    </AuthLayout>
  );
}
