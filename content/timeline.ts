/**
 * Timeline Nexus content (master plan §3, "Timeline Nexus").
 *
 * Every event is a source-controlled fact from docs/abhishyanth-vemula-profile.md,
 * with the date exactly as precise as the source. Missing history (school,
 * intermediate, B.Tech start year, WiniOS year) stays a visible placeholder.
 * Events are listed oldest first; `strand` places them on one of five strands.
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
  placeholder?: boolean;
};

export const timeline: TimelineEvent[] = [
  {
    id: "school",
    strand: "education",
    date: "[YEAR]",
    title: "[SCHOOL]",
    line: "School years, in Abhishyanth's words (to be supplied).",
    placeholder: true,
  },
  {
    id: "intermediate",
    strand: "education",
    date: "[YEAR]",
    title: "[INTERMEDIATE / PRE-UNIVERSITY]",
    line: "Intermediate studies (to be supplied).",
    placeholder: true,
  },
  {
    id: "btech",
    strand: "education",
    date: "[START YEAR] – present",
    title: "B.Tech, Computer Science & Engineering",
    line: "NxtWave Institute of Advanced Technologies (NIAT), Hyderabad.",
  },
  {
    id: "sgc",
    strand: "leadership",
    date: "2024 – 2026",
    title: "Core Team Member, NIAT Student General Council",
    line: "Core team for the 2024–2026 academic year.",
  },
  {
    id: "uiux",
    strand: "learning",
    date: "Dec 2024",
    title: "UI/UX Mega Workshop, NxtWave",
    line: "Redesigned an app end to end in Figma.",
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
    title: "INSPIRA'25, IIT Hyderabad / Forge Alumnus",
    line: "Built CyberEdu in the Lovable hackathon.",
  },
  {
    id: "nestafar",
    strand: "work",
    date: "Jan – Mar 2026",
    title: "AI Backend Engineer Intern, Nestafar Technologies",
    line: "AI agents on live backend data through internal APIs.",
  },
  {
    id: "builds-2026",
    strand: "projects",
    date: "2026",
    title: "JobSeek, IRIS, ELI5 and QP-Gen",
    line: "Four builds across AI products, OCR and education tooling.",
  },
  {
    id: "certificate",
    strand: "work",
    date: "Apr 2026",
    title: "Certificate of Internship, Nestafar",
    line: "For the three-month internship, January to March 2026.",
  },
  {
    id: "award",
    strand: "leadership",
    date: "Apr 2026",
    title: "Best Team Member Award",
    line: "NIAT Student General Council, for the Core Team Member contribution.",
  },
  {
    id: "winios",
    strand: "projects",
    date: "[YEAR]",
    title: "WiniOS",
    line: "A private Windows-to-iPhone clipboard bridge, now in private beta.",
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
