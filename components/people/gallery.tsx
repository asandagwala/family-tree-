"use client";

import { useMutation, useQuery } from "convex/react";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import { errorMessage, type Person } from "@/lib/people";
import { uploadImage } from "@/lib/upload";
import { Lightbox } from "@/components/album/lightbox";
import { btnSecondary } from "@/components/ui/modal";

export function Gallery({ person }: { person: Person }) {
  const photos = useQuery(api.photos.listPhotos, { personId: person._id });
  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);
  const addPhoto = useMutation(api.photos.addPhoto);
  const deletePhoto = useMutation(api.photos.deletePhoto);
  const setProfilePhoto = useMutation(api.photos.setProfilePhoto);
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
                  <img
                    src={ph.url}
                    alt={ph.caption ?? ""}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
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
            <li
              key={`up-${i}`}
              className="grid aspect-square animate-pulse place-items-center rounded-3xl bg-mist text-xs text-slate"
            >
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
