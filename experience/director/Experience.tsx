"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { installProjectGate } from "./projectGate";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Hero } from "@/components/hero/Hero";
import { Curiosity, Engineering, Intelligence } from "@/components/chapters/Chapters";
import { Closing, ProjectUniverse, TimelineNexus } from "@/components/chapters/Universe";
import { projectStories } from "@/content/projects";
import { Human } from "@/components/human/Human";
import { TRACK_MAX } from "@/experience/chapters/layout";
import { EnergyCore } from "@/components/loader/EnergyCore";
import { Loader, type LoaderPhase, type LoaderSteps } from "@/components/loader/Loader";
import { TopBar } from "@/components/navigation/TopBar";
import { Cursor } from "@/components/cursor/Cursor";
import { hasWebGL, onSceneReady, setStory, story } from "./store";
import { caseNav } from "@/components/case/caseNav";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** Document top of an element from layout (offsetTop chain), ignoring CSS transforms. */
function layoutTop(el: HTMLElement) {
  let y = 0;
  let n: HTMLElement | null = el;
  while (n) {
    y += n.offsetTop;
    n = n.offsetParent as HTMLElement | null;
  }
  return y;
}

/**
 * Showcase position of one exhibit: its title at 30% of the viewport (50% on
 * portrait screens, where the artifact owns the top half), lowered just enough
 * that the exhibit's actions are on screen, never so far that the title leaves.
 * Shared by the 3D track anchors and the Project Universe stops.
 */
function exhibitStop(id: string) {
  const vh = window.innerHeight;
  const title = document.querySelector<HTMLElement>(`#project-${id}-title`);
  if (!title) return 0;
  const tTop = layoutTop(title);
  let y = tTop - vh * (window.innerWidth / vh < 0.8 ? 0.5 : 0.3);
  const actions = document.querySelector<HTMLElement>(`#project-${id} .exhibit-actions`);
  if (actions) {
    const need = layoutTop(actions) + actions.offsetHeight - vh + 24;
    y = Math.max(y, Math.min(need, tTop - 72));
  }
  return y;
}

const WorldCanvas = dynamic(() => import("@/experience/world/WorldCanvas"), { ssr: false });

/** Normal presentation time for the intro on fast loads (master plan §2.1). */
const MIN_PRESENTATION_MS = 1700;
/** If the scene is not ready by then, offer entry with the static scene. */
const SCENE_TIMEOUT_MS = 10000;

type Stage = "pre" | "entering" | "entered";

const noopSubscribe = () => () => {};
function useClientValue<T>(get: () => T, server: T) {
  return useSyncExternalStore(noopSubscribe, get, () => server);
}

/**
 * LoaderDirector + StoryDirector.
 *  - Loader readiness is real: hydration, document fonts, compiled WebGL scene.
 *  - The entrance timeline owns: loader layers, hero line/reveal elements, story.intro.
 *  - ScrollTrigger owns: story.scroll, hero content wrapper, scroll-cue wrapper and the per-line chapter copy timelines.
 */
