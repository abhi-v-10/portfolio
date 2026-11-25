"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  CatmullRomCurve3,
  Color,
  CustomBlending,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  OneFactor,
  OneMinusSrcAlphaFactor,
  PlaneGeometry,
  PointLight,
  Texture,
  RingGeometry,
  TubeGeometry,
  ShaderMaterial,
  Vector2,
  Vector3,
} from "three";
import { galleryPhotos } from "@/content/gallery";
import { AUTOPLAY_MS, autoplayDue, gallery, galleryActionDone, galleryStep, holdAutoplay } from "../director/gallery";
import { story } from "../director/store";
import { frameFragment, frameVertex } from "../shaders/chapters";
import { glowFragment, glowVertex } from "../shaders/signal";
import { smoothstep } from "../world/paths";
import { GALLERY, WINDOW } from "./layout";
import { PBR } from "../world/materials";
import { alongX, alongZ, boltCircle, contactShadow, flange, housing, softRectShadow, turned } from "../world/parts";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const N = galleryPhotos.length;
const PHOTO_W = 1.6;
const PHOTO_H = 2.0;
const MARGIN = 0.34;

const L1 = 1.2; // upper arm
const L2 = 1.1; // forearm
const HAND = 0.36; // wrist → fingertip
const SHOULDER_Y = 0.5;

/** Fixed simulation step: every spring advances identically at any frame rate. */
const H = 1 / 240;

/** QA hook (like ?webgl=0): `?slowmo=6` stretches the robot's swipe for frame-by-frame review. */
const SLOWMO =
  typeof window === "undefined" ? 1 : Math.max(1, Number(new URLSearchParams(window.location.search).get("slowmo")) || 1);

type Layout = {
  radius: number;
  step: number;
  forward: number;
  robot: Vector3;
  robotScale: number;
  fadeFrom: number;
  fadeTo: number;
};
const DESK: Layout = { radius: 4.8, step: 0.36, forward: 0.6, robot: new Vector3(2.3, -2.15, 1.6), robotScale: 1.2, fadeFrom: 1.55, fadeTo: 2.05 };
const MOBILE: Layout = { radius: 3.4, step: 0.46, forward: 0.45, robot: new Vector3(1.8, -2.55, 1.15), robotScale: 0.8, fadeFrom: 1.05, fadeTo: 1.45 };

const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const wrap = (r: number) => {
  let v = ((r % N) + N) % N;
  if (v >= N / 2) v -= N;
  return v;
};

type Spring = { x: number; v: number };
type Action = NonNullable<(typeof gallery)["action"]>;
const sp = (x = 0): Spring => ({ x, v: 0 });
/** Semi-implicit spring step (stable at H for these stiffnesses). zeta < 1 overshoots. */
function stepSpring(s: Spring, target: number, w: number, zeta: number) {
  s.v += (-w * w * (s.x - target) - 2 * zeta * w * s.v) * H;
  s.x += s.v * H;
}

/** Frame staging on an arc: neighbours fan out, turn in, drop and recede. */
function frameAt(r: number, L: Layout, out: { p: Vector3; rotY: number; s: number; focus: number; vis: number }) {
  const a = Math.abs(r);
  const th = r * L.step;
  const f = 1 - smooth(Math.min(a, 1));
  out.p.set(L.radius * Math.sin(th), -0.12 * a * a + 0.05 * f, L.radius * (Math.cos(th) - 1) + L.forward * f - a * 0.12);
  out.rotY = -th * 0.85;
  out.s = (1 - Math.min(a, 2) * 0.11) * (1 + 0.05 * f);
  out.focus = f;
  out.vis = 1 - smoothstep(L.fadeFrom, L.fadeTo, a);
  return out;
}

type Plan = {
  curve: CatmullRomCurve3;
  times: number[];
  contactT: number;
  releaseT: number;
  hesitate: [number, number] | null;
  contactX: number;
  travel: number;
  dur: number;
};

/**
 * Meet the Human: a spatial photo gallery operated by a small articulated
 * robot assistant. Scroll only reveals and dismisses it. Steps (manual or
 * autoplay) are planned as one continuous hand path; the card is moved by the
 * robot's actual fingertip while in contact, then glides on with its own
 * momentum and a slight overshoot. Everything runs on a fixed-step clock.
 */
