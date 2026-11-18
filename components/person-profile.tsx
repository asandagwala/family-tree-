"use client";

import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Briefcase,
  Camera,
  Home,
  ImagePlus,
  Link2,
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { age, errorMessage, formatDate, fullName, genderLabel, lifespan, type Person, type PersonId } from "@/lib/people";
import { gatheringKindLabel } from "@/lib/gatherings";
import { uploadImage } from "@/lib/upload";
import { siblingsOf, useFamily, type Family } from "@/lib/use-family";
import { UmbhacoBand } from "./beadwork";
import { useChat } from "./chat/chat-context";
import { PersonEditor, type EditorMode, type Relation } from "./person-editor";
import { Lightbox } from "./lightbox";
import { Portrait } from "./portrait";
import { btnGhost, btnPrimary, btnSecondary, Modal } from "./ui/modal";
import { AskIcon } from "./ask-icon";

export function PersonProfile() {
  const params = useParams<{ id: string }>();
  const family = useFamily();
  const id = params.id as PersonId;

  if (family === undefined) {
    return <div className="mx-auto mt-6 h-80 max-w-6xl animate-pulse rounded-[2rem] bg-mist sm:mx-8" />;
  }
  const person = family.people.get(id);
  if (!person) {
    return (
      <div className="grid h-full place-items-center p-8 text-center">
        <div>
          <h1 className="font-display text-4xl font-semibold text-night">We couldn&apos;t find that person</h1>
          <p className="mt-2 text-muted">They may have been removed from the tree.</p>
          <Link href="/people" className={`${btnPrimary} mt-6`}>
            Back to people
          </Link>
        </div>
      </div>
    );
  }
  return <ProfileBody key={person._id} person={person} family={family} />;
}

