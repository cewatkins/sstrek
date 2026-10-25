import { wiresFor, worldPoint } from "./models";
import type { Ent, Kind, Sim } from "./types";
import { WORLD, formatScore } from "./types";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Proj {
  sx: number;
  sy: number;
  lz: number;
}

const COLOR: Record<Kind, string> = {
  raider: "#ff4d5a",
  hunter: "#d391ff",
  dart: "#f4fff8",
  saucer: "#49e7ff",
  asteroid: "#9bb0a0",
  relic: "#ffc14d",
  mine: "#ffd25a",
  station: "#3dff9a",
  shot: "#ff8d96",
  shell: "#ffb020",
};

const STARS: { x: number; y: number; z: number; b: number }[] = Array.from({ length: 150 }, (_, i) => {
  const h = (n: number) => {
    const v = Math.sin(n * 127.1 + i * 3.1) * 43758.5453;
    return v - Math.floor(v);
  };
  return {
    x: (h(1) - 0.5) * 3800,
    y: 40 + h(2) * 620,
    z: (h(3) - 0.5) * 3800,
    b: 0.35 + h(4) * 0.65,
  };
});

function layout(w: number, h: number): { status: Rect; scan: Rect; view: Rect } {
  const pad = Math.max(8, Math.round(Math.min(w, h) * 0.018));
  const topH = Math.round(h * (h > w ? 0.36 : 0.4));
  const statusW = Math.round(w * (w < 720 ? 0.44 : 0.3));
  return {
    status: { x: pad, y: pad, w: statusW - pad, h: topH - pad },
    scan: { x: statusW + pad * 0.4, y: pad, w: w - statusW - pad * 1.4, h: topH - pad },
    view: { x: pad, y: topH + pad * 0.45, w: w - pad * 2, h: h - topH - pad * 1.5 },
  };
}

function brackets(ctx: CanvasRenderingContext2D, r: Rect, color: string): void {
  const t = Math.max(10, Math.min(22, r.w * 0.06, r.h * 0.12));
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  const c: [number, number][] = [
    [r.x, r.y],
    [r.x + r.w, r.y],
    [r.x + r.w, r.y + r.h],
    [r.x, r.y + r.h],
  ];
  const s: [number, number][] = [
    [1, 1],
    [-1, 1],
    [-1, -1],
    [1, -1],
  ];
  for (let i = 0; i < 4; i++) {
    const [x, y] = c[i];
    const [sx, sy] = s[i];
    ctx.moveTo(x + sx * t, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + sy * t);
  }
  ctx.stroke();
}

function fillPanel(ctx: CanvasRenderingContext2D, r: Rect, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(r.x, r.y, r.w, r.h);
}

function clip(ctx: CanvasRenderingContext2D, r: Rect, draw: () => void): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.clip();
  draw();
  ctx.restore();
}

export function draw(ctx: CanvasRenderingContext2D, sim: Sim, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#07080c";
  ctx.fillRect(0, 0, w, h);
  const mag = sim.shake;
  ctx.save();
  if (mag > 0.2) ctx.translate(Math.sin(sim.t * 88) * mag, Math.cos(sim.t * 63) * mag);
  const L = layout(w, h);
  drawStatus(ctx, sim, L.status);
  drawScanner(ctx, sim, L.scan);
  drawViewer(ctx, sim, L.view);
  ctx.restore();
}

