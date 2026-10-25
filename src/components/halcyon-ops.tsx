import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { Pause, Volume2, VolumeX } from "lucide-react";
import { ArcadeAudio } from "@/game/audio";
import { draw } from "@/game/draw";
import { createSim, startGame, step, syncWings } from "@/game/sim";
import { formatScore, type Input, type Sim } from "@/game/types";
import { WingLink, type NetLink, type NetStatus } from "@/components/wing-link";

type Phase = Sim["phase"];

interface TouchState {
  left: boolean;
  right: boolean;
  impulse: boolean;
  warp: boolean;
  lance: number;
  burst: number;
  spin: number;
}

export function HalcyonOps() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<Sim | null>(null);
  const sfxRef = useRef<ArcadeAudio | null>(null);
  const [phase, setPhase] = useState<Phase>("title");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [banner, setBanner] = useState("");
  const [muted, setMuted] = useState(false);
  const [call, setCall] = useState("OPS");
  const [code, setCode] = useState("");
  const [link, setLink] = useState<{ room: string; name: string; lead: boolean; code: string } | null>(null);
  const [netUi, setNetUi] = useState<NetStatus>({ joined: false, peers: [], hostGone: false, selfId: "" });
  const netRef = useRef<NetLink | null>(null);
  const onStatus = useCallback((status: NetStatus) => {
    setNetUi(status);
    if (status.hostGone) setBanner("LEAD DROPPED");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sim = createSim();
    simRef.current = sim;
    const sfx = new ArcadeAudio();
    sfxRef.current = sfx;
    setBest(sim.best);

    const keys = new Set<string>();
    const injected = new Set<string>();
    let steerOverride: number | null = null;
    const touch: TouchState = {
      left: false,
      right: false,
      impulse: false,
      warp: false,
      lance: 0,
      burst: 0,
      spin: 0,
    };
    const touchRef = (canvas as HTMLCanvasElement & { __touch?: TouchState }).__touch ?? touch;
    (canvas as HTMLCanvasElement & { __touch?: TouchState }).__touch = touchRef;

    let prevLance = false;
    let prevBurst = false;
    let shown: Phase = sim.phase;
    let shownBanner = "";
    let raf = 0;
    let last = performance.now();
    let acc = 0;

    const poke = () => sfx.unlock();
    window.addEventListener("pointerdown", poke);
    window.addEventListener("keydown", poke);

    const onDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
      keys.add(e.code);
      if (e.code === "Escape") {
        if (netRef.current) return;
        if (sim.phase === "play") sim.phase = "pause";
        else if (sim.phase === "pause") sim.phase = "play";
      }
      if (e.code === "Enter" && (sim.phase === "title" || sim.phase === "over")) {
        const net = netRef.current;
        if (net && !net.lead) return;
        if (net?.lead) {
          syncWings(sim, net.roster());
          sim.coop = true;
        }
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
    const onUp = (e: KeyboardEvent) => keys.delete(e.code);
    const onBlur = () => keys.clear();
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    const onVis = () => {
      if (document.visibilityState === "visible" && sfx.ctx?.state === "suspended") {
        void sfx.ctx.resume();
      }
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

    const sample = (): Input => {
      const down = new Set(keys);
      for (const code of injected) down.add(code);
      let steer = (touchRef.left ? 1 : 0) + (touchRef.right ? -1 : 0);
      if (down.has("KeyA") || down.has("ArrowLeft")) steer += 1;
      if (down.has("KeyD") || down.has("ArrowRight")) steer -= 1;
      if (steerOverride !== null) steer = steerOverride;
      steer = Math.max(-1, Math.min(1, steer));
      const lanceNow = down.has("Space") || down.has("KeyJ");
      const burstNow = down.has("KeyF") || down.has("KeyK");
      const lance = (lanceNow && !prevLance) || touchRef.lance > 0;
      const burst = (burstNow && !prevBurst) || touchRef.burst > 0;
      prevLance = lanceNow;
      prevBurst = burstNow;
      touchRef.lance = 0;
      touchRef.burst = 0;
      const spin = touchRef.spin;
      touchRef.spin = 0;
      return {
        steer,
        impulse: down.has("KeyW") || down.has("ArrowUp") || touchRef.impulse,
        warp:
          down.has("ShiftLeft") ||
          down.has("ShiftRight") ||
          down.has("KeyE") ||
          touchRef.warp,
        lance,
        burst,
        spin,
      };
    };

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const net = netRef.current;
      if (net && !net.lead && net.matching()) {
        const input = sample();
        net.follow(sim, dt);
        net.pushInput(input, now);
      } else {
        acc += dt;
        if (net?.lead && sim.phase !== "title") {
          syncWings(sim, net.roster());
          net.applyInputs(sim);
        }
        const input = sample();
        let first = true;
        let steps = 0;
        while (acc >= 1 / 60 && steps < 5) {
          step(sim, {
            ...input,
            lance: first && input.lance,
            burst: first && input.burst,
            spin: first ? input.spin : 0,
          }, 1 / 60);
          first = false;
          acc -= 1 / 60;
          steps += 1;
        }
        if (net?.lead) net.publish(sim, sim.events.slice(), now);
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
        setKeys: (codes: string[]) => {
          injected.clear();
          for (const code of codes) injected.add(code);
        },
        setSteer: (v: number) => {
          steerOverride = v;
        },
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

  useEffect(() => {
    try {
      const saved = localStorage.getItem("halcyon-ops-call");
      if (saved) setCall(saved.slice(0, 12));
    } catch {
      /* private mode */
    }
    setCode(makeCode());
  }, []);

  const begin = (button?: HTMLButtonElement) => {
    button?.blur();
    sfxRef.current?.unlock();
    const sim = simRef.current;
    if (!sim) return;
    if (sim.phase === "pause") {
      if (netRef.current) return;
      sim.phase = "play";
      setPhase("play");
      return;
    }
    const net = netRef.current;
    if (net && !net.lead) return;
    if (net?.lead) {
      syncWings(sim, net.roster());
      sim.coop = true;
    }
    startGame(sim);
    setPhase("play");
    setScore(0);
  };

  const playing = phase === "play" || phase === "clear";
  const waiting = !!(link && !link.lead);

  const openWing = (lead: boolean) => {
    const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4);
    if (clean.length < 4) return;
    const name = (call.trim() || "OPS").toUpperCase().replace(/[^A-Z0-9 _-]/g, "").slice(0, 12) || "OPS";
    try {
      localStorage.setItem("halcyon-ops-call", name);
    } catch {
      /* private mode */
    }
    setLink({ room: `w${clean}`, name, lead, code: clean });
  };

  const leaveWing = () => {
    const wasLead = link?.lead;
    setLink(null);
    const sim = simRef.current;
    if (!sim) return;
    if (wasLead) {
      sim.coop = false;
      sim.wings = [];
    } else {
      const bestScore = sim.best;
      const fresh = createSim();
      fresh.best = bestScore;
      Object.assign(sim, fresh);
      setPhase("title");
      setScore(0);
    }
  };

  return (
    <main className="cabinet">
      {link ? (
        <WingLink
          key={`${link.room}:${link.lead}:${link.name}`}
          room={link.room}
          name={link.name}
          lead={link.lead}
          netRef={netRef}
          simRef={simRef}
          onStatus={onStatus}
        />
      ) : null}
      <div className="stage">
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => {
            if (phase !== "play") return;
            const node = e.currentTarget;
            node.setPointerCapture(e.pointerId);
            const bag = (node as HTMLCanvasElement & { __touch?: TouchState }).__touch;
            if (!bag) return;
            bag.spin = bag.spin;
            (node as HTMLCanvasElement & { __drag?: { x: number; moved: number } }).__drag = {
              x: e.clientX,
              moved: 0,
            };
          }}
          onPointerMove={(e) => {
            const node = e.currentTarget as HTMLCanvasElement & {
              __touch?: TouchState;
              __drag?: { x: number; moved: number };
            };
            if (!node.__drag || !node.__touch) return;
            const dx = e.clientX - node.__drag.x;
            node.__drag.x = e.clientX;
            node.__drag.moved += Math.abs(dx);
            node.__touch.spin -= dx * 0.0055;
          }}
          onPointerUp={(e) => {
            const node = e.currentTarget as HTMLCanvasElement & {
              __touch?: TouchState;
              __drag?: { x: number; moved: number };
            };
            if (node.__drag && node.__drag.moved < 6 && node.__touch && phase === "play") {
              node.__touch.lance += 1;
            }
            node.__drag = undefined;
          }}
        />
        {playing && link ? (
          <p className="wing-pill">
            {link.lead ? "LEAD" : "WING"} {link.code} · {1 + netUi.peers.filter((peer) => peer.connectionState === "connected").length}
          </p>
        ) : null}
        <p className="sr-only" aria-live="polite">
          {banner}
        </p>
        {phase !== "play" && phase !== "clear" ? (
          <div className="veil">
            <section className="card">
              <h1 className="wordmark">HALCYON OPS</h1>
              <p className="subhead">Strategic Operations Simulator</p>
              {phase === "over" ? (
                <>
                  <p className="blurb">
                    Hull lost in {banner || "the sector"}. Score {formatScore(score)}.
                    {link && !link.lead
                      ? " The lead can launch the wing again."
                      : " Dock sooner, spend the burst, save the warp for the knife-fight."}
                  </p>
                  {link && !link.lead ? null : (
                    <button type="button" className="engage" onClick={(e) => begin(e.currentTarget)}>
                      {link?.lead ? "Launch wing" : "Start"}
                    </button>
                  )}
                </>
              ) : phase === "pause" ? (
                <>
                  <p className="blurb">Holding position. The sector does not wait forever.</p>
                  <button type="button" className="engage" onClick={(e) => begin(e.currentTarget)}>
                    Resume
                  </button>
                </>
              ) : (
                <>
                  <p className="blurb">
                    {netUi.hostGone
                      ? "The wing lead dropped. Open the channel again, or fly the sector alone."
                      : "Share a wing code with one to three other cruisers, or start alone. The host launches. Everyone flies the same sector."}
                  </p>
                  <p className="keysline">A/D turn · W impulse · Shift warp · Space lance · F burst</p>
                  <p className="blurb">Shields, then shells, then warp. The wing shares one score.</p>
                  {waiting ? (
                    <p className="blurb">Channel {link?.code} is open. The lead launches. You fly as soon as the sector starts.</p>
                  ) : (
                    <button type="button" className="engage" onClick={(e) => begin(e.currentTarget)}>
                      {link?.lead ? "Launch wing" : "Start"}
                    </button>
                  )}
                  <div className="wing">
                    <label>
                      Callsign
                      <input
                        value={call}
                        maxLength={12}
                        autoCapitalize="characters"
                        disabled={!!link}
                        onChange={(e) => setCall(e.target.value.toUpperCase())}
                      />
                    </label>
                    <label>
                      Wing code
                      <input
                        value={code}
                        maxLength={4}
                        autoCapitalize="characters"
                        spellCheck={false}
                        disabled={!!link}
                        onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4))}
                      />
                    </label>
                    {link ? (
                      <>
                        <p className="best">
                          {netUi.joined ? "CHANNEL OPEN" : "LINKING"} · {link.code}
                          {link.lead ? " · YOU LEAD" : " · JOINED"}
                        </p>
                        <ul className="roster">
                          <li className="ok">You · {link.name}</li>
                          {netUi.peers.map((peer) => (
                            <li key={peer.id} className={peer.connectionState === "connected" ? "ok" : peer.connectionState === "failed" ? "bad" : ""}>
                              {(peer.name || "WING").slice(0, 12)} · {peer.connectionState}
                              {typeof peer.rttMs === "number" ? ` · ${peer.rttMs}ms` : ""}
                            </li>
                          ))}
                        </ul>
                        <button type="button" className="leave" onClick={leaveWing}>
                          Leave channel
                        </button>
                      </>
                    ) : (
                      <div className="wing-actions">
                        <button type="button" className="engage ghost" disabled={code.length < 4} onClick={() => openWing(true)}>
                          Host
                        </button>
                        <button type="button" className="engage ghost" disabled={code.length < 4} onClick={() => openWing(false)}>
                          Join
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
              <p className="best">BEST {formatScore(best)}</p>
            </section>
          </div>
        ) : null}
        {playing && !link ? (
          <button
            type="button"
            className="icon-btn pause"
            aria-label="Pause"
            onClick={() => {
              const sim = simRef.current;
              if (!sim || sim.phase !== "play") return;
              sim.phase = "pause";
              setPhase("pause");
            }}
          >
            <Pause size={18} />
          </button>
        ) : null}
        <button
          type="button"
          className="icon-btn mute"
          aria-label={muted ? "Unmute" : "Mute"}
          onClick={() => {
            const sfx = sfxRef.current;
            if (!sfx) return;
            sfx.unlock();
            sfx.setMuted(!sfx.muted);
            setMuted(sfx.muted);
          }}
        >
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>
      <div className={`touchbar${playing ? " is-live" : ""}`}>
        <Hold label="LEFT" hot which="left" canvasRef={canvasRef} />
        <Hold label="RIGHT" which="right" canvasRef={canvasRef} />
        <Hold label="IMPULSE" hot which="impulse" canvasRef={canvasRef} />
        <Hold label="WARP" which="warp" canvasRef={canvasRef} />
        <button
          type="button"
          className="pad wide hot"
          onPointerDown={(e) => {
            e.preventDefault();
            sfxRef.current?.unlock();
            const bag = bagOf(canvasRef.current);
            if (bag) bag.lance += 1;
          }}
        >
          LANCE
        </button>
        <button
          type="button"
          className="pad wide accent"
          onPointerDown={(e) => {
            e.preventDefault();
            sfxRef.current?.unlock();
            const bag = bagOf(canvasRef.current);
            if (bag) bag.burst += 1;
          }}
        >
          BURST
        </button>
      </div>
    </main>
  );
}

function makeCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
}

function bagOf(canvas: HTMLCanvasElement | null): TouchState | undefined {
  return (canvas as (HTMLCanvasElement & { __touch?: TouchState }) | null)?.__touch;
}

function Hold({
  label,
  which,
  canvasRef,
  hot,
}: {
  label: string;
  which: "left" | "right" | "impulse" | "warp";
  canvasRef: RefObject<HTMLCanvasElement | null>;
  hot?: boolean;
}) {
  const set = (on: boolean) => {
    const bag = bagOf(canvasRef.current);
    if (!bag) return;
    bag[which] = on;
  };
  return (
    <button
      type="button"
      className={hot ? "pad hot" : "pad"}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        set(true);
      }}
      onPointerUp={() => set(false)}
      onPointerCancel={() => set(false)}
    >
      {label}
    </button>
  );
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      setKeys?: (codes: string[]) => void;
      setSteer?: (v: number) => void;
    };
  }
}
