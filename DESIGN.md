---
name: Abhishyanth Vemula — Portfolio V2
description: One continuous cinematic journey carried by a living signal of electric-blue light.
colors:
  loader-black: "#03070E"
  space-navy: "#111528"
  panel-navy: "#0A0E1F"
  core-energy: "#73DFFF"
  ion-cyan: "#56DCE0"
  electric-blue: "#3478F6"
  hologram-blue: "#3880FF"
  hologram-violet: "#9475FF"
  cosmic-violet: "#6750C8"
  nebula-pink: "#F17E98"
  solar-coral: "#FFAA6A"
  warm-ivory: "#F0DABF"
  soft-white: "#F6F4FA"
  ink-tinted: "#DCE3FF"
  ink-muted: "#A9B8D6"
typography:
  display:
    fontFamily: "Unbounded, sans-serif"
    fontSize: "clamp(1.5rem, 7.6vw, 5rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Unbounded, sans-serif"
    fontSize: "clamp(1.75rem, 1rem + 3vw, 3.25rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(0.95rem, 0.6rem + 0.95vw, 1.25rem)"
    fontWeight: 500
    lineHeight: 1.55
    letterSpacing: "0.005em"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Geist Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.2em"
  action:
    fontFamily: "Unbounded, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.24em"
rounded:
  hairline: "2px"
  pill: "999px"
spacing:
  gutter: "clamp(1rem, 5vw, 6.5rem)"
  core: "min(260px, 62vw, 40svh)"
  touch: "44px"
components:
  button-explore:
    backgroundColor: "rgb(115 223 255 / 0.07)"
    textColor: "#EAFBFF"
    typography: "{typography.action}"
    rounded: "{rounded.hairline}"
    padding: "0.85rem 1.35rem 0.85rem 1.6rem"
    height: "48px"
  button-explore-hover:
    backgroundColor: "rgb(115 223 255 / 0.16)"
    textColor: "#EAFBFF"
  button-index:
    backgroundColor: "rgb(9 12 28 / 0.6)"
    textColor: "{colors.soft-white}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.6rem 1.05rem"
    height: "{spacing.touch}"
  button-index-hover:
    backgroundColor: "rgb(9 12 28 / 0.85)"
  link-quiet:
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    height: "{spacing.touch}"
  link-quiet-hover:
    textColor: "{colors.soft-white}"
  index-panel:
    backgroundColor: "{colors.panel-navy}"
    textColor: "{colors.soft-white}"
    width: "min(25rem, 100vw)"
---

# Design System: Abhishyanth Vemula — Portfolio V2

## Overview

**Creative North Star: "The Living Signal"**

The whole system is one current of light that changes form between worlds. It begins as an engineered energy heart on near-black, splits open into a colourful dimensional space, becomes the AI core of a holographic workspace, and travels on into each chapter. Every colour, surface and motion either is the signal, is lit by it, or makes room for it. When a design choice cannot say how it relates to the signal, it probably does not belong.

The mood is cinematic, precise and optimistic: title-sequence staging, engineered micro-detail, and a palette that starts nocturnal and warms as the story moves toward its close. Density is deliberately uneven: the 3D world may be rich and layered, while the DOM interface stays sparse, quiet and instrument-grade so the person's name and the work always lead. The world is original; Marvel/JARVIS influence is energy and spectacle, never copied props, reactor geometry, logos or HUD layouts. Generic SaaS layouts, glass dashboards, noisy particle fields and a lone glowing sphere on black are rejected.

**Key Characteristics:**
- One continuous signal of electric-blue/cyan light connects every scene.
- Rich 3D world, quiet DOM: real HTML typography over a single WebGL canvas.
- Depth from light and space, never from drop shadows.
- Hairline, instrument-grade controls with mono labels and cyan focus.
- Navy depth first; violet as a controlled highlight; warmth reserved for later chapters.

## Colors

A night-sky foundation lit from within by cyan energy, with violet held back as highlight and warm hues saved for the story's later beats.

