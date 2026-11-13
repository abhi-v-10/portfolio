import { CatmullRomCurve3, Vector3 } from "three";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

/**
 * The living signal leaves the core, loops the Origin sculpture once, then
 * rises and departs into depth, arriving in Curiosity where it branches.
 */
export const signalPoints = [
  v(0, 0, 0),
  v(0.9, 0.7, 0.5),
  v(2.0, 0.25, 0.25),
  v(1.75, -1.15, -0.25),
  v(0.25, -1.8, 0.45),
  v(-1.5, -1.15, 0.95),
  v(-2.3, 0.45, 0.2),
  v(-1.55, 1.85, -1.0),
  v(0.25, 2.55, -3.0),
  v(2.4, 3.0, -7.0),
  v(4.2, 3.4, -12.0),
  v(6.0, 4.0, -20.0),
  // Milestone 003: the current carries on into Curiosity and ends at the split
  // point (experience/chapters/layout.ts SPLIT), where it branches.
  v(7.4, 3.6, -26.0),
  v(8.5, 3.0, -30.5),
];

export const signalCurve = new CatmullRomCurve3(signalPoints, false, "centripetal");

/** Secondary strands: offset echoes of the main current, tuned per colour. */
export function strandCurve(offset: Vector3, wobble: number) {
  return new CatmullRomCurve3(
    signalPoints.map((p, i) =>
      p.clone().add(offset.clone().multiplyScalar(Math.sin(i * 0.9 + wobble) * 0.9 + 0.35)),
    ),
    false,
    "centripetal",
  );
}

/** Loader artwork geometry (SVG viewBox 240) mapped to world units. */
export const CORE_VIEWBOX = 240;
export const CORE_DIAMOND_HALF_HEIGHT_VB = 26;
export const CORE_DIAMOND_HALF_HEIGHT_WORLD = 0.5;
export const CAMERA_FOV = 40;

/**
 * Camera distance at which the 3D core renders at exactly the loader core's
 * on-screen size, so the split reveals the same object, not a new one.
 */
export function introDistance(coreSizePx: number, viewportHeightPx: number) {
  const pxPerUnit =
    ((CORE_DIAMOND_HALF_HEIGHT_VB / CORE_VIEWBOX) * coreSizePx) / CORE_DIAMOND_HALF_HEIGHT_WORLD;
  const tanHalf = Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180);
  return viewportHeightPx / (2 * tanHalf * pxPerUnit);
}

export function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function easeInOutCubic(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function easeOutExpo(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Holographic ignition: 0 before `start`, 1 after `start + dur`, and in between
 * a projector stutter whose duty cycle rises with progress (30 Hz noise, seeded
 * per element so parts do not blink in unison). Reduced motion gets a plain fade.
 */
export function holoOn(build: number, start: number, dur: number, time: number, seed: number, reduced: boolean) {
  const p = Math.min(1, Math.max(0, (build - start) / dur));
  if (p <= 0 || p >= 1 || reduced) return p;
  const n = hash(Math.floor(time * 30) + seed * 17.3);
  const on = n < 0.15 + p * 1.05 ? 1 : 0.08;
  return on * (0.35 + 0.65 * p);
}
