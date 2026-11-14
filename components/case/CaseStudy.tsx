import type { ProjectStory } from "@/content/projects";
import { contact } from "@/content/site";

/**
 * Case study body, shared by the standalone page (/work/[slug], server
 * rendered, no WebGL) and the in-universe overlay (intercepted route). In the
 * overlay the hero leaves a window open onto the live artifact behind it; on
 * the standalone page an original orbit plate stands in for it.
 * Nothing here is invented: unverified material renders as visible placeholders.
 */
export function CaseStudy({
  p,
  index,
  overlay,
  next,
}: {
  p: ProjectStory;
  index: number;
  overlay?: boolean;
  next: React.ReactNode;
}) {
  const nn = String(index + 1).padStart(2, "0");
  const pending = p.placeholders.filter((x) => x !== "[ROLE]");
  let n = 0;
  const num = () => String(++n).padStart(2, "0");

  return (
    <article className="cs" data-overlay={overlay || undefined} style={{ "--accent": p.accent } as React.CSSProperties} aria-labelledby="cs-title">
      <header className="cs-hero">
        <div className="cs-hero-copy">
          <p className="cs-meta cs-in" style={{ "--i": 0 } as React.CSSProperties}>
            <span>{nn}</span> {p.codename}
            {p.featured && <span className="cs-flag">Featured</span>}
          </p>
          <h1 id="cs-title" tabIndex={-1} className="cs-title cs-in" style={{ "--i": 1 } as React.CSSProperties}>
            {p.name}
          </h1>
          <p className="cs-idea cs-in" style={{ "--i": 2 } as React.CSSProperties}>
            {p.idea}
          </p>
          <dl className="cs-facts cs-in" style={{ "--i": 3 } as React.CSSProperties}>
            <div>
              <dt>Year</dt>
              <dd>{p.year}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{p.status ?? "Built"}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd className="placeholder-inline">[ROLE] to be confirmed</dd>
            </div>
          </dl>
          <ul className="cs-stack cs-in" style={{ "--i": 4 } as React.CSSProperties} aria-label="Stack">
            {p.stack.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        {overlay ? (
          <div className="cs-window" aria-hidden />
        ) : (
          <figure className="cs-plate cs-in" style={{ "--i": 2 } as React.CSSProperties} aria-hidden>
            <svg viewBox="0 0 400 400">
              <defs>
                <radialGradient id="cs-core">
                  <stop offset="0" stopColor="var(--accent)" stopOpacity="0.9" />
                  <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="200" cy="200" r="150" fill="url(#cs-core)" opacity="0.35" />
              {[70, 110, 150, 188].map((r, i) => (
                <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="var(--accent)" strokeOpacity={0.5 - i * 0.1} strokeDasharray={i % 2 ? "2 7" : undefined} />
              ))}
              {p.flow.map((_, i) => {
                const a = (i / p.flow.length) * Math.PI * 2 - Math.PI / 2;
                return <circle key={i} cx={200 + Math.cos(a) * 150} cy={200 + Math.sin(a) * 150} r="6" fill="var(--accent)" />;
              })}
              <circle cx="200" cy="200" r="12" fill="#fff" />
            </svg>
            <figcaption>{p.codename}</figcaption>
          </figure>
        )}
      </header>

      <div className="cs-body">
        <section className="cs-block">
          <h2>
            <span>{num()}</span> The idea
          </h2>
          <div className="cs-text">
            <p className="cs-lead">{p.summary}</p>
          </div>
        </section>

        {p.sections.map((s) => (
          <section key={s.heading} className="cs-block">
            <h2>
              <span>{num()}</span> {s.heading}
            </h2>
            <div className="cs-text">
              {s.body && <p>{s.body}</p>}
              {s.points && (
                <ul>
                  {s.points.map((pt) => (
                    <li key={pt}>{pt}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))}

        <section className="cs-block cs-arch">
          <h2>
            <span>{num()}</span> Architecture
          </h2>
          <ol className="cs-flow">
            {p.flow.map((f) => (
              <li key={f.step}>
                <strong>{f.step}</strong>
                <span>{f.detail}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="cs-block">
          <h2>
            <span>{num()}</span> My role, decisions and lessons
          </h2>
          <div className="cs-text">
            <p className="placeholder-note">
              [ROLE, KEY DECISIONS, CHALLENGES AND LESSONS] Abhishyanth&rsquo;s own account of this build, to be supplied. Nothing here is
              assumed.
            </p>
          </div>
        </section>

        <section className="cs-block">
          <h2>
            <span>{num()}</span> In use
          </h2>
          <div className="cs-media">
            <figure className="cs-shot">
              <span className="placeholder-inline">[SCREENSHOT 01]</span>
              <figcaption>Main screen, to be supplied</figcaption>
            </figure>
            <figure className="cs-shot">
              <span className="placeholder-inline">[DEMO RECORDING]</span>
              <figcaption>Short walkthrough, to be supplied</figcaption>
            </figure>
          </div>
        </section>

        <section className="cs-block">
          <h2>
            <span>{num()}</span> Links
          </h2>
          <ul className="cs-links">
            <li>{p.links.repo ? <a href={p.links.repo}>Repository</a> : <span className="placeholder-inline">[REPOSITORY LINK]</span>}</li>
            <li>{p.links.live ? <a href={p.links.live}>Live</a> : <span className="placeholder-inline">[LIVE LINK]</span>}</li>
          </ul>
          {pending.length > 0 && (
            <p className="cs-pending">
              Still to come: <span className="placeholder-inline">{pending.join(" · ")}</span>
            </p>
          )}
        </section>

        <nav className="cs-next" aria-label="More">
          {next}
          <a href={`mailto:${contact.email}`}>Talk about this project</a>
        </nav>
      </div>
    </article>
  );
}
