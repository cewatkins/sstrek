import type { Beam, Bloom, Ent, Input, Kind, Phase, Player, Pop, Sim, Wing } from "./types";

export interface ShipWire {
  id: string;
  n: string;
  c: string;
  x: number;
  z: number;
  yaw: number;
  spd: number;
  sh: number;
  sl: number;
  w: number;
  warp: boolean;
  alive: boolean;
  hurt: number;
  lock: number;
  dock: number;
}

export interface EntWire {
  id: number;
  k: Kind;
  x: number;
  z: number;
  y: number;
  yaw: number;
  vx: number;
  vz: number;
  r: number;
  hp: number;
  used: boolean;
  flash: number;
}

export interface Snap {
  op: "snap";
  tick: number;
  host: string;
  phase: Phase;
  sector: number;
  sectorName: string;
  score: number;
  banner: string;
  bannerSub: string;
  bannerT: number;
  hintT: number;
  shake: number;
  ships: ShipWire[];
  ents: EntWire[];
  beams: Beam[];
  blooms: Bloom[];
  pops: Pop[];
  ev: string[];
}

export interface HeldInput {
  seq: number;
  steer: number;
  impulse: boolean;
  warp: boolean;
  spin: number;
  actSeq: number;
  lance: boolean;
  burst: boolean;
}

interface Pose {
  x: number;
  z: number;
  yaw: number;
  spd: number;
}

export interface GuestView {
  tick: number;
  host: string;
  ents: Map<number, Ent>;
  wings: Map<string, Wing>;
  pose: Map<string, Pose>;
}

const q = (n: number) => Math.round(n * 10) / 10;

function idle(): Input {
  return { steer: 0, impulse: false, warp: false, lance: false, burst: false, spin: 0 };
}

function packShip(id: string, name: string, color: string, ship: Player, alive: boolean): ShipWire {
  return {
    id,
    n: name,
    c: color,
    x: q(ship.x),
    z: q(ship.z),
    yaw: q(ship.yaw),
    spd: q(ship.speed),
    sh: ship.shields,
    sl: ship.shells,
    w: q(ship.warp),
    warp: ship.warping,
    alive,
    hurt: q(ship.hurtT),
    lock: ship.lockId,
    dock: q(ship.dockT),
  };
}

function packEnt(ent: Ent): EntWire {
  return {
    id: ent.id,
    k: ent.kind,
    x: q(ent.x),
    z: q(ent.z),
    y: q(ent.y),
    yaw: q(ent.yaw),
    vx: q(ent.vx),
    vz: q(ent.vz),
    r: ent.r,
    hp: ent.hp,
    used: ent.used,
    flash: q(ent.flash),
  };
}

export function packSnap(sim: Sim, host: string, name: string, tick: number, ev: string[]): Snap {
  return {
    op: "snap",
    tick,
    host,
    phase: sim.phase,
    sector: sim.sector,
    sectorName: sim.sectorName,
    score: sim.score,
    banner: sim.banner,
    bannerSub: sim.bannerSub,
    bannerT: q(sim.bannerT),
    hintT: q(sim.hintT),
    shake: q(sim.shake),
    ships: [
      packShip(host, name, "#b8ffcf", sim.player, !sim.localDown),
      ...sim.wings.map((wing) => packShip(wing.id, wing.name, wing.color, wing.ship, wing.alive)),
    ],
    ents: sim.ents.filter((ent) => ent.alive).map(packEnt),
    beams: sim.beams.map((beam) => ({
      ...beam,
      x1: q(beam.x1),
      z1: q(beam.z1),
      x2: q(beam.x2),
      z2: q(beam.z2),
      life: q(beam.life),
    })),
    blooms: sim.blooms.map((bloom) => ({ ...bloom, x: q(bloom.x), z: q(bloom.z), life: q(bloom.life) })),
    pops: sim.pops.map((pop) => ({ ...pop, x: q(pop.x), z: q(pop.z), y: q(pop.y), life: q(pop.life) })),
    ev,
  };
}

