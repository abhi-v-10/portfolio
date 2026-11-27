"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import {
  AddEquation,
  AdditiveBlending,
  AmbientLight,
  ConstantAlphaFactor,
  CustomBlending,
  type Material,
  type Mesh,
  OneFactor,
  ReverseSubtractEquation,
  ZeroFactor,
  BackSide,
  Color,
  DirectionalLight,
  HemisphereLight,
  PointLight,
  Vector3,
  Fog,
  PMREMGenerator,
  ShaderMaterial,
  SphereGeometry,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { markSceneReady, story } from "../director/store";
import { paletteAt, withFinale } from "../director/palette";
import { backdropFragment, backdropVertex } from "../shaders/backdrop";

/** Colour-field sky that wraps the whole world. */
export function Backdrop() {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: backdropVertex,
        fragmentShader: backdropFragment,
        uniforms: {
          uTime: { value: 0 },
          uIntro: { value: 0 },
          uGround: { value: new Vector3() },
          uZenith: { value: new Vector3() },
          uGlow: { value: new Vector3() },
          uDay: { value: 0 },
          uEng: { value: 0 },
          uDawn: { value: 0 },
          uFinale: { value: 0 },
        },
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
    // Chapter palette: the same values the DOM is written with.
    const p = paletteAt(story.view.track);
    u.uGround.value.set(...p.ground);
    u.uZenith.value.set(...p.zenith);
    u.uGlow.value.set(...p.glow);
    u.uDay.value = p.day;
    u.uEng.value = p.chapter === 3 ? 1 - p.blend : p.chapter === 2 ? p.blend : 0;
    u.uDawn.value = p.chapter === 7 ? 1 : p.chapter === 6 ? p.blend : 0;
    u.uFinale.value = story.finale;
    // Keep the sky centred on the viewer: it reads as infinitely far.
    ref.current?.position.copy(camera.position);
  });

  return <mesh ref={ref} geometry={geometry} material={material} renderOrder={-1} frustumCulled={false} />;
}

/**
 * Base lighting: a warm key, a cool rim and a low ambient; the HDRI does the
 * rest. By daylight (Engineering, the closing dawn) the studio opens up: a
 * soft sky fill from above and a stronger ambient lift the shadow side, the
 * key cools toward daylight and the rim drops, so metal reads as metal under
 * bright, even light instead of a spotlit object on a pale wall.
 */
export function Lights() {
  const ambient = useRef<AmbientLight>(null);
  const hemi = useRef<HemisphereLight>(null);
  const key = useRef<PointLight>(null);
  const rim = useRef<PointLight>(null);
  const sun = useRef<DirectionalLight>(null);
  const scene = useThree((s) => s.scene);
  const night = useMemo(() => ({ key: new Color("#D7CDBD"), sun: new Color("#74838B") }), []);
  const daylight = useMemo(() => ({ key: new Color("#f3efe8"), sun: new Color("#fff6e9") }), []);
  useFrame(() => {
    const d = withFinale(paletteAt(story.view.track), story.finale).day;
    if (ambient.current) ambient.current.intensity = 0.2 + 0.2 * d;
    if (hemi.current) hemi.current.intensity = 0.55 * d;
    if (key.current) {
      key.current.intensity = 14 + 2 * d;
      key.current.color.copy(night.key).lerp(daylight.key, d);
    }
    if (rim.current) rim.current.intensity = 18 * (1 - 0.6 * d);
    if (sun.current) {
      sun.current.intensity = 2.6 + 0.4 * d;
      sun.current.color.copy(night.sun).lerp(daylight.sun, d);
    }
    // Reflections brighten with the room.
    scene.environmentIntensity = 0.55 + 0.25 * d;
  });
  return (
    <>
      <ambientLight ref={ambient} color="#74838B" intensity={0.2} />
      {/* Always present (intensity 0 by night): the light count never changes. */}
      <hemisphereLight ref={hemi} color="#fbf7f0" groundColor="#b9ad9c" intensity={0} />
      <pointLight ref={key} color="#D7CDBD" position={[0.6, 0.5, 1.8]} intensity={14} distance={12} decay={2} />
      <pointLight ref={rim} color="#b27c67" position={[-2.5, 2.2, -1.5]} intensity={18} distance={14} decay={2} />
      <directionalLight ref={sun} color="#74838B" position={[3, 4, -6]} intensity={2.6} />
      <directionalLight color="#e2dbcf" position={[-3, -2, 5]} intensity={0.8} />
    </>
  );
}

