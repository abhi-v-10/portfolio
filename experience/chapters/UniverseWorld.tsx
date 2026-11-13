"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  EdgesGeometry,
  Float32BufferAttribute,
  Group,
  Line,
  LineSegments,
  Material,
  Mesh,
  Object3D,
  Quaternion,
  OctahedronGeometry,
  PlaneGeometry,
  QuadraticBezierCurve3,
  ShaderMaterial,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { story } from "../director/store";
import { glowFragment, glowVertex, signalFragment, signalVertex } from "../shaders/signal";
import {
  lineFragment,
  lineVertex,
  morphLineFragment,
  morphLineVertex,
  receiptFragment,
  shellFragment,
  shellVertex,
  uvVertex,
} from "../shaders/universe";
import { smoothstep } from "../world/paths";
import { ARTIFACTS, NEXUS, WINDOW, artifactTrack } from "./layout";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);
const qa = new Quaternion();
/** Billboards inside rotated groups: face the camera in world space. */
export function faceCamera(o: Object3D, camQ: Quaternion) {
  o.parent?.getWorldQuaternion(qa);
  o.quaternion.copy(qa.invert().multiply(camQ));
}
const additive = { transparent: true, depthWrite: false, blending: AdditiveBlending } as const;

const shell = (color: string, fill = 0.12) =>
  new ShaderMaterial({
    vertexShader: shellVertex,
    fragmentShader: shellFragment,
    uniforms: { uColor: { value: new Color(color) }, uIntensity: { value: 0 }, uFill: { value: fill } },
    ...additive,
  });
const glow = (color: string) =>
  new ShaderMaterial({
    vertexShader: glowVertex,
    fragmentShader: glowFragment,
    uniforms: { uColor: { value: new Color(color) }, uIntensity: { value: 0 } },
    ...additive,
    premultipliedAlpha: true,
  });
const current = (a: string, b: string, speed = 2) =>
  new ShaderMaterial({
    vertexShader: signalVertex,
    fragmentShader: signalFragment,
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 1.001 },
      uIntensity: { value: 0 },
      uSpeed: { value: speed },
      uColA: { value: new Color(a) },
      uColB: { value: new Color(b) },
    },
    ...additive,
    premultipliedAlpha: true,
  });
const lines = (color: string, lit: string) =>
  new ShaderMaterial({
    vertexShader: lineVertex,
    fragmentShader: lineFragment,
    uniforms: { uColor: { value: new Color(color) }, uLitColor: { value: new Color(lit) }, uIntensity: { value: 0 } },
    ...additive,
  });

type Lit = { mat: ShaderMaterial; base: number };

/**
 * Project Universe: six original artifacts along one exhibition path, threaded
 * by the living signal on its way to the Timeline Nexus. Each artifact is lit
 * by the camera's attention (its own track key) and idles on the clock, so
 * scroll stays the only thing that moves the story.
 */
