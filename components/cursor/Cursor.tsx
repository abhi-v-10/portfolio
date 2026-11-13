"use client";

import { useEffect, useRef } from "react";

const TRAIL_MS = 420;
const INTERACTIVE = "a[href], button:not(:disabled), [role='button'], summary, label, [data-cursor]";

type Pt = { x: number; y: number; t: number };

/**
 * Site cursor for fine pointers: a hollow electric-blue ring that follows with
 * a short damped lag, and a hair-thin light trail that tapers and fades like an
 * exhaust line. Touch devices keep their native behaviour; reduced motion keeps
 * the ring but drops the trail and lag. While a modal dialog is open (it renders
 * in the browser's top layer, above any z-index) the native cursor returns.
 */
export function Cursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!fine.matches) return;
    const canvas = canvasRef.current!;
    const ring = ringRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const html = document.documentElement;
    html.classList.add("has-cursor");

    let dpr = 1;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(innerWidth * dpr);
      canvas.height = Math.round(innerHeight * dpr);
    };
    resize();

    const trail: Pt[] = [];
    const target = { x: -100, y: -100 };
    const pos = { x: -100, y: -100 };
    let seen = false;
    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const k = reduced ? 1 : 1 - Math.exp(-dt * 26);
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;
      ring.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;

      while (trail.length && now - trail[0].t > TRAIL_MS) trail.shift();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      if (trail.length > 1) {
        ctx.lineCap = "round";
        // Two passes: a soft blue sheath, then the bright hair-line core.
        for (const pass of [0, 1]) {
          for (let i = 1; i < trail.length; i++) {
            const a = trail[i - 1];
            const b = trail[i];
            const life = 1 - (now - b.t) / TRAIL_MS; // 1 = newest
            const taper = life * life;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            if (pass === 0) {
              ctx.strokeStyle = `rgba(52, 120, 246, ${0.22 * taper})`;
              ctx.lineWidth = 0.6 + 4 * taper;
            } else {
              ctx.strokeStyle = `rgba(191, 243, 255, ${0.85 * taper})`;
              ctx.lineWidth = 0.4 + 1.1 * taper;
            }
            ctx.stroke();
          }
        }
      }

      const settled = Math.abs(target.x - pos.x) < 0.1 && Math.abs(target.y - pos.y) < 0.1;
      raf = trail.length || !settled ? requestAnimationFrame(frame) : 0;
    };
    const wake = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      target.x = e.clientX;
      target.y = e.clientY;
      if (!seen) {
        seen = true;
        pos.x = target.x;
        pos.y = target.y;
        html.classList.add("cursor-visible");
      }
      if (!reduced) trail.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      const over = (e.target as Element | null)?.closest?.(INTERACTIVE);
      ring.toggleAttribute("data-hover", !!over);
      wake();
    };
    const onDown = () => ring.setAttribute("data-press", "");
    const onUp = () => ring.removeAttribute("data-press");
    const onLeave = (e: PointerEvent) => {
      if (!e.relatedTarget) {
        html.classList.remove("cursor-visible");
        seen = false;
        trail.length = 0;
        wake();
      }
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerout", onLeave, { passive: true });
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      html.classList.remove("has-cursor", "cursor-visible");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerout", onLeave);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="cursor-layer" aria-hidden>
      <canvas ref={canvasRef} className="cursor-trail" />
      <div ref={ringRef} className="cursor-ring" />
    </div>
  );
}
