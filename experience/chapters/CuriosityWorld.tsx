"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DodecahedronGeometry,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  TorusGeometry,
  TorusKnotGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import { story } from "../director/store";
import { terrainFragment, terrainVertex } from "../shaders/chapters";
import { dataLineFragment, dataLineVertex } from "../shaders/hologram";
import { glowFragment, glowVertex, signalFragment, signalVertex } from "../shaders/signal";
import { additive } from "../world/AICore";
import { smoothstep } from "../world/paths";
import { branchCurves, BRANCHES, CURIOSITY_CENTRE, CURIOSITY_FLOOR, DISCOVERIES, mulberry32, SPLIT, TRACK_SHIFT, WINDOW } from "./layout";

const MIST = new Color(0.8, 0.78, 0.98);
const VIOLET = new Color(0.56, 0.44, 1.0);
const COBALT = new Color(0.36, 0.56, 1.0);

/** Edge lines with per-segment reveal delays: the form is sketched, not switched on. */
function sketchGeometry(source: BufferGeometry, seed: number) {
  const edges = new EdgesGeometry(source, 1);
  const n = edges.attributes.position.count;
  const rand = mulberry32(seed);
  const aT: number[] = [];
  const aDelay: number[] = [];
  const aPhase: number[] = [];
  for (let i = 0; i < n; i += 2) {
    const d = rand() * 0.75;
    const ph = rand();
    aT.push(0, 1);
    aDelay.push(d, d);
    aPhase.push(ph, ph);
  }
  edges.setAttribute("aT", new Float32BufferAttribute(aT, 1));
  edges.setAttribute("aDelay", new Float32BufferAttribute(aDelay, 1));
  edges.setAttribute("aPhase", new Float32BufferAttribute(aPhase, 1));
  return edges;
}

/**
 * Chapter 01 — Curiosity. The living signal arrives over an open contour
 * landscape and splits into exploratory branches. Some end in discoveries,
 * objects half-sketched out of possibility; others simply fade. Violet,
 * cobalt and pale mist; additive light only, so it reads as atmosphere.
 */
