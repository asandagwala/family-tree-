"use client";

import { useMutation, useQuery } from "convex/react";
import { ArrowRight, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { errorMessage } from "@/lib/people";
import { useFamily } from "@/lib/use-family";
import { UmbhacoBand } from "./beadwork";
import { PersonEditor } from "./person-editor";
import { btnPrimary, btnSecondary } from "./ui/modal";

/**
 * The front door: words on the left, the archive photograph filling the right.
 * An empty tree offers to start it; a tree with people leads into the archive.
 */
export function Welcome() {
  const family = useFamily();
  const settings = useQuery(api.family.getSettings);
  const loadSample = useMutation(api.family.loadSampleFamily);
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = settings?.familyName;
  const hasPeople = !!family && family.list.length > 0;

  return (
    <div className="flex min-h-full flex-col bg-cream text-ink">
      <div className="grid flex-1 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col justify-center px-8 py-16 sm:px-14 lg:px-20">
          <p className="text-xs uppercase tracking-[0.3em] text-ochre-deep">Imvelaphi · where we come from</p>
          <h1 className="mt-5 max-w-xl font-display text-6xl font-semibold leading-[0.95] sm:text-7xl">
            {name ? (
              <>
                Begin the <span className="italic text-ochre-deep">{name}</span> family&apos;s story
              </>
            ) : (
              <>
                Begin your family&apos;s <span className="italic text-ochre-deep">story</span>
              </>
            )}
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ink/70">
            Add yourself or the eldest relative you know. Branch out to parents, partners and children, add photos, and
            ask questions about everyone you&apos;ve recorded.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {family === undefined ? (
              <div className="h-11 w-56 animate-pulse rounded-full bg-mist" />
            ) : hasPeople ? (
              <>
                <Link href="/overview" className={btnPrimary}>
                  Enter the family archive <ArrowRight size={16} />
                </Link>
                <button type="button" onClick={() => setAdding(true)} className={btnSecondary}>
                  <UserPlus size={16} /> Add a family member
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setAdding(true)} className={btnPrimary}>
                  <UserPlus size={16} /> Add the first person
                </button>
                <button
                  type="button"
                  onClick={() =>
                    loadSample()
                      .then(() => router.push("/overview"))
                      .catch((e) => setError(errorMessage(e)))
                  }
                  className={btnSecondary}
                >
                  Explore a sample family
                </button>
              </>
            )}
          </div>
          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        </div>
        <div className="relative hidden lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/heritage/gathering.jpg"
            alt="Women gathered on the grass beside a thatched rondavel"
            className="duotone absolute inset-0 h-full w-full object-cover object-[50%_65%]"
          />
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-cream to-transparent" />
        </div>
      </div>
      <UmbhacoBand height={46} />
      {adding && family && (
        <PersonEditor mode={{ kind: "new" }} family={family} onClose={() => setAdding(false)} onSaved={(id) => router.push(`/people/${id}`)} />
      )}
    </div>
  );
}
