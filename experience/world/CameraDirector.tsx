"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CatmullRomCurve3, PerspectiveCamera, Vector3 } from "three";
import { story } from "../director/store";
import { CAMERA_POS, CAMERA_TARGET, lensAt, TRACK_MAX } from "../chapters/layout";
import { easeInOutCubic, introDistance, smoothstep } from "./paths";

const DESKTOP_POS = new Vector3(-3.3, 0.5, 11);
const DESKTOP_TARGET = new Vector3(-2.95, 0.05, 0);
const MOBILE_POS = new Vector3(0, -0.95, 12.8);
const MOBILE_TARGET = new Vector3(0, -1.6, 0);
const UP = new Vector3(0, 1, 0);
/** Core assembly scale per layout once the hero is framed (1 = loader-matched). */
const CORE_SCALE_DESK = 0.9;
const CORE_SCALE_MOB = 0.6;
/** Outer ring radius plus a hair of glow, in core units. */
const CORE_EXTENT = 2.62;
/** Portrait workspace extremes (top of the upper callout, bottom of the lower callout). */
const PORTRAIT_TOP = new Vector3(-0.85, 2.15, 0);
const PORTRAIT_BOTTOM = new Vector3(0.8, -2.1, 0);

/**
 * Single owner of the camera. Combines three independent inputs:
 *  intro  (entrance timeline) → dolly from the loader-matched close-up to the hero frame
 *  scroll/track (story director) → hero exit, then reversible travel through the chapters
 *  pointer                    → small damped parallax on fine pointers
 * Each input is read, never written, so the controllers cannot fight.
 */
/** Reduced motion holds: hero, Meet the Human, Curiosity, Engineering, outro. */
function reducedHold(track: number) {
  if (track < 0.6) return 0;
  if (track < 1.75) return 1.2;
  if (track < 3.0) return 2.5;
  if (track < 3.95) return 3.6;
  if (track < 4.85) return 4.5;
  if (track < 5.9) return 5.5;
  if (track < 6.25) return 6.0;
  // Project Universe: hold on the nearest artifact.
  if (track < 9.25) return Math.min(9, Math.max(6.5, Math.round(track * 2) / 2));
  if (track < 10.75) return 10.0;
  if (track < 11.25) return 11.0;
  return 11.5;
}

