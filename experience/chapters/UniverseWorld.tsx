"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DoubleSide,
  EdgesGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Line,
  LineSegments,
  Material,
  Mesh,
  Object3D,
  PlaneGeometry,
  QuadraticBezierCurve3,
  Quaternion,
  ShaderMaterial,
  Shape,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { projectStories } from "@/content/projects";
import { story } from "../director/store";
import { glowFragment, glowVertex, signalFragment, signalVertex } from "../shaders/signal";
import {
  bodyFragment,
  lineFragment,
  lineVertex,
  morphLineFragment,
  morphLineVertex,
  panelFragment,
  shellFragment,
  shellVertex,
  uvVertex,
} from "../shaders/universe";
import { smoothstep } from "../world/paths";
import { ARTIFACTS, NEXUS, WINDOW, artifactTrack } from "./layout";
import {
  IRIS_FIELDS,
  QP_CHIPS,
  QP_SLOTS,
  RECEIPT_ROWS,
  ROLES,
  chapterCard,
  eli5Dense,
  eli5Simple,
  examPaper,
  fieldChip,
  jobCard,
  keyboardTexture,
  laptopScreen,
  packetTexture,
  phoneScreen,
  profileCard,
  questionChip,
  receiptTexture,
  redrawWhenFontsReady,
  rolePanel,
  seekBotCard,
  verifiedChip,
} from "./universeTextures";

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
/** A textured surface (screen, card, paper). Drawn after bodies. */
const panel = (tex: CanvasTexture, glowColor = "#73dfff") =>
  new ShaderMaterial({
    vertexShader: uvVertex,
    fragmentShader: panelFragment,
    uniforms: {
      uTexA: { value: tex },
      uTexB: { value: tex },
      uMix: { value: 0 },
      uIntensity: { value: 0 },
      uGlow: { value: 0 },
      uGlowColor: { value: new Color(glowColor) },
      uReveal: { value: 1.1 },
      uScan: { value: -1 },
    },
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
/** Solid device body / plinth: dark satin, coloured rim. */
const body = (base: string, rim: string) =>
  new ShaderMaterial({
    vertexShader: shellVertex,
    fragmentShader: bodyFragment,
    uniforms: { uBase: { value: new Color(base) }, uRim: { value: new Color(rim) }, uIntensity: { value: 0 } },
    transparent: true,
  });

function roundedSlab(w: number, h: number, d: number, r: number) {
  const s = new Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const g = new ExtrudeGeometry(s, { depth: d, bevelEnabled: true, bevelThickness: d * 0.25, bevelSize: d * 0.25, bevelSegments: 3, curveSegments: 6 });
  g.translate(0, 0, -d / 2);
  return g;
}

type Lit = { mat: ShaderMaterial; base: number; panel?: boolean };
type PanelMesh = Mesh<PlaneGeometry, ShaderMaterial>;

/**
 * Project Universe (refinement pass): six original artifacts that show what
 * each project does, threaded by the living signal on its way to the Timeline
 * Nexus. Each artifact is lit by the camera's attention (its own track key)
 * and idles on the clock; scroll stays the only thing that moves the story.
 * Surfaces are canvas textures (universeTextures.ts) with fictional sample
 * data; bodies are simple procedural geometry.
 */
export function UniverseWorld({ lowPower }: { lowPower: boolean }) {
  const r = useMemo(() => {
    const root = new Group();
    const sprite = new PlaneGeometry(1, 1);
    const groups: Group[] = [];
    const lit: Lit[][] = [];
    const add = (i: number, m: ShaderMaterial, base = 1) => lit[i].push({ mat: m, base });
    const mkPanel = (i: number, tex: CanvasTexture, w: number, h: number, glowColor?: string, base = 1) => {
      const m = new Mesh(new PlaneGeometry(w, h), panel(tex, glowColor)) as PanelMesh;
      m.renderOrder = 3;
      lit[i].push({ mat: m.material, base, panel: true });
      return m;
    };

    ARTIFACTS.forEach((a) => {
      const g = new Group();
      g.position.copy(a.pos);
      g.scale.setScalar(a.scale);
      root.add(g);
      groups.push(g);
      lit.push([]);
    });
    // Projection rings: a horizontal light plane that sweeps up through an
    // artifact as it materialises and back down as it leaves. Children of the
    // artifact's group, so they share its visibility gate.
    const ringGeo = new TorusGeometry(1, 0.012, 6, 128);
    const projectors = ARTIFACTS.map((a, i) => {
      const accent = projectStories.find((p) => p.id === a.id)?.accent ?? "#73dfff";
      const mat = shell(accent, 0.0);
      const ringA = new Mesh(ringGeo, mat);
      const ringB = new Mesh(ringGeo, mat);
      ringA.rotation.x = ringB.rotation.x = Math.PI / 2;
      ringB.scale.setScalar(0.72);
      const halo = new Mesh(sprite, glow(accent));
      halo.rotation.x = -Math.PI / 2;
      const rig = new Group();
      rig.add(ringA, ringB, halo);
      rig.scale.setScalar(2.7);
      groups[i].add(rig);
      return { rig, mat, halo: halo.material as ShaderMaterial };
    });

    /* ── 0 · WiniOS, The Bridge: a laptop and a phone joined by a private, sealed current. ── */
    const w = groups[0];
    const deviceBody = body("#141a2e", "#73dfff");
    const phoneBody = body("#18142c", "#b9a6ff");
    add(0, deviceBody);
    add(0, phoneBody);
    // Laptop: base with keyboard, hinged lid with the WiniOS settings on screen.
    const laptop = new Group();
    laptop.position.set(-1.45, -0.05, 0);
    laptop.rotation.y = 0.34;
    const base = new Mesh(roundedSlab(2.3, 1.5, 0.07, 0.08), deviceBody);
    base.rotation.x = -Math.PI / 2;
    base.position.y = -0.75;
    const keys = mkPanel(0, keyboardTexture(), 2.12, 1.32, "#73dfff", 0.9);
    keys.rotation.x = -Math.PI / 2;
    keys.position.set(0, -0.69, 0.02);
    const hinge = new Group();
    hinge.position.set(0, -0.72, -0.72);
    hinge.rotation.x = -0.16;
    const lid = new Mesh(roundedSlab(2.3, 1.48, 0.05, 0.08), deviceBody);
    lid.position.y = 0.74;
    const pcIdle = laptopScreen("idle");
    const pcSending = laptopScreen("sending");
    const pcReceived = laptopScreen("received");
    const pcScreen = mkPanel(0, pcIdle, 2.16, 1.35, "#73dfff");
    pcScreen.position.set(0, 0.75, 0.052);
    hinge.add(lid, pcScreen);
    laptop.add(base, keys, hinge);
    // Phone: rounded body, island, a Shortcuts-style screen.
    const phone = new Group();
    phone.position.set(1.95, -0.12, 0.25);
    phone.rotation.set(0.04, -0.4, 0.02);
    const pBody = new Mesh(roundedSlab(0.76, 1.56, 0.07, 0.12), phoneBody);
    const phIdle = phoneScreen("idle");
    const phSending = phoneScreen("sending");
    const phReceived = phoneScreen("received");
    const phScreen = mkPanel(0, phIdle, 0.7, 1.45, "#b9a6ff");
    phScreen.position.z = 0.066;
    phone.add(pBody, phScreen);
    // The bridge: an arched current through a TLS ring.
    const bridgeCurve = new QuadraticBezierCurve3(v(-0.5, 0.55, -0.05), v(0.35, 2.05, 0.45), v(1.8, 0.55, 0.32));
    const bridgeMat = current("#73dfff", "#b9a6ff", 2.4);
    const bridge = new Mesh(new TubeGeometry(bridgeCurve, 72, 0.026, 8, false), bridgeMat);
    const bridgeHalo = new Mesh(new TubeGeometry(bridgeCurve, 72, 0.075, 8, false), current("#2a6aa8", "#4a3b8a", 1.2));
    add(0, bridgeMat, 1.1);
    add(0, bridgeHalo.material as ShaderMaterial, 0.35);
    const ringMat = shell("#73dfff", 0.05);
    const ring = new Mesh(new TorusGeometry(0.3, 0.012, 8, 64), ringMat);
    const ring2 = new Mesh(new TorusGeometry(0.38, 0.006, 6, 64), ringMat);
    const mid = bridgeCurve.getPoint(0.5);
    ring.position.copy(mid);
    ring.lookAt(mid.clone().add(bridgeCurve.getTangent(0.5)));
    ring2.position.copy(mid);
    ring2.quaternion.copy(ring.quaternion);
    // Ambient packets keep the link visibly alive in both directions.
    const ambientMats = [glow("#bff4ff"), glow("#d9ccff"), glow("#bff4ff"), glow("#d9ccff")];
    const ambient = ambientMats.map((m) => {
      const p = new Mesh(sprite, m);
      p.scale.setScalar(0.22);
      return p;
    });
    // The sent packet: a sealed clipboard card (text or image).
    const packetText = packetTexture("text");
    const packetImage = packetTexture("image");
    const packet = mkPanel(0, packetText, 0.62, 0.36, "#bff4ff", 0);
    const packetGlowMat = glow("#bff4ff");
    const packetGlow = new Mesh(sprite, packetGlowMat);
    // Acknowledgement ripple at the receiving device.
    const ackMat = shell("#7cf5c4", 0.0);
    const ack = new Mesh(new TorusGeometry(0.5, 0.012, 6, 64), ackMat);
    w.add(laptop, phone, bridgeHalo, bridge, ring, ring2, packetGlow, packet, ack, ...ambient);

    /* ── 1 · JobSeek, The Navigator: a profile, openings, matching lines and SeekBot. ── */
    const j = groups[1];
    const profile = mkPanel(1, profileCard(), 1.25, 1.56, "#ffc861");
    profile.position.set(-1.75, -0.1, 0.2);
    profile.rotation.y = 0.22;
    const jobTitles = ["Frontend Engineer", "Backend Developer", "Data Analyst", "ML Intern"];
    const jobPos = [v(0.85, 1.2, -0.3), v(1.5, 0.3, 0.05), v(0.95, -0.6, 0.2), v(1.7, -1.45, -0.2)];
    const matchIdx = 1;
    const matchOn = jobCard(jobTitles[matchIdx], "match");
    const jobs = jobTitles.map((t, k) => {
      const m = mkPanel(1, jobCard(t, "open"), 1.3, 0.65, "#ffc861");
      m.position.copy(jobPos[k]);
      m.rotation.y = -0.18;
      if (k === matchIdx) m.material.uniforms.uTexB.value = matchOn;
      j.add(m);
      return m;
    });
    // Matching lines: profile edge → each opening.
    const from = v(-1.08, 0.05, 0.38);
    const mGeo = new BufferGeometry();
    mGeo.setAttribute("position", new Float32BufferAttribute(jobPos.flatMap((p) => [...from.toArray(), p.x - 0.64, p.y, p.z]), 3));
    const mLit = new Float32BufferAttribute(new Float32Array(jobPos.length * 2), 1);
    mGeo.setAttribute("aLit", mLit);
    const mMat = lines("#ffd98a", "#ffc861");
    add(1, mMat, 1);
    const scoutMat = glow("#ffe2a0");
    const scout = new Mesh(sprite, scoutMat);
    scout.scale.setScalar(0.3);
    // SeekBot: a small agent orb that reads the profile and answers.
    const botMat = shell("#fff1c9", 0.35);
    const bot = new Mesh(new TorusGeometry(0.13, 0.04, 10, 32), botMat);
    bot.position.set(-0.95, 1.05, 0.45);
    const botCoreMat = glow("#ffe2a0");
    const botCore = new Mesh(sprite, botCoreMat);
    botCore.scale.setScalar(0.5);
    botCore.position.copy(bot.position);
    add(1, botMat, 1);
    const botCard = mkPanel(1, seekBotCard(), 1.1, 0.645, "#fff1c9", 0);
    botCard.position.set(-0.45, 1.75, 0.3);
    j.add(profile, new LineSegments(mGeo, mMat), scout, bot, botCore, botCard);
    j.rotation.set(-0.12, 0.12, 0);

    /* ── 2 · IRIS, The Vision: receipt → OCR scan → fields → validated record. ── */
    const ir = groups[2];
    const receipt = mkPanel(2, receiptTexture(), 1.2, 2.1, "#8ff0d0");
    receipt.position.set(-1.0, 0, 0);
    receipt.rotation.y = 0.24;
    const scanBarMat = glow("#bfffe9");
    const scanBar = new Mesh(sprite, scanBarMat);
    scanBar.scale.set(1.7, 0.12, 1);
    receipt.add(scanBar);
    const fields = IRIS_FIELDS.map(([k, val]) => {
      const m = mkPanel(2, fieldChip(k, val), 1.1, 0.223, "#8ff0d0", 0);
      ir.add(m);
      return m;
    });
    const rowUv = [RECEIPT_ROWS.vendor, RECEIPT_ROWS.date, RECEIPT_ROWS.items, RECEIPT_ROWS.tax, RECEIPT_ROWS.total];
    const recordMat = lines("#8ff0d0", "#bfffe9");
    const recordGeo = new EdgesGeometry(new BoxGeometry(1.3, 1.62, 0.01));
    recordGeo.setAttribute("aLit", new Float32BufferAttribute(new Float32Array(recordGeo.attributes.position.count).fill(1), 1));
    const record = new LineSegments(recordGeo, recordMat);
    record.position.set(1.15, 0.12, 0.3);
    const verified = mkPanel(2, verifiedChip(), 1.1, 0.223, "#8ff0d0", 0);
    verified.position.set(1.15, -0.95, 0.35);
    ir.add(receipt, record, verified);

    /* ── 3 · ELI5, The Translator: a knot of dense text relaxes into one clear loop. ── */
    const e = groups[3];
    const knotGroup = new Group();
    knotGroup.position.set(0, 0.55, 0);
    knotGroup.scale.setScalar(0.78);
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
    const knot2 = new Line(kGeo, knotMat);
    knot2.scale.setScalar(1.012);
    knotGroup.add(knot, knot2);
    add(3, knotMat, 1.2);
    const eliText = mkPanel(3, eli5Dense(), 3.0, 1.125, "#c9b8ff");
    eliText.material.uniforms.uTexB.value = eli5Simple();
    eliText.position.set(0, -1.25, 0.3);
    e.add(knotGroup, eliText);

    /* ── 4 · QP-Gen, The Architect: chapters → question modules → a structured exam paper. ── */
    const q = groups[4];
    const chapters = ["Light", "Human Eye", "Electricity"].map((c, k) => {
      const m = mkPanel(4, chapterCard(`Ch. ${10 + k} · ${c}`, k === 0), 1.0, 0.39, "#9db8ff");
      m.position.set(-1.75, 0.75 - k * 0.5, 0.1);
      m.rotation.y = 0.25;
      q.add(m);
      return m;
    });
    const paper = mkPanel(4, examPaper(), 1.65, 2.2, "#9db8ff");
    paper.position.set(0.75, 0, 0);
    paper.rotation.y = -0.12;
    const qChips = QP_CHIPS.map((c) => {
      const m = mkPanel(4, questionChip(c), 0.82, 0.154, "#9db8ff", 0);
      q.add(m);
      return m;
    });
    q.add(paper);

    /* ── 5 · Scholaroid, The Ecosystem: one school, four role dashboards, linked. ── */
    const sc = groups[5];
    const schoolBody = body("#2a1a14", "#ffaa6a");
    add(5, schoolBody);
    const sShape = new Shape();
    sShape.moveTo(-0.6, -0.4);
    sShape.lineTo(0.6, -0.4);
    sShape.lineTo(0.6, 0.15);
    sShape.lineTo(0, 0.5);
    sShape.lineTo(-0.6, 0.15);
    sShape.lineTo(-0.6, -0.4);
    const school = new Mesh(new ExtrudeGeometry(sShape, { depth: 0.5, bevelEnabled: false }), schoolBody);
    school.position.set(0, 0.0, -0.25);
    const doorMat = glow("#ffd2b0");
    const door = new Mesh(sprite, doorMat);
    door.scale.set(0.3, 0.45, 1);
    door.position.set(0, -0.2, 0.27);
    const plinth = new Mesh(new CylinderGeometry(2.3, 2.38, 0.06, 64, 1), body("#120b09", "#6a3f24"));
    plinth.position.y = -0.48;
    add(5, plinth.material as ShaderMaterial, 0.85);
    const ringLineMat = shell("#ffaa6a", 0.1);
    const campusRing = new Mesh(new TorusGeometry(1.95, 0.012, 6, 96), ringLineMat);
    campusRing.rotation.x = Math.PI / 2;
    campusRing.position.y = -0.42;
    add(5, ringLineMat, 1);
    const mods: Vector3[] = [];
    const arcs: QuadraticBezierCurve3[] = [];
    const arcMats: ShaderMaterial[] = [];
    const rolePanels = ROLES.map((role, k) => {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
      const p = v(Math.cos(a) * 1.95, 0.4, Math.sin(a) * 1.95);
      mods.push(p);
      const pad = new Mesh(new CylinderGeometry(0.3, 0.34, 0.08, 32), schoolBody);
      pad.position.set(p.x, -0.38, p.z);
      sc.add(pad);
      const m = mkPanel(5, rolePanel(role), 1.3, 0.853, role.color);
      m.position.copy(p);
      sc.add(m);
      const curve = new QuadraticBezierCurve3(v(0, 0.35, 0), v(p.x * 0.5, 1.05, p.z * 0.5), v(p.x, 0.0, p.z));
      arcs.push(curve);
      const mat = current("#ffaa6a", role.color, 1.6);
      arcMats.push(mat);
      add(5, mat, 0.9);
      sc.add(new Mesh(new TubeGeometry(curve, 40, 0.016, 6, false), mat));
      return m;
    });
    // Cross-role flows: teacher → parent (messages), admin → student (announcements).
    const cross = [
      new QuadraticBezierCurve3(mods[1], v(0, 1.2, 0).add(mods[1]).add(mods[3]).multiplyScalar(0.5), mods[3]),
      new QuadraticBezierCurve3(mods[0], v(0, 1.4, 0).add(mods[0]).add(mods[2]).multiplyScalar(0.5), mods[2]),
    ];
    const pulseMats = [...arcs, ...cross].map(() => glow("#ffd9bd"));
    const pulses = pulseMats.map((m) => {
      const p = new Mesh(sprite, m);
      p.scale.setScalar(0.24);
      sc.add(p);
      return p;
    });
    sc.add(plinth, campusRing, school, door);
    sc.rotation.x = 0.12;

    /* ── The living signal, reborn: it leaves the Intelligence network, threads every artifact, runs on to the Nexus. ── */
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

    redrawWhenFontsReady();
    root.visible = false;
    return {
      root, groups, lit, projectors,
      // WiniOS
      laptop, phone, pcScreen, phScreen, pcIdle, pcSending, pcReceived, phIdle, phSending, phReceived,
      bridgeCurve, bridgeMat, bridgeHalo, ringMat, ring, ring2, ambient, ambientMats, packet, packetText, packetImage,
      packetGlow, packetGlowMat, ack, ackMat,
      // JobSeek
      jobs, jobPos, matchIdx, mLit, scout, scoutMat, from, bot, botCoreMat, botCore, botCard,
      // IRIS
      receipt, scanBar, scanBarMat, fields, rowUv, recordMat, verified,
      // ELI5
      knotMat, knotGroup, eliText,
      // QP-Gen
      chapters, paper, qChips,
      // Scholaroid
      sc, rolePanels, arcs, cross, pulses, pulseMats, doorMat, arcMats,
      signalMat,
    };
  }, [lowPower]);

  useEffect(
    () => () => {
      r.root.traverse((o) => {
        const m = o as Mesh;
        m.geometry?.dispose();
        const mat = m.material as (Material & { uniforms?: Record<string, { value: unknown }> }) | undefined;
        if (mat?.uniforms) {
          Object.values(mat.uniforms).forEach((u) => (u.value as { isTexture?: boolean; dispose?: () => void })?.isTexture && (u.value as CanvasTexture).dispose());
        }
        mat?.dispose?.();
      });
    },
    [r],
  );

  const tmp = useMemo(() => ({ p: new Vector3(), a: new Vector3(), b: new Vector3(), w: new Vector3() }), []);
  const damp = useMemo(() => ({ eli5: 0, pcMix: 0, phMix: 0, match: 0 }), []);

  useFrame((state, dt) => {
    const tr = story.view.track;
    const inside = tr > WINDOW.universe[0] && tr < WINDOW.universe[1];
    r.root.visible = inside;
    if (!inside) return;
    const reduced = story.reducedMotion;
    const t = reduced ? 0 : state.clock.elapsedTime;
    const presence = smoothstep(5.7, 6.15, tr) * (1 - smoothstep(9.35, 9.9, tr));
    // The establishing shot (6.0) shows only the environment and a restrained signal.
    const signalLevel = presence * (0.45 + 0.55 * smoothstep(6.1, 6.5, tr));
    const cam = state.camera;
    const k = (rate: number) => 1 - Math.exp(-Math.min(dt, 0.1) * (reduced ? 40 : rate));

    // Case-study transition: the chosen artifact stays lit, the rest of the
    // universe recedes (story.universe.caseFocus / caseAmt, Pass C).
    const caseAmt = story.universe.caseAmt;
    const caseFocus = story.universe.caseFocus;

    // Progressive reveal (2026-11-14): each artifact exists only around its own
    // track key. It materialises (rises, assembles, a projection plane sweeps
    // up and its screens draw on top-down), holds while its exhibit is read,
    // then deconstructs (lifts, scatters its light, the plane sweeps down)
    // just before the next one begins. Pure functions of the track, so every
    // state reverses exactly. The case-study focus overrides for its artifact.
    const enter = ARTIFACTS.map((_, i) => smoothstep(artifactTrack(i) - 0.3, artifactTrack(i) - 0.06, tr));
    const exit = ARTIFACTS.map((_, i) => smoothstep(artifactTrack(i) + 0.08, artifactTrack(i) + 0.3, tr));
    const level = ARTIFACTS.map((_, i) => {
      const l = enter[i] * (1 - exit[i]);
      return caseFocus === i ? Math.max(l, caseAmt) : l * (1 - caseAmt);
    });
    // Portrait screens: recompose a little smaller so artifacts clear the copy.
    const aspect = (cam as { aspect?: number }).aspect ?? 1.6;
    const fit = aspect < 0.8 ? 0.9 : 1;
    r.groups.forEach((g, i) => {
      const on = level[i] > 0.003;
      // Real visibility, not just zero opacity: hidden groups are not drawn.
      g.visible = on;
      if (!on) return;
      const held = caseFocus === i ? caseAmt : 0;
      const e = Math.max(enter[i], held);
      const x = exit[i] * (1 - held);
      const ee = 1 - Math.pow(1 - e, 3);
      const a = ARTIFACTS[i];
      g.scale.setScalar(a.scale * fit * (0.84 + 0.16 * ee) * (1 + 0.07 * x));
      g.position.set(a.pos.x, a.pos.y - (1 - ee) * 1.2 * a.scale + x * 0.8 * a.scale, a.pos.z);
      g.rotation.set(0, (1 - ee) * 0.5 - x * 0.35, 0);
      // Surfaces fade faster than light, so a leaving artifact never competes with copy.
      r.lit[i].forEach((l) => {
        l.mat.uniforms.uIntensity.value = l.base * (l.panel ? level[i] * level[i] : level[i]);
        // Screens and cards draw on top-down as the artifact assembles.
        if (l.panel && l.mat !== r.paper.material) l.mat.uniforms.uReveal.value = -0.05 + 1.16 * smoothstep(0.25, 1, e);
      });
      // Projection plane: up through the artifact on arrival, down on departure.
      const pr = r.projectors[i];
      const sweepIn = e < 1 ? e : 0;
      const pulse = Math.sin(Math.PI * Math.min(1, sweepIn)) + Math.sin(Math.PI * x);
      pr.rig.position.y = x > 0 ? 0.75 - x * 0.75 * 2.1 : -0.75 + e * 0.75 * 2.1;
      pr.rig.rotation.y = t * 0.3;
      pr.mat.uniforms.uIntensity.value = pulse * 1.1;
      pr.halo.uniforms.uIntensity.value = pulse * 0.35;
    });

    r.signalMat.uniforms.uReveal.value = Math.min(1.001, smoothstep(5.75, 9.7, tr) * 1.08);
    r.signalMat.uniforms.uTime.value = t;
    r.signalMat.uniforms.uIntensity.value = signalLevel * 0.95 * (1 - caseAmt * 0.85);

    /* WiniOS: source activates → packet leaves → sealed bridge → destination receives and acknowledges. */
    if (level[0] > 0.003) {
      const L0 = level[0];
      r.bridgeMat.uniforms.uTime.value = t;
      (r.bridgeHalo.material as ShaderMaterial).uniforms.uTime.value = t;
      r.ring.rotation.z = t * 0.6;
      r.ring2.rotation.z = -t * 0.4;
      r.ambient.forEach((p, i) => {
        const u = (t * 0.2 + i / 4) % 1;
        r.bridgeCurve.getPoint(i % 2 ? 1 - u : u, p.position);
        faceCamera(p, cam.quaternion);
        r.ambientMats[i].uniforms.uIntensity.value = L0 * Math.sin(Math.PI * u) * 0.55;
      });
      const s = (performance.now() - story.universe.bridgeAt) / 1000;
      const dir = story.universe.bridgeDir; // 1: PC → iPhone, -1: iPhone → PC
      const toPhone = dir > 0;
      const active = s >= 0 && s < 6;
      const travel = reduced ? (s > 0.2 ? 1 : 0) : smoothstep(0.35, 1.6, s);
      const srcOn = active ? smoothstep(0, 0.25, s) * (1 - smoothstep(1.4, 1.9, s)) : 0;
      const dstOn = active ? smoothstep(1.5, 1.8, s) * (1 - smoothstep(4.6, 5.6, s)) : 0;
      // Screens: crossfade toward the state; the texture B slot holds the state.
      const pcState = toPhone ? (srcOn > 0.01 ? r.pcSending : null) : dstOn > 0.01 ? r.pcReceived : null;
      const phState = toPhone ? (dstOn > 0.01 ? r.phReceived : null) : srcOn > 0.01 ? r.phSending : null;
      if (pcState) r.pcScreen.material.uniforms.uTexB.value = pcState;
      if (phState) r.phScreen.material.uniforms.uTexB.value = phState;
      damp.pcMix += ((pcState ? 1 : 0) - damp.pcMix) * k(8);
      damp.phMix += ((phState ? 1 : 0) - damp.phMix) * k(8);
      r.pcScreen.material.uniforms.uMix.value = damp.pcMix;
      r.phScreen.material.uniforms.uMix.value = damp.phMix;
      r.pcScreen.material.uniforms.uGlow.value = toPhone ? srcOn : dstOn;
      r.phScreen.material.uniforms.uGlow.value = toPhone ? dstOn : srcOn;
      // Packet card along the bridge.
      const inFlight = active && s > 0.3 && s < 1.75;
      r.packet.material.uniforms.uTexA.value = story.universe.bridgeCount % 2 ? r.packetImage : r.packetText;
      r.bridgeCurve.getPoint(toPhone ? travel : 1 - travel, r.packet.position);
      r.packet.position.y += 0.22;
      r.packetGlow.position.copy(r.packet.position);
      faceCamera(r.packet, cam.quaternion);
      faceCamera(r.packetGlow, cam.quaternion);
      const pv = inFlight ? smoothstep(0.3, 0.45, s) * (1 - smoothstep(1.55, 1.75, s)) : 0;
      r.packet.material.uniforms.uIntensity.value = L0 * pv;
      r.packetGlow.scale.setScalar(0.9 + 0.3 * pv);
      r.packetGlowMat.uniforms.uIntensity.value = L0 * pv * 0.9;
      const throughRing = active ? Math.exp(-Math.pow((travel - 0.5) * 7, 2)) * pv : 0;
      r.ringMat.uniforms.uIntensity.value = L0 * (0.85 + 1.6 * throughRing);
      r.bridgeMat.uniforms.uIntensity.value = L0 * (1.1 + 0.8 * pv);
      // Acknowledgement ripple at the destination screen.
      const dst = toPhone ? r.phScreen : r.pcScreen;
      dst.getWorldPosition(tmp.w);
      r.ack.position.copy(r.groups[0].worldToLocal(tmp.w));
      faceCamera(r.ack, cam.quaternion);
      const ap = active ? Math.min(1, Math.max(0, (s - 1.55) / 0.9)) : 1;
      r.ack.scale.setScalar(0.4 + ap * (toPhone ? 1.1 : 1.8));
      r.ackMat.uniforms.uIntensity.value = L0 * (active && ap < 1 ? (1 - ap) * 1.4 : 0);
    }

    /* JobSeek: matching lines sweep the openings, settle on the match; SeekBot answers. */
    if (level[1] > 0.003) {
      const L1 = level[1];
      const cyc = reduced ? 9 : (t * 0.55) % 7;
      const arr = r.mLit.array as Float32Array;
      r.jobPos.forEach((_, i) => {
        const scan = Math.max(0, 1 - Math.abs(cyc - i * 0.8) * 1.4);
        const locked = cyc > 3.6 && i === r.matchIdx ? 1 : 0;
        arr[i * 2] = arr[i * 2 + 1] = Math.max(scan * 0.8, locked);
      });
      r.mLit.needsUpdate = true;
      const matched = cyc > 3.6 ? 1 : 0;
      damp.match += (matched - damp.match) * k(5);
      const mj = r.jobs[r.matchIdx];
      mj.material.uniforms.uMix.value = damp.match;
      mj.material.uniforms.uGlow.value = damp.match * 0.8;
      mj.scale.setScalar(1 + damp.match * 0.08);
      const target = r.jobPos[Math.min(3, Math.floor(Math.min(cyc, 3.2) / 0.8))];
      tmp.p.copy(r.from).lerp(tmp.a.set(target.x - 0.64, target.y, target.z), (cyc % 0.8) / 0.8);
      if (matched) tmp.p.copy(r.jobPos[r.matchIdx]).add(tmp.a.set(-0.64, 0, 0));
      r.scout.position.copy(tmp.p);
      faceCamera(r.scout, cam.quaternion);
      r.scoutMat.uniforms.uIntensity.value = L1 * (matched ? 0.6 : 1);
      r.bot.rotation.set(t * 0.8, t * 1.1, 0);
      r.bot.position.y = 1.05 + Math.sin(t * 1.3) * 0.06;
      r.botCore.position.y = r.bot.position.y;
      faceCamera(r.botCore, cam.quaternion);
      r.botCoreMat.uniforms.uIntensity.value = L1 * (0.7 + 0.3 * Math.sin(t * 2.4));
      const botShow = reduced ? 1 : smoothstep(4.0, 4.5, cyc) * (1 - smoothstep(6.6, 7, cyc));
      r.botCard.material.uniforms.uIntensity.value = L1 * botShow;
      r.botCard.position.y = 1.75 + (1 - botShow) * -0.12;
    }

    /* IRIS: the OCR plane passes; fields lift into a record; the totals are verified. */
    if (level[2] > 0.003) {
      const L2 = level[2];
      const phase = reduced ? 0.8 : (t / 5) % 1;
      const scan = 1.04 - phase * 1.2;
      r.receipt.material.uniforms.uScan.value = scan;
      r.scanBar.position.set(0, (scan - 0.5) * 2.1, 0.01);
      r.scanBarMat.uniforms.uIntensity.value = L2 * (scan > -0.02 && scan < 1.02 ? 0.9 : 0);
      const fade = 1 - smoothstep(0.9, 1, phase);
      r.fields.forEach((f, i) => {
        const u = smoothstep(0, 1, Math.min(1, Math.max(0, (r.rowUv[i] - scan) / 0.18)));
        tmp.a.set(-1.0, (r.rowUv[i] - 0.5) * 2.1, 0.12);
        tmp.b.set(1.15, 0.72 - i * 0.29, 0.35);
        f.position.copy(tmp.a).lerp(tmp.b, u);
        f.position.z += Math.sin(Math.PI * u) * 0.5;
        f.scale.setScalar(0.6 + 0.4 * u);
        f.material.uniforms.uIntensity.value = L2 * smoothstep(0.02, 0.2, u) * fade;
      });
      const done = smoothstep(0.62, 0.75, phase) * fade;
      r.recordMat.uniforms.uIntensity.value = L2 * (0.25 + 0.75 * done);
      r.verified.material.uniforms.uIntensity.value = L2 * done;
      r.verified.material.uniforms.uGlow.value = done;
    }

    /* ELI5: the visitor's toggle relaxes the knot and simplifies the text (damped, reversible). */
    if (level[3] > 0.003) {
      damp.eli5 += (story.universe.eli5 - damp.eli5) * k(2.2);
      r.knotMat.uniforms.uMorph.value = damp.eli5;
      r.knotMat.uniforms.uTime.value = t;
      r.knotGroup.rotation.set(0.35 * (1 - damp.eli5), t * 0.15 * (1 - damp.eli5), 0);
      r.eliText.material.uniforms.uMix.value = smoothstep(0.25, 0.85, damp.eli5);
      r.eliText.material.uniforms.uGlow.value = Math.sin(Math.PI * damp.eli5) * 0.8;
    }

    /* QP-Gen: chapter chosen → question modules flow in → the paper builds section by section (scroll-owned). */
    if (level[4] > 0.003) {
      const asm = smoothstep(artifactTrack(4) - 0.45, artifactTrack(4) + 0.02, tr);
      r.chapters.forEach((c, i) => (c.material.uniforms.uGlow.value = i === 0 ? 0.6 + 0.4 * smoothstep(0, 0.2, asm) : 0));
      r.paper.material.uniforms.uReveal.value = 0.22 + asm * 0.9;
      r.qChips.forEach((c, i) => {
        const m = smoothstep(0.1 + i * 0.1, 0.45 + i * 0.1, asm);
        tmp.a.set(-1.25, 0.75, 0.25);
        tmp.b.set(0.75, (r.paper.material.uniforms.uReveal.value > 0 ? (QP_SLOTS[i] - 0.5) * 2.2 : 0), 0.08);
        c.position.copy(tmp.a).lerp(tmp.b, m);
        c.position.z += Math.sin(Math.PI * m) * 0.45;
        c.rotation.y = -0.12 * m + 0.25 * (1 - m);
        c.material.uniforms.uIntensity.value = level[4] * smoothstep(0.0, 0.08, m) * (1 - smoothstep(0.85, 1, m));
      });
    }

    /* Scholaroid: the campus turns slowly; information moves hub ↔ roles and between roles. */
    if (level[5] > 0.003) {
      const L5 = level[5];
      r.sc.rotation.y = 0.35 + t * 0.08;
      r.rolePanels.forEach((p) => faceCamera(p, cam.quaternion));
      r.arcMats.forEach((m) => (m.uniforms.uTime.value = t));
      r.doorMat.uniforms.uIntensity.value = L5 * 0.8;
      const curves = [...r.arcs, ...r.cross];
      r.pulses.forEach((p, i) => {
        const u = (t * 0.32 + i * 0.17) % 1;
        const back = i < 4 && Math.floor(t * 0.32 + i * 0.17) % 2 === 1;
        curves[i].getPoint(back ? 1 - u : u, p.position);
        faceCamera(p, cam.quaternion);
        r.pulseMats[i].uniforms.uIntensity.value = L5 * Math.sin(Math.PI * u) * 0.95;
      });
    }
  });

  return <primitive object={r.root} />;
}
