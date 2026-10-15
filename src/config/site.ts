// Shared PPS scheduling destination for all consultation links.
// Keep booking URLs here so navigation, footer, and page CTAs stay in sync.

/** Official PPS consultation selector, verified against the live PPS site. */
export const CONSULT_BOOKING_URL =
  "https://physicianpracticespecialists.com/schedule-meeting/";

/** Open the same scheduler with startup consulting selected. */
export const STARTUP_CONSULT_BOOKING_URL = `${CONSULT_BOOKING_URL}?category=startup`;

export const CONSULT_CTA_LABEL = "Book your free consultation";
