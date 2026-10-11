# Personalized startup tools and startup research review record (2026-10-10)

## Snapshot and authorization

Base: `860e08d585d564b8cdb65b71a93a8fc970734751` (origin/main).
Implementation head: `55ba6f04eed04e64fda418283df256bdf040fe7b`.
Full implementation diff SHA-256 (`git diff 860e08d 55ba6f0 | shasum -a 256`): `3c44e5e5979fc9b66f6698b7dd19f739461dac061068a75724dfa87e68123557`. 46 files, +5066/-76.
This record is an evidence-only commit on top of the implementation head and contains no code.

Authorization: the owner (Andrew Eriksen) brief, relayed by the orchestrating agent, authorizes building, testing, committing, pushing a feature branch and opening a draft PR. Not authorized and not done: merge, production deploy, secrets, OpenAI calls with a real key, live HubSpot submissions, test leads. Agent verification below is separate from that authorization.

## V1: implementer verification

Implementer: Claude Code subagent (requested/actual model: Claude Opus 5.5, `claude-opus-5-5`). Not independent.

Local commands on the implementation head (macOS, Node 22.23.0):

- `npm ci`: installed; reports 28 existing dependency vulnerabilities (1 low, 10 moderate, 16 high, 1 critical). Lockfile unchanged; no dependency added.
- `npm run check`: 0 errors, 0 warnings, 4 existing hints (107 files). `functions/` is now included; a negative control (a deliberate type error in `functions/api/startup-research-preview.ts`) produced 1 error and was reverted.
- `npx tsc --noEmit -p tsconfig.json`: clean.
- `npm run test:planners`: 79 tests, 79 pass (15 pre-existing + 64 new).
- `npm run build`: 71 pages. `/resources/startup-research/` has `noindex,follow` and is absent from the sitemap. No Meta pixel without `PUBLIC_META_PIXEL_ID`; a scratch build with a dummy ID rendered the pixel with `autoConfig false` and the conditional privacy section.
- `python3 -m unittest discover -s .github/scripts -p 'test_*.py' -v`: 8 tests OK.
- `git diff --check`: clean.

Negative controls on endpoint tests: temporarily removing the HubSpot-once guard, the UNIQUE-violation classification and the quota mapping made 3 tests fail (`an AI provider failure after lead capture never re-submits HubSpot on retry`, `a duplicate-id INSERT ... not a quota error`, `quota limits return rate_limited`); restored, all pass.

Live read-only checks (public APIs, no auth): NPPES API v2.1 response shape and every taxonomy search term (two-part terms such as "Nurse Practitioner, Psych" return "No taxonomy codes found"; fixed to "Psych/Mental Health" etc. and pinned by a test); Census ACS 2024 profile variable metadata (DP05_0001, DP05_0024P, DP03_0062, DP03_0099P). Census data requests without a key now redirect to `missing_key.html` (owner must add `CENSUS_API_KEY`). ZIP3 table compared with 880 ZIP prefixes observed in a 204-query NPPES sample: 878 agree; 2 single-record disagreements (517, 987) judged registry data errors.

Local browser verification (Playwright Chromium, 390px and 1280px, after fonts load) against `scripts/dev/research-mock-server.ts`: real handlers, in-memory SQLite copy of the migration, MOCKED Turnstile/HubSpot/OpenAI/Meta, fixture NPPES/Census; plus one run with live NPPES and live keyless Census. Checked: checklist, pro forma and research initial states; two contrasting founders (NP + counseling + 59301 Montana + solo + Medicaid + opening soon vs physician + orthopedics + 10016 New York + group + commercial + exploring) produce different tasks, state wording, presets, blended rates and research facts; validation (email, consent), verification, rate_limited, provider (HubSpot down, AI down), system (DB down), unavailable (unconfigured), guard rejection fallback and success confirmation; PDF download text. GA4/Meta lead events: zero on every failure, exactly one on success, zero after reload. Screenshots are outside the repo (campaign folder).

Limitations: no independent review yet; no preview or production verification of the gated step (secrets absent by design); no real OpenAI output has been checked against the guard (only fixtures); Turnstile widget stubbed in browser runs; HubSpot form not created; Census live data not observed (no key); screen reader testing not performed.

Prior findings carried from the research worktree, with dispositions:

