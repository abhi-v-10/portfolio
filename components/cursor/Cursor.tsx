"use client";

import { useEffect, useRef } from "react";

const INTERACTIVE = "a[href], button:not(:disabled), [role='button'], summary, label";
const REVEAL = "[data-cursor='reveal']";

/**
 * Site cursor for fine pointers: a small bone dot that sits exactly on the
 * hotspot (no lag, no trail). Over links and buttons it opens into a disc that
 * inverts what is beneath it; over the hero's corrupted words it narrows to a
 * vermilion caret, the "read this" tool. Touch devices keep their native
 * behaviour. While a modal dialog is open (top layer) the native cursor returns.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!fine.matches) return;
    const dot = dotRef.current!;
    const html = document.documentElement;
    html.classList.add("has-cursor");

    let x = -100;
    let y = -100;
    let raf = 0;
    let mode = "";
    const paint = () => {
      raf = 0;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      x = e.clientX;
      y = e.clientY;
      html.classList.add("cursor-visible");
      const t = e.target as Element | null;
      const next = t?.closest?.(REVEAL)?.closest(".hero-role:not([data-state='clear'])")
        ? "reveal"
        : t?.closest?.(INTERACTIVE)
          ? "link"
          : "";
      if (next !== mode) {
        mode = next;
        dot.dataset.mode = mode;
      }
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const onDown = () => dot.setAttribute("data-press", "");
    const onUp = () => dot.removeAttribute("data-press");
    const onLeave = (e: PointerEvent) => {
      if (!e.relatedTarget) html.classList.remove("cursor-visible");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerout", onLeave, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      html.classList.remove("has-cursor", "cursor-visible");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerout", onLeave);
    };
  }, []);

  return (
    <div className="cursor-layer" aria-hidden>
      <div ref={dotRef} className="cursor-dot" />
    </div>
  );
}
