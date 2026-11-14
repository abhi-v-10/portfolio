"use client";

import { evidence } from "@/content/evidence";
import { screenIds } from "@/content/screens";
import { openEvidence } from "@/components/evidence/evidenceEvents";

/**
 * Screens strip in a case study: the first screen leads large, the rest sit
 * in a contact sheet. Every tile opens the shared viewer at that screen, with
 * arrow keys to browse the whole set.
 */
export function CaseScreens({ project, name }: { project: string; name: string }) {
  const ids = screenIds(project);
  if (!ids.length) return null;
  return (
    <ul className="cs-screens" data-count={ids.length} aria-label={`${name} screenshots`}>
      {ids.map((id, i) => {
        const it = evidence[id];
        return (
          <li key={id} data-lead={i === 0 || undefined}>
            <button type="button" className="cs-shot" aria-haspopup="dialog" onClick={() => openEvidence(ids, i)}>
              <span className="cs-shot-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={i === 0 ? it.src : it.thumb}
                  alt={it.alt}
                  width={it.width}
                  height={it.height}
                  loading="lazy"
                  decoding="async"
                />
              </span>
              <span className="cs-shot-label">
                <span aria-hidden>{String(i + 1).padStart(2, "0")}</span> {it.title}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
