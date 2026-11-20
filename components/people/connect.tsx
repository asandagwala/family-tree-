"use client";

import { Pencil } from "lucide-react";
import { type Person } from "@/lib/people";
import { contactLinks } from "@/lib/contact";
import { btnGhost } from "@/components/ui/modal";

export function Connect({ person, onEdit }: { person: Person; onEdit: () => void }) {
  const links = contactLinks(person);
  if (person.deathDate) return null;
  return (
    <section className="animate-rise rounded-[1.75rem] border border-line bg-card p-7">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-night">Stay in touch</h2>
        {links.length > 0 && (
          <button type="button" onClick={onEdit} className={`${btnGhost} px-2 text-xs`}>
            <Pencil size={13} /> Edit
          </button>
        )}
      </div>
      {links.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          No WhatsApp or social handles yet.{" "}
          <button type="button" onClick={onEdit} className="font-medium text-ochre-deep hover:underline">
            Add them
          </button>
        </p>
      ) : (
        <ul className="mt-3 space-y-1">
          {links.map((l) => (
            <li key={l.key}>
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2 hover:bg-paper"
              >
                <span className="text-sm font-medium">{l.label}</span>
                <span className="truncate text-sm text-muted">{l.detail}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
