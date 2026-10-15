# Startup consulting refresh review evidence

Date: 2026-10-15 (America/Los_Angeles).
Base: `a844de36042e0958ccd43ef000ca7a3488e7a919`.
Frozen implementation: `9eae6c270635e7ce14b287a1293ca94cfda57f97`.
Binary diff SHA-256: `790788bd5784494688d89f28f0cfe9101458eb0c62f9974fea6372cde729007c`.

## Request and scope

Andrew identified the live Practice Startup Consulting page as still using the old design and a bad schedule-consultation link. This change applies the existing learning-page design, improves the consulting page structure, and replaces the temporary Metolius URL with the official PPS scheduler. Consulting page CTAs preselect startup consulting; shared navigation/footer and other existing consultation CTAs use the common service selector. Existing conversion event behavior follows the shared URL rather than a hardcoded stale URL. The requested live-page repair is the authorization for the normal PR/Cloudflare publication workflow; review evidence is verification, not separate owner authorization.

The latest main is retained, including PR #27. No research configuration, provider credentials, database changes, or research activation is part of this repair.

## V1: implementer /root

Requested model inherited; actual model identifier unavailable. PASS. npm ci; Astro check (111 files, zero errors/warnings, four existing hints); production build (71 pages); 107 planner/research tests; eight CI-gate regression tests. Final check/build repeated after updating the analytics listener. Existing bundle-size and research dynamic-import warnings remain.

Browser inspection of the changed page at desktop, 768px, 390px and 320px viewports. Narrow-width document scroll/client widths matched (753, 375 and 305px respectively after scrollbar). Hero, roadmap and support cards inspected. Clicking the hero consultation CTA navigated to the official PPS scheduler with the startup radio checked and the startup calendar section visible. Earlier direct inspection showed the embedded calendar rendering available dates. No appointment or lead was submitted. Internal support anchor and resource destinations verified. Not a full screen-reader or accessibility audit.

## R1: independent agent /root/consulting_r1

PASS, no actionable findings. Requested model inherited; actual identifier unavailable. Reviewed all eight files at the frozen head/base/digest above. Independently ran Astro check (zero errors/warnings, four existing hints) and whitespace check. Executed generated analytics script against 11 URL cases: expected query/hash variants count, unrelated origins/paths/lookalikes/old URL do not, duplicate clicks count once. Checked 99 links, local image paths/alt, one H1, five valid JSON-LD scripts. All six generated service pages inspected; only consulting selects the refreshed component. Limits: existing output inspected without independent rebuild, no browser/live scheduler/submission/hosted CI verification.

## R2: independent agent /root/consulting_r2

PASS, no actionable findings. Requested model inherited; actual identifier unavailable. Reviewed all eight changed files and generated output at the same frozen snapshot. One H1, no duplicate IDs or missing local assets/links, correct canonical, five valid JSON-LD objects. Three consulting CTAs use startup category; two shared CTAs use base scheduler. No old booking URL in generated HTML.

Isolated Node VM execution with stubbed gtag: nonbooking internal/external/path/mailto/tel/old URLs produce zero events. Direct/query scheduler clicks each produce one dataLayer event and one conversion across repeated clicks; either order passes; missing gtag still records dataLayer without error. No live analytics emitted by reviewer.

Generated HTML SHA-256: `f5f4744186ca1c92eede99750ec2a3c0d010c9b963755718099343ec5a65ce7f`.
Generated analytics script SHA-256: `2ca55ea0084a8ec7551d7e49f79bb0c83a70ac609b9562915c3eb1af0157547d`.
Limits: no independent build/check/browser/external-scheduler/deployment/booking/hosted-CI verification.

## Evidence-only follow-up and integration

This record and the combined-main audit are evidence-only additions after the frozen implementation; their later commit is not covered by the implementation receipts. Parent inspected both separately. Hosted checks and publication status are recorded in the PR.

See [combined main audit](combined-main-audit-2026-10-15.md): the prior five integrations were audited, with no additional static-page repair blocker. Full research-launch acceptance remains incomplete because of a confirmed ambiguous-HubSpot-response retry limitation and existing activation evidence gaps. The audit boundary is not reset as fully accepted; this bounded repair neither fixes nor activates research.
