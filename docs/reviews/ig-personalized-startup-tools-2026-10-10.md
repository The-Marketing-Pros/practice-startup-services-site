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

## R1: independent agent review (received)

Independent agent reviewer assigned by the orchestrating agent; actual reviewer identity and model as reported by the coordinator (not recorded by the implementer). Date 2026-10-10. Reviewed head `1fe0b48` against base `860e08d`. Verdict: **CHANGES REQUIRED**. This verdict is historical: code changed afterwards in `0f12137`.

| ID | Severity | Finding (summary) | Disposition in `0f12137` | Test / evidence |
| --- | --- | --- | --- | --- |
| F1 | HIGH | Allowed-number pool built from all grounding text; probes "About 90% ... within 5 years", "3 in 5", "200% since 2020", full-width digits, "census.gov/data" passed | Fixed: `refs` per statement; numbers only from cited items (value/display/MOE/measure label); caveats, source names, vintages, ZIP excluded; interpretations digit-free except input echoes; %/$ unit check; NFKC + non-ASCII digit rejection; bare-domain ban | `reviewer probes that previously passed are now rejected`, `caveats, source names, vintages and the ZIP are never a number source`, `% and $ must sit next to numbers...`, `interpretations carry no numbers except echoes...`; negative control (interpretations given all ids) failed 2 tests |
| F2 | MED | Number-word ban rejected normal language | Fixed: quantity patterns only; banned forms listed in instructions | `ordinary planning language passes; quantity phrases are rejected` |
| F3 | MED | "Your brief is ready." shown for every status | Fixed: heading and next-step text by status | `confirmation heading only claims a brief when one is shown`; browser screenshots `research-*-10-status-*` (5 statuses x 2 widths) |
| F4 | | Brief could cite numbers not on screen | Fixed: `showResult` re-renders tables from `r.facts` | Browser check: brief numbers missing from tables = 0 in all 10 runs |
| F5 | | Failed `hubspot_status` write allowed a HubSpot re-submit | Fixed: write retried once; `release()` and the final save record it | `a failed hubspot_status write cannot cause a second HubSpot submission`; negative control failed it |
| F6 | | Preview abuse limits; public fallback hash key | Fixed: production previews need the keyed D1 counter or `RESEARCH_PREVIEW_WAF_CONFIRMED=true` (after a Cloudflare rate-limit rule); counter skipped without the secret | `production previews require an abuse limit...` |
| F7 | | Privacy omitted the preview counter; consent text differed; doc line wrong | Fixed: privacy sentence; `CONSENT_TEXT`/`MARKETING_TEXT` shared; doc corrected | `HubSpot receives exactly the consent text shown in the form` |
| F8 | | NPPES date, capped wording, capped city below ZIP | Fixed: retrieval date cached and shown; "at least N (registry limit reached)"; bounded `skip` pagination (3 pages); misleading city count suppressed with note | `NPPES pagination...`, `a capped city count below the ZIP count is not shown...`, `cached NPPES results keep and show their original retrieval date` |
| F9 | | Hand-off params re-applied on reload | Fixed: `history.replaceState` strips them (UTMs kept) in checklist and pro forma | `hand-off parameters are stripped after use...`; browser: URL becomes `?utm_source=instagram` |
| F10 | | Pre-opening "other" costs double counted | Fixed: input relabeled "Pre-opening payroll & one-time costs"; guidance in UI, method notes, Excel, PDF | screenshot `proforma-*-05-preopening-label` |
| F11 | | CAPI could fire from preview deployments | Fixed: production hostnames only | `CAPI never fires from preview deployments...` |
| F12 | | OpenAI 4xx config errors burned reserved calls | Fixed: 400/401/403/404 -> `system`, no retry, daily call and attempt refunded | `OpenAI 400/401/403/404 is a system error...` |
| F13 | | Lease too short; no stream cap without Content-Length | Fixed: 240 s lease renewed before each AI call; stream-capped body read | `lease covers the AI calls and is renewed; bodies without Content-Length are stream-capped` |

## V1 round 3 (implementer, after R1)

Head `0f12137` (base `860e08d`). Diff 860e08d..0f12137 excluding docs/reviews SHA-256 `a9521e84942a5403a366b2bb718071304a23e00be5cf88945eb5d78c6523416d`; round-3 delta 1fe0b48..0f12137 SHA-256 `97938a7c9bc9cb6b7666af4ae11ade03a64bb23dc51a828600462bfe4d8a40cc`. Implementer: Claude Opus 5.5. Not independent.

Checks on `0f12137`: `npm run check` 0 errors/0 warnings/4 existing hints (108 files); `npx tsc --noEmit` clean; `npm run test:planners` 93/93; `npm run build` 71 pages; CI-gate unittest OK; `git diff --check` clean. Negative controls: removing the F5 release fix and widening interpretations to all ids failed 3 tests; restored, all pass.

