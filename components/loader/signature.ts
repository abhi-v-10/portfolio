/**
 * The loader's signature, as pen strokes in writing order.
 *
 * This is a stand-in drawn by hand in code. To use your real handwriting:
 *  1. Sign on paper (or a tablet) and trace it in Figma / Illustrator / Inkscape
 *     as CENTRE-LINE strokes (one open path per pen-down), not filled outlines.
 *  2. Export SVG, then copy each path's `d` into `strokes`, in the order you
 *     wrote them. Set `viewBox` to the export's viewBox.
 *  3. `ms` is how long that stroke takes to draw; long strokes get more time.
 *     Mark the stroke that should carry the signal colour with `accent: true`
 *     (here, the dot of the i).
 * Nothing else needs to change: the loader sizes, draws and splits whatever is here.
 */
export type SignatureStroke = { d: string; ms: number; accent?: boolean; width?: number };

/** When each stroke starts (ms), so each begins where the last one lifted. */
export const strokeStarts = (strokes: SignatureStroke[]) =>
  strokes.reduce<number[]>((acc, s, i) => [...acc, i ? acc[i - 1] + strokes[i - 1].ms + 40 : 120], []);

export const SIGNATURE: { viewBox: string; strokes: SignatureStroke[] } = {
  viewBox: "0 0 420 150",
  strokes: [
    // "Abhishyanth" in one continuous line
    {
      ms: 950,
      d: [
        "M16 104 C28 82 42 46 56 28 C61 21 65 24 64 33 C62 56 64 80 70 97",
        "C74 104 81 97 85 88 C90 72 95 44 97 31 C98 23 92 24 90 34 C87 55 87 79 89 95",
        "C91 104 101 101 104 92 C106 85 101 80 95 85",
        "C104 89 110 88 114 82 C121 64 126 41 124 31 C122 24 116 28 116 39 C116 60 114 80 114 97",
        "C118 84 124 75 131 75 C137 75 138 84 138 91 C138 100 143 102 149 95",
        "C153 89 155 82 157 76 C157 86 156 95 160 98 C166 101 170 93 173 87",
        "C176 80 181 74 185 74 C179 82 179 88 187 92 C193 96 187 104 176 100",
        "C183 102 191 99 197 93 C205 82 211 53 208 33 C206 24 200 29 200 40 C200 62 198 82 198 97",
        "C202 84 208 76 216 76 C222 76 223 86 223 92 C223 101 228 100 233 94",
        "C237 88 239 81 241 76 C241 88 243 96 249 96 C255 96 259 86 261 76",
        "C261 97 259 117 252 129 C247 137 239 134 242 124 C246 112 260 100 272 94",
        "C277 90 281 80 276 76 C268 74 262 86 266 94 C270 100 278 94 282 83 C282 91 282 98 288 98",
        "C292 98 295 94 297 89 C299 84 300 80 302 76 C302 86 301 94 300 98",
        "C304 86 310 76 318 76 C324 76 325 86 325 92 C325 100 330 100 335 94",
        "C341 83 345 60 347 40 C345 60 343 84 345 96 C347 102 355 100 359 92",
        "C365 80 371 50 368 32 C366 24 360 28 360 40 C360 62 358 82 358 97",
        "C362 84 368 76 376 76 C382 76 383 86 383 93 C383 102 391 102 400 95",
      ].join(" "),
    },
    // crossbars: the t, then the A, each one fast stroke
    { ms: 180, width: 1.6, d: "M334 58 C342 55 352 54 362 55" },
    { ms: 200, width: 1.6, d: "M34 72 C44 69 54 67 66 66" },
    // the dot of the i: the signal
    { ms: 80, accent: true, width: 3.2, d: "M157.5 62 l0.6 -0.8" },
  ],
};

/** Time until the last stroke lands (ms). The loader enters on its own after this. */
export const SIGNATURE_MS = (() => {
  const st = strokeStarts(SIGNATURE.strokes);
  const last = SIGNATURE.strokes.length - 1;
  return st[last] + SIGNATURE.strokes[last].ms;
})();
