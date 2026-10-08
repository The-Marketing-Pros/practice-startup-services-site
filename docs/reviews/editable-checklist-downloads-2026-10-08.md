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
