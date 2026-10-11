// Personalized checklist tasks. Each task has a stable ID (persisted in visitor
// backups), a rule that decides whether it applies to a profile, and a plain
// reason shown to the visitor ("why this is on your plan"). Wording names the
// visitor's state when known, otherwise the generic "your state". Links point
// only to official pages whose URLs were confirmed when this file was written.

import type { Profile, Task } from "./checklist.ts";
import { specialtyById } from "../startup/options.ts";
import { stateForZip } from "../startup/zip3.ts";

export type OfficialLink = { label: string; url: string };
export type PersonalTask = Task & { reason: string; link?: OfficialLink };

export const LINKS = {
  nppes: { label: "NPPES (CMS) NPI application", url: "https://nppes.cms.hhs.gov/" },
  pecos: { label: "PECOS (CMS) Medicare enrollment", url: "https://pecos.cms.hhs.gov/" },
  caqh: { label: "CAQH ProView", url: "https://proview.caqh.org/" },
  ein: { label: "IRS: get an employer identification number", url: "https://www.irs.gov/businesses/small-businesses-self-employed/get-an-employer-identification-number" },
  clia: { label: "CMS: Clinical Laboratory Improvement Amendments (CLIA)", url: "https://www.cms.gov/medicare/quality/clinical-laboratory-improvement-amendments" },
  dea: { label: "DEA Diversion Control Division", url: "https://www.deadiversion.usdoj.gov/" },
} as const satisfies Record<string, OfficialLink>;

/** Official links for existing base tasks, keyed by their stable IDs. */
export const baseTaskLinks: Record<string, OfficialLink> = {
  "task-11": LINKS.ein,
  "task-14": LINKS.nppes,
  "task-15": LINKS.caqh,
};

/** Resolve the state name from the explicit state, else from the ZIP prefix. */
export function profileState(p: Profile): string {
  if (p.state) return p.state;
  return p.zip ? stateForZip(p.zip)?.name ?? "" : "";
}

function boardFor(p: Profile, state: string): string {
  const where = state ? `the ${state}` : "your state's";
  switch (p.provider) {
    case "physician": return `${where} medical board (or osteopathic board, if that licenses you)`;
    case "np": return `${where} board of nursing`;
    case "pa": return `${where} board that licenses physician assistants`;
    case "therapist": return `${where} board for your license type`;
    default: return `${where} licensing board for your profession`;
  }
}

const insured = (p: Profile) => p.payer !== "cash";
const group = (p: Profile) => specialtyById(p.specialty)?.group;
const sp = (...ids: string[]) => (p: Profile) => ids.includes(p.specialty || "");
const grp = (...groups: string[]) => (p: Profile) => groups.includes(group(p) || "");

type Rule = {
  id: string;
  phase: number;
  weeks: number;
  applies: (p: Profile) => boolean;
  build: (p: Profile, state: string) => { title: string; detail: string; reason: string; link?: OfficialLink };
};

