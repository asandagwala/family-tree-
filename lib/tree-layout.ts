/**
 * Lays a family out in generations: ancestors above, descendants below,
 * partners side by side. Pure functions, so it can be tested on its own.
 */

/** Each node is a round portrait with the name beneath it. */
export const CARD_W = 150;
export const CARD_H = 128;
export const PORTRAIT = 76;
const PARTNER_GAP = 30; // gap between partners (holds the partner bond)
const UNIT_GAP = 44; // gap between unrelated people / couples
const ROW_GAP = 120; // vertical space between generations

export type LayoutInput = {
  ids: string[];
  parentLinks: { parentId: string; childId: string }[];
  partnerships: { personA: string; personB: string }[];
};

export type NodePos = { id: string; x: number; y: number; gen: number };

/**
 * A line in the tree. `group` names the couple (or single parent) it belongs
 * to: the partner bond and the lines down to that couple's children share it,
 * so the tree can colour each couple's lines alike.
 */
export type Edge =
  | { kind: "partner"; group: string; x1: number; x2: number; y: number }
  | { kind: "trunk"; group: string; d: string }
  | { kind: "branch"; group: string; d: string }
  | { kind: "fork"; group: string; x: number; y: number };

/** The group of a couple or single parent: their ids, sorted, joined. */
export const coupleKey = (ids: string[]) => [...ids].sort().join("|");

