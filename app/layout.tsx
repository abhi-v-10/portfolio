import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Unbounded } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const display = Unbounded({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: site.title,
  description: site.description,
  openGraph: { title: site.title, description: site.description, type: "website" },
  twitter: { card: "summary_large_image", title: site.title, description: site.description },
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
            __html: `setTimeout(function(){if(!window.__originBooted){document.documentElement.classList.add("boot-failed");document.documentElement.classList.remove("is-locked")}},12000)`,
          }}
        />
        <noscript>
          <style>{`.loader{display:none!important}html.is-locked{overflow:auto!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
