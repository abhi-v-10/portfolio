/**
 * Timeline Nexus content (master plan §3, "Timeline Nexus").
 *
 * Every event is a source-controlled fact (profile, supplied certificates, the
 * 2026-11-14 brief), with the date exactly as precise as the source. Events
 * are listed oldest first; `strand` places them on one of five strands.
 */

export type StrandId = "education" | "leadership" | "work" | "projects" | "learning";

export const strands: { id: StrandId; label: string }[] = [
  { id: "education", label: "Education" },
  { id: "leadership", label: "Leadership" },
  { id: "learning", label: "Learning" },
  { id: "projects", label: "Projects" },
  { id: "work", label: "Work" },
];

export type TimelineEvent = {
  id: string;
  strand: StrandId;
  date: string;
  title: string;
  line: string;
  /** Optional second line (e.g. what a certificate states). */
  detail?: string;
  /** Evidence ids (content/evidence.ts) opened in the shared viewer. */
  evidence?: { ids: string[]; label: string };
  /** Major events get a stronger node and a light response. */
  major?: boolean;
  placeholder?: boolean;
};

/**
 * Dates as precise as the sources: the profile, the supplied certificates and
 * the user's 2026-11-14 brief (Grade 10 in 2022, Intermediate in 2024 with
 * 8.3 CGPA, B.Tech from 2024, WiniOS 2026). No admission years, intermediate
 * institution or release date are invented.
 */
export const timeline: TimelineEvent[] = [
  {
    id: "school",
    strand: "education",
    date: "2022",
    title: "Grade 10, Bharatiya Vidya Bhavan's Public School",
    line: "Completed schooling through Grade 10.",
  },
  {
    id: "intermediate",
    strand: "education",
    date: "2024",
    title: "Intermediate (Grades 11–12)",
    line: "Completed with 8.3 CGPA.",
  },
  {
    id: "btech",
    strand: "education",
    date: "2024 – present",
    title: "B.Tech, Computer Science & Engineering",
    line: "NxtWave Institute of Advanced Technologies (NIAT), Hyderabad.",
    major: true,
  },
  {
    id: "uiux",
    strand: "learning",
    date: "Dec 2024",
    title: "UI/UX Mega Workshop, NIAT",
    line: "Redesigned an app with Figma; certificate issued 23 December 2024.",
    evidence: { ids: ["uiux"], label: "View certificate" },
  },
  {
    id: "scholaroid",
    strand: "projects",
    date: "2025",
    title: "Scholaroid",
    line: "Role-based school management with four dashboards.",
  },
  {
    id: "inspira",
    strand: "learning",
    date: "2025",
    title: "INSPIRA'25, IIT Hyderabad",
    line: "Participated in the career and corporate fest presented by Forge Alumnus.",
    detail: "Built CyberEdu in the fest's Lovable hackathon.",
    evidence: { ids: ["inspira"], label: "View certificate" },
  },
  {
    id: "nestafar",
    strand: "work",
    date: "Jan – Mar 2026",
    title: "Internship, Nestafar Technologies",
    line: "AI backend development: agents wired to live data through internal APIs. Certificate issued April 10, 2026.",
    detail: "Work I documented during it: AI agents on live backend data through internal APIs (Python, Django, FastAPI, FastMCP).",
    evidence: { ids: ["nestafar"], label: "View internship certificate" },
    major: true,
  },
  {
    id: "builds-2026",
    strand: "projects",
    date: "2026",
    title: "JobSeek, IRIS, ELI5 and QP-Gen",
    line: "Four builds across AI products, OCR and education tooling.",
  },
  {
    id: "council",
    strand: "leadership",
    date: "2024 – 2026 · Apr 2026",
    title: "NIAT Student General Council, Best Team Member Award",
    line: "Core Team Member for the 2024–2026 academic year.",
    detail: "Honoured with the Best Team Member Award, 25 April 2026.",
    evidence: { ids: ["nsgc-stage", "nsgc-award"], label: "See the award" },
    major: true,
  },
  {
    id: "winios",
    strand: "projects",
    date: "2026",
    title: "WiniOS",
    line: "A private Windows-to-iPhone clipboard bridge, now in private beta.",
    major: true,
  },
];

export const nexus = {
  title: "Timeline Nexus",
  lead: "Every thread, held in one place.",
  body: "Education, leadership, learning, projects and work, as strands of one timeline. They branch where the work diverged and pull together where one thing led to the next.",
  line: {
    lead: "What holding all the threads feels like:",
    quote: "I am burdened with glorious purpose.",
    by: "Loki",
    film: "The Avengers",
  },
} as const;
