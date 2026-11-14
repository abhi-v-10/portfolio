import { CatmullRomCurve3, Vector3 } from "three";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

/**
 * Spatial plan of the story beyond the hero. One world, staged along the
 * direction the living signal leaves the core (toward −z, drifting right).
 *
 *   Origin (0,0,0) ─signal→ Gallery (≈ 3, 3, −11.5) → Curiosity (≈ 9, 2, −36) ─converge→ Engineering (≈ 10, 1, −64)
 *
 * Track units (story.track): 0 hero · 1 Meet the Human · 2 Curiosity ·
 * 3 Engineering · 4 Intelligence · 4.75–6 transition (the network loosens
 * and the camera turns to the exhibition; Expression was removed 2026-11-14) ·
 * 6 Project Universe ·
 * 6.5–9 one project per half unit · 10 Timeline Nexus · 11.5 Next Chapter ·
 * 12 end. Curiosity/Engineering worlds were authored
 * in Milestone 003 units (one lower); they read `track - TRACK_SHIFT`.
 */
export const TRACK_SHIFT = 1;

/** Meet the Human: where the gallery and its robot live, beside the signal. */
export const GALLERY = v(3.2, 3.4, -11.5);

/** Where the signal arrives in Curiosity and splits into exploratory branches. */
export const SPLIT = v(8.5, 3.0, -30.5);
export const CURIOSITY_CENTRE = v(9, 2.2, -37);
export const ENGINEERING_CENTRE = v(10, 0.6, -64);
/** Floor heights of each world. */
export const CURIOSITY_FLOOR = -1.6;
export const ENGINEERING_FLOOR = -0.7;

/** Chapter visibility windows in track units (with margins for the dissolves). */
export const WINDOW = {
  /** New track units. */
  origin: [-1, 1.1] as const,
  human: [0.3, 2.15] as const,
  /** Milestone 003 units (track - TRACK_SHIFT). */
  curiosity: [0.45, 2.65] as const,
  engineering: [1.55, 9] as const,
  /** New track units. */
  universe: [5.55, 9.95] as const,
  nexus: [9.0, 12.6] as const,
};

/**
 * Exploration branches. Each leaves the split point, wanders, and either ends
 * in a discovery (an object half-sketched out of possibility) or simply fades:
 * not every experiment goes somewhere, and that is part of the point.
 */
export type Branch = { points: Vector3[]; discovery: number | null };

export const BRANCHES: Branch[] = [
  { points: [SPLIT, v(9.8, 3.9, -32.5), v(11.6, 4.7, -34.2), v(12.6, 5.0, -36.2)], discovery: 0 },
  { points: [SPLIT, v(8.0, 2.2, -33.0), v(7.0, 1.3, -35.6), v(6.3, 1.1, -38.2)], discovery: 1 },
  { points: [SPLIT, v(9.6, 2.2, -33.4), v(10.9, 1.2, -36.6), v(11.7, 0.6, -40.0)], discovery: 2 },
  { points: [SPLIT, v(8.4, 4.0, -33.6), v(8.2, 5.3, -37.4), v(8.1, 6.0, -42.0)], discovery: 3 },
  { points: [SPLIT, v(7.3, 3.6, -31.6), v(5.8, 4.4, -32.8), v(4.8, 4.5, -34.6)], discovery: null },
  { points: [SPLIT, v(9.8, 2.9, -30.6), v(11.6, 2.4, -30.4), v(13.2, 2.6, -31.4)], discovery: null },
];

export const branchCurves = BRANCHES.map((b) => new CatmullRomCurve3(b.points, false, "centripetal"));

/** Discovery forms: positions match the branch ends above. */
export const DISCOVERIES = [
  { pos: v(12.6, 5.0, -36.2), kind: "knot" as const, scale: 0.85 },
  { pos: v(6.3, 1.1, -38.2), kind: "icosa" as const, scale: 0.95 },
  { pos: v(11.7, 0.6, -40.0), kind: "dodeca" as const, scale: 1.0 },
  { pos: v(8.1, 6.0, -42.0), kind: "torus" as const, scale: 1.05 },
];

/* ───────────── Milestone 005: Project Universe ───────────── */

