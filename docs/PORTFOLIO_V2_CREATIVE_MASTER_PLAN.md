# PORTFOLIO V2 — THE ORIGIN STORY
## Creative bible, content source of truth, architecture, and phased implementation plan

**Project:** Abhishyanth Vemula — immersive personal portfolio  
**Status:** Approved creative direction; All milestones implemented (001–007, including 004A and Timeline Nexus), plus the 2026-11-14 cinematic refinement pass (see docs/REFINEMENT_PROGRESS.md). Portfolio V2 is feature-complete; remaining work is supplying the visible placeholders and deploying  
**Target:** Fresh repository/folder (`portfolio-v2`), separate from archived `actual-portfolio`  
**Primary builder:** Claude Code  
**Last revised:** 2026-11-13

> **Mission:** Make a premium, memorable, professionally useful portfolio that unfolds as one colorful, continuous cinematic journey through the mind and work of a builder, explorer, and creator. MCU/JARVIS/FRIDAY influence is inspiration for energy, spectacle, technology, humor, and narrative pacing—not an attempt to reproduce Marvel assets or trademarked designs.

## 0. How Claude Code should use this file

1. **Read this entire file before making architectural or design changes.** Treat approved decisions as requirements, proposed visual concepts as creative direction, and placeholders as unknowns—not facts to fabricate.
2. **Implement one milestone per user prompt.** Never build every chapter at once. Start with the loader, entrance and hero only.
3. **Use available UI/UX/design/motion skills selectively** (UI/UX Pro Max, Impeccable, Hallmark, design-system, design, animation or 3D skills where installed). Inspect first; avoid repeated expensive audits and skills calls with little value.
4. **Prefer decisive implementation to prolonged planning**, but keep quality high. Provide short reports, screenshots/recording when browser tools allow, test results and specific remaining issues.
5. **Preserve an original design language.** Do not clone a reference or reproduce copyrighted MCU visual assets, specific reactor geometry, logos, costumes, or interfaces.
6. **Never invent biographical details, project metrics, authorship, deployed links, photographs, dates, or achievements.** Use visible editorial placeholders where missing.
7. **Prioritize cinematic coherence and readable content over maximum effects.** No generic SaaS template, generic glass dashboards, noisy particles or a single glowing sphere on empty black.

## 1. Locked creative brief

**Concept title:** *The Origin Story* (working title, can change if a stronger original title emerges).  
**Core narrative:** Curiosity → Building systems → Exploring intelligence → Creative expression → Things built → What comes next.  
**Emotional arc:** Mysterious start → energetic discovery → confident technical clarity → imaginative warmth → impressive proof → optimistic closure.  
**Personality:** Premium cinematic sophistication with small, well-timed Gen Z jokes and MCU Easter eggs. No relentless memes, fake superhero persona, or dense HUD clutter.  
**Format:** One continuous, scroll-driven cinematic environment with visually distinct story beats. Not a conventional site made of detached hero/about/cards/contact panels. Chapters are production units, not necessarily hard-cut screen sections.  
**Style:** Original abstract sci-fi environments, architectural forms, elegant motion graphics, rich colors, sculptural materials, expressive editorial typography, high-contrast readable UI, tasteful holographic accents.  
**Previous AV monogram:** **Retired**. Never restore the old AV→liquid→cubes→cloud→VA narrative as the primary concept. The new connective motif is a **living signal**: a point/current of energy whose form changes between worlds and sometimes disappears into the environment.  
**Photos:** Reserve three tasteful personal image placeholders. Photos will be supplied later; do not generate fake real-person photos.

### Inspiration language

- Tony Stark / JARVIS / FRIDAY: quiet, precise cyan holographic energy, system boot-up, engineered details, confidence.
- MCU title sequences: bold editorial lettering, cinematic staging, chapter reveals, strong composition.
- Doctor Strange / dimensional travel: spatial transitions and color changes, without using identifiable movie props or copying portals.
- Guardians-style cosmic warmth: imaginative color, personality, optimistic undertones.
- Unseen Studio-style craftsmanship: sophisticated loading and motion transitions; study principles, not reproduction.
- Favor original objects and environments so the experience clearly belongs to Abhishyanth.

## 2. Approved opening experience — FIRST IMPLEMENTATION MILESTONE

This opening is the immediate build target. **Do not build later chapters during milestone 001.**

### 2.1 Loader: an original energy heart

