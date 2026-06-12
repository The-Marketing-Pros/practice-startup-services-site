# AEO target queries — PracticeStartupServices.com

Maintained alongside the 2026-06 SEO/AEO refresh. Each row maps a target
AI-Overview / answer-engine query to the exact on-page block built to answer
it, plus the structured data that reinforces it. When content changes, keep
this map and the on-page blocks in sync.

Conventions used by the answer blocks:

- **Answer-first**: a question-format heading followed by a direct 1–3 sentence
  answer, then elaboration. Direct answers also appear verbatim in `FAQPage`
  JSON-LD so the markup and schema cannot drift (`src/data/home-faq.ts` is the
  single source for the homepage set).
- **Conservative numbers only**: every figure quoted is already published
  elsewhere on the site (phase guides, cost guide). No invented statistics.
- **Jurisdiction-general legal/tax**: entity and tax questions answer with
  state-dependence and route to a licensed healthcare attorney.

| # | Target query | Answering block | Schema support |
|---|---|---|---|
| 1 | how to start a medical practice | Homepage FAQ Q4 ("What is the first step…") + `/journey/` 7-phase sequence + `/resources/startup-checklist/` phase list | `FAQPage` (home), `ItemList` (journey), `HowTo` (checklist) |
| 2 | medical practice startup costs | `/resources/startup-costs/` — "How much does it cost to start a medical practice?" H2 with short-answer paragraph + four cost buckets | `Article` w/ datePublished/dateModified; homepage `FAQPage` Q1 |
| 3 | medical practice startup checklist | `/resources/startup-checklist/` — phase-ordered checklist with anchors `#phase-01`…`#phase-07` | `HowTo` with 7 `HowToStep`s + per-step URLs |
| 4 | how long does it take to open a private practice | `/journey/` — "How long does it take to open a private practice?" card (6–12 months, credentialing as long pole) + homepage FAQ Q2 | `FAQPage` (home), `ItemList` (journey) |
| 5 | do I need credentialing before opening a practice | Homepage FAQ Q3 + `/journey/credentialing-enrollment/` Phase 4 guide (start 4–6 months out; 90–180 days) | `FAQPage` (home + Phase 4 page) |
| 6 | how long does medical credentialing take | Homepage FAQ Q5 + `/journey/credentialing-enrollment/` deep dive ("90–180 days", follow-up cadence) | `FAQPage` on both |
| 7 | medical practice business plan | `/journey/business-planning/` Phase 2 guide (24-month pro forma, credentialing lag, 6-month cushion) | `BreadcrumbList`, `FAQPage` (phase deep dive) |
| 8 | LLC vs PC for medical practice | Homepage FAQ Q6 (state-dependent; professional entity often required; consult healthcare attorney) + `/journey/legal-entity-setup/` | `FAQPage` (home) |
| 9 | how much working capital does a new medical practice need | Homepage FAQ Q7 + `/resources/startup-costs/` working-capital bucket + "credentialing cash gap" callout | `FAQPage` (home), `Article` (cost guide) |
| 10 | can a nurse practitioner open their own practice | Homepage FAQ Q8 + `/who-we-help/nurse-practitioners/` (state-authority dependence) | `FAQPage` (home), `BreadcrumbList` (segment page) |
| 11 | medical practice startup timeline | `/journey/` ItemList + per-phase "Duration" fields surfaced in the BlueprintJourney grid | `ItemList`, `HowTo` (checklist) |
| 12 | [specialty] practice startup costs (e.g. dermatology) | `/specialty/<slug>/` "At a glance" capital range + phase-by-phase shifts | `BreadcrumbList`; org `knowsAbout` |

## Entity graph

Every page emits a three-node graph from `BaseLayout.astro`:

- `ProfessionalService` `@id: …/#organization` — the agency entity
  (`knowsAbout` + `serviceType` enumerate the six crews).
- `WebSite` `@id: …/#website` — publisher → organization.
- `WebPage` — `isPartOf` → website, `about` → organization, plus per-page
  `datePublished`/`dateModified` where supplied.

Page-specific nodes layered on top: `BreadcrumbList` (all detail pages),
`FAQPage` (homepage + phase pages with deep-dive FAQs), `HowTo` (checklist),
`ItemList` (journey hub), `Article` (cost guide), `Service` (service pages).

## Freshness

- Sitemap `<lastmod>` = last git commit touching `src/`/`public/` (set at build
  in `astro.config.mjs`).
- `/resources/startup-costs/` renders a visible "Last reviewed `<time>`" line;
  bump `DATE_MODIFIED` in that file whenever the ranges are re-verified.
