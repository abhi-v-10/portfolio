import { CanvasTexture, LinearFilter, LinearMipmapLinearFilter, NoColorSpace } from "three";

/**
 * Project Universe surfaces, drawn once on 2D canvases: device screens, the
 * IRIS receipt, the ELI5 text, the QP-Gen exam paper and the Scholaroid role
 * panels. Everything is original, generic UI (no OS screenshots, logos or
 * manufacturer marks). Every number and name on these surfaces is fictional
 * demonstration data and is labelled SAMPLE where it could be mistaken for
 * real information.
 *
 * Colours are display sRGB and the textures use NoColorSpace, matching the
 * world's display-space shaders.
 */

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, f: Fonts) => void;
type Fonts = { sans: string; mono: string; display: string };

const registry: { tex: CanvasTexture; draw: Draw; ctx: CanvasRenderingContext2D; w: number; h: number; k: number }[] = [];

function fonts(): Fonts {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string, f: string) => (cs.getPropertyValue(n).trim() || "") + (cs.getPropertyValue(n).trim() ? `, ${f}` : f);
  return { sans: v("--font-sans", "system-ui, sans-serif"), mono: v("--font-mono", "ui-monospace, monospace"), display: v("--font-display", "system-ui, sans-serif") };
}

/**
 * Supersampling (overhaul 2026-11-14): surfaces are drawn at k× their logical
 * size so screen text stays crisp on high-density desktops, where the camera
 * often frames a screen larger than its 1:1 texel size. Coarse-pointer
 * (phone/tablet) devices keep 1× to protect memory.
 */
function superSample() {
  if (typeof window === "undefined") return 1;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if (coarse) return 1;
  return (window.devicePixelRatio || 1) >= 1.5 ? 2 : 1.5;
}

function make(w: number, h: number, draw: Draw) {
  const k = superSample();
  const c = document.createElement("canvas");
  c.width = Math.round(w * k);
  c.height = Math.round(h * k);
  const ctx = c.getContext("2d")!;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  draw(ctx, w, h, fonts());
  const tex = new CanvasTexture(c);
  tex.colorSpace = NoColorSpace;
  tex.minFilter = LinearMipmapLinearFilter;
  tex.magFilter = LinearFilter;
  tex.anisotropy = 8;
  registry.push({ tex, draw, ctx, w, h, k });
  return tex;
}

/** Webfonts can land after the scene is built: redraw every surface once they do. */
export function redrawWhenFontsReady() {
  if (typeof document === "undefined") return;
  document.fonts.ready.then(() => {
    const f = fonts();
    registry.forEach(({ tex, draw, ctx, w, h, k }) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      draw(ctx, w, h, f);
      tex.needsUpdate = true;
    });
  });
}

