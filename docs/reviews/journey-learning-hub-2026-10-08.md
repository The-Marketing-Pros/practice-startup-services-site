# Journey and learning hub — review evidence

Date: 2026-10-08 (America/Los_Angeles).
Base: `7123dfc5d80359d6f7966d26c23a5589a367bb4f`.
Final frozen implementation head: `e9df3d2a533aa143bd104ff6ded40177a5aad4cd`.
Final implementation diff SHA-256: `eb421ef7c8a14f29251f238c24801dcb1e2f548e24dac0a6b9821d8af3d00e86`.

## Scope and authorization

Andrew requested a design/content refresh of the journey page, identification of similarly stale pages, articles and a home for future videos. Earlier explicit authorization covers publishing finished website updates. Scope: launch roadmap and seven phase guides; three original articles and reading template; honest video-library empty state and future metadata; startup cost and Medicare resource pages; discovery/navigation; one shared credentialing-service summary; documented content audit. Planner, submission, scheduling and license-fulfillment logic are unchanged.

## V1 — implementer, Codex /root

Requested model inherited; actual reported identifier unavailable. Verdict: pass on final scope. Initial local npm ci, Astro check (0 errors/0 warnings/4 existing hints), build (70 pages), 15 planner tests and 8 engineering-gate tests passed. Check/build reran successfully after the final two-file prose correction. Static internal-link/anchor and single-H1 check passed on 16 affected learning/resource pages. An earlier broad pass encountered seven existing checklist anchors that are created by its script; those are not new broken links.

Browser: desktop roadmap, guide navigation and native FAQ, article index/detail, cost guide, Medicare resources and video empty state inspected. Narrow iframe checks at 320px and 390px found no horizontal overflow (305px and 375px document widths). Both longest phase headings fit 269px content columns at 320px. A 320px sandbox without scripts confirmed native menu and FAQ interactions. Browser screenshots retained locally; production verification follows merge. Local browser console inspection reported no errors on the inspected Medicare page. This is not a full accessibility audit or every-page browser pass.

## R1 — independent agent Codex /root/startup_r1

Requested model inherited; actual identifier unavailable. Round 1 reviewed head `fd0e4ef5ace55d9f36ad252bffea920622c90b2b` against the base above; diff SHA-256 `c3fd12089100ce61ce9cb6060f296bd229a04e2905e308b4521a3275c08190e8`. Verdict: request changes for one P2 finding. Budget article/cost-guide copy implied changing the opening date models delay costs. Independent January-to-July reproduction showed only labels changed, not cash results.

Round 2 reviewed final head/base/digest above. Verdict: pass; no unresolved findings. The correction explicitly states opening date labels the months and users must update pre-opening costs/affected assumptions to model a later launch. Verified source and generated pages. Independently ran check (0 errors), 15 planner and 8 gate tests; initial build70 passed. Final generated-output scan checked 7,215 links across 70 pages, with no missing destinations, unexpected missing anchors, duplicate IDs or incorrect H1 counts. Seven script-created checklist anchors were explicitly excluded. Reviewed all changed templates/data and shared consumers.

Limitations: no independent browser/print inspection, production deployment, live form submission, external-source revalidation or published-video playback. Prose correction received source/output review, not a full-suite rerun.

## R2 — independent agent Codex /root/startup_r2

Requested model inherited; actual identifier unavailable. Final head/base/digest above. Verdict: pass; no actionable findings remain. Reviewed the full 24-file implementation and subsequent two-file correction, confirming accurate opening-date limitations. Independently ran all 15 planner and 8 gate tests and diff whitespace validation. Inspected 70 final generated pages: no broken static internal routes, duplicate IDs, or missing primary headings/canonicals. Checked 15 learning pages, seven FAQ schemas against visible content, and three Article schemas against headline, author and canonical. Confirmed explicit video empty state and no invented VideoObject schema. Reviewed navigation, native FAQ controls, responsive CSS, escaped content and planner links. Seven existing script-generated checklist fragments and local-only QA harness were excluded.

Limitations: no independent browser, deployment or regulatory verification; used implementer-built output rather than rerunning install/check/build. Future populated-video rendering received source review only. No files edited.

## Evidence-only follow-up and integration

This record follows frozen implementation review. Its evidence-only diff is inspected separately; neither reviewer claims the later evidence commit was part of the implementation review. Hosted CI links will be added to the PR body. No live lead submission or appointment booking is part of verification; no recorded video is claimed. The future playback/transcript branch needs verification with actual recordings.

Integration batch: PRs #22 and #23 are 1/5 and 2/5 after accepted audit baseline `5166aa7957e341e619102a82aa074b0780f96393`. This PR becomes 3/5 only after main ancestry is verified. The next combined audit is due at 5/5. Remaining state/service/About/scan/audience content findings are recorded in `docs/learning-hub-audit-2026-10-08.md` and are not falsely marked updated by this release.
