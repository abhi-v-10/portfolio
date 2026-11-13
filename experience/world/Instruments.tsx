"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  CustomBlending,
  Float32BufferAttribute,
  Mesh,
  OneFactor,
  OneMinusSrcAlphaFactor,
  PlaneGeometry,
  Vector3,
  Vector4,
} from "three";
import { story } from "../director/store";
import { dataLineFragment, dataLineVertex, nodeFragment, nodeVertex, panelFragment } from "../shaders/hologram";
import { additive, HOLO_BLUE, HOLO_CYAN, HOLO_VIOLET, HOLO_WHITE } from "./AICore";
import { CHIP_ASPECT, createChipTexture, type ChipId } from "./panelText";
import { holoOn, smoothstep } from "./paths";

type V3 = [number, number, number];
type PanelSpec = {
  face: ChipId;
  desk: V3;
  mob: V3;
  /** World width on wide layouts; 0 hides the panel there. */
  deskW: number;
  /** World width on portrait layouts; 0 hides the panel there. */
  mobW: number;
  yaw: number;
  pitch: number;
  delay: number;
  seed: number;
  accent: "white" | "violet";
};

// Three hologram callouts, one fact each, floating at the core's edge on the
// side away from the name. Portrait keeps degree and award.
const PANELS: PanelSpec[] = [
  { face: "cgpa", desk: [-1.45, 1.95, 0.8], mob: [-0.7, 1.75, 0.4], deskW: 2.15, mobW: 2.35, yaw: 0.1, pitch: 0.04, delay: 0.0, seed: 1.3, accent: "white" },
  { face: "award", desk: [1.85, 0.95, 0.3], mob: [0.75, -1.7, 0.4], deskW: 2.25, mobW: 2.35, yaw: -0.12, pitch: 0, delay: 0.08, seed: 4.1, accent: "white" },
  { face: "stack", desk: [1.15, -2.15, 0.8], mob: [0, 0, 0], deskW: 2.35, mobW: 0, yaw: -0.05, pitch: -0.05, delay: 0.16, seed: 2.7, accent: "violet" },
];

