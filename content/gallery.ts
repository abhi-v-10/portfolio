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
    src: null,
    title: "Photo 02 · At the desk",
    caption: "Workspace, behind the scenes. Placeholder, photo to be supplied.",
    alt: "Placeholder for a workspace photo",
    tone: "cyan",
  },
  {
    id: "photo-03",
    src: null,
    title: "Photo 03 · Off the clock",
    caption: "Gaming, setups, the creative side. Placeholder, photo to be supplied.",
    alt: "Placeholder for a lifestyle or gaming photo",
    tone: "peach",
  },
  {
    id: "photo-04",
    src: null,
    title: "Photo 04 · Out there",
    caption: "Events, council, people. Placeholder, photo to be supplied.",
    alt: "Placeholder for an event or team photo",
    tone: "violet",
  },
];
