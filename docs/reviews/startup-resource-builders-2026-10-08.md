# Startup resource hub — verification and independent reviews

Date: 2026-10-08. Repository: The-Marketing-Pros/practice-startup-services-site.
Base: `220c54eaae4f1ed729d425488ad759efd4004ee3`.
Final implementation reviewed: `d219aef07c4e8be7139bd066a61645b0eda73973`.

## Owner authorization and scope

Andrew requested redesigning practicestartupservices.com as a free resource hub with buildable, downloadable pro forma and startup checklist, a future ebook, and a free LaborGenie license offer. Earlier in this ongoing website task he explicitly requested publishing finished changes. These are owner instructions, separate from agent verification. No new human approval is inferred from this record.

## V1 — implementer verification

Reviewer: Codex primary agent `/root`, not independent. Requested model: inherited session; actual identifier unavailable. Local macOS, Node 22.23.0.

- `npm ci`: completed from lockfile.
- `npm run check`: zero errors, zero warnings; five existing hints.
- `npm run test:planners`: 13 tests pass, covering cash/receivables reconciliation, zero-volume losses, month-zero costs, ramp/lag/calendar behavior, invalid inputs, conditional checklist progress, date editing, malformed backups, maximum UTF-8 backups, and XLSX formula references/cached results.
- `npm run build`: 66 static pages built. ExcelJS is a lazy-loaded large chunk; it is not loaded for initial planner use.
- `python3 -m unittest discover -s .github/scripts -p 'test_*.py' -v`: 8 tests pass.
- `git diff --check`: pass.
- Production-build browser checks: profile changes remove inapplicable tasks; custom task added; completion retained on reload; invalid pro forma inputs hide results/disable export; valid inputs recover; actual Excel/PDF downloads created; JSON backup restored the prior forecast after editing it; completing a task in To do view moved focus to the next checkbox. Desktop and 390-pixel viewport inspected; no document horizontal overflow in either planner. Mobile jump link exposes forecast/downloads.
- Export review: PDF text retains accented sample practice name; summary reconciles to UI; all pro forma PDF pages rendered and inspected. Workbook generation/cached values inspected. No independent Excel-engine formula recalculation claimed.
- A Vite development-cache invalidation caused a temporary lazy-import failure while rebuilding concurrently; production-build exports passed after reloading current assets. Download failure UI now instructs backup/reload recovery.

## R1 and R2 — first round (historical)

Reviewed head: `92b178244f31bda28dbaa01865d7f605aaa4669e`, same base above.

| Channel | Independent reviewer / model | Verdict | Findings and evidence |
| --- | --- | --- | --- |
| R1 | Codex agent `/root/startup_r1`; inherited model requested, actual identifier unavailable | Changes requested | P2: custom ID arrays passed regex coercion and crashed rendering. P2: 500 KB import cap rejected valid exported backups. Both reproduced with Node. 11 tests passed; dependency/formula review; no edits. Scoped diff SHA-256 `4068fd71c4cbdecaaaf684b724bd8055fdd3e5e4a81190f3e1eed2f5f3a86510`. |
| R2 | Codex agent `/root/startup_r2`; inherited model requested, actual identifier unavailable | Changes requested | Independently reproduced the same ID and backup-size failures. Flagged focus loss after removing a completed task from To do. 11 tests and Astro check passed; no edits. |

Fixes: require bounded string IDs; raise import cap to 2 MB with maximum-size UTF-8/JSON-escaped regression; restore successor focus; improve mobile jumps and remove the overlong sticky sidebar. PDF month blocks remain together across pages.

## R1 and R2 — final round

Both reviewed exact head `d219aef07c4e8be7139bd066a61645b0eda73973` against base `220c54eaae4f1ed729d425488ad759efd4004ee3`, including every change since the historical review.

| Channel | Independent reviewer / model | Verdict and evidence | Limitations |
| --- | --- | --- | --- |
| R1 | `/root/startup_r1`, Codex agent; inherited requested, actual identifier unavailable | Pass; no remaining supported findings. Malformed IDs rejected; independent maximal escaped-text backup of 1,852,558 bytes round-tripped. 13 tests and diff check passed. Incremental diff SHA-256 `4279f0e3e5b66612313523b3dafef422e87e5f6d7ba6399bf7d65365c640e7f5`. | No browser, PDF rendering, Excel-engine recalculation, deployment, or full build rerun. |
| R2 | `/root/startup_r2`, Codex agent; inherited requested, actual identifier unavailable | Pass; both P2 fixes confirmed and no remaining supported blocking findings. Original array-ID rejected; 1,852,558-byte stress backup round-tripped. 13 tests pass. Inspected focus/mobile/PDF/recovery changes; clean tree. | No browser, screen reader, PDF visual rendering, production, license fulfillment, or Excel-engine recalculation. |

These are actual independent agent reviews, not GitHub approval reviews or owner authorization. No source was sent to an additional provider.

## Product and dependency boundaries

- LaborGenie request uses PPS email/contact with manual fulfillment; no license is auto-issued. Seats/duration are not invented. Fulfillment has not been exercised by sending a test message.
- Ebook is labeled planned; existing online guides are usable now.
- Planner inputs remain in this browser. Visitors must use backup/downloads for portability. Existing global site analytics and booking destination remain unchanged.
- New dependency audit findings: ExcelJS/uuid moderate advisory for UUID v3/v5/v6 buffer handling. R1 inspected ExcelJS's use of v4. This exporter only writes workbooks, does not parse them. Existing Astro/Tailwind toolchain audit findings remain; no broad dependency migration included. See `docs/resource-builders.md`.

## CI, integration, and publishing

Hosted CI and deployment links will be recorded in the PR and final publication note once they exist; this initial record does not claim a deployment.

After adoption baseline `c13072b7dcd42e88e8be775cf11b171db7ee9889`, only PR #5 is integrated, at `220c54eaae4f1ed729d425488ad759efd4004ee3`. This feature would be integration 2/5. The five-PR combined audit is not yet due.

Evidence-only commits after the reviewed implementation are not covered by those code review SHAs. Inspect their diffs separately and do not describe them as newly reviewed application code.
