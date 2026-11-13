import type { Ref } from "react";
import { identity } from "@/content/site";
import { GlitchRoles } from "./GlitchRoles";

type Props = { contentRef: Ref<HTMLDivElement>; titleRef: Ref<HTMLHeadingElement> };

/** Real, server-rendered identity copy. The canvas behind it is decoration. */
export function Hero({ contentRef, titleRef }: Props) {
  return (
    <section id="origin" className="origin" aria-labelledby="hero-title">
      <div ref={contentRef} className="origin-content">
        <h1 id="hero-title" ref={titleRef} tabIndex={-1} className="hero-name">
          <span className="hero-line">
            <span className="hero-line-inner">{identity.firstName}</span>
          </span>{" "}
          <span className="hero-line">
            <span className="hero-line-inner">{identity.lastName}</span>
          </span>
        </h1>

        <div className="hero-sub">
          <GlitchRoles />
          <p className="hero-tagline hero-reveal" data-copy-status={identity.taglineStatus}>
            {identity.tagline}
          </p>
        </div>
      </div>

      {/* Wrapper is owned by scroll; the link inside is owned by the entrance. */}
      <div className="scroll-cue-wrap">
        <a href="#human" className="scroll-cue hero-chrome">
          <span>Scroll</span>
          <span className="scroll-cue-line" aria-hidden />
        </a>
      </div>
    </section>
  );
}
