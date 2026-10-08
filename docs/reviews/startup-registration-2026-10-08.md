# Startup support and registration review — 2026-10-08

## Snapshot and authorization

Base: `fbc46d664ae78a0d9c3bf01af03dbb307b4fb651`.
Frozen implementation: `1256e0865b535ff3775364b07138ad7c98f9059d`.
Full reviewed diff SHA-256: `8ff0c5130acf5f03c05b0ad2d47e8278677091e51fd197e909db3fe553df6c4b`.
Andrew requested default PPS service options in the checklist and PDF, UnfairCPA, LaborGenie for staff training/compliance/onboarding, email/practice registration, and future product/EHR email prospects. Earlier explicit publication authorization remains applicable. Agent verification is separate from that authorization.

## V1 — implementer

Codex `/root`; requested model inherited; actual model identifier unavailable. Not independent.

Pass on the frozen code: npm ci; Astro check (0 errors/warnings, 5 existing hints); 14 planner tests; production build (66 pages); 8 CI-gate unit tests; diff whitespace check. npm ci reports 28 existing dependency vulnerabilities (1 low, 10 moderate, 16 high, 1 critical); lockfile unchanged, no dependency update in this change.

Local production-build browser: PDF generation succeeded, six pages, all 10 optional hyperlinks verified with pypdf. Page 2 rendered and visually inspected: PPS and UnfairCPA support blocks and links readable, no clipping. Browser dev-server export failed after concurrent npm/build work changed Vite artifacts; local production preview succeeded. Error fallback was visible and retry on the production build recovered.

HubSpot form published: portal 1849537, form a511bd25-cdf3-4265-aecb-d56ff941bf9e. Rendered required email/practice fields; unchecked optional marketing checkbox mentioning EHR, LaborGenie, UnfairCPA; manual license confirmation copy. CAPTCHA enabled; new email creates distinct contact; marketing contact auto-classification off. Added and saved practicestartupservices.com in Advanced Tracking external domains. No unrelated tracking switches changed.

Local registration embed loads; empty submit shows both required-field errors with optional marketing still unchecked. Mobile 390px form and button inspected, readable without horizontal overflow in screenshots. No real registration, email, or license issued. End-to-end CRM delivery and manual fulfillment remain untested. Customized-plan email delivery is not implemented and no UI claims it is.

## R1 — independent agent review

Reviewer `/root/startup_r1`; requested model inherited; actual model identifier unavailable. Date 2026-10-08. Reviewed exact base/head above. Verdict: pass for changed source, no supported blocking findings.

Ran 14 planner/export tests, Astro check (0 errors/warnings, five hints), diff check. Inspected fixed HTTPS support links, stable task IDs/filtering/progress, workbook links, PDF pagination code, registration isolation and failure fallback. Did not run browser, PDF render, production or live submission. External HubSpot settings not independently certified.

## R2 — independent agent review

Reviewer `/root/startup_r2`; requested model inherited; actual model identifier unavailable. Date 2026-10-08. Reviewed exact base/head above. Verdict: pass with P3 documentation nit, no blocking code findings.

Ran 14 planner tests and independent Excel serialize/reopen confirming all 10 hyperlinks, completion preservation, and formula-like strings not executable formulas. First scratch assertion expected null rather than an empty-string cell; corrected assertion passed. No code edits. No browser/PDF visual inspection, live submission/fulfillment, build rerun or Excel-engine recalculation.

P3: earlier resource-builders customer-flow bullet described prepared email; updated to the actual HubSpot form in this evidence/documentation-only follow-up. No implementation changes after reviewed head.

## CI and integration

Hosted CI links will be added before merge. Evidence/documentation-only follow-up must be separately inspected and does not extend agent verdicts to unreviewed code.
Previous integrations after protocol baseline: PR #5 and PR #16 (2/5). This PR would be 3/5 after actual integration; combined audit not yet due.
