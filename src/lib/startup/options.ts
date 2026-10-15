// Shared practice-profile vocabulary for the checklist, pro forma and research
// tools. Keep values stable: they are persisted in visitor backups and sent to
// the research endpoint, which validates against these same lists.

export const providerTypes = [
  { value: "physician", label: "Physician (MD / DO)" },
  { value: "np", label: "Nurse practitioner" },
  { value: "pa", label: "Physician assistant" },
  { value: "therapist", label: "Therapist / behavioral health" },
  { value: "other", label: "Other provider" },
] as const;
export type ProviderType = (typeof providerTypes)[number]["value"];

export const practiceModels = [
  { value: "solo", label: "Solo practice" },
  { value: "group", label: "Group practice (several providers)" },
  { value: "membership", label: "Direct care / membership (DPC, concierge)" },
  { value: "hospital", label: "Hospital-affiliated or co-located" },
] as const;
export type PracticeModel = (typeof practiceModels)[number]["value"];

export const launchStages = [
  { value: "exploring", label: "Exploring the idea" },
  { value: "planning", label: "Actively planning" },
  { value: "soon", label: "Opening within 6 months" },
  { value: "opening", label: "Opening now or already open" },
] as const;
export type LaunchStage = (typeof launchStages)[number]["value"];

/** Main payers for an insurance-based practice. Drives enrollment tasks. */
export const payerMixes = [
  { value: "commercial", label: "Mostly commercial insurance" },
  { value: "medicare", label: "Significant Medicare" },
  { value: "medicaid", label: "Significant Medicaid" },
  { value: "both", label: "Medicare and Medicaid" },
  { value: "unsure", label: "Not sure yet" },
] as const;
export type PayerMix = (typeof payerMixes)[number]["value"];

export type SpecialtyGroup =
  | "primary"
  | "pediatrics"
  | "womens"
  | "psychiatry"
  | "therapy"
  | "rehab"
  | "aba"
  | "procedural"
  | "surgical"
  | "medical"
  | "urgent"
  | "other";

/**
 * NPPES taxonomy query for a provider type. `query` is sent as the NPPES
 * `taxonomy_description` search term. NPPES matches it against the taxonomy
 * classification OR specialization separately (so "Nurse Practitioner, Psych"
 * fails but "Psych/Mental Health" works); every term below was verified
 * against the live API on 2026-10-10 (tests/research-facts.test.ts pins them). Returned records are
 * then kept only when one of their taxonomy descriptions starts with one of
 * `prefixes` (case-insensitive), so a broad search term never inflates counts.
 */
export type TaxonomyQuery = { query: string; prefixes: string[]; label: string };

type TaxonomyByProvider = Partial<Record<ProviderType, TaxonomyQuery[]>>;

export type Specialty = {
  id: string;
  label: string;
  group: SpecialtyGroup;
  taxonomy: TaxonomyByProvider;
};

const NP_ALL: TaxonomyQuery = { query: "Nurse Practitioner", prefixes: ["Nurse Practitioner"], label: "Nurse practitioners (all NP taxonomies)" };
const PA_ALL: TaxonomyQuery = { query: "Physician Assistant", prefixes: ["Physician Assistant"], label: "Physician assistants (all PA taxonomies)" };

function physician(query: string, prefixes: string[], label: string): TaxonomyByProvider {
  return { physician: [{ query, prefixes, label }], np: [NP_ALL], pa: [PA_ALL] };
}

