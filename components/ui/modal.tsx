"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function Modal(props: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const { onClose } = props;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div aria-hidden className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal
        aria-label={props.title}
        className={`animate-rise relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[2rem] bg-paper shadow-2xl sm:rounded-[2rem] ${
          props.wide ? "sm:max-w-3xl" : "sm:max-w-xl"
        }`}
      >
        <header className="flex items-start justify-between gap-4 px-7 pb-2 pt-6">
          <div>
            <h2 className="font-display text-3xl font-semibold leading-tight text-night">{props.title}</h2>
            {props.subtitle && <p className="mt-1 text-sm text-muted">{props.subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-mist"
          >
            <X size={18} />
          </button>
        </header>
        <div className="overflow-y-auto scrollbar-thin px-7 pb-7 pt-3">{props.children}</div>
      </div>
    </div>
  );
}

export const inputCls =
  "w-full rounded-2xl border border-line bg-card px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-slate-soft focus:ring-4 focus:ring-mint";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-forest-deep disabled:opacity-50";

export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-full border border-line bg-card px-5 py-2.5 text-sm font-medium text-coal transition-colors hover:border-slate-soft hover:bg-mist/40";

export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-slate transition-colors hover:bg-mist";
