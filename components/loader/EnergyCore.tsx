import { useId, type ReactNode } from "react";

/**
 * Original energy heart. A faceted rhombus core inside three engineered
 * orbits (r = 52 / 78 / 96 in a 240 viewBox), the same proportions the 3D
 * core uses, so the split reveals one continuous object.
 *
 * Each moving part is its own HTML layer animated with CSS `transform` only.
 * Rotating SVG <g> elements runs on the main thread and stalls while the
 * scene compiles; HTML transform animations run on the compositor, so the
 * core keeps turning smoothly through every loading stage.
 */
function Layer({ className = "", children, defs }: { className?: string; children: ReactNode; defs?: ReactNode }) {
  return (
    <div className={`core-layer ${className}`}>
      <svg viewBox="0 0 240 240" focusable="false">
        {defs && <defs>{defs}</defs>}
        {children}
      </svg>
    </div>
  );
}

export function EnergyCore({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const g = (name: string) => `${name}-${id}`;
  return (
    <div className={`core ${className}`} aria-hidden>
      <Layer
        className="core-halo"
        defs={
          <radialGradient id={g("halo")} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#73DFFF" stopOpacity="0.42" />
            <stop offset="38%" stopColor="#3478F6" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#3478F6" stopOpacity="0" />
          </radialGradient>
        }
      >
        <circle cx="120" cy="120" r="119" fill={`url(#${g("halo")})`} />
      </Layer>

      {/* r = 96: precision ticks */}
      <Layer className="core-spin core-spin--slow">
        <circle cx="120" cy="120" r="96" fill="none" stroke="#73DFFF" strokeOpacity="0.34" strokeWidth="5" strokeDasharray="0.9 5.13" />
        <circle cx="120" cy="120" r="99.5" fill="none" stroke="#73DFFF" strokeOpacity="0.14" strokeWidth="0.6" />
      </Layer>

      {/* r = 78: split orbit + circulating current */}
      <Layer className="core-spin core-spin--reverse">
        <circle cx="120" cy="120" r="78" fill="none" stroke="#8FE6FF" strokeOpacity="0.62" strokeWidth="1.4" strokeDasharray="196 49.04" strokeLinecap="round" />
      </Layer>
      <Layer
        className="core-spin core-spin--current"
        defs={
          <linearGradient id={g("comet")} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#73DFFF" stopOpacity="0" />
            <stop offset="100%" stopColor="#E9FBFF" stopOpacity="1" />
          </linearGradient>
        }
      >
        <circle cx="120" cy="120" r="78" fill="none" stroke={`url(#${g("comet")})`} strokeWidth="2.6" strokeDasharray="70 420.09" strokeLinecap="round" />
      </Layer>

      {/* r = 52: three-arc inner frame */}
      <Layer className="core-spin core-spin--inner">
        <circle cx="120" cy="120" r="52" fill="none" stroke="#73DFFF" strokeOpacity="0.9" strokeWidth="2" strokeDasharray="86 22.9" strokeLinecap="round" />
      </Layer>

      {/* Engineered notches at the cardinal axes */}
      <Layer>
        <g stroke="#BDF2FF" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round">
          <line x1="120" y1="56" x2="120" y2="63" />
          <line x1="120" y1="177" x2="120" y2="184" />
          <line x1="56" y1="120" x2="63" y2="120" />
          <line x1="177" y1="120" x2="184" y2="120" />
        </g>
      </Layer>

      {/* The heart: faceted rhombus with an inner facet line */}
      <Layer
        className="core-heart"
        defs={
          <radialGradient id={g("heart")} cx="50%" cy="46%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="26%" stopColor="#CFF6FF" />
            <stop offset="58%" stopColor="#73DFFF" />
            <stop offset="100%" stopColor="#2E5BE0" />
          </radialGradient>
        }
      >
        <polygon points="120,94 136,120 120,146 104,120" fill={`url(#${g("heart")})`} />
        <polygon points="120,94 136,120 120,120" fill="#FFFFFF" fillOpacity="0.28" />
        <polygon points="120,120 104,120 120,146" fill="#0B2A7A" fillOpacity="0.22" />
        <polygon points="120,103 129.5,120 120,137 110.5,120" fill="none" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="0.8" />
        <circle cx="120" cy="120" r="2.4" fill="#FFFFFF" />
      </Layer>
    </div>
  );
}
