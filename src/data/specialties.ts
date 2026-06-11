// Specialty-specific practice launch guidance.
// Phase 0-2 SEO baseline prioritized: orthopedics, dermatology, psychiatry, behavioral health, primary care.
// Plus three high-value adjacents: cardiology, OB/GYN, family medicine.

import type { PhaseId } from "./phases";

export interface Specialty {
  slug: string;
  name: string;
  shortLabel: string;
  headline: string;
  sub: string;
  whatChanges: string; // 2-3 sentence summary of what's different about this specialty
  phaseHighlights: Partial<Record<PhaseId, string>>; // phase-specific notes
  capitalRange: string; // typical startup capital range
  payerMixNote: string; // commercial vs. Medicare vs. Medicaid vs. cash dynamics
  watchouts: string[]; // 3-5 specialty-specific watchouts
  ancillaryRevenue: string | null; // common ancillary revenue plays for this specialty
}

export const specialties: Specialty[] = [
  {
    slug: "primary-care",
    name: "Primary Care",
    shortLabel: "Primary Care",
    headline: "For primary care physicians launching independent practices.",
    sub: "Family medicine, internal medicine, and general primary care launches — solo, group, DPC, or hybrid.",
    whatChanges:
      "Primary care economics depend on volume more than any other specialty. Payer mix, panel size, and operational efficiency drive whether the math works. The model choice (fee-for-service vs. DPC vs. concierge vs. hybrid) is one of the biggest Phase 01 decisions in this specialty.",
    phaseHighlights: {
      "01":
        "Model choice matters most here. DPC, concierge, and traditional FFS have fundamentally different economics. Pick deliberately.",
      "02":
        "Build the pro forma around realistic panel size for your model. FFS primary care typically needs 1,500–2,500 active patients per physician to be sustainable.",
      "04":
        "Commercial credentialing typically with 8–12 payers for FFS. DPC practices skip most of this entirely.",
      "06":
        "Local SEO is critical for FFS primary care — most patients find PCPs via 'doctor near me' searches.",
    },
    capitalRange: "$80,000–$250,000 for a solo FFS launch; $40,000–$120,000 for solo DPC",
    payerMixNote:
      "Traditional FFS primary care typically runs 35–50% Medicare, 30–45% commercial, 5–20% Medicaid. DPC bypasses payers entirely for primary care visits.",
    watchouts: [
      "Underestimating panel ramp time — first 12 months are usually slower than projected",
      "Underbuilding the operational base (front desk, billing) for FFS volume",
      "DPC practices that over-spend on EHR features they don't need",
      "Hiring before the patient volume justifies it",
    ],
    ancillaryRevenue:
      "In-office labs, point-of-care testing, ancillary chronic care management programs, wellness/aesthetic services in select markets.",
  },
  {
    slug: "orthopedics",
    name: "Orthopedics",
    shortLabel: "Ortho",
    headline: "For orthopedic surgeons launching independent or group practices.",
    sub: "Orthopedic practice launches — solo, group, and integrated ortho/PT models.",
    whatChanges:
      "Orthopedic launches have higher capital requirements than most specialties due to imaging and procedure equipment. Payer mix and surgical reimbursement dynamics drive economics. Hospital privilege coordination is non-optional.",
    phaseHighlights: {
      "02":
        "Capital planning for imaging (X-ray minimum; MRI if you're building ancillary revenue) and procedure equipment changes the pro forma materially.",
      "04":
        "Hospital privileging is a separate process from payer credentialing and starts later but must be done. Workers compensation panel relationships matter especially.",
      "05":
        "EHR + PACS integration becomes important — pick systems that work together cleanly.",
      "07":
        "Ancillary revenue (in-office imaging, PT, DME, ASC ownership) is where orthopedic practices typically build their longer-term economics.",
    },
    capitalRange: "$250,000–$1,500,000+ depending on imaging strategy and equipment",
    payerMixNote:
      "Orthopedic practices typically run 35–55% commercial, 25–40% Medicare, 5–15% workers comp + auto liens. Cash-pay components grow in some markets.",
    watchouts: [
      "Underbudgeting for imaging equipment + PACS integration",
      "Workers compensation enrollment specifics vary by state and require separate panel relationships",
      "Hospital privilege timing affects when you can begin surgical practice",
      "DME (durable medical equipment) compliance adds another credentialing layer",
      "Ancillary services (PT, imaging) trigger separate billing and compliance frameworks",
    ],
    ancillaryRevenue:
      "In-office imaging (X-ray, MRI in larger practices), physical therapy, DME, ambulatory surgery center investments.",
  },
  {
    slug: "dermatology",
    name: "Dermatology",
    shortLabel: "Derm",
    headline: "For dermatologists launching independent or boutique practices.",
    sub: "Dermatology launches — medical, surgical, cosmetic, or mixed practice models.",
    whatChanges:
      "Dermatology economics depend heavily on the mix between insured medical care and cash-pay cosmetic services. Capital requirements are moderate, but procedure capacity and product inventory affect both startup costs and ongoing cash flow.",
    phaseHighlights: {
      "01":
        "Mixed (medical + cosmetic) vs. medical-only vs. cash-cosmetic-only is a strategic decision with different economics and credentialing implications.",
      "02":
        "Cosmetic-heavy practices have shorter ramp times because cash payment skips credentialing lag.",
      "04":
        "Medical dermatology credentialing follows the standard timeline; cash cosmetic services don't require it.",
      "05":
        "Procedure room design and laser/device strategy materially affect capital planning.",
    },
    capitalRange: "$150,000–$500,000 for medical-only; $250,000–$800,000+ with significant cosmetic capability",
    payerMixNote:
      "Medical derm typically 50–70% commercial, 20–30% Medicare. Cash cosmetic services bypass payers entirely.",
    watchouts: [
      "Underbudgeting for procedure rooms and device acquisition",
      "Product inventory management adds complexity most launch checklists miss",
      "Cosmetic marketing rules and FDA-regulated claims are stricter than general medical marketing",
      "Mohs vs. general medical dermatology have different credentialing and reimbursement profiles",
    ],
    ancillaryRevenue:
      "Cosmetic procedures (laser, injectables, body contouring), retail skincare lines, esthetician services, clinical trials.",
  },
  {
    slug: "psychiatry",
    name: "Psychiatry",
    shortLabel: "Psych",
    headline: "For psychiatrists launching independent practices.",
    sub: "Psychiatry launches — solo, group, telehealth-first, and integrated mental health models.",
    whatChanges:
      "Psychiatry has unusually high cash-pay viability and telehealth integration. Insurance reimbursement remains uneven across states and payers, leading many psychiatrists toward hybrid or out-of-network models.",
    phaseHighlights: {
      "01":
        "Insurance vs. cash-pay vs. hybrid model is one of the biggest Phase 01 decisions in psychiatry.",
      "04":
        "Insurance-based practices: standard credentialing. Cash-pay or telehealth-first: minimal credentialing, faster launch.",
      "05":
        "Telehealth-capable EHR + e-prescribing infrastructure are essential. State-by-state telehealth licensing matters if you'll see patients across state lines.",
      "06":
        "Referral relationships with PCPs and therapists drive most psychiatry practice growth.",
    },
    capitalRange: "$30,000–$150,000 for solo cash-pay or telehealth-first; $80,000–$250,000 for traditional insurance-based",
    payerMixNote:
      "Wide range. Insurance-based: 60–80% commercial, 10–25% Medicare, 5–15% Medicaid. Cash-pay: 80–100% cash. Hybrid models vary significantly.",
    watchouts: [
      "Multistate telehealth practice requires licenses in each state where patients are located",
      "Controlled substance prescribing requires DEA registration and state-specific protocols (especially buprenorphine and Schedule II)",
      "Psychiatry credentialing with some payers can extend beyond standard timelines",
      "42 CFR Part 2 if treating substance use disorders — separate compliance framework from HIPAA",
    ],
    ancillaryRevenue:
      "TMS (transcranial magnetic stimulation), ketamine-assisted treatment, group therapy programs, employer/EAP contracts.",
  },
  {
    slug: "behavioral-health",
    name: "Behavioral Health",
    shortLabel: "Behavioral Health",
    headline: "For licensed therapists, psychologists, and counselors launching independent practices.",
    sub: "Behavioral health practice launches — solo, group, and telehealth-first models for licensed mental health professionals.",
    whatChanges:
      "Behavioral health has unique economics: lower capital requirements than most medical specialties, but credentialing varies significantly by license type. Out-of-network practice is more viable here than in most fields.",
    phaseHighlights: {
      "01":
        "Insurance vs. out-of-network vs. mixed model is the central Phase 01 decision. OON works in many markets.",
      "04":
        "Credentialing varies by license type more than by specialty. LCSW, LMFT, LPC, and PsyD each have different commercial payer panels and timing.",
      "05":
        "BH-specific EHR (SimplePractice, TheraNest, etc.) typically out-performs general practice EHRs for BH workflows.",
      "06":
        "Therapist directories (Psychology Today, GoodTherapy, Zencare) drive significant patient acquisition.",
    },
    capitalRange: "$10,000–$50,000 for solo telehealth or shared-space launch; $30,000–$120,000 for dedicated office",
    payerMixNote:
      "Insurance-based: 60–80% commercial, 10–25% Medicare/Medicaid. OON: cash + superbills only. Mixed models vary.",
    watchouts: [
      "License-type-specific credentialing — generic therapist guidance often doesn't apply",
      "Multistate telehealth practice requires verifying licensure portability and state-by-state rules",
      "EAP and employer contracts can be high-value but have specific compliance requirements",
      "Notes, documentation, and clinical record retention rules vary by license and state",
      "Many commercial payers have separate BH credentialing tracks — verify which applies",
    ],
    ancillaryRevenue:
      "Group programs, workshops, employer/EAP contracts, supervision services, online courses or content.",
  },
  {
    slug: "cardiology",
    name: "Cardiology",
    shortLabel: "Cardiology",
    headline: "For cardiologists launching independent practices.",
    sub: "Cardiology launches — non-invasive, interventional, and integrated practice models.",
    whatChanges:
      "Cardiology has high capital requirements driven by imaging (echo, nuclear, vascular) and a payer mix skewed toward Medicare. Hospital privilege coordination is essential. Ancillary revenue from in-office testing is significant.",
    phaseHighlights: {
      "02":
        "Capital for imaging equipment is the single biggest line item in most cardiology pro formas.",
      "04":
        "Medicare is the dominant payer — get this credentialing right and on time. Hospital privileges are separate and parallel.",
      "07":
        "Ancillary in-office testing (stress, echo, vascular, nuclear) drives long-term economics.",
    },
    capitalRange: "$300,000–$1,200,000+ depending on imaging strategy",
    payerMixNote:
      "Typically 50–65% Medicare, 25–35% commercial, 5–10% Medicaid. Patient demographics skew older.",
    watchouts: [
      "Imaging equipment financing terms materially affect 24-month cash flow",
      "Nuclear cardiology has separate licensing and compliance requirements",
      "Medicare audit risk is higher than most specialties — documentation must be tight",
      "Hospital privilege coordination needs early engagement",
    ],
    ancillaryRevenue:
      "In-office stress testing, echocardiography, vascular studies, nuclear cardiology, hospital co-management arrangements.",
  },
  {
    slug: "obgyn",
    name: "OB/GYN",
    shortLabel: "OB/GYN",
    headline: "For OB/GYNs launching independent practices.",
    sub: "OB/GYN launches — solo, group, GYN-only, and integrated women's health models.",
    whatChanges:
      "Obstetrics adds significant malpractice cost and hospital privilege complexity compared to GYN-only. Many newer practices launch as GYN-only initially, adding obstetrics deliberately.",
    phaseHighlights: {
      "01":
        "GYN-only vs. full OB/GYN is a major Phase 01 decision driven by malpractice cost and lifestyle.",
      "02":
        "Malpractice insurance for OB is among the highest in medicine — model accurately.",
      "04":
        "Hospital privileges for OB require separate timing and coordination.",
      "05":
        "Office-based ultrasound and procedure capability shape EHR + equipment decisions.",
    },
    capitalRange: "$150,000–$500,000 for GYN-only; $250,000–$800,000+ for full OB/GYN with privileges",
    payerMixNote:
      "Typically 50–70% commercial, 15–30% Medicare/Medicaid mix. Some markets carry significant Medicaid OB load.",
    watchouts: [
      "Malpractice premiums for OB practice are state-specific and substantial",
      "Hospital privilege relationships affect both OB practice and referral flow",
      "Office-based ultrasound has separate accreditation and billing requirements",
      "Many states have specific GYN procedure facility licensing for in-office procedures",
    ],
    ancillaryRevenue:
      "Office-based ultrasound, cosmetic GYN services, hormone optimization programs, in-office procedures.",
  },
  {
    slug: "family-medicine",
    name: "Family Medicine",
    shortLabel: "Family Med",
    headline: "For family medicine physicians launching independent practices.",
    sub: "Family medicine launches — solo, group, DPC, concierge, and integrated full-spectrum models.",
    whatChanges:
      "Family medicine economics mirror primary care broadly but with added complexity from broader scope (peds, OB in some practices, geriatrics). DPC and direct primary care are particularly viable in family medicine.",
    phaseHighlights: {
      "01":
        "Model choice (FFS vs. DPC vs. concierge) is central. Scope decisions (peds inclusion, OB inclusion) also matter.",
      "02":
        "Pro forma should reflect actual scope — full-spectrum family medicine has different volume math than narrower primary care.",
      "06":
        "Marketing benefits from being explicit about scope and population (full family vs. adult-only).",
    },
    capitalRange: "$80,000–$250,000 for solo FFS; $40,000–$150,000 for solo DPC",
    payerMixNote:
      "Traditional FFS family medicine typically 30–50% Medicare, 30–45% commercial, 5–20% Medicaid. Wider variation than internal medicine due to peds inclusion.",
    watchouts: [
      "Defining scope clearly affects both credentialing and marketing",
      "Peds vaccine inventory and Vaccines for Children (VFC) participation add operational complexity",
      "DPC viability is high in family medicine but requires honest patient-base modeling",
      "Same Phase 06 considerations as primary care — local SEO is the foundation",
    ],
    ancillaryRevenue:
      "In-office labs, point-of-care testing, chronic care management, weight loss / hormone / aesthetic services in some markets.",
  },
];

export const specialtyBySlug = Object.fromEntries(specialties.map((s) => [s.slug, s]));
