"use client";

import Link from "next/link";
import { caseNav } from "./caseNav";

/** Standalone page's way back: lands on the project's exhibit, no loader. */
export function BackToWork({ id, className, children }: { id: string; className?: string; children: React.ReactNode }) {
  return (
    <Link
      href={`/#project-${id}`}
      className={className}
      onClick={() => {
        caseNav.returning = true;
      }}
    >
      {children}
    </Link>
  );
}

/** Next case study. Inside the overlay it replaces the entry, so Back still returns to the universe. */
export function NextCase({ id, label, overlay }: { id: string; label: string; overlay?: boolean }) {
  return (
    <Link href={`/work/${id}`} replace={overlay} scroll={!overlay}>
      <span>Next</span> {label}
    </Link>
  );
}