/** Image-based reflections: a CC0 photo-studio HDRI, with a procedural room as the first frame. */
export function SceneSetup() {
  const gl = useThree((s) => s.gl) as WebGLRenderer;
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    // Procedural room until the studio HDRI arrives (a few hundred ms), so
    // physical materials never render black.
    let env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.55;
    scene.fog = new Fog("#0f0d0b", 20, 60);
    let alive = true;
    // Studio Small 09 by Sergej Majboroda, Poly Haven, CC0 (see public/env/README.md).
    new HDRLoader().loadAsync("/env/studio_small_09_1k.hdr").then((hdr) => {
      if (!alive) return hdr.dispose();
      const next = pmrem.fromEquirectangular(hdr).texture;
      hdr.dispose();
      env.dispose();
      env = next;
      scene.environment = next;
    }).catch(() => undefined);
    return () => {
      alive = false;
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

/**
 * Daylight glows (2026-11-27). Light lines and motes drawn with additive
 * blending vanish on a light ground. By day they are subtracted from the sky
 * instead, so the same signal reads as ink: a copper glow on bone becomes a
 * deep blue-grey line, a pale mote becomes a fleck of shade. Blending is GL
 * state, not part of the shader program, so the switch never recompiles.
 */
export function DaylightBlending() {
  const scene = useThree((s) => s.scene);
  const state = useRef({ day: false, mats: [] as Material[], scanned: 0 });
  useFrame(() => {
    const st = state.current;
    // Rescan occasionally: chapter worlds may add materials after mount.
    if (st.scanned++ % 240 === 0) {
      const found = new Set<Material>();
      scene.traverse((o) => {
        const m = (o as Mesh).material as Material | Material[] | undefined;
        (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => {
          if (x.blending === AdditiveBlending || x.userData.additive) found.add(x);
        });
      });
      st.mats = [...found];
      st.mats.forEach((m) => (m.userData.additive = true));
      apply(st.mats, st.day);
    }
    const day = paletteAt(story.view.track).day > 0.5;
    // Test hook (read-only): how many glow materials follow the daylight switch.
    (window as Window & { __daylight?: object }).__daylight = { mats: st.mats.length, day: st.day };
    if (day !== st.day) {
      st.day = day;
      apply(st.mats, day);
    }
  });
  return null;
}
function apply(mats: Material[], day: boolean) {
  mats.forEach((m) => {
    if (day) {
      m.blending = CustomBlending;
      m.blendEquation = ReverseSubtractEquation;
      // At 70%: lines still read as ink, motes and halos stay a light shade
      // instead of black specks and smudges.
      m.blendSrc = ConstantAlphaFactor;
      m.blendAlpha = 0.7;
      m.blendDst = OneFactor;
      // Alpha must stay 1: a subtracted alpha makes the canvas see-through and
      // the page composites those pixels as white.
      m.blendEquationAlpha = AddEquation;
      m.blendSrcAlpha = ZeroFactor;
      m.blendDstAlpha = OneFactor;
    } else {
      m.blending = AdditiveBlending;
    }
  });
}

/**
 * Hidden chapters skip the matrix pass (2026-11-27). three.js updates every
 * object's world matrix each frame, visible or not, and the gated chapter
 * worlds hold thousands of objects. Registered last, after every chapter has
 * set its root's visibility for this frame, so a chapter that appears this
 * frame is updated before it is drawn.
 */
export function SkipHiddenMatrices() {
  const scene = useThree((s) => s.scene);
  useFrame(() => {
    for (const child of scene.children) child.matrixWorldAutoUpdate = child.visible;
  });
  return null;
}