/* ───────── drawing helpers ───────── */
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
function fillRR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient) {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}
function strokeRR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number, stroke: string, lw = 2) {
  rr(ctx, x, y, w, h, r);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.stroke();
}
function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, font: string, color: string, align: CanvasTextAlign = "left") {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(s, x, y);
}
function wrap(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, max: number, lh: number, font: string, color: string) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  let line = "";
  let yy = y;
  for (const word of s.split(" ")) {
    const t = line ? `${line} ${word}` : word;
    if (ctx.measureText(t).width > max && line) {
      ctx.fillText(line, x, yy);
      line = word;
      yy += lh;
    } else line = t;
  }
  if (line) ctx.fillText(line, x, yy);
  return yy;
}
/** A soft card: dark glass with a hairline and an accent tick. */
function card(ctx: CanvasRenderingContext2D, w: number, h: number, accent: string, r = 28) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "rgba(22,26,48,0.94)");
  g.addColorStop(1, "rgba(10,12,26,0.94)");
  fillRR(ctx, 3, 3, w - 6, h - 6, r, g);
  strokeRR(ctx, 3, 3, w - 6, h - 6, r, hexA(accent, 0.55), 3);
}
function hexA(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/* ───────── WiniOS: laptop and phone ───────── */
export type DeviceState = "idle" | "sending" | "received";

/** Windows-style desktop (original, generic): wallpaper, the WiniOS settings window, a centred taskbar. */
export function laptopScreen(state: DeviceState) {
  return make(1024, 640, (ctx, w, h, f) => {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#0b1f4a");
    bg.addColorStop(0.55, "#16357a");
    bg.addColorStop(1, "#0e5a78");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    // Soft abstract bloom (original wallpaper).
    const bl = ctx.createRadialGradient(w * 0.72, h * 0.32, 10, w * 0.72, h * 0.32, w * 0.55);
    bl.addColorStop(0, "rgba(115,223,255,0.55)");
    bl.addColorStop(1, "rgba(115,223,255,0)");
    ctx.fillStyle = bl;
    ctx.fillRect(0, 0, w, h);
    // Window.
    const wx = 150, wy = 70, ww = 600, wh = 420;
    fillRR(ctx, wx, wy, ww, wh, 14, "rgba(24,28,44,0.96)");
    fillRR(ctx, wx, wy, ww, 44, 14, "rgba(36,41,62,1)");
    ctx.fillRect(wx, wy + 30, ww, 14);
    text(ctx, "WiniOS · Settings", wx + 22, wy + 29, `600 19px ${f.sans}`, "#e8ecff");
    ["—", "▢", "✕"].forEach((s, i) => text(ctx, s, wx + ww - 90 + i * 32, wy + 29, `500 17px ${f.sans}`, "#9aa6c8"));
    const items = ["General", "Connection", "Clipboard", "Images", "Privacy", "About"];
    items.forEach((it, i) => {
      if (i === 2) fillRR(ctx, wx + 12, wy + 62 + i * 46, 160, 36, 8, "rgba(115,223,255,0.16)");
      text(ctx, it, wx + 28, wy + 87 + i * 46, `500 18px ${f.sans}`, i === 2 ? "#bff4ff" : "#aab3d4");
    });
    const cx = wx + 200;
    text(ctx, "Clipboard", cx, wy + 92, `700 26px ${f.sans}`, "#f6f4fa");
    const rows: [string, string][] = [
      ["Agent", "Running"],
      ["Transport", "HTTPS · TLS 1.3"],
      ["Network", "Private only"],
      ["Text", "On"],
      ["Images", "On · up to 4 MiB"],
    ];
    rows.forEach(([k, v], i) => {
      const y = wy + 140 + i * 50;
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(cx, y + 14, 370, 1);
      text(ctx, k, cx, y, `500 18px ${f.sans}`, "#aab3d4");
      text(ctx, v, cx + 370, y, `600 18px ${f.sans}`, i === 0 ? "#7cf5c4" : "#e8ecff", "right");
    });
    // Taskbar: centred, generic icons.
    ctx.fillStyle = "rgba(14,18,34,0.92)";
    ctx.fillRect(0, h - 54, w, 54);
    const icons = ["#73dfff", "#ffc861", "#9a86ff", "#7cf5c4", "#f17e98"];
    const start = w / 2 - (icons.length * 46) / 2;
    icons.forEach((c, i) => fillRR(ctx, start + i * 46 + 6, h - 44, 34, 34, 9, i === 0 ? "rgba(255,255,255,0.9)" : hexA(c, 0.85)));
    // Tray: the WiniOS agent mark (an original bridge glyph) + clock.
    ctx.strokeStyle = "#73dfff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(w - 150, h - 20, 10, Math.PI, 0);
    ctx.stroke();
    text(ctx, "9:41", w - 40, h - 20, `600 17px ${f.sans}`, "#e8ecff", "right");

    if (state !== "idle") {
      const tx = w - 360, ty = h - 170;
      fillRR(ctx, tx, ty, 340, 100, 14, "rgba(30,36,58,0.98)");
      strokeRR(ctx, tx, ty, 340, 100, 14, state === "received" ? "rgba(124,245,196,0.9)" : "rgba(115,223,255,0.9)", 2.5);
      text(ctx, state === "received" ? "Received from iPhone" : "Sending to iPhone…", tx + 22, ty + 40, `700 20px ${f.sans}`, "#f6f4fa");
      text(ctx, state === "received" ? "Text pasted to clipboard · encrypted" : "Clipboard text · over HTTPS", tx + 22, ty + 72, `500 16px ${f.sans}`, "#aab3d4");
    }
  });
}

export function keyboardTexture() {
  return make(1024, 640, (ctx, w, h) => {
    ctx.fillStyle = "#151a2c";
    ctx.fillRect(0, 0, w, h);
    const cols = 14, rows = 5, kx = 70, ky = 40, kw = (w - 140) / cols, kh = 58;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        fillRR(ctx, kx + c * kw + 4, ky + r * (kh + 8), kw - 8, kh, 8, "#262c44");
      }
    }
    fillRR(ctx, kx + 4 * kw, ky + rows * (kh + 8), 6 * kw, kh, 8, "#262c44");
    fillRR(ctx, w / 2 - 170, h - 210, 340, 190, 16, "#1e2338");
    strokeRR(ctx, w / 2 - 170, h - 210, 340, 190, 16, "rgba(255,255,255,0.08)", 2);
  });
}

