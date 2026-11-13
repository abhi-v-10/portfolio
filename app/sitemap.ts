import type { MetadataRoute } from "next";
import { projectStories } from "@/content/projects";
import { site } from "@/content/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${site.url}/`, changeFrequency: "monthly", priority: 1 },
    ...projectStories.map((p) => ({ url: `${site.url}/work/${p.id}`, changeFrequency: "monthly" as const, priority: p.featured ? 0.9 : 0.7 })),
  ];
}
