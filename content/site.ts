/**
 * Verified identity facts and visibly marked placeholders.
 * Source of truth: docs/abhishyanth-vemula-profile.md and
 * docs/PORTFOLIO_V2_CREATIVE_MASTER_PLAN.md. Never add facts that are not
 * in those documents.
 */

export const identity = {
  name: "Abhishyanth Vemula",
  firstName: "Abhishyanth",
  lastName: "Vemula",
  /** Proposed editorial wording from the master plan; user may refine. */
  descriptor: ["Software Engineer", "AI Developer", "Creative Technologist"],
  /**
   * DRAFT tagline, written for Milestone 001 and pending user approval
   * (master plan §2.3). Grounded in the profile: learns by building complete
   * systems; believes good software should work well and feel good to use.
   */
  tagline: "I build complete systems, then make them feel good to use.",
  taglineStatus: "draft-pending-approval" as const,
} as const;

/** Hero identity stack, wording supplied verbatim by Abhishyanth. */
export const roles = ["Developer.", "Engineer.", "Creator.", "Gamer."] as const;

/**
 * Hero hologram callouts. Award and degree are in the profile; the stack is
 * the user's own pick (2026-11-13). CGPA 9.3 comes from the user's reference
 * screenshot, not the profile document: confirm before launch.
 */
export const highlights = {
  cgpa: { title: "CGPA 9.3", sub: "B.Tech CSE · NIAT" },
  award: { title: "Best Team Member", sub: "NIAT Student General Council" },
  stack: { title: "Django · React · Python", sub: "Tech stack" },
} as const;

export type Project = {
  id: string;
  name: string;
  year?: string;
  /** One verified line. */
  line: string;
  stack: string[];
  featured?: boolean;
};

/**
 * Work list. Lines and stacks come from the profile (five projects) and from
 * docs/WiniOS_README.md (WiniOS). No roles, metrics or links are assigned:
 * the master plan reserves those as placeholders until verified.
 */
export const projects: Project[] = [
  {
    id: "winios",
    name: "WiniOS",
    year: "2026",
    line: "A private bridge between a Windows PC and an iPhone: text and image clipboard over authenticated HTTPS.",
    stack: ["Rust", "Win32", "Axum", "Rustls", "iOS Shortcuts"],
    featured: true,
  },
  {
    id: "jobseek",
    name: "JobSeek",
    year: "2026",
    line: "Full-stack job portal with SeekBot AI for résumé review, job matching and skill-gap checks.",
    stack: ["React", "TypeScript", "Django REST Framework", "FastAPI"],
  },
  {
    id: "iris",
    name: "IRIS",
    year: "2026",
    line: "OCR for invoices and receipts: extracts vendor, date, items, tax and total, then checks the arithmetic.",
    stack: ["Python", "Flask", "Tesseract OCR", "OpenCV"],
  },
  {
    id: "eli5",
    name: "ELI5",
    year: "2026",
    line: "Chrome extension that turns selected text or a screen snip into a plain explanation.",
    stack: ["JavaScript", "Chrome Extension", "OpenAI", "FastAPI"],
  },
  {
    id: "qp-gen",
    name: "QP-Gen",
    year: "2026",
    line: "AI-native, CBSE-compliant question papers from a textbook chapter, streamed into an editor.",
    stack: ["Django", "Next.js", "PostgreSQL + pgvector", "OpenAI"],
  },
  {
    id: "scholaroid",
    name: "Scholaroid",
    year: "2025",
    line: "Role-based school management with Admin, Teacher, Student and Parent dashboards.",
    stack: ["Django", "Python", "PostgreSQL", "Google OAuth2"],
  },
];

/**
 * Nestafar. Abhishyanth confirmed (2026-11-14) that the internship was AI
 * backend development. The certificate (public/evidence/original) is linked as
 * proof of the internship and its dates (Jan–Mar 2026, issued April 10, 2026).
 */
