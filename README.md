# PracticeStartupServices.com

> The practice launch guide — and the team to make it real.

The premium blueprint for launching an independent medical practice. Editorial + Blueprint + restrained Control Room.

**Owner:** Alf (end-to-end build)
**Brief:** `../../personas/alf/campaigns/2026-Q2/practice-startup-services/03b-recommended-direction.md`
**Strategy:** `../../personas/alf/campaigns/2026-Q2/practice-startup-services/02a-strategic-foundation.md`

## Stack

- **SSG:** Astro 5
- **Styling:** Tailwind CSS 3 (palette resolves through HSL design tokens in `src/styles/global.css`)
- **Fonts:** Fraunces Variable (display, opsz axis), Archivo Variable (body/UI), JetBrains Mono (accents) — via `@fontsource`, display face preloaded
- **Deploy:** Cloudflare Pages (git-connected at project creation, per 2026-06-10 hard rule)

## Local dev

```bash
npm install
npm run dev    # http://localhost:4321
npm run build  # static output -> dist/
npm run check  # astro type check
```

## Site structure

- `src/pages/` — routes
- `src/layouts/BaseLayout.astro` — html shell, header, footer, meta
- `src/components/` — Astro components
- `src/data/` — content + structure (phases, services, site)
- `src/styles/global.css` — Tailwind + base styles + component classes

## Design system at a glance

2026-06 refresh: "Architectural Digest meets a16z" — drafting-table editorial.
All colors live as HSL tokens in `src/styles/global.css` (single source of truth);
Tailwind class names are unchanged.

- **Drafting ink** `hsl(26 20% 10%)` (≈`#1F1914`) — deep warm charcoal, primary brand
- **Warm cream paper** `hsl(40 36% 95%)` (≈`#F7F4EE`) — background (NOT clinical white)
- **Brass** `hsl(36 45% 49%)` (≈`#B58845`) — CTAs, phase numerals, annotations (text-grade brass is `bronze-700`, AA-verified on every paper surface)
- **Signal teal** — restrained, three Control Room moments only
- **Fraunces Variable** display (opsz 144) + **Archivo Variable** body + **JetBrains Mono** accents
- **Motion:** one system — inverted scroll reveal (`.reveal` / `.rule-draw`, default-visible, JS opts into hiding) with full `prefers-reduced-motion` support

## Outstanding blockers

- **CRM scheduling URL** (`{{SCHEDULE_URL}}`) — Andrew drops at Phase 7. Until then, all booking links route to the token.

## Build phases

- [x] Phase 0–2 — Strategy + research
- [x] Phase 3 — Creative direction (03b synthesis locked)
- [x] Phase 4 — Scaffold (this commit)
- [ ] Phase 5 — Visual system + homepage polish
- [ ] Phase 6 — Tier 1 + Tier 2 content
- [ ] Phase 6.5 — Max + Seal design review (mandatory)
- [ ] Phase 7 — CF Pages deploy
- [ ] Phase 8 — Tier 2/3 content rollout (60–90 days)

---

Built by Alf · The Marketing Pros · 2026-06-11
