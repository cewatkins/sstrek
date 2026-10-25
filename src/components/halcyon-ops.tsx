import { useEffect, useRef, useState, type RefObject } from "react";
import { Pause, Volume2, VolumeX } from "lucide-react";
import { ArcadeAudio } from "@/game/audio";
import { draw } from "@/game/draw";
import { createSim, startGame, step } from "@/game/sim";
import { formatScore, type Input, type Sim } from "@/game/types";

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
      acc += dt;
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

  const begin = (button?: HTMLButtonElement) => {
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

  return (
    <main className="cabinet">
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
                    Hull lost in {banner || "the sector"}. Score {formatScore(score)}. One cruiser is all
                    you get — dock sooner, spend the burst, save the warp for the knife-fight.
                  </p>
                  <button type="button" className="engage" onClick={(e) => begin(e.currentTarget)}>
                    Start
                  </button>
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
                    One cruiser, color-vector sectors. Red blips raid the anchors. Violet hunts you.
                    Cyan saucers pulse. Amber relics lay mines. Dock an anchor once to rearm.
                  </p>
                  <div className="keys">
                    <div>
                      <b>A / D</b> or drag — heading
                    </div>
                    <div>
                      <b>W</b> — impulse, hold
                    </div>
                    <div>
                      <b>Shift</b> — warp, untouchable while it lasts
                    </div>
                    <div>
                      <b>Space</b> or click — lance, one target
                    </div>
                    <div>
                      <b>F</b> — burst shell, then it blooms
                    </div>
                  </div>
                  <p className="blurb">Damage order: shields, then shells, then warp.</p>
                  <button type="button" className="engage" onClick={(e) => begin(e.currentTarget)}>
                    Start
                  </button>
                </>
              )}
              <p className="best">BEST {formatScore(best)}</p>
            </section>
          </div>
        ) : null}
        {playing ? (
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
