"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshPhysicalMaterial,
  PlaneGeometry,
  PointLight,
  Raycaster,
  ShaderMaterial,
  Texture,
  TubeGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { story } from "../director/store";
import { labelFragment, labelVertex } from "../shaders/chapters";
import { PBR } from "../world/materials";
import { boltCircle, contactShadow, flange, housing } from "../world/parts";
import { createLabelTexture } from "../world/panelText";
import { smoothstep } from "../world/paths";
import { CURIOSITY_CENTRE, TRACK_SHIFT, WINDOW } from "./layout";
import { faceCamera } from "./UniverseWorld";

/**
 * Chapter 01 — Curiosity (rebuilt 2026-11-25). "The whole system", shown as
 * one: a deployment plinth carrying the parts the copy names (front end, API,
 * authentication, database, AI services), each a machined module on standoffs,
 * joined by gunmetal conduits that carry copper request packets. Pointing at a
 * module lifts it and lights only its routes; with no pointer the attention
 * walks the request path on its own. Physical materials only; no wireframes,
 * terrain or glow.
 */

type NodeId = "front" | "api" | "auth" | "db" | "ai";
type NodeSpec = { id: NodeId; label: string; pos: Vector3 };

const C = new Vector3(CURIOSITY_CENTRE.x + 0.8, CURIOSITY_CENTRE.y - 0.6, CURIOSITY_CENTRE.z - 2.2);
const PLINTH_Y = -1.35;
const NODES: NodeSpec[] = [
  { id: "front", label: "Front end", pos: new Vector3(-2.7, -0.55, 1.1) },
  { id: "api", label: "API", pos: new Vector3(-0.2, -0.4, 0.2) },
  { id: "auth", label: "Auth", pos: new Vector3(-0.9, -0.15, -1.55) },
  { id: "db", label: "Database", pos: new Vector3(1.7, -0.5, -1.5) },
  { id: "ai", label: "AI services", pos: new Vector3(2.85, -0.45, 1.05) },
];
const LINKS: [NodeId, NodeId][] = [
  ["front", "api"],
  ["api", "auth"],
  ["api", "db"],
  ["api", "ai"],
  ["ai", "db"],
];
/** Half height of each module body, so standoffs stop at its underside. */
const HALF: Record<NodeId, number> = { front: 0.18, api: 0.21, auth: 0.15, db: 0.3, ai: 0.275 };
const WALK: NodeId[] = ["front", "api", "auth", "api", "ai", "db"];
const byId = (id: NodeId) => NODES.find((n) => n.id === id)!;

/** A conduit between two modules, cabled like real hardware: down to the plinth, along it, and up. */
function route(a: Vector3, b: Vector3) {
  const y = PLINTH_Y + 0.12;
  const a0 = new Vector3(a.x, a.y - 0.2, a.z);
  const b0 = new Vector3(b.x, b.y - 0.2, b.z);
  return new CatmullRomCurve3([a0, new Vector3(a.x, y, a.z), new Vector3((a.x + b.x) / 2, y, (a.z + b.z) / 2), new Vector3(b.x, y, b.z), b0], false, "catmullrom", 0.05);
}

