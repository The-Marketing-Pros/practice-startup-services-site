// PracticeStartupServices.com — 7-Phase Launch Journey
// The spine of the entire site. Every page, route, CTA hangs off this.
// See: personas/alf/campaigns/2026-Q2/practice-startup-services/02a-strategic-foundation.md
// See: 03b-recommended-direction.md §1 (Blueprint structure)

export type PhaseId = "01" | "02" | "03" | "04" | "05" | "06" | "07";

export interface Phase {
  id: PhaseId;
  slug: string;
  verb: string; // 1-2 word verb-name for navigation
  title: string;
  subtitle: string;
  question: string; // the buyer's real question at this phase
  decision: string; // the gating decision they must make
  buildStage: "foundation" | "structure" | "systems" | "launch" | "growth";
  controlRoom: boolean; // is this a Control Room moment? (only phase 04)
  duration: string; // honest timeline
  whatHappensFirst: string;
  whatCanHappenInParallel: string[];
  whatCommonlyDelays: string[];
  freeResource: {
    label: string;
    href: string;
  };
  consultationTrigger: string; // when to schedule a consult during this phase
}

export const phases: Phase[] = [
  {
    id: "01",
    slug: "is-this-right-for-me",
    verb: "Decide",
    title: "Is This Right for Me?",
    subtitle: "The decision before the decision.",
    question: "Should I leave employment and start my own practice?",
    decision: "Solo vs. group vs. concierge vs. DPC vs. stay employed.",
    buildStage: "foundation",
    controlRoom: false,
    duration: "2–6 months of thinking, 30 days of deciding",
    whatHappensFirst:
      "Get honest about your financial runway, your specialty's economics, and whether you want to run a business or just see patients.",
    whatCanHappenInParallel: [
      "Talk to 3 physicians who've launched in the last 3 years",
      "Run a back-of-envelope startup cost model",
      "Test your local payer mix",
    ],
    whatCommonlyDelays: [
      "Waiting for the 'right time' (there isn't one)",
      "Not running the numbers and getting scared by the unknown",
      "Trying to decide alone",
    ],
    freeResource: { label: "Practice Launch Checklist", href: "/resources/startup-checklist/" },
    consultationTrigger:
      "Schedule a consultation when you've decided you're serious — before you sign anything.",
  },
  {
    id: "02",
    slug: "business-planning",
    verb: "Plan",
    title: "Business Planning",
    subtitle: "The numbers that decide whether you launch or stall.",
    question: "Can the math work in my market for my specialty?",
    decision: "Service mix, payer mix, location, capital required, financing.",
    buildStage: "foundation",
    controlRoom: false,
    duration: "4–8 weeks",
    whatHappensFirst:
      "Build a 24-month pro forma that includes a realistic credentialing lag and a 6-month working-capital cushion.",
    whatCanHappenInParallel: [
      "Scout 2–3 location options",
      "Get pre-qualified for a practice loan or SBA-backed financing",
      "Identify your minimum viable EHR + billing approach",
    ],
    whatCommonlyDelays: [
      "Underestimating credentialing lag",
      "Picking a location before validating the payer mix",
      "Skipping the working-capital reserve and running out of cash month 4",
    ],
    freeResource: { label: "Startup Cost Guide", href: "/resources/startup-costs/" },
    consultationTrigger:
      "Before you sign a lease or take a loan, talk to someone who's seen the next 18 months play out a dozen times.",
  },
  {
    id: "03",
    slug: "legal-entity-setup",
    verb: "Form",
    title: "Legal & Entity Setup",
    subtitle: "The structure under everything you'll build.",
    question: "PC, LLC, S-corp, partnership — what's right and where?",
    decision: "Entity type, state of formation, tax election, founding agreements.",
    buildStage: "structure",
    controlRoom: false,
    duration: "2–4 weeks (parallel with planning)",
    whatHappensFirst:
      "Talk to a healthcare attorney in your state. Entity rules vary by state for physicians — wrong choice here is expensive to unwind.",
    whatCanHappenInParallel: [
      "EIN / state tax registration",
      "Open business banking",
      "Malpractice insurance quotes",
      "Begin credentialing prep work (CAQH, NPI verification)",
    ],
    whatCommonlyDelays: [
      "DIY entity formation without state-specific physician practice rules",
      "Mismatched partnership terms between founders",
      "Forgetting to renew local business licenses annually",
    ],
    freeResource: { label: "Practice Launch Checklist", href: "/resources/startup-checklist/" },
    consultationTrigger:
      "If you have a partner, multi-provider plan, or any state-specific question — schedule before you file.",
  },
  {
    id: "04",
    slug: "credentialing-enrollment",
    verb: "Credential",
    title: "Credentialing & Enrollment",
    subtitle: "The clock that decides when you actually get paid.",
    question: "How do I get in-network with payers without losing 6 months of revenue?",
    decision: "Which payers to pursue, in what order, with what timeline.",
    buildStage: "systems",
    controlRoom: true, // CONTROL ROOM MOMENT — credentialing clock visual lives here
    duration: "90–180 days (and this is the most expensive thing to get wrong)",
    whatHappensFirst:
      "Start credentialing 4–6 months before your target open date. Not 2 months. Not 90 days. Four to six months.",
    whatCanHappenInParallel: [
      "Medicare enrollment (855 forms)",
      "Medicaid enrollment (state-specific)",
      "Commercial payer applications (BCBS, UHC, Aetna, Cigna, etc.)",
      "Hospital privileges if needed",
    ],
    whatCommonlyDelays: [
      "Waiting until the lease is signed to start credentialing",
      "Sending incomplete applications and discovering the gap 60 days later",
      "Not following up with payers every 2 weeks",
      "Missing a state-specific Medicaid quirk",
    ],
    freeResource: { label: "Medicare Fee Schedule Lookup", href: "https://mymetolius.com/tools" },
    consultationTrigger:
      "Credentialing failure costs 90–180 days of revenue. If you've never done this before, schedule a consultation before you submit your first application.",
  },
  {
    id: "05",
    slug: "infrastructure-technology",
    verb: "Build",
    title: "Infrastructure & Technology",
    subtitle: "The systems that let your practice actually run.",
    question: "Which EHR, which billing system, which clearinghouse, which everything?",
    decision: "Tech stack, workflow design, staffing model.",
    buildStage: "systems",
    controlRoom: false,
    duration: "60–120 days",
    whatHappensFirst:
      "Design your patient workflow first. Then pick the EHR that serves your workflow — not the other way around.",
    whatCanHappenInParallel: [
      "Telephony + scheduling system",
      "Practice management / billing system",
      "Clearinghouse setup",
      "HIPAA compliance program (policies, BAAs, training)",
      "Staffing plan + hiring",
      "Office build-out / furniture / signage",
    ],
    whatCommonlyDelays: [
      "Picking the EHR everyone else uses without checking specialty fit",
      "Underspending on training and overspending on features",
      "Ignoring HIPAA until something happens",
    ],
    freeResource: { label: "Practice Launch Checklist", href: "/resources/startup-checklist/" },
    consultationTrigger:
      "Before you sign a 3-year EHR contract or hire your first 3 staff members.",
  },
  {
    id: "06",
    slug: "launch-marketing",
    verb: "Launch",
    title: "Launch & Marketing",
    subtitle: "Getting your first 100 patients without burning your runway.",
    question: "How do I fill the schedule without overspending on marketing I don't need yet?",
    decision: "Website, local SEO, referral relationships, patient acquisition mix.",
    buildStage: "launch",
    controlRoom: false,
    duration: "Starts 60 days before open, continues forever",
    whatHappensFirst:
      "A website that works on day one and a Google Business Profile that's claimed and complete. Most new practices launch with a Wix page that hurts them.",
    whatCanHappenInParallel: [
      "Build referral relationships with PCPs / specialists",
      "Local SEO (citations, reviews, content)",
      "Insurance directory listings",
      "Soft-launch event or open house",
    ],
    whatCommonlyDelays: [
      "Spending on paid ads before in-network credentialing is confirmed",
      "Generic vendor website that doesn't rank or convert",
      "Forgetting to ask your first 50 patients for reviews",
    ],
    freeResource: { label: "Practice Launch Checklist", href: "/resources/startup-checklist/" },
    consultationTrigger:
      "If you need a real medical practice website + local SEO program, we build them.",
  },
  {
    id: "07",
    slug: "grow-optimize",
    verb: "Grow",
    title: "Grow & Optimize",
    subtitle: "From 'open and billing' to 'profitable and sustainable.'",
    question: "Now that I'm open, where's the leverage?",
    decision: "RCM optimization, service line expansion, hiring, scaling, exit strategy.",
    buildStage: "growth",
    controlRoom: false,
    duration: "Months 6+ forever",
    whatHappensFirst:
      "Look at your first 90 days of denials. The pattern in your denial codes is the single highest-leverage thing to fix.",
    whatCanHappenInParallel: [
      "Quarterly payer fee negotiation",
      "Service line additions (ancillary revenue)",
      "Adding providers (NP/PA, partner physicians)",
      "Quality program participation (MIPS, value-based care)",
      "Patient experience instrumentation",
    ],
    whatCommonlyDelays: [
      "Letting denials pile up without root-cause analysis",
      "Hiring before the workflow can absorb new providers",
      "Ignoring payer contract renewals",
    ],
    freeResource: { label: "Medicare Revalidation Lookup", href: "https://mymetolius.com/tools" },
    consultationTrigger:
      "When you're stable but ready to grow — our RCM program is built for this phase.",
  },
];

export const phaseBySlug = Object.fromEntries(phases.map((p) => [p.slug, p]));
export const phaseById = Object.fromEntries(phases.map((p) => [p.id, p]));
