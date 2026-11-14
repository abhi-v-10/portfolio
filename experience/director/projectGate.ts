/**
 * Project Universe gesture gate (corrective pass, 2026-11-15).
 *
 * Not snapping. Scrolling stays native and manual everywhere. The gate only
 * acts when a user's own scroll input is about to carry the page across one
 * of the Project Universe stops (the establishing shot and each exhibit's
 * showcase framing):
 *
 *  - The page settles exactly on that stop and the rest of that gesture,
 *    including trackpad or touch momentum, is consumed there.
 *  - It stays put while the visitor reads, clicks or idles; nothing moves
 *    on its own.
 *  - Only a NEW gesture (a wheel pause longer than GAP, a new touch, a new
 *    key press, or a change of direction) continues, and it scrolls
 *    naturally; it is not animated to the next stop.
 *
 * Wheel and touchmove listeners are non-passive but return immediately
 * unless a stop is involved. Programmatic movement (Index links, anchors,
 * history, the case-study return) is never gated: only recent user scroll
 * input is, and in-page link clicks open a short bypass window. Disabled
 * under reduced motion and while the Index or a case study is open.
 */

const GAP = 220; // ms of wheel silence that ends a gesture (at a healthy frame rate)
const INPUT_WINDOW = 1600; // ms after user input during which scrolling counts as user-driven (covers flings)
const KEYS_PAGE = new Set(["PageDown", "PageUp", " "]);
const KEYS_STEP = new Set(["ArrowDown", "ArrowUp"]);

export type ProjectGate = { refresh: () => void; destroy: () => void };

export function installProjectGate(measure: () => number[]): ProjectGate {
  const html = document.documentElement;
  let stops = measure();
  let gesture = 0;
  let lockedGesture = -1;
  let lockedDir = 0;
  let lastWheel = 0;
  let lastWheelDir = 0;
  let inputAt = -1e9;
  let bypassUntil = 0;
  let prevY = window.scrollY;
  let settling = false;
  let touchY = 0;
  let touchDir = 0;
  let touching = false;
  let holdTouch = false;
  let releaseTimer = 0;
  let touchEndAt = -1e9;
  // Slow frames deliver coalesced wheel events further apart: scale the gap
  // with the measured frame time so one gesture is never split in two.
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

  /** First stop strictly beyond `from` and reached by `to`, in travel order. */
  const crossed = (from: number, to: number) => {
    if (to > from) {
      for (const s of stops) if (s > from + 0.5 && s <= to) return s;
    } else if (to < from) {
      for (let i = stops.length - 1; i >= 0; i--) if (stops[i] < from - 0.5 && stops[i] >= to) return stops[i];
    }
    return null;
  };

  const release = () => {
    html.style.overflow = "";
    settling = false;
    holdTouch = false;
    prevY = window.scrollY;
  };
  const settle = (target: number, dir: number) => {
    settling = true;
    lockedGesture = gesture;
    lockedDir = dir;
    // A root overflow lock ends native inertia (trackpad, touch fling). A
    // finger still on the glass keeps scrolling once a touch scroll has
    // begun (touchmove is no longer cancelable), so mid-touch the lock is
    // held until the finger lifts, plus a beat to swallow the fling.
    html.style.overflow = "hidden";
    window.scrollTo({ top: target, behavior: "instant" as ScrollBehavior });
    prevY = target;
    window.clearTimeout(releaseTimer);
    if (touching) {
      holdTouch = true;
    } else if (now() - touchEndAt < 2000) {
      releaseTimer = window.setTimeout(release, 260); // a fling outlives two frames
    } else {
      requestAnimationFrame(() => requestAnimationFrame(release));
    }
  };

  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey || off()) return;
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
    if (!dy || Math.abs(e.deltaX) > Math.abs(dy)) return;
    const t = now();
    const dir = Math.sign(dy);
    if (t - lastWheel > gap() || dir !== lastWheelDir) gesture++;
    lastWheel = t;
    lastWheelDir = dir;
    inputAt = t;
    if (lockedGesture === gesture) {
      // Momentum of the gesture that reached a stop: consumed here.
      e.preventDefault();
      return;
    }
    const y = window.scrollY;
    const s = crossed(y, y + dy);
    if (s !== null) {
      e.preventDefault();
      settle(s, dir);
    }
  };

  const onTouchStart = (e: TouchEvent) => {
    touching = true;
    if (e.touches.length !== 1) return;
    gesture++;
    touchY = e.touches[0].clientY;
    touchDir = 0;
  };
  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length !== 1 || off()) return;
    const yNow = e.touches[0].clientY;
    const dir = Math.sign(touchY - yNow); // finger up = page down
    if (dir) touchDir = dir;
    touchY = yNow;
    inputAt = now();
    if (lockedGesture === gesture) {
      if (touchDir === lockedDir) e.preventDefault();
      else lockedGesture = -1; // reversing within the same touch is allowed
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (e.touches.length) return;
    touching = false;
    touchEndAt = now();
    inputAt = now(); // the fling that follows is still the visitor's input
    if (holdTouch) releaseTimer = window.setTimeout(release, 180);
  };

  const onKey = (e: KeyboardEvent) => {
    const el = e.target as HTMLElement | null;
    if (e.altKey || e.ctrlKey || e.metaKey || off()) return;
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.closest("dialog"))) return;
    if (e.key === "Home" || e.key === "End") {
      bypassUntil = now() + 1500;
      return;
    }
    const page = KEYS_PAGE.has(e.key);
    if (!page && !KEYS_STEP.has(e.key)) return;
    if (e.key === " " && el && el.closest("button, a, [role='button']")) return;
    const dir = e.key === "PageUp" || e.key === "ArrowUp" || (e.key === " " && e.shiftKey) ? -1 : 1;
    if (!e.repeat) gesture++;
    inputAt = now();
    if (lockedGesture === gesture) {
      e.preventDefault(); // a held key does not run past the stop
      return;
    }
    // Paging inside the journey: one press, one stop.
    if (page) {
      const y = window.scrollY;
      if (y < stops[0] - 2 || y > stops[stops.length - 1] + 2) return;
      const next = dir > 0 ? stops.find((s) => s > y + 2) : [...stops].reverse().find((s) => s < y - 2);
      if (next === undefined) return;
      e.preventDefault();
      lockedGesture = gesture;
      lockedDir = dir;
      window.scrollTo({ top: next, behavior: "smooth" });
    }
  };

  const onScroll = () => {
    const y = window.scrollY;
    if (settling) return;
    // Scrollbar drags, arrow keys, touch flings, smooth wheel animations:
    // anything user-driven that crosses a stop settles on it.
    // A step larger than two viewports is a jump (anchor, script), not travel.
    const jump = Math.abs(y - prevY) > window.innerHeight * 2;
    if (!jump && !off() && now() - inputAt < INPUT_WINDOW && lockedGesture !== gesture) {
      const s = crossed(prevY, y);
      if (s !== null) {
        settle(s, Math.sign(y - prevY));
        return;
      }
    }
    prevY = y;
  };

  // In-page navigation (Index links, skip links, anchors) is intentional: let it pass.
  const onClick = (e: MouseEvent) => {
    const a = (e.target as HTMLElement | null)?.closest?.("a[href]");
    if (a && (a.getAttribute("href") ?? "").includes("#")) bypassUntil = now() + 1500;
  };
  const onPop = () => (bypassUntil = now() + 1500);

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

  return {
    refresh: () => {
      stops = measure();
      prevY = window.scrollY;
    },
    destroy: () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.clearTimeout(releaseTimer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onPop);
      html.style.overflow = "";
    },
  };
}
