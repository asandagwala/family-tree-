"use client";

import { useQuery } from "convex/react";
import { ArrowRight, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { contactLinks } from "@/lib/contact";
import { useSampleMode } from "@/lib/sample-mode";
import { type Family } from "@/lib/use-family";
import { FamilyCode } from "@/components/family/family-code";
import { FamilyDetailsEditor } from "@/components/family/family-details-editor";
import { Portrait } from "@/components/people/portrait";
import { Card } from "./card";

export function StayConnected({ family }: { family: Family }) {
  const settings = useQuery(api.families.getSettings);
  const { sample } = useSampleMode();
  const [editing, setEditing] = useState(false);
  const reachable = useMemo(
    () =>
      family.list
        .filter((p) => !p.deathDate)
        .map((p) => ({ p, links: contactLinks(p) }))
        .filter((r) => r.links.length > 0),
    [family],
  );

  return (
    <Card title="Stay connected">
      {sample ? (
        // The WhatsApp group belongs to the real family, not the sample.
        <p className="rounded-2xl bg-paper p-4 text-sm text-muted">
          Your family&apos;s WhatsApp group link will show here.
        </p>
      ) : settings?.whatsappGroupUrl ? (
        <a
          href={settings.whatsappGroupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-2xl bg-forest p-4 text-white transition-colors hover:bg-forest-deep"
        >
          <MessageCircle size={22} />
          <span className="flex-1">
            <span className="block font-medium">Join the family WhatsApp group</span>
            <span className="block text-xs text-white/75">Opens WhatsApp</span>
          </span>
          <ArrowRight size={16} />
        </a>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={!settings}
          className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-silver p-4 text-left text-sm text-muted hover:border-ochre hover:text-ink"
        >
          <MessageCircle size={20} className="text-forest" />
          Add the family WhatsApp group link
        </button>
      )}
      {!sample && settings?.whatsappGroupUrl && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 text-xs text-muted hover:text-ink hover:underline"
        >
          Change group link
        </button>
      )}

      {!sample && settings?.familyCode && <FamilyCode code={settings.familyCode} className="mt-4" />}

      <p className="mt-5 text-xs font-medium uppercase tracking-wider text-muted">Find each other</p>
      {reachable.length === 0 ? (
        <p className="mt-2 text-sm text-muted">
          Add WhatsApp numbers and social handles on each person&apos;s profile so family can reach them.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {reachable.slice(0, 6).map(({ p, links }) => (
            <li key={p._id} className="flex items-center gap-3 py-2">
              <Link href={`/people/${p._id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <Portrait person={p} size={32} ring={false} />
                <span className="truncate text-sm font-medium">{p.firstName}</span>
              </Link>
              <span className="flex flex-wrap justify-end gap-1">
                {links.map((l) => (
                  <a
                    key={l.key}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-mist"
                  >
                    {l.label}
                  </a>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
      {editing && settings && <FamilyDetailsEditor settings={settings} onClose={() => setEditing(false)} />}
    </Card>
  );
}
