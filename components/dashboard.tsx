"use client";

import { useMutation, useQuery } from "convex/react";
import { ArrowRight, ArrowUp, Check, MapPin, MessageCircle, Network, Pencil, Plus, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { fullName, lifespan, year, type Person } from "@/lib/people";
import { upcomingBirthdays } from "@/lib/birthdays";
import { contactLinks } from "@/lib/contact";
import { layoutTree } from "@/lib/tree-layout";
import { useSampleMode } from "@/lib/sample-mode";
import { useFamily, type Family } from "@/lib/use-family";
import { AskIcon } from "./ask-icon";
import { UmbhacoBand } from "./beadwork";
import { useChat } from "./chat/chat-context";
import { FamilyCode } from "./family-code";
import { FamilyDetailsEditor, type FamilySettings } from "./family-details-editor";
import { PersonEditor } from "./person-editor";
import { Portrait } from "./portrait";
import { Welcome } from "./welcome";

export function Dashboard() {
  const family = useFamily();
  const [adding, setAdding] = useState(false);
  const router = useRouter();

  if (family === undefined) return <DashboardSkeleton />;
  if (family.list.length === 0) return <Welcome />;

  return (
    <div>
      {/* The banner runs edge to edge; the cards below sit in the page column. */}
      <Hero family={family} onAdd={() => setAdding(true)} />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-5">
        <BirthsByDecade family={family} className="lg:col-span-3" />
        <UpcomingBirthdays family={family} className="lg:col-span-2" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <FeaturedStory family={family} className="lg:col-span-2" />
        <Roots family={family} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <ClanNames family={family} />
        <StayConnected family={family} />
        <MissingDetails family={family} />
      </div>
      </div>
      {adding && (
        <PersonEditor mode={{ kind: "new" }} family={family} onClose={() => setAdding(false)} onSaved={(id) => router.push(`/people/${id}`)} />
      )}
    </div>
  );
}

/* ---------- Hero ---------- */

function familyName(list: Person[]) {
  const counts = new Map<string, number>();
  for (const p of list) if (p.lastName) counts.set(p.lastName, (counts.get(p.lastName) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

function Hero({ family, onAdd }: { family: Family; onAdd: () => void }) {
  const chat = useChat();
  const [q, setQ] = useState("");
  const settings = useQuery(api.family.getSettings);
  const saveFamilyName = useMutation(api.family.setFamilyName);
  const [editingName, setEditingName] = useState<string | null>(null);
  const { sample } = useSampleMode();
  // The saved family name wins; otherwise guess from the most common surname.
  // The sample family always goes by its own surname.
  const name = (!sample && settings?.familyName) || familyName(family.list);
  const elders = family.list
    .filter((p) => year(p.birthDate))
    .sort((a, b) => (a.birthDate ?? "").localeCompare(b.birthDate ?? ""));
  const root = elders[0];

  return (
    <section className="relative overflow-hidden bg-cream text-ink">
      <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        {/* A tall column suits the portrait photo: the women and the hills both fit, no fade. */}
        <div className="relative h-72 sm:h-96 lg:h-auto lg:min-h-[600px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/heritage/walking-colour.jpg"
            alt="Two young women in white beaded dress walking past homesteads in the hills"
            className="absolute inset-0 h-full w-full object-cover object-[50%_80%] sepia-[.12] saturate-[.9]"
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-7 py-10 sm:px-12 lg:px-14 lg:py-14">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-bead-blue-deep">Imvelaphi · where we come from</p>
            {editingName !== null ? (
              <form
                className="mt-4 flex flex-wrap items-center gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await saveFamilyName({ familyName: editingName });
                  setEditingName(null);
                }}
              >
                <label className="sr-only" htmlFor="family-name">
                  Family name
                </label>
                <input
                  id="family-name"
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && setEditingName(null)}
                  placeholder="Family name"
                  className="min-w-0 flex-1 rounded-2xl border border-line bg-card px-4 py-2 font-display text-4xl font-semibold text-ink outline-none focus:border-ochre"
                />
                <button type="submit" className="grid h-11 w-11 place-items-center rounded-full bg-ochre-deep text-white" aria-label="Save family name">
                  <Check size={18} />
                </button>
                <button type="button" onClick={() => setEditingName(null)} className="grid h-11 w-11 place-items-center rounded-full border border-line text-muted" aria-label="Cancel">
                  <X size={18} />
                </button>
              </form>
            ) : (
              <h1 className="group mt-4 font-display text-5xl font-semibold leading-[0.95] sm:text-6xl">
                {name ? (
                  <>
                    The <span className="italic text-ochre-deep">{name}</span>
                    <br />
                    family
                  </>
                ) : (
                  "Our family"
                )}
                {!sample && (
                  <button
                    type="button"
                    onClick={() => setEditingName(name ?? "")}
                    className="ml-3 inline-grid h-9 w-9 place-items-center rounded-full border border-line align-middle text-muted opacity-60 transition-opacity hover:bg-card hover:opacity-100 focus:opacity-100 group-hover:opacity-100"
                    aria-label="Change family name"
                    title="Change family name"
                  >
                    <Pencil size={15} />
                  </button>
                )}
              </h1>
            )}
            {settings && !sample && <FamilyClan settings={settings} />}
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink/70">
              {family.list.length} people across the generations
              {root?.birthPlace ? `, with roots in ${root.birthPlace}` : ""}
              {root ? `${root.birthPlace ? "," : ""} going back to ${fullName(root)}, born ${year(root.birthDate)}.` : "."}
            </p>
          </div>

          <div className="mt-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!q.trim()) return;
                chat.open(q);
                setQ("");
              }}
              className="flex items-center gap-2 rounded-full border border-line bg-card py-1.5 pl-5 pr-1.5 text-ink shadow-sm focus-within:border-ochre"
            >
              <AskIcon size={18} className="shrink-0 text-ink" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ask anything about the family…"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted/80"
                aria-label="Ask the family assistant"
              />
              <button type="submit" aria-label="Ask" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ochre-deep text-white transition-colors hover:bg-ochre">
                <ArrowUp size={16} />
              </button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Who are the elders?", "Where are we from?", "Tell me a family story"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => chat.open(s)}
                  className="rounded-full border border-ink/15 px-3.5 py-1.5 text-xs text-ink/80 transition-colors hover:bg-card"
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/tree" className="inline-flex items-center gap-2 rounded-full bg-ochre-deep px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-ochre">
                <Network size={16} /> Explore the tree
              </Link>
              <button type="button" onClick={onAdd} className="inline-flex items-center gap-2 rounded-full border border-ink/20 bg-card px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink/40">
                <UserPlus size={16} /> Add a relative
              </button>
            </div>
          </div>

          <StatsRow family={family} />
        </div>
      </div>
      <UmbhacoBand height={30} />
    </section>
  );
}

