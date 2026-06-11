// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

// PracticeStartupServices.com
// Blueprint + Map + restrained Control Room
// See: personas/alf/campaigns/2026-Q2/practice-startup-services/03b-recommended-direction.md

export default defineConfig({
  site: "https://practicestartupservices.com",
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap(),
  ],
  build: {
    inlineStylesheets: "auto",
  },
});
