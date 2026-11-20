"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/** The family code with a copy button, so it can be sent to relatives. */
export function FamilyCode({ code, className = "" }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={`rounded-2xl bg-paper p-4 ${className}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-muted">Family code</p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="select-all break-all font-mono text-base font-semibold tracking-wide text-ink">{code}</span>
        <button
          type="button"
          onClick={() =>
            void navigator.clipboard.writeText(code).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            })
          }
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink hover:bg-mist"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">Share it with relatives so they can join this tree.</p>
    </div>
  );
}