export const specialties: Specialty[] = [
  { id: "primary-care", label: "Primary care / internal medicine", group: "primary", taxonomy: { physician: [{ query: "Internal Medicine", prefixes: ["Internal Medicine"], label: "Internal medicine physicians (including subspecialties)" }], np: [{ query: "Primary Care", prefixes: ["Nurse Practitioner, Primary Care"], label: "Primary care NPs" }, { query: "Adult Health", prefixes: ["Nurse Practitioner, Adult Health"], label: "Adult health NPs" }], pa: [PA_ALL] } },
  { id: "family-medicine", label: "Family medicine", group: "primary", taxonomy: { physician: [{ query: "Family Medicine", prefixes: ["Family Medicine"], label: "Family medicine physicians" }], np: [{ query: "Nurse Practitioner", prefixes: ["Nurse Practitioner, Family"], label: "Family nurse practitioners" }], pa: [PA_ALL] } },
  { id: "geriatrics", label: "Geriatrics", group: "primary", taxonomy: { physician: [{ query: "Geriatric Medicine", prefixes: ["Internal Medicine, Geriatric Medicine", "Family Medicine, Geriatric Medicine"], label: "Geriatric medicine physicians" }], np: [{ query: "Gerontology", prefixes: ["Nurse Practitioner, Gerontology"], label: "Gerontology nurse practitioners" }], pa: [PA_ALL] } },
  { id: "pediatrics", label: "Pediatrics", group: "pediatrics", taxonomy: { physician: [{ query: "Pediatrics", prefixes: ["Pediatrics"], label: "Pediatricians (including subspecialties)" }], np: [{ query: "Nurse Practitioner", prefixes: ["Nurse Practitioner, Pediatrics"], label: "Pediatric nurse practitioners" }], pa: [PA_ALL] } },
  { id: "obgyn", label: "OB/GYN and women's health", group: "womens", taxonomy: { physician: [{ query: "Obstetrics & Gynecology", prefixes: ["Obstetrics & Gynecology"], label: "OB/GYN physicians" }], np: [{ query: "Women's Health", prefixes: ["Nurse Practitioner, Women's Health"], label: "Women's health nurse practitioners" }], pa: [PA_ALL] } },
  { id: "psychiatry", label: "Psychiatry", group: "psychiatry", taxonomy: { physician: [{ query: "Psychiatry", prefixes: ["Psychiatry & Neurology, Psychiatry", "Psychiatry & Neurology, Child & Adolescent Psychiatry", "Psychiatry & Neurology, Addiction Psychiatry", "Psychiatry & Neurology, Geriatric Psychiatry"], label: "Psychiatrists" }], np: [{ query: "Psych/Mental Health", prefixes: ["Nurse Practitioner, Psych/Mental Health"], label: "Psychiatric-mental health nurse practitioners" }], pa: [PA_ALL] } },
  { id: "behavioral-health", label: "Counseling / psychotherapy", group: "therapy", taxonomy: { therapist: [{ query: "Counselor", prefixes: ["Counselor, Mental Health", "Counselor, Professional", "Counselor, Addiction"], label: "Mental health, professional and addiction counselors" }, { query: "Social Worker", prefixes: ["Social Worker, Clinical"], label: "Clinical social workers" }, { query: "Marriage & Family Therapist", prefixes: ["Marriage & Family Therapist"], label: "Marriage and family therapists" }], np: [{ query: "Psych/Mental Health", prefixes: ["Nurse Practitioner, Psych/Mental Health"], label: "Psychiatric-mental health nurse practitioners" }], pa: [PA_ALL] } },
  { id: "psychology", label: "Psychology", group: "therapy", taxonomy: { therapist: [{ query: "Psychologist", prefixes: ["Psychologist", "Clinical Neuropsychologist"], label: "Psychologists" }] } },
  { id: "physical-therapy", label: "Physical therapy", group: "rehab", taxonomy: { therapist: [{ query: "Physical Therapist", prefixes: ["Physical Therapist"], label: "Physical therapists" }] } },
  { id: "occupational-therapy", label: "Occupational therapy", group: "rehab", taxonomy: { therapist: [{ query: "Occupational Therapist", prefixes: ["Occupational Therapist"], label: "Occupational therapists" }] } },
  { id: "speech-therapy", label: "Speech-language pathology", group: "rehab", taxonomy: { therapist: [{ query: "Speech-Language Pathologist", prefixes: ["Speech-Language Pathologist"], label: "Speech-language pathologists" }] } },
  { id: "aba", label: "ABA therapy", group: "aba", taxonomy: { therapist: [{ query: "Behavior Analyst", prefixes: ["Behavior Analyst"], label: "Behavior analysts" }] } },
  { id: "cardiology", label: "Cardiology", group: "medical", taxonomy: physician("Cardiovascular Disease", ["Internal Medicine, Cardiovascular Disease", "Internal Medicine, Interventional Cardiology", "Internal Medicine, Clinical Cardiac Electrophysiology"], "Cardiologists") },
  { id: "dermatology", label: "Dermatology", group: "procedural", taxonomy: physician("Dermatology", ["Dermatology"], "Dermatologists") },
  { id: "endocrinology", label: "Endocrinology", group: "medical", taxonomy: physician("Endocrinology", ["Internal Medicine, Endocrinology"], "Endocrinologists") },
  { id: "gastroenterology", label: "Gastroenterology", group: "procedural", taxonomy: physician("Gastroenterology", ["Internal Medicine, Gastroenterology"], "Gastroenterologists") },
  { id: "neurology", label: "Neurology", group: "medical", taxonomy: physician("Neurology", ["Psychiatry & Neurology, Neurology"], "Neurologists") },
  { id: "rheumatology", label: "Rheumatology", group: "medical", taxonomy: physician("Rheumatology", ["Internal Medicine, Rheumatology"], "Rheumatologists") },
  { id: "pulmonology", label: "Pulmonology", group: "medical", taxonomy: physician("Pulmonary Disease", ["Internal Medicine, Pulmonary Disease"], "Pulmonologists") },
  { id: "nephrology", label: "Nephrology", group: "medical", taxonomy: physician("Nephrology", ["Internal Medicine, Nephrology"], "Nephrologists") },
  { id: "oncology", label: "Oncology / hematology", group: "medical", taxonomy: { physician: [{ query: "Medical Oncology", prefixes: ["Internal Medicine, Medical Oncology"], label: "Medical oncologists" }, { query: "Hematology & Oncology", prefixes: ["Internal Medicine, Hematology & Oncology"], label: "Hematologist-oncologists" }], np: [NP_ALL], pa: [PA_ALL] } },
  { id: "allergy", label: "Allergy and immunology", group: "medical", taxonomy: physician("Allergy", ["Allergy & Immunology", "Internal Medicine, Allergy & Immunology", "Pediatrics, Pediatric Allergy/Immunology"], "Allergists and immunologists") },
  { id: "orthopedics", label: "Orthopedics", group: "surgical", taxonomy: physician("Orthopaedic", ["Orthopaedic Surgery"], "Orthopaedic surgeons") },
  { id: "urology", label: "Urology", group: "surgical", taxonomy: physician("Urology", ["Urology"], "Urologists") },
  { id: "ent", label: "ENT (otolaryngology)", group: "surgical", taxonomy: physician("Otolaryngology", ["Otolaryngology"], "Otolaryngologists") },
  { id: "ophthalmology", label: "Ophthalmology", group: "surgical", taxonomy: physician("Ophthalmology", ["Ophthalmology"], "Ophthalmologists") },
  { id: "general-surgery", label: "General surgery", group: "surgical", taxonomy: physician("Surgery", ["Surgery"], "Surgeons (general surgery taxonomy)") },
  { id: "plastic-surgery", label: "Plastic / aesthetic surgery", group: "surgical", taxonomy: physician("Plastic Surgery", ["Plastic Surgery", "Surgery, Plastic and Reconstructive Surgery"], "Plastic surgeons") },
  { id: "pain-medicine", label: "Pain medicine", group: "procedural", taxonomy: physician("Pain Medicine", ["Anesthesiology, Pain Medicine", "Pain Medicine", "Physical Medicine & Rehabilitation, Pain Medicine"], "Pain medicine physicians") },
  { id: "anesthesiology", label: "Anesthesiology", group: "surgical", taxonomy: physician("Anesthesiology", ["Anesthesiology"], "Anesthesiologists") },
  { id: "podiatry", label: "Podiatry", group: "procedural", taxonomy: { physician: [{ query: "Podiatrist", prefixes: ["Podiatrist"], label: "Podiatrists" }], other: [{ query: "Podiatrist", prefixes: ["Podiatrist"], label: "Podiatrists" }] } },
  { id: "chiropractic", label: "Chiropractic", group: "rehab", taxonomy: { other: [{ query: "Chiropractor", prefixes: ["Chiropractor"], label: "Chiropractors" }] } },
  { id: "nutrition", label: "Nutrition / dietetics", group: "therapy", taxonomy: { other: [{ query: "Dietitian", prefixes: ["Dietitian, Registered", "Nutritionist"], label: "Registered dietitians and nutritionists" }] } },
  // No individual NPPES taxonomy identifies urgent care clinicians, so research
  // shows no provider count rather than a misleading proxy.
  { id: "urgent-care", label: "Urgent care", group: "urgent", taxonomy: {} },
  { id: "other", label: "Other specialty", group: "other", taxonomy: {} },
];

export const specialtyIds = specialties.map((s) => s.id);
export function specialtyById(id: string | undefined): Specialty | undefined {
  return specialties.find((s) => s.id === id);
}

/** Taxonomy queries for the provider type, falling back to all NPs/PAs. */
export function taxonomyFor(specialtyId: string, provider: string): TaxonomyQuery[] {
  const s = specialtyById(specialtyId);
  if (!s) return [];
  const direct = s.taxonomy[provider as ProviderType];
  if (direct?.length) return direct;
  if (s.group === "urgent" || s.group === "other") return [];
  if (provider === "np") return [NP_ALL];
  if (provider === "pa") return [PA_ALL];
  return [];
}

export function optionLabel(list: ReadonlyArray<{ value: string; label: string }>, value: string): string {
  return list.find((o) => o.value === value)?.label ?? value;
}
