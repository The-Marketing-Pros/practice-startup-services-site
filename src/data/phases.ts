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
    "id": "01",
    "slug": "is-this-right-for-me",
    "verb": "Decide",
    "title": "Is This Right for Me?",
    "subtitle": "Choose a practice model that fits your goals, patients, and working life.",
    "question": "What kind of practice do I want to build?",
    "decision": "Practice model, patient population, ownership goals, and personal constraints.",
    "buildStage": "foundation",
    "controlRoom": false,
    "duration": "Explore before making commitments.",
    "whatHappensFirst": "Write down the practice you want to open and the questions you still need to answer.",
    "whatCanHappenInParallel": [
      "Talk with owners in similar practice settings",
      "Explore local patient needs and referral relationships",
      "List personal and practice funding questions"
    ],
    "whatCommonlyDelays": [
      "Making commitments before testing assumptions",
      "Leaving ownership responsibilities undefined",
      "Treating a preferred model as a finished plan"
    ],
    "freeResource": {
      "label": "Practice Launch Checklist",
      "href": "/resources/startup-checklist/"
    },
    "consultationTrigger": "When you want to compare options and turn an idea into a practical next step."
  },
  {
    "id": "02",
    "slug": "business-planning",
    "verb": "Plan",
    "title": "Business Planning",
    "subtitle": "Connect the practice you want to build with the numbers it needs to work.",
    "question": "What assumptions does my launch plan depend on?",
    "decision": "Service mix, expected volume, expenses, collection timing, and funding needs.",
    "buildStage": "foundation",
    "controlRoom": false,
    "duration": "An ongoing plan, refined as quotes and decisions arrive.",
    "whatHappensFirst": "Create a first forecast using clearly labeled assumptions and separate opening costs from monthly expenses.",
    "whatCanHappenInParallel": [
      "Compare location and vendor quotes",
      "Explore staffing and clinical schedules",
      "Review funding questions with an accountant or financing adviser"
    ],
    "whatCommonlyDelays": [
      "Mixing charges with expected cash collections",
      "Omitting expenses that start before opening",
      "Using one forecast without checking slower-start scenarios"
    ],
    "freeResource": {
      "label": "Pro Forma Builder",
      "href": "/resources/pro-forma/"
    },
    "consultationTrigger": "Before making a major commitment, bring your assumptions and open questions for review."
  },
  {
    "id": "03",
    "slug": "legal-entity-setup",
    "verb": "Form",
    "title": "Legal & Entity Setup",
    "subtitle": "Coordinate the business details that your banking, contracts, and applications depend on.",
    "question": "Which professional advice and registrations do I need?",
    "decision": "Ownership structure, professional requirements, tax questions, and agreements.",
    "buildStage": "structure",
    "controlRoom": false,
    "duration": "Depends on your location, structure, and required reviews.",
    "whatHappensFirst": "Review your proposed ownership and practice model with qualified advisers familiar with healthcare in your state.",
    "whatCanHappenInParallel": [
      "Prepare questions for legal and tax advisers",
      "Collect the details needed for banking and insurance",
      "Identify which payer applications depend on finalized business information"
    ],
    "whatCommonlyDelays": [
      "Choosing a structure before reviewing professional ownership requirements",
      "Inconsistent names or addresses across records",
      "Signing agreements before understanding the obligations"
    ],
    "freeResource": {
      "label": "Practice Launch Checklist",
      "href": "/resources/startup-checklist/"
    },
    "consultationTrigger": "When you need to coordinate the setup work around advice from your attorney and accountant."
  },
  {
    "id": "04",
    "slug": "credentialing-enrollment",
    "verb": "Credential",
    "title": "Credentialing & Enrollment",
    "subtitle": "Prepare the information, track each payer, and follow through to a confirmed decision.",
    "question": "What does each payer need for this provider and practice?",
    "decision": "Payer priorities, required applications, document owners, and verified enrollment status.",
    "buildStage": "systems",
    "controlRoom": true,
    "duration": "Varies by payer, provider type, and application completeness.",
    "whatHappensFirst": "Identify the application path and current requirements with each payer, then build your document inventory and follow-up tracker.",
    "whatCanHappenInParallel": [
      "Confirm provider and organization details",
      "Prepare Medicare or state program enrollment where applicable",
      "Organize commercial payer requirements",
      "Track location and provider-association requirements"
    ],
    "whatCommonlyDelays": [
      "Missing documents or conflicting identifiers",
      "Unanswered requests for additional information",
      "Assuming submission means approval",
      "Treating all payers as one timeline"
    ],
    "freeResource": {
      "label": "Credentialing Preparation Article",
      "href": "/resources/articles/organize-credentialing-before-you-apply/"
    },
    "consultationTrigger": "When you want PPS to help prepare applications, organize follow-up, and keep status visible."
  },
  {
    "id": "05",
    "slug": "infrastructure-technology",
    "verb": "Build",
    "title": "Infrastructure & Technology",
    "subtitle": "Bring people, space, and systems together around the way your practice will work.",
    "question": "Can our team run the patient journey from start to finish?",
    "decision": "Workflow, software fit, staffing, training, and operational responsibilities.",
    "buildStage": "systems",
    "controlRoom": false,
    "duration": "Coordinate vendor lead times, setup, and team training.",
    "whatHappensFirst": "Map a patient visit from first inquiry through follow-up, then use that workflow to evaluate systems and staffing.",
    "whatCanHappenInParallel": [
      "Review EHR and billing workflows",
      "Set up scheduling, phone routing, and communications",
      "Plan onboarding and staff training",
      "Coordinate space, equipment, and technology setup"
    ],
    "whatCommonlyDelays": [
      "Buying systems before agreeing on the workflow",
      "Leaving data migration or integrations unassigned",
      "Skipping team training and end-to-end testing"
    ],
    "freeResource": {
      "label": "Practice Launch Checklist",
      "href": "/resources/startup-checklist/"
    },
    "consultationTrigger": "Before selecting systems or setting a go-live date, review how the pieces will work together."
  },
  {
    "id": "06",
    "slug": "launch-marketing",
    "verb": "Launch",
    "title": "Launch & Marketing",
    "subtitle": "Make it easy for patients to find you, understand your services, and take the next step.",
    "question": "Are our team and patient-facing information ready for opening?",
    "decision": "Opening readiness, referral outreach, website information, and scheduling capacity.",
    "buildStage": "launch",
    "controlRoom": false,
    "duration": "Prepare before opening and refine after launch.",
    "whatHappensFirst": "Confirm your service details, scheduling process, and team responsibilities, then test a complete patient inquiry.",
    "whatCanHappenInParallel": [
      "Prepare website and directory information",
      "Build referral relationships",
      "Rehearse front-desk and billing handoffs",
      "Create a first-week operating plan"
    ],
    "whatCommonlyDelays": [
      "Publishing unconfirmed insurance participation",
      "Promoting appointments before scheduling works",
      "Sending inquiries to channels nobody monitors"
    ],
    "freeResource": {
      "label": "Practice Launch Checklist",
      "href": "/resources/startup-checklist/"
    },
    "consultationTrigger": "When you want help connecting your website, outreach, and operations to a realistic opening plan."
  },
  {
    "id": "07",
    "slug": "grow-optimize",
    "verb": "Grow",
    "title": "Grow & Optimize",
    "subtitle": "Use what the practice is learning to improve operations and plan the next move.",
    "question": "What should we improve before adding more complexity?",
    "decision": "Operational priorities, patient access, collections, team capacity, and growth plans.",
    "buildStage": "growth",
    "controlRoom": false,
    "duration": "Start reviewing results after opening; keep a regular cadence.",
    "whatHappensFirst": "Compare actual activity and expenses with your plan, then choose a small number of issues to investigate.",
    "whatCanHappenInParallel": [
      "Review scheduling and patient feedback",
      "Investigate billing and denial patterns",
      "Update the financial forecast",
      "Track renewals, training, and enrollment maintenance"
    ],
    "whatCommonlyDelays": [
      "Changing several things without measuring the result",
      "Adding capacity before resolving workflow bottlenecks",
      "Letting recurring administrative tasks fall out of the plan"
    ],
    "freeResource": {
      "label": "Pro Forma Builder",
      "href": "/resources/pro-forma/"
    },
    "consultationTrigger": "When you want help reviewing operations, revenue cycle, or the next stage of growth."
  }
];

export const phaseBySlug = Object.fromEntries(phases.map((p) => [p.slug, p]));
export const phaseById = Object.fromEntries(phases.map((p) => [p.id, p]));
