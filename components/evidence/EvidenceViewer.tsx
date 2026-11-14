"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { evidence, type EvidenceItem } from "@/content/evidence";
import { onEvidenceOpen } from "./evidenceEvents";

const CLOSE_MS = 280;

/**
 * Shared document / photo viewer (certificates, award photographs).
 * A native modal <dialog>: focus is contained, Escape closes, the page behind
 * is inert and its scroll position is never touched. On close, focus returns
 * to the control that opened it. No route change, so no loader.
 */
export function EvidenceViewer() {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);

  const close = useCallback(() => {
    const d = ref.current;
    if (!d?.open) return;
    setShown(false);
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      d.close();
    }, CLOSE_MS);
  }, []);

  useEffect(
    () =>
      onEvidenceOpen(({ ids, index: i = 0 }) => {
        const list = ids.map((id) => evidence[id]).filter(Boolean);
        const d = ref.current;
        if (!list.length || !d) return;
        window.clearTimeout(closeTimer.current);
        opener.current = document.activeElement as HTMLElement | null;
        setItems(list);
        setIndex(Math.min(i, list.length - 1));
        if (!d.open) d.showModal();
        document.documentElement.classList.add("has-viewer");
        requestAnimationFrame(() => {
          setShown(true);
          d.querySelector<HTMLElement>(".viewer-close")?.focus({ preventScroll: true });
        });
      }),
    [],
  );

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const onClosed = () => {
    setShown(false);
    document.documentElement.classList.remove("has-viewer");
    opener.current?.focus({ preventScroll: true });
  };

  const item = items[index];
  const many = items.length > 1;
  const step = (dir: number) => setIndex((i) => (i + dir + items.length) % items.length);

  return (
    <dialog
      ref={ref}
      className="viewer"
      data-shown={shown || undefined}
      aria-labelledby="viewer-title"
      aria-describedby="viewer-caption"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClose={onClosed}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      onKeyDown={(e) => {
        if (!many) return;
        if (e.key === "ArrowRight") step(1);
        if (e.key === "ArrowLeft") step(-1);
      }}
    >
      {item && (
        <div className="viewer-frame" data-kind={item.kind}>
          <div className="viewer-head">
            <p className="viewer-kind">
              {item.kind === "certificate" ? "Document" : item.kind === "screenshot" ? "Screenshot" : "Photograph"}
              {many && (
                <span>
                  {" "}
                  · {index + 1} / {items.length}
                </span>
              )}
            </p>
            <button type="button" className="viewer-close" onClick={close}>
              Close <span aria-hidden>Esc</span>
            </button>
          </div>
          <div className="viewer-stage">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={item.id}
              src={item.src}
              alt={item.alt}
              width={item.width}
              height={item.height}
              className="viewer-media"
              decoding="async"
            />
          </div>
          <div className="viewer-foot">
            <div className="viewer-text">
              <h2 id="viewer-title" className="viewer-title">
                {item.title}
              </h2>
              <p id="viewer-caption" className="viewer-caption">
                {item.caption}
              </p>
            </div>
            <div className="viewer-actions">
              {many && (
                <div className="viewer-step" role="group" aria-label="Browse">
                  <button type="button" onClick={() => step(-1)} aria-label="Previous">
                    ←
                  </button>
                  <button type="button" onClick={() => step(1)} aria-label="Next">
                    →
                  </button>
                </div>
              )}
              <a className="viewer-link" href={item.original?.href ?? item.src} target="_blank" rel="noreferrer">
                Open {item.original ? item.original.label : "full size"}
              </a>
              {item.original && (
                <a className="viewer-link" href={item.original.href} download={item.original.download}>
                  Download
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