export function CuriosityWorld({ lowPower }: { lowPower: boolean }) {
  const root = useRef<Group>(null);
  const forms = useRef<(Group | null)[]>([]);

  const r = useMemo(() => {
    const seg = lowPower ? 90 : 150;
    const terrainGeo = new PlaneGeometry(70, 70, seg, seg);
    terrainGeo.rotateX(-Math.PI / 2);
    const terrainMat = new ShaderMaterial({
      vertexShader: terrainVertex,
      fragmentShader: terrainFragment,
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uIntensity: { value: 0 },
        uOrigin: { value: new Vector2(SPLIT.x, SPLIT.z - 4) },
        uLow: { value: COBALT.clone().multiplyScalar(0.55) },
        uHigh: { value: MIST.clone().multiplyScalar(0.75) },
        uPing: { value: VIOLET.clone() },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    const branches = branchCurves.map((curve, i) => {
      const dead = BRANCHES[i].discovery === null;
      const mat = new ShaderMaterial({
        vertexShader: signalVertex,
        fragmentShader: signalFragment,
        uniforms: {
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uIntensity: { value: 0 },
          uSpeed: { value: 1.6 + i * 0.2 },
          uColA: { value: new Color(0.55, 0.88, 1.0) },
          uColB: { value: dead ? VIOLET.clone().multiplyScalar(0.7) : MIST.clone() },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        premultipliedAlpha: true,
      });
      return { geo: new TubeGeometry(curve, lowPower ? 60 : 110, dead ? 0.012 : 0.02, 6, false), mat, dead };
    });

    const sources: Record<(typeof DISCOVERIES)[number]["kind"], BufferGeometry> = {
      knot: new TorusKnotGeometry(0.62, 0.17, 90, 8, 2, 3),
      icosa: new IcosahedronGeometry(0.85, 1),
      dodeca: new DodecahedronGeometry(0.9, 0),
      torus: new TorusGeometry(0.8, 0.26, 10, 28),
    };
    const sketches = DISCOVERIES.map((d, i) => {
      const geo = sketchGeometry(sources[d.kind], 101 + i * 13);
      const mat = additive(
        dataLineFragment,
        {
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uIntensity: { value: 0 },
          uPulse: { value: 1 },
          uColor: { value: (i % 2 ? COBALT : MIST).clone() },
          uAccent: { value: new Color(0.75, 0.95, 1.0) },
        },
        dataLineVertex,
      );
      return { geo, mat };
    });
    Object.values(sources).forEach((g) => g.dispose());

    const glowGeo = new PlaneGeometry(3.2, 3.2);
    const glowMats = DISCOVERIES.map(
      (_, i) =>
        new ShaderMaterial({
          vertexShader: glowVertex,
          fragmentShader: glowFragment,
          uniforms: { uColor: { value: (i % 2 ? COBALT : VIOLET).clone() }, uIntensity: { value: 0 } },
          transparent: true,
          depthWrite: false,
          blending: AdditiveBlending,
          premultipliedAlpha: true,
        }),
    );
    return { terrainGeo, terrainMat, branches, sketches, glowGeo, glowMats };
  }, [lowPower]);

  useFrame((state, dt) => {
    const tr = story.view.track - TRACK_SHIFT; // Milestone 003 units
    const visible = tr > WINDOW.curiosity[0] && tr < WINDOW.curiosity[1];
    if (root.current) root.current.visible = visible;
    if (!visible) return;
    const calm = story.reducedMotion ? 0.12 : 1;
    const t = state.clock.elapsedTime * calm;
    // Enter with the arrival, hold through the chapter, dissolve toward Engineering.
    const presence = smoothstep(0.5, 1.0, tr) * (1 - smoothstep(1.8, 2.2, tr));

    r.terrainMat.uniforms.uTime.value = t;
    r.terrainMat.uniforms.uReveal.value = smoothstep(0.5, 1.15, tr);
    r.terrainMat.uniforms.uIntensity.value = presence * 0.85;

    r.branches.forEach((b, i) => {
      const u = b.mat.uniforms;
      const rv = smoothstep(0.6 + i * 0.03, 0.95 + i * 0.02, tr);
      u.uReveal.value = rv * rv * (3 - 2 * rv) * 1.001;
      u.uTime.value = t;
      u.uIntensity.value = presence * (b.dead ? 0.55 * (1 - smoothstep(1.55, 1.9, tr)) : 1.0);
    });

    DISCOVERIES.forEach((d, i) => {
      const reveal = smoothstep(0.8 + i * 0.04, 1.08 + i * 0.03, tr);
      const s = r.sketches[i].mat.uniforms;
      s.uReveal.value = reveal;
      s.uTime.value = t;
      s.uIntensity.value = presence * 0.95;
      r.glowMats[i].uniforms.uIntensity.value = presence * smoothstep(0.6, 1, reveal) * 0.32;
      const g = forms.current[i];
      if (g) {
        g.rotation.y += dt * (0.12 + i * 0.03) * calm;
        g.rotation.x = Math.sin(t * 0.2 + i) * 0.3;
        g.position.y = d.pos.y + Math.sin(t * 0.5 + i * 1.7) * 0.12;
        const glow = g.children[1] as Mesh | undefined;
        glow?.quaternion.copy(state.camera.quaternion).premultiply(g.quaternion.clone().invert());
      }
    });
  });

  return (
    <group ref={root} visible={false}>
      <mesh
        geometry={r.terrainGeo}
        material={r.terrainMat}
        position={[CURIOSITY_CENTRE.x, CURIOSITY_FLOOR, CURIOSITY_CENTRE.z]}
        renderOrder={1}
        frustumCulled={false}
      />
      {r.branches.map((b, i) => (
        <mesh key={i} geometry={b.geo} material={b.mat} renderOrder={3} frustumCulled={false} />
      ))}
      {DISCOVERIES.map((d, i) => (
        <group
          key={d.kind}
          position={d.pos.toArray() as [number, number, number]}
          scale={d.scale}
          ref={(el) => {
            forms.current[i] = el;
          }}
        >
          <lineSegments geometry={r.sketches[i].geo} material={r.sketches[i].mat} renderOrder={4} />
          <mesh geometry={r.glowGeo} material={r.glowMats[i]} renderOrder={2} />
        </group>
      ))}
    </group>
  );
}

/** Helper for other chapters: the point where the exploration converges again. */
export const CONVERGE = new Vector3(9.6, 1.6, -47);
