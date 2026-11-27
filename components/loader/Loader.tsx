"use client";

import { useEffect, useRef, type CSSProperties, type Ref } from "react";
import { SIGNATURE, SIGNATURE_MS, strokeStarts } from "./signature";

export type LoaderPhase = "loading" | "ready" | "entering" | "entered";
export type LoaderSteps = { interface: boolean; typefaces: boolean; scene: boolean };

const STEP_LABELS: { key: keyof LoaderSteps; label: string }[] = [
  { key: "interface", label: "Interface" },
  { key: "typefaces", label: "Typefaces" },
  { key: "scene", label: "Scene" },
];

type Props = {
  phase: LoaderPhase;
  steps: LoaderSteps;
  degraded: boolean;
  onSkip: () => void;
  /** Called once, when the last stroke has landed (immediately under reduced motion). */
  onSignatureDone: () => void;
  rootRef: Ref<HTMLDivElement>;
};

const STARTS = strokeStarts(SIGNATURE.strokes);

/**
 * SVG signature: the fallback (no OffscreenCanvas) and the reduced-motion
 * still. Stroke animations here run on the main thread; the per-frame ink
 * displacement filter is gone because it re-rasterised every frame.
 */
function Signature() {
  return (
    <svg className="signature" viewBox={SIGNATURE.viewBox} focusable="false">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {SIGNATURE.strokes.map((s, i) => (
          <path
            key={i}
            d={s.d}
            pathLength={1}
            className={s.accent ? "sig-stroke sig-stroke--accent" : "sig-stroke"}
            style={{ "--sig-delay": `${STARTS[i]}ms`, "--sig-dur": `${s.ms}ms`, strokeWidth: s.width ?? 2.1 } as CSSProperties}
          />
        ))}
      </g>
    </svg>
  );
}

const [VB_W, VB_H] = SIGNATURE.viewBox.split(/\s+/).slice(2).map(Number);

type Pen = {
  started: boolean;
  done: boolean;
  failed: boolean;
  worker: Worker | null;
  box: (() => { width: number; height: number; dpr: number }) | null;
  listeners: Set<() => void>;
};
const pens = new WeakMap<HTMLCanvasElement, Pen>();
function penFor(els: HTMLCanvasElement[]): Pen {
  const key = els[0];
  let p = key ? pens.get(key) : undefined;
  if (!p) {
    p = { started: false, done: false, failed: false, worker: null, box: null, listeners: new Set() };
    if (key) pens.set(key, p);
  }
  return p;
}

/** Points along each stroke, sampled once on the main thread for the worker. */
function samplePaths() {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  document.body.appendChild(svg);
  const out = SIGNATURE.strokes.map((st) => {
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", st.d);
    svg.appendChild(path);
    const len = path.getTotalLength();
    const n = Math.max(2, Math.ceil(len / 1.2));
    const pts = new Float32Array((n + 1) * 2);
    for (let k = 0; k <= n; k++) {
      const pt = path.getPointAtLength((len * k) / n);
      pts[k * 2] = pt.x;
      pts[k * 2 + 1] = pt.y;
    }
    return { pts, ms: st.ms, width: (st.width ?? 2.1) * 1.05, accent: !!st.accent };
  });
  svg.remove();
  return out;
}

function Stage({ canvasRef }: { canvasRef: (el: HTMLCanvasElement | null) => void }) {
  return (
    <div className="loader-stage">
      <div className="loader-sig-wrap">
        <canvas ref={canvasRef} className="signature-canvas" />
        <Signature />
      </div>
    </div>
  );
}

/**
 * Preloader: the signature on warm ink, a single hairline of real progress and
 * a quiet counter. It plays in full on every full page load; once the last
 * stroke has landed and every asset is ready, the sheet splits along the
 * signature's baseline on its own (both halves render the same artwork, each
 * clipped to its side). Skip intro is always available.
 */
