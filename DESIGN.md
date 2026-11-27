---
name: Abhishyanth Vemula — Portfolio V2
description: One continuous cinematic journey on warm ink, carried by a single burnished-copper signal.
colors:
  ink: "#0F0E0C"
  ink-ground: "#15120F"
  panel: "#1A1815"
  bone: "#ECE6DA"
  paper: "#F4EFE6"
  ink-tinted: "#DDD5C8"
  ink-muted: "#A39A8D"
  signal-copper: "#C8794A"
  clay: "#8E5A46"
  slate: "#6F7A80"
  brass: "#C49A55"
  olive: "#7D8460"
typography:
  display:
    fontFamily: "Big Shoulders, sans-serif"
    fontSize: "clamp(4.25rem, 16.4vw, 26rem)"
    fontWeight: 900
    lineHeight: 0.8
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Big Shoulders, sans-serif"
    fontSize: "clamp(3.25rem, 1.2rem + 8vw, 8rem)"
    fontWeight: 800
    lineHeight: 0.88
    letterSpacing: "-0.005em"
  title:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "clamp(0.95rem, 0.6rem + 0.95vw, 1.25rem)"
    fontWeight: 500
    lineHeight: 1.55
    letterSpacing: "0.005em"
  body:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.08em"
  action:
    fontFamily: "IBM Plex Sans, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.005em"
  editorial:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "clamp(1.45rem, 1.05rem + 1.35vw, 2.15rem)"
    fontWeight: 400
    lineHeight: 1.16
rounded:
  hairline: "2px"
  pill: "999px"
spacing:
  gutter: "clamp(1rem, 5vw, 6.5rem)"
  signature: "min(30rem, 80vw)"
  touch: "44px"
components:
  button-primary:
    backgroundColor: "{colors.bone}"
    textColor: "{colors.ink}"
    typography: "{typography.action}"
    rounded: "{rounded.pill}"
    padding: "0.7rem 1.15rem 0.7rem 1.3rem"
    height: "46px"
  button-primary-hover:
    backgroundColor: "{colors.signal-copper}"
    textColor: "{colors.paper}"
  button-index:
    backgroundColor: "rgb(15 11 7 / 0.62)"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0.55rem 1rem 0.55rem 0.7rem"
    height: "{spacing.touch}"
  button-index-hover:
    backgroundColor: "rgb(20 15 11 / 0.88)"
  link-quiet:
    textColor: "{colors.ink-muted}"
    typography: "{typography.body}"
    height: "{spacing.touch}"
  link-quiet-hover:
    textColor: "{colors.paper}"
  index-panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.paper}"
    width: "min(25rem, 100vw)"
---

# Design System: Abhishyanth Vemula — Portfolio V2

## Art direction (corrected 2026-11-15; palette replaced 2026-11-25)

> **Palette note (2026-11-25).** The chapter colours named in this section (navy, holographic cyan, violet haze, cobalt, indigo, jade, lavender dawn) were retired on 2026-11-25 because they read as generated. Each chapter keeps its own identity in the Ink and Signal palette; see Colors. The structural decisions below still hold.

The 2026-11-14 overhaul misread "less AI-generated" as "darker and more neutral". That is reverted: each chapter keeps its original colour identity and atmosphere (navy and holographic cyan for the hero, violet haze for Curiosity, cobalt for Engineering, indigo with cyan and violet currents for Intelligence, the violet-navy exhibition hall for Project Universe, jade for Timeline, the dawn for the close). Backdrop, fog, ink tokens and readability veils are back to their pre-overhaul values.

**What actually read as generated, and what replaced it:**

1. **Identical floating cuboids.** Engineering's modules are now a system sculpture shaped by role: tiers are discs, data stores are drums, services are hexagonal prisms (hexagonal architecture), clients are slim slabs. They are reshaped per instance in the vertex shader, so the assembly, the Nestafar framing and the morph into Intelligence nodes are unchanged. Material: warm graphite satin under a warm key and a clay fill, with a tight specular, a bone fresnel and brass catch-lights on rims only. No box outlines; the accent marks active modules.
2. **Decorative grids.** The Engineering floor grid is retired; the routed floor traces, which carry the signal to the structure, stay.
3. **Bordered chips, ruled tables and HUD rows.** Nestafar's agent chain is a sentence of serif-italic steps joined by the drawn signal; Engineering's identity table is label-over-text with a single bone hairline; Intelligence's request walk-through runs down one glowing signal line, node by node; Curiosity's questions are asked aloud in serif italic, in a staggered column. All information is kept.
4. **Outline rectangles standing in for objects.** IRIS's structured record is a physical olive card the extracted fields land on.

**Kept from the overhaul:** the editorial serif (now Fraunces italic) for leads and personal lines, sentence-case actions, satin device bodies with smoother bevels, supersampled screen textures, DPR tiers, the Index scroll lock and centred credits.

