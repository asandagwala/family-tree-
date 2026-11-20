"use client";

import { useMutation } from "convex/react";
import { ArrowLeft, Briefcase, Camera, Home, MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import {
  age,
  errorMessage,
  formatDate,
  fullName,
  genderLabel,
  lifespan,
  type Person,
  type PersonId,
} from "@/lib/people";
import { siblingsOf, useFamily, type Family } from "@/lib/use-family";
import { UmbhacoBand } from "@/components/brand/beadwork";
import { useChat } from "@/components/chat/chat-context";
import { PersonEditor, type EditorMode, type Relation } from "./person-editor";
import { Portrait } from "./portrait";
import { btnGhost, btnPrimary, btnSecondary, Modal } from "@/components/ui/modal";
import { AskIcon } from "@/components/brand/ask-icon";
import { LinkExisting, RelativeGroup } from "./relatives";
import { Gallery } from "./gallery";
import { PersonGatherings } from "./person-gatherings";
import { Connect } from "./connect";

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
  const deletePerson = useMutation(api.people.deletePerson);
  const removeParent = useMutation(api.people.removeParent);
  const removePartner = useMutation(api.people.removePartner);
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
    {
      icon: Star,
      label: "Born",
      value: [formatDate(person.birthDate), person.birthPlace].filter(Boolean).join(" · ") || undefined,
    },
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
                className="absolute bottom-1 right-1 grid h-10 w-10 place-items-center rounded-full bg-ochre-deep text-white shadow-lg"
                aria-label="Add a portrait"
                title="Add a portrait"
              >
                <Camera size={17} />
              </button>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {person.clanName && <p className="text-xs uppercase tracking-[0.3em] text-moss">{person.clanName} clan</p>}
            <h1 className="mt-1 font-display text-5xl font-semibold leading-[0.95] sm:text-6xl">
              {person.firstName} <span className="italic text-ochre-deep">{person.lastName}</span>
            </h1>
            <p className="mt-3 text-sm text-muted">
              {[
                lifespan(person),
                years !== undefined && (person.deathDate ? `lived ${years} years` : `${years} years old`),
              ]
                .filter(Boolean)
                .join(" · ") || "Dates not yet recorded"}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => chat.open(`Tell me about ${fullName(person)}.`)}
                className="inline-flex items-center gap-2 rounded-full bg-ochre-deep px-4 py-2 text-sm font-medium text-white hover:brightness-90"
              >
                <AskIcon size={15} /> Ask about {person.firstName}
              </button>
              <button
                type="button"
                onClick={() => setEditor({ kind: "edit", person })}
                className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-ochre/50 hover:bg-ochre-soft/50"
              >
                <Pencil size={15} /> Edit details
              </button>
              <Link
                href="/tree"
                className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium hover:border-ochre/50 hover:bg-ochre-soft/50"
              >
                See in tree
              </Link>
            </div>
          </div>
        </div>
        <UmbhacoBand height={24} />
      </section>

      {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-800">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* Story */}
          <section className="animate-rise rounded-[1.75rem] border border-line bg-card p-7">
            <h2 className="font-display text-2xl font-semibold text-night">Their story</h2>
            {person.notes ? (
              <p className="mt-3 whitespace-pre-wrap font-display text-xl leading-relaxed text-night/90">
                {person.notes}
              </p>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-silver p-5 text-sm text-muted">
                No story recorded yet. What do you remember about {person.firstName}? Their sayings, their work, the
                places they loved.
                <button
                  type="button"
                  onClick={() => setEditor({ kind: "edit", person })}
                  className={`${btnGhost} mt-2 -ml-3 block`}
                >
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
        <div className="space-y-6">
          <Connect person={person} onEdit={() => setEditor({ kind: "edit", person })} />
          <section className="animate-rise h-fit rounded-[1.75rem] border border-line bg-card p-7">
            <h2 className="font-display text-2xl font-semibold text-night">Family</h2>
            <RelativeGroup
              title="Parents"
              ids={parents}
              family={family}
              onNew={
                parents.length < 2
                  ? () => setEditor({ kind: "new", relation: { type: "parent", of: person._id } })
                  : undefined
              }
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
            This permanently deletes {person.firstName}&apos;s profile, photos and family links. Their relatives stay in
            the tree. This can&apos;t be undone.
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
