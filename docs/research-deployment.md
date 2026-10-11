# Personalized startup tools: deployment and launch gates

Status (2026-10-10): implemented and locally tested on branch `claude/ig-personalized-startup-tools`. Not deployed to production. The free preview works without secrets (Census needs a key, see below). The gated brief reports itself unavailable until every required setting exists.

Builds on uncommitted research work from the `codex/startup-research-gate` worktree (component layout, specialty task ideas, D1 gate concept). The endpoint, guard, facts pipeline and tests were rewritten to fix the prior review findings listed in `docs/reviews/ig-personalized-startup-tools-2026-10-10.md`.

## Surfaces

| Route | What it does | Server? |
| --- | --- | --- |
| `/resources/startup-checklist/` | Checklist tailored by provider type, specialty, ZIP/state, practice model, payer mix, launch stage. | No (browser only) |
| `/resources/pro-forma/` | Presets + payer mix + pre-opening overhead; all inputs editable. | No (browser only) |
| `/resources/startup-research/` | Free preview (no email), then gated brief + PDF. | `functions/api/startup-research-preview.ts`, `functions/api/startup-research.ts` |

All server logic is in `src/lib/research/handler.ts` and is type-checked by `npm run check` (functions/ is no longer excluded from tsconfig).

## Configuration (names only; values are set by the owner in Cloudflare Pages)

