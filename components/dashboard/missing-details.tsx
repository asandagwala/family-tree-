"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { fullName } from "@/lib/people";
import { type Family } from "@/lib/use-family";
import { Portrait } from "@/components/people/portrait";
import { Card } from "./card";

export function MissingDetails({ family }: { family: Family }) {
  const gaps = useMemo(() => {
    return family.list
      .map((p) => {
        const missing = [
          !p.photoUrl && "portrait",
          !p.birthDate && "birth date",
          !p.birthPlace && "birthplace",
          !p.clanName && "clan name",
          !p.notes && "story",
        ].filter(Boolean) as string[];
        return { p, missing };
      })
      .filter((g) => g.missing.length > 0)
      .sort((a, b) => b.missing.length - a.missing.length)
      .slice(0, 5);
  }, [family]);

  return (
    <Card
      title="Help complete the story"
      action={
        <Link
          href="/people"
          className="inline-flex items-center gap-1 text-sm font-medium text-ochre-deep hover:underline"
        >
          All people <ArrowRight size={14} />
        </Link>
      }
    >
      {gaps.length === 0 ? (
        <p className="text-sm text-muted">Everyone&apos;s profile is complete. Beautiful.</p>
      ) : (
        <ul className="divide-y divide-line">
          {gaps.map(({ p, missing }) => (
            <li key={p._id}>
              <Link
                href={`/people/${p._id}`}
                className="flex items-center gap-3 py-2.5 transition-colors hover:text-ochre-deep"
              >
                <Portrait person={p} size={36} ring={false} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{fullName(p)}</span>
                  <span className="block truncate text-xs text-muted">Missing {missing.join(", ")}</span>
                </span>
                <ArrowRight size={15} className="text-ochre" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
