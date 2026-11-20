"use client";

import { useMemo, useState } from "react";
import { year } from "@/lib/people";
import { type Family } from "@/lib/use-family";
import { Card } from "./card";

export function BirthsByDecade({ family, className }: { family: Family; className?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const data = useMemo(() => {
    const decades = family.list
      .map((p) => year(p.birthDate))
      .filter((y): y is number => !!y)
      .map((y) => Math.floor(y / 10) * 10);
    if (decades.length === 0) return [];
    const min = Math.min(...decades);
    const max = Math.max(...decades);
    const rows: { decade: number; count: number; names: string[] }[] = [];
    for (let d = min; d <= max; d += 10) {
      const born = family.list.filter((p) => {
        const y = year(p.birthDate);
        return y !== undefined && Math.floor(y / 10) * 10 === d;
      });
      rows.push({ decade: d, count: born.length, names: born.map((p) => p.firstName) });
    }
    return rows;
  }, [family]);

  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const H = 160;

  return (
    <Card title="Births by decade" className={className}>
      {data.length === 0 ? (
        <p className="text-sm text-muted">Add birth years to see how the family has grown over time.</p>
      ) : (
        <div>
          <div className="relative flex items-end gap-2 border-b border-line" style={{ height: H }}>
            {[0.5, 1].map((f) => (
              <span
                key={f}
                aria-hidden
                className="absolute inset-x-0 border-t border-dashed border-line"
                style={{ bottom: H * f - 1 }}
              />
            ))}
            {data.map((d, i) => (
              <div
                key={d.decade}
                className="relative flex h-full flex-1 items-end justify-center"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <div
                  className={`w-full max-w-10 rounded-t-[4px] transition-colors ${hover === i ? "bg-ochre-deep" : "bg-ochre"}`}
                  style={{ height: d.count ? (d.count / maxCount) * (H - 16) : 0 }}
                />
                {hover === i && (
                  <div
                    className="absolute z-10 mb-2 w-max max-w-48 -translate-y-1 rounded-2xl bg-ink px-3 py-2 text-xs text-cream shadow-lg"
                    style={{ bottom: (d.count / maxCount) * (H - 16) }}
                  >
                    <p className="font-semibold">
                      {d.decade}s · {d.count} {d.count === 1 ? "birth" : "births"}
                    </p>
                    {d.names.length > 0 && <p className="mt-0.5 text-cream/70">{d.names.join(", ")}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            {data.map((d) => (
              <span key={d.decade} className="flex-1 text-center text-[11px] text-muted">
                {`'${String(d.decade).slice(2)}`}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