export function CameraDirector() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);

  const sm = useRef({ scroll: 0, track: 0, px: 0, py: 0 });
  const tmp = useMemo(
    () => ({
      heroPos: new Vector3(),
      heroTarget: new Vector3(),
      pos: new Vector3(),
      target: new Vector3(),
      a: new Vector3(),
      b: new Vector3(),
      dir: new Vector3(),
      right: new Vector3(),
      rel: new Vector3(),
      shift: new Vector3(),
      up: new Vector3(),
      vshift: new Vector3(),
    }),
    [],
  );

  const aspect = size.width / Math.max(1, size.height);
  const layout = smoothstep(0.72, 1.25, aspect); // 0 = portrait/mobile, 1 = landscape

  const paths = useMemo(() => {
    const heroPos = MOBILE_POS.clone().lerp(DESKTOP_POS, layout);
    const heroTarget = MOBILE_TARGET.clone().lerp(DESKTOP_TARGET, layout);
    // One path through every chapter: keyframes every half track unit.
    const pos = new CatmullRomCurve3([heroPos, ...CAMERA_POS.slice(1)], false, "centripetal");
    const target = new CatmullRomCurve3([heroTarget, ...CAMERA_TARGET.slice(1)], false, "centripetal");
    return { heroPos, heroTarget, pos, target };
  }, [layout]);

  const lensOn = useRef(false);

  useFrame((_, dt) => {
    const k = 1 - Math.exp(-Math.min(dt, 0.1) * 5.5);
    const reduced = story.reducedMotion;
    // Damped follow of document scroll: smooth, but converges exactly, so reversal is deterministic.
    sm.current.scroll += (story.scroll - sm.current.scroll) * k;
    if (Math.abs(story.scroll - sm.current.scroll) < 1e-5) sm.current.scroll = story.scroll;
    // Reduced motion: no travel. The camera cuts between chapter holds instead.
    const goal = reduced ? reducedHold(story.track) : story.track;
    const kt = reduced ? 1 : 1 - Math.exp(-Math.min(dt, 0.1) * 4.2);
    sm.current.track += (goal - sm.current.track) * kt;
    if (Math.abs(goal - sm.current.track) < 1e-4) sm.current.track = goal;
    sm.current.px += ((reduced ? 0 : story.pointer.x) - sm.current.px) * k * 0.6;
    sm.current.py += ((reduced ? 0 : story.pointer.y) - sm.current.py) * k * 0.6;

    story.view.scroll = sm.current.scroll;
    story.view.track = sm.current.track;
    story.view.px = sm.current.px;
    story.view.py = sm.current.py;

    const s = Math.min(1, Math.max(0, sm.current.track / TRACK_MAX));
    const intro = easeInOutCubic(smoothstep(0.04, 1.0, story.intro));

    // Framing: on wide layouts keep the outer ring clear of the measured name/copy.
    // Translating the camera along its right vector moves the core on screen by an
    // exact amount at the core's depth, so this solves directly, no iteration.
    const base = { pos: paths.heroPos, target: paths.heroTarget };
    tmp.dir.subVectors(base.target, base.pos).normalize();
    tmp.right.crossVectors(tmp.dir, UP).normalize();
    tmp.rel.copy(base.pos).negate();
    const depth = tmp.rel.dot(tmp.dir);
    const f = size.height / (2 * Math.tan((camera.fov * Math.PI) / 360));
    const xs = size.width / 2 + (tmp.rel.dot(tmp.right) / depth) * f;
    let fit = 1;
    let shiftPx = 0;
    if (story.textRightPx > 0 && layout > 0) {
      const ring = CORE_EXTENT * CORE_SCALE_DESK * (f / depth);
      const gap = size.width * 0.03;
      const room = size.width - story.textRightPx - gap;
      // Ring may bleed past the right edge by up to 45% of its radius; shrink if still too tight.
      fit = Math.min(1, Math.max(0.72, room / (ring * 1.55)));
      const want = story.textRightPx + gap + ring * fit;
      shiftPx = Math.max(0, Math.min(want, size.width - ring * fit * 0.55) - xs);
    }
    const settle = 1 - smoothstep(0, 0.3, sm.current.scroll);
    tmp.shift.copy(tmp.right).multiplyScalar((-shiftPx * depth) / f * layout * settle);

    // Portrait: fit the workspace (top instrument → bottom instrument) between the
    // top bar and the measured copy. Dolly back when the band is too short, then
    // centre the workspace in it. Offsets from screen centre scale by 1/dolly.
    if (story.textTopPx > 0 && layout < 1) {
      tmp.up.crossVectors(tmp.right, tmp.dir);
      const yOf = (p: Vector3) => {
        tmp.rel.subVectors(p, base.pos);
        return size.height / 2 - (tmp.rel.dot(tmp.up) / tmp.rel.dot(tmp.dir)) * f;
      };
      const yTop = yOf(PORTRAIT_TOP);
      const yBot = yOf(PORTRAIT_BOTTOM);
      const bandTop = 80;
      const bandBot = story.textTopPx - 14;
      const avail = Math.max(120, bandBot - bandTop);
      const dolly = Math.max(1, (yBot - yTop) / avail);
      const centre = size.height / 2 + ((yTop + yBot) / 2 - size.height / 2) / dolly;
      const want = (bandTop + bandBot) / 2;
      // Moving the camera down moves the scene up on screen.
      tmp.vshift.copy(tmp.up).multiplyScalar(((want - centre) * depth * dolly) / f);
      tmp.vshift.addScaledVector(tmp.dir, -(dolly - 1) * depth);
      tmp.shift.addScaledVector(tmp.vshift, (1 - layout) * settle);
    }
    const framedScale = CORE_SCALE_MOB + (CORE_SCALE_DESK * fit - CORE_SCALE_MOB) * layout;
    story.view.coreScale = 1 + (framedScale - 1) * intro;

    // Hero frame, advanced along the scroll path.
    paths.pos.getPoint(s, tmp.heroPos);
    paths.target.getPoint(s, tmp.heroTarget);

    // Loader-matched close-up: the 3D core sits where the SVG core was.
    const d = introDistance(story.coreSizePx, size.height);
    tmp.a.set(0, 0, d);
    tmp.b.set(0, 0, 0);

    tmp.heroPos.add(tmp.shift);
    tmp.heroTarget.add(tmp.shift);
    // Portrait chapters: pull back along the view so worlds fit the narrow frame.
    const pull = 1 + 0.6 * (1 - layout) * smoothstep(0.5, 1.0, sm.current.track);
    tmp.heroPos.sub(tmp.heroTarget).multiplyScalar(pull).add(tmp.heroTarget);
    tmp.pos.copy(tmp.a).lerp(tmp.heroPos, intro);
    tmp.target.copy(tmp.b).lerp(tmp.heroTarget, intro);

    // Case-study opening: push in toward the chosen artifact (eased, reversible).
    const ca = story.universe.caseAmt;
    if (ca > 0) tmp.pos.lerp(tmp.target, 0.24 * easeInOutCubic(ca));

    // Pointer parallax scales in with the intro so the split stays perfectly still.
    tmp.pos.x += sm.current.px * 0.45 * intro;
    tmp.pos.y += sm.current.py * 0.28 * intro;

    camera.position.copy(tmp.pos);
    camera.lookAt(tmp.target);

    // Lens shift leaves room for each chapter's copy without turning the camera.
    const lens = lensAt(sm.current.track);
    // Case study open: the artifact moves up and right, clear of the case title.
    const cl = easeInOutCubic(story.universe.caseAmt);
    const lx = (lens.x + 0.1 * cl) * layout;
    const ly = lens.y * (1 - layout) + cl * (0.14 * layout - 0.08 * (1 - layout));
    if (Math.abs(lx) > 1e-4 || Math.abs(ly) > 1e-4) {
      camera.setViewOffset(size.width, size.height, -lx * size.width, ly * size.height, size.width, size.height);
      lensOn.current = true;
    } else if (lensOn.current) {
      camera.clearViewOffset();
      lensOn.current = false;
    }
  });

  return null;
}
