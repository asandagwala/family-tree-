import type { Person } from "./people";

export type Birthday = { person: Person; next: Date; days: number; turning: number };

const FULL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Living people with a full birth date, ordered by how soon their birthday comes. */
export function upcomingBirthdays(list: Person[], today = new Date()): Birthday[] {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return list
    .filter((p) => !p.deathDate && FULL_DATE.test(p.birthDate ?? ""))
    .map((person) => {
      const [, y, m, d] = person.birthDate!.match(FULL_DATE)!.map(Number);
      let next = new Date(start.getFullYear(), m - 1, d);
      if (next < start) next = new Date(start.getFullYear() + 1, m - 1, d);
      const days = Math.round((next.getTime() - start.getTime()) / 86_400_000);
      return { person, next, days, turning: next.getFullYear() - y };
    })
    .sort((a, b) => a.days - b.days);
}

/** Living people whose birthday we can't place yet (no full date). */
export function unknownBirthdays(list: Person[]) {
  return list.filter((p) => !p.deathDate && !FULL_DATE.test(p.birthDate ?? ""));
}

export function whenLabel(days: number) {
  return days === 0 ? "Today" : days === 1 ? "Tomorrow" : `in ${days} days`;
}
