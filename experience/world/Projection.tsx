"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { CircleGeometry, CylinderGeometry, PlaneGeometry } from "three";
import { story } from "../director/store";
import { coneFragment, floorFragment, gridFragment, holoVertex } from "../shaders/hologram";
import { additive, HOLO_BLUE, HOLO_CYAN, HOLO_VIOLET } from "./AICore";
import { easeInOutCubic, holoOn, smoothstep } from "./paths";

const FLOOR_Y = -2.45;

/** The emitter the core is projected from, its light cone, and the spatial grid. */
export function Projection() {
  const size = useThree((s) => s.size);
  // Portrait layouts put the name over the emitter: keep it quieter there.
  const portraitDim = 0.55 + 0.45 * smoothstep(0.72, 1.25, size.width / Math.max(1, size.height));
  const r = useMemo(() => {
    const floorMat = additive(floorFragment, {
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uIntensity: { value: 0 },
      uColor: { value: HOLO_CYAN.clone() },
      uAccent: { value: HOLO_VIOLET.clone() },
    });
    const gridMat = additive(gridFragment, { uIntensity: { value: 0 }, uColor: { value: HOLO_BLUE.clone() } }, holoVertex);
    const coneMat = additive(coneFragment, { uIntensity: { value: 0 }, uColor: { value: HOLO_CYAN.clone() } });
    return {
      floorGeo: new CircleGeometry(3.05, 128),
      floorMat,
      gridGeo: new PlaneGeometry(90, 90),
      gridMat,
      coneGeo: new CylinderGeometry(0.42, 1.9, Math.abs(FLOOR_Y) - 0.55, 64, 1, true),
      coneMat,
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime * (story.reducedMotion ? 0.1 : 1);
    const b = story.build;
    const s = story.view.scroll;
    // The emitter ignites first; it projects everything that follows.
    const on = holoOn(b, 0, 0.28, state.clock.elapsedTime, 5, story.reducedMotion);
    const reveal = easeInOutCubic(smoothstep(0.02, 0.45, b));
    const fade = 1 - smoothstep(0.06, 0.45, s);
    r.floorMat.uniforms.uTime.value = t;
    r.floorMat.uniforms.uReveal.value = reveal;
    r.floorMat.uniforms.uIntensity.value = 0.85 * fade * portraitDim * on;
    r.gridMat.uniforms.uIntensity.value = smoothstep(0.15, 0.6, b) * 0.34 * portraitDim * (1 - smoothstep(0.1, 0.6, s));
    r.coneMat.uniforms.uIntensity.value = smoothstep(0.12, 0.4, b) * 0.09 * fade * on;
  });

  const coneY = FLOOR_Y + (Math.abs(FLOOR_Y) - 0.55) / 2;
  return (
    <group>
      <mesh geometry={r.gridGeo} material={r.gridMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y - 0.02, 0]} renderOrder={1} />
      <mesh geometry={r.floorGeo} material={r.floorMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, 0]} renderOrder={2} />
      <mesh geometry={r.coneGeo} material={r.coneMat} position={[0, coneY, 0]} renderOrder={2} />
    </group>
  );
}
