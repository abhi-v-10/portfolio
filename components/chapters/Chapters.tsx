import type { Ref } from "react";
import { contact, curiosity, engineering, expression, intelligence, nestafar, outro } from "@/content/site";
import { openIndex } from "@/components/navigation/indexEvents";

type Line = { lead: string; quote: string; by: string; film: string };

/** A rare, attributed MCU line: lead-in in the author's voice, then the quote. */
function MovieLine({ line, className = "" }: { line: Line; className?: string }) {
  return (
    <figure className={`movie-line rv ${className}`}>
      <p className="movie-line-lead">{line.lead}</p>
      <blockquote>
        <p>&ldquo;{line.quote}&rdquo;</p>
      </blockquote>
      <figcaption>
        {line.by} <span aria-hidden>·</span> <cite>{line.film}</cite>
      </figcaption>
    </figure>
  );
}

/**
 * Milestone 003 story layer: real HTML for Curiosity and Engineering over the
 * persistent world. Spacing between blocks is the camera's travel distance;
 * `.chapter-block` elements are each owned by exactly one scrubbed timeline.
 */
export function Curiosity() {
  return (
    <section id="curiosity" className="chapter chapter--curiosity" aria-labelledby="curiosity-title">
      {/* First viewport: title, lead and the opening line beside the world. */}
      <div className="chapter-block chapter-block--start chapter-intro">
        <h2 id="curiosity-title" className="chapter-title rv">
          Curiosity
        </h2>
        <p className="chapter-meta rv">Chapter 01</p>
        <p className="chapter-lead rv">{curiosity.lead}</p>
        <p className="chapter-copy rv">{curiosity.body[0]}</p>
      </div>
      {/* Deeper: unfolds as the branches find their discoveries. */}
      <div className="chapter-block chapter-block--start chapter-deeper">
        <p className="chapter-copy rv">{curiosity.body[1]}</p>
        <ul className="probe-list rv" aria-label="Questions that start it">
          {curiosity.questions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
        <p className="chapter-aside rv">{curiosity.aside}</p>
        <p className="placeholder-note rv">{curiosity.anecdotePlaceholder}</p>
      </div>
    </section>
  );
}

export function Engineering() {
  return (
    <section id="engineering" className="chapter chapter--engineering" aria-labelledby="engineering-title">
      <div className="chapter-block chapter-block--end">
        <h2 id="engineering-title" className="chapter-title rv">
          Engineering
        </h2>
        <p className="chapter-meta rv">Chapter 02</p>
        <p className="chapter-lead rv">{engineering.lead}</p>
        <p className="chapter-copy rv">{engineering.body}</p>
        <dl className="spec-list rv">
          {engineering.identity.map((i) => (
            <div key={i.term} className="spec-row">
              <dt>{i.term}</dt>
              <dd>{i.detail}</dd>
            </div>
          ))}
        </dl>
        <MovieLine line={engineering.line} />
      </div>

      <article className="chapter-block chapter-block--end proof" aria-labelledby="nestafar-title">
        <h3 id="nestafar-title" className="proof-org rv">
          {nestafar.org}
        </h3>
        <p className="chapter-meta rv">Professional proof</p>
        <p className="proof-role rv">
          {nestafar.role} <span aria-hidden>·</span> <time>{nestafar.period}</time>
        </p>
        <ol className="flow rv" aria-label="Agent architecture">
          {nestafar.flow.map((step) => (
            <li key={step} className="flow-step">
              {step}
            </li>
          ))}
        </ol>
        <ul className="proof-points rv">
          {nestafar.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p className="proof-credential rv">{nestafar.credential}</p>
      </article>
    </section>
  );
}

/** Chapter 03: the Engineering structure has become a living agent network. */
export function Intelligence() {
  return (
    <section id="intelligence" className="chapter chapter--intelligence" aria-labelledby="intelligence-title">
      <div className="chapter-block chapter-block--start">
        <h2 id="intelligence-title" className="chapter-title rv">
          Intelligence
        </h2>
        <p className="chapter-meta rv">Chapter 03</p>
        <p className="chapter-lead rv">{intelligence.lead}</p>
        <p className="chapter-copy rv">{intelligence.body}</p>
        <h3 className="flow-title rv">{intelligence.flowTitle}</h3>
        <ol className="request-flow rv">
          {intelligence.flow.map((f) => (
            <li key={f.step}>
              <span className="request-step">{f.step}</span>
              <span className="request-detail">{f.detail}</span>
            </li>
          ))}
        </ol>
        <MovieLine line={intelligence.line} className="movie-line--intel" />
        <p className="chapter-note rv">{intelligence.exploring}</p>
      </div>
    </section>
  );
}

/** Chapter 04: the same network loosens into colour and flowing form. */
export function Expression() {
  const ph = expression.photo;
  return (
    <section id="expression" className="chapter chapter--expression" aria-labelledby="expression-title">
      <div className="chapter-block chapter-block--end">
        <h2 id="expression-title" className="chapter-title rv">
          Expression
        </h2>
        <p className="chapter-meta rv">Chapter 04</p>
        <p className="chapter-lead rv">{expression.lead}</p>
        <p className="chapter-copy rv">{expression.body}</p>
        <div className="expression-grid rv">
          <dl className="expression-notes">
            {expression.notes.map((n) => (
              <div key={n.term}>
                <dt>{n.term}</dt>
                <dd>{n.detail}</dd>
              </div>
            ))}
          </dl>
          <figure className="expression-photo" aria-label={ph.alt}>
            {ph.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ph.src} alt={ph.alt} />
            ) : (
              <span className="expression-photo-mark" aria-hidden />
            )}
            <figcaption>
              {ph.label}
              {!ph.src && <span>{ph.note}</span>}
            </figcaption>
          </figure>
        </div>
        <p className="chapter-aside chapter-aside--warm rv">{expression.aside}</p>
      </div>
    </section>
  );
}

/** Temporary close of the built story: points at the next world (Milestone 005). */
export function Outro({ cardRef }: { cardRef?: Ref<HTMLDivElement> }) {
  return (
    <section id="next" className="threshold" aria-labelledby="next-title">
      <div ref={cardRef} className="threshold-card chapter-block">
        <h2 id="next-title" className="threshold-title rv">
          {outro.title}
        </h2>
        <p className="chapter-meta rv">Chapter 05, in production</p>
        <p className="threshold-copy rv">{outro.copy}</p>
        <div className="threshold-actions rv">
          <button type="button" className="action action--primary" onClick={() => openIndex("work")}>
            See the work
          </button>
          <a className="action" href={`mailto:${contact.email}`}>
            Say hello
          </a>
        </div>
      </div>
    </section>
  );
}
