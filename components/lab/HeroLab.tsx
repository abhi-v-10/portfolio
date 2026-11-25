"use client";

import { useRef } from "react";
import { Hero } from "@/components/hero/Hero";
import { SculptureLab } from "./SculptureLab";

/**
 * Hero preview bench (2026-11-25): the real hero typography over a sculpture
 * candidate (`?v=fold|joint|iris`). Isolated from the site until approved.
 */
export function HeroLab() {
  const content = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  return (
    <div className="experience" data-stage="entered">
      <SculptureLab layout="hero" />
      <div className="world" aria-hidden style={{ background: "transparent" }}>
        <div className="world-scrim" />
      </div>
      <main className="story">
        <Hero contentRef={content} titleRef={title} />
      </main>
    </div>
  );
}
