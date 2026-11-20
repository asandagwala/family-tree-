"use client";

import { ArrowRight, Maximize, Minus, Plus, Search, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fullName, initialsTone, INITIALS_TEXT, lifespan, type PersonId } from "@/lib/people";
import { CARD_H, CARD_W, PORTRAIT, layoutTree, type Layout } from "@/lib/tree-layout";
import { useFamily, type Family } from "@/lib/use-family";
import { useChat } from "@/components/chat/chat-context";
import { PersonEditor } from "@/components/people/person-editor";
import { Portrait } from "@/components/people/portrait";
import { btnPrimary } from "@/components/ui/modal";
import { AskIcon } from "@/components/brand/ask-icon";

type View = { x: number; y: number; k: number };
const MIN_K = 0.2;
const MAX_K = 2;
const LABEL_SPACE = 150;

export function TreeView() {
  const family = useFamily();
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  if (family === undefined) {
    return <div className="grid h-full place-items-center text-muted">Gathering the family…</div>;
  }
  if (family.list.length === 0) {
    return (
      <div className="grid h-full place-items-center p-8 text-center">
        <div>
          <h1 className="font-display text-4xl font-semibold text-night">The tree is waiting for its roots</h1>
          <p className="mt-2 text-muted">Add the first person to start growing it.</p>
          <button type="button" onClick={() => setAdding(true)} className={`${btnPrimary} mt-6`}>
            <UserPlus size={16} /> Add a person
          </button>
        </div>
        {adding && (
          <PersonEditor mode={{ kind: "new" }} family={family} onClose={() => setAdding(false)} onSaved={(id) => router.push(`/people/${id}`)} />
        )}
      </div>
    );
  }
  return <TreeCanvas family={family} />;
}

