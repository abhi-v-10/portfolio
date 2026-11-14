/**
 * Project Universe and case-study content (Milestone 005).
 *
 * Sources: docs/abhishyanth-vemula-profile.md (the five documented projects)
 * and docs/WiniOS_README.md (WiniOS). No roles, team sizes, metrics, users or
 * links are asserted: the master plan reserves those as visible placeholders
 * until Abhishyanth confirms them. Edit the `links` and `placeholders` fields
 * when real material is supplied.
 */

export type ProjectId = "winios" | "jobseek" | "iris" | "eli5" | "qp-gen" | "scholaroid";

export type CaseSection = { heading: string; body?: string; points?: string[] };

export type ProjectStory = {
  id: ProjectId;
  name: string;
  /** Exhibition codename (master plan §4). */
  codename: string;
  year: string;
  /** One-line idea, used in the universe and the index. */
  idea: string;
  stack: string[];
  /** Short exhibition copy beside the artifact. */
  summary: string;
  /** What the 3D artifact shows, for screen readers and the no-WebGL path. */
  artifact: string;
  /** Accent for the artifact and the case-study page (display sRGB). */
  accent: string;
  featured?: boolean;
  status?: string;
  sections: CaseSection[];
  /** EDIT: add real URLs when supplied (null renders a placeholder). */
  links: { repo: string | null; live: string | null };
  /** Visible placeholders for material that has not been supplied. */
  placeholders: string[];
};

