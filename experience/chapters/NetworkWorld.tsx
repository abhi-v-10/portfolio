"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BoxGeometry,
  BufferGeometry,
  Color,
  CustomBlending,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  OneFactor,
  OneMinusSrcAlphaFactor,
  PlaneGeometry,
  Points,
  Quaternion,
  RingGeometry,
  ShaderMaterial,
  Texture,
  Vector3,
} from "three";
import { story } from "../director/store";
import { labelFragment, labelVertex } from "../shaders/chapters";
import { nodeFragment, nodeVertex } from "../shaders/hologram";
import { blobFragment, blobVertex, ribbonFragment, ribbonVertex, voxelFragment, voxelVertex } from "../shaders/network";
import { createLabelTexture } from "../world/panelText";
import { smoothstep } from "../world/paths";
import { ENGINEERING_CENTRE as E, MORPH, mulberry32, NET_EDGES, NET_FLOW, NET_NODES } from "./layout";

type V3 = [number, number, number];
const CENTRE = new Vector3(0, 3.6, 0);
/**
 * Expression words that settle onto three of the forms. "Tinker" was dropped
 * (Milestone 004A): its node lands behind the copy column on desktop.
 */
const EXPRESSION_WORDS: [number, string][] = [
  [2, "Design"],
  [0, "3D web"],
  [5, "Motion"],
];
const LABELLED = NET_NODES.map((n, i) => (n.label ? i : -1)).filter((i) => i >= 0);

/** Control point for an edge: bowed outward from the network centre. */
function controlFor(a: Vector3, b: Vector3, out: Vector3) {
  out.addVectors(a, b).multiplyScalar(0.5);
  const away = out.clone().sub(CENTRE).normalize();
  return out.addScaledVector(away, 0.9).add(new Vector3(0, 0.35, 0));
}
const bez = (a: Vector3, c: Vector3, b: Vector3, t: number, out: Vector3) => {
  const u = 1 - t;
  return out.set(0, 0, 0).addScaledVector(a, u * u).addScaledVector(c, 2 * u * t).addScaledVector(b, t * t);
};

/**
 * Chapters 03–04: Intelligence → Expression, one object set in one place.
 * Engineering modules arrive at these nodes; connections carry an agent's
 * request (intent → LLM → tool → internal API → live data → result); then the
 * same connections loosen into ribbons and the nodes soften into forms as the
 * palette warms. Every state is a function of the scroll track, so it reverses
 * exactly. Idle motion (pulses, breathing) is time-based and never scroll-owned.
 */
