/**
 * Meet the Human: photo gallery metadata. EDIT HERE when real photos arrive.
 *
 * - Put files in `public/photos/` and set `src` (e.g. "/photos/portrait.jpg").
 * - While `src` is null the frame renders a clearly marked placeholder.
 * - `alt` describes the photo for screen readers; `caption` is visible.
 * No generated or stand-in photographs of a real person are used.
 */
export type GalleryPhoto = {
  id: string;
  /** Path under /public, or null while the photo is still to be supplied. */
  src: string | null;
  title: string;
  caption: string;
  alt: string;
  /** Placeholder accent, used only while src is null. */
  tone: "lavender" | "cyan" | "peach" | "violet";
};

/**
 * Supplied by Abhishyanth on 2026-11-14 (casual photos, by design). Originals
 * stay outside the repo; these are 4:5 crops (1200×1500 WebP) so every frame
 * matches the gallery's cover-fit 4:5 slot. Captions describe only what each
 * photo shows.
 */
export const galleryPhotos: GalleryPhoto[] = [
  {
    id: "photo-01",
    src: "/photos/go-karting.webp",
    title: "Photo 01 · Track day",
    caption: "Go-karting, helmet under one arm, already eyeing the next lap.",
    alt: "Abhishyanth at a go-karting track in a riding jacket, holding a helmet and smiling to the side, with tyre barriers behind.",
    tone: "lavender",
  },
  {
    id: "photo-02",
    src: "/photos/garden-cafe.webp",
    title: "Photo 02 · Garden table",
    caption: "A slow afternoon under the palms. Rare, but it happens.",
    alt: "Abhishyanth seated at a table in a leafy garden café, wearing an olive polo shirt and a black smartwatch.",
    tone: "cyan",
  },
  {
    id: "photo-03",
    src: "/photos/floral-backdrop.webp",
    title: "Photo 03 · Festive fit",
    caption: "Kurta on, flowers behind, looking anywhere but the camera.",
    alt: "Abhishyanth in a light green silk kurta standing in front of a wall of greenery and hanging white and pink flowers.",
    tone: "peach",
  },
  {
    id: "photo-04",
    src: "/photos/festival-lights.webp",
    title: "Photo 04 · Under the lights",
    caption: "Festival night, colour streaks overhead, checking the time like there's a deadline.",
    alt: "Abhishyanth in a black kurta and scarf on a green-carpeted ground at night, checking a wristwatch under coloured light beams.",
    tone: "violet",
  },
  {
    id: "photo-05",
    src: "/photos/beach-night.webp",
    title: "Photo 05 · Night tide",
    caption: "Beach at night, framing the shot from the other side of the lens for once.",
    alt: "Abhishyanth on a beach at night, photographing the waves with a phone held up in both hands.",
    tone: "cyan",
  },
];
