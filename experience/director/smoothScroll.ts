/**
 * Scroll director (2026-11-27; replaces the Project Universe pager).
 *
 * One owner for wheel scrolling across the whole page:
 *
 *  - Smooth everywhere. Wheel and trackpad input move a target; the page eases
 *    toward it every frame (exponential approach, about 0.3s to settle), so a
 *    notched mouse wheel glides instead of jumping 100px at a time.
 *  - Project Universe stops. Scrolling inside the universe is still manual and
 *    smooth, but a gesture that would cross a stop (the establishing panel or a
 *    project's panel) ends exactly on it. The rest of that gesture, including
 *    trackpad momentum, is discarded. The next gesture (a pause, a reversal or
 *    a stronger push after a decaying tail) continues from there. Nothing ever
 *    moves on its own.
 *  - Touch keeps native scrolling. A drag or fling that crosses a stop is
 *    caught on the stop.
 *  - Keyboard keeps native scrolling outside the universe. Inside it,
 *    PageDown/Space/ArrowDown and PageUp/ArrowUp ease to the next stop.
 *  - Programmatic movement (Index and anchor links, history, case-study
 *    return, Home/End, the scrollbar) is never smoothed or stopped: the
 *    director just follows it. Off while the Index or a case study is open,
 *    and inside any element that scrolls on its own.
 *  - Reduced motion: no easing (instant steps); the stops still apply.
 */

const GAP = 200; // ms of wheel silence that can end a gesture (at a healthy frame rate)
const EASE = 11; // 1/s: the approach rate of the eased scroll
const KEYS_NEXT = new Set(["PageDown", "ArrowDown", " "]);
const KEYS_PREV = new Set(["PageUp", "ArrowUp"]);

export type ScrollDirector = { refresh: () => void; destroy: () => void };

