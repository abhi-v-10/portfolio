"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Group,
  IcosahedronGeometry,
  Material,
  Float32BufferAttribute,
  Mesh,
  PlaneGeometry,
  Points,
  PointsMaterial,
  TorusGeometry,
  ShaderMaterial,
  TubeGeometry,
  Vector3,
} from "three";
import { timeline, strands as strandList } from "@/content/timeline";
import { story } from "../director/store";
import { glowFragment, glowVertex, signalFragment, signalVertex } from "../shaders/signal";
import { shellFragment, shellVertex, strandFragment } from "../shaders/universe";

const shellMatOf = (c: string) =>
  new ShaderMaterial({
    vertexShader: shellVertex,
    fragmentShader: shellFragment,
    uniforms: { uColor: { value: new Color(c) }, uIntensity: { value: 0 }, uFill: { value: 0.35 } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
import { smoothstep } from "../world/paths";
import { HORIZON, NEXUS, WINDOW, mulberry32 } from "./layout";
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
    /** Plies per strand, so a focused event can light its whole strand. */
    const strandGroups: ShaderMaterial[][] = ORIGINS.map(() => []);
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
        strandGroups[s].push(mat);
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
        uniforms: { uColor: { value: new Color(ev.placeholder ? "#b6afa9" : "#d6dfb7") }, uIntensity: { value: 0 }, uFill: { value: 0.25 } },
        ...additive,
        premultipliedAlpha: false,
      });
      const node = new Mesh(nodeGeo, shellMat);
      node.position.copy(p);
      const halo = new Mesh(sprite, glowMat(ev.placeholder ? "#d8d3cf" : "#e4ecca"));
      halo.position.copy(p);
      root.add(node, halo);
      return { node, halo, shellMat, u, i, s, major: !!ev.major };
    });

    // The present: a living point where every strand meets.
    const coreMat = glowMat("#d6dfb7");
    const core = new Mesh(sprite, coreMat);
    root.add(core);

    // Closing: several paths rise from the nexus to the horizon.
    const rel = HORIZON.clone().sub(NEXUS);
    const pathCols: [string, string][] = [["#d6dfb7", "#e4dcd5"], ["#c4b2a3", "#ffaa6a"], ["#d7cdbd", "#f6f5f3"], ["#f3836b", "#ffd6c2"]];
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
    // The horizon (refined): a warm, controlled light with visible form. A gold
    // halo, a smaller ivory heart, three gateway arcs standing around it, a
    // horizon band and warm motes rising from the converged threads.
    const sunMat = glowMat("#ffae78");
    const sun = new Mesh(sprite, sunMat);
    sun.position.copy(rel);
    const heartMat = glowMat("#ffe0b8");
    const heart = new Mesh(sprite, heartMat);
    heart.position.copy(rel);
    const arcCols = ["#c4b2a3", "#ffcf8a", "#f3836b"];
    const arcMats = arcCols.map((c) => shellMatOf(c));
    const arcs = arcMats.map((m, k) => {
      const a = new Mesh(new TorusGeometry(3.2 + k * 1.15, 0.035 - k * 0.006, 8, 120, Math.PI * (1.1 - k * 0.12)), m);
      a.position.copy(rel);
      a.rotation.z = Math.PI * (k * 0.06 - 0.05) - 0.03;
      root.add(a);
      return a;
    });
    const bandMat = glowMat("#ffc796");
    const band = new Mesh(sprite, bandMat);
    band.position.copy(rel).add(v(0, -1.6, -2));
    band.scale.set(60, 1.4, 1);
    const moteCount = lowPower ? 90 : 180;
    const motePos = new Float32Array(moteCount * 3);
    const moteSeed = new Float32Array(moteCount);
    const rand = mulberry32(2026);
    for (let k = 0; k < moteCount; k++) {
      const a = rand() * Math.PI * 2;
      const rr = 2 + rand() * 9;
      motePos.set([rel.x * 0.5 + Math.cos(a) * rr, rand() * rel.y, rel.z * 0.6 + Math.sin(a) * rr * 0.5], k * 3);
      moteSeed[k] = rand();
    }
    const moteGeo = new BufferGeometry();
    moteGeo.setAttribute("position", new Float32BufferAttribute(motePos, 3));
    const moteMat = new PointsMaterial({ color: new Color("#ffd2a8"), size: 0.09, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending });
    const motes = new Points(moteGeo, moteMat);
    root.add(band, sun, heart, motes);

    // A spark that runs from the focused event along its strand into the present.
    const sparkMat = glowMat("#fcf5ef");
    const spark = new Mesh(sprite, sparkMat);
    root.add(spark);

    root.visible = false;
    return { root, strandMats, strandGroups, bases, events, core, coreMat, pathMats, sun, sunMat, heart, heartMat, arcs, arcMats, band, bandMat, motes, moteMat, motePos, moteSeed, rel, spark, sparkMat };
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

  const lightState = useMemo(() => ({ strand: ORIGINS.map(() => 1), major: 0 }), []);

  useFrame((state, dt) => {
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

    // Focus: the focused event's whole strand lights, the others step back.
    const focus = story.nexusFocus;
    const fe = focus >= 0 ? r.events[focus] : undefined;
    const kf = 1 - Math.exp(-Math.min(dt, 0.1) * (reduced ? 40 : 5));
    r.strandGroups.forEach((mats, s) => {
      const goal = fe ? (fe.s === s ? 1.7 : 0.4) : 1;
      lightState.strand[s] += (goal - lightState.strand[s]) * kf;
      mats.forEach((m) => {
        m.uniforms.uTime.value = t;
        m.uniforms.uReveal.value = reveal * 1.001;
        m.uniforms.uIntensity.value = presence * (1 - dawn * 0.45) * lightState.strand[s];
        m.uniforms.uGather.value = gather;
        m.uniforms.uDawn.value = dawn;
      });
    });
    lightState.major += ((fe?.major ? 1 : 0) - lightState.major) * kf;
    if (fe) {
      const u = reduced ? 1 : Math.min(1, ((t * 0.45) % 1.25));
      const along = fe.u + (1 - fe.u) * u;
      r.bases[fe.s].getPointAt(Math.min(1, along), r.spark.position);
      faceCamera(r.spark, cam.quaternion);
      r.spark.scale.setScalar(0.7);
      r.sparkMat.uniforms.uIntensity.value = presence * (1 - dawn) * (reduced ? 0 : Math.sin(Math.PI * Math.min(1, u)) * 1.2);
    } else r.sparkMat.uniforms.uIntensity.value = 0;

    // Event nodes appear as the strands reach them; the focused event answers.
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
    // Major events (degree, internship, council, WiniOS) make the present answer.
    r.coreMat.uniforms.uIntensity.value = presence * (0.4 + gather * 1.1 + lightState.major * 0.6) * (1 - dawn * 0.5);

    // Post-credits finale: the threads withdraw toward the present, the light lowers.
    const fin = story.finale;
    const rise = smoothstep(10.85, 11.6, tr);
    r.pathMats.forEach((m) => {
      m.uniforms.uTime.value = t;
      m.uniforms.uReveal.value = rise * (1 - fin) * 1.001;
      m.uniforms.uIntensity.value = rise * 1.1 * (1 - fin * 0.7);
    });
    const warm = dawn * (1 - fin);
    faceCamera(r.sun, cam.quaternion);
    faceCamera(r.heart, cam.quaternion);
    faceCamera(r.band, cam.quaternion);
    r.sun.scale.setScalar(11 + dawn * 4);
    r.sunMat.uniforms.uIntensity.value = warm * 0.16;
    r.heart.scale.setScalar(3.2 + (reduced ? 0 : Math.sin(t * 0.8) * 0.15));
    r.heartMat.uniforms.uIntensity.value = warm * 0.3;
    r.bandMat.uniforms.uIntensity.value = warm * 0.12;
    r.arcs.forEach((a, k) => {
      faceCamera(a, cam.quaternion);
      a.rotateZ(Math.PI * (k * 0.06 - 0.05) - 0.03 + (reduced ? 0 : Math.sin(t * 0.15 + k) * 0.04));
      const grow = smoothstep(11.0 + k * 0.12, 11.55 + k * 0.12, tr);
      a.scale.setScalar(0.85 + 0.15 * grow);
      r.arcMats[k].uniforms.uIntensity.value = warm * grow * (0.45 - k * 0.1);
    });
    r.moteMat.opacity = warm * 0.25;
    if (!reduced && warm > 0.01) {
      const pa = r.motes.geometry.attributes.position;
      const arr = pa.array as Float32Array;
      for (let k = 0; k < r.moteSeed.length; k++) {
        arr[k * 3 + 1] += Math.min(dt, 0.1) * (0.25 + r.moteSeed[k] * 0.5);
        if (arr[k * 3 + 1] > r.rel.y + 2) arr[k * 3 + 1] = -2;
      }
      pa.needsUpdate = true;
    }
  });

  return <primitive object={r.root} />;
}
