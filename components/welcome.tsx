"use client";

import { useMutation, useQuery } from "convex/react";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { errorMessage } from "@/lib/people";
import { useSampleMode } from "@/lib/sample-mode";
import { useFamily } from "@/lib/use-family";
import { UmbhacoBand } from "./beadwork";
import { PersonEditor } from "./person-editor";
import { btnPrimary, btnSecondary } from "./ui/modal";

/**
 * The front door: words on the left, the archive photograph filling the right.
 * An empty tree offers to start it; a tree with people leads into the archive.
 */
export function Welcome() {
  const family = useFamily({ sample: false });
  const { enterSample, exitSample } = useSampleMode();
  const settings = useQuery(api.family.getSettings);
  const loadSample = useMutation(api.family.loadSampleFamily);
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = settings?.familyName;
  const hasPeople = !!family && family.list.length > 0;

  return (
    <div className="@container flex min-h-full flex-col bg-cream text-ink">
      <div className="grid flex-1 @3xl:grid-cols-[1.25fr_1fr]">
        {/* Slightly above centre (more space below than above), so the top never feels empty. */}
        <div className="flex flex-col justify-center px-8 pb-16 pt-10 @xl:px-14 @3xl:order-1 @3xl:pb-28 @5xl:px-20">
          <p className="text-xs uppercase tracking-[0.3em] text-ochre-deep">Imvelaphi · where we come from</p>
          <h1 className="mt-6 max-w-2xl font-display text-5xl font-semibold leading-[1.04] @xl:text-6xl @4xl:text-7xl @6xl:text-8xl">
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
          <p className="mt-7 max-w-lg text-lg leading-relaxed text-ink/70">
            Add yourself or the eldest relative you know. Branch out to parents, partners and children, add photos, and
            ask questions about everyone you&apos;ve recorded.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            {family === undefined ? (
              <div className="h-11 w-56 animate-pulse rounded-full bg-mist" />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    exitSample();
                    setAdding(true);
                  }}
                  className={btnPrimary}
                >
                  <UserPlus size={16} /> {hasPeople ? "Add a family member" : "Add the first person"}
                </button>
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
              </>
            )}
          </div>
          {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        </div>
        <div className="relative order-first h-56 @xl:h-72 @3xl:order-2 @3xl:h-auto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/heritage/gathering.jpg"
            alt="Women gathered on the grass beside a thatched rondavel"
            className="duotone absolute inset-0 h-full w-full object-cover object-[50%_65%]"
          />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-cream to-transparent @3xl:inset-x-auto @3xl:inset-y-0 @3xl:left-0 @3xl:h-auto @3xl:w-32 @3xl:bg-gradient-to-r" />
        </div>
      </div>
      <UmbhacoBand height={30} />
      {adding && family && (
        <PersonEditor mode={{ kind: "new" }} family={family} onClose={() => setAdding(false)} onSaved={(id) => router.push(`/people/${id}`)} />
      )}
    </div>
  );
}
