/** Short synthesized cabinet voices. Unlocked from a user gesture. */

export class ArcadeAudio {
  ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private warpOsc: OscillatorNode | null = null;
  private warpGain: GainNode | null = null;
  muted = false;

  unlock(): void {
    if (!this.ctx) {
      const ctx = new AudioContext({ latencyHint: "interactive" });
      const master = ctx.createGain();
      master.gain.value = 0.32;
      master.connect(ctx.destination);
      this.ctx = ctx;
      this.master = master;
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (!this.ctx || !this.master) return;
    this.master.gain.setTargetAtTime(muted ? 0 : 0.32, this.ctx.currentTime, 0.02);
    if (muted) this.setWarp(false);
  }

  setWarp(on: boolean): void {
    if (!this.ctx || !this.master || this.muted) {
      if (!on) this.stopWarp();
      return;
    }
    if (on && !this.warpOsc) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = 52;
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(this.master);
      osc.start();
      gain.gain.setTargetAtTime(0.06, this.ctx.currentTime, 0.04);
      this.warpOsc = osc;
      this.warpGain = gain;
    } else if (!on) {
      this.stopWarp();
    }
  }

  private stopWarp(): void {
    if (!this.ctx || !this.warpOsc || !this.warpGain) {
      this.warpOsc = null;
      this.warpGain = null;
      return;
    }
    const osc = this.warpOsc;
    const gain = this.warpGain;
    gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.03);
    osc.stop(this.ctx.currentTime + 0.08);
    this.warpOsc = null;
    this.warpGain = null;
  }

  play(event: string): void {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime;
    switch (event) {
      case "lance":
        this.zap(t, 920, 380, 0.09, 0.12);
        break;
      case "miss":
        this.zap(t, 420, 220, 0.05, 0.06);
        break;
      case "ping":
        this.zap(t, 1400, 900, 0.04, 0.05);
        break;
      case "launch":
        this.zap(t, 180, 90, 0.16, 0.1);
        break;
      case "boom":
        this.noise(t, 0.28, 0.22);
        this.tone(t, 160, 0.32, "sine", 0.16, 50);
        break;
      case "hurt":
        this.tone(t, 110, 0.22, "sawtooth", 0.14, 40);
        this.noise(t, 0.12, 0.1);
        break;
      case "dry":
        this.tone(t, 90, 0.05, "square", 0.04);
        break;
      case "dock":
        this.tone(t, 523, 0.12, "square", 0.07);
        this.tone(t + 0.09, 659, 0.12, "square", 0.07);
        this.tone(t + 0.18, 784, 0.18, "square", 0.08);
        break;
      case "alert":
        this.tone(t, 494, 0.12, "square", 0.07);
        this.tone(t + 0.16, 330, 0.16, "square", 0.07);
        break;
      case "clear":
        [523, 659, 784, 1046].forEach((f, i) => this.tone(t + i * 0.1, f, 0.16, "square", 0.07));
        break;
      case "station":
        this.noise(t, 0.3, 0.16);
        this.tone(t, 90, 0.4, "sawtooth", 0.12, 30);
        break;
      case "die":
        this.noise(t, 0.5, 0.2);
        this.tone(t, 200, 0.55, "sawtooth", 0.12, 40);
        break;
      case "mine":
        this.tone(t, 660, 0.04, "square", 0.04);
        break;
      default:
        break;
    }
  }

  private tone(
    when: number,
    freq: number,
    dur: number,
    type: OscillatorType,
    gain: number,
    slideTo?: number,
  ): void {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), when + dur);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  private zap(when: number, from: number, to: number, dur: number, gain: number): void {
    this.tone(when, from, dur, "square", gain, to);
  }

  private noise(when: number, dur: number, gain: number): void {
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
}
