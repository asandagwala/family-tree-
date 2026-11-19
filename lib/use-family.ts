"use client";

import { useQuery } from "convex/react";
import { useMemo } from "react";
import { api } from "@/convex/_generated/api";
import type { Person, PersonId } from "./people";
import { useSampleMode } from "./sample-mode";

export type Family = {
  list: Person[];
  people: Map<PersonId, Person>;
  parentsOf: Map<PersonId, PersonId[]>;
  childrenOf: Map<PersonId, PersonId[]>;
  partnersOf: Map<PersonId, PersonId[]>;
  parentLinks: { parentId: PersonId; childId: PersonId }[];
  partnerships: { personA: PersonId; personB: PersonId }[];
};

/** The whole tree, with lookup maps. `undefined` while loading.
 *  Follows sample mode unless `space` forces the real or sample family. */
export function useFamily(space?: { sample: boolean }): Family | undefined {
  const mode = useSampleMode();
  const sample = space ? space.sample : mode.sample;
  const tree = useQuery(api.family.getTree, { sample });
  return useMemo(() => {
    if (!tree) return undefined;
    const people = new Map(tree.people.map((p) => [p._id, p]));
    const parentsOf = new Map<PersonId, PersonId[]>();
    const childrenOf = new Map<PersonId, PersonId[]>();
    const partnersOf = new Map<PersonId, PersonId[]>();
    const push = (m: Map<PersonId, PersonId[]>, k: PersonId, v: PersonId) => m.set(k, [...(m.get(k) ?? []), v]);
    for (const l of tree.parentLinks) {
      push(parentsOf, l.childId, l.parentId);
      push(childrenOf, l.parentId, l.childId);
    }
    for (const p of tree.partnerships) {
      push(partnersOf, p.personA, p.personB);
      push(partnersOf, p.personB, p.personA);
    }
    const byBirth = (a: PersonId, b: PersonId) =>
      (people.get(a)?.birthDate ?? "9999").localeCompare(people.get(b)?.birthDate ?? "9999");
    for (const m of [parentsOf, childrenOf, partnersOf]) for (const v of m.values()) v.sort(byBirth);
    return {
      list: tree.people,
      people,
      parentsOf,
      childrenOf,
      partnersOf,
      parentLinks: tree.parentLinks,
      partnerships: tree.partnerships,
    };
  }, [tree]);
}

export function siblingsOf(family: Family, id: PersonId) {
  const parents = family.parentsOf.get(id) ?? [];
  return [...new Set(parents.flatMap((p) => family.childrenOf.get(p) ?? []))].filter((s) => s !== id);
}
