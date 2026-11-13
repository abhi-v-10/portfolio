import { galleryPhotos } from "@/content/gallery";

/**
 * Gallery state, outside React. Ownership is split so scroll and manual
 * interaction can never fight:
 *  - index    : committed photo (unbounded integer; wraps for display). Written
 *               only by the API below (buttons, keys, swipe release, autoplay).
 *  - action   : the robot's swipe for a committed step. Started here, played
 *               and cleared by the 3D gallery's frame loop.
 *  - drag     : raw pointer input, written by the DOM stage.
 *  - pos      : the displayed, continuous position. Written ONLY by the 3D
 *               gallery's frame loop (from the robot's hand, drag or spring).
 *  - autoplay : cadence + pause reasons. Scroll never touches any of these.
 */
export const AUTOPLAY_MS = 5000;

export const gallery = {
  count: galleryPhotos.length,
  index: 0,
  pos: 0,
  action: null as null | { dir: 1 | -1; start: number; from: number; auto: boolean },
  queued: 0 as 0 | 1 | -1,
  drag: { active: false, startPos: 0, offset: 0, velocity: 0, release: false, releaseVelocity: 0 },
  /** True while a WebGL frame loop is driving the gallery. */
  live: false,
  autoplay: {
    /** Reasons to hold: drag, menu, offscreen, hidden tab, reduced motion. */
    holds: new Set<string>(),
    /** Time the last step settled; the next auto step is measured from here. */
    lastSettled: 0,
  },
};

type Listener = () => void;
const listeners = new Set<Listener>();
export function subscribeGallery(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
const emit = () => listeners.forEach((fn) => fn());

export const wrapIndex = (i: number) => ((i % gallery.count) + gallery.count) % gallery.count;
export const currentPhoto = () => wrapIndex(gallery.index);

/** Manual input runs alongside autoplay: it simply restarts the interval. */
function interacted() {
  gallery.autoplay.lastSettled = performance.now();
}

/** One step, performed by the robot when the 3D gallery is live. */
export function galleryStep(dir: 1 | -1, source: "manual" | "auto" = "manual") {
  if (source === "manual") interacted();
  if (gallery.live && (gallery.action || gallery.drag.active)) {
    if (source === "manual") gallery.queued = dir; // one queued step; extra presses do not pile up
    return;
  }
  commit(dir, source === "auto");
}

function commit(dir: 1 | -1, auto: boolean) {
  const from = gallery.live ? gallery.pos : gallery.index;
  gallery.index += dir;
  if (gallery.live) gallery.action = { dir, start: performance.now(), from, auto };
  else gallery.pos = gallery.index;
  emit();
}

/** Called by the frame loop when the robot has released and retracted. */
export function galleryActionDone() {
  gallery.action = null;
  gallery.autoplay.lastSettled = performance.now();
  const q = gallery.queued;
  gallery.queued = 0;
  if (q) commit(q, false);
}

export function holdAutoplay(reason: string, on: boolean) {
  const holds = gallery.autoplay.holds;
  if (on) holds.add(reason);
  else if (holds.delete(reason) && holds.size === 0) {
    // Released (stage came on screen, pointer left…): give a full interval first.
    gallery.autoplay.lastSettled = performance.now();
  }
}

/** Should the frame loop start an automatic step now? */
export function autoplayDue(now: number) {
  const a = gallery.autoplay;
  return (
    a.holds.size === 0 &&
    !gallery.action &&
    !gallery.drag.active &&
    now - a.lastSettled >= AUTOPLAY_MS
  );
}

/** Swipe/drag input from the DOM stage. `offset` is in items (positive = toward next). */
export function galleryDrag(phase: "start" | "move" | "end", offset = 0, velocity = 0) {
  const d = gallery.drag;
  if (phase === "start") {
    if (gallery.action) return;
    interacted();
    holdAutoplay("drag", true);
    d.active = true;
    d.release = false;
    d.startPos = gallery.live ? gallery.pos : gallery.index;
    d.offset = 0;
    d.velocity = 0;
  } else if (phase === "move" && d.active) {
    d.offset = Math.max(-1.2, Math.min(1.2, offset));
    d.velocity = velocity;
  } else if (phase === "end" && d.active) {
    d.active = false;
    holdAutoplay("drag", false);
    interacted();
    // Inertia: a flick commits a step even if the drag was short.
    const projected = d.offset + d.velocity * 0.22;
    const step = Math.abs(projected) > 0.28 ? (Math.sign(projected) as 1 | -1) : 0;
    const base = Math.round(d.startPos);
    gallery.index = base + step;
    d.releaseVelocity = d.velocity;
    d.release = true; // frame loop springs pos → index, carrying the flick's velocity
    if (!gallery.live) gallery.pos = gallery.index;
    gallery.autoplay.lastSettled = performance.now();
    emit();
  }
}
