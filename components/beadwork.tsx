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
