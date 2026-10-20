# Launch plan value improvements

Date: 2026-10-20 (America/Los_Angeles).

Implementation head: `08120edb4f8e3b14650b3efdc8ab06efdfe6b67d`.
Base: `c96f4c7965d0a8797832a639566b79b48f6d8fac`.
Reviewed diff SHA-256: `853b3d755cd12db617a2cddcb254890e343005899db6e0ca669311e0a99e3ad8`.

## Scope and authorization

The owner asked to keep improving the site and provide status, after choosing a value-first direction with no new visitor tracking. This branch adds grouped navigation, Start here and My launch plan, practical instructions for 18 checklist tasks, suggested next actions, minimum cash reserve and break-even explanations, and clearer PDF/Excel exports. Tools and downloads remain ungated. Existing marketing integrations are unchanged.

No merge, production deployment, spending, or access changes were performed. This is a first implementation batch. The launch home reads existing separate browser-saved plans; it does not yet provide a unified editable profile, cloud persistence, Welaka integration, PracticeElf integration, or an agent. The forecast remains a 24-month cash model with constant staffing and costs; it is not a full accrual financial statement model.

## V1 — implementer verification

Reviewer: primary Codex agent, implementer, not independent. Requested model: inherited; actual model identifier unavailable.

At the implementation head above:

- `npm ci --no-audit --no-fund`: successful.
- `npm run test:planners`: 160 passed, zero failed.
- `npm run check`: zero errors, zero warnings, five existing hints.
- `npm run build`: successful, 74 pages.
- `python3 -m unittest discover -s .github/scripts -p 'test_*.py' -v`: eight passed.
- `git diff --check`: passed.
- Local browser: Start here empty and saved states; checklist name save, expanded instructions, completion and next-action updates; My launch plan showing the saved checklist and completion count.
- Local financial browser: adding a $25,000 reserve changed the extra funding requirement from $67,990 to $92,990 while the lowest cash balance stayed -$67,990.
- Local navigation inspected at desktop width and 390px mobile width; dropdown/menu expansion and Escape dismissal checked. Viewport override restored.
- Exported sample PDFs rendered with Poppler and visually inspected. Checklist task groups were kept together after a page-break issue was found; final sample checklist is 11 pages. Finance sample is five pages with a decision summary and cash chart.
- Workbook serialization/reopening, new cached financial results and formulas, and guide columns covered by automated tests. Older backups without reserve load with zero reserve.

Limitations: no native Excel recalculation, screen-reader session, production browser test, or independent usability study. Browser checks used synthetic sample data on localhost. Existing third-party destinations and live form submissions were not exercised.

## R1 — independent agent review

Reviewer: `/root/independent_review`, separately assigned agent; no implementation edits.
Requested model: inherited configuration; actual model identifier unavailable.
Exact head and base: those recorded above.

Verdict: no supported actionable findings.

Scope: navigation and local launch-home rendering, escaping and storage error handling, checklist dependency ordering, backwards-compatible reserve defaults, cash-gap and break-even formulas, Excel formula references/cached results, and PDF layout construction.

Independent checks:

- `npm run test:planners`: 160 passed, zero failed.
- `git diff --check <base>..<head>`: passed.
- Diff digest independently matches the SHA-256 above.

Limitations: source review and local automated tests only. No independent browser/mobile inspection, PDF visual inspection, native Excel recalculation, hosted CI, or production validation. This receipt is an agent review, not a GitHub approval. Later source changes require review of the new snapshot.

## Evidence-only follow-up and integration

The commit adding this record contains documentation only and is not covered by the source-review SHA. Its diff was separately inspected by the implementer. Hosted CI links belong in the draft PR once available.

This branch has not been integrated into main and adds zero to the integration counter. Reconcile the repository's current batch and five-integration audit boundary at any later authorized merge; historical governance baseline counts are not asserted as current.

## PDF finishing pass — current implementation

The owner requested finished PDF formatting before merging. Current source head:
`f9a1c5ee16daf7c3a4979b17faacf7ca2037380e`, with the same base
`c96f4c7965d0a8797832a639566b79b48f6d8fac`. Earlier receipts above are historical.
Full diff SHA-256: `9377ca5f552bc04452c7a0ae0f762b0880e177c67ddbc7245e4ba46e306f448b`.

Changes: opt-in compact spacing without reducing body type, nine-point financial table text,
larger chart labels, aligned numeric columns, a checklist phase summary and continuation labels,
short optional help links, paired financial assumptions, a payer table, and model notes kept
with the monthly forecast. Spreadsheet generation is unchanged.

V1 verification at this head: 160 planner tests and eight gate tests passed; Astro check
reported zero errors, zero warnings and five existing hints; production build produced
74 pages. Every page of the final standard sample PDFs was rendered with Poppler and visually
inspected at 1100px: checklist nine pages (previously 11), financial report three (previously five).
No clipped text, overlapping elements, isolated source-link page, or split normal task group
was observed. Sample page counts are not limits on user-created documents.

Additional samples: preset-derived forecast, long-name/high-value/zero-visit forecast, and
checklist with long owner name, substantial notes and a custom task. Automated text-bound
checks on all pages of these five sample documents found no text outside the page margins;
representative stress-case pages were visually inspected. Exact $120.49 and $0.49 inputs
were also verified in generated PDF text in assumptions, payer rates, and explanatory copy.
This is layout QA on synthetic plans, not a usability study or native Excel recalculation.

### R1 round 2 — historical, changes requested

Same independently assigned reviewer `/root/independent_review`, inherited model configuration;
actual model identifier unavailable. Reviewed head
`7e75ecae62b2c6bd60f7eb7498b5bc06362a305f` against the base above on 2026-10-20.
Full diff SHA-256: `ee36eaaf7a9aa07e863a8a96f60e03c4bd2cf0c9972f9f63d3a94fb7958d0b8e`.

Finding: P2, new financial assumptions table rounded fractional dollar inputs to whole dollars.
Disposition: fixed in `f9a1c5e`; input precision is preserved in assumptions, payer rates, and
the payer explanation. Aggregate forecast displays remain whole-dollar estimates.
Independent verification: 160 tests and diff whitespace checks passed. Sampled financial
and checklist renderings showed no clipping or overlap. No source edits or GitHub approval.

### R1 round 3 — current, resolved

Same reviewer, third review round; not an additional independent reviewer. Inherited model
configuration; actual model identifier unavailable. Reviewed
`f9a1c5ee16daf7c3a4979b17faacf7ca2037380e` against the base above on 2026-10-20.
Diff digest matches the current implementation digest recorded above.

Verdict: P2 resolved; no remaining supported findings. Independently confirmed that both
fractional-input PDFs contain the exact $120.49 or $0.49 three times on page two, reran
all 160 planner tests successfully, and passed `git diff --check`.
Limits: follow-up source, PDF text and automated tests; earlier sampled visual review remains
applicable. No new full visual sweep, browser/mobile, native Excel, hosted CI or production
validation by the reviewer. This is agent review evidence, not a GitHub approval.

The follow-up commit recording this section is evidence-only, inspected separately by the
implementer; it does not change the source snapshot reviewed above. Current hosted-check
links and statuses are recorded in PR #44. No merge or production deployment was performed.
