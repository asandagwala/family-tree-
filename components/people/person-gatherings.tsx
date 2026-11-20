"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { formatDate, type Person } from "@/lib/people";
import { gatheringKindLabel } from "@/lib/gatherings";

export function PersonGatherings({ person }: { person: Person }) {
  const gatherings = useQuery(api.album.gatheringsFor, { personId: person._id });
  if (!gatherings || gatherings.length === 0) return null;
  return (
    <section className="animate-rise rounded-[1.75rem] border border-line bg-card p-7">
      <h2 className="font-display text-2xl font-semibold text-ink">Gatherings</h2>
      <ul className="mt-4 divide-y divide-line">
        {gatherings.map((g) => (
          <li key={g._id}>
            <Link
              href={`/album/${g._id}`}
              className="flex items-baseline justify-between gap-4 py-3 hover:text-ochre-deep"
            >
              <span className="font-medium">{g.title}</span>
              <span className="shrink-0 text-xs text-muted">
                {[gatheringKindLabel[g.kind], g.date && formatDate(g.date)].filter(Boolean).join(" · ")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
