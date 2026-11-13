"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute, Vector3 } from "three";
import { story } from "../director/store";
import { dataLineFragment, dataLineVertex, nodeFragment, nodeVertex } from "../shaders/hologram";
import { additive, HOLO_BLUE, HOLO_CYAN, HOLO_VIOLET } from "./AICore";
import { smoothstep, holoOn } from "./paths";

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A sparse, thin knowledge graph around the core. Nodes assemble as a wave
 * spreading from the signal's exit point; pulses travel the edges.
 * Deterministic (seeded) so every load composes the same frame.
 */
export function DataNetwork({ lowPower }: { lowPower: boolean }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const height = useThree((s) => s.size.height);

  const r = useMemo(() => {
    const rand = rng(1979);
    const count = lowPower ? 30 : 46;
    const source = new Vector3(0.6, 0.7, 0.4).normalize();
    const nodes: Vector3[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; nodes.length < count && i < count * 3; i++) {
      const y = 1 - (i / (count * 1.35 - 1)) * 2;
      if (y < -1) break;
      const rad = Math.sqrt(1 - y * y);
      const th = golden * i;
      const p = new Vector3(Math.cos(th) * rad, y * 0.8, Math.sin(th) * rad);
      if (p.x < -0.72) continue; // keep the name's side of the frame clear
      nodes.push(p.multiplyScalar(2.15 + rand() * 0.75));
    }

    const delayOf = (p: Vector3) => 0.4 + (1 - p.clone().normalize().dot(source)) * 0.2;

    const pos: number[] = [];
    const aT: number[] = [];
    const aDelay: number[] = [];
    const aPhase: number[] = [];
    const seen = new Set<string>();
    nodes.forEach((a, i) => {
      const nearest = nodes
        .map((b, j) => ({ j, d: a.distanceToSquared(b) }))
        .filter((x) => x.j !== i)
        .sort((x, y) => x.d - y.d)
        .slice(0, 2);
      nearest.forEach(({ j }) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (seen.has(key)) return;
        seen.add(key);
        const b = nodes[j];
        const [p0, p1] = delayOf(a) <= delayOf(b) ? [a, b] : [b, a];
        pos.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
        aT.push(0, 1);
        const d = delayOf(p0);
        aDelay.push(d, d);
        const ph = rand();
        aPhase.push(ph, ph);
      });
    });

    const lineGeo = new BufferGeometry();
    lineGeo.setAttribute("position", new Float32BufferAttribute(pos, 3));
    lineGeo.setAttribute("aT", new Float32BufferAttribute(aT, 1));
    lineGeo.setAttribute("aDelay", new Float32BufferAttribute(aDelay, 1));
    lineGeo.setAttribute("aPhase", new Float32BufferAttribute(aPhase, 1));
    const lineMat = additive(
      dataLineFragment,
      {
        uTime: { value: 0 },
        uReveal: { value: 0 },
        uIntensity: { value: 0.5 },
        uPulse: { value: 0.8 },
        uColor: { value: HOLO_BLUE.clone() },
        uAccent: { value: HOLO_VIOLET.clone() },
      },
      dataLineVertex,
    );

    const nodeGeo = new BufferGeometry();
    nodeGeo.setAttribute("position", new Float32BufferAttribute(nodes.flatMap((p) => [p.x, p.y, p.z]), 3));
    nodeGeo.setAttribute("aDelay", new Float32BufferAttribute(nodes.map((p) => delayOf(p) + 0.05), 1));
    nodeGeo.setAttribute("aSize", new Float32BufferAttribute(nodes.map(() => 7 + rand() * 7), 1));
    const nodeMat = additive(
      nodeFragment,
      {
        uReveal: { value: 0 },
        uIntensity: { value: 0.9 },
        uTime: { value: 0 },
        uScale: { value: 1 },
        uColor: { value: HOLO_CYAN.clone() },
      },
      nodeVertex,
    );
    return { lineGeo, lineMat, nodeGeo, nodeMat };
  }, [lowPower]);

  useFrame((state) => {
    const t = state.clock.elapsedTime * (story.reducedMotion ? 0.1 : 1);
    const s = story.view.scroll;
    const fade = 1 - smoothstep(0.05, 0.4, s);
    r.lineMat.uniforms.uTime.value = t;
    const on = holoOn(story.build, 0.42, 0.4, state.clock.elapsedTime, 21, story.reducedMotion);
    const reveal = smoothstep(0.4, 1, story.build);
    r.lineMat.uniforms.uReveal.value = reveal;
    r.lineMat.uniforms.uIntensity.value = 0.5 * fade * on;
    r.nodeMat.uniforms.uTime.value = t;
    r.nodeMat.uniforms.uReveal.value = reveal;
    r.nodeMat.uniforms.uIntensity.value = 0.85 * fade * on;
    r.nodeMat.uniforms.uScale.value = dpr * height * 0.012;
  });

  return (
    <group rotation={[0.15, 0, 0]}>
      <lineSegments geometry={r.lineGeo} material={r.lineMat} renderOrder={5} frustumCulled={false} />
      <points geometry={r.nodeGeo} material={r.nodeMat} renderOrder={6} frustumCulled={false} />
    </group>
  );
}
