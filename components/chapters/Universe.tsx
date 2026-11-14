"use client";

import gsap from "gsap";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { playCaseOpen } from "@/components/case/caseNav";
import { projectStories, universe, type ProjectStory } from "@/content/projects";
import { nexus, strands, timeline } from "@/content/timeline";
import { closing, contact } from "@/content/site";
import { openIndex } from "@/components/navigation/indexEvents";
import { setStory, story } from "@/experience/director/store";
import { MovieLine } from "./MovieLine";
import { EvidenceButton } from "@/components/evidence/EvidenceButton";

/** One exhibit: copy beside its artifact, plus the case-study door. */
function Exhibit({ p, index }: { p: ProjectStory; index: number }) {
  const [explained, setExplained] = useState(false);
  const [sent, setSent] = useState<0 | 1 | -1>(0);
  const titleId = `project-${p.id}-title`;
  const router = useRouter();
  // Opening choreography first (artifact anchors, universe recedes), then the
  // intercepted route. Modified clicks keep normal link behaviour.
  const openCase = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    playCaseOpen(p.id, e.currentTarget, () => router.push(`/work/${p.id}`, { scroll: false }));
  };

  const toggleEli5 = () => {
    const next = !explained;
    setExplained(next);
    story.universe.eli5 = next ? 1 : 0;
  };
  // Alternate direction each press: PC → iPhone, then iPhone → PC.
  const send = () => {
    const dir = sent === 1 ? -1 : 1;
    story.universe.bridgeDir = dir;
    story.universe.bridgeCount += 1;
    story.universe.bridgeAt = performance.now();
    setSent(dir);
  };

  return (
    <article
      id={`project-${p.id}`}
      className="chapter-block chapter-block--start exhibit"
      data-featured={p.featured || undefined}
      aria-labelledby={titleId}
      style={{ "--accent": p.accent } as React.CSSProperties}
    >
      <p className="exhibit-meta rv">
        <span>{String(index + 1).padStart(2, "0")}</span> {p.codename}
        {p.featured && <span className="exhibit-flag">Featured</span>}
      </p>
      <h3 id={titleId} className="exhibit-title rv">
        {p.name}
      </h3>
      <p className="exhibit-idea rv" aria-live={p.id === "eli5" ? "polite" : undefined}>
        {p.id === "eli5" && explained ? universe.eli5.simple : p.summary}
      </p>
      <ul className="exhibit-stack rv" aria-label={`${p.name} stack`}>
        {p.stack.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      {p.status && <p className="exhibit-status rv">{p.status}</p>}
      <p className="sr-only">Artifact: {p.artifact}</p>
      <div className="exhibit-actions rv">
        <Link className="action action--primary" href={`/work/${p.id}`} scroll={false} onClick={openCase}>
          View case study
        </Link>
        {p.id === "eli5" && (
          <button type="button" className="action exhibit-try" aria-pressed={explained} onClick={toggleEli5}>
            {explained ? universe.eli5.reset : universe.eli5.button}
          </button>
        )}
        {p.id === "winios" && (
          <button type="button" className="action exhibit-try" onClick={send}>
            {sent === 1 ? universe.bridge.toPc : universe.bridge.toPhone}
          </button>
        )}
      </div>
      {p.id === "winios" && (
        <p className="exhibit-note rv" aria-live="polite">
          {sent === 1 ? universe.bridge.doneToPhone : sent === -1 ? universe.bridge.doneToPc : universe.aside}
        </p>
      )}
    </article>
  );
}

