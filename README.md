# Abhishyanth Vemula — Portfolio V2

A single, scroll-driven cinematic portfolio: one persistent WebGL world told as
eight chapters, plus fast, linkable case-study pages.

| # | Chapter | What happens |
|---|---|---|
| 00 | The Origin | Energy-core loader, Explore, split reveal, holographic hero |
| 00.5 | Meet the Human | Robot-operated holographic photo gallery |
| 01 | Curiosity | The living signal branches into discoveries |
| 02 | Engineering | Pieces settle into a three-tier system (Nestafar proof) |
| 03 | Intelligence | The system becomes a living agent network, then loosens into colour as the story turns to the projects |
| 04 | Project Universe | An empty establishing shot, then one artifact materialises per project; case studies open in-universe (intercepted route) or standalone at `/work/[slug]` |
| 05 | Timeline Nexus | Emerald strands of real events converge on the present |
| 06 | Next Chapter | Contact, a dimensional dawn and a "Thank you for exploring my universe" title card |

Creative direction: `docs/PORTFOLIO_V2_CREATIVE_MASTER_PLAN.md`. Design system:
`DESIGN.md`. Product context: `PRODUCT.md`. Facts: `docs/abhishyanth-vemula-profile.md`.

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4,
three.js with @react-three/fiber, GSAP ScrollTrigger. No smooth-scroll library:
native scrolling drives one deterministic story track.

## Develop

```bash
npm install
npm run dev          # http://localhost:3000
npm run lint
npm run typecheck
npm run build && npm run start
```

QA hooks: `?webgl=0` forces the no-WebGL route; `?slowmo=N` slows the gallery robot.

## Architecture

- `experience/director/` — StoryDirector (document position → `story.track`),
  loader entrance, gallery state. `store.ts` is the single mutable story state.
- `experience/world/` — the one canvas, CameraDirector (CatmullRom path with
  keyframes every half track unit, lens shift per chapter), QualityController
  (measured frame times step DPR down), backdrop colour stories, warm-up render.
- `experience/chapters/` — one world per chapter, each gated by visibility
  windows; `layout.ts` holds the spatial plan, camera keys and track units.
- `components/` — the accessible DOM story layer (real HTML for every word).
- `content/` — verified facts. Nothing here is invented; unsupplied material is omitted from the page (see "Still to supply").
- `app/@modal/(.)work/[slug]` — the in-universe case-study layer; `components/case/` holds the shared case body, overlay and navigation state (`caseNav.ts`, which also stops the loader replaying on internal returns).
- `components/evidence/` — the shared certificate/photo viewer.

## Editing content

| What | Where |
|---|---|
| Gallery photos (five supplied, 4:5 WebP 1200×1500) | `content/gallery.ts` (files in `public/photos/`) |
| Certificates and award photos | `content/evidence.ts` (display files in `public/evidence/`, originals in `public/evidence/original/`) |
| Project screenshots (Screens block in each case study) | `content/screens.ts` (files in `public/projects/<id>/`, from `assets/project-photos/`) |
| Project links | `content/projects.ts` → `links` (a Links section appears once one is set) |
| Timeline events and evidence | `content/timeline.ts` |
| CV link | `content/site.ts` → `closing.cv` |
| Hero CGPA 9.3 (confirm before launch) | `content/site.ts` → `highlights.cgpa` |

## Still to supply (personal information and photos)

These are not shown on the site until supplied. Nothing is invented in their place.

| Item | Where it goes once supplied |
|---|---|
| A personal anecdote for Meet the Human, in your own words | `content/site.ts` → `human.anecdotePlaceholder` (render it in `components/human/Human.tsx`) |
| The origin of your curiosity (Curiosity chapter) | `content/site.ts` → `curiosity.anecdotePlaceholder` (render it in `components/chapters/Chapters.tsx`) |
| CV link | `content/site.ts` → `closing.cv` (the CV link appears in Next Chapter when set) |
| Per project: your role, key decisions and lessons | `content/projects.ts` (add a `sections` entry) |
| Optional: more WiniOS and ELI5 screens (each has one) | `public/projects/<id>/n.webp` + `n-thumb.webp`, captions in `content/screens.ts` |
| Per project: repository / live links | `content/projects.ts` → `links` |
| Confirm: hero CGPA 9.3, the J.A.R.V.I.S. line wording | `content/site.ts` |
| Optional: more gallery photos (4:5, at least 1200×1500) | `public/photos/` + `content/gallery.ts` |

The Nestafar certificate PDF (`public/evidence/original/`) is linked as proof of the internship and its dates; the site describes the role as AI backend development, as confirmed by Abhishyanth.

## Deploy

The site is fully static (`/` and the six `/work/*` pages are prerendered), so
any Next.js host works. Recommended: Vercel.

1. Optional on Vercel: the production `*.vercel.app` domain is picked up
   automatically. Set `NEXT_PUBLIC_SITE_URL` (e.g. `https://abhishyanth.dev`)
   once you add a custom domain, then redeploy. It feeds canonical URLs,
   `sitemap.xml`, `robots.txt` and Open Graph.
2. Build command `npm run build`, output handled by the framework preset.
3. After deploy, check `/sitemap.xml`, `/robots.txt`, `/opengraph-image` and a
   case study such as `/work/winios`.

Self-hosting: `npm run build && npm run start` behind a reverse proxy (Node 20+).