export function Loader({ phase, steps, degraded, onSkip, onSignatureDone, rootRef }: Props) {
  const canvases = useRef<(HTMLCanvasElement | null)[]>([null, null]);
  const doneRef = useRef(onSignatureDone);
  useEffect(() => {
    doneRef.current = onSignatureDone;
  });

  // Signature pen: a worker draws both halves' canvases off the main thread.
  // A canvas can be handed to a worker only once, and React may mount this
  // effect twice in development, so the pen is started once per page and the
  // worker outlives a remount; it ends itself when the last stroke lands.
  useEffect(() => {
    const root = canvases.current[0]?.closest<HTMLElement>(".loader");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = canvases.current.filter(Boolean) as HTMLCanvasElement[];
    const canWorker = els.length === 2 && "transferControlToOffscreen" in HTMLCanvasElement.prototype && typeof Worker !== "undefined";
    let alive = true;
    const done = () => alive && doneRef.current();
    let timer = 0;
    const fallBack = (wait: number) => {
      root?.setAttribute("data-sig", reduced ? "still" : "svg");
      timer = window.setTimeout(done, wait);
    };

    const pen = penFor(els);
    if (reduced || !canWorker) fallBack(reduced ? 0 : SIGNATURE_MS);
    else if (!pen.started) {
      try {
        pen.started = true;
        const wrap = els[0].parentElement!;
        pen.box = () => ({ width: wrap.clientWidth, height: (wrap.clientWidth * VB_H) / VB_W, dpr: Math.min(2, window.devicePixelRatio || 1) });
        const offs = els.map((c) => c.transferControlToOffscreen());
        const worker = new Worker(new URL("./signature.worker.ts", import.meta.url), { type: "module" });
        pen.worker = worker;
        worker.onmessage = (e) => {
          if (e.data?.type === "done") {
            pen.done = true;
            pen.listeners.forEach((l) => l());
            worker.terminate();
          }
        };
        worker.onerror = () => {
          pen.failed = true;
          pen.listeners.forEach((l) => l());
        };
        worker.postMessage(
          { type: "start", canvases: offs, strokes: samplePaths(), starts: STARTS, viewBox: [VB_W, VB_H], colors: { ink: "#ece6da", accent: "#c8794a" }, ...pen.box() },
          offs,
        );
      } catch {
        pen.failed = true;
      }
    }

    if (!reduced && canWorker) {
      if (pen.failed) fallBack(SIGNATURE_MS);
      else {
        root?.setAttribute("data-sig", "canvas");
        const onDone = () => {
          if (pen.failed) fallBack(SIGNATURE_MS);
          else done();
        };
        if (pen.done) onDone();
        else pen.listeners.add(onDone);
        // Never hold the loader if a message is lost.
        timer = window.setTimeout(done, SIGNATURE_MS + 2500);
        const onResize = () => pen.worker && !pen.done && pen.box && pen.worker.postMessage({ type: "resize", ...pen.box() });
        window.addEventListener("resize", onResize);
        return () => {
          alive = false;
          pen.listeners.delete(onDone);
          window.removeEventListener("resize", onResize);
          window.clearTimeout(timer);
        };
      }
    }
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, []);

  const done = STEP_LABELS.filter((s) => steps[s.key]).length;
  const ready = phase === "ready" || phase === "entering";
  const pending = STEP_LABELS.find((s) => !steps[s.key]);
  const label = ready ? (degraded ? "Entering, static scene" : "Entering") : (pending?.label ?? "Loading");

  return (
    <div ref={rootRef} className="loader" data-phase={phase} style={{ "--progress": done / 3 } as CSSProperties}>
      <div className="loader-panel loader-panel--top" aria-hidden>
        <Stage canvasRef={(el) => (canvases.current[0] = el)} />
      </div>
      <div className="loader-panel loader-panel--bottom" aria-hidden>
        <Stage canvasRef={(el) => (canvases.current[1] = el)} />
      </div>
      <div className="loader-seam" aria-hidden />

      <div className="loader-ui">
        <p className="loader-mark">Abhishyanth Vemula, portfolio</p>

        <div className="loader-readout">
          <div className="loader-line" aria-hidden>
            <span className="loader-line-fill" />
          </div>
          <p className="loader-status" role="status" aria-live="polite">
            <span className="loader-status-word">{label}</span>
            <span className="loader-status-count" aria-hidden>
              {String(done).padStart(2, "0")}
              <span className="loader-status-of">/03</span>
            </span>
            <span className="sr-only">
              {ready
                ? degraded
                  ? "Ready. The 3D scene is unavailable, so a static scene is shown."
                  : "Ready. Entering the site."
                : `Loading ${done} of 3 essential assets.`}
            </span>
          </p>
        </div>

        <button type="button" className="skip-intro" onClick={onSkip}>
          Skip intro
        </button>
      </div>
    </div>
  );
}
