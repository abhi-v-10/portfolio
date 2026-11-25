"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  CylinderGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  LineDashedMaterial,
  Matrix4,
  Mesh,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  Texture,
  Vector3,
} from "three";
import { story } from "../director/store";
import { floorGridFragment, labelFragment, labelVertex } from "../shaders/chapters";
import { machinedModuleMaterial } from "../world/machined";
import { PBR } from "../world/materials";
import { dataLineFragment, dataLineVertex, holoVertex } from "../shaders/hologram";
import { additive, HOLO_BLUE, HOLO_CYAN } from "../world/AICore";
import { createLabelTexture } from "../world/panelText";
import { smoothstep } from "../world/paths";
import { ENGINEERING_CENTRE as E, ENGINEERING_FLOOR, MORPH, mulberry32, NET_NODES, TRACK_SHIFT, WINDOW } from "./layout";

type V3 = [number, number, number];
type ModuleSpec = { pos: V3; size: V3; label?: string };

// A three-tier system, read bottom-up: data, services, interface. The service
// tier's front row is the Nestafar pattern: agent → tool → internal API, with
// the API dropping to live data.
// Exploded view (2026-11-25): tiers spread a little further apart and every
// module floats a small gap above its tray, so the assembly reads as parts
// that slot together along their dowels.
const TIER_Y = [0, 1.8, 3.6];
const GAP = 0.22;
const MODULES: ModuleSpec[] = [
  // Platforms (assemble first).
  { pos: [0, TIER_Y[0], 0], size: [8.4, 0.08, 5] },
  { pos: [0, TIER_Y[1], 0], size: [8.4, 0.08, 5] },
  { pos: [0, TIER_Y[2], 0], size: [6.2, 0.08, 3.6] },
  // Data tier.
  { pos: [-2.6, 0.36 + GAP, 0.2], size: [1.7, 0.62, 1.3] },
  { pos: [0, 0.36 + GAP, 0.6], size: [1.7, 0.62, 1.3], label: "Live data" },
  { pos: [2.6, 0.36 + GAP, 0.2], size: [1.7, 0.62, 1.3] },
  // Service tier: front row is the agent pattern.
  { pos: [-2.8, TIER_Y[1] + 0.34 + GAP, 1.1], size: [1.3, 0.6, 1.0], label: "Agent" },
  { pos: [-0.95, TIER_Y[1] + 0.34 + GAP, 1.1], size: [1.3, 0.6, 1.0], label: "Tool" },
  { pos: [0.95, TIER_Y[1] + 0.34 + GAP, 1.1], size: [1.3, 0.6, 1.0], label: "API" },
  { pos: [2.8, TIER_Y[1] + 0.34 + GAP, 1.1], size: [1.3, 0.6, 1.0], label: "Auth" },
  { pos: [-1.9, TIER_Y[1] + 0.3 + GAP, -1.2], size: [1.6, 0.52, 1.0] },
  { pos: [1.9, TIER_Y[1] + 0.3 + GAP, -1.2], size: [1.6, 0.52, 1.0] },
  // Interface tier.
  { pos: [-1.3, TIER_Y[2] + 0.22 + GAP, 0.2], size: [2.0, 0.36, 1.1] },
  { pos: [1.3, TIER_Y[2] + 0.22 + GAP, 0.2], size: [2.0, 0.36, 1.1], label: "Client" },
];
const LABEL_AT = MODULES.map((m, i) => (m.label ? i : -1)).filter((i) => i >= 0);