export function UniverseWorld({ lowPower }: { lowPower: boolean }) {
  const r = useMemo(() => {
    const root = new Group();
    const sprite = new PlaneGeometry(1, 1);
    const groups: Group[] = [];
    const lit: Lit[][] = [];
    const add = (i: number, m: ShaderMaterial, base: number) => lit[i].push({ mat: m, base });

    ARTIFACTS.forEach((a) => {
      const g = new Group();
      g.position.copy(a.pos);
      g.scale.setScalar(a.scale);
      root.add(g);
      groups.push(g);
      lit.push([]);
    });

    // 0 · WiniOS, The Bridge: two device-worlds joined by an arched current.
    const w = groups[0];
    const pcMat = shell("#5aa8ff", 0.16);
    const phoneMat = shell("#9a86ff", 0.16);
    const pc = new Mesh(new BoxGeometry(2.6, 1.6, 0.1), pcMat);
    pc.position.set(-2.05, 0, 0);
    pc.rotation.y = 0.28;
    const phone = new Mesh(new BoxGeometry(0.72, 1.42, 0.08), phoneMat);
    phone.position.set(2.05, -0.05, 0.1);
    phone.rotation.y = -0.3;
    const bridgeCurve = new QuadraticBezierCurve3(v(-0.82, 0.25, 0.3), v(0.2, 2.0, 0.4), v(1.68, 0.3, 0.25));
    const bridgeMat = current("#73dfff", "#9a86ff", 2.6);
    const bridge = new Mesh(new TubeGeometry(bridgeCurve, 64, 0.03, 8, false), bridgeMat);
    const ringMat = shell("#73dfff", 0.05);
    const ring = new Mesh(new TorusGeometry(0.34, 0.014, 8, 64), ringMat);
    const mid = bridgeCurve.getPoint(0.5);
    ring.position.copy(mid);
    ring.lookAt(mid.clone().add(bridgeCurve.getTangent(0.5)));
    const packetMats = [glow("#bff4ff"), glow("#c9b8ff"), glow("#bff4ff")];
    const packets = packetMats.map((m) => {
      const p = new Mesh(sprite, m);
      p.scale.setScalar(0.42);
      return p;
    });
    const burstMat = glow("#ffffff");
    const burst = new Mesh(sprite, burstMat);
    burst.scale.setScalar(0.9);
    w.add(pc, phone, bridge, ring, burst, ...packets);
    add(0, pcMat, 1);
    add(0, phoneMat, 1);
    add(0, bridgeMat, 1.1);
    add(0, ringMat, 0.9);

    // 1 · JobSeek, The Navigator: a route graph that lights toward a match.
    const j = groups[1];
    const nodes = [
      v(-1.8, -0.6, 0), v(-1.1, 0.5, 0.3), v(-0.9, -0.9, -0.2), v(-0.2, 0.1, 0.2), v(0.1, 1.0, -0.3),
      v(0.4, -0.8, 0.1), v(0.9, 0.3, -0.1), v(1.3, -0.4, 0.3), v(1.5, 0.9, 0), v(2.0, 0.1, 0.1),
    ];
    const edges = [[0, 1], [0, 2], [1, 3], [2, 3], [1, 4], [3, 4], [3, 5], [2, 5], [4, 6], [3, 6], [5, 7], [6, 7], [6, 8], [7, 9], [8, 9]];
    const route = [0, 2, 3, 6, 8, 9];
    const routeEdge = edges.map(([x, y]) => {
      for (let k = 0; k < route.length - 1; k++) {
        if ((route[k] === x && route[k + 1] === y) || (route[k] === y && route[k + 1] === x)) return k;
      }
      return -1;
    });
    const eGeo = new BufferGeometry();
    eGeo.setAttribute("position", new Float32BufferAttribute(edges.flatMap(([x, y]) => [...nodes[x].toArray(), ...nodes[y].toArray()]), 3));
    const eLit = new Float32BufferAttribute(new Float32Array(edges.length * 2), 1);
    eGeo.setAttribute("aLit", eLit);
    const eMat = lines("#ffd98a", "#ffc861");
    const nodeMat = shell("#ffc861", 0.2);
    const matchMat = shell("#fff1c9", 0.25);
    const nodeGeo = new OctahedronGeometry(0.09, 0);
    nodes.forEach((p, k) => {
      const m = new Mesh(k === 9 ? new OctahedronGeometry(0.17, 0) : nodeGeo, k === 9 ? matchMat : nodeMat);
      m.position.copy(p);
      j.add(m);
    });
    const matchRing = new Mesh(new TorusGeometry(0.32, 0.01, 6, 48), matchMat);
    matchRing.position.copy(nodes[9]);
    const scoutMat = glow("#ffe2a0");
    const scout = new Mesh(sprite, scoutMat);
    scout.scale.setScalar(0.38);
    j.add(new LineSegments(eGeo, eMat), matchRing, scout);
    j.rotation.set(-0.3, 0.2, 0);
    add(1, eMat, 1);
    add(1, nodeMat, 1);
    add(1, matchMat, 1);

    // 2 · IRIS, The Vision: a receipt scanned into structured fields.
    const ir = groups[2];
    const paperMat = new ShaderMaterial({
      vertexShader: uvVertex,
      fragmentShader: receiptFragment,
      uniforms: { uColor: { value: new Color("#8ff0d0") }, uIntensity: { value: 0 }, uScan: { value: 1 } },
      ...additive,
      side: DoubleSide,
    });
    const paper = new Mesh(new PlaneGeometry(1.4, 2.2), paperMat);
    paper.position.set(-0.9, 0, 0);
    paper.rotation.y = 0.22;
    const fieldRows = [0.84, 0.68, 0.5, 0.32, 0.14];
    const fieldMat = shell("#8ff0d0", 0.22);
    const fieldGeo = new BoxGeometry(0.9, 0.16, 0.04);
    const fields = fieldRows.map(() => {
      const f = new Mesh(fieldGeo, fieldMat);
      ir.add(f);
      return f;
    });
    const checkMat = glow("#d6fff0");
    const check = new Mesh(sprite, checkMat);
    check.scale.setScalar(0.4);
    ir.add(paper, check);
    add(2, paperMat, 1);
    add(2, fieldMat, 1);

    // 3 · ELI5, The Translator: a knot that relaxes into one clean loop.
    const e = groups[3];
    const N = lowPower ? 360 : 640;
    const pos: number[] = [];
    const tgt: number[] = [];
    const tt: number[] = [];
    for (let k = 0; k < N; k++) {
      const u = k / (N - 1);
      const t = u * Math.PI * 2;
      const rr = 0.95 + 0.42 * Math.cos(5 * t);
      pos.push(rr * Math.cos(2 * t), rr * Math.sin(2 * t), 0.5 * Math.sin(5 * t));
      tgt.push(1.25 * Math.cos(t), 1.25 * Math.sin(t), 0);
      tt.push(u);
    }
    const kGeo = new BufferGeometry();
    kGeo.setAttribute("position", new Float32BufferAttribute(pos, 3));
    kGeo.setAttribute("aTarget", new Float32BufferAttribute(tgt, 3));
    kGeo.setAttribute("aT", new Float32BufferAttribute(tt, 1));
    const knotMat = new ShaderMaterial({
      vertexShader: morphLineVertex,
      fragmentShader: morphLineFragment,
      uniforms: {
        uMorph: { value: 0 },
        uTime: { value: 0 },
        uIntensity: { value: 0 },
        uColor: { value: new Color("#f17e98") },
        uColor2: { value: new Color("#a58bff") },
      },
      ...additive,
    });
    const knot = new Line(kGeo, knotMat);
    // A second, offset pass thickens the line without wide-line support.
    const knot2 = new Line(kGeo, knotMat);
    knot2.scale.setScalar(1.012);
    e.add(knot, knot2);
    add(3, knotMat, 1.2);

    // 4 · QP-Gen, The Architect: chapter pages reassemble into paper sections.
    const q = groups[4];
    const sheetMat = shell("#9db8ff", 0.14);
    const sheetGeo = new BoxGeometry(1.1, 1.45, 0.015);
    const sheets = [0, 1, 2, 3, 4, 5].map(() => {
      const s = new Mesh(sheetGeo, sheetMat);
      q.add(s);
      return s;
    });
    const frameMat = lines("#f0dabf", "#f0dabf");
    const frameGeo = new EdgesGeometry(new BoxGeometry(1.5, 2.6, 0.01));
    frameGeo.setAttribute("aLit", new Float32BufferAttribute(new Float32Array(frameGeo.attributes.position.count).fill(1), 1));
    const frame = new LineSegments(frameGeo, frameMat);
    frame.position.set(0.9, 0, -0.02);
    q.add(frame);
    add(4, sheetMat, 1);

    // 5 · Scholaroid, The Ecosystem: a hub and four role modules, linked.
    const sc = groups[5];
    const hubMat = shell("#ffaa6a", 0.18);
    const modMat = shell("#ffcfa8", 0.14);
    sc.add(new Mesh(new BoxGeometry(0.8, 0.55, 0.8), hubMat));
    const mods: Vector3[] = [];
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
      const p = v(Math.cos(a) * 1.9, -0.25, Math.sin(a) * 1.9);
      mods.push(p);
      const m = new Mesh(new BoxGeometry(0.55, 0.38, 0.55), modMat);
      m.position.copy(p);
      sc.add(m);
    }
    const lGeo = new BufferGeometry();
    lGeo.setAttribute("position", new Float32BufferAttribute(mods.flatMap((p) => [0, 0, 0, ...p.toArray()]), 3));
    lGeo.setAttribute("aLit", new Float32BufferAttribute(new Float32Array(8).fill(0.5), 1));
    const linkMat = lines("#ffaa6a", "#ffd2b0");
    sc.add(new LineSegments(lGeo, linkMat));
    const pulseMats = mods.map(() => glow("#ffd9bd"));
    const pulses = pulseMats.map((m) => {
      const p = new Mesh(sprite, m);
      p.scale.setScalar(0.3);
      sc.add(p);
      return p;
    });
    sc.rotation.x = 0.18;
    add(5, hubMat, 1);
    add(5, modMat, 1);
    add(5, linkMat, 1);

    // The living signal, reborn: it leaves Expression, threads every artifact
    // and runs on to the Timeline Nexus.
    const path = new CatmullRomCurve3(
      [
        v(6, 6.5, -80),
        v(-1, 7.5, -90),
        ...ARTIFACTS.map((a, i) => a.pos.clone().add(v(i % 2 ? 2.6 : -2.8, -2.0, -3.2))),
        v(-18, 6.5, -168),
        NEXUS.clone(),
      ],
      false,
      "centripetal",
    );
    const signalMat = current("#c7b6ff", "#5fe6a8", 1.6);
    root.add(new Mesh(new TubeGeometry(path, lowPower ? 260 : 420, 0.04, 6, false), signalMat));

    root.visible = false;
    return {
      root, groups, lit, packets, packetMats, burst, burstMat, ringMat, bridgeCurve, bridgeMat,
      nodes, route, routeEdge, eLit, scout, scoutMat, fields, fieldRows, fieldMat, paper, paperMat, check, checkMat,
      knotMat, e, sheets, frame, frameMat, pulses, pulseMats, mods, sc, signalMat,
    };
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

  const tmp = useMemo(() => ({ p: new Vector3(), a: new Vector3(), b: new Vector3() }), []);
  const eli5 = useMemo(() => ({ m: 0 }), []);

  useFrame((state, dt) => {
    const tr = story.view.track;
    const inside = tr > WINDOW.universe[0] && tr < WINDOW.universe[1];
    r.root.visible = inside;
    if (!inside) return;
    const reduced = story.reducedMotion;
    const t = reduced ? 0 : state.clock.elapsedTime;
    const presence = smoothstep(5.7, 6.15, tr) * (1 - smoothstep(9.35, 9.9, tr));
    const cam = state.camera;

    // Each artifact brightens as the camera arrives at it.
    const level = ARTIFACTS.map((_, i) => {
      const f = 1 - smoothstep(0.28, 0.8, Math.abs(tr - artifactTrack(i)));
      // The overview (track 6) shows the whole exhibition; afterwards only the
      // artifact in focus is fully lit, so neighbours never compete with copy.
      const overview = 1 - smoothstep(6.05, 6.4, tr);
      return presence * Math.max(0.1 + 0.9 * f, 0.75 * overview);
    });
    r.groups.forEach((g, i) => {
      g.visible = level[i] > 0.01;
      r.lit[i].forEach((l) => (l.mat.uniforms.uIntensity.value = l.base * level[i]));
    });

    // Signal: grows ahead of the visitor, from Expression to the nexus.
    r.signalMat.uniforms.uReveal.value = Math.min(1.001, smoothstep(5.75, 9.7, tr) * 1.08);
    r.signalMat.uniforms.uTime.value = t;
    r.signalMat.uniforms.uIntensity.value = presence * 0.95;

    // WiniOS: packets cross both ways; a sent packet flares through the TLS ring.
    r.bridgeMat.uniforms.uTime.value = t;
    const sinceSend = (performance.now() - story.universe.bridgeAt) / 1000;
    const sending = sinceSend >= 0 && sinceSend < 1.8;
    r.packets.forEach((p, k) => {
      const u = (t * 0.22 + k / 3) % 1;
      r.bridgeCurve.getPoint(k % 2 ? 1 - u : u, p.position);
      faceCamera(p, cam.quaternion);
      r.packetMats[k].uniforms.uIntensity.value = level[0] * Math.sin(Math.PI * u) * (reduced ? 0.5 : 1);
    });
    const su = Math.min(1, sinceSend / 1.4);
    r.bridgeCurve.getPoint(su, r.burst.position);
    faceCamera(r.burst, cam.quaternion);
    r.burstMat.uniforms.uIntensity.value = sending ? level[0] * 1.6 * Math.sin(Math.PI * su) : 0;
    r.ringMat.uniforms.uIntensity.value = level[0] * (0.9 + (sending ? 1.4 * Math.exp(-Math.pow((su - 0.5) * 6, 2)) : 0));

    // JobSeek: the route lights edge by edge, then the match glows.
    const cyc = reduced ? r.route.length - 1 : ((t * 0.9) % (r.route.length + 1.2));
    const arr = r.eLit.array as Float32Array;
    r.routeEdge.forEach((k, idx) => {
      const val = k < 0 ? 0 : Math.min(1, Math.max(0, cyc - k));
      arr[idx * 2] = arr[idx * 2 + 1] = val;
    });
    r.eLit.needsUpdate = true;
    const seg = Math.min(r.route.length - 2, Math.floor(cyc));
    const sf = Math.min(1, Math.max(0, cyc - seg));
    tmp.p.copy(r.nodes[r.route[seg]]).lerp(r.nodes[r.route[seg + 1]], sf);
    r.scout.position.copy(tmp.p);
    faceCamera(r.scout, cam.quaternion);
    r.scoutMat.uniforms.uIntensity.value = level[1] * (cyc < r.route.length - 1 ? 1 : 0);

    // IRIS: the scan line passes; fields lift off the page into a column.
    const phase = reduced ? 0.8 : (t / 4.5) % 1;
    const scan = 1.05 - phase * 1.15;
    r.paperMat.uniforms.uScan.value = scan;
    const fade = 1 - smoothstep(0.86, 1, phase);
    r.fields.forEach((f, k) => {
      const row = r.fieldRows[k];
      const u = smoothstep(0, 1, Math.min(1, Math.max(0, (row - scan) / 0.22)));
      tmp.a.set(-0.95, (row - 0.5) * 2.2, 0.1);
      tmp.b.set(1.05, 0.8 - k * 0.4, 0.35);
      f.position.copy(tmp.a).lerp(tmp.b, u);
      f.scale.set(0.5 + 0.5 * u, 1, 1);
      f.visible = u > 0.02;
    });
    r.fieldMat.uniforms.uIntensity.value *= fade;
    const total = Math.min(1, Math.max(0, (r.fieldRows[4] - scan) / 0.22));
    r.check.position.set(1.72, 0.8 - 4 * 0.4, 0.4);
    faceCamera(r.check, cam.quaternion);
    r.checkMat.uniforms.uIntensity.value = level[2] * smoothstep(0.7, 1, total) * fade;

    // ELI5: the visitor's toggle relaxes the knot (damped, reversible).
    eli5.m += (story.universe.eli5 - eli5.m) * (1 - Math.exp(-Math.min(dt, 0.1) * (reduced ? 30 : 2.2)));
    r.knotMat.uniforms.uMorph.value = eli5.m;
    r.knotMat.uniforms.uTime.value = t;
    r.e.rotation.set(0.35 * (1 - eli5.m), t * 0.15 * (1 - eli5.m), 0);

    // QP-Gen: pages assemble into sections as the camera arrives (scroll-owned).
    const asm = smoothstep(artifactTrack(4) - 0.45, artifactTrack(4) + 0.02, tr);
    r.sheets.forEach((s, k) => {
      const m = smoothstep(k * 0.08, 0.55 + k * 0.08, asm);
      tmp.a.set(-1.3 + k * 0.03, 0.05 * k, -k * 0.06);
      tmp.b.set(0.9, 1.0 - k * 0.4, 0);
      s.position.copy(tmp.a).lerp(tmp.b, m);
      s.rotation.set(0, 0.45 * (1 - m), 0.08 * (1 - m) * (k % 2 ? 1 : -1));
      s.scale.set(1.15 - 0.05 * m, 1 - 0.78 * m, 1);
    });
    r.frameMat.uniforms.uIntensity.value = level[4] * smoothstep(0.6, 1, asm);

    // Scholaroid: pulses run hub → role and back; the campus turns slowly.
    r.sc.rotation.y = t * 0.12;
    r.pulses.forEach((p, k) => {
      const u = (t * 0.45 + k * 0.25) % 1;
      const w = u < 0.5 ? u * 2 : 2 - u * 2;
      p.position.copy(r.mods[k]).multiplyScalar(w);
      faceCamera(p, cam.quaternion);
      r.pulseMats[k].uniforms.uIntensity.value = level[5] * 0.9;
    });
  });

  return <primitive object={r.root} />;
}
