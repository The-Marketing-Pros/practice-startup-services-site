# Private startup report delivery — 2026-10-16

Owner direction: enable a preview and form-gated full report without exposing the
full report to the visitor's browser. Owner explicitly selected private HubSpot
attachment and notification to the assigned SDR, who reviews/forwards it.
Fallback SDR and existing private app identification were requested and remain
unanswered. This is not a claim of live activation.

Base: `a4418a664ddf8feb4258911f659402ece0ad8ff8`.
Final implementation: `d93c2dee6003c9389cc6beda66c00b5bf3877e23`.
Cumulative diff SHA-256: `2dc1f2738a9efcc8add5c35b54b2fca285b96aae3bd5f112fd8a26666e326f3c`.

## V1 — implementer /root

- `npm ci` completed from the lockfile.
- 140 Node tests passed. Includes real SQLite migrations, receipt-only success and
  replay, private storage failures, missing owner, active owner/fallback routing,
  private file/note/task association, reminder scheduling, duplicate prevention,
  concurrent handoff, ambiguous external writes, lost acknowledgements, redirects,
  and real server PDF bytes.
- 8 CI gate tests passed.
- Astro check: 0 errors, 0 warnings (5 existing hints after test cleanup).
- Astro build: 72 pages. Wrangler Pages Functions compiled successfully.
- Local workerd runtime generated a four-page PDF using actual public font files
  and synthetic research data, without a browser. Poppler parsed the PDF and all
  four pages were visually inspected for readable content/footer placement.
  Test compatibility date: 2026-09-18 (latest supported by installed workerd).
- V1 runtime initially caught unsupported `redirect: error`; both new requests
  now use `manual` and reject non-OK responses. The successful runtime test was
  after this fix. No private credential follows redirects.
- Browser fixture flow at 1280 desktop and 390 phone: public preview → consent
  form → receipt, no report/PDF controls. No horizontal overflow. Browser report
  elements count is zero. API tests independently verify no report payload.
  Fixture server at localhost:8775 never calls real HubSpot, AI or Brave.

## Independent R1 — /root/pss_census_review

Required by AGENTS.md; separately assigned agent. Requested model inherited the
session default; actual runtime model identifier unavailable. No GitHub approval
or second human review is claimed.

| Round | Head | Scope and verdict | Independently run |
| --- | --- | --- | --- |
| 1 | bb754956804f56fa5d4f16cba3fd4a6642714137 | Full 16-file implementation: no actionable findings | 139 tests passed |
| 2 | e8dff01a1445a3d30e56431c68add3091d0656a9 | Three-file copy/test cleanup: no actionable findings | 47 delivery/endpoint tests passed |
| 3 | d93c2dee6003c9389cc6beda66c00b5bf3877e23 | Two-file Workers redirect fix: no actionable findings | 48 delivery/endpoint tests passed |

R1 verified corresponding cumulative digests:
- Round 1: `d68006358ff96253b93d99a0b29335598337c98457eabdc27a632914799074c8`
- Round 2: `0891dcf63cbaff7480e45a5385a704d1db4d412d4b311cedeb3c06b9ec6ac4e8`
- Round 3: final digest above.

R1 did not independently run build, browser, PDF rendering, workerd or live
services. The evidence-only commit following the implementation does not change
runtime code. Hosted CI links will be recorded on the PR.

## Remaining live acceptance

Production remains off. HubSpot in-app browser shows an expired authentication
session. Cloudflare previously had no HubSpot private app credential or Turnstile
secret. A dedicated form, app permissions, fallback owner, bot verification,
model/usage configuration and migration 0004 require verification/setup. No new
production migration, live lead, upload, note, task, notification or paid AI call
was performed by this change. In particular, a mocked task response does not
prove an actual SDR notification or private attachment access.

See `docs/research-private-delivery.md` for activation and manual reconciliation.
Synchronous generation and manual recovery for uncertain external writes are
explicit operational limitations; no automatic retry queue is claimed.
