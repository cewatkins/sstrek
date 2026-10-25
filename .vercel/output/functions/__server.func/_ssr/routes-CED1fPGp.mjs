import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as Pause, n as Volume2, t as VolumeX } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CED1fPGp.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Short synthesized cabinet voices. Unlocked from a user gesture. */
var ArcadeAudio = class {
	ctx = null;
	master = null;
	warpOsc = null;
	warpGain = null;
	muted = false;
	unlock() {
		if (!this.ctx) {
			const ctx = new AudioContext({ latencyHint: "interactive" });
			const master = ctx.createGain();
			master.gain.value = .32;
			master.connect(ctx.destination);
			this.ctx = ctx;
			this.master = master;
		}
		if (this.ctx.state === "suspended") this.ctx.resume();
	}
	setMuted(muted) {
		this.muted = muted;
		if (!this.ctx || !this.master) return;
		this.master.gain.setTargetAtTime(muted ? 0 : .32, this.ctx.currentTime, .02);
		if (muted) this.setWarp(false);
	}
	setWarp(on) {
		if (!this.ctx || !this.master || this.muted) {
			if (!on) this.stopWarp();
			return;
		}
		if (on && !this.warpOsc) {
			const osc = this.ctx.createOscillator();
			const gain = this.ctx.createGain();
			osc.type = "sawtooth";
			osc.frequency.value = 52;
			gain.gain.value = 1e-4;
			osc.connect(gain);
			gain.connect(this.master);
			osc.start();
			gain.gain.setTargetAtTime(.06, this.ctx.currentTime, .04);
			this.warpOsc = osc;
			this.warpGain = gain;
		} else if (!on) this.stopWarp();
	}
	stopWarp() {
		if (!this.ctx || !this.warpOsc || !this.warpGain) {
			this.warpOsc = null;
			this.warpGain = null;
			return;
		}
		const osc = this.warpOsc;
		this.warpGain.gain.setTargetAtTime(1e-4, this.ctx.currentTime, .03);
		osc.stop(this.ctx.currentTime + .08);
		this.warpOsc = null;
		this.warpGain = null;
	}
	play(event) {
		if (!this.ctx || !this.master || this.muted) return;
		const t = this.ctx.currentTime;
		switch (event) {
			case "lance":
				this.zap(t, 920, 380, .09, .12);
				break;
			case "miss":
				this.zap(t, 420, 220, .05, .06);
				break;
			case "ping":
				this.zap(t, 1400, 900, .04, .05);
				break;
			case "launch":
				this.zap(t, 180, 90, .16, .1);
				break;
			case "boom":
				this.noise(t, .28, .22);
				this.tone(t, 160, .32, "sine", .16, 50);
				break;
			case "hurt":
				this.tone(t, 110, .22, "sawtooth", .14, 40);
				this.noise(t, .12, .1);
				break;
			case "dry":
				this.tone(t, 90, .05, "square", .04);
				break;
			case "dock":
				this.tone(t, 523, .12, "square", .07);
				this.tone(t + .09, 659, .12, "square", .07);
				this.tone(t + .18, 784, .18, "square", .08);
				break;
			case "alert":
				this.tone(t, 494, .12, "square", .07);
				this.tone(t + .16, 330, .16, "square", .07);
				break;
			case "clear":
				[
					523,
					659,
					784,
					1046
				].forEach((f, i) => this.tone(t + i * .1, f, .16, "square", .07));
				break;
			case "station":
				this.noise(t, .3, .16);
				this.tone(t, 90, .4, "sawtooth", .12, 30);
				break;
			case "die":
				this.noise(t, .5, .2);
				this.tone(t, 200, .55, "sawtooth", .12, 40);
				break;
			case "mine": this.tone(t, 660, .04, "square", .04);
		}
	}
	tone(when, freq, dur, type, gain, slideTo) {
		if (!this.ctx || !this.master) return;
		const osc = this.ctx.createOscillator();
		const g = this.ctx.createGain();
		osc.type = type;
		osc.frequency.setValueAtTime(freq, when);
		if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), when + dur);
		g.gain.setValueAtTime(1e-4, when);
		g.gain.exponentialRampToValueAtTime(gain, when + .012);
		g.gain.exponentialRampToValueAtTime(1e-4, when + dur);
		osc.connect(g);
		g.connect(this.master);
		osc.start(when);
		osc.stop(when + dur + .02);
	}
	zap(when, from, to, dur, gain) {
		this.tone(when, from, dur, "square", gain, to);
	}
	noise(when, dur, gain) {
		if (!this.ctx || !this.master) return;
		const count = Math.floor(this.ctx.sampleRate * dur);
		const buffer = this.ctx.createBuffer(1, count, this.ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < count; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / count);
		const src = this.ctx.createBufferSource();
		src.buffer = buffer;
		const g = this.ctx.createGain();
		const filter = this.ctx.createBiquadFilter();
		filter.type = "lowpass";
		filter.frequency.value = 900;
		g.gain.setValueAtTime(gain, when);
		src.connect(filter);
		filter.connect(g);
		g.connect(this.master);
		src.start(when);
		src.stop(when + dur);
	}
};
function ring(y, r, n) {
	const pts = [];
	for (let i = 0; i <= n; i++) {
		const a = i / n * Math.PI * 2;
		pts.push([
			Math.cos(a) * r,
			y,
			Math.sin(a) * r
		]);
	}
	return pts;
}
function link(a, b) {
	const lines = [];
	const n = Math.min(a.length, b.length) - 1;
	for (let i = 0; i < n; i += 2) lines.push([a[i], b[i]]);
	return lines;
}
var cruiser = [
	[
		[
			0,
			.05,
			1.55
		],
		[
			.22,
			0,
			.15
		],
		[
			0,
			-.02,
			-1.15
		],
		[
			-.22,
			0,
			.15
		],
		[
			0,
			.05,
			1.55
		]
	],
	[
		[
			0,
			.05,
			.35
		],
		[
			1.45,
			-.08,
			-.55
		],
		[
			.35,
			0,
			-.95
		],
		[
			0,
			.02,
			-.45
		]
	],
	[
		[
			0,
			.05,
			.35
		],
		[
			-1.45,
			-.08,
			-.55
		],
		[
			-.35,
			0,
			-.95
		],
		[
			0,
			.02,
			-.45
		]
	],
	[
		[
			0,
			.28,
			.45
		],
		[
			.16,
			.12,
			.05
		],
		[
			0,
			.08,
			-.25
		],
		[
			-.16,
			.12,
			.05
		],
		[
			0,
			.28,
			.45
		]
	],
	[
		[
			.42,
			0,
			-.72
		],
		[
			.42,
			.16,
			-.95
		],
		[
			.42,
			0,
			-1.15
		]
	],
	[
		[
			-.42,
			0,
			-.72
		],
		[
			-.42,
			.16,
			-.95
		],
		[
			-.42,
			0,
			-1.15
		]
	]
];
var top = ring(.18, 1, 8);
var bot = ring(-.12, 1, 8);
var saucer = [
	top,
	bot,
	...link(top, bot),
	ring(.42, .38, 6),
	[[
		0,
		.42,
		0
	], [
		0,
		.72,
		0
	]],
	[[
		-.55,
		.18,
		0
	], [
		.55,
		.18,
		0
	]],
	[[
		0,
		.18,
		-.55
	], [
		0,
		.18,
		.55
	]]
];
var hex = ring(0, 1, 6);
var inner = ring(.08, .48, 6);
var SHAPES = {
	raider: cruiser,
	hunter: cruiser,
	dart: cruiser,
	saucer,
	station: [
		hex,
		inner,
		...link(hex, inner),
		[[
			0,
			0,
			0
		], [
			0,
			1.15,
			0
		]],
		ring(1.15, .22, 5),
		[[
			0,
			1.15,
			0
		], [
			0,
			1.45,
			0
		]],
		[
			[
				1,
				0,
				0
			],
			[
				.62,
				.55,
				0
			],
			[
				0,
				.2,
				0
			]
		],
		[
			[
				-.5,
				0,
				.86
			],
			[
				-.32,
				.55,
				.5
			],
			[
				0,
				.2,
				0
			]
		],
		[
			[
				-.5,
				0,
				-.86
			],
			[
				-.32,
				.55,
				-.5
			],
			[
				0,
				.2,
				0
			]
		]
	],
	relic: [
		ring(0, 1, 8),
		ring(.55, .72, 6),
		ring(-.45, .72, 6),
		[
			[
				0,
				1.05,
				0
			],
			[
				.7,
				0,
				.7
			],
			[
				0,
				-.9,
				0
			],
			[
				-.7,
				0,
				-.7
			],
			[
				0,
				1.05,
				0
			]
		],
		[
			[
				0,
				1.05,
				0
			],
			[
				-.7,
				0,
				.7
			],
			[
				0,
				-.9,
				0
			],
			[
				.7,
				0,
				-.7
			],
			[
				0,
				1.05,
				0
			]
		]
	],
	asteroid: [
		[
			[
				.2,
				.4,
				1
			],
			[
				1,
				.1,
				.2
			],
			[
				.6,
				-.4,
				-.7
			],
			[
				-.4,
				-.2,
				-1
			],
			[
				-1,
				.3,
				-.1
			],
			[
				-.3,
				.6,
				.6
			],
			[
				.2,
				.4,
				1
			]
		],
		[
			[
				.2,
				.4,
				1
			],
			[
				.1,
				-.7,
				.4
			],
			[
				.6,
				-.4,
				-.7
			]
		],
		[
			[
				-1,
				.3,
				-.1
			],
			[
				-.2,
				-.8,
				.2
			],
			[
				.1,
				-.7,
				.4
			]
		],
		[
			[
				1,
				.1,
				.2
			],
			[
				.4,
				.9,
				-.3
			],
			[
				-.3,
				.6,
				.6
			]
		]
	],
	mine: [
		[
			[
				0,
				.9,
				0
			],
			[
				.7,
				0,
				0
			],
			[
				0,
				-.9,
				0
			],
			[
				-.7,
				0,
				0
			],
			[
				0,
				.9,
				0
			]
		],
		[
			[
				0,
				.9,
				0
			],
			[
				0,
				0,
				.7
			],
			[
				0,
				-.9,
				0
			],
			[
				0,
				0,
				-.7
			],
			[
				0,
				.9,
				0
			]
		],
		ring(0, .7, 6)
	]
};
function wiresFor(kind) {
	return SHAPES[kind] ?? cruiser;
}
/** Local +Z is the nose. yaw 0 maps that nose onto world -Z. */
function worldPoint(yaw, ox, oy, oz, lx, ly, lz) {
	const co = Math.cos(yaw);
	const si = Math.sin(yaw);
	return [
		ox + lx * co - lz * si,
		oy + ly,
		oz - lx * si - lz * co
	];
}
var WORLD = 2400;
var LIMIT = 1120;
var TURN_RATE = 2.45;
function formatScore(n) {
	return Math.max(0, Math.floor(n)).toString().padStart(6, "0");
}
var COLOR = {
	raider: "#ff4d5a",
	hunter: "#d391ff",
	dart: "#f4fff8",
	saucer: "#49e7ff",
	asteroid: "#9bb0a0",
	relic: "#ffc14d",
	mine: "#ffd25a",
	station: "#3dff9a",
	shot: "#ff8d96",
	shell: "#ffb020"
};
var STARS = Array.from({ length: 150 }, (_, i) => {
	const h = (n) => {
		const v = Math.sin(n * 127.1 + i * 3.1) * 43758.5453;
		return v - Math.floor(v);
	};
	return {
		x: (h(1) - .5) * 3800,
		y: 40 + h(2) * 620,
		z: (h(3) - .5) * 3800,
		b: .35 + h(4) * .65
	};
});
function layout(w, h) {
	const pad = Math.max(8, Math.round(Math.min(w, h) * .018));
	const topH = Math.round(h * (h > w ? .36 : .4));
	const statusW = Math.round(w * (w < 720 ? .44 : .3));
	return {
		status: {
			x: pad,
			y: pad,
			w: statusW - pad,
			h: topH - pad
		},
		scan: {
			x: statusW + pad * .4,
			y: pad,
			w: w - statusW - pad * 1.4,
			h: topH - pad
		},
		view: {
			x: pad,
			y: topH + pad * .45,
			w: w - pad * 2,
			h: h - topH - pad * 1.5
		}
	};
}
function brackets(ctx, r, color) {
	const t = Math.max(10, Math.min(22, r.w * .06, r.h * .12));
	ctx.strokeStyle = color;
	ctx.lineWidth = 1.25;
	ctx.beginPath();
	const c = [
		[r.x, r.y],
		[r.x + r.w, r.y],
		[r.x + r.w, r.y + r.h],
		[r.x, r.y + r.h]
	];
	const s = [
		[1, 1],
		[-1, 1],
		[-1, -1],
		[1, -1]
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
function fillPanel(ctx, r, color) {
	ctx.fillStyle = color;
	ctx.fillRect(r.x, r.y, r.w, r.h);
}
function clip(ctx, r, draw) {
	ctx.save();
	ctx.beginPath();
	ctx.rect(r.x, r.y, r.w, r.h);
	ctx.clip();
	draw();
	ctx.restore();
}
function draw(ctx, sim, w, h) {
	ctx.clearRect(0, 0, w, h);
	ctx.fillStyle = "#07080c";
	ctx.fillRect(0, 0, w, h);
	const mag = sim.shake;
	ctx.save();
	if (mag > .2) ctx.translate(Math.sin(sim.t * 88) * mag, Math.cos(sim.t * 63) * mag);
	const L = layout(w, h);
	drawStatus(ctx, sim, L.status);
	drawScanner(ctx, sim, L.scan);
	drawViewer(ctx, sim, L.view);
	ctx.restore();
}
function drawStatus(ctx, sim, r) {
	fillPanel(ctx, r, "#080c0a");
	clip(ctx, r, () => {
		const p = sim.player;
		const mono = "\"Share Tech Mono\", ui-monospace, monospace";
		const display = "Oxanium, sans-serif";
		let y = r.y + 22;
		const x = r.x + 14;
		ctx.fillStyle = "#8aa396";
		ctx.font = `600 ${Math.max(10, r.w * .055)}px ${display}`;
		ctx.fillText("STATUS", x, y);
		ctx.fillStyle = "#ffb020";
		ctx.font = `700 ${Math.max(13, r.w * .075)}px ${display}`;
		y += r.h * .09;
		ctx.fillText("HALCYON", x, y);
		y += r.h * .075;
		ctx.fillStyle = "#3dff9a";
		ctx.font = `400 ${Math.max(11, r.w * .058)}px ${mono}`;
		const sector = sim.sector < 0 ? "STANDBY" : `SECTOR ${String(sim.sector + 1).padStart(2, "0")}`;
		ctx.fillText(sector, x, y);
		y += r.h * .055;
		ctx.fillStyle = "#8aa396";
		ctx.fillText(sim.sectorName, x, y);
		y += r.h * .09;
		ctx.fillStyle = "#8aa396";
		ctx.font = `400 ${Math.max(10, r.w * .05)}px ${mono}`;
		ctx.fillText("SCORE", x, y);
		y += r.h * .08;
		ctx.fillStyle = "#e7fff2";
		ctx.font = `400 ${Math.max(16, r.w * .09)}px ${mono}`;
		ctx.fillText(formatScore(sim.score), x, y);
		y += r.h * .06;
		ctx.fillStyle = "#8aa396";
		ctx.font = `400 ${Math.max(10, r.w * .048)}px ${mono}`;
		ctx.fillText(`BEST ${formatScore(sim.best)}`, x, y);
		const row = (label, n, slots, on) => {
			y += r.h * .07;
			ctx.fillStyle = "#8aa396";
			ctx.font = `400 ${Math.max(10, r.w * .048)}px ${mono}`;
			ctx.fillText(label, x, y);
			y += r.h * .045;
			const gap = 4;
			const size = Math.min(12, (r.w - 28 - gap * (slots - 1)) / slots);
			for (let i = 0; i < slots; i++) {
				ctx.fillStyle = i < n ? on : "#1a2820";
				ctx.fillRect(x + i * (size + gap), y - size + 2, size, size * .72);
			}
		};
		row("SHIELDS", p.shields, 8, "#3dff9a");
		row("SHELLS", p.shells, 9, "#ff4d5a");
		y += r.h * .075;
		ctx.fillStyle = "#8aa396";
		ctx.font = `400 ${Math.max(10, r.w * .048)}px ${mono}`;
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
			if (e.kind === "raider" || e.kind === "hunter" || e.kind === "dart" || e.kind === "saucer" || e.kind === "relic") hostiles += 1;
		}
		y += r.h * .08;
		ctx.fillStyle = p.shields === 0 ? "#ffb020" : "#8aa396";
		ctx.font = `400 ${Math.max(10, r.w * .046)}px ${mono}`;
		const line = sim.phase === "title" ? "PRESS START" : sim.phase === "over" ? "HULL LOST" : p.shields === 0 ? "HULL EXPOSED" : `HOSTILES ${String(hostiles).padStart(2, "0")}`;
		ctx.fillText(line, x, y);
		y += r.h * .05;
		ctx.fillStyle = "#8aa396";
		ctx.fillText(`ANCHORS ${String(anchors).padStart(2, "0")}`, x, y);
	});
	brackets(ctx, r, "#1f8a4c");
}
function drawScanner(ctx, sim, r) {
	fillPanel(ctx, r, "#070b10");
	const scale = Math.min(r.w, r.h) * .86 / WORLD;
	const cx = r.x + r.w / 2;
	const cy = r.y + r.h / 2;
	const to = (x, z) => ({
		sx: cx + x * scale,
		sy: cy + z * scale
	});
	clip(ctx, r, () => {
		ctx.strokeStyle = "rgba(61,255,154,0.16)";
		ctx.lineWidth = 1;
		ctx.strokeRect(cx - LIMIT_S(scale), cy - LIMIT_S(scale), LIMIT_S(scale) * 2, LIMIT_S(scale) * 2);
		ctx.font = `600 ${Math.max(10, r.w * .045)}px Oxanium, sans-serif`;
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
				ctx.arc(p.sx, p.sy, Math.max(3, e.r * scale * .55), 0, Math.PI * 2);
				ctx.stroke();
			} else if (e.kind === "mine") {
				ctx.beginPath();
				ctx.moveTo(p.sx - 3, p.sy - 3);
				ctx.lineTo(p.sx + 3, p.sy + 3);
				ctx.moveTo(p.sx + 3, p.sy - 3);
				ctx.lineTo(p.sx - 3, p.sy + 3);
				ctx.stroke();
			} else if (e.kind === "shot" || e.kind === "shell") ctx.fillRect(p.sx - 1.5, p.sy - 1.5, 3, 3);
			else if (e.kind === "asteroid") ctx.strokeRect(p.sx - 3, p.sy - 3, 6, 6);
			else drawBlip(ctx, p.sx, p.sy, e.yaw, e.kind === "relic" ? 8 : 6);
		}
		for (const b of sim.blooms) {
			const p = to(b.x, b.z);
			const rad = (1 - b.life / .42) * b.max * scale;
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
function LIMIT_S(scale) {
	return 1120 * scale;
}
function drawBlip(ctx, sx, sy, yaw, size) {
	const fx = -Math.sin(yaw);
	const fz = -Math.cos(yaw);
	const rx = Math.cos(yaw);
	const rz = -Math.sin(yaw);
	const nx = sx + fx * size;
	const ny = sy + fz * size;
	ctx.beginPath();
	ctx.moveTo(nx, ny);
	ctx.lineTo(sx - fx * size * .6 + rx * size * .7, sy - fz * size * .6 + rz * size * .7);
	ctx.lineTo(sx - fx * size * .6 - rx * size * .7, sy - fz * size * .6 - rz * size * .7);
	ctx.closePath();
	ctx.stroke();
}
function drawViewer(ctx, sim, r) {
	const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
	g.addColorStop(0, "#05070d");
	g.addColorStop(.5, "#07110f");
	g.addColorStop(1, "#0c1c16");
	ctx.fillStyle = g;
	ctx.fillRect(r.x, r.y, r.w, r.h);
	const p = sim.player;
	const fov = r.h * .85;
	const cx = r.x + r.w / 2;
	const cy = r.y + r.h * .48;
	const fx = -Math.sin(p.yaw);
	const fz = -Math.cos(p.yaw);
	const rx = Math.cos(p.yaw);
	const rz = -Math.sin(p.yaw);
	const project = (x, y, z) => {
		const dx = x - p.x;
		const dy = y - 26;
		const dz = z - p.z;
		const lx = dx * rx + dz * rz;
		const lz = dx * fx + dz * fz;
		if (lz < 14) return null;
		const s = fov / lz;
		return {
			sx: cx + lx * s,
			sy: cy - dy * s,
			lz
		};
	};
	clip(ctx, r, () => {
		ctx.fillStyle = "#8aa396";
		ctx.font = `600 ${Math.max(10, r.w * .02)}px Oxanium, sans-serif`;
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
			if (depthOf(ent, p.x, p.z, fx, fz) < 10) continue;
			const grow = 1 + ent.intro * 2.2;
			const color = ent.flash > 0 ? "#ffffff" : ent.kind === "station" && ent.used ? "#1f6b42" : COLOR[ent.kind];
			strokeModel(ctx, project, ent, color, grow);
		}
		for (const s of sim.sparks) {
			const a = project(s.x, s.y, s.z);
			const b = project(s.x - s.vx * .04, s.y - s.vy * .04, s.z - s.vz * .04);
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
			if (!e.alive || e.kind !== "shot" && e.kind !== "shell") continue;
			const q = project(e.x, e.y, e.z);
			if (!q) continue;
			const tail = project(e.x - e.vx * .04, e.y, e.z - e.vz * .04);
			ctx.strokeStyle = COLOR[e.kind];
			ctx.lineWidth = e.kind === "shell" ? 2.2 : 1.4;
			ctx.beginPath();
			ctx.moveTo(q.sx, q.sy);
			if (tail) ctx.lineTo(tail.sx, tail.sy);
			ctx.stroke();
		}
		for (const bloom of sim.blooms) {
			const rad = 12 + (1 - Math.max(0, bloom.life) / .42) * bloom.max;
			ctx.strokeStyle = bloom.color;
			ctx.globalAlpha = Math.max(0, bloom.life * 2.2);
			ctx.lineWidth = 1.4;
			ctx.beginPath();
			for (let i = 0; i <= 28; i++) {
				const a = i / 28 * Math.PI * 2;
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
			ctx.font = `400 ${Math.max(12, r.h * .035)}px "Share Tech Mono", ui-monospace, monospace`;
			ctx.fillText(pop.text, q.sx + 6, q.sy);
		}
		ctx.globalAlpha = 1;
		if (p.warping) {
			ctx.strokeStyle = "rgba(77,139,255,0.75)";
			ctx.lineWidth = 1.2;
			for (let i = 0; i < 28; i++) {
				const a = i / 28 * Math.PI * 2;
				const u = (sim.t * 1.6 + i * .17) % 1;
				const inner = 16 + u * Math.min(r.w, r.h) * .46;
				const outer = inner + 18 + u * 70;
				ctx.beginPath();
				ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner * .55);
				ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer * .55);
				ctx.stroke();
			}
		}
		ctx.strokeStyle = p.lockId > 0 ? "#ff4d5a" : "#3dff9a";
		ctx.lineWidth = 1.4;
		const reticle = Math.max(10, r.h * .035);
		ctx.beginPath();
		ctx.moveTo(cx - reticle * 1.8, cy);
		ctx.lineTo(cx - reticle * .45, cy);
		ctx.moveTo(cx + reticle * .45, cy);
		ctx.lineTo(cx + reticle * 1.8, cy);
		ctx.moveTo(cx, cy - reticle * 1.8);
		ctx.lineTo(cx, cy - reticle * .45);
		ctx.moveTo(cx, cy + reticle * .45);
		ctx.lineTo(cx, cy + reticle * 1.8);
		ctx.stroke();
		const strut = Math.min(46, r.w * .08);
		ctx.strokeStyle = "rgba(184,255,207,0.45)";
		ctx.beginPath();
		ctx.moveTo(r.x + 8, r.y + r.h - 8);
		ctx.lineTo(r.x + strut, r.y + r.h - 8);
		ctx.lineTo(r.x + strut * .45, cy + strut);
		ctx.moveTo(r.x + r.w - 8, r.y + r.h - 8);
		ctx.lineTo(r.x + r.w - strut, r.y + r.h - 8);
		ctx.lineTo(r.x + r.w - strut * .45, cy + strut);
		ctx.stroke();
		if (sim.bannerT > 0 && sim.banner) {
			ctx.globalAlpha = Math.min(1, sim.bannerT * 2);
			ctx.fillStyle = "#e7fff2";
			ctx.font = `700 ${Math.max(18, r.w * .05)}px Oxanium, sans-serif`;
			ctx.textAlign = "center";
			ctx.fillText(sim.banner, cx, cy - r.h * .18);
			ctx.fillStyle = "#ffb020";
			ctx.font = `400 ${Math.max(12, r.w * .028)}px "Share Tech Mono", ui-monospace, monospace`;
			ctx.fillText(sim.bannerSub, cx, cy - r.h * .18 + 22);
			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		}
		if (sim.hintT > 0 && sim.phase === "play") {
			ctx.globalAlpha = Math.min(1, sim.hintT);
			ctx.fillStyle = "#8aa396";
			ctx.font = `400 ${Math.max(11, r.w * .022)}px "Share Tech Mono", ui-monospace, monospace`;
			ctx.textAlign = "center";
			ctx.fillText(r.w < 560 ? "DRAG TURNS  ·  LANCE  ·  BURST  ·  WARP" : "W MOVE   ·   SPACE LANCE   ·   F BURST   ·   SHIFT WARP", cx, r.y + r.h - 16);
			ctx.textAlign = "left";
			ctx.globalAlpha = 1;
		}
		if (p.hurtT > 0) {
			ctx.fillStyle = `rgba(255, 50, 70, ${Math.min(.35, p.hurtT)})`;
			ctx.fillRect(r.x, r.y, r.w, r.h);
		}
		ctx.fillStyle = "rgba(0,0,0,0.16)";
		for (let y = r.y; y < r.y + r.h; y += 3) ctx.fillRect(r.x, y, r.w, 1);
	});
	brackets(ctx, r, "#1f8a4c");
}
function depthOf(ent, px, pz, fx, fz) {
	return (ent.x - px) * fx + (ent.z - pz) * fz;
}
function strokeWorld(ctx, project, x0, y0, z0, x1, y1, z1) {
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
function strokeModel(ctx, project, ent, color, grow) {
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
var BEST_KEY = "halcyon-ops-best";
var HOSTILE = {
	raider: true,
	hunter: true,
	dart: true,
	saucer: true,
	relic: true
};
var BLASTABLE = {
	raider: true,
	hunter: true,
	dart: true,
	saucer: true,
	asteroid: true,
	relic: true,
	mine: true
};
var STAT = {
	raider: {
		hp: 1,
		spd: 80,
		r: 26,
		y: 18,
		turn: 1.4,
		score: 150,
		cd: 1.65,
		range: 340
	},
	hunter: {
		hp: 1,
		spd: 100,
		r: 24,
		y: 18,
		turn: 1.75,
		score: 220,
		cd: 1.25,
		range: 680
	},
	dart: {
		hp: 1,
		spd: 142,
		r: 18,
		y: 16,
		turn: 2.55,
		score: 360,
		cd: .9,
		range: 580
	},
	saucer: {
		hp: 2,
		spd: 74,
		r: 34,
		y: 20,
		turn: 0,
		score: 520,
		cd: 2.35,
		range: 200
	},
	asteroid: {
		hp: 1,
		spd: 64,
		r: 28,
		y: 12,
		turn: 0,
		score: 30,
		cd: 0,
		range: 0
	},
	relic: {
		hp: 4,
		spd: 44,
		r: 48,
		y: 26,
		turn: .55,
		score: 2e3,
		cd: 3.2,
		range: 0
	}
};
var CAMPAIGN = [
	{
		name: "OUTER REACH",
		stations: 1,
		spawns: [{
			k: "raider",
			n: 3
		}]
	},
	{
		name: "AMBER LANE",
		stations: 1,
		spawns: [{
			k: "raider",
			n: 3
		}, {
			k: "hunter",
			n: 2
		}]
	},
	{
		name: "TWIN ANCHORS",
		stations: 2,
		spawns: [{
			k: "raider",
			n: 4
		}, {
			k: "hunter",
			n: 2
		}]
	},
	{
		name: "DRIFT FIELD",
		stations: 1,
		spawns: [{
			k: "hunter",
			n: 2
		}, {
			k: "asteroid",
			n: 8
		}]
	},
	{
		name: "WHITE KNIVES",
		stations: 2,
		spawns: [{
			k: "dart",
			n: 3
		}, {
			k: "raider",
			n: 2
		}]
	},
	{
		name: "SAUCER ARC",
		stations: 2,
		spawns: [
			{
				k: "saucer",
				n: 3
			},
			{
				k: "raider",
				n: 2
			},
			{
				k: "hunter",
				n: 1
			}
		]
	},
	{
		name: "CROSSFIRE",
		stations: 2,
		spawns: [
			{
				k: "hunter",
				n: 3
			},
			{
				k: "dart",
				n: 2
			},
			{
				k: "raider",
				n: 2
			},
			{
				k: "asteroid",
				n: 4
			}
		]
	},
	{
		name: "RELIC WAKE",
		stations: 2,
		spawns: [
			{
				k: "relic",
				n: 1
			},
			{
				k: "raider",
				n: 3
			},
			{
				k: "hunter",
				n: 2
			}
		]
	},
	{
		name: "CYAN STORM",
		stations: 2,
		spawns: [{
			k: "saucer",
			n: 4
		}, {
			k: "dart",
			n: 3
		}]
	},
	{
		name: "LAST ANCHOR",
		stations: 2,
		spawns: [
			{
				k: "relic",
				n: 1
			},
			{
				k: "saucer",
				n: 2
			},
			{
				k: "dart",
				n: 2
			},
			{
				k: "hunter",
				n: 3
			},
			{
				k: "raider",
				n: 2
			}
		]
	}
];
var attractAnchor = /* @__PURE__ */ new WeakMap();
function mulberry32(seed) {
	let a = seed >>> 0;
	return () => {
		a |= 0;
		a = a + 1831565813 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
function readBest() {
	try {
		const n = Number(localStorage.getItem(BEST_KEY));
		return Number.isFinite(n) ? n : 0;
	} catch {
		return 0;
	}
}
function noteScore(sim) {
	if (sim.score <= sim.best) return;
	sim.best = sim.score;
	try {
		localStorage.setItem(BEST_KEY, String(sim.best));
	} catch {}
}
function freshPlayer() {
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
		lockId: -1
	};
}
function mk(sim, kind, x, z, extra = {}) {
	const combat = STAT[kind];
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
		cd: .35 + sim.rng() * .5,
		life: 0,
		arm: 0,
		alive: true,
		used: false,
		flash: 0,
		intro: .85,
		seed: sim.rng(),
		ang: sim.rng() * Math.PI * 2,
		...extra
	};
}
function planFor(index) {
	if (index < CAMPAIGN.length) return {
		...CAMPAIGN[index],
		speed: 1 + index * .035
	};
	const loop = index - CAMPAIGN.length + 1;
	return {
		name: `DEEP FIELD ${index + 1}`,
		stations: 2,
		speed: 1.28 + loop * .07,
		spawns: [
			{
				k: "raider",
				n: 3 + loop % 3
			},
			{
				k: "hunter",
				n: 2 + loop % 3
			},
			{
				k: "dart",
				n: 1 + loop % 4
			},
			{
				k: "saucer",
				n: loop % 2
			},
			{
				k: "relic",
				n: loop % 3 === 0 ? 1 : 0
			},
			{
				k: "asteroid",
				n: loop % 2 === 0 ? 5 : 0
			}
		]
	};
}
function spawnRim(sim, kind) {
	for (let attempt = 0; attempt < 14; attempt++) {
		const a = sim.rng() * Math.PI * 2;
		const rad = 980 + sim.rng() * 130;
		const x = Math.cos(a) * rad;
		const z = Math.sin(a) * rad;
		if (Math.hypot(x - sim.player.x, z - sim.player.z) < 300) continue;
		let blocked = false;
		for (const e of sim.ents) if (Math.hypot(e.x - x, e.z - z) < 90) {
			blocked = true;
			break;
		}
		if (blocked) continue;
		const ent = mk(sim, kind, x, z);
		if (kind === "asteroid") {
			const ang = sim.rng() * Math.PI * 2;
			const sp = ent.spd * (.7 + sim.rng() * .6);
			ent.vx = Math.cos(ang) * sp;
			ent.vz = Math.sin(ang) * sp;
		}
		if (kind === "saucer") {
			const ang = Math.atan2(-z, -x);
			ent.vx = Math.cos(ang) * ent.spd * .75;
			ent.vz = Math.sin(ang) * ent.spd * .75;
		}
		sim.ents.push(ent);
		return;
	}
}
function beginSector(sim, index) {
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
		{
			x: 0,
			z: -480
		},
		{
			x: 540,
			z: 60
		},
		{
			x: -520,
			z: 160
		}
	];
	for (let i = 0; i < plan.stations; i++) {
		const s = spots[i];
		sim.ents.push(mk(sim, "station", s.x, s.z, {
			hp: 4,
			r: 78,
			y: 0,
			spd: 0,
			intro: .7
		}));
	}
	for (const sp of plan.spawns) for (let i = 0; i < sp.n; i++) spawnRim(sim, sp.k);
	sim.banner = `SECTOR ${String(index + 1).padStart(2, "0")}`;
	sim.bannerSub = plan.name;
	sim.bannerT = 2.35;
	sim.hintT = index === 0 ? 8 : 0;
	sim.events.push("alert");
}
function createSim() {
	const sim = {
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
		rng: mulberry32(42)
	};
	sim.player.z = 560;
	for (const [kind, x, z] of [
		[
			"station",
			0,
			-420
		],
		[
			"raider",
			-640,
			-180
		],
		[
			"hunter",
			620,
			80
		],
		[
			"saucer",
			180,
			-700
		],
		[
			"dart",
			-360,
			480
		],
		[
			"relic",
			760,
			-520
		]
	]) {
		const ent = mk(sim, kind, x, z, { intro: 0 });
		if (kind === "station") {
			ent.hp = 4;
			ent.r = 78;
			ent.y = 0;
		}
		attractAnchor.set(ent, {
			x,
			z
		});
		sim.ents.push(ent);
	}
	return sim;
}
function startGame(sim) {
	sim.score = 0;
	sim.player = freshPlayer();
	sim.sparks = [];
	sim.pops = [];
	sim.shake = 0;
	sim.hitstop = 0;
	sim.events = [];
	beginSector(sim, 0);
}
function decayFx(sim, dt) {
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
function stepTitle(sim, dt) {
	const p = sim.player;
	p.yaw += dt * .16;
	p.x = Math.sin(sim.t * .2) * 30;
	p.z = 560;
	p.speed = 0;
	p.warping = false;
	for (const ent of sim.ents) {
		ent.yaw += dt * (ent.kind === "station" ? .25 : .45);
		const anchor = attractAnchor.get(ent);
		if (!anchor || ent.kind === "station") continue;
		ent.ang += dt * (.28 + ent.seed * .25);
		ent.x = anchor.x + Math.cos(ent.ang) * 80;
		ent.z = anchor.z + Math.sin(ent.ang) * 80;
	}
}
function fwd(yaw) {
	return {
		fx: -Math.sin(yaw),
		fz: -Math.cos(yaw),
		rx: Math.cos(yaw),
		rz: -Math.sin(yaw)
	};
}
function steerToward(ent, tx, tz, turn, dt) {
	const dx = tx - ent.x;
	const dz = tz - ent.z;
	const want = Math.atan2(-dx, -dz);
	let d = Math.atan2(Math.sin(want - ent.yaw), Math.cos(want - ent.yaw));
	const max = turn * dt;
	if (d > max) d = max;
	if (d < -max) d = -max;
	ent.yaw += d;
}
function advance(ent, dt) {
	const { fx, fz } = fwd(ent.yaw);
	ent.x += fx * ent.spd * dt;
	ent.z += fz * ent.spd * dt;
}
function keepIn(ent) {
	const outside = ent.x > 1120 || ent.x < -1120 || ent.z > 1120 || ent.z < -1120;
	ent.x = Math.max(-LIMIT, Math.min(LIMIT, ent.x));
	ent.z = Math.max(-LIMIT, Math.min(LIMIT, ent.z));
	if (!outside) return;
	if (ent.kind === "asteroid" || ent.kind === "saucer") {
		if (Math.abs(ent.x) >= 1119) ent.vx *= -1;
		if (Math.abs(ent.z) >= 1119) ent.vz *= -1;
		return;
	}
	if (ent.kind === "station" || ent.kind === "mine" || ent.kind === "shot" || ent.kind === "shell") return;
	ent.yaw = Math.atan2(ent.x, ent.z);
}
function nearestStation(sim, x, z) {
	let best = null;
	let bestD = 0xe8d4a51000;
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
function sparks(sim, x, y, z, color, n) {
	for (let i = 0; i < n; i++) {
		const a = sim.rng() * Math.PI * 2;
		const sp = 40 + sim.rng() * 160;
		sim.sparks.push({
			x,
			y,
			z,
			vx: Math.cos(a) * sp,
			vy: (sim.rng() - .2) * 80,
			vz: Math.sin(a) * sp,
			life: .25 + sim.rng() * .35,
			color
		});
	}
}
function safePlayer(sim) {
	const p = sim.player;
	return p.warping || p.dockT > 0 || p.iframe > 0 || sim.phase !== "play";
}
function hurtPlayer(sim) {
	if (safePlayer(sim)) return;
	const p = sim.player;
	p.iframe = .72;
	p.hurtT = .38;
	sim.shake = Math.min(16, sim.shake + 10);
	sim.hitstop = Math.max(sim.hitstop, .04);
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
function scoreKill(sim, ent) {
	const pts = STAT[ent.kind]?.score ?? 50;
	sim.score += pts;
	noteScore(sim);
	sim.pops.push({
		x: ent.x,
		z: ent.z,
		y: ent.y + 20,
		text: `+${pts}`,
		life: .85
	});
	sparks(sim, ent.x, ent.y, ent.z, "#e7fff2", ent.kind === "relic" ? 16 : 8);
	if (ent.kind === "relic") sim.events.push("boom");
	else sim.events.push("ping");
}
function hurtEnt(sim, ent, dmg) {
	if (!ent.alive || !BLASTABLE[ent.kind]) return;
	ent.hp -= dmg;
	ent.flash = .1;
	if (ent.hp <= 0) {
		ent.alive = false;
		scoreKill(sim, ent);
	}
}
function damageStation(sim, station) {
	if (!station.alive) return;
	station.hp -= 1;
	station.flash = .18;
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
function fireShot(sim, ent, tx, tz, speed) {
	const dx = tx - ent.x;
	const dz = tz - ent.z;
	const dist = Math.hypot(dx, dz) || 1;
	const nx = dx / dist;
	const nz = dz / dist;
	sim.ents.push(mk(sim, "shot", ent.x + nx * (ent.r + 8), ent.z + nz * (ent.r + 8), {
		vx: nx * speed,
		vz: nz * speed,
		r: 6,
		y: 16,
		hp: 1,
		life: 2.15,
		intro: 0,
		spd: speed
	}));
}
function tryShoot(sim, ent, tx, tz, range, cd) {
	ent.cd -= 1 / 60;
	if (ent.cd > 0) return;
	const dx = tx - ent.x;
	const dz = tz - ent.z;
	const dist = Math.hypot(dx, dz);
	if (dist > range || dist < 20) return;
	const want = Math.atan2(-dx, -dz);
	if (Math.abs(Math.atan2(Math.sin(want - ent.yaw), Math.cos(want - ent.yaw))) > .42) return;
	ent.cd = cd;
	fireShot(sim, ent, tx, tz, 250 + sim.speedMul * 20);
}
function updateEnemy(sim, ent, dt) {
	const stat = STAT[ent.kind];
	const p = sim.player;
	if (ent.kind === "asteroid") {
		ent.x += ent.vx * dt;
		ent.z += ent.vz * dt;
		ent.yaw += dt * (.4 + ent.seed);
		keepIn(ent);
		return;
	}
	if (ent.kind === "saucer") {
		ent.ang += dt * .9;
		ent.x += ent.vx * dt + Math.cos(ent.ang) * 36 * dt;
		ent.z += ent.vz * dt + Math.sin(ent.ang) * 36 * dt;
		ent.yaw += dt * .6;
		keepIn(ent);
		ent.cd -= dt;
		if (ent.cd <= 0) {
			ent.cd = (stat?.cd ?? 2.3) / sim.speedMul;
			sim.blooms.push({
				x: ent.x,
				z: ent.z,
				life: .35,
				max: stat?.range ?? 200,
				color: "#49e7ff"
			});
			if (Math.hypot(p.x - ent.x, p.z - ent.z) < (stat?.range ?? 200) && !safePlayer(sim)) hurtPlayer(sim);
			sim.events.push("ping");
		}
		return;
	}
	if (ent.kind === "relic") {
		steerToward(ent, Math.cos(sim.t * .17 + ent.seed * 6) * 420, Math.sin(sim.t * .13 + ent.seed) * 420, stat?.turn ?? .5, dt);
		advance(ent, dt);
		keepIn(ent);
		ent.cd -= dt;
		if (ent.cd <= 0) {
			ent.cd = (stat?.cd ?? 3.2) / sim.speedMul;
			sim.ents.push(mk(sim, "mine", ent.x, ent.z, {
				hp: 1,
				r: 16,
				y: 10,
				life: 13,
				arm: .85,
				intro: .2,
				spd: 0
			}));
			sim.events.push("mine");
		}
		return;
	}
	if (ent.kind === "raider") {
		const station = nearestStation(sim, ent.x, ent.z);
		if (station) {
			if (Math.hypot(station.x - ent.x, station.z - ent.z) > 250) steerToward(ent, station.x, station.z, stat?.turn ?? 1.3, dt);
			else {
				const ang = Math.atan2(ent.z - station.z, ent.x - station.x) + .7;
				steerToward(ent, station.x + Math.cos(ang) * 230, station.z + Math.sin(ang) * 230, 1.7, dt);
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
	const px = -dz / dist * flank;
	const pz = dx / dist * flank;
	steerToward(ent, p.x + px, p.z + pz, stat?.turn ?? 1.6, dt);
	advance(ent, dt);
	keepIn(ent);
	tryShoot(sim, ent, p.x, p.z, stat?.range ?? 640, (stat?.cd ?? 1.2) / sim.speedMul);
}
function separate(sim, dt) {
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
			const min = a.r + b.r * .45;
			if (d > 0 && d < min) {
				const push = (min - d) / d * .5;
				a.x -= dx * push * dt * 8;
				a.z -= dz * push * dt * 8;
				b.x += dx * push * dt * 8;
				b.z += dz * push * dt * 8;
			}
		}
	}
}
function acquire(sim) {
	const p = sim.player;
	const { fx, fz, rx, rz } = fwd(p.yaw);
	let best = null;
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
		if (ang > Math.min(.46, .11 + 34 / dist) || ang >= bestAng) continue;
		bestAng = ang;
		best = e;
	}
	return best;
}
function segmentHits(x0, z0, x1, z1, sx, sz, rad) {
	const dx = x1 - x0;
	const dz = z1 - z0;
	const len2 = dx * dx + dz * dz;
	let t = 0;
	if (len2 > 1e-4) {
		t = ((sx - x0) * dx + (sz - z0) * dz) / len2;
		if (t < 0) t = 0;
		else if (t > 1) t = 1;
	}
	const px = x0 + dx * t;
	const pz = z0 + dz * t;
	return Math.hypot(px - sx, pz - sz) < rad;
}
function detonate(sim, x, z) {
	sim.blooms.push({
		x,
		z,
		life: .42,
		max: 210,
		color: "#ffb020"
	});
	sim.shake = Math.min(16, sim.shake + 7);
	sim.hitstop = Math.max(sim.hitstop, .045);
	for (const e of sim.ents) {
		if (!e.alive || !BLASTABLE[e.kind]) continue;
		if (Math.hypot(e.x - x, e.z - z) < 200 + e.r * .35) hurtEnt(sim, e, 99);
	}
	sim.events.push("boom");
}
function moveProjectiles(sim, dt) {
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
			if (!boom) for (const e of sim.ents) {
				if (!e.alive || e.id === s.id || !BLASTABLE[e.kind]) continue;
				if (Math.hypot(e.x - s.x, e.z - s.z) < e.r + 22) {
					boom = true;
					break;
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
				sim.blooms.push({
					x: s.x,
					z: s.z,
					life: .3,
					max: 90,
					color: "#ffd25a"
				});
				hurtPlayer(sim);
			}
		}
	}
}
function ram(sim) {
	const p = sim.player;
	if (safePlayer(sim)) return;
	for (const e of sim.ents) {
		if (!e.alive) continue;
		if (e.kind !== "raider" && e.kind !== "hunter" && e.kind !== "dart" && e.kind !== "saucer" && e.kind !== "asteroid" && e.kind !== "relic") continue;
		if (Math.hypot(e.x - p.x, e.z - p.z) < e.r * .72 + p.r * .55) {
			hurtPlayer(sim);
			if (e.kind === "asteroid") hurtEnt(sim, e, 99);
			break;
		}
	}
}
function clearIfDone(sim) {
	if (sim.phase !== "play") return;
	for (const e of sim.ents) if (e.alive && HOSTILE[e.kind]) return;
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
function step(sim, input, dt) {
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
		p.yaw += input.steer * TURN_RATE * dt + input.spin;
		p.yaw = Math.atan2(Math.sin(p.yaw), Math.cos(p.yaw));
		const want = wantWarp ? 540 : input.impulse ? 172 : 0;
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
		if (p.dockT <= 0) for (const st of sim.ents) {
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
	const { fx, fz } = fwd(p.yaw);
	const locked = acquire(sim);
	p.lockId = locked ? locked.id : -1;
	if (p.dockT <= 0 && input.lance && p.lanceCd <= 0) {
		p.lanceCd = .24;
		if (locked) {
			hurtEnt(sim, locked, 1);
			sim.beams.push({
				x1: p.x,
				z1: p.z,
				x2: locked.x,
				z2: locked.z,
				life: .12,
				color: "#b8ffcf"
			});
			sim.events.push("lance");
		} else {
			sim.beams.push({
				x1: p.x,
				z1: p.z,
				x2: p.x + fx * 210,
				z2: p.z + fz * 210,
				life: .08,
				color: "#6d8f7c"
			});
			sim.events.push("miss");
		}
	} else if (p.dockT <= 0 && input.burst && p.shellCd <= 0) {
		if (p.shells > 0) {
			p.shells -= 1;
			p.shellCd = .48;
			sim.ents.push(mk(sim, "shell", p.x + fx * 40, p.z + fz * 40, {
				vx: fx * 620,
				vz: fz * 620,
				r: 8,
				y: 16,
				life: .95,
				intro: 0,
				spd: 620
			}));
			sim.events.push("launch");
		} else {
			p.shellCd = .18;
			sim.events.push("dry");
		}
	}
	const count = sim.ents.length;
	for (let i = 0; i < count; i++) {
		const ent = sim.ents[i];
		if (!ent.alive) continue;
		if (ent.kind === "raider" || ent.kind === "hunter" || ent.kind === "dart" || ent.kind === "saucer" || ent.kind === "asteroid" || ent.kind === "relic") updateEnemy(sim, ent, dt);
	}
	separate(sim, dt);
	moveProjectiles(sim, dt);
	ram(sim);
	clearIfDone(sim);
	sim.ents = sim.ents.filter((e) => e.alive);
	decayFx(sim, dt);
}
function HalcyonOps() {
	const canvasRef = (0, import_react.useRef)(null);
	const simRef = (0, import_react.useRef)(null);
	const sfxRef = (0, import_react.useRef)(null);
	const [phase, setPhase] = (0, import_react.useState)("title");
	const [score, setScore] = (0, import_react.useState)(0);
	const [best, setBest] = (0, import_react.useState)(0);
	const [banner, setBanner] = (0, import_react.useState)("");
	const [muted, setMuted] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const sim = createSim();
		simRef.current = sim;
		const sfx = new ArcadeAudio();
		sfxRef.current = sfx;
		setBest(sim.best);
		const keys = /* @__PURE__ */ new Set();
		const injected = /* @__PURE__ */ new Set();
		let steerOverride = null;
		const touchRef = canvas.__touch ?? {
			left: false,
			right: false,
			impulse: false,
			warp: false,
			lance: 0,
			burst: 0,
			spin: 0
		};
		canvas.__touch = touchRef;
		let prevLance = false;
		let prevBurst = false;
		let shown = sim.phase;
		let shownBanner = "";
		let raf = 0;
		let last = performance.now();
		let acc = 0;
		const poke = () => sfx.unlock();
		window.addEventListener("pointerdown", poke);
		window.addEventListener("keydown", poke);
		const onDown = (e) => {
			if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
			keys.add(e.code);
			if (e.code === "Escape") {
				if (sim.phase === "play") sim.phase = "pause";
				else if (sim.phase === "pause") sim.phase = "play";
			}
			if (e.code === "Enter" && (sim.phase === "title" || sim.phase === "over")) {
				startGame(sim);
				setPhase("play");
				setScore(0);
			} else if (e.code === "Enter" && sim.phase === "pause") {
				sim.phase = "play";
				setPhase("play");
			}
			if (e.code === "KeyM") {
				sfx.setMuted(!sfx.muted);
				setMuted(sfx.muted);
			}
		};
		const onUp = (e) => keys.delete(e.code);
		const onBlur = () => keys.clear();
		window.addEventListener("keydown", onDown);
		window.addEventListener("keyup", onUp);
		window.addEventListener("blur", onBlur);
		const onVis = () => {
			if (document.visibilityState === "visible" && sfx.ctx?.state === "suspended") sfx.ctx.resume();
		};
		document.addEventListener("visibilitychange", onVis);
		const resize = () => {
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			const rect = canvas.getBoundingClientRect();
			canvas.width = Math.max(1, Math.round(rect.width * dpr));
			canvas.height = Math.max(1, Math.round(rect.height * dpr));
		};
		resize();
		const ro = new ResizeObserver(resize);
		ro.observe(canvas);
		const sample = () => {
			const down = new Set(keys);
			for (const code of injected) down.add(code);
			let steer = (touchRef.left ? 1 : 0) + (touchRef.right ? -1 : 0);
			if (down.has("KeyA") || down.has("ArrowLeft")) steer += 1;
			if (down.has("KeyD") || down.has("ArrowRight")) steer -= 1;
			if (steerOverride !== null) steer = steerOverride;
			steer = Math.max(-1, Math.min(1, steer));
			const lanceNow = down.has("Space") || down.has("KeyJ");
			const burstNow = down.has("KeyF") || down.has("KeyK");
			const lance = lanceNow && !prevLance || touchRef.lance > 0;
			const burst = burstNow && !prevBurst || touchRef.burst > 0;
			prevLance = lanceNow;
			prevBurst = burstNow;
			touchRef.lance = 0;
			touchRef.burst = 0;
			const spin = touchRef.spin;
			touchRef.spin = 0;
			return {
				steer,
				impulse: down.has("KeyW") || down.has("ArrowUp") || touchRef.impulse,
				warp: down.has("ShiftLeft") || down.has("ShiftRight") || down.has("KeyE") || touchRef.warp,
				lance,
				burst,
				spin
			};
		};
		const frame = (now) => {
			const dt = Math.min(.1, (now - last) / 1e3);
			last = now;
			acc += dt;
			const input = sample();
			let first = true;
			let steps = 0;
			while (acc >= 1 / 60 && steps < 5) {
				step(sim, {
					...input,
					lance: first && input.lance,
					burst: first && input.burst,
					spin: first ? input.spin : 0
				}, 1 / 60);
				first = false;
				acc -= 1 / 60;
				steps += 1;
			}
			sfx.setWarp(sim.phase === "play" && sim.player.warping && !sfx.muted);
			if (sim.events.length) {
				const uniq = new Set(sim.events);
				for (const ev of uniq) sfx.play(ev);
				sim.events.length = 0;
			}
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			const rect = canvas.getBoundingClientRect();
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			if (rect.width > 2 && rect.height > 2) draw(ctx, sim, rect.width, rect.height);
			if (sim.phase !== shown || sim.banner !== shownBanner) {
				shown = sim.phase;
				shownBanner = sim.banner;
				setPhase(sim.phase);
				setScore(sim.score);
				setBest(sim.best);
				setBanner(sim.banner);
			}
			window.__controlsTest = {
				getYaw: () => sim.player.yaw,
				getSpeed: () => sim.player.speed,
				setKeys: (codes) => {
					injected.clear();
					for (const code of codes) injected.add(code);
				},
				setSteer: (v) => {
					steerOverride = v;
				}
			};
			raf = requestAnimationFrame(frame);
		};
		raf = requestAnimationFrame(frame);
		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			window.removeEventListener("pointerdown", poke);
			window.removeEventListener("keydown", poke);
			window.removeEventListener("keydown", onDown);
			window.removeEventListener("keyup", onUp);
			window.removeEventListener("blur", onBlur);
			document.removeEventListener("visibilitychange", onVis);
			sfx.setWarp(false);
			delete window.__controlsTest;
		};
	}, []);
	const begin = (button) => {
		button?.blur();
		sfxRef.current?.unlock();
		const sim = simRef.current;
		if (!sim) return;
		if (sim.phase === "pause") {
			sim.phase = "play";
			setPhase("play");
			return;
		}
		startGame(sim);
		setPhase("play");
		setScore(0);
	};
	const playing = phase === "play" || phase === "clear";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "cabinet",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "stage",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
					ref: canvasRef,
					onPointerDown: (e) => {
						if (phase !== "play") return;
						const node = e.currentTarget;
						node.setPointerCapture(e.pointerId);
						const bag = node.__touch;
						if (!bag) return;
						bag.spin = bag.spin;
						node.__drag = {
							x: e.clientX,
							moved: 0
						};
					},
					onPointerMove: (e) => {
						const node = e.currentTarget;
						if (!node.__drag || !node.__touch) return;
						const dx = e.clientX - node.__drag.x;
						node.__drag.x = e.clientX;
						node.__drag.moved += Math.abs(dx);
						node.__touch.spin -= dx * .0055;
					},
					onPointerUp: (e) => {
						const node = e.currentTarget;
						if (node.__drag && node.__drag.moved < 6 && node.__touch && phase === "play") node.__touch.lance += 1;
						node.__drag = void 0;
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "sr-only",
					"aria-live": "polite",
					children: banner
				}),
				phase !== "play" && phase !== "clear" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "veil",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "card",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "wordmark",
								children: "HALCYON OPS"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "subhead",
								children: "Strategic Operations Simulator"
							}),
							phase === "over" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "blurb",
								children: [
									"Hull lost in ",
									banner || "the sector",
									". Score ",
									formatScore(score),
									". One cruiser is all you get — dock sooner, spend the burst, save the warp for the knife-fight."
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "engage",
								onClick: (e) => begin(e.currentTarget),
								children: "Start"
							})] }) : phase === "pause" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "blurb",
								children: "Holding position. The sector does not wait forever."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "engage",
								onClick: (e) => begin(e.currentTarget),
								children: "Resume"
							})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "blurb",
									children: "One cruiser, color-vector sectors. Red blips raid the anchors. Violet hunts you. Cyan saucers pulse. Amber relics lay mines. Dock an anchor once to rearm."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "keys",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "A / D" }), " or drag — heading"] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "W" }), " — impulse, hold"] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Shift" }), " — warp, untouchable while it lasts"] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "Space" }), " or click — lance, one target"] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "F" }), " — burst shell, then it blooms"] })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "blurb",
									children: "Damage order: shields, then shells, then warp."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "engage",
									onClick: (e) => begin(e.currentTarget),
									children: "Start"
								})
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "best",
								children: ["BEST ", formatScore(best)]
							})
						]
					})
				}) : null,
				playing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "icon-btn pause",
					"aria-label": "Pause",
					onClick: () => {
						const sim = simRef.current;
						if (!sim || sim.phase !== "play") return;
						sim.phase = "pause";
						setPhase("pause");
					},
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { size: 18 })
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "icon-btn mute",
					"aria-label": muted ? "Unmute" : "Mute",
					onClick: () => {
						const sfx = sfxRef.current;
						if (!sfx) return;
						sfx.unlock();
						sfx.setMuted(!sfx.muted);
						setMuted(sfx.muted);
					},
					children: muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { size: 18 }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { size: 18 })
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: `touchbar${playing ? " is-live" : ""}`,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hold, {
					label: "LEFT",
					hot: true,
					which: "left",
					canvasRef
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hold, {
					label: "RIGHT",
					which: "right",
					canvasRef
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hold, {
					label: "IMPULSE",
					hot: true,
					which: "impulse",
					canvasRef
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hold, {
					label: "WARP",
					which: "warp",
					canvasRef
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "pad wide hot",
					onPointerDown: (e) => {
						e.preventDefault();
						sfxRef.current?.unlock();
						const bag = bagOf(canvasRef.current);
						if (bag) bag.lance += 1;
					},
					children: "LANCE"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "pad wide accent",
					onPointerDown: (e) => {
						e.preventDefault();
						sfxRef.current?.unlock();
						const bag = bagOf(canvasRef.current);
						if (bag) bag.burst += 1;
					},
					children: "BURST"
				})
			]
		})]
	});
}
function bagOf(canvas) {
	return canvas?.__touch;
}
function Hold({ label, which, canvasRef, hot }) {
	const set = (on) => {
		const bag = bagOf(canvasRef.current);
		if (!bag) return;
		bag[which] = on;
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: hot ? "pad hot" : "pad",
		onPointerDown: (e) => {
			e.preventDefault();
			e.currentTarget.setPointerCapture(e.pointerId);
			set(true);
		},
		onPointerUp: () => set(false),
		onPointerCancel: () => set(false),
		children: label
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HalcyonOps, {});
}
//#endregion
export { Home as component };
