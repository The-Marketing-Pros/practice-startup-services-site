// Pro forma starting assumptions by specialty, practice model, care setting,
// payer mix and launch stage. These are ILLUSTRATIVE starting points derived
// from the builder's existing sample inputs, not benchmarks, surveys or local
// data. The UI labels every preset input as a starting assumption the visitor
// must replace with their own fee schedules, contracts and quotes. A ZIP code
// is used only to label the plan with its likely state; it never sets a cost.

import { specialtyById, type SpecialtyGroup } from "../startup/options.ts";
import { stateForZip, validZip } from "../startup/zip3.ts";
import {
  newMix,
  payerKeys,
  type Assumptions,
  type FinanceContext,
  type FinancePlan,
  type PayerKey,
  type PayerMixInput,
} from "./finance.ts";

export type PresetInput = {
  specialty: string;
  model: string; // solo | group | membership | hospital
  setting: string; // office | telehealth | hybrid
  payerMix: string; // commercial | medicare | medicaid | both | cash | unsure
  stage: string; // exploring | planning | soon | opening
  zip: string;
};

export const presetPayerMixes = [
  { value: "commercial", label: "Mostly commercial insurance" },
  { value: "medicare", label: "Significant Medicare" },
  { value: "medicaid", label: "Significant Medicaid" },
  { value: "both", label: "Medicare and Medicaid" },
  { value: "cash", label: "Cash-pay / self-pay" },
  { value: "unsure", label: "Not sure yet" },
] as const;

type GroupBase = {
  visits: number;
  net: Record<PayerKey, number>;
  equipment: number;
  buildout: number;
};

// Starting points per specialty group. Round numbers on purpose: they are
// placeholders to be replaced, not estimates of any market.
const groupBase: Record<SpecialtyGroup, GroupBase> = {
  primary: { visits: 18, net: { commercial: 120, medicare: 100, medicaid: 65, selfpay: 90 }, equipment: 20000, buildout: 25000 },
  pediatrics: { visits: 20, net: { commercial: 110, medicare: 100, medicaid: 60, selfpay: 85 }, equipment: 20000, buildout: 25000 },
  womens: { visits: 16, net: { commercial: 140, medicare: 110, medicaid: 75, selfpay: 120 }, equipment: 35000, buildout: 35000 },
  psychiatry: { visits: 12, net: { commercial: 150, medicare: 120, medicaid: 80, selfpay: 200 }, equipment: 5000, buildout: 10000 },
  therapy: { visits: 7, net: { commercial: 100, medicare: 85, medicaid: 60, selfpay: 130 }, equipment: 3000, buildout: 5000 },
  rehab: { visits: 10, net: { commercial: 95, medicare: 90, medicaid: 55, selfpay: 110 }, equipment: 25000, buildout: 25000 },
  aba: { visits: 6, net: { commercial: 200, medicare: 0, medicaid: 150, selfpay: 200 }, equipment: 5000, buildout: 15000 },
  procedural: { visits: 20, net: { commercial: 160, medicare: 120, medicaid: 80, selfpay: 150 }, equipment: 60000, buildout: 50000 },
  surgical: { visits: 22, net: { commercial: 180, medicare: 130, medicaid: 85, selfpay: 170 }, equipment: 50000, buildout: 45000 },
  medical: { visits: 16, net: { commercial: 160, medicare: 125, medicaid: 80, selfpay: 150 }, equipment: 40000, buildout: 35000 },
  urgent: { visits: 30, net: { commercial: 130, medicare: 100, medicaid: 65, selfpay: 120 }, equipment: 45000, buildout: 50000 },
  other: { visits: 18, net: { commercial: 120, medicare: 100, medicaid: 65, selfpay: 90 }, equipment: 20000, buildout: 25000 },
};

const mixShares: Record<string, Record<PayerKey, number>> = {
  commercial: { commercial: 70, medicare: 15, medicaid: 5, selfpay: 10 },
  medicare: { commercial: 40, medicare: 45, medicaid: 5, selfpay: 10 },
  medicaid: { commercial: 30, medicare: 10, medicaid: 50, selfpay: 10 },
  both: { commercial: 30, medicare: 35, medicaid: 30, selfpay: 5 },
  cash: { commercial: 0, medicare: 0, medicaid: 0, selfpay: 100 },
  unsure: { commercial: 50, medicare: 25, medicaid: 15, selfpay: 10 },
};

