"use client";

import gsap from "gsap";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { story } from "@/experience/director/store";
import { caseNav, playCaseReturn, projectIndex } from "./caseNav";

/**
 * The case study as a layer of the universe (intercepted route). The home
 * experience stays mounted underneath, so closing returns to the exact scroll
 * position, chapter and camera state; the loader never replays. Escape and the
 * close control step back in history, so browser Back behaves the same way.
 */
export function CaseOverlay({ id, children }: { id: string; children: React.ReactNode }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState(false);
  const leavingRef = useRef(false);

  const close = useCallback(() => {
    if (leavingRef.current) return;
    leavingRef.current = true;
    setLeaving(true);
    window.setTimeout(() => router.back(), story.reducedMotion ? 120 : 340);
  }, [router]);

  // Arriving (or switching to another case inside the overlay).
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("has-case");
    html.dataset.case = "open";
    const home = document.querySelector<HTMLElement>(".experience");
    if (home) home.inert = true;
    // Opened from the index rather than an artifact: bring the artifact up here.
    const i = projectIndex(id);
    if (story.universe.caseFocus !== i || story.universe.caseAmt < 1) {
      story.universe.caseFocus = i;
      gsap.killTweensOf(story.universe);
      gsap.to(story.universe, { caseAmt: 1, duration: story.reducedMotion ? 0 : 0.6, ease: "power2.inOut" });
    }
    ref.current?.scrollTo({ top: 0 });
    ref.current?.querySelector<HTMLElement>("#cs-title")?.focus({ preventScroll: true });
  }, [id]);

  // Leaving by any route (close, Escape, browser Back): reverse the transition.
  useEffect(
    () => () => {
      const html = document.documentElement;
      html.classList.remove("has-case");
      const home = document.querySelector<HTMLElement>(".experience");
      if (home) home.inert = false;
      // Switching to the next case remounts the layer: only reverse when none remains.
      requestAnimationFrame(() => {
        if (document.querySelector(".case-layer")) return;
        playCaseReturn();
        const opener = caseNav.opener;
        caseNav.opener = null;
        if (opener?.isConnected) opener.focus({ preventScroll: true });
      });
    },
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector("dialog[open]")) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  return (
    <div
      ref={ref}
      className="case-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cs-title"
      data-leaving={leaving || undefined}
    >
      <div className="case-layer-bar">
        <p className="case-layer-mark">
          AV <span aria-hidden>/</span> Work
        </p>
        <button type="button" className="case-layer-close" onClick={close}>
          <span aria-hidden>←</span> Back to the universe <kbd aria-hidden>Esc</kbd>
        </button>
      </div>
      {children}
    </div>
  );
}
