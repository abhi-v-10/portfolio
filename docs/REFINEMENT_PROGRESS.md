# Cinematic refinement pass — progress

Brief: "PORTFOLIO V2 — CINEMATIC REFINEMENT & FINAL CONTENT INTEGRATION" (2026-11-14).
Checkpoint before work: `228cd75`. Resume from the first unchecked item.

## Supplied assets (verified 2026-11-14)

| File (assets/incoming) | What it is | Facts it carries |
|---|---|---|
| `nestafar_internship.pdf` | Certificate of Internship, Nestafar Technologies Pvt Ltd | Internship in Flutter Development, 3 months, January–March 2026, dated April 10, 2026, signed by the Director |
| `nsgc-stage.jpg` | Award-presentation photo on stage, "Rewards & Recognition 2024–2026" | Trophy + certificate handed over |
| `nsgc-certificate.jpg` | Trophy, Certificate of Appreciation, NIAT bag and mug | Core Team Member, NIAT Student General Council, Best Team Member Award, academic year 2024–2026, awarded 25-04-2026 |
| `inspira-hackathon.png` | Certificate of Participation, Forge Alumnus | Participated in INSPIRA'25, a career and corporate fest at IIT Hyderabad (no prize stated) |
| `uiux-workshop.png` | Certificate of Accomplishment, NIAT | Attended UI/UX Mega Workshop, redesigned an app with Figma; issued 23-Dec-2024 |

Note: the brief lists different filenames (`nestafar-internship.pdf`, …); the actual files above were used.

## Checklist (requirement → files)

### Pass A — content and facts
- [x] 1 MCU quotes: lead + quote only (`MovieLine.tsx`, `site.ts`, `timeline.ts`, CSS)
- [x] 2 Shared evidence viewer (`components/evidence/EvidenceViewer.tsx`), Nestafar certificate in Engineering + Timeline
- [x] 2 Nestafar wording: certificate = Flutter Development internship; contributions kept separate (`site.ts`, `timeline.ts`, Index)
- [x] 3 Expression refocused on creative work; personal list removed (`site.ts`, `Chapters.tsx`)
- [x] 6 Timeline facts: school 2022, intermediate 2024 (8.3 CGPA), B.Tech 2024–present, NSGC + award merged, INSPIRA'25 participation, UI/UX Dec 2024, Nestafar merged, WiniOS 2026
- [x] 9 Assets organised in `public/evidence/` (optimised derivatives) and originals for download

### Pass B — Project Universe artifacts (`UniverseWorld.tsx`, `shaders/universe.ts`)
- [x] WiniOS laptop + phone, secure bridge, two-way send
- [x] JobSeek ecosystem, IRIS receipt + OCR, ELI5 dense→simple text, QP-Gen exam paper, Scholaroid four-role campus

### Pass C — case studies
- [x] Intercepted route modal (`app/@modal/(.)work/[slug]`), standalone page kept
- [x] Opening transition (artifact focus, world dims) + reverse on close
- [x] Loader never replays on internal return
- [x] Editorial case-study layout with SVG architecture hero

### Pass D — Timeline Nexus
- [x] Evidence buttons, strand illumination on focus, camera/light response, mobile spacing

### Pass E — ending
- [x] Closing environment (no blown-out sun), stronger nexus→dawn transition
- [x] Post-credits as triggered title-card sequence

### Pass F — regression, docs, screenshots, recording
- [x] lint / typecheck / build, QA scripts at 1440/1280/820/390/320
- [x] Docs updated, final report

## Gallery photos (user message 2026-11-14)
- [x] `IMG_4562 (2).HEIC` (go-karting) decoded with ffmpeg, cropped to the 4:5 gallery frame: `public/photos/go-karting.webp` (slot 01)
- [x] Four more photos supplied by path (garden café, floral backdrop, festival lights, beach at night), cropped 4:5 into `public/photos/`; gallery now has five photos

## Next action
All passes complete. Remaining items are user-supplied material (see "Open placeholders").

## Fixed during regression
- Scrubbed copy reveals used `autoAlpha`, which made off-screen links `visibility: hidden` and unreachable by Tab; they now animate opacity only.
- Focus after closing a case opened from the index returns to Work; the standalone way back focuses the exhibit title.

## Open placeholders and unverified facts
- Project roles, decisions, lessons, screenshots, recordings, repository/live links (all six case studies).
- CV link; Expression creative work 01; graphic/event design work.
- Hero CGPA 9.3 and the J.A.R.V.I.S. wording still need confirmation.
- INSPIRA'25 CyberEdu/Lovable hackathon detail comes from the earlier profile, not from the certificate.
- Performance validated only with software rendering (SwiftShader), not on a real GPU.

## Story refinement (2026-11-14, second pass)

- Nestafar: role shown as AI Backend Development Intern (confirmed by Abhishyanth); "Flutter Development" removed from the copy, evidence caption and timeline. The certificate stays linked as proof of the internship and dates.
- Timeline: "as recorded in the profile" note removed from INSPIRA'25.
- Case-study error ("Cannot read properties of undefined (reading 'map')" at `p.flow`): the dev server had been running since before `flow` existed and served a stale module. A fresh dev server opens every case study; `CaseStudy` now also tolerates a missing `flow`.
- Scrollbars hidden site-wide (`scrollbar-width: none` + `::-webkit-scrollbar`); scrolling unchanged. `scrollbar-gutter` removed.
- Expression removed: DOM, content, CSS, scroll anchor, Index entry, Expression words, voxel cluster, reticle and their shaders. Intelligence now hands over at track 4.75 (its section bottom), and the network's warm loosening plays as the transition into Project Universe (track 6). Chapters renumbered: Project Universe 04, Timeline Nexus 05, Next Chapter 06.
- Project Universe: establishing shot with zero artifacts; each artifact materialises and deconstructs in its own interval (see DESIGN.md), real `visible = false` gating, per-artifact work skipped when hidden.
- End card: "Thank you for exploring my universe", one-line title from 760px, slow masked word reveal, Hyprland line last.
- Raw placeholders removed from the public page (anecdotes, CV, case-study role/screenshots/links); list moved to README "Still to supply".
- Verified (production build, SwiftShader): 1440, 820, 390 and 320 wide; reduced motion; no-WebGL. No console errors, no horizontal overflow, no raw `[PLACEHOLDER]` text, case study opens and returns to the exact scroll position, rapid forward/reverse scrolling restores the same IRIS frame.
