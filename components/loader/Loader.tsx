"use client";

import type { Ref } from "react";
import { EnergyCore } from "./EnergyCore";

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
  onExplore: () => void;
  onSkip: () => void;
  rootRef: Ref<HTMLDivElement>;
  exploreRef: Ref<HTMLButtonElement>;
};

function Stage() {
  return (
    <div className="loader-stage">
      <div className="loader-core-wrap">
        <EnergyCore className="loader-core" />
      </div>
    </div>
  );
}

/**
 * Preloader with two physical halves. Both halves render the same artwork,
 * each clipped to its side of the seam, so the core is literally cut in two
 * when the panels part. Interactive UI lives on a single separate layer.
 */
export function Loader({ phase, steps, degraded, onExplore, onSkip, rootRef, exploreRef }: Props) {
  const done = STEP_LABELS.filter((s) => steps[s.key]).length;
  const ready = phase === "ready" || phase === "entering";
  const status = ready ? "System ready" : done === 0 ? "Initializing" : "Core assets";
  const pending = STEP_LABELS.find((s) => !steps[s.key]);

  return (
    <div ref={rootRef} className="loader" data-phase={phase}>
      <div className="loader-panel loader-panel--top" aria-hidden>
        <Stage />
        <span className="loader-edge loader-edge--top" />
      </div>
      <div className="loader-panel loader-panel--bottom" aria-hidden>
        <Stage />
        <span className="loader-edge loader-edge--bottom" />
      </div>
      <div className="loader-seam" aria-hidden />

      <div className="loader-ui">
        <p className="loader-mark">
          <span>AV</span>
          <span className="loader-mark-sep" aria-hidden>/</span>
          <span>Personal system</span>
        </p>

        <div className="loader-readout">
          <p className="loader-status" role="status" aria-live="polite">
            <span className="loader-status-word">{status}</span>
            <span className="loader-status-count" aria-hidden>
              {ready ? (degraded ? "Static scene" : "03/03") : `${String(done).padStart(2, "0")}/03 · ${pending?.label ?? ""}`}
            </span>
            <span className="sr-only">
              {ready
                ? degraded
                  ? "Ready. The 3D scene is unavailable, so a static scene is shown."
                  : "Ready. Press Explore to enter."
                : `Loading ${done} of 3 essential assets.`}
            </span>
          </p>
          <div className="loader-progress" aria-hidden>
            {STEP_LABELS.map((s) => (
              <span
                key={s.key}
                className="loader-progress-seg"
                data-done={steps[s.key] || undefined}
                data-active={(!steps[s.key] && pending?.key === s.key) || undefined}
              >
                <span className="loader-progress-fill" />
              </span>
            ))}
          </div>
          <button
            ref={exploreRef}
            type="button"
            className="explore"
            onClick={onExplore}
            disabled={!ready}
          >
            <span className="explore-label">Explore</span>
            <svg className="explore-icon" viewBox="0 0 24 24" aria-hidden focusable="false">
              <path d="M5 12h13M13 6.5 18.5 12 13 17.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <button type="button" className="skip-intro" onClick={onSkip}>
          Skip intro
        </button>
      </div>
    </div>
  );
}
