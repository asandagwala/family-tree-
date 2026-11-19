"use client";

import { useMutation } from "convex/react";
import { useState, type FormEvent, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import { errorMessage } from "@/lib/people";
import { btnPrimary, btnSecondary, inputCls, Modal } from "./ui/modal";

export type FamilySettings = {
  familyName: string | null;
  clanName: string | null;
  clanPraise: string | null;
  whatsappGroupUrl: string | null;
};

/** Edit the family-wide details: isiduko, izithakazelo, WhatsApp group. */
export function FamilyDetailsEditor({ settings, onClose }: { settings: FamilySettings; onClose: () => void }) {
  const update = useMutation(api.family.updateSettings);
  const [clanName, setClanName] = useState(settings.clanName ?? "");
  const [clanPraise, setClanPraise] = useState(settings.clanPraise ?? "");
  const [whatsappGroupUrl, setWhatsappGroupUrl] = useState(settings.whatsappGroupUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await update({ clanName, clanPraise, whatsappGroupUrl });
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={settings.familyName ? `The ${settings.familyName} family` : "Family details"}
      subtitle="The details that belong to the whole family."
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-5">
        <Field label="Our isiduko (clan name)">
          <input value={clanName} onChange={(e) => setClanName(e.target.value)} placeholder="e.g. Jola" className={inputCls} />
        </Field>
        <Field label="Izithakazelo" hint="The clan praises, as the family recites them">
          <textarea rows={3} value={clanPraise} onChange={(e) => setClanPraise(e.target.value)} className={`${inputCls} resize-y`} />
        </Field>
        <Field label="Family WhatsApp group" hint="In WhatsApp: group info, then Invite via link">
          <input
            value={whatsappGroupUrl}
            onChange={(e) => setWhatsappGroupUrl(e.target.value)}
            placeholder="https://chat.whatsapp.com/…"
            className={inputCls}
          />
        </Field>
        {error && <p className="rounded-2xl bg-red-50 px-4 py-2.5 text-sm text-red-800">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={busy} className={btnPrimary}>
            {busy ? "Saving…" : "Save"}
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
