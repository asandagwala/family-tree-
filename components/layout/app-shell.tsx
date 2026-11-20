"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AuthGate } from "@/components/auth/auth-gate";
import { ChatDrawer } from "@/components/chat/chat-drawer";
import { useChat } from "@/components/chat/chat-context";
import { LogoMark } from "@/components/brand/logo";
import { useSampleMode } from "@/lib/sample-mode";
import { AskIcon } from "@/components/brand/ask-icon";
import { ActiveAware, MobileNavLinks, SidebarNav } from "./nav";
import { SampleBanner } from "./sample-banner";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <Shell>{children}</Shell>
    </AuthGate>
  );
}

/** Signed in as … · Sign out. Leaving also drops sample mode and the chat. */
function useLeave() {
  const { signOut } = useAuthActions();
  const { exitSample } = useSampleMode();
  const chat = useChat();
  const router = useRouter();
  return async () => {
    await signOut();
    exitSample();
    chat.reset();
    router.push("/");
  };
}

function AccountRow() {
  const me = useQuery(api.users.me);
  const leave = useLeave();
  if (!me?.signedIn) return null;
  return (
    <div className="flex items-center justify-between gap-2 border-t border-line px-5 py-3 text-xs text-muted">
      <span className="truncate">
        Signed in as <span className="font-medium text-ink">{me.name ?? "you"}</span>
      </span>
      <button
        type="button"
        onClick={() => void leave()}
        className="shrink-0 font-medium hover:text-ink hover:underline"
      >
        Sign out
      </button>
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const chat = useChat();
  const leave = useLeave();
  const { isAuthenticated } = useConvexAuth();

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="relative hidden w-64 shrink-0 flex-col overflow-hidden border-r border-line bg-card text-ink md:flex">
        <Link href="/" className="flex items-center gap-3 px-6 pb-8 pt-7">
          <LogoMark className="text-forest" />
          <span>
            <span className="block font-display text-2xl font-semibold leading-none tracking-wide">Imvelaphi</span>
            <span className="mt-1 block text-[11px] uppercase tracking-[0.2em] text-moss">Family archive</span>
          </span>
        </Link>

        <ActiveAware render={(p) => <SidebarNav {...p} />} />

        <div className="px-3 pt-6">
          <button
            type="button"
            onClick={() => chat.open()}
            className="flex w-full items-center gap-3 rounded-full border border-line px-4 py-2.5 text-sm text-ink transition-colors hover:border-ochre/50 hover:bg-ochre-soft/50"
          >
            <AskIcon size={17} className="text-ochre-deep" />
            Ask the family
          </button>
        </div>

        <div className="mt-auto">
          <div className="mx-4 mb-5 overflow-hidden rounded-3xl">
            {/* Kept small so it doesn't compete with the home banner; framed to show
                the women from headwraps to knees. */}
            <div className="duotone-wrap h-44">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/heritage/elders-full.jpg"
                alt="Three women in traditional dress and headwraps"
                className="duotone h-full w-full object-cover object-[50%_6%]"
              />
              <p className="absolute inset-x-0 bottom-0 z-10 p-4 font-display text-lg italic leading-snug text-mist">
                “Umntu ngumntu ngabantu.”
              </p>
            </div>
          </div>
          <AccountRow />
        </div>
      </aside>

      {/* Main */}
      <main className="relative min-w-0 flex-1 overflow-y-auto scrollbar-thin pb-20 md:pb-0">
        <SampleBanner />
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-around rounded-full border border-line bg-card px-2 py-2 text-ink shadow-xl md:hidden">
        <ActiveAware render={(p) => <MobileNavLinks {...p} />} />
        <button
          type="button"
          aria-label="Ask the family"
          onClick={() => chat.open()}
          className="grid h-10 w-10 place-items-center rounded-full text-ochre-deep"
        >
          <AskIcon size={18} />
        </button>
        {isAuthenticated && (
          <button
            type="button"
            aria-label="Sign out"
            onClick={() => void leave()}
            className="grid h-10 w-10 place-items-center rounded-full text-muted"
          >
            <LogOut size={18} />
          </button>
        )}
      </nav>

      <ChatDrawer />
    </div>
  );
}