export function CuriosityWorld({ lowPower }: { lowPower: boolean }) {
  const root = useRef<Group>(null);
  const nodeRefs = useRef<(Group | null)[]>([]);
  const packetRefs = useRef<(Mesh | null)[]>([]);
  const labelRefs = useRef<(Mesh | null)[]>([]);
  const light = useRef<PointLight>(null);
  const stage = useRef<Group>(null);
  const gl = useThree((s) => s.gl);

  const r = useMemo(() => {
    const T = { transparent: true };
    const mat = {
      plinth: PBR.powder(T),
      ano: PBR.anodised(T),
      alu: PBR.aluminium({ ...T, repeat: [2, 1] }),
      ti: PBR.titanium(T),
      steel: PBR.gunmetal(T),
      cu: PBR.copper(T),
      packet: PBR.statusLed(T),
      shadow: contactShadow(0.55),
    };
    const highlight = new Color("#c8794a");
    // Each module's body gets its own material instance so it can take a copper edge when active.
    const bodyMats = NODES.map((n) => (n.id === "api" || n.id === "ai" ? PBR.titanium(T) : n.id === "front" ? PBR.aluminium(T) : PBR.anodised(T)));
    const geo = {
      plinth: new RoundedBoxGeometry(7.6, 0.14, 4.6, 4, 0.04),
      plinthBolts: boltCircle(4, 0.01, 0.03, 0.012),
      shadow: new PlaneGeometry(9, 6).rotateX(-Math.PI / 2),
      standoff: new CylinderGeometry(0.035, 0.035, 1, 16),
      collar: flange(0.07, 0.03, 0.008),
      front: new RoundedBoxGeometry(1.4, 0.36, 0.95, 4, 0.05),
      api: housing(0.62, 0.42, 0.05, 64),
      auth: housing(0.38, 0.3, 0.035, 48),
      dbDisc: housing(0.58, 0.16, 0.025, 64),
      ai: new RoundedBoxGeometry(1.15, 0.55, 0.9, 4, 0.06),
      bolts: boltCircle(6, 0.46, 0.018, 0.01),
      band: flange(0.625, 0.02, 0.005, 64),
      packet: new CylinderGeometry(0.035, 0.035, 0.12, 12).rotateX(Math.PI / 2),
    };
    const links = LINKS.map(([a, b]) => {
      const curve = route(byId(a).pos, byId(b).pos);
      return { a, b, curve, geo: new TubeGeometry(curve, lowPower ? 40 : 80, 0.028, 10, false) as BufferGeometry };
    });
    const labelGeo = new PlaneGeometry(1.5, 0.375);
    const labelMats = NODES.map(
      () =>
        new ShaderMaterial({
          vertexShader: labelVertex,
          fragmentShader: labelFragment,
          uniforms: { uText: { value: null as Texture | null }, uColor: { value: new Color("#ece6da") }, uIntensity: { value: 0 } },
          transparent: true,
          depthWrite: false,
          depthTest: false,
          blending: AdditiveBlending,
        }),
    );
    return { mat, bodyMats, highlight, geo, links, labelGeo, labelMats };
  }, [lowPower]);

  // Label textures need the document (fonts); create them on the client.
  useEffect(() => {
    const aniso = gl.capabilities.getMaxAnisotropy();
    const texs = NODES.map((n, i) => {
      const t = createLabelTexture(n.label, aniso);
      r.labelMats[i].uniforms.uText.value = t;
      return t;
    });
    return () => texs.forEach((t) => t.dispose());
  }, [r, gl]);

  const st = useRef({ active: 0, lastWalk: 0, walk: 0, hover: -1, lift: NODES.map(() => 0) });
  const ray = useMemo(() => ({ caster: new Raycaster(), p: new Vector2(), tmp: new Vector3() }), []);

  useFrame((state, dt) => {
    const tr = story.view.track - TRACK_SHIFT; // Milestone 003 units
    const visible = tr > WINDOW.curiosity[0] && tr < WINDOW.curiosity[1];
    if (root.current) root.current.visible = visible;
    if (!visible) return;
    const t = state.clock.elapsedTime;
    const reduced = story.reducedMotion;
    const presence = smoothstep(0.5, 1.0, tr) * (1 - smoothstep(1.8, 2.2, tr));
    const S = st.current;
    // Portrait: the copy owns the lower half, so the model rises above the title.
    if (stage.current) {
      const portrait = state.size.width / state.size.height < 0.8;
      stage.current.position.set(C.x, C.y + (portrait ? 3.4 : 0), C.z);
      stage.current.scale.setScalar(portrait ? 1.05 : 1.3);
    }

    // Hover: ray from the pointer against module bodies.
    let hover = -1;
    if (presence > 0.6 && (story.pointer.x !== 0 || story.pointer.y !== 0)) {
      ray.p.set(story.pointer.x, story.pointer.y);
      ray.caster.setFromCamera(ray.p, state.camera);
      const bodies = nodeRefs.current.filter(Boolean) as Group[];
      const hit = ray.caster.intersectObjects(bodies, true)[0];
      if (hit) {
        let o: typeof hit.object | null = hit.object;
        while (o && !bodies.includes(o as Group)) o = o.parent;
        hover = o ? bodies.indexOf(o as Group) : -1;
      }
    }
    S.hover = hover;
    // No pointer on a module: attention walks the request path.
    if (hover < 0 && t - S.lastWalk > (reduced ? 4 : 2.4)) {
      S.walk = (S.walk + 1) % WALK.length;
      S.lastWalk = t;
    }
    const activeId = hover >= 0 ? NODES[hover].id : WALK[S.walk];
    const active = NODES.findIndex((n) => n.id === activeId);

    // Mats fade with the chapter.
    Object.values(r.mat).forEach((m) => {
      if (m === r.mat.shadow) m.opacity = presence * 0.55;
      else m.opacity = presence;
    });
    r.bodyMats.forEach((m, i) => {
      m.opacity = presence;
      const on = i === active ? 1 : 0;
      (m as MeshPhysicalMaterial).emissive.copy(r.highlight).multiplyScalar(0.12 * on);
    });
    if (light.current) light.current.intensity = 26 * presence;

    // Modules rise into place one after another, then the active one lifts a little.
    NODES.forEach((n, i) => {
      const g = nodeRefs.current[i];
      if (!g) return;
      const rise = smoothstep(0.5 + i * 0.05, 0.85 + i * 0.05, tr);
      const target = i === active ? 0.14 : 0;
      S.lift[i] += (target - S.lift[i]) * Math.min(1, dt * (reduced ? 20 : 6));
      g.position.set(n.pos.x, n.pos.y - (1 - rise) * 0.8 + S.lift[i], n.pos.z);
      g.scale.setScalar(0.85 + 0.15 * rise);
      r.labelMats[i].uniforms.uIntensity.value = presence * rise * (i === active ? 1 : 0.55);
      const lb = labelRefs.current[i];
      if (lb) faceCamera(lb, state.camera.quaternion);
    });

    // Packets ride the conduits; the active module's routes run brighter and faster.
    r.links.forEach((l, k) => {
      const p = packetRefs.current[k];
      if (!p) return;
      const on = l.a === activeId || l.b === activeId;
      const speed = reduced ? 0 : on ? 0.45 : 0.16;
      const u = reduced ? 0.5 : (t * speed + k * 0.23) % 1;
      l.curve.getPointAt(u, ray.tmp);
      p.position.copy(ray.tmp);
      l.curve.getTangentAt(u, ray.tmp);
      p.lookAt(ray.tmp.add(p.position));
      p.visible = on || !reduced;
      p.scale.setScalar(on ? 1.2 : 0.8);
    });
  });

  return (
    <>
    {/* Outside the gated group, so toggling the chapter never changes the light count. */}
    <pointLight ref={light} color="#fff1e2" position={[C.x - 1.5, C.y + 3.2, C.z + 3.5]} intensity={0} distance={14} decay={2} />
    <group ref={root} visible={false}>
      <group ref={stage} position={C.toArray() as [number, number, number]} rotation={[0.32, -0.38, 0]} scale={1.3}>
        {/* Deployment: the plinth everything runs on. */}
        <mesh geometry={r.geo.shadow} material={r.mat.shadow} position={[0, PLINTH_Y - 0.08, 0]} />
        <mesh geometry={r.geo.plinth} material={r.mat.plinth} position={[0, PLINTH_Y, 0]} />
        {[-3.5, 3.5].flatMap((x) =>
          [-2.0, 2.0].map((z) => <mesh key={`${x}${z}`} geometry={r.geo.plinthBolts} material={r.mat.steel} position={[x, PLINTH_Y + 0.07, z]} />),
        )}
        {NODES.map((n, i) => {
          const h = Math.max(0.05, n.pos.y - HALF[n.id] - PLINTH_Y - 0.07);
          return (
            <group key={n.id}>
              {/* Standoff from the plinth to the module, with collars. */}
              {[-0.3, 0.3].map((dx) => (
                <group key={dx} position={[n.pos.x + dx, 0, n.pos.z]}>
                  <mesh geometry={r.geo.standoff} material={r.mat.steel} position={[0, PLINTH_Y + 0.07 + h / 2, 0]} scale={[1, h, 1]} />
                  <mesh geometry={r.geo.collar} material={r.mat.alu} position={[0, PLINTH_Y + 0.07, 0]} />
                </group>
              ))}
              <group
                ref={(el) => {
                  nodeRefs.current[i] = el;
                }}
              >
                {n.id === "front" && <mesh geometry={r.geo.front} material={r.bodyMats[i]} />}
                {n.id === "api" && (
                  <>
                    <mesh geometry={r.geo.api} material={r.bodyMats[i]} position={[0, -0.21, 0]} />
                    <mesh geometry={r.geo.band} material={r.mat.cu} position={[0, -0.02, 0]} />
                    <mesh geometry={r.geo.bolts} material={r.mat.steel} position={[0, 0.21, 0]} />
                  </>
                )}
                {n.id === "auth" && <mesh geometry={r.geo.auth} material={r.bodyMats[i]} position={[0, -0.15, 0]} />}
                {n.id === "db" &&
                  [0, 1, 2].map((k) => <mesh key={k} geometry={r.geo.dbDisc} material={r.bodyMats[i]} position={[0, -0.3 + k * 0.22, 0]} />)}
                {n.id === "ai" && <mesh geometry={r.geo.ai} material={r.bodyMats[i]} />}
                <mesh geometry={r.labelGeo} material={r.labelMats[i]} position={[0, 0.62, 0]} renderOrder={5}
                  ref={(el) => {
                    labelRefs.current[i] = el;
                  }}
                />
              </group>
            </group>
          );
        })}
        {r.links.map((l, k) => (
          <group key={k}>
            <mesh geometry={l.geo} material={r.mat.steel} />
            <mesh
              ref={(el) => {
                packetRefs.current[k] = el;
              }}
              geometry={r.geo.packet}
              material={r.mat.packet}
            />
          </group>
        ))}
      </group>
    </group>
    </>
  );
}

/** Helper for other chapters: the point where the exploration converges again. */
export const CONVERGE = new Vector3(9.6, 1.6, -47);
