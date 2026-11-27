"use client";

import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { CameraDirector } from "./CameraDirector";
import { Backdrop, DaylightBlending, Lights, ReadySignal, SceneSetup, SkipHiddenMatrices } from "./Environment";
import { CAMERA_FOV } from "./paths";
import { Atmosphere } from "../chapters/Atmosphere";
import { CuriosityWorld } from "../chapters/CuriosityWorld";
import { HumanWorld } from "../chapters/HumanWorld";
import { NetworkWorld } from "../chapters/NetworkWorld";
import { NexusWorld } from "../chapters/NexusWorld";
import { UniverseWorld } from "../chapters/UniverseWorld";
import { EngineeringWorld } from "../chapters/EngineeringWorld";

export default function WorldCanvas({ lowPower }: { lowPower: boolean }) {
  // Sharp on high-density desktops without rendering above what the screen shows.
  const native = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  // Always full quality (2026-11-27): the device's native resolution up to 2x,
  // never stepped down at runtime. Phones and tablets cap at 1.5x.
  const maxDpr = Math.min(native, lowPower ? 1.5 : 2);
  return (
    <Canvas
      className="world-canvas"
      aria-hidden
      dpr={maxDpr}
      gl={{ antialias: !lowPower, powerPreference: "high-performance", alpha: false }}
      camera={{ fov: CAMERA_FOV, near: 0.1, far: 200, position: [0, 0, 22] }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.outputColorSpace = SRGBColorSpace;
        gl.setClearColor("#080605");
      }}
    >
      <SceneSetup />
      <CameraDirector />
      <Backdrop />
      <Lights />
      <Atmosphere />
      {/* Chapter 00 is typography-led (2026-11-25): the holographic workspace
          (core, rings, callouts, grid, data network) is retired. A sculpture
          may take this slot once one is approved in /lab/sculpture. */}
      <HumanWorld lowPower={lowPower} />
      <CuriosityWorld lowPower={lowPower} />
      <EngineeringWorld />
      <NetworkWorld lowPower={lowPower} />
      <UniverseWorld lowPower={lowPower} />
      <NexusWorld lowPower={lowPower} />
      <DaylightBlending />
      <ReadySignal />
      <SkipHiddenMatrices />
    </Canvas>
  );
}
