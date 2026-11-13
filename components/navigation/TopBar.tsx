"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { chapters, contact, experience, projects } from "@/content/site";
import { onIndexOpen, openIndex, type IndexSection } from "./indexEvents";

export function TopBar({ inert }: { inert?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(
    () =>
      onIndexOpen((section) => {
        const d = dialog.current;
        if (!d) return;
        if (!d.open) d.showModal();
        const heading = d.querySelector<HTMLElement>(`#index-${section}`);
        heading?.scrollIntoView({ block: "start" });
        heading?.focus({ preventScroll: true });
      }),
    [],
  );

  const close = () => dialog.current?.close();
  const open = (s: IndexSection) => () => openIndex(s);
  const live = chapters.filter((c) => c.status === "live");
  const upcoming = chapters.filter((c) => c.status !== "live");

  return (
    <header className="topbar hero-chrome" inert={inert}>
      <a href="#origin" className="topbar-mark" aria-label="Abhishyanth Vemula, back to top">
        <span>AV</span>
        <span className="topbar-mark-sep" aria-hidden>/</span>
        <span className="topbar-mark-sub">Personal system</span>
      </a>

      <nav className="topbar-nav" aria-label="Quick access">
        <button type="button" className="topbar-link" aria-haspopup="dialog" onClick={open("work")}>
          Work
        </button>
        <button type="button" className="topbar-link" aria-haspopup="dialog" onClick={open("contact")}>
          Contact
        </button>
        <button type="button" className="topbar-index" aria-haspopup="dialog" aria-label="Index" onClick={open("story")}>
          <span className="topbar-index-label">Index</span>
          <svg viewBox="0 0 24 24" aria-hidden focusable="false">
            <path d="M4 8h16M4 16h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </nav>

      <dialog
        ref={dialog}
        className="index-panel"
        aria-label="Index"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="index-inner">
          <div className="index-head">
            <p className="index-mark">AV / Index</p>
            <button type="button" className="index-close" onClick={close}>
              Close
            </button>
          </div>

          <section aria-labelledby="index-work" className="index-section">
            <h2 id="index-work" className="index-title" tabIndex={-1}>
              Work
            </h2>
            <ul className="work-list">
              {projects.map((p) => (
                <li key={p.id} className="work-item" data-featured={p.featured || undefined}>
                  <div className="work-row">
                    <h3 className="work-name">
                      <Link href={`/work/${p.id}`}>{p.name}</Link>
                    </h3>
                    <span className="work-meta">{p.featured ? "Featured" : p.year}</span>
                  </div>
                  <p className="work-line">{p.line}</p>
                  <p className="work-stack">{p.stack.join(" · ")}</p>
                </li>
              ))}
            </ul>
            <div className="work-exp">
              <div className="work-row">
                <h3 className="work-name">{experience.org}</h3>
                <span className="work-meta">{experience.period}</span>
              </div>
              <p className="work-line">
                {experience.role}. {experience.line}
              </p>
              <p className="work-stack">{experience.stack.join(" · ")}</p>
            </div>
            <p className="index-note">Case studies arrive with the Project Universe chapter.</p>
          </section>

          <section aria-labelledby="index-contact" className="index-section">
            <h2 id="index-contact" className="index-title" tabIndex={-1}>
              Contact
            </h2>
            <ul className="index-contact">
              <li>
                <a href={`mailto:${contact.email}`} className="contact-primary">
                  {contact.email}
                </a>
              </li>
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
            </ul>
          </section>

          <section aria-labelledby="index-story" className="index-section">
            <h2 id="index-story" className="index-title" tabIndex={-1}>
              Story
            </h2>
            <ol className="index-list">
              {live.map((c) => (
                <li key={c.id} className="index-item">
                  <a href={`#${c.id}`} onClick={close}>
                    <span className="index-num">{c.index}</span>
                    <span className="index-name">{c.title}</span>
                  </a>
                </li>
              ))}
            </ol>
            {upcoming.length > 0 && (
              <p className="index-upcoming">Next: {upcoming.map((c) => c.title).join(", ")}.</p>
            )}
          </section>
        </div>
      </dialog>
    </header>
  );
}