/* ---------- Stats ---------- */

// Each headline number wears one of the palette's colours.
const STAT_COLOURS = ["text-ochre-deep", "text-bead-blue-deep", "text-forest", "text-marigold-deep"];

function StatsRow({ family }: { family: Family }) {
  const stats = useMemo(() => {
    const layout = layoutTree({
      ids: family.list.map((p) => p._id),
      parentLinks: family.parentLinks,
      partnerships: family.partnerships,
    });
    const gens = new Set([...layout.nodes.values()].map((n) => n.gen)).size;
    const living = family.list.filter((p) => !p.deathDate).length;
    const places = new Set(
      family.list.flatMap((p) => [p.birthPlace, p.currentPlace]).filter(Boolean).map((s) => s!.toLowerCase()),
    ).size;
    return [
      { label: "Family members", value: family.list.length },
      { label: "Generations", value: gens },
      { label: "Living", value: living },
      { label: "Places", value: places },
    ];
  }, [family]);

  return (
    <dl className="mt-10 grid grid-cols-2 gap-y-5 border-t border-ink/10 pt-6 sm:grid-cols-4">
      {stats.map((s, i) => (
        <div key={s.label} className={i > 0 ? "sm:border-l sm:border-ink/10 sm:pl-5" : ""}>
          <dt className="text-[11px] font-medium uppercase tracking-wider text-muted">{s.label}</dt>
          <dd className={`mt-1 font-display text-4xl font-semibold leading-none ${STAT_COLOURS[i]}`}>{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------- Births by decade ---------- */

function Card({ title, action, children, className = "" }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`animate-rise min-w-0 rounded-[1.75rem] border border-line bg-card p-6 ${className}`}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function BirthsByDecade({ family, className }: { family: Family; className?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const data = useMemo(() => {
    const decades = family.list
      .map((p) => year(p.birthDate))
      .filter((y): y is number => !!y)
      .map((y) => Math.floor(y / 10) * 10);
    if (decades.length === 0) return [];
    const min = Math.min(...decades);
    const max = Math.max(...decades);
    const rows: { decade: number; count: number; names: string[] }[] = [];
    for (let d = min; d <= max; d += 10) {
      const born = family.list.filter((p) => {
        const y = year(p.birthDate);
        return y !== undefined && Math.floor(y / 10) * 10 === d;
      });
      rows.push({ decade: d, count: born.length, names: born.map((p) => p.firstName) });
    }
    return rows;
  }, [family]);

  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const H = 160;

  return (
    <Card title="Births by decade" className={className}>
      {data.length === 0 ? (
        <p className="text-sm text-muted">Add birth years to see how the family has grown over time.</p>
      ) : (
        <div>
          <div className="relative flex items-end gap-2 border-b border-line" style={{ height: H }}>
            {[0.5, 1].map((f) => (
              <span key={f} aria-hidden className="absolute inset-x-0 border-t border-dashed border-line" style={{ bottom: H * f - 1 }} />
            ))}
            {data.map((d, i) => (
              <div
                key={d.decade}
                className="relative flex h-full flex-1 items-end justify-center"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <div
                  className={`w-full max-w-10 rounded-t-[4px] transition-colors ${hover === i ? "bg-ochre-deep" : "bg-ochre"}`}
                  style={{ height: d.count ? (d.count / maxCount) * (H - 16) : 0 }}
                />
                {hover === i && (
                  <div
                    className="absolute z-10 mb-2 w-max max-w-48 -translate-y-1 rounded-2xl bg-ink px-3 py-2 text-xs text-cream shadow-lg"
                    style={{ bottom: (d.count / maxCount) * (H - 16) }}
                  >
                    <p className="font-semibold">
                      {d.decade}s · {d.count} {d.count === 1 ? "birth" : "births"}
                    </p>
                    {d.names.length > 0 && <p className="mt-0.5 text-cream/70">{d.names.join(", ")}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            {data.map((d) => (
              <span key={d.decade} className="flex-1 text-center text-[11px] text-muted">
                {`'${String(d.decade).slice(2)}`}
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

/* ---------- Birthdays ---------- */

function UpcomingBirthdays({ family, className }: { family: Family; className?: string }) {
  const upcoming = useMemo(() => upcomingBirthdays(family.list).slice(0, 4), [family]);

  return (
    <Card
      title="Coming birthdays"
      action={
        <Link href="/birthdays" className="inline-flex items-center gap-1 text-sm font-medium text-ochre-deep hover:underline">
          All birthdays <ArrowRight size={14} />
        </Link>
      }
      className={className}
    >
      {upcoming.length === 0 ? (
        <p className="text-sm text-muted">Add full birth dates (like 1985-04-12) to be reminded of birthdays.</p>
      ) : (
        <ul className="space-y-3">
          {upcoming.map(({ person: p, days, turning, next }) => (
            <li key={p._id}>
              <Link href={`/people/${p._id}`} className="flex items-center gap-3 rounded-2xl p-1.5 transition-colors hover:bg-cream">
                <Portrait person={p} size={44} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{fullName(p)}</span>
                  <span className="block text-xs text-muted">
                    Turns {turning} · {next.toLocaleDateString("en-ZA", { day: "numeric", month: "long" })}
                  </span>
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    days <= 7 ? "bg-marigold text-ink" : "bg-marigold-soft text-marigold-deep"
                  }`}
                >
                  {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ---------- Story ---------- */

function FeaturedStory({ family, className }: { family: Family; className?: string }) {
  const chat = useChat();
  const withStory = family.list.filter((p) => p.notes && p.notes.length > 40);
  // Rotate daily so the page feels alive.
  const pick = withStory.length ? withStory[new Date().getDate() % withStory.length] : undefined;

  return (
    <section className={`animate-rise relative overflow-hidden rounded-[1.75rem] bg-ink text-cream ${className}`}>
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/heritage/gathering.jpg" alt="" className="duotone h-full w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-transparent" />
      </div>
      <div className="relative z-10 flex h-full min-h-72 flex-col justify-end p-7 sm:p-9">
        <p className="text-xs uppercase tracking-[0.25em] text-ochre">From the archive</p>
        {pick ? (
          <>
            <blockquote className="mt-3 max-w-2xl font-display text-2xl italic leading-snug sm:text-3xl">“{pick.notes}”</blockquote>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <Link href={`/people/${pick._id}`} className="flex items-center gap-3">
                <Portrait person={pick} size={40} ring={false} />
                <span>
                  <span className="block text-sm font-medium">{fullName(pick)}</span>
                  <span className="block text-xs text-cream/70">{lifespan(pick)}</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => chat.open(`Tell me more about ${fullName(pick)}.`)}
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-cream px-4 py-2 text-xs font-medium text-ink hover:bg-white"
              >
                <AskIcon size={14} /> Ask about {pick.firstName}
              </button>
            </div>
          </>
        ) : (
          <p className="mt-3 max-w-xl font-display text-2xl italic leading-snug">Stories you add to people&apos;s profiles will appear here.</p>
        )}
      </div>
    </section>
  );
}

/* ---------- Roots ---------- */

function Roots({ family }: { family: Family }) {
  const places = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of family.list) if (p.birthPlace) counts.set(p.birthPlace, (counts.get(p.birthPlace) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [family]);
  const max = Math.max(1, ...places.map(([, n]) => n));

  return (
    <Card title="Where we were born" action={<MapPin size={20} className="text-bead-blue" />}>
      {places.length === 0 ? (
        <p className="text-sm text-muted">Add birthplaces to map the family&apos;s roots.</p>
      ) : (
        <ul className="space-y-3.5">
          {places.map(([place, n]) => (
            <li key={place}>
              <div className="mb-1.5 flex justify-between text-sm">
                <span>{place}</span>
                <span className="text-muted">{n}</span>
              </div>
              <div className="h-2 rounded-full bg-bead-blue-soft">
                <div className="h-2 rounded-full bg-bead-blue" style={{ width: `${(n / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ---------- Clans ---------- */

function ClanNames({ family }: { family: Family }) {
  const clans = useMemo(() => {
    const m = new Map<string, Person[]>();
    for (const p of family.list) if (p.clanName) m.set(p.clanName, [...(m.get(p.clanName) ?? []), p]);
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [family]);

  return (
    <Card
      title="Iziduko · clan names"
      action={
        <span className="block h-20 w-20 shrink-0 overflow-hidden rounded-full ring-4 ring-cream">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/heritage/beadwork.jpg" alt="A beaded collar" className="duotone h-full w-full object-cover object-bottom" />
        </span>
      }
    >
      {clans.length === 0 ? (
        <p className="text-sm text-muted">Record clan names to honour each line of the family.</p>
      ) : (
        <div className="space-y-4">
          {clans.map(([clan, members]) => (
            <div key={clan} className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="w-36 shrink-0 truncate font-display text-2xl font-semibold text-ink">{clan}</span>
              <div className="flex -space-x-2">
                {members.slice(0, 6).map((p) => (
                  <Link key={p._id} href={`/people/${p._id}`} title={fullName(p)} className="rounded-full ring-2 ring-card">
                    <Portrait person={p} size={34} ring={false} />
                  </Link>
                ))}
              </div>
              <span className="ml-auto text-xs text-muted">{members.length}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ---------- Family isiduko ---------- */

function FamilyClan({ settings }: { settings: FamilySettings }) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="mt-4">
      {settings.clanName ? (
        <button type="button" onClick={() => setEditing(true)} className="group text-left" title="Edit our isiduko">
          <span className="block text-xs uppercase tracking-[0.2em] text-muted">Isiduko</span>
          <span className="mt-0.5 flex items-center gap-2 font-display text-3xl font-semibold text-ink">
            {settings.clanName}
            <Pencil size={13} className="text-muted opacity-0 transition-opacity group-hover:opacity-100" />
          </span>
          {settings.clanPraise && (
            <span className="mt-1 line-clamp-2 block max-w-md font-display text-lg italic leading-snug text-ink/70">
              {settings.clanPraise}
            </span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-ochre/50 px-3.5 py-1.5 text-xs font-medium text-ochre-deep hover:bg-ochre-soft"
        >
          <Plus size={13} /> Add our isiduko and izithakazelo
        </button>
      )}
      {editing && <FamilyDetailsEditor settings={settings} onClose={() => setEditing(false)} />}
    </div>
  );
}

/* ---------- Stay connected ---------- */

function StayConnected({ family }: { family: Family }) {
  const settings = useQuery(api.family.getSettings);
  const { sample } = useSampleMode();
  const [editing, setEditing] = useState(false);
  const reachable = useMemo(
    () =>
      family.list
        .filter((p) => !p.deathDate)
        .map((p) => ({ p, links: contactLinks(p) }))
        .filter((r) => r.links.length > 0),
    [family],
  );

  return (
    <Card title="Stay connected">
      {sample ? (
        // The WhatsApp group belongs to the real family, not the sample.
        <p className="rounded-2xl bg-paper p-4 text-sm text-muted">
          Your family&apos;s WhatsApp group link will show here.
        </p>
      ) : settings?.whatsappGroupUrl ? (
        <a
          href={settings.whatsappGroupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-2xl bg-forest p-4 text-white transition-colors hover:bg-forest-deep"
        >
          <MessageCircle size={22} />
          <span className="flex-1">
            <span className="block font-medium">Join the family WhatsApp group</span>
            <span className="block text-xs text-white/75">Opens WhatsApp</span>
          </span>
          <ArrowRight size={16} />
        </a>
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          disabled={!settings}
          className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-silver p-4 text-left text-sm text-muted hover:border-ochre hover:text-ink"
        >
          <MessageCircle size={20} className="text-forest" />
          Add the family WhatsApp group link
        </button>
      )}
      {!sample && settings?.whatsappGroupUrl && (
        <button type="button" onClick={() => setEditing(true)} className="mt-2 text-xs text-muted hover:text-ink hover:underline">
          Change group link
        </button>
      )}

      {!sample && settings?.familyCode && <FamilyCode code={settings.familyCode} className="mt-4" />}

      <p className="mt-5 text-xs font-medium uppercase tracking-wider text-muted">Find each other</p>
      {reachable.length === 0 ? (
        <p className="mt-2 text-sm text-muted">
          Add WhatsApp numbers and social handles on each person&apos;s profile so family can reach them.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {reachable.slice(0, 6).map(({ p, links }) => (
            <li key={p._id} className="flex items-center gap-3 py-2">
              <Link href={`/people/${p._id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <Portrait person={p} size={32} ring={false} />
                <span className="truncate text-sm font-medium">{p.firstName}</span>
              </Link>
              <span className="flex flex-wrap justify-end gap-1">
                {links.map((l) => (
                  <a
                    key={l.key}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full bg-paper px-2.5 py-1 text-[11px] font-medium text-ink hover:bg-mist"
                  >
                    {l.label}
                  </a>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
      {editing && settings && <FamilyDetailsEditor settings={settings} onClose={() => setEditing(false)} />}
    </Card>
  );
}

/* ---------- Gaps ---------- */

function MissingDetails({ family }: { family: Family }) {
  const gaps = useMemo(() => {
    return family.list
      .map((p) => {
        const missing = [
          !p.photoUrl && "portrait",
          !p.birthDate && "birth date",
          !p.birthPlace && "birthplace",
          !p.clanName && "clan name",
          !p.notes && "story",
        ].filter(Boolean) as string[];
        return { p, missing };
      })
      .filter((g) => g.missing.length > 0)
      .sort((a, b) => b.missing.length - a.missing.length)
      .slice(0, 5);
  }, [family]);

  return (
    <Card
      title="Help complete the story"
      action={
        <Link href="/people" className="inline-flex items-center gap-1 text-sm font-medium text-ochre-deep hover:underline">
          All people <ArrowRight size={14} />
        </Link>
      }
    >
      {gaps.length === 0 ? (
        <p className="text-sm text-muted">Everyone&apos;s profile is complete. Beautiful.</p>
      ) : (
        <ul className="divide-y divide-line">
          {gaps.map(({ p, missing }) => (
            <li key={p._id}>
              <Link href={`/people/${p._id}`} className="flex items-center gap-3 py-2.5 transition-colors hover:text-ochre-deep">
                <Portrait person={p} size={36} ring={false} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{fullName(p)}</span>
                  <span className="block truncate text-xs text-muted">Missing {missing.join(", ")}</span>
                </span>
                <ArrowRight size={15} className="text-ochre" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/* ---------- Empty & loading ---------- */

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">
      <div className="h-96 animate-pulse rounded-[2rem] bg-cream" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-[1.75rem] bg-mist" />
        ))}
      </div>
    </div>
  );
}