/** Chapter 04: the exhibition. Scrolls past one artifact per project. */
export function ProjectUniverse() {
  return (
    <section id="projects" className="chapter chapter--projects" aria-labelledby="projects-title">
      <div className="chapter-block chapter-block--start">
        <h2 id="projects-title" className="chapter-title rv">
          {universe.title}
        </h2>
        <p className="chapter-meta rv">Chapter 04</p>
        <p className="chapter-lead rv">{universe.lead}</p>
        <p className="chapter-copy rv">{universe.body}</p>
        <nav className="exhibit-jump rv" aria-label="Case studies">
          {projectStories.map((p) => (
            <Link key={p.id} href={`/work/${p.id}`} scroll={false}>
              {p.name}
            </Link>
          ))}
        </nav>
        <p className="universe-cue rv" aria-hidden>
          <span /> Scroll to enter the first world
        </p>
      </div>
      {projectStories.map((p, i) => (
        <Exhibit key={p.id} p={p} index={i} />
      ))}
    </section>
  );
}

/** Chapter 05: the timeline as strands. The list is the accessible source of truth. */
export function TimelineNexus() {
  const listRef = useRef<HTMLOListElement>(null);
  /** Hover/keyboard focus wins over the reading position. */
  const pointer = useRef(-1);

  // Reading position: the milestone nearest the middle of the screen is the one
  // in focus, so scrolling walks the strands forward and back, deterministically.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const list = listRef.current;
      if (!list) return;
      const items = Array.from(list.children) as HTMLElement[];
      const box = list.getBoundingClientRect();
      const mid = window.innerHeight * 0.55;
      let best = -1;
      if (box.top < mid && box.bottom > mid * 0.4) {
        let d = Infinity;
        items.forEach((el, i) => {
          const r = el.getBoundingClientRect();
          const dd = Math.abs(r.top + r.height / 2 - mid);
          if (dd < d) {
            d = dd;
            best = i;
          }
        });
      }
      const active = pointer.current >= 0 ? pointer.current : best;
      if (story.nexusFocus !== active) setStory({ nexusFocus: active });
      items.forEach((el, i) => el.toggleAttribute("data-active", i === active));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const focus = (i: number) => () => {
    pointer.current = i;
    setStory({ nexusFocus: i });
    listRef.current?.querySelectorAll(".timeline-item").forEach((el, k) => el.toggleAttribute("data-active", k === i));
  };
  const blur = () => {
    pointer.current = -1;
    window.dispatchEvent(new Event("scroll"));
  };
  return (
    <section id="timeline" className="chapter chapter--timeline" aria-labelledby="timeline-title">
      <div className="chapter-block chapter-block--start">
        <h2 id="timeline-title" className="chapter-title rv">
          {nexus.title}
        </h2>
        <p className="chapter-meta rv">Chapter 05</p>
        <p className="chapter-lead rv">{nexus.lead}</p>
        <p className="chapter-copy rv">{nexus.body}</p>
        <ul className="strand-key rv" aria-label="Strands">
          {strands.map((s) => (
            <li key={s.id} data-strand={s.id}>
              {s.label}
            </li>
          ))}
        </ul>
      </div>
      <div className="chapter-block chapter-block--start timeline-block">
        <ol ref={listRef} className="timeline-list" aria-label="Timeline, oldest first">
          {timeline.map((e, i) => (
            <li
              key={e.id}
              className="timeline-item rv"
              data-strand={e.strand}
              data-placeholder={e.placeholder || undefined}
              data-major={e.major || undefined}
              tabIndex={0}
              onPointerEnter={focus(i)}
              onPointerLeave={blur}
              onFocus={focus(i)}
              onBlur={blur}
            >
              <time className="timeline-date">{e.date}</time>
              <span className="timeline-title">{e.title}</span>
              <span className="timeline-line">{e.line}</span>
              {e.detail && <span className="timeline-detail">{e.detail}</span>}
              {e.evidence && <EvidenceButton ids={e.evidence.ids} label={e.evidence.label} />}
            </li>
          ))}
        </ol>
        <MovieLine line={nexus.line} className="movie-line--nexus" />
      </div>
    </section>
  );
}

