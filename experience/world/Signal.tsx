"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  Color,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  TubeGeometry,
  Vector3,
} from "three";
import { story } from "../director/store";
import { glowFragment, glowVertex, signalFragment, signalVertex } from "../shaders/signal";
import { signalCurve, smoothstep, strandCurve } from "./paths";

type StrandSpec = {
  curve: typeof signalCurve;
  radius: number;
  a: Color;
  b: Color;
  speed: number;
  intensity: number;
  revealFrom: number;
};

function makeSignalMaterial(spec: StrandSpec) {
  return new ShaderMaterial({
    vertexShader: signalVertex,
    fragmentShader: signalFragment,
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uIntensity: { value: spec.intensity },
      uSpeed: { value: spec.speed },
      uColA: { value: spec.a },
      uColB: { value: spec.b },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    premultipliedAlpha: true,
  });
}

export function Signal({ segments }: { segments: number }) {
  const packet = useRef<Mesh>(null);
  const tmp = useMemo(() => new Vector3(), []);

  const strands = useMemo(() => {
    const specs: StrandSpec[] = [
      { curve: signalCurve, radius: 0.03, a: new Color(0.82, 0.5, 0.31), b: new Color(0.62, 0.36, 0.27), speed: 2.4, intensity: 1.15, revealFrom: 0.22 },
      { curve: strandCurve(new Vector3(0.05, 0.2, 0.14), 0.4), radius: 0.012, a: new Color(0.583, 0.646, 0.679), b: new Color(0.74, 0.523, 0.44), speed: 1.7, intensity: 0.8, revealFrom: 0.36 },
      { curve: strandCurve(new Vector3(0.16, -0.12, 0.02), 2.1), radius: 0.009, a: new Color(0.518, 0.58, 0.612), b: new Color(0.75, 0.533, 0.449), speed: 1.2, intensity: 0.7, revealFrom: 0.48 },
    ];
    return specs.map((spec) => ({
      spec,
      geometry: new TubeGeometry(spec.curve, segments, spec.radius, 8, false),
      material: makeSignalMaterial(spec),
    }));
  }, [segments]);

  const packetMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: glowVertex,
        fragmentShader: glowFragment,
        uniforms: { uColor: { value: new Color(0.885, 0.849, 0.797) }, uIntensity: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        premultipliedAlpha: true,
      }),
    [],
  );
  const packetGeo = useMemo(() => new PlaneGeometry(0.7, 0.7), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const intro = story.intro;
    const calmT = story.reducedMotion ? t * 0.15 : t;

    strands.forEach(({ spec, material }) => {
      const r = smoothstep(spec.revealFrom, 1.0, intro);
      material.uniforms.uReveal.value = r * r * (3 - 2 * r) * 1.001;
      material.uniforms.uTime.value = calmT;
      material.uniforms.uIntensity.value = spec.intensity * (1 + story.scroll * 0.35);
    });

    // The point of light: rides the reveal head during the entrance, then
    // keeps travelling the current as a slow packet — the "living signal".
    if (packet.current) {
      const head = strands[0].material.uniforms.uReveal.value as number;
      const entering = intro < 1;
      const u = entering ? Math.min(head, 0.999) : (calmT * 0.035) % 0.82;
      signalCurve.getPointAt(Math.max(0.0001, u), tmp);
      packet.current.position.copy(tmp);
      packet.current.quaternion.copy(state.camera.quaternion);
      const fadeIn = smoothstep(0.22, 0.32, intro);
      const fadeEdges = entering ? 1 : smoothstep(0.0, 0.05, u) * (1 - smoothstep(0.72, 0.82, u));
      packetMat.uniforms.uIntensity.value = fadeIn * fadeEdges * 1.1;
    }
  });

  return (
    <group>
      {strands.map(({ geometry, material }, i) => (
        <mesh key={i} geometry={geometry} material={material} renderOrder={3} frustumCulled={false} />
      ))}
      <mesh ref={packet} geometry={packetGeo} material={packetMat} renderOrder={4} />
    </group>
  );
}
