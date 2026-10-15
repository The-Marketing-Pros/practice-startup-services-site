import {
  newFinance,
  newMix,
  parseFinance,
  validateFinance,
  project,
  financeFields,
  payerKeys,
  mixShareTotal,
  blendedNet,
} from "../lib/planners/finance";
import { applyPreset, buildPreset, type PresetInput } from "../lib/planners/presets";
import { contextSummary } from "../lib/planners/context";
import { trackToolDownload } from "../lib/measure";
import { stripParams } from "../lib/attribution";
import {
  element,
  escapeHtml as esc,
  status,
  store,
  restore,
  importPlan,
  exportPlan,
} from "../lib/planners/browser";
import {
  saveBackup,
  financeExcel,
  financePdf,
} from "../lib/planners/downloads";
const key = "pps-startup-proforma-v1";
let plan = restore(key, parseFinance) || newFinance();
const form = element<HTMLFormElement>("finance-inputs");
const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
function fill() {
  element<HTMLInputElement>("finance-name").value = plan.name;
  element<HTMLInputElement>("finance-opening").value = plan.opening;
  for (const [key] of financeFields)
    element<HTMLInputElement>(`finance-${key}`).value = String(
      plan.values[key],
    );
  const mix = (plan.mix ??= newMix());
  element<HTMLInputElement>("mix-enabled").checked = mix.enabled;
  for (const k of payerKeys) {
    element<HTMLInputElement>(`mix-${k}-share`).value = String(mix.payers[k].share);
    element<HTMLInputElement>(`mix-${k}-net`).value = String(mix.payers[k].net);
  }
  if (plan.context) {
    const c = plan.context;
    for (const [id, v] of [["preset-specialty", c.specialty], ["preset-model", c.model], ["preset-setting", c.setting], ["preset-mix", c.payerMix], ["preset-stage", c.stage], ["preset-zip", c.zip]] as const)
      if (v) element<HTMLInputElement | HTMLSelectElement>(id).value = v;
  }
}
const money2 = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
function renderMix() {
  const mix = plan.mix ?? newMix();
  element("mix-section").classList.toggle("pf-mix-off", !mix.enabled);
  element<HTMLInputElement>("finance-netPerVisit").readOnly = mix.enabled;
  const valid = payerKeys.every((k) => Number.isFinite(mix.payers[k].share) && Number.isFinite(mix.payers[k].net));
  const total = valid ? mixShareTotal(mix) : NaN;
  const terms = payerKeys.map((k) => `${mix.payers[k].share}% x ${money2(mix.payers[k].net)}`).join(" + ");
  element("mix-formula").textContent = !valid
    ? "Enter every share and net amount to see your blended rate."
    : `Blended net collections per visit = ${terms} = ${money2(blendedNet(mix))}. Shares add up to ${Math.round(total * 10) / 10}%.${mix.enabled ? " The forecast uses this value." : " Turn the payer mix on to use it."}`;
  const preset = new Set(plan.context?.presetFields ?? []);
  for (const [key] of financeFields) element(`badge-${key}`).hidden = !preset.has(key);
  for (const k of payerKeys) element(`badge-mix-${k}`).hidden = !(preset.has(`mix-${k}-share`) || preset.has(`mix-${k}-net`));
  const ctx = element("finance-context");
  ctx.hidden = !plan.context;
  if (plan.context)
    ctx.textContent = `Built from: ${contextSummary(plan.context)}. ${preset.size ? `${preset.size} inputs still hold starting assumptions (marked below). Replace them with your own quotes.` : "You have replaced every starting assumption."}`;
}
function render() {
  renderMix();
  const errors = validateFinance(plan);
  const warning = element("finance-errors");
  warning.hidden = !errors.length;
  warning.textContent = errors.length
    ? `Update your inputs to see a valid forecast. ${errors.join(" ")}`
    : "";
  element("finance-results").hidden = !!errors.length;
  for (const id of ["finance-xlsx", "finance-pdf", "backup-plan"])
    element<HTMLButtonElement>(id).disabled = !!errors.length;
  if (errors.length) return;
  const r = project(plan);
  for (const [id, value] of [
    ["startup-total", r.startup],
    ["lowest-cash", r.lowestCash],
    ["funding-gap", r.fundingGap],
    ["year-one", r.year1],
    ["year-two", r.year2],
    ["receivables", r.endingReceivables],
  ] as const) {
    element(id).textContent = money(value);
    element(id).classList.toggle("rs-negative", value < 0);
  }
  element("cash-summary").textContent =
    `Opening cash after startup costs: ${money(r.openingCash)}. Month 24 cash balance: ${money(r.months[23].balance)}.`;
  const milestone = element("cash-milestone");
  milestone.textContent = r.cashPositiveMonth
    ? `First month with nonnegative cash change after debt: month ${r.cashPositiveMonth}. This is monthly cash flow, not recovery of your startup investment.`
    : "Cash outflows exceed collections in every modeled month. Review volume, pricing, expenses, and funding before relying on this plan.";
  milestone.classList.toggle("warn", !r.cashPositiveMonth || r.fundingGap > 0);
  element("finance-months").innerHTML = r.months
    .map(
      (m) =>
        `<tr><th scope="row">${esc(m.label)}</th><td>${m.visits.toFixed(1)}</td>${[m.earned, m.collected, m.expenses, plan.values.debt, m.netCash, m.balance].map((v) => `<td class="${v < 0 ? "rs-negative" : ""}">${money(v)}</td>`).join("")}</tr>`,
    )
    .join("");
  const values = [r.openingCash, ...r.months.map((m) => m.balance)];
  const min = Math.min(0, ...values),
    max = Math.max(0, ...values),
    range = max - min || 1;
  const y = (v: number) => 150 - ((v - min) / range) * 120;
  const points = values
    .map((v, i) => `${70 + (i / 24) * 530},${y(v)}`)
    .join(" ");
  element("cash-chart").innerHTML =
    `<line x1="70" y1="${y(0)}" x2="600" y2="${y(0)}" stroke="#b9c9b6" stroke-dasharray="4 4"/><text x="3" y="35">${money(max)}</text><text x="3" y="150">${money(min)}</text><polyline points="${points}" fill="none" stroke="#397157" stroke-width="3" stroke-linejoin="round"/><text x="70" y="179">Opening</text><text x="318" y="179">Month 12</text><text x="545" y="179">Month 24</text>`;
}
form.addEventListener("submit", (e) => e.preventDefault());
form.addEventListener("input", (event) => {
  plan.name = element<HTMLInputElement>("finance-name").value;
  plan.opening = element<HTMLInputElement>("finance-opening").value;
  for (const [key] of financeFields) {
    const input = element<HTMLInputElement>(`finance-${key}`);
    plan.values[key] = input.value.trim() === "" ? NaN : Number(input.value);
  }
  const mix = (plan.mix ??= newMix());
  mix.enabled = element<HTMLInputElement>("mix-enabled").checked;
  for (const k of payerKeys)
    for (const part of ["share", "net"] as const) {
      const input = element<HTMLInputElement>(`mix-${k}-${part}`);
      mix.payers[k][part] = input.value.trim() === "" ? NaN : Number(input.value);
    }
  // Editing an input replaces its starting assumption with the visitor's own.
  const id = (event.target as HTMLElement).id;
  if (plan.context && id) {
    const field = id.startsWith("finance-") ? id.slice("finance-".length) : id;
    plan.context.presetFields = plan.context.presetFields.filter((f) => f !== field);
  }
  render();
  if (!validateFinance(plan).length) store(key, plan);
  else
    element("save-status").textContent =
      "Complete valid inputs to save. Your last valid forecast is still saved.";
});
element("backup-plan").addEventListener("click", () => {
  if (!validateFinance(plan).length) saveBackup(plan);
});
element("restore-plan").addEventListener("click", () =>
  element<HTMLInputElement>("backup-file").click(),
);
element("backup-file").addEventListener("change", (e) =>
  importPlan(e.target as HTMLInputElement, parseFinance, (p) => {
    plan = p;
    store(key, plan);
    fill();
    render();
  }),
);
element("reset-plan").addEventListener("click", () => {
  if (
    !confirm(
      "Replace this forecast with the sample assumptions? Download a backup first to keep your plan.",
    )
  )
    return;
  plan = newFinance();
  store(key, plan);
  element("preset-notes").hidden = true;
  fill();
  render();
  status("Sample assumptions restored.");
});
const presetForm = element<HTMLFormElement>("finance-preset");
presetForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!presetForm.reportValidity()) return;
  const data = new FormData(presetForm);
  const input: PresetInput = {
    specialty: String(data.get("specialty") || ""),
    model: String(data.get("model") || "solo"),
    setting: String(data.get("setting") || "office"),
    payerMix: String(data.get("payerMix") || "unsure"),
    stage: String(data.get("stage") || ""),
    zip: String(data.get("zip") || ""),
  };
  if (
    !confirm(
      "Replace volume, cost and payer inputs with starting assumptions for this practice? Your practice name and opening month stay. Download a backup first to keep your current numbers.",
    )
  )
    return;
  plan = applyPreset(plan, input);
  const notes = element("preset-notes");
  notes.hidden = false;
  notes.innerHTML = `<strong>Starting assumptions applied.</strong><ul>${buildPreset(input).notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`;
  fill();
  render();
  if (!validateFinance(plan).length) store(key, plan);
  status("Starting assumptions applied. Replace each marked input with your own quotes.");
});
for (const [id, fn, format] of [
  ["finance-xlsx", financeExcel, "xlsx"],
  ["finance-pdf", financePdf, "pdf"],
] as const) {
  const button = element<HTMLButtonElement>(id);
  button.addEventListener("click", () => {
    if (!validateFinance(plan).length)
      exportPlan(button, async () => {
        await fn(structuredClone(plan));
        trackToolDownload("proforma", format);
      });
  });
}
// Practice details handed over from the research page prefill the preset form.
{
  const params = new URLSearchParams(location.search);
  const map: Array<[string, string]> = [["specialty", "preset-specialty"], ["model", "preset-model"], ["setting", "preset-setting"], ["stage", "preset-stage"], ["zip", "preset-zip"]];
  for (const [param, id] of map) {
    const v = params.get(param);
    const el = document.getElementById(id) as HTMLInputElement | HTMLSelectElement | null;
    if (v && el && (el instanceof HTMLInputElement ? /^\d{5}$/.test(v) : [...el.options].some((o) => o.value === v))) el.value = v;
  }
  const payer = params.get("payer");
  const mixParam = params.get("mix");
  const mixValue = payer === "cash" ? "cash" : mixParam;
  const mixEl = document.getElementById("preset-mix") as HTMLSelectElement | null;
  if (mixValue && mixEl && [...mixEl.options].some((o) => o.value === mixValue)) mixEl.value = mixValue;
  const handoff = ["provider", "specialty", "zip", "model", "setting", "payer", "mix", "stage", "state"];
  if (handoff.some((k) => params.has(k)))
    try {
      history.replaceState(history.state, "", stripParams(location.href, handoff));
    } catch {
      /* ignore */
    }
}
fill();
render();
document.documentElement.classList.add("rs-js");
