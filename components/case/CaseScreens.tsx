"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import { evidence } from "@/content/evidence";
import { screenIds } from "@/content/screens";
import { openEvidence } from "@/components/evidence/evidenceEvents";
import type { MorphControls } from "./MorphSlider";

// The WebGL slider (ogl) loads only when a case study with screens is shown.
const MorphSlider = dynamic(() => import("./MorphSlider"), { ssr: false });

const num = (n: number) => String(n).padStart(2, "0");

/**
 * Screens carousel in a case study: the screenshots melt from one to the next
 * (MorphSlider, WebGL), driven by drag or swipe, arrow keys, the arrows or the
 * thumbnails. Without WebGL, and before the slider loads, the same controls
 * cross-fade plain images. "Full size" opens the shared viewer at the screen.
 */
export function CaseScreens({ project, name }: { project: string; name: string }) {
  const ids = useMemo(() => screenIds(project), [project]);
  const shots = useMemo(() => ids.map((id) => evidence[id]), [ids]);
  const items = useMemo(() => shots.map((s) => ({ image: s.src })), [shots]);
  const controls = useRef<MorphControls | null>(null);
  const [index, setIndex] = useState(0);
  const [gl, setGl] = useState(true);
  const swipe = useRef<number | null>(null);

  if (!shots.length) return null;
  const many = shots.length > 1;
  const current = shots[index];
  const live = () => (gl ? controls.current : null);
  const go = (i: number) => {
    const t = (i + shots.length) % shots.length;
    const c = live();
    if (c) c.goTo(t);
    else setIndex(t);
  };
  const step = (d: number) => {
    const c = live();
    if (c) {
      if (d > 0) c.next();
      else c.prev();
    } else go(index + d);
  };

  return (
    <div className="screens">
      <div
        className="screens-stage"
        style={{ aspectRatio: `${shots[0].width} / ${shots[0].height}` }}
        // Without WebGL the slider is absent: a plain swipe still steps through.
        onPointerDown={(e) => {
          if (!controls.current) swipe.current = e.clientX;
        }}
        onPointerUp={(e) => {
          if (swipe.current === null) return;
          const dx = e.clientX - swipe.current;
          swipe.current = null;
          if (many && Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => (swipe.current = null)}
      >
        {/* Plain images: shown before the slider loads and whenever WebGL is missing. */}
        <div className="screens-still">
          {shots.map((s, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={s.id}
              src={s.src}
              alt={i === index ? s.alt : ""}
              aria-hidden={i === index ? undefined : true}
              data-on={i === index || undefined}
              draggable={false}
              loading={i ? "lazy" : "eager"}
              decoding="async"
            />
          ))}
        </div>
        {gl && many && (
          <MorphSlider
            items={items}
            transition="melt"
            duration={1.15}
            intensity={0.5}
            aberration={0.4}
            drift={0.3}
            overlayColor="#070504"
            label={`${name} screenshots. Drag, swipe or use the arrow keys.`}
            onIndexChange={setIndex}
            controlRef={controls}
            onFail={() => setGl(false)}
          />
        )}
        <span className="screens-tick" data-c="tl" aria-hidden />
        <span className="screens-tick" data-c="tr" aria-hidden />
        <span className="screens-tick" data-c="bl" aria-hidden />
        <span className="screens-tick" data-c="br" aria-hidden />
      </div>

      <div className="screens-bar">
        <div className="screens-text" aria-live="polite">
          <p className="screens-count">
            <span>{num(index + 1)}</span> / {num(shots.length)} · {current.title}
          </p>
          <p className="screens-caption">{current.caption}</p>
        </div>
        <div className="screens-actions">
          <button type="button" className="screens-full" aria-haspopup="dialog" onClick={() => openEvidence(ids, index)}>
            Full size
          </button>
          {many && (
            <>
              <button type="button" className="screens-arrow" aria-label="Previous screen" onClick={() => step(-1)}>
                <svg viewBox="0 0 24 24" aria-hidden focusable="false">
                  <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
              <button type="button" className="screens-arrow" aria-label="Next screen" onClick={() => step(1)}>
                <svg viewBox="0 0 24 24" aria-hidden focusable="false">
                  <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {many && (
        <div className="screens-thumbs">
          {shots.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className="screens-thumb"
              aria-label={`Show screen ${i + 1}: ${s.title}`}
              aria-current={i === index || undefined}
              onClick={() => go(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.thumb} alt="" loading="lazy" decoding="async" />
              <span aria-hidden>{num(i + 1)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
