# Editable checklist downloads — 2026-10-08

Base: `658cccd6128d09e8e6d315b07fb892f857033f1b`. Frozen source head: `ea9131a1d52556a175988be663f7304e318253b2`. Diff SHA-256: `ab99a296442725c679d621c31ad1d3fa096a0894767bb0c06b987f7fbe15c9d4`.

Andrew asked to continue the proposed Excel-first download improvement. Prior publication authorization persists. Change is limited to checklist export labels, prominence, descriptive help, and metadata; IDs and handlers are unchanged.

## V1

Codex /root, implementer, not independent; requested model inherited, actual unavailable. Date 2026-10-08. Pass: npm ci, Astro check (0 errors/warnings, five existing hints), 66-page build, 14 planner/export tests, eight gate tests, diff check. Desktop production-preview screenshot inspected. Browser Excel download succeeded with success status. ExcelJS opened the actual downloaded workbook: 41 rows, nine expected columns, unprotected. Changed status and owner in memory, serialized and reopened; values persisted. No workbook output replaced user files. Mobile viewport override did not apply in this session (remained 1280px); no new mobile-render claim. Physical Excel UI not tested.

## R1

Independent Codex /root/startup_r1; requested model inherited, actual unavailable; date 2026-10-08. Exact head/base/digest above. Pass, no findings. Reviewed one-file diff and export code: XLSX is editable, PDF static, descriptions valid, handlers preserved. Diff check passed. No source edits, browser, or test rerun.

## R2

Independent Codex /root/startup_r2; requested model inherited, actual unavailable; date 2026-10-08. Exact head/base/digest above. Pass, no findings. Independently inspected diff/export implementations and valid unique description target. Diff check passed. No edits, browser, or redundant build/test rerun.

## Integration

Evidence-only follow-up must be inspected separately. Hosted CI run links recorded in PR after dispatch: https://github.com/The-Marketing-Pros/practice-startup-services-site/actions/workflows/engineering-protocol.yml . All checks must pass before normal merge. Existing integrations #5, #16, #19, #20 are 4/5; this integration triggers combined-main audit before next feature batch.

## Expanded verification — cross-tab save protection

Candidate source: `ea4e9b4bbfb73898ce6c91d8c61decf2d884c593`, same base. Full PR diff including the historical evidence record SHA-256: `2ae5a23e9d98227e8775e5626b6096adb549c1c31cab24d86837c561fe2bd319`.

The combined audit independently found P2 silent data loss when two already-open planner tabs save different work. Added saved-snapshot comparison inside an origin Web Lock for both planners. A conflict preserves the newer stored plan and the stale tab's in-memory work; the save-status warning explains backup/reload. Browsers without Web Locks use the existing explicit backup fallback instead of an unsafe write. Schemas/keys and export content are unchanged.

V1: final Astro check and 66-page build passed; 15 planner/export/storage tests passed, including independent module instances sharing a serialized lock, simultaneous writes, stale reset, reload recovery, storage clearing, captured queued values, and unsupported locks. Earlier eight gate tests remain applicable (gate code unchanged). Browser: two localhost tabs loaded the same plan; A completed task 1 and saved, stale B completed task 2 and received conflict warning. Reloading A retained task 1 and did not include B's task 2. B's downloaded backup JSON retained task 2. This is actual browser UI evidence in addition to synthetic tests. Profile fill/select automation did not produce save events; direct checkbox input did. No production customer state changed.

Final receipts follow. Final combined-main anchor is recorded at publication. Earlier one-file passes remain historical and do not cover the save-protection source.

R1 final: independent `/root/startup_r1`, inherited model / actual unavailable, 2026-10-08. Pass on ea4e9b4 vs 658cccd (full SHAs above); full PR digest independently verified. Reviewed persistence fix and historical diff; ran 15 tests. Also independently ran 30 populated checklist filter/restore/export cycles and 30 finance assumption/restore/export cycles. No edits, independent browser, native Web Locks, PDF render, Excel recalculation, fresh full build, or deployment.

R2 final: independent `/root/startup_r2`, inherited model / actual unavailable, 2026-10-08. Pass on ea4e9b4 combined candidate vs adoption baseline `c13072b7dcd42e88e8be775cf11b171db7ee9889`. Combined diff digest `eeb24ba28fe03e9486210f619a4b9cb972aa5e9e70a1efb9845d237077a48dd2`. Independently confirmed conflict protection, per-context warnings, backup retention and reload/reapply in two synthetic contexts. Fifteen planner tests and eight gate tests passed. Helper fixtures also cover export error/retry, cancelled/malformed/retried imports, quota failure, registration timeout/late recovery/host isolation. No edits, independent native browser, actual registration/license delivery, PDF render, Excel recalculation or production deployment. Combined-main acceptance awaits merge/source comparison.