/** One artifact per project, staged along a winding exhibition path (oldest decisions left to the reader). */
export const ARTIFACTS = [
  { id: "winios", pos: v(-8, 4, -100), scale: 1.25 },
  { id: "jobseek", pos: v(-20, 5.5, -110), scale: 1 },
  { id: "iris", pos: v(-9, 3, -120), scale: 1 },
  { id: "eli5", pos: v(-21, 5, -130), scale: 1 },
  { id: "qp-gen", pos: v(-10, 3.5, -140), scale: 1 },
  { id: "scholaroid", pos: v(-22, 4, -150), scale: 1 },
] as const;
/** Track key of artifact i (its hold frame). */
export const artifactTrack = (i: number) => 6.5 + i * 0.5;
function artifactCamera(i: number) {
  const a = ARTIFACTS[i];
  const k = a.scale;
  return a.pos.clone().add(v(2.2 * k, 1.5 * k, 9.2 * k));
}

/* ───────────── Milestone 006: Timeline Nexus and the closing horizon ───────────── */

/** Where every timeline strand converges: the present. */
export const NEXUS = v(-16, 7, -190);
/** The closing light the threads rise toward. */
export const HORIZON = v(-16, 16, -216);

/**
 * Camera keyframes every half chapter (track 0 → 6.5). Index 0 is replaced at
 * runtime by the hero pose (which depends on layout and measured framing).
 */
export const CAMERA_POS = [
  v(0, 0, 0),
  v(-1.2, 2.9, 1.6),
  v(0.7, 4.0, -1.0),
  v(1.0, 4.0, -1.9),
  // Track 2 is anchored on the Curiosity title (see StoryDirector), so the
  // chapter's hold frame arrives together with its heading.
  v(4.6, 4.4, -21.5),
  v(6.6, 4.9, -27.5),
  v(8.4, 5.4, -33.5),
  v(3.2, 6.4, -46.5),
  v(18.0, 7.6, -50.5),
  // Milestone 004: the system transforms in place; the camera orbits it.
  v(21.5, 6.8, -60.5), // 4.5 Intelligence hold (side view, copy left)
  v(18.5, 9.0, -75.5), // 5.0 flexing
  v(6.5, 5.6, -80.0), // 5.5 passing the loosened network, turning away
  // Milestone 005: the camera turns away from the expressive world toward the
  // exhibition, then visits one artifact per half unit.
  v(1.0, 10.0, -84.0), // 6.0 Project Universe overview
  ...[0, 1, 2, 3, 4, 5].map((i) => artifactCamera(i)), // 6.5 … 9.0
  // Milestone 006: Timeline Nexus, then up toward the closing horizon.
  v(-14.0, 9.0, -162.0), // 9.5 leaving the exhibition
  v(-5.5, 9.2, -177.0), // 10.0 Nexus hold (copy left)
  v(-8.5, 6.4, -180.0), // 10.5 among the strands
  v(-13.0, 8.6, -181.0), // 11.0 threads gathered
  v(-16.0, 10.0, -182.0), // 11.5 Next Chapter: facing the horizon
  v(-16.0, 10.8, -184.0), // 12.0 end
];
export const CAMERA_TARGET = [
  v(0, 0, 0),
  v(2.4, 3.2, -8.0),
  v(3.1, 3.35, -11.5),
  v(3.3, 3.35, -11.6),
  v(9.0, 2.6, -35.5),
  v(9.5, 2.3, -45.0),
  v(9.8, 2.0, -55.0),
  v(9.6, 1.2, -63.5),
  v(10.0, 2.4, -64.0),
  v(10.0, 3.4, -64.8),
  v(10.0, 3.6, -65.0),
  v(10.2, 3.6, -64.4),
  v(-13.0, 4.0, -118.0), // 6.0
  ...ARTIFACTS.map((a) => a.pos.clone()),
  v(-16.0, 7.0, -186.0), // 9.5
  v(-17.0, 7.0, -191.0), // 10.0
  v(-16.0, 7.2, -190.0), // 10.5
  v(-16.0, 9.0, -193.0), // 11.0
  v(-16.0, 13.5, -210.0), // 11.5
  v(-16.0, 14.5, -212.0), // 12.0
];
export const TRACK_MAX = 12;

