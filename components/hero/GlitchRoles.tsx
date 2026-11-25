"use client";

import { useEffect, useRef } from "react";
import { roles } from "@/content/site";

// Glyphs of similar width in the display face, so the stack does not jitter.
const GLYPHS = "ABCDEFGHKNOPRSTUXYZ0123456789#/%";
const DECODE_MS = 720;
/** The pointer must rest on the glyphs this long; a pass across them does nothing. */
const DWELL_MS = 140;

const rand = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
const scramble = (n: number) => Array.from({ length: n }, rand).join("");

/**
 * DEVELOPER. ENGINEER. CREATOR. GAMER. — held as corrupted signal until the
 * visitor reaches for it. Only the word's own glyph box is live (not the row),
 * and the pointer has to rest there for a beat. Hover (fine pointers), tap
 * (touch) or the keyboard decodes a word left to right; decoded words stay.
 * Screen readers always get the real words; reduced motion shows them plainly.
 */
export function GlitchRoles() {
  const root = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = [...el.querySelectorAll<HTMLElement>(".hero-role")];
    if (reduced) {
      items.forEach((i) => i.setAttribute("data-state", "clear"));
      return;
    }

    const targets = items.map((i) => i.querySelector<HTMLElement>(".hero-role-inner")!);
    const words = items.map((i) => i.dataset.word ?? "");
    const glitch = items.map((i) => i.querySelector<HTMLElement>(".role-glitch")!);
    const state = items.map(() => "glitch" as "glitch" | "decoding" | "clear");
    items.forEach((i) => i.setAttribute("data-state", "glitch"));
    const raf: number[] = [];

    const paint = (i: number, text: string) => {
      glitch[i].textContent = text;
      glitch[i].dataset.text = text;
    };
    words.forEach((w, i) => paint(i, scramble(w.length)));

    // Idle corruption: a few glyphs re-roll, so the signal looks alive.
    const idle = window.setInterval(() => {
      words.forEach((w, i) => {
        if (state[i] !== "glitch") return;
        const chars = [...(glitch[i].textContent ?? scramble(w.length))];
        for (let k = 0; k < 2; k++) chars[(Math.random() * chars.length) | 0] = rand();
        paint(i, chars.join(""));
      });
    }, 110);

    const decode = (i: number, delay = 0) => {
      if (state[i] !== "glitch") return;
      state[i] = "decoding";
      items[i].setAttribute("data-state", "decoding");
      const w = words[i];
      const start = performance.now() + delay;
      const step = (now: number) => {
        const p = Math.max(0, (now - start) / DECODE_MS);
        const solved = Math.floor(p * (w.length + 1));
        let out = "";
        for (let k = 0; k < w.length; k++) out += k < solved ? w[k] : rand();
        paint(i, out);
        if (p < 1) raf[i] = requestAnimationFrame(step);
        else {
          state[i] = "clear";
          items[i].setAttribute("data-state", "clear");
        }
      };
      raf[i] = requestAnimationFrame(step);
    };
    const decodeAll = () => items.forEach((_, i) => decode(i, i * 140));

    const dwell = items.map(() => 0);
    const onEnter = (e: PointerEvent) => {
      const i = targets.indexOf(e.currentTarget as HTMLElement);
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      window.clearTimeout(dwell[i]);
      dwell[i] = window.setTimeout(() => decode(i), DWELL_MS);
    };
    const onLeave = (e: PointerEvent) => window.clearTimeout(dwell[targets.indexOf(e.currentTarget as HTMLElement)]);
    const onDown = (e: PointerEvent) => decode(targets.indexOf(e.currentTarget as HTMLElement));
    targets.forEach((it) => {
      it.addEventListener("pointerenter", onEnter);
      it.addEventListener("pointerleave", onLeave);
      it.addEventListener("pointerdown", onDown);
    });

    // Keyboard visitors cannot hover: their first Tab decodes the stack.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") decodeAll();
    };
    window.addEventListener("keydown", onKey);

    // Touch screens cannot hover, so there the words decode on their own after
    // a beat. Hover screens never self-decode (2026-11-25): only the visitor's
    // pointer on a word, a tap, or the keyboard reveals it.
    const hoverable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let touchTimer = 0;
    let io: IntersectionObserver | null = null;
    let mo: MutationObserver | null = null;
    if (!hoverable) {
      io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          touchTimer = window.setTimeout(decodeAll, 2600);
          io?.disconnect();
        }
      });
      // Wait until the loader releases the page before starting the clock.
      mo = new MutationObserver(() => {
        if (!document.documentElement.classList.contains("is-locked")) {
          mo?.disconnect();
          io?.observe(el);
        }
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    }

    return () => {
      window.clearInterval(idle);
      window.clearTimeout(touchTimer);
      io?.disconnect();
      mo?.disconnect();
      raf.forEach((id) => cancelAnimationFrame(id));
      dwell.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("keydown", onKey);
      targets.forEach((it) => {
        it.removeEventListener("pointerenter", onEnter);
        it.removeEventListener("pointerleave", onLeave);
        it.removeEventListener("pointerdown", onDown);
      });
    };
  }, []);

  return (
    <p ref={root} className="hero-roles">
      <span className="sr-only">{roles.join(" ")}</span>
      {roles.map((r) => {
        const word = r.slice(0, -1).toUpperCase();
        return (
          <span key={r} className="hero-role" data-word={word} data-state="clear" aria-hidden>
            <span className="hero-role-inner" data-cursor="reveal">
              <span className="role-real">
                {word}
                <span className="hero-role-dot">.</span>
              </span>
              <span className="role-glitch" />
            </span>
          </span>
        );
      })}
    </p>
  );
}
