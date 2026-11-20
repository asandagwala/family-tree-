"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/convex/_generated/api";
import { errorMessage } from "@/lib/people";
import { useSampleMode } from "@/lib/sample-mode";
import { btnPrimary, btnSecondary } from "@/components/ui/modal";
import { AuthLayout, ErrorNote, Heading } from "./auth-layout";
import { LabeledInput } from "@/components/ui/labeled-input";

/** After signing in: join a family's tree with its code, or start a new one. */
export function FamilyCodeScreen({ name }: { name: string | null }) {
  const joinFamily = useMutation(api.families.joinFamily);
  const startFamily = useMutation(api.families.startFamily);
  const loadSample = useMutation(api.sample.loadSampleFamily);
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
      if (starting) {
        await startFamily({ familyName: value });
      } else {
        const result = await joinFamily({ code: value });
        if (!result.ok) {
          setError(result.error);
          return;
        }
      }
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
      <form onSubmit={submit} className="mt-4 max-w-md space-y-3">
        <LabeledInput
          label={starting ? "Family name, e.g. Rubuluza" : "Family code"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          autoComplete="off"
          autoCapitalize={starting ? "words" : "characters"}
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
