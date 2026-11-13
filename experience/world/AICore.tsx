"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  EdgesGeometry,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  Mesh,
  MeshPhysicalMaterial,
  OctahedronGeometry,
  PlaneGeometry,
  RingGeometry,
  ShaderMaterial,
  SphereGeometry,
} from "three";
import { story } from "../director/store";
import { holoVertex, ringFragment, shellFragment } from "../shaders/hologram";
import { glowFragment, glowVertex } from "../shaders/signal";
import { easeInOutCubic, holoOn, smoothstep } from "./paths";

export const HOLO_CYAN = new Color(0.45, 0.87, 1.0);
export const HOLO_BLUE = new Color(0.22, 0.5, 1.0);
export const HOLO_VIOLET = new Color(0.58, 0.46, 1.0);
export const HOLO_WHITE = new Color(0.86, 0.97, 1.0);

export function additive(fragmentShader: string, uniforms: Record<string, { value: unknown }>, vertexShader = holoVertex) {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    premultipliedAlpha: true,
    side: DoubleSide,
  });
}

type RingSpec = {
  kind: number;
  r: number;
  band: number;
  tilt: [number, number, number];
  /** Turns per second, matching the loader's CSS rotation periods. */
  spin: number;
  late?: boolean;
};

// Kinds 0–2 are the loader's three rings (r = 52 / 78 / 96 in viewBox 240 →
// 1.0 / 1.5 / 1.85 world units). At intro = 0 they face the camera exactly as
// drawn in the SVG, then unfold into the core's orbital frame.
const RINGS: RingSpec[] = [
  { kind: 0, r: 1.0, band: 0.14, tilt: [1.15, 0.22, 0.12], spin: 1 / 26 },
  { kind: 1, r: 1.5, band: 0.08, tilt: [-0.52, 0.92, 0.32], spin: -1 / 52 },
  { kind: 2, r: 1.85, band: 0.1, tilt: [0.34, -0.6, 0.92], spin: 1 / 140 },
  { kind: 3, r: 2.55, band: 0.08, tilt: [1.38, -0.28, -0.4], spin: 1 / 90, late: true },
];

/**
 * The AI core: a faceted energy heart inside a glass shell and two counter-
 * rotating computational lattices, held by holographic orbit rings.
 */