export function Experience() {
  const rootRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const exploreRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);

  const webgl = useClientValue(hasWebGL, false);
  const lowPower = useClientValue(
    () => window.matchMedia("(pointer: coarse)").matches || Math.min(screen.width, screen.height) < 700,
    false,
  );

  const [stage, setStage] = useState<Stage>("pre");
  const [hydrated, setHydrated] = useState(false);
  const [typefaces, setTypefaces] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneTimedOut, setSceneTimedOut] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);

  const steps: LoaderSteps = {
    interface: hydrated,
    typefaces,
    scene: sceneReady || sceneTimedOut || (hydrated && !webgl),
  };
  const degraded = hydrated && (!webgl || (sceneTimedOut && !sceneReady));
  const allReady = steps.interface && steps.typefaces && steps.scene && minElapsed;
  const phase: LoaderPhase = stage === "pre" ? (allReady ? "ready" : "loading") : stage;

  // Boot: every full document load starts here, so the loader always plays.
  useEffect(() => {
    (window as Window & { __originBooted?: boolean }).__originBooted = true;
    setStory({
      intro: 0,
      build: 0,
      scroll: 0,
      pulse: 0,
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const measureCore = () => {
      const el = loaderRef.current?.querySelector(".loader-core");
      if (el) setStory({ coreSizePx: el.getBoundingClientRect().width });
      measureText();
    };
    // Hero copy bounds at rest (scroll 0, lines in place): text widths, not box widths.
    const measureText = () => {
      const root = contentRef.current;
      if (!root) return;
      const range = document.createRange();
      let right = 0;
      root.querySelectorAll(".hero-name .hero-line-inner, .hero-role-inner, .hero-tagline").forEach((el) => {
        range.selectNodeContents(el);
        right = Math.max(right, range.getBoundingClientRect().right);
      });
      const box = root.getBoundingClientRect();
      const y = window.scrollY;
      setStory({ textRightPx: right, textTopPx: box.top + y, textBottomPx: box.bottom + y });
    };
    measureCore();
    document.fonts.ready.then(measureText);
    window.addEventListener("resize", measureCore);

    const wait = story.reducedMotion ? 0 : Math.max(0, MIN_PRESENTATION_MS - performance.now());
    const minTimer = window.setTimeout(() => setMinElapsed(true), wait);
    const sceneTimer = window.setTimeout(() => setSceneTimedOut(true), SCENE_TIMEOUT_MS);
    const offScene = onSceneReady(() => setSceneReady(true));
    let alive = true;
    document.fonts.ready.then(() => alive && setTypefaces(true));
    queueMicrotask(() => alive && setHydrated(true));

    return () => {
      alive = false;
      window.removeEventListener("resize", measureCore);
      window.clearTimeout(minTimer);
      window.clearTimeout(sceneTimer);
      offScene();
    };
  }, []);

  // Pointer parallax input, desktop fine pointers only.
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      story.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      story.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Hand focus to Explore the moment it exists; the status region announces readiness.
  useEffect(() => {
    if (phase === "ready") exploreRef.current?.focus({ preventScroll: true });
  }, [phase]);

  // Prepare the hero beneath the loader: composed, but held for the entrance.
  useGSAP(
    () => {
      gsap.set(".hero-line-inner", { yPercent: 140 });
      gsap.set(".hero-role-inner", { yPercent: 110 });
      gsap.set(".hero-reveal", { autoAlpha: 0, y: 18 });
      gsap.set(".hero-chrome", { autoAlpha: 0 });
    },
    { scope: rootRef },
  );

  // Kill any running entrance if the experience unmounts (e.g. HMR).
  useEffect(() => () => void timeline.current?.kill(), []);

  const finish = () => {
    caseNav.booted = true;
    caseNav.returning = false;
    setStage("entered");
    document.documentElement.classList.remove("is-locked");
    requestAnimationFrame(() => {
      // Deep links (e.g. /#project-winios from a case study) land after the entrance.
      const hash = window.location.hash;
      const target = hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
      if (target) {
        const heading = target.querySelector<HTMLElement>("h2, h3");
        if (target.classList.contains("exhibit") && heading) {
          // Exhibits: land on the artifact's hold frame (title at its anchor line).
          const frac = window.innerWidth / window.innerHeight < 0.8 ? 0.5 : 0.3;
          window.scrollTo(0, heading.getBoundingClientRect().top + window.scrollY - window.innerHeight * frac);
        } else target.scrollIntoView();
        heading?.setAttribute("tabindex", "-1");
        // After React has released the story from `inert`.
        window.setTimeout(() => heading?.focus({ preventScroll: true }), 80);
      } else titleRef.current?.focus({ preventScroll: true });
    });
  };

  const showHeroInstantly = () => {
    gsap.set([".hero-line-inner", ".hero-role-inner"], { yPercent: 0 });
    gsap.set([".hero-reveal", ".hero-chrome"], { autoAlpha: 1, y: 0 });
  };

  const onExplore = () => {
    if (stage !== "pre" || !allReady) return;
    setStage("entering");
    const q = gsap.utils.selector(loaderRef);
    const lines = ".hero-line-inner";
    const roles = ".hero-role-inner";
    const reveals = ".hero-reveal";
    const chrome = ".hero-chrome";

    if (story.reducedMotion) {
      timeline.current = gsap
        .timeline()
        .to(q(".loader-ui"), { autoAlpha: 0, duration: 0.2 }, 0)
        .set(story, { intro: 1, build: 1 }, 0)
        .set([lines, roles], { yPercent: 0 }, 0)
        .set(reveals, { y: 0 }, 0)
        .to(loaderRef.current, { autoAlpha: 0, duration: 0.45, ease: "power1.out" }, 0.1)
        .to([reveals, chrome], { autoAlpha: 1, duration: 0.45 }, 0.3)
        .call(finish, [], 0.6);
      return;
    }

    const core = q(".loader-core-wrap");
    timeline.current = gsap
      .timeline()
      // 1. One restrained pulse; the UI steps aside.
      .to(q(".loader-ui"), { autoAlpha: 0, duration: 0.32, ease: "power2.in" }, 0)
      .to(core, { scale: 1.06, filter: "brightness(1.75)", duration: 0.38, ease: "power2.out" }, 0.04)
      .to(story, { pulse: 1, duration: 0.38, ease: "power2.out" }, 0.04)
      // 2. The seam lights across the centre.
      .fromTo(q(".loader-seam"), { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: 0.62, ease: "expo.out" }, 0.28)
      .to(core, { scale: 1, filter: "brightness(1.2)", duration: 0.6, ease: "power2.inOut" }, 0.46)
      .to(story, { pulse: 0, duration: 1.1, ease: "power2.inOut" }, 0.46)
      // 3. The halves open; the core is cut at the seam and leaves with them.
      .to(q(".loader-panel--top"), { yPercent: -52, duration: 1.4, ease: "power4.inOut" }, 0.72)
      .to(q(".loader-panel--bottom"), { yPercent: 52, duration: 1.4, ease: "power4.inOut" }, 0.72)
      .to(q(".loader-seam"), { autoAlpha: 0, duration: 0.3 }, 0.84)
      // 4. The world behind opens from the same core (single camera owner reads story.intro).
      .to(story, { intro: 1, duration: 2.9, ease: "none" }, 0.76)
      // 5. Identity arrives.
      .to(lines, { yPercent: 0, duration: 1.25, ease: "expo.out", stagger: 0.12 }, 1.5)
      // 6. With the name in place, the hologram ignites around the heart.
      .to(story, { build: 1, duration: 2.6, ease: "none" }, 2.05)
      .to(roles, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.09 }, 1.78)
      .to(reveals, { autoAlpha: 1, y: 0, duration: 1.0, ease: "expo.out", stagger: 0.12 }, 2.05)
      .to(chrome, { autoAlpha: 1, duration: 0.8, ease: "power2.out" }, 2.25)
      // Panels are off-screen: release the loader and scroll. Intro keeps easing the camera.
      .call(finish, [], 2.2);
  };

  const onSkip = () => {
    if (stage === "entered") return;
    timeline.current?.kill();
    setStory({ intro: 1, build: 1, pulse: 0 });
    setStage("entering");
    showHeroInstantly();
    timeline.current = gsap
      .timeline()
      .to(loaderRef.current, { autoAlpha: 0, duration: 0.3, ease: "power1.out" })
      .call(finish);
  };

  // Internal return (the loader already played in this document, or the visitor
  // came back from a standalone case study): never replay the loader.
  const skipped = useRef(false);
  useEffect(() => {
    if (skipped.current || stage !== "pre" || !hydrated) return;
    if (!caseNav.booted && !caseNav.returning) return;
    const id = requestAnimationFrame(() => {
      skipped.current = true;
      setStory({ intro: 1, build: 1, pulse: 0 });
      showHeroInstantly();
      finish();
    });
    return () => cancelAnimationFrame(id);
  }, [hydrated, stage]);

  // StoryDirector: the single, document-position-based scroll owner.
  useGSAP(
    () => {
      if (stage !== "entered") return;
      const reduced = story.reducedMotion;
      const cleanups: (() => void)[] = [];
      // Chapter anchors: measured section tops → track units. Piecewise linear,
      // so any scroll position maps to exactly one state in both directions.
      let anchors: [number, number][] = [[0, 0]];
      const measure = () => {
        // Layout positions, not transformed boxes: reveal timelines move the
        // titles, so getBoundingClientRect would shift with scroll state.
        const top = (sel: string) => {
          const el = document.querySelector<HTMLElement>(sel);
          return el ? layoutTop(el) : 0;
        };
        const bottom = (sel: string) => {
          const el = document.querySelector<HTMLElement>(sel);
          return el ? layoutTop(el) + el.offsetHeight : 0;
        };
        const end = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        anchors = [
          [0, 0],
          [top("#human"), 1],
          // Curiosity's track point is its title at 30% of the viewport, so the
          // heading, the world's hold frame and its discoveries meet on screen.
          [top("#curiosity-title") - window.innerHeight * 0.3, 2],
          [top("#engineering"), 3],
          // Intelligence anchors on its title too: the hold frame arrives with
          // its heading. Its last lines leave at 4.75, then the network loosens
          // and the camera turns toward the exhibition (4.75 → 6) across the
          // gap before Project Universe.
          [top("#intelligence-title") - window.innerHeight * 0.3, 4],
          [bottom("#intelligence") - window.innerHeight * 0.75, 4.75],
          // Project Universe: overview on its title, then one artifact per
          // half unit, each arriving with its exhibit title.
          [top("#projects-title") - window.innerHeight * 0.3, 6],
          // Portrait screens hold each exhibit title lower (50%), so the artifact
          // owns the top half of the screen instead of sitting behind the copy.
          ...projectStories.map((p, i) => [exhibitStop(p.id), 6.5 + i * 0.5] as [number, number]),
          [top("#timeline-title") - window.innerHeight * 0.3, 10],
          [top("#next-title") - window.innerHeight * 0.3, 11.5],
          [end, TRACK_MAX],
        ];
      };
      const trackAt = (y: number) => {
        for (let i = 1; i < anchors.length; i++) {
          const [y0, t0] = anchors[i - 1];
          const [y1, t1] = anchors[i];
          if (y <= y1 || i === anchors.length - 1) {
            const u = y1 > y0 ? (y - y0) / (y1 - y0) : 1;
            return t0 + (t1 - t0) * Math.min(1, Math.max(0, u));
          }
        }
        return 0;
      };
      const write = () => {
        const y = window.scrollY;
        // Hero exit keeps its original tuning: 1.5 viewports of travel.
        story.scroll = Math.min(1, Math.max(0, y / (1.5 * window.innerHeight)));
        story.track = trackAt(y);
        // The hero's left readability scrim relaxes once the story leaves it.
        const relax = Math.min(1, Math.max(0, (story.track - 0.4) / 0.5));
        rootRef.current?.style.setProperty("--hero-scrim", (1 - 0.7 * relax).toFixed(3));
        rootRef.current?.toggleAttribute("data-past-hero", story.track > 0.6);
        // Coarse chapter for CSS-only layers (the no-WebGL fallback colour story).
        const chapter = story.track < 0.6 ? "origin" : story.track < 1.8 ? "human" : story.track < 2.85 ? "curiosity" : story.track < 3.85 ? "engineering" : story.track < 5.2 ? "intelligence" : story.track < 9.6 ? "projects" : story.track < 11.05 ? "timeline" : "next";
        if (rootRef.current && rootRef.current.dataset.chapter !== chapter) rootRef.current.dataset.chapter = chapter;
      };
      ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: write,
        onRefresh: () => {
          measure();
          write();
        },
      });

      // Project Universe stops (corrective pass 2026-11-15): manual scrolling
      // with deliberate stops, not snapping. See projectGate.ts. The stops are
      // the establishing shot and each exhibit's showcase framing, measured
      // like the 3D track anchors so text, actions and artifact compose.
      // Reduced motion: no gate, plain native scrolling.
      if (!reduced) {
        const measureStops = () => {
          const vh = window.innerHeight;
          const title = document.querySelector<HTMLElement>("#projects-title");
          return [title ? layoutTop(title) - vh * 0.3 : 0, ...projectStories.map((p) => exhibitStop(p.id))].map(Math.round);
        };
        const gate = installProjectGate(measureStops);
        ScrollTrigger.addEventListener("refresh", gate.refresh);
        cleanups.push(() => {
          ScrollTrigger.removeEventListener("refresh", gate.refresh);
          gate.destroy();
        });
      }

      // Meet the Human: one timeline for the whole held stage (enter, hold, leave
      // just before the sticky stage releases). The gallery's own motion is not
      // scroll-owned; see experience/director/gallery.ts.
      if (!reduced) {
        const hv = gsap.utils.toArray<HTMLElement>("#human .hv");
        gsap
          .timeline({ scrollTrigger: { trigger: "#human", start: "top 85%", end: "bottom top", scrub: 0.5 } })
          .fromTo(hv, { opacity: 0, y: 40 }, { opacity: 1, y: 0, stagger: 0.025, duration: 0.14, ease: "power2.out" }, 0)
          .to(hv, { opacity: 0, y: -30, stagger: 0.015, duration: 0.1, ease: "power1.in" }, 0.6)
          .to({}, { duration: 0.01 }, 0.99);
      }

      // Chapter copy: each line owns one scrubbed timeline (enter, read, leave),
      // so no two tweens ever touch the same property.
      if (!reduced) {
        gsap.utils.toArray<HTMLElement>(".chapter .rv, #next .rv").forEach((el) => {
          // Opacity, not autoAlpha: copy that has not been revealed yet must stay
          // focusable, so keyboard users can Tab to it (focus scrolls it in).
          gsap
            .timeline({ scrollTrigger: { trigger: el, start: "top 96%", end: "bottom 14%", scrub: 0.5 } })
            .fromTo(el, { opacity: 0, y: 34 }, { opacity: 1, y: 0, duration: 0.22, ease: "power2.out" }, 0)
            .to(el, { opacity: 1, duration: 0.6 }, 0.22)
            .to(el, { opacity: 0, y: -24, duration: 0.18, ease: "power1.in" }, 0.82);
        });
      }

      gsap.fromTo(
        contentRef.current,
        { y: 0, opacity: 1 },
        {
          y: reduced ? 0 : -90,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: "#origin", start: "top top", end: "55% top", scrub: true },
        },
      );
      gsap.fromTo(
        ".scroll-cue-wrap",
        { autoAlpha: 1 },
        { autoAlpha: 0, ease: "none", scrollTrigger: { trigger: "#origin", start: "top top", end: "18% top", scrub: true } },
      );
      return () => cleanups.forEach((f) => f());
    },
    { dependencies: [stage], scope: rootRef },
  );

  const entered = stage === "entered";

  return (
    <div ref={rootRef} className="experience" data-stage={stage}>
      <div className="world" aria-hidden>
        <div className="world-fallback">
          <EnergyCore className="fallback-core" />
        </div>
        {webgl && (
          <div className="world-canvas-wrap" data-ready={sceneReady || undefined}>
            <WorldCanvas lowPower={lowPower} />
          </div>
        )}
        <div className="world-scrim" />
      </div>

      <TopBar inert={!entered} />

      <main id="main" className="story" inert={!entered}>
        <Hero contentRef={contentRef} titleRef={titleRef} />
        <Human webgl={webgl} />
        <Curiosity />
        <Engineering />
        <Intelligence />
        <ProjectUniverse />
        <TimelineNexus />
        <Closing />
      </main>

      {!entered && (
        <Loader
          phase={phase}
          steps={steps}
          degraded={degraded}
          onExplore={onExplore}
          onSkip={onSkip}
          rootRef={loaderRef}
          exploreRef={exploreRef}
        />
      )}
      <Cursor />
    </div>
  );
}
