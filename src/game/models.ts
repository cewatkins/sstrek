export type Vec3 = [number, number, number];
export type Wire = Vec3[];

function ring(y: number, r: number, n: number): Wire {
  const pts: Vec3[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    pts.push([Math.cos(a) * r, y, Math.sin(a) * r]);
  }
  return pts;
}

function link(a: Wire, b: Wire): Wire[] {
  const lines: Wire[] = [];
  const n = Math.min(a.length, b.length) - 1;
  for (let i = 0; i < n; i += 2) lines.push([a[i], b[i]]);
  return lines;
}

const cruiser: Wire[] = [
  [
    [0, 0.05, 1.55],
    [0.22, 0, 0.15],
    [0, -0.02, -1.15],
    [-0.22, 0, 0.15],
    [0, 0.05, 1.55],
  ],
  [
    [0, 0.05, 0.35],
    [1.45, -0.08, -0.55],
    [0.35, 0, -0.95],
    [0, 0.02, -0.45],
  ],
  [
    [0, 0.05, 0.35],
    [-1.45, -0.08, -0.55],
    [-0.35, 0, -0.95],
    [0, 0.02, -0.45],
  ],
  [
    [0, 0.28, 0.45],
    [0.16, 0.12, 0.05],
    [0, 0.08, -0.25],
    [-0.16, 0.12, 0.05],
    [0, 0.28, 0.45],
  ],
  [
    [0.42, 0, -0.72],
    [0.42, 0.16, -0.95],
    [0.42, 0, -1.15],
  ],
  [
    [-0.42, 0, -0.72],
    [-0.42, 0.16, -0.95],
    [-0.42, 0, -1.15],
  ],
];

const top = ring(0.18, 1, 8);
const bot = ring(-0.12, 1, 8);
const saucer: Wire[] = [
  top,
  bot,
  ...link(top, bot),
  ring(0.42, 0.38, 6),
  [
    [0, 0.42, 0],
    [0, 0.72, 0],
  ],
  [
    [-0.55, 0.18, 0],
    [0.55, 0.18, 0],
  ],
  [
    [0, 0.18, -0.55],
    [0, 0.18, 0.55],
  ],
];

const hex = ring(0, 1, 6);
const inner = ring(0.08, 0.48, 6);
const station: Wire[] = [
  hex,
  inner,
  ...link(hex, inner),
  [
    [0, 0, 0],
    [0, 1.15, 0],
  ],
  ring(1.15, 0.22, 5),
  [
    [0, 1.15, 0],
    [0, 1.45, 0],
  ],
  [
    [1, 0, 0],
    [0.62, 0.55, 0],
    [0, 0.2, 0],
  ],
  [
    [-0.5, 0, 0.86],
    [-0.32, 0.55, 0.5],
    [0, 0.2, 0],
  ],
  [
    [-0.5, 0, -0.86],
    [-0.32, 0.55, -0.5],
    [0, 0.2, 0],
  ],
];

const relic: Wire[] = [
  ring(0, 1, 8),
  ring(0.55, 0.72, 6),
  ring(-0.45, 0.72, 6),
  [
    [0, 1.05, 0],
    [0.7, 0, 0.7],
    [0, -0.9, 0],
    [-0.7, 0, -0.7],
    [0, 1.05, 0],
  ],
  [
    [0, 1.05, 0],
    [-0.7, 0, 0.7],
    [0, -0.9, 0],
    [0.7, 0, -0.7],
    [0, 1.05, 0],
  ],
];

const asteroid: Wire[] = [
  [
    [0.2, 0.4, 1],
    [1, 0.1, 0.2],
    [0.6, -0.4, -0.7],
    [-0.4, -0.2, -1],
    [-1, 0.3, -0.1],
    [-0.3, 0.6, 0.6],
    [0.2, 0.4, 1],
  ],
  [
    [0.2, 0.4, 1],
    [0.1, -0.7, 0.4],
    [0.6, -0.4, -0.7],
  ],
  [
    [-1, 0.3, -0.1],
    [-0.2, -0.8, 0.2],
    [0.1, -0.7, 0.4],
  ],
  [
    [1, 0.1, 0.2],
    [0.4, 0.9, -0.3],
    [-0.3, 0.6, 0.6],
  ],
];

const mine: Wire[] = [
  [
    [0, 0.9, 0],
    [0.7, 0, 0],
    [0, -0.9, 0],
    [-0.7, 0, 0],
    [0, 0.9, 0],
  ],
  [
    [0, 0.9, 0],
    [0, 0, 0.7],
    [0, -0.9, 0],
    [0, 0, -0.7],
    [0, 0.9, 0],
  ],
  ring(0, 0.7, 6),
];

const SHAPES: Record<string, Wire[]> = {
  raider: cruiser,
  hunter: cruiser,
  dart: cruiser,
  saucer,
  station,
  relic,
  asteroid,
  mine,
};

export function wiresFor(kind: string): Wire[] {
  return SHAPES[kind] ?? cruiser;
}

/** Local +Z is the nose. yaw 0 maps that nose onto world -Z. */
export function worldPoint(
  yaw: number,
  ox: number,
  oy: number,
  oz: number,
  lx: number,
  ly: number,
  lz: number,
): Vec3 {
  const co = Math.cos(yaw);
  const si = Math.sin(yaw);
  return [ox + lx * co - lz * si, oy + ly, oz - lx * si - lz * co];
}