/** iPhone-style screen (original, generic): status bar, island, a Shortcuts-like tile grid. */
export function phoneScreen(state: DeviceState) {
  return make(512, 1056, (ctx, w, h, f) => {
    ctx.save();
    rr(ctx, 0, 0, w, h, 70);
    ctx.clip();
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#1b1340");
    bg.addColorStop(0.6, "#2a1d63");
    bg.addColorStop(1, "#0f2850");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    fillRR(ctx, w / 2 - 70, 26, 140, 40, 20, "#000");
    text(ctx, "9:41", 56, 56, `600 26px ${f.sans}`, "#fff");
    fillRR(ctx, w - 92, 38, 44, 20, 6, "rgba(255,255,255,0.85)");
    text(ctx, "Shortcuts", 36, 180, `700 46px ${f.sans}`, "#fff");
    const tiles: [string, string][] = [
      ["Send to PC", "#2fb7e0"],
      ["Get from PC", "#7a5cff"],
      ["Send image", "#e05a8a"],
      ["Clipboard type", "#2f9e7a"],
    ];
    tiles.forEach(([label, c], i) => {
      const x = 32 + (i % 2) * 230, y = 230 + Math.floor(i / 2) * 230;
      const active = state === "sending" && i === 0;
      fillRR(ctx, x, y, 214, 210, 32, active ? "#bff4ff" : c);
      fillRR(ctx, x + 24, y + 24, 54, 54, 14, "rgba(255,255,255,0.3)");
      text(ctx, label, x + 24, y + 182, `700 26px ${f.sans}`, active ? "#0b1f4a" : "#fff");
      if (active) text(ctx, "Running…", x + 24, y + 146, `600 22px ${f.sans}`, "#0b1f4a");
    });
    if (state === "received") {
      fillRR(ctx, 20, 84, w - 40, 128, 30, "rgba(245,246,252,0.96)");
      fillRR(ctx, 40, 106, 50, 50, 12, "#2fb7e0");
      text(ctx, "WINIOS", 106, 124, `700 20px ${f.sans}`, "#56607a");
      text(ctx, "Received from PC", 106, 156, `700 26px ${f.sans}`, "#0b1020");
      text(ctx, "Copied to clipboard", 106, 188, `500 22px ${f.sans}`, "#56607a");
    }
    fillRR(ctx, w / 2 - 70, h - 26, 140, 8, 4, "rgba(255,255,255,0.8)");
    ctx.restore();
  });
}

