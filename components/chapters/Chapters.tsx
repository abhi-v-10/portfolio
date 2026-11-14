import { curiosity, engineering, expression, intelligence, nestafar } from "@/content/site";
import { MovieLine } from "./MovieLine";
import { EvidenceButton } from "@/components/evidence/EvidenceButton";

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
        <div className="proof-cert rv">
          <p>{nestafar.certificate}</p>
          <EvidenceButton ids={[nestafar.evidence]} label="View internship certificate" />
        </div>
        <p className="proof-sub rv">{nestafar.contributionsLead}</p>
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
              <div key={n.term} data-placeholder={n.placeholder || undefined}>
                <dt>{n.term}</dt>
                <dd>
                  {n.detail}
                  {n.evidence && <EvidenceButton ids={[n.evidence]} label="View certificate" small />}
                </dd>
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
        <p className="expression-bridge rv">{expression.bridge}</p>
        <p className="chapter-aside chapter-aside--warm rv">{expression.aside}</p>
      </div>
    </section>
  );
}
