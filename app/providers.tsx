"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { ChatProvider } from "@/components/chat/chat-context";

const url = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = url ? new ConvexReactClient(url) : null;

export function Providers({ children }: { children: ReactNode }) {
  if (!convex) {
    return (
      <main className="grid min-h-full place-items-center p-8 text-center">
        <div>
          <h1 className="font-display text-3xl">The archive isn&apos;t connected</h1>
          <p className="mt-2 text-sm text-muted">
            Run <code className="rounded bg-mist px-1">npx convex dev</code>, then restart{" "}
            <code className="rounded bg-mist px-1">pnpm dev</code>.
          </p>
        </div>
      </main>
    );
  }
  return (
    <ConvexProvider client={convex}>
      <ChatProvider>{children}</ChatProvider>
    </ConvexProvider>
  );
}