const rules: Rule[] = [
  // State-specific actions. Phrased as actions; no state URLs are invented.
  { id: "p-state-license", phase: 2, weeks: 24, applies: (p) => !!profileState(p), build: (p, s) => ({
    title: s ? `Confirm your ${s} license covers how and where you will practice` : "Confirm your license covers how and where you will practice",
    detail: `Check status, renewal timing, and any practice-location, prescribing, or supervision requirements with ${boardFor(p, s)}.${p.setting !== "office" ? " For telehealth, patients located in other states may require a license in those states." : ""}`,
    reason: `You are planning to practice in ${s}.`,
  }) },
  { id: "p-state-entity", phase: 2, weeks: 22, applies: (p) => !!profileState(p), build: (_p, s) => ({
    title: s ? `Register your entity with ${s}'s business filing office` : "Register your entity with your state's business filing office",
    detail: `File formation documents and any professional-entity paperwork ${s || "your state"} requires, then set up the ${s || "state"} tax and employer accounts your advisers identify.`,
    reason: `Entity formation is filed at the state level in ${s}.`,
  }) },
  { id: "p-state-medicaid", phase: 3, weeks: 20, applies: (p) => insured(p) && ["medicaid", "both", "unsure"].includes(p.mix || ""), build: (p, s) => ({
    title: s ? `${p.mix === "unsure" ? "If you will see Medicaid patients, enroll" : "Enroll"} as a ${s} Medicaid provider` : `${p.mix === "unsure" ? "If you will see Medicaid patients, enroll" : "Enroll"} with your state Medicaid program`,
    detail: `Use the provider enrollment portal on ${s ? `the ${s}` : "your state's"} Medicaid agency website. Medicaid managed care plans may require separate credentialing and contracts.`,
    reason: p.mix === "unsure" ? "You have not decided on Medicaid yet; this keeps the option open." : "Your payer mix includes Medicaid.",
  }) },
  { id: "p-medicare", phase: 3, weeks: 20, applies: (p) => insured(p) && ["medicare", "both", "unsure"].includes(p.mix || ""), build: (p) => ({
    title: p.mix === "unsure" ? "If you will bill Medicare, enroll through PECOS" : "Enroll in Medicare through PECOS",
    detail: "Enroll each billing provider and, for a group, the organization. Keep names, addresses and tax IDs identical to your NPI records. Confirm your license type can bill Medicare.",
    reason: p.mix === "unsure" ? "You have not decided on Medicare yet; this keeps the option open." : "Your payer mix includes Medicare.",
    link: LINKS.pecos,
  }) },
  { id: "p-medicare-status", phase: 3, weeks: 12, applies: (p) => p.payer === "cash" && ["physician", "np", "pa"].includes(p.provider), build: () => ({
    title: "Decide your Medicare status before seeing Medicare-eligible patients",
    detail: "Opting out, enrolling, and enrolling only to order or refer each come with rules. Review the choice with healthcare counsel before your first Medicare-eligible patient.",
    reason: "You chose a cash-pay model, which still requires a deliberate Medicare decision.",
    link: LINKS.pecos,
  }) },

  // Provider type.
  { id: "p-prov-therapist", phase: 2, weeks: 24, applies: (p) => p.provider === "therapist", build: (_p, s) => ({
    title: "Confirm independent-practice rules for your license type",
    detail: `Check supervision, telehealth and private-practice rules for your license in ${s || "your state"}, and which payers credential your license type.`,
    reason: "Rules for therapists differ by license type and state.",
  }) },
  { id: "p-prov-npa-billing", phase: 3, weeks: 20, applies: (p) => insured(p) && ["np", "pa"].includes(p.provider), build: () => ({
    title: "Ask each payer how it credentials and pays NPs and PAs",
    detail: "Confirm whether you can be credentialed under your own NPI and how each payer pays for your services, so your forecast reflects real contract terms.",
    reason: "Payer policies for NPs and PAs vary.",
  }) },

  // Practice model.
  { id: "p-model-coverage", phase: 4, weeks: 8, applies: (p) => p.model === "solo", build: () => ({
    title: "Arrange coverage for time off and after-hours",
    detail: "Decide who covers messages, results and urgent questions when you are unavailable, and document the arrangement.",
    reason: "You are planning a solo practice.",
  }) },
  { id: "p-model-agreement", phase: 2, weeks: 24, applies: (p) => p.model === "group", build: () => ({
    title: "Draft an owners' or operating agreement",
    detail: "Cover ownership, buy-in, compensation, decision rights, call coverage, and what happens when someone leaves. Have healthcare counsel review it.",
    reason: "You are planning a group practice.",
  }) },
  { id: "p-model-group-enroll", phase: 3, weeks: 22, applies: (p) => p.model === "group" && insured(p), build: () => ({
    title: "Plan group and individual enrollment for every provider",
    detail: "Track each provider's credentialing and the group's enrollment separately, including reassignment of benefits where applicable.",
    reason: "Group practices enroll the organization and each provider.",
  }) },
  { id: "p-model-membership", phase: 1, weeks: 24, applies: (p) => p.model === "membership", build: () => ({
    title: "Design membership pricing and the patient agreement",
    detail: "Define what membership includes and excludes. Ask counsel whether your state regulates direct care agreements and how insurance and Medicare rules apply to your model.",
    reason: "You are planning a membership (direct care) model.",
  }) },
  { id: "p-model-membership-ops", phase: 4, weeks: 8, applies: (p) => p.model === "membership", build: () => ({
    title: "Set up recurring billing and membership management",
    detail: "Choose how members enroll, pay, pause and cancel, and how you will track what each membership includes.",
    reason: "Membership practices depend on reliable recurring billing.",
  }) },
  { id: "p-model-affiliation", phase: 2, weeks: 20, applies: (p) => p.model === "hospital", build: () => ({
    title: "Review the affiliation or space agreement with healthcare counsel",
    detail: "Ask about fair market value and referral-related rules, such as the federal Stark Law and Anti-Kickback Statute, before signing.",
    reason: "You are planning a hospital-affiliated or co-located practice.",
  }) },
  { id: "p-privileges", phase: 2, weeks: 20, applies: (p) => p.model === "hospital" || ["surgical", "womens"].includes(group(p) || ""), build: () => ({
    title: "Apply for hospital or surgery-center privileges early",
    detail: "Privileging requires its own applications, references and committee reviews. Start it alongside payer credentialing.",
    reason: "Your specialty or practice model typically depends on facility privileges.",
  }) },

  // Specialty.
  { id: "p-sp-panel", phase: 1, weeks: 24, applies: grp("primary", "pediatrics"), build: () => ({
    title: "Define your patient panel and access model",
    detail: "Plan visit types, continuity, same-day access, after-hours coverage and referral handoffs for the patients you want to serve.",
    reason: "Primary care economics depend on panel and access decisions.",
  }) },
  { id: "p-sp-clia", phase: 4, weeks: 10, applies: grp("primary", "pediatrics", "womens", "medical", "urgent"), build: () => ({
    title: "Get a CLIA certificate before any in-office lab testing",
    detail: "Even simple waived tests require a CLIA certificate of waiver. Decide which tests you will run in-house and apply before the first one.",
    reason: "Your specialty commonly uses in-office testing.",
    link: LINKS.clia,
  }) },
  { id: "p-sp-vaccines", phase: 4, weeks: 12, applies: sp("pediatrics", "family-medicine"), build: (_p, s) => ({
    title: "Decide on vaccine services and Vaccines for Children enrollment",
    detail: `If you will vaccinate, contact ${s ? `the ${s}` : "your state's"} immunization program about Vaccines for Children (VFC) enrollment and vaccine storage and handling requirements.`,
    reason: "Your specialty commonly offers vaccines.",
  }) },
  { id: "p-sp-controlled", phase: 2, weeks: 16, applies: (p) => ["physician", "np", "pa"].includes(p.provider) && (grp("psychiatry", "urgent")(p) || sp("pain-medicine")(p)), build: () => ({
    title: "Register to prescribe controlled substances at each location, if you will",
    detail: "DEA registration is tied to the state and practice location, and your state may require its own registration. Telehealth prescribing of controlled substances has additional federal and state rules; confirm current requirements.",
    reason: "Your specialty commonly involves controlled-substance prescribing.",
    link: LINKS.dea,
  }) },
  { id: "p-sp-crisis", phase: 4, weeks: 16, applies: grp("psychiatry", "therapy"), build: () => ({
    title: "Define intake screening and crisis handoffs",
    detail: "Plan screening, emergency escalation, referral relationships and telehealth suitability before taking appointments.",
    reason: "Behavioral health practices need a documented crisis pathway.",
  }) },
  { id: "p-sp-sessions", phase: 1, weeks: 24, applies: grp("psychiatry", "therapy", "aba"), build: () => ({
    title: "Model session mix, cancellations and caseload",
    detail: "Separate evaluation and follow-up capacity, and stress-test cancellations and collection delays in your pro forma.",
    reason: "Session-based practices are sensitive to no-shows and caseload limits.",
  }) },
  { id: "p-sp-plan-of-care", phase: 4, weeks: 16, applies: grp("rehab"), build: () => ({
    title: "Plan evaluation, plan-of-care and authorization workflows",
    detail: "Map referrals, prior authorizations, visit limits, documentation and reassessment responsibilities.",
    reason: "Therapy services often depend on referrals and authorizations.",
  }) },
  { id: "p-sp-aba", phase: 4, weeks: 20, applies: grp("aba"), build: () => ({
    title: "Define assessment, supervision and staffing capacity",
    detail: "Plan credential verification, supervision schedules, caregiver communication and authorization tracking with your clinical leadership.",
    reason: "ABA services depend on supervised staffing and authorizations.",
  }) },
  { id: "p-sp-procedures", phase: 4, weeks: 14, applies: grp("procedural", "surgical"), build: () => ({
    title: "Plan procedure scheduling, consent, supplies and sterilization",
    detail: "Define which procedures happen in the office, the equipment and reprocessing they require, specimen handling, and follow-up of results.",
    reason: "Your specialty includes in-office procedures.",
  }) },
  { id: "p-sp-imaging", phase: 4, weeks: 14, applies: sp("orthopedics", "podiatry", "chiropractic"), build: (_p, s) => ({
    title: "Check registration requirements for in-office X-ray equipment",
    detail: `Ask ${s ? `the ${s}` : "your state's"} radiation control program whether imaging equipment must be registered or inspected before use.`,
    reason: "Your specialty commonly uses in-office imaging.",
  }) },
  { id: "p-sp-diagnostics", phase: 4, weeks: 14, applies: grp("medical"), build: () => ({
    title: "Confirm payer rules for in-office diagnostic testing",
    detail: "Some payers require accreditation or specific credentials before paying for in-office imaging or testing. Confirm before buying equipment.",
    reason: "Your specialty commonly offers in-office diagnostics.",
  }) },
  { id: "p-sp-urgent", phase: 4, weeks: 20, applies: grp("urgent"), build: () => ({
    title: "Plan unscheduled demand and escalation",
    detail: "Define hours, staffing coverage, diagnostic partners, transfer protocols and scope with clinical leadership.",
    reason: "Urgent care depends on walk-in capacity and escalation paths.",
  }) },

  // Launch stage.
  { id: "p-stage-talk", phase: 0, weeks: 36, applies: (p) => p.stage === "exploring", build: () => ({
    title: "Talk with founders who opened a similar practice",
    detail: "Ask what took longest, what cost more than expected, and what they would do first next time.",
    reason: "You are still exploring the idea.",
  }) },
  { id: "p-stage-runway", phase: 0, weeks: 36, applies: (p) => p.stage === "exploring", build: () => ({
    title: "Estimate your personal runway before giving notice",
    detail: "Use the pro forma to see how long collections may lag behind costs, and how much personal cushion you want.",
    reason: "You are still exploring the idea.",
  }) },
  { id: "p-stage-timeline", phase: 1, weeks: 30, applies: (p) => p.stage === "planning", build: () => ({
    title: "Set a target opening date and work back from the longest lead times",
    detail: "Credentialing, licensing and buildout usually set the pace. Put their start dates on your calendar first.",
    reason: "You are actively planning.",
  }) },
  { id: "p-stage-critical", phase: 3, weeks: 20, applies: (p) => p.stage === "soon" || p.stage === "opening", build: () => ({
    title: "List which long-lead items are started, pending or not started",
    detail: "Payer enrollment, licensing and buildout usually set the opening date. Review their status this week and start anything not yet submitted.",
    reason: "Your opening is close, so long-lead items come first.",
  }) },
  { id: "p-stage-bridge", phase: 3, weeks: 6, applies: (p) => (p.stage === "soon" || p.stage === "opening") && insured(p), build: () => ({
    title: "Plan for patients seen before payer effective dates",
    detail: "Decide with your billing team and counsel how you will schedule, bill or defer patients whose plans have not made you effective yet.",
    reason: "Your opening may come before every payer approval.",
  }) },
];

export const personalTaskIds = rules.map((r) => r.id);

export function personalTasks(p: Profile): PersonalTask[] {
  const state = profileState(p);
  return rules.filter((r) => r.applies(p)).map((r) => ({ id: r.id, phase: r.phase, weeks: r.weeks, ...r.build(p, state) }));
}

/** Base tasks hidden by launch stage. Progress is kept; only the view changes. */
export function stageHides(p: Profile, taskId: string, phase: number): boolean {
  if (p.stage === "exploring") return phase === 6;
  if (p.stage === "opening") return ["task-1", "task-2", "task-4"].includes(taskId);
  return false;
}
