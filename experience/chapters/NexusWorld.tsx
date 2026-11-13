"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  AdditiveBlending,
  CatmullRomCurve3,
  Color,
  Group,
  IcosahedronGeometry,
  Material,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  TubeGeometry,
  Vector3,
} from "three";
import { timeline, strands as strandList } from "@/content/timeline";
import { story } from "../director/store";
import { glowFragment, glowVertex, signalFragment, signalVertex } from "../shaders/signal";
import { shellFragment, shellVertex, strandFragment } from "../shaders/universe";
import { smoothstep } from "../world/paths";
import { HORIZON, NEXUS, WINDOW } from "./layout";
import { faceCamera } from "./UniverseWorld";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
const additive = { transparent: true, depthWrite: false, blending: AdditiveBlending, premultipliedAlpha: true } as const;

/** Where each strand begins (the past), relative to the nexus. Original layout, not a tree silhouette. */
const ORIGINS = [v(-12, -5, 6), v(11, -4, 4), v(-9, 6, -8), v(13, 5, -6), v(2, -7, -12)];
const BENDS = [v(-7, 2, 7), v(8, 1.5, 6), v(-8, -1, -2), v(6, -2, -8), v(-4, -3, -7)];

/**
 * Timeline Nexus: five living strands (education, leadership, learning,
 * projects, work) that twist like rope, carry their real events as nodes and
 * converge on one point, the present. Gathering turns them from cold white to
 * emerald; the closing then lifts several coloured paths toward a warm horizon.
 */
