"use client";

import { MapPin, Pencil, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { fullName, type Person } from "@/lib/people";
import { type Family } from "@/lib/use-family";
import { FamilyDetailsEditor, type FamilySettings } from "@/components/family/family-details-editor";
import { Portrait } from "@/components/people/portrait";
import { Card } from "./card";

/** Where the family comes from: home places, everyone's clan names, and the family's own isiduko and izithakazelo. */

export function Roots({ family }: { family: Family }) {
  const places = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of family.list) if (p.birthPlace) counts.set(p.birthPlace, (counts.get(p.birthPlace) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [family]);
  const max = Math.max(1, ...places.map(([, n]) => n));

  return (
    <Card title="Where we were born" action={<MapPin size={20} className="text-bead-blue" />}>
      {places.length === 0 ? (
        <p className="text-sm text-muted">Add birthplaces to map the family&apos;s roots.</p>
      ) : (
        <ul className="space-y-3.5">
          {places.map(([place, n]) => (
            <li key={place}>
              <div className="mb-1.5 flex justify-between text-sm">
                <span>{place}</span>
                <span className="text-muted">{n}</span>
              </div>
              <div className="h-2 rounded-full bg-bead-blue-soft">
                <div className="h-2 rounded-full bg-bead-blue" style={{ width: `${(n / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export function ClanNames({ family }: { family: Family }) {
  const clans = useMemo(() => {
    const m = new Map<string, Person[]>();
    for (const p of family.list) if (p.clanName) m.set(p.clanName, [...(m.get(p.clanName) ?? []), p]);
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [family]);

  return (
    <Card
      title="Iziduko · clan names"
      action={
        <span className="block h-20 w-20 shrink-0 overflow-hidden rounded-full ring-4 ring-cream">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/heritage/beadwork.jpg"
            alt="A beaded collar"
            className="duotone h-full w-full object-cover object-bottom"
          />
        </span>
      }
    >
      {clans.length === 0 ? (
        <p className="text-sm text-muted">Record clan names to honour each line of the family.</p>
      ) : (
        <div className="space-y-4">
          {clans.map(([clan, members]) => (
            <div key={clan} className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="w-36 shrink-0 truncate font-display text-2xl font-semibold text-ink">{clan}</span>
              <div className="flex -space-x-2">
                {members.slice(0, 6).map((p) => (
                  <Link
                    key={p._id}
                    href={`/people/${p._id}`}
                    title={fullName(p)}
                    className="rounded-full ring-2 ring-card"
                  >
                    <Portrait person={p} size={34} ring={false} />
                  </Link>
                ))}
              </div>
              <span className="ml-auto text-xs text-muted">{members.length}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function FamilyClan({ settings }: { settings: FamilySettings }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="mt-4">
      {settings.clanName ? (
        <button type="button" onClick={() => setEditing(true)} className="group text-left" title="Edit our isiduko">
          <span className="block text-xs uppercase tracking-[0.2em] text-muted">Isiduko</span>
          <span className="mt-0.5 flex items-center gap-2 font-display text-3xl font-semibold text-ink">
            {settings.clanName}
            <Pencil size={13} className="text-muted opacity-0 transition-opacity group-hover:opacity-100" />
          </span>
          {settings.clanPraise && (
            <span className="mt-1 line-clamp-2 block max-w-md font-display text-lg italic leading-snug text-ink/70">
              {settings.clanPraise}
            </span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-ochre/50 px-3.5 py-1.5 text-xs font-medium text-ochre-deep hover:bg-ochre-soft"
        >
          <Plus size={13} /> Add our isiduko and izithakazelo
        </button>
      )}
      {editing && <FamilyDetailsEditor settings={settings} onClose={() => setEditing(false)} />}
    </div>
  );
}
