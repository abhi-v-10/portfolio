import {
  BufferGeometry,
  CanvasTexture,
  CylinderGeometry,
  LatheGeometry,
  MeshBasicMaterial,
  Vector2,
  type Texture,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Machined-part geometry (2026-11-25): lathe profiles with real chamfers,
 * fastener rings and flanges, merged into single geometries so a whole
 * fastener ring is one draw call. Units are world units; Y is the turning axis.
 */

/** A turned part from a profile of [radius, y] points (bottom to top). */
export function turned(profile: [number, number][], segments = 48) {
  return new LatheGeometry(profile.map(([r, y]) => new Vector2(r, y)), segments);
}

/** A flat flange with chamfered edges: radius r, thickness h, chamfer c. */
export function flange(r: number, h: number, c = Math.min(h * 0.3, 0.01), segments = 56) {
  return turned(
    [
      [0, 0],
      [r - c, 0],
      [r, c],
      [r, h - c],
      [r - c, h],
      [0, h],
    ],
    segments,
  );
}

/** A housing: a cylinder with chamfered ends and a shallow recessed cap line. */
export function housing(r: number, h: number, c = r * 0.08, segments = 56) {
  const k = c * 0.5;
  return turned(
    [
      [0, 0],
      [r - c, 0],
      [r, c],
      [r, h * 0.5 - k],
      [r - k, h * 0.5],
      [r, h * 0.5 + k],
      [r, h - c],
      [r - c, h],
      [0, h],
    ],
    segments,
  );
}

/** Socket-head cap screw, head only (what shows on a cover): hex socket hinted by a darker inner ring. */
function capScrew(r: number, h: number) {
  const head = new CylinderGeometry(r, r * 1.02, h, 14, 1);
  head.translate(0, h / 2, 0);
  return head;
}

/** n cap screws evenly on a circle of radius R in the XZ plane, merged. */
export function boltCircle(n: number, R: number, r: number, h: number, phase = 0) {
  const parts: BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const a = phase + (i / n) * Math.PI * 2;
    const g = capScrew(r, h);
    g.translate(Math.cos(a) * R, 0, Math.sin(a) * R);
    parts.push(g);
  }
  return mergeGeometries(parts)!;
}

/** Re-orient a Y-axis part to lie along X (joint axes) or Z (links). */
export const alongX = (g: BufferGeometry) => g.rotateZ(-Math.PI / 2);
export const alongZ = (g: BufferGeometry) => g.rotateX(Math.PI / 2);

let shadowTex: Texture | null = null;
/** Soft contact shadow under an object: a radial falloff, drawn once. */
export function contactShadow(opacity = 0.55) {
  if (!shadowTex && typeof document !== "undefined") {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.45, "rgba(0,0,0,0.55)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    shadowTex = new CanvasTexture(c);
  }
  return new MeshBasicMaterial({ map: shadowTex, transparent: true, opacity, depthWrite: false, color: "#000000" });
}

let rectTex: Texture | null = null;
/** Soft rectangular shadow (a print or panel lifted off a surface), drawn once. */
export function softRectShadow() {
  if (!rectTex && typeof document !== "undefined") {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d")!;
    ctx.filter = "blur(10px)";
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(22, 22, 84, 84);
    rectTex = new CanvasTexture(c);
  }
  return new MeshBasicMaterial({ map: rectTex, transparent: true, opacity: 0, depthWrite: false, color: "#000000" });
}
