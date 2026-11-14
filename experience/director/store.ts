/**
 * Mutable, non-React story state shared by the DOM directors and the WebGL
 * world. Written by exactly one owner per field; read every frame by the
 * renderer. Keeping it outside React avoids per-frame re-renders.
 *
 * Ownership:
 *  - intro    : LoaderDirector entrance timeline (0 → 1). Never touched by scroll.
 *  - scroll   : StoryDirector (0 → 1): the hero's own exit, scrolled distance
 *               over 1.5 viewports. Hero elements are tuned against it.
 *  - track    : StoryDirector, chapter units from document position (see
 *               experience/chapters/layout.ts): 0 hero … 6 Project Universe …
 *               10 Timeline Nexus · 11.5 Next Chapter · 12 document end. Piecewise linear between
 *               measured section tops, so it is exact and reversible.
 *  - pointer  : pointer listener (desktop fine pointers only).
 *  - pulse    : LoaderDirector Explore pulse (0 → 1 → 0).
 *  - build    : LoaderDirector, after the name lands (0 → 1): the hologram
 *               ignites around the core. Before it, only the heart is lit.
 *  - textRightPx / textTopPx / textBottomPx : DOM measure of the hero copy
 *    (viewport CSS px), so the camera can keep the 3D clear of the name.
 */
export const story = {
  intro: 0,
  build: 0,
  scroll: 0,
  track: 0,
  pulse: 0,
  pointer: { x: 0, y: 0 },
  reducedMotion: false,
  /** Hardware hint from QualityController: 0 = low, 1 = standard. */
  quality: 1,
  /** Rendered loader-core size in CSS px; lets the camera match it exactly. */
  coreSizePx: 260,
  /** Hero copy bounds in viewport CSS px (0 = unmeasured). */
  textRightPx: 0,
  textTopPx: 0,
  textBottomPx: 0,
  /**
   * Damped values for the renderer, written once per frame by CameraDirector
   * (the first frame subscriber) and read by every scene element, so the whole
   * world moves on one smoothed clock.
   */
  view: { scroll: 0, track: 0, px: 0, py: 0, coreScale: 1 },
  /**
   * Project Universe and Timeline Nexus interactions, written by DOM controls
   * and read by the world: ELI5 explain toggle (0/1), the WiniOS bridge send
   * (performance.now() of the last press), and the focused timeline event
   * (-1 = none).
   */
  universe: {
    eli5: 0,
    bridgeAt: -1e9,
    /** 1: PC → iPhone, -1: iPhone → PC (alternates per send). */
    bridgeDir: 1,
    /** Sends so far; alternates the packet between text and image. */
    bridgeCount: 0,
    /** Case-study transition: artifact index in focus (-1 none) and amount (0 → 1). */
    caseFocus: -1,
    caseAmt: 0,
  },
  nexusFocus: -1,
};

/** Imperative writer for DOM-side owners (keeps React lint rules satisfied). */
export function setStory(patch: Partial<typeof story>) {
  Object.assign(story, patch);
}

type Listener = () => void;
const sceneReadyListeners = new Set<Listener>();
let sceneReady = false;

/** Called by the WebGL world once shaders are compiled and a frame has drawn. */
export function markSceneReady() {
  if (sceneReady) return;
  sceneReady = true;
  sceneReadyListeners.forEach((fn) => fn());
}

export function onSceneReady(fn: Listener) {
  if (sceneReady) {
    fn();
    return () => {};
  }
  sceneReadyListeners.add(fn);
  return () => {
    sceneReadyListeners.delete(fn);
  };
}

let webglSupport: boolean | null = null;

/** Feature probe used before mounting the canvas (cached; runs once). */
export function hasWebGL(): boolean {
  if (webglSupport !== null) return webglSupport;
  // QA hook: `?webgl=0` exercises the no-WebGL route on any device.
  if (new URLSearchParams(window.location.search).get("webgl") === "0") return (webglSupport = false);
  try {
    const c = document.createElement("canvas");
    const ctx = c.getContext("webgl2") || c.getContext("webgl");
    webglSupport = !!ctx;
    (ctx as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglSupport = false;
  }
  return webglSupport;
}
