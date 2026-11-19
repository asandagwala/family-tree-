"use client";

import { Cake, Images, LayoutGrid, Network, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ChatDrawer } from "./chat/chat-drawer";
import { useChat } from "./chat/chat-context";
import { LogoMark } from "./logo";
import { useSampleMode } from "@/lib/sample-mode";
import { AskIcon } from "./ask-icon";
import { UmbhacoTrim } from "./beadwork";

const NAV = [
  { href: "/overview", label: "Overview", icon: LayoutGrid },
  { href: "/tree", label: "Family tree", icon: Network },
  { href: "/people", label: "People", icon: Users },
  { href: "/album", label: "Album", icon: Images },
  { href: "/birthdays", label: "Birthdays", icon: Cake },
];

type NavProps = { active: (href: string) => boolean };

/** Reads the URL, so it renders inside Suspense (Next prerenders the shell). */
function WithActive({ render }: { render: (p: NavProps) => ReactNode }) {
  const pathname = usePathname();
  return <>{render({ active: (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href)) })}</>;
}

function ActiveAware({ render }: { render: (p: NavProps) => ReactNode }) {
  return (
    <Suspense fallback={render({ active: () => false })}>
      <WithActive render={render} />
    </Suspense>
  );
}

function SidebarNav({ active }: NavProps) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-4 pb-4 pt-2.5 text-sm transition-colors ${
            active(href) ? "bg-cream font-medium text-ink" : "text-muted hover:bg-cream/60 hover:text-ink"
          }`}
        >
          <Icon size={17} strokeWidth={1.8} />
          {label}
          {/* umbhaco trim: always on for the current page, slides in on hover */}
          <span
            aria-hidden
            className={`pointer-events-none absolute inset-x-0 bottom-0 transition-all duration-200 ${
              active(href) ? "opacity-100" : "translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
            }`}
          >
            <UmbhacoTrim />
          </span>
        </Link>
      ))}
    </nav>
  );
}

function MobileNavLinks({ active }: NavProps) {
  return (
    <>
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-label={label}
          className={`grid h-10 w-10 place-items-center rounded-full ${active(href) ? "bg-cream text-ink" : "text-muted"}`}
        >
          <Icon size={18} />
        </Link>
      ))}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const chat = useChat();

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
      </nav>

      <ChatDrawer />
    </div>
  );
}

/** Shown on every page while exploring the sample family. */
function SampleBanner() {
  const { sample, exitSample } = useSampleMode();
  const chat = useChat();
  const router = useRouter();
  if (!sample) return null;
  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-b border-ochre/30 bg-ochre-soft px-4 py-2.5 text-sm text-ink">
      <span>
        <strong className="font-semibold">You&apos;re exploring a sample family.</strong> None of these people are part of
        your family&apos;s archive.
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
        Back to my family
      </button>
    </div>
  );
}