/**
 * Lens shift per chapter, as a fraction of the viewport: positive moves the
 * subject right (wide) or up (portrait), leaving room for the chapter's copy.
 * [track, wide x, portrait y]
 */
export const LENS = [
  [0, 0, 0],
  [0.55, 0, 0],
  [0.95, 0.2, 0.24],
  [2.85, 0.2, 0.2],
  [3.25, -0.2, 0.2],
  [3.95, -0.2, 0.2],
  [4.35, 0.2, 0.2],
  [4.6, 0.2, 0.2],
  [6.3, 0.2, 0.28],
  [9.4, 0.2, 0.28],
  [9.8, 0.2, 0.2],
  [10.9, 0.2, 0.2],
  [11.35, 0.24, 0.16],
  [12, 0.24, 0.16],
] as const;

export function lensAt(track: number) {
  let i = 0;
  while (i < LENS.length - 2 && track > LENS[i + 1][0]) i++;
  const [t0, x0, y0] = LENS[i];
  const [t1, x1, y1] = LENS[i + 1];
  const u = Math.min(1, Math.max(0, (track - t0) / (t1 - t0)));
  const e = u * u * (3 - 2 * u);
  return { x: x0 + (x1 - x0) * e, y: y0 + (y1 - y0) * e };
}

/** Seeded RNG for stable layouts. */
export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ───────────── Milestone 004: Intelligence, then the transition ───────────── */

/**
 * Transformation windows (track units). One continuous, scroll-scrubbed change:
 * architecture → intelligent network → flexible connections → flowing forms.
 */
export const MORPH = {
  /** Engineering modules leave their tiers and become network nodes. */
  network: [3.8, 4.12] as const,
  /** Connections loosen into ribbons; nodes soften into forms; colour warms. */
  flex: [4.6, 5.1] as const,
};

/**
 * The agent network, built from verified technical focus (profile): intent
 * detection, tool use, internal APIs on live data, LLM providers, retrieval
 * and structured results. Positions are local to ENGINEERING_CENTRE so each
 * Engineering module can travel to "its" node.
 */
export type NetNode = { pos: [number, number, number]; label?: string; size: number };
export const NET_NODES: NetNode[] = [
  { pos: [0, 3.3, 0], label: "Agent", size: 0.26 },
  { pos: [-3.5, 4.7, 1.5], label: "Intent", size: 0.2 },
  { pos: [-1.1, 6.4, -2.6], label: "LLM", size: 0.22 },
  { pos: [3.3, 4.6, 1.7], label: "Tool call", size: 0.2 },
  { pos: [4.7, 2.3, -1.5], label: "Internal API", size: 0.2 },
  { pos: [2.8, 0.7, -3.6], label: "Live data", size: 0.22 },
  { pos: [-4.3, 2.1, -2.4], label: "Retrieval", size: 0.18 },
  { pos: [-2.3, 1.1, 2.8], label: "Result", size: 0.2 },
  { pos: [1.4, 6.8, 1.0], size: 0.1 },
  { pos: [-5.3, 4.5, -0.7], size: 0.09 },
  { pos: [5.7, 5.3, -2.8], size: 0.1 },
  { pos: [0.4, 0.3, 3.4], size: 0.09 },
  { pos: [-0.8, 4.7, -4.7], size: 0.1 },
  { pos: [3.7, 7.1, -1.2], size: 0.08 },
  { pos: [-3.1, 6.9, 1.2], size: 0.09 },
  { pos: [6.1, 3.5, 1.4], size: 0.08 },
];
export const NET_EDGES: [number, number][] = [
  [1, 0], [0, 2], [0, 3], [3, 4], [4, 5], [0, 6], [6, 2], [0, 7],
  [8, 2], [8, 3], [9, 1], [9, 6], [10, 4], [10, 13], [11, 7], [11, 5],
  [12, 2], [12, 6], [13, 3], [14, 1], [14, 8], [15, 3], [15, 4], [5, 7],
];
/** One agent request, as a walk over the network: intent → reason → tool → API → data → back → result. */
export const NET_FLOW = [1, 0, 2, 0, 3, 4, 5, 4, 3, 0, 7];
