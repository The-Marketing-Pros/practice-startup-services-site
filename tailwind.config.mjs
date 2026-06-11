/** @type {import('tailwindcss').Config} */
// PracticeStartupServices.com — Blueprint visual system
// See: personas/alf/campaigns/2026-Q2/practice-startup-services/03b-recommended-direction.md §2

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
        // Blueprint palette (03b §2 — locked)
        ink: {
          DEFAULT: "#0E1F36", // blueprint navy — primary brand
          900: "#0A1626",
          800: "#0E1F36",
          700: "#1A2D48",
          600: "#26395A",
        },
        paper: {
          DEFAULT: "#F7F4EE", // warm paper, NOT clinical white
          50: "#FCFAF6",
          100: "#F7F4EE",
          200: "#EDE7DB",
          300: "#DDD3BF",
        },
        graphite: {
          DEFAULT: "#2C2E33",
          900: "#1B1C20",
          800: "#2C2E33",
          700: "#404249",
          600: "#5B5E68",
          500: "#7A7D87",
          400: "#A4A6AE",
          300: "#C9CAD0",
          200: "#E2E3E6",
          100: "#F0F1F3",
        },
        // Accent — used sparingly on CTAs, phase highlights, warnings
        bronze: {
          DEFAULT: "#B68546",
          900: "#7A582D",
          800: "#92693A",
          700: "#A67740",
          600: "#B68546",
          500: "#C49A63",
          400: "#D2B286",
          300: "#E0CAA9",
        },
        // Restrained Control Room accent — ONLY in three places (homepage scan, medicare-tools, phase-4 credentialing)
        // See 03b §1 Layer 3
        signal: {
          DEFAULT: "#2BC4B4", // electric teal
          900: "#176A62",
          800: "#1F8A7E",
          700: "#26A89A",
          600: "#2BC4B4",
          500: "#52D2C5",
          400: "#7DDDD2",
        },
        // Warning — for "Do Not Skip This" blocks (03a §3 Direction 3 element, kept)
        warn: {
          DEFAULT: "#B85C2A",
          subtle: "#F4E4D8",
        },
      },
      fontFamily: {
        // 03b §2 Typography — three faces total
        display: ['"Fraunces"', "Georgia", "serif"], // editorial display serif
        sans: ['"Inter Variable"', "Inter", "system-ui", "sans-serif"], // humanist body
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"], // technical accents
      },
      fontSize: {
        // Editorial scale — generous, content-friendly
        "display-xl": ["clamp(2.75rem, 5vw + 1rem, 5rem)", { lineHeight: "1.02", letterSpacing: "-0.025em" }],
        "display-lg": ["clamp(2.25rem, 4vw + 0.75rem, 4rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-md": ["clamp(1.75rem, 3vw + 0.5rem, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
        "display-sm": ["clamp(1.5rem, 2vw + 0.5rem, 2.25rem)", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        "lede": ["1.25rem", { lineHeight: "1.6", letterSpacing: "-0.005em" }],
        "body": ["1.0625rem", { lineHeight: "1.7" }],
        "small": ["0.9375rem", { lineHeight: "1.6" }],
        "label": ["0.8125rem", { lineHeight: "1.4", letterSpacing: "0.06em" }],
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
        blueprint: "0 1px 0 rgba(14, 31, 54, 0.06), 0 12px 28px -16px rgba(14, 31, 54, 0.18)",
        elevated: "0 2px 0 rgba(14, 31, 54, 0.04), 0 24px 48px -20px rgba(14, 31, 54, 0.24)",
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