/** Pathways between modules, as [from, to] in local coordinates (one segment each). */
function pathways(): [Vector3, Vector3][] {
  const top = (i: number) => {
    const m = MODULES[i];
    return new Vector3(m.pos[0], m.pos[1] + m.size[1] / 2 + 0.02, m.pos[2]);
  };
  const side = (i: number, dir: 1 | -1) => {
    const m = MODULES[i];
    return new Vector3(m.pos[0] + (dir * m.size[0]) / 2, m.pos[1], m.pos[2]);
  };
  const bottom = (i: number) => {
    const m = MODULES[i];
    return new Vector3(m.pos[0], m.pos[1] - m.size[1] / 2, m.pos[2]);
  };
  const L: [Vector3, Vector3][] = [
    [side(6, 1), side(7, -1)], // agent → tool
    [side(7, 1), side(8, -1)], // tool → API
    [bottom(8), new Vector3(0.95, top(4).y, 1.1)], // API ↓
    [new Vector3(0.95, top(4).y, 1.1), new Vector3(0.95, top(4).y, 0.6)],
    [new Vector3(0.95, top(4).y, 0.6), top(4).setX(0.85)], // → live data
    [bottom(13), new Vector3(1.3, TIER_Y[1] + 0.64 + GAP, 0.2)], // client ↓ services
    [bottom(12), new Vector3(-1.3, TIER_Y[1] + 0.64 + GAP, 0.2)],
    [side(9, -1), side(8, 1)], // auth guards the API
    [bottom(10), top(3)],
    [bottom(11), top(5)],
  ];
  return L;
}

/**
 * Floor traces: the exploratory branches straightened into routed lines that
 * run to the structure, right angles only.
 */
function traces(): Vector3[][] {
  const y = ENGINEERING_FLOOR - E.y + 0.01;
  return [
    [new Vector3(-1.2, y, 18), new Vector3(-1.2, y, 8), new Vector3(-3.4, y, 8), new Vector3(-3.4, y, 2.6)],
    [new Vector3(0.4, y, 19), new Vector3(0.4, y, 10), new Vector3(0, y, 10), new Vector3(0, y, 2.6)],
    [new Vector3(1.8, y, 18), new Vector3(1.8, y, 6.5), new Vector3(3.4, y, 6.5), new Vector3(3.4, y, 2.6)],
    [new Vector3(-0.6, y, 17), new Vector3(-0.6, y, 12), new Vector3(-6.5, y, 12), new Vector3(-6.5, y, -1), new Vector3(-4.3, y, -1)],
    [new Vector3(1.1, y, 16), new Vector3(1.1, y, 13), new Vector3(6.6, y, 13), new Vector3(6.6, y, 0.4), new Vector3(4.3, y, 0.4)],
  ];
}

function lineGeometry(segments: [Vector3, Vector3][], delays: number[], phases: number[]) {
  const pos: number[] = [];
  const aT: number[] = [];
  const aDelay: number[] = [];
  const aPhase: number[] = [];
  segments.forEach(([a, b], i) => {
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
    aT.push(0, 1);
    aDelay.push(delays[i], delays[i]);
    aPhase.push(phases[i], phases[i]);
  });
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("aT", new Float32BufferAttribute(aT, 1));
  g.setAttribute("aDelay", new Float32BufferAttribute(aDelay, 1));
  g.setAttribute("aPhase", new Float32BufferAttribute(aPhase, 1));
  return g;
}

/**
 * Chapter 02 — Engineering. Scattered pieces settle into a three-tier system
 * on a precise grid; routed traces bring the signal in; data moves along
 * defined pathways. Solid, edge-lit volumes: constructed, not atmospheric.
 */
