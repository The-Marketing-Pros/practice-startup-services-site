export const financeFields = [
  ["providers", "Providers (including you)", 1, 1, 50, 1, "volume"],
  [
    "visits",
    "Visits per provider per day at capacity",
    18,
    0,
    100,
    0.5,
    "volume",
  ],
  ["days", "Clinical days per month", 20, 0, 31, 1, "volume"],
  [
    "netPerVisit",
    "Expected net collections per visit ($)",
    120,
    0,
    10000,
    1,
    "volume",
  ],
  ["initial", "Opening utilization (%)", 25, 0, 100, 1, "volume"],
  ["ramp", "Months to reach full capacity", 12, 1, 24, 1, "volume"],
  ["lag", "Collection delay (whole months)", 1, 0, 6, 1, "volume"],
  [
    "funding",
    "Available startup funding ($)",
    150000,
    0,
    100000000,
    1000,
    "startup",
  ],
  [
    "legal",
    "Entity, legal & accounting ($)",
    5000,
    0,
    10000000,
    100,
    "startup",
  ],
  [
    "buildout",
    "Buildout & lease deposits ($)",
    25000,
    0,
    10000000,
    100,
    "startup",
  ],
  [
    "equipment",
    "Equipment & furnishings ($)",
    20000,
    0,
    10000000,
    100,
    "startup",
  ],
  ["setup", "Technology & setup ($)", 5000, 0, 10000000, 100, "startup"],
  [
    "enrollment",
    "Credentialing & enrollment ($)",
    3000,
    0,
    10000000,
    100,
    "startup",
  ],
  [
    "preopening",
    "Pre-opening payroll & other costs ($)",
    12000,
    0,
    10000000,
    100,
    "startup",
  ],
  ["contingency", "Startup contingency (%)", 10, 0, 100, 1, "startup"],
  [
    "preMonths",
    "Months of overhead paid before opening",
    0,
    0,
    24,
    1,
    "startup",
  ],
  [
    "providerPay",
    "Total provider / owner compensation ($)",
    15000,
    0,
    10000000,
    100,
    "monthly",
  ],
  ["staffPay", "Staff payroll ($)", 6000, 0, 10000000, 100, "monthly"],
  [
    "benefits",
    "Payroll taxes & benefits (% of payroll)",
    20,
    0,
    100,
    1,
    "monthly",
  ],
  ["rent", "Rent & occupancy ($)", 3500, 0, 10000000, 100, "monthly"],
  ["software", "Software & technology ($)", 800, 0, 10000000, 100, "monthly"],
  [
    "insurance",
    "Malpractice & business insurance ($)",
    1000,
    0,
    10000000,
    100,
    "monthly",
  ],
  ["marketing", "Marketing ($)", 1000, 0, 10000000, 100, "monthly"],
  [
    "other",
    "Other fixed operating costs ($)",
    1500,
    0,
    10000000,
    100,
    "monthly",
  ],
  [
    "variable",
    "Variable costs (% of cash collections)",
    7,
    0,
    100,
    0.5,
    "monthly",
  ],
  ["debt", "Monthly debt payments ($)", 0, 0, 10000000, 100, "monthly"],
] as const;
export type FinanceKey = (typeof financeFields)[number][0];
export type Assumptions = Record<FinanceKey, number>;
/** Fields added after launch, with the default that preserves older backups. */
export const addedFieldDefaults: Partial<Assumptions> = { preMonths: 0 };
const wholeNumberKeys = ["providers", "days", "ramp", "lag", "preMonths"];
export const payerKeys = ["commercial", "medicare", "medicaid", "selfpay"] as const;
export type PayerKey = (typeof payerKeys)[number];
export const payerLabels: Record<PayerKey, string> = {
  commercial: "Commercial insurance",
  medicare: "Medicare",
  medicaid: "Medicaid",
  selfpay: "Self-pay / membership",
};
export type PayerMixInput = {
  /** When true, net collections per visit is the blended payer-mix value. */
  enabled: boolean;
  payers: Record<PayerKey, { share: number; net: number }>;
};
/** Practice context a preset was built from. Labels only; never local cost data. */
export type FinanceContext = {
  specialty: string;
  model: string;
  setting: string;
  payerMix: string;
  stage: string;
  zip: string;
  state: string;
  /** Inputs still holding a preset starting assumption (cleared when edited). */
  presetFields: string[];
};
export type FinancePlan = {
  version: 1;
  kind: "proforma";
  name: string;
  opening: string;
  values: Assumptions;
  mix?: PayerMixInput;
  context?: FinanceContext;
};
export function newMix(): PayerMixInput {
  return {
    enabled: false,
    payers: {
      commercial: { share: 50, net: 120 },
      medicare: { share: 25, net: 100 },
      medicaid: { share: 15, net: 65 },
      selfpay: { share: 10, net: 90 },
    },
  };
}
export function newFinance(): FinancePlan {
  return {
    version: 1,
    kind: "proforma",
    name: "",
    opening: new Date(
      Date.UTC(new Date().getFullYear(), new Date().getMonth() + 1, 1),
    )
      .toISOString()
      .slice(0, 7),
    values: Object.fromEntries(
      financeFields.map((f) => [f[0], f[2]]),
    ) as Assumptions,
    mix: newMix(),
  };
}
/** Sum of payer shares in percent. */
export function mixShareTotal(mix: PayerMixInput): number {
  return payerKeys.reduce((s, k) => s + mix.payers[k].share, 0);
}
/** Blended net collections per visit = sum(share_i / 100 x net_i). */
export function blendedNet(mix: PayerMixInput): number {
  return payerKeys.reduce((s, k) => s + (mix.payers[k].share / 100) * mix.payers[k].net, 0);
}
/** Net collections per visit the model uses: blended when the mix is on. */
export function effectiveNetPerVisit(p: FinancePlan): number {
  return p.mix?.enabled ? blendedNet(p.mix) : p.values.netPerVisit;
}
/** Overhead carried before opening = months x (rent + software + insurance + marketing + other). */
export function preOpeningOverhead(a: Assumptions): number {
  return a.preMonths * (a.rent + a.software + a.insurance + a.marketing + a.other);
}
function validMix(mix: PayerMixInput | undefined): string[] {
  if (mix === undefined) return [];
  const errors: string[] = [];
  if (!mix || typeof mix !== "object" || typeof mix.enabled !== "boolean" || !mix.payers)
    return ["Payer mix is invalid."];
  for (const k of payerKeys) {
    const v = mix.payers[k];
    if (!v || typeof v.share !== "number" || !Number.isFinite(v.share) || v.share < 0 || v.share > 100)
      errors.push(`${payerLabels[k]} share: enter 0–100.`);
    if (!v || typeof v.net !== "number" || !Number.isFinite(v.net) || v.net < 0 || v.net > 10000)
      errors.push(`${payerLabels[k]} net collections per visit: enter 0–10,000.`);
  }
  if (!errors.length && mix.enabled && Math.abs(mixShareTotal(mix) - 100) > 0.5)
    errors.push(`Payer shares must add up to 100%. They add up to ${Math.round(mixShareTotal(mix) * 10) / 10}%.`);
  return errors;
}
export function validateFinance(p: FinancePlan): string[] {
  if (!p || !p.values) return ["Enter your assumptions."];
  const errors: string[] = [];
  if (typeof p.name !== "string" || p.name.length > 100)
    errors.push("Practice name must be 100 characters or fewer.");
  if (
    typeof p.opening !== "string" ||
    !/^20\d{2}-(0[1-9]|1[0-2])$/.test(p.opening)
  )
    errors.push("Choose an opening month between 2000 and 2099.");
  for (const [key, label, , min, max] of financeFields) {
    const v = p.values[key];
    const whole = wholeNumberKeys.includes(key);
    if (
      typeof v !== "number" ||
      !Number.isFinite(v) ||
      v < min ||
      v > max ||
      (whole && !Number.isInteger(v))
    )
      errors.push(
        `${label}: enter ${min.toLocaleString()}–${max.toLocaleString()}${whole ? " (whole numbers)" : ""}.`,
      );
  }
  errors.push(...validMix(p.mix));
  return errors;
}
const contextKeys = ["specialty", "model", "setting", "payerMix", "stage", "zip", "state"] as const;
function parseContext(raw: unknown): FinanceContext | undefined {
  if (raw === undefined) return undefined;
  const c = raw as FinanceContext;
  if (!c || typeof c !== "object") throw Error("This is not a valid pro forma backup.");
  for (const k of contextKeys)
    if (typeof c[k] !== "string" || c[k].length > 60) throw Error("This is not a valid pro forma backup.");
  if (!Array.isArray(c.presetFields) || c.presetFields.some((f) => typeof f !== "string" || f.length > 40) || c.presetFields.length > 60)
    throw Error("This is not a valid pro forma backup.");
  return {
    specialty: c.specialty, model: c.model, setting: c.setting, payerMix: c.payerMix, stage: c.stage, zip: c.zip, state: c.state,
    presetFields: [...c.presetFields],
  };
}
export function parseFinance(raw: unknown): FinancePlan {
  const p = raw as FinancePlan;
  if (!p || p.version !== 1 || p.kind !== "proforma" || !p.values || typeof p.values !== "object")
    throw Error("This is not a valid pro forma backup.");
  // Older backups predate added fields; fill only those with neutral defaults.
  const withDefaults = { ...p, values: { ...addedFieldDefaults, ...p.values } as Assumptions };
  if (validateFinance(withDefaults).length)
    throw Error("This is not a valid pro forma backup.");
  const mix = p.mix
    ? {
        enabled: p.mix.enabled,
        payers: Object.fromEntries(
          payerKeys.map((k) => [k, { share: p.mix!.payers[k].share, net: p.mix!.payers[k].net }]),
        ) as PayerMixInput["payers"],
      }
    : newMix();
  const plan: FinancePlan = {
    version: 1,
    kind: "proforma",
    name: p.name,
    opening: p.opening,
    values: Object.fromEntries(
      financeFields.map((f) => [f[0], withDefaults.values[f[0]]]),
    ) as Assumptions,
    mix,
  };
  const context = parseContext(p.context);
  if (context) plan.context = context;
  return plan;
}
export type Month = {
  month: number;
  label: string;
  utilization: number;
  visits: number;
  earned: number;
  collected: number;
  expenses: number;
  operatingCash: number;
  netCash: number;
  balance: number;
  receivables: number;
};
export function project(p: FinancePlan) {
  const errors = validateFinance(p);
  if (errors.length) throw Error(errors.join(" "));
  const a = p.values;
  const netPerVisit = effectiveNetPerVisit(p);
  const preOverhead = preOpeningOverhead(a);
  const startupBase =
    a.legal + a.buildout + a.equipment + a.setup + a.enrollment + a.preopening + preOverhead;
  const startup = startupBase * (1 + a.contingency / 100);
  const fixed =
    (a.providerPay + a.staffPay) * (1 + a.benefits / 100) +
    a.rent +
    a.software +
    a.insurance +
    a.marketing +
    a.other;
  const openingCash = a.funding - startup;
  const months: Month[] = [];
  let balance = openingCash;
  let receivables = 0;
  for (let i = 0; i < 24; i++) {
    const utilization =
      a.ramp === 1
        ? 1
        : a.initial / 100 +
          (1 - a.initial / 100) * Math.min(1, i / (a.ramp - 1));
    const visits = a.providers * a.visits * a.days * utilization;
    const earned = visits * netPerVisit;
    const collected =
      a.lag === 0 ? earned : i >= a.lag ? months[i - a.lag].earned : 0;
    const expenses = fixed + (collected * a.variable) / 100;
    const operatingCash = collected - expenses;
    const netCash = operatingCash - a.debt;
    balance += netCash;
    receivables += earned - collected;
    const [year, month] = p.opening.split("-").map(Number);
    const label = new Intl.DateTimeFormat("en-US", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1 + i, 1)));
    months.push({
      month: i + 1,
      label,
      utilization,
      visits,
      earned,
      collected,
      expenses,
      operatingCash,
      netCash,
      balance,
      receivables,
    });
  }
  const low = Math.min(openingCash, ...months.map((m) => m.balance));
  const sum = (start: number, end: number, key: keyof Month) =>
    months.slice(start, end).reduce((s, m) => s + Number(m[key]), 0);
  return {
    months,
    startup,
    startupBase,
    netPerVisit,
    preOverhead,
    fixed,
    openingCash,
    lowestCash: low,
    fundingGap: Math.max(0, -low),
    cashPositiveMonth: months.find((m) => m.netCash >= 0)?.month ?? null,
    year1: sum(0, 12, "netCash"),
    year2: sum(12, 24, "netCash"),
    totalCollections: sum(0, 24, "collected"),
    endingReceivables: months[23].receivables,
  };
}