function drawStatus(ctx: CanvasRenderingContext2D, sim: Sim, r: Rect): void {
  fillPanel(ctx, r, "#080c0a");
  clip(ctx, r, () => {
    const p = sim.player;
    const mono = '"Share Tech Mono", ui-monospace, monospace';
    const display = "Oxanium, sans-serif";
    let y = r.y + 22;
    const x = r.x + 14;
    ctx.fillStyle = "#8aa396";
    ctx.font = `600 ${Math.max(10, r.w * 0.055)}px ${display}`;
    ctx.fillText("STATUS", x, y);
    ctx.fillStyle = "#ffb020";
    ctx.font = `700 ${Math.max(13, r.w * 0.075)}px ${display}`;
    y += r.h * 0.09;
    ctx.fillText("HALCYON", x, y);
    y += r.h * 0.075;
    ctx.fillStyle = "#3dff9a";
    ctx.font = `400 ${Math.max(11, r.w * 0.058)}px ${mono}`;
    const sector =
      sim.sector < 0 ? "STANDBY" : `SECTOR ${String(sim.sector + 1).padStart(2, "0")}`;
    ctx.fillText(sector, x, y);
    y += r.h * 0.055;
    ctx.fillStyle = "#8aa396";
    ctx.fillText(sim.sectorName, x, y);

    y += r.h * 0.09;
    ctx.fillStyle = "#8aa396";
    ctx.font = `400 ${Math.max(10, r.w * 0.05)}px ${mono}`;
    ctx.fillText("SCORE", x, y);
    y += r.h * 0.08;
    ctx.fillStyle = "#e7fff2";
    ctx.font = `400 ${Math.max(16, r.w * 0.09)}px ${mono}`;
    ctx.fillText(formatScore(sim.score), x, y);
    y += r.h * 0.06;
    ctx.fillStyle = "#8aa396";
    ctx.font = `400 ${Math.max(10, r.w * 0.048)}px ${mono}`;
    ctx.fillText(`BEST ${formatScore(sim.best)}`, x, y);

    const row = (label: string, n: number, slots: number, on: string) => {
      y += r.h * 0.07;
      ctx.fillStyle = "#8aa396";
      ctx.font = `400 ${Math.max(10, r.w * 0.048)}px ${mono}`;
      ctx.fillText(label, x, y);
      y += r.h * 0.045;
      const gap = 4;
      const size = Math.min(12, (r.w - 28 - gap * (slots - 1)) / slots);
      for (let i = 0; i < slots; i++) {
        ctx.fillStyle = i < n ? on : "#1a2820";
        ctx.fillRect(x + i * (size + gap), y - size + 2, size, size * 0.72);
      }
    };
    row("SHIELDS", p.shields, 8, "#3dff9a");
    row("SHELLS", p.shells, 9, "#ff4d5a");

    y += r.h * 0.075;
    ctx.fillStyle = "#8aa396";
    ctx.font = `400 ${Math.max(10, r.w * 0.048)}px ${mono}`;
    ctx.fillText("WARP", x, y);
    y += 8;
    const barW = r.w - 28;
    ctx.fillStyle = "#142033";
    ctx.fillRect(x, y, barW, 8);
    ctx.fillStyle = p.warp < 28 ? "#ff4d5a" : "#4d8bff";
    ctx.fillRect(x, y, barW * Math.max(0, Math.min(1, p.warp / 100)), 8);

    let hostiles = 0;
    let anchors = 0;
    for (const e of sim.ents) {
      if (!e.alive) continue;
      if (e.kind === "station") anchors += 1;
      if (
        e.kind === "raider" ||
        e.kind === "hunter" ||
        e.kind === "dart" ||
        e.kind === "saucer" ||
        e.kind === "relic"
      ) {
        hostiles += 1;
      }
    }
    y += r.h * 0.08;
    ctx.fillStyle = p.shields === 0 ? "#ffb020" : "#8aa396";
    ctx.font = `400 ${Math.max(10, r.w * 0.046)}px ${mono}`;
    const line =
      sim.phase === "title"
        ? "PRESS START"
        : sim.phase === "over"
          ? "HULL LOST"
          : p.shields === 0
            ? "HULL EXPOSED"
            : `HOSTILES ${String(hostiles).padStart(2, "0")}`;
    ctx.fillText(line, x, y);
    y += r.h * 0.05;
    ctx.fillStyle = "#8aa396";
    ctx.fillText(`ANCHORS ${String(anchors).padStart(2, "0")}`, x, y);
  });
  brackets(ctx, r, "#1f8a4c");
}

