"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { fullName } from "@/lib/people";
import { upcomingBirthdays } from "@/lib/birthdays";
import { type Family } from "@/lib/use-family";
import { Portrait } from "@/components/people/portrait";
import { Card } from "./card";

export function UpcomingBirthdays({ family, className }: { family: Family; className?: string }) {
  const upcoming = useMemo(() => upcomingBirthdays(family.list).slice(0, 4), [family]);

  return (
    <Card
      title="Coming birthdays"
      action={
        <Link
          href="/birthdays"
          className="inline-flex items-center gap-1 text-sm font-medium text-ochre-deep hover:underline"
        >
          All birthdays <ArrowRight size={14} />
        </Link>
      }
      className={className}
    >
      {upcoming.length === 0 ? (
        <p className="text-sm text-muted">Add full birth dates (like 1985-04-12) to be reminded of birthdays.</p>
      ) : (
        <ul className="space-y-3">
          {upcoming.map(({ person: p, days, turning, next }) => (
            <li key={p._id}>
              <Link
                href={`/people/${p._id}`}
                className="flex items-center gap-3 rounded-2xl p-1.5 transition-colors hover:bg-cream"
              >
                <Portrait person={p} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{fullName(p)}</span>
                  <span className="block text-xs text-muted">
                    Turns {turning} · {next.toLocaleDateString("en-ZA", { day: "numeric", month: "long" })}
                  </span>
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    days <= 7 ? "bg-marigold text-ink" : "bg-marigold-soft text-marigold-deep"
                  }`}
                >
                  {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
