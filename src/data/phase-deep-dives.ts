// Phase deep-dive content — long-form editorial that earns the search traffic
// and the trust. Lives separately from phases.ts to keep that file lean.
// Render with PhaseDeepDive.astro on each /journey/[slug] page.

import type { PhaseId } from "./phases";

export interface DeepDiveSection {
  heading: string;
  body: string; // markdown-light: paragraphs separated by blank lines
}

export interface PhaseDeepDive {
  intro: string;
  sections: DeepDiveSection[];
  faq?: Array<{ q: string; a: string }>;
}

export const deepDives: Partial<Record<PhaseId, PhaseDeepDive>> = {
  "04": {
    intro:
      "Credentialing is the single most expensive thing to get wrong at launch. The clock runs whether you're ready or not, and most physicians lose 90 to 180 days of revenue because they underestimated how long it actually takes — or assumed they could shortcut it. This is what credentialing really looks like in 2026, what the realistic timeline is, and where the traps hide.",
    sections: [
      {
        heading: "What credentialing actually is.",
        body:
          "Credentialing is the process payers use to verify that you are who you say you are: licensed, trained, board-certified (or in the process), insured, and clear of fraud history. It is separate from enrollment, but the two run together and the industry uses the words interchangeably.\n\nThe payer verifies your credentials. The payer then enrolls you in their network and assigns you an effective date. Before that effective date, you can see the payer's members — but you bill out-of-network, and most plans pay you very little (or nothing). After the effective date, you bill in-network at contracted rates.\n\nEvery payer does this independently. There is no centralized credentialing in the United States. The closest thing is CAQH — a free service most commercial payers use to pull your application data — but Medicare, Medicaid, and many regional plans still want their own forms.",
      },
      {
        heading: "The realistic timeline.",
        body:
          "Plan for 90 to 180 days from a complete application to an effective date. Some payers are faster. Some are slower. None are predictable enough to plan around their best case.\n\nMedicare runs 45 to 90 days from a clean CMS-855 submission. Medicaid varies wildly by state — 60 to 120 days is typical. Commercial payers (Blue Cross, UnitedHealth, Aetna, Cigna) run 90 to 180 days, and a few — Tricare, certain state Medicaid plans — can stretch beyond 180.\n\nThe biggest variable isn't the payer. It's whether your application is complete on first submission. Incomplete applications get queued behind complete ones, and a missing document can cost you 30 to 60 days that don't come back.",
      },
      {
        heading: "When to start.",
        body:
          "Start 180 days before your target open date. Not 90. Not 60. One hundred and eighty.\n\nThis seems aggressive. It is not. By T-180 you should have CAQH fully attested, your medical license verified in your state of practice, your NPI active for the correct entity, and your malpractice insurance confirmed. By T-150 your Medicare and Medicaid applications should be submitted. By T-120 your commercial applications should be submitted. By T-60 you should be following up with every payer biweekly to verify effective dates.\n\nIf you cannot start credentialing 180 days before launch — because you can't give notice yet, or you don't have a practice address, or your entity isn't formed — then your launch date has to move. Credentialing does not negotiate.",
      },
      {
        heading: "Who pays during the gap.",
        body:
          "You do. This is the part most pro formas underestimate.\n\nEven after you open, you'll bill insurance for 30 to 60 days before payments arrive. If your credentialing isn't complete on day one, you'll either see patients at lower out-of-network rates or push your open date back. Both options cost real money.\n\nThe practical answer is a working-capital reserve sized for the worst case: six months of full operating costs in addition to startup capital. Most practices reach break-even months 7 to 12, not months 3 to 4 — and the difference is almost always credentialing-related.",
      },
      {
        heading: "Common ways credentialing fails.",
        body:
          "Starting too late. Most physicians plan around the best-case payer timeline (90 days for commercial). When that timeline slips — and it always slips somewhere — they don't have margin.\n\nIncomplete CAQH. CAQH attestations have to be current. An expired attestation means payers can't pull your data, and your application stalls without you knowing.\n\nWrong entity on the application. Your enrollment is tied to the legal entity, not to you personally. If your practice's entity isn't formed before you start credentialing, you'll have to redo applications.\n\nNot following up. Most payers will not contact you when something is missing. They sit on it. You have to call every two weeks until you have an effective date in writing.\n\nMissing state-specific Medicaid quirks. Each state's Medicaid plan has its own forms, training requirements, and provider ID schemes. Generic guidance does not apply.",
      },
      {
        heading: "Doing it yourself vs. hiring a credentialing team.",
        body:
          "You can credential yourself. Plenty of physicians do. The cost is your time and the risk of a 30 to 60 day delay if you miss something.\n\nA professional credentialing team typically charges $200 to $500 per provider per payer, with discounts at volume. For a single physician launching with eight commercial payers plus Medicare and Medicaid, expect $2,000 to $5,000 in credentialing fees as part of your startup costs.\n\nThe break-even math: if a credentialing team can prevent even 30 days of revenue loss on a single payer, they pay for themselves. For a primary care practice billing $30,000 to $50,000 a month, that's the entire credentialing budget recovered in one prevented delay.\n\nWe run our own credentialing crew because it's the phase where the most expensive mistakes happen and we'd rather control the work than coordinate with another vendor on the most time-sensitive part of your launch.",
      },
      {
        heading: "What to do in the next 30 days.",
        body:
          "Verify your CAQH is current and fully attested. If you're more than 90 days past your last attestation, refresh it now.\n\nConfirm your NPI is active and tied to the entity you'll practice under. If you don't have an entity yet, that's Phase 03 — finish that first.\n\nMake a payer list. The top eight commercial payers in your geography by membership, plus Medicare, Medicaid, Tricare if applicable.\n\nDecide who's running credentialing — you or a team. If you, block 4 to 6 hours a week on your calendar for 18 weeks. If a team, get them engaged this month, not next month.",
      },
    ],
    faq: [
      {
        q: "Can I see patients before credentialing is complete?",
        a:
          "You can see anyone willing to pay cash or use out-of-network benefits. In-network billing requires an effective date in writing from each payer. Many practices open with cash-pay patients while credentialing finishes — but this is a thin runway, not a strategy.",
      },
      {
        q: "What's the difference between credentialing and enrollment?",
        a:
          "Credentialing verifies your qualifications. Enrollment adds you to a specific payer network with contracted rates and an effective date. The industry uses both terms interchangeably, but the work is two separate steps inside each payer's process.",
      },
      {
        q: "How does credentialing work for NPs and PAs?",
        a:
          "Same process, different timelines and reimbursement rates. Most commercial payers credential NPs and PAs through the same CAQH path as physicians. Medicare reimburses both at 85% of the physician fee schedule. State-by-state scope of practice and supervision requirements affect what services can be billed and how.",
      },
      {
        q: "Do I have to credential with every commercial payer?",
        a:
          "No. Pick the payers whose members are in your market. Eight to twelve is typical for a new practice. Some specialties strategically stay out-of-network with certain payers if their fee schedules don't support the work.",
      },
      {
        q: "What is CAQH and do I need it?",
        a:
          "CAQH (Council for Affordable Quality Healthcare) is a free online database most commercial payers use to pull your credentialing data. You complete the CAQH profile once and re-attest every 120 days. Without a current CAQH, commercial payer applications stall. You need it.",
      },
    ],
  },
  "02": {
    intro:
      "Phase 02 is where most practice launches succeed or fail before a single patient is seen. The numbers either work for your specialty in your market — or they don't, and most physicians don't run them honestly until they're already committed to the lease. This is what real planning looks like, what should be in your pro forma, and what to do when the math says wait.",
    sections: [
      {
        heading: "What an honest pro forma includes.",
        body:
          "Twenty-four months of monthly projections, not a single-year summary. Two distinct phases inside the model: pre-revenue (the 6 to 12 months you're spending without billing) and post-launch (where revenue ramps unevenly).\n\nRevenue assumptions: target patient volume by month, average revenue per visit by payer mix, and an explicit assumption about the credentialing lag (how many months until each payer pays you). Most pro formas assume payers pay on time. They don't.\n\nExpenses: rent, EHR and billing software, telephony, insurance, staff (start light — owner plus one front-desk for most specialties), supplies, marketing. Add 15% to whatever number you land on for surprises.",
      },
      {
        heading: "Specialty and market drive almost everything.",
        body:
          "Primary care in a saturated metro is a fundamentally different launch than specialty care in an underserved suburb. The cost structures, payer mix, patient volume curves, and competitive dynamics are not transferable.\n\nGet local data. Use the Medicare Physician Fee Schedule Lookup at mymetolius.com/tools to model the actual codes you'll bill in your locality. Talk to two or three practices already operating in your specialty in your market — they'll tell you things no consultant can.",
      },
      {
        heading: "Working capital is not optional.",
        body:
          "Six months of full operating costs, in cash, separate from startup capital. Most practices that fail in year one do so because they didn't reserve enough working capital for the credentialing lag plus normal A/R timing.\n\nIf you can't afford the reserve, the right answer is to launch later, launch leaner, or stay employed longer. Not launch under-capitalized.",
      },
      {
        heading: "Service mix and payer mix.",
        body:
          "Service mix is what you'll do clinically. Payer mix is who pays for it. Both have to be modeled separately. A specialty practice with 60% Medicare and 30% commercial has a completely different economics from a 40% Medicare, 50% commercial mix — even with the same procedure list.\n\nFor most specialties in 2026, commercial payer mix below 40% makes a solo independent practice difficult. There are exceptions (concierge, DPC, cash-pay), but they require different planning.",
      },
      {
        heading: "When the math says wait.",
        body:
          "Sometimes it does. The market is over-saturated. The payer mix doesn't support the model. The startup capital isn't there. The right answer is to adjust the plan: different location, different model (group instead of solo, DPC instead of fee-for-service), additional fundraising, or waiting six months and building a stronger foundation.\n\nA delayed launch is cheap. A failed launch is not.",
      },
    ],
  },
};

export function getDeepDive(id: PhaseId): PhaseDeepDive | null {
  return deepDives[id] ?? null;
}
