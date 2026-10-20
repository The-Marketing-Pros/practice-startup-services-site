# Optional PracticeElf handoff — review evidence, 2026-10-20

Owner direction: Andrew approved “Your plan is ready. Save it to your free PracticeElf workspace and start making progress,” then said “lets do it.” This implements that offer without new tracking or an agent. It preserves the comprehensive planner content and PDF/Excel downloads.

Base: `61d238a15b768c184561ae90209a6d85eac0b1ad`. Frozen implementation head: `60550d39f644e4837322e03aeae5e074bc721709`. SHA-256 of `git diff BASE HEAD`: `8e2840a0aca4823f4cb1f200a1b44b594a0d5d9162cc7681ec91a5ecc54263c5`.

| Channel / round | Reviewer / independence | Requested / actual model | Exact head / base | Verdict and limitations |
| --- | --- | --- | --- | --- |
| V1 | Codex implementer, not independent | Session default / unavailable | Head/base above | 163 planner tests, Astro check (0 errors, 0 warnings, 5 hints), build (74 pages), and eight Python CI-gate tests passed. Local browser transfer confirmed; production CTA disabled. |
| R1 round 1 | `/root/independent_review`, independent agent, no source edits | Inherited session default / unavailable | Head/base above | No PSS findings. Cross-repository verdict requested changes for two PracticeElf return/account-switch issues. Independently ran 163 PSS planner tests and checked model/export parity. |
| R1 round 2 | Same independent agent; re-review, not another reviewer | Inherited session default / unavailable | Same unchanged PSS head/base | Clear for scoped change after PracticeElf fixes at `2c6e2405f9618c9f7154c4c7768cbe23108c1f90` against `af519d587313229089c433dd74daadd11de85e6a`. Does not certify live auth, migration or deployment. |

The receiver review retained both rounds in its `docs/reviews/pss-launch-handoff-2026-10-20.md`. Round 1 PE head `84bf09fbb77e96b147fe84d98066f8a333457dd7` had a GET link to POST-only logout and a saved view preference preceding the free-workspace route. Round 2 fixes preserve draft UUID through POST logout/login and route free workspaces before legacy preferences. Native tenant/permission, retry, concurrency and populated migration replay checks passed independently.

## Behavior verified

- Handoff begins on the visitor's click. Current in-memory page values take priority over older saved values. A corrupt companion planner blocks transfer with recovery guidance instead of silently dropping content.
- Exact receiving origin, popup identity, nonce and receipt checks; timeout/popup-blocked errors keep the original work. No plan in a URL, cookie or analytics event. The one-time handoff includes full validated checklist and/or financial plan.
- Local browser: synthetic checklist and forecast arrived together; explicit signed-in destination/consent opened a populated PracticeElf workspace. Owner, notes and completion edits survived reload; a 120.49 forecast input also survived save/reload. Browser persistence used a local in-memory fixture; independent native PostgreSQL tests cover actual database semantics.
- The receiving workspace was inspected at 1440×1000 and 390×844, plus empty, read-only and load-error states. PDF and Excel downloads succeeded; all three forecast PDF pages were rendered and visually checked. Existing renderer/model files remain unchanged.
- The CTA appears after useful financial results. Local-only storage copy and privacy notice explain the optional transfer. No new tracking is introduced; existing site measurement is not represented as removed.

## Rollout and acceptance limits

The CTA renders in development or when `PUBLIC_PRACTICEELF_HANDOFF_ENABLED=true` at build time. It defaults OFF in production. Local destinations are fixed to localhost:5181; production uses `https://practiceelf.com/dashboard/launch-import`.

Release PracticeElf's additive migration and receiving workspace first, verify real sign-in/return with an approved test account, canonical origin/opener policy, save/reload, editing and exports. Then enable the PSS build flag. Rollback disables the flag first and preserves saved PracticeElf plans. This branch has not been merged or deployed. This record does not authorize a production migration.

The transfer is one-time, not ongoing synchronization. Pending drafts can resume on the same browser for one hour; another device cannot recover an unsaved draft. Existing owners explicitly choose a practice; no existing work is overwritten and no agent is activated.

## Combined-main audit disposition / The eleventh thing

The prior 2026-10-20 combined-main audit at this base recorded bounded planner/static-site acceptance, but broader research-launch acceptance remains incomplete. There are 19 integrations since accepted baseline `5166aa7957e341e619102a82aa074b0780f96393`; the counter is NOT reset. No new integration occurs from this draft. The next five-integration boundary begins only after an accepted combined snapshot is recorded. Keep this feature draft pending that gate and receiver acceptance.

Repeated-use risks covered in this feature: current versus stale local values, malformed companion data, repeated imports, lost acknowledgments, stale task/finance edits and migration replay. The PSS model/exports are preserved, while source/actor idempotency and native races are verified in PracticeElf. Cross-device resume and changed-source re-import are documented limitations, not silently destructive behaviors.

Outstanding broader audit gaps: native research delivery/recovery, live provider delivery, actual advertising attribution and comprehensive combined-main browser/accessibility acceptance. These are not newly reproduced handoff defects. Responsible role remains the repository maintainer/release owner. This bounded handoff review does not certify the unrelated research pipeline or reset its audit.

The commit adding this record is evidence-only and is outside the reviewed implementation SHA. Hosted CI links are added to the PR validation section after push. Agent review is not a GitHub approval.
