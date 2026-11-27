/**
 * Chapter palette (2026-11-27): "Dark/Light Rhythm".
 *
 * Every chapter owns one stable ground colour. Colours only blend inside the
 * short transition windows between chapters, which sit in the scroll gaps
 * where no chapter copy is on screen (measured against the live page: see
 * DESIGN.md, Colors). Outside a window the palette is exactly the chapter's.
 *
 * One function, `paletteAt(track)`, feeds everything that carries colour:
 * the WebGL sky, fog and studio lighting (read per frame by the world) and the
 * DOM (CSS custom properties written by `installPalette`): text, hairlines,
 * veils, navigation, cursor and accents. So the sky, the 3D light and the type
 * always change together.
 *
 * Dark-to-light windows: grounds blend in OKLab with a steep curve, so the
 * mid-greys (where neither light nor dark text reaches 4.5:1) last only a few
 * frames of scroll, and the text flips at the luminance crossover, where both
 * inks are equally legible. No copy is on screen in these windows anyway.
 */

export type RGB = [number, number, number];

type Chapter = {
  id: string;
  /** Page ground: the sky at eye level, fog, veils. */
  ground: string;
  /** Sky above and below the horizon (slightly deeper or lighter than ground). */
  zenith: string;
  /** Horizon band and atmospheric glow. */
  glow: string;
  /** Chapter accent: links, live states, list markers. */
  accent: string;
  /** The copper signal, tuned per ground so focus rings keep 3:1. */
  signal: string;
  /** Primary, secondary and quiet text. */
  text: string;
  text2: string;
  muted: string;
  /** 1 for daylight chapters (light ground, ink text). */
  day: number;
};

const BONE = "#f4efe6";
const INK = "#1a1714";

export const CHAPTERS: Chapter[] = [
  { id: "origin", ground: "#15120f", zenith: "#0c0a08", glow: "#2a1f17", accent: "#c8794a", signal: "#c8794a", text: BONE, text2: "#ddd5c8", muted: "#a39a8d", day: 0 },
  { id: "human", ground: "#2b1712", zenith: "#170c09", glow: "#5a2a1c", accent: "#e07a5a", signal: "#e07a5a", text: BONE, text2: "#e6d6cc", muted: "#bba59a", day: 0 },
  { id: "curiosity", ground: "#0f2529", zenith: "#081517", glow: "#1d4a4c", accent: "#8cc7bb", signal: "#c8794a", text: BONE, text2: "#d3dfdb", muted: "#9db4af", day: 0 },
  { id: "engineering", ground: "#ece5d8", zenith: "#f4efe6", glow: "#dcd3c3", accent: "#2f4b7a", signal: "#9c4f27", text: INK, text2: "#3b352e", muted: "#5b5248", day: 1 },
  { id: "intelligence", ground: "#131b29", zenith: "#0a0f18", glow: "#24324a", accent: "#f2b35b", signal: "#f2b35b", text: BONE, text2: "#d6dae1", muted: "#9ea7b5", day: 0 },
  { id: "projects", ground: "#161616", zenith: "#0c0c0c", glow: "#262320", accent: "#c8794a", signal: "#c8794a", text: BONE, text2: "#dbd7d1", muted: "#a39e97", day: 0 },
  { id: "timeline", ground: "#0f1e17", zenith: "#08110d", glow: "#203a2b", accent: "#c9b458", signal: "#c9b458", text: BONE, text2: "#d4ddd4", muted: "#9eab9f", day: 0 },
  { id: "next", ground: "#f3d9c4", zenith: "#f6e6d6", glow: "#e9a27e", accent: "#a55330", signal: "#a55330", text: INK, text2: "#3e3128", muted: "#57463a", day: 1 },
];

/**
 * Track windows [start, end] in which chapter i blends into chapter i + 1.
 * Each sits in a gap between two chapters' copy (measured 2026-11-27).
 */
export const DEFAULT_WINDOWS: [number, number][] = [
  [0.2, 0.5], // origin → human (both dark; the hero name has left)
  [1.62, 1.8], // human → curiosity
  [2.72, 2.92], // curiosity → engineering (dark → daylight)
  [3.6, 3.82], // engineering → intelligence (daylight → dark)
  [5.1, 5.42], // intelligence → projects
  [9.38, 9.64], // projects → timeline
  [11.22, 11.34], // timeline → next (dark → dawn): after the last timeline line has nearly gone
];

/**
 * The live windows. Experience measures the copy on the page on every layout
 * refresh (resize, fonts) and replaces these, so on any viewport each blend
 * starts after the last line of one chapter has faded and ends before the
 * first line of the next appears. The defaults (measured at 1600x900) hold
 * until the first measurement.
 */
let memoTrack = NaN;
let memo: Palette | null = null;
let WINDOWS: [number, number][] = DEFAULT_WINDOWS.map((w) => [...w] as [number, number]);
export function setWindows(next: [number, number][]) {
  if (next.length !== DEFAULT_WINDOWS.length) return;
  WINDOWS = next;
  memoTrack = NaN;
}

// ── colour maths ────────────────────────────────────────────────────────────

const hex = (h: string): RGB => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const toSrgb = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

