import Link from "next/link";

export default function NotFound() {
  return (
    <div className="case-page">
      <main id="main" className="cs">
        <header className="cs-hero cs-hero--solo">
          <div className="cs-hero-copy">
            <p className="cs-meta cs-in" style={{ "--i": 0 } as React.CSSProperties}>
              <span>404</span> Lost in the multiverse
            </p>
            <h1 className="cs-title cs-in" style={{ "--i": 1 } as React.CSSProperties}>
              This branch does not exist.
            </h1>
            <p className="cs-idea cs-in" style={{ "--i": 2 } as React.CSSProperties}>
              Not every timeline goes somewhere. This one ended before it started.
            </p>
            <nav className="cs-next cs-in" style={{ "--i": 3 } as React.CSSProperties} aria-label="Way back">
              <Link href="/">
                <span>Home</span> Back to the main timeline
              </Link>
              <Link href="/#projects">Project Universe</Link>
            </nav>
          </div>
        </header>
      </main>
    </div>
  );
}
