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
import { EngineeringWorld } from "../chapters/EngineeringWorld";
import { WINDOW } from "../chapters/layout";

/**
 * QualityController: starts from a device-sensible DPR cap, then measures real
 * frame times once the entrance has settled and steps resolution down once if
 * the device cannot hold frame pacing. No user-agent sniffing.
 */
function QualityController() {
  const setDpr = useThree((s) => s.setDpr);
  const dpr = useThree((s) => s.viewport.dpr);
  const samples = useRef({ n: 0, total: 0, done: false });
  useFrame((_, dt) => {
    const st = samples.current;
    if (st.done || story.intro < 1) return;
    st.n += 1;
    if (st.n < 20) return; // skip warm-up frames
    st.total += dt;
    if (st.n >= 140) {
      st.done = true;
      const avg = st.total / (st.n - 20);
      if (avg > 1 / 42 && dpr > 1) {
        setDpr(Math.max(1, dpr - 0.5));
        story.quality = 0;
      }
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
  const maxDpr = lowPower ? 1.5 : 1.75;
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
      <Signal segments={lowPower ? 360 : 640} />
      <QualityController />
      <ReadySignal />
    </Canvas>
  );
}
