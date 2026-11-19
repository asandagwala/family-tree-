"use client";

import { Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { MonoBeadTrim } from "./beadwork";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { fullName, lifespan } from "@/lib/people";
import { useFamily } from "@/lib/use-family";
import { PersonEditor } from "./person-editor";
import { Portrait } from "./portrait";

// Black-and-white page: a black primary button instead of the usual green.
const btnMono =
  "inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-coal disabled:opacity-50";

type Filter = "all" | "living" | "remembered";

export function PeopleDirectory() {
  const family = useFamily();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [adding, setAdding] = useState(false);

  const people = useMemo(() => {
    if (!family) return [];
    const q = query.trim().toLowerCase();
    return family.list
      .filter((p) => (filter === "all" ? true : filter === "living" ? !p.deathDate : !!p.deathDate))
      .filter((p) =>
        !q
          ? true
          : [fullName(p), p.clanName, p.birthPlace, p.currentPlace, p.occupation]
              .filter(Boolean)
              .some((s) => s!.toLowerCase().includes(q)),
      )
      .sort((a, b) => (a.birthDate ?? "9999").localeCompare(b.birthDate ?? "9999"));
  }, [family, query, filter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-muted">The family</p>
          <h1 className="mt-1 font-display text-5xl font-semibold text-ink">People</h1>
        </div>
        <button type="button" onClick={() => setAdding(true)} className={btnMono} disabled={!family}>
          <UserPlus size={16} /> Add a family member
        </button>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1 sm:max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, clan, place…"
            className="w-full rounded-full border border-line bg-card py-2.5 pl-10 pr-4 text-sm outline-none focus:border-ink"
          />
        </div>
        <div className="flex rounded-full border border-line bg-card p-1" role="tablist" aria-label="Filter people">
          {(["all", "living", "remembered"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm capitalize transition-colors ${
                filter === f ? "bg-ink text-white" : "text-ink/70 hover:bg-paper"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {!family ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-[1.75rem] bg-mist/60" />
          ))}
        </div>
      ) : family.list.length === 0 ? (
        <p className="mt-16 text-center text-muted">No one has been added yet. Start with yourself or the eldest relative you know.</p>
      ) : people.length === 0 ? (
        <p className="mt-16 text-center text-muted">No one matches that search.</p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {people.map((p, i) => (
            <li key={p._id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
              <Link
                href={`/people/${p._id}`}
                className="group flex h-full flex-col items-center overflow-hidden rounded-[1.75rem] border border-line bg-card text-center transition-all hover:-translate-y-0.5 hover:border-ink/40 hover:shadow-lg"
              >
                <div className="w-full">
                  <div className="h-12 bg-ink" />
                  <MonoBeadTrim height={18} />
                </div>
                <Portrait person={p} size={84} mono className="-mt-14 ring-offset-card" />
                <div className="flex flex-1 flex-col px-4 pb-5 pt-3">
                  <p className="font-display text-xl font-semibold leading-tight text-ink">{fullName(p)}</p>
                  <p className="mt-1 text-xs text-muted">{lifespan(p) || "Dates unknown"}</p>
                  {p.clanName && (
                    <span className="mx-auto mt-3 rounded-full bg-ink px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white">
                      {p.clanName}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {adding && family && (
        <PersonEditor mode={{ kind: "new" }} family={family} onClose={() => setAdding(false)} onSaved={(id) => router.push(`/people/${id}`)} />
      )}
    </div>
  );
}
