import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { orderPair } from "./people";

/**
 * The made-up family visitors can explore: the Rubuluza family of Lusikisiki
 * and the Sondlo family of Engcobo, joined by Luthando and Ayanda's marriage.
 * Three generations, so every part of the app has something to show.
 *
 * Married women are listed under their birth surname, so the tree never reads
 * as two people of the same family marrying. Each couple has different clan
 * names (iziduko), as custom requires.
 */
type SamplePerson = {
  firstName: string;
  lastName: string;
  gender: "female" | "male";
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  currentPlace?: string;
  clanName?: string;
  occupation?: string;
  notes?: string;
  /** Keys of this person's parents in this list. */
  parents?: string[];
};

const PEOPLE: Record<string, SamplePerson> = {
  // Generation I
  mzwandile: {
    firstName: "Mzwandile",
    lastName: "Rubuluza",
    gender: "male",
    birthDate: "1934-06-12",
    deathDate: "2008-09-03",
    birthPlace: "Lusikisiki",
    clanName: "Jola",
    occupation: "Farmer and herdsman",
    notes:
      "Kept cattle on the family land outside Lusikisiki for over fifty years. Known for his stories by the fire and for walking everywhere, even in his seventies.",
  },
  nomvula: {
    firstName: "Nomvula",
    lastName: "Rubuluza",
    gender: "female",
    birthDate: "1938-11-27",
    birthPlace: "Flagstaff",
    currentPlace: "Lusikisiki",
    clanName: "Mpondomise",
    occupation: "Beadworker",
    notes: "A celebrated beadworker. Many of the family's ceremonial collars and headpieces were made by her hand.",
  },
  lwazi: {
    firstName: "Lwazi",
    lastName: "Sondlo",
    gender: "male",
    birthDate: "1940-02-18",
    deathDate: "2015-07-21",
    birthPlace: "Engcobo",
    clanName: "Tshawe",
    occupation: "Teacher and school principal",
    notes: "Taught at the village school for 38 years and later became its principal.",
  },
  thandeka: {
    firstName: "Thandeka",
    lastName: "Sondlo",
    gender: "female",
    birthDate: "1944-12-05",
    birthPlace: "Mthatha",
    currentPlace: "Engcobo",
    clanName: "Dlamini",
    occupation: "Seamstress",
  },

  // Generation II
  luthando: {
    firstName: "Luthando",
    lastName: "Rubuluza",
    gender: "male",
    birthDate: "1964-03-30",
    birthPlace: "Lusikisiki",
    currentPlace: "Cape Town",
    clanName: "Jola",
    occupation: "Civil engineer",
    notes: "First in the family to go to university. Moved to Cape Town in 1989.",
    parents: ["mzwandile", "nomvula"],
  },
  nosipho: {
    firstName: "Nosipho",
    lastName: "Rubuluza",
    gender: "female",
    birthDate: "1968-08-14",
    birthPlace: "Lusikisiki",
    currentPlace: "Mthatha",
    clanName: "Jola",
    occupation: "Nurse",
    parents: ["mzwandile", "nomvula"],
  },
  ayanda: {
    firstName: "Ayanda",
    lastName: "Sondlo",
    gender: "female",
    birthDate: "1967-12-09",
    birthPlace: "Engcobo",
    currentPlace: "Cape Town",
    clanName: "Tshawe",
    occupation: "High school teacher",
    notes: "Married Luthando Rubuluza. Followed her father into teaching.",
    parents: ["lwazi", "thandeka"],
  },
  siyabonga: {
    firstName: "Siyabonga",
    lastName: "Sondlo",
    gender: "male",
    birthDate: "1971-05-02",
    birthPlace: "Mthatha",
    currentPlace: "Gqeberha",
    clanName: "Tshawe",
    occupation: "Musician",
    parents: ["lwazi", "thandeka"],
  },

  // Generation III
  lindiwe: {
    firstName: "Lindiwe",
    lastName: "Rubuluza",
    gender: "female",
    birthDate: "1993-01-22",
    birthPlace: "Cape Town",
    currentPlace: "Johannesburg",
    clanName: "Jola",
    occupation: "Software engineer",
    parents: ["luthando", "ayanda"],
  },
  anele: {
    firstName: "Anele",
    lastName: "Rubuluza",
    gender: "male",
    birthDate: "1997-12-01",
    birthPlace: "Cape Town",
    currentPlace: "East London",
    clanName: "Jola",
    occupation: "Architecture student",
    parents: ["luthando", "ayanda"],
  },
  zintle: {
    firstName: "Zintle",
    lastName: "Sondlo",
    gender: "female",
    birthDate: "2002-04-17",
    birthPlace: "Gqeberha",
    currentPlace: "Makhanda",
    clanName: "Tshawe",
    occupation: "University student",
    parents: ["siyabonga"],
  },
};

const COUPLES: [string, string][] = [
  ["mzwandile", "nomvula"],
  ["lwazi", "thandeka"],
  ["luthando", "ayanda"],
];

/** Insert the sample family, marked `sample: true` so it never mixes with a real family. */
export async function insertSampleFamily(ctx: MutationCtx) {
  const ids: Record<string, Id<"people">> = {};
  for (const [key, entry] of Object.entries(PEOPLE)) {
    const person = { ...entry };
    delete person.parents; // links, not a field of the person
    ids[key] = await ctx.db.insert("people", { ...person, sample: true });
  }
  for (const [key, { parents = [] }] of Object.entries(PEOPLE)) {
    for (const parent of parents) await ctx.db.insert("parentLinks", { parentId: ids[parent], childId: ids[key] });
  }
  for (const [a, b] of COUPLES) await ctx.db.insert("partnerships", orderPair(ids[a], ids[b]));
}

/**
 * Samples loaded before Ayanda was listed under her birth surname read as two
 * Rubuluza siblings marrying. Fix such a sample in place.
 */
export async function repairSampleFamily(
  ctx: MutationCtx,
  people: { _id: Id<"people">; firstName: string; lastName: string }[],
) {
  const ayanda = people.find((p) => p.firstName === "Ayanda" && p.lastName === "Rubuluza");
  if (ayanda) await ctx.db.patch("people", ayanda._id, { lastName: "Sondlo", notes: PEOPLE.ayanda.notes });
}