export const experience = {
  role: "AI Backend Development Intern",
  org: "Nestafar Technologies",
  period: "Jan–Mar 2026",
  line: "AI agents connected to live backend data through internal APIs.",
  stack: ["Python", "Django", "FastAPI", "FastMCP"],
} as const;

export const contact = {
  email: "v.abhishyanth118@gmail.com",
  github: "https://github.com/abhi-v-10",
  linkedin: "https://www.linkedin.com/in/abhishyanth-v",
  instagram: "https://www.instagram.com/abhi_v_10/",
} as const;

export type ChapterStatus = "live" | "next";

/** Story beats from master plan §3. Only The Origin is built in Milestone 001. */
export const chapters: { id: string; index: string; title: string; status: ChapterStatus }[] = [
  { id: "origin", index: "00", title: "The Origin", status: "live" },
  { id: "human", index: "00.5", title: "Meet the Human", status: "live" },
  { id: "curiosity", index: "01", title: "Curiosity", status: "live" },
  { id: "engineering", index: "02", title: "Engineering", status: "live" },
  { id: "intelligence", index: "03", title: "Intelligence", status: "live" },
  { id: "projects", index: "04", title: "Project Universe", status: "live" },
  { id: "timeline", index: "05", title: "Timeline Nexus", status: "live" },
  { id: "next", index: "06", title: "Next Chapter", status: "live" },
];

/**
 * Meet the Human (Milestone 003.5). Facts from the profile: NIAT B.Tech CSE,
 * backend + AI agents + 3D web, Nestafar, gaming titles, Linux setups
 * (Hyprland/KDE, GlazeWM/Zebar), HP Omen tuning, MCU and movie lines.
 * The playful lines are tone, not new claims.
 */
export const human = {
  title: ["Behind the systems.", "There's a human."],
  body: "I'm Abhishyanth: a CSE student at NIAT Hyderabad who builds backend systems and AI agents, then fusses over how they feel to use. The rest of the time it's a Valorant or BGMI lobby, a Linux desktop that gets re-riced more often than it needs to, and quoting the MCU at people who did not ask.",
  traits: [
    { term: "Builds", detail: "Backend, AI agents, 3D on the web" },
    { term: "Plays", detail: "Valorant, BGMI, Fortnite, Minecraft" },
    { term: "Tinkers", detail: "Hyprland, KDE, GlazeWM, an HP Omen tuned past stock" },
    { term: "Rewatches", detail: "The MCU, for the lines. A few are hidden further down." },
  ],
  /** Abhishyanth's own one-liner (supplied 2026-11-14). */
  aside: "One more PC tweak. Famous last words.",
} as const;

/**
 * Milestone 003 chapter copy. Every claim traces to the profile document
 * (approach, interests, technical focus, Nestafar experience); the origin
 * line is Abhishyanth's own.
 */
export const curiosity = {
  lead: "Not one framework. The whole system.",
  body: [
    "I learn by building, and I want to know how the complete thing fits together: the front end, the APIs behind it, the database, authentication, the AI services and the deployment that ships it.",
  ],
  /** How it started, in Abhishyanth's words (supplied 2026-11-14). */
  origin:
    "Gaming, experimenting with my PC and trying new software eventually pulled me into programming. I wanted to know what made it all work.",
  questions: [
    "How does this request actually get here?",
    "Where does the data live, and who can touch it?",
    "Why is it slow, really?",
    "What can this new model actually do?",
  ],
  /** Doctor Strange nod (Infinity War's 14,000,605 futures), as microcopy, not a quote. */
  aside: "Six branches explored here. Doctor Strange checked 14,000,605. Still counts.",
} as const;

