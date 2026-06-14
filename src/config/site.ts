// PracticeStartupServices.com — site config (single source of truth for
// outbound, swap-at-launch URLs). Keep operator-replaceable values HERE so a
// link change is one edit, never a find-and-replace across components.

/**
 * Primary conversion target: "Book your free consultation".
 *
 * TEMP VALUE — reuses the existing repo scheduler link so the button works in
 * preview/staging. The real CRM meeting link replaces this string.
 *
 * TODO(operator): replace with the CRM meeting link.
 * Tracked as item #1 in /PLACEHOLDERS-TO-SWAP.md.
 */
export const CONSULT_BOOKING_URL =
  "https://prompt-platform-bay.vercel.app/book/meet-metolius";

/** Action-led label for the primary CTA, used wherever the booking button renders. */
export const CONSULT_CTA_LABEL = "Book your free consultation";
