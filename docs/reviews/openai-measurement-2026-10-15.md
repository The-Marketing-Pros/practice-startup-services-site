# PSS OpenAI measurement verification

Date: 2026-10-15. Owner instruction: build PSS advertising with separate conversions in the existing PPS Ads account and verify the event stream. Campaign and all four ads remain paused. No spend activation authorized or performed.

Base: `a0b5f8b317e14c2dfe12cc5e2703e090e3e193d8`.
Final application head: `5c0827e48e8c833709451394a5e0c8fd2463f7e0`.

## V1 — implementer

Codex primary agent; model unavailable. On final application head, Astro check passed (0 errors, 0 warnings, 5 existing hints), 124 behavior tests passed, production build generated 71 pages, and diff whitespace check passed. The unchanged CI gate regression suite passed all 8 tests during this implementation. Dependencies installed using npm ci.

The SDK bootstrap test exercises queued initialization, explicit page views, one-time initialization, production host allowlisting, and exclusion of previews/lookalike domains. Measurement tests verify stable lead IDs and duplicate suppression with session storage, separate download and preview events, absence of form fields in explicit event payloads, and resilience to an OpenAI callback throwing.

## R1 — independent agent review

Reviewer: `/root/review_pss_tracking`, independently assigned, read-only. Requested model: inherited; actual model unavailable.

Round 1 reviewed `500054485bb3915821dc8baa834f8b06d0561f9c` against the base. One P2: privacy page omitted OpenAI ad measurement and contradicted possible automatic identifier matching. Reviewer ran 14 focused tests and 124 complete behavior tests on that historical revision.

Round 2 reviewed final application head `5c0827e48e8c833709451394a5e0c8fd2463f7e0` against the base. No actionable findings. Disclosure finding resolved; registration uses only OpenAI so existing Google/Meta metrics are preserved. Reviewer reran 14 focused tests successfully. Reviewer did not claim live delivery, remote matching-state validation, build, or hosted CI.

## Integration and limits

This record is an evidence-only addition after the reviewed application head. It does not imply a reviewer inspected a later code revision. No R2 review was assigned or claimed. Hosted CI and deployment are reported on the PR separately.

Before deployment, the live homepage contained neither this source's pixel nor the OpenAI SDK. Ads Manager contains the dedicated PSS source and a standard lead-created setting selected by the paused PSS campaign. The source edit UI explains automatic matching but exposes no toggle or definitive enabled-state control; the privacy disclosure is conditional. Explicit event data excludes planner and form inputs; SDK matching follows the platform configuration.

Live receipt of events remains to be verified after deployment. No fake inquiry or booking was submitted. The full research lead flow remains gated by its existing service configuration; this change does not enable that flow. No server-side OpenAI CAPI is added. Browser blocking/consent can prevent events.

Integration count: not integrated when authored. Consult the repository integration ledger before the next feature batch; this evidence record does not reset or assert the five-PR audit counter.
