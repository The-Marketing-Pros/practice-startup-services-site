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
| `RESEARCH_PREVIEW_DAILY_PER_IP` | var | soft preview cap (needs DB) | Owner (default 60) | Default. |
| `PUBLIC_META_PIXEL_ID` | build var | browser pixel + privacy text | Owner, when a Meta dataset exists | Pixel absent; privacy page omits Meta text. Loads only on the production hostname. |
| `META_PIXEL_ID` + `META_CAPI_TOKEN` | var + secret | server Conversions API | Owner (set together with the build var) | No CAPI call. |
| `META_GRAPH_VERSION` | var | CAPI version | Owner (default `v23.0`) | Default. |

**Dollar cap:** the code caps calls (max AI calls per day, max two calls per request, `max_output_tokens` 1800). It cannot cap dollars. The owner must set a monthly budget/usage limit on the OpenAI "PracticeELF" project before enabling.

## HubSpot form (owner creates)

- Portal 1849537, new dedicated form ("PSS startup research brief"). Required field: `email`.
- Optional hidden fields, created as contact properties and added to the form, then listed in `HUBSPOT_RESEARCH_FIELDS`: `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `utm_id`, `adset_id`, `ad_id`, `placement`, `fbclid`, `gclid`, `ft_utm_source`, `ft_utm_campaign`, `pss_specialty`, `pss_provider_type`, `pss_zip`, `pss_practice_model`, `pss_payment_model`, `pss_launch_stage`, `pss_reference`.
- Follow-up / autoresponder emails on this form must be OFF (the page says no automated emails are sent; SDRs follow up).
- Consent: the server sends `consentToProcess: true` with the visible checkbox text. Marketing communications are sent only with a configured subscription type and the separate unchecked box.
- Before launch: one owner-approved test submission in preview to confirm the contact, fields and attribution land correctly (not performed by the implementer).

## Behavior guarantees (tested)

- Preview: no email, no AI, no HubSpot. Each source fails independently. Counts capped at the 200-record NPPES limit show "N+" and suppress the ratio.
- Gate order: config check, exact Origin, JSON content type, 8 KB cap, validation, Turnstile (hostname + action), D1 job (idempotent by requestId, quota by email/IP/global), lease, HubSpot once per requestId, server-side facts, AI (max two calls, daily cap), numeric/source guard, persist (retried once; result still returned if persistence fails).
- Failure kinds: `validation`, `verification`, `rate_limited`, `provider`, `system`, `conflict`, `in_progress`, `unavailable`. Database errors are always `system`.
- Guard: every number in the brief must appear in the facts shown to the visitor or the inputs; no spelled-out quantities, URLs or markup; facts must cite a source that returned data. Rejected outputs are never shown and are counted in `research_usage.rejected_billed`.
- Events: GA4 `generate_lead {lead_type:'startup_research'}` and Meta `Lead {content_name:'pss_startup_research', content_category:'startup_research'}` with `eventID` = server `event_id`, only after a 200 JSON `ok:true`, once per reference. Downloads fire GA4 `pss_tool_download`; previews fire GA4 `pss_tool_use`. Neither is a lead or reaches Meta.

## Data and retention

D1 stores no email, IP or free text: only HMAC hashes, the profile context hash, status counters, the event id and the result JSON (public facts + brief). The owner must schedule deletion (suggested 90 days; SQL in the migration header) and decide the cache retention. The privacy page states what is stored without promising a period.

## Local verification

```sh
npm run build   # or with PUBLIC_RESEARCH_TURNSTILE_SITE_KEY=1x00000000000000000000AA (Cloudflare's public always-pass test key) to show the gate
node --experimental-strip-types scripts/dev/research-mock-server.ts            # real handlers, mocked Turnstile/HubSpot/OpenAI/Meta, fixture NPPES/Census
NPPES_MODE=live CENSUS_MODE=live PORT=8800 node --experimental-strip-types scripts/dev/research-mock-server.ts
```

`POST /__scenario {"name": "hubspot_down" | "ai_down" | "ai_invented" | "db_down" | "rate_limited" | "verification" | "unconfigured" | "reset"}` switches mocked behavior. This server is never deployed.

## Rollback

Set `RESEARCH_ENABLED` to anything but `true` (gate off) and/or `RESEARCH_PREVIEW_DISABLED=true` (preview off); no redeploy needed. Full rollback: revert the merge commit. The checklist and pro forma read older backups, and new fields are optional, so reverting does not break saved plans except that personalized task progress (`p-*` IDs) is ignored by the old parser.
