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
  relatedSlugs?: string[]; // contextually related specialties (similar economics, payer dynamics)
}

export const specialties: Specialty[] = [
  {
    slug: "primary-care",
    name: "Primary Care",
    relatedSlugs: ["family-medicine", "pediatrics", "behavioral-health"],
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
    relatedSlugs: ["cardiology", "urology", "gastroenterology"],
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
    relatedSlugs: ["obgyn", "primary-care", "family-medicine"],
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
    relatedSlugs: ["behavioral-health", "neurology", "primary-care"],
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
    relatedSlugs: ["psychiatry", "primary-care", "pediatrics"],
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
    relatedSlugs: ["gastroenterology", "neurology", "urology"],
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
    relatedSlugs: ["dermatology", "primary-care", "family-medicine"],
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
    slug: "anesthesiology",
    name: "Anesthesiology",
    relatedSlugs: ["gastroenterology", "orthopedics", "cardiology"],
    shortLabel: "Anesthesia",
    headline: "For anesthesiologists launching independent or group practices.",
    sub: "Anesthesia practice launches — hospital-employed transitions, ambulatory surgery center contracts, pain management, and independent group models.",
    whatChanges:
      "Anesthesia is almost entirely site-dependent. Hospital contracts and ambulatory surgery center (ASC) relationships drive nearly all revenue. Credentialing timing and hospital privileges are tightly coupled. The 'office' is borrowed from the surgical setting; pure outpatient anesthesia practices are rare.",
    phaseHighlights: {
      "01":
        "Hospital-employed vs. independent contractor vs. group practice is the central Phase 01 decision. Many independent anesthesia 'practices' are essentially contract operations.",
      "02":
        "Pro forma is dominated by the hospital or ASC contract structure and stipend/subsidy dynamics — not standard practice startup math.",
      "04":
        "Hospital privileging is the gate. Credentialing with the payers your facility contracts with is usually a follow-on, not parallel work.",
      "07":
        "Adding pain management or chronic pain services opens a separate outpatient practice with its own startup sequence.",
    },
    capitalRange: "$25,000–$150,000 for a contract-only independent launch; $100,000–$500,000+ for a pain practice add-on",
    payerMixNote:
      "Anesthesia payer mix mirrors the facility's mix — you don't pick your patients. Commercial is typically 40–60%, Medicare 25–40%, Medicaid 10–20%.",
    watchouts: [
      "Negotiating the hospital or ASC contract is far more important than typical credentialing-first thinking",
      "Anesthesia stipend / subsidy economics vary widely and shape practice viability",
      "Adding pain management triggers a separate set of credentialing, equipment, and compliance requirements",
      "DEA registration and Schedule II prescribing protocols matter especially for pain practice",
    ],
    ancillaryRevenue:
      "Pain management programs, regional anesthesia procedures (interventional pain), chronic care management, surgical center co-ownership.",
  },
  {
    slug: "pediatrics",
    name: "Pediatrics",
    relatedSlugs: ["family-medicine", "primary-care", "behavioral-health"],
    shortLabel: "Peds",
    headline: "For pediatricians launching independent practices.",
    sub: "Pediatric practice launches — solo, group, concierge peds, and integrated developmental-behavioral models.",
    whatChanges:
      "Pediatric economics depend heavily on payer mix — specifically the Medicaid share. State Medicaid reimbursement rates for pediatrics vary dramatically and drive whether a market is viable for independent practice. Patient volume per FTE is higher than most specialties.",
    phaseHighlights: {
      "02":
        "State Medicaid pediatric rates are the single biggest economic input — model with your state's actual fee schedule, not averages.",
      "04":
        "Vaccines for Children (VFC) enrollment is a separate process from standard credentialing and required for most peds practices.",
      "05":
        "Pediatric-specific EHR templates, vaccine inventory management, and well-visit workflow design matter more than for adult medicine.",
      "07":
        "Adding developmental, behavioral, or asthma management programs is the most common ancillary play.",
    },
    capitalRange: "$80,000–$200,000 for solo; $40,000–$120,000 for concierge or membership-model peds",
    payerMixNote:
      "Pediatric mix typically 30–60% Medicaid (state-dependent), 30–55% commercial, 0% Medicare. State Medicaid rate is the biggest variable.",
    watchouts: [
      "Vaccines for Children (VFC) enrollment, inventory, and reporting are non-trivial operational requirements",
      "Vaccine inventory ties up working capital and has spoilage risk — manage actively",
      "Well-visit volume drives revenue — pediatric-friendly scheduling and intake matter more than most specialties",
      "State Medicaid pediatric rates can make some markets economically unviable for independent practice",
    ],
    ancillaryRevenue:
      "Developmental-behavioral programs, asthma management, lactation services, sports physicals, integrated mental health.",
  },
  {
    slug: "gastroenterology",
    name: "Gastroenterology",
    relatedSlugs: ["cardiology", "urology", "anesthesiology"],
    shortLabel: "GI",
    headline: "For gastroenterologists launching independent or group practices.",
    sub: "GI practice launches — solo, group, and integrated endoscopy/ASC models.",
    whatChanges:
      "GI economics are dominated by endoscopy revenue, which means ambulatory surgery center (ASC) strategy is central. Capital requirements are high. Hospital privileges for inpatient consults are typically necessary.",
    phaseHighlights: {
      "02":
        "ASC ownership strategy (own, partner, or contract) is the central Phase 02 decision and drives capital planning.",
      "04":
        "Hospital privileges (for inpatient consults) + ASC credentialing + standard payer credentialing are three parallel tracks.",
      "05":
        "Endoscopy suite design, scope and tower acquisition, and CRE/ infection control protocols are major Phase 05 work.",
      "07":
        "Recurring colonoscopy volume drives long-term economics; building the screening pipeline is a Phase 07 long-game.",
    },
    capitalRange: "$300,000–$1,000,000+ depending on ASC strategy and equipment",
    payerMixNote:
      "GI mix typically 40–60% commercial, 30–45% Medicare, 5–15% Medicaid. Screening colonoscopy demographics skew older.",
    watchouts: [
      "ASC strategy materially affects both capital requirements and 5-year revenue — don't defer this decision",
      "Endoscopy equipment financing terms shape cash flow — model carefully",
      "Infection control and reprocessing protocols are heavily scrutinized — budget appropriately",
      "Screening colonoscopy reimbursement rules (preventive vs. diagnostic billing) have specific coding requirements",
    ],
    ancillaryRevenue:
      "ASC ownership, hepatology programs, motility testing, inflammatory bowel disease specialty programs, hospital co-management arrangements.",
  },
  {
    slug: "neurology",
    name: "Neurology",
    relatedSlugs: ["psychiatry", "cardiology", "orthopedics"],
    shortLabel: "Neuro",
    headline: "For neurologists launching independent practices.",
    sub: "Neurology practice launches — general neurology, subspecialty (epilepsy, MS, headache, movement disorders), and integrated neuroscience models.",
    whatChanges:
      "Neurology economics are subspecialty-dependent. General neurology with EEG/EMG ancillary is one model; subspecialty practice (headache, MS, epilepsy) is another with different patient acquisition patterns and equipment needs. Telehealth integration is increasingly important.",
    phaseHighlights: {
      "01":
        "General vs. subspecialty focus is the central Phase 01 decision — they're functionally different businesses.",
      "02":
        "EEG, EMG, and nerve conduction studies are common ancillary revenue — capital planning depends on which you'll offer.",
      "04":
        "Telehealth-capable practice expands geographic reach but requires multistate licensure planning.",
      "06":
        "Referral relationships with PCPs and specialists drive most neurology practice growth.",
    },
    capitalRange: "$150,000–$400,000 for general neurology; $100,000–$250,000 for subspecialty-focused",
    payerMixNote:
      "Neurology mix typically 40–55% Medicare, 35–50% commercial, 5–15% Medicaid. Subspecialty practices have different distributions.",
    watchouts: [
      "Reimbursement for neurology cognitive services has historically lagged — model carefully",
      "In-office testing (EEG/EMG) has specific accreditation and billing requirements",
      "Subspecialty practices may have limited credentialing options with some commercial payers",
      "Telehealth integration requires deliberate state-by-state licensure planning if seeing patients across borders",
    ],
    ancillaryRevenue:
      "EEG, EMG, nerve conduction studies, infusion therapy (MS, migraine), clinical trials, neuropsychological testing.",
  },
  {
    slug: "urology",
    name: "Urology",
    relatedSlugs: ["orthopedics", "gastroenterology", "cardiology"],
    shortLabel: "Uro",
    headline: "For urologists launching independent or group practices.",
    sub: "Urology practice launches — solo, group, and integrated urologic surgery/oncology models.",
    whatChanges:
      "Urology economics depend on procedure mix. In-office procedures, imaging, and ancillary services (in-office labs, cystoscopy) drive a meaningful share of revenue. Demographics skew older, so Medicare exposure is high.",
    phaseHighlights: {
      "02":
        "In-office procedure capability drives capital planning — cystoscopy, lithotripsy access, vasectomy infrastructure all shape the build.",
      "04":
        "Hospital privileging is typically necessary for inpatient consults and major procedures.",
      "05":
        "Procedure room design and equipment financing shape long-term economics.",
      "07":
        "Adding men's health, fertility, or oncology programs is the most common ancillary expansion play.",
    },
    capitalRange: "$200,000–$600,000 depending on in-office procedure strategy and equipment",
    payerMixNote:
      "Urology mix typically 50–65% Medicare, 25–40% commercial, 5–15% Medicaid. Patient demographics skew older.",
    watchouts: [
      "In-office cystoscopy, ultrasound, and lab testing require specific accreditation and billing setup",
      "Lithotripsy and prostate procedure access shape competitive positioning",
      "Medicare audit risk on urology procedures is higher than average — documentation must be tight",
      "Men's health and fertility ancillary lines have different regulatory profiles than core urology",
    ],
    ancillaryRevenue:
      "Men's health programs (testosterone replacement, ED, vasectomy), fertility services, in-office labs and imaging, oncology programs, robotic surgery partnerships.",
  },
  {
    slug: "family-medicine",
    name: "Family Medicine",
    relatedSlugs: ["primary-care", "pediatrics", "behavioral-health"],
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
