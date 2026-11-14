import gsap from "gsap";
import { projectStories } from "@/content/projects";
import { story } from "@/experience/director/store";

/**
 * Case-study navigation state shared by the home experience, the intercepted
 * overlay and the standalone page. Module scope survives client navigations,
 * so it also tells the home experience that the loader has already played.
 */
export const caseNav = {
  /** The element that opened the overlay; focus returns here on close. */
  opener: null as HTMLElement | null,
  /** True once the loader has played in this document; never replay it on internal returns. */
  booted: false,
  /** Set by the standalone page's way back, so the home skips the loader. */
  returning: false,
};

export const projectIndex = (id: string) => projectStories.findIndex((p) => p.id === id);

/**
 * Opening choreography: the chosen artifact stays lit while the universe
 * recedes and the camera pushes in; then navigate. `go` performs the route
 * change (router.push), so this module stays router-agnostic.
 */
export function playCaseOpen(id: string, opener: HTMLElement | null, go: () => void) {
  caseNav.opener = opener;
  story.universe.caseFocus = projectIndex(id);
  document.documentElement.dataset.case = "opening";
  gsap.killTweensOf(story.universe);
  if (story.reducedMotion) {
    story.universe.caseAmt = 1;
    go();
    return;
  }
  gsap.to(story.universe, { caseAmt: 1, duration: 0.6, ease: "power2.inOut", onComplete: go });
}

/** Reverse: the universe returns around the artifact. */
export function playCaseReturn() {
  gsap.killTweensOf(story.universe);
  const done = () => {
    story.universe.caseFocus = -1;
  };
  delete document.documentElement.dataset.case;
  if (story.reducedMotion) {
    story.universe.caseAmt = 0;
    done();
    return;
  }
  gsap.to(story.universe, { caseAmt: 0, duration: 0.85, ease: "power2.inOut", onComplete: done });
}
