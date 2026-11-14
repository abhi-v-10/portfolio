const EVENT = "origin:evidence-open";

export type EvidenceRequest = { ids: string[]; index?: number };

/** Open the shared evidence viewer with one or more items (ids from content/evidence.ts). */
export function openEvidence(ids: string[], index = 0) {
  window.dispatchEvent(new CustomEvent<EvidenceRequest>(EVENT, { detail: { ids, index } }));
}

export function onEvidenceOpen(fn: (req: EvidenceRequest) => void) {
  const h = (e: Event) => fn((e as CustomEvent<EvidenceRequest>).detail);
  window.addEventListener(EVENT, h);
  return () => window.removeEventListener(EVENT, h);
}
