import type { Doc, Id } from "@/convex/_generated/dataModel";
import { ConvexError } from "convex/values";

export type Person = Doc<"people"> & { photoUrl: string | null };
export type PersonId = Id<"people">;
export type Gender = Doc<"people">["gender"];

export function fullName(p: Pick<Person, "firstName" | "lastName">) {
  return `${p.firstName} ${p.lastName}`.trim();
}

export function initials(p: Pick<Person, "firstName" | "lastName">) {
  return ((p.firstName[0] ?? "") + (p.lastName[0] ?? "")).toUpperCase();
}

export function year(date?: string) {
  const y = date?.match(/\d{4}/)?.[0];
  return y ? Number(y) : undefined;
}

export function lifespan(p: Pick<Person, "birthDate" | "deathDate">) {
  const b = year(p.birthDate);
  const d = year(p.deathDate);
  if (!b && !d) return "";
  if (!d) return `b. ${b}`;
  return `${b ?? "?"} – ${d}`;
}

/** Full date as "12 June 1934", a bare year as-is. */
export function formatDate(date?: string) {
  if (!date) return undefined;
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return date;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}

export function age(p: Pick<Person, "birthDate" | "deathDate">, today = new Date()) {
  const b = year(p.birthDate);
  if (!b) return undefined;
  const end = year(p.deathDate) ?? today.getFullYear();
  return end - b;
}

export const genderLabel: Record<Gender, string> = {
  female: "Female",
  male: "Male",
  other: "Other",
  unknown: "Not specified",
};

export function errorMessage(err: unknown) {
  if (err instanceof ConvexError && typeof err.data === "string") return err.data;
  return "Something went wrong. Please try again.";
}

/**
 * Background for a person's initials when they have no photo: one of a few
 * soft tones, always with near-black initials (well over 4.5:1), chosen from
 * their id so it stays the same everywhere.
 */
const INITIALS_TONES = ["#daf1de", "#e2e7ef", "#e6eee2", "#d9dfe8", "#ece9e1"];
export const INITIALS_TEXT = "#121418";

export function initialsTone(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return INITIALS_TONES[h % INITIALS_TONES.length];
}

/** Neutral greys for initials on black-and-white pages. */
const MONO_TONES = ["#f4f4f2", "#ebebe8", "#e1e1de"];

export function initialsMonoTone(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return MONO_TONES[h % MONO_TONES.length];
}
