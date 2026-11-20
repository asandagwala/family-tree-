"use client";

import { useQuery } from "convex/react";
import { ImageIcon, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { gatheringKindLabel } from "@/lib/gatherings";
import { formatDate, fullName } from "@/lib/people";
import { useSampleMode } from "@/lib/sample-mode";
import { useFamily } from "@/lib/use-family";
import { GatheringEditor } from "./gathering-editor";
import { Portrait } from "@/components/people/portrait";
import { btnPrimary } from "@/components/ui/modal";

export function AlbumView() {
  const { sample } = useSampleMode();
  const gatherings = useQuery(api.album.listGatherings, { sample });
  const family = useFamily();
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-ochre-deep">The family</p>
          <h1 className="mt-1 font-display text-5xl font-semibold text-ink">Album</h1>
          <p className="mt-2 max-w-lg text-sm text-muted">
            Weddings, umemulo, graduations, reunions and the days we said goodbye. Every gathering gets its own page of
            photos.
          </p>
        </div>
        <button type="button" onClick={() => setCreating(true)} className={btnPrimary} disabled={!family}>
          <Plus size={16} /> New gathering
        </button>
      </header>

      {gatherings === undefined ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-[1.75rem] bg-mist" />
          ))}
        </div>
      ) : gatherings.length === 0 ? (
        <div className="mt-10 rounded-[1.75rem] border border-dashed border-silver bg-card px-6 py-16 text-center">
          <ImageIcon className="mx-auto text-ochre" size={32} strokeWidth={1.5} />
          <h2 className="mt-4 font-display text-3xl font-semibold">Start the family album</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Create a gathering, then add its photos and tag who was there. Old photos are welcome, even a phone picture
            of a printed one.
          </p>
          <button type="button" onClick={() => setCreating(true)} className={`${btnPrimary} mt-6`} disabled={!family}>
            <Plus size={16} /> Create the first gathering
          </button>
        </div>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {gatherings.map((g, i) => (
            <li key={g._id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 9) * 40}ms` }}>
              <Link
                href={`/album/${g._id}`}
                className="group block overflow-hidden rounded-[1.75rem] border border-line bg-card transition-shadow hover:shadow-lg"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-cream">
                  {g.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={g.coverUrl}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-muted">
                      <ImageIcon size={28} strokeWidth={1.5} />
                    </div>
                  )}
                  <span className="absolute left-4 top-4 rounded-full bg-card/95 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-ink">
                    {gatheringKindLabel[g.kind]}
                  </span>
                </div>
                <div className="p-5">
                  <h2 className="font-display text-2xl font-semibold leading-tight text-ink">{g.title}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {[formatDate(g.date), g.place].filter(Boolean).join(" · ") || "Date and place to add"}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {g.peopleIds.slice(0, 6).map((id) => {
                        const p = family?.people.get(id);
                        return p ? (
                          <span key={id} title={fullName(p)} className="rounded-full ring-2 ring-card">
                            <Portrait person={p} size={28} ring={false} />
                          </span>
                        ) : null;
                      })}
                    </div>
                    <span className="text-xs text-muted">
                      {g.photoCount} {g.photoCount === 1 ? "photo" : "photos"}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {creating && family && (
        <GatheringEditor
          family={family}
          onClose={() => setCreating(false)}
          onSaved={(id) => router.push(`/album/${id}`)}
        />
      )}
    </div>
  );
}
