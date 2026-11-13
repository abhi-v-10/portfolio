export type IndexSection = "work" | "contact" | "story";

const EVENT = "origin:index-open";

/** Open the index panel at a section, from anywhere in the page. */
export function openIndex(section: IndexSection) {
  window.dispatchEvent(new CustomEvent<IndexSection>(EVENT, { detail: section }));
}

export function onIndexOpen(fn: (section: IndexSection) => void) {
  const h = (e: Event) => fn((e as CustomEvent<IndexSection>).detail);
  window.addEventListener(EVENT, h);
  return () => window.removeEventListener(EVENT, h);
}
