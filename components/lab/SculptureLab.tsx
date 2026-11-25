"use client";

import { useEffect, useRef } from "react";
import {
  ACESFilmicToneMapping,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  Shape,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { brushedGrain } from "@/experience/world/materials";
import { boltCircle, flange, turned } from "@/experience/world/parts";

/**
 * Sculpture bench, round two (2026-11-25). Isolated from the site until a
 * silhouette is approved. `?v=fold|joint|iris`, `?t=0..1` freezes the scroll
 * transformation, `?spin=0` stops the turntable.
 */

const titanium = () =>
  new MeshPhysicalMaterial({ color: new Color("#b8b2a8"), metalness: 1, roughness: 0.4, roughnessMap: brushedGrain(), anisotropy: 0.6, side: 2 });
const gunmetal = () => new MeshPhysicalMaterial({ color: new Color("#3d3c3b"), metalness: 1, roughness: 0.36 });
const blackened = () =>
  new MeshPhysicalMaterial({ color: new Color("#2a2826"), metalness: 0.85, roughness: 0.46, clearcoat: 0.3, clearcoatRoughness: 0.35 });
const copper = () => new MeshPhysicalMaterial({ color: new Color("#c07a4c"), metalness: 1, roughness: 0.24 });

type Built = { group: Group; update: (t: number) => void; camY?: number; camZ?: number };

/* ─────────────── 1 · Continuous folded titanium ─────────────── */
/**
 * One strip of titanium sheet folded along 14 alternating creases while it
 * travels a slow S through space. A single continuous surface, flat-shaded so
 * every crease is crisp. Scroll deepens the folds; at t = 0 it relaxes into a
 * gentle ribbon.
 */
function foldedSheet(): Built {
  const group = new Group();
  const N = 14;
  const W = 1.15;
  const TH = 0.03;
  const geo = new BufferGeometry();
  // Satin-finished sheet: broader highlights so each panel reads as a plane of metal.
  const sheet = titanium();
  sheet.color.set("#968f85");
  sheet.roughness = 0.36;
  sheet.anisotropy = 0;
  sheet.roughnessMap = null; // the generated sheet has no UVs
  const mesh = new Mesh(geo, sheet);
  mesh.castShadow = mesh.receiveShadow = true;
  group.add(mesh);

  const build = (t: number) => {
    const C: Vector3[] = [];
    const S: Vector3[] = [];
    const fold = 0.08 + t * 0.55;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const a = (u - 0.5) * Math.PI * 1.7;
      C.push(new Vector3(Math.sin(a) * 1.05, (u - 0.5) * 2.7, Math.sin(a * 2) * 0.35));
      const ang = u * Math.PI * 1.25 + (i % 2 ? 1 : -1) * fold;
      S.push(new Vector3(Math.cos(ang), 0.18 * Math.sin(ang * 0.5), Math.sin(ang)).normalize());
    }
    const pos: number[] = [];
    const quad = (a: Vector3, b: Vector3, c: Vector3, d: Vector3) =>
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, a.x, a.y, a.z, c.x, c.y, c.z, d.x, d.y, d.z);
    for (let i = 0; i < N; i++) {
      const L0 = C[i].clone().addScaledVector(S[i], -W / 2);
      const R0 = C[i].clone().addScaledVector(S[i], W / 2);
      const L1 = C[i + 1].clone().addScaledVector(S[i + 1], -W / 2);
      const R1 = C[i + 1].clone().addScaledVector(S[i + 1], W / 2);
      const n = new Vector3().subVectors(R0, L0).cross(new Vector3().subVectors(L1, L0)).normalize().multiplyScalar(TH);
      const [l0, r0, l1, r1] = [L0, R0, L1, R1].map((p) => p.clone().add(n));
      quad(L0, R0, R1, L1);
      quad(l0, l1, r1, r0);
      quad(L0, L1, l1, l0);
      quad(R0, r0, r1, R1);
      if (i === 0) quad(L0, l0, r0, R0);
      if (i === N - 1) quad(L1, R1, r1, l1);
    }
    geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
  };
  let last = -1;
  return {
    group,
    update: (t) => {
      const q = Math.round(t * 200) / 200;
      if (q !== last) {
        build(q);
        last = q;
      }
    },
  };
}