Browser (local, mocked Turnstile/HubSpot/OpenAI/Meta, 390px and 1280px): confirmation for `ready`, `rejected`, `capacity`, `insufficient_data`, `unavailable` shows the status-correct heading and note, one lead event each, and no brief number missing from the on-screen tables; the full error-class journey re-run (0 lead events on every failure, 1 on success, 0 after reload); hand-off params stripped; pre-opening label updated.

Limitations unchanged: no real OpenAI output tested against the new guard; gated step unverified on preview; R2 / re-review of `0f12137` pending.

## R1 round 2 (received)

Same independent agent channel, reviewed `0f12137` (base `860e08d`). Verdict: **CHANGES REQUIRED**. F2-F13 confirmed fixed. Historical: code changed afterwards in `10b2721`.

| ID | Finding | Disposition in `10b2721` | Test / evidence |
| --- | --- | --- | --- |
| Blocker 1 (F1 residual) | Regex hardening kept losing: cardinal words ("Fourteen providers..."), fractions ("Three-quarters... nearly half"), "a couple/several", wrong-measure reuse ("3.9% ... age 65", "1,987 residents", "65 new patients"), "dollars", "pct", "522 providers" without "at least"; false rejections of "one-on-one" and "Most of the residents" | Design change: fact/estimate sentences rendered by code from cited items (model text discarded); interpretations words only with explicit bans and an idiom allowlist; schema/instructions/PDF updated | `every reviewer string is rejected as an interpretation`; `model text can never carry a number into a fact or estimate...` (asserts every reviewer string is discarded and the output equals the rendered sentence); `rendered fact sentences use exactly the strings shown in the tables`; `ordinary planning interpretations pass...`; negative control (keeping model text) failed the discard test |
| Blocker 2 (R2-N1) | Availability ignored production preview gating; form failed after filling; misleading gate copy | `handleAvailability(request)` uses `previewAllowed` (same rule as the preview); up-front notice + disabled form; `preview_blocked_unconfigured` log; copy fixed; launch blocker documented | `availability reports the real previewAvailable for the hostname...` (negative control failed it); screenshots `research-*-11-preview-unavailable-notice` |
| R2-N2 | Config-error retries uncapped; 4xx after a rejected output returned system | `config_errors` per job (second -> `unavailable`, logged once); 4xx after a rejection completes with the fallback | `AI config errors are capped per job; after a rejected output a 4xx finishes with the fallback` |
| F7 nit | Privacy claimed a counter on the WAF-only path | "When enabled, ..." | build output |
| F13 nits | Renewal not owner-checked; renewal failure consumed an attempt | `lease_token` on claim; renewal `WHERE id AND lease_token` before reserving a call; failed or lost renewal consumes nothing | `lease renewal is owner-checked and never consumes an attempt...` |
| Domain false positive | "rates.Co-signing" | Domain needs scheme, www, slash or a known TLD | `ordinary planning interpretations pass...` |
| Concurrency | No same-requestId concurrency test | Added | `concurrent submissions with the same requestId: one 200, the rest 409, one HubSpot, one AI` |

Migration note: `migrations/0001_research.sql` gained `lease_token` and `config_errors`. It has never been applied anywhere (owner action pending), so the first migration is edited in place rather than adding 0002.

## V1 round 4 (implementer, after R1 round 2)

Head `10b2721` (base `860e08d`). Diff excluding docs/reviews SHA-256 `c2161c24715000bbaef07cbefdc7ee89c4ce741bb0abfc72e83d5d9797cf8c41`; round-4 delta 3df460b..10b2721 SHA-256 `799e015cb0c6a5e837257a9518926c9a07a91197de0f3fcc247d90734f141aa0`. Implementer: Claude Opus 5.5. Not independent.

Checks on `10b2721`: `npm run check` 0 errors/0 warnings/4 existing hints; `npx tsc --noEmit` clean; `npm run test:planners` 95/95; `npm run build` 71 pages; CI-gate unittest OK; `git diff --check` clean. Negative controls: keeping model text in facts and reverting availability to the old rule failed 2 tests; restored, all pass.

Browser (local, mocked Turnstile/HubSpot/OpenAI/Meta, 390px and 1280px): production-gated preview shows the up-front notice with the form disabled; 5 confirmation statuses correct with rendered fact/estimate sentences and no brief number missing from the tables; full error-class journey re-run (0 lead events on failures, 1 on success, 0 after reload).

## R2 / re-review

Pending for `10b2721`. No passing independent review is claimed.

## CI and integration

Hosted CI: to be linked from the draft PR once it runs. Integration counter: unchanged until an actual merge into main.
