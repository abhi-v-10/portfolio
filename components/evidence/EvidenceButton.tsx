"use client";

import { evidence } from "@/content/evidence";
import { openEvidence } from "./evidenceEvents";

/** A quiet document chip: thumbnail + label, opens the shared viewer. */
export function EvidenceButton({
  ids,
  label,
  small,
  thumb = !small,
}: {
  ids: string[];
  label: string;
  small?: boolean;
  thumb?: boolean;
}) {
  const first = evidence[ids[0]];
  if (!first) return null;
  return (
    <button
      type="button"
      className="evidence-btn"
      data-small={small || undefined}
      aria-haspopup="dialog"
      onClick={() => openEvidence(ids)}
    >
      {thumb && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={first.thumb} alt="" width={72} height={Math.round((72 * first.height) / first.width)} loading="lazy" decoding="async" />
      )}
      <span>{label}</span>
      <svg viewBox="0 0 16 16" aria-hidden focusable="false">
        <path d="M5 11 11 5M6 5h5v5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </button>
  );
}
