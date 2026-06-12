/** @type {import('tailwindcss').Config} */
// PracticeStartupServices.com — Blueprint visual system
// See: personas/alf/campaigns/2026-Q2/practice-startup-services/03b-recommended-direction.md §2
// 2026-06 refresh: palette moved to HSL design tokens defined in src/styles/global.css
// (deep warm-charcoal ink + warm cream paper + brass accent). Class names are
// unchanged; values resolve through `hsl(var(--token) / <alpha-value>)` so the
// palette has exactly one source of truth and opacity modifiers keep working.

const token = (name) => `hsl(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      opacity: {
        4: "0.04",
        6: "0.06",
        8: "0.08",
        12: "0.12",
        15: "0.15",
        18: "0.18",
        35: "0.35",
        65: "0.65",
        85: "0.85",
      },
      colors: {
        // Drafting ink — deep warm charcoal, near-black. Primary brand.
        ink: {
          DEFAULT: token("ink-800"),
          900: token("ink-900"),
          800: token("ink-800"),
          700: token("ink-700"),
          600: token("ink-600"),
        },
        // Warm cream paper, NOT clinical white
        paper: {
          DEFAULT: token("paper-100"),
          50: token("paper-50"),
          100: token("paper-100"),
          200: token("paper-200"),
          300: token("paper-300"),
        },
        graphite: {
          DEFAULT: token("graphite-800"),
          900: token("graphite-900"),
          800: token("graphite-800"),
          700: token("graphite-700"),
          600: token("graphite-600"),
          500: token("graphite-500"),
          400: token("graphite-400"),
          300: token("graphite-300"),
          200: token("graphite-200"),
          100: token("graphite-100"),
        },
        // Brass accent — used sparingly on CTAs, phase highlights, annotations
        bronze: {
          DEFAULT: token("bronze-600"),
          900: token("bronze-900"),
          800: token("bronze-800"),
          700: token("bronze-700"),
          600: token("bronze-600"),
          500: token("bronze-500"),
          400: token("bronze-400"),
          300: token("bronze-300"),
        },
        // Restrained Control Room accent — ONLY in three places (homepage scan, medicare-tools, phase-4 credentialing)
        // See 03b §1 Layer 3
        signal: {
          DEFAULT: token("signal-600"),
          900: token("signal-900"),
          800: token("signal-800"),
          700: token("signal-700"),
          600: token("signal-600"),
          500: token("signal-500"),
          400: token("signal-400"),
        },
        // Warning — for "Do Not Skip This" blocks (03a §3 Direction 3 element, kept)
        warn: {
          DEFAULT: token("warn"),
          subtle: token("warn-subtle"),
        },
      },
      fontFamily: {
        // Three faces total — Fraunces (display, optical-size axis), Archivo (text/UI), JetBrains Mono (annotations)
        display: ['"Fraunces Variable"', "Georgia", "serif"],
        sans: ['"Archivo Variable"', "Archivo", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        // Editorial scale — generous, content-friendly
        // Mobile clamp floors tightened down for better hero stacking on 390px viewports
        "display-xl": ["clamp(2.375rem, 4.5vw + 1rem, 5rem)", { lineHeight: "1.02", letterSpacing: "-0.03em" }],
        "display-lg": ["clamp(2rem, 3.5vw + 0.75rem, 3.75rem)", { lineHeight: "1.05", letterSpacing: "-0.025em" }],
        "display-md": ["clamp(1.625rem, 2.5vw + 0.5rem, 2.75rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-sm": ["clamp(1.4rem, 1.75vw + 0.5rem, 2.125rem)", { lineHeight: "1.14", letterSpacing: "-0.015em" }],
        "lede": ["clamp(1.0625rem, 1vw + 0.5rem, 1.1875rem)", { lineHeight: "1.65", letterSpacing: "-0.005em" }],
        "body": ["clamp(1rem, 0.5vw + 0.75rem, 1.0625rem)", { lineHeight: "1.75" }],
        "small": ["clamp(0.875rem, 0.25vw + 0.75rem, 0.9375rem)", { lineHeight: "1.65" }],
        "label": ["0.8125rem", { lineHeight: "1.4", letterSpacing: "0.08em" }],
      },
      maxWidth: {
        "prose-wide": "72ch",
        "prose": "65ch",
        "narrow": "54ch",
      },
      borderRadius: {
        sharp: "2px",
        soft: "4px",
        card: "6px",
      },
      boxShadow: {
        blueprint: "0 1px 0 hsl(var(--ink-800) / 0.06), 0 12px 28px -16px hsl(var(--ink-800) / 0.18)",
        elevated: "0 2px 0 hsl(var(--ink-800) / 0.04), 0 24px 48px -20px hsl(var(--ink-800) / 0.24)",
      },
      animation: {
        "draw-in": "draw-in 0.8s ease-out forwards",
        "fade-up": "fade-up 0.6s ease-out forwards",
      },
      keyframes: {
        "draw-in": {
          "0%": { strokeDashoffset: "100%" },
          "100%": { strokeDashoffset: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
