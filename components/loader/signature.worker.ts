/// <reference lib="webworker" />
/**
 * Signature pen, off the main thread (2026-11-26).
 *
 * The loader runs while the page hydrates and the 3D scene compiles, which can
 * stall the main thread for hundreds of milliseconds. SVG stroke animations
 * (and Rive, Vivus, GSAP or anime.js, which all draw on the main thread) stall
 * with it. This worker owns the loader's canvases through OffscreenCanvas and
 * draws the strokes on its own thread at the display's frame rate, so the
 * signature writes itself in one smooth pass on every load.
 *
 * Messages in:  { type: "start", canvases, strokes, starts, dpr, width, height, viewBox, colors }
 *               { type: "resize", width, height, dpr }
 * Messages out: { type: "done" } once the last stroke has landed.
 */

type Stroke = { pts: Float32Array; ms: number; width: number; accent: boolean };
type Start = {
  type: "start";
  canvases: OffscreenCanvas[];
  strokes: Stroke[];
  starts: number[];
  dpr: number;
  width: number;
  height: number;
  viewBox: [number, number];
  colors: { ink: string; accent: string };
};

let ctxs: OffscreenCanvasRenderingContext2D[] = [];
let job: Start | null = null;
let t0 = 0;
let doneSent = false;

// cubic-bezier(0.5, 0.05, 0.3, 1): a pen that starts gently, travels, and lifts.
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  const dsx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const e = sx(t) - x;
      const d = dsx(t);
      if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    return sy(Math.min(1, Math.max(0, t)));
  };
}
const pen = bezier(0.5, 0.05, 0.3, 1);

function size(width: number, height: number, dpr: number) {
  if (!job) return;
  job.width = width;
  job.height = height;
  job.dpr = dpr;
  job.canvases.forEach((c) => {
    c.width = Math.round(width * dpr);
    c.height = Math.round(height * dpr);
  });
}

function draw(now: number) {
  if (!job) return;
  const { strokes, starts, viewBox, dpr, width, colors } = job;
  const k = (width / viewBox[0]) * dpr; // viewBox units → device pixels
  const elapsed = now - t0;
  let allDone = true;
  for (const ctx of ctxs) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }
  strokes.forEach((s, i) => {
    const local = (elapsed - starts[i]) / s.ms;
    if (local < 1) allDone = false;
    if (local <= 0) return;
    const p = pen(Math.min(1, local));
    const n = s.pts.length / 2;
    const reach = p * (n - 1);
    const last = Math.floor(reach);
    const frac = reach - last;
    for (const ctx of ctxs) {
      ctx.strokeStyle = s.accent ? colors.accent : colors.ink;
      if (n < 3) {
        // A dot: one short stroke.
        ctx.lineWidth = s.width;
        ctx.beginPath();
        ctx.moveTo(s.pts[0], s.pts[1]);
        ctx.lineTo(s.pts[0] + (s.pts[2] - s.pts[0]) * p + 0.01, s.pts[1] + (s.pts[3] - s.pts[1]) * p);
        ctx.stroke();
        continue;
      }
      // Pressure: a little lighter where the pen lands and lifts, full in between.
      // Drawn in short runs of equal width so the line stays continuous.
      const RUN = 6;
      for (let a = 0; a < last; a += RUN) {
        const b = Math.min(last, a + RUN);
        const u = (a + b) / 2 / (n - 1);
        ctx.lineWidth = s.width * (0.72 + 0.28 * Math.sin(Math.PI * Math.min(1, u * 1.15)));
        ctx.beginPath();
        ctx.moveTo(s.pts[a * 2], s.pts[a * 2 + 1]);
        for (let j = a + 1; j <= b; j++) ctx.lineTo(s.pts[j * 2], s.pts[j * 2 + 1]);
        if (b === last && last < n - 1) {
          const x = s.pts[last * 2] + (s.pts[last * 2 + 2] - s.pts[last * 2]) * frac;
          const y = s.pts[last * 2 + 1] + (s.pts[last * 2 + 3] - s.pts[last * 2 + 1]) * frac;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
  });
  if (allDone) {
    if (!doneSent) {
      doneSent = true;
      (self as unknown as Worker).postMessage({ type: "done" });
    }
    return; // the final frame stays on the canvases
  }
  raf(draw);
}

const raf = (fn: (t: number) => void) =>
  typeof self.requestAnimationFrame === "function" ? self.requestAnimationFrame(fn) : setTimeout(() => fn(performance.now()), 16);

self.onmessage = (e: MessageEvent) => {
  const m = e.data;
  if (m.type === "start") {
    job = m as Start;
    ctxs = job.canvases.map((c) => c.getContext("2d")!);
    size(job.width, job.height, job.dpr);
    raf((t) => {
      t0 = t;
      draw(t);
    });
  } else if (m.type === "resize") {
    size(m.width, m.height, m.dpr);
    if (doneSent) draw(t0 + 1e9);
  }
};
