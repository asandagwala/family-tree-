"use client";

import {
  useCompletePasswordRecovery,
  useCompleteSignUpWithEmailPassword,
} from "@convex-dev/auth/methods/email-password/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/convex/_generated/api";
import { btnPrimary, btnSecondary } from "@/components/ui/modal";
import { AuthLayout, ErrorNote, Heading, Splash } from "./auth-layout";
import { authMessage } from "./auth-errors";
import { PasswordInput } from "./password-input";

/** The pages the links in our emails open: confirming an address, and choosing a new password. */

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
export function VerifyEmailScreen({ code }: { code: string }) {
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
export function ResetPasswordScreen({ code }: { code: string }) {
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
      <form onSubmit={submit} className="mt-4 max-w-md space-y-3">
        <PasswordInput
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          disabled={pending}
          label="New password"
        />
        <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>
          {pending ? "Saving…" : "Save and sign in"}
        </button>
        {error && <ErrorNote>{error}</ErrorNote>}
      </form>
    </AuthLayout>
  );
}