export function NexusWorld({ lowPower }: { lowPower: boolean }) {
  const r = useMemo(() => {
    const root = new Group();
    root.position.copy(NEXUS);
    const strandMats: ShaderMaterial[] = [];
    const bases: CatmullRomCurve3[] = [];
    const seg = lowPower ? 90 : 150;

    ORIGINS.forEach((o, s) => {
      const base = new CatmullRomCurve3([o, BENDS[s], BENDS[s].clone().multiplyScalar(0.35), v(0, 0, 0)], false, "centripetal");
      bases.push(base);
      const frames = base.computeFrenetFrames(64, false);
      const plies = lowPower ? 2 : 3;
      for (let p = 0; p < plies; p++) {
        const pts: Vector3[] = [];
        for (let k = 0; k <= 64; k++) {
          const u = k / 64;
          const c = base.getPointAt(u);
          const a = u * 14 + (p / plies) * Math.PI * 2 + s;
          const rad = 0.28 * (1 - u) ** 0.8 + 0.01;
          c.addScaledVector(frames.normals[k], Math.cos(a) * rad).addScaledVector(frames.binormals[k], Math.sin(a) * rad);
          pts.push(c);
        }
        const mat = new ShaderMaterial({
          vertexShader: signalVertex,
          fragmentShader: strandFragment,
          uniforms: {
            uTime: { value: 0 },
            uReveal: { value: 0 },
            uIntensity: { value: 0 },
            uGather: { value: 0 },
            uDawn: { value: 0 },
            uSeed: { value: s * 0.37 + p * 0.21 },
          },
          ...additive,
        });
        strandMats.push(mat);
        root.add(new Mesh(new TubeGeometry(new CatmullRomCurve3(pts, false, "centripetal"), seg, p === 0 ? 0.03 : 0.016, 6, false), mat));
      }
    });

    // Events: nodes on their strand, oldest farthest from the present.
    const sprite = new PlaneGeometry(1, 1);
    const glowMat = (c: string) =>
      new ShaderMaterial({
        vertexShader: glowVertex,
        fragmentShader: glowFragment,
        uniforms: { uColor: { value: new Color(c) }, uIntensity: { value: 0 } },
        ...additive,
      });
    const nodeGeo = new IcosahedronGeometry(0.16, 1);
    const events = timeline.map((ev, i) => {
      const s = strandList.findIndex((x) => x.id === ev.strand);
      const same = timeline.filter((x) => x.strand === ev.strand);
      const k = same.indexOf(ev);
      const u = 0.22 + (0.62 * (k + 1)) / (same.length + 1);
      const p = bases[s].getPointAt(u);
      const shellMat = new ShaderMaterial({
        vertexShader: shellVertex,
        fragmentShader: shellFragment,
        uniforms: { uColor: { value: new Color(ev.placeholder ? "#9fb3c8" : "#7cf5c4") }, uIntensity: { value: 0 }, uFill: { value: 0.25 } },
        ...additive,
        premultipliedAlpha: false,
      });
      const node = new Mesh(nodeGeo, shellMat);
      node.position.copy(p);
      const halo = new Mesh(sprite, glowMat(ev.placeholder ? "#c8d6e6" : "#9dffd6"));
      halo.position.copy(p);
      root.add(node, halo);
      return { node, halo, shellMat, u, i };
    });

    // The present: a living point where every strand meets.
    const coreMat = glowMat("#7cf5c4");
    const core = new Mesh(sprite, coreMat);
    root.add(core);

    // Closing: several paths rise from the nexus to the horizon.
    const rel = HORIZON.clone().sub(NEXUS);
    const pathCols: [string, string][] = [["#7cf5c4", "#f0dabf"], ["#b9a6ff", "#ffaa6a"], ["#73dfff", "#f6f4fa"], ["#f17e98", "#ffd6c2"]];
    const pathMats = pathCols.map(([a, b], k) => {
      const side = (k - 1.5) * 2.4;
      const curve = new CatmullRomCurve3(
        [v(0, 0, 0), v(side * 1.2, 3 + k * 0.4, -6), v(side * 0.7, rel.y * 0.7, rel.z * 0.65), rel.clone()],
        false,
        "centripetal",
      );
      const mat = new ShaderMaterial({
        vertexShader: signalVertex,
        fragmentShader: signalFragment,
        uniforms: {
          uTime: { value: 0 },
          uReveal: { value: 0 },
          uIntensity: { value: 0 },
          uSpeed: { value: 1.4 + k * 0.3 },
          uColA: { value: new Color(a) },
          uColB: { value: new Color(b) },
        },
        ...additive,
      });
      root.add(new Mesh(new TubeGeometry(curve, lowPower ? 80 : 140, 0.035, 6, false), mat));
      return mat;
    });
    const sunMat = glowMat("#ffe7cf");
    const sun = new Mesh(sprite, sunMat);
    sun.position.copy(rel);
    root.add(sun);

    root.visible = false;
    return { root, strandMats, events, core, coreMat, pathMats, sun, sunMat };
  }, [lowPower]);

  useEffect(
    () => () => {
      r.root.traverse((o) => {
        const m = o as Mesh;
        m.geometry?.dispose();
        (m.material as Material | undefined)?.dispose?.();
      });
    },
    [r],
  );

  useFrame((state) => {
    const tr = story.view.track;
    const inside = tr > WINDOW.nexus[0] && tr < WINDOW.nexus[1];
    r.root.visible = inside;
    if (!inside) return;
    const reduced = story.reducedMotion;
    const t = reduced ? 0 : state.clock.elapsedTime;
    const cam = state.camera;

    const presence = smoothstep(9.2, 9.75, tr);
    const reveal = smoothstep(9.3, 10.15, tr);
    const gather = smoothstep(9.9, 10.95, tr);
    const dawn = smoothstep(10.95, 11.55, tr);

    r.strandMats.forEach((m) => {
      m.uniforms.uTime.value = t;
      m.uniforms.uReveal.value = reveal * 1.001;
      m.uniforms.uIntensity.value = presence * (1 - dawn * 0.45);
      m.uniforms.uGather.value = gather;
      m.uniforms.uDawn.value = dawn;
    });

    // Event nodes appear as the strands reach them; the focused event answers.
    const focus = story.nexusFocus;
    r.events.forEach((e) => {
      const on = smoothstep(e.u - 0.05, e.u + 0.05, reveal) * presence * (1 - dawn * 0.6);
      const f = e.i === focus ? 1 : 0;
      const breathe = reduced ? 1 : 1 + 0.08 * Math.sin(t * 1.4 + e.i);
      e.node.scale.setScalar((1 + f * 0.9) * breathe);
      e.shellMat.uniforms.uIntensity.value = on * (0.8 + f * 0.9);
      e.halo.scale.setScalar(0.9 + f * 1.2);
      faceCamera(e.halo, cam.quaternion);
      (e.halo.material as ShaderMaterial).uniforms.uIntensity.value = on * (0.45 + f * 1.1);
    });

    faceCamera(r.core, cam.quaternion);
    r.core.scale.setScalar(1.4 + gather * 2.2 + (reduced ? 0 : Math.sin(t * 2) * 0.15 * gather));
    r.coreMat.uniforms.uIntensity.value = presence * (0.4 + gather * 1.1) * (1 - dawn * 0.5);

    const rise = smoothstep(10.85, 11.6, tr);
    r.pathMats.forEach((m) => {
      m.uniforms.uTime.value = t;
      m.uniforms.uReveal.value = rise * 1.001;
      m.uniforms.uIntensity.value = rise * 1.1;
    });
    faceCamera(r.sun, cam.quaternion);
    r.sun.scale.setScalar(14 + dawn * 8);
    r.sunMat.uniforms.uIntensity.value = dawn * 1.0;
  });

  return <primitive object={r.root} />;
}
