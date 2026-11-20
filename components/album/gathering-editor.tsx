"use client";

import { useMutation } from "convex/react";
import { Check, Search } from "lucide-react";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { GATHERING_KINDS, gatheringKindLabel, type GatheringKind } from "@/lib/gatherings";
import { errorMessage, fullName, type PersonId } from "@/lib/people";
import { useSampleMode } from "@/lib/sample-mode";
import type { Family } from "@/lib/use-family";
import { Portrait } from "@/components/people/portrait";
import { btnPrimary, btnSecondary, inputCls, Modal } from "@/components/ui/modal";

type Draft = {
  title: string;
  kind: GatheringKind;
  date: string;
  place: string;
  story: string;
  peopleIds: PersonId[];
};

export function GatheringEditor({
  gathering,
  family,
  onClose,
  onSaved,
}: {
  gathering?: Doc<"gatherings">;
  family: Family;
  onClose: () => void;
  onSaved?: (id: Id<"gatherings">) => void;
}) {
  const create = useMutation(api.album.createGathering);
  const { sample } = useSampleMode();
  const update = useMutation(api.album.updateGathering);
  const [draft, setDraft] = useState<Draft>({
    title: gathering?.title ?? "",
    kind: gathering?.kind ?? "other",
    date: gathering?.date ?? "",
    place: gathering?.place ?? "",
    story: gathering?.story ?? "",
    peopleIds: gathering?.peopleIds ?? [],
  });
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const people = useMemo(() => {
    const term = q.trim().toLowerCase();
    return [...family.list]
      .filter((p) => !term || fullName(p).toLowerCase().includes(term))
      .sort((a, b) => fullName(a).localeCompare(fullName(b)));
  }, [family, q]);

  const toggle = (id: PersonId) =>
    set("peopleIds", draft.peopleIds.includes(id) ? draft.peopleIds.filter((x) => x !== id) : [...draft.peopleIds, id]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (gathering) {
        await update({ id: gathering._id, ...draft });
        onSaved?.(gathering._id);
      } else {
        const id = await create({ ...draft, sample });
        onSaved?.(id);
      }
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={gathering ? `Edit ${gathering.title}` : "New gathering"}
      subtitle={gathering ? undefined : "A wedding, umemulo, reunion or any time the family came together."}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
          <Field label="Name">
            <input
              required
              autoFocus
              value={draft.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Luthando and Ayanda's wedding"
              className={inputCls}
            />
          </Field>
          <Field label="Kind">
            <select value={draft.kind} onChange={(e) => set("kind", e.target.value as GatheringKind)} className={inputCls}>
              {GATHERING_KINDS.map((k) => (
                <option key={k} value={k}>
                  {gatheringKindLabel[k]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="When" hint="A year or a full date">
            <input value={draft.date} onChange={(e) => set("date", e.target.value)} placeholder="1992 or 1992-12-19" className={inputCls} />
          </Field>
          <Field label="Where">
            <input value={draft.place} onChange={(e) => set("place", e.target.value)} placeholder="Village, town or venue" className={inputCls} />
          </Field>
        </div>
        <Field label="The story" hint="What happened, who spoke, what people still talk about">
          <textarea rows={3} value={draft.story} onChange={(e) => set("story", e.target.value)} className={`${inputCls} resize-y`} />
        </Field>

        <div>
          <div className="mb-2 flex items-baseline justify-between px-1">
            <span className="text-xs font-medium uppercase tracking-wider text-muted">Who was there</span>
            <span className="text-xs text-muted">{draft.peopleIds.length} selected</span>
          </div>
          <div className="rounded-2xl border border-line bg-card">
            <div className="relative border-b border-line">
              <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Find someone"
                className="w-full rounded-t-2xl bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none"
              />
            </div>
            <ul className="grid max-h-56 grid-cols-1 gap-1 overflow-y-auto p-2 scrollbar-thin sm:grid-cols-2">
              {people.map((p) => {
                const on = draft.peopleIds.includes(p._id);
                return (
                  <li key={p._id}>
                    <button
                      type="button"
                      onClick={() => toggle(p._id)}
                      aria-pressed={on}
                      className={`flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left text-sm transition-colors ${
                        on ? "bg-ochre-soft" : "hover:bg-paper"
                      }`}
                    >
                      <Portrait person={p} size={30} ring={false} />
                      <span className="flex-1 truncate">{fullName(p)}</span>
                      {on && <Check size={15} className="text-ochre-deep" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {error && <p className="rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-800">{error}</p>}

        <div className="flex gap-3">
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? "Saving…" : gathering ? "Save changes" : "Create gathering"}
          </button>
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field(props: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-2 px-1">
        <span className="text-xs font-medium uppercase tracking-wider text-muted">{props.label}</span>
        {props.hint && <span className="text-[11px] text-muted">{props.hint}</span>}
      </span>
      {props.children}
    </label>
  );
}
