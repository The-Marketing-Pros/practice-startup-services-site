# Placeholders to swap before launch

Temporary values wired into the site so previews work. Each must be replaced
with the real value before (or at) launch. Replace, then delete the row.

No outstanding booking placeholder. On 2026-10-15, `src/config/site.ts` was updated to the official PPS scheduling page at `https://physicianpracticespecialists.com/schedule-meeting/`. The consulting page uses its verified `?category=startup` selection.

## Notes

- The booking URL lives in **exactly one place** (`src/config/site.ts`). Change
  it there and every "Book your free consultation" button across the site updates.
  Do not hardcode the URL anywhere else.
- **Not a placeholder:** the credibility section (`src/components/Credibility.astro`)
  and the "Who's behind this" copy in `src/pages/about.astro` use the operator-
  confirmed fact that the team at **Physician Practice Specialists** has started
  **7,000+ independent practices nationwide.** This content is REAL — leave it.
- No companion stats were placeholdered. The section leads with the single real
  7,000+ figure by design; no fabricated "all 50 states" / specialty-count numbers
  were added.
