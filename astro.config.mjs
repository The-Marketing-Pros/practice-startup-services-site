// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import { execSync } from "node:child_process";

// Sitemap <lastmod>: the last commit that touched site content. When git
// history isn't available (e.g. a tarball build) we omit lastmod entirely
// rather than stamping build time — a fake "everything changed" signal is
// worse than no signal.
function contentLastmod() {
  try {
    const out = execSync("git log -1 --format=%cI -- src/ public/", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (out) return out;
  } catch {
    /* no git */
  }
  return null;
}
const LASTMOD = contentLastmod();

// PracticeStartupServices.com
// Blueprint + Map + restrained Control Room
// See: personas/alf/campaigns/2026-Q2/practice-startup-services/03b-recommended-direction.md
//
// Note: Site is pure static (output: "static" by default). Server-side surfaces
// (The Architect chat + lead capture) live as CF Pages Functions under functions/.

export default defineConfig({
  site: "https://practicestartupservices.com",
  trailingSlash: "always",
  build: {
    format: "directory",
    inlineStylesheets: "auto",
  },
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap({
      filter: (page) => !page.includes("/scan/results"),
      serialize: (item) => (LASTMOD ? { ...item, lastmod: LASTMOD } : item),
    }),
  ],
});
