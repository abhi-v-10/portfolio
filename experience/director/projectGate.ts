/**
 * Project Universe pager (rebuilt 2026-11-25; replaces the 2026-11-15 gesture
 * gate, whose stop measurement and bypass rules it keeps).
 *
 * Each project is one full-viewport panel and a deliberate stop:
 *
 *  - Inside the universe (from the establishing panel to the last exhibit) one
 *    gesture moves exactly one panel. The page glides there (eased, about
 *    0.6–0.9s), settles exactly, and the rest of that gesture, including
 *    trackpad and touch momentum, is discarded.
 *  - Only a NEW gesture continues: a wheel pause longer than GAP, a reversal,
 *    a new touch, or a new key press.
 *  - Entering from above or below, a gesture that would cross the first or
 *    last panel settles on it instead of carrying through.
 *  - At the ends, a fresh gesture outward leaves the universe with native
 *    scrolling: no trapping.
 *  - Programmatic movement (Index links, anchors, history, the case-study
 *    return) is never gated. Off while the Index or a case study is open.
 *  - Reduced motion: the same one-panel steps, without the glide.
 */

const GAP = 200; // ms of wheel silence that ends a gesture (at a healthy frame rate)
const TAIL_GUARD = 380; // ms after a glide in which a small first delta is still momentum
const KEYS_NEXT = new Set(["PageDown", "ArrowDown", " "]);
const KEYS_PREV = new Set(["PageUp", "ArrowUp"]);

