"use client";

import { useMutation, useQuery } from "convex/react";
import { ArrowUp, Check, Network, Pencil, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { fullName, year, type Person } from "@/lib/people";
import { useSampleMode } from "@/lib/sample-mode";
import { type Family } from "@/lib/use-family";
import { AskIcon } from "@/components/brand/ask-icon";
import { UmbhacoBand } from "@/components/brand/beadwork";
import { useChat } from "@/components/chat/chat-context";
import { StatsRow } from "./stats-row";
import { FamilyClan } from "./roots-and-clans";

/** The top of the overview: the family's name, a search, quick questions for the assistant, and the photograph. */

function familyName(list: Person[]) {
  const counts = new Map<string, number>();
  for (const p of list) if (p.lastName) counts.set(p.lastName, (counts.get(p.lastName) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

export function Hero({ family, onAdd }: { family: Family; onAdd: () => void }) {
  const chat = useChat();
  const [q, setQ] = useState("");
  const settings = useQuery(api.families.getSettings);
  const saveFamilyName = useMutation(api.families.setFamilyName);
  const [editingName, setEditingName] = useState<string | null>(null);
  const { sample } = useSampleMode();
  // The saved family name wins; otherwise guess from the most common surname.
  // The sample family always goes by its own surname.
  const name = (!sample && settings?.familyName) || familyName(family.list);
  const elders = family.list
    .filter((p) => year(p.birthDate))
    .sort((a, b) => (a.birthDate ?? "").localeCompare(b.birthDate ?? ""));
  const root = elders[0];

  return (
    <section className="relative overflow-hidden bg-cream text-ink">
      <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        {/* A tall column suits the portrait photo: the women and the hills both fit, no fade. */}
        <div className="relative h-72 sm:h-96 lg:h-auto lg:min-h-[600px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/heritage/walking-colour.jpg"
            alt="Two young women in white beaded dress walking past homesteads in the hills"
            className="absolute inset-0 h-full w-full object-cover object-[50%_80%] sepia-[.12] saturate-[.9]"
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-12 lg:px-14 lg:py-14">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-bead-blue-deep">Imvelaphi · where we come from</p>
            {editingName !== null ? (
              <form
                className="mt-4 flex flex-wrap items-center gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await saveFamilyName({ familyName: editingName });
                  setEditingName(null);
                }}
              >
                <label className="sr-only" htmlFor="family-name">
                  Family name
                </label>
                <input
                  id="family-name"
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setEditingName(null)}
                  placeholder="Family name"
                  className="min-w-0 flex-1 rounded-2xl border border-line bg-card px-4 py-2 font-display text-4xl font-semibold text-ink outline-none focus:border-ochre"
                />
                <button
                  type="submit"
                  className="grid h-11 w-11 place-items-center rounded-full bg-ochre-deep text-white"
                  aria-label="Save family name"
                >
                  <Check size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingName(null)}
                  className="grid h-11 w-11 place-items-center rounded-full border border-line text-muted"
                  aria-label="Cancel"
                >
                  <X size={18} />
                </button>
              </form>
            ) : (
              <h1 className="group mt-4 font-display text-5xl font-semibold leading-[0.95] sm:text-6xl">
                {name ? (
                  <>
                    The <span className="italic text-ochre-deep">{name}</span>
                    <br />
                    family
                  </>
                ) : (
                  "Our family"
                )}
                {!sample && (
                  <button
                    type="button"
                    onClick={() => setEditingName(name ?? "")}
                    className="ml-3 inline-grid h-9 w-9 place-items-center rounded-full border border-line align-middle text-muted opacity-60 transition-opacity hover:bg-card hover:opacity-100 focus:opacity-100 group-hover:opacity-100"
                    aria-label="Change family name"
                    title="Change family name"
                  >
                    <Pencil size={15} />
                  </button>
                )}
              </h1>
            )}
            {settings && !sample && <FamilyClan settings={settings} />}
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink/70">
              {family.list.length} people across the generations
              {root?.birthPlace ? `, with roots in ${root.birthPlace}` : ""}
              {root
                ? `${root.birthPlace ? "," : ""} going back to ${fullName(root)}, born ${year(root.birthDate)}.`
                : "."}
            </p>
          </div>

          <div className="mt-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!q.trim()) return;
                chat.open(q);
                setQ("");
              }}
              className="flex items-center gap-2 rounded-full border border-line bg-card py-1.5 pl-5 pr-1.5 text-ink shadow-sm focus-within:border-ochre"
            >
              <AskIcon size={18} className="shrink-0 text-ink" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ask anything about the family…"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted/80"
                aria-label="Ask the family assistant"
              />
              <button
                type="submit"
                aria-label="Ask"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ochre-deep text-white transition-colors hover:bg-ochre"
              >
                <ArrowUp size={16} />
              </button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Who are the elders?", "Where are we from?", "Tell me a family story"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => chat.open(s)}
                  className="rounded-full border border-ink/15 px-3.5 py-1.5 text-xs text-ink/80 transition-colors hover:bg-card"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/tree"
                className="inline-flex items-center gap-2 rounded-full bg-ochre-deep px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ochre"
              >
                <Network size={16} /> Explore the tree
              </Link>
              <button
                type="button"
                onClick={onAdd}
                className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-card px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink/40"
              >
                <UserPlus size={16} /> Add a relative
              </button>
            </div>
          </div>

          <StatsRow family={family} />
        </div>
      </div>
      <UmbhacoBand height={30} />
    </section>
  );
}
