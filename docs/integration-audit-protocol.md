# Five-PR integration audit

Start the adoption counter at the recorded main baseline in `repository-governance.md`; no retrospective acceptance is implied. Count the next five PRs whose changes actually reach main, including this rollout if it merges. Include PRs already open when adoption began if they integrate later. Record exact PR IDs, destinations and merge SHAs, not a numerical PR-number range. After each audit reset the counter from its accepted snapshot.

The audit is an opening gate before the next feature batch, not permission to merge or deploy.

1. Freeze exact main SHA and prior accepted baseline. Verify each PR's final head, final diff and source presence. Use ancestry for merge commits and inspect resulting source/patches for squash merges. Account for prerequisites and stacked PRs; record missing integration explicitly.
2. Run relevant combined checks from the developer handoff. Add populated schema upgrade/rollback compatibility, permissions/tenant isolation, native concurrency, retry/partial failure and nonempty backup/restore when affected. Inspect changed UI states. Separate local, CI, synthetic fixtures, staging and production evidence; do not run against customer backends.
3. Apply **The eleventh thing**: what plausible failure after repeated use was missed? Name trigger and consequence, then establish whether code handles it. Use applicable rows below; omit irrelevant risks. Hypotheses without a concrete connection are not blockers.
4. Obtain independent review of cross-PR interactions on the frozen candidate within current provider/source authorization. Individual receipts remain preserved and do not establish combined-main acceptance. Record each actual model/subagent separately.
5. Fix supported blockers, rerun affected checks, preserve every review round and obtain final review where implementation changed. A changed main requires assessing intervening changes before transferring acceptance.

## Audit record template

- Date, exact audited main SHA, prior baseline:
- Five PR IDs, final heads, destinations, merge commits and source-presence evidence:
- Combined commands, environments, outcomes and CI links:
- Independent review channels, exact snapshots, verdicts, findings/dispositions, sanitized evidence and limitations:

### The eleventh thing

| Concrete repeated-use trigger | Consequence | Code/test/observed evidence | Disposition: handled / confirmed defect / evidence gap |
| --- | --- | --- | --- |
| Describe an applicable risk; this blank template is not an audit | | | |

Consider corrected historical data and reporting periods; duplicate/retried commands; migration replay and old consumers; revoked access and membership in multiple tenants; connector expiry/pagination/backfill; overlapping jobs, backlog and partial recovery; and AI instructions in imported content, stale evaluations or unbounded tool use when affected.

- Confirmed defects, fixes and fresh review links:
- Remaining evidence gaps and responsible owner:
- Gate outcome (accepted / incomplete / blocked) and reasons:
- Next boundary: next five integrated PRs after the accepted SHA:
