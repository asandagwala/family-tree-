"use client";

import { useMutation } from "convex/react";
import { Link2, Plus, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { errorMessage, fullName, lifespan, type Person, type PersonId } from "@/lib/people";
import { type Family } from "@/lib/use-family";
import { type Relation } from "./person-editor";
import { Portrait } from "./portrait";
import { btnGhost, Modal } from "@/components/ui/modal";

/** A person's parents, partners and children on their profile, with ways to add or link relatives. */

export function RelativeGroup(props: {
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
            <button
              type="button"
              onClick={props.onLink}
              className={`${btnGhost} px-2 text-xs`}
              title="Link someone already in the tree"
            >
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

export function LinkExisting(props: {
  relation: Relation;
  person: Person;
  family: Family;
  onClose: () => void;
  onError: (m: string) => void;
}) {
  const addParent = useMutation(api.people.addParent);
  const addPartner = useMutation(api.people.addPartner);
  const [q, setQ] = useState("");
  const { relation, person, family } = props;
  const already = new Set([
    person._id,
    ...((relation === "parent" ? family.parentsOf : relation === "child" ? family.childrenOf : family.partnersOf).get(
      person._id,
    ) ?? []),
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
    <Modal
      title={`Link a ${relation}`}
      subtitle={`Choose someone already in the tree to be ${person.firstName}'s ${relation}.`}
      onClose={props.onClose}
    >
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
            <button
              type="button"
              onClick={() => choose(p._id)}
              className="flex w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-mist/50"
            >
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