export type ProjectGate = { refresh: () => void; destroy: () => void };

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function installProjectGate(measure: () => number[], opts: { reduced: boolean }): ProjectGate {
  const html = document.documentElement;
  let stops = measure();
  let gesture = 0;
  let lockedGesture = -1;
  let lastWheel = 0;
  let lastWheelDir = 0;
  let lastAbs = 0;
  let bypassUntil = 0;
  let glideEnd = -1e9;
  let anim = 0;
  let animating = false;
  let prevY = window.scrollY;
  let inputAt = -1e9;
  // Touch
  let touchY0 = 0;
  let touchLastY = 0;
  let touchDir = 0;
  let touchOwned = false;
  // Slow frames deliver wheel events further apart: scale the gap with frame time.
  let frameDt = 16;
  let lastFrame = performance.now();
  let raf = 0;
  const sample = (t: number) => {
    frameDt = frameDt * 0.9 + Math.min(500, t - lastFrame) * 0.1;
    lastFrame = t;
    raf = requestAnimationFrame(sample);
  };
  raf = requestAnimationFrame(sample);
  const gap = () => Math.max(GAP, frameDt * 2.5);
  const now = () => performance.now();

  const off = () =>
    html.classList.contains("has-index") ||
    html.classList.contains("has-case") ||
    html.hasAttribute("data-case") ||
    now() < bypassUntil ||
    Date.now() - Number(html.dataset.caseReturn ?? 0) < 2500;

  const EPS = 6;
  const first = () => stops[0];
  const last = () => stops[stops.length - 1];
  const inside = (y: number) => y >= first() - EPS && y <= last() + EPS;
  /** The neighbouring stop in a direction, from a position (strictly beyond it). */
  const neighbour = (y: number, dir: number) =>
    dir > 0 ? stops.find((s) => s > y + EPS) : [...stops].reverse().find((s) => s < y - EPS);
  /** First stop strictly between from and to, in travel order. */
  const crossed = (from: number, to: number) => {
    if (to > from) return stops.find((s) => s > from + 0.5 && s <= to) ?? null;
    if (to < from) return [...stops].reverse().find((s) => s < from - 0.5 && s >= to) ?? null;
    return null;
  };

  // A root overflow lock ends the browser's own smooth-scroll animation and
  // any native inertia (trackpad, touch fling) the moment the pager takes
  // over; it is released two frames after the page has settled.
  const lock = () => {
    html.style.overflow = "hidden";
  };
  const unlock = () => requestAnimationFrame(() => requestAnimationFrame(() => (html.style.overflow = "")));
  const trace: string[] = [];
  const glide = (target: number, why = "") => {
    trace.push(`${why}:${Math.round(window.scrollY)}->${target}`);
    if (trace.length > 12) trace.shift();
    cancelAnimationFrame(anim);
    lock();
    const from = window.scrollY;
    const dist = target - from;
    animating = true;
    if (opts.reduced || Math.abs(dist) < 1) {
      window.scrollTo({ top: target, behavior: "instant" as ScrollBehavior });
      prevY = target;
      animating = false;
      glideEnd = now();
      unlock();
      return;
    }
    const vh = window.innerHeight;
    const dur = Math.min(900, Math.max(560, (Math.abs(dist) / vh) * 640));
    const t0 = now();
    const step = () => {
      const k = Math.min(1, (now() - t0) / dur);
      const y = from + dist * easeInOut(k);
      window.scrollTo({ top: k >= 1 ? target : y, behavior: "instant" as ScrollBehavior });
      prevY = window.scrollY;
      if (k < 1) anim = requestAnimationFrame(step);
      else {
        animating = false;
        glideEnd = now();
        unlock();
      }
    };
    anim = requestAnimationFrame(step);
  };

  /** Decide a step for a gesture going `dir` from `y`. Returns true if the gate owns it. */
  const stepFrom = (y: number, dir: number, travel: number) => {
    if (inside(y)) {
      const target = neighbour(y, dir);
      if (target === undefined) return false; // at an end, heading out: native scrolling
      glide(target, "step");
      return true;
    }
    // Outside: only a gesture that would cross into the universe is caught.
    const s = crossed(y, y + travel);
    if (s === null) return false;
    glide(s, "enter");
    return true;
  };

  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey || off()) return;
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
    if (!dy || Math.abs(e.deltaX) > Math.abs(dy)) return;
    const t = now();
    const dir = Math.sign(dy);
    const abs = Math.abs(dy);
    // Gesture boundaries. Momentum decays, so after a pause a NEW gesture
    // pushes at least as hard as the last event did; a weaker continuation
    // (a frame stall mid-fling) is still the old gesture. A reversal or a
    // long silence always starts a new one.
    const silence = t - lastWheel;
    let fresh = false;
    if (dir !== lastWheelDir) fresh = true;
    else if (silence > 700) fresh = abs > 8 || abs >= lastAbs * 0.95; // a long stall: a weak, decaying delta is still momentum
    else if (silence > gap()) fresh = abs > lastAbs * 0.95 + 2;
    if (fresh && t - glideEnd < TAIL_GUARD && abs < 6) fresh = false; // decaying tail right after a glide
    if (fresh) gesture++;
    lastWheel = t;
    lastWheelDir = dir;
    lastAbs = abs;
    inputAt = t;
    if (animating || lockedGesture === gesture) {
      if (inside(window.scrollY) || animating) e.preventDefault();
      return;
    }
    if (stepFrom(window.scrollY, dir, dy)) {
      e.preventDefault();
      lockedGesture = gesture;
    }
  };

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return;
    gesture++;
    touchY0 = touchLastY = e.touches[0].clientY;
    touchDir = 0;
    touchOwned = false;
  };
  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length !== 1 || off()) return;
    const y = e.touches[0].clientY;
    const d = touchLastY - y; // finger up = page down
    touchLastY = y;
    if (!touchDir && Math.abs(touchY0 - y) > 6) touchDir = Math.sign(touchY0 - y);
    inputAt = now();
    if (animating) {
      e.preventDefault();
      return;
    }
    const sy = window.scrollY;
    // Inside, the gate owns every touch except one leaving through an end.
    if (inside(sy)) {
      const leaving = touchDir !== 0 && neighbour(sy, touchDir) === undefined;
      if (!leaving) {
        e.preventDefault();
        touchOwned = true;
      }
      return;
    }
    // Outside: a drag that would carry across the first/last panel stops on it.
    const s = crossed(sy, sy + d * 3);
    if (s !== null) {
      e.preventDefault();
      touchOwned = true;
      glide(s);
      lockedGesture = gesture;
    }
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (e.touches.length || off()) return;
    if (touchOwned && lockedGesture !== gesture && !animating) {
      const swipe = touchY0 - touchLastY;
      if (Math.abs(swipe) > 36) {
        if (stepFrom(window.scrollY, Math.sign(swipe), swipe)) lockedGesture = gesture;
      }
    }
    touchOwned = false;
  };

  const onKey = (e: KeyboardEvent) => {
    const el = e.target as HTMLElement | null;
    if (e.altKey || e.ctrlKey || e.metaKey || off()) return;
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.closest("dialog"))) return;
    if (e.key === "Home" || e.key === "End") {
      bypassUntil = now() + 1500;
      return;
    }
    const next = KEYS_NEXT.has(e.key) && !(e.key === " " && e.shiftKey);
    const prev = KEYS_PREV.has(e.key) || (e.key === " " && e.shiftKey);
    if (!next && !prev) return;
    if (e.key === " " && el && el.closest("button, a, [role='button']")) return;
    const y = window.scrollY;
    if (!inside(y)) return; // native outside; onScroll catches a crossing
    e.preventDefault();
    if (e.repeat || animating) return; // one press, one panel
    gesture++;
    inputAt = now();
    if (stepFrom(y, next ? 1 : -1, 0)) lockedGesture = gesture;
    else {
      // Leaving through an end by keyboard: hand the press back as a native page step.
      window.scrollBy({ top: (next ? 1 : -1) * window.innerHeight * 0.85, behavior: opts.reduced ? "instant" : "smooth" } as ScrollToOptions);
    }
  };

  // Native travel (scrollbar drag, arrow keys outside, smooth-scrolling mice)
  // that crosses into the universe settles on the first panel it reaches.
  const onScroll = () => {
    const y = window.scrollY;
    if (animating) return;
    const jump = Math.abs(y - prevY) > window.innerHeight * 2;
    if (!jump && !off() && now() - inputAt < 1600 && lockedGesture !== gesture) {
      const s = crossed(prevY, y);
      if (s !== null && !inside(prevY)) {
        lockedGesture = gesture;
        glide(s, "scroll");
        return;
      }
    }
    prevY = y;
  };

  // In-page navigation (Index links, skip links, anchors) is intentional: let it pass.
  const onClick = (e: MouseEvent) => {
    const a = (e.target as HTMLElement | null)?.closest?.("a[href]");
    if (a && (a.getAttribute("href") ?? "").includes("#")) {
      bypassUntil = now() + 1500;
      cancelAnimationFrame(anim);
      animating = false;
      html.style.overflow = "";
    }
  };
  const onPop = () => {
    bypassUntil = now() + 1500;
    cancelAnimationFrame(anim);
    animating = false;
    html.style.overflow = "";
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("touchcancel", onTouchEnd, { passive: true });
  window.addEventListener("keydown", onKey);
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("click", onClick, true);
  window.addEventListener("popstate", onPop);
  window.addEventListener("hashchange", onPop);

  // Test hook (read-only): lets automated walkthroughs inspect the pager.
  (window as unknown as { __pager?: () => object }).__pager = () => ({ stops, gesture, lockedGesture, animating, bypass: now() < bypassUntil, off: off(), trace });

  return {
    refresh: () => {
      stops = measure();
      prevY = window.scrollY;
    },
    destroy: () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(anim);
      html.style.overflow = "";
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onPop);
    },
  };
}