export function NetworkWorld({ lowPower }: { lowPower: boolean }) {
  const root = useRef<Group>(null);
  const blobs = useRef<InstancedMesh>(null);
  const packets = useRef<Points>(null);
  const voxels = useRef<InstancedMesh>(null);
  const reticle = useRef<Group>(null);
  const intelLabels = useRef<(Mesh | null)[]>([]);
  const exprLabels = useRef<(Mesh | null)[]>([]);
  const gl = useThree((s) => s.gl);

  const r = useMemo(() => {
    const nodes = NET_NODES.map((n) => new Vector3(...n.pos));
    const SEG = lowPower ? 28 : 48;

    // Ribbons: one strip per edge; the curve is evaluated in the vertex shader.
    const pos: number[] = [];
    const aA: number[] = [];
    const aB: number[] = [];
    const aC: number[] = [];
    const aT: number[] = [];
    const aSide: number[] = [];
    const aSeed: number[] = [];
    const index: number[] = [];
    const rand = mulberry32(404);
    const controls: Vector3[] = [];
    NET_EDGES.forEach(([i, j]) => {
      const a = nodes[i];
      const b = nodes[j];
      const c = controlFor(a, b, new Vector3());
      controls.push(c);
      const seed = rand();
      const base = pos.length / 3;
      for (let s = 0; s <= SEG; s++) {
        for (const side of [-1, 1]) {
          pos.push(c.x, c.y, c.z);
          aA.push(a.x, a.y, a.z);
          aB.push(b.x, b.y, b.z);
          aC.push(c.x, c.y, c.z);
          aT.push(s / SEG);
          aSide.push(side);
          aSeed.push(seed);
        }
        if (s < SEG) {
          const k = base + s * 2;
          index.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
        }
      }
    });
    const ribbonGeo = new BufferGeometry();
    ribbonGeo.setAttribute("position", new Float32BufferAttribute(pos, 3));
    ribbonGeo.setAttribute("aA", new Float32BufferAttribute(aA, 3));
    ribbonGeo.setAttribute("aB", new Float32BufferAttribute(aB, 3));
    ribbonGeo.setAttribute("aC", new Float32BufferAttribute(aC, 3));
    ribbonGeo.setAttribute("aT", new Float32BufferAttribute(aT, 1));
    ribbonGeo.setAttribute("aSide", new Float32BufferAttribute(aSide, 1));
    ribbonGeo.setAttribute("aSeed", new Float32BufferAttribute(aSeed, 1));
    ribbonGeo.setIndex(index);
    const ribbonMat = new ShaderMaterial({
      vertexShader: ribbonVertex,
      fragmentShader: ribbonFragment,
      uniforms: {
        uTime: { value: 0 },
        uFlex: { value: 0 },
        uReveal: { value: 0 },
        uIntensity: { value: 0 },
        uWidth: { value: 0.014 },
        uWidthFlex: { value: 0.26 },
        uCold: { value: new Color(0.3, 0.55, 1.0) },
        uPulse: { value: new Color(0.75, 0.97, 1.0) },
      },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      side: 2,
    });

    // Nodes → forms.
    const blobGeo = new IcosahedronGeometry(1, lowPower ? 3 : 4);
    blobGeo.setAttribute("aSeed", new InstancedBufferAttribute(new Float32Array(NET_NODES.map((_, i) => (i * 0.137) % 1)), 1));
    // The Result node keeps a warm gold core: where the request becomes understanding.
    blobGeo.setAttribute("aWarm", new InstancedBufferAttribute(new Float32Array(NET_NODES.map((n) => (n.label === "Result" ? 1 : 0))), 1));
    const blobMat = new ShaderMaterial({
      vertexShader: blobVertex,
      fragmentShader: blobFragment,
      uniforms: { uTime: { value: 0 }, uFlex: { value: 0 }, uIntensity: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: CustomBlending,
      blendSrc: OneFactor,
      blendDst: OneMinusSrcAlphaFactor,
    });

    // Request packets travelling the agent's path.
    const PACKETS = 3;
    const packetGeo = new BufferGeometry();
    packetGeo.setAttribute("position", new Float32BufferAttribute(new Float32Array(PACKETS * 3), 3));
    packetGeo.setAttribute("aDelay", new Float32BufferAttribute(new Float32Array(PACKETS), 1));
    packetGeo.setAttribute("aSize", new Float32BufferAttribute(new Float32Array(PACKETS).fill(30), 1));
    const packetMat = new ShaderMaterial({
      vertexShader: nodeVertex,
      fragmentShader: nodeFragment,
      uniforms: { uReveal: { value: 1 }, uIntensity: { value: 0 }, uTime: { value: 0 }, uScale: { value: 1 }, uColor: { value: new Color(0.8, 0.97, 1.0) } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });

    // Labels: Intelligence roles, then Expression words.
    const aniso = Math.min(8, gl.capabilities.getMaxAnisotropy());
    const labelGeo = new PlaneGeometry(1.5, 0.375);
    const labelMat = (text: string, color: Color) =>
      new ShaderMaterial({
        vertexShader: labelVertex,
        fragmentShader: labelFragment,
        uniforms: { uText: { value: createLabelTexture(text, aniso) }, uColor: { value: color }, uIntensity: { value: 0 } },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: AdditiveBlending,
      });
    const intelMats = LABELLED.map((i) => labelMat(NET_NODES[i].label!, new Color(0.62, 0.92, 1.0)));
    const exprMats = EXPRESSION_WORDS.map(([, w]) => labelMat(w, new Color(1.0, 0.9, 0.82)));

    // Gaming layer: a small voxel cluster that keeps rebuilding itself, and a reticle.
    const voxelGeo = new BoxGeometry(0.3, 0.3, 0.3);
    const vox: { home: Vector3; dir: Vector3 }[] = [];
    const colors: number[] = [];
    const tones = [new Color(1.0, 0.62, 0.44), new Color(0.98, 0.88, 0.76), new Color(0.95, 0.45, 0.66), new Color(0.38, 0.86, 0.9)];
    for (let x = -1; x <= 1; x++)
      for (let y = -1; y <= 1; y++)
        for (let z = -1; z <= 1; z++) {
          const home = new Vector3(x, y, z).multiplyScalar(0.32);
          vox.push({ home, dir: home.clone().add(new Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(0.4)).normalize() });
          const c = tones[Math.floor(rand() * tones.length)];
          colors.push(c.r, c.g, c.b);
        }
    voxelGeo.setAttribute("aColor", new InstancedBufferAttribute(new Float32Array(colors), 3));
    const voxelMat = new ShaderMaterial({
      vertexShader: voxelVertex,
      fragmentShader: voxelFragment,
      uniforms: { uOpacity: { value: 0 } },
      transparent: true,
    });
    const ringGeo = new RingGeometry(0.42, 0.45, 64);
    const tickGeo = new PlaneGeometry(0.03, 0.2);
    const reticleMat = new MeshBasicMaterial({ color: new Color(1.0, 0.9, 0.82), transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false });

    return {
      nodes,
      controls,
      ribbonGeo,
      ribbonMat,
      blobGeo,
      blobMat,
      packetGeo,
      packetMat,
      PACKETS,
      labelGeo,
      intelMats,
      exprMats,
      voxelGeo,
      voxelMat,
      vox,
      ringGeo,
      tickGeo,
      reticleMat,
    };
  }, [lowPower, gl]);

  // Upload label textures up front (no first-view hitch), and again after webfonts.
  useEffect(() => {
    const all = [...r.intelMats, ...r.exprMats];
    const upload = () => all.forEach((m) => gl.initTexture(m.uniforms.uText.value as Texture));
    upload();
    document.fonts?.ready.then(() => requestAnimationFrame(upload));
    return () => all.forEach((m) => (m.uniforms.uText.value as Texture).dispose());
  }, [r, gl]);

  const tmp = useMemo(
    () => ({ m: new Matrix4(), p: new Vector3(), c: new Vector3(), w: new Vector3(), ndc: new Vector3(), s: new Vector3(), quat: new Quaternion() }),
    [],
  );

  useFrame((state) => {
    const tr = story.view.track;
    const net = smoothstep(MORPH.network[0] + 0.12, MORPH.network[1] + 0.05, tr);
    const visible = tr > MORPH.network[0] && tr < 6.9;
    if (root.current) root.current.visible = visible;
    if (!visible || !blobs.current) return;
    const reduced = story.reducedMotion;
    const t = state.clock.elapsedTime * (reduced ? 0.15 : 1);
    const flex = smoothstep(MORPH.flex[0], MORPH.flex[1], tr);
    const presence = net;

    // Ribbons: drawn on as the network forms, then they loosen and widen.
    const rm = r.ribbonMat.uniforms;
    rm.uTime.value = t;
    rm.uFlex.value = flex;
    rm.uReveal.value = smoothstep(MORPH.network[0] + 0.15, MORPH.network[1] + 0.25, tr) * 1.4;
    rm.uIntensity.value = presence * (0.9 + 0.3 * flex);

    // Pointer: the node nearest the cursor answers (scales up, label brightens).
    const px = story.pointer.x;
    const py = story.pointer.y;
    let hot = -1;
    let hotD = 0.16;
    const cam = state.camera;
    LABELLED.forEach((i) => {
      tmp.ndc.copy(r.nodes[i]).add(E).project(cam);
      const d = Math.hypot(tmp.ndc.x - px, tmp.ndc.y - py);
      if (d < hotD) {
        hotD = d;
        hot = i;
      }
    });

    // Nodes: small bright cores → large soft forms (labelled nodes grow most).
    NET_NODES.forEach((n, i) => {
      const appear = smoothstep(0.35 + (i % 8) * 0.05, 0.85 + (i % 8) * 0.02, net);
      const big = n.label ? 0.56 + (i % 3) * 0.16 : 0.22 + (i % 2) * 0.08;
      let s = (n.size + (big - n.size) * flex) * appear;
      if (i === hot && !reduced) s *= 1.35 - flex * 0.2;
      const bob = reduced ? 0 : Math.sin(t * 0.5 + i) * 0.12 * flex;
      tmp.p.copy(r.nodes[i]);
      tmp.p.y += bob;
      tmp.m.compose(tmp.p, tmp.quat, tmp.s.setScalar(Math.max(0.0001, s)));
      blobs.current!.setMatrixAt(i, tmp.m);
    });
    blobs.current.instanceMatrix.needsUpdate = true;
    r.blobMat.uniforms.uTime.value = t;
    r.blobMat.uniforms.uFlex.value = flex;
    r.blobMat.uniforms.uIntensity.value = presence;

    // Packets: one agent request walking intent → LLM → tool → API → data → result.
    const pp = r.packetGeo.attributes.position as Float32BufferAttribute;
    const hops = NET_FLOW.length - 1;
    for (let k = 0; k < r.PACKETS; k++) {
      const u = ((t * 0.16 + k / r.PACKETS) % 1) * hops;
      const h = Math.floor(u);
      const f = u - h;
      const a = NET_FLOW[h];
      const b = NET_FLOW[h + 1];
      const ei = NET_EDGES.findIndex(([x, y]) => (x === a && y === b) || (x === b && y === a));
      const fwd = ei >= 0 && NET_EDGES[ei][0] === a;
      const c = ei >= 0 ? r.controls[ei] : tmp.c.addVectors(r.nodes[a], r.nodes[b]).multiplyScalar(0.5);
      const A = fwd || ei < 0 ? r.nodes[a] : r.nodes[b];
      const B = fwd || ei < 0 ? r.nodes[b] : r.nodes[a];
      const tt = fwd || ei < 0 ? f : 1 - f;
      bez(A, c, B, tt, tmp.p);
      pp.setXYZ(k, tmp.p.x, tmp.p.y, tmp.p.z);
    }
    pp.needsUpdate = true;
    r.packetMat.uniforms.uTime.value = t;
    r.packetMat.uniforms.uIntensity.value = presence * (1 - flex) * (reduced ? 0.6 : 1);
    r.packetMat.uniforms.uScale.value = state.viewport.dpr * state.size.height * 0.012;

    // Labels: roles in Intelligence, interests in Expression.
    LABELLED.forEach((ni, k) => {
      const el = intelLabels.current[k];
      if (!el) return;
      el.position.copy(r.nodes[ni]).add(tmp.w.set(0, NET_NODES[ni].size + 0.42, 0));
      el.quaternion.copy(cam.quaternion);
      const on = smoothstep(0.6 + k * 0.03, 0.95, net) * (1 - smoothstep(0, 0.4, flex));
      r.intelMats[k].uniforms.uIntensity.value = on * (ni === hot ? 1.25 : 0.85);
    });
    EXPRESSION_WORDS.forEach(([ni], k) => {
      const el = exprLabels.current[k];
      if (!el) return;
      const big = 0.56 + (ni % 3) * 0.16;
      el.position.copy(r.nodes[ni]).add(tmp.w.set(0, big * flex + 0.55, 0));
      el.quaternion.copy(cam.quaternion);
      // Portrait: the copy sits over the world and already names these words.
      const portrait = state.size.width < state.size.height;
      r.exprMats[k].uniforms.uIntensity.value = smoothstep(0.6 + k * 0.08, 1, flex) * (portrait ? 0 : 1);
    });

    // Gaming layer: voxels build, pop a block, rebuild; a reticle tracks the pointer.
    const gv = smoothstep(0.45, 1, flex);
    r.voxelMat.uniforms.uOpacity.value = gv;
    if (voxels.current) {
      const home = r.nodes[5];
      r.vox.forEach((v, i) => {
        const cycle = reduced ? 0 : Math.max(0, Math.sin(t * 0.9 + i * 0.37));
        const pop = Math.pow(cycle, 6) * 0.55;
        tmp.p.copy(v.home).addScaledVector(v.dir, pop + (1 - gv) * 1.2).add(home).add(tmp.w.set(1.25, 0.9, 0.6));
        tmp.m.makeRotationY(t * 0.25).setPosition(tmp.p);
        tmp.m.scale(tmp.s.setScalar(gv));
        voxels.current!.setMatrixAt(i, tmp.m);
      });
      voxels.current.instanceMatrix.needsUpdate = true;
    }
    if (reticle.current) {
      reticle.current.position.copy(r.nodes[5]).add(tmp.w.set(-1.1 + px * 0.5, 1.4 + py * 0.4, 0.8));
      reticle.current.quaternion.copy(cam.quaternion);
      r.reticleMat.opacity = gv * 0.7;
    }
  });

  return (
    <group ref={root} position={E.toArray() as V3} visible={false}>
      <mesh geometry={r.ribbonGeo} material={r.ribbonMat} renderOrder={3} frustumCulled={false} />
      <instancedMesh ref={blobs} args={[r.blobGeo, r.blobMat, NET_NODES.length]} frustumCulled={false} renderOrder={4} />
      <points ref={packets} geometry={r.packetGeo} material={r.packetMat} renderOrder={6} frustumCulled={false} />
      <instancedMesh ref={voxels} args={[r.voxelGeo, r.voxelMat, r.vox.length]} frustumCulled={false} renderOrder={5} />
      <group ref={reticle}>
        <mesh geometry={r.ringGeo} material={r.reticleMat} />
        {[0, 1, 2, 3].map((k) => (
          <mesh
            key={k}
            geometry={r.tickGeo}
            material={r.reticleMat}
            position={[Math.cos((k * Math.PI) / 2) * 0.6, Math.sin((k * Math.PI) / 2) * 0.6, 0]}
            rotation={[0, 0, (k * Math.PI) / 2 + Math.PI / 2]}
          />
        ))}
      </group>
      {LABELLED.map((ni, k) => (
        <mesh
          key={`i${ni}`}
          ref={(el) => {
            intelLabels.current[k] = el;
          }}
          geometry={r.labelGeo}
          material={r.intelMats[k]}
          renderOrder={7}
        />
      ))}
      {EXPRESSION_WORDS.map(([ni], k) => (
        <mesh
          key={`x${ni}`}
          ref={(el) => {
            exprLabels.current[k] = el;
          }}
          geometry={r.labelGeo}
          material={r.exprMats[k]}
          renderOrder={7}
        />
      ))}
    </group>
  );
}
