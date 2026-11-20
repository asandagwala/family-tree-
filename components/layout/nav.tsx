"use client";

import { Cake, Images, LayoutGrid, Network, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { UmbhacoTrim } from "@/components/brand/beadwork";

/** The page links: a sidebar on wide screens, a bar along the bottom on phones. The current page is highlighted. */

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

export function ActiveAware({ render }: { render: (p: NavProps) => ReactNode }) {
  return (
    <Suspense fallback={render({ active: () => false })}>
      <WithActive render={render} />
    </Suspense>
  );
}

export function SidebarNav({ active }: NavProps) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-4 pb-3 pt-2.5 text-sm transition-colors ${
            active(href)
              ? "bg-bead-blue-soft font-medium text-ink"
              : "text-muted hover:bg-bead-blue-soft/60 hover:text-ink"
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

export function MobileNavLinks({ active }: NavProps) {
  return (
    <>
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-label={label}
          className={`grid h-10 w-10 place-items-center rounded-full ${active(href) ? "bg-bead-blue-soft text-ink" : "text-muted"}`}
        >
          <Icon size={18} />
        </Link>
      ))}
    </>
  );
}
