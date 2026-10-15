# Combined-main audit, 2026-10-15

Frozen main: `a844de36042e0958ccd43ef000ca7a3488e7a919`.
Prior accepted baseline: `5166aa7957e341e619102a82aa074b0780f96393`.
Cumulative binary diff SHA-256: `64e9a7f97b66ae5aaf41f92637a2fc1f1336034ccef08f222140fe5c1fee59ea`.

Independent reviewer: Codex subagent `/root/integration_audit`. Requested model inherited; actual model identifier unavailable. Read-only audit; no live customer provider calls or production mutations.

| PR | Final head | Main integration | Source-presence evidence |
| --- | --- | --- | --- |
| #22 | f1ec46720fcaff614ed8fc4f571ae46ee449bcce | ff1812eda7cad09f2c425cc935eedb39544f81fe | Head ancestor of frozen main |
| #23 | d34762858c4b612fdbdb4ac627ffd2f69690ff1a | 7123dfc5d80359d6f7966d26c23a5589a367bb4f | Head ancestor of frozen main |
| #24 | a7b5f9a011aca97769c2a26b0259babe3c4608c8 | 4445b3388d58c4787d97b1baf5fb565b894f8075 | Final-head and squash trees identical |
| #25 | 0992a066d2d1de267036977cca51f22ad9455f80 | 860e08d585d564b8cdb65b71a93a8fc970734751 | Final-head and squash trees identical |
| #27 | ff966dd6be0a9d5d6b41af572dcf61df0ed80fc3 | a844de36042e0958ccd43ef000ca7a3488e7a919 | Final-head and squash trees identical |

GitHub metadata and first-parent history confirm exactly these five integrations into main after the baseline.

## Verification

Fresh isolated checkout: npm ci, Astro check (110 files, zero errors/warnings, four existing hints), TypeScript check, production build (71 pages), 107 planner/research tests, eight Python gate tests, cumulative whitespace check. 6,421 generated internal links had no missing paths. Populated SQLite 0001-to-0002 migration, replay, nonempty backup/restore, and additive search-table rollback preserved original records. Existing dependency vulnerabilities and build chunk warnings remain.

Parent independently observed successful main CI: https://github.com/The-Marketing-Pros/practice-startup-services-site/actions/runs/38809715716 . The independent reviewer did not establish new hosted-CI evidence.

## The eleventh thing

| Concrete repeated-use trigger | Evidence and disposition |
| --- | --- |
| Multiple tabs edit saved plans | Web Locks compare/write regression passes locally. |
| Repeated personalization or older/populated backup imports | Legacy parsing, preserved task progress, populated round trips and workbook reconciliation tests pass. |
| Research replay, concurrency, provider/database failure | Existing tests pass with SQLite and synthetic providers; remote D1 concurrency unverified. |
| Search quota exhaustion, missing migration, unavailable provider | Tests preserve usable reports and fail search closed. |
| Unsupported claims or markup in AI/search content | Guard tests pass; facts use validated source items; search excerpts stay out of AI prompt. |
| HubSpot accepts a submission but acknowledgment is lost, then visitor retries | Confirmed research defect: pending status permits a second submission. Synthetic probe reproduced 502 then 200 with two accepted submissions for one request ID. |

The retry defect is in `src/lib/research/handler.ts` near lines 299–300 and 493–506. Before research activation, reconcile ambiguous submissions or explicitly adopt at-least-once behavior with downstream deduplication. This contradicts an unconditional once-per-request-ID guarantee. Probe digest: `292388f31172fea0c3d14c9b2de11b6777523b3d1940b2a0346ea1d4d47a48be`; local evidence retained outside Git. No live HubSpot call was made.

## Outcome and limits

No additional blocker found for the bounded static consulting-page repair. Full combined-main/research-launch acceptance is **incomplete**. This receipt does not reset the five-PR boundary as fully accepted. Carry the research retry defect and launch evidence gaps forward before the next feature batch. Responsible owner: research implementation maintainer / Andrew for activation decisions.

Remaining gaps: native D1 concurrency/recovery, live Turnstile/HubSpot/OpenAI/Brave integration, Census configuration, research retention scheduling, and fresh combined browser/accessibility review. Prior individual browser receipts do not substitute for a combined browser audit. The consulting repair does not alter or activate research.
