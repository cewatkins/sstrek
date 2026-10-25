import { useEffect, useRef } from "react";
import type { PeerInfo } from "@/lib/multiplayer";
import { useP2PRoom } from "@/lib/multiplayer/use-p2p-room";
import { createSim } from "@/game/sim";
import type { Input, Sim } from "@/game/types";
import {
  applyHeld,
  applySnap,
  createGuestView,
  ingest,
  isSnap,
  packSnap,
  relax,
  type GuestView,
  type HeldInput,
} from "@/game/wing-net";

export interface NetStatus {
  joined: boolean;
  peers: PeerInfo[];
  hostGone: boolean;
  selfId: string;
}

export interface NetLink {
  lead: boolean;
  selfId: string;
  roster: () => { id: string; name: string }[];
  matching: () => boolean;
  applyInputs: (sim: Sim) => void;
  publish: (sim: Sim, events: string[], now: number) => void;
  follow: (sim: Sim, dt: number) => void;
  pushInput: (input: Input, now: number) => void;
}

export function WingLink({
  room,
  name,
  lead,
  netRef,
  simRef,
  onStatus,
}: {
  room: string;
  name: string;
  lead: boolean;
  netRef: { current: NetLink | null };
  simRef: { current: Sim | null };
  onStatus: (status: NetStatus) => void;
}) {
  const p2p = useP2PRoom({ room, name });
  const peersRef = useRef(p2p.peers);
  peersRef.current = p2p.peers;
  const bags = useRef(new Map<string, HeldInput>());
  const view = useRef<GuestView>(createGuestView());
  const latest = useRef<ReturnType<typeof packSnap> | null>(null);
  const evBuf = useRef<string[]>([]);
  const tick = useRef(0);
  const lastPub = useRef(0);
  const lastIn = useRef(0);
  const seq = useRef(0);
  const spinHold = useRef(0);
  const actSeq = useRef(0);
  const hostGone = useRef(false);
  const miss = useRef<number | null>(null);
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;

  useEffect(() => p2p.onMessage((_from, data) => {
    if (lead) {
      ingest(bags.current, _from, data);
      return;
    }
    if (isSnap(data)) latest.current = data;
  }), [p2p.onMessage, lead]);

  useEffect(() => {
    onStatusRef.current({
      joined: p2p.joined,
      peers: p2p.peers,
      hostGone: hostGone.current,
      selfId: p2p.selfId,
    });
  }, [p2p.joined, p2p.peers, p2p.selfId]);

  useEffect(() => {
    if (lead) return;
    const host = latest.current?.host || view.current.host;
    if (!host) return;
    const up = p2p.peers.some((peer) => peer.id === host && peer.connectionState === "connected");
    if (up) {
      miss.current = null;
      hostGone.current = false;
      return;
    }
    if (miss.current == null) miss.current = Date.now();
    const timer = window.setTimeout(() => {
      if (!miss.current || Date.now() - miss.current < 2500) return;
      hostGone.current = true;
      const sim = simRef.current;
      if (sim) {
        const best = sim.best;
        const fresh = createSim();
        fresh.best = best;
        fresh.banner = "LEAD DROPPED";
        Object.assign(sim, fresh);
      }
      onStatusRef.current({
        joined: p2p.joined,
        peers: p2p.peers,
        hostGone: true,
        selfId: p2p.selfId,
      });
    }, 2800);
    return () => window.clearTimeout(timer);
  }, [lead, p2p.peers, p2p.joined, p2p.selfId, simRef]);

  const api: NetLink = {
    lead,
    selfId: p2p.selfId,
    roster: () =>
      peersRef.current
        .filter((peer) => peer.connectionState === "connected")
        .slice(0, 3)
        .map((peer) => ({ id: peer.id, name: peer.name || "WING" })),
    matching: () => {
      const snap = latest.current;
      return !hostGone.current && !!snap && snap.phase !== "title";
    },
    applyInputs: (sim) => applyHeld(sim, bags.current),
    publish: (sim, events, now) => {
      if (!lead || sim.phase === "title") return;
      evBuf.current.push(...events);
      if (now - lastPub.current < 50) return;
      lastPub.current = now;
      tick.current += 1;
      p2p.broadcast(packSnap(sim, p2p.selfId, name, tick.current, evBuf.current.splice(0)));
    },
    follow: (sim, dt) => {
      const snap = latest.current;
      if (!snap || hostGone.current) return;
      if (snap.tick !== view.current.tick) {
        const ev = snap.ev ?? [];
        applySnap(sim, view.current, snap, p2p.selfId);
        if (ev.length) sim.events.push(...ev);
      } else {
        relax(sim, view.current, dt);
      }
    },
    pushInput: (input, now) => {
      spinHold.current += input.spin;
      if (input.lance || input.burst) {
        actSeq.current += 1;
        p2p.send({ op: "act", seq: actSeq.current, lance: input.lance, burst: input.burst });
      }
      if (now - lastIn.current < 50) return;
      lastIn.current = now;
      seq.current += 1;
      p2p.broadcast({
        op: "in",
        seq: seq.current,
        steer: input.steer,
        impulse: input.impulse,
        warp: input.warp,
        spin: spinHold.current,
      });
      spinHold.current = 0;
    },
  };
  netRef.current = api;

  useEffect(() => {
    return () => {
      netRef.current = null;
    };
  }, [netRef]);

  return null;
}
