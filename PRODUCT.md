# Product

<!-- impeccable:product-schema 1 -->

Personal portfolio of Abhishyanth Vemula (Portfolio V2). Authoritative sources:
`docs/PORTFOLIO_V2_CREATIVE_MASTER_PLAN.md` (creative brief, milestones) and
`docs/abhishyanth-vemula-profile.md` (biographical and project facts).

## Platform

web

## Users

Two audiences, weighted equally:

- **Recruiters and hiring engineers** screening for internships and early-career roles in backend engineering, AI agents and creative 3D web. They often arrive from a LinkedIn profile or résumé link, frequently skim, and need proof of work and a way to make contact quickly.
- **Collaborators and founders** looking for a builder for projects, hackathons or early products. They explore more, often on a desktop, and judge range, depth and taste.

Visitors arrive from LinkedIn or résumé links, on phones as often as laptops; engineers do deeper reviews of projects and code on desktop.

## Product Purpose

Show who Abhishyanth is and what they have built, as one continuous story (Curiosity → Engineering → Intelligence → Expression → Projects → Next Chapter), so that a visitor leaves understanding the work and knowing how to get in touch. Success: a recruiter can find projects and contact details within seconds, and a collaborator finishes the journey wanting to collaborate.

## Positioning

A full-system builder: Abhishyanth builds complete, working systems end to end (backend services, AI agents connected to live APIs, and the interface people use) and cares how they feel to use. The portfolio itself is the proof: an engineered, original experience rather than a template.

## Operating Context

- Entry is usually a single link (LinkedIn, résumé, shared message); first impression happens on whatever device the link was opened on.
- Every full page load shows the loader; visitors choose when to enter.
- Recruiters need direct paths that bypass the cinematic story (project list, case studies, contact) and must work without WebGL.
- Contact channels: email, GitHub, LinkedIn, Instagram (from the profile document).

## Capabilities and Constraints

- Built with Next.js (App Router), TypeScript, React Three Fiber/Three.js and GSAP; one persistent WebGL canvas; native document scrolling.
- **Deploy target: Vercel.** Domain is undecided.
- Built one milestone at a time (001–007, see master plan §10); Milestones 001 (The Origin), 002 (hero workspace), 003 (Curiosity → Engineering), 003.5 (Meet the Human), 004 (Intelligence → Expression), 004A (personality pass), 005 (Project Universe with /work case studies), Timeline Nexus and 006 (Next Chapter and post-credits) are implemented. Milestone 007 is the production pass.
- Must perform on mobile: quality tiers, capped resolution, reduced-motion route and a static no-WebGL fallback are required, not optional.
- Undecided: final hero tagline (current line is a draft pending approval), CV link, domain, analytics/privacy approach.

## Brand Commitments

- Name: Abhishyanth Vemula. Professional descriptor in use: Software Engineer · AI Developer · Creative Technologist (proposed; may be refined).
- Voice: confident, clever, contemporary and clear; occasional well-timed Gen Z humour and rare, attributed movie-line Easter eggs. Never boastful or self-mythologising.
- MCU/JARVIS/FRIDAY are inspiration for energy and pacing only. No Marvel assets, logos, reactor geometry, helmets or copied interfaces; fandom is a personal layer, not the identity.
- The previous AV-monogram narrative is retired.

## Evidence on Hand

- Verified facts: `docs/abhishyanth-vemula-profile.md` (education at NIAT Hyderabad; AI Backend Engineer Intern at Nestafar Technologies, Jan–Mar 2026; NIAT Student General Council, Best Team Member Award April 2026; listed skills; five documented projects: Scholaroid, JobSeek, ELI5, IRIS, QP-Gen). WiniOS is described in the master plan and must be verified against its source before public copy.
- Content model: `content/site.ts`.
- **Absent, must not be fabricated:** photographs (four gallery slots reserved in `content/gallery.ts`), project screenshots and recordings, individual roles and measured outcomes per project, deployed/demo links, CV link, personal origin anecdote, graduation date, any metrics or testimonials.

## Product Principles

1. **Proof over persona.** Every chapter must advance evidence of real work; spectacle that does not serve that is cut.
2. **Two speeds, one site.** The cinematic journey and the fast recruiter path both stay first-class; neither may break the other.
3. **Truth or placeholder.** Unverified facts appear as visible placeholders, never as invented claims.
4. **Original, not borrowed.** Inspiration informs energy and pacing; every object and interface is original.
5. **The site is the portfolio piece.** Engineering quality (performance, accessibility, reversibility) is part of the pitch.

## Accessibility & Inclusion

Target **WCAG 2.2 AA**: text contrast, full keyboard operation with visible focus, screen-reader-friendly loading status and navigation, 44px touch targets, a complete reduced-motion experience, and all recruiter-critical content (identity, projects, contact) available as real HTML that works without WebGL.
