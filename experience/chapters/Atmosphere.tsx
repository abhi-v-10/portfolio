"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import { Fog, Group, SRGBColorSpace } from "three";
import { paletteAt, withFinale } from "../director/palette";
import { story } from "../director/store";

// Fog per chapter: [track, colour (historical; the colour now comes from
// palette.ts), near, far]. The hero's navy, Curiosity's
// violet haze (closer, softer), Engineering's deep clear blue (farther, crisper).
// Meet the Human sits between: a warm lavender dusk, softer than the hero.
const STOPS: [number, string, number, number][] = [
  // 2026-11-25: fog sits close to the ink ground and starts farther away, so
  // distant objects darken into the room instead of greying out.
  [0, "#0f0d0b", 20, 60],
  [0.8, "#17120e", 18, 62],
  [1.5, "#17120f", 18, 64],
  [2.3, "#121416", 16, 66],
  [2.85, "#111315", 16, 70],
  [3.35, "#0f0d0a", 22, 84],
  [3.9, "#110f0b", 24, 88],
  [4.4, "#0f1112", 22, 88], // Intelligence: deep slate, copper pulses
  [5.2, "#140f0c", 20, 84], // Intelligence → Universe transition: clay
  [5.85, "#16100d", 22, 92],
  [6.3, "#0e0c0a", 20, 76], // Project Universe: a dark exhibition hall, each artifact its own light
  [9.2, "#0e0c0a", 20, 76],
  [10.0, "#0f100b", 18, 72], // Timeline Nexus: olive night
  [10.9, "#12140d", 18, 74],
  [11.6, "#20160f", 22, 92], // Next Chapter: clay dawn
  [12, "#261a12", 22, 96],
];

/** Single owner of scene fog after SceneSetup creates it. */
export function Atmosphere() {
  const scene = useThree((s) => s.scene);
  useFrame(() => {
    const fog = scene.fog as Fog | null;
    if (!fog) return;
    const tr = story.view.track;
    let i = 0;
    while (i < STOPS.length - 2 && tr > STOPS[i + 1][0]) i++;
    const u = Math.min(1, Math.max(0, (tr - STOPS[i][0]) / (STOPS[i + 1][0] - STOPS[i][0])));
    const e = u * u * (3 - 2 * u);
    // Fog colour is the chapter ground (palette.ts), so distant objects fade
    // into the same sky the DOM sits on; by day they fade into the light.
    const g = withFinale(paletteAt(tr), story.finale).ground;
    fog.color.setRGB(g[0], g[1], g[2], SRGBColorSpace);
    fog.near = STOPS[i][2] + (STOPS[i + 1][2] - STOPS[i][2]) * e;
    fog.far = STOPS[i][3] + (STOPS[i + 1][3] - STOPS[i][3]) * e;
  });
  return null;
}

/** Shows its children only while the story is inside [from, to] (track units). */
export function ChapterGate({ from, to, children }: { from: number; to: number; children: ReactNode }) {
  const g = useRef<Group>(null);
  useFrame(() => {
    if (g.current) g.current.visible = story.view.track > from && story.view.track < to;
  });
  return <group ref={g}>{children}</group>;
}
