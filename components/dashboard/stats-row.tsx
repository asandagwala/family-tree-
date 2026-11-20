"use client";

import { useMemo } from "react";
import { layoutTree } from "@/lib/tree-layout";
import { type Family } from "@/lib/use-family";

// Each headline number wears one of the palette's colours.
const STAT_COLOURS = ["text-ochre-deep", "text-bead-blue-deep", "text-forest", "text-marigold-deep"];

export function StatsRow({ family }: { family: Family }) {
  const stats = useMemo(() => {
    const layout = layoutTree({
      ids: family.list.map((p) => p._id),
      parentLinks: family.parentLinks,
      partnerships: family.partnerships,
    });
    const gens = new Set([...layout.nodes.values()].map((n) => n.gen)).size;
    const living = family.list.filter((p) => !p.deathDate).length;
    const places = new Set(
      family.list
        .flatMap((p) => [p.birthPlace, p.currentPlace])
        .filter(Boolean)
        .map((s) => s!.toLowerCase()),
    ).size;
    return [
      { label: "Family members", value: family.list.length },
      { label: "Generations", value: gens },
      { label: "Living", value: living },
      { label: "Places", value: places },
    ];
  }, [family]);

  return (
    <dl className="mt-10 grid grid-cols-2 gap-y-5 border-t border-ink/10 pt-6 sm:grid-cols-4">
      {stats.map((s, i) => (
        <div key={s.label} className={i > 0 ? "sm:border-l sm:border-ink/10 sm:pl-5" : ""}>
          <dt className="text-[11px] font-medium uppercase tracking-wider text-muted">{s.label}</dt>
          <dd className={`mt-1 font-display text-4xl font-semibold leading-none ${STAT_COLOURS[i]}`}>{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
