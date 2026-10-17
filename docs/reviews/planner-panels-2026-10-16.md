# Floating planner panels and checklist output — 2026-10-16

Owner direction: Andrew reported that the startup checklist output "isn't great" and that on the pro forma the left assumptions column is so long that, while editing it, the forecast in the middle scrolls out of view and does not float; he asked for a scrolling feature. This authorization is separate from agent verification. No additional human approval is required by the repository protocol.

## Snapshot

Base: `cdc51ff785198e8c55e12a8215ddbdc4d3d6d259` (main after PR #36).
Round 1 implementation head: `8c8edd0ddd769241e926920247a85b8927f9304b` (tree `026a02ab03d26e1ef171e199deb8a60ca1ac9ba4`); diff SHA-256 vs base `66f758015e00319706bba7a1531861dff62b3611203a28ed472f85de7ecd447e`.
Final implementation head: `bf1c96ec2cb90e4fb65ec1d927db396a267a8169` (R1 fixes); source diff SHA-256 vs base (`git diff base head -- src tests`) `922a3aae05d7c26df17bd5c53241a0968ab59d7857ab6108efacd115562c9a1f`; round-2 delta SHA-256 (`git diff 8c8edd0 bf1c96e -- src tests`) `9a1f212b63028a1252f1beee2a42b7895391824eae494451bb303c7c1707f27a`.
Commit `8e564c8` (between the two) and the commit carrying this update are evidence-only with no runtime change; inspect their diffs separately.

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

Claude Code cloud session (model identifier per session configuration `claude-fable-5-1`; serving model not independently confirmed); not independent. Date 2026-10-16 (round 1) and 2026-10-17 (round 2). Verdict: pass on the final implementation head `bf1c96e`.

Round 2 (`bf1c96e`, after the R1 findings below): `npm run test:planners` 150 passed / 0 failed (the existing new test gained a cleared-date case); `npm run check` 0 errors, 0 warnings, 5 pre-existing hints; `npm run build` 72 pages; `git diff --check` clean. No browser re-run by the implementer in round 2; R1 performed the browser reproduction.

Round 1 checks run locally on `8c8edd0`:

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

## R1 — independent agent review

Reviewer: a separately spawned Claude Code subagent in this cloud session, assigned the diff and the repository without the implementer's conclusions; read-only (no edits, commits or pushes). Requested model inherited from the session; actual model identifier unavailable. Independent of the implementer's reasoning but run on the same account and sandbox. Date 2026-10-17.

Round 1 (head `8c8edd0`, base `cdc51ff`, digest `66f7580…` confirmed by the reviewer): verdict PASS with findings. Ran test:planners (150/150), check (0/0/5), build (72 pages), diff check, a Node script over the planner library and exports, pdftoppm/pdftotext inspection of a generated PDF, and Playwright Chromium at 1280×720, 1000×720 and print emulation on both planner pages. Findings:

- P2 (verified): clearing a task's due date while an opening date is set made the card chip read "Set an opening date for a suggested date"; the stored `""` bypassed the suggestion and `formatDay("")` is empty.
- P3 (verified): "Start these first" labelled a visitor-set past date as "suggested" on the page and in the PDF.
- P3 (verified): an empty `class=""` attribute on non-overdue chips.
- P3 (reasoned, pre-existing but more visible): editing a due date did not refresh the first-steps box until the next full render.

Verified as correct in round 1: `formatDay` UTC handling and invalid inputs; XSS escaping of owner; overdue comparison; done-task chips; the PDF `check()` primitive never splits a box from its title and draws inside the page; Excel date serials and `mmm d, yyyy` format; unchanged columns and task order; sticky panels keep all content reachable, focus scrolls into view inside the panel, static below 1050px and in print.

Disposition: all four fixed in `bf1c96e` (`dueSuggested` is `saved.due == null`; "Date not set" when an anchor exists; due vs suggested labels on the page and PDF; `renderTimeline()` after each task edit; conditional class attribute; test extended).

Round 2 (head `bf1c96e`, delta digest `9a1f212…` confirmed by the reviewer): verdict PASS. Each finding re-verified in Chromium against the rebuilt preview (chip "Date not set" after clearing; "due Jan 5, 2020" vs "suggested Aug 3, 2026" in the first-steps list and PDF text; zero empty class attributes; first-steps box updates immediately). test:planners 150/150, check 0 errors/0 warnings/5 hints, build 72 pages, diff check clean. No new issues; notes only (first-steps re-render on every input event is negligible; loose `== null` is intentional).

R1 limitations: Chromium headless only; round 2 exercised the checklist page only, since the delta does not touch the pro forma or CSS; Excel not regenerated in round 2; docs/reviews content not reviewed.

## R2

Not performed. Only one independent agent review ran; no second reviewer is claimed.

## CI and integration

Hosted CI: run 38978299161 passed on `8e564c8` (Repository verification, CI gate regression tests, required-ci; Cloudflare Pages preview deployed). The run for `bf1c96e` is linked from the PR once complete. Integration counter: the last combined audit (2026-10-15) covered PRs #22–#27. PRs #28–#36 have integrated since without a recorded combined audit; that audit is overdue and this PR does not perform it. No merge or deployment is authorized by this record.