/** Launch stage drives months of overhead carried before opening. */
export const stagePreMonths: Record<string, number> = { exploring: 6, planning: 4, soon: 3, opening: 1 };

export type PresetResult = {
  values: Partial<Assumptions>;
  mix: PayerMixInput;
  context: FinanceContext;
  /** Plain-language notes shown next to the applied preset. */
  notes: string[];
};

export function buildPreset(input: PresetInput): PresetResult {
  const specialty = specialtyById(input.specialty);
  const base = groupBase[specialty?.group ?? "other"];
  const values: Partial<Assumptions> = {
    providers: 1,
    visits: base.visits,
    equipment: base.equipment,
    buildout: base.buildout,
    staffPay: 6000,
    providerPay: 15000,
    rent: 3500,
    software: 800,
  };
  const notes: string[] = [
    "These are illustrative starting assumptions, not benchmarks or local data. Replace each one with your own fee schedules, contracts and quotes.",
  ];
  const shares = { ...(mixShares[input.payerMix] ?? mixShares.unsure) };
  const net = { ...base.net };

  if (input.model === "group") {
    values.providers = 3;
    values.providerPay = 45000;
    values.staffPay = 18000;
    values.rent = 7000;
    values.buildout = base.buildout * 2;
    values.equipment = base.equipment * 2;
    notes.push("Group model: three providers with proportionally higher payroll, space and equipment. Change the provider count to match your plan.");
  } else if (input.model === "membership") {
    for (const k of payerKeys) shares[k] = k === "selfpay" ? 100 : 0;
    values.visits = Math.max(1, Math.round(base.visits / 2));
    notes.push("Membership model: all revenue is self-pay. Enter your expected monthly membership revenue divided by expected visits as the self-pay net per visit. Visits per day start at half the specialty starting point to reflect longer visits.");
  } else if (input.model === "hospital") {
    values.rent = 2000;
    values.buildout = Math.round(base.buildout / 5);
    notes.push("Hospital-affiliated model: lower starting rent and buildout assume shared or provided space. Replace them with the terms of your actual agreement.");
  }

  if (input.setting === "telehealth") {
    values.rent = 500;
    values.buildout = 0;
    values.equipment = 3000;
    values.software = 1200;
    notes.push("Telehealth only: minimal space and equipment, higher software. Replace with your actual platform and workspace costs.");
  } else if (input.setting === "hybrid") {
    values.rent = Math.round((values.rent ?? 3500) * 0.75);
    notes.push("Office plus telehealth: rent starts lower than a full-time office. Replace with your lease terms.");
  }

  if (input.payerMix === "cash" && input.model !== "membership")
    notes.push("Cash-pay: all revenue is self-pay. Set your self-pay net per visit from your published prices and expected collections.");
  if (specialty?.group === "aba")
    notes.push("ABA: the Medicare starting net is set to $0. Confirm which payers cover your services and replace it.");

  const preMonths = stagePreMonths[input.stage];
  if (preMonths !== undefined) {
    values.preMonths = preMonths;
    notes.push(`Launch stage sets ${preMonths} month${preMonths === 1 ? "" : "s"} of overhead before opening (rent, software, insurance, marketing and other fixed costs). Earlier stages start higher because lease and buildout timing are less certain.`);
  }

  const state = validZip(input.zip) ? stateForZip(input.zip)?.name ?? "" : "";
  if (input.zip) notes.push(`ZIP ${input.zip}${state ? ` (${state})` : ""} labels your plan only. It does not set any cost: local rents, wages and rates must come from your own quotes.`);

  const mix = newMix();
  mix.enabled = true;
  for (const k of payerKeys) mix.payers[k] = { share: shares[k], net: net[k] };

  return {
    values,
    mix,
    notes,
    context: {
      specialty: input.specialty,
      model: input.model,
      setting: input.setting,
      payerMix: input.payerMix,
      stage: input.stage,
      zip: validZip(input.zip) ? input.zip : "",
      state,
      presetFields: [...Object.keys(values), ...payerKeys.flatMap((k) => [`mix-${k}-share`, `mix-${k}-net`])],
    },
  };
}

/** Apply a preset to a plan without touching name, opening month or other inputs. */
export function applyPreset(plan: FinancePlan, input: PresetInput): FinancePlan {
  const preset = buildPreset(input);
  return {
    ...plan,
    values: { ...plan.values, ...preset.values } as Assumptions,
    mix: preset.mix,
    context: preset.context,
  };
}