export function AICore() {
  const ringGroups = useRef<(Group | null)[]>([]);
  const diamond = useRef<Mesh>(null);
  const glow = useRef<Mesh>(null);
  const shell = useRef<Mesh>(null);
  const lattice = useRef<Group>(null);
  const root = useRef<Group>(null);

  const m = useMemo(() => {
    const rings = RINGS.map((s) => ({
      geo: new RingGeometry(s.r - s.band, s.r + s.band, 320, 1),
      mat: additive(ringFragment, {
        uTime: { value: 0 },
        uKind: { value: s.kind },
        uRadius: { value: s.r },
        uRot: { value: 0 },
        uIntensity: { value: 1 },
        uColor: { value: HOLO_CYAN.clone() },
      }),
    }));
    const diamondGeo = new OctahedronGeometry(0.5, 0);
    diamondGeo.scale(0.62, 1, 0.62);
    const diamondMat = new MeshPhysicalMaterial({
      color: new Color("#1d2a6e"),
      metalness: 0.55,
      roughness: 0.06,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      iridescence: 1,
      iridescenceIOR: 1.8,
      emissive: new Color("#73DFFF"),
      emissiveIntensity: 3,
      flatShading: true,
    });
    const glowMat = additive(glowFragment, { uColor: { value: HOLO_CYAN.clone() }, uIntensity: { value: 1 } }, glowVertex);
    const shellMat = additive(shellFragment, {
      uTime: { value: 0 },
      uIntensity: { value: 0 },
      uColor: { value: HOLO_CYAN.clone() },
      uAccent: { value: HOLO_VIOLET.clone() },
    });
    const latticeA = new EdgesGeometry(new IcosahedronGeometry(0.58, 1));
    const latticeB = new EdgesGeometry(new OctahedronGeometry(0.76, 0));
    const latticeMatA = new LineBasicMaterial({ color: HOLO_CYAN, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false });
    const latticeMatB = new LineBasicMaterial({ color: HOLO_VIOLET, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false });
    return {
      rings,
      diamondGeo,
      diamondMat,
      glowMat,
      glowGeo: new PlaneGeometry(3.4, 3.4),
      shellGeo: new SphereGeometry(0.9, 48, 32),
      shellMat,
      latticeA,
      latticeB,
      latticeMatA,
      latticeMatB,
    };
  }, []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const calm = story.reducedMotion ? 0.12 : 1;
    const intro = story.intro;
    const s = story.view.scroll;
    const unfold = easeInOutCubic(smoothstep(0.16, 0.9, intro));
    // The hologram ignites only after the name lands (story.build); the heart is lit throughout.
    const reduced = story.reducedMotion;
    const assemble = smoothstep(0.28, 0.7, story.build);
    const shellOn = holoOn(story.build, 0.28, 0.4, t, 11, reduced);
    const latticeOn = holoOn(story.build, 0.36, 0.4, t, 13, reduced);
    const late = smoothstep(0.5, 1.0, intro);
    const recede = 1 - smoothstep(0.12, 0.55, s);
    const breath = 0.5 + 0.5 * Math.sin(t * 1.6);
    const timeline = t * calm;

    RINGS.forEach((spec, i) => {
      const g = ringGroups.current[i];
      if (!g) return;
      const twist = s * (i % 2 === 0 ? 0.8 : -0.6);
      g.rotation.set(
        spec.tilt[0] * unfold + twist * 0.5 + story.view.py * 0.06 * unfold,
        spec.tilt[1] * unfold + twist + story.view.px * 0.08 * unfold,
        spec.tilt[2] * unfold,
      );
      const u = m.rings[i].mat.uniforms;
      u.uTime.value = timeline;
      u.uRot.value = (timeline * spec.spin) % 1;
      // Bright like the loader at the split, then a calmer projected light.
      const base = spec.late ? late * 0.9 : 1.35 * (1 - unfold) + 0.95 * unfold;
      const on = holoOn(story.build, i * 0.09, 0.3, t, i + 1, reduced);
      u.uIntensity.value = base * on * (spec.late ? recede : 0.35 + 0.65 * recede);
      g.visible = on > 0.001 && (!spec.late || late > 0.001);
    });

    if (diamond.current) {
      diamond.current.rotation.y += dt * 0.35 * calm * unfold;
      diamond.current.rotation.x = Math.sin(t * 0.4) * 0.08 * unfold * calm;
    }
    const settle = 0.25 + 0.25 * breath * calm;
    m.diamondMat.emissiveIntensity = 3.2 * (1 - unfold) + settle * unfold + story.pulse * 2.5;

    if (glow.current) {
      glow.current.quaternion.copy(state.camera.quaternion);
      m.glowMat.uniforms.uIntensity.value = 1.25 * (1 - unfold) + (0.55 + 0.18 * breath * calm) * unfold + story.pulse;
    }

    if (shell.current) {
      shell.current.scale.setScalar(0.6 + 0.4 * easeInOutCubic(assemble));
      shell.current.rotation.y = timeline * 0.05;
      m.shellMat.uniforms.uTime.value = timeline;
      m.shellMat.uniforms.uIntensity.value = shellOn * recede * 0.6;
    }
    if (lattice.current) {
      lattice.current.rotation.y = timeline * 0.12 + story.view.px * 0.25;
      lattice.current.rotation.x = story.view.py * -0.2;
      lattice.current.children[1].rotation.y = -timeline * 0.2;
      lattice.current.scale.setScalar(0.4 + 0.6 * easeInOutCubic(assemble));
    }
    m.latticeMatA.opacity = latticeOn * recede * 0.55;
    m.latticeMatB.opacity = latticeOn * recede * 0.32;

    if (root.current) root.current.position.y = Math.sin(t * 0.5) * 0.05 * calm * unfold;
  });

  return (
    <group ref={root}>
      <mesh ref={glow} geometry={m.glowGeo} material={m.glowMat} renderOrder={2} />
      <mesh ref={diamond} geometry={m.diamondGeo} material={m.diamondMat} />
      <group ref={lattice}>
        <lineSegments geometry={m.latticeA} material={m.latticeMatA} />
        <lineSegments geometry={m.latticeB} material={m.latticeMatB} />
      </group>
      <mesh ref={shell} geometry={m.shellGeo} material={m.shellMat} renderOrder={3} />
      {RINGS.map((spec, i) => (
        <group
          key={spec.r}
          ref={(el) => {
            ringGroups.current[i] = el;
          }}
        >
          <mesh geometry={m.rings[i].geo} material={m.rings[i].mat} renderOrder={4} />
        </group>
      ))}
    </group>
  );
}
