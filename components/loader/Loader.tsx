"use client";

import { useEffect, useRef, useState, type CSSProperties, type Ref } from "react";
import { SIGNATURE, SIGNATURE_MS, strokeStarts } from "./signature";
import { SIGNATURE_BOOT, type SignaturePen } from "./signatureBoot";

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

/** The boot script belongs to the server-rendered page only; later client mounts skip it. */
let mountedOnce = false;

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

function Stage() {
  return (
    <div className="loader-stage">
      <div className="loader-sig-wrap">
        {/* The boot worker sizes this canvas before hydration (width/height attributes). */}
        <canvas className="signature-canvas" suppressHydrationWarning />
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
  const doneRef = useRef(onSignatureDone);
  const [withBoot] = useState(() => !mountedOnce);
  useEffect(() => {
    mountedOnce = true;
  }, []);
  useEffect(() => {
    doneRef.current = onSignatureDone;
  });

  // The pen was started by the inline boot script (signatureBoot.ts) while the
  // HTML was parsed. This only listens for the last stroke. A client-side
  // render (no boot ran for this loader) shows the SVG version instead.
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".loader");
    const pen = (window as Window & { __sig?: SignaturePen }).__sig;
    const booted = !!root?.hasAttribute("data-sig") && !!pen;
    let alive = true;
    const done = () => alive && doneRef.current();
    let timer = 0;
    if (!booted) {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      root?.setAttribute("data-sig", reduced ? "still" : "svg");
      timer = window.setTimeout(done, reduced ? 0 : SIGNATURE_MS);
    } else {
      pen.on(done);
      // Never hold the loader if a message is lost.
      timer = window.setTimeout(done, SIGNATURE_MS + 2500);
    }
    const onResize = () => pen?.resize();
    window.addEventListener("resize", onResize);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const done = STEP_LABELS.filter((s) => steps[s.key]).length;
  const ready = phase === "ready" || phase === "entering";
  const pending = STEP_LABELS.find((s) => !steps[s.key]);
  const label = ready ? (degraded ? "Entering, static scene" : "Entering") : (pending?.label ?? "Loading");

  return (
    <div
      ref={rootRef}
      className="loader"
      data-phase={phase}
      style={{ "--progress": done / 3 } as CSSProperties}
      // The boot script sets data-sig before hydration.
      suppressHydrationWarning
    >
      <div className="loader-panel loader-panel--top" aria-hidden>
        <Stage />
      </div>
      <div className="loader-panel loader-panel--bottom" aria-hidden>
        <Stage />
      </div>
      {/* Runs during HTML parsing (server render only), so the pen starts on the first frame. */}
      {withBoot && <script dangerouslySetInnerHTML={{ __html: SIGNATURE_BOOT }} />}
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
