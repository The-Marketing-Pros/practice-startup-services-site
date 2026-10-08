import {
  newFinance,
  parseFinance,
  validateFinance,
  project,
  financeFields,
} from "../lib/planners/finance";
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
}
function render() {
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
form.addEventListener("input", () => {
  plan.name = element<HTMLInputElement>("finance-name").value;
  plan.opening = element<HTMLInputElement>("finance-opening").value;
  for (const [key] of financeFields) {
    const input = element<HTMLInputElement>(`finance-${key}`);
    plan.values[key] = input.value.trim() === "" ? NaN : Number(input.value);
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
  fill();
  render();
  status("Sample assumptions restored.");
});
for (const [id, fn] of [
  ["finance-xlsx", financeExcel],
  ["finance-pdf", financePdf],
] as const) {
  const button = element<HTMLButtonElement>(id);
  button.addEventListener("click", () => {
    if (!validateFinance(plan).length) exportPlan(button, () => fn(structuredClone(plan)));
  });
}
fill();
render();
document.documentElement.classList.add("rs-js");
