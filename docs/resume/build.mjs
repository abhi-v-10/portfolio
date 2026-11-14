// Renders docs/resume/resume.html to public/Abhishyanth-Vemula-Resume.pdf with
// headless Chrome (real, selectable text for ATS parsing).
// Usage: node docs/resume/build.mjs https://your-portfolio.example
// playwright-core is not a project dependency: set PW to its path if needed.
const { chromium } = await import(process.env.PW ?? "playwright-core");
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const url = process.argv[2];
if (!url) throw new Error("Pass the portfolio URL.");
const label = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
const html = fs
  .readFileSync(path.join(here, "resume.html"), "utf8")
  .replaceAll("{{PORTFOLIO_URL}}", url)
  .replaceAll("{{PORTFOLIO_LABEL}}", label);
const out = path.join(here, "..", "..", "public", "Abhishyanth-Vemula-Resume.pdf");

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const pages = await page.evaluate(() => Math.ceil(document.body.scrollHeight / (297 * 3.7795 - 25 * 3.7795)));
await page.pdf({ path: out, format: "A4", preferCSSPageSize: true, printBackground: true, tagged: true, outline: false });
await browser.close();
console.log(`wrote ${out} (~${pages} page(s))`);
