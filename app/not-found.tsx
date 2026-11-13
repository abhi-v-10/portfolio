import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="case">
      <div className="case-main">
        <p className="case-meta">404 · Lost in the multiverse</p>
        <h1 className="case-title">This branch does not exist.</h1>
        <p className="case-summary">Not every timeline goes somewhere. This one ended before it started.</p>
        <nav className="case-next" aria-label="Way back">
          <Link href="/">
            <span>Home</span> Back to the main timeline
          </Link>
          <Link href="/#projects">
            <span>Work</span> Project Universe
          </Link>
        </nav>
      </div>
    </main>
  );
}
