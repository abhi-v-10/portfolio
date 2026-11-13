import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projectById, projectStories } from "@/content/projects";
import { contact, site } from "@/content/site";

export function generateStaticParams() {
  return projectStories.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = projectById(slug);
  if (!p) return {};
  const title = `${p.name}, ${p.codename} — Abhishyanth Vemula`;
  return {
    title,
    description: p.idea,
    alternates: { canonical: `/work/${p.id}` },
    openGraph: { title, description: p.idea, type: "article" },
  };
}

/**
 * Case study: plain, fast, linkable HTML. Works without WebGL or the loader,
 * so recruiters can land here directly. Placeholders stay visible until the
 * real material is supplied in content/projects.ts.
 */
export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = projectById(slug);
  if (!p) notFound();
  const i = projectStories.indexOf(p);
  const next = projectStories[(i + 1) % projectStories.length];

  return (
    <div className="case" style={{ "--accent": p.accent } as React.CSSProperties}>
      <header className="case-top">
        <Link href="/" className="case-mark" aria-label={`${site.title.split(" —")[0]}, home`}>
          AV <span aria-hidden>/</span> Work
        </Link>
        <Link href="/#projects" className="case-back">
          Back to the universe
        </Link>
      </header>
      <main id="main" className="case-main">
        <p className="case-meta">
          {String(i + 1).padStart(2, "0")} · {p.codename} · {p.year}
          {p.status ? ` · ${p.status}` : ""}
        </p>
        <h1 className="case-title">{p.name}</h1>
        <p className="case-idea">{p.idea}</p>
        <ul className="case-stack" aria-label="Stack">
          {p.stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="case-summary">{p.summary}</p>

        {p.sections.map((s) => (
          <section key={s.heading} className="case-section">
            <h2>{s.heading}</h2>
            {s.body && <p>{s.body}</p>}
            {s.points && (
              <ul>
                {s.points.map((pt) => (
                  <li key={pt}>{pt}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section className="case-section">
          <h2>Links</h2>
          <ul className="case-links">
            <li>{p.links.repo ? <a href={p.links.repo}>Repository</a> : <span className="placeholder-inline">[REPOSITORY LINK]</span>}</li>
            <li>{p.links.live ? <a href={p.links.live}>Live</a> : <span className="placeholder-inline">[LIVE LINK]</span>}</li>
          </ul>
        </section>

        <section className="case-section case-pending" aria-label="Material still to be supplied">
          <h2>Still to come</h2>
          <ul>
            {p.placeholders.map((x) => (
              <li key={x} className="placeholder-inline">
                {x}
              </li>
            ))}
          </ul>
        </section>

        <nav className="case-next" aria-label="Next case study">
          <Link href={`/work/${next.id}`}>
            <span>Next</span> {next.name}, {next.codename}
          </Link>
          <a href={`mailto:${contact.email}`}>Talk about this project</a>
        </nav>
      </main>
    </div>
  );
}
