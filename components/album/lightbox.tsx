"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect } from "react";
import type { Id } from "@/convex/_generated/dataModel";

/** Full-screen photo viewer with keyboard and arrow navigation. */
export function Lightbox(props: {
  urls: (string | null)[];
  storageIds: Id<"_storage">[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const { urls, index, onIndex, onClose } = props;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndex((index + 1) % urls.length);
      if (e.key === "ArrowLeft") onIndex((index - 1 + urls.length) % urls.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, urls.length, onIndex, onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/90 p-6" onClick={onClose}>
      {urls[index] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urls[index]!} alt="" className="max-h-full max-w-full rounded-3xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
      )}
      <button type="button" onClick={onClose} aria-label="Close" className="absolute right-6 top-6 grid h-11 w-11 place-items-center rounded-full bg-mist/10 text-mist hover:bg-mist/20">
        <X size={20} />
      </button>
      {urls.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous"
            onClick={(e) => {
              e.stopPropagation();
              onIndex((index - 1 + urls.length) % urls.length);
            }}
            className="absolute left-6 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-mist/10 text-mist hover:bg-mist/20"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            aria-label="Next"
            onClick={(e) => {
              e.stopPropagation();
              onIndex((index + 1) % urls.length);
            }}
            className="absolute right-6 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-mist/10 text-mist hover:bg-mist/20"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}
    </div>
  );
}
