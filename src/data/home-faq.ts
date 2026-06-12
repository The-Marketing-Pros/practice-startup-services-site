// Homepage FAQ — answer-first blocks targeting the head queries an AI Overview
// or answer engine will ask. Every answer is sourced from facts already
// published elsewhere on this site (phases.ts, startup-costs, who-we-help).
// INTEGRITY RULE: no invented statistics, no client names, no regulatory
// specifics beyond what the phase guides already state. Legal/tax answers stay
// jurisdiction-general and point to professional advice.
//
// Rendered by HomeFaq.astro; FAQPage JSON-LD is built from this same array in
// src/pages/index.astro so the markup and the schema can never drift apart.

export interface FaqItem {
  q: string;
  a: string; // direct 1–3 sentence answer, plain text (used verbatim in JSON-LD)
  href?: string; // deep link to the page that elaborates
  hrefLabel?: string;
}

export const homeFaq: FaqItem[] = [
  {
    q: "How much does it cost to start a medical practice?",
    a: "Plan for $50k–$250k+ in capital expenses (build-out, equipment, deposits), $5k–$50k in one-time professional fees, and $15k–$40k per month of pre-revenue operating costs — plus a working-capital reserve of at least six months. Specialty, market, and ambition move every one of those ranges.",
    href: "/resources/startup-costs/",
    hrefLabel: "See the full startup cost guide",
  },
  {
    q: "How long does it take to open a private medical practice?",
    a: "Most physicians should plan on roughly 6–12 months from committed decision to seeing patients. Credentialing alone runs 90–180 days and should start 4–6 months before your target open date; business planning (4–8 weeks), entity setup (2–4 weeks), and infrastructure build-out (60–120 days) overlap around that clock.",
    href: "/journey/",
    hrefLabel: "See the 7-phase launch journey",
  },
  {
    q: "Do I need to start credentialing before opening?",
    a: "Yes. Start payer credentialing 4–6 months before your target open date — not 90 days before. Enrollment runs 90–180 days, and a practice that opens before it's in-network gives up that revenue window. It's the single most expensive thing to get wrong at launch.",
    href: "/journey/credentialing-enrollment/",
    hrefLabel: "Read the Phase 4 credentialing guide",
  },
  {
    q: "What is the first step to starting a medical practice?",
    a: "The decision before the decision: get honest about whether you want to run a business or just see patients with more autonomy, then pick your model (solo, group, DPC, concierge, cash-pay). After that, build a 24-month pro forma that includes a realistic credentialing lag and a six-month working-capital cushion.",
    href: "/journey/is-this-right-for-me/",
    hrefLabel: "Start with Phase 1",
  },
  {
    q: "How long does medical credentialing take?",
    a: "90–180 days for most payers. Medicare enrollment, state Medicaid, and commercial payer applications can run in parallel — and following up with each payer every two weeks is what keeps the clock from silently stalling.",
    href: "/journey/credentialing-enrollment/",
    hrefLabel: "See the credentialing timeline",
  },
  {
    q: "Should I form an LLC or a PC for my medical practice?",
    a: "It depends on your state. Many states restrict which entity types physicians can use — a professional entity (PC or PLLC) is often required instead of a standard LLC — and the tax election matters as much as the entity type. Entity rules vary by state for physicians, so talk to a healthcare attorney in your state before you file.",
    href: "/journey/legal-entity-setup/",
    hrefLabel: "Read the Phase 3 entity guide",
  },
  {
    q: "How much working capital does a new practice need?",
    a: "Six months of operating expenses, minimum. Even after you open, insurance payments arrive 30–60 days after you bill — and credentialing delays can stretch that gap by another 60–120 days. Most practices reach break-even in months 7–12, not months 3–4.",
    href: "/resources/startup-costs/",
    hrefLabel: "See the working-capital math",
  },
  {
    q: "Do you work with nurse practitioners and physician assistants?",
    a: "Yes. We work with physicians (MD/DO), nurse practitioners, physician assistants, behavioral health providers, and specialty practices. NP independent-practice authority is state-specific — in restricted states we help structure the required collaborating-physician arrangements.",
    href: "/who-we-help/",
    hrefLabel: "See who we help",
  },
];
