/**
 * Project screenshots supplied by Abhishyanth (assets/project-photos,
 * 2026-11-14), shown in each case study in the order they were numbered.
 * Display files are WebP derivatives in public/projects/<id>/ (n.webp and
 * n-thumb.webp). Captions describe only what each screen shows.
 * WiniOS has no screenshots yet: add a "winios" entry when they arrive.
 */

export type ProjectScreen = { title: string; caption: string; width: number; height: number };

const W = 1238;

export const projectScreens: Record<string, ProjectScreen[]> = {
  jobseek: [
    { title: "Landing page", caption: "“Find Jobs. Build Careers. Grow Smarter.”, with Get Started and Meet SeekBot.", width: W, height: 658 },
    { title: "SeekBot", caption: "The SeekBot assistant: recent chats, a new-chat button and suggested prompts for job search, résumé review, skills and interview prep.", width: W, height: 658 },
    { title: "Available jobs", caption: "Job listings with search and filters. Each card shows company, location, job type and views, applications and saves.", width: W, height: 658 },
    { title: "Post a job", caption: "Posting starts by choosing a corporate job or a domestic job.", width: W, height: 658 },
    { title: "Profile settings", caption: "Profile picture, name, contact and profile links, and the account type: job seeker or job poster.", width: W, height: 658 },
  ],
  iris: [
    { title: "Landing page", caption: "“Turn receipts and invoices into spending insight.” How it works in four steps: upload, read, check, understand.", width: W, height: 662 },
    { title: "Spending dashboard", caption: "Totals, average bill, top category and documents needing review, with a monthly spending trend and spend by category.", width: W, height: 662 },
    { title: "Upload", caption: "Drag-and-drop upload for photos, scans and PDFs, beside the five steps each document goes through: pre-processing, OCR, extraction, validation and categorisation.", width: W, height: 662 },
    { title: "Documents", caption: "Every extracted document with vendor, invoice number, category, items, tax, total, OCR confidence and review status, filterable and exportable to CSV or PDF.", width: W, height: 662 },
    { title: "Review a receipt", caption: "The original receipt beside its extracted fields and line items, with the items, subtotal, tax and total cross-checked before saving.", width: W, height: 662 },
  ],
  eli5: [
    { title: "Landing page", caption: "“Make complex things click.” A sample explanation of quantum computing in simple mode.", width: W, height: 660 },
  ],
  "qp-gen": [
    { title: "Landing page", caption: "“papers made easier”: build, review and export papers.", width: W, height: 666 },
    { title: "Assistant", caption: "The dashboard assistant: describe the paper you need, or pick up a recent one.", width: W, height: 666 },
    { title: "Editor", caption: "The paper editor with formatting tools, export to PDF and Word, and the Paper Studio panel for describing a paper in plain English.", width: W, height: 666 },
    { title: "Paper details", caption: "A generated English paper for class 10: three sections, eleven questions, 80 marks, the question types used and a preview of the paper.", width: W, height: 666 },
    { title: "Templates", caption: "Built-in templates, including CBSE class 10 sample papers and class 1–2 worksheets, plus custom templates and folders.", width: W, height: 666 },
  ],
  scholaroid: [
    { title: "Role selection", caption: "Sign-in starts with a role: Admin, Teacher, Student or Parent.", width: W, height: 597 },
    { title: "Admin dashboard", caption: "Counts of students, teachers, classes and notices, with upcoming exams, recent notices, recently added students and a system overview.", width: W, height: 597 },
    { title: "Resources", caption: "Uploading a learning resource with title, description, class, type and file, beside the list of uploaded resources.", width: W, height: 597 },
  ],
};

/** Viewer ids for a project's screens, in order. */
export const screenIds = (project: string) =>
  (projectScreens[project] ?? []).map((_, i) => `shot-${project}-${i + 1}`);