/** A clipboard packet in transit: text or image, sealed. */
export function packetTexture(kind: "text" | "image") {
  return make(512, 300, (ctx, w, h, f) => {
    card(ctx, w, h, "#73dfff", 34);
    if (kind === "text") {
      text(ctx, "Aa", 40, 120, `700 72px ${f.sans}`, "#bff4ff");
      text(ctx, "Clipboard · text", 170, 86, `700 28px ${f.sans}`, "#f6f4fa");
      fillRR(ctx, 170, 110, 260, 14, 7, "rgba(191,244,255,0.5)");
      fillRR(ctx, 170, 136, 190, 14, 7, "rgba(191,244,255,0.35)");
    } else {
      fillRR(ctx, 40, 50, 110, 90, 14, "#2a3d74");
      ctx.fillStyle = "#ffc861";
      ctx.beginPath();
      ctx.arc(120, 78, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#7cf5c4";
      ctx.beginPath();
      ctx.moveTo(48, 132);
      ctx.lineTo(90, 88);
      ctx.lineTo(140, 132);
      ctx.fill();
      text(ctx, "Clipboard · image", 170, 86, `700 28px ${f.sans}`, "#f6f4fa");
      text(ctx, "PNG", 170, 130, `600 24px ${f.mono}`, "#bff4ff");
    }
    // Seal: lock + transport.
    fillRR(ctx, 40, 196, w - 80, 64, 32, "rgba(115,223,255,0.14)");
    ctx.strokeStyle = "#bff4ff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(80, 222, 11, Math.PI, 0);
    ctx.stroke();
    fillRR(ctx, 64, 222, 32, 26, 5, "#bff4ff");
    text(ctx, "HTTPS · Bearer · private network", 112, 238, `600 22px ${f.mono}`, "#bff4ff");
  });
}

/* ───────── JobSeek ───────── */
export function profileCard() {
  return make(512, 640, (ctx, w, h, f) => {
    card(ctx, w, h, "#ffc861");
    text(ctx, "CANDIDATE · SAMPLE", 40, 66, `600 20px ${f.mono}`, "#ffd98a");
    ctx.fillStyle = "#3a3320";
    ctx.beginPath();
    ctx.arc(84, 140, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffc861";
    ctx.beginPath();
    ctx.arc(84, 126, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(84, 178, 30, Math.PI, 0);
    ctx.fill();
    text(ctx, "Your profile", 148, 132, `700 32px ${f.sans}`, "#fff6dc");
    text(ctx, "Résumé · uploaded", 148, 168, `500 22px ${f.sans}`, "#c9bf9f");
    [300, 260, 330, 220].forEach((len, i) => fillRR(ctx, 40, 236 + i * 34, len, 14, 7, "rgba(255,217,138,0.28)"));
    text(ctx, "SKILLS", 40, 420, `600 20px ${f.mono}`, "#ffd98a");
    const chips = ["Python", "Django", "React", "SQL", "REST"];
    let x = 40, y = 444;
    ctx.font = `600 22px ${f.sans}`;
    chips.forEach((c) => {
      const cw = ctx.measureText(c).width + 36;
      if (x + cw > w - 40) {
        x = 40;
        y += 54;
      }
      fillRR(ctx, x, y, cw, 42, 21, "rgba(255,200,97,0.16)");
      text(ctx, c, x + 18, y + 29, `600 22px ${f.sans}`, "#ffe6b3");
      x += cw + 10;
    });
  });
}

export function jobCard(title: string, state: "open" | "match") {
  return make(512, 256, (ctx, w, h, f) => {
    card(ctx, w, h, state === "match" ? "#fff1c9" : "#ffc861", 26);
    fillRR(ctx, 32, 36, 64, 64, 16, state === "match" ? "#ffc861" : "#4a3f22");
    text(ctx, title, 116, 66, `700 30px ${f.sans}`, "#fff6dc");
    text(ctx, "Sample Co. · Hyderabad", 116, 100, `500 21px ${f.sans}`, "#c9bf9f");
    const pills = state === "match" ? ["Strong match", "Applied"] : ["Open", "Full-time"];
    let x = 32;
    ctx.font = `600 20px ${f.sans}`;
    pills.forEach((p, i) => {
      const pw = ctx.measureText(p).width + 32;
      fillRR(ctx, x, 150, pw, 40, 20, state === "match" && i === 0 ? "#ffc861" : "rgba(255,200,97,0.14)");
      text(ctx, p, x + 16, 177, `600 20px ${f.sans}`, state === "match" && i === 0 ? "#2a2008" : "#ffe6b3");
      x += pw + 10;
    });
  });
}

export function seekBotCard() {
  return make(512, 300, (ctx, w, h, f) => {
    card(ctx, w, h, "#fff1c9", 30);
    text(ctx, "SEEKBOT", 36, 58, `700 20px ${f.mono}`, "#ffd98a");
    fillRR(ctx, 36, 80, w - 72, 74, 18, "rgba(255,200,97,0.14)");
    text(ctx, "Best fit: Backend Developer", 56, 126, `600 24px ${f.sans}`, "#fff6dc");
    fillRR(ctx, 36, 170, w - 72, 74, 18, "rgba(255,200,97,0.14)");
    text(ctx, "Skill gap: Docker, CI/CD", 56, 216, `600 24px ${f.sans}`, "#fff6dc");
  });
}

/* ───────── IRIS ───────── */
/** Receipt rows in uv (0 bottom, 1 top), shared with the field flight. */
export const RECEIPT_ROWS = { vendor: 0.885, date: 0.815, items: 0.6, tax: 0.355, total: 0.29 };

export function receiptTexture() {
  return make(512, 896, (ctx, w, h, f) => {
    ctx.fillStyle = "#f1efe6";
    ctx.fillRect(0, 0, w, h);
    // Torn edge at the bottom.
    ctx.fillStyle = "#000";
    ctx.globalCompositeOperation = "destination-out";
    for (let x = 0; x < w; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + 12, h - 14);
      ctx.lineTo(x + 24, h);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    const y = (u: number) => h * (1 - u);
    const ink = "#2a2c33", soft = "#6c6f7a";
    text(ctx, "DEMO MART", w / 2, y(RECEIPT_ROWS.vendor), `800 44px ${f.mono}`, ink, "center");
    text(ctx, "SAMPLE RECEIPT · NOT REAL DATA", w / 2, y(RECEIPT_ROWS.vendor) + 34, `600 17px ${f.mono}`, soft, "center");
    text(ctx, "Date 14/03/2026   10:24", 40, y(RECEIPT_ROWS.date) + 20, `600 22px ${f.mono}`, ink);
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = soft;
    ctx.beginPath();
    ctx.moveTo(30, y(0.75));
    ctx.lineTo(w - 30, y(0.75));
    ctx.stroke();
    const items: [string, string][] = [
      ["Notebook x2", "120.00"],
      ["Pen set", "60.00"],
      ["Coffee", "40.00"],
    ];
    items.forEach(([a, b], i) => {
      const yy = y(0.68) + i * 44;
      text(ctx, a, 40, yy, `500 24px ${f.mono}`, ink);
      text(ctx, b, w - 40, yy, `500 24px ${f.mono}`, ink, "right");
    });
    ctx.beginPath();
    ctx.moveTo(30, y(0.45));
    ctx.lineTo(w - 30, y(0.45));
    ctx.stroke();
    ctx.setLineDash([]);
    text(ctx, "Subtotal", 40, y(0.41), `500 24px ${f.mono}`, ink);
    text(ctx, "220.00", w - 40, y(0.41), `500 24px ${f.mono}`, ink, "right");
    text(ctx, "Tax 5%", 40, y(RECEIPT_ROWS.tax) + 10, `500 24px ${f.mono}`, ink);
    text(ctx, "11.00", w - 40, y(RECEIPT_ROWS.tax) + 10, `500 24px ${f.mono}`, ink, "right");
    text(ctx, "TOTAL", 40, y(RECEIPT_ROWS.total) + 16, `800 32px ${f.mono}`, ink);
    text(ctx, "231.00", w - 40, y(RECEIPT_ROWS.total) + 16, `800 32px ${f.mono}`, ink, "right");
    for (let i = 0; i < 46; i++) ctx.fillRect(60 + i * 8.6, y(0.16), i % 3 ? 3 : 5, 70);
    text(ctx, "Thank you", w / 2, y(0.05), `500 20px ${f.mono}`, soft, "center");
  });
}

export const IRIS_FIELDS: [string, string][] = [
  ["vendor", "Demo Mart"],
  ["date", "2026-03-14"],
  ["items", "3 lines · 220.00"],
  ["tax", "11.00"],
  ["total", "231.00"],
];
export function fieldChip(k: string, v: string) {
  return make(512, 104, (ctx, w, h, f) => {
    card(ctx, w, h, "#8ff0d0", 22);
    text(ctx, k, 30, 64, `600 26px ${f.mono}`, "#8ff0d0");
    text(ctx, v, w - 30, 64, `700 28px ${f.sans}`, "#ecfff8", "right");
  });
}
export function verifiedChip() {
  return make(512, 104, (ctx, w, h, f) => {
    fillRR(ctx, 3, 3, w - 6, h - 6, 50, "rgba(143,240,208,0.95)");
    text(ctx, "✓ Arithmetic checks out", w / 2, 64, `700 30px ${f.sans}`, "#06261c", "center");
  });
}

/* ───────── ELI5 ───────── */
export function eli5Dense() {
  return make(1024, 384, (ctx, w, h, f) => {
    card(ctx, w, h, "#f17e98", 30);
    text(ctx, "SELECTED TEXT", 44, 62, `600 22px ${f.mono}`, "#f7a8bb");
    fillRR(ctx, 40, 86, w - 80, 250, 10, "rgba(241,126,152,0.12)");
    wrap(
      ctx,
      "Transformer models compute contextual token representations through multi-head self-attention, weighting every token's relevance across the sequence with scaled dot-product attention over learned query, key and value projections.",
      56,
      132,
      w - 112,
      40,
      `500 27px ${f.sans}`,
      "#f3dce4",
    );
  });
}
export function eli5Simple() {
  return make(1024, 384, (ctx, w, h, f) => {
    card(ctx, w, h, "#c9b8ff", 30);
    text(ctx, "EXPLAINED SIMPLY", 44, 62, `600 22px ${f.mono}`, "#c9b8ff");
    wrap(ctx, "It reads every word, then works out which other words matter most for understanding it.", 44, 150, w - 88, 62, `700 46px ${f.sans}`, "#ffffff");
  });
}

/* ───────── QP-Gen ───────── */
export function chapterCard(label: string, selected: boolean) {
  return make(512, 200, (ctx, w, h, f) => {
    card(ctx, w, h, selected ? "#dfe8ff" : "#9db8ff", 24);
    text(ctx, "CHAPTER", 32, 60, `600 20px ${f.mono}`, "#9db8ff");
    text(ctx, label, 32, 120, `700 34px ${f.sans}`, "#eef2ff");
    if (selected) {
      fillRR(ctx, w - 88, 36, 52, 52, 14, "#9db8ff");
      text(ctx, "✓", w - 62, 75, `800 32px ${f.sans}`, "#0d1430", "center");
    }
    text(ctx, selected ? "Selected" : "Available", 32, 166, `500 22px ${f.sans}`, selected ? "#dfe8ff" : "#8892b0");
  });
}
export const QP_CHIPS = ["MCQ · 1 mark", "1 mark", "Short · 3 marks", "3 marks", "Long · 5 marks", "Case-based · 4"];
/** uv.y of the slot each question chip lands in. */
export const QP_SLOTS = [0.7, 0.64, 0.5, 0.44, 0.3, 0.16];
export function questionChip(label: string) {
  return make(512, 96, (ctx, w, h, f) => {
    card(ctx, w, h, "#9db8ff", 20);
    fillRR(ctx, 24, 28, 40, 40, 10, "rgba(157,184,255,0.3)");
    text(ctx, "Q", 44, 58, `800 24px ${f.sans}`, "#dfe8ff", "center");
    text(ctx, label, 84, 60, `600 28px ${f.sans}`, "#eef2ff");
  });
}
export function examPaper() {
  return make(768, 1024, (ctx, w, h, f) => {
    ctx.fillStyle = "#f4f6fb";
    ctx.fillRect(0, 0, w, h);
    const ink = "#1d2235", soft = "#8a90a6";
    text(ctx, "SAMPLE QUESTION PAPER", w / 2, 70, `800 34px ${f.sans}`, ink, "center");
    text(ctx, "Science · Class X · CBSE pattern", w / 2, 108, `500 24px ${f.sans}`, soft, "center");
    text(ctx, "Time: 3 hours", 50, 160, `600 22px ${f.sans}`, ink);
    text(ctx, "Maximum marks: 80", w - 50, 160, `600 22px ${f.sans}`, ink, "right");
    ctx.fillStyle = ink;
    ctx.fillRect(50, 178, w - 100, 3);
    const section = (label: string, top: number, n: number) => {
      fillRR(ctx, 50, top, w - 100, 40, 6, "#e4e9f7");
      text(ctx, label, 66, top + 28, `700 22px ${f.sans}`, ink);
      for (let i = 0; i < n; i++) {
        const y = top + 72 + i * 58;
        text(ctx, `${i + 1}.`, 60, y, `600 20px ${f.sans}`, ink);
        ctx.fillStyle = "#c9cfe0";
        ctx.fillRect(96, y - 12, (w - 230) * (0.65 + ((i * 37) % 30) / 100), 10);
        ctx.fillRect(96, y + 8, (w - 230) * 0.45, 10);
      }
    };
    section("SECTION A · Objective · 1 mark each", 220, 2);
    section("SECTION B · Short answer · 3 marks each", 400, 2);
    section("SECTION C · Long answer · 5 marks each", 580, 2);
    section("SECTION D · Case-based · 4 marks each", 760, 2);
  });
}

/* ───────── Scholaroid ───────── */
export const ROLES: { id: string; label: string; lines: string[]; color: string }[] = [
  { id: "admin", label: "Admin", lines: ["Classes", "Announcements"], color: "#ffaa6a" },
  { id: "teacher", label: "Teacher", lines: ["Attendance", "Exams"], color: "#ffd27a" },
  { id: "student", label: "Student", lines: ["Timetable", "Results"], color: "#ff8f8f" },
  { id: "parent", label: "Parent", lines: ["Messages", "Attendance"], color: "#ffc4a8" },
];
export function rolePanel(role: (typeof ROLES)[number]) {
  return make(512, 336, (ctx, w, h, f) => {
    card(ctx, w, h, role.color, 28);
    fillRR(ctx, 30, 30, 70, 70, 18, hexA(role.color, 0.25));
    // Simple role glyph: a head and shoulders.
    ctx.fillStyle = role.color;
    ctx.beginPath();
    ctx.arc(65, 56, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(65, 92, 22, Math.PI, 0);
    ctx.fill();
    text(ctx, role.label, 122, 78, `700 38px ${f.sans}`, "#fff3ea");
    text(ctx, "DASHBOARD", 124, 104, `600 17px ${f.mono}`, role.color);
    role.lines.forEach((l, i) => {
      const y = 150 + i * 74;
      fillRR(ctx, 30, y, w - 60, 58, 14, "rgba(255,170,106,0.12)");
      text(ctx, l, 52, y + 38, `600 26px ${f.sans}`, "#ffe5d4");
      fillRR(ctx, w - 110, y + 21, 58, 16, 8, hexA(role.color, 0.6));
    });
  });
}