function drawScanner(ctx: CanvasRenderingContext2D, sim: Sim, r: Rect): void {
  fillPanel(ctx, r, "#070b10");
  const scale = (Math.min(r.w, r.h) * 0.86) / WORLD;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const to = (x: number, z: number) => ({ sx: cx + x * scale, sy: cy + z * scale });
  clip(ctx, r, () => {
    ctx.strokeStyle = "rgba(61,255,154,0.16)";
    ctx.lineWidth = 1;
    ctx.strokeRect(cx - LIMIT_S(scale), cy - LIMIT_S(scale), LIMIT_S(scale) * 2, LIMIT_S(scale) * 2);
    ctx.font = `600 ${Math.max(10, r.w * 0.045)}px Oxanium, sans-serif`;
    ctx.fillStyle = "#8aa396";
    ctx.fillText("SCANNER", r.x + 12, r.y + 18);
    for (const e of sim.ents) {
      if (!e.alive) continue;
      const p = to(e.x, e.z);
      const col = e.flash > 0 ? "#ffffff" : e.kind === "station" && e.used ? "#1c6b40" : COLOR[e.kind];
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = 1.25;
      if (e.kind === "station") {
        const s = Math.max(5, e.r * scale);
        ctx.strokeRect(p.sx - s, p.sy - s, s * 2, s * 2);
      } else if (e.kind === "saucer") {
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, Math.max(3, e.r * scale * 0.55), 0, Math.PI * 2);
        ctx.stroke();
      } else if (e.kind === "mine") {
        ctx.beginPath();
        ctx.moveTo(p.sx - 3, p.sy - 3);
        ctx.lineTo(p.sx + 3, p.sy + 3);
        ctx.moveTo(p.sx + 3, p.sy - 3);
        ctx.lineTo(p.sx - 3, p.sy + 3);
        ctx.stroke();
      } else if (e.kind === "shot" || e.kind === "shell") {
        ctx.fillRect(p.sx - 1.5, p.sy - 1.5, 3, 3);
      } else if (e.kind === "asteroid") {
        ctx.strokeRect(p.sx - 3, p.sy - 3, 6, 6);
      } else {
        drawBlip(ctx, p.sx, p.sy, e.yaw, e.kind === "relic" ? 8 : 6);
      }
    }
    for (const b of sim.blooms) {
      const p = to(b.x, b.z);
      const rad = (1 - b.life / 0.42) * b.max * scale;
      ctx.strokeStyle = b.color;
      ctx.globalAlpha = Math.max(0, b.life * 2);
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, Math.max(2, rad), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    const player = sim.player;
    if (player.iframe <= 0 || Math.sin(sim.t * 28) > 0) {
      const nose = 78;
      const back = 42;
      const wing = 48;
      const fx = -Math.sin(player.yaw);
      const fz = -Math.cos(player.yaw);
      const rx = Math.cos(player.yaw);
      const rz = -Math.sin(player.yaw);
      const a = to(player.x + fx * nose, player.z + fz * nose);
      const b = to(player.x - fx * back + rx * wing, player.z - fz * back + rz * wing);
      const c = to(player.x - fx * back - rx * wing, player.z - fz * back - rz * wing);
      ctx.strokeStyle = player.warping ? "#4d8bff" : "#b8ffcf";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.lineTo(c.sx, c.sy);
      ctx.closePath();
      ctx.stroke();
      const tip = to(player.x + fx * 220, player.z + fz * 220);
      ctx.strokeStyle = "rgba(184,255,207,0.35)";
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(tip.sx, tip.sy);
      ctx.stroke();
    }
  });
  brackets(ctx, r, "#24506a");
}

function LIMIT_S(scale: number): number {
  return 1120 * scale;
}

function drawBlip(ctx: CanvasRenderingContext2D, sx: number, sy: number, yaw: number, size: number): void {
  const fx = -Math.sin(yaw);
  const fz = -Math.cos(yaw);
  const rx = Math.cos(yaw);
  const rz = -Math.sin(yaw);
  const nx = sx + fx * size;
  const ny = sy + fz * size;
  ctx.beginPath();
  ctx.moveTo(nx, ny);
  ctx.lineTo(sx - fx * size * 0.6 + rx * size * 0.7, sy - fz * size * 0.6 + rz * size * 0.7);
  ctx.lineTo(sx - fx * size * 0.6 - rx * size * 0.7, sy - fz * size * 0.6 - rz * size * 0.7);
  ctx.closePath();
  ctx.stroke();
}