export function EngineeringWorld() {
  const root = useRef<Group>(null);
  const modules = useRef<InstancedMesh>(null);
  const hwGroup = useRef<Group>(null);
  const labels = useRef<(Mesh | null)[]>([]);
  const gl = useThree((s) => s.gl);

  const r = useMemo(() => {
    const n = MODULES.length;
    // One subdivided unit box, reshaped per instance in the vertex shader
    // (corrective pass 2026-11-15): tiers are discs, data stores are drums,
    // services are hexagonal prisms (hexagonal architecture), clients stay
    // slim slabs. Same instances, so the assembly and the Intelligence morph
    // are untouched.
    const box = new BoxGeometry(1, 1, 1, 24, 14, 24); // 14 rows: room for the cap chamfer
    const glow = new InstancedBufferAttribute(new Float32Array(n), 1);
    box.setAttribute("aGlow", glow);
    const shapeOf = (i: number) => (i < 3 ? 0 : i < 6 ? 1 : i < 12 ? 2 : 3);
    box.setAttribute("aShape", new InstancedBufferAttribute(new Float32Array(MODULES.map((_, i) => shapeOf(i))), 1));
    const moduleMat = machinedModuleMaterial();

    // Debris start states: scattered toward the arriving camera, tumbled.
    const rand = mulberry32(2026);
    const starts = MODULES.map((m, i) => {
      const platform = i < 3;
      const p = new Vector3(
        m.pos[0] * 1.5 + (rand() - 0.5) * 7,
        m.pos[1] + (platform ? -3 : (rand() - 0.3) * 4.5),
        m.pos[2] + 1.5 + rand() * 4.5,
      );
      const q = new Quaternion().setFromAxisAngle(
        new Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
        platform ? 0 : (rand() - 0.5) * 3,
      );
      return { p, q };
    });

    const links = pathways();
    const linkGeo = lineGeometry(
      links,
      links.map((_, i) => 0.1 + (i / links.length) * 0.5),
      links.map((_, i) => i * 0.23),
    );
    const linkMat = additive(
      dataLineFragment,
      { uTime: { value: 0 }, uReveal: { value: 0 }, uIntensity: { value: 0 }, uPulse: { value: 1.4 }, uColor: { value: HOLO_BLUE.clone() }, uAccent: { value: new Color(0.949, 0.931, 0.905) } },
      dataLineVertex,
    );

    const routed = traces().flatMap((pts, k) => pts.slice(1).map((p, j) => [pts[j], p, k, j] as const));
    const traceGeo = lineGeometry(
      routed.map(([a, b]) => [a, b]),
      routed.map(([, , k, j]) => k * 0.05 + j * 0.16),
      routed.map(([, , k]) => k * 0.31),
    );
    const traceMat = additive(
      dataLineFragment,
      { uTime: { value: 0 }, uReveal: { value: 0 }, uIntensity: { value: 0 }, uPulse: { value: 1 }, uColor: { value: HOLO_BLUE.clone() }, uAccent: { value: HOLO_CYAN.clone() } },
      dataLineVertex,
    );

    const gridGeo = new PlaneGeometry(60, 60);
    const gridMat = additive(
      floorGridFragment,
      { uIntensity: { value: 0 }, uTime: { value: 0 }, uCentre: { value: new Vector3(E.x, 0, E.z) }, uColor: { value: new Color(0.54, 0.511, 0.487) }, uAccent: { value: new Color(0.882, 0.859, 0.841) } },
      holoVertex,
    );

    const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
    const labelGeo = new PlaneGeometry(1.5, 0.375);
    const labelMats = LABEL_AT.map(
      (i) =>
        new ShaderMaterial({
          vertexShader: labelVertex,
          fragmentShader: labelFragment,
          uniforms: { uText: { value: createLabelTexture(MODULES[i].label!, aniso) }, uColor: { value: new Color(0.917, 0.909, 0.902) }, uIntensity: { value: 0 } },
          transparent: true,
          depthWrite: false,
          depthTest: false,
          blending: AdditiveBlending,
        }),
    );
    // Assembly hardware: corner standoffs between trays, two dowel pins under
    // every module, and a dashed assembly axis from each pin to its module.
    const hwMat = PBR.gunmetal({ transparent: true });
    const collarMat = PBR.aluminium({ transparent: true });
    const standoffs: { x: number; z: number; y0: number; y1: number }[] = [];
    for (let t = 0; t < 2; t++) {
      const upper = MODULES[t + 1];
      const hx = upper.size[0] / 2 - 0.35, hz = upper.size[2] / 2 - 0.3;
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) standoffs.push({ x: sx * hx, z: sz * hz, y0: TIER_Y[t] + 0.04, y1: TIER_Y[t + 1] - 0.04 });
    }
    const pins: Vector3[] = [];
    MODULES.forEach((m, i) => {
      if (i < 3) return;
      const tray = m.pos[1] < TIER_Y[1] ? TIER_Y[0] : m.pos[1] < TIER_Y[2] ? TIER_Y[1] : TIER_Y[2];
      const dx = m.size[0] * 0.3;
      pins.push(new Vector3(m.pos[0] - dx, tray + 0.04, m.pos[2]), new Vector3(m.pos[0] + dx, tray + 0.04, m.pos[2]));
    });
    const standoffGeo = new CylinderGeometry(0.05, 0.05, 1, 20);
    const collarGeo = new CylinderGeometry(0.085, 0.085, 0.05, 24);
    const pinGeo = new CylinderGeometry(0.03, 0.03, GAP * 0.7, 14).translate(0, (GAP * 0.7) / 2, 0);
    const axisPts: number[] = [];
    pins.forEach((p) => axisPts.push(p.x, p.y + GAP * 0.7, p.z, p.x, p.y + GAP + 0.02, p.z));
    const axisGeo = new BufferGeometry();
    axisGeo.setAttribute("position", new Float32BufferAttribute(axisPts, 3));
    const axisMat = new LineDashedMaterial({ color: new Color("#a39a8d"), dashSize: 0.03, gapSize: 0.025, transparent: true, opacity: 0, depthWrite: false });
    const hardware = { hwMat, collarMat, standoffs, pins, standoffGeo, collarGeo, pinGeo, axisGeo, axisMat };
    return { box, glow, moduleMat, starts, linkGeo, linkMat, traceGeo, traceMat, gridGeo, gridMat, labelGeo, labelMats, hardware };
  }, [gl]);

  // Upload label textures up front rather than on the first visible frame.
  useEffect(() => {
    const upload = () => r.labelMats.forEach((m) => gl.initTexture(m.uniforms.uText.value as Texture));
    upload();
    document.fonts?.ready.then(() => requestAnimationFrame(upload));
  }, [r, gl]);

  useEffect(
    () => () => {
      r.labelMats.forEach((m) => (m.uniforms.uText.value as { dispose: () => void }).dispose());
    },
    [r],
  );

  const tmp = useMemo(
    () => ({
      m: new Matrix4(),
      p: new Vector3(),
      q: new Quaternion(),
      s: new Vector3(),
      id: new Quaternion(),
      target: new Vector3(),
      target2: new Quaternion(),
      axis: new Vector3(),
    }),
    [],
  );

  useFrame((state) => {
    const tr = story.view.track - TRACK_SHIFT; // Milestone 003 units
    // Milestone 004: the architecture becomes the Intelligence network.
    const morph = smoothstep(MORPH.network[0], MORPH.network[1], story.view.track);
    const flexing = smoothstep(MORPH.flex[0], MORPH.flex[1], story.view.track);
    const visible = tr > WINDOW.engineering[0] && tr < WINDOW.engineering[1] && flexing < 0.999;
    if (root.current) root.current.visible = visible;
    if (!visible || !modules.current) return;
    modules.current.visible = morph < 0.999;
    const calm = story.reducedMotion ? 0.15 : 1;
    const t = state.clock.elapsedTime * calm;
    const presence = smoothstep(1.8, 2.1, tr);

    // Assembly: platforms first, then modules by tier, bottom-up.
    MODULES.forEach((m, i) => {
      const order = i < 3 ? i * 0.03 : 0.09 + (i - 3) * 0.02;
      const a = smoothstep(1.92 + order, 2.22 + order, tr);
      const e = 1 - Math.pow(1 - a, 3);
      const st = r.starts[i];
      tmp.p.set(...m.pos).sub(st.p).multiplyScalar(e).add(st.p);
      tmp.q.copy(st.q).slerp(tmp.id, e);
      const settled = a >= 1;
      // A settled module breathes very slightly; nothing else moves.
      const hover = settled ? 0 : Math.sin(t * 1.3 + i) * 0.05 * (1 - e);
      tmp.p.y += hover;
      const grow = i < 3 ? 0.05 + 0.95 * e : 0.55 + 0.45 * e;
      tmp.s.set(m.size[0] * grow, m.size[1], m.size[2] * (i < 3 ? 0.05 + 0.95 * e : grow));
      if (morph > 0) {
        // Each module lifts off its tier and travels to its network node,
        // shrinking toward the node's size (the node takes over as it arrives).
        const k = smoothstep(i * 0.02, 0.75 + i * 0.015, morph);
        const e2 = k * k * (3 - 2 * k);
        const node = NET_NODES[i % NET_NODES.length];
        tmp.p.lerp(tmp.target.set(...node.pos), e2);
        tmp.s.lerp(tmp.target.setScalar(node.size * 1.6), e2);
        tmp.q.slerp(tmp.target2.setFromAxisAngle(tmp.axis.set(0.3, 1, 0.2).normalize(), i * 0.7), e2);
      }
      tmp.m.compose(tmp.p, tmp.q, tmp.s);
      modules.current!.setMatrixAt(i, tmp.m);
      // Edges flare while a piece is in flight, then settle.
      r.glow.setX(i, (1 - e) * (a > 0 ? 1 : 0.4) + (settled ? 0.15 * (0.5 + 0.5 * Math.sin(t * 0.8 + i)) : 0));
    });
    modules.current.instanceMatrix.needsUpdate = true;
    r.glow.needsUpdate = true;

    r.moduleMat.opacity = presence * (1 - smoothstep(0.7, 1, morph));
    // Hardware appears once the trays have landed and leaves before the morph.
    const hw = presence * smoothstep(2.05, 2.25, tr) * (1 - smoothstep(0, 0.25, morph));
    r.hardware.hwMat.opacity = r.hardware.collarMat.opacity = hw;
    r.hardware.axisMat.opacity = hw * 0.55;
    if (hwGroup.current) hwGroup.current.visible = hw > 0.001;
    r.moduleMat.depthWrite = r.moduleMat.opacity > 0.98;

    const flow = smoothstep(2.2, 2.55, tr);
    r.linkMat.uniforms.uReveal.value = flow;
    r.linkMat.uniforms.uTime.value = t;
    const keep = 1 - smoothstep(0, 0.45, morph);
    r.linkMat.uniforms.uIntensity.value = presence * 1.8 * keep;
    r.traceMat.uniforms.uReveal.value = smoothstep(1.75, 2.3, tr);
    r.traceMat.uniforms.uTime.value = t;
    r.traceMat.uniforms.uIntensity.value = presence * 0.35 * keep;
    // The decorative floor grid is retired; the routed traces carry the meaning.
    r.gridMat.uniforms.uIntensity.value = 0;
    r.gridMat.uniforms.uTime.value = t;

    LABEL_AT.forEach((mi, k) => {
      const el = labels.current[k];
      if (!el) return;
      const m = MODULES[mi];
      el.position.set(m.pos[0], m.pos[1] + m.size[1] / 2 + 0.34, m.pos[2]);
      el.quaternion.copy(state.camera.quaternion);
      r.labelMats[k].uniforms.uIntensity.value = presence * keep * smoothstep(2.2 + k * 0.03, 2.45 + k * 0.03, tr);
    });
  });

  return (
    <group ref={root} visible={false}>
      <mesh
        geometry={r.gridGeo}
        material={r.gridMat}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[E.x, ENGINEERING_FLOOR, E.z]}
        renderOrder={1}
        frustumCulled={false}
      />
      <group position={E.toArray() as V3}>
        <lineSegments geometry={r.traceGeo} material={r.traceMat} renderOrder={2} frustumCulled={false} />
        <instancedMesh ref={modules} args={[r.box, r.moduleMat, MODULES.length]} frustumCulled={false} renderOrder={3} />
        <lineSegments geometry={r.linkGeo} material={r.linkMat} renderOrder={4} frustumCulled={false} />
        <group ref={hwGroup} visible={false}>
          {r.hardware.standoffs.map((st, k) => (
            <group key={`s${k}`} position={[st.x, 0, st.z]}>
              <mesh geometry={r.hardware.standoffGeo} material={r.hardware.hwMat} position={[0, (st.y0 + st.y1) / 2, 0]} scale={[1, st.y1 - st.y0, 1]} />
              <mesh geometry={r.hardware.collarGeo} material={r.hardware.collarMat} position={[0, st.y0 + 0.025, 0]} />
              <mesh geometry={r.hardware.collarGeo} material={r.hardware.collarMat} position={[0, st.y1 - 0.025, 0]} />
            </group>
          ))}
          {r.hardware.pins.map((p, k) => (
            <mesh key={`p${k}`} geometry={r.hardware.pinGeo} material={r.hardware.hwMat} position={p} />
          ))}
          <lineSegments geometry={r.hardware.axisGeo} material={r.hardware.axisMat} onUpdate={(l) => l.computeLineDistances()} />
        </group>
        {LABEL_AT.map((mi, k) => (
          <mesh
            key={mi}
            ref={(el) => {
              labels.current[k] = el;
            }}
            geometry={r.labelGeo}
            material={r.labelMats[k]}
            renderOrder={5}
          />
        ))}
      </group>
    </group>
  );
}