/**
 * Post-credits scene: a deliberate end card. When the visitor continues past
 * the contact (or presses "Stay for the post-credits scene"), the world dims,
 * the threads withdraw, a pause, then the title card and a delayed punchline.
 * Leaving it (scrolling back up) resets it, so it replays on return. All text
 * is real HTML from the start; the choreography is CSS + one GSAP value.
 */
function PostCredits() {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"idle" | "playing">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio >= 0.55) {
          setState("playing");
          gsap.to(story, { finale: 1, duration: story.reducedMotion ? 0.2 : 1.6, ease: "power2.inOut", overwrite: true });
        } else if (e.intersectionRatio < 0.15) {
          setState("idle");
          gsap.to(story, { finale: 0, duration: story.reducedMotion ? 0.2 : 0.9, ease: "power2.out", overwrite: true });
        }
      },
      { threshold: [0, 0.15, 0.55, 0.8] },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      gsap.killTweensOf(story);
      story.finale = 0;
    };
  }, []);

  const replay = () => {
    setState("idle");
    requestAnimationFrame(() => requestAnimationFrame(() => setState("playing")));
  };

  return (
    <section ref={ref} id="post-credits" className="credits" data-state={state} aria-labelledby="credits-title">
      <div className="credits-inner">
        <p className="credits-meta">{closing.postCredits.meta}</p>
        <h2 id="credits-title" className="credits-title" aria-label={closing.postCredits.title}>
          {(() => {
            // Letters gather out of drifting dust, left to right. Each letter
            // gets a fixed pseudo-random drift so the scene replays identically.
            let n = 0;
            return closing.postCredits.title.split(" ").map((w, i, all) => (
              <Fragment key={i}>
                <span className="credits-word" aria-hidden>
                  {[...w].map((ch) => {
                    const k = n++;
                    const h = Math.sin(k * 12.9898 + 4.1) * 43758.5453;
                    const r = h - Math.floor(h);
                    return (
                      <span
                        key={k}
                        className="credits-char"
                        style={{ "--c": k, "--dx": (0.5 + r * 0.7).toFixed(2), "--dy": (r * 2 - 1).toFixed(2), "--rot": `${Math.round(r * 360)}deg` } as React.CSSProperties}
                      >
                        <span className="credits-glyph">{ch}</span>
                      </span>
                    );
                  })}
                </span>
                {i < all.length - 1 && " "}
              </Fragment>
            ));
          })()}
        </h2>
        <p className="credits-line">{closing.postCredits.line}</p>
        <div className="credits-after">
          <button type="button" className="action" onClick={replay}>
            Replay the scene
          </button>
          <a className="action" href="#origin">
            Back to the beginning
          </a>
        </div>
      </div>
    </section>
  );
}

/** Chapter 06: the close. Contact first, then a small post-credits scene. */
export function Closing() {
  return (
    <section id="next" className="closing" aria-labelledby="next-title">
      <div className="closing-card chapter-block">
        <p className="chapter-meta rv">Chapter 06</p>
        <h2 id="next-title" className="closing-title rv">
          {closing.title}
        </h2>
        <p className="closing-lead rv">{closing.lead}</p>
        <p className="closing-copy rv">{closing.copy}</p>
        <div className="closing-actions rv">
          <a className="action action--primary" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
          <button type="button" className="action" onClick={() => openIndex("work")}>
            See the work
          </button>
          <a className="action credits-cue" href="#post-credits">
            Stay for the post-credits scene <span aria-hidden>↓</span>
          </a>
        </div>
        <ul className="closing-links rv" aria-label="Elsewhere">
          <li>
            <a href={contact.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          </li>
          <li>
            <a href={contact.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </li>
          <li>
            <a href={contact.instagram} target="_blank" rel="noreferrer">
              Instagram
            </a>
          </li>
          {closing.cv && (
            <li>
              <a href={closing.cv}>CV</a>
            </li>
          )}
        </ul>
      </div>
      <PostCredits />
    </section>
  );
}