function drawViewer(ctx: CanvasRenderingContext2D, sim: Sim, r: Rect): void {
  const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
  g.addColorStop(0, "#05070d");
  g.addColorStop(0.5, "#07110f");
  g.addColorStop(1, "#0c1c16");
  ctx.fillStyle = g;
  ctx.fillRect(r.x, r.y, r.w, r.h);

  const p = sim.player;
  const fov = r.h * 0.85;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h * 0.48;
  const fx = -Math.sin(p.yaw);
  const fz = -Math.cos(p.yaw);
  const rx = Math.cos(p.yaw);
  const rz = -Math.sin(p.yaw);
  const project = (x: number, y: number, z: number): Proj | null => {
    const dx = x - p.x;
    const dy = y - 26;
    const dz = z - p.z;
    const lx = dx * rx + dz * rz;
    const lz = dx * fx + dz * fz;
    if (lz < 14) return null;
    const s = fov / lz;
    return { sx: cx + lx * s, sy: cy - dy * s, lz };
  };

  clip(ctx, r, () => {
    ctx.fillStyle = "#8aa396";
    ctx.font = `600 ${Math.max(10, r.w * 0.02)}px Oxanium, sans-serif`;
    ctx.fillText("VIEWER", r.x + 12, r.y + 18);

    for (const star of STARS) {
      const q = project(star.x, star.y, star.z);
      if (!q) continue;
      ctx.globalAlpha = star.b;
      ctx.fillStyle = "#d7fff0";
      ctx.fillRect(q.sx, q.sy, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "rgba(61,255,154,0.14)";
    ctx.lineWidth = 1;
    for (let gline = -1200; gline <= 1200; gline += 200) {
      strokeWorld(ctx, project, gline, 0, -1200, gline, 0, 1200);
      strokeWorld(ctx, project, -1200, 0, gline, 1200, 0, gline);
    }

    const drawables = sim.ents.filter((e) => e.alive && e.kind !== "shot" && e.kind !== "shell");
    drawables.sort((a, b) => depthOf(b, p.x, p.z, fx, fz) - depthOf(a, p.x, p.z, fx, fz));
    for (const ent of drawables) {
      const depth = depthOf(ent, p.x, p.z, fx, fz);
      if (depth < 10) continue;
      const grow = 1 + ent.intro * 2.2;
      const color = ent.flash > 0 ? "#ffffff" : ent.kind === "station" && ent.used ? "#1f6b42" : COLOR[ent.kind];
      strokeModel(ctx, project, ent, color, grow);
    }

    for (const s of sim.sparks) {
      const a = project(s.x, s.y, s.z);
      const b = project(s.x - s.vx * 0.04, s.y - s.vy * 0.04, s.z - s.vz * 0.04);
      if (!a || !b) continue;
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = Math.max(0, s.life * 2);
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (const beam of sim.beams) {
      const a = project(beam.x1, 18, beam.z1);
      const b = project(beam.x2, 18, beam.z2);
      if (!a || !b) continue;
      ctx.strokeStyle = beam.color;
      ctx.lineWidth = 1.6;
      ctx.globalAlpha = Math.min(1, beam.life * 8);
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (const e of sim.ents) {
      if (!e.alive || (e.kind !== "shot" && e.kind !== "shell")) continue;
      const q = project(e.x, e.y, e.z);
      if (!q) continue;
      const tail = project(e.x - e.vx * 0.04, e.y, e.z - e.vz * 0.04);
      ctx.strokeStyle = COLOR[e.kind];
      ctx.lineWidth = e.kind === "shell" ? 2.2 : 1.4;
      ctx.beginPath();
      ctx.moveTo(q.sx, q.sy);
      if (tail) ctx.lineTo(tail.sx, tail.sy);
      ctx.stroke();
    }

    for (const bloom of sim.blooms) {
      const u = 1 - Math.max(0, bloom.life) / 0.42;
      const rad = 12 + u * bloom.max;
      ctx.strokeStyle = bloom.color;
      ctx.globalAlpha = Math.max(0, bloom.life * 2.2);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i <= 28; i++) {
        const a = (i / 28) * Math.PI * 2;
        const q = project(bloom.x + Math.cos(a) * rad, 14, bloom.z + Math.sin(a) * rad);
        if (!q) continue;
        if (i === 0) ctx.moveTo(q.sx, q.sy);
        else ctx.lineTo(q.sx, q.sy);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (const pop of sim.pops) {
      const q = project(pop.x, pop.y, pop.z);
      if (!q) continue;
      ctx.globalAlpha = Math.max(0, pop.life);
      ctx.fillStyle = "#ffb020";
      ctx.font = `400 ${Math.max(12, r.h * 0.035)}px "Share Tech Mono", ui-monospace, monospace`;
      ctx.fillText(pop.text, q.sx + 6, q.sy);
    }
    ctx.globalAlpha = 1;

    if (p.warping) {
      ctx.strokeStyle = "rgba(77,139,255,0.75)";
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * Math.PI * 2;
        const u = (sim.t * 1.6 + i * 0.17) % 1;
        const inner = 16 + u * Math.min(r.w, r.h) * 0.46;
        const outer = inner + 18 + u * 70;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner * 0.55);
        ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer * 0.55);
        ctx.stroke();
      }
    }

    const locked = p.lockId > 0;
    ctx.strokeStyle = locked ? "#ff4d5a" : "#3dff9a";
    ctx.lineWidth = 1.4;
    const reticle = Math.max(10, r.h * 0.035);
    ctx.beginPath();
    ctx.moveTo(cx - reticle * 1.8, cy);
    ctx.lineTo(cx - reticle * 0.45, cy);
    ctx.moveTo(cx + reticle * 0.45, cy);
    ctx.lineTo(cx + reticle * 1.8, cy);
    ctx.moveTo(cx, cy - reticle * 1.8);
    ctx.lineTo(cx, cy - reticle * 0.45);
    ctx.moveTo(cx, cy + reticle * 0.45);
    ctx.lineTo(cx, cy + reticle * 1.8);
    ctx.stroke();

    const strut = Math.min(46, r.w * 0.08);
    ctx.strokeStyle = "rgba(184,255,207,0.45)";
    ctx.beginPath();
    ctx.moveTo(r.x + 8, r.y + r.h - 8);
    ctx.lineTo(r.x + strut, r.y + r.h - 8);
    ctx.lineTo(r.x + strut * 0.45, cy + strut);
    ctx.moveTo(r.x + r.w - 8, r.y + r.h - 8);
    ctx.lineTo(r.x + r.w - strut, r.y + r.h - 8);
    ctx.lineTo(r.x + r.w - strut * 0.45, cy + strut);
    ctx.stroke();

    if (sim.bannerT > 0 && sim.banner) {
      ctx.globalAlpha = Math.min(1, sim.bannerT * 2);
      ctx.fillStyle = "#e7fff2";
      ctx.font = `700 ${Math.max(18, r.w * 0.05)}px Oxanium, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(sim.banner, cx, cy - r.h * 0.18);
      ctx.fillStyle = "#ffb020";
      ctx.font = `400 ${Math.max(12, r.w * 0.028)}px "Share Tech Mono", ui-monospace, monospace`;
      ctx.fillText(sim.bannerSub, cx, cy - r.h * 0.18 + 22);
      ctx.textAlign = "left";
      ctx.globalAlpha = 1;
    }

    if (sim.hintT > 0 && sim.phase === "play") {
      ctx.globalAlpha = Math.min(1, sim.hintT);
      ctx.fillStyle = "#8aa396";
      ctx.font = `400 ${Math.max(11, r.w * 0.022)}px "Share Tech Mono", ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.fillText("W MOVE   ·   SPACE LANCE   ·   F BURST   ·   SHIFT WARP", cx, r.y + r.h - 16);
      ctx.textAlign = "left";
      ctx.globalAlpha = 1;
    }

    if (p.hurtT > 0) {
      ctx.fillStyle = `rgba(255, 50, 70, ${Math.min(0.35, p.hurtT)})`;
      ctx.fillRect(r.x, r.y, r.w, r.h);
    }

    ctx.fillStyle = "rgba(0,0,0,0.16)";
    for (let y = r.y; y < r.y + r.h; y += 3) ctx.fillRect(r.x, y, r.w, 1);
  });
  brackets(ctx, r, "#1f8a4c");
}

function depthOf(ent: Ent, px: number, pz: number, fx: number, fz: number): number {
  return (ent.x - px) * fx + (ent.z - pz) * fz;
}

function strokeWorld(
  ctx: CanvasRenderingContext2D,
  project: (x: number, y: number, z: number) => Proj | null,
  x0: number,
  y0: number,
  z0: number,
  x1: number,
  y1: number,
  z1: number,
): void {
  const parts = 6;
  for (let i = 0; i < parts; i++) {
    const u0 = i / parts;
    const u1 = (i + 1) / parts;
    const a = project(x0 + (x1 - x0) * u0, y0 + (y1 - y0) * u0, z0 + (z1 - z0) * u0);
    const b = project(x0 + (x1 - x0) * u1, y0 + (y1 - y0) * u1, z0 + (z1 - z0) * u1);
    if (!a || !b) continue;
    ctx.beginPath();
    ctx.moveTo(a.sx, a.sy);
    ctx.lineTo(b.sx, b.sy);
    ctx.stroke();
  }
}

function strokeModel(
  ctx: CanvasRenderingContext2D,
  project: (x: number, y: number, z: number) => Proj | null,
  ent: Ent,
  color: string,
  grow: number,
): void {
  const wires = wiresFor(ent.kind);
  const scale = ent.r * grow;
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.lineWidth = ent.kind === "station" || ent.kind === "relic" ? 1.5 : 1.25;
  for (const wire of wires) {
    let started = false;
    ctx.beginPath();
    for (const [lx, ly, lz] of wire) {
      const [wx, wy, wz] = worldPoint(ent.yaw, ent.x, ent.y, ent.z, lx * scale, ly * scale, lz * scale);
      const q = project(wx, wy, wz);
      if (!q) {
        started = false;
        continue;
      }
      if (!started) {
        ctx.moveTo(q.sx, q.sy);
        started = true;
      } else ctx.lineTo(q.sx, q.sy);
    }
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
}