export type Layout = {
  nodes: Map<string, NodePos>;
  edges: Edge[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
};

type Unit = { members: string[]; width: number; x: number };

export function layoutTree(input: LayoutInput): Layout {
  const ids = new Set(input.ids);
  const parentsOf = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();
  const partnersOf = new Map<string, string[]>();
  for (const id of ids) {
    parentsOf.set(id, []);
    childrenOf.set(id, []);
    partnersOf.set(id, []);
  }
  for (const { parentId, childId } of input.parentLinks) {
    if (!ids.has(parentId) || !ids.has(childId)) continue;
    parentsOf.get(childId)!.push(parentId);
    childrenOf.get(parentId)!.push(childId);
  }
  for (const { personA, personB } of input.partnerships) {
    if (!ids.has(personA) || !ids.has(personB)) continue;
    partnersOf.get(personA)!.push(personB);
    partnersOf.get(personB)!.push(personA);
  }

  const gen = assignGenerations(input.ids, parentsOf, childrenOf, partnersOf);
  const order = initialOrder(input.ids, parentsOf, childrenOf, partnersOf);

  // Group each generation into units: partners in the same row stay together.
  const rows = new Map<number, Unit[]>();
  const unitOf = new Map<string, Unit>();
  for (const id of order) {
    if (unitOf.has(id)) continue;
    const g = gen.get(id)!;
    const members = partnerChain(id, partnersOf, gen, unitOf);
    const unit: Unit = {
      members,
      width: members.length * CARD_W + (members.length - 1) * PARTNER_GAP,
      x: 0,
    };
    for (const m of members) unitOf.set(m, unit);
    if (!rows.has(g)) rows.set(g, []);
    rows.get(g)!.push(unit);
  }

  const gens = [...rows.keys()].sort((a, b) => a - b);
  const centerOf = (id: string) => {
    const u = unitOf.get(id)!;
    const i = u.members.indexOf(id);
    return u.x + i * (CARD_W + PARTNER_GAP) + CARD_W / 2;
  };
  const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;

  // Start every row packed from zero.
  for (const g of gens)
    place(
      rows.get(g)!,
      rows.get(g)!.map(() => NaN),
    );

  // Alternate down/up sweeps: order by and move toward relatives.
  for (let sweep = 0; sweep < 6; sweep++) {
    const down = sweep % 2 === 0;
    const seq = down ? gens.slice(1) : gens.slice(0, -1).reverse();
    for (const g of seq) {
      const row = rows.get(g)!;
      const desired = row.map((u) => {
        const rel = u.members.flatMap((m) => (down ? parentsOf.get(m)! : childrenOf.get(m)!));
        return rel.length ? avg(rel.map(centerOf)) - u.width / 2 : NaN;
      });
      // Reorder by desired position, keeping current order for ties/unknowns.
      const keyed = row.map((u, i) => ({
        u,
        key: Number.isNaN(desired[i]) ? u.x : desired[i],
        d: desired[i],
      }));
      keyed.sort((a, b) => a.key - b.key);
      rows.set(
        g,
        keyed.map((k) => k.u),
      );
      place(
        keyed.map((k) => k.u),
        keyed.map((k) => k.d),
      );
    }
  }

  // Positions.
  const nodes = new Map<string, NodePos>();
  const minGen = gens[0] ?? 0;
  for (const g of gens) {
    const y = (g - minGen) * (CARD_H + ROW_GAP);
    for (const u of rows.get(g)!) {
      u.members.forEach((id, i) => {
        nodes.set(id, { id, gen: g, x: u.x + i * (CARD_W + PARTNER_GAP), y });
      });
    }
  }

  const portraitMid = PORTRAIT / 2;
  const edges: Edge[] = [];

  // Partner bonds between adjacent partners, level with their portraits.
  const seenUnits = new Set<Unit>();
  for (const u of unitOf.values()) {
    if (seenUnits.has(u)) continue;
    seenUnits.add(u);
    for (let i = 0; i + 1 < u.members.length; i++) {
      const a = nodes.get(u.members[i])!;
      edges.push({
        kind: "partner",
        group: coupleKey([u.members[i], u.members[i + 1]]),
        x1: a.x + CARD_W / 2 + portraitMid + 6,
        x2: a.x + CARD_W + PARTNER_GAP + CARD_W / 2 - portraitMid - 6,
        y: a.y + portraitMid,
      });
    }
  }

  // Parent → child: a short trunk from the parents, forking into curved
  // branches that land on top of each child's portrait.
  const families = new Map<string, { parents: string[]; children: string[] }>();
  for (const id of input.ids) {
    const ps = parentsOf.get(id)!;
    if (ps.length === 0) continue;
    const key = coupleKey(ps);
    if (!families.has(key)) families.set(key, { parents: [...ps], children: [] });
    families.get(key)!.children.push(id);
  }
  for (const [group, { parents, children }] of families) {
    const pNodes = parents.map((p) => nodes.get(p)!);
    const adjacentCouple =
      pNodes.length === 2 &&
      unitOf.get(parents[0]) === unitOf.get(parents[1]) &&
      Math.abs(pNodes[0].x - pNodes[1].x) === CARD_W + PARTNER_GAP;

    let ox: number;
    let oy: number;
    if (adjacentCouple) {
      ox = (pNodes[0].x + pNodes[1].x + CARD_W) / 2;
      oy = pNodes[0].y + portraitMid;
    } else {
      // Parents who aren't side by side: their lines meet between them, a
      // little below the names so they don't run through anyone's name.
      ox = pNodes.reduce((s, n) => s + n.x + CARD_W / 2, 0) / pNodes.length;
      oy = Math.max(...pNodes.map((n) => n.y)) + CARD_H + 10;
      for (const n of pNodes) {
        if (pNodes.length > 1) {
          const nx = n.x + CARD_W / 2;
          edges.push({ kind: "branch", group, d: `M${nx},${n.y + CARD_H - 4}Q${nx},${oy} ${ox},${oy}` });
        }
      }
    }
    const childTop = Math.min(...children.map((c) => nodes.get(c)!.y));
    const forkY = oy + (childTop - oy) * (adjacentCouple ? 0.55 : 0.4);
    edges.push({ kind: "trunk", group, d: `M${ox},${oy}V${forkY}` });
    for (const c of children) {
      const n = nodes.get(c)!;
      const cx = n.x + CARD_W / 2;
      const cy = n.y - 4;
      const dy = cy - forkY;
      edges.push({
        kind: "branch",
        group,
        d: `M${ox},${forkY}C${ox},${forkY + dy * 0.55} ${cx},${forkY + dy * 0.35} ${cx},${cy}`,
      });
    }
    edges.push({ kind: "fork", group, x: ox, y: forkY });
  }
  const uniqueEdges = edges;

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const n of nodes.values()) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + CARD_W);
    maxY = Math.max(maxY, n.y + CARD_H);
  }
  if (nodes.size === 0) minX = minY = maxX = maxY = 0;

  return { nodes, edges: uniqueEdges, bounds: { minX, minY, maxX, maxY } };
}

/**
 * Place units left to right in their given order, as close to their desired
 * x as spacing allows. Averages a left-packed and a right-packed solution so
 * crowding spreads both ways instead of drifting right.
 */
function place(units: Unit[], desired: number[]) {
  const n = units.length;
  if (n === 0) return;
  // Fill unknown desires from neighbours so free units sit beside their row.
  const want = [...desired];
  const firstKnown = want.findIndex((d) => !Number.isNaN(d));
  if (firstKnown === -1) {
    let x = 0;
    for (const u of units) {
      u.x = x;
      x += u.width + UNIT_GAP;
    }
    return;
  }
  for (let i = firstKnown - 1; i >= 0; i--) {
    want[i] = want[i + 1] - units[i].width - UNIT_GAP;
  }
  for (let i = firstKnown + 1; i < n; i++) {
    if (Number.isNaN(want[i])) {
      want[i] = want[i - 1] + units[i - 1].width + UNIT_GAP;
    }
  }

  const left = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    left[i] = i === 0 ? want[0] : Math.max(want[i], left[i - 1] + units[i - 1].width + UNIT_GAP);
  }
  const right = new Array<number>(n);
  for (let i = n - 1; i >= 0; i--) {
    right[i] = i === n - 1 ? want[i] : Math.min(want[i], right[i + 1] - units[i].width - UNIT_GAP);
  }
  for (let i = 0; i < n; i++) units[i].x = (left[i] + right[i]) / 2;
}

