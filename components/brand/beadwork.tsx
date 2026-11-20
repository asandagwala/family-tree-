/**
 * A strip of beads in the manner of Xhosa beadwork: a white ground edged in
 * black, with triangles that alternate between red ochre and turquoise.
 * Drawn bead by bead as a repeating SVG pattern.
 */
const COLS = 16; // one ochre triangle + one turquoise triangle
const ROWS = 4;

function beadColor(row: number, col: number) {
  if (row === 0 || row === ROWS - 1) return "var(--ink)";
  const half = COLS / 2;
  const c = col % half;
  // Downward triangle: wide on the first inner row, narrow on the next.
  const inner = row - 1; // 0 or 1
  const from = inner;
  const to = half - 1 - inner;
  if (c >= from + 1 && c <= to - 1) return col < half ? "var(--ochre)" : "var(--bead-blue)";
  return "#ffffff";
}

export function BeadworkBand({ height = 20, className = "" }: { height?: number; className?: string }) {
  const bead = height / ROWS; // diameter-ish
  const w = COLS * bead;
  const id = `beads-${height}`;
  return (
    <svg aria-hidden className={className} width="100%" height={height} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <pattern id={id} width={w} height={height} patternUnits="userSpaceOnUse">
          <rect width={w} height={height} fill="#f4f1ea" />
          {Array.from({ length: ROWS }).flatMap((_, r) =>
            Array.from({ length: COLS }).map((__, c) => (
              <circle
                key={`${r}-${c}`}
                cx={c * bead + bead / 2}
                cy={r * bead + bead / 2}
                r={bead * 0.42}
                fill={beadColor(r, c)}
                stroke="rgb(0 0 0 / 0.12)"
                strokeWidth={0.5}
              />
            )),
          )}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** A thin rule with a single bead-coloured diamond in the middle. */
export function DiamondRule({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`flex items-center gap-3 ${className}`}>
      <span className="h-px flex-1 bg-line" />
      <svg width="22" height="10" viewBox="0 0 22 10">
        <path d="M5 0 L10 5 L5 10 L0 5 Z" fill="var(--ochre)" />
        <path d="M17 0 L22 5 L17 10 L12 5 Z" fill="var(--bead-blue)" />
      </svg>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/**
 * A band drawn from umbhaco, the cream cloth worn by amaXhosa women: thick
 * and thin black braid lines, orange and turquoise stripes, and a row of
 * black zigzags with buttons. Designed at 58 units tall and scaled to `height`.
 */
export function UmbhacoBand({ height = 58, className = "" }: { height?: number; className?: string }) {
  const k = height / 58;
  const stripes: [number, number, string][] = [
    [0, 6, "var(--ink)"],
    [8, 1.4, "var(--ink)"],
    [11, 1.4, "var(--ink)"],
    [15.5, 4, "var(--ochre)"],
    [21.5, 2.6, "var(--bead-blue)"],
    [42.5, 2.6, "var(--bead-blue)"],
    [47, 2, "var(--ochre)"],
    [50.6, 1.2, "var(--ink)"],
    [53, 5, "var(--ink)"],
  ];
  const id = `umbhaco-zig-${height}`;
  const zw = 24 * k;
  return (
    <svg aria-hidden className={className} width="100%" height={height} style={{ display: "block" }}>
      <defs>
        <pattern id={id} width={zw} height={height} patternUnits="userSpaceOnUse">
          <path
            d={`M0 ${27 * k} L${6 * k} ${38 * k} L${12 * k} ${27 * k} L${18 * k} ${38 * k} L${24 * k} ${27 * k}`}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={1.6 * k}
            strokeLinejoin="miter"
          />
          <circle cx={6 * k} cy={30.5 * k} r={1.5 * k} fill="var(--ink)" />
          <circle cx={18 * k} cy={30.5 * k} r={1.5 * k} fill="var(--ink)" />
          <circle cx={12 * k} cy={37.5 * k} r={1.1 * k} fill="var(--ochre)" />
          <circle cx={24 * k} cy={37.5 * k} r={1.1 * k} fill="var(--ochre)" />
          <circle cx={0} cy={37.5 * k} r={1.1 * k} fill="var(--ochre)" />
        </pattern>
      </defs>
      <rect width="100%" height={height} fill="var(--cream)" />
      {stripes.map(([y, h, fill], i) => (
        <rect key={i} y={y * k} width="100%" height={Math.max(h * k, 1)} fill={fill} />
      ))}
      <rect width="100%" height={height} fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * The open beaded net of an iqhiya collar: a turquoise diamond lattice with
 * orange beads where the strands cross. Use as a decorative texture.
 */
export function BeadNet({ className = "", cell = 22 }: { className?: string; cell?: number }) {
  const id = `beadnet-${cell}`;
  const h = cell / 2;
  return (
    <svg aria-hidden className={className} width="100%" height="100%">
      <defs>
        <pattern id={id} width={cell} height={cell} patternUnits="userSpaceOnUse">
          <path
            d={`M0 ${h} L${h} 0 L${cell} ${h} L${h} ${cell} Z`}
            fill="none"
            stroke="var(--bead-blue)"
            strokeWidth={1.4}
            strokeDasharray="1.2 2.2"
            strokeLinecap="round"
          />
          {[
            [0, h],
            [h, 0],
            [cell, h],
            [h, cell],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={2.1} fill="var(--ochre)" />
          ))}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * A quiet tone-on-tone band of diamonds (an outlined diamond around a small
 * solid one), used as the header strip on People cards.
 */
export function DiamondBand({ color, height = 16, className = "" }: { color: string; height?: number; className?: string }) {
  const id = `diamond-band-${height}-${color.replace(/[^a-z0-9]/gi, "")}`;
  const h = height;
  return (
    <svg aria-hidden className={className} width="100%" height={h} style={{ display: "block" }}>
      <defs>
        <pattern id={id} width={h} height={h} patternUnits="userSpaceOnUse">
          <path
            d={`M${h / 2} ${h * 0.08} L${h * 0.92} ${h / 2} L${h / 2} ${h * 0.92} L${h * 0.08} ${h / 2} Z`}
            fill="none"
            stroke={color}
            strokeWidth={h / 14}
          />
          <path d={`M${h / 2} ${h * 0.32} L${h * 0.68} ${h / 2} L${h / 2} ${h * 0.68} L${h * 0.32} ${h / 2} Z`} fill={color} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * Black-and-white beaded trim, after the edging on white beaded dresses:
 * black triangles hanging from a black edge onto white beads, with a row of
 * small black beads below. Designed 20 units tall and scaled to `height`.
 */
export function MonoBeadTrim({ height = 20, className = "" }: { height?: number; className?: string }) {
  const k = height / 20;
  const w = 12 * k;
  const id = `mono-trim-${height}`;
  return (
    <svg aria-hidden className={className} width="100%" height={height} style={{ display: "block" }}>
      <defs>
        <pattern id={id} width={w} height={height} patternUnits="userSpaceOnUse">
          <rect width={w} height={height} fill="#ffffff" />
          {/* a black triangle hanging from the top edge */}
          <path d={`M0 0 L${w} 0 L${w / 2} ${11 * k} Z`} fill="var(--ink)" />
          {/* a white bead set in each triangle */}
          <circle cx={w / 2} cy={3.4 * k} r={1.4 * k} fill="#ffffff" />
          {/* a black bead between the teeth, and a row of small beads below */}
          <circle cx={0} cy={11 * k} r={1.5 * k} fill="var(--ink)" />
          <circle cx={w} cy={11 * k} r={1.5 * k} fill="var(--ink)" />
          <circle cx={w / 4} cy={16.5 * k} r={1.1 * k} fill="var(--ink)" />
          <circle cx={(3 * w) / 4} cy={16.5 * k} r={1.1 * k} fill="var(--ink)" />
        </pattern>
      </defs>
      <rect width="100%" height={height} fill={`url(#${id})`} />
    </svg>
  );
}

/**
 * A compact umbhaco trim for small places like menu items: the same stripes
 * as the full band (black edge, orange, a small zigzag, turquoise), drawn at
 * a size where every line stays crisp. 8px tall.
 */
export function UmbhacoTrim({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden className={className} width="100%" height={8} style={{ display: "block" }}>
      <defs>
        <pattern id="umbhaco-trim-zig" width={6} height={8} patternUnits="userSpaceOnUse">
          <path d="M0 3.2 L1.5 5.8 L3 3.2 L4.5 5.8 L6 3.2" fill="none" stroke="var(--ink)" strokeWidth={0.9} />
        </pattern>
      </defs>
      <rect y={0} width="100%" height={1} fill="var(--ink)" />
      <rect y={1.6} width="100%" height={1} fill="var(--ochre)" />
      <rect width="100%" height={8} fill="url(#umbhaco-trim-zig)" />
      <rect y={7} width="100%" height={1} fill="var(--bead-blue)" />
    </svg>
  );
}
