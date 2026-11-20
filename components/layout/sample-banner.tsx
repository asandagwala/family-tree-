"use client";

import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useChat } from "@/components/chat/chat-context";
import { useSampleMode } from "@/lib/sample-mode";

/** Shown on every page while exploring the sample family. */
export function SampleBanner() {
  const { sample, exitSample } = useSampleMode();
  const chat = useChat();
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  if (!sample) return null;
  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-b border-ochre/30 bg-ochre-soft px-4 py-2.5 text-sm text-ink">
      <span>
        <strong className="font-semibold">You&apos;re exploring a sample family.</strong>{" "}
        {isAuthenticated
          ? "None of these people are part of your family's archive."
          : "These people are made up. Sign in to start your own family's tree."}
      </span>
      <button
        type="button"
        onClick={() => {
          exitSample();
          chat.reset();
          router.push("/");
        }}
        className="rounded-full bg-ink px-4 py-1.5 text-xs font-medium text-white hover:bg-coal"
      >
        {isAuthenticated ? "Back to my family" : "Sign in"}
      </button>
    </div>
  );
}
