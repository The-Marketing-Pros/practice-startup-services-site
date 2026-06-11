// Who We Help — provider-type / segment pages
import type { PhaseId } from "./phases";

export interface Segment {
  slug: string;
  name: string;
  shortLabel: string;
  headline: string;
  sub: string;
  whyThisIsDifferent: string;
  phasesOfFocus: PhaseId[];
  specificWatchouts: string[];
  preferredEntryPhase: PhaseId;
}

export const segments: Segment[] = [
  {
    slug: "physicians",
    name: "Physicians (MD/DO)",
    shortLabel: "Physicians",
    headline: "For physicians leaving employment to build something of their own.",
    sub: "You went to medical school, not business school. We help physicians launch — and stay launched — without the expensive mistakes that catch the first-time owner.",
    whyThisIsDifferent:
      "Physician practice launches have payer dynamics, credentialing windows, and entity-formation rules that no other healthcare service line shares. Hospital and group employment hides most of these realities from physicians until the day they want out.",
    phasesOfFocus: ["01", "02", "04", "07"],
    specificWatchouts: [
      "Non-compete and patient solicitation clauses from your current employer — read them with a healthcare attorney before you give notice",
      "Specialty-specific credentialing windows (anesthesia and pathology differ from primary care)",
      "Payer mix for your specialty in your geographic market — under-payer-mixed practices stall fast",
      "Hospital privilege requirements if you'll continue admitting",
    ],
    preferredEntryPhase: "01",
  },
  {
    slug: "nurse-practitioners",
    name: "Nurse Practitioners",
    shortLabel: "NPs",
    headline: "For NPs in scope-of-practice states ready to own their own practice.",
    sub: "NP independent practice authority is state-specific. We help NPs in full-practice-authority states build practices that match their scope — and partner with collaborating physicians in restricted states.",
    whyThisIsDifferent:
      "Scope of practice, collaborative practice agreements, and reimbursement rates for NPs vary wildly by state and payer. Many advisory firms apply physician-model assumptions that don't fit NP economics.",
    phasesOfFocus: ["01", "02", "04", "06"],
    specificWatchouts: [
      "Verify your state's scope of practice + supervision requirements before signing a lease",
      "Medicare reimburses NPs at 85% of physician rates — model this in your pro forma",
      "Collaborative practice agreements (in restricted/reduced states) add cost and complexity",
      "Some commercial payers have separate NP credentialing tracks with different timelines",
    ],
    preferredEntryPhase: "01",
  },
  {
    slug: "physician-assistants",
    name: "Physician Assistants",
    shortLabel: "PAs",
    headline: "For PAs structuring practices in increasingly autonomous models.",
    sub: "PA-led and PA-owned practices are growing fast in 2026. State rules continue to evolve. We help PAs structure practices that match current scope and adapt as rules change.",
    whyThisIsDifferent:
      "PA optimal team practice rules vary state-to-state. Reimbursement, supervision, and ownership structures have all moved in the last 24 months — a 2024 advisor's playbook is already outdated in many states.",
    phasesOfFocus: ["01", "03", "04", "06"],
    specificWatchouts: [
      "State-specific PA ownership rules (some states still restrict PA practice ownership)",
      "Supervising physician contracts — terms matter for liability, cost, and continuity",
      "Medicare reimbursement at 85% of physician rates (same as NPs)",
      "Updated scope-of-practice rules in your state — most updated 2023–2025",
    ],
    preferredEntryPhase: "01",
  },
  {
    slug: "behavioral-health",
    name: "Behavioral Health Providers",
    shortLabel: "Behavioral Health",
    headline: "For therapists, psychologists, and psychiatric providers building solo or group practices.",
    sub: "Behavioral health practices have simpler billing than most specialties but unique HIPAA, telehealth, and payer credentialing realities. We help BH providers launch with the right tech stack for their service model.",
    whyThisIsDifferent:
      "BH credentialing varies more by license type than any other specialty. Telehealth-first practices have a different EHR, billing, and compliance profile. Many physician-focused advisors miss BH-specific watchouts.",
    phasesOfFocus: ["03", "04", "05", "06"],
    specificWatchouts: [
      "Telehealth state-by-state licensing if you'll see clients across state lines",
      "HIPAA + 42 CFR Part 2 if you'll treat substance use disorder",
      "Out-of-network vs in-network strategy — the BH market actually has profitable OON paths",
      "BH-specific EHR (SimplePractice, TheraNest, etc.) vs. general practice EHR — different decision",
    ],
    preferredEntryPhase: "02",
  },
  {
    slug: "specialty",
    name: "Specialty Practices",
    shortLabel: "Specialty",
    headline: "For specialty practices — orthopedics, dermatology, psychiatry, cardiology, and more.",
    sub: "Specialty practices have payer dynamics, equipment investments, and credentialing windows that don't fit generic primary-care playbooks. We adapt the launch sequence to your specialty's actual realities.",
    whyThisIsDifferent:
      "Every specialty has its own credentialing quirks (anesthesia and pathology in particular), capital-equipment ratios, and ancillary revenue plays. Your launch budget and timeline depend on your specialty more than any other variable.",
    phasesOfFocus: ["02", "04", "05", "07"],
    specificWatchouts: [
      "Specialty-specific credentialing timelines (anesthesia and pathology run longer)",
      "Capital equipment financing — match terms to specialty payback timelines",
      "Ancillary revenue (imaging, in-office labs, PT) requires separate compliance and billing setup",
      "Payer specialty fee schedules vary widely — model the actual codes you'll bill",
    ],
    preferredEntryPhase: "02",
  },
];

export const segmentBySlug = Object.fromEntries(segments.map((s) => [s.slug, s]));
