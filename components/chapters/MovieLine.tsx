export type Line = { lead: string; quote: string; by: string; film: string };

/** A rare, attributed MCU line: lead-in in the author's voice, then the quote. */
export function MovieLine({ line, className = "" }: { line: Line; className?: string }) {
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
