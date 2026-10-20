# Combined-main audit: enabled PSS surface, 2026-10-20

Independent reviewer: `/root/independent_review`, agent, no source edits.
Requested model: inherited session default; actual model identifier unavailable.
This is a new bounded acceptance receipt; it preserves the earlier incomplete
research-activation audit and its restrictions.

Prior baseline: `5166aa7957e341e619102a82aa074b0780f96393`.
Audited main: `61d238a15b768c184561ae90209a6d85eac0b1ad`.
PR45 snapshot: `f40e5ca96e69e67794cbd12363124335d109925d`, implementation unchanged
from `60550d39f644e4837322e03aeae5e074bc721709`.

Verdict: accepted for the currently enabled website/planner/public-preview
surface. No supported handoff-blocking regression. Research report submission
remains disabled and is explicitly excluded from activation acceptance.

## Fresh independent evidence

- 163 planner/research tests and eight CI-gate tests passed.
- Astro check: zero errors/warnings, five hints. Production build: 74 pages;
  8,508 internal link paths without a missing target.
- Default production build contains no PracticeElf save CTA.
- Actual launch-home script: 100 storage/pageshow refreshes without duplicated
  controls or writes; progress updates, legacy reserve defaults and independent
  malformed-plan recovery remained correct. Handoff initializer was stubbed.
- Live browser: empty launch home and navigation expansion worked. Authorized
  synthetic preview for Family medicine / ZIP 10001 correctly showed missing
  Census demographics, NPPES registry truncation, dated FRED sources, 43
  contextual tasks and planner links retaining specialty and location.
- Availability response: report submission false, marketing submission false,
  public preview true. No report/contact/email submission was performed.

## The eleventh thing

| Repeated-use trigger | Evidence / disposition |
| --- | --- |
| Stale tabs and reset overwrite | Local concurrency tests pass. |
| Repeated launch-home refresh | Fresh actual-script probe passes 100 cycles. |
| Legacy or malformed backups | Migration/defaults and independent recovery pass. |
| Export or measurement failure | Combined tests preserve usable planner work. |
| Ambiguous research acknowledgment | Earlier duplicate defect fixed; retry tests pass. |
| Provider failure or truncated results | Live public preview explains partial results. |
| Handoff retry or stale save | Scoped PSS tests and PE native evidence; final hosted acceptance remains separate. |

Native D1 recovery/concurrency, paid provider delivery, retention scheduling and
other dormant research integration checks remain necessary before enabling
research submission. Census demographics were degraded in the observed active
preview. No fresh dependency installation, complete accessibility certification
or actual advertising attribution was performed. The reviewer did not separately
inspect hosted CI in this round.

## Boundary and evidence digest

Nineteen integrations since the prior baseline: #22, #23, #24, #25, #27, #28,
#29, #30, #31, #32, #33, #34, #35, #36, #37, #38, #41, #43, #44.
Record the accepted enabled-surface boundary at `61d238a`; subsequent integrations
count from there (0/5 at this receipt). PR45 is not integrated. This does not
waive the dormant research activation restrictions.

SHA-256 of binary diffs:

```text
5166aa7..61d238a
06546ef5c15af812c4bfa9ef9284a66f6944c2542b560e448ec981cfe0e348aa
61d238a..f40e5ca
a0ea50dea370620e4d26f4d0c18178075bd00d8ce429b9807a1b10ac7747dd90
```

This receipt's commit is evidence-only and outside the audited snapshots.
