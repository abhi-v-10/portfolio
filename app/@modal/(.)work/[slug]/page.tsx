import { notFound } from "next/navigation";
import { CaseOverlay } from "@/components/case/CaseOverlay";
import { CaseStudy } from "@/components/case/CaseStudy";
import { NextCase } from "@/components/case/CaseLinks";
import { projectById, projectStories } from "@/content/projects";

export function generateStaticParams() {
  return projectStories.map((p) => ({ slug: p.id }));
}

/**
 * Intercepted case study: opened from inside the site (an exhibit, the index),
 * it renders as a layer over the still-mounted universe. A direct visit or a
 * refresh renders app/work/[slug]/page.tsx instead.
 */
export default async function CaseIntercept({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = projectById(slug);
  if (!p) notFound();
  const i = projectStories.indexOf(p);
  const next = projectStories[(i + 1) % projectStories.length];
  return (
    <CaseOverlay id={p.id}>
      <CaseStudy p={p} index={i} overlay next={<NextCase id={next.id} label={`${next.name}, ${next.codename}`} overlay />} />
    </CaseOverlay>
  );
}
