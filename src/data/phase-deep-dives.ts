// Phase deep-dive content — long-form editorial that earns the search traffic
// and the trust. Lives separately from phases.ts to keep that file lean.
// Render with PhaseDeepDive.astro on each /journey/[slug] page.

import type { PhaseId } from "./phases";

export interface DeepDiveSection {
  heading: string;
  body: string; // markdown-light: paragraphs separated by blank lines
  pullQuote?: string; // optional editorial pull quote to break visual rhythm
  numericCallout?: { label: string; value: string; sub?: string }; // optional inline stat
}

export interface PhaseDeepDive {
  intro: string;
  sections: DeepDiveSection[];
  faq?: Array<{ q: string; a: string }>;
}

export const deepDives: Partial<Record<PhaseId, PhaseDeepDive>> = {
  "01": {
    intro:
      "Phase 01 is the decision before the decision. Long before you sign a lease, choose an EHR, or pick a payer mix, you have to decide whether private practice is right for you at all, and if it is, what model you actually want to run. This is the work most physicians skip — and it's the work that prevents the most expensive mistakes later.",
    sections: [
      {
        heading: "The three questions that actually matter.",
        body:
          "One: do I want to run a business, or do I just want to see patients with more autonomy? These are not the same thing. Private practice is a small business; running one consumes time, attention, and energy that won't go into clinical work. Some physicians thrive on this. Others find out 18 months in that they wanted the autonomy without the operational burden — by which point they're committed.\n\nTwo: what model fits my life and my finances? Solo fee-for-service, group practice, direct primary care, concierge, hybrid — each has different startup costs, different revenue models, different patient counts, and different lifestyle implications. None is universally better.\n\nThree: do I have the runway? Six to twelve months of personal expenses in cash, plus startup capital, plus working capital reserve. If the answer is no, the right move is usually 'stay employed longer and save,' not 'launch under-capitalized.'",
      },
      {
        heading: "Practice models, briefly.",
        body:
          "Solo fee-for-service: the traditional model. Bills insurance, sees patients in volume, requires careful payer mix planning. Highest revenue ceiling for most specialties, highest operational burden.\n\nGroup practice: multiple providers share infrastructure. Lower per-provider operational burden, more complex partnership dynamics, often easier credentialing economics.\n\nDirect primary care (DPC): patients pay a monthly membership fee directly to the practice. No insurance billing for primary care visits. Lower patient volumes, predictable revenue, growing rapidly. Works best for primary care and a few specialties.\n\nConcierge: hybrid that combines insurance billing with a separate retainer fee. Common in primary care and some specialties.\n\nCash-pay specialty: select services billed cash, no insurance involvement. Common for plastic surgery, derm, some psychiatry, integrative medicine.\n\nThere are good reasons to pick each. There is no universal right answer.",
      },
      {
        heading: "Signals that you're ready.",
        body:
          "You can articulate the business model in two sentences. You have six to twelve months of personal financial runway. You have at least a rough pro forma. You've talked to at least two physicians who have launched in your specialty in the last three to five years and listened to what they got wrong. Your spouse or partner is informed and on board. You've consulted a healthcare attorney about your current employment contract (non-competes, patient solicitation, intellectual property).",
      },
      {
        heading: "Signals that you're not ready yet.",
        body:
          "You're certain that 'it will work' without having modeled it. Your runway is less than six months and you haven't accounted for credentialing lag. You haven't read your current employer's non-compete and patient solicitation clauses. You're framing the decision around frustration with your current job rather than enthusiasm for a specific business you want to build. None of these mean 'don't do it.' They mean 'do more Phase 01 work first.'",
      },
    ],
    faq: [
      {
        q: "Should I quit my job before I start planning?",
        a:
          "No. Almost everything in Phase 01 and Phase 02 can and should happen while you're still employed. Quitting before you have an entity, a financial plan, and at least the early credentialing work in motion costs you months of preparation time and significant income.",
      },
      {
        q: "How long does Phase 01 take?",
        a:
          "It varies. Some physicians take six months of thinking before a 30-day decision. Others have been thinking for years and need 30 days of structured planning to convert thinking into action. The work is not measured in time — it is measured in whether the questions above are honestly answered.",
      },
      {
        q: "What if my non-compete is restrictive?",
        a:
          "Most non-competes in healthcare are negotiable, enforceable in only narrow ways, or limited by state law (some states have effectively banned non-competes for physicians). Read it with a healthcare attorney in your state before you give notice. This is one of the most common Phase 01 mistakes.",
      },
      {
        q: "Is DPC right for me?",
        a:
          "DPC works very well for some physicians and specialties and very poorly for others. It is best suited for primary care, certain low-volume specialties, and physicians who are comfortable building a member base over 12 to 24 months. It is less suited for high-acuity specialties or physicians who need traditional insurance economics.",
      },
    ],
  },
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
        heading: "",
        body: "",
        pullQuote:
          "There is no centralized credentialing in the United States. Every payer runs its own clock, and the clocks don't sync.",
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
        numericCallout: { label: "Start prep at", value: "T−180", sub: "days before target open date" },
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
  "06": {
    intro:
      "Phase 06 is where a quiet practice fills up or stays quiet. Most new practices over-spend on the wrong marketing because they treat patient acquisition as a single problem. It is not. It is at least four problems — a website that ranks, a local presence that's searchable, referral relationships that send patients, and an insurance directory presence that does — and each one has different economics.",
    sections: [
      {
        heading: "A website that actually works.",
        body:
          "For most new practices the website is the first impression and the first conversion. Both have to work.\n\nWorks for impression means the site looks like the practice you want to be — not a Wix template, not a generic medical theme. Works for conversion means a clear path from 'I have a problem' to 'I booked an appointment' in three clicks or fewer. Most medical practice websites take seven.\n\nThe technical baseline: under 2-second load on mobile, accessible (real WCAG AA), structured data for medical practice, Google Business Profile linked, real reviews on the home page (not a slider of fake ones), insurance plans accepted listed prominently, and a scheduling path that does not require a phone call as the only option.",
      },
      {
        heading: "Local SEO is not optional.",
        body:
          "Most practice visits start with 'doctor near me' or 'specialty near me' or '[insurance plan] doctor [city]'. If your Google Business Profile is unclaimed, your hours are wrong, or your address geocodes to the wrong block, you lose patients before they ever see your website.\n\nThe local SEO baseline: Google Business Profile fully claimed and complete; Bing Places set up; NAP (name, address, phone) consistent across the top 30 directories; review acquisition program from day one; and locally relevant content (we treat X in Y city) on the site itself.\n\nThis is not glamorous work. It is also one of the highest-ROI things a new practice can do, because the cost is mostly time and the upside compounds for years.",
      },
      {
        heading: "Referral relationships matter more than ads.",
        body:
          "For specialty practices especially, referral relationships will out-perform paid advertising for the first two years. PCPs send their patients to specialists they know and trust. The work is showing up: in-person introductions, easy referral pathways, clear communication back to the referring provider, and reliability.\n\nA new specialty practice that builds three solid PCP relationships in its first 90 days will outperform one that spends $5,000 a month on Google Ads with no referral strategy.",
      },
      {
        heading: "Insurance directory listings (the boring lever).",
        body:
          "Every commercial payer maintains a 'find a doctor' directory. Most patients use these. Most new practices have incorrect, outdated, or missing entries in them for the first six months.\n\nThe playbook: as soon as each credentialing effective date lands, verify your directory listing for that payer. Check name, address, phone, accepting new patients status, specialty taxonomy, and the photo (if your photo is wrong or missing, fix it). Repeat quarterly for the first year.\n\nThis is the lowest-glamour, highest-leverage marketing work a new practice can do. It costs nothing and it directly determines whether patients with that payer can find you.",
      },
      {
        heading: "When paid advertising makes sense.",
        body:
          "Not at launch. Paid ads before in-network confirmation is one of the most common ways to burn cash early. The lifecycle is: confirm credentialing effective dates → build organic local foundation → generate first 50 to 100 patients through organic + referrals + directories → then layer paid acquisition for the specific service lines that warrant it.\n\nFor most primary care and specialty practices, paid advertising is a Phase 07 (Grow) lever, not a Phase 06 (Launch) lever. The exception is cash-pay or concierge models where the economics are different from day one.",
      },
      {
        heading: "What to do in the first 90 days post-launch.",
        body:
          "Week 1-2: Google Business Profile verified and fully complete; directory listings audited and fixed; review acquisition workflow live (ask every patient).\n\nWeek 3-6: First 30 reviews collected; at least three referral relationships established with regular communication cadence; insurance directory listings re-verified for each payer effective date.\n\nWeek 7-12: Local SEO content live on the site (locally relevant pages, FAQ, your specialty's most-searched questions); track which channels are sending patients; measure cost per patient by channel before scaling anything.",
      },
    ],
    faq: [
      {
        q: "Should I hire an agency for marketing?",
        a:
          "For most new practices, the answer at launch is 'partly.' Local SEO and website are high-leverage and worth professional help. Paid advertising is usually a year-two decision, not a launch decision. Hiring an agency to run all of it at launch usually burns money on the wrong levers.",
      },
      {
        q: "How long until my website starts ranking?",
        a:
          "For local 'near me' queries, well-built medical practice websites can rank within 60-90 days with active local SEO. National or condition-specific queries take 6-12 months. Both are normal. Plan around them.",
      },
      {
        q: "Do I need a blog?",
        a:
          "Useful, not required. The reason to publish content is to rank for the actual questions your potential patients ask. If you can publish two or three deeply useful articles a month, do it. If you can't, focus on the local SEO baseline and skip the blog — a half-published blog hurts more than no blog.",
      },
      {
        q: "What does a real medical practice website cost?",
        a:
          "For a custom, well-designed practice website with real local SEO setup, expect $8,000 to $25,000 for the project depending on scope, plus an ongoing content + SEO program if you want continued ranking growth. Sub-$5,000 'custom' websites usually mean templates with light editing — fine for some practices, limiting for others.",
      },
    ],
  },
  "03": {
    intro:
      "Phase 03 is the legal and structural foundation under everything you'll build. Entity formation, tax election, partner agreements, contracts, licenses. Most physicians outsource this work — and they should. But you still have to make the decisions, because the wrong structure is expensive to unwind once you've started operating.",
    sections: [
      {
        heading: "Entity types, briefly.",
        body:
          "In most states, physician practices form as Professional Corporations (PC) or Professional Limited Liability Companies (PLLC). The choice depends on your state's rules, your tax election, and your partner structure.\n\nPC: traditional choice. Strong liability protection. Default C-corp taxation unless you elect S-corp.\n\nPLLC: newer option, available in most states. Same liability protection as PC, more flexible tax options, simpler ongoing compliance.\n\nLLC (non-professional): not allowed for licensed professional services in most states. Verify your state's rules — forming the wrong entity type can invalidate your liability protection.",
      },
      {
        heading: "Tax elections matter more than the entity letter.",
        body:
          "For most physician practices, S-corp election is the right tax move — it minimizes self-employment tax on reasonable owner compensation while still allowing pass-through taxation. The savings are substantial enough that the S-corp election is usually worth the additional compliance.\n\nC-corp election is rarer but can work for practices planning to reinvest heavily, with multiple owner-employees, or pursuing specific benefit structures. Talk to a CPA who works with physician practices — generic small-business tax advice often misses healthcare-specific options.",
      },
      {
        heading: "Partnership terms before partnership.",
        body:
          "If you're forming with one or more partners, the partnership agreement is the single most important legal document you'll sign. It defines ownership, decision-making, capital calls, profit distribution, what happens when a partner wants to leave, what happens when a partner dies or is disabled, and what happens when partners disagree.\n\nMost partnership disputes that end practices could have been prevented by an honest conversation captured in writing before anyone needed it. Hire a healthcare attorney. Spend the money. Have the hard conversations now.",
      },
      {
        heading: "Licenses, registrations, and insurance.",
        body:
          "State business license, federal EIN, state tax registrations, DEA registration update for the new entity, CLIA waiver if you're doing in-office labs, OSHA compliance program, HIPAA risk analysis, malpractice insurance, workers comp, general liability, cyber insurance — most of this is mechanical, none of it is optional.\n\nMake the checklist with your attorney and your CPA, then work through it. Most of these items take days to weeks, not months. The mistake is treating them as urgent only when something goes wrong.",
      },
    ],
  },
  "05": {
    intro:
      "Phase 05 is where you choose the systems your practice actually runs on. EHR, practice management, billing, clearinghouse, telephony, scheduling, intake, HIPAA program, staffing model. Get the decisions right and the practice runs quietly. Get them wrong and you'll spend the first two years fighting your own infrastructure.",
    sections: [
      {
        heading: "Design the workflow first. Pick the EHR second.",
        body:
          "The most common Phase 05 mistake is picking an EHR because everyone else uses it, then bending the practice's workflow around the EHR's defaults. The right sequence is the inverse: design how patients move through your practice (intake, check-in, exam, billing, follow-up), then pick the EHR that serves that workflow.\n\nFor most specialties, two or three EHRs are well-suited and the rest are wrong. Specialty fit matters more than brand. Test-drive the EHR with realistic data and a sample patient workflow before you sign a multi-year contract.",
      },
      {
        heading: "The stack you actually need.",
        body:
          "EHR (clinical), practice management (administrative), clearinghouse (claims), telephony (patient communication), scheduling (booking + reminders), intake (forms), and a payment processor. Some EHRs bundle three or four of these; some specialize.\n\nWatch for hidden integration costs. A bundled solution that 'almost' fits is often more expensive over five years than a best-of-breed approach that integrates cleanly. The hard part is knowing which is which — talk to practices already running the stack you're considering.",
      },
      {
        heading: "HIPAA is a program, not a project.",
        body:
          "HIPAA compliance is not a one-time setup. It's a documented risk analysis, a set of policies and procedures, Business Associate Agreements with every vendor that touches PHI, regular staff training, and incident response readiness.\n\nMost new practices set up just enough HIPAA to feel safe and discover the gaps when something happens — a lost laptop, a phishing email, a misdirected fax. Do the work upfront. The cost of doing it right is small. The cost of doing it wrong is enormous.",
      },
      {
        heading: "Staffing model and timing.",
        body:
          "Most new practices over-hire too early or under-hire too long. The honest staffing model: one front-desk per provider FTE for most specialties, plus billing (in-house or outsourced) and clinical support as your specialty requires.\n\nHire the first front-desk 30 to 45 days before launch so they have time to train on the systems before patients arrive. Hire clinical support based on the actual patient volume you're seeing, not the volume you're hoping to see.",
      },
    ],
  },
  "07": {
    intro:
      "Phase 07 is the long tail — the work that turns 'open and billing' into 'profitable, sustainable, and growing.' The first 90 days post-launch show you where the leverage is. The next 12 to 24 months are about pulling those levers.",
    sections: [
      {
        heading: "Your denials are a map.",
        body:
          "In the first 90 days of billing, your denied claims show you exactly where your operations need work. Wrong codes. Missing documentation. Eligibility errors. Authorization gaps. Untimely filing. Each denial reason category points to a specific process to fix.\n\nRun a denial reason report monthly. Pick the top two or three categories and fix the root cause, not the individual claims. A single fixed process can eliminate dozens of future denials.",
      },
      {
        heading: "Payer contract review (yearly, minimum).",
        body:
          "Commercial payer contracts come up for renewal every one to three years. Many practices auto-renew without reviewing fee schedules or terms. This costs real money.\n\nOnce a year, pull every active payer contract. Compare current fee schedules to your case mix. Identify which payers are paying below your cost or below market. Negotiate, switch tiers, or in some cases drop the contract. This is one of the highest-ROI Phase 07 activities.",
      },
      {
        heading: "Service line expansion.",
        body:
          "The right time to add a service line is when your existing operations have capacity, your patient base is asking for it, and the economics make sense. The wrong time is when you're bored or feel competitive pressure.\n\nNew service lines often require separate credentialing (Phase 04 again), separate equipment, separate staff competencies, and separate marketing. Plan accordingly.",
      },
      {
        heading: "When to add providers.",
        body:
          "Add providers when your existing workflow can absorb them, your administrative infrastructure is ready, and your patient demand justifies it. Most practices that scramble after a hiring decision were trying to fix patient demand with capacity rather than the other way around.\n\nCredentialing takes 90 to 180 days for new providers too. Start it before the offer is signed, not after.",
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
