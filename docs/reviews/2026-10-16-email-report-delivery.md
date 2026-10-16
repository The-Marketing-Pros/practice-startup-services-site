# Private email startup-report delivery

Date: 2026-10-16. User direction: use the easier email handoff because HubSpot admin approval for a service key is unavailable this week. Prior direction selects Issah as the fallback SDR and keeps the completed report off the visitor page. This implementation sends only to Issah; it does not attach a HubSpot file, change contact ownership, or email the prospect automatically.

## Snapshot and authorization

Final implementation head: `1b6c4557cc76f37d99ccc1d42a8ffa68592337ee`.
Final base: `982a0055cdf36ec4f7a25e60ae2bffe9b0dc1cd2` (merged presentation PR #35).
Diff SHA-256: `2360da5fe680cd894802a2553055bf2413da9edc1e5615f13efb116a3c2756a5`.
Implementation tree: `eef77b2f5559a8182e991a70293a2b98b57c89a1`.
This record is a later evidence-only commit, not covered as source by the earlier review.

## V1 — implementer

Primary Codex implementer; model identifier unavailable. All 149 tests pass, including receipt-only responses, capture-before-delivery ordering, name binding on replay, exclusion of names from AI/results/ledger, email leases and write-ahead/ack failures, fixed recipient and PDF failure alert/recovery. Astro check: zero errors/warnings, five existing hints. 72-page build passed with a local test Turnstile key, not a production artifact. Worker deploy dry run passed. After the P2 fix, all 149 tests and Astro check passed again. After merging the prerequisite ancestry, all 149 tests passed again; the implementation tree was unchanged.

Local browser on port 8777: public preview, required identity fields, submission loading message, confirmation only, and preserved contextual tool links. Full report is absent from visitor output. Providers, CRM and mail mocked for this test. New fields inspected at desktop width. A requested viewport override did not change this tab's measured 1280px viewport; no new mobile-width success is claimed. Prior PR35 mobile verification remains historical.

Real PDF renderer generated an 11-page synthetic named sample. Cover visually inspected; name/practice, headings, navigation and tool links fit. The same default renderer through the retained HubSpot path was exercised with mocked writes; pdftotext confirmed both names. Existing full-report contents/layout were reviewed in PR35. No synthetic report may be forwarded as prospect research.

Populated SQLite migration test applied 0004 and 0005 after 0003 and preserved an existing research_cache row. Existing endpoint tests exercise full schema and populated delivery states.

## R1 — independent review and fix

Independent Codex subagent `/root/pss_census_review`, inherited model requested, exact actual model unavailable.

Round 1: all 19 changed files reviewed at `5107bc331d146bd01773f6cc5328f36be44c3e52` against `9fd2e3806c3634eed7e770e56fb8dffc529a1dab`; digest `075887e604ac828881ba6176e3a938c99112ae473d4955826b07769287b71783`. Independently ran 149 tests. Found P2: retained HubSpot mode omitted validated contact details from its default PDF renderer. Selected email mode was correct.

Round 2: fixed in `a740bfc8410df547a2a01ad7aaf4bdfcffbd9978`. Reviewer examined the two-file delta, independently ran 55 delivery/email/endpoint tests, and extracted names from the supplied default-render PDF. Verdict: P2 resolved, no remaining actionable findings.

Ancestry follow-up: reviewer independently verified final implementation and a740bfc share the same tree, final base and old base share the same tree, final base is an ancestor, and final diff digest equals the snapshot above. No new tests were claimed for this ancestry-only check.

Limits: reviewer performed no live sends/deployments/DNS checks/inbox verification and did not independently regenerate the supplied PDF. No GitHub approval or second human review is implied.

## Operational evidence (implementer, separate from R1)

- Dedicated HubSpot form `c8842313-cf0e-4e4b-bb2e-141d302a6a79`, portal 1849537, published. Standard email/firstname/lastname/company fields. Submission notification recipient Issah; marketing-contact creation off, zero automation workflows, new contacts keyed by email. PSS domain already present in site-domain list.
- Enabled Cloudflare sending for reports.practicestartupservices.com; SPF and DMARC DNS answers verified. Main-domain routing unchanged.
- Deployed private pss-report-mailer version `187328d2-48ee-4f9d-a7ce-a2d05adb5c43`. API readback: workers.dev false, preview URLs false. Fixed sender and Issah recipient.
- A single clearly labeled synthetic test email with named PDF was accepted by the deployed relay, called through a local-only remote service binding. HTTP 200 / messageId returned. This is provider acceptance, not proof of inbox placement.
- Backed up D1 locally outside Git, then applied missing 0004/0005. Readback confirms both delivery tables. Configured production Pages REPORT_MAILER service binding, email delivery mode, dedicated form ID. Existing secret names preserved.
- RESEARCH_ENABLED remains false. Turnstile widget/secret setup requires Cloudflare dashboard sign-in: existing CLI scope returned 403 for widget management. No live end-to-end form/model/report acceptance yet. No claim that the public AI report is active.

## CI and limitations

Hosted CI links will be recorded in the PR after it runs. Synchronous generation requires the visitor to keep the page open. Ambiguous send receipts require operator reconciliation; there is no background retry queue. Existing HubSpot form notification is the lead fallback if later generation fails. See docs/research-email-delivery.md for operation and rollback details.