export function installSmoothScroll(measureStops: () => number[], opts: { reduced: boolean }): ScrollDirector {
  const html = document.documentElement;
  let stops = measureStops();
  const now = () => performance.now();
  const maxY = () => Math.max(0, html.scrollHeight - window.innerHeight);

  // Eased position. `current` is what this director last wrote; anything else
  // that moves the page (links, scrollbar, keys) is adopted as the new rest.
  let target = window.scrollY;
  let current = window.scrollY;
  let running = false;
  let raf = 0;
  let last = 0;

  // Gestures
  let gesture = 0;
  let lockedGesture = -1;
  let lastWheel = 0;
  let lastWheelDir = 0;
  let lastAbs = 0;
  let bypassUntil = 0;
  let inputAt = -1e9;
  let prevY = window.scrollY;
  let touching = false;
  let touchLock = 0;

  // Slow frames deliver wheel events further apart: scale the gap with frame time.
  let frameDt = 16;
  let lastFrame = now();
  let sampler = 0;
  const sample = (t: number) => {
    frameDt = frameDt * 0.9 + Math.min(500, t - lastFrame) * 0.1;
    lastFrame = t;
    sampler = requestAnimationFrame(sample);
  };
  sampler = requestAnimationFrame(sample);
  const gap = () => Math.max(GAP, frameDt * 2.5);

  const off = () =>
    html.classList.contains("has-index") ||
    html.classList.contains("has-case") ||
    html.hasAttribute("data-case") ||
    now() < bypassUntil ||
    Date.now() - Number(html.dataset.caseReturn ?? 0) < 2500;

  const EPS = 2;
  const first = () => stops[0];
  const lastStop = () => stops[stops.length - 1];
  const inside = (y: number) => y >= first() - EPS && y <= lastStop() + EPS;
  /** First stop strictly beyond `from`, up to and including `to`, in travel order. */
  const crossed = (from: number, to: number) => {
    if (to > from) return stops.find((s) => s > from + EPS && s <= to) ?? null;
    if (to < from) return [...stops].reverse().find((s) => s < from - EPS && s >= to) ?? null;
    return null;
  };
  const neighbour = (y: number, dir: number) =>
    dir > 0 ? stops.find((s) => s > y + EPS) : [...stops].reverse().find((s) => s < y - EPS);

  const write = (y: number) => {
    current = y;
    window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
  };
  const frame = (t: number) => {
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    const d = target - current;
    if (Math.abs(d) < 0.5) {
      write(target);
      running = false;
      return;
    }
    write(current + d * (1 - Math.exp(-EASE * dt)));
    raf = requestAnimationFrame(frame);
  };
  const go = (y: number) => {
    target = Math.min(maxY(), Math.max(0, y));
    if (opts.reduced) {
      cancelAnimationFrame(raf);
      running = false;
      write(target);
      return;
    }
    if (!running) {
      running = true;
      current = window.scrollY;
      last = now();
      raf = requestAnimationFrame(frame);
    }
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    running = false;
    target = current = window.scrollY;
  };

  /**
   * Elements that scroll on their own keep native wheel handling. Only dialogs
   * and opted-in panels scroll inside this page, so this is a selector test,
   * not a computed-style walk: getComputedStyle on every wheel event forced a
   * style recalculation many times per frame.
   */
  const scrollsItself = (el: Element | null, dy: number) => {
    const box = el?.closest?.("dialog, [data-native-scroll]") as HTMLElement | null;
    if (!box) return false;
    if (box.tagName === "DIALOG") return true;
    const atEnd = dy > 0 ? box.scrollTop + box.clientHeight >= box.scrollHeight - 1 : box.scrollTop <= 0;
    return !atEnd;
  };

  const onWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.defaultPrevented || off()) return;
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1);
    if (!dy || Math.abs(e.deltaX) > Math.abs(dy)) return;
    if (scrollsItself(e.target as Element | null, dy)) return;
    e.preventDefault();
    const t = now();
    const dir = Math.sign(dy);
    const abs = Math.abs(dy);
    // Gesture boundaries. Momentum decays, so after a pause a NEW gesture
    // pushes at least as hard as the last event did; a weaker continuation is
    // still the old one. A reversal always starts a new gesture.
    const silence = t - lastWheel;
    let fresh = false;
    if (dir !== lastWheelDir) fresh = true;
    else if (silence > 700) fresh = abs > 8 || abs >= lastAbs * 0.95;
    else if (silence > gap()) fresh = abs > lastAbs * 0.95 + 2;
    if (fresh) gesture++;
    lastWheel = t;
    lastWheelDir = dir;
    lastAbs = abs;
    inputAt = t;
    if (lockedGesture === gesture) return; // this gesture already ended on a stop

    // A reversal starts from where the page is, not from the old target.
    const from = dir !== Math.sign(target - current) && running ? current : target;
    const next = Math.min(maxY(), Math.max(0, from + dy));
    const s = crossed(from, next);
    if (s !== null) {
      lockedGesture = gesture;
      go(s);
    } else go(next);
  };

  const onKey = (e: KeyboardEvent) => {
    const el = e.target as HTMLElement | null;
    if (e.altKey || e.ctrlKey || e.metaKey || off()) return;
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.closest("dialog"))) return;
    if (e.key === "Home" || e.key === "End") {
      bypassUntil = now() + 1500;
      stop();
      return;
    }
    const next = KEYS_NEXT.has(e.key) && !(e.key === " " && e.shiftKey);
    const prev = KEYS_PREV.has(e.key) || (e.key === " " && e.shiftKey);
    if (!next && !prev) return;
    if (e.key === " " && el && el.closest("button, a, [role='button']")) return;
    const y = running ? target : window.scrollY;
    const dir = next ? 1 : -1;
    // Arrow keys move a little, page keys a screen: the stop still wins.
    const step = e.key.startsWith("Arrow") ? 120 : window.innerHeight * 0.85;
    const s = inside(y) ? neighbour(y, dir) : crossed(y, y + dir * step);
    e.preventDefault();
    inputAt = now();
    if (s !== undefined && s !== null && (inside(y) || Math.abs(s - y) <= step)) go(s);
    else go(y + dir * step);
  };

  // Touch: native scrolling. A drag or fling across a stop is caught on it.
  const onTouchStart = () => {
    touching = true;
    gesture++;
    stop();
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (!e.touches.length) touching = false;
  };
  const holdOnStop = (s: number) => {
    // A root overflow lock ends the native fling at once; released when the
    // finger is up and the page has been still for a moment.
    html.style.overflow = "hidden";
    write(s);
    target = s;
    lockedGesture = gesture;
    window.clearTimeout(touchLock);
    const release = () => {
      if (touching) touchLock = window.setTimeout(release, 120);
      else html.style.overflow = "";
    };
    touchLock = window.setTimeout(release, 350);
  };

  const onScroll = () => {
    const y = window.scrollY;
    if (Math.abs(y - current) > 1.5) {
      // Someone else moved the page (scrollbar, link, key, touch): follow it.
      if (running) {
        cancelAnimationFrame(raf);
        running = false;
      }
      target = current = y;
      const jump = Math.abs(y - prevY) > window.innerHeight * 2;
      if (!jump && !off() && now() - inputAt < 1600 && lockedGesture !== gesture) {
        const s = crossed(prevY, y);
        // Only touch travel is caught; a scrollbar drag goes where it is dragged.
        if (s !== null && (touching || lastInput.startsWith("touch"))) {
          holdOnStop(s);
          prevY = s;
          return;
        }
      }
    }
    prevY = y;
  };
  let lastInput = "";
  const markInput = (e: Event) => {
    lastInput = e.type;
    inputAt = now();
  };

  // In-page navigation (Index links, skip links, anchors) is intentional: let it pass.
  const release = () => {
    bypassUntil = now() + 1500;
    stop();
    html.style.overflow = "";
  };
  const onClick = (e: MouseEvent) => {
    const a = (e.target as HTMLElement | null)?.closest?.("a[href]");
    if (a && (a.getAttribute("href") ?? "").includes("#")) release();
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKey);
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchstart", markInput, { passive: true });
  window.addEventListener("touchmove", markInput, { passive: true });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("touchcancel", onTouchEnd, { passive: true });
  window.addEventListener("mousedown", markInput, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("click", onClick, true);
  window.addEventListener("popstate", release);
  window.addEventListener("hashchange", release);

  // Test hook (read-only): lets automated walkthroughs inspect the director.
  (window as unknown as { __scroll?: () => object }).__scroll = () => ({ stops, gesture, lockedGesture, running, target, off: off() });

  return {
    refresh: () => {
      stops = measureStops();
      if (!running) target = current = prevY = window.scrollY;
    },
    destroy: () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(sampler);
      window.clearTimeout(touchLock);
      html.style.overflow = "";
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchstart", markInput);
      window.removeEventListener("touchmove", markInput);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      window.removeEventListener("mousedown", markInput);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", release);
      window.removeEventListener("hashchange", release);
    },
  };
}
