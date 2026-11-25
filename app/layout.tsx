import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { contact, site } from "@/content/site";
import { EvidenceViewer } from "@/components/evidence/EvidenceViewer";
import "./globals.css";

// Type system (2026-11-25). next/font downloads these at build time and serves
// them from this site, so no request ever goes to Google at runtime.
// Display: condensed industrial capitals, oversize for the name, 700-800 for titles.
const display = Big_Shoulders({ subsets: ["latin"], variable: "--font-display", display: "swap", weight: ["700", "800", "900"], fallback: ["Arial Narrow", "sans-serif"], adjustFontFallback: false });
// Body and interface.
const sans = IBM_Plex_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap", weight: ["400", "500", "600"] });
// Technical metadata only: dates, stacks, counts, status.
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap", weight: ["400", "500"] });
// Selective editorial statements: chapter leads, personal asides, the closing line.
const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif", display: "swap", style: ["italic"], axes: ["opsz", "SOFT"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: "%s" },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: contact.github }],
  alternates: { canonical: "/" },
  openGraph: { title: site.title, description: site.description, type: "website", siteName: site.name, url: "/" },
  twitter: { card: "summary_large_image", title: site.title, description: site.description },
  robots: { index: true, follow: true },
};

/** Structured data: who this site is about, with the verified public profiles. */
const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: site.name,
  url: site.url,
  jobTitle: "Software Engineer",
  alumniOf: { "@type": "CollegeOrUniversity", name: "NxtWave Institute of Advanced Technologies (NIAT)" },
  sameAs: [contact.github, contact.linkedin, contact.instagram],
  knowsAbout: ["Backend engineering", "AI agents", "Django", "FastAPI", "Three.js", "WebGL"],
};

export const viewport: Viewport = {
  themeColor: "#080605",
  colorScheme: "dark",
};

export default function RootLayout({ children, modal }: Readonly<{ children: React.ReactNode; modal: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable} ${mono.variable} ${serif.variable} is-locked`}>
      <body>
        {/* Watchdog: if the app bundle never boots (blocked/failed JS), release the
            loader so the server-rendered hero and links stay usable. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if(location.pathname!=="/")document.documentElement.classList.remove("is-locked");setTimeout(function(){if(!window.__originBooted){document.documentElement.classList.add("boot-failed");document.documentElement.classList.remove("is-locked")}},12000)`,
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />
        <noscript>
          <style>{`.loader{display:none!important}html.is-locked{overflow:auto!important}`}</style>
        </noscript>
        {children}
        {modal}
        <EvidenceViewer />
      </body>
    </html>
  );
}