export function isSnap(data: unknown): data is Snap {
  if (!data || typeof data !== "object") return false;
  const snap = data as Snap;
  return snap.op === "snap" && Array.isArray(snap.ships) && Array.isArray(snap.ents);
}

export function createGuestView(): GuestView {
  return { tick: -1, host: "", ents: new Map(), wings: new Map(), pose: new Map() };
}

function blankPlayer(): Player {
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

function blankEnt(wire: EntWire): Ent {
  return {
    id: wire.id,
    kind: wire.k,
    x: wire.x,
    z: wire.z,
    y: wire.y,
    vx: wire.vx,
    vz: wire.vz,
    yaw: wire.yaw,
    hp: wire.hp,
    r: wire.r,
    spd: 0,
    cd: 0,
    life: 0,
    arm: 0,
    alive: true,
    used: wire.used,
    flash: wire.flash,
    intro: 0,
    seed: 0,
    ang: 0,
  };
}

function writeShip(ship: Player, wire: ShipWire, snapNow: boolean): void {
  ship.shields = wire.sh;
  ship.shells = wire.sl;
  ship.warp = wire.w;
  ship.warping = wire.warp;
  ship.hurtT = wire.hurt;
  ship.lockId = wire.lock;
  ship.dockT = wire.dock;
  if (!snapNow) return;
  ship.x = wire.x;
  ship.z = wire.z;
  ship.yaw = wire.yaw;
  ship.speed = wire.spd;
}

export function applySnap(sim: Sim, view: GuestView, snap: Snap, selfId: string): void {
  const first = view.tick < 0;
  view.tick = snap.tick;
  view.host = snap.host;
  sim.phase = snap.phase;
  sim.sector = snap.sector;
  sim.sectorName = snap.sectorName;
  sim.score = snap.score;
  sim.banner = snap.banner;
  sim.bannerSub = snap.bannerSub;
  sim.bannerT = snap.bannerT;
  sim.hintT = snap.hintT;
  sim.shake = snap.shake;
  sim.beams = snap.beams ?? [];
  sim.blooms = snap.blooms ?? [];
  sim.pops = snap.pops ?? [];

  const me = snap.ships.find((ship) => ship.id === selfId);
  sim.coop = snap.ships.length > 1;
  if (me) {
    writeShip(sim.player, me, first);
    sim.localDown = !me.alive;
    view.pose.set("self", { x: me.x, z: me.z, yaw: me.yaw, spd: me.spd });
  }

  const wings: Wing[] = [];
  const seen = new Set<string>();
  for (const wire of snap.ships) {
    if (wire.id === selfId) continue;
    seen.add(wire.id);
    let wing = view.wings.get(wire.id);
    if (!wing) {
      wing = {
        id: wire.id,
        name: wire.n,
        color: wire.c,
        alive: wire.alive,
        ship: blankPlayer(),
        input: idle(),
      };
      view.wings.set(wire.id, wing);
      writeShip(wing.ship, wire, true);
    } else {
      wing.name = wire.n;
      wing.color = wire.c;
      wing.alive = wire.alive;
      writeShip(wing.ship, wire, false);
    }
    view.pose.set(wire.id, { x: wire.x, z: wire.z, yaw: wire.yaw, spd: wire.spd });
    wings.push(wing);
  }
  for (const id of view.wings.keys()) if (!seen.has(id)) view.wings.delete(id);
  sim.wings = wings;

  const keep = new Set<number>();
  const ents: Ent[] = [];
  for (const wire of snap.ents) {
    keep.add(wire.id);
    let ent = view.ents.get(wire.id);
    const born = !ent;
    if (!ent) {
      ent = blankEnt(wire);
      view.ents.set(wire.id, ent);
    } else {
      ent.kind = wire.k;
      ent.y = wire.y;
      ent.r = wire.r;
      ent.hp = wire.hp;
      ent.used = wire.used;
      ent.flash = wire.flash;
      ent.vx = wire.vx;
      ent.vz = wire.vz;
      ent.alive = true;
    }
    if (born || first) {
      ent.x = wire.x;
      ent.z = wire.z;
      ent.yaw = wire.yaw;
    }
    view.pose.set(`e${wire.id}`, { x: wire.x, z: wire.z, yaw: wire.yaw, spd: 0 });
    ents.push(ent);
  }
  for (const id of view.ents.keys()) if (!keep.has(id)) view.ents.delete(id);
  sim.ents = ents;

  if (snap.phase === "over" && sim.score > sim.best) {
    sim.best = sim.score;
    try {
      localStorage.setItem("halcyon-ops-best", String(sim.best));
    } catch {
      /* private mode */
    }
  }
}

function easeAngle(from: number, to: number, k: number): number {
  const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + delta * k;
}

export function relax(sim: Sim, view: GuestView, dt: number): void {
  const k = 1 - Math.exp(-Math.min(0.1, dt) * 16);
  const self = view.pose.get("self");
  if (self) {
    sim.player.x += (self.x - sim.player.x) * k;
    sim.player.z += (self.z - sim.player.z) * k;
    sim.player.yaw = easeAngle(sim.player.yaw, self.yaw, k);
    sim.player.speed += (self.spd - sim.player.speed) * k;
  }
  for (const wing of sim.wings) {
    const pose = view.pose.get(wing.id);
    if (!pose) continue;
    wing.ship.x += (pose.x - wing.ship.x) * k;
    wing.ship.z += (pose.z - wing.ship.z) * k;
    wing.ship.yaw = easeAngle(wing.ship.yaw, pose.yaw, k);
    wing.ship.speed += (pose.spd - wing.ship.speed) * k;
  }
  for (const ent of sim.ents) {
    const pose = view.pose.get(`e${ent.id}`);
    if (!pose) continue;
    ent.x += (pose.x - ent.x) * k;
    ent.z += (pose.z - ent.z) * k;
    ent.yaw = easeAngle(ent.yaw, pose.yaw, k);
  }
}

export function ingest(bags: Map<string, HeldInput>, from: string, data: unknown): void {
  if (!data || typeof data !== "object") return;
  const msg = data as { op?: string; seq?: number };
  if (typeof msg.seq !== "number") return;
  if (msg.op === "in") {
    const steer = Number((data as { steer?: number }).steer) || 0;
    const prev = bags.get(from);
    if (prev && msg.seq < prev.seq) return;
    bags.set(from, {
      seq: msg.seq,
      steer: Math.max(-1, Math.min(1, steer)),
      impulse: !!(data as { impulse?: boolean }).impulse,
      warp: !!(data as { warp?: boolean }).warp,
      spin: (prev?.spin ?? 0) + (Number((data as { spin?: number }).spin) || 0),
      actSeq: prev?.actSeq ?? 0,
      lance: prev?.lance ?? false,
      burst: prev?.burst ?? false,
    });
    return;
  }
  if (msg.op === "act") {
    const prev = bags.get(from) ?? {
      seq: 0,
      steer: 0,
      impulse: false,
      warp: false,
      spin: 0,
      actSeq: 0,
      lance: false,
      burst: false,
    };
    if (msg.seq <= prev.actSeq) return;
    prev.actSeq = msg.seq;
    if ((data as { lance?: boolean }).lance) prev.lance = true;
    if ((data as { burst?: boolean }).burst) prev.burst = true;
    bags.set(from, prev);
  }
}

export function applyHeld(sim: Sim, bags: Map<string, HeldInput>): void {
  for (const wing of sim.wings) {
    const bag = bags.get(wing.id);
    if (!bag) {
      wing.input = idle();
      continue;
    }
    wing.input = {
      steer: bag.steer,
      impulse: bag.impulse,
      warp: bag.warp,
      lance: bag.lance,
      burst: bag.burst,
      spin: bag.spin,
    };
    bag.lance = false;
    bag.burst = false;
    bag.spin = 0;
  }
}