### Primary
- **Core Energy** (#73DFFF): the signal itself. Loader heart, holographic line work, progress fill, focus rings, text selection, the Explore border. The single most recognisable colour in the system.
- **Ion Cyan** (#56DCE0): secondary energy tone in backdrop wisps and lighting; never for text.

### Secondary
- **Electric Blue** (#3478F6): digital-world fields, rim light on the physical core, cobalt currents in the backdrop.
- **Hologram Blue** (#3880FF): structural data lines (network edges, leader lines) under Core Energy highlights.

### Tertiary
- **Cosmic Violet** (#6750C8): dimensional fields and the Curiosity world the hero scrolls into.
- **Hologram Violet** (#9475FF): accent strokes on instruments, network pulses, emitter arcs. Highlight only.
- **Nebula Pink** (#F17E98), **Solar Coral** (#FFAA6A), **Warm Ivory** (#F0DABF): reserved warmth. In the Origin they appear only as a trace (the tagline's ivory tint, a faint horizon glow); they lead later chapters.

### Neutral
- **Loader Black** (#03070E): page background, loader panels, canvas clear colour.
- **Space Navy** (#111528): atmospheric shadow foundation and fog colour.
- **Panel Navy** (#0A0E1F): solid DOM surfaces such as the Index panel.
- **Soft White** (#F6F4FA): display and primary text.
- **Ink Tinted** (#DCE3FF): secondary copy on cobalt/violet fields (identity stack, work lines).
- **Ink Muted** (#A9B8D6): quiet controls and inactive states (Skip intro, Close, upcoming chapters, work metadata).

### Named Rules
**The Signal Colour Rule.** Core Energy marks the signal and interaction (focus, selection, primary action, live data). It is never used as a large flat fill or for body text.

**The Held Warmth Rule.** Pink, coral and ivory stay below a trace in the Origin hero. Warm colour is a narrative reward for later chapters, not decoration.

**The Tinted Ink Rule.** Secondary text on coloured fields is tinted from the field's hue (Ink Tinted, Ink Muted), never neutral gray.

## Typography

**Display Font:** Unbounded (with sans-serif)
**Body Font:** Geist (with system-ui, sans-serif)
**Label/Mono Font:** Geist Mono (with monospace)

**Character:** A wide, engineered display face for the name and chapter titles, carried by a calm contemporary sans; mono appears only for labels, counts and technical status.

### Hierarchy
- **Display** (800, clamp(1.5rem, 8.4vw, 4.5rem), 0.95): the name only, uppercase, split into masked lines for the entrance. Fits 320px viewports.
- **Headline** (700, clamp(1.75rem, 1rem + 3vw, 3.25rem), 1): chapter titles such as Curiosity.
- **Title** (700 Unbounded, clamp(1rem, 0.62rem + 1.25vw, 1.6rem), 1.02, uppercase): the identity stack (DEVELOPER. ENGINEER. CREATOR. GAMER.), four masked lines with Core Energy full stops, set beside the tagline. Each word arrives as corrupted signal (re-rolling glyphs, chromatic slices) and decodes left to right on hover, tap, first Tab, or automatically on touch screens; screen readers and reduced motion always get the plain words.
- **Body** (400, 1rem–1.125rem, 1.5): tagline and chapter copy; tagline capped at 30ch beside the identity stack.
- **Label** (400, 0.6875–0.75rem, 0.2em tracking, uppercase): identity mark, status words, Index, Skip intro, Scroll cue.
- **Action** (600 Unbounded, 0.75–0.78rem, 0.22–0.24em, uppercase): Explore and the threshold's primary action.

### Named Rules
**The Name Wins Rule.** Nothing on screen, in DOM or WebGL, may compete with the display name. Holographic elements sit on the far side of the frame or behind a readability scrim. On wide layouts the camera measures the copy's right edge and frames the core so its outer ring stays clear of it.

**The Honest Mono Rule.** Geist Mono is for status, counts and labels, not as a costume for "technical" prose.

## Layout

The page is native document scroll over one fixed, full-viewport canvas. DOM sections are real HTML laid over it: the Origin hero is one viewport tall (100svh) and the threshold beat 150svh, so scroll distance stays short and reversible with no pinning.

Horizontal rhythm comes from one fluid gutter (clamp(1rem, 5vw, 6.5rem)). On landscape screens the name sits left and vertically centred while the 3D core and instruments occupy the right ~45% of the frame. On portrait or narrow screens (max-aspect-ratio 4/5 or ≤640px) the layout recomposes rather than shrinks: the core moves to the upper half, the name anchors to the bottom above the scroll cue, the identity stack sits beside the tagline (stacked below 360px), the core assembly scales to 0.6, and the top-bar sub-label and Index label hide. Touch targets are at least 44px (48px for Explore). The loader core is sized min(260px, 62vw, 40svh) and its centre is always the exact viewport centre, because the split seam and the 3D camera match against it.

## Elevation & Depth

This system uses no drop shadows on interface elements. Depth comes from real 3D space (a single perspective camera at 40° FOV, fog from Space Navy), additive light (holographic line work, glow billboards, emitter cones) and layered occlusion between foreground instruments, the core and the far backdrop. On the DOM side, depth is a readability scrim: a directional navy gradient behind the name (left-to-right on landscape, bottom-up on portrait) plus a soft vignette. Glows exist only where energy is literally present: the loader seam and the panel cut edges carry a cyan light, never a card.

### Named Rules
**The Light, Not Shadow Rule.** If something needs to feel closer, move it in space or light it; never add a box-shadow. Zero-offset glows are reserved for energy (seam, core, signal).

## Shapes

Forms are engineered and mostly sharp. Controls use a hairline 2px corner (Explore) or a full pill (Index); panels are square-edged. The recurring silhouettes are the faceted rhombus heart, concentric orbit rings with ticks and gaps (radii in the ratio 52 : 78 : 96), and rectangular projection panes with corner brackets. Rings and arcs are always segmented, never plain closed circles.

## Components

### Buttons
Instrument-grade and quiet: thin borders, little fill, a clear focus ring.
- **Shape:** hairline corners (2px) for Explore; full pill (999px) for Index.
- **Explore (primary):** Core Energy border at 50% over a 7% energy wash, Unbounded 600 uppercase label with an arrow icon; 48px min-height. Hidden and disabled until real readiness.
- **Hover / Focus:** fill rises to 16% and the border to full Core Energy; the arrow shifts 3px. Focus is a 2px Core Energy outline at 4px offset. Active scales to 0.98.
- **Index (secondary):** Panel-navy pill at 60% with a 20% soft-white border; hover deepens the fill and turns the border Core Energy.
- **Quiet links (Skip intro, Close):** Ink Muted mono labels with an offset underline; hover to Soft White.

### Cursor
On fine pointers only: a hollow 22px electric-blue ring with a faint energy glow that follows with a short damped lag, plus a hair-line light trail (blue sheath, pale core) that tapers and fades within ~0.4s. Over interactive elements the ring widens and takes a 6% energy fill; on press it contracts. Touch keeps native behaviour, reduced motion drops lag and trail, and the native cursor returns while a modal dialog is open.

### Navigation
- **Top bar:** fixed, transparent; left the identity mark ("AV / Personal system", mono, cyan slash), right Work and Contact (quiet mono buttons) and the Index pill. All three open the index panel at their section. Hidden during the loader; fades in after the name lands.
- **Index panel:** native modal dialog sliding from the right, Panel Navy, in three sections: Work (WiniOS featured in Core Energy, five projects and the Nestafar internship, each with one verified line and a mono stack), Contact (email first, then LinkedIn, GitHub, Instagram) and Story (live chapters as links, upcoming chapters as one line). No unfinished project pages.

### Energy Core Loader (signature)
An SVG rhombus heart (each moving ring its own compositor layer, so it keeps turning while the scene compiles) inside three engineered rings (r 52 / 78 / 96 of a 240 viewBox): ticks, a split orbit with a circulating current, and a three-arc inner frame. It breathes rather than spins. Beneath it, a three-segment hairline progress bar fills only as real checks complete (interface, typefaces, scene), with an indeterminate glint on the pending step. On Explore the loader pulses once, lights a horizontal seam and opens in two halves, cutting the core at the seam.

### Holographic Workspace (signature)
The hero's 3D world: the same rhombus heart, now physical and iridescent, inside a fresnel glass shell, two counter-rotating wireframe lattices and the loader's three rings rebuilt in 3D (they match the SVG exactly at the split, then unfold). Around it, three glass callouts with one fact each (CGPA and degree, Best Team Member at the NIAT Student General Council, and the Django · React · Python stack; two on portrait), drawn from content/site.ts into canvas textures, with frames, corner brackets, scanlines and a slow glint; leader lines tie each to the core. Project and experience detail lives in the Work index, not the hero. Callouts darken what sits behind them so their type stays legible. During the split only the heart is lit; once the name lands the hologram ignites with a projector stutter, in order: emitter, rings, shell, lattices, network, then callouts. A sparse data network, an emitter disc with a soft light cone and a faint spatial grid complete it. Panes open from their centre line and wipe in after Explore, and fold away as scroll moves on to the next world.

### Meet the Human: Robot-Operated Gallery (Milestone 003.5, signature)
A warm beat between the hero and Curiosity: lavender dusk, pale cyan highlights and a single peach title line ("There's a human."), the only warm type on the site so far. Real HTML copy on the left (Unbounded 700 title, 54ch body, a mono-term trait grid, a visible anecdote placeholder); on the right, 3–4 holographic photo frames that are objects in space: the active frame comes forward, sharp and edge-lit cyan → violet; neighbours recede, turn toward the centre, drop and cool. Frames reveal in holographic scan bands as the signal arrives.
- **The robot:** an original small turret arm (ceramic shell, graphite joints, a cyan lens head, two soft fingers) on a peach-lit pad. Each swipe is one planned hand path: anticipation (it draws back), approach, a beat of hesitation with a head tilt, contact, a controlled push, follow-through and a clean settle. Two-bone IK feeds lightly underdamped joint springs on a fixed 240 Hz clock (base slowest, wrist quickest), so motion is frame-rate independent and lands with a small overshoot. While in contact the card is moved by the robot's actual fingertip, then glides on with its own momentum. Idle: breathing, drifting, an occasional head tilt. Phones and low-power devices skip the hesitation.
- **Ownership:** scroll reveals and dismisses; the gallery store owns index, drag, the robot's action and autoplay; one frame loop owns the displayed position. Scrolling backward never resets the photo.
- **Autoplay:** always on, like a standard carousel: every 5 s the robot performs the same swipe (about 1.35 s; 1.05 s on phones). Manual arrows, keys and swipes run alongside it and simply restart the interval. It only waits while dragging, while the Index is open, off-stage, in hidden tabs and under reduced motion (where it is off). A hairline timer under the counter shows the next swipe. The caption block has a fixed height so the controls never move between photos.
- **Composition:** frames on an arc; the active one forward with corner brackets, a soft bloom and a back-light; neighbours fan out, turn in, cool and show fine scanlines; a faint projector ring below.
- **Stage:** a native `position: sticky` hold (one memorable moment, then it lets go). Drag/swipe (`touch-action: pan-y`), arrow keys on the focused stage, Previous/Next buttons, a polite live caption. No-WebGL shows the current slot as a card. Photos and metadata live in `content/gallery.ts`.

### Chapter Worlds: Curiosity and Engineering (Milestone 003)
One canvas, one camera path. Document position maps to a chapter track (0 hero, 1 Meet the Human, 2 Curiosity's title at 30% of the viewport, 3 Engineering, 4 Intelligence's title at 30% of the viewport, 4.75 Intelligence's last lines, 6 Project Universe's title) measured from the DOM, so every state is exact in both scroll directions; a lens shift (not a camera turn) leaves room for each chapter's copy (subject right in Curiosity, left in Engineering, upward on portrait, with an extra pull-back).
- **Curiosity (atmospheric):** violet, cobalt and pale mist. The living signal arrives over an additive contour landscape (a slow ping ring keeps travelling out from where it lands) and splits into six exploratory branches; four end in discoveries sketched edge by edge (knot, icosahedron, dodecahedron, torus), two simply fade. Fog closes in and lightens.
- **Engineering (constructed):** deep clear blue, cyan edges, a precise centred floor grid and survey lines in the sky. Scattered pieces settle bottom-up into a three-tier system (data, services, client); the service tier's front row is the Nestafar pattern, agent → tool → API → live data, with mono world labels and data pulses on the pathways. Solid, edge-lit volumes, not glass.
- **Copy layer:** real HTML. Chapter title (Unbounded 700) with a mono meta line below it, never an eyebrow; a display lead; body at 62ch; Curiosity's questions on rhombus markers; Engineering's spec sheet (mono term, prose detail) and the Nestafar proof block with an HTML flow diagram. Each line owns one scrubbed enter/read/leave timeline. A soft radial veil (a linear band on portrait) sits behind copy instead of a card. Curiosity opens with title, lead and first paragraph beside the revealed world in one viewport; the second paragraph, questions and the origin-anecdote placeholder unfold below.
- **Fallbacks:** reduced motion cuts the camera between chapter holds and shows copy statically; no-WebGL swaps the CSS fallback's colour story per chapter.

### Chapter World: Intelligence and the turn to Project Universe (Milestone 004, revised 2026-11-14)
One continuous, scroll-scrubbed transformation of the Engineering structure, with no scene cut: architecture, then intelligent network, then flexible connections that carry the story into Project Universe. A single ribbon system and a single node system carry it, driven by one flex value, so every intermediate state is a real in-between and reverses exactly.
- **Intelligence (living network):** indigo depth with luminous cyan and purple currents. The Engineering modules lift out of their tiers and fly to network positions, where they become bright cores; thin precise connections draw on between them. The labelled nodes tell the real request path from the Nestafar work: Intent, Agent, LLM, Tool call, Internal API, Live data, Retrieval, Result. One request packet walks that path while pulses travel every connection. The node nearest the pointer answers by growing. Copy: lead, body, an ordered five-step "How an agent request travels" list (mono step, prose detail) and a "currently exploring" note.
- **Transition (no chapter, no copy):** Expression was removed on 2026-11-14. As Intelligence's last lines leave (track 4.75), the same connections widen into tapered, breathing ribbons in the warm palette and the cores swell into soft forms while the backdrop warms to violet; the camera passes the loosened network and turns toward the exhibition hall, where the living signal picks up and leads into Project Universe (track 6). No words, voxels or reticle remain.
- **Composition:** copy start-side in Intelligence (world right); the lens holds the subject right through the transition into Project Universe. Portrait keeps the world above and around a linear veil.

### Project Universe (Milestone 005, refined 2026-11-14)
A dark exhibition hall (`#121433` fog). **Establishing shot (track 6):** the title "Project Universe", "Six builds. Six worlds. One way of working.", the hall atmosphere and a restrained living signal (45% intensity), a mono "Scroll to enter the first world" cue with a travelling light in a 1px rail, and no project geometry at all. **Progressive reveal (2026-11-14):** the camera holds on one artifact per half track unit (6.5 WiniOS … 9.0 Scholaroid); each arrives with its exhibit title at 30% of the viewport (50% on portrait). An artifact exists only in its own interval: it materialises from key − 0.30 to key − 0.06 (rises 1.2 units, scales 84% → 100%, untwists 0.5 rad, a horizontal projection plane in its accent sweeps up through it, its screens and cards draw on top-down), holds, then deconstructs from key + 0.08 to key + 0.30 (lifts, grows 7%, turns away, the plane sweeps down) while the next begins at its key − 0.30, so handoffs overlap by 0.1 track. Hidden artifacts are `visible = false` (not just transparent) and skip their per-frame work; all materials are precompiled at load, so nothing mounts or compiles on a scroll boundary. Artifacts combine three materials: **satin bodies** (dark base, coloured fresnel rim, faint top light, normal blending, so devices have mass), **canvas surfaces** (screens, cards, paper; `universeTextures.ts`, original generic UI, fictional data marked SAMPLE) and **additive light** (currents, rings, glows).
- **WiniOS, The Bridge (featured, 1.25×):** an original laptop (rounded slab base, keyboard, hinged lid showing the WiniOS Settings window and a centred taskbar) and an iPhone-style phone (rounded body, island, a Shortcuts-like tile grid), joined by an arched current with a halo through a double TLS ring; ambient packets keep the link alive both ways. **Send** alternates direction (PC → iPhone, then iPhone → PC): the source screen shows "Sending…", a sealed clipboard card (text, then image) crosses the bridge and flares the ring, the destination shows "Received" and an emerald acknowledgement ripple. No manufacturer marks or OS screenshots.
- **JobSeek, The Navigator (amber):** a candidate profile card with skills, four opening cards, matching lines that sweep the openings and lock on the best fit (which turns into "Strong match · Applied"), and SeekBot, a small agent orb whose answer card shows the best fit and a skill gap.
- **IRIS, The Vision (mint):** a sample receipt (Demo Mart, marked SAMPLE) with a moving OCR line that tints read text; vendor, date, items, tax and total lift into a record frame; a mint "Arithmetic checks out" chip closes the cycle.
- **ELI5, The Translator (pink→violet):** the knot above a dense technical paragraph; "Explain it like I'm five" relaxes the knot and crossfades the paragraph into one plain sentence.
- **QP-Gen, The Architect (periwinkle):** three chapter cards (one selected), question modules with their marks flying into a sample CBSE-pattern paper that reveals section by section (scroll-owned).
- **Scholaroid, The Ecosystem (coral):** a school building on a round plinth with a campus ring, four role dashboards (Admin, Teacher, Student, Parent) on pads, arcs from school to roles and cross-role flows (teacher → parent, admin → student).
- **Living signal, reborn:** leaves the loosened Intelligence network, threads every artifact and runs on into the Timeline Nexus.

### Case studies (refined 2026-11-14)
- **In-universe layer:** opening an exhibit's "View case study" keeps the universe mounted: the chosen artifact stays lit, every other artifact and the signal recede, story copy and top bar fade, the camera pushes in (24%) and the lens moves the artifact up and right; then the intercepted route `app/@modal/(.)work/[slug]` renders the case as a fixed, scrollable layer whose background is clear at the top (the live artifact is the hero) and deep night below. Close (button, Escape or browser Back) reverses all of it and returns focus to the opener at the exact scroll position. Next case inside the layer replaces the history entry.
- **Standalone page:** direct visits and refreshes render `app/work/[slug]/page.tsx`: same editorial body, with an original orbit plate (accent rings, one node per architecture step) instead of the live artifact; "Back to the universe" lands on the project's exhibit and never replays the loader.
- **Editorial body:** mono meta, display title (800, up to 7.5rem), idea in the display face, facts (Year, Status), stack pills; numbered sections with a 15rem mono label column; an architecture strip from documented components only; a Links section only when a link exists; Next. Role, decisions, screenshots and links are omitted until supplied (2026-11-14), never shown as raw placeholders.

### Timeline Nexus (Chapter 05, refined 2026-11-14)
Deep jade night, five rope strands converging on the present (unchanged). The milestone nearest the reading line (55% of the viewport), or the hovered/focused one, is active: its whole strand brightens (×1.7) while others step back (×0.4), a spark runs from the event along its strand into the present, and major events (degree, internship, council, WiniOS) make the core glow brighter. In the list, the active item gets a strand-coloured gradient and a lit 2px rule. Events carry an optional detail line and evidence chips (thumbnail + label) that open the shared viewer. Facts: Grade 10 (2022), Intermediate (2024, 8.3 CGPA), B.Tech (2024–present), UI/UX Mega Workshop (Dec 2024), Scholaroid (2025), INSPIRA'25 (participation), Nestafar AI backend development internship (Jan–Mar 2026, certificate issued 10 Apr 2026), the 2026 builds, the NSGC council + Best Team Member Award (one event, two photos), WiniOS (2026).

### Evidence viewer (shared)
A native modal `<dialog>`: backdrop blurs to 86% night, the frame rises 14px and scales from 0.975. Kind label (Document / Photograph, n / total), Close with an Esc hint, the image at its natural aspect ratio (max height viewport − 15rem), title, the document's own statement as caption, Open original / Download (PDF and original images), arrow keys between photos. Focus goes to Close and returns to the opener; the page scroll never moves.

### Next Chapter and end card (Chapter 06, refined 2026-11-14)
- **Environment:** a dimensional dawn rather than a white-out: deep indigo above, lavender air, a gold-coral horizon band with a crisp light line, warm haze below. The light source has form: a gold halo (0.42 intensity) with a smaller ivory heart, three gateway arcs (lavender, gold, coral) that grow in as the visitor arrives, a horizon band and warm motes rising from the converged threads. Four coloured paths still rise from the nexus.
- **Copy:** display title (800), peach lead, availability line, the email as the primary action, See the work, "Stay for the post-credits scene ↓", then LinkedIn, GitHub and Instagram (a CV link appears once supplied).
- **End card:** a full-viewport section after a short gap. When 55% visible: the section dims to near-black and `story.finale` lowers the sky (−88%) and withdraws the paths; at 1.4s the meta line "Thank you for exploring my universe" fades in over 1.8s; from 3.2s "Abhishyanth Vemula will return." rises word by word through a mask (clip-path inset 100% → 0, 0.45em rise, 6px blur → 0, 2.2s each, 0.42s apart); the Hyprland punchline lands last at 7.6s; Replay and Back to the beginning at 9.4s. The title is one line from 760px up (`nowrap`, 3.4vw, capped at 4.6rem) and wraps on phones without overflow. Scrolling away resets it. Reduced motion shows the card without choreography.

### Production layer (Milestone 007)
- **Skip links:** "Skip to projects" and "Skip to contact" sit first in the top bar, invisible until focused, then a Panel Navy pill with a Core Energy border.
- **404:** the case-study hero layout with one multiverse line ("This branch does not exist.") and two ways back.
- **Social card:** generated at `/opengraph-image` from the hero's navy-to-violet field, the four-word identity in Core Energy and the name in the display weight.

### Personality Layer (Milestone 004A)
Fandom is a personal layer, never the identity. Rules and the full list live in the master plan §6.1–6.2. Later chapters add: Project Universe's "No cave, no box of scraps" WiniOS aside (Tony Stark nod, original wording), the Timeline Nexus Loki line, and the post-credits end card.
- **Movie line (component):** `figure.movie-line`: a lead-in sentence in Abhishyanth's voice (body, muted), the quote in the display face (600, 1.05–1.3rem, soft white), and no visible attribution (character and film stay in content and in screen-reader text, 2026-11-14). A 1px Core Energy rule on the left at 45%, no card or background. Intelligence's variant warms the rule to gold to match the Result node. One per chapter at most: Engineering (Steve Rogers) and Intelligence (J.A.R.V.I.S.) only.
- **Aside:** `.chapter-aside`, italic body in tinted ink, for original microcopy nods (Curiosity's 14,000,605 futures, WiniOS's box of scraps).
- **Visual nods:** colour and light on original geometry only. Curiosity's ping ring gains an amber leading edge with travelling glints (dimensional sparks against the violet field); Intelligence's Result node holds a breathing gold core inside its cyan rim.
- **Easter egg:** five manual gallery steps within 2.5 s swap the gallery hint to "Easy. He's a helper bot, not a speedrunner." in peach for about 4 s (shown on phones too, where the hint is otherwise hidden).

## Do's and Don'ts

### Do:
- **Do** keep the signal continuous: every new scene should receive the light from the previous one and hand it on.
- **Do** use Core Energy (#73DFFF) for focus rings, selection, the primary action and live energy.
- **Do** keep the name in real HTML at display size, with a scrim behind it whenever a scene sits beside it.
- **Do** recompose layouts for portrait instead of shrinking the landscape frame.
- **Do** give every holographic element an assembly state and a scroll-out state; both must reverse exactly.
- **Do** ship a reduced-motion path that shows the fully composed hero without camera travel.

### Don't:
- **Don't** use drop shadows, generic glass cards or blurred panels on the interface.
- **Don't** copy Marvel/Stark props, reactor geometry, helmets, logos or HUD layouts.
- **Don't** let instruments or rings cross in front of the name on landscape layouts.
- **Don't** fill large areas with Core Energy or set body text in it.
- **Don't** add eyebrow labels above headings or fake percentages to progress.
- **Don't** use Geist Mono for prose, or Unbounded for body copy.
- **Don't** use more than one MCU line per chapter, put a quote in a heading, or reproduce Marvel props, emblems, portals or interfaces as visual nods.
