"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import { Color, Fog, Group } from "three";
import { story } from "../director/store";

// Fog per chapter: [track, colour, near, far]. The hero's navy, Curiosity's
// violet haze (closer, softer), Engineering's deep clear blue (farther, crisper).
// Meet the Human sits between: a warm lavender dusk, softer than the hero.
const STOPS: [number, string, number, number][] = [
  [0, "#111528", 14, 46],
  [0.8, "#1b1718", 13, 48], // Meet the Human: warm graphite studio
  [1.5, "#2a2440", 13, 50],
  [2.3, "#2a2156", 9, 52],
  [2.85, "#231d52", 10, 56],
  [3.35, "#0e131a", 16, 70], // Engineering: slate
  [3.9, "#10161e", 18, 74],
  [4.4, "#071419", 16, 74], // Intelligence: ink and deep teal
  [5.2, "#2a1840", 14, 70], // Intelligence → Universe transition: warm violet
  [5.85, "#2d1c42", 16, 82],
  [6.3, "#0c0d11", 14, 60], // Project Universe: a charcoal gallery, each artifact its own light
  [9.2, "#0c0d11", 14, 60],
  [10.0, "#0b2420", 12, 58], // Timeline Nexus: deep jade night
  [10.9, "#10302a", 12, 60],
  [11.6, "#3b2f52", 18, 80], // Next Chapter: airy lavender dawn
  [12, "#43355a", 18, 84],
];

/** Single owner of scene fog after SceneSetup creates it. */
export function Atmosphere() {
  const scene = useThree((s) => s.scene);
  const cols = useMemo(() => STOPS.map((s) => new Color(s[1])), []);
  useFrame(() => {
    const fog = scene.fog as Fog | null;
    if (!fog) return;
    const tr = story.view.track;
    let i = 0;
    while (i < STOPS.length - 2 && tr > STOPS[i + 1][0]) i++;
    const u = Math.min(1, Math.max(0, (tr - STOPS[i][0]) / (STOPS[i + 1][0] - STOPS[i][0])));
    const e = u * u * (3 - 2 * u);
    fog.color.copy(cols[i]).lerp(cols[i + 1], e);
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
