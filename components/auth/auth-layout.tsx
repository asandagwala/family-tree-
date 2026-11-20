"use client";

import { type ReactNode } from "react";
import { UmbhacoBand } from "@/components/brand/beadwork";
import { LogoMark } from "@/components/brand/logo";

/** The frame every sign-in screen shares: words on the left, the photograph, the umbhaco hem. */

export function Splash() {
  return (
    <div className="grid h-full place-items-center bg-cream">
      <LogoMark size={40} className="animate-pulse text-forest" />
    </div>
  );
}

/** Words on the left, the archive photograph on the right, umbhaco hem below. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    // Exactly one screen tall: the words, the photograph and the hem all fit without scrolling.
    <div className="@container flex h-full flex-col bg-cream text-ink">
      <div className="flex min-h-0 flex-1 flex-col @3xl:flex-row">
        <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-6 py-4 @xl:px-14 @3xl:py-4 @5xl:px-20">
          <div className="mb-3 flex items-center gap-3">
            <LogoMark className="text-forest" />
            <span>
              <span className="block font-display text-2xl font-semibold leading-none">Imvelaphi</span>
              <span className="mt-1 block text-[11px] uppercase tracking-[0.2em] text-moss">Family archive</span>
            </span>
          </div>
          {children}
        </div>
        {/* Phones: as tall a photo band as the screen allows while the form still fits below it. */}
        <div className="relative order-first h-[clamp(2.5rem,calc(100dvh-640px),14rem)] shrink-0 @3xl:order-2 @3xl:h-full @3xl:w-[44%]">
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

export function Heading({ eyebrow, children }: { eyebrow: string; children: ReactNode }) {
  return (
    <>
      <p className="text-xs uppercase tracking-[0.3em] text-bead-blue-deep">{eyebrow}</p>
      <h1 className="mt-3 max-w-xl font-display text-[clamp(2.25rem,min(6.5vh,10vw),3.75rem)] font-semibold leading-[1.04]">
        {children}
      </h1>
    </>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-800">
      {children}
    </p>
  );
}
