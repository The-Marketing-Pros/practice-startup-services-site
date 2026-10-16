# Floating planner panels and checklist output — 2026-10-16

Owner direction: Andrew reported that the startup checklist output "isn't great" and that on the pro forma the left assumptions column is so long that, while editing it, the forecast in the middle scrolls out of view and does not float; he asked for a scrolling feature. This authorization is separate from agent verification. No additional human approval is required by the repository protocol.

## Snapshot

Base: `cdc51ff785198e8c55e12a8215ddbdc4d3d6d259` (main after PR #36).
Final implementation head: `8c8edd0ddd769241e926920247a85b8927f9304b`.
Implementation tree: `026a02ab03d26e1ef171e199deb8a60ca1ac9ba4`.
Diff SHA-256 (`git diff base head | sha256sum`): `66f758015e00319706bba7a1531861dff62b3611203a28ed472f85de7ecd447e`.
This record is a later evidence-only commit with no runtime change; inspect its diff separately.

## Scope

Nine files, all static site source and tests. No destinations, CRM settings, dependencies, lockfile, Cloudflare functions or migrations changed.

- `src/styles/resources.css`: the existing `.rs-sticky` rule (≥1050px) now also caps the panel at the window height with its own vertical scroll; print restores normal flow.
- `src/pages/resources/pro-forma.astro`: the cash forecast panel carries `rs-sticky`.
- `src/pages/resources/startup-checklist.astro`: the practice profile panel carries `rs-sticky`.
- `src/lib/planners/checklist.ts`: `formatDay` ("Jul 20, 2026", UTC, "" for non-dates); `taskProgress` adds `dueSuggested`.
- `src/scripts/checklist.ts`: task cards show a date chip (suggested vs set, overdue flagged "start now", done) and owner, updated live when the fields change; "Start these first" shows suggested dates; the details summary reads "Edit owner, due date & notes".
- `src/styles/checklist-workspace.css`: chip styles.
- `src/lib/planners/pdf-layout.ts`: `line`/`link` accept an indent; new `check` draws a box (ticked when done) beside a bold title.
- `src/lib/planners/downloads.ts`: checklist PDF gains a progress line, a "Start these first" section, phase task counts, drawn checkboxes, indented detail and calendar dates with "Suggested date" vs "Due"; keep-together thresholds tightened. Checklist Excel due dates are real date cells (`mmm d, yyyy`) and row 2 carries progress. Task order, IDs, columns and support links are unchanged.
- `tests/planners.test.ts`: one new test for date formatting, the suggestion flag and the Excel date cell.

## V1 — implementer verification

Claude Code cloud session (model identifier per session configuration `claude-fable-5-1`; serving model not independently confirmed); not independent. Date 2026-10-16. Verdict: pass on the final implementation head.

Checks run locally on `8c8edd0`:

- `npm run test:planners`: 150 tests passed, 0 failed (149 existing + 1 new).
- `npm run check`: 0 errors, 0 warnings, 5 pre-existing hints.
- `npm run build`: production build completed, 72 pages.
- `python3 -m unittest discover -s .github/scripts -p 'test_*.py'`: 8 gate tests passed.
- `git diff --check`: clean.

Local production-preview browser observations (Playwright Chromium, 1440×900, served from `dist`):

- Pro forma: with every input section open and the "Rent & occupancy" input scrolled to mid-screen, the forecast panel computed `position: sticky`, top 100px, with internal scrolling (`scrollHeight > clientHeight`); the three headline stats remained on screen while editing. The panel scrolls internally to the monthly table and model notes. Screenshot: `planner-panels-2026-10-16/pro-forma-floating.png`.
- Checklist: at window scroll 5000px the profile panel computed `position: sticky`, top 100px, height 784px with internal scrolling. Date chips, overdue marking, owner chip and live update after editing owner and due date observed. Screenshot: `planner-panels-2026-10-16/checklist-floating.png`.
- Checklist PDF download (8 pages for a Georgia family-medicine exploring-stage plan with one task done): progress line, "Start these first", drawn checkboxes with a ticked done task, phase counts and calendar dates rendered; links present. Page 1: `planner-panels-2026-10-16/checklist-pdf-page1.png`.
- Checklist Excel download: row 2 "My practice • 1 of 37 tasks complete"; E8 is a date cell with format `mmm d, yyyy`; status, owner and support columns unchanged.
- 390px viewport: no horizontal overflow; forecast panel computed `position: static`. Print media emulation: profile panel `position: static`.

Limitations: no physical print, screen reader, Safari/Firefox, production deployment or live-site verification. Two-column behaviour between 1000px and 1050px is unchanged normal flow. Google Tag Manager requests were blocked by the sandbox proxy and are unrelated.

## Independent reviews

None performed in this session. R1/R2 rows are intentionally absent; add them only when separately assigned agent reviews actually run against the head above.

## CI and integration

Hosted CI results belong on the PR after the engineering-protocol workflow runs. Integration counter: the last combined audit (2026-10-15) covered PRs #22–#27. PRs #28–#36 have integrated since without a recorded combined audit; that audit is overdue and this PR does not perform it. No merge or deployment is authorized by this record.
