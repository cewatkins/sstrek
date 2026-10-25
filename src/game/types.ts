export type Phase = "title" | "play" | "clear" | "pause" | "over";

export type Kind =
  | "raider"
  | "hunter"
  | "dart"
  | "saucer"
  | "asteroid"
  | "relic"
  | "mine"
  | "station"
  | "shot"
  | "shell";

export interface Player {
  x: number;
  z: number;
  yaw: number;
  speed: number;
  shields: number;
  shells: number;
  warp: number;
  r: number;
  lanceCd: number;
  shellCd: number;
  dockT: number;
  iframe: number;
  hurtT: number;
  warping: boolean;
  lockId: number;
}

export interface Ent {
  id: number;
  kind: Kind;
  x: number;
  z: number;
  y: number;
  vx: number;
  vz: number;
  yaw: number;
  hp: number;
  r: number;
  spd: number;
  cd: number;
  life: number;
  arm: number;
  alive: boolean;
  used: boolean;
  flash: number;
  intro: number;
  seed: number;
  ang: number;
}

export interface Beam {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  life: number;
  color: string;
}

export interface Bloom {
  x: number;
  z: number;
  life: number;
  max: number;
  color: string;
}

export interface Spark {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  color: string;
}

export interface Pop {
  x: number;
  z: number;
  y: number;
  text: string;
  life: number;
}

export interface Wing {
  id: string;
  name: string;
  color: string;
  alive: boolean;
  ship: Player;
  input: Input;
}

export interface Sim {
  phase: Phase;
  sector: number;
  sectorName: string;
  score: number;
  best: number;
  t: number;
  speedMul: number;
  clearT: number;
  shake: number;
  hitstop: number;
  banner: string;
  bannerSub: string;
  bannerT: number;
  hintT: number;
  player: Player;
  ents: Ent[];
  beams: Beam[];
  blooms: Bloom[];
  sparks: Spark[];
  pops: Pop[];
  events: string[];
  nextId: number;
  rng: () => number;
  /** Remote cruisers. Empty in solo. */
  wings: Wing[];
  /** Shared sector: one cruiser can fall and the wing keeps fighting. */
  coop: boolean;
  /** Local cruiser is dead while a wingmate is still up. */
  localDown: boolean;
}

export interface Input {
  steer: number;
  impulse: boolean;
  warp: boolean;
  lance: boolean;
  burst: boolean;
  spin: number;
}

export const WORLD = 2400;
export const LIMIT = 1120;
export const TURN_RATE = 2.45;
export const IMPULSE = 172;
export const WARP_SPEED = 540;

export function formatScore(n: number): string {
  return Math.max(0, Math.floor(n)).toString().padStart(6, "0");
}
