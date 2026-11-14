"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react";
import { galleryPhotos } from "@/content/gallery";
import { human } from "@/content/site";
import { currentPhoto, galleryDrag, galleryStep, subscribeGallery } from "@/experience/director/gallery";

const pad = (n: number) => String(n).padStart(2, "0");

const HINT = "Drag, swipe, or use the arrow keys. The robot does the heavy lifting.";
/** Easter egg: shown briefly when the visitor spams the controls. */
const HINT_SPAM = "Easy. He's a helper bot, not a speedrunner.";

/**
 * Meet the Human: a warm beat between the hero and Curiosity. Real HTML copy
 * plus the gallery's accessible controls. The frames and the robot that
 * operates them are drawn by the world canvas behind this stage; without
 * WebGL, the stage shows the current photo card instead.
 */
export function Human({ webgl }: { webgl: boolean }) {
  const index = useSyncExternalStore(subscribeGallery, currentPhoto, () => 0);
  const photo = galleryPhotos[index];
  const drag = useRef({ id: -1, x0: 0, lastX: 0, lastT: 0, v: 0, width: 1 });
  const presses = useRef<number[]>([]);
  const [spam, setSpam] = useState(false);
  useEffect(() => {
    if (!spam) return;
    const id = window.setTimeout(() => setSpam(false), 4200);
    return () => window.clearTimeout(id);
  }, [spam]);

  // Five manual steps inside 2.5 s: the robot asks for a little patience.
  const step = (dir: 1 | -1) => {
    galleryStep(dir);
    const now = performance.now();
    const p = presses.current.filter((t) => now - t < 2500);
    p.push(now);
    presses.current = p;
    if (p.length >= 5) {
      presses.current = [];
      setSpam(true);
    }
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    }
  };

  // Horizontal drag/swipe only: touch-action pan-y leaves vertical scrolling to the browser.
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const d = drag.current;
    d.id = e.pointerId;
    d.x0 = d.lastX = e.clientX;
    d.lastT = performance.now();
    d.v = 0;
    d.width = Math.max(240, e.currentTarget.clientWidth * 0.55);
    e.currentTarget.setPointerCapture(e.pointerId);
    galleryDrag("start");
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d.id !== e.pointerId) return;
    const now = performance.now();
    const dt = Math.max(1, now - d.lastT) / 1000;
    d.v = d.v * 0.6 + (-(e.clientX - d.lastX) / d.width / dt) * 0.4;
    d.lastX = e.clientX;
    d.lastT = now;
    galleryDrag("move", -(e.clientX - d.x0) / d.width, d.v);
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d.id !== e.pointerId) return;
    d.id = -1;
    galleryDrag("end");
  };

  return (
    <section id="human" className="human" aria-labelledby="human-title">
      <div className="human-stage">
        <div className="human-copy chapter-block">
          <h2 id="human-title" className="human-title hv">
            <span>{human.title[0]}</span> <span className="human-title-2">{human.title[1]}</span>
          </h2>
          <p className="chapter-meta hv">Meet the human</p>
          <p className="human-body hv">{human.body}</p>
          <dl className="human-traits hv">
            {human.traits.map((t) => (
              <div key={t.term}>
                <dt>{t.term}</dt>
                <dd>{t.detail}</dd>
              </div>
            ))}
          </dl>
          <p className="human-aside hv">{human.aside}</p>
        </div>

        <div
          className="gallery hv"
          role="region"
          aria-roledescription="carousel"
          aria-label="Photo gallery"
        >
          <ol className="sr-only" aria-label="Photos">
            {galleryPhotos.map((ph, i) => (
              <li key={ph.id} aria-current={i === index ? "true" : undefined}>
                {ph.alt}
              </li>
            ))}
          </ol>
          <div
            className="gallery-stage"
            tabIndex={0}
            aria-describedby="gallery-hint"
            data-cursor="drag"
            onKeyDown={onKey}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            {!webgl && (
              <figure className="gallery-card" data-tone={photo.tone} aria-label={photo.alt}>
                <span className="gallery-card-mark" aria-hidden />
                <figcaption>{photo.title}</figcaption>
              </figure>
            )}
          </div>
          <div className="gallery-bar">
            <button type="button" className="gallery-btn" aria-label="Previous photo" onClick={() => step(-1)}>
              <svg viewBox="0 0 24 24" aria-hidden focusable="false">
                <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="gallery-count" aria-hidden>
              <span>
                <b>{pad(index + 1)}</b> / {pad(galleryPhotos.length)}
              </span>
              {/* Time to the robot's next automatic swipe; written by the 3D frame loop. */}
              <span className="gallery-auto" data-state="waiting" />
            </div>
            <button type="button" className="gallery-btn" aria-label="Next photo" onClick={() => step(1)}>
              <svg viewBox="0 0 24 24" aria-hidden focusable="false">
                <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <p className="gallery-caption" aria-live="polite">
            <span className="sr-only">
              Photo {index + 1} of {galleryPhotos.length}:{" "}
            </span>
            <strong>{photo.title}</strong> <span className="gallery-caption-text">{photo.caption}</span>
          </p>
          <p id="gallery-hint" className="gallery-hint" data-spam={spam || undefined}>
            {spam ? HINT_SPAM : HINT}
          </p>
        </div>
      </div>
    </section>
  );
}
