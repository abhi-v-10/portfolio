import {
  CanvasTexture,
  Color,
  LinearSRGBColorSpace,
  MeshPhysicalMaterial,
  RepeatWrapping,
  type Texture,
} from "three";

/**
 * Physical material kit (2026-11-25). Everything that should read as a made
 * object uses these instead of custom unlit/satin shaders: real metalness and
 * roughness under the studio HDRI, brushed grain from a procedural roughness
 * map, clearcoat only where a real finish has one. No emissive glow except the
 * copper status point.
 */

let grain: Texture | null = null;
/** Brushed grain: fine streaks along U, drawn once and shared (roughness + bump). */
export function brushedGrain() {
  if (grain || typeof document === "undefined") return grain;
  const w = 512, h = 128;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "rgb(128,128,128)";
  ctx.fillRect(0, 0, w, h);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 2600; i++) {
    const y = rnd() * h;
    const v = 100 + rnd() * 60;
    ctx.strokeStyle = `rgba(${v},${v},${v},${0.25 + rnd() * 0.35})`;
    ctx.lineWidth = 0.4 + rnd() * 0.8;
    const x = rnd() * w;
    const len = 40 + rnd() * 260;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + (rnd() - 0.5) * 0.6);
    ctx.stroke();
  }
  const t = new CanvasTexture(c);
  t.wrapS = t.wrapT = RepeatWrapping;
  t.colorSpace = LinearSRGBColorSpace;
  t.anisotropy = 4;
  grain = t;
  return t;
}

type Opts = { transparent?: boolean; repeat?: [number, number] };

function brushed(m: MeshPhysicalMaterial, o: Opts) {
  const g = brushedGrain();
  if (g) {
    const t = g.clone();
    t.repeat.set(...(o.repeat ?? [2, 2]));
    t.needsUpdate = true;
    m.roughnessMap = t;
    m.bumpMap = t;
    m.bumpScale = 0.15;
  }
  return m;
}

const base = (o: Opts) => ({ transparent: !!o.transparent });

export const PBR = {
  /** Bead-blasted then brushed 6061 aluminium: link tubes, flanges. */
  aluminium: (o: Opts = {}) =>
    brushed(new MeshPhysicalMaterial({ ...base(o), color: new Color("#b9b6b0"), metalness: 1, roughness: 0.34, anisotropy: 0.6 }), o),
  /** Titanium, slightly warmer and darker than aluminium. */
  titanium: (o: Opts = {}) =>
    brushed(new MeshPhysicalMaterial({ ...base(o), color: new Color("#9d978d"), metalness: 1, roughness: 0.3, anisotropy: 0.75 }), o),
  /** Hard-anodised black: joint housings, device chassis. Satin, not gloss. */
  anodised: (o: Opts = {}) =>
    new MeshPhysicalMaterial({ ...base(o), color: new Color("#1c1b1a"), metalness: 0.7, roughness: 0.46, clearcoat: 0.25, clearcoatRoughness: 0.5 }),
  /** Gunmetal machined steel: fasteners, shafts, bearings. */
  gunmetal: (o: Opts = {}) =>
    new MeshPhysicalMaterial({ ...base(o), color: new Color("#4a4947"), metalness: 1, roughness: 0.28 }),
  /** Burnished copper: accent bands and the one status point. Used sparingly. */
  copper: (o: Opts = {}) =>
    new MeshPhysicalMaterial({ ...base(o), color: new Color("#c07a4c"), metalness: 1, roughness: 0.24 }),
  /** Matte nitrile rubber: gripper pads, feet. */
  rubber: (o: Opts = {}) =>
    new MeshPhysicalMaterial({ ...base(o), color: new Color("#121212"), metalness: 0, roughness: 0.82, sheen: 0.3, sheenRoughness: 0.8, sheenColor: new Color("#3a3a3a") }),
  /** Black cover glass: lenses, screens' bezel glass. */
  glass: (o: Opts = {}) =>
    new MeshPhysicalMaterial({ ...base(o), color: new Color("#050505"), metalness: 0, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02, ior: 1.5, reflectivity: 0.6 }),
  /** Powder-coated warm graphite: large structural plates. */
  powder: (o: Opts = {}) =>
    new MeshPhysicalMaterial({ ...base(o), color: new Color("#2a2724"), metalness: 0.15, roughness: 0.62, clearcoat: 0.1, clearcoatRoughness: 0.7 }),
  /** Status point: the only emissive surface. */
  statusLed: (o: Opts = {}) =>
    new MeshPhysicalMaterial({ ...base(o), color: new Color("#2a1408"), emissive: new Color("#c8794a"), emissiveIntensity: 1.4, roughness: 0.3 }),
};
