"use client";

import { useMutation } from "convex/react";
import { Camera } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { errorMessage, fullName, genderLabel, type Gender, type Person, type PersonId } from "@/lib/people";
import { uploadImage } from "@/lib/upload";
import type { Family } from "@/lib/use-family";
import { btnPrimary, btnSecondary, inputCls, Modal } from "./ui/modal";

export type Relation = "parent" | "partner" | "child";

export type EditorMode =
  | { kind: "new"; relation?: { type: Relation; of: PersonId } }
  | { kind: "edit"; person: Person };

type Draft = {
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string;
  deathDate: string;
  birthPlace: string;
  currentPlace: string;
  clanName: string;
  occupation: string;
  notes: string;
};

function draftFrom(p?: Partial<Person>): Draft {
  return {
    firstName: p?.firstName ?? "",
    lastName: p?.lastName ?? "",
    gender: p?.gender ?? "unknown",
    birthDate: p?.birthDate ?? "",
    deathDate: p?.deathDate ?? "",
    birthPlace: p?.birthPlace ?? "",
    currentPlace: p?.currentPlace ?? "",
    clanName: p?.clanName ?? "",
    occupation: p?.occupation ?? "",
    notes: p?.notes ?? "",
  };
}

export function PersonEditor({
  mode,
  family,
  onClose,
  onSaved,
}: {
  mode: EditorMode;
  family: Family;
  onClose: () => void;
  onSaved?: (id: PersonId) => void;
}) {
  const createPerson = useMutation(api.family.createPerson);
  const updatePerson = useMutation(api.family.updatePerson);
  const addParent = useMutation(api.family.addParent);
  const addPartner = useMutation(api.family.addPartner);
  const generateUploadUrl = useMutation(api.family.generateUploadUrl);
  const setProfilePhoto = useMutation(api.family.setProfilePhoto);

  const relation = mode.kind === "new" ? mode.relation : undefined;
  const of = relation ? family.people.get(relation.of) : undefined;
  // A child shares the parent's surname and clan by default.
  const inherit = relation?.type === "child" && of ? { lastName: of.lastName, clanName: of.clanName } : undefined;
  // A new child of someone with exactly one partner belongs to both.
  const coParentId =
    relation?.type === "child" && of && (family.partnersOf.get(of._id) ?? []).length === 1
      ? family.partnersOf.get(of._id)![0]
      : undefined;
  const coParent = coParentId ? family.people.get(coParentId) : undefined;

  const [draft, setDraft] = useState<Draft>(() => draftFrom(mode.kind === "edit" ? mode.person : inherit));
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(mode.kind === "edit" ? mode.person.photoUrl : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Free the local preview URL when it changes or the editor closes.
  useEffect(() => {
    if (!preview?.startsWith("blob:")) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const title =
    mode.kind === "edit"
      ? `Edit ${fullName(mode.person)}`
      : relation && of
        ? `Add ${relation.type === "child" ? "a child" : relation.type === "parent" ? "a parent" : "a partner"}`
        : "Add a family member";
  const subtitle =
    mode.kind === "new" && relation && of
      ? `${relation.type === "child" ? "Child" : relation.type === "parent" ? "Parent" : "Partner"} of ${fullName(of)}${
          coParent ? ` and ${fullName(coParent)}` : ""
        }`
      : mode.kind === "new"
        ? "Start with what you know. You can always add more later."
        : undefined;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      let id: PersonId;
      if (mode.kind === "edit") {
        id = mode.person._id;
        await updatePerson({ id, ...draft });
      } else {
        id = await createPerson(draft);
        if (relation && of) {
          if (relation.type === "parent") await addParent({ childId: of._id, parentId: id });
          if (relation.type === "child") await addParent({ childId: id, parentId: of._id });
          if (relation.type === "partner") await addPartner({ personId: of._id, partnerId: id });
          if (coParentId) await addParent({ childId: id, parentId: coParentId });
        }
      }
      if (photo) {
        const storageId: Id<"_storage"> = await uploadImage(photo, () => generateUploadUrl());
        await setProfilePhoto({ personId: id, storageId });
      }
      onSaved?.(id);
      onClose();
    } catch (err) {
      setError(err instanceof Error && !("data" in err) ? err.message : errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={title} subtitle={subtitle} onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <div className="flex items-center gap-5">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="group relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-mist to-silver ring-2 ring-silver ring-offset-4 ring-offset-paper"
            aria-label="Choose a portrait photo"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <Camera className="text-slate" size={26} strokeWidth={1.5} />
            )}
            <span className="absolute inset-0 grid place-items-center bg-ink/50 text-xs font-medium text-mist opacity-0 transition-opacity group-hover:opacity-100">
              {preview ? "Change" : "Add photo"}
            </span>
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setPhoto(file);
              if (file) setPreview(URL.createObjectURL(file));
            }}
          />
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="First name">
              <input
                required
                autoFocus
                value={draft.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Surname">
              <input value={draft.lastName} onChange={(e) => set("lastName", e.target.value)} className={inputCls} />
            </Field>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Clan name (isiduko)">
            <input
              value={draft.clanName}
              onChange={(e) => set("clanName", e.target.value)}
              placeholder="e.g. Jola, Tshawe, Madiba"
              className={inputCls}
            />
          </Field>
          <Field label="Gender">
            <select value={draft.gender} onChange={(e) => set("gender", e.target.value as Gender)} className={inputCls}>
              {(Object.keys(genderLabel) as Gender[]).map((g) => (
                <option key={g} value={g}>
                  {genderLabel[g]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Born" hint="A year or a full date">
            <input
              value={draft.birthDate}
              onChange={(e) => set("birthDate", e.target.value)}
              placeholder="1952 or 1952-03-14"
              className={inputCls}
            />
          </Field>
          <Field label="Passed away" hint="Leave blank if living">
            <input
              value={draft.deathDate}
              onChange={(e) => set("deathDate", e.target.value)}
              placeholder="Year or full date"
              className={inputCls}
            />
          </Field>
          <Field label="Place of birth">
            <input value={draft.birthPlace} onChange={(e) => set("birthPlace", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Lives in">
            <input
              value={draft.currentPlace}
              onChange={(e) => set("currentPlace", e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>
        <Field label="Occupation">
          <input value={draft.occupation} onChange={(e) => set("occupation", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Their story" hint="Memories, achievements, sayings: anything worth passing on">
          <textarea
            rows={4}
            value={draft.notes}
            onChange={(e) => set("notes", e.target.value)}
            className={`${inputCls} resize-y`}
          />
        </Field>

        {error && <p className="rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-800">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? "Saving…" : mode.kind === "edit" ? "Save changes" : "Add to the family"}
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
        <span className="text-xs font-medium uppercase tracking-wider text-slate">{props.label}</span>
        {props.hint && <span className="text-[11px] text-muted">{props.hint}</span>}
      </span>
      {props.children}
    </label>
  );
}
