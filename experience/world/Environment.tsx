"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  BackSide,
  Fog,
  PMREMGenerator,
  ShaderMaterial,
  SphereGeometry,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { markSceneReady, story } from "../director/store";
import { backdropFragment, backdropVertex } from "../shaders/backdrop";

/** Colour-field sky that wraps the whole world. */
export function Backdrop() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: backdropVertex,
        fragmentShader: backdropFragment,
        uniforms: { uTime: { value: 0 }, uIntro: { value: 0 }, uScroll: { value: 0 }, uTrack: { value: 0 }, uHuman: { value: 0 }, uIntel: { value: 0 }, uExpr: { value: 0 }, uProj: { value: 0 }, uNexus: { value: 0 }, uDawn: { value: 0 } },
        side: BackSide,
        depthWrite: false,
        depthTest: false,
      }),
    [],
  );
  const geometry = useMemo(() => new SphereGeometry(90, 48, 32), []);
  const camera = useThree((s) => s.camera);
  const ref = useRef<import("three").Mesh>(null);

  useFrame((state) => {
    const u = material.uniforms;
    u.uTime.value = story.reducedMotion ? 0 : state.clock.elapsedTime;
    u.uIntro.value = story.intro;
    u.uScroll.value = story.scroll;
    // Milestone 003 colour stops are authored one track unit lower.
    const tr = story.view.track;
    u.uTrack.value = tr - 1;
    const ss = (a: number, b: number, x: number) => {
      const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
      return k * k * (3 - 2 * k);
    };
    u.uIntel.value = ss(3.7, 4.25, tr) * (1 - ss(4.7, 5.2, tr));
    u.uExpr.value = ss(4.6, 5.25, tr) * (1 - ss(5.9, 6.35, tr));
    u.uProj.value = ss(5.9, 6.35, tr) * (1 - ss(9.3, 9.9, tr));
    u.uNexus.value = ss(9.3, 9.95, tr) * (1 - ss(10.9, 11.5, tr));
    u.uDawn.value = ss(10.9, 11.6, tr);
    u.uHuman.value = Math.min(1, Math.max(0, (tr - 0.45) / 0.45)) * (1 - Math.min(1, Math.max(0, (tr - 1.5) / 0.55)));
    // Keep the sky centred on the viewer: it reads as infinitely far.
    ref.current?.position.copy(camera.position);
  });

  return <mesh ref={ref} geometry={geometry} material={material} renderOrder={-1} frustumCulled={false} />;
}

/** Lighting for the physical heart: cyan key, blue rim, a controlled violet fill. */
export function Lights() {
  return (
    <>
      <ambientLight color="#3478F6" intensity={0.2} />
      <pointLight color="#73DFFF" position={[0.6, 0.5, 1.8]} intensity={14} distance={12} decay={2} />
      <pointLight color="#8a6cff" position={[-2.5, 2.2, -1.5]} intensity={18} distance={14} decay={2} />
      <directionalLight color="#3478F6" position={[3, 4, -6]} intensity={2.6} />
      <directionalLight color="#9fe9ff" position={[-3, -2, 5]} intensity={0.8} />
    </>
  );
}

/** Image-based reflections from a procedural room; no downloaded HDRI. */
export function SceneSetup() {
  const gl = useThree((s) => s.gl) as WebGLRenderer;
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.35;
    scene.fog = new Fog("#111528", 14, 46);
    return () => {
      env.dispose();
      pmrem.dispose();
      scene.environment = null;
      scene.fog = null;
    };
  }, [gl, scene]);
  return null;
}

/**
 * Real readiness: compile every shader program, then wait for actual frames
 * to be drawn before telling the loader the scene is ready.
 */
export function ReadySignal() {
  const { gl, scene, camera } = useThree();
  const frames = useRef(-1);
  useEffect(() => {
    let cancelled = false;
    const renderer = gl as WebGLRenderer;
    // Chapter worlds start hidden (visibility gates), and compile() skips hidden
    // objects, so their shaders would compile on the first frame they are seen:
    // a visible hitch mid-scroll. Reveal everything for the synchronous program
    // gathering, then restore.
    const reveal = () => {
      const hidden: { visible: boolean }[] = [];
      scene.traverse((o) => {
        if (!o.visible) {
          hidden.push(o);
          o.visible = true;
        }
      });
      return () => hidden.forEach((o) => (o.visible = false));
    };
    let restore = reveal();
    const compiled = renderer.compileAsync
      ? renderer.compileAsync(scene, camera)
      : Promise.resolve(renderer.compile(scene, camera));
    restore();
    compiled
      .catch(() => undefined)
      .then(() => {
        if (cancelled) return;
        // Warm-up render while the loader still covers the canvas: uploads every
        // chapter's geometry and textures now, so no world stalls the first time
        // it scrolls into view.
        restore = reveal();
        const culled: { frustumCulled: boolean }[] = [];
        scene.traverse((o) => {
          if (o.frustumCulled) {
            culled.push(o);
            o.frustumCulled = false;
          }
        });
        renderer.render(scene, camera);
        culled.forEach((o) => (o.frustumCulled = true));
        restore();
      });
    compiled
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) frames.current = 0;
      });
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera]);
  useFrame(() => {
    if (frames.current < 0) return;
    frames.current += 1;
    if (frames.current === 3) markSceneReady();
  });
  return null;
}
