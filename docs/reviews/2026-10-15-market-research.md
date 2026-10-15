# Featured market research and competitor discovery — 2026-10-15

## Outcome and scope

The shared ResourceHub features startup marketing/business intelligence on both `/` and `/resources/`, linking to `/resources/startup-research/`. The gated report now includes a distinct Brave Search competitor-evidence section on page and in PDF. It shows up to five deduplicated source websites/excerpts, query and retrieval date. Results are potential competitors to investigate, not verified competitors. Search evidence is not sent to the numeric AI brief. Secrets remain server-side and no contact data is sent to Brave.

Implementation base: `1b0eaa5fc423a955d889aa03ad1b8bc0a8a08afe`.
Reviewed final implementation: `990e73eba500225a61fc61750b4deb83dcc567ad`.
Cumulative diff SHA-256: `c63b8fcc19e1647df7221dae1f1f3847968969c85f153d5a2ce88724962cb7a9`.

## V1 implementer verification

Codex implementation session, exact runtime model unavailable (developer context GPT-6).

- 107 existing/new planner, facts, guard, endpoint and competitor tests passed.
- Astro check: 0 errors, 0 warnings, 4 existing hints.
- Production build: 71 pages, passed; repeated after PDF link-label correction.
- Browser inspected resources feature at actual 1280px and 390px, no horizontal overflow; mobile stacks art and copy. Verified CTA navigation and homepage link.
- Real local handlers with in-memory SQLite and mocked external services produced a persisted fixture report. A temporary localhost-only fixture page seeded that saved response to exercise the normal restore/render path. Competitor title, excerpt, source link, query, date and limitations rendered correctly. This was not a real lead or live Brave query.
- Downloaded PDF using the actual browser button; extracted text and rendered page 2 with Poppler. Source URL appears once, competitor section is legible and unclipped. Test data is explicitly labeled in the fixture title/excerpt.
- Regression coverage: unsafe links, markup stripping, hostname dedupe, directory exclusion, key absent, quota exhausted, bad provider response, outage, successful cache reuse/original retrieval date, no search from free preview, completed-report replay and missing migration preserving report.

## R1 independent agent review

Reviewer: Codex subagent `/root/pss_census_review`, independent of implementer; requested inherited model, exact actual runtime model unavailable (developer GPT-6). No source sent to another provider.

Round 1: head `e49aab5d6e3cd1b95e13e66be273f460513e36dc`, base as above, digest `c0a1817b6a31acabc862e33a0fc0c108f3bbd9cd50138c2acdcc8e2475472b9c`. Two findings: P2 missing deployment guidance; P3 duplicated URL in PDF. Both fixed in `990e73e`.

Round 2: final head/base/digest above, delta base `e49aab5d6e3cd1b95e13e66be273f460513e36dc`. Both findings resolved; no remaining actionable findings. Independent competitor/endpoint tests: 38 passed in round 1; not rerun for documentation/PDF-label-only correction. Reviewer did not perform browser/PDF/live-provider/configuration checks.

## Evidence and activation limits

Screenshots in `market-research-2026-10-15/`: resources-desktop.png, resources-phone.png, competitors-fixture.png, pdf-competitor-fixture.png. All competitor/report values are synthetic verification fixtures.

Brave key location requested from owner; PSS preview/production secrets currently contain no Brave or Census key. Existing gated-report prerequisites are not enabled. Migration `0002_competitor_search.sql` is reviewed and tested locally but not applied remotely. No live competitor relevance/coverage demonstrated. No live lead, paid model/search call, production deployment or merge performed. Activation and acceptance steps are documented in `docs/research-deployment.md`.

This subsequent record/screenshots commit is evidence-only. Hosted checks belong to PR27 and are not claimed as passed here: https://github.com/The-Marketing-Pros/practice-startup-services-site/pull/27 .
