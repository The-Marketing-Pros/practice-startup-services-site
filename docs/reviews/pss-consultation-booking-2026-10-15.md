# PSS embedded consultation booking — 2026-10-15 (America/Los_Angeles)

## Scope and authorization

Andrew asked to use the same embedded meeting book used on PPS on the PSS website and ensure bookings count as conversions. This record covers the site implementation and bounded deployment. Ad spend remains unauthorized; the campaign stays paused. Repository protocol is not itself deployment authorization.

Base: `43d2f0a4987ee3710669f68115db9bc8c0ed636f`.
Runtime head: `4303330a01ba65eabab4e32287c3e5d266ffcdab`.
Runtime diff SHA-256: `bf2a1569a476b32cc0588248d4c47f9ffe89b8b06a76a143af0a0cb54af01b56`.
Comment/document clarification: `159de61fc6917262d41858d708428f5cf300780f`.
This record is an evidence-only follow-up; it does not retrospectively change either reviewed SHA.

## V1 implementer

Parent Codex agent; actual model identifier unavailable. Independently labeled from R1.

- npm ci completed using lockfile.
- 130 Node behavior tests passed, including six new booking tests.
- Astro check: 120 files, zero errors and warnings; five existing hints.
- Eight CI gate Python tests passed.
- Serial production build: 72 pages, passed after concurrent build collision described below.
- git diff --check passed.
- Chrome local UI: real embedded HubSpot round-robin availability loaded, a time selection opened the booking form with startup consultation context prefilled. No form submitted.
- 390px mobile inspection confirmed the form is usable within the embedded calendar; viewport restored.
- Success/failure message, origin, iframe source, detached frame, deduplication, blocked-storage, attribution allowlist, and provider-exception tests are simulated unit evidence, not live booking receipts.

## R1 independent agent

Agent `/root/review_pss_booking`; inherited model requested, actual model unavailable. No actionable findings on exact runtime head above.

R1 ran 20 focused booking/attribution/pixel tests, Astro check, and diff whitespace validation successfully. It verified confirmation-only measurement, exact iframe/origin checks, duplicate suppression, provider separation, production-only pixel bootstrap, and CTA destinations. Live PPS scheduling/analytics source and HubSpot `MeetingsPublic/static-1.61297/bundles/project.js` were inspected; the vendor success payload uses boolean `meetingBookSucceeded:!0`, and failures use `meetingBookFailed`.

R1 build was inconclusive: a simultaneous V1 build in the shared directory removed generated files during R1 static generation. This was not treated as a source defect. V1 reran the build serially and passed. Do not label that V1 build as independent R1 evidence.

R1 addendum inspected runtime head → clarification head and confirmed only documentation/source comments changed, with no runtime change and no findings. No tests rerun for that addendum.

## Ads Manager and remaining live verification

Created `PSS | Meeting Booked` using `appointment_scheduled` and only `PSS | Website Conversions`. The existing `PSS | Free Startup Tools` campaign remains paused with its inquiry goal. OpenAI rejected the attempted goal-list update with “Campaign objective and conversion event settings cannot be modified after creation.” A replacement using booked consultations, the same four ads, USD100/day, US targeting and paused status is prepared outside this repository for user approval; it has not been created.

No real appointment was booked; genuine OpenAI event receipt and ad attribution are not proven. Booking from the JavaScript-disabled external-calendar fallback or by phone is not observable by this browser pixel. No CAPI is configured. HubSpot's own embed appends parent page/query context; normal CTA URLs contain no form or planner data, and our explicit decoration is limited to UTMs and fixed service context.

PR and hosted checks: https://github.com/The-Marketing-Pros/practice-startup-services-site/pull/33
Initial CI: https://github.com/The-Marketing-Pros/practice-startup-services-site/actions/runs/38851177229
Final-head CI and deployment results are recorded in the PR description after completion. This PR is the first integrated change after the prior PR28–32 audit, if merged. Unrelated research launch gates remain unchanged.