function ProfileBody({ person, family }: { person: Person; family: Family }) {
  const chat = useChat();
  const router = useRouter();
  const deletePerson = useMutation(api.family.deletePerson);
  const removeParent = useMutation(api.family.removeParent);
  const removePartner = useMutation(api.family.removePartner);
  const [editor, setEditor] = useState<EditorMode | null>(null);
  const [linking, setLinking] = useState<Relation | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parents = family.parentsOf.get(person._id) ?? [];
  const partners = family.partnersOf.get(person._id) ?? [];
  const children = family.childrenOf.get(person._id) ?? [];
  const siblings = siblingsOf(family, person._id);
  const years = age(person);

  const facts: { icon: typeof MapPin; label: string; value?: string }[] = [
    { icon: Star, label: "Born", value: [formatDate(person.birthDate), person.birthPlace].filter(Boolean).join(" · ") || undefined },
    { icon: Star, label: "Passed away", value: formatDate(person.deathDate) },
    { icon: Home, label: "Lives in", value: person.deathDate ? undefined : person.currentPlace },
    { icon: Briefcase, label: "Occupation", value: person.occupation },
    { icon: MapPin, label: "Gender", value: person.gender === "unknown" ? undefined : genderLabel[person.gender] },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
      <Link href="/people" className={`${btnGhost} -ml-3 mb-4`}>
        <ArrowLeft size={16} /> All people
      </Link>

      {/* Hero */}
      <section className="animate-rise relative overflow-hidden rounded-[2rem] border border-line bg-card text-ink">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 opacity-30 md:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/heritage/gathering.jpg" alt="" className="duotone h-full w-full object-cover" />
        </div>
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-r from-card to-transparent md:block" />
        <div className="relative z-10 flex flex-col gap-6 p-7 sm:flex-row sm:items-end sm:p-10">
          <div className="relative">
            <Portrait person={person} size={150} className="ring-offset-card" />
            {!person.photoUrl && (
              <button
                type="button"
                onClick={() => setEditor({ kind: "edit", person })}
                className="absolute bottom-1 right-1 grid h-10 w-10 place-items-center rounded-full bg-forest text-white shadow-lg"
                aria-label="Add a portrait"
                title="Add a portrait"
              >
                <Camera size={17} />
              </button>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {person.clanName && (
              <p className="text-xs uppercase tracking-[0.3em] text-moss">{person.clanName} clan</p>
            )}
            <h1 className="mt-1 font-display text-5xl font-semibold leading-[0.95] sm:text-6xl">
              {person.firstName} <span className="italic text-forest">{person.lastName}</span>
            </h1>
            <p className="mt-3 text-sm text-muted">
              {[lifespan(person), years !== undefined && (person.deathDate ? `lived ${years} years` : `${years} years old`)]
                .filter(Boolean)
                .join(" · ") || "Dates not yet recorded"}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => chat.open(`Tell me about ${fullName(person)}.`)}
                className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-deep"
              >
                <AskIcon size={15} /> Ask about {person.firstName}
              </button>
              <button
                type="button"
                onClick={() => setEditor({ kind: "edit", person })}
                className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-sage hover:bg-mint/40"
              >
                <Pencil size={15} /> Edit details
              </button>
              <Link
                href="/tree"
                className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-sage hover:bg-mint/40"
              >
                See in tree
              </Link>
            </div>
          </div>
        </div>
        <UmbhacoBand height={30} />
      </section>

      {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-800">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* Story */}
          <section className="animate-rise rounded-[1.75rem] border border-line bg-card p-7">
            <h2 className="font-display text-2xl font-semibold text-night">Their story</h2>
            {person.notes ? (
              <p className="mt-3 whitespace-pre-wrap font-display text-xl leading-relaxed text-night/90">{person.notes}</p>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-silver p-5 text-sm text-muted">
                No story recorded yet. What do you remember about {person.firstName}? Their sayings, their work, the
                places they loved.
                <button type="button" onClick={() => setEditor({ kind: "edit", person })} className={`${btnGhost} mt-2 -ml-3 block`}>
                  <Plus size={14} className="inline" /> Write their story
                </button>
              </div>
            )}
            <hr className="my-6 border-line" />
            <dl className="grid gap-4 sm:grid-cols-2">
              {facts
                .filter((f) => f.value)
                .map((f) => (
                  <div key={f.label}>
                    <dt className="text-xs font-medium uppercase tracking-wider text-slate-soft">{f.label}</dt>
                    <dd className="mt-1 text-sm">{f.value}</dd>
                  </div>
                ))}
            </dl>
          </section>

          <Gallery person={person} />
          <PersonGatherings person={person} />
        </div>

        {/* Family */}
        <section className="animate-rise h-fit rounded-[1.75rem] border border-line bg-card p-7">
          <h2 className="font-display text-2xl font-semibold text-night">Family</h2>
          <RelativeGroup
            title="Parents"
            ids={parents}
            family={family}
            onNew={parents.length < 2 ? () => setEditor({ kind: "new", relation: { type: "parent", of: person._id } }) : undefined}
            onLink={parents.length < 2 ? () => setLinking("parent") : undefined}
            onUnlink={(id) => unlink("parent", id)}
          />
          <RelativeGroup
            title="Partners"
            ids={partners}
            family={family}
            onNew={() => setEditor({ kind: "new", relation: { type: "partner", of: person._id } })}
            onLink={() => setLinking("partner")}
            onUnlink={(id) => unlink("partner", id)}
          />
          <RelativeGroup
            title="Children"
            ids={children}
            family={family}
            onNew={() => setEditor({ kind: "new", relation: { type: "child", of: person._id } })}
            onLink={() => setLinking("child")}
            onUnlink={(id) => unlink("child", id)}
          />
          {siblings.length > 0 && <RelativeGroup title="Siblings" ids={siblings} family={family} />}

          <div className="mt-8 border-t border-line pt-5">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 text-sm text-red-700 hover:underline"
            >
              <Trash2 size={14} /> Remove {person.firstName} from the tree
            </button>
          </div>
        </section>
      </div>

      {editor && (
        <PersonEditor
          mode={editor}
          family={family}
          onClose={() => setEditor(null)}
          onSaved={(id) => {
            if (editor.kind === "new" && !editor.relation) router.push(`/people/${id}`);
          }}
        />
      )}
      {linking && (
        <LinkExisting
          relation={linking}
          person={person}
          family={family}
          onClose={() => setLinking(null)}
          onError={setError}
        />
      )}
      {confirmDelete && (
        <Modal title={`Remove ${fullName(person)}?`} onClose={() => setConfirmDelete(false)}>
          <p className="text-sm text-muted">
            This permanently deletes {person.firstName}&apos;s profile, photos and family links. Their relatives stay in the
            tree. This can&apos;t be undone.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              className={`${btnPrimary} bg-red-700 hover:bg-red-800`}
              onClick={async () => {
                try {
                  await deletePerson({ id: person._id });
                  router.push("/people");
                } catch (e) {
                  setError(errorMessage(e));
                  setConfirmDelete(false);
                }
              }}
            >
              Delete permanently
            </button>
            <button type="button" className={btnSecondary} onClick={() => setConfirmDelete(false)}>
              Keep
            </button>
          </div>
        </Modal>
      )}
    </div>
  );

  async function unlink(relation: Relation, otherId: PersonId) {
    try {
      if (relation === "parent") await removeParent({ childId: person._id, parentId: otherId });
      if (relation === "child") await removeParent({ childId: otherId, parentId: person._id });
      if (relation === "partner") await removePartner({ personId: person._id, partnerId: otherId });
    } catch (e) {
      setError(errorMessage(e));
    }
  }
}

function RelativeGroup(props: {
  title: string;
  ids: PersonId[];
  family: Family;
  onNew?: () => void;
  onLink?: () => void;
  onUnlink?: (id: PersonId) => void;
}) {
  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wider text-slate-soft">{props.title}</h3>
        <div className="flex gap-1">
          {props.onLink && (
            <button type="button" onClick={props.onLink} className={`${btnGhost} px-2 text-xs`} title="Link someone already in the tree">
              <Link2 size={13} /> Link
            </button>
          )}
          {props.onNew && (
            <button type="button" onClick={props.onNew} className={`${btnGhost} px-2 text-xs`}>
              <Plus size={13} /> New
            </button>
          )}
        </div>
      </div>
      {props.ids.length === 0 ? (
        <p className="rounded-2xl bg-paper px-4 py-3 text-sm text-muted">None recorded</p>
      ) : (
        <ul className="space-y-1">
          {props.ids.map((id) => {
            const p = props.family.people.get(id);
            if (!p) return null;
            return (
              <li key={id} className="group flex items-center gap-3 rounded-2xl p-1.5 hover:bg-mist/40">
                <Link href={`/people/${id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Portrait person={p} size={42} ring={false} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{fullName(p)}</span>
                    <span className="block text-xs text-muted">{lifespan(p)}</span>
                  </span>
                </Link>
                {props.onUnlink && (
                  <button
                    type="button"
                    onClick={() => props.onUnlink!(id)}
                    className="grid h-8 w-8 place-items-center rounded-full text-muted opacity-0 transition-opacity hover:bg-card hover:text-night focus:opacity-100 group-hover:opacity-100"
                    title="Remove this link (keeps the person)"
                    aria-label={`Unlink ${fullName(p)}`}
                  >
                    <X size={14} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function LinkExisting(props: {
  relation: Relation;
  person: Person;
  family: Family;
  onClose: () => void;
  onError: (m: string) => void;
}) {
  const addParent = useMutation(api.family.addParent);
  const addPartner = useMutation(api.family.addPartner);
  const [q, setQ] = useState("");
  const { relation, person, family } = props;
  const already = new Set([
    person._id,
    ...(relation === "parent" ? family.parentsOf : relation === "child" ? family.childrenOf : family.partnersOf).get(person._id) ?? [],
  ]);
  const options = family.list
    .filter((p) => !already.has(p._id))
    .filter((p) => fullName(p).toLowerCase().includes(q.trim().toLowerCase()))
    .slice(0, 30);

  async function choose(other: PersonId) {
    try {
      if (relation === "parent") await addParent({ childId: person._id, parentId: other });
      if (relation === "child") await addParent({ childId: other, parentId: person._id });
      if (relation === "partner") await addPartner({ personId: person._id, partnerId: other });
      props.onClose();
    } catch (e) {
      props.onError(errorMessage(e));
      props.onClose();
    }
  }

  return (
    <Modal title={`Link a ${relation}`} subtitle={`Choose someone already in the tree to be ${person.firstName}'s ${relation}.`} onClose={props.onClose}>
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search names"
        className="w-full rounded-full border border-line bg-card px-4 py-2.5 text-sm outline-none focus:border-slate-soft"
      />
      <ul className="mt-4 max-h-80 space-y-1 overflow-y-auto">
        {options.map((p) => (
          <li key={p._id}>
            <button type="button" onClick={() => choose(p._id)} className="flex w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-mist/50">
              <Portrait person={p} size={38} ring={false} />
              <span className="flex-1 text-sm font-medium">{fullName(p)}</span>
              <span className="text-xs text-muted">{lifespan(p)}</span>
            </button>
          </li>
        ))}
        {options.length === 0 && <li className="p-4 text-center text-sm text-muted">No one to link.</li>}
      </ul>
    </Modal>
  );
}

/* ---------- Gallery ---------- */

function Gallery({ person }: { person: Person }) {
  const photos = useQuery(api.family.listPhotos, { personId: person._id });
  const generateUploadUrl = useMutation(api.family.generateUploadUrl);
  const addPhoto = useMutation(api.family.addPhoto);
  const deletePhoto = useMutation(api.family.deletePhoto);
  const setProfilePhoto = useMutation(api.family.setProfilePhoto);
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const list = [...files];
    setUploading(list.length);
    for (const file of list) {
      try {
        const storageId = await uploadImage(file, () => generateUploadUrl());
        await addPhoto({ personId: person._id, storageId });
        // The first photo of someone without a portrait becomes their portrait.
        if (!person.photoUrl && list[0] === file) await setProfilePhoto({ personId: person._id, storageId });
      } catch (e) {
        setError(e instanceof Error && !("data" in e) ? e.message : errorMessage(e));
      }
      setUploading((n) => n - 1);
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  return (
    <section
      className="animate-rise rounded-[1.75rem] border border-line bg-card p-7"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void upload(e.dataTransfer.files);
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold text-night">Photographs</h2>
        <button type="button" onClick={() => fileInput.current?.click()} className={btnSecondary}>
          <ImagePlus size={16} /> Upload
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void upload(e.target.files)}
        />
      </div>
      {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-800">{error}</p>}

      {photos === undefined ? (
        <div className="mt-5 h-40 animate-pulse rounded-3xl bg-mist/50" />
      ) : photos.length === 0 && uploading === 0 ? (
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="mt-5 flex w-full flex-col items-center rounded-3xl border-2 border-dashed border-silver px-6 py-10 text-center transition-colors hover:border-slate-soft hover:bg-mist/30"
        >
          <ImagePlus size={28} className="text-silver" strokeWidth={1.5} />
          <span className="mt-3 font-display text-xl text-coal">Add photographs of {person.firstName}</span>
          <span className="mt-1 text-xs text-muted">Click to choose, or drop images here</span>
        </button>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((ph, i) => (
            <li key={ph._id} className="group relative aspect-square overflow-hidden rounded-3xl bg-mist">
              <button type="button" onClick={() => setOpen(i)} className="h-full w-full" aria-label="View photo">
                {ph.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ph.url} alt={ph.caption ?? ""} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                )}
              </button>
              <div className="absolute inset-x-2 bottom-2 flex justify-end gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setProfilePhoto({ personId: person._id, storageId: ph.storageId })}
                  className="grid h-8 w-8 place-items-center rounded-full bg-card/90 text-coal shadow"
                  title="Use as portrait"
                  aria-label="Use as portrait"
                >
                  <Star size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => deletePhoto({ photoId: ph._id })}
                  className="grid h-8 w-8 place-items-center rounded-full bg-card/90 text-red-700 shadow"
                  title="Delete photo"
                  aria-label="Delete photo"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
          {Array.from({ length: uploading }).map((_, i) => (
            <li key={`up-${i}`} className="grid aspect-square animate-pulse place-items-center rounded-3xl bg-mist text-xs text-slate">
              Uploading…
            </li>
          ))}
        </ul>
      )}

      {open !== null && photos && photos[open] && (
        <Lightbox
          urls={photos.map((p) => p.url)}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
          storageIds={photos.map((p) => p.storageId)}
        />
      )}
    </section>
  );
}


/* ---------- Gatherings they were at ---------- */

function PersonGatherings({ person }: { person: Person }) {
  const gatherings = useQuery(api.album.gatheringsFor, { personId: person._id });
  if (!gatherings || gatherings.length === 0) return null;
  return (
    <section className="animate-rise rounded-[1.75rem] border border-line bg-card p-7">
      <h2 className="font-display text-2xl font-semibold text-ink">Gatherings</h2>
      <ul className="mt-4 divide-y divide-line">
        {gatherings.map((g) => (
          <li key={g._id}>
            <Link href={`/album/${g._id}`} className="flex items-baseline justify-between gap-4 py-3 hover:text-ochre-deep">
              <span className="font-medium">{g.title}</span>
              <span className="shrink-0 text-xs text-muted">
                {[gatheringKindLabel[g.kind], g.date && formatDate(g.date)].filter(Boolean).join(" · ")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