| Name | Type | Required for | Who sets | While unset |
| --- | --- | --- | --- | --- |
| `CENSUS_API_KEY` | secret | Census figures in the preview | Owner (free key: https://api.census.gov/data/key_signup.html) | Verified 2026-10-10: the Census API now redirects keyless requests to a "missing key" page. The preview shows "Census data is not available right now" and still shows NPPES counts and the checklist. |
| `RESEARCH_DB` | D1 binding | gate (required), preview cache + soft IP cap (optional) | Owner: create a dedicated D1 database, apply `migrations/0001_research.sql`, bind as `RESEARCH_DB` | Preview works uncached. Gate unavailable. |
| `RESEARCH_ENABLED` | var `true` | gate kill switch | Owner | Gate unavailable. Set to anything else to stop all paid calls instantly. |
| `RESEARCH_HASH_SECRET` | secret | email/IP hashing | Owner (random 32+ bytes) | Gate unavailable. |
| `TURNSTILE_SECRET_KEY` | secret | gate bot check | Owner (Turnstile widget for practicestartupservices.com, action `startup_research`) | Gate unavailable. |
| `PUBLIC_RESEARCH_TURNSTILE_SITE_KEY` | build var | gate widget | Owner | Gate form hidden, "not available yet" shown. |
| `HUBSPOT_RESEARCH_FORM_ID` | var | lead capture | Owner creates a dedicated HubSpot form in portal 1849537 | Gate unavailable (honest message); free preview works. |
| `HUBSPOT_RESEARCH_FIELDS` | var, comma list | optional hidden fields | Owner, only after the fields exist on the form | Only `email` is sent; UTMs travel in `pageUri`. |
| `HUBSPOT_MARKETING_SUBSCRIPTION_ID` | var | optional marketing checkbox | Owner | Marketing checkbox hidden; server rejects `marketing:true`. |
| `OPENAI_API_KEY` | secret | brief | Owner, from the existing "PracticeELF" OpenAI project | Gate unavailable. |
| `RESEARCH_MODEL` | var | brief | Owner (any Responses API model with Structured Outputs) | Gate unavailable. |
| `RESEARCH_MAX_AI_CALLS_PER_DAY` | var | usage cap | Owner (default 40) | Default 40 calls/day. |
| `RESEARCH_DAILY_LIMIT` / `RESEARCH_DAILY_PER_EMAIL` / `RESEARCH_DAILY_PER_IP` | vars | request caps | Owner (defaults 50 / 2 / 5) | Defaults apply. |
| `RESEARCH_PREVIEW_DISABLED` | var `true` | preview kill switch | Owner | Preview on. |
| `RESEARCH_PREVIEW_DAILY_PER_IP` | var | preview per-IP daily cap (needs `RESEARCH_DB` + `RESEARCH_HASH_SECRET`) | Owner (default 60) | Default. |
| `RESEARCH_PREVIEW_WAF_CONFIRMED` | var `true` | production preview without the D1 counter | Owner, ONLY after adding a Cloudflare rate-limiting rule on `/api/startup-research-preview` | On the production hostname the preview returns "not available yet" unless the D1 counter (DB + hash secret) or this confirmation exists. Preview deployments are unaffected. |
| `PUBLIC_META_PIXEL_ID` | build var AND runtime var (set in both Pages scopes) | browser pixel, privacy text, and the CAPI switch | Owner, when a Meta dataset exists, ONLY after the Meta pre-enable steps below | Pixel absent; privacy page omits Meta text; CAPI off. Pixel loads only on the production hostname. |
| `META_PIXEL_ID` + `META_CAPI_TOKEN` | var + secret | server Conversions API | Owner | No CAPI call. CAPI also stays off unless `META_PIXEL_ID` equals `PUBLIC_META_PIXEL_ID`, so disclosure and behavior share one switch. The token is sent in the JSON body, never the URL. |
| `META_GRAPH_VERSION` | var | CAPI version | Owner (default `v23.0`) | Default. |

**Dollar cap:** the code caps calls (max AI calls per day, max two calls per request, `max_output_tokens` 1800). It cannot cap dollars. The owner must set a monthly budget/usage limit on the OpenAI "PracticeELF" project before enabling.

## D1 pre-apply step (REQUIRED before applying `migrations/0001_research.sql`)

`0001_research.sql` was edited in place during review (columns `lease_token` and `config_errors` were added) because it had never been applied. Before applying it, confirm the target database has no `research_jobs` table:

```sh
npx wrangler d1 execute <database-name> --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name='research_jobs';"
```

If that returns a row (an earlier copy of 0001 was applied), do NOT rely on `CREATE TABLE IF NOT EXISTS`: add a `0002` migration with `ALTER TABLE research_jobs ADD COLUMN lease_token TEXT;` and `ALTER TABLE research_jobs ADD COLUMN config_errors INTEGER NOT NULL DEFAULT 0;`, review it, then apply.

## Meta pre-enable steps (REQUIRED before setting `PUBLIC_META_PIXEL_ID`)

`fbq('set','autoConfig',false,ID)` disables automatic event configuration only. Automatic Advanced Matching (AAM) is a dataset setting in Events Manager that code cannot disable, and the research page renders an email field.

1. In Events Manager, open the PSS dataset, Settings, and turn **Automatic advanced matching OFF**. Record who did it and when.
2. Set `PUBLIC_META_PIXEL_ID` (build and runtime) and optionally `META_PIXEL_ID` (same value) + `META_CAPI_TOKEN`; deploy.
3. On production, with browser DevTools Network filtered to `facebook.com/tr`, type into the research email field WITHOUT submitting, then move focus and navigate. Confirm no `facebook.com/tr` request carries `ud[...]` or `udff[...]` parameters. Only then run ads.
4. The privacy page's Meta section (rendered only when the pixel is configured) says the pixel sends page URL with campaign tags, referrer, IP, browser/device information and Meta cookie IDs for every visitor, and that settings exclude form contents. Step 1 is what makes that last statement true.

## HubSpot form (owner creates)

- Portal 1849537, new dedicated form ("PSS startup research brief"). Required field: `email`.
- Optional hidden fields, created as contact properties and added to the form, then listed in `HUBSPOT_RESEARCH_FIELDS`: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `utm_id`, `adset_id`, `ad_id`, `placement`, `fbclid`, `gclid`, `ft_utm_source`, `ft_utm_campaign`, `pss_specialty`, `pss_provider_type`, `pss_zip`, `pss_practice_model`, `pss_payment_model`, `pss_launch_stage`, `pss_reference`.
- Follow-up / autoresponder emails on this form must be OFF (the page says no automated emails are sent; SDRs follow up).
- Consent: the checkbox text and the `legalConsentOptions.consent.text` sent to HubSpot both come from `CONSENT_TEXT` in `src/lib/research/copy.ts` (tested to match). Marketing communications are sent only with a configured subscription type and the separate unchecked box, using `MARKETING_TEXT`.
- Before launch: one owner-approved test submission in preview to confirm the contact, fields and attribution land correctly (not performed by the implementer).

## Behavior guarantees (tested)

- Preview: no email, no AI, no HubSpot. Each source fails independently. NPPES is paged with `skip` (up to 3 x 200 records per search); a search that still fills every page shows "at least N (registry limit reached)" and suppresses the ratio; a capped city count lower than the ZIP count is not shown and the page says why. Cached NPPES results keep and show their original retrieval date. On production, the preview requires the D1 per-IP counter (`RESEARCH_DB` + `RESEARCH_HASH_SECRET`, keyed hash, never a public fallback key) or a Cloudflare rate-limiting rule plus `RESEARCH_PREVIEW_WAF_CONFIRMED=true`. `GET /api/startup-research` reports the same `previewAvailable` for the requesting hostname, and the page shows an up-front notice (form disabled) when it is false; blocked requests log `preview_blocked_unconfigured` (no personal data). **Launch blocker for the free preview on production.**
- Gate order: config check, exact Origin, JSON content type, 8 KB cap (stream-read, so it holds without Content-Length), validation, Turnstile (hostname + action), D1 job (idempotent by requestId, quota by email/IP/global), 240 s lease renewed before each AI call, HubSpot once per requestId (recorded immediately with one retry, and again by any later failure write), server-side facts, AI (max two calls, daily cap), numeric/source guard, persist (retried once; result still returned if persistence fails).
- Failure kinds: `validation`, `verification`, `rate_limited`, `provider`, `system`, `conflict`, `in_progress`, `unavailable`. Database errors are always `system`.
- Brief design (R1 round 2): the model never writes numbers. For "fact" and "estimate" statements it only picks item ids (`refs`); our code renders the sentence from each cited item with a fixed template (label, display value, margin of error, vintage or NPI retrieval date, "at least ... (registry limit reached)" for capped counts), word for word as in the tables, and discards any model text. "Interpretation" statements are model-written words only: no digits, no cardinal words (two and up, compounds, hundred/thousand/dozen/couple/several/few), no fraction or share words (half, a third, quarters, majority/minority of), no unit words (percent, pct, dollars, %, $), no multipliers, no URLs/domains (scheme, www, slash or a known TLD), no markup. Also banned: any "-fold" word, quintupled/sextupled, zero, score/pair/handful of, trio, majority/minority, large and teen ordinals (hundredth, twentieth, eleventh...), ranked superlatives (second-largest, third fastest), and Roman numerals II and up (after NFKC). Headings must be one of the fixed headings; refs are de-duplicated and capped at four per statement. Allowlisted idioms: one-on-one, third-party, double-check(ed), double-book(ed), half-day, two-way, first-pass, IV therapy/infusion/hydration/fluids. Release and final-save writes require the request's lease token; `preview_blocked_unconfigured` is logged once per isolate. Permitted echoes: "ZIP 12345" and the chosen stage label. Rejected outputs are never shown and are counted in `research_usage.rejected_billed`. OpenAI 400/401/403/404 is a `system` error with the reserved call refunded; the second such error for a job makes that job report the gate unavailable (logged once); if an earlier attempt was already rejected, a 4xx finishes with the fallback. The lease has an owner token; renewal happens before reserving a call, so a failed or lost renewal consumes nothing. Server CAPI sends only from the production hostnames.
- Events: GA4 `generate_lead {lead_type:'startup_research'}` and Meta `Lead {content_name:'pss_startup_research', content_category:'startup_research'}` with `eventID` = server `event_id`, only after a 200 JSON `ok:true`, once per reference. Downloads fire GA4 `pss_tool_download`; previews fire GA4 `pss_tool_use`. Neither is a lead or reaches Meta.

## Data and retention

D1 stores no email, IP or free text: only HMAC hashes, the profile context hash, status counters, the event id and the result JSON (public facts + brief). The owner must schedule deletion (suggested 90 days; SQL in the migration header) and decide the cache retention. The privacy page states what is stored without promising a period.

## Local verification

```sh
npm run build   # or with PUBLIC_RESEARCH_TURNSTILE_SITE_KEY=1x00000000000000000000AA (Cloudflare's public always-pass test key) to show the gate
node --experimental-strip-types scripts/dev/research-mock-server.ts            # real handlers, mocked Turnstile/HubSpot/OpenAI/Meta, fixture NPPES/Census
NPPES_MODE=live CENSUS_MODE=live PORT=8800 node --experimental-strip-types scripts/dev/research-mock-server.ts
```

`POST /__scenario {"name": "hubspot_down" | "ai_down" | "ai_invented" | "db_down" | "rate_limited" | "capacity" | "no_data" | "preview_unconfigured" | "verification" | "unconfigured" | "reset"}` switches mocked behavior. This server is never deployed.

## Rollback

Set `RESEARCH_ENABLED` to anything but `true` (gate off) and/or `RESEARCH_PREVIEW_DISABLED=true` (preview off); no redeploy needed. Full rollback: revert the merge commit. The checklist and pro forma read older backups, and new fields are optional, so reverting does not break saved plans except that personalized task progress (`p-*` IDs) is ignored by the old parser.
