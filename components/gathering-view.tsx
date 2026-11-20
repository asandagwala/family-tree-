"use client";

import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, ImagePlus, Pencil, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { gatheringKindLabel } from "@/lib/gatherings";
import { errorMessage, formatDate, fullName } from "@/lib/people";
import { uploadImage } from "@/lib/upload";
import { useFamily } from "@/lib/use-family";
import { AskIcon } from "./ask-icon";
import { useChat } from "./chat/chat-context";
import { GatheringEditor } from "./gathering-editor";
import { Lightbox } from "./lightbox";
import { Portrait } from "./portrait";
import { btnGhost, btnPrimary, btnSecondary, Modal } from "./ui/modal";

export function GatheringView() {
  const params = useParams<{ id: string }>();
  const id = params.id as Id<"gatherings">;
  const gathering = useQuery(api.album.getGathering, { id });
  const family = useFamily();
  const chat = useChat();
  const router = useRouter();
  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);
  const addPhoto = useMutation(api.album.addGatheringPhoto);
  const deletePhoto = useMutation(api.album.deleteGatheringPhoto);
  const setCover = useMutation(api.album.setGatheringCover);
  const deleteGathering = useMutation(api.album.deleteGathering);
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (gathering === undefined) {
    return <div className="mx-auto mt-6 h-96 max-w-6xl animate-pulse rounded-[2rem] bg-mist sm:mx-8" />;
  }
  if (gathering === null) {
    return (
      <div className="grid h-full place-items-center p-8 text-center">
        <div>
          <h1 className="font-display text-4xl font-semibold">We couldn&apos;t find that gathering</h1>
          <Link href="/album" className={`${btnPrimary} mt-6`}>
            Back to the album
          </Link>
        </div>
      </div>
    );
  }

  async function upload(files: FileList | null) {
    if (!files?.length || !gathering) return;
    setError(null);
    const list = [...files];
    setUploading(list.length);
    for (const file of list) {
      try {
        const storageId = await uploadImage(file, () => generateUploadUrl());
        await addPhoto({ gatheringId: gathering._id, storageId });
      } catch (e) {
        setError(e instanceof Error && !("data" in e) ? e.message : errorMessage(e));
      }
      setUploading((n) => n - 1);
    }
    if (fileInput.current) fileInput.current.value = "";
  }

  const guests = gathering.peopleIds.map((pid) => family?.people.get(pid)).filter((p) => !!p);
  const cover = gathering.coverUrl ?? gathering.photos[0]?.url ?? null;

  return (
    <div
      className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        void upload(e.dataTransfer.files);
      }}
    >
      <Link href="/album" className={`${btnGhost} -ml-3 mb-4`}>
        <ArrowLeft size={16} /> The album
      </Link>

      <section className="grid overflow-hidden rounded-[2rem] border border-line bg-card lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col justify-between gap-6 p-7 sm:p-10">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-ochre-deep">{gatheringKindLabel[gathering.kind]}</p>
            <h1 className="mt-2 font-display text-5xl font-semibold leading-[0.95] text-ink">{gathering.title}</h1>
            <p className="mt-3 text-sm text-muted">
              {[formatDate(gathering.date), gathering.place].filter(Boolean).join(" · ") || "Date and place not yet recorded"}
            </p>
            {gathering.story && <p className="mt-5 max-w-lg font-display text-xl leading-relaxed text-ink/90">{gathering.story}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => fileInput.current?.click()} className={btnPrimary}>
              <ImagePlus size={16} /> Add photos
            </button>
            <button type="button" onClick={() => setEditing(true)} className={btnSecondary}>
              <Pencil size={15} /> Edit
            </button>
            <button type="button" onClick={() => chat.open(`Tell me about ${gathering.title}.`)} className={btnSecondary}>
              <AskIcon size={16} /> Ask about it
            </button>
          </div>
        </div>
        <div className="relative hidden min-h-72 bg-cream lg:block">
          {cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
        </div>
      </section>

      <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={(e) => void upload(e.target.files)} />
      {error && <p className="mt-4 rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-800">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <section>
          <h2 className="mb-4 font-display text-2xl font-semibold">
            Photos <span className="font-sans text-sm font-normal text-muted">{gathering.photos.length}</span>
          </h2>
          {gathering.photos.length === 0 && uploading === 0 ? (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex w-full flex-col items-center rounded-[1.75rem] border-2 border-dashed border-silver bg-card px-6 py-14 text-center transition-colors hover:border-ochre"
            >
              <ImagePlus size={28} className="text-ochre" strokeWidth={1.5} />
              <span className="mt-3 font-display text-2xl">Add the first photos</span>
              <span className="mt-1 text-xs text-muted">Click to choose several at once, or drop them anywhere on this page</span>
            </button>
          ) : (
            <ul className="columns-2 gap-3 sm:columns-3 [&>li]:mb-3">
              {gathering.photos.map((ph, i) => (
                <li key={ph._id} className="group relative break-inside-avoid overflow-hidden rounded-2xl bg-mist">
                  <button type="button" onClick={() => setOpen(i)} className="block w-full" aria-label="View photo">
                    {ph.url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={ph.url} alt={ph.caption ?? ""} className="w-full object-cover" />
                    )}
                  </button>
                  <div className="absolute right-2 top-2 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setCover({ gatheringId: gathering._id, storageId: ph.storageId })}
                      className="grid h-8 w-8 place-items-center rounded-full bg-card/95 text-ink shadow"
                      title="Use as cover"
                      aria-label="Use as cover"
                    >
                      <Star size={14} className={gathering.coverId === ph.storageId ? "fill-ochre text-ochre" : ""} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deletePhoto({ photoId: ph._id })}
                      className="grid h-8 w-8 place-items-center rounded-full bg-card/95 text-red-700 shadow"
                      title="Delete photo"
                      aria-label="Delete photo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
              {Array.from({ length: uploading }).map((_, i) => (
                <li key={`up-${i}`} className="grid aspect-square animate-pulse place-items-center rounded-2xl bg-cream text-xs text-muted">
                  Uploading…
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="h-fit rounded-[1.75rem] border border-line bg-card p-6">
          <h2 className="font-display text-2xl font-semibold">Who was there</h2>
          {guests.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              No one tagged yet.{" "}
              <button type="button" onClick={() => setEditing(true)} className="font-medium text-ochre-deep hover:underline">
                Add people
              </button>
            </p>
          ) : (
            <ul className="mt-3 space-y-1">
              {guests.map((p) => (
                <li key={p._id}>
                  <Link href={`/people/${p._id}`} className="flex items-center gap-3 rounded-2xl p-1.5 hover:bg-paper">
                    <Portrait person={p} size={36} ring={false} />
                    <span className="truncate text-sm font-medium">{fullName(p)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="mt-6 inline-flex items-center gap-2 border-t border-line pt-4 text-sm text-red-700 hover:underline"
          >
            <Trash2 size={14} /> Delete this gathering
          </button>
        </aside>
      </div>

      {open !== null && gathering.photos[open] && (
        <Lightbox
          urls={gathering.photos.map((p) => p.url)}
          storageIds={gathering.photos.map((p) => p.storageId)}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
        />
      )}
      {editing && family && <GatheringEditor gathering={gathering} family={family} onClose={() => setEditing(false)} />}
      {confirmDelete && (
        <Modal title={`Delete ${gathering.title}?`} onClose={() => setConfirmDelete(false)}>
          <p className="text-sm text-muted">
            This permanently deletes the gathering and its {gathering.photos.length} photos. The people stay in the tree.
            This can&apos;t be undone.
          </p>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              className={`${btnPrimary} bg-red-700 hover:bg-red-800`}
              onClick={async () => {
                try {
                  await deleteGathering({ id: gathering._id });
                  router.push("/album");
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
}
