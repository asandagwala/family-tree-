"use client";

import { Cake, MessageCircle } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { unknownBirthdays, upcomingBirthdays, whenLabel, type Birthday } from "@/lib/birthdays";
import { whatsappHref } from "@/lib/contact";
import { fullName } from "@/lib/people";
import { useFamily } from "@/lib/use-family";
import { Portrait } from "@/components/people/portrait";

export function BirthdaysView() {
  const family = useFamily();
  const { upcoming, unknown, months } = useMemo(() => {
    if (!family) return { upcoming: [], unknown: [], months: [] as [string, Birthday[]][] };
    const upcoming = upcomingBirthdays(family.list);
    const byMonth = new Map<string, Birthday[]>();
    for (const b of upcoming.slice(1)) {
      const key = b.next.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
      byMonth.set(key, [...(byMonth.get(key) ?? []), b]);
    }
    return { upcoming, unknown: unknownBirthdays(family.list), months: [...byMonth.entries()] };
  }, [family]);

  const next = upcoming[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
      <p className="text-xs uppercase tracking-[0.25em] text-ochre-deep">The family</p>
      <h1 className="mt-1 font-display text-5xl font-semibold text-ink">Birthdays</h1>

      {!family ? (
        <div className="mt-8 h-48 animate-pulse rounded-[1.75rem] bg-mist" />
      ) : upcoming.length === 0 ? (
        <div className="mt-8 rounded-[1.75rem] border border-dashed border-silver bg-card px-6 py-14 text-center">
          <Cake className="mx-auto text-ochre" size={30} strokeWidth={1.5} />
          <h2 className="mt-3 font-display text-3xl font-semibold">No birthdays yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Add full birth dates (day, month and year) to people&apos;s profiles and their birthdays will show up here.
          </p>
        </div>
      ) : (
        <>
          {next && <NextUp birthday={next} />}
          <div className="mt-10 space-y-10">
            {months.map(([month, list]) => (
              <section key={month}>
                <h2 className="mb-3 font-display text-2xl font-semibold text-ink">{month}</h2>
                <ul className="divide-y divide-line overflow-hidden rounded-[1.5rem] border border-line bg-card">
                  {list.map((b) => (
                    <BirthdayRow key={b.person._id} birthday={b} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}

      {unknown.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold text-ink">Birthdays we don&apos;t know yet</h2>
          <p className="mt-1 text-sm text-muted">Add a full birth date on their profile to see their birthday here.</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {unknown.map((p) => (
              <li key={p._id}>
                <Link
                  href={`/people/${p._id}`}
                  className="flex items-center gap-2 rounded-full border border-line bg-card py-1 pl-1 pr-4 text-sm hover:border-ochre"
                >
                  <Portrait person={p} size={28} ring={false} />
                  {fullName(p)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function wishesHref(b: Birthday) {
  const base = b.person.whatsapp ? whatsappHref(b.person.whatsapp) : null;
  if (!base) return null;
  return `${base}?text=${encodeURIComponent(`Happy birthday, ${b.person.firstName}!`)}`;
}

function NextUp({ birthday: b }: { birthday: Birthday }) {
  const wishes = wishesHref(b);
  return (
    <section className="mt-8 flex flex-wrap items-center gap-6 rounded-[1.75rem] bg-marigold-soft p-6 sm:p-8">
      <Portrait person={b.person} size={96} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-marigold-deep">
          Next birthday · {whenLabel(b.days)}
        </p>
        <Link
          href={`/people/${b.person._id}`}
          className="mt-1 block font-display text-4xl font-semibold text-ink hover:underline"
        >
          {fullName(b.person)}
        </Link>
        <p className="mt-1 text-ink/70">
          Turns {b.turning} on {b.next.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>
      {wishes && (
        <a
          href={wishes}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-white hover:bg-forest-deep"
        >
          <MessageCircle size={16} /> Send wishes
        </a>
      )}
    </section>
  );
}

function BirthdayRow({ birthday: b }: { birthday: Birthday }) {
  const wishes = wishesHref(b);
  return (
    <li className="flex items-center gap-4 px-4 py-3">
      <div className="grid w-12 shrink-0 place-items-center rounded-xl bg-marigold-soft py-1.5 text-marigold-deep">
        <span className="font-display text-xl font-semibold leading-none">{b.next.getDate()}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider">
          {b.next.toLocaleDateString("en-ZA", { month: "short" })}
        </span>
      </div>
      <Link href={`/people/${b.person._id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Portrait person={b.person} size={40} ring={false} />
        <span className="min-w-0">
          <span className="block truncate font-medium">{fullName(b.person)}</span>
          <span className="block text-xs text-muted">
            Turns {b.turning} · {whenLabel(b.days)}
          </span>
        </span>
      </Link>
      {wishes && (
        <a
          href={wishes}
          target="_blank"
          rel="noopener noreferrer"
          title="Send birthday wishes on WhatsApp"
          aria-label={`Send ${b.person.firstName} birthday wishes on WhatsApp`}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-forest hover:bg-mint"
        >
          <MessageCircle size={17} />
        </a>
      )}
    </li>
  );
}
