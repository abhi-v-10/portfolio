"use client";

import { useEffect, useRef } from "react";
import { roles } from "@/content/site";

// Glyphs of similar width in the display face, so the stack does not jitter.
const GLYPHS = "ABCDEFGHKNOPRSTUXYZ0123456789#/%";
const DECODE_MS = 720;

const rand = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
const scramble = (n: number) => Array.from({ length: n }, rand).join("");

/**
 * DEVELOPER. ENGINEER. CREATOR. GAMER. — held as corrupted signal until the
 * visitor reaches for it. Hover (fine pointers), tap (touch) or the keyboard
 * decodes a word left to right; decoded words stay. Screen readers always get
 * the real words; reduced motion shows them plainly.
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

    const onEnter = (e: PointerEvent) => {
      const i = items.indexOf(e.currentTarget as HTMLElement);
      if (e.pointerType === "mouse" || e.pointerType === "pen") decode(i);
    };
    const onDown = (e: PointerEvent) => decode(items.indexOf(e.currentTarget as HTMLElement));
    items.forEach((it) => {
      it.addEventListener("pointerenter", onEnter);
      it.addEventListener("pointerdown", onDown);
    });

    // Keyboard visitors cannot hover: their first Tab decodes the stack.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") decodeAll();
    };
    window.addEventListener("keydown", onKey);

    // Decode on its own after a beat, everywhere (2026-11-14): a visitor who
    // never hovers still reads the roles. Hover screens get a longer beat so
    // the pointer can find it first.
    const hoverable = window.matchMedia("(hover: hover)").matches;
    let touchTimer = 0;
    let io: IntersectionObserver | null = null;
    let mo: MutationObserver | null = null;
    {
      io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          touchTimer = window.setTimeout(decodeAll, hoverable ? 3600 : 2600);
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
      window.removeEventListener("keydown", onKey);
      items.forEach((it) => {
        it.removeEventListener("pointerenter", onEnter);
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
          <span key={r} className="hero-role" data-word={word} data-state="clear" data-cursor="reveal" aria-hidden>
            <span className="hero-role-inner">
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