export const engineering = {
  lead: "Curiosity asks how it works. Engineering decides how it should.",
  body: "Somewhere along the way the questions turned into structure: clear boundaries between services, contracts the front end can rely on, authentication that holds, caching where it pays off, and releases that are tested before they ship. Keep what is maintainable, fix the cause instead of the symptom, and make the result useful to the person on the other side.",
  identity: [
    { term: "Backend and APIs", detail: "Django, Django REST Framework, FastAPI, JWT auth, caching, modular services" },
    { term: "AI integration", detail: "Agents with tool use and structured results: OpenAI, Gemini, Claude, Pydantic, retrieval" },
    { term: "Data", detail: "PostgreSQL, Redis, MongoDB, SQLite" },
    { term: "Discipline", detail: "Linux workflows, release validation, root-cause debugging, AI agents as review partners" },
  ],
  /** Rare, short, attributed MCU lines (master plan §6): one per chapter at most. */
  line: { lead: "Root-cause debugging, in one line:", quote: "I can do this all day.", by: "Steve Rogers", film: "Captain America: The First Avenger" },
} as const;

/** Nestafar, as professional proof (full case study belongs to a later milestone). */
export const nestafar = {
  org: "Nestafar Technologies",
  role: "AI Backend Development Intern",
  period: "Jan – Mar 2026",
  /** The certificate proves the internship and its dates. */
  certificate: "Three-month internship, January to March 2026. Certificate issued April 10, 2026.",
  contributionsLead: "What I worked on:",
  flow: ["Agent", "Tool", "Internal API", "Live data"],
  points: [
    "Built AI agents with Python, Django, FastAPI and FastMCP.",
    "Connected them to live backend data through internal APIs, so answers carry real context.",
    "Shipped features and bug fixes.",
    "Tested and validated releases across Linux-based development and deployment workflows.",
  ],
  evidence: "nestafar",
} as const;

/**
 * Milestone 004 copy. Intelligence: profile technical focus (intent detection,
 * tool use, structured results, application architecture), Nestafar (agents on
 * live backend data via internal APIs, FastMCP), AI tools (OpenAI, Gemini,
 * Claude, Pydantic, retrieval) and "currently exploring". No Nestafar claim
 * beyond the profile; the request flow is described as an approach.
 */
export const intelligence = {
  lead: "Not AI hype. Systems that think through real tools.",
  body: "The agents I built at Nestafar were wired to live backend data through internal APIs, so their answers carried real context. That is the part I find interesting: not the chat window, the plumbing behind it.",
  flowTitle: "How an agent request travels",
  flow: [
    { step: "Intent", detail: "Work out what is actually being asked." },
    { step: "Reason", detail: "An LLM (OpenAI, Gemini or Claude) plans the next move." },
    { step: "Tool call", detail: "A tool exposed through FastMCP does the real work." },
    { step: "API + data", detail: "Internal APIs answer with live data, not guesses." },
    { step: "Result", detail: "A structured, validated answer (Pydantic) comes back." },
  ],
  exploring: "Currently exploring: more capable agents, LLM application architecture and retrieval systems.",
  line: { lead: "The bar for a good agent:", quote: "For you, sir. Always.", by: "J.A.R.V.I.S.", film: "Iron Man" },
} as const;

/** Chapter 06, Next Chapter. Availability is the profile's own wording. */
export const closing = {
  title: "Next Chapter",
  lead: "The story so far. The next part is yours to start.",
  copy: "Open to internships, collaborations and interesting problems, especially involving AI agents, backends or 3D on the web.",
  /** One-page CV, built from docs/resume/resume.html (see docs/resume/build.mjs). */
  cv: "/Abhishyanth-Vemula-Resume.pdf" as string | null,
  /** Post-credits scene: MCU end-card convention, original line. */
  postCredits: {
    meta: "Thank you for exploring my universe",
    title: "Abhishyanth Vemula will return.",
    line: "Right after one more Hyprland config. It is always one more.",
  },
};

export const site = {
  /**
   * The production origin, used for canonical URLs, the sitemap and OG (server
   * only). NEXT_PUBLIC_SITE_URL wins (set it for a custom domain); on Vercel the
   * production domain is used automatically, so links never point at localhost.
   */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"),
  name: "Abhishyanth Vemula",
  title: "Abhishyanth Vemula — Software Engineer, AI Developer, Creative Technologist",
  description:
    "Portfolio of Abhishyanth Vemula: backend systems, AI agents and creative 3D web, told as one continuous story.",
} as const;