**Project Universe pager (2026-11-26, replaces the gesture gate).** The establishing block and every exhibit are one full-viewport panel; stops are panel tops (a taller portrait panel stops with its bottom on the screen's). Inside the universe one gesture moves exactly one panel: the page glides there (eased, 0.56–0.9s), settles, and the rest of that gesture is discarded, including trackpad momentum (a root overflow lock ends native inertia and a hold snaps back any residual scroll until the gesture falls silent). A new gesture is a reversal, a long pause, or a stronger push after a pause; a decaying tail never counts. Entering from either side settles on the first panel reached; at either end a fresh outward gesture leaves with native scrolling. Touch: one swipe, one panel. Keyboard: PageDown/Space/ArrowDown and PageUp/ArrowUp, one press one panel. Reduced motion: the same steps without the glide. Index links, anchors, history and case-study returns bypass it. Panel copy reveals as a unit, so a settled panel is never mid-fade. Verified on an RTX 4060 in hardware-accelerated Chrome: 16/16 desktop checks (trackpad, wheel bursts, reverse, keyboard, leaving upward), 7/7 touch checks. Code: `experience/director/projectGate.ts`.

**Index lock.** Opening the Index adds `html.has-index` (overflow hidden on the root, so scrollY never changes); the panel scrolls on its own with contained overscroll; closing releases synchronously so links navigate from the unlocked page.

## Overview

**Creative North Star: "Ink and Signal"**

The site is a signed piece of work. It opens on warm ink with a signature writing itself, splits along the signature's baseline into a dimensional space, and carries one copper signal through every chapter: the hero's current, the network's pulses, the dot of the i, the focus ring. Everything else is ink, bone and a handful of low-chroma warm neutrals that give each chapter its own air. When a colour cannot say whether it is ground, type, a chapter tone or the signal, it does not belong.

The mood is cinematic, precise and human: title-sequence staging and engineered micro-detail, held in an editorial, print-like palette rather than neon. Density is deliberately uneven: the 3D world may be rich and layered, while the DOM interface stays sparse, quiet and exact so the person's name and the work always lead. The world is original; Marvel/JARVIS influence is energy and pacing, never copied props, reactor geometry, logos or HUD layouts. Rejected: violet, lavender and electric-blue light, cyan glows, neon halos, generic SaaS layouts, glass dashboards, noisy particle fields and a lone glowing sphere on black.

**Key Characteristics:**
- Warm ink ground, bone type, one copper signal; chapters vary by low-chroma clay, slate, brass and olive.
- A handwritten signature, not a geometric emblem, is the first thing a visitor sees.
- Rich 3D world, quiet DOM: real HTML typography over a single WebGL canvas.
- Depth from light and space, never from drop shadows.
- Quiet and exact controls: bone pills and hairline underlines; copper only on focus, hover and live state.

## Colors

Warm ink and bone, like a printed page at night, with a single copper signal and a few muted chapter tones. Token names in `app/globals.css` are historical (`--core-energy` holds the copper, `--space-navy` the ink ground); the values are normative.

### Primary
- **Signal Copper** (`signal-copper`): the only saturated colour. Focus rings, text selection, the caret, progress at ready, the dot of the signature's i, the loader seam, the hero's living current, network pulses, active list markers, the cursor's caret and centre point, the primary pill hover fill. Never a large flat field, never body text.

### Secondary
- **Clay** (`clay`): Meet the Human's dusk, the Intelligence to Universe transition, the Next Chapter dawn, the hologram shell's accent.
- **Slate** (`slate`): Curiosity's haze, Intelligence's depth, cool structural lines. A grey with a breath of blue, never a blue.

### Tertiary
- **Brass** (`brass`): Engineering's machined edges, JobSeek's accent, warm highlights in the Universe hall.
- **Olive** (`olive`): Timeline Nexus night, IRIS's accent, acknowledgement states.

### Neutral
- **Ink** (`ink`): page, loader sheet, canvas clear colour.
- **Ink Ground** (`ink-ground`): hero atmosphere and fog.
- **Panel** (`panel`): solid DOM surfaces such as the Index panel.
- **Bone** (`bone`): the signature, the primary pill, primary light in the 3D world.
- **Paper** (`paper`): display and primary text.
- **Ink Tinted** (`ink-tinted`): secondary copy (identity stack, scroll cue, work lines).
- **Ink Muted** (`ink-muted`): quiet controls and inactive states (Skip intro, Close, upcoming chapters, metadata).

### Named Rules
**The One Signal Rule.** Copper is the only saturated colour on any screen, and it marks signal or interaction: focus, selection, live state, the current. Never a field, never prose.

**The Warm Neutral Rule.** Chapter identity comes from low-chroma warm neutrals (clay, slate, brass, olive, OKLCH chroma at most 0.08). Violet, lavender, electric or cobalt blue and cyan glows are retired everywhere: CSS, shaders, lights, canvas textures, favicon and social card.

**The Tinted Ink Rule.** Secondary text is tinted from the warm ground (Ink Tinted, Ink Muted), never a neutral or cool gray.

## Typography

**Display Font:** Big Shoulders (condensed industrial capitals), 900 for the name, 700–800 for titles
**Editorial Font:** Fraunces italic (soft optical axis), for selective editorial statements only
**Body Font:** IBM Plex Sans, for body and interface
**Label/Mono Font:** IBM Plex Mono, for technical metadata only

**Character:** Oversize condensed capitals give the name and titles weight and impact without width; Plex carries everything readable with an engineer's neutrality; Fraunces italic appears only where the person speaks (chapter leads, personal asides, the closing line). All four are fetched by next/font at build time and served from the site itself.

### Hierarchy
- **Display** (Big Shoulders 900, clamp(4.25rem, 16.4vw, 26rem), 0.8): the name only, uppercase, nearly edge to edge across the gutter, split into masked lines for the entrance.
- **Headline** (Big Shoulders 800, clamp(3.25rem, 1.2rem + 8vw, 8rem), 0.88): chapter, exhibit and case-study titles.
- **Title** (Big Shoulders 800, clamp(1.35rem, 0.9rem + 1.6vw, 2.25rem), clamp(1rem, 0.62rem + 1.25vw, 1.6rem), 1.02, uppercase): the identity stack (DEVELOPER. ENGINEER. CREATOR. GAMER.), four masked lines with copper full stops, set beside the tagline. Each word arrives as corrupted signal (re-rolling glyphs, copper and bone slices) and decodes left to right. Only the word's own glyph box is live, never the full row, and the pointer must rest there 140ms; hover screens never self-decode. A tap, the first Tab, or an automatic decode after 2.6s on touch screens also reveal it; screen readers and reduced motion always get the plain words. A decoded word lands in copper and settles to Ink Tinted.
- **Body** (400, 1rem–1.125rem, 1.5): tagline and chapter copy; tagline capped at 30ch beside the identity stack.
- **Label** (IBM Plex Mono 400, 0.6875–0.75rem, 0.14–0.24em tracking, uppercase): identity marks, the Menu label, chapter meta lines, the Scroll cue.
- **Editorial lead** (Fraunces italic 400, clamp(1.45rem, 1.05rem + 1.35vw, 2.15rem), 1.16): chapter leads, the closing lead and personal asides. The serif is the human voice against the engineered display face.
- **Interface action** (IBM Plex Sans 500–600, 0.9375rem, sentence case): every button and text link. Primary is a solid soft-white pill with near-black text; secondary actions are text links with a 1px drawn underline; a download is an accent-tinted pill.

### Named Rules
**The Name Wins Rule.** Nothing on screen, in DOM or WebGL, may compete with the display name. Holographic elements sit on the far side of the frame or behind a readability scrim. On wide layouts the camera measures the copy's right edge and frames the core so its outer ring stays clear of it.

**The Honest Mono Rule.** IBM Plex Mono is for labels and technical status, not as a costume for "technical" prose.

**The Counter Rule.** Counts and dates are data: IBM Plex Mono with tabular figures, the total in Ink Muted.

**The Selective Serif Rule.** Fraunces italic is for a sentence in the person's own voice, at most one per section. Lists, steps, specs and counters never use it.

**The Tight Tracking Rule.** Letter-spacing never exceeds 0.08em; wide-tracked mono reads as costume.

## Layout

The page is native document scroll over one fixed, full-viewport canvas. DOM sections are real HTML laid over it: the Origin hero is one viewport tall (100svh) and the threshold beat 150svh, so scroll distance stays short and reversible with no pinning.

Horizontal rhythm comes from one fluid gutter (clamp(1rem, 5vw, 6.5rem)). The hero is typography-led: the oversize name spans the gutter on landscape screens and is vertically centred on every screen, with the identity row and tagline beneath it (tagline beside the row on landscape, stacked below on portrait or at 640px and narrower). Hero sizes and padding use both vw and svh so the hero fits one viewport from 1366x768 up. Touch targets are at least 44px (46px for primary pills). The loader signature is min(30rem, 80vw) wide and shifted so its baseline sits exactly on the viewport centre line, because the split seam runs there; the progress hairline and status share its left edge and width.

## Elevation & Depth

This system uses no drop shadows on interface elements. Depth comes from real 3D space (a single perspective camera at 40° FOV, fog from Ink Ground), additive light (holographic line work, glow billboards, emitter cones) and layered occlusion between foreground instruments, the core and the far backdrop. On the DOM side, depth is a readability scrim: a directional warm-ink gradient behind the name (left-to-right on landscape, bottom-up on portrait) plus a soft vignette. Glows exist only where energy is literally present (the 3D current, the core, network pulses). The loader seam is a flat 1px copper line, not a glow, and the loader sheet carries a 5% fixed paper-grain noise so the ground reads as a surface.

**Materials and light (2026-11-25).** Every object that should read as made uses physical materials (`experience/world/materials.ts`, `machined.ts`, `parts.ts`): brushed aluminium and titanium with a procedural grain, hard-anodised and powder-coated finishes, gunmetal fasteners, nitrile rubber, cover glass, copper only as a band or a status point. Reflections come from a CC0 photo-studio HDRI (`public/env/studio_small_09_1k.hdr`, Poly Haven, see `public/env/README.md`). Geometry is built like parts: lathe profiles with chamfers, flanges, cap-screw circles, rounded boxes; no bare primitives.

**Atmosphere (2026-11-25).** Backgrounds are deep warm ink. Chapter tones survive only as a whisper: the backdrop is compressed toward ink (half strength) and darkens toward floor and sky, fog sits near the ink ground and starts farther away, glow billboards are tight light points with no wide halo, and the Next Chapter dawn, sun, arcs and motes run at about a third of their old strength.

### Named Rules
**The Made Object Rule.** If an object is meant to be a thing, it is built and lit like one: real construction, bevels, fasteners and physical materials. Unlit satin or additive "hologram" shading is for light itself, never for objects.

**The Light, Not Shadow Rule.** If something needs to feel closer, move it in space or light it; never add a box-shadow. Zero-offset glows are reserved for energy in the 3D world (core, current, pulses), never for DOM controls.

## Shapes

Two families. **Hand:** the signature is the only freehand form, a single round-capped pen line (2.1 units in a 420 x 150 viewBox) roughened by a faint displacement filter; the favicon repeats its A and the copper dot. **Engineered:** controls are full pills (Menu, primary actions) or hairline underlines (text links); panels are square-edged. In the 3D world the hero keeps its faceted heart, segmented orbit rings with ticks (radii 52 : 78 : 96) and rectangular projection panes with corner brackets, drawn in bone light with copper accents. The loader uses none of these: geometry is earned by the 3D world, never shown as an emblem.

## Components

### Buttons
Quiet and exact: bone pills and hairline underlines; copper only on focus, hover and live state.
- **Shape:** full pill (999px) for Menu and primary actions; text links carry a 1px underline at 0.35–0.4em offset.
- **Primary (the email in Next Chapter, View case study):** solid Paper pill, Ink text, IBM Plex Sans 600 sentence case, 46px min-height. The loader has no button: it enters on its own.
- **Hover / Focus:** the primary pill fills Signal Copper with Paper text. Focus everywhere is a 2px copper outline at 4px offset. Active scales to 0.98.
- **Menu (secondary):** a warm-ink pill at 62% with a 1px rim; hover deepens the fill.
- **Quiet links (Skip intro, Close):** Ink Muted sans with an offset underline; hover to Paper with a copper underline.

### Cursor
On fine pointers only, never on touch: an 8px Bone dot sitting exactly on the hotspot, with no lag and no trail. Over links and buttons it opens into a 40px soft bone lens (16% fill, slight backdrop brightening) with a 4px copper centre point; over a still-corrupted hero word it narrows to a 2 x 26px copper reading caret; on press it scales to 0.7. Shape changes ease over 0.32s on the expo-out curve. The native cursor returns while a modal dialog is open.

### Navigation
- **Top bar:** fixed, transparent; left the identity mark ("AV / Personal system", mono, copper slash), right a single Menu control (one control, since every entry opened the same panel): since 2026-11-25 a plain ink pill with a hairline edge, the word Menu in IBM Plex Sans 500 and two lines that even out on hover (transform only). No orbit glyph, travelling rim or glass blur; copper only on hover and focus. It opens the index panel at its top. Hidden during the loader; fades in after the name lands.
- **Case study screens:** a numbered Screens block follows The idea in every case study: a carousel ported from the AV-Forge-3d project gallery (React Bits MorphSlider, ogl). Screens melt into each other (fbm warp with chromatic aberration, 1.15s) and follow drag or swipe live; arrow keys, square arrow buttons and a thumbnail strip also drive it. The stage has a thin accent border, accent corner ticks and an accent glow. Below it: a mono counter "02 / 05 · Title" with the counter in the accent, the caption, and a Full size button that opens the shared viewer at that screen. The active thumbnail lifts, takes the accent border and draws an accent underline. The slider is loaded on demand and pauses off screen. Without WebGL the same controls (and a 40px swipe) cross-fade plain images. One-screen projects (WiniOS, ELI5) show the stage and caption only. Files: `public/projects/<id>/n.webp` and `n-thumb.webp`, captions in `content/screens.ts`.
- **Index panel:** native modal dialog sliding from the right, Panel, in three sections: Work (WiniOS featured in copper, five projects and the Nestafar internship, each with one verified line and a mono stack), Contact (email first, then LinkedIn, GitHub, Instagram) and Story (live chapters as links, upcoming chapters as one line). No unfinished project pages.

### Signature Loader (signature)
The name "Abhishyanth" writes itself on warm ink, one pen stroke after another: the main line (950ms), the t and A crossbars (180ms, 200ms), then the dot of the i in copper. Since 2026-11-26 the strokes are drawn by a Web Worker on two OffscreenCanvases (one per loader half), from points sampled once from the SVG paths, with the same pen easing and a slight pressure taper; the worker owns its own frame loop, so the pen stays smooth while the main thread hydrates and the 3D scene compiles. The loader enters when the worker reports the last stroke has landed. The SVG version remains as the fallback (no OffscreenCanvas) and as the reduced-motion still; its per-frame displacement filter is gone. They live in `components/loader/signature.ts` as centre-line SVG paths with per-stroke timing, so real handwriting can replace the stand-in without touching anything else.
- **Readout:** below the signature, one full-width hairline that advances only when a real check completes (interface, typefaces, scene) and turns copper when everything is ready; a status word on the left ("Entering" once ready) and an IBM Plex Mono counter (`02/03`) on the right. "Abhishyanth Vemula, portfolio" sits top left, Skip intro bottom right. There is no Explore button.
- **Timing (2026-11-25):** the full signature plays on every full page load, cached or not (`SIGNATURE_MS`, about 1.65s, plus a 280ms beat). The loader then enters on its own as soon as the signature has landed and every asset is ready. The scene check gives up after 7s and enters with a static scene. Internal navigation (case-study returns, deep links after the first load) never replays it. Reduced motion shows the signature already written and enters as soon as assets are ready. Skip intro is always available.
- **Entrance:** a copper seam draws across the signature's baseline (0.45s) and the sheet splits into two halves that carry the signature away (1.0s). The hero is released at 1.3s; the name lands as the halves clear.

### Hero (typography-led, 2026-11-25)
The holographic workspace (glowing core, orbit rings, glass callouts, perspective grid, data network and the hero's light current) is retired and unmounted. The hero is the oversize name, the identity row and the tagline on deep warm ink, nothing else. Everything fits one viewport: the name is `clamp(3rem, min(16.4vw, 27svh), 26rem)`, the identity row and tagline scale with `svh` too, and the section padding tracks the viewport height. Verified with no clipping, overlap or horizontal scroll at 1366x768, 1440x900, 1920x1080 and 390x844. The four identity words run as one row under the name with the tagline beside them (stacked on portrait). A sculpture may take the open lower-right field later, but only once a silhouette is approved. Candidates live on two unlinked, unindexed benches: `/lab/sculpture` (the object alone) and `/lab/hero` (the object inside the real hero typography, `?v=fold|joint|iris`).

### Meet the Human: Robot-Operated Gallery (Milestone 003.5, signature)
A warm beat between the hero and Curiosity: clay dusk, bone highlights and a single warm title line ("There's a human."), the only warm type on the site so far. Real HTML copy on the left (Big Shoulders 800 title, 54ch body, a mono-term trait grid, a visible anecdote placeholder); on the right, 3–4 holographic photo frames that are objects in space: the active frame comes forward, sharp and edge-lit bone to clay; neighbours recede, turn toward the centre, drop and cool. Since 2026-11-25 the photographs are physical prints: each image is mounted on warm matte paper with an even border and a fine bevel line, lit by a soft top-left key, casts a soft rectangular shadow, and is revealed by a clean top-down wipe. Far prints simply sit in shadow. No edge light, scanlines, bloom, corner brackets or projector stutter.
- **The robot (rebuilt 2026-11-25):** a small industrial arm built from machined parts: a chamfered anodised foot with an 8-screw circle, a brushed-aluminium pedestal, anodised joint housings with turned aluminium end caps and cap-screw rings, brushed tubular links between flanges, a roll joint, a parallel gripper with nitrile pads, and a camera module with cover glass and one copper status point. Physical materials under the studio HDRI and a soft contact shadow; no ceramic shell, no glow pad. Each swipe is one planned hand path: anticipation (it draws back), approach, a beat of hesitation with a head tilt, contact, a controlled push, follow-through and a clean settle. Two-bone IK feeds lightly underdamped joint springs on a fixed 240 Hz clock (base slowest, wrist quickest), so motion is frame-rate independent and lands with a small overshoot. While in contact the card is moved by the robot's actual fingertip, then glides on with its own momentum. Idle: breathing, drifting, an occasional head tilt. Phones and low-power devices skip the hesitation.
- **Ownership:** scroll reveals and dismisses; the gallery store owns index, drag, the robot's action and autoplay; one frame loop owns the displayed position. Scrolling backward never resets the photo.
- **Autoplay:** always on, like a standard carousel: every 5 s the robot performs the same swipe (about 1.35 s; 1.05 s on phones). Manual arrows, keys and swipes run alongside it and simply restart the interval. It only waits while dragging, while the Index is open, off-stage, in hidden tabs and under reduced motion (where it is off). A hairline timer under the counter shows the next swipe. The caption block has a fixed height so the controls never move between photos.
- **Composition:** prints on an arc; the active one forward and fully lit; neighbours fan out, turn in and fall into shadow. The robot stands larger (scale 1.2 desktop, 0.8 portrait) under its own warm key light, its gripper working at the print edges.
- **Stage:** a native `position: sticky` hold (one memorable moment, then it lets go). Drag/swipe (`touch-action: pan-y`), arrow keys on the focused stage, Previous/Next buttons, a Pause/Resume button for the automatic swipes (WCAG 2.2.2), a polite live caption. No-WebGL shows the current slot as a card. Photos and metadata live in `content/gallery.ts`.

### Chapter Worlds: Curiosity and Engineering (Milestone 003)
One canvas, one camera path. Document position maps to a chapter track (0 hero, 1 Meet the Human, 2 Curiosity's title at 30% of the viewport, 3 Engineering, 4 Intelligence's title at 30% of the viewport, 4.75 Intelligence's last lines, 6 Project Universe's title) measured from the DOM, so every state is exact in both scroll directions; a lens shift (not a camera turn) leaves room for each chapter's copy (subject right in Curiosity, left in Engineering, upward on portrait, with an extra pull-back).
- **Curiosity (rebuilt 2026-11-25): the whole system as one object.** A powder-coated deployment plinth carries the five parts the copy names, each a machined module on standoffs: Front end (brushed aluminium case), API (titanium housing with a copper band and cap screws), Auth (anodised puck), Database (three stacked anodised discs), AI services (titanium case). Gunmetal conduits are cabled along the plinth between them (front end → API → auth, database, AI services; AI services → database) and carry copper request packets. Pointing at a module lifts it, gives it a faint copper edge and runs only its routes brighter and faster; with no pointer the attention walks the request path every 2.4s. Labels are billboards in bone. On portrait the model rises above the title. The wireframe discoveries, contour terrain and branching light are retired.
- **Engineering (rebuilt 2026-11-25): an exploded modular assembly.** Three rectangular hard-anodised trays (chamfered, no discs) spread apart on gunmetal standoffs with aluminium collars; every module floats a small gap above its tray on two dowel pins with a dashed assembly axis; data modules are finned storage cartridges, services brushed-titanium hexagonal prisms, clients brushed-aluminium slabs; a faint copper emissive marks active modules; floor traces at a third of their old brightness; floor traces at a third of their old brightness; a precise centred floor grid and survey lines in the sky. Scattered pieces settle bottom-up into a three-tier system (data, services, client); the service tier's front row is the Nestafar pattern, agent → tool → API → live data, with mono world labels and data pulses on the pathways. Solid, edge-lit volumes, not glass.
- **Copy layer:** real HTML. Chapter title (Big Shoulders 800) with a mono meta line below it, never an eyebrow; a display lead; body at 62ch; Curiosity's questions on rhombus markers; Engineering's spec sheet (mono term, prose detail) and the Nestafar proof block with an HTML flow diagram. The proof block reveals and leaves as one unit (2026-11-25), so its heading can never fade while its list is still on screen. Each line owns one scrubbed enter/read/leave timeline. A soft radial veil (a linear band on portrait) sits behind copy instead of a card. Curiosity opens with title, lead and first paragraph beside the revealed world in one viewport; the second paragraph, questions and the origin-anecdote placeholder unfold below.
- **Fallbacks:** reduced motion cuts the camera between chapter holds and shows copy statically; no-WebGL swaps the CSS fallback's colour story per chapter.

### Chapter World: Intelligence and the turn to Project Universe (Milestone 004, revised 2026-11-14)
One continuous, scroll-scrubbed transformation of the Engineering structure, with no scene cut: architecture, then intelligent network, then flexible connections that carry the story into Project Universe. A single ribbon system and a single node system carry it, driven by one flex value, so every intermediate state is a real in-between and reverses exactly.
- **Intelligence (living network):** deep slate depth with bone currents and copper pulses. The Engineering modules lift out of their tiers and fly to network positions, where they become bright cores; thin precise connections draw on between them. The labelled nodes tell the real request path from the Nestafar work: Intent, Agent, LLM, Tool call, Internal API, Live data, Retrieval, Result. One request packet walks that path while pulses travel every connection. The node nearest the pointer answers by growing. Copy: lead, body, an ordered five-step "How an agent request travels" list (mono step, prose detail) and a "currently exploring" note.
- **Transition (no chapter, no copy):** Expression was removed on 2026-11-14. As Intelligence's last lines leave (track 4.75), the same connections widen into tapered, breathing ribbons in the warm palette and the cores swell into soft forms while the backdrop warms to clay; the camera passes the loosened network and turns toward the exhibition hall, where the living signal picks up and leads into Project Universe (track 6). No words, voxels or reticle remain.
- **Composition:** copy start-side in Intelligence (world right); the lens holds the subject right through the transition into Project Universe. Portrait keeps the world above and around a linear veil.

### Project Universe (Milestone 005, refined 2026-11-14)
A warm dark exhibition hall (`#16130F` fog). **Establishing shot (track 6):** the title "Project Universe", "Six builds. Six worlds. One way of working.", the hall atmosphere and a restrained living signal (45% intensity), a mono "Scroll to enter the first world" cue with a travelling light in a 1px rail, and no project geometry at all. **Progressive reveal (2026-11-14):** the camera holds on one artifact per half track unit (6.5 WiniOS … 9.0 Scholaroid); each arrives with its exhibit title at 30% of the viewport (50% on portrait). An artifact exists only in its own interval: it materialises from key − 0.30 to key − 0.06 (rises 1.2 units, scales 84% → 100%, untwists 0.5 rad, a horizontal projection plane in its accent sweeps up through it, its screens and cards draw on top-down), holds, then deconstructs from key + 0.08 to key + 0.30 (lifts, grows 7%, turns away, the plane sweeps down) while the next begins at its key − 0.30, so handoffs overlap by 0.1 track. Hidden artifacts are `visible = false` (not just transparent) and skip their per-frame work; all materials are precompiled at load, so nothing mounts or compiles on a scroll boundary. Artifacts combine three materials: **physical bodies** (2026-11-25: bead-blasted space-grey aluminium for the laptop, polished graphite stainless for the phone, powder-coated plates for the IRIS card and Scholaroid school, hard-anodised plinths; real metalness and roughness under the studio HDRI), **canvas surfaces** (screens, cards, paper; `universeTextures.ts`, original generic UI, fictional data marked SAMPLE) and **additive light** (currents, rings, glows).
- **WiniOS, The Bridge (featured, 1.25×; devices rebuilt 2026-11-25: recessed keyboard deck, glass trackpad, hinge barrel, black glass bezel with webcam, rubber feet, lid at about 105° in a three-quarter view; the phone has a black glass front, a two-lens camera plateau and side buttons; both cast soft contact shadows; the TLS rings, bridge halo, acknowledgement ring and per-artifact projection rings are retired):** an original laptop (rounded slab base, keyboard, hinged lid showing the WiniOS Settings window and a centred taskbar) and an iPhone-style phone (rounded body, island, a Shortcuts-like tile grid), joined by an arched current with a halo through a double TLS ring; ambient packets keep the link alive both ways. **Send** alternates direction (PC → iPhone, then iPhone → PC): the source screen shows "Sending…", a sealed clipboard card (text, then image) crosses the bridge and flares the ring, the destination shows "Received" and an olive acknowledgement ripple. No manufacturer marks or OS screenshots.
- **JobSeek, The Navigator (brass):** a candidate profile card with skills, four opening cards, matching lines that sweep the openings and lock on the best fit (which turns into "Strong match · Applied"), and SeekBot, a small agent orb whose answer card shows the best fit and a skill gap.
- **IRIS, The Vision (olive-sage):** a sample receipt (Demo Mart, marked SAMPLE) with a moving OCR line that tints read text; vendor, date, items, tax and total lift into a record frame; an olive "Arithmetic checks out" chip closes the cycle.
- **ELI5, The Translator (clay):** the knot above a dense technical paragraph; "Explain it like I'm five" relaxes the knot and crossfades the paragraph into one plain sentence.
- **QP-Gen, The Architect (slate):** three chapter cards (one selected), question modules with their marks flying into a sample CBSE-pattern paper that reveals section by section (scroll-owned).
- **Scholaroid, The Ecosystem (sand):** a school building on a round plinth with a campus ring, four role dashboards (Admin, Teacher, Student, Parent) on pads, arcs from school to roles and cross-role flows (teacher → parent, admin → student).
- **Living signal, reborn:** leaves the loosened Intelligence network, threads every artifact and runs on into the Timeline Nexus.

### Case studies (refined 2026-11-14)
- **In-universe layer:** opening an exhibit's "View case study" keeps the universe mounted: the chosen artifact stays lit, every other artifact and the signal recede, story copy and top bar fade, the camera pushes in (24%) and the lens moves the artifact up and right; then the intercepted route `app/@modal/(.)work/[slug]` renders the case as a fixed, scrollable layer whose background is clear at the top (the live artifact is the hero) and deep night below. Close (button, Escape or browser Back) reverses all of it and returns focus to the opener at the exact scroll position. Next case inside the layer replaces the history entry.
- **Standalone page:** direct visits and refreshes render `app/work/[slug]/page.tsx`: same editorial body, with an original orbit plate (accent rings, one node per architecture step) instead of the live artifact; "Back to the universe" lands on the project's exhibit and never replays the loader.
- **Editorial body:** mono meta, display title (800, up to 7.5rem), idea in the display face, facts (Year, Status), stack pills; numbered sections with a 15rem mono label column; an architecture strip from documented components only; a Links section only when a link exists; Next. Role, decisions, screenshots and links are omitted until supplied (2026-11-14), never shown as raw placeholders.

### Timeline Nexus (Chapter 05, refined 2026-11-14)
Olive night, five rope strands converging on the present. The milestone nearest the reading line (55% of the viewport), or the hovered/focused one, is active: its whole strand brightens (×1.7) while others step back (×0.4), a spark runs from the event along its strand into the present, and major events (degree, internship, council, WiniOS) make the core glow brighter. In the list, the active item gets a strand-coloured gradient and a lit 2px rule. Events carry an optional detail line and evidence chips (thumbnail + label) that open the shared viewer. Facts: Grade 10 (2022), Intermediate (2024, 8.3 CGPA), B.Tech (2024–present), UI/UX Mega Workshop (Dec 2024), Scholaroid (2025), INSPIRA'25 (participation), Nestafar AI backend development internship (Jan–Mar 2026, certificate issued 10 Apr 2026), the 2026 builds, the NSGC council + Best Team Member Award (one event, two photos), WiniOS (2026).

### Evidence viewer (shared)
A native modal `<dialog>`: backdrop blurs to 86% night, the frame rises 14px and scales from 0.975. Kind label (Document / Photograph, n / total), Close with an Esc hint, the image at its natural aspect ratio (max height viewport − 15rem), title, the document's own statement as caption, Open original / Download (PDF and original images), arrow keys between photos. Focus goes to Close and returns to the opener; the page scroll never moves.

### Next Chapter and end card (Chapter 06, refined 2026-11-14)
- **Environment:** a dimensional dawn rather than a white-out: warm ink above, clay air, a gold-coral horizon band with a crisp light line, warm haze below. The light source has form: a gold halo (0.42 intensity) with a smaller ivory heart, three gateway arcs (sand, gold, coral) that grow in as the visitor arrives, a horizon band and warm motes rising from the converged threads. Four coloured paths still rise from the nexus.
- **Copy:** display title (800), warm lead, availability line, the email as the primary action, See the work, "Stay for the post-credits scene ↓", then LinkedIn, GitHub and Instagram (a CV link appears once supplied).
- **End card:** a full-viewport section after a short gap. When 55% visible: the section dims to near-black and `story.finale` lowers the sky (−88%) and withdraws the paths; at 1.4s the meta line "Thank you for exploring my universe" fades in over 1.8s; from 2.8s "Abhishyanth Vemula will return." condenses letter by letter, left to right, out of drifting dust (a snap in reverse): each letter drifts in from the right with a fixed pseudo-random offset, 10px blur → 0, 1.7s each, 0.075s apart, while a cloud of box-shadow specks converges into it and fades. No clip-path, so the title glow is never boxed. The Hyprland punchline follows at 5.6s; Replay and Back to the beginning at 6.9s. The heading keeps an `aria-label`; the letter spans are `aria-hidden`. The section is full-bleed from the viewport (`width: 100vw; margin-left: calc(50% - 50vw)`) and its stack is a centred flex column, so every line sits on the viewport centre at any width; the title is one line from 760px up (`nowrap`, 3.3vw, capped at 5.2rem) and wraps on phones without overflow. Scrolling away resets it. Reduced motion shows the card without choreography.

### Production layer (Milestone 007)
- **Skip links:** "Skip to projects" and "Skip to contact" sit first in the top bar, invisible until focused, then a Panel pill with a copper border.
- **404:** the case-study hero layout with one multiverse line ("This branch does not exist.") and two ways back.
- **Social card:** generated at `/opengraph-image` from a warm-ink field with a clay bloom, the four-word identity in Bone and the name in the display weight.

### Personality Layer (Milestone 004A)
Fandom is a personal layer, never the identity. Rules and the full list live in the master plan §6.1–6.2. Later chapters add: Project Universe's "No cave, no box of scraps" WiniOS aside (Tony Stark nod, original wording), the Timeline Nexus Loki line, and the post-credits end card.
- **Movie line (component):** `figure.movie-line`: a lead-in sentence in Abhishyanth's voice (body, muted), the quote in the display face (600, 1.05–1.3rem, soft white), and no visible attribution (character and film stay in content and in screen-reader text, 2026-11-14). A 1px bone rule on the left at 45%, no card or background. Intelligence's variant warms the rule to gold to match the Result node. One per chapter at most: Engineering (Steve Rogers) and Intelligence (J.A.R.V.I.S.) only.
- **Aside:** `.chapter-aside`, italic body in tinted ink, for original microcopy nods (Curiosity's 14,000,605 futures, WiniOS's box of scraps).
- **Visual nods:** colour and light on original geometry only. Curiosity's ping ring gains an amber leading edge with travelling glints (dimensional sparks against the slate field); Intelligence's Result node holds a breathing gold core inside its bone rim.
- **Easter egg:** five manual gallery steps within 2.5 s swap the gallery hint to "Easy. He's a helper bot, not a speedrunner." in peach for about 4 s (shown on phones too, where the hint is otherwise hidden).

## Do's and Don'ts

### Do:
- **Do** keep the copper signal continuous: every new scene should receive the light from the previous one and hand it on.
- **Do** keep copper to signal and interaction: focus rings, selection, live energy, the hover state of the primary action.
- **Do** give each chapter its identity through a low-chroma warm neutral (clay, slate, brass, olive), not a new hue.
- **Do** keep the loader honest: progress moves only on real checks, the full signature plays on every page load, and it enters on its own; never a mandatory click.
- **Do** fit the hero (name, identity row, tagline) in one viewport from 1366x768 up, sizing with both vw and svh.
- **Do** keep the name in real HTML at display size, with a scrim behind it whenever a scene sits beside it.
- **Do** recompose layouts for portrait instead of shrinking the landscape frame.
- **Do** give every holographic element an assembly state and a scroll-out state; both must reverse exactly.
- **Do** ship a reduced-motion path that shows the fully composed hero without camera travel.

### Don't:
- **Don't** use drop shadows, generic glass cards, blurred panels, neon or copper glows, or gradient text.
- **Don't** copy Marvel/Stark props, reactor geometry, helmets, logos or HUD layouts.
- **Don't** let instruments or rings cross in front of the name on landscape layouts.
- **Don't** fill large areas with copper or set body text in it.
- **Don't** reintroduce violet, lavender, electric or cobalt blue, or cyan glows anywhere: CSS, shaders, lights, textures or images.
- **Don't** put a geometric emblem (rings, rhombus, orbit) in the loader or the hero; the signature and the name are the entry.
- **Don't** use ambient fog washes, wide glow halos or decorative particles; and never ship plastic-looking primitives as objects.
- **Don't** give the cursor lag, a trail or a hollow ring.
- **Don't** add eyebrow labels above headings or fake percentages to progress.
- **Don't** use IBM Plex Mono for prose, Big Shoulders below 1.35rem, or Fraunces for lists and data.
- **Don't** use more than one MCU line per chapter, put a quote in a heading, or reproduce Marvel props, emblems, portals or interfaces as visual nods.
