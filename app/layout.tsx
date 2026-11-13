import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Unbounded } from "next/font/google";
import { contact, site } from "@/content/site";
import "./globals.css";

const display = Unbounded({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

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
  themeColor: "#03070E",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable} is-locked`}>
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
      </body>
    </html>
  );
}
