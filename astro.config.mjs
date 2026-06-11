// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

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
    }),
  ],
});
