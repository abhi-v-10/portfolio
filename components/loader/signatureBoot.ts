import { SIGNATURE, SIGNATURE_MS, strokeStarts } from "./signature";

/**
 * Signature pen boot (2026-11-27).
 *
 * The loader's signature must be writing from the first painted frame, before
 * React hydrates and long before the 3D scene compiles. So the loader renders
 * this as an inline <script> right after its markup: the browser runs it while
 * parsing the HTML, it hands both canvases to a Web Worker through
 * OffscreenCanvas, and the worker owns its own frame loop from then on. The
 * main thread can stall on hydration and shader linking without the pen
 * slowing down.
 *
 * Everything here is plain ES2019 in strings, with no imports: it runs before
 * any bundle has loaded. Paths are flattened by the worker itself (cubic
 * Béziers, arc-length resampled), so no SVG measuring happens on the main
 * thread (getPointAtLength on the long stroke cost about a second).
 *
 * The boot leaves `window.__sig` for the Loader component:
 *   { mode: "canvas" | "svg" | "still", done: boolean, on(fn), resize() }
 * and writes the same mode to the loader's data-sig attribute, which the CSS
 * reads (SVG shown for "svg" and "still", hidden for "canvas").
 */

/** Worker source: parses and flattens the strokes, then draws them with pen easing. */
const WORKER = String.raw`
var ctxs = [], job = null, t0 = 0, doneSent = false;
function bezier(x1, y1, x2, y2) {
  var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  var cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  function sx(t) { return ((ax * t + bx) * t + cx) * t; }
  function sy(t) { return ((ay * t + by) * t + cy) * t; }
  function dsx(t) { return (3 * ax * t + 2 * bx) * t + cx; }
  return function (x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    var t = x;
    for (var i = 0; i < 6; i++) {
      var e = sx(t) - x, d = dsx(t);
      if (Math.abs(e) < 1e-5 || Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    return sy(Math.min(1, Math.max(0, t)));
  };
}
var pen = bezier(0.5, 0.05, 0.3, 1);
// M/L/C (absolute and relative) path data -> polyline, then resampled every 1.2 units.
function flatten(d) {
  var tok = d.match(/[MmLlCc]|-?\d*\.?\d+(?:e-?\d+)?/g) || [];
  var raw = [], x = 0, y = 0, cmd = "M", i = 0;
  function num() { return parseFloat(tok[i++]); }
  while (i < tok.length) {
    if (/[A-Za-z]/.test(tok[i])) cmd = tok[i++];
    var rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    var ox = rel ? x : 0, oy = rel ? y : 0;
    if (C === "M" || C === "L") {
      x = ox + num(); y = oy + num(); raw.push(x, y);
      if (C === "M") cmd = rel ? "l" : "L";
    } else if (C === "C") {
      var x1 = ox + num(), y1 = oy + num(), x2 = ox + num(), y2 = oy + num(), x3 = ox + num(), y3 = oy + num();
      for (var k = 1; k <= 20; k++) {
        var t = k / 20, u = 1 - t;
        raw.push(u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
                 u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3);
      }
      x = x3; y = y3;
    } else i++;
  }
  var m = raw.length / 2, cum = [0];
  for (var j = 1; j < m; j++) cum.push(cum[j - 1] + Math.hypot(raw[j * 2] - raw[j * 2 - 2], raw[j * 2 + 1] - raw[j * 2 - 1]));
  var len = cum[m - 1], n = Math.max(2, Math.ceil(len / 1.2)), pts = new Float32Array((n + 1) * 2), s = 1;
  for (var q = 0; q <= n; q++) {
    var at = (len * q) / n;
    while (s < m - 1 && cum[s] < at) s++;
    var seg = cum[s] - cum[s - 1], f = seg > 0 ? (at - cum[s - 1]) / seg : 0;
    pts[q * 2] = raw[s * 2 - 2] + (raw[s * 2] - raw[s * 2 - 2]) * f;
    pts[q * 2 + 1] = raw[s * 2 - 1] + (raw[s * 2 + 1] - raw[s * 2 - 1]) * f;
  }
  return pts;
}
function size(w, h, dpr) {
  job.width = w; job.height = h; job.dpr = dpr;
  job.canvases.forEach(function (c) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); });
}
function draw(now) {
  var k = (job.width / job.viewBox[0]) * job.dpr, elapsed = now - t0, allDone = true;
  ctxs.forEach(function (ctx) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
  });
  job.strokes.forEach(function (s, i) {
    var local = (elapsed - job.starts[i]) / s.ms;
    if (local < 1) allDone = false;
    if (local <= 0) return;
    var p = pen(Math.min(1, local)), n = s.pts.length / 2, reach = p * (n - 1), last = Math.floor(reach), frac = reach - last;
    ctxs.forEach(function (ctx) {
      ctx.strokeStyle = s.accent ? job.colors.accent : job.colors.ink;
      // Pressure: a little lighter where the pen lands and lifts. Short runs of equal width.
      for (var a = 0; a < last; a += 6) {
        var b = Math.min(last, a + 6), u = (a + b) / 2 / (n - 1);
        ctx.lineWidth = s.width * (0.72 + 0.28 * Math.sin(Math.PI * Math.min(1, u * 1.15)));
        ctx.beginPath();
        ctx.moveTo(s.pts[a * 2], s.pts[a * 2 + 1]);
        for (var j = a + 1; j <= b; j++) ctx.lineTo(s.pts[j * 2], s.pts[j * 2 + 1]);
        if (b === last && last < n - 1) ctx.lineTo(s.pts[last * 2] + (s.pts[last * 2 + 2] - s.pts[last * 2]) * frac, s.pts[last * 2 + 1] + (s.pts[last * 2 + 3] - s.pts[last * 2 + 1]) * frac);
        ctx.stroke();
      }
    });
  });
  if (allDone) {
    if (!doneSent) { doneSent = true; postMessage({ type: "done" }); }
    return; // the final frame stays on the canvases
  }
  raf(draw);
}
function raf(fn) {
  return typeof requestAnimationFrame === "function" ? requestAnimationFrame(fn) : setTimeout(function () { fn(performance.now()); }, 16);
}
onmessage = function (e) {
  var m = e.data;
  if (m.type === "start") {
    job = m;
    job.strokes = m.strokes.map(function (s) { return { pts: flatten(s.d), ms: s.ms, width: s.width, accent: s.accent }; });
    ctxs = job.canvases.map(function (c) { return c.getContext("2d"); });
    size(m.width, m.height, m.dpr);
    raf(function (t) { t0 = t; draw(t); });
  } else if (m.type === "resize" && job) {
    size(m.width, m.height, m.dpr);
    if (doneSent) draw(t0 + 1e9);
  }
};
`;

