# Abhishyanth Vemula — Portfolio V2

A single, scroll-driven cinematic portfolio: one persistent WebGL world told as
nine chapters, plus fast, linkable case-study pages.

| # | Chapter | What happens |
|---|---|---|
| 00 | The Origin | Energy-core loader, Explore, split reveal, holographic hero |
| 00.5 | Meet the Human | Robot-operated holographic photo gallery |
| 01 | Curiosity | The living signal branches into discoveries |
| 02 | Engineering | Pieces settle into a three-tier system (Nestafar proof) |
| 03 | Intelligence | The system becomes a living agent network |
| 04 | Expression | The network loosens into colour and flowing form |
| 05 | Project Universe | Six project artifacts; `/work/[slug]` case studies |
| 06 | Timeline Nexus | Emerald strands of real events converge on the present |
| 07 | Next Chapter | Contact, a dawn horizon and a post-credits card |

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
- `content/` — verified facts and visible placeholders. Nothing here is invented.

## Editing content

| What | Where |
|---|---|
| Gallery photos 01–04 | `content/gallery.ts` (put files in `public/photos/`) |
| Photo 02 (Expression) | `content/site.ts` → `expression.photo.src` |
| Project links, screenshots, roles | `content/projects.ts` → `links`, `placeholders` |
| WiniOS release year | `content/projects.ts` (`year`) and `content/timeline.ts` |
| School, intermediate, B.Tech start year | `content/timeline.ts` |
| CV link | `content/site.ts` → `closing.cv` |
| Hero CGPA 9.3 (confirm before launch) | `content/site.ts` → `highlights.cgpa` |

## Deploy

The site is fully static (`/` and the six `/work/*` pages are prerendered), so
any Next.js host works. Recommended: Vercel.

1. Set `NEXT_PUBLIC_SITE_URL` to the production origin (e.g.
   `https://abhishyanth.dev`). It feeds canonical URLs, `sitemap.xml`,
   `robots.txt` and Open Graph.
2. Build command `npm run build`, output handled by the framework preset.
3. After deploy, check `/sitemap.xml`, `/robots.txt`, `/opengraph-image` and a
   case study such as `/work/winios`.

Self-hosting: `npm run build && npm run start` behind a reverse proxy (Node 20+).