function toOklab([r, g, b]: RGB): RGB {
  const R = toLin(r), G = toLin(g), B = toLin(b);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
function fromOklab([L, a, b]: RGB): RGB {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  const c = (x: number) => Math.min(1, Math.max(0, toSrgb(x)));
  return [
    c(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    c(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    c(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}
const lab = CHAPTERS.map((c) => ({
  ground: toOklab(hex(c.ground)),
  zenith: toOklab(hex(c.zenith)),
  glow: toOklab(hex(c.glow)),
  accent: toOklab(hex(c.accent)),
  signal: toOklab(hex(c.signal)),
  text: toOklab(hex(c.text)),
  text2: toOklab(hex(c.text2)),
  muted: toOklab(hex(c.muted)),
}));
const mixLab = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const smooth = (x: number) => x * x * (3 - 2 * x);
/** A steeper S-curve for dark/light windows: little time spent in the mid-greys. */
const steep = (x: number) => {
  const s = smooth(smooth(x));
  return s * s * (3 - 2 * s);
};

export type Palette = {
  ground: RGB;
  zenith: RGB;
  glow: RGB;
  accent: RGB;
  signal: RGB;
  text: RGB;
  text2: RGB;
  muted: RGB;
  /** 0 dark … 1 daylight, continuous through a window. */
  day: number;
  /** Index of the dominant chapter, and the blend into the next (0 when settled). */
  chapter: number;
  blend: number;
};

/** The palette at a track position. Pure (memoised on the last track), so every reader in a frame shares one result. */
export function paletteAt(track: number): Palette {
  if (track === memoTrack && memo) return memo;
  memoTrack = track;
  memo = computePalette(track);
  return memo;
}

function computePalette(track: number): Palette {
  let i = 0;
  let k = 0;
  for (let w = 0; w < WINDOWS.length; w++) {
    const [a, b] = WINDOWS[w];
    if (track >= b) i = w + 1;
    else if (track > a) {
      i = w;
      k = (track - a) / (b - a);
      break;
    } else break;
  }
  const A = lab[i];
  const B = lab[Math.min(i + 1, lab.length - 1)];
  const flips = CHAPTERS[i].day !== CHAPTERS[Math.min(i + 1, CHAPTERS.length - 1)].day;
  const g = flips ? steep(k) : smooth(k);
  // Text: a straight blend between two dark (or two light) chapters; a clean
  // flip at the crossover when the ground changes polarity.
  const t = flips ? (g < 0.5 ? 0 : 1) : g;
  return {
    ground: fromOklab(mixLab(A.ground, B.ground, g)),
    zenith: fromOklab(mixLab(A.zenith, B.zenith, g)),
    glow: fromOklab(mixLab(A.glow, B.glow, g)),
    accent: fromOklab(mixLab(A.accent, B.accent, g)),
    signal: fromOklab(mixLab(A.signal, B.signal, t)),
    text: fromOklab(mixLab(A.text, B.text, t)),
    text2: fromOklab(mixLab(A.text2, B.text2, t)),
    muted: fromOklab(mixLab(A.muted, B.muted, t)),
    day: CHAPTERS[i].day + (CHAPTERS[Math.min(i + 1, CHAPTERS.length - 1)].day - CHAPTERS[i].day) * g,
    chapter: i,
    blend: k,
  };
}

/**
 * The post-credits finale lowers the light: the end card sits on near-black
 * whatever chapter it follows, so the DOM (navigation veil, text) follows the
 * world down. `finale` is story.finale (0 → 1).
 */
const NIGHT = { ground: hex("#0b0908"), text: hex(BONE), text2: hex("#ddd5c8"), muted: hex("#a39a8d") };
const lerp3 = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
export function withFinale(p: Palette, finale: number): Palette {
  if (finale <= 0) return p;
  const f = smooth(Math.min(1, finale));
  const flip = p.day > 0.5 && f > 0.5 ? 1 : p.day > 0.5 ? 0 : f;
  return {
    ...p,
    ground: lerp3(p.ground, NIGHT.ground, f),
    zenith: lerp3(p.zenith, NIGHT.ground, f),
    glow: lerp3(p.glow, NIGHT.ground, f),
    text: lerp3(p.text, NIGHT.text, flip),
    text2: lerp3(p.text2, NIGHT.text2, flip),
    muted: lerp3(p.muted, NIGHT.muted, flip),
    day: p.day * (1 - f),
  };
}

const css = (c: RGB) => `${Math.round(c[0] * 255)} ${Math.round(c[1] * 255)} ${Math.round(c[2] * 255)}`;

/**
 * DOM side: writes the palette to CSS custom properties on `root` once per
 * frame, only when something changed. `readTrack` returns the same (damped)
 * track the world renders with, so type and sky move together.
 */
export function installPalette(root: HTMLElement, readTrack: () => number, readFinale: () => number = () => 0) {
  let raf = 0;
  let last = "";
  const tick = () => {
    raf = requestAnimationFrame(tick); // first: an error below never stops the loop
    const p = withFinale(paletteAt(readTrack()), readFinale());
    const vars = [
      ["--pal-ground", css(p.ground)],
      ["--pal-glow", css(p.glow)],
      ["--pal-accent", css(p.accent)],
      ["--pal-signal", css(p.signal)],
      ["--pal-text", css(p.text)],
      ["--pal-text-2", css(p.text2)],
      ["--pal-muted", css(p.muted)],
    ] as const;
    const key = vars.map((v) => v[1]).join("|") + p.chapter + (p.day > 0.5 ? "d" : "n");
    if (key !== last) {
      last = key;
      vars.forEach(([k, v]) => root.style.setProperty(k, v));
      root.dataset.tone = p.day > 0.5 ? "day" : "night";
      document.documentElement.style.setProperty("--pal-ground", css(p.ground));
    }
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
