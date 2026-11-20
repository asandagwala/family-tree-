import type { Doc } from "../_generated/dataModel";

/**
 * What the family assistant is told: how to behave (INSTRUCTIONS) and the
 * family's records written out as text (describeTree). Contact details are
 * never included; the tree query strips them before they get here.
 */

export const INSTRUCTIONS = `You are the family historian for a private family tree app. Family members ask you questions about their relatives, and you answer from the family records below.

How to answer:
- Use only the records (the family tree and the family album). If something isn't recorded, say so plainly and suggest which detail someone could add to the tree. Never invent names, dates, places or stories.
- You may reason from the records: ages, how two people are related (cousin, grand-aunt, in-law), who is the eldest, where the family comes from, gaps worth filling.
- When you mention a person, link them as a Markdown link with their id: [Nomvula Ntshona](person:ID). Link each person the first time you mention them.
- Write warmly and briefly, like a knowledgeable relative: a few sentences or a short bulleted list. No headings, no tables.
- Treat clan names (iziduko) with respect; they matter to the family.
- Ages: someone with a death date is not living; compute ages from today's date given below.`;

export function describeTree(tree: {
  people: Doc<"people">[];
  parentLinks: Doc<"parentLinks">[];
  partnerships: Doc<"partnerships">[];
  photoCounts: Record<string, number>;
  familyName: string | null;
  familyClan: string | null;
  familyClanPraise: string | null;
  gatherings: {
    title: string;
    kind: string;
    date: string | null;
    place: string | null;
    story: string | null;
    peopleIds: string[];
    photoCount: number;
  }[];
}) {
  const name = new Map(tree.people.map((p) => [p._id as string, `${p.firstName} ${p.lastName}`.trim()]));
  const ref = (id: string) => `${name.get(id) ?? "unknown"} (${id})`;
  const parents = new Map<string, string[]>();
  const children = new Map<string, string[]>();
  const partners = new Map<string, string[]>();
  const push = (m: Map<string, string[]>, k: string, val: string) => m.set(k, [...(m.get(k) ?? []), val]);
  for (const l of tree.parentLinks) {
    push(parents, l.childId, l.parentId);
    push(children, l.parentId, l.childId);
  }
  for (const p of tree.partnerships) {
    push(partners, p.personA, p.personB);
    push(partners, p.personB, p.personA);
  }

  if (tree.people.length === 0) {
    return tree.familyName ? `The ${tree.familyName} family tree is empty.` : "The family tree is empty.";
  }
  const lines = tree.people.map((p) => {
    const facts = [
      `gender: ${p.gender}`,
      p.birthDate && `born: ${p.birthDate}${p.birthPlace ? ` in ${p.birthPlace}` : ""}`,
      !p.birthDate && p.birthPlace && `birthplace: ${p.birthPlace}`,
      p.deathDate ? `died: ${p.deathDate}` : "no death recorded",
      p.clanName && `clan name (isiduko): ${p.clanName}`,
      p.occupation && `occupation: ${p.occupation}`,
      p.currentPlace && `lives in: ${p.currentPlace}`,
      `photos: ${tree.photoCounts[p._id] ?? 0}`,
      `parents: ${(parents.get(p._id) ?? []).map(ref).join(", ") || "none recorded"}`,
      `partners: ${(partners.get(p._id) ?? []).map(ref).join(", ") || "none recorded"}`,
      `children: ${(children.get(p._id) ?? []).map(ref).join(", ") || "none recorded"}`,
      p.notes && `story: ${p.notes.replace(/\s+/g, " ")}`,
    ].filter(Boolean);
    return `- ${ref(p._id)}\n  ${facts.join("\n  ")}`;
  });
  const clan = [
    tree.familyClan && `Family isiduko: ${tree.familyClan}`,
    tree.familyClanPraise && `Izithakazelo: ${tree.familyClanPraise.replace(/\s+/g, " ")}`,
  ]
    .filter(Boolean)
    .join("; ");
  const heading = (tree.familyName ? `The ${tree.familyName} family` : "Family") + (clan ? ` (${clan})` : "");
  const album = tree.gatherings.length
    ? `\n\nFamily album (${tree.gatherings.length} gatherings):\n` +
      tree.gatherings
        .map((g) => {
          const facts = [
            `kind: ${g.kind}`,
            g.date && `date: ${g.date}`,
            g.place && `place: ${g.place}`,
            `people there: ${g.peopleIds.map(ref).join(", ") || "not recorded"}`,
            `photos: ${g.photoCount}`,
            g.story && `story: ${g.story.replace(/\s+/g, " ")}`,
          ].filter(Boolean);
          return `- ${g.title}\n  ${facts.join("\n  ")}`;
        })
        .join("\n")
    : "";
  return `${heading} records (${tree.people.length} people):\n${lines.join("\n")}${album}`;
}