export function HumanWorld({ lowPower }: { lowPower: boolean }) {
  const root = useRef<Group>(null);
  const frames = useRef<(Mesh | null)[]>([]);
  const halo = useRef<Mesh>(null);
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const keyLight = useRef<PointLight>(null);
  const fillLight = useRef<PointLight>(null);
  const compact = size.width / Math.max(1, size.height) < 0.95;
  const L = compact ? MOBILE : DESK;
  const simple = compact || lowPower;

  const turret = useRef<Group>(null);
  const shoulder = useRef<Group>(null);
  const elbow = useRef<Group>(null);
  const wrist = useRef<Group>(null);
  const head = useRef<Group>(null);
  const fingerL = useRef<Mesh>(null);
  const fingerR = useRef<Mesh>(null);
  const robot = useRef<Group>(null);
  const robotKey = useRef<PointLight>(null);
  const robotRim = useRef<PointLight>(null);

  const r = useMemo(() => {
    const planeW = PHOTO_W + MARGIN * 2;
    const planeH = PHOTO_H + MARGIN * 2;
    const frameGeo = new PlaneGeometry(planeW, planeH);
    const mats = galleryPhotos.map((photo) => {
      const crop = new Vector2(1, 1);
      const mat = new ShaderMaterial({
        vertexShader: frameVertex,
        fragmentShader: frameFragment,
        uniforms: {
          uMap: { value: null },
          uSize: { value: new Vector2(planeW, planeH) },
          uPhoto: { value: new Vector2(PHOTO_W / 2, PHOTO_H / 2) },
          uCrop: { value: crop },
          uFocus: { value: 0 },
          uVis: { value: 0 },
          uReveal: { value: 0 },
          uTime: { value: 0 },
          uEdgeA: { value: new Color("#e6e0d4") }, // matte paper mount
          uEdgeB: { value: new Color(0.772, 0.554, 0.47) },
        },
        transparent: true,
        depthWrite: false,
        blending: CustomBlending,
        blendSrc: OneFactor,
        blendDst: OneMinusSrcAlphaFactor,
      });
      return { mat, crop, photo };
    });

    // Soft back-light behind the active frame (atmospheric depth, not a glow smear).
    const haloGeo = new PlaneGeometry(4.2, 4.6);
    const haloMat = new ShaderMaterial({
      vertexShader: glowVertex,
      fragmentShader: glowFragment,
      uniforms: { uColor: { value: new Color(0.772, 0.554, 0.469) }, uIntensity: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      premultipliedAlpha: true,
    });
    // Projector ring beneath the gallery: where the frames are projected from.
    const ringGeo = new RingGeometry(1.25, 1.29, 96);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new MeshBasicMaterial({ color: new Color(0.82, 0.788, 0.74), transparent: true, blending: AdditiveBlending, depthWrite: false });

    // Robot (rebuilt 2026-11-25): a small industrial arm. Hard-anodised joint
    // housings, brushed aluminium links between chamfered flanges, cap-screw
    // rings on every cover, a parallel gripper with nitrile pads, a camera
    // module with cover glass and one copper status point. Physical materials
    // under the studio HDRI; no glow, no ceramic shell.
    const T = { transparent: true };
    const mat = {
      alu: PBR.aluminium({ ...T, repeat: [3, 1] }),
      ano: PBR.anodised(T),
      steel: PBR.gunmetal(T),
      cu: PBR.copper(T),
      rubber: PBR.rubber(T),
      glass: PBR.glass(T),
      led: PBR.statusLed(T),
      shadow: contactShadow(0.6),
    };
    const jointCap = (rad: number) => alongX(flange(rad, 0.022, 0.006));
    const geo = {
      shadow: new PlaneGeometry(1.5, 1.5).rotateX(-Math.PI / 2),
      foot: flange(0.5, 0.05, 0.012, 64),
      footBolts: boltCircle(8, 0.44, 0.018, 0.012, Math.PI / 8),
      pedestal: turned([[0, 0], [0.36, 0], [0.36, 0.02], [0.31, 0.05], [0.29, 0.16], [0, 0.16]], 64),
      turret: housing(0.27, 0.28, 0.02, 64),
      turretBand: flange(0.274, 0.012, 0.003, 64),
      turretCap: flange(0.24, 0.02, 0.006, 64),
      turretBolts: boltCircle(6, 0.2, 0.014, 0.008),
      shoulder: alongX(housing(0.17, 0.44, 0.016)),
      shoulderCap: jointCap(0.15),
      shoulderBolts: alongX(boltCircle(6, 0.115, 0.011, 0.008)),
      elbow: alongX(housing(0.13, 0.34, 0.012)),
      elbowCap: jointCap(0.115),
      elbowBolts: alongX(boltCircle(6, 0.085, 0.009, 0.007)),
      wrist: alongX(housing(0.09, 0.24, 0.009)),
      wristCap: jointCap(0.08),
      upperTube: alongZ(new CylinderGeometry(0.072, 0.072, L1 - 0.3, 40)).translate(0, 0, L1 / 2),
      upperFlange: alongZ(flange(0.1, 0.035, 0.008)),
      foreTube: alongZ(new CylinderGeometry(0.058, 0.058, L2 - 0.24, 40)).translate(0, 0, L2 / 2),
      foreFlange: alongZ(flange(0.082, 0.03, 0.007)),
      roll: alongZ(housing(0.082, 0.12, 0.008)),
      gripBody: new RoundedBoxGeometry(0.22, 0.11, 0.13, 3, 0.012),
      gripRail: new RoundedBoxGeometry(0.2, 0.018, 0.03, 2, 0.004),
      finger: new RoundedBoxGeometry(0.034, 0.05, 0.16, 2, 0.006),
      pad: new RoundedBoxGeometry(0.008, 0.04, 0.08, 2, 0.003),
      cam: new RoundedBoxGeometry(0.08, 0.05, 0.05, 2, 0.006),
      lens: alongZ(new CylinderGeometry(0.016, 0.018, 0.012, 32)),
      led: new CylinderGeometry(0.005, 0.005, 0.004, 12).rotateX(Math.PI / 2),
      // Cable harness: a sagging service loom along each link, held by clips.
      upperCable: new TubeGeometry(new CatmullRomCurve3([new Vector3(0.1, 0.06, 0.16), new Vector3(0.11, 0.045, L1 * 0.5), new Vector3(0.1, 0.06, L1 - 0.14)]), 24, 0.012, 8, false),
      foreCable: new TubeGeometry(new CatmullRomCurve3([new Vector3(0.085, 0.05, 0.12), new Vector3(0.095, 0.038, L2 * 0.5), new Vector3(0.085, 0.05, L2 - 0.1)]), 24, 0.01, 8, false),
      clip: new RoundedBoxGeometry(0.05, 0.03, 0.03, 2, 0.006),
      seam: alongX(flange(0.172, 0.004, 0.001)),
      seamS: alongX(flange(0.132, 0.004, 0.001)),
    };
    // Each print casts a soft rectangular shadow on the air behind it, offset
    // down and right from the key light: paper with weight, not a projection.
    const printShadowGeo = new PlaneGeometry(planeW * 0.92, planeH * 0.92);
    const printShadows = galleryPhotos.map(() => softRectShadow());
    return { frameGeo, mats, haloGeo, haloMat, ringGeo, ringMat, mat, geo, printShadowGeo, printShadows };
  }, []);

  useEffect(() => {
    let alive = true;
    const created: Texture[] = [];
    import("./galleryTextures").then(({ galleryTexture }) => {
      if (!alive) return;
      r.mats.forEach((m) => {
        const t = galleryTexture(m.photo, ([x, y]) => m.crop.set(x, y));
        m.mat.uniforms.uMap.value = t;
        // Upload now, not on the first frame the gallery is seen.
        if (t.image) gl.initTexture(t);
        created.push(t);
      });
      // Placeholders redraw once webfonts are ready; upload that version up front too.
      document.fonts?.ready.then(() =>
        requestAnimationFrame(() => {
          if (alive) created.forEach((t) => gl.initTexture(t));
        }),
      );
    });
    return () => {
      alive = false;
      created.forEach((t) => t.dispose());
    };
  }, [r, gl]);

  useEffect(() => {
    gallery.live = true;
    gallery.pos = gallery.index;
    gallery.autoplay.lastSettled = performance.now();
    return () => {
      gallery.live = false;
      gallery.action = null;
      holdAutoplay("offscreen", true);
    };
  }, []);

  const sim = useRef({
    acc: 0,
    card: sp(0),
    yaw: sp(-0.6),
    e1: sp(1.0),
    e2: sp(0.2),
    ew: sp(0),
    roll: sp(0),
    look: sp(0),
    grip: sp(0.35),
    target: new Vector3(),
    plan: null as Plan | null,
    planFor: null as Action | null,
    started: false,
    lastCheck: 0,
    autoEl: null as HTMLElement | null,
  });

  const tmp = useMemo(
    () => ({
      f: { p: new Vector3(), rotY: 0, s: 1, focus: 0, vis: 0 },
      rest: new Vector3(),
      tip: new Vector3(),
      d: new Vector3(),
      sh: new Vector3(),
    }),
    [],
  );

  /** Gallery-local point on the right edge of frame i, at position `pos`. */
  const edgeOf = (i: number, pos: number, out: Vector3) => {
    const f = frameAt(wrap(i - pos), L, { p: new Vector3(), rotY: 0, s: 1, focus: 0, vis: 0 });
    const hw = (PHOTO_W / 2) * f.s;
    out.set(Math.cos(f.rotY) * hw, -0.1 * f.s, -Math.sin(f.rotY) * hw).add(f.p);
    return out;
  };

  /** One continuous hand path for a swipe, planned when the step starts. */
  const planFor = (a: Action, rest: Vector3): Plan => {
    const from = Math.round(a.from);
    const E = edgeOf(from, from, new Vector3());
    const s = L.robotScale;
    const dir = a.dir;
    const W = rest.clone().add(new Vector3(0.2, 0.24, 0.12).multiplyScalar(s)); // anticipation: draw back
    const A = E.clone().add(new Vector3(0.42, 0.14, 0.58).multiplyScalar(s)); // approach
    const A2 = A.clone().add(new Vector3(0.08, 0.05, 0.07).multiplyScalar(s)); // a beat of hesitation
    const C = E.clone().add(new Vector3(0.05, 0, 0.13)); // contact
    const travel = L.radius * Math.sin(L.step); // how far a card centre moves per step
    const P = C.clone().add(new Vector3(-dir * travel * 0.62, 0.03, -0.04)); // controlled push / pull
    const F = P.clone().add(new Vector3(-dir * 0.2, 0.16, 0.12).multiplyScalar(s)); // follow-through
    const hes = !simple;
    const pts = hes ? [rest.clone(), W, A, A2, C, P, F, rest.clone()] : [rest.clone(), W, A, C, P, F, rest.clone()];
    const times = hes ? [0, 0.1, 0.32, 0.38, 0.45, 0.68, 0.78, 1] : [0, 0.1, 0.34, 0.45, 0.68, 0.78, 1];
    return {
      curve: new CatmullRomCurve3(pts, false, "centripetal", 0.5),
      times,
      contactT: hes ? 0.45 : 0.45,
      releaseT: hes ? 0.68 : 0.68,
      hesitate: hes ? [0.32, 0.38] : null,
      contactX: C.x,
      travel,
      dur: (hes ? 1350 : 1050) * SLOWMO,
    };
  };

  const pathAt = (p: Plan, u: number, out: Vector3) => {
    // 2026-11-25: one continuous warp along the whole path. Waypoint timing is
    // piecewise linear (no stop at every waypoint), and the overall move eases
    // in and out with a minimum-jerk profile, like a servo-driven arm.
    const w = u <= 0 ? 0 : u >= 1 ? 1 : u * u * u * (u * (u * 6 - 15) + 10);
    const n = p.times.length - 1;
    let i = 0;
    while (i < n - 1 && w > p.times[i + 1]) i++;
    const s = Math.min(1, Math.max(0, (w - p.times[i]) / (p.times[i + 1] - p.times[i])));
    return p.curve.getPoint(Math.min(1, (i + s) / n), out);
  };

  useFrame((state, dtRaw) => {
    const S = sim.current;
    const tr = story.view.track;
    const visible = tr > WINDOW.human[0] && tr < WINDOW.human[1];
    if (root.current) root.current.visible = visible;
    const reduced = story.reducedMotion;
    const now = performance.now();
    const t = state.clock.elapsedTime;
    const dt = Math.min(dtRaw, 0.1);

    // ── Autoplay: only while the held stage is on screen and nothing asks it to wait. ──
    holdAutoplay("offscreen", !(tr > 0.97 && tr < 1.55));
    holdAutoplay("reduced", reduced);
    if (now - S.lastCheck > 250) {
      S.lastCheck = now;
      holdAutoplay("menu", !!document.querySelector("dialog[open]"));
      holdAutoplay("hidden", document.hidden);
      S.autoEl ??= document.querySelector<HTMLElement>(".gallery-auto");
    }
    if (autoplayDue(now)) galleryStep(1, "auto");
    if (S.autoEl) {
      const ap = gallery.autoplay;
      const running = ap.holds.size === 0 && !gallery.action;
      S.autoEl.style.setProperty("--p", running ? Math.min(1, (now - ap.lastSettled) / AUTOPLAY_MS).toFixed(3) : "0");
      S.autoEl.dataset.state = running ? "running" : "waiting";
    }

    // ── Rest pose (idle breathing), folded while the stage is off. ──
    const a = gallery.action;
    const d = gallery.drag;
    const sc = L.robotScale;
    const live = reduced ? 0 : 1;
    tmp.rest
      .set(-0.85 + Math.sin(t * 0.5) * 0.05 * live, 1.6 + Math.sin(t * 0.8) * 0.04 * live, 0.42 + Math.sin(t * 0.37) * 0.03 * live)
      .multiplyScalar(sc)
      .add(L.robot);
    const powered = smoothstep(0.72, 1.08, tr) * (1 - smoothstep(1.5, 1.75, tr));
    tmp.d.set(0.25, 0.75, 0.25).multiplyScalar(sc).add(L.robot);
    tmp.rest.lerp(tmp.d, 1 - powered);

    let cardMode: "spring" | "held" | "drag" = "spring";
    // Until the robot releases it, the card waits where it was: it only moves
    // when the hand moves it.
    let cardTarget = gallery.index;
    let rollT = reduced ? 0 : Math.sin(t * 0.7) * 0.1 + (Math.sin(t * 0.23) > 0.93 ? 0.32 : 0);
    let pitchT = reduced ? 0.06 : 0.08 + Math.sin(t * 0.9) * 0.05 + story.view.py * 0.12;
    let gripT = 0.35;
    let lookT = story.view.px * 0.25;

    const robotActs = !!a && !reduced && visible && powered > 0.5;
    if (a && robotActs) {
      if (S.planFor !== a) {
        S.plan = planFor(a, tmp.rest);
        S.planFor = a;
      }
      const p = S.plan!;
      const u = (performance.now() - a.start) / p.dur;
      pathAt(p, Math.min(1, u), S.target);
      if (u < p.releaseT) cardTarget = a.from;
      if (u < p.times[1]) {
        gripT = 0.5; // anticipation: it draws back and opens up
        pitchT = 0.2;
      } else if (p.hesitate && u >= p.hesitate[0] && u < p.hesitate[1]) {
        const h = Math.sin(((u - p.hesitate[0]) / (p.hesitate[1] - p.hesitate[0])) * Math.PI);
        rollT = 0.34 * h; // tilts its head, reconsiders
        lookT = 0.25 * h;
        gripT = 0.95;
      } else if (u < p.contactT) {
        gripT = 0.95;
        rollT = 0;
        pitchT = -0.06;
      } else if (u < p.releaseT) {
        gripT = 0.12; // pressed against the edge
        rollT = -0.08; // wrist squared to the frame
        pitchT = -0.04;
        cardMode = "held";
      } else {
        gripT = 0.55;
        pitchT = 0.14;
      }
      if (u >= 1) {
        S.plan = null;
        S.planFor = null;
        galleryActionDone();
      }
    } else if (a) {
      // Reduced motion or off-stage: no robot; the card eases over on its own.
      if (performance.now() - a.start > 450) galleryActionDone();
      S.target.copy(tmp.rest);
    } else if (d.active) {
      cardMode = "drag";
      edgeOf(Math.round(gallery.pos), gallery.pos, S.target).add(tmp.d.set(0.06, 0, 0.16));
      gripT = 0.15;
      if (Math.abs(d.offset) < 0.03) S.target.copy(tmp.rest);
    } else {
      S.target.copy(tmp.rest);
    }
    if (d.release && !d.active) {
      S.card.v = d.releaseVelocity * 0.8;
      d.release = false;
    }
    if (!S.started) {
      S.started = true;
      S.card.x = gallery.pos;
    }

    // ── IK (pure): target → raw joint angles in the turret's plane. ──
    const sh = tmp.sh.set(0, SHOULDER_Y * sc, 0).add(L.robot);
    const dx = (S.target.x - sh.x) / sc;
    const dy = (S.target.y - sh.y) / sc;
    const dz = (S.target.z - sh.z) / sc;
    let yawRaw = Math.atan2(dx, dz);
    while (yawRaw - S.yaw.x > Math.PI) yawRaw -= Math.PI * 2;
    while (yawRaw - S.yaw.x < -Math.PI) yawRaw += Math.PI * 2;
    const horiz = Math.hypot(dx, dz) - HAND * Math.cos(pitchT);
    const hgt = dy - HAND * Math.sin(pitchT);
    const D = Math.min(L1 + L2 - 0.03, Math.max(0.35, Math.hypot(horiz, hgt)));
    const phi = Math.atan2(hgt, Math.max(0.01, horiz));
    const a1 = Math.acos(Math.min(1, Math.max(-1, (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D))));
    const a2 = Math.acos(Math.min(1, Math.max(-1, (L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2))));
    const e1Raw = phi + a1;
    const e2Raw = e1Raw - (Math.PI - a2);

    // ── Fixed-step integration: base slowest, wrist quickest (natural lead-to-tip
    //    follow-through), lightly underdamped so moves land with a clean overshoot. ──
    const k = robotActs || cardMode === "drag" ? 1 : 0.6;
    S.acc += dt;
    let steps = 0;
    while (S.acc >= H && steps < 48) {
      S.acc -= H;
      steps++;
      stepSpring(S.yaw, yawRaw, 16 * k + 4, 0.96);
      stepSpring(S.e1, e1Raw, 19 * k + 4, 0.95);
      stepSpring(S.e2, e2Raw, 23 * k + 4, 0.94);
      stepSpring(S.ew, pitchT, 24, 0.9);
      stepSpring(S.roll, rollT, 16, 0.88);
      stepSpring(S.look, lookT, 9, 0.8);
      stepSpring(S.grip, gripT, 22, 0.9);
      if (cardMode === "spring") {
        // Glide to the committed photo with momentum and a slight overshoot.
        if (reduced) stepSpring(S.card, cardTarget, 9, 1);
        else stepSpring(S.card, cardTarget, 9, 0.86);
      }
    }
    if (steps === 48) S.acc = 0;

    // ── FK: the actual fingertip, so the card moves exactly with the hand. ──
    const hReach = L1 * Math.cos(S.e1.x) + L2 * Math.cos(S.e2.x) + HAND * Math.cos(S.ew.x);
    const vReach = L1 * Math.sin(S.e1.x) + L2 * Math.sin(S.e2.x) + HAND * Math.sin(S.ew.x);
    tmp.tip.set(Math.sin(S.yaw.x) * hReach, vReach, Math.cos(S.yaw.x) * hReach).multiplyScalar(sc).add(sh);

    if (cardMode === "held" && S.plan && a) {
      const raw = a.from - (tmp.tip.x - S.plan.contactX) / S.plan.travel;
      const lo = Math.min(a.from, a.from + a.dir * 0.78);
      const hi = Math.max(a.from, a.from + a.dir * 0.78);
      const next = Math.min(hi, Math.max(lo, raw));
      S.card.v = dt > 0 ? (next - S.card.x) / dt : 0;
      S.card.x = next;
    } else if (cardMode === "drag") {
      S.card.x = d.startPos + d.offset;
      S.card.v = 0;
    }
    gallery.pos = S.card.x;

    // Lights live outside the gated group and only fade: a light appearing or
    // disappearing changes every lit shader's program and stalls the first frame.
    const lightOn = visible ? smoothstep(0.55, 1.0, tr) * (1 - smoothstep(1.55, 1.85, tr)) : 0;
    if (keyLight.current) keyLight.current.intensity = 10 * lightOn;
    if (fillLight.current) fillLight.current.intensity = 9 * lightOn;
    if (robotKey.current) robotKey.current.intensity = 22 * lightOn;
    if (robotRim.current) robotRim.current.intensity = 12 * lightOn;

    if (!visible || !root.current) return;

    // ── Scroll-owned reveal and exit (never touches pos/index). ──
    const presence = smoothstep(0.55, 1.0, tr) * (1 - smoothstep(1.55, 1.85, tr));
    root.current.rotation.y = story.view.px * 0.06;
    root.current.rotation.x = -story.view.py * 0.035;

    let bestFocus = 0;
    galleryPhotos.forEach((_, i) => {
      const mesh = frames.current[i];
      if (!mesh) return;
      const rel = wrap(i - gallery.pos);
      frameAt(rel, L, tmp.f);
      const bob = reduced ? 0 : Math.sin(t * 0.55 + i * 1.9) * 0.035 * (1 - tmp.f.focus * 0.6);
      mesh.position.set(tmp.f.p.x, tmp.f.p.y + bob, tmp.f.p.z);
      mesh.rotation.set(0, tmp.f.rotY, 0);
      mesh.scale.setScalar(tmp.f.s);
      mesh.renderOrder = 20 - Math.round(Math.abs(rel) * 4);
      const u2 = r.mats[i].mat.uniforms;
      const rv = smoothstep(0.62 + i * 0.05, 0.98 + i * 0.05, tr);
      u2.uReveal.value = rv;
      u2.uFocus.value = tmp.f.focus;
      u2.uVis.value = tmp.f.vis * presence * smoothstep(0, 0.35, rv);
      r.printShadows[i].opacity = u2.uVis.value * (0.35 + 0.35 * tmp.f.focus);
      u2.uTime.value = t;
      bestFocus = Math.max(bestFocus, tmp.f.focus);
    });
    if (halo.current) {
      halo.current.position.set(0, 0.05, L.forward - 0.45);
      r.haloMat.uniforms.uIntensity.value = 0; // no back-light glow behind prints
    }
    r.ringMat.opacity = presence * 0.18;

    // ── Robot pose. ──
    const R = robot.current;
    if (!R) return;
    R.position.copy(L.robot);
    R.scale.setScalar(sc);
    const opacity = smoothstep(0.6, 0.85, tr) * (1 - smoothstep(1.6, 1.82, tr));
    Object.values(r.mat).forEach((m) => (m.opacity = m === r.mat.shadow ? opacity * 0.6 : opacity));
    R.visible = opacity > 0.001;
    if (turret.current) turret.current.rotation.y = S.yaw.x;
    if (shoulder.current) shoulder.current.rotation.x = -S.e1.x;
    if (elbow.current) elbow.current.rotation.x = -(S.e2.x - S.e1.x);
    if (wrist.current) wrist.current.rotation.x = -(S.ew.x - S.e2.x);
    if (head.current) head.current.rotation.set(0, S.look.x, S.roll.x);
    const g = 0.025 + Math.max(0, S.grip.x) * 0.05;
    if (fingerL.current) fingerL.current.position.x = -g;
    if (fingerR.current) fingerR.current.position.x = g;
  });

  return (
    <>
    {/* Warm light for the human beat: peach key, lavender fill. Always present, faded by scroll. */}
    <group position={GALLERY.toArray() as [number, number, number]}>
      <pointLight ref={keyLight} color="#ffb89a" position={[-1.6, 2.4, 3.2]} intensity={0} distance={10} decay={2} />
      <pointLight ref={fillLight} color="#c4b2a3" position={[3.4, 1.0, 2.2]} intensity={0} distance={9} decay={2} />
      {/* A warm key above and in front of the arm, so its anodised housings and
          brushed links read against the dark room. */}
      <pointLight ref={robotKey} color="#fff1e2" position={[2.2, 1.6, 4.2]} intensity={0} distance={8} decay={2} />
      <pointLight ref={robotRim} color="#d6dde2" position={[3.6, 2.4, -1.2]} intensity={0} distance={7} decay={2} />
    </group>
    <group ref={root} position={GALLERY.toArray() as [number, number, number]} visible={false}>

      <mesh ref={halo} geometry={r.haloGeo} material={r.haloMat} renderOrder={1} />

      {galleryPhotos.map((p, i) => (
        <mesh
          key={p.id}
          ref={(el) => {
            frames.current[i] = el;
          }}
          geometry={r.frameGeo}
          material={r.mats[i].mat}
          frustumCulled={false}
        >
          <mesh geometry={r.printShadowGeo} material={r.printShadows[i]} position={[0.07, -0.09, -0.06]} renderOrder={-1} />
        </mesh>
      ))}

      <group ref={robot}>
        <mesh geometry={r.geo.shadow} material={r.mat.shadow} position={[0, 0.002, 0]} renderOrder={1} />
        <mesh geometry={r.geo.foot} material={r.mat.ano} />
        <mesh geometry={r.geo.footBolts} material={r.mat.steel} position={[0, 0.05, 0]} />
        <mesh geometry={r.geo.pedestal} material={r.mat.alu} position={[0, 0.05, 0]} />
        <group ref={turret} position={[0, 0.16, 0]}>
          <mesh geometry={r.geo.turret} material={r.mat.ano} position={[0, 0.05, 0]} />
          <mesh geometry={r.geo.turretBand} material={r.mat.cu} position={[0, 0.07, 0]} />
          <mesh geometry={r.geo.turretCap} material={r.mat.alu} position={[0, 0.33, 0]} />
          <mesh geometry={r.geo.turretBolts} material={r.mat.steel} position={[0, 0.35, 0]} />
          <group ref={shoulder} position={[0, SHOULDER_Y - 0.16, 0]}>
            <mesh geometry={r.geo.shoulder} material={r.mat.ano} position={[-0.22, 0, 0]} />
            <mesh geometry={r.geo.shoulderCap} material={r.mat.alu} position={[0.22, 0, 0]} />
            <mesh geometry={r.geo.shoulderBolts} material={r.mat.steel} position={[0.242, 0, 0]} />
            <mesh geometry={r.geo.shoulderCap} material={r.mat.alu} position={[-0.242, 0, 0]} />
            <mesh geometry={r.geo.upperFlange} material={r.mat.ano} position={[0, 0, 0.13]} />
            <mesh geometry={r.geo.upperTube} material={r.mat.alu} />
            <mesh geometry={r.geo.upperCable} material={r.mat.rubber} />
            {[0.35, 0.7].map((f) => (
              <mesh key={f} geometry={r.geo.clip} material={r.mat.steel} position={[0.09, 0.05, L1 * f]} />
            ))}
            <mesh geometry={r.geo.seam} material={r.mat.steel} position={[-0.11, 0, 0]} />
            <mesh geometry={r.geo.upperFlange} material={r.mat.ano} position={[0, 0, L1 - 0.165]} />
            <group ref={elbow} position={[0, 0, L1]}>
              <mesh geometry={r.geo.elbow} material={r.mat.ano} position={[-0.17, 0, 0]} />
              <mesh geometry={r.geo.elbowCap} material={r.mat.alu} position={[0.17, 0, 0]} />
              <mesh geometry={r.geo.elbowBolts} material={r.mat.steel} position={[0.192, 0, 0]} />
              <mesh geometry={r.geo.elbowCap} material={r.mat.alu} position={[-0.192, 0, 0]} />
              <mesh geometry={r.geo.foreFlange} material={r.mat.ano} position={[0, 0, 0.1]} />
              <mesh geometry={r.geo.foreTube} material={r.mat.alu} />
              <mesh geometry={r.geo.foreCable} material={r.mat.rubber} />
              <mesh geometry={r.geo.clip} material={r.mat.steel} position={[0.08, 0.042, L2 * 0.5]} scale={0.85} />
              <mesh geometry={r.geo.seamS} material={r.mat.steel} position={[-0.085, 0, 0]} />
              <mesh geometry={r.geo.foreFlange} material={r.mat.ano} position={[0, 0, L2 - 0.13]} />
              <group ref={wrist} position={[0, 0, L2]}>
                <mesh geometry={r.geo.wrist} material={r.mat.ano} position={[-0.12, 0, 0]} />
                <mesh geometry={r.geo.wristCap} material={r.mat.alu} position={[0.12, 0, 0]} />
                <mesh geometry={r.geo.wristCap} material={r.mat.alu} position={[-0.142, 0, 0]} />
                <group ref={head}>
                  <mesh geometry={r.geo.roll} material={r.mat.ano} position={[0, 0, 0.04]} />
                  <mesh geometry={r.geo.gripBody} material={r.mat.ano} position={[0, -0.01, 0.2]} />
                  <mesh geometry={r.geo.gripRail} material={r.mat.alu} position={[0, -0.07, 0.24]} />
                  <mesh geometry={r.geo.cam} material={r.mat.alu} position={[0, 0.07, 0.22]} />
                  <mesh geometry={r.geo.lens} material={r.mat.glass} position={[0, 0.07, 0.25]} />
                  <mesh geometry={r.geo.led} material={r.mat.led} position={[0.028, 0.085, 0.246]} />
                  <mesh ref={fingerL} geometry={r.geo.finger} material={r.mat.alu} position={[-0.05, -0.06, 0.33]}>
                    <mesh geometry={r.geo.pad} material={r.mat.rubber} position={[0.019, 0, 0.03]} />
                  </mesh>
                  <mesh ref={fingerR} geometry={r.geo.finger} material={r.mat.alu} position={[0.05, -0.06, 0.33]}>
                    <mesh geometry={r.geo.pad} material={r.mat.rubber} position={[-0.019, 0, 0.03]} />
                  </mesh>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
    </>
  );
}
