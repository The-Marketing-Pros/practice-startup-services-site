// Human-readable labels for practice context, shared by the UI and downloads.
import {
  launchStages,
  optionLabel,
  payerMixes,
  practiceModels,
  providerTypes,
  specialtyById,
} from "../startup/options.ts";
import type { FinanceContext } from "./finance.ts";
import type { Profile } from "./checklist.ts";
import { presetPayerMixes } from "./presets.ts";
import { profileState } from "./personal-tasks.ts";

const settings = [
  { value: "office", label: "In-person office" },
  { value: "telehealth", label: "Telehealth only" },
  { value: "hybrid", label: "In-person + telehealth" },
];
const payers = [
  { value: "insurance", label: "Insurance" },
  { value: "cash", label: "Cash-pay" },
  { value: "hybrid", label: "Insurance + cash-pay" },
];

export function contextSummary(c: FinanceContext): string {
  return [
    specialtyById(c.specialty)?.label || "Specialty not chosen",
    c.model ? optionLabel(practiceModels, c.model) : "",
    c.setting ? optionLabel(settings, c.setting) : "",
    c.payerMix ? optionLabel(presetPayerMixes, c.payerMix) : "",
    c.stage ? optionLabel(launchStages, c.stage) : "",
    c.zip ? `ZIP ${c.zip}${c.state ? ` (${c.state})` : ""}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
}

export function profileSummary(p: Profile): string {
  const state = profileState(p);
  return [
    optionLabel(providerTypes, p.provider),
    specialtyById(p.specialty)?.label || "",
    p.zip ? `ZIP ${p.zip}` : "",
    state || "State not selected",
    p.model ? optionLabel(practiceModels, p.model) : "",
    optionLabel(settings, p.setting),
    optionLabel(payers, p.payer),
    p.payer !== "cash" && p.mix ? optionLabel(payerMixes, p.mix) : "",
    p.stage ? optionLabel(launchStages, p.stage) : "",
  ]
    .filter(Boolean)
    .join(" | ");
}