function TreeCanvas({ family }: { family: Family }) {
  const chat = useChat();
  const layout: Layout = useMemo(
    () =>
      layoutTree({
        ids: family.list.map((p) => p._id),
        parentLinks: family.parentLinks,
        partnerships: family.partnerships,
      }),
    [family],
  );
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, k: 1 });
  const [selected, setSelected] = useState<PersonId | null>(null);
  const [query, setQuery] = useState("");
  const drag = useRef<{ px: number; py: number; vx: number; vy: number; moved: boolean; id: PersonId | null } | null>(null);

  const gens = useMemo(() => {
    const ys = new Map<number, number>();
    for (const n of layout.nodes.values()) ys.set(n.gen, n.y);
    return [...ys.entries()].sort((a, b) => a[0] - b[0]);
  }, [layout]);

  const fit = useCallback(() => {
    const el = svgRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    const { minY, maxX, maxY } = layout.bounds;
    const minX = layout.bounds.minX - LABEL_SPACE; // keep generation labels in view
    const pad = 60;
    const k = Math.min(Math.max(Math.min(width / (maxX - minX + pad * 2), height / (maxY - minY + pad * 2)), MIN_K), 1.1);
    setView({ k, x: width / 2 - ((minX + maxX) / 2) * k, y: height / 2 - ((minY + maxY) / 2) * k + 20 });
  }, [layout]);

  const focus = useCallback(
    (id: PersonId) => {
      const el = svgRef.current;
      const n = layout.nodes.get(id);
      if (!el || !n) return;
      const { width, height } = el.getBoundingClientRect();
      setView((v) => {
        const k = Math.max(v.k, 0.9);
        return { k, x: width / 2 - (n.x + CARD_W / 2) * k, y: height / 2 - (n.y + CARD_H / 2) * k };
      });
      setSelected(id);
    },
    [layout],
  );

  const fitted = useRef(false);
  useEffect(() => {
    if (!fitted.current) {
      fitted.current = true;
      fit();
    }
  }, [fit]);

  const zoomAt = useCallback((factor: number, cx: number, cy: number) => {
    setView((v) => {
      const k = Math.min(Math.max(v.k * factor, MIN_K), MAX_K);
      const f = k / v.k;
      return { k, x: cx - (cx - v.x) * f, y: cy - (cy - v.y) * f };
    });
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const zoomCenter = (f: number) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (r) zoomAt(f, r.width / 2, r.height / 2);
  };

  const matches = query.trim()
    ? family.list.filter((p) => fullName(p).toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6)
    : [];
  const sel = selected ? family.people.get(selected) : undefined;
  const romanGen = (i: number) => ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"][i] ?? String(i + 1);

  return (
    <div className="relative h-full min-h-[600px] overflow-hidden bg-paper">
      {/* soft radial light behind the tree */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,var(--mint)_0%,transparent_60%)] opacity-70" />

      <svg
        ref={svgRef}
        className="relative h-full w-full touch-none select-none cursor-grab active:cursor-grabbing"
        role="tree"
        aria-label="Family tree"
        onPointerDown={(e) => {
          const card = (e.target as Element).closest("[data-person]");
          const id = (card?.getAttribute("data-person") as PersonId | null) ?? null;
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = { px: e.clientX, py: e.clientY, vx: view.x, vy: view.y, moved: false, id };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const dx = e.clientX - d.px;
          const dy = e.clientY - d.py;
          if (!d.moved && Math.hypot(dx, dy) < 4) return;
          d.moved = true;
          setView((v) => ({ ...v, x: d.vx + dx, y: d.vy + dy }));
        }}
        onPointerUp={() => {
          const d = drag.current;
          drag.current = null;
          if (d && !d.moved) setSelected(d.id);
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <defs>
          <clipPath id="portrait-clip">
            <circle cx={CARD_W / 2} cy={PORTRAIT / 2} r={PORTRAIT / 2} />
          </clipPath>
        </defs>
        <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
          {/* Generation guides */}
          {gens.map(([g, y], i) => (
            <g key={g} opacity={0.9}>
              <line
                x1={layout.bounds.minX - 400}
                x2={layout.bounds.maxX + 400}
                y1={y + PORTRAIT / 2}
                y2={y + PORTRAIT / 2}
                stroke="var(--line)"
                strokeDasharray="2 8"
              />
              <text
                x={layout.bounds.minX - LABEL_SPACE}
                y={y + PORTRAIT / 2 + 5}
                fontSize={13}
                letterSpacing="0.2em"
                fill="var(--moss)"
                textAnchor="start"
              >
                GENERATION {romanGen(i)}
              </text>
            </g>
          ))}

          {/* Branches */}
          <g fill="none" strokeLinecap="round">
            {layout.edges.map((e, i) => {
              if (e.kind === "trunk") return <path key={i} d={e.d} stroke="var(--evergreen)" strokeWidth={4} />;
              if (e.kind === "branch") return <path key={i} d={e.d} stroke="var(--moss)" strokeWidth={2} />;
              if (e.kind === "partner")
                return (
                  <g key={i}>
                    <line x1={e.x1} x2={e.x2} y1={e.y} y2={e.y} stroke="var(--evergreen)" strokeWidth={2} />
                    <path
                      d={`M${(e.x1 + e.x2) / 2} ${e.y - 6} l6 6 l-6 6 l-6 -6 Z`}
                      fill="var(--paper)"
                      stroke="var(--evergreen)"
                      strokeWidth={2}
                    />
                  </g>
                );
              return (
                <path
                  key={i}
                  d={`M${e.x} ${e.y - 7} l7 7 l-7 7 l-7 -7 Z`}
                  fill="var(--sage)"
                  stroke="var(--paper)"
                  strokeWidth={2.5}
                />
              );
            })}
          </g>

          {/* People */}
          {[...layout.nodes.values()].map((n) => {
            const p = family.people.get(n.id as PersonId);
            if (!p) return null;
            const isSel = n.id === selected;
            const deceased = !!p.deathDate;
            const r = PORTRAIT / 2;
            return (
              <g
                key={n.id}
                data-person={n.id}
                transform={`translate(${n.x},${n.y})`}
                className="cursor-pointer"
                role="treeitem"
                aria-selected={isSel}
                aria-label={fullName(p)}
              >
                <circle cx={CARD_W / 2} cy={r} r={r + (isSel ? 9 : 6)} fill={isSel ? "var(--forest)" : "var(--paper)"} />
                <circle cx={CARD_W / 2} cy={r} r={r + 3} fill="none" stroke={deceased ? "var(--silver)" : "var(--sage)"} strokeWidth={2} />
                {p.photoUrl ? (
                  <image
                    href={p.photoUrl}
                    x={CARD_W / 2 - r}
                    y={0}
                    width={PORTRAIT}
                    height={PORTRAIT}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath="url(#portrait-clip)"
                    style={deceased ? { filter: "grayscale(1)" } : undefined}
                  />
                ) : (
                  <>
                    <circle cx={CARD_W / 2} cy={r} r={r} fill={initialsTone(p._id)} />
                    <text
                      x={CARD_W / 2}
                      y={r + 10}
                      textAnchor="middle"
                      fontSize={28}
                      fontWeight={600}
                      fill={INITIALS_TEXT}
                      style={{ fontFamily: "var(--font-cormorant)" }}
                    >
                      {(p.firstName[0] ?? "") + (p.lastName[0] ?? "")}
                    </text>
                  </>
                )}
                <text
                  x={CARD_W / 2}
                  y={PORTRAIT + 26}
                  textAnchor="middle"
                  fontSize={19}
                  fontWeight={600}
                  fill="var(--ink)"
                  style={{ fontFamily: "var(--font-cormorant)" }}
                >
                  {p.firstName}
                </text>
                <text x={CARD_W / 2} y={PORTRAIT + 44} textAnchor="middle" fontSize={11.5} fill="var(--muted)">
                  {[p.lastName, lifespan(p)].filter(Boolean).join(" · ")}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Header + search */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-4 p-5 sm:p-7">
        <div className="pointer-events-auto">
          <h1 className="font-display text-4xl font-semibold leading-none text-forest-deep">Family tree</h1>
          <p className="mt-1.5 text-sm text-muted">Drag to explore · scroll to zoom · tap someone to see more</p>
        </div>
        <div className="pointer-events-auto relative w-full max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find someone"
            className="w-full rounded-full border border-line bg-card/90 py-2.5 pl-10 pr-4 text-sm shadow-sm outline-none backdrop-blur focus:border-slate-soft"
          />
          {matches.length > 0 && (
            <ul className="absolute inset-x-0 top-full mt-2 overflow-hidden rounded-3xl border border-line bg-card p-1.5 shadow-xl">
              {matches.map((p) => (
                <li key={p._id}>
                  <button
                    type="button"
                    onClick={() => {
                      focus(p._id);
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-3 rounded-2xl px-2.5 py-2 text-left text-sm hover:bg-mist/50"
                  >
                    <Portrait person={p} size={30} ring={false} />
                    <span className="flex-1">{fullName(p)}</span>
                    <span className="text-xs text-muted">{lifespan(p)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Selected person card */}
      {sel && (
        <div className="animate-rise absolute bottom-24 left-4 right-4 max-w-sm rounded-[1.75rem] border border-line bg-card p-5 shadow-2xl sm:bottom-6 sm:left-6 sm:right-auto">
          <div className="flex items-center gap-4">
            <Portrait person={sel} size={64} />
            <div className="min-w-0">
              <p className="truncate font-display text-2xl font-semibold leading-tight text-night">{fullName(sel)}</p>
              <p className="text-sm text-muted">
                {[lifespan(sel), sel.clanName && `${sel.clanName} clan`].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          {sel.notes && <p className="mt-3 line-clamp-2 text-sm text-coal/80">{sel.notes}</p>}
          <div className="mt-4 flex gap-2">
            <Link href={`/people/${sel._id}`} className={`${btnPrimary} flex-1`}>
              Open profile <ArrowRight size={15} />
            </Link>
            <button
              type="button"
              onClick={() => chat.open(`Tell me about ${fullName(sel)}.`)}
              className="grid h-10 w-10 place-items-center rounded-full border border-line text-slate hover:bg-mist"
              aria-label={`Ask about ${fullName(sel)}`}
              title={`Ask about ${sel.firstName}`}
            >
              <AskIcon size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-24 right-4 flex flex-col overflow-hidden rounded-full border border-line bg-card shadow-sm sm:bottom-6 sm:right-6">
        <ZoomButton label="Zoom in" onClick={() => zoomCenter(1.25)}>
          <Plus size={17} />
        </ZoomButton>
        <ZoomButton label="Zoom out" onClick={() => zoomCenter(0.8)}>
          <Minus size={17} />
        </ZoomButton>
        <ZoomButton label="Fit to screen" onClick={() => fit()}>
          <Maximize size={17} />
        </ZoomButton>
      </div>
    </div>
  );
}

function ZoomButton(props: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={props.label}
      aria-label={props.label}
      onClick={props.onClick}
      className="grid h-11 w-11 place-items-center text-slate hover:bg-mist"
    >
      {props.children}
    </button>
  );
}
