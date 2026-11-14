import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projectById, projectStories } from "@/content/projects";
import { site } from "@/content/site";
import { projectScreens } from "@/content/screens";
import { CaseStudy } from "@/components/case/CaseStudy";
import { BackToWork, NextCase } from "@/components/case/CaseLinks";

export function generateStaticParams() {
  return projectStories.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = projectById(slug);
  if (!p) return {};
  const title = `${p.name}, ${p.codename} — Abhishyanth Vemula`;
  // Link previews: the project's first screenshot, else the site card.
  const shot = projectScreens[p.id]?.[0];
  const images = shot
    ? [{ url: `/projects/${p.id}/1.webp`, width: shot.width, height: shot.height, alt: `${p.name}: ${shot.title}` }]
    : ["/opengraph-image"];
  return {
    title,
    description: p.idea,
    alternates: { canonical: `/work/${p.id}` },
    openGraph: { title, description: p.idea, type: "article", images },
    twitter: { card: "summary_large_image", title, description: p.idea, images },
  };
}

/**
 * Standalone case study: a direct visit or refresh. Fast, linkable, server
 * rendered, no loader and no WebGL. The way back lands on the project's
 * exhibit in the universe without replaying the loader.
 */
export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = projectById(slug);
  if (!p) notFound();
  const i = projectStories.indexOf(p);
  const next = projectStories[(i + 1) % projectStories.length];

  return (
    <div className="case-page" style={{ "--accent": p.accent } as React.CSSProperties}>
      <header className="case-layer-bar case-page-bar">
        <Link href="/" className="case-layer-mark" aria-label={`${site.name}, home`}>
          AV <span aria-hidden>/</span> Work
        </Link>
        <BackToWork id={p.id} className="case-layer-close">
          <span aria-hidden>←</span> Back to the universe
        </BackToWork>
      </header>
      <main id="main">
        <CaseStudy p={p} index={i} next={<NextCase id={next.id} label={`${next.name}, ${next.codename}`} />} />
      </main>
    </div>
  );
}
