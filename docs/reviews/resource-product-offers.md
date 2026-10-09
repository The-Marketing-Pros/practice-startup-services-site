# Resource product offers — review evidence

Date: 2026-10-08 (America/Los_Angeles).
Base: `ff1812eda7cad09f2c425cc935eedb39544f81fe`.
Frozen implementation head: `604e15f69e452ce02cfb1103ae95c10a89255b63`.
Implementation diff SHA-256: `a90172f3050c2e67a249eb77039848c906547f93cbd4bc6e796cce69d937473d`.

## Scope and authorization

The owner requested clearer LaborGenie claim language, up to 10 users, regular $9.99/user/month pricing, and Practice Elf cards on the resource and Medicare sites. Prior explicit authorization covers publication. The requested $999 value remains pending clarification of the offer duration; this implementation invents neither a term nor a dollar value. The Medicare card is in its separate repository/PR and is outside these reviews.

## V1 — implementer, Codex /root

Requested model: inherited; actual reported identifier unavailable. Verdict: pass for this scope. Inspected all changes; `npm ci`, `npm run check` (0 errors), production build (66 pages), all 15 planner tests, and all 8 engineering-gate regression tests passed. Desktop browser check and a 390px iframe check (375px content width) confirmed readable resource cards and no horizontal overflow. Registration form loaded with email/practice fields and optional unchecked marketing consent. No form submission, email, or license provisioning performed. Existing dependency audit findings were not changed.

## R1 — independent agent Codex /root/startup_r1

Requested model: inherited; actual identifier unavailable. Exact head/base and diff digest above. Verdict: pass, no supported findings. Reviewed all 11 changed files, confirmed offer wording and destinations, manual fulfillment and optional marketing consent, unchanged HubSpot submission/privacy and planner persistence. Verified Practice Elf against its current public product pages. Independent workbook check confirmed all three LaborGenie rows have seat limit, regular price, claim label and correct hyperlink. PDF shares support data. Limitations: no browser rendering, PDF inspection, form submission, fulfillment, or full suite rerun.

## R2 — independent agent Codex /root/startup_r2

Requested model: inherited; actual identifier unavailable. Exact head/base and diff digest above. Verdict: pass, no supported findings. Inspected all changed source and export consumers. Independently serialized/reopened XLSX and confirmed all three LaborGenie rows, links and unchanged plan. Checked semantic card markup, 44px link target and calculated text/focus contrast. Verified current Practice Elf positioning. Limitations: no browser/viewport changes, PDF visual inspection, submission or full suite rerun. Price and seat count rely on owner-confirmed terms.

## Evidence-only follow-up

This record is added after frozen implementation review. Inspect its diff separately; the reviews do not claim to cover a later commit. CI is linked in the PR body once available. HubSpot editor wording, if published separately, is external configuration and must be verified from the live form.

Integration batch: PR #22 is 1/5 since the accepted combined audit at `5166aa7957e341e619102a82aa074b0780f96393`. This PR becomes 2/5 only after main ancestry is verified. Next combined audit is due after 5/5.
