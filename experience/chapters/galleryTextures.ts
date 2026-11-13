import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, NoColorSpace, Texture, TextureLoader } from "three";
import type { GalleryPhoto } from "@/content/gallery";

const TONES: Record<GalleryPhoto["tone"], [string, string, string]> = {
  lavender: ["#2b2350", "#7e6bc9", "#d9cff7"],
  cyan: ["#132a45", "#3f8fb8", "#bfefff"],
  peach: ["#3a2433", "#c47b6d", "#ffd7c2"],
  violet: ["#221a46", "#6750c8", "#cbbcff"],
};

/**
 * A clearly marked placeholder card (no imagery of a person): tone gradient,
 * crop marks, a rhombus and the slot's title. Values are written to the
 * screen as authored (no colour-space conversion in the frame shader).
 */
function placeholder(photo: GalleryPhoto) {
  const W = 640;
  const H = 800;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const tex = new CanvasTexture(c);
  const draw = () => {
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const [a, b, hi] = TONES[photo.tone];
    const cs = getComputedStyle(document.documentElement);
    const mono = cs.getPropertyValue("--font-mono").trim() || "monospace";
    const display = cs.getPropertyValue("--font-display").trim() || "sans-serif";
    const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
    g.addColorStop(0, b);
    g.addColorStop(1, a);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const r = ctx.createRadialGradient(W * 0.62, H * 0.32, 10, W * 0.62, H * 0.32, W * 0.75);
    r.addColorStop(0, hi + "55");
    r.addColorStop(1, hi + "00");
    ctx.fillStyle = r;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = hi + "aa";
    ctx.lineWidth = 3;
    const m = 44;
    const k = 46;
    for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]] as const) {
      ctx.beginPath();
      ctx.moveTo(x, y + sy * k);
      ctx.lineTo(x, y);
      ctx.lineTo(x + sx * k, y);
      ctx.stroke();
    }
    // Rhombus mark (the site's heart), drawn, not a glyph.
    ctx.save();
    ctx.translate(W / 2, H * 0.42);
    ctx.strokeStyle = hi + "cc";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -70);
    ctx.lineTo(44, 0);
    ctx.lineTo(0, 70);
    ctx.lineTo(-44, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = "center";
    ctx.fillStyle = "#f6f4fa";
    ctx.font = `700 46px ${display}`;
    ctx.fillText(photo.title.split("·")[0].trim().toUpperCase(), W / 2, H * 0.66);
    ctx.fillStyle = hi;
    ctx.font = `500 28px ${mono}`;
    ctx.fillText((photo.title.split("·")[1] ?? "").trim().toUpperCase(), W / 2, H * 0.66 + 48);
    ctx.fillStyle = "#f6f4fa99";
    ctx.font = `500 22px ${mono}`;
    ctx.fillText("PLACEHOLDER · PHOTO TO BE SUPPLIED", W / 2, H - 84);
    tex.needsUpdate = true;
  };
  draw();
  document.fonts?.ready.then(draw);
  return tex;
}

/** Texture for a gallery slot: the real photo when `src` is set, else the placeholder. */
export function galleryTexture(photo: GalleryPhoto, onCrop: (crop: [number, number]) => void): Texture {
  const finish = (t: Texture) => {
    t.colorSpace = NoColorSpace;
    t.minFilter = LinearMipmapLinearFilter;
    t.magFilter = LinearFilter;
    t.generateMipmaps = true;
    return t;
  };
  if (!photo.src) {
    onCrop([1, 1]);
    return finish(placeholder(photo));
  }
  const fallback = finish(placeholder(photo));
  const tex = new TextureLoader().load(
    photo.src,
    (t) => {
      // Cover-fit into the 4:5 frame.
      const img = t.image as { width: number; height: number };
      const a = img.width / img.height;
      const frame = 4 / 5;
      onCrop(a > frame ? [frame / a, 1] : [1, a / frame]);
      t.needsUpdate = true;
    },
    undefined,
    () => onCrop([1, 1]),
  );
  finish(tex);
  return tex ?? fallback;
}
