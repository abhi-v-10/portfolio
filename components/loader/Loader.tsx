"use client";

import { useId, type CSSProperties, type Ref } from "react";
import { SIGNATURE, strokeStarts } from "./signature";

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
  rootRef: Ref<HTMLDivElement>;
};

const STARTS = strokeStarts(SIGNATURE.strokes);

/**
 * The signature writes itself, one pen stroke after another. Each stroke is
 * drawn with a dash offset (compositor-friendly, no JS), and a faint
 * displacement filter roughens the edge so it reads as ink, not vector.
 */
function Signature() {
  const ink = `ink-${useId().replace(/:/g, "")}`;
  return (
    <svg className="signature" viewBox={SIGNATURE.viewBox} focusable="false">
      <defs>
        <filter id={ink} x="-2%" y="-10%" width="104%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.4" />
        </filter>
      </defs>
      <g filter={`url(#${ink})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
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
export function Loader({ phase, steps, degraded, onSkip, rootRef }: Props) {
  const done = STEP_LABELS.filter((s) => steps[s.key]).length;
  const ready = phase === "ready" || phase === "entering";
  const pending = STEP_LABELS.find((s) => !steps[s.key]);
  const label = ready ? (degraded ? "Entering, static scene" : "Entering") : (pending?.label ?? "Loading");

  return (
    <div ref={rootRef} className="loader" data-phase={phase} style={{ "--progress": done / 3 } as CSSProperties}>
      <div className="loader-panel loader-panel--top" aria-hidden>
        <Stage />
      </div>
      <div className="loader-panel loader-panel--bottom" aria-hidden>
        <Stage />
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