/* ─────────────── 2 · Interlocking solid forms ─────────────── */
/**
 * A monolith split by a finger joint: a blackened-steel lower block and a
 * titanium upper block whose fingers mesh, held by one copper pin with gunmetal
 * caps. Scroll draws the halves apart along the joint (the upper turns a few
 * degrees and the pin slides out), then closes them into one solid.
 */
function fingerJoint(): Built {
  const group = new Group();
  const ti = titanium(), bk = blackened(), cu = copper(), gm = gunmetal();
  const W = 1.1, D = 1.1, H = 1.25, F = 5, FH = 0.42;
  const fw = W / F;
  const half = (mat: MeshPhysicalMaterial, flip: number) => {
    const g = new Group();
    const body = new Mesh(new RoundedBoxGeometry(W, H, D, 4, 0.035), mat);
    // Lower body ends at y = 0, upper starts at y = FH; the fingers share 0..FH.
    body.position.y = flip > 0 ? FH + H / 2 : -H / 2;
    g.add(body);
    for (let i = 0; i < F; i++) {
      if ((i % 2 === 0) === flip > 0) continue;
      const tooth = new Mesh(new RoundedBoxGeometry(fw - 0.012, FH, D, 3, 0.02), mat);
      tooth.position.set(-W / 2 + fw * (i + 0.5), FH / 2, 0);
      g.add(tooth);
    }
    g.traverse((o) => {
      if ((o as Mesh).isMesh) o.castShadow = o.receiveShadow = true;
    });
    return g;
  };
  const lower = half(bk, -1);
  const upper = half(ti, 1);
  const pin = new Mesh(new CylinderGeometry(0.045, 0.045, D + 0.16, 32).rotateX(Math.PI / 2), cu);
  const heads = [-1, 1].map((s) => {
    const h = new Mesh(flange(0.075, 0.03, 0.008).rotateX(Math.PI / 2), gm);
    h.position.z = s * (D / 2 + 0.065);
    return h;
  });
  const pinG = new Group();
  pinG.add(pin, ...heads);
  group.add(lower, upper, pinG);
  return {
    group,
    camY: 1.6,
    camZ: 7.2,
    update: (t) => {
      const open = 0.5 + 0.5 * Math.sin(Math.PI * (t - 0.5));
      const gap = open * 0.55;
      lower.position.y = -gap / 2 - FH / 2;
      upper.position.y = gap / 2 - FH / 2;
      upper.rotation.y = open * Math.PI * 0.12;
      pinG.position.x = open * 1.15;
    },
  };
}

/* ─────────────── 3 · Precision mechanical aperture ─────────────── */
/**
 * A nine-blade iris diaphragm in a turned titanium bezel: blackened-steel
 * blades on copper pivot pins, a ridged gunmetal actuator ring, cap screws on
 * the face. Scroll closes the aperture; each blade turns on its own pivot.
 */
function aperture(): Built {
  const group = new Group();
  const ti = titanium(), bk = blackened(), cu = copper(), gm = gunmetal();
  const R = 1.25;
  const bezel = new Mesh(
    turned([[R, -0.12], [R + 0.3, -0.12], [R + 0.36, -0.06], [R + 0.36, 0.08], [R + 0.3, 0.14], [R + 0.08, 0.14], [R + 0.02, 0.1], [R, 0.1]], 128).rotateX(Math.PI / 2),
    ti,
  );
  const ring = new Mesh(turned([[R + 0.36, -0.1], [R + 0.4, -0.1], [R + 0.4, 0.0], [R + 0.36, 0.0]], 72).rotateX(Math.PI / 2), gm);
  ring.position.z = -0.02;
  const screws = new Mesh(boltCircle(9, R + 0.2, 0.028, 0.018, 0.17).rotateX(Math.PI / 2), gm);
  screws.position.z = 0.14;
  group.add(bezel, ring, screws);

  const shape = new Shape();
  shape.moveTo(-0.06, 0);
  shape.absarc(0, 0, 0.06, Math.PI, 0, true);
  shape.quadraticCurveTo(0.55, 0.25, 1.35, 0.05);
  shape.quadraticCurveTo(1.45, -0.05, 1.32, -0.12);
  shape.quadraticCurveTo(0.6, 0.02, -0.06, 0);
  const bladeGeo = new ExtrudeGeometry(shape, { depth: 0.014, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 24 });
  const pinGeo = new CylinderGeometry(0.028, 0.028, 0.06, 20).rotateX(Math.PI / 2);
  const n = 9;
  const blades: { pivot: Group; base: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const pivot = new Group();
    pivot.position.set(Math.cos(a) * (R - 0.05), Math.sin(a) * (R - 0.05), 0.01 + i * 0.0035);
    pivot.add(new Mesh(bladeGeo, bk));
    const p = new Mesh(pinGeo, cu);
    p.position.z = 0.03;
    pivot.add(p);
    group.add(pivot);
    blades.push({ pivot, base: a + Math.PI * 0.62 });
  }
  group.traverse((o) => {
    if ((o as Mesh).isMesh) o.castShadow = o.receiveShadow = true;
  });
  group.rotation.x = -0.18;
  return {
    group,
    camY: 0.4,
    camZ: 6.6,
    update: (t) => blades.forEach(({ pivot, base }) => (pivot.rotation.z = base + 0.05 + t * 0.62)),
  };
}