export function Instruments() {
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const layout = smoothstep(0.72, 1.25, size.width / Math.max(1, size.height));
  const compact = layout < 0.5;
  const specs = useMemo(() => PANELS.filter((p) => (compact ? p.mobW : p.deskW) > 0), [compact]);
  const panels = useRef<(Mesh | null)[]>([]);

  const r = useMemo(() => {
    const geo = new PlaneGeometry(1, 1);
    const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
    const textures = specs.map((s) => createChipTexture(s.face, aniso));
    const mats = specs.map((s, i) => {
      const m = additive(panelFragment, {
        uTime: { value: 0 },
        uAssemble: { value: 0 },
        uKind: { value: i },
        uAspect: { value: CHIP_ASPECT },
        uSeed: { value: s.seed },
        uOpacity: { value: 1 },
        uGlass: { value: 0.62 },
        uMotion: { value: new Vector4(0, 0, 0, 3) },
        uText: { value: textures[i] },
        uColor: { value: HOLO_CYAN.clone() },
        uAccent: { value: (s.accent === "violet" ? HOLO_VIOLET : HOLO_WHITE).clone() },
      });
      // Premultiplied "glass": light adds, alpha dims what sits behind the pane.
      m.blending = CustomBlending;
      m.blendSrc = OneFactor;
      m.blendDst = OneMinusSrcAlphaFactor;
      return m;
    });

    // Leader lines: core → elbow → panel edge, two segments per panel.
    const n = specs.length;
    const leaderGeo = new BufferGeometry();
    leaderGeo.setAttribute("position", new BufferAttribute(new Float32Array(n * 4 * 3), 3));
    const aT: number[] = [];
    const aDelay: number[] = [];
    const aPhase: number[] = [];
    specs.forEach((s, i) => {
      aT.push(0, 0.55, 0.55, 1);
      for (let k = 0; k < 4; k++) {
        aDelay.push(0.36 + s.delay);
        aPhase.push(i * 0.37);
      }
    });
    leaderGeo.setAttribute("aT", new Float32BufferAttribute(aT, 1));
    leaderGeo.setAttribute("aDelay", new Float32BufferAttribute(aDelay, 1));
    leaderGeo.setAttribute("aPhase", new Float32BufferAttribute(aPhase, 1));
    const leaderMat = additive(
      dataLineFragment,
      {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uIntensity: { value: 0.6 },
        uPulse: { value: 1 },
        uColor: { value: HOLO_BLUE.clone() },
        uAccent: { value: HOLO_CYAN.clone() },
      },
      dataLineVertex,
    );

    const anchorGeo = new BufferGeometry();
    anchorGeo.setAttribute("position", new BufferAttribute(new Float32Array(n * 3), 3));
    anchorGeo.setAttribute("aDelay", new Float32BufferAttribute(specs.map((s) => 0.5 + s.delay), 1));
    anchorGeo.setAttribute("aSize", new Float32BufferAttribute(specs.map(() => 14), 1));
    const anchorMat = additive(
      nodeFragment,
      {
        uReveal: { value: 0 },
        uIntensity: { value: 1 },
        uTime: { value: 0 },
        uScale: { value: 1 },
        uColor: { value: HOLO_CYAN.clone() },
      },
      nodeVertex,
    );
    return { geo, textures, mats, leaderGeo, leaderMat, anchorGeo, anchorMat };
  }, [specs, gl]);

  useEffect(
    () => () => {
      r.textures.forEach((t) => t.dispose());
      r.mats.forEach((m) => m.dispose());
    },
    [r],
  );

  const tmp = useMemo(
    () => ({ eye: new Vector3(), pos: new Vector3(), core: new Vector3(), local: new Vector3(), anchor: new Vector3(), elbow: new Vector3(), from: new Vector3(), drift: new Vector3() }),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime * (story.reducedMotion ? 0.15 : 1);
    const s = story.view.scroll;
    const px = story.view.px;
    const py = story.view.py;
    tmp.eye.copy(state.camera.position);
    const leaderPos = r.leaderGeo.attributes.position as BufferAttribute;
    const anchorPos = r.anchorGeo.attributes.position as BufferAttribute;
    r.anchorMat.uniforms.uScale.value = state.viewport.dpr * size.height * 0.012;
    const coreR = 0.95 * story.view.coreScale;

    specs.forEach((spec, i) => {
      const mesh = panels.current[i];
      if (!mesh) return;
      const width = compact ? spec.mobW : spec.deskW;

      // Position: layout blend + depth-weighted pointer parallax + scroll dispersal.
      tmp.pos.set(...spec.mob).lerp(tmp.from.set(...spec.desk), layout);
      const depth = 1 + (tmp.pos.z + 3) * 0.1;
      tmp.pos.x += px * 0.1 * depth;
      tmp.pos.y += py * 0.07 * depth;
      const disperse = smoothstep(0.03 + i * 0.025, 0.4 + i * 0.025, s);
      tmp.drift.copy(tmp.pos).normalize().multiplyScalar(disperse * 2.2);
      tmp.pos.add(tmp.drift);
      mesh.position.copy(tmp.pos);
      mesh.scale.set(width, width / CHIP_ASPECT, 1);
      mesh.lookAt(tmp.eye);
      mesh.rotateY(spec.yaw + px * 0.05);
      mesh.rotateX(spec.pitch - py * 0.04);

      // Callouts project last, after the rings and network have ignited.
      const assemble = smoothstep(0.58 + spec.delay, 0.86 + spec.delay, story.build);
      const leave = smoothstep(0.02 + i * 0.015, 0.16 + i * 0.015, s);
      const u = r.mats[i].uniforms;
      u.uTime.value = t;
      u.uAssemble.value = assemble * (1 - leave);
      u.uOpacity.value = 0.95 * (0.3 + 0.7 * holoOn(story.build, 0.58 + spec.delay, 0.3, t, i + 31, story.reducedMotion));

      // Leader: from the core shell toward the panel edge facing it.
      tmp.core.copy(tmp.pos).normalize().multiplyScalar(coreR);
      mesh.updateMatrixWorld();
      tmp.local.copy(tmp.core);
      mesh.worldToLocal(tmp.local);
      if (Math.abs(tmp.local.x) * CHIP_ASPECT > Math.abs(tmp.local.y)) tmp.anchor.set(Math.sign(tmp.local.x) * 0.5, 0, 0);
      else tmp.anchor.set(0, Math.sign(tmp.local.y) * 0.5, 0);
      mesh.localToWorld(tmp.anchor);
      tmp.elbow.set((tmp.anchor.x + tmp.core.x) * 0.5, tmp.anchor.y, (tmp.anchor.z + tmp.core.z) * 0.5);
      const b = i * 4;
      leaderPos.setXYZ(b, tmp.core.x, tmp.core.y, tmp.core.z);
      leaderPos.setXYZ(b + 1, tmp.elbow.x, tmp.elbow.y, tmp.elbow.z);
      leaderPos.setXYZ(b + 2, tmp.elbow.x, tmp.elbow.y, tmp.elbow.z);
      leaderPos.setXYZ(b + 3, tmp.anchor.x, tmp.anchor.y, tmp.anchor.z);
      anchorPos.setXYZ(i, tmp.anchor.x, tmp.anchor.y, tmp.anchor.z);
    });
    leaderPos.needsUpdate = true;
    anchorPos.needsUpdate = true;
    r.leaderGeo.computeBoundingSphere();

    const fade = 1 - smoothstep(0.02, 0.26, s);
    r.leaderMat.uniforms.uTime.value = t;
    r.leaderMat.uniforms.uReveal.value = smoothstep(0.3, 1, story.build);
    r.leaderMat.uniforms.uIntensity.value = 0.6 * fade;
    r.anchorMat.uniforms.uTime.value = t;
    r.anchorMat.uniforms.uReveal.value = smoothstep(0.3, 1, story.build);
    r.anchorMat.uniforms.uIntensity.value = 0.85 * fade;
  });

  return (
    <group>
      <lineSegments geometry={r.leaderGeo} material={r.leaderMat} renderOrder={5} frustumCulled={false} />
      <points geometry={r.anchorGeo} material={r.anchorMat} renderOrder={6} frustumCulled={false} />
      {specs.map((spec, i) => (
        <mesh
          key={spec.face}
          ref={(el) => {
            panels.current[i] = el;
          }}
          geometry={r.geo}
          material={r.mats[i]}
          renderOrder={7}
          frustumCulled={false}
        />
      ))}
    </group>
  );
}