export const projectStories: ProjectStory[] = [
  {
    id: "winios",
    name: "WiniOS",
    codename: "The Bridge",
    year: "2026",
    idea: "A private bridge between a Windows PC and an iPhone: text and image clipboard over authenticated HTTPS.",
    stack: ["Rust", "Win32", "Axum", "Rustls", "iOS Shortcuts", "Inno Setup"],
    summary:
      "Copy on the PC, paste on the phone, and the other way round, without a cloud relay. A native Rust agent watches the Windows clipboard, serves it over HTTPS on the private network only, and iPhone Shortcuts send and receive through it.",
    artifact:
      "Two device-worlds, a wide desktop slab and a tall phone slab, joined by an arched current. Packets cross in both directions through a ring that stands for the TLS boundary.",
    accent: "#73dfff",
    featured: true,
    status: "Private beta (0.1.x)",
    sections: [
      {
        heading: "The problem",
        body: "Moving a snippet of text or a screenshot between a Windows PC and an iPhone usually means a chat app, an email to yourself or a cloud clipboard. WiniOS keeps that hop on the local network and under the owner's control.",
      },
      {
        heading: "How it works",
        points: [
          "A single Win32 thread owns the clipboard: a message-only window registers AddClipboardFormatListener and reacts to WM_CLIPBOARDUPDATE. There is no polling.",
          "Failed clipboard access retries on one-shot timers (20 to 640 ms) without blocking the message loop; a newer copy cancels an older retry.",
          "An Axum API on Tokio serves authenticated GET and POST endpoints for text and, when enabled, PNG images.",
          "iPhone Shortcuts call those endpoints to send and receive. A type endpoint returns only the kind and an opaque version, so a single Receive Shortcut can branch safely.",
        ],
      },
      {
        heading: "Security decisions",
        points: [
          "HTTPS by default through Rustls (TLS 1.2 and 1.3), including on loopback. No HTTP fallback on the port.",
          "Bearer authentication on every clipboard endpoint.",
          "Binds only to loopback or a specific private (RFC 1918) IPv4 address; wildcard, public and IPv6 binds are rejected, and only private or loopback peers reach the API.",
          "Missing or mismatched certificates fail startup before binding. Changed clipboard observations fail closed instead of returning the wrong data.",
          "No clipboard contents are written to disk. Images are off by default and capped at 2, 4 or 8 MiB.",
        ],
      },
      {
        heading: "The Windows companion",
        body: "A tray app with a native popup and a Settings window (General, Connection, Clipboard, Images, Privacy, About), a per-user installer built with Inno Setup that needs no admin rights, and optional update checks that never download or install anything on their own.",
      },
      {
        heading: "Status",
        body: "Private beta. The Windows clipboard core and HTTPS layer are covered by the project's own tests; verified real-device iPhone performance is not claimed here.",
      },
    ],
    links: { repo: null, live: null },
    placeholders: ["[SCREENSHOTS / RECORDING]", "[ROLE]", "[REPOSITORY OR DOWNLOAD LINK]"],
  },
  {
    id: "jobseek",
    name: "JobSeek",
    codename: "The Navigator",
    year: "2026",
    idea: "Full-stack job portal with SeekBot AI for résumé review, job matching and skill-gap checks.",
    stack: ["React", "TypeScript", "Django REST Framework", "FastAPI"],
    summary:
      "Discover openings, manage applications and message recruiters in one place, with SeekBot giving career guidance: résumé review, job matching and skill-gap checks.",
    artifact: "A graph of opportunity routes. One route lights up node by node until it reaches a match.",
    accent: "#ffc861",
    sections: [
      {
        heading: "What it does",
        points: [
          "Job discovery and application management.",
          "Messaging between candidates and recruiters.",
          "SeekBot AI: résumé review, job matching and skill-gap checks.",
        ],
      },
      {
        heading: "Stack",
        body: "A React and TypeScript front end over a Django REST Framework API, with FastAPI alongside it.",
      },
    ],
    links: { repo: null, live: null },
    placeholders: ["[PROJECT SCREENSHOTS]", "[ROLE]", "[LINKS]", "[MEASURED RESULTS]"],
  },
  {
    id: "iris",
    name: "IRIS",
    codename: "The Vision",
    year: "2026",
    idea: "OCR for invoices and receipts: extracts vendor, date, items, tax and total, then checks the arithmetic.",
    stack: ["Python", "Flask", "Tesseract OCR", "OpenCV"],
    summary:
      "Photos, scans and PDFs of invoices and receipts go in; vendor, date, line items, tax and total come out, the arithmetic is checked, and spending shows up in a dashboard.",
    artifact: "A floating receipt with a scan line passing over it. As the line passes, fields lift off the page as structured blocks.",
    accent: "#8ff0d0",
    sections: [
      {
        heading: "What it does",
        points: [
          "Reads photos, scans and PDFs with OCR.",
          "Extracts vendor, date, line items, tax and total.",
          "Checks the arithmetic of the extracted values.",
          "Shows spending in a dashboard.",
        ],
      },
      { heading: "Stack", body: "Python and Flask, with Tesseract OCR for recognition and OpenCV for image work." },
    ],
    links: { repo: null, live: null },
    placeholders: ["[SCREENSHOTS]", "[ROLE]", "[LINKS]"],
  },
  {
    id: "eli5",
    name: "ELI5",
    codename: "The Translator",
    year: "2026",
    idea: "Chrome extension that turns selected text or a screen snip into a plain explanation.",
    stack: ["JavaScript", "Chrome Extension", "OpenAI", "FastAPI"],
    summary:
      "Select confusing text or snip part of the screen, pick a persona and a format, and get it explained simply.",
    artifact: "A tangled knot of light. Explain it, and the knot relaxes into one clean loop.",
    accent: "#f17e98",
    sections: [
      {
        heading: "What it does",
        points: [
          "Works from selected text or a screen snip.",
          "Returns an explanation in a chosen persona and format.",
        ],
      },
      { heading: "Stack", body: "A JavaScript Chrome extension talking to a FastAPI service that calls OpenAI." },
    ],
    links: { repo: null, live: null },
    placeholders: ["[SCREENSHOTS]", "[ROLE]", "[LINKS]"],
  },
  {
    id: "qp-gen",
    name: "QP-Gen",
    codename: "The Architect",
    year: "2026",
    idea: "AI-native, CBSE-compliant question papers from a textbook chapter, streamed into an editor.",
    stack: ["Django", "Next.js", "PostgreSQL + pgvector", "OpenAI"],
    summary:
      "A teacher picks a textbook chapter, the marks, sections and question mix; a CBSE-compliant paper streams into an editor to finalise and export.",
    artifact: "Layered chapter pages lift and reassemble into the sections of a paper.",
    accent: "#9db8ff",
    sections: [
      {
        heading: "What it does",
        points: [
          "Turns a textbook chapter into a question paper.",
          "The teacher chooses marks, sections and question mix.",
          "The paper streams into an editor to finalise and export.",
        ],
      },
      { heading: "Stack", body: "Django and Next.js, PostgreSQL with pgvector, and OpenAI." },
    ],
    links: { repo: null, live: null },
    placeholders: ["[SCREENSHOTS]", "[ROLE]", "[LINKS]"],
  },
  {
    id: "scholaroid",
    name: "Scholaroid",
    codename: "The Ecosystem",
    year: "2025",
    idea: "Role-based school management with Admin, Teacher, Student and Parent dashboards.",
    stack: ["Django", "Python", "PostgreSQL", "Jazzmin", "Google OAuth2"],
    summary:
      "One school system, four dashboards: Admin, Teacher, Student and Parent. Classes, attendance, messaging, exams and announcements, each seen from the role that needs it.",
    artifact: "A small modular campus: a hub with four role modules around it, linked by moving pulses.",
    accent: "#ffaa6a",
    sections: [
      {
        heading: "What it does",
        points: [
          "Dedicated dashboards for Admin, Teacher, Student and Parent.",
          "Classes, attendance, messaging, exams and announcements.",
        ],
      },
      { heading: "Stack", body: "Django and Python on PostgreSQL, the Jazzmin admin theme and Google OAuth2 sign-in." },
    ],
    links: { repo: null, live: null },
    placeholders: ["[SCREENSHOTS]", "[ROLE]", "[LINKS]"],
  },
];

export const projectById = (id: string) => projectStories.find((p) => p.id === id);

/** Universe chapter copy. */
export const universe = {
  title: "Project Universe",
  lead: "Six builds. Six worlds. One way of working.",
  body: "Each project gets its own artifact here, not a thumbnail. Scroll through them, or open any case study directly.",
  /** Tony Stark nod (the cave), as original microcopy, not a quote. */
  aside: "No cave, no box of scraps. Just Rust, Win32 and a stubborn TLS handshake.",
  eli5: {
    button: "Explain it like I'm five",
    reset: "Back to grown-up mode",
    simple: "You highlight words that confuse you. It tells you what they mean, in plain words.",
  },
  bridge: {
    button: "Send a packet across",
    done: "Crossed: encrypted, authenticated, private network only.",
  },
} as const;
