// PracticeStartupServices.com — Services framed as Build Crews
// 03b §1: "Services framed as build crews for specific phases, not generic service cards."

import type { PhaseId } from "./phases";

export interface Service {
  slug: string;
  name: string;
  crewLabel: string; // "Build crew for ..."
  scopeBadge: "end-to-end" | "single-phase" | "ongoing"; // visual differentiation between service types
  outcomeHeadline: string;
  outcomeSub: string;
  primaryPhase: PhaseId;
  secondaryPhases: PhaseId[];
  whatsIncluded: string[];
  pricingPlaceholder: string; // 03b Decision #4: placeholder "starting at"
  consultationHook: string;
}

export const services: Service[] = [
  {
    slug: "practice-startup-consulting",
    name: "Practice Startup Consulting",
    crewLabel: "Build crew for end-to-end practice launch",
    scopeBadge: "end-to-end",
    outcomeHeadline: "From decision to first patient — without the expensive mistakes.",
    outcomeSub:
      "End-to-end advisory through the full 7-phase launch. We've done this before. You'll get the order of operations right the first time.",
    primaryPhase: "02",
    secondaryPhases: ["01", "03", "05", "06"],
    whatsIncluded: [
      "Pro forma + working-capital model",
      "Entity + tax election guidance",
      "Vendor selection (EHR, billing, clearinghouse)",
      "Staffing plan + hiring support",
      "Workflow design + HIPAA program",
      "Direct line during the first 12 months post-launch",
    ],
    pricingPlaceholder: "Starting engagements from a defined scope. Most engagements are fixed-fee with milestone billing.",
    consultationHook: "Tell us where you are in the journey. We'll tell you what's next.",
  },
  {
    slug: "medical-credentialing",
    name: "Medical Credentialing",
    crewLabel: "Build crew for Phase 4",
    scopeBadge: "single-phase",
    outcomeHeadline: "In-network with the payers that matter — on the timeline you need.",
    outcomeSub:
      "Credentialing is the single most expensive thing to get wrong at launch. Our team manages the entire process so you don't lose 90–180 days of revenue.",
    primaryPhase: "04",
    secondaryPhases: ["07"],
    whatsIncluded: [
      "Medicare 855 enrollment (initial + revalidation)",
      "Medicaid enrollment (state-specific)",
      "Commercial payer credentialing (BCBS, UHC, Aetna, Cigna, regional plans)",
      "CAQH maintenance",
      "Hospital privileging support",
      "Payer follow-up every 2 weeks until effective",
    ],
    pricingPlaceholder: "Per-provider pricing with payer count tiers. Transparent quote in 24 hours.",
    consultationHook: "Tell us your target open date and your payer list. We'll show you the realistic timeline.",
  },
  {
    slug: "revenue-cycle-management",
    name: "Revenue Cycle Management",
    crewLabel: "Build crew for Phase 7",
    scopeBadge: "ongoing",
    outcomeHeadline: "Get paid faster, with fewer denials, and clear visibility into what's working.",
    outcomeSub:
      "Full-service billing from charge entry through collections. Built for new practices that need the operational lift and the strategic view.",
    primaryPhase: "07",
    secondaryPhases: ["05", "06"],
    whatsIncluded: [
      "Charge entry + claim submission",
      "Denial management + appeals",
      "Patient billing + collections",
      "Monthly performance reporting (denials, days in A/R, net collection rate)",
      "Payer contract review (annual)",
      "Quarterly strategic review",
    ],
    pricingPlaceholder: "Percentage of collections, transparent tier structure based on practice size and specialty.",
    consultationHook: "Tell us your specialty and patient volume. We'll quote a real number, not 'contact for quote.'",
  },
  {
    slug: "website-design",
    name: "Website Design for Medical Practices",
    crewLabel: "Build crew for Phase 6",
    scopeBadge: "single-phase",
    outcomeHeadline: "A website that ranks, converts, and doesn't look like every other doctor's website.",
    outcomeSub:
      "Custom medical practice websites built for SEO, accessibility, and patient acquisition. Not Wix. Not a template. Real design, real performance.",
    primaryPhase: "06",
    secondaryPhases: ["07"],
    whatsIncluded: [
      "Custom design + brand identity",
      "Modern, fast, accessible build (Astro / Next.js)",
      "Local SEO program (citations, schema, GMB)",
      "Patient intake + scheduling integration",
      "Annual content + performance program",
      "HIPAA-aware forms + analytics",
    ],
    pricingPlaceholder: "Project pricing with annual SEO+content retainer. Real numbers on the consultation call.",
    consultationHook: "Show us your current site (or lack of one). We'll show you what's possible.",
  },
  {
    slug: "technology-ai-implementation",
    name: "Technology + AI for Medical Practices",
    crewLabel: "Build crew for Phase 5 · technology stack + AI",
    scopeBadge: "single-phase",
    outcomeHeadline: "The right tech stack. The right AI. No long-term contract traps.",
    outcomeSub:
      "EHR, billing, telephony, patient experience, and AI productivity tools — selected, contracted, and implemented for your specialty. Decades of vendor relationships, focus on value not lock-in.",
    primaryPhase: "05",
    secondaryPhases: ["06", "07"],
    whatsIncluded: [
      "EHR + practice management evaluation and selection — specialty-fit over brand",
      "Telephony, scheduling, intake, payments — best-in-breed stack",
      "AI tool evaluation: ambient documentation, RCM/denial management, patient communication",
      "Contract review and exit-term negotiation — no multi-year exclusive traps",
      "BAA management and security governance for every vendor",
      "Implementation, integration testing, staff training",
      "HIPAA risk analysis + policy framework (including AI use)",
      "Patient experience design (scheduling, intake, billing transparency)",
      "Vendor pricing negotiation with our relationships",
    ],
    pricingPlaceholder:
      "Project pricing for selection + implementation. Optional ongoing technology management. We focus on value, not multi-year exclusive contracts that lock you in.",
    consultationHook:
      "Tell us your specialty and target open date. We'll surface the 2 or 3 stack options that fit your practice, the AI tools that will earn their place on day one, and a realistic implementation timeline.",
  },
  {
    slug: "practice-infrastructure",
    name: "Practice Infrastructure Support",
    crewLabel: "Build crew for Phase 5",
    scopeBadge: "single-phase",
    outcomeHeadline: "EHR, HIPAA, staffing, telephony — the operational systems, set up right.",
    outcomeSub:
      "The unglamorous pieces that determine whether your practice runs. We help you pick the right systems, configure them, and train your team.",
    primaryPhase: "05",
    secondaryPhases: ["06", "07"],
    whatsIncluded: [
      "EHR selection + implementation",
      "Clearinghouse + practice management",
      "HIPAA compliance program (policies, BAAs, risk analysis, training)",
      "Telephony + patient communication setup",
      "Staff training + workflow documentation",
      "Vendor management ongoing",
    ],
    pricingPlaceholder: "Project + implementation pricing. Optional ongoing support retainer.",
    consultationHook: "Tell us your specialty and target staff size. We'll scope a real plan.",
  },
];

export const serviceBySlug = Object.fromEntries(services.map((s) => [s.slug, s]));
