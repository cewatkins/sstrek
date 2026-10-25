import {
  IMPULSE,
  LIMIT,
  TURN_RATE,
  WARP_SPEED,
  type Ent,
  type Input,
  type Kind,
  type Player,
  type Sim,
} from "./types";

const BEST_KEY = "halcyon-ops-best";

const HOSTILE: Partial<Record<Kind, boolean>> = {
  raider: true,
  hunter: true,
  dart: true,
  saucer: true,
  relic: true,
};

const BLASTABLE: Partial<Record<Kind, boolean>> = {
  raider: true,
  hunter: true,
  dart: true,
  saucer: true,
  asteroid: true,
  relic: true,
  mine: true,
};

type Combat = "raider" | "hunter" | "dart" | "saucer" | "asteroid" | "relic";

interface Stat {
  hp: number;
  spd: number;
  r: number;
  y: number;
  turn: number;
  score: number;
  cd: number;
  range: number;
}

const STAT: Record<Combat, Stat> = {
  raider: { hp: 1, spd: 80, r: 26, y: 18, turn: 1.4, score: 150, cd: 1.65, range: 340 },
  hunter: { hp: 1, spd: 100, r: 24, y: 18, turn: 1.75, score: 220, cd: 1.25, range: 680 },
  dart: { hp: 1, spd: 142, r: 18, y: 16, turn: 2.55, score: 360, cd: 0.9, range: 580 },
  saucer: { hp: 2, spd: 74, r: 34, y: 20, turn: 0, score: 520, cd: 2.35, range: 200 },
  asteroid: { hp: 1, spd: 64, r: 28, y: 12, turn: 0, score: 30, cd: 0, range: 0 },
  relic: { hp: 4, spd: 44, r: 48, y: 26, turn: 0.55, score: 2000, cd: 3.2, range: 0 },
};

interface Plan {
  name: string;
  stations: number;
  speed: number;
  spawns: { k: Kind; n: number }[];
}

const CAMPAIGN: Omit<Plan, "speed">[] = [
  { name: "OUTER REACH", stations: 1, spawns: [{ k: "raider", n: 3 }] },
  { name: "AMBER LANE", stations: 1, spawns: [{ k: "raider", n: 3 }, { k: "hunter", n: 2 }] },
  { name: "TWIN ANCHORS", stations: 2, spawns: [{ k: "raider", n: 4 }, { k: "hunter", n: 2 }] },
  { name: "DRIFT FIELD", stations: 1, spawns: [{ k: "hunter", n: 2 }, { k: "asteroid", n: 8 }] },
  { name: "WHITE KNIVES", stations: 2, spawns: [{ k: "dart", n: 3 }, { k: "raider", n: 2 }] },
  {
    name: "SAUCER ARC",
    stations: 2,
    spawns: [
      { k: "saucer", n: 3 },
      { k: "raider", n: 2 },
      { k: "hunter", n: 1 },
    ],
  },
  {
    name: "CROSSFIRE",
    stations: 2,
    spawns: [
      { k: "hunter", n: 3 },
      { k: "dart", n: 2 },
      { k: "raider", n: 2 },
      { k: "asteroid", n: 4 },
    ],
  },
  {
    name: "RELIC WAKE",
    stations: 2,
    spawns: [
      { k: "relic", n: 1 },
      { k: "raider", n: 3 },
      { k: "hunter", n: 2 },
    ],
  },
  { name: "CYAN STORM", stations: 2, spawns: [{ k: "saucer", n: 4 }, { k: "dart", n: 3 }] },
  {
    name: "LAST ANCHOR",
    stations: 2,
    spawns: [
      { k: "relic", n: 1 },
      { k: "saucer", n: 2 },
      { k: "dart", n: 2 },
      { k: "hunter", n: 3 },
      { k: "raider", n: 2 },
    ],
  },
];

