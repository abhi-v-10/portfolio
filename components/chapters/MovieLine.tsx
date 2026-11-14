/** `by` and `film` stay in content for provenance; only screen readers hear them. */
export type Line = { lead: string; quote: string; by: string; film: string };

/** A rare MCU line: the lead-in in the author's voice, then the quote itself. */
export function MovieLine({ line, className = "" }: { line: Line; className?: string }) {
  return (
    <figure className={`movie-line rv ${className}`}>
      <p className="movie-line-lead">{line.lead}</p>
      <blockquote>
        <p>&ldquo;{line.quote}&rdquo;</p>
      </blockquote>
      <figcaption className="sr-only">
        {line.by}, {line.film}
      </figcaption>
    </figure>
  );
}