/**
 * `layout="hero"` previews the sculpture inside the real hero composition: the
 * canvas sits behind the typography and the object is placed in the hero's
 * open lower-right field, smaller, so the name stays dominant.
 */
export function SculptureLab({ layout = "bench" }: { layout?: "bench" | "hero" }) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current!;
    const q = new URLSearchParams(location.search);
    const variant = q.get("v") ?? "fold";
    const frozenT = q.has("t") ? Number(q.get("t")) : null;
    const spin = q.get("spin") !== "0";

    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(2, devicePixelRatio));
    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    renderer.setClearColor("#0f0d0b");
    el.appendChild(renderer.domElement);

    const scene = new Scene();
    const pmrem = new PMREMGenerator(renderer);
    // Studio Small 09 (Poly Haven, CC0): the same light the site uses.
    new HDRLoader().loadAsync("/env/studio_small_09_1k.hdr").then((hdr) => {
      scene.environment = pmrem.fromEquirectangular(hdr).texture;
      scene.environmentIntensity = 1.5;
      hdr.dispose();
    });

    const key = new DirectionalLight("#fff1e2", 2.0);
    key.position.set(-3, 5, 3);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.radius = 4;
    key.shadow.bias = -0.0004;
    Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3 });
    scene.add(key);
    const rim = new DirectionalLight("#d8dde0", 0.7);
    rim.position.set(3, 2, -4);
    scene.add(rim);

    const floor = new Mesh(new PlaneGeometry(20, 20), new ShadowMaterial({ opacity: 0.4 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.7;
    floor.receiveShadow = true;
    scene.add(floor);

    const built = variant === "joint" ? fingerJoint() : variant === "iris" ? aperture() : foldedSheet();
    const holder = new Group();
    holder.add(built.group);
    scene.add(holder);
    if (layout === "hero") {
      // Lower-right of the hero, clear of the name's first line.
      const portrait = el.clientWidth / el.clientHeight < 0.8;
      // One camera distance for every candidate, so they compare at true scale.
      const size = variant === "iris" ? 0.48 : variant === "joint" ? 0.6 : 0.62;
      holder.position.set(portrait ? 0.15 : 3.15, portrait ? 2.05 : -0.95, 0);
      holder.scale.setScalar(size * (portrait ? 0.8 : 1));
      floor.position.y = portrait ? 1.0 : -2.1;
      renderer.setClearColor("#0f0e0c");
    }

    const camera = new PerspectiveCamera(30, el.clientWidth / el.clientHeight, 0.1, 50);
    if (layout === "hero") camera.position.set(0, 0.3, 9.5);
    else camera.position.set(variant === "joint" ? 2.4 : 0, built.camY ?? 0.6, built.camZ ?? 8);
    camera.lookAt(0, 0, 0);

    const pointer = { x: 0 };
    const onMove = (e: PointerEvent) => {
      pointer.x = (e.clientX / innerWidth) * 2 - 1;
    };
    addEventListener("pointermove", onMove);

    let raf = 0;
    const start = performance.now();
    const frame = () => {
      const time = (performance.now() - start) / 1000;
      const t = frozenT ?? 0.5 + 0.5 * Math.sin(time * 0.35);
      built.update(t);
      const turn = spin ? time * 0.12 : 0.5;
      built.group.rotation.y = variant === "iris" ? pointer.x * 0.2 + Math.sin(time * 0.3) * 0.15 : turn + pointer.x * 0.2;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    frame();
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("pointermove", onMove);
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [layout]);

  return <div ref={host} aria-hidden style={{ position: "fixed", inset: 0, zIndex: 0 }} />;
}
