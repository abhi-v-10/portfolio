"use client";

import Link from "next/link";
import { useState } from "react";
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
        <Link className="action action--primary" href={`/work/${p.id}`}>
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

/** Chapter 05: the exhibition. Scrolls past one artifact per project. */
export function ProjectUniverse() {
  return (
    <section id="projects" className="chapter chapter--projects" aria-labelledby="projects-title">
      <div className="chapter-block chapter-block--start">
        <h2 id="projects-title" className="chapter-title rv">
          {universe.title}
        </h2>
        <p className="chapter-meta rv">Chapter 05</p>
        <p className="chapter-lead rv">{universe.lead}</p>
        <p className="chapter-copy rv">{universe.body}</p>
        <nav className="exhibit-jump rv" aria-label="Case studies">
          {projectStories.map((p) => (
            <Link key={p.id} href={`/work/${p.id}`}>
              {p.name}
            </Link>
          ))}
        </nav>
      </div>
      {projectStories.map((p, i) => (
        <Exhibit key={p.id} p={p} index={i} />
      ))}
    </section>
  );
}

/** Chapter 06: the timeline as strands. The list is the accessible source of truth. */
export function TimelineNexus() {
  const focus = (i: number) => () => setStory({ nexusFocus: i });
  const blur = () => setStory({ nexusFocus: -1 });
  return (
    <section id="timeline" className="chapter chapter--timeline" aria-labelledby="timeline-title">
      <div className="chapter-block chapter-block--start">
        <h2 id="timeline-title" className="chapter-title rv">
          {nexus.title}
        </h2>
        <p className="chapter-meta rv">Chapter 06</p>
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
        <ol className="timeline-list" aria-label="Timeline, oldest first">
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

/** Chapter 07: the close. Contact first, then a small post-credits scene. */
export function Closing() {
  return (
    <section id="next" className="closing" aria-labelledby="next-title">
      <div className="closing-card chapter-block">
        <p className="chapter-meta rv">Chapter 07</p>
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
          <li>{closing.cv ? <a href={closing.cv}>CV</a> : <span className="placeholder-inline">{closing.cvPlaceholder}</span>}</li>
        </ul>
      </div>
      <aside className="post-credits" aria-label="Post-credits scene">
        <p className="post-credits-meta">{closing.postCredits.meta}</p>
        <p className="post-credits-title">{closing.postCredits.title}</p>
        <p className="post-credits-line">{closing.postCredits.line}</p>
      </aside>
    </section>
  );
}
