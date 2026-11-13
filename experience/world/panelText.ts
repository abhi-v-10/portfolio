import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, NoColorSpace } from "three";
import { highlights } from "@/content/site";

/**
 * Hologram callouts around the core: one fact each, drawn as text masks.
 * Channels: R = primary ink (tinted cyan in the shader), G = highlight ink.
 * Copy comes from content/site.ts only.
 */
export type ChipId = keyof typeof highlights;

export const CHIP_ASPECT = 3.1;
const W = 1024;
const H = Math.round(W / CHIP_ASPECT);
const MAIN = "#ff0000";
const HI = "#00ff00";

function fontVars() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string, f: string) => cs.getPropertyValue(n).trim() || f;
  return { display: v("--font-display", "sans-serif"), mono: v("--font-mono", "monospace") };
}

/** Fit a single line to a width by stepping the size down. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: number, family: string, size: number, max: number, track = 0) {
  let s = size;
  for (; s > 24; s -= 2) {
    ctx.font = `${weight} ${s}px ${family}`;
    if (ctx.measureText(text).width + track * text.length <= max) break;
  }
  return s;
}

function tracked(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, track: number) {
  let cx = x;
  for (const c of text) {
    ctx.fillText(c, cx, y);
    cx += ctx.measureText(c).width + track;
  }
}

function drawChip(ctx: CanvasRenderingContext2D, id: ChipId) {
  const f = fontVars();
  const { title, sub } = highlights[id];
  const pad = 64;
  const max = W - pad * 2;

  // Signal tick: a short Core Energy bar, the chip's only ornament.
  ctx.fillStyle = HI;
  ctx.fillRect(pad, 70, 46, 7);

  ctx.fillStyle = HI;
  fitFont(ctx, title, 700, f.display, 96, max);
  ctx.fillText(title, pad, 196);

  ctx.fillStyle = MAIN;
  const label = sub.toUpperCase();
  const track = 7;
  fitFont(ctx, label, 500, f.mono, 44, max, track);
  tracked(ctx, label, pad, 272, track);
}

export function createChipTexture(id: ChipId, anisotropy = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = NoColorSpace;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.magFilter = LinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = anisotropy;

  const draw = () => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    ctx.textBaseline = "alphabetic";
    drawChip(ctx, id);
    tex.needsUpdate = true;
  };
  draw();
  // Webfonts can arrive after the first draw: redraw once they are ready.
  document.fonts?.ready.then(draw);
  return tex;
}

/** Single-line mono label (R channel), for world-space signage. */
export function createLabelTexture(text: string, anisotropy = 1) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = NoColorSpace;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.magFilter = LinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = anisotropy;
  const draw = () => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { mono } = fontVars();
    ctx.clearRect(0, 0, 512, 128);
    ctx.fillStyle = "#ff0000";
    const label = text.toUpperCase();
    const track = 8;
    let size = 60;
    for (; size > 24; size -= 2) {
      ctx.font = `600 ${size}px ${mono}`;
      if (ctx.measureText(label).width + track * label.length <= 470) break;
    }
    const w = ctx.measureText(label).width + track * (label.length - 1);
    ctx.textBaseline = "middle";
    tracked(ctx, label, 256 - w / 2, 66, track);
    tex.needsUpdate = true;
  };
  draw();
  document.fonts?.ready.then(draw);
  return tex;
}