**Visual:** Near-black/space-navy background. In the exact visual center, a distinctive, original luminous electric-blue **energy heart/core** (not a recreation of Iron Man's arc reactor). The geometry should feel engineered and alive: layered inner construction, subtle circulating energy, a restrained soft halo, gentle pulse/breathing, thoughtful silhouette. Keep the outside UI sparse.

**Possible microcopy:** `AV / PERSONAL SYSTEM`, `INITIALIZING`, `CORE ASSETS`, then `SYSTEM READY`. These are UI labels, not assertions about actual hardware.

**Progress:** An exceptionally neat, thin bar beneath the core. Must be backed by real critical-asset readiness; when byte-accurate progress is unavailable, use an honest indeterminate/loading motion instead of invented percentages. Smooth its presentation without misleading status. The core itself is a visual heartbeat rather than a percentage instrument.

**Timing:** Intro should be unmistakably seen on ordinary fast loads (aim at roughly 1.5–2 seconds of normal presentation), yet must not hold users through a long fake countdown. Actual slow assets may take longer; error/timeouts need a usable fallback. Allow Skip Intro and a reduced-motion route without forced waiting. Do not block on nonessential project content, 3D assets for future chapters, external APIs or background prefetch.

**Reload semantics:** Every full document reload (Ctrl+R, F5, hard refresh) shows the loader afresh. Do **not** use session-storage bypass for full reload. Normal in-page chapter navigation must not replay it.

**Ready state:** After essential loading finishes, progress resolves; `SYSTEM READY` appears and a simple accessible **EXPLORE** button fades/reveals in. The visitor chooses when to enter; no automatic enter. Keyboard, focus, screen readers, touch, and failure handling are first-class.

### 2.2 Cinematic Explore transition

- On Explore: one restrained pulse increases core brightness; a subtle illuminated horizontal seam forms across screen center.
- The preloader **physically opens in two halves**: top rises upward, bottom descends. Core artwork appears split at the seam rather than disappearing before the panels move. Use clipping/layer composition, synchronized transforms and GSAP.
- Reveal the already-prepared colorful hero beneath the opening panels. No flash of hero before loading, no white gap, no doubled/react-mounted core, no sudden camera jump.
- Hero name follows with elegant staggered masked typography and secondary-line reveal. Do not overdo letter-by-letter effects.
- The electric-blue point of light transitions visually into the opening **living signal** in the hero—one connected story, not a separate loader demo.
- Entrance timeline owns intro transforms; subsequent ScrollTrigger director owns scroll properties. They must never fight.
- Skip/reduced-motion goes to a fully composed readable hero with correct scroll state.

### 2.3 Hero: The Origin

**Identity:** `ABHISHYANTH VEMULA` as strong, accessible HTML typography.  
**Professional descriptor:** `Software Engineer · AI Developer · Creative Technologist` is proposed editorial wording based on the user's roles/interests; user can refine.  
**Short line:** `[HERO TAGLINE — WRITE AN ORIGINAL SHORT LINE ABOUT CURIOSITY / BUILDING; USER APPROVAL PENDING]`. Do not invent personal origin anecdotes.  
**Action:** Minimal scroll cue and easily discoverable navigation/index.  
**Photo:** `[PHOTO PLACEHOLDER 01 — portrait/candid, optional later]`, reserved for a later story beat; do not cram a generic avatar into the hero.

**Visual:** An original, clearly art-directed dimensional universe that establishes the project's richer identity. An energy point begins to travel/transform into a memorable abstract signal or sculptural form. Foreground, midground, background, shapes and lighting should compose one beautiful frame even when idle. Deep violet and cobalt fields blend with cyan and a small coral warmth. A deliberately colorful world—not endless pure black with one glowing logo.

**Camera/motion:** The environment is gently alive at rest. Small damped pointer parallax on capable desktops. Actual document scroll begins evolving camera/signal/environment in a short **reversible** proof-of-concept toward the next world; stop before fully implementing Engineering/AI/About content. Avoid wheel-event counting and scroll hijacking.

**Readability:** Hero name must win the visual hierarchy. Keep holographic decorations from competing with the typography. Use real DOM text, responsive layout and contrast.

### 2.4 Opening acceptance criteria

- Loader clearly visible during normal full reloads and cached reloads; is not instantly bypassed.
- Core is original, high-quality, pulsing gently rather than spinning wildly.
- Progress UI communicates authentic readiness; no fake percentages.
- Explore visible only after ready; user controls entry; Skip works; keyboard and reduced motion work.
- Core visibly splits with two moving panels; reveal has no pops/gaps/flashes.
- Hero composition is rich and colorful, not blank black or random particles.
- Hero name and descriptor are readable at desktop/tablet/mobile (including 320px).
- First scroll response is smooth, continuous, deterministic and reversible; no native-scroll interception.
- No second WebGL canvas for loader, unless a technically compelling alternative is justified and measured. Reuse one renderer or implement loader core as efficient SVG/CSS while the hero WebGL scene is prepared.
- No WebGL: thoughtful original static/gradient fallback, functional content and CTA.
- Verify lint/typecheck/build, responsiveness, interaction, reduced motion and no horizontal overflow.
- Deliver desktop/mobile screenshots and a complete load→Explore→hero recording if available.

## 3. Narrative and production storyboard — FUTURE CHAPTERS

These are **continuous beats**, not disconnected web sections. Camera, signal, lighting, shapes and typography should carry forward into the next beat. Every transition needs an entry, a legible reading hold and an exit.

| Beat | Meaning and content | Original 3D/motion concept | Color emotion | Placeholder / key information |
|---|---|---|---|---|
| 00 — The Origin (loader and hero) | Identity; invitation into the story | Engineered energy heart splits open into living signal; colorful dimensional opening | Navy, electric blue, violet | Hero tagline; first optional photo |
| 00.5 — Meet the Human (Milestone 003.5) | Personal introduction: software/AI engineer, creative builder, gamer, Marvel fan, curious tinkerer; warm, concise, slightly playful; `[PERSONAL ANECDOTE]` placeholder | The living signal arrives at a spatial gallery of 3–4 holographic photo frames operated by an original articulated robot assistant (DUM-E-inspired personality, original design): reach, hesitate, push, settle. Drag/swipe/arrows/Previous/Next; held once on a native sticky stage, then the story moves on | Soft lavender, pale cyan, a touch of peach | `content/gallery.ts` photo slots 01–04 (placeholders until supplied) |
| 01 — Curiosity | Loves understanding and making things, beyond a single framework | Signal enters evolving geometric landscape; objects assemble from possibilities | Violet, cobalt, pale mist | `[PERSONAL ORIGIN ANECDOTE]` (Photo 01 moved to Meet the Human's gallery) |
| 02 — Engineering | Backend architecture, systems, building complete products; Nestafar experience | Organic debris organizes into modular structures and flowing data pathways | Cobalt, bright cyan, deeper blue | Verified role/date/stack; optional architecture diagrams |
| 03 — Intelligence (Milestone 004, built) | AI agents, tool use, working applications—not AI hype | The Engineering modules fly out into a living agent network: labelled nodes trace one real request (intent, LLM, tool call via FastMCP, internal API, live data, validated result), with a walking packet and pulses on every connection | Luminous cyan, purple, soft blue on indigo | Nestafar profile facts, AI tools |
| ~~04 — Expression~~ (removed 2026-11-14) | Its personal content already lives in Meet the Human; the chapter duplicated it | The network's loosening into warm ribbons survives only as the transition from Intelligence into Project Universe (no words, voxels or reticle) | Violet, pink, coral (transition only) | None |
| 04 — Project Universe (Milestone 005, built; renumbered 2026-11-14) | Proof of technical execution through six distinct projects | A dark exhibition hall: an empty establishing shot (title, restrained signal), then one original artifact materialises per project (rise, assembly, a projection plane sweeping up, screens drawing on) and deconstructs before the next (Bridge, Navigator, receipt scan, knot→sentence, modules→paper, campus); ELI5 and WiniOS exhibits are interactive; every exhibit opens a case study in-universe or at `/work/[slug]` | Multi-colored, tuned per project | Roles, screenshots and links are omitted until supplied (`content/projects.ts`) |
| 05 — Timeline Nexus (built, placed between Project Universe and Next Chapter) | Education, leadership, learning, projects, work | Five emerald rope-strands carry real events as nodes and converge on the present; gathering turns them from cold white to green; hovering/focusing a list item lights its node | Deep jade, emerald, cold white | `content/timeline.ts`; school, intermediate, B.Tech start year and WiniOS year are placeholders |
| 06 — Next Chapter (Milestone 006, built) | Availability, contact, possibility | Four coloured paths rise from the nexus to a warm dawn horizon; then the end card "Thank you for exploring my universe / Abhishyanth Vemula will return." | Lavender, warm ivory, coral | Contact links; CV link appears once `closing.cv` is set |

**Scroll direction:** A single narrative stream; neither the camera nor signal must be literally onscreen the entire time. Transition via match cuts, transforming elements, controlled occlusion and spatial staging. Limit pinned empty scroll; leave editorial reading beats. Do not measure chapters in wheel clicks; normalize against document scroll distance and test wheel/trackpad/touch/keyboard.

### Timeline Nexus (approved note 2026-11-13; built in the Milestone 005–006 run)

**Meaning:** Education, projects, experience and growth shown as one connected timeline network rather than a list. Each strand is a real, source-controlled event (NIAT B.Tech, NIAT Student General Council and the April 2026 Best Team Member Award, Nestafar internship Jan–Mar 2026, the six projects, INSPIRA'25, the NxtWave UI/UX workshop). Strands branch where work diverged and re-join where one thing led to another; growth reads as the network thickening over time.

**Reference (user-approved inspiration, energy only):** the end of Marvel's *Loki* Season 2 (“Glorious Purpose”), where Loki gathers the failing threads of time, infuses them with green energy and holds them together as a living tree of timelines at the End of Time. Take the *feeling*: living, mythic, sci-fi strands of time held together by one person; light shifting from cold white to living green as it is gathered.

**Original treatment:** luminous emerald/jade time-strands (new chapter accent, e.g. a green around `#3FE0A0`–`#7CF5C4`, tuned against the existing palette) that twist like ropes, braid, branch and converge on a central point the visitor scrolls toward. Nodes on the strands open accessible HTML detail (date, role, one verified line). Under §6: no Loki/TVA marks, no Temporal Loom machine, no throne, no copied tree silhouette or character imagery; the structure must be original geometry. Reduced motion and no-WebGL get a readable vertical timeline with the same facts.

**Placement (built):** between Project Universe and Next Chapter, as Chapter 05 (renumbered when Expression was removed). Its one MCU line is Loki's "I am burdened with glorious purpose." Never fabricate dates, roles or outcomes for strands; use visible placeholders.

**Future reference ideas (not built):** Timeline Nexus keeps Loki's glorious-purpose feeling and could close on one attributed Loki or He Who Remains line about time, chosen then. Project Universe could carry one line on the WiniOS world (for example a Tony Stark "built it in a cave" style nod in original microcopy rather than a quote) and an interaction easter egg for a project that has a real story behind it. Keep the one-line-per-chapter budget.

**Optional post-credits Easter egg:** A short original playful ending referencing gaming, Linux tinkering, debugging or Marvel fandom—not mandatory for getting contact info.

## 4. Project Universe — original project treatments

**Design rule:** No ordinary row of identical cards, no simple slideshows or endless project portals. The visual environment brings artifacts naturally into camera focus; readable HTML overlay contains title, one-line idea, stack and **View Case Study** action. Detailed case studies must be easy to access directly without scrolling the full movie. Accessibility/mobile fallback: conventional list of project links with great design, not broken 3D-only navigation.

### Featured: WiniOS — “The Bridge”

- **What it is (from prior project discussions):** A Windows↔iPhone clipboard bridge, including cross-device text and image clipboard transfers; Rust and Windows native clipboard integration, an Axum HTTPS service using Rustls, and an iPhone Shortcuts-based workflow have been discussed.
- **Security/work already reported:** TLS default/fail-closed behavior, bearer authentication, POST gating, peer-address handling, graceful shutdown, certificate provisioning/testing, and native clipboard integration checks. **Do not claim real-device deployment or verified physical iPhone performance from these tests.**
- **Visual metaphor:** Two distinct device-worlds bridged by a luminous data current; packets cross securely and resolve into clipboard content. Avoid literally reproducing OS interfaces or implying production capabilities not confirmed.
- **Case study:** `[WINIOS VERIFIED RELEASE/STATUS]`, problem, system diagram, protocol, certificate/security decisions, Windows/iOS integration, test coverage, screenshots/recording, role, repositories/download links where provided.
- **Prominence:** Featured and expanded relative to other projects, because it showcases cross-platform systems engineering.

### JobSeek / SeekBot — “The Navigator”

Full-stack job discovery/application portal with SeekBot career guidance. AI-powered résumé review, job matching and skill-gap analysis are described. Original artifact: a graph of opportunity routes, matches and decisions. **Profile stack:** React, TypeScript, Django REST Framework and FastAPI. `[PROJECT SCREENSHOTS]`, `[ROLE]`, `[LINKS]`, `[MEASURED RESULTS]`.

### IRIS — “The Vision”

Invoice/receipt OCR tool for scans/photos/PDFs extracting fields, verifying arithmetic and visualizing expenses. Original artifact: a floating document scanned into structured geometry. **Profile stack:** Python, Flask, Tesseract OCR and OpenCV. `[SCREENSHOTS]`, `[ROLE]`, `[LINKS]`.

### ELI5 — “The Translator”

Chrome extension that simplifies selected/snipped complex text using AI, in selectable persona/format. Original artifact: complex text structures simplify into clear language. **Profile stack:** JavaScript, Chrome Extension, OpenAI and FastAPI. `[SCREENSHOTS]`, `[ROLE]`, `[LINKS]`.

### QP-Gen — “The Architect”

AI-native CBSE-aligned question-paper generator producing editable paper structure from textbook chapters and requirements. Original artifact: layered chapter content assembling into sections/questions. **Profile stack:** Django, Next.js, PostgreSQL/pgvector and OpenAI. `[SCREENSHOTS]`, `[ROLE]`, `[LINKS]`.

### Scholaroid — “The Ecosystem”

Role-based school management app with Admin, Teacher, Student and Parent dashboards; attendance, messaging, exams and announcements. Original artifact: miniature connected modular campus/systems. **Profile stack:** Django, Python, PostgreSQL, Jazzmin and Google OAuth2. `[SCREENSHOTS]`, `[ROLE]`, `[LINKS]`.

**Content policy:** Do not assign solo authorship, production scale or impact metrics to any of the five documented projects without user confirmation. WiniOS details must be checked against current source before final public copy.

## 5. Personal and professional facts — source-controlled

Source: user-supplied `abhishyanth-vemula-profile.md`. Keep this file alongside this plan in the new project under `docs/` or `references/`. This summary is for convenience; the profile is authoritative for the five documented projects and user facts.

- **Full name:** Abhishyanth Vemula.
- **Education:** B.Tech Computer Science & Engineering, NxtWave Institute of Advanced Technologies (NIAT), Hyderabad; current per supplied profile. Expected graduation year not stated.
- **Focus:** Backend software engineering, AI agents/LLM applications, full-stack products and creative web/3D exploration.
- **Nestafar Technologies:** AI Backend Engineer Intern, January–March 2026. Python, Django, FastAPI, FastMCP; connected agents to live internal APIs; shipped features and bug fixes; validated releases with Linux-based workflows.
- **NIAT Student General Council:** Core Team Member during academic year 2024–2026. Best Team Member Award in April 2026.
- **Other documented activities:** INSPIRA'25 IIT Hyderabad/Forge Alumnus participation (CyberEdu at Lovable hackathon); NxtWave UI/UX Mega Workshop December 2024.
- **Languages/tools:** Python, JavaScript, C++, C; Django, DRF, FastAPI, Flask, FastMCP; OpenAI API, Gemini, Claude, Pydantic, retrieval; React, Vite, Tailwind; PostgreSQL, MongoDB, SQLite, Redis; Three.js, WebGL, Blender, Git, Linux. AWS and Azure are areas of exploration, not demonstrated production expertise unless separately confirmed.
- **Personal interests:** MCU/Marvel and famous movie lines (newly user-supplied); gaming (Valorant, BGMI, Fortnite, Minecraft); HP Omen performance tuning; Linux distro experimentation, Hyprland/KDE, GlazeWM/Zebar; troubleshooting system and performance issues; new developer/AI tools.
- **Approach:** Learns by building complete systems; cares about maintainable boundaries, real utility and usability; values diagnosing performance root causes; uses AI coding agents as collaborators.
- **Availability:** Open to internships, collaborations and interesting work around AI agents, backend engineering and creative 3D web.
- **Email:** v.abhishyanth118@gmail.com.
- **GitHub:** https://github.com/abhi-v-10.
- **LinkedIn:** https://www.linkedin.com/in/abhishyanth-v.
- **Instagram:** https://www.instagram.com/abhi_v_10/.
- **Not documented:** Age/birth date, GPA, expected graduation date, home address, exact personal origin story, detailed project contributions/outcomes, CV URL and supplied photographs.

**Writing tone:** Confident, clever, contemporary, clear. Not self-mythologizing or boastful. Small Gen Z microcopy is welcome when meaningful, not in every sentence.

## 6. MCU-inspired treatment and originality guidelines

1. Visual inspiration: cinematic sci-fi, energetic holographic interfaces, dimensional camera work, colorful cosmic worlds, optimistic hero-journey pacing.
2. **No Marvel/Avengers/Stark brand marks as portfolio identity**, no traced reactor, no copied Iron Man helmet/HUD, no licensed character imagery or movie footage in the production site unless separately permissioned.
3. Famous lines should be **rare, short, attributed Easter eggs**, not headings throughout the experience. Do not reproduce extended dialogue/lyrics. Prioritize original phrases that express Abhishyanth's values.
4. Avoid fan-site aesthetics: this is first and foremost a professional engineering portfolio. Marvel fandom should be an authentic personal layer, not a replacement for proof of work.
5. The engine-room core is original; the energy/light continuity is a visual narrative, not a specific Marvel prop.

### 6.1 Reference principles (approved in Milestone 004A)

- **Budget:** at most one attributed MCU line per chapter, and never the same line twice. Not every chapter needs one.
- **Earned, not pasted:** a line only appears where it says something true about the work. It always follows a lead-in in Abhishyanth's own voice ("Root-cause debugging, in one line:") so it reads as commentary, not a slogan.
- **Form:** a lead-in line in Abhishyanth's voice, then the quote in the display face. Since the 2026-11-14 refinement the character and film are not shown (they stay in content for provenance and in screen-reader text). Lines must be verified, short (under 15 words) and never a heading.
- **Nods over quotes:** where a direct quote is uncertain or too long, use original microcopy that references the moment (14,000,605 futures; 12% of a plan) instead of reproducing dialogue.
- **Visual nods are colour and light only:** a warmth, a glow or a spark pattern on original geometry. Never a prop, emblem, portal silhouette, costume or interface.
- **Gen Z humour** lives in small, earned microcopy or in a response to something the visitor does (an easter egg). No meme formats, forced slang or fake terminal output.
- **Reserved for later:** Loki for Timeline Nexus (already its reference); a post-credits beat for Milestone 006.

### 6.2 Personality layer as built (Milestone 004A)

| Where | Reference | Form | Why it fits |
|---|---|---|---|
| Meet the Human, traits | MCU fandom | "The MCU, for the lines. A few are hidden further down." | Turns the fandom fact into a quiet invitation to keep scrolling. |
| Meet the Human, gallery | DUM-E-style robot, gaming | Spam the arrows five times in 2.5 s: "Easy. He's a helper bot, not a speedrunner." (4 s, then back) | Rewards play; gives the robot personality without new motion. |
| Curiosity | Doctor Strange (Infinity War) | Aside: "Six branches explored here. Doctor Strange checked 14,000,605. Still counts." Visual: the exploration ping's leading edge burns amber with travelling glints. | The chapter is literally exploring branching possibilities; amber dimensional sparks contrast its violet field. |
| Engineering | Steve Rogers, The First Avenger | "I can do this all day." after "Root-cause debugging, in one line:" | Persistence is the real debugging skill; sits beside the Discipline row. |
| Intelligence | J.A.R.V.I.S., Iron Man | "For you, sir. Always." after "The bar for a good agent:" Visual: the Result node holds a warm gold core (a Vision/Mind-light nod). | Agents exist to serve the person asking; the gold marks where a request becomes understanding. |
| ~~Expression~~ (chapter removed 2026-11-14; the aside is retired) | Star-Lord, Guardians of the Galaxy | Aside: "Most experiments here start with about 12% of a plan. Star-Lord would approve." Tinker note: "The dotfiles are never done." | Creative experimentation and Linux ricing, said with Guardians-style looseness. |

## 7. Visual design system

### Palette (starting points, tune artistically)

| Token | HEX | Use |
|---|---|---|
| Space navy | `#111528` | Atmospheric shadow foundation, not flat everywhere |
| Cosmic violet | `#6750C8` | Dramatic dimension and identity |
| Electric blue | `#3478F6` | Digital worlds, control surfaces |
| Ion cyan | `#56DCE0` | Loader energy, lighting, precise highlights |
| Nebula pink | `#F17E98` | Personality and creative expressiveness |
| Solar coral | `#FFAA6A` | Warm narrative transitions and contrast |
| Warm ivory | `#F0DABF` | Approachable, luminous closing areas |
| Soft white | `#F6F4FA` | High-readability typography |

**Opening variation:** Loader almost black `#03070E`, cyan-blue energy `#73DFFF`; colorful hero emerges behind shutters. Aim to have some bright/light/airy narrative beats later rather than one endless black void.

**Typography:** Unbounded for prominent name/title cards (initial candidate; typically 700–800), Geist for content/UI, Geist Mono sparingly for technical labels. Allow one additional editorial accent font only after controlled visual experiments. No giant blocks of stylized display type obscuring readability.

**Texture/material:** Sculptural, premium, varied. Prioritize interesting silhouettes, real depth, controlled reflectivity, polished color grading. Don't substitute bloom, heavy blur, lots of floating dots or generic glass panels for art direction.

**Composition:** Clear hierarchy, comfortable negative space, layered depth, asymmetric yet balanced cinematography. Responsive layouts should be recomposed rather than simply shrunk.

**UI:** Minimal floating identity/menu/chapter index; skip-story/direct-to-projects links for recruiters; accessible project detail panels; tasteful focus, hover and scroll prompts.

## 8. Architecture and interaction constraints

**Recommended base:** Next.js App Router + TypeScript + Tailwind; React Three Fiber / Three.js for visual world; GSAP ScrollTrigger for story direction; Blender offline for original assets. Choose libraries by necessity, not trends. Avoid adding Lenis by default—native scrolling is preferred unless there is a compelling demonstrated benefit.

**System boundaries:**

- `StoryDirector`: the single normalized, deterministic scroll-progress owner; maps progress to all chapter states.
- `WorldRenderer`: one persistent canvas where practical; time-based idle motion separate from scroll state.
- `CameraDirector`: smooth, art-directed spatial camera paths and transitions; reversible.
- `ChapterScenes`: independently maintainable worlds, constrained to agreed enter/hold/exit states; unload/unmount heavy resources safely.
- `DOMStoryLayer`: real HTML text, photos, semantics, links, project/case-study interactions and accessible navigation.
- `QualityController`: DPR/LOD/particle/material/geometry budgets by device capabilities and measured frame times; avoid naive hardware detection.
- `LoaderDirector`: readiness, presentation and Explore interaction; hands off visual continuity without competing with scroll director.
- `Content`: data/config model for truthful professional facts, case studies and visibly marked placeholders.

**Continuous scroll definition:** One perceived cinematic camera/story movement, not necessarily one literally unbroken 3D scene containing the entire site. Stage environments and transitions economically. Scroll is based on document position, not wheel events. Native wheel, trackpad, touch, and keyboard work; reverses exact states. Avoid 7-wheel-step full-journey rush, abrupt snaps, and 400vh of empty pinning purely for spectacle.

**Animation rules:** Stable resting shots; readable holds; avoid camera sickness, uncontrolled overlays, scroll-position drift, dual controllers modifying same property. Chapter transitions should have deliberate ease and spatial logic. For reduced motion, content remains complete and clearly ordered without the cinematic animations.

**Performance:** Mobile-first fallbacks, lazy asset loading, offline texture baking, compressed GLB/KTX2 when appropriate, instancing where beneficial, cap DPR, prevent per-frame React state churn, pause inactive scenes, avoid excessive fullscreen postprocessing. Measure real FPS/frame pacing on hardware later, not just draw-call count.

**Accessibility:** Semantic headings, visible navigation, keyboard focus, screen reader-friendly loading status and skips, clear color contrast, touch-sized controls, no gesture-only content. Direct links to case studies and project list must remain functional with WebGL off.

**SEO:** Proper server-rendered identity/project content, titles, description, OG metadata, linkable case studies, accessible DOM copy. SEO cannot rely on canvas-rendered text.

## 9. Suggested folder organization (flexible, not mandatory)

```text
portfolio-v2/
├── app/                       # routes/layout/global styles
├── components/
│   ├── loader/                # core, progress, split curtain, Explore
│   ├── typography/
│   ├── navigation/
│   └── ui/
├── experience/
│   ├── director/              # story progress, camera, intro ownership
│   ├── world/                 # persistent renderer, lights, materials
│   ├── chapters/              # origin, curiosity, engineering, etc.
│   ├── transitions/
│   └── shaders/
├── content/                   # verified facts, projects, placeholders
├── public/
│   ├── models/
│   ├── textures/
│   ├── photos/                # real photos supplied later
│   └── project-media/
├── docs/
│   ├── PORTFOLIO_V2_CREATIVE_MASTER_PLAN.md
│   └── abhishyanth-vemula-profile.md
└── references/                # moodboards or licensed/owned references
```

Avoid experimental/lab routes in the initial production app. If a visual proof is needed, isolate it in a temporary dev-only mechanism and remove it after approval.

## 10. Incremental development roadmap — one milestone at a time

| Milestone | Build | Stop / approval gate |
|---|---|---|
| **001: The Origin** | Fresh framework, design tokens, original electric-blue energy-heart preloader, honest loading, Explore, horizontal split, colorful 3D hero, initial scroll reaction | Approve first-load/reload, full recording and responsive hero before any next chapter |
| **002: Hero Polish** | Refine scene composition, typography, visual energy continuity, mobile quality, camera/scroll pacing | Lock visual language; don't redesign loader indefinitely |
| **003: Curiosity → Engineering** | First meaningful two-world continuous transition, intro content and Nestafar/technical identity | Demonstrate true reversible story choreography |
| **003.5: Meet the Human** | Personal introduction between hero and Curiosity; robot-operated holographic photo gallery (reusable, one memorable moment); Curiosity first-viewport refinement | Gallery controls, reversal and mobile recomposition verified |
| **004: Intelligence → Expression** | AI network world, playful/colorful creative world, personal photo placeholders, skills and personality | Show cohesive narrative rather than disconnected 3D tricks |
| **005: Project Universe** | Six project artifacts, featured WiniOS, readable expandable/linkable case studies | Verify factual copy and navigation without 3D |
| **006: Closing + Optional Easter Egg** | Optimistic contact scene, social links, skip/direct-access navigation, optional post-credits interaction | Full narrative closes meaningfully |
| **007: Final production pass** | Device QA, image assets, performance, reduced motion, accessibility, SEO, fallback, analytics/privacy if chosen, deployment | Launch readiness. Built: skip links (projects, contact), Person JSON-LD, metadataBase via `NEXT_PUBLIC_SITE_URL`, sitemap, robots, generated OG image, per-case-study metadata, themed 404, README with deploy steps. No analytics (none chosen). Real-hardware frame-pacing measurement still to do on device |

**Every milestone:** Implement actual code, inspect at desktop/tablet/390/320, validate behavior, run lint/typecheck/build, present concise findings and visual proof. Don't ask to implement several future milestones at once.

## 11. First Claude Code instruction (short reusable launch prompt)

> Read `docs/PORTFOLIO_V2_CREATIVE_MASTER_PLAN.md` and `docs/abhishyanth-vemula-profile.md` first. Implement **Milestone 001 — The Origin** only, following the approved design, architecture and acceptance criteria. Use installed UI/UX/motion skills selectively. Build the actual preloader → Explore → split reveal → cinematic hero, not just scaffolding; keep downstream chapters unbuilt. Validate responsiveness, accessibility, reload, reduced motion, lint/typecheck/build, and provide concise visual results. Stop after 001.

For later milestones, replace `001 — The Origin` with the requested milestone number and name. Keep the master plan as stable context instead of pasting its entire contents every time.

## 12. Open creative placeholders / user-provided assets

- `[PERSONAL ORIGIN ANECDOTE]`: why and when curiosity about tech/design began.
- `[HERO TAGLINE]`: short original statement, to approve.
- `[PHOTO PLACEHOLDER 01–04]`: Meet the Human gallery slots (portrait, at the desk, off the clock, out there); edit `content/gallery.ts` and add files under `public/photos/`.
- `[PERSONAL ANECDOTE]`: Meet the Human, in Abhishyanth's words. Not shown until supplied (README "Still to supply").
- `[PROJECT SCREENSHOTS / RECORDINGS]`: for all projects; user-owned assets.
- `[PROJECT LINKS / REPOS / DEMOS]`: verify before publishing.
- `[WINIOS VERIFIED RELEASE/STATUS AND ROLE]`: verify from latest source.
- `[PROJECT ROLES / IMPACT]`: no unsupported attribution or metrics.
- `[CV LINK]`: unavailable in source document. The CV link is hidden until supplied.
- `[ADDITIONAL QUOTES/EASTER EGGS]`: select later, sparingly and with attribution.
- `[TIMELINE NEXUS PLACEMENT + STRAND DATES]`: future chapter (see §3); confirm placement and any dates not in the profile.

---

**Creative North Star:** *Build an original cinematic universe about a real person who makes software, explores intelligence and cares how things look and feel. Every color, object, camera move and interaction should advance that story.*
