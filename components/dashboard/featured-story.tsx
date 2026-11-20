"use client";

import Link from "next/link";
import { fullName, lifespan } from "@/lib/people";
import { type Family } from "@/lib/use-family";
import { AskIcon } from "@/components/brand/ask-icon";
import { useChat } from "@/components/chat/chat-context";
import { Portrait } from "@/components/people/portrait";

export function FeaturedStory({ family, className }: { family: Family; className?: string }) {
  const chat = useChat();
  const withStory = family.list.filter((p) => p.notes && p.notes.length > 40);
  // Rotate daily so the page feels alive.
  const pick = withStory.length ? withStory[new Date().getDate() % withStory.length] : undefined;

  return (
    <section className={`animate-rise relative overflow-hidden rounded-[1.75rem] bg-ink text-cream ${className}`}>
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/heritage/gathering.jpg" alt="" className="duotone h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
      </div>
      <div className="relative z-10 flex h-full min-h-72 flex-col justify-end p-7 sm:p-9">
        <p className="text-xs uppercase tracking-[0.25em] text-ochre">From the archive</p>
        {pick ? (
          <>
            <blockquote className="mt-3 max-w-2xl font-display text-2xl italic leading-snug sm:text-3xl">
              “{pick.notes}”
            </blockquote>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Link href={`/people/${pick._id}`} className="flex items-center gap-3">
                <Portrait person={pick} size={40} ring={false} />
                <span>
                  <span className="block text-sm font-medium">{fullName(pick)}</span>
                  <span className="block text-xs text-cream/70">{lifespan(pick)}</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => chat.open(`Tell me more about ${fullName(pick)}.`)}
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-cream px-4 py-2 text-xs font-medium text-ink hover:bg-white"
              >
                <AskIcon size={14} /> Ask about {pick.firstName}
              </button>
            </div>
          </>
        ) : (
          <p className="mt-3 max-w-xl font-display text-2xl italic leading-snug">
            Stories you add to people&apos;s profiles will appear here.
          </p>
        )}
      </div>
    </section>
  );
}