/** Partners connected through same-generation partnerships, as a chain. */
function partnerChain(
  start: string,
  partnersOf: Map<string, string[]>,
  gen: Map<string, number>,
  taken: Map<string, Unit>,
): string[] {
  const g = gen.get(start)!;
  const group: string[] = [];
  const stack = [start];
  const seen = new Set<string>();
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id) || taken.has(id) || gen.get(id) !== g) continue;
    seen.add(id);
    group.push(id);
    for (const p of partnersOf.get(id)!) stack.push(p);
  }
  // Put the most-connected person in the middle so each partner is adjacent
  // to them (handles remarriage: ex — person — current).
  if (group.length > 2) {
    group.sort((a, b) => partnersOf.get(b)!.length - partnersOf.get(a)!.length);
    const [hub, ...rest] = group;
    const half = Math.ceil(rest.length / 2);
    return [...rest.slice(0, half), hub, ...rest.slice(half)];
  }
  return group;
}

function assignGenerations(
  ids: string[],
  parentsOf: Map<string, string[]>,
  childrenOf: Map<string, string[]>,
  partnersOf: Map<string, string[]>,
): Map<string, number> {
  const gen = new Map<string, number>(ids.map((id) => [id, 0]));
  const limit = ids.length + 5;
  for (let round = 0; round < limit; round++) {
    let changed = false;
    for (const id of ids) {
      // Below every parent.
      for (const p of parentsOf.get(id)!) {
        if (gen.get(id)! < gen.get(p)! + 1) {
          gen.set(id, gen.get(p)! + 1);
          changed = true;
        }
      }
      // Level with partners.
      for (const p of partnersOf.get(id)!) {
        if (gen.get(id)! < gen.get(p)!) {
          gen.set(id, gen.get(p)!);
          changed = true;
        }
      }
      // A person with no parents of their own sits just above their children.
      if (parentsOf.get(id)!.length === 0 && childrenOf.get(id)!.length > 0) {
        const target = Math.min(...childrenOf.get(id)!.map((c) => gen.get(c)!)) - 1;
        if (gen.get(id)! < target) {
          gen.set(id, target);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }
  return gen;
}

/** Depth-first order through families, so relatives start out near each other. */
function initialOrder(
  ids: string[],
  parentsOf: Map<string, string[]>,
  childrenOf: Map<string, string[]>,
  partnersOf: Map<string, string[]>,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const visit = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    out.push(id);
    for (const p of partnersOf.get(id)!) visit(p);
    for (const c of childrenOf.get(id)!) visit(c);
  };
  for (const id of ids) if (parentsOf.get(id)!.length === 0) visit(id);
  for (const id of ids) visit(id);
  return out;
}

/**
 * Each couple's lines get their own colour, so with several partners it stays
 * clear whose children are whose. Earthy tones from the site's palette, all
 * dark enough to stand out on the paper background.
 */
export const COUPLE_COLOURS = [
  "#235347", // forest
  "#a5421a", // terracotta
  "#15707f", // bead blue
  "#8a5a00", // marigold
  "#7a3b69", // plum
  "#404f68", // slate
  "#9c3d54", // rose
  "#2f7a5f", // sage green
];

/**
 * Give every couple a colour, left to right, never reusing a colour another
 * couple of the same person already has, so someone with several partners
 * shows each relationship in a different colour.
 */
export function coupleColours(edges: Edge[]) {
  const xOf = new Map<string, number>();
  for (const e of edges) {
    const x = e.kind === "partner" ? e.x1 : e.kind === "fork" ? e.x : undefined;
    if (x !== undefined && !xOf.has(e.group)) xOf.set(e.group, x);
    if (!xOf.has(e.group)) xOf.set(e.group, Number.MAX_SAFE_INTEGER);
  }
  const groups = [...xOf.keys()].sort((a, b) => xOf.get(a)! - xOf.get(b)!);
  const colourOf = new Map<string, string>();
  let last = -1;
  for (const g of groups) {
    const people = g.split("|");
    const taken = new Set(
      [...colourOf].filter(([other]) => other.split("|").some((id) => people.includes(id))).map(([, c]) => c),
    );
    let pick = (last + 1) % COUPLE_COLOURS.length;
    for (let i = 0; i < COUPLE_COLOURS.length; i++) {
      const c = (last + 1 + i) % COUPLE_COLOURS.length;
      if (!taken.has(COUPLE_COLOURS[c])) {
        pick = c;
        break;
      }
    }
    colourOf.set(g, COUPLE_COLOURS[pick]);
    last = pick;
  }
  return colourOf;
}