| Finding | Disposition | Test |
| --- | --- | --- |
| No attribution / lead measurement | Fixed: site-wide first/last touch; GA4 + inert Meta Lead after server success only, once per reference; CAPI optional | `captures the shared attribution keys...`, `lead events fire once per reference...`, `only an HTTP 200 JSON ok:true response counts as success...`, `Meta CAPI: sent once...` |
| Client parsed JSON before `r.ok` | Fixed: `classifyResponse` checks status, content type, `ok` | `only an HTTP 200 JSON ok:true response counts as success...` |
| 409 never rotated id; retries resubmitted HubSpot and burned quota; no idempotency | Fixed: requestId bound to content, rotated on conflict/edit; stored result replay; HubSpot status in D1; retries reuse the job | `idempotent replay...`, `HubSpot outage is a provider error; the retry reuses the job...`, `an AI provider failure after lead capture never re-submits HubSpot...`, `changed details on the same requestId is a conflict...` |
| Failed "complete" UPDATE discarded a paid report | Fixed: retried once, result returned with `saved:false`, kept in sessionStorage | `a failed 'complete' write still returns the paid result...` |
| Any INSERT error returned 429 | Fixed: quota via conditional INSERT; UNIQUE race resolves to replay; other DB errors `system` | `database errors are 'system', never 'rate_limited'...`, `a duplicate-id INSERT...`, `quota limits return rate_limited...` |
| Unwrapped SELECT/UPDATE threw non-JSON 500s | Fixed: every DB step wrapped; top-level catch returns JSON | `database errors are 'system'...` (every response asserts JSON content type) |
| Free text could carry invented local statistics | Fixed: strict schema, statement tags, numeric/source guard over the exact facts shown, number-word and URL bans, one regeneration then fallback | `rejects an invented local statistic...`, `timestamps and retrieval dates cannot ground...`, `rejects spelled-out quantities...`, `numeric guard rejection...` |
| Pro forma ignored specialty/ZIP/model/payer mix/stage | Fixed: presets, payer mix formula, pre-opening months; ZIP labels only | `presets change with...`, `ZIP only labels a preset...`, `Excel export uses a live blended-rate formula...` |
| functions/ excluded from typecheck | Fixed (negative control above) | `npm run check` |
| Privacy page omitted OpenAI and research form | Fixed, plus Turnstile, attribution, conditional Meta | build output inspected |
| Specialty list mapped many specialties to Other | Fixed: 34 specialties with NPPES-verified taxonomies; urgent care and Other show no count rather than a proxy | `taxonomy search terms are the NPPES-verified forms...` |
| "Rejects uncited research" passed for the wrong reason | Replaced: guard tests assert specific reason codes | `facts must cite a known source that returned data...` |

## V1 round 2: cross-brand follow-up (supersedes round 1 for the changed files)

Head: `a76b4fe` (code change after the round-1 evidence commit `94acbb4`; round 1 is historical for these files). Diff 860e08d..a76b4fe excluding docs/reviews, SHA-256 `0c3c52b69b35dafd7998ae8246c3890a7b33c90e4cae4087844238e4aac3e3ec`.

Changes: server CAPI runs only when `META_PIXEL_ID` equals `PUBLIC_META_PIXEL_ID`; CAPI token moved from the URL to the JSON body; server-side attribution drops (ft_)landing_page values that are not same-site paths and (ft_)referrer values that are not bare http(s) origins; privacy Meta section names the categories the pixel sends for all visitors; deployment doc adds the required Automatic Advanced Matching OFF step and a post-deploy `facebook.com/tr` `ud[]`/`udff[]` check.

Checks on `a76b4fe`: `npm run check` 0 errors/0 warnings/4 hints; `npx tsc --noEmit` clean; `npm run test:planners` 79/79 (CAPI and attribution tests extended); `npm run build` 71 pages; CI gate unittest OK; `git diff --check` clean.

Preview deployment (round-1 head `94acbb4`, https://1c91cf75.practice-startup-services.pages.dev), read-only: `GET /api/startup-research` returns `available:false`; `POST` returns 503 `unavailable`; preview endpoint returns live NPPES counts (59301 NP psych: 4 ZIP / 4 city; 10016 orthopaedics: 69 ZIP / 156+ city) and the honest Census "API key is not configured" section; research page shows the gate as not available; checklist and pro forma accept the research hand-off parameters. No page errors at 390px or 1280px.

## R1: independent agent review

Pending. Not requested by the implementer. No passing review is claimed.

## CI and integration

Hosted CI: to be linked from the draft PR once it runs. Integration counter: unchanged until an actual merge into main.