/** Boot: runs inline, right after the loader's markup. `D` is the JSON payload. */
const BOOT = String.raw`
(function (D) {
  var root = document.currentScript && document.currentScript.parentElement;
  var S = { mode: "svg", done: false, cbs: [], on: function (f) { S.done ? f() : S.cbs.push(f); }, resize: function () {} };
  window.__sig = S;
  if (!root) return;
  function finish() { if (S.done) return; S.done = true; S.cbs.splice(0).forEach(function (f) { f(); }); }
  function mode(m) { S.mode = m; root.setAttribute("data-sig", m); }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { mode("still"); finish(); return; }
  var els = root.querySelectorAll("canvas.signature-canvas");
  function fallBack() { mode("svg"); setTimeout(finish, D.ms); }
  if (els.length !== 2 || !("transferControlToOffscreen" in HTMLCanvasElement.prototype) || typeof Worker === "undefined") return fallBack();
  try {
    var wrap = els[0].parentElement;
    var box = function () { var w = wrap.clientWidth; return { width: w, height: (w * D.vb[1]) / D.vb[0], dpr: Math.min(2, window.devicePixelRatio || 1) }; };
    var url = URL.createObjectURL(new Blob([D.worker], { type: "text/javascript" }));
    var offs = [els[0].transferControlToOffscreen(), els[1].transferControlToOffscreen()];
    var w = new Worker(url);
    var start = box();
    w.onmessage = function (e) { if (e.data && e.data.type === "done") { finish(); w.terminate(); URL.revokeObjectURL(url); } };
    w.onerror = function () { fallBack(); };
    w.postMessage({ type: "start", canvases: offs, strokes: D.strokes, starts: D.starts, viewBox: D.vb, colors: D.colors, width: start.width, height: start.height, dpr: start.dpr }, offs);
    S.resize = function () { if (!S.done) w.postMessage(Object.assign({ type: "resize" }, box())); };
    mode("canvas");
  } catch (err) {
    fallBack();
  }
})`;

const [, , VB_W, VB_H] = SIGNATURE.viewBox.split(/\s+/).map(Number);

/** The inline script's text. Escapes "<" so the payload can never close the tag. */
export const SIGNATURE_BOOT = `${BOOT}(${JSON.stringify({
  worker: WORKER,
  ms: SIGNATURE_MS,
  vb: [VB_W, VB_H],
  starts: strokeStarts(SIGNATURE.strokes),
  colors: { ink: "#ece6da", accent: "#c8794a" },
  strokes: SIGNATURE.strokes.map((s) => ({ d: s.d, ms: s.ms, width: (s.width ?? 2.1) * 1.05, accent: !!s.accent })),
}).replace(/</g, "\\u003c")});`;

export type SignaturePen = {
  mode: "canvas" | "svg" | "still";
  done: boolean;
  on: (fn: () => void) => void;
  resize: () => void;
};