const attractAnchor = new WeakMap<Ent, { x: number; z: number }>();

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function readBest(): number {
  try {
    const n = Number(localStorage.getItem(BEST_KEY));
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function noteScore(sim: Sim): void {
  if (sim.score <= sim.best) return;
  sim.best = sim.score;
  try {
    localStorage.setItem(BEST_KEY, String(sim.best));
  } catch {
    /* private mode */
  }
}

function freshPlayer(): Player {
  return {
    x: 0,
    z: 720,
    yaw: 0,
    speed: 0,
    shields: 4,
    shells: 4,
    warp: 76,
    r: 26,
    lanceCd: 0,
    shellCd: 0,
    dockT: 0,
    iframe: 0,
    hurtT: 0,
    warping: false,
    lockId: -1,
  };
}

function mk(sim: Sim, kind: Kind, x: number, z: number, extra: Partial<Ent> = {}): Ent {
  const combat = (STAT as Partial<Record<Kind, Stat>>)[kind];
  return {
    id: sim.nextId++,
    kind,
    x,
    z,
    y: combat?.y ?? 0,
    vx: 0,
    vz: 0,
    yaw: sim.rng() * Math.PI * 2,
    hp: combat?.hp ?? 4,
    r: combat?.r ?? 24,
    spd: (combat?.spd ?? 0) * sim.speedMul,
    cd: 0.35 + sim.rng() * 0.5,
    life: 0,
    arm: 0,
    alive: true,
    used: false,
    flash: 0,
    intro: 0.85,
    seed: sim.rng(),
    ang: sim.rng() * Math.PI * 2,
    ...extra,
  };
}

function planFor(index: number): Plan {
  if (index < CAMPAIGN.length) return { ...CAMPAIGN[index], speed: 1 + index * 0.035 };
  const loop = index - CAMPAIGN.length + 1;
  return {
    name: `DEEP FIELD ${index + 1}`,
    stations: 2,
    speed: 1.28 + loop * 0.07,
    spawns: [
      { k: "raider", n: 3 + (loop % 3) },
      { k: "hunter", n: 2 + (loop % 3) },
      { k: "dart", n: 1 + (loop % 4) },
      { k: "saucer", n: loop % 2 },
      { k: "relic", n: loop % 3 === 0 ? 1 : 0 },
      { k: "asteroid", n: loop % 2 === 0 ? 5 : 0 },
    ],
  };
}

function spawnRim(sim: Sim, kind: Kind): void {
  for (let attempt = 0; attempt < 14; attempt++) {
    const a = sim.rng() * Math.PI * 2;
    const rad = 980 + sim.rng() * 130;
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad;
    if (Math.hypot(x - sim.player.x, z - sim.player.z) < 300) continue;
    let blocked = false;
    for (const e of sim.ents) {
      if (Math.hypot(e.x - x, e.z - z) < 90) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;
    const ent = mk(sim, kind, x, z);
    if (kind === "asteroid") {
      const ang = sim.rng() * Math.PI * 2;
      const sp = ent.spd * (0.7 + sim.rng() * 0.6);
      ent.vx = Math.cos(ang) * sp;
      ent.vz = Math.sin(ang) * sp;
    }
    if (kind === "saucer") {
      const ang = Math.atan2(-z, -x);
      ent.vx = Math.cos(ang) * ent.spd * 0.75;
      ent.vz = Math.sin(ang) * ent.spd * 0.75;
    }
    sim.ents.push(ent);
    return;
  }
}

export function beginSector(sim: Sim, index: number): void {
  const plan = planFor(index);
  sim.phase = "play";
  sim.sector = index;
  sim.sectorName = plan.name;
  sim.speedMul = plan.speed;
  sim.rng = mulberry32(10007 + index * 97);
  sim.ents = [];
  sim.beams = [];
  sim.blooms = [];
  sim.player.x = 0;
  sim.player.z = 720;
  sim.player.yaw = 0;
  sim.player.speed = 0;
  sim.player.dockT = 0;
  sim.player.warping = false;
  sim.player.iframe = 1.15;
  sim.player.lockId = -1;
  const spots = [
    { x: 0, z: -480 },
    { x: 540, z: 60 },
    { x: -520, z: 160 },
  ];
  for (let i = 0; i < plan.stations; i++) {
    const s = spots[i];
    sim.ents.push(mk(sim, "station", s.x, s.z, { hp: 4, r: 78, y: 0, spd: 0, intro: 0.7 }));
  }
  for (const sp of plan.spawns) {
    for (let i = 0; i < sp.n; i++) spawnRim(sim, sp.k);
  }
  sim.banner = `SECTOR ${String(index + 1).padStart(2, "0")}`;
  sim.bannerSub = plan.name;
  sim.bannerT = 2.35;
  sim.hintT = index === 0 ? 8 : 0;
  sim.events.push("alert");
}

export function createSim(): Sim {
  const sim: Sim = {
    phase: "title",
    sector: -1,
    sectorName: "STANDBY",
    score: 0,
    best: readBest(),
    t: 0,
    speedMul: 1,
    clearT: 0,
    shake: 0,
    hitstop: 0,
    banner: "",
    bannerSub: "",
    bannerT: 0,
    hintT: 0,
    player: freshPlayer(),
    ents: [],
    beams: [],
    blooms: [],
    sparks: [],
    pops: [],
    events: [],
    nextId: 1,
    rng: mulberry32(42),
  };
  sim.player.z = 560;
  const decor: [Kind, number, number][] = [
    ["station", 0, -420],
    ["raider", -640, -180],
    ["hunter", 620, 80],
    ["saucer", 180, -700],
    ["dart", -360, 480],
    ["relic", 760, -520],
  ];
  for (const [kind, x, z] of decor) {
    const ent = mk(sim, kind, x, z, { intro: 0 });
    if (kind === "station") {
      ent.hp = 4;
      ent.r = 78;
      ent.y = 0;
    }
    attractAnchor.set(ent, { x, z });
    sim.ents.push(ent);
  }
  return sim;
}

export function startGame(sim: Sim): void {
  sim.score = 0;
  sim.player = freshPlayer();
  sim.sparks = [];
  sim.pops = [];
  sim.shake = 0;
  sim.hitstop = 0;
  sim.events = [];
  beginSector(sim, 0);
}

function decayFx(sim: Sim, dt: number): void {
  sim.bannerT = Math.max(0, sim.bannerT - dt);
  sim.hintT = Math.max(0, sim.hintT - dt);
  const p = sim.player;
  p.hurtT = Math.max(0, p.hurtT - dt);
  p.iframe = Math.max(0, p.iframe - dt);
  p.lanceCd = Math.max(0, p.lanceCd - dt);
  p.shellCd = Math.max(0, p.shellCd - dt);
  sim.shake = Math.max(0, sim.shake - dt * 30);
  for (const e of sim.ents) if (e.flash > 0) e.flash = Math.max(0, e.flash - dt);
  for (const b of sim.beams) b.life -= dt;
  for (const b of sim.blooms) b.life -= dt;
  for (const s of sim.sparks) {
    s.life -= dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.z += s.vz * dt;
  }
  for (const pop of sim.pops) {
    pop.life -= dt;
    pop.y += 16 * dt;
  }
  sim.beams = sim.beams.filter((b) => b.life > 0);
  sim.blooms = sim.blooms.filter((b) => b.life > 0);
  sim.sparks = sim.sparks.filter((s) => s.life > 0);
  sim.pops = sim.pops.filter((pop) => pop.life > 0);
  if (sim.sparks.length > 120) sim.sparks.splice(0, sim.sparks.length - 120);
}

function stepTitle(sim: Sim, dt: number): void {
  const p = sim.player;
  p.yaw += dt * 0.16;
  p.x = Math.sin(sim.t * 0.2) * 30;
  p.z = 560;
  p.speed = 0;
  p.warping = false;
  for (const ent of sim.ents) {
    ent.yaw += dt * (ent.kind === "station" ? 0.25 : 0.45);
    const anchor = attractAnchor.get(ent);
    if (!anchor || ent.kind === "station") continue;
    ent.ang += dt * (0.28 + ent.seed * 0.25);
    ent.x = anchor.x + Math.cos(ent.ang) * 80;
    ent.z = anchor.z + Math.sin(ent.ang) * 80;
  }
}

function fwd(yaw: number): { fx: number; fz: number; rx: number; rz: number } {
  return {
    fx: -Math.sin(yaw),
    fz: -Math.cos(yaw),
    rx: Math.cos(yaw),
    rz: -Math.sin(yaw),
  };
}

function steerToward(ent: Ent, tx: number, tz: number, turn: number, dt: number): void {
  const dx = tx - ent.x;
  const dz = tz - ent.z;
  const want = Math.atan2(-dx, -dz);
  let d = Math.atan2(Math.sin(want - ent.yaw), Math.cos(want - ent.yaw));
  const max = turn * dt;
  if (d > max) d = max;
  if (d < -max) d = -max;
  ent.yaw += d;
}

function advance(ent: Ent, dt: number): void {
  const { fx, fz } = fwd(ent.yaw);
  ent.x += fx * ent.spd * dt;
  ent.z += fz * ent.spd * dt;
}

function keepIn(ent: Ent): void {
  const outside =
    ent.x > LIMIT || ent.x < -LIMIT || ent.z > LIMIT || ent.z < -LIMIT;
  ent.x = Math.max(-LIMIT, Math.min(LIMIT, ent.x));
  ent.z = Math.max(-LIMIT, Math.min(LIMIT, ent.z));
  if (!outside) return;
  if (ent.kind === "asteroid" || ent.kind === "saucer") {
    if (Math.abs(ent.x) >= LIMIT - 1) ent.vx *= -1;
    if (Math.abs(ent.z) >= LIMIT - 1) ent.vz *= -1;
    return;
  }
  if (ent.kind === "station" || ent.kind === "mine" || ent.kind === "shot" || ent.kind === "shell") {
    return;
  }
  ent.yaw = Math.atan2(ent.x, ent.z);
}

function nearestStation(sim: Sim, x: number, z: number): Ent | null {
  let best: Ent | null = null;
  let bestD = 1e12;
  for (const e of sim.ents) {
    if (e.kind !== "station" || !e.alive) continue;
    const d = (e.x - x) ** 2 + (e.z - z) ** 2;
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  return best;
}

function sparks(sim: Sim, x: number, y: number, z: number, color: string, n: number): void {
  for (let i = 0; i < n; i++) {
    const a = sim.rng() * Math.PI * 2;
    const sp = 40 + sim.rng() * 160;
    sim.sparks.push({
      x,
      y,
      z,
      vx: Math.cos(a) * sp,
      vy: (sim.rng() - 0.2) * 80,
      vz: Math.sin(a) * sp,
      life: 0.25 + sim.rng() * 0.35,
      color,
    });
  }
}

function safePlayer(sim: Sim): boolean {
  const p = sim.player;
  return p.warping || p.dockT > 0 || p.iframe > 0 || sim.phase !== "play";
}

function hurtPlayer(sim: Sim): void {
  if (safePlayer(sim)) return;
  const p = sim.player;
  p.iframe = 0.72;
  p.hurtT = 0.38;
  sim.shake = Math.min(16, sim.shake + 10);
  sim.hitstop = Math.max(sim.hitstop, 0.04);
  if (p.shields > 0) p.shields -= 1;
  else if (p.shells > 0) p.shells -= 1;
  else if (p.warp > 0) p.warp = Math.max(0, p.warp - 28);
  else {
    p.speed = 0;
    p.warping = false;
    sim.phase = "over";
    sim.banner = "HULL LOST";
    sim.bannerSub = "ONE CRUISER";
    sim.bannerT = 3;
    sparks(sim, p.x, 18, p.z, "#ff4d5a", 18);
    noteScore(sim);
    sim.events.push("die");
    return;
  }
  sparks(sim, p.x, 18, p.z, "#ffb020", 8);
  sim.events.push("hurt");
}

function scoreKill(sim: Sim, ent: Ent): void {
  const stat = (STAT as Partial<Record<Kind, Stat>>)[ent.kind];
  const pts = stat?.score ?? 50;
  sim.score += pts;
  noteScore(sim);
  sim.pops.push({ x: ent.x, z: ent.z, y: ent.y + 20, text: `+${pts}`, life: 0.85 });
  sparks(sim, ent.x, ent.y, ent.z, "#e7fff2", ent.kind === "relic" ? 16 : 8);
  if (ent.kind === "relic") sim.events.push("boom");
  else sim.events.push("ping");
}

function hurtEnt(sim: Sim, ent: Ent, dmg: number): void {
  if (!ent.alive || !BLASTABLE[ent.kind]) return;
  ent.hp -= dmg;
  ent.flash = 0.1;
  if (ent.hp <= 0) {
    ent.alive = false;
    scoreKill(sim, ent);
  }
}

function damageStation(sim: Sim, station: Ent): void {
  if (!station.alive) return;
  station.hp -= 1;
  station.flash = 0.18;
  sparks(sim, station.x, 20, station.z, "#ffb020", 6);
  if (station.hp <= 0) {
    station.alive = false;
    sim.shake = Math.min(14, sim.shake + 8);
    sim.banner = "ANCHOR LOST";
    sim.bannerSub = "RAIDERS TURN ON YOU";
    sim.bannerT = 1.45;
    sparks(sim, station.x, 10, station.z, "#ff4d5a", 16);
    sim.events.push("station");
  }
}

function fireShot(sim: Sim, ent: Ent, tx: number, tz: number, speed: number): void {
  const dx = tx - ent.x;
  const dz = tz - ent.z;
  const dist = Math.hypot(dx, dz) || 1;
  const nx = dx / dist;
  const nz = dz / dist;
  sim.ents.push(
    mk(sim, "shot", ent.x + nx * (ent.r + 8), ent.z + nz * (ent.r + 8), {
      vx: nx * speed,
      vz: nz * speed,
      r: 6,
      y: 16,
      hp: 1,
      life: 2.15,
      intro: 0,
      spd: speed,
    }),
  );
}

function tryShoot(sim: Sim, ent: Ent, tx: number, tz: number, range: number, cd: number): void {
  ent.cd -= 1 / 60;
  if (ent.cd > 0) return;
  const dx = tx - ent.x;
  const dz = tz - ent.z;
  const dist = Math.hypot(dx, dz);
  if (dist > range || dist < 20) return;
  const want = Math.atan2(-dx, -dz);
  const diff = Math.abs(Math.atan2(Math.sin(want - ent.yaw), Math.cos(want - ent.yaw)));
  if (diff > 0.42) return;
  ent.cd = cd;
  fireShot(sim, ent, tx, tz, 250 + sim.speedMul * 20);
}

function updateEnemy(sim: Sim, ent: Ent, dt: number): void {
  const stat = (STAT as Partial<Record<Kind, Stat>>)[ent.kind];
  const p = sim.player;
  if (ent.kind === "asteroid") {
    ent.x += ent.vx * dt;
    ent.z += ent.vz * dt;
    ent.yaw += dt * (0.4 + ent.seed);
    keepIn(ent);
    return;
  }
  if (ent.kind === "saucer") {
    ent.ang += dt * 0.9;
    ent.x += ent.vx * dt + Math.cos(ent.ang) * 36 * dt;
    ent.z += ent.vz * dt + Math.sin(ent.ang) * 36 * dt;
    ent.yaw += dt * 0.6;
    keepIn(ent);
    ent.cd -= dt;
    if (ent.cd <= 0) {
      ent.cd = (stat?.cd ?? 2.3) / sim.speedMul;
      sim.blooms.push({ x: ent.x, z: ent.z, life: 0.35, max: stat?.range ?? 200, color: "#49e7ff" });
      if (Math.hypot(p.x - ent.x, p.z - ent.z) < (stat?.range ?? 200) && !safePlayer(sim)) {
        hurtPlayer(sim);
      }
      sim.events.push("ping");
    }
    return;
  }
  if (ent.kind === "relic") {
    const tx = Math.cos(sim.t * 0.17 + ent.seed * 6) * 420;
    const tz = Math.sin(sim.t * 0.13 + ent.seed) * 420;
    steerToward(ent, tx, tz, stat?.turn ?? 0.5, dt);
    advance(ent, dt);
    keepIn(ent);
    ent.cd -= dt;
    if (ent.cd <= 0) {
      ent.cd = (stat?.cd ?? 3.2) / sim.speedMul;
      sim.ents.push(
        mk(sim, "mine", ent.x, ent.z, {
          hp: 1,
          r: 16,
          y: 10,
          life: 13,
          arm: 0.85,
          intro: 0.2,
          spd: 0,
        }),
      );
      sim.events.push("mine");
    }
    return;
  }
  if (ent.kind === "raider") {
    const station = nearestStation(sim, ent.x, ent.z);
    if (station) {
      const d = Math.hypot(station.x - ent.x, station.z - ent.z);
      if (d > 250) steerToward(ent, station.x, station.z, stat?.turn ?? 1.3, dt);
      else {
        const ang = Math.atan2(ent.z - station.z, ent.x - station.x) + 0.7;
        steerToward(
          ent,
          station.x + Math.cos(ang) * 230,
          station.z + Math.sin(ang) * 230,
          1.7,
          dt,
        );
      }
      advance(ent, dt);
      keepIn(ent);
      tryShoot(sim, ent, station.x, station.z, stat?.range ?? 340, (stat?.cd ?? 1.6) / sim.speedMul);
      return;
    }
  }
  const flank = ent.kind === "dart" ? Math.sin(sim.t * 1.8 + ent.id) * 200 : 0;
  const dx = p.x - ent.x;
  const dz = p.z - ent.z;
  const dist = Math.hypot(dx, dz) || 1;
  const px = (-dz / dist) * flank;
  const pz = (dx / dist) * flank;
  steerToward(ent, p.x + px, p.z + pz, stat?.turn ?? 1.6, dt);
  advance(ent, dt);
  keepIn(ent);
  tryShoot(sim, ent, p.x, p.z, stat?.range ?? 640, (stat?.cd ?? 1.2) / sim.speedMul);
}

function separate(sim: Sim, dt: number): void {
  const list = sim.ents;
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (!a.alive || a.kind === "shot" || a.kind === "shell" || a.kind === "station") continue;
    for (let j = i + 1; j < list.length; j++) {
      const b = list[j];
      if (!b.alive || b.kind === "shot" || b.kind === "shell" || b.kind === "station") continue;
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const d = Math.hypot(dx, dz);
      const min = a.r + b.r * 0.45;
      if (d > 0 && d < min) {
        const push = ((min - d) / d) * 0.5;
        a.x -= dx * push * dt * 8;
        a.z -= dz * push * dt * 8;
        b.x += dx * push * dt * 8;
        b.z += dz * push * dt * 8;
      }
    }
  }
}

function acquire(sim: Sim): Ent | null {
  const p = sim.player;
  const { fx, fz, rx, rz } = fwd(p.yaw);
  let best: Ent | null = null;
  let bestAng = 99;
  for (const e of sim.ents) {
    if (!e.alive || !BLASTABLE[e.kind]) continue;
    const dx = e.x - p.x;
    const dz = e.z - p.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 28 || dist > 560) continue;
    const forward = dx * fx + dz * fz;
    if (forward <= 0) continue;
    const side = dx * rx + dz * rz;
    const ang = Math.abs(Math.atan2(side, forward));
    const cone = Math.min(0.46, 0.11 + 34 / dist);
    if (ang > cone || ang >= bestAng) continue;
    bestAng = ang;
    best = e;
  }
  return best;
}

function segmentHits(
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  sx: number,
  sz: number,
  rad: number,
): boolean {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len2 = dx * dx + dz * dz;
  let t = 0;
  if (len2 > 0.0001) {
    t = ((sx - x0) * dx + (sz - z0) * dz) / len2;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
  }
  const px = x0 + dx * t;
  const pz = z0 + dz * t;
  return Math.hypot(px - sx, pz - sz) < rad;
}

function detonate(sim: Sim, x: number, z: number): void {
  sim.blooms.push({ x, z, life: 0.42, max: 210, color: "#ffb020" });
  sim.shake = Math.min(16, sim.shake + 7);
  sim.hitstop = Math.max(sim.hitstop, 0.045);
  for (const e of sim.ents) {
    if (!e.alive || !BLASTABLE[e.kind]) continue;
    if (Math.hypot(e.x - x, e.z - z) < 200 + e.r * 0.35) hurtEnt(sim, e, 99);
  }
  sim.events.push("boom");
}

function moveProjectiles(sim: Sim, dt: number): void {
  const p = sim.player;
  for (const s of sim.ents) {
    if (!s.alive) continue;
    if (s.kind === "shot") {
      s.life -= dt;
      if (s.life <= 0) {
        s.alive = false;
        continue;
      }
      s.x += s.vx * dt;
      s.z += s.vz * dt;
      if (Math.abs(s.x) > 1300 || Math.abs(s.z) > 1300) {
        s.alive = false;
        continue;
      }
      if (Math.hypot(s.x - p.x, s.z - p.z) < p.r + 4) {
        s.alive = false;
        hurtPlayer(sim);
        continue;
      }
      for (const st of sim.ents) {
        if (st.kind !== "station" || !st.alive) continue;
        if (Math.hypot(s.x - st.x, s.z - st.z) < st.r) {
          s.alive = false;
          damageStation(sim, st);
          break;
        }
      }
    } else if (s.kind === "shell") {
      s.life -= dt;
      s.x += s.vx * dt;
      s.z += s.vz * dt;
      let boom = s.life <= 0;
      if (!boom) {
        for (const e of sim.ents) {
          if (!e.alive || e.id === s.id || !BLASTABLE[e.kind]) continue;
          if (Math.hypot(e.x - s.x, e.z - s.z) < e.r + 22) {
            boom = true;
            break;
          }
        }
      }
      if (boom) {
        s.alive = false;
        detonate(sim, s.x, s.z);
      }
    } else if (s.kind === "mine") {
      s.life -= dt;
      s.arm -= dt;
      s.yaw += dt * 1.4;
      if (s.life <= 0) {
        s.alive = false;
        continue;
      }
      if (s.arm <= 0 && Math.hypot(s.x - p.x, s.z - p.z) < 76) {
        s.alive = false;
        sim.blooms.push({ x: s.x, z: s.z, life: 0.3, max: 90, color: "#ffd25a" });
        hurtPlayer(sim);
      }
    }
  }
}

function ram(sim: Sim): void {
  const p = sim.player;
  if (safePlayer(sim)) return;
  for (const e of sim.ents) {
    if (!e.alive) continue;
    if (
      e.kind !== "raider" &&
      e.kind !== "hunter" &&
      e.kind !== "dart" &&
      e.kind !== "saucer" &&
      e.kind !== "asteroid" &&
      e.kind !== "relic"
    ) {
      continue;
    }
    if (Math.hypot(e.x - p.x, e.z - p.z) < e.r * 0.72 + p.r * 0.55) {
      hurtPlayer(sim);
      if (e.kind === "asteroid") hurtEnt(sim, e, 99);
      break;
    }
  }
}

function clearIfDone(sim: Sim): void {
  if (sim.phase !== "play") return;
  for (const e of sim.ents) {
    if (e.alive && HOSTILE[e.kind]) return;
  }
  let anchors = 0;
  for (const e of sim.ents) if (e.kind === "station" && e.alive) anchors += 1;
  const bonus = 500 + anchors * 800;
  sim.score += bonus;
  noteScore(sim);
  sim.phase = "clear";
  sim.clearT = 2.55;
  sim.player.speed = 0;
  sim.player.warping = false;
  sim.banner = "SECTOR CLEAR";
  sim.bannerSub = `BONUS ${bonus}`;
  sim.bannerT = 2.55;
  sim.events.push("clear");
}

export function step(sim: Sim, input: Input, dt: number): void {
  sim.t += dt;
  if (sim.phase === "title") {
    stepTitle(sim, dt);
    decayFx(sim, dt);
    return;
  }
  if (sim.phase === "pause" || sim.phase === "over") {
    decayFx(sim, dt);
    return;
  }
  if (sim.phase === "clear") {
    sim.clearT -= dt;
    decayFx(sim, dt);
    if (sim.clearT <= 0) beginSector(sim, sim.sector + 1);
    return;
  }
  if (sim.hitstop > 0) {
    sim.hitstop -= dt;
    decayFx(sim, dt);
    return;
  }

  const p = sim.player;
  for (const e of sim.ents) if (e.intro > 0) e.intro = Math.max(0, e.intro - dt);

  const wantWarp = input.warp && p.warp > 0 && p.dockT <= 0;
  const x0 = p.x;
  const z0 = p.z;
  if (p.dockT > 0) {
    p.dockT -= dt;
    p.speed = 0;
    p.warping = false;
  } else {
    // steer +1 (A) increases yaw: nose swings toward world -X, left on the scanner.
    p.yaw += input.steer * TURN_RATE * dt + input.spin;
    p.yaw = Math.atan2(Math.sin(p.yaw), Math.cos(p.yaw));
    const want = wantWarp ? WARP_SPEED : input.impulse ? IMPULSE : 0;
    const k = want > p.speed ? 7.5 : 5.5;
    p.speed += (want - p.speed) * Math.min(1, dt * k);
    if (want === 0 && p.speed < 3) p.speed = 0;
    p.warping = wantWarp;
    if (wantWarp) p.warp = Math.max(0, p.warp - 20 * dt);
    if (p.warp <= 0) p.warping = false;
    const { fx, fz } = fwd(p.yaw);
    p.x += fx * p.speed * dt;
    p.z += fz * p.speed * dt;
    p.x = Math.max(-LIMIT, Math.min(LIMIT, p.x));
    p.z = Math.max(-LIMIT, Math.min(LIMIT, p.z));
    if (p.dockT <= 0) {
      for (const st of sim.ents) {
        if (st.kind !== "station" || !st.alive || st.used) continue;
        if (segmentHits(x0, z0, p.x, p.z, st.x, st.z, st.r + 8)) {
          st.used = true;
          p.dockT = 1.2;
          p.speed = 0;
          p.warping = false;
          p.shields = Math.min(8, p.shields + 2);
          p.shells = Math.min(9, p.shells + 1);
          p.warp = Math.min(100, p.warp + 36);
          sim.banner = "DOCKED";
          sim.bannerSub = "+2 SHIELDS   +1 SHELL   +WARP";
          sim.bannerT = 1.25;
          sim.events.push("dock");
          break;
        }
      }
    }
  }

  const { fx, fz } = fwd(p.yaw);
  const locked = acquire(sim);
  p.lockId = locked ? locked.id : -1;

  if (p.dockT <= 0 && input.lance && p.lanceCd <= 0) {
    p.lanceCd = 0.24;
    if (locked) {
      hurtEnt(sim, locked, 1);
      sim.beams.push({
        x1: p.x,
        z1: p.z,
        x2: locked.x,
        z2: locked.z,
        life: 0.12,
        color: "#b8ffcf",
      });
      sim.events.push("lance");
    } else {
      sim.beams.push({
        x1: p.x,
        z1: p.z,
        x2: p.x + fx * 210,
        z2: p.z + fz * 210,
        life: 0.08,
        color: "#6d8f7c",
      });
      sim.events.push("miss");
    }
  } else if (p.dockT <= 0 && input.burst && p.shellCd <= 0) {
    if (p.shells > 0) {
      p.shells -= 1;
      p.shellCd = 0.48;
      sim.ents.push(
        mk(sim, "shell", p.x + fx * 40, p.z + fz * 40, {
          vx: fx * 620,
          vz: fz * 620,
          r: 8,
          y: 16,
          life: 0.95,
          intro: 0,
          spd: 620,
        }),
      );
      sim.events.push("launch");
    } else {
      p.shellCd = 0.18;
      sim.events.push("dry");
    }
  }

  const count = sim.ents.length;
  for (let i = 0; i < count; i++) {
    const ent = sim.ents[i];
    if (!ent.alive) continue;
    if (
      ent.kind === "raider" ||
      ent.kind === "hunter" ||
      ent.kind === "dart" ||
      ent.kind === "saucer" ||
      ent.kind === "asteroid" ||
      ent.kind === "relic"
    ) {
      updateEnemy(sim, ent, dt);
    }
  }
  separate(sim, dt);
  moveProjectiles(sim, dt);
  ram(sim);
  clearIfDone(sim);
  sim.ents = sim.ents.filter((e) => e.alive);
  decayFx(sim, dt);
}
