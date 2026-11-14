"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import type { Group } from "three";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { story } from "../director/store";
import { CameraDirector } from "./CameraDirector";
import { AICore } from "./AICore";
import { DataNetwork } from "./DataNetwork";
import { Backdrop, Lights, ReadySignal, SceneSetup } from "./Environment";
import { Instruments } from "./Instruments";
import { Projection } from "./Projection";
import { CAMERA_FOV } from "./paths";
import { Signal } from "./Signal";
import { Atmosphere, ChapterGate } from "../chapters/Atmosphere";
import { CuriosityWorld } from "../chapters/CuriosityWorld";
import { HumanWorld } from "../chapters/HumanWorld";
import { NetworkWorld } from "../chapters/NetworkWorld";
import { NexusWorld } from "../chapters/NexusWorld";
import { UniverseWorld } from "../chapters/UniverseWorld";
import { EngineeringWorld } from "../chapters/EngineeringWorld";
import { WINDOW } from "../chapters/layout";

/**
 * QualityController (tiers, 2026-11-14): starts at the device's native
 * resolution up to 2x on capable desktops, then measures real frame times in
 * rolling windows once the entrance has settled. If a window cannot hold
 * ~45 fps it steps down one tier (2 → 1.5 → 1.25 → 1); it never steps back
 * up, so the image does not pump. No user-agent sniffing.
 */
const TIERS = [2, 1.5, 1.25, 1];
function QualityController() {
  const setDpr = useThree((s) => s.setDpr);
  const dpr = useThree((s) => s.viewport.dpr);
  const st = useRef({ n: 0, total: 0, settled: 0 });
  useFrame((_, dt) => {
    const w = st.current;
    if (story.intro < 1 || w.settled >= 3) return;
    w.n += 1;
    if (w.n < 20) return; // skip warm-up frames after each change
    w.total += Math.min(dt, 0.1);
    if (w.n < 140) return;
    const avg = w.total / (w.n - 20);
    w.n = 0;
    w.total = 0;
    if (avg > 1 / 45 && dpr > 1) {
      const next = TIERS.find((t) => t < dpr - 0.01) ?? 1;
      setDpr(next);
      if (next <= 1.25) story.quality = 0;
    } else {
      w.settled += 1; // three good windows in a row: stop measuring
    }
  });
  return null;
}

/** Scales the core assembly (core, network, emitter) by the camera director's framing. */
function CoreRig({ children }: { children: ReactNode }) {
  const g = useRef<Group>(null);
  useFrame(() => g.current?.scale.setScalar(story.view.coreScale));
  return <group ref={g}>{children}</group>;
}

export default function WorldCanvas({ lowPower }: { lowPower: boolean }) {
  // Sharp on high-density desktops without rendering above what the screen shows.
  const native = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const maxDpr = Math.min(native, lowPower ? 1.5 : 2);
  return (
    <Canvas
      className="world-canvas"
      aria-hidden
      dpr={[1, maxDpr]}
      gl={{ antialias: !lowPower, powerPreference: "high-performance", alpha: false }}
      camera={{ fov: CAMERA_FOV, near: 0.1, far: 200, position: [0, 0, 22] }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.outputColorSpace = SRGBColorSpace;
        gl.setClearColor("#03070E");
      }}
    >
      <SceneSetup />
      <CameraDirector />
      <Backdrop />
      <Lights />
      <Atmosphere />
      {/* Chapter 00: the workspace. Hidden (not unmounted) once the story has left it. */}
      <ChapterGate from={WINDOW.origin[0]} to={WINDOW.origin[1]}>
        <CoreRig>
          <Projection />
          <DataNetwork lowPower={lowPower} />
          <AICore />
        </CoreRig>
        <Instruments />
      </ChapterGate>
      <HumanWorld lowPower={lowPower} />
      <CuriosityWorld lowPower={lowPower} />
      <EngineeringWorld />
      <NetworkWorld lowPower={lowPower} />
      <UniverseWorld lowPower={lowPower} />
      <NexusWorld lowPower={lowPower} />
      <Signal segments={lowPower ? 360 : 640} />
      <QualityController />
      <ReadySignal />
    </Canvas>
  );
}
