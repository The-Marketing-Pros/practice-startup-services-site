import { supportForTask } from "./support.ts";
import type { Checklist } from "./checklist.ts";
import { stages, visibleTasks, taskProgress, anchorDate } from "./checklist.ts";
import {
  financeFields,
  project,
  payerKeys,
  payerLabels,
  newMix,
  type FinancePlan,
} from "./finance.ts";
import { contextSummary, profileSummary } from "./context.ts";
export function saveFile(data: BlobPart, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export function saveBackup(plan: Checklist | FinancePlan) {
  saveFile(
    JSON.stringify(plan, null, 2),
    `practice-${plan.kind}-backup.json`,
    "application/json",
  );
}
const currency = "$#,##0;[Red]($#,##0);$0";
const cash = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
async function workbook() {
  const { default: ExcelJS } = await import("exceljs");
  const w = new ExcelJS.Workbook();
  w.creator = "Physician Practice Specialists";
  w.calcProperties.fullCalcOnLoad = true;
  return w;
}
function styleSheet(s: import("exceljs").Worksheet, widths: number[]) {
  s.columns = widths.map((width) => ({ width }));
  s.views = [{ state: "frozen", ySplit: 7 }];
  s.eachRow((r, i) => {
    r.font = { name: "Calibri", size: 11, color: { argb: "FF233F39" } };
    r.alignment = { vertical: "top", wrapText: true };
    if (i === 1) {
      r.font = {
        name: "Calibri",
        size: 20,
        bold: true,
        color: { argb: "FF183C3A" },
      };
      r.height = 32;
    }
    if (i === 7) {
      r.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF183C3A" },
      };
      r.font = {
        name: "Calibri",
        size: 11,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      r.height = 30;
    }
  });
}
export async function checklistWorkbook(plan: Checklist) {
  const w = await workbook();
  const s = w.addWorksheet("Startup checklist");
  s.addRow(["YOUR PRACTICE STARTUP CHECKLIST"]);
  s.addRow([plan.profile.name || "My practice"]);
  s.addRow([profileSummary(plan.profile)]);
  s.addRow([openingLine(plan)]);
  s.addRow([
    "Suggested dates are planning targets, not required lead times. Confirm requirements with your advisers.",
  ]);
  s.addRow([
    "Free tool from practicestartupservices.com • Keep this file private; no patient information.",
  ]);
  s.addRow([
    "Phase",
    "Task",
    "Status",
    "Owner",
    "Due date",
    "Notes",
    "Guidance",
    "Optional support",
    "Support link",
    "Why this is on your plan",
    "Official source",
  ]);
  for (const t of visibleTasks(plan)) {
    const p = taskProgress(plan, t);
    const help = supportForTask(t.id);
    s.addRow([
      stages[t.phase],
      t.title,
      p.done ? "Complete" : "Open",
      p.owner,
      p.due,
      p.notes,
      t.detail,
      help ? `${help.name}: ${help.description}` : "",
      help ? { text: help.label, hyperlink: help.url } : "",
      t.reason || "",
      t.link ? { text: t.link.label, hyperlink: t.link.url } : "",
    ]);
  }
  styleSheet(s, [17, 48, 14, 23, 15, 50, 70, 65, 35, 45, 40]);
  s.autoFilter = "A7:K7";
  return w;
}
function openingLine(plan: Checklist) {
  const anchor = anchorDate(plan.profile);
  if (!anchor.date) return "Target opening: Not set";
  return anchor.assumed
    ? `Target opening: not set. Suggested dates assume opening around ${anchor.date} based on your launch stage; set a date to replace this.`
    : `Target opening: ${anchor.date}`;
}
export async function checklistExcel(plan: Checklist) {
  const w = await checklistWorkbook(plan);
  saveFile(
    (await w.xlsx.writeBuffer()) as ArrayBuffer,
    "practice-startup-checklist.xlsx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
}
export async function financeWorkbook(plan: FinancePlan) {
  const w = await workbook();
  const a = plan.values;
  const r = project(plan);
  const inputs = w.addWorksheet("Assumptions");
  inputs.addRow(["PRACTICE STARTUP PRO FORMA"]);
  inputs.addRow([
    "All amounts in USD. Illustrative inputs, not benchmarks. Edit the blue input cells.",
  ]);
  inputs.addRow(["Practice name", plan.name || "My practice"]);
  inputs.addRow(["Opening month", new Date(`${plan.opening}-01T12:00:00Z`)]);
  inputs.getCell("B4").numFmt = "mmm yyyy";
  inputs.addRow([
    "24 months; startup costs paid before opening. No taxes, depreciation, inflation, or opening receivables.",
  ]);
  inputs.addRow([
    plan.context
      ? `Starting assumptions from: ${contextSummary(plan.context)}. Replace every starting assumption with your own quotes. See Method notes.`
      : "See Method notes for model boundaries.",
  ]);
  inputs.addRow(["Assumption", "Your input", "Allowed range"]);
  const cells: Record<string, string> = {};
  for (const [key, label, , min, max] of financeFields) {
    const row = inputs.addRow([label, a[key], `${min} to ${max}`]);
    cells[key] = `Assumptions!$B$${row.number}`;
    row.getCell(2).numFmt = [
      "initial",
      "contingency",
      "benefits",
      "variable",
    ].includes(key)
      ? '0.0"%"'
      : "#,##0.00";
    row.getCell(2).dataValidation = {
      type: ["providers", "days", "ramp", "lag"].includes(key)
        ? "whole"
        : "decimal",
      operator: "between",
      formulae: [min, max],
      allowBlank: false,
      showErrorMessage: true,
      error: "Enter a value within the allowed range.",
    };
  }
  // Payer mix: blended net collections = sum(share x net) / 100 when enabled.
  const mix = plan.mix ?? newMix();
  inputs.addRow([]);
  const mixHeader = inputs.addRow(["PAYER MIX", "Your input", "Allowed range"]);
  mixHeader.font = { name: "Calibri", size: 11, bold: true };
  const useRow = inputs.addRow([
    "Use payer mix for net collections per visit (1 = yes, 0 = no)",
    mix.enabled ? 1 : 0,
    "0 or 1",
  ]);
  useRow.getCell(2).dataValidation = {
    type: "whole",
    operator: "between",
    formulae: [0, 1],
    allowBlank: false,
    showErrorMessage: true,
    error: "Enter 1 to use the payer mix or 0 to use the single net-per-visit input.",
  };
  const useCell = `Assumptions!$B$${useRow.number}`;
  const mixTerms: string[] = [];
  const shareCells: string[] = [];
  for (const k of payerKeys) {
    const share = inputs.addRow([`${payerLabels[k]}: share of visits (%)`, mix.payers[k].share, "0 to 100"]);
    share.getCell(2).numFmt = '0.0"%"';
    const net = inputs.addRow([`${payerLabels[k]}: net collections per visit ($)`, mix.payers[k].net, "0 to 10000"]);
    net.getCell(2).numFmt = "#,##0.00";
    for (const [row, max] of [[share, 100], [net, 10000]] as const)
      row.getCell(2).dataValidation = {
        type: "decimal",
        operator: "between",
        formulae: [0, max],
        allowBlank: false,
        showErrorMessage: true,
        error: "Enter a value within the allowed range.",
      };
    shareCells.push(`Assumptions!$B$${share.number}`);
    mixTerms.push(`Assumptions!$B$${share.number}*Assumptions!$B$${net.number}`);
  }
  const r0 = project(plan);
  const totalRow = inputs.addRow([
    "Payer shares total (must equal 100% when the mix is used)",
    { formula: shareCells.join("+"), result: payerKeys.reduce((t, k) => t + mix.payers[k].share, 0) },
  ]);
  totalRow.getCell(2).numFmt = '0.0"%"';
  const blendedRow = inputs.addRow([
    "Net collections per visit used by the model ($) = IF(use mix, SUM(share x net) / 100, single input)",
    {
      formula: `IF(${useCell}=1,(${mixTerms.join("+")})/100,${cells.netPerVisit})`,
      result: r0.netPerVisit,
    },
  ]);
  blendedRow.getCell(2).numFmt = "#,##0.00";
  const blendedCell = `Assumptions!$B$${blendedRow.number}`;
  if (plan.context) {
    inputs.addRow([]);
    inputs.addRow(["PRACTICE CONTEXT (labels only; not local cost data)"]);
    inputs.addRow(["Plan built from", contextSummary(plan.context)]);
    inputs.addRow(["Inputs still holding a starting assumption", plan.context.presetFields.length ? "Yes: replace them with your own quotes" : "None"]);
  }
  styleSheet(inputs, [56, 25, 28]);
  for (let i = 8; i <= inputs.rowCount; i++)
    inputs.getCell(`B${i}`).font = {
      name: "Calibri",
      size: 11,
      color: { argb: "FF2458A4" },
    };
  for (const row of [totalRow, blendedRow])
    row.getCell(2).font = { name: "Calibri", size: 11, bold: true, color: { argb: "FF233F39" } };
  mixHeader.font = { name: "Calibri", size: 11, bold: true };
  const c = (key: string) => cells[key];
  const sumStartup = [
    "legal",
    "buildout",
    "equipment",
    "setup",
    "enrollment",
    "preopening",
  ]
    .map(c)
    .join("+") +
    `+${c("preMonths")}*(${["rent", "software", "insurance", "marketing", "other"].map(c).join("+")})`;
  const summary = w.addWorksheet("Summary");
  summary.addRow(["YOUR STARTUP CASH PLAN"]);
  summary.addRow([
    "Planning estimate; review assumptions and funding needs with your advisers.",
  ]);
  summary.addRow([
    "24-month cash forecast including provider compensation and debt payments.",
  ]);
  summary.addRow(["Positive monthly cash flow is not cumulative payback."]);
  summary.addRow([]);
  summary.addRow([]);
  summary.addRow(["Measure", "Amount"]);
  const results: [string, string, number | string][] = [
    ["Startup costs before contingency", sumStartup, r.startupBase],
    [
      "Startup costs with contingency",
      `B8*(1+${c("contingency")}/100)`,
      r.startup,
    ],
    ["Opening cash after startup costs", `${c("funding")}-B9`, r.openingCash],
    [
      "Fixed monthly operating costs",
      `(${c("providerPay")}+${c("staffPay")})*(1+${c("benefits")}/100)+${["rent", "software", "insurance", "marketing", "other"].map(c).join("+")}`,
      r.fixed,
    ],
    [
      "Lowest projected cash balance",
      "MIN(B10,'Monthly forecast'!M8:M31)",
      r.lowestCash,
    ],
    ["Additional funding to stay at or above $0", "MAX(0,-B12)", r.fundingGap],
    [
      "Year 1 cash change after debt",
      "SUM('Monthly forecast'!L8:L19)",
      r.year1,
    ],
    [
      "Year 2 cash change after debt",
      "SUM('Monthly forecast'!L20:L31)",
      r.year2,
    ],
    [
      "Month 24 outstanding net collections",
      "'Monthly forecast'!N31",
      r.endingReceivables,
    ],
    ["Net collections per visit used by the model", blendedCell, r.netPerVisit],
    [
      "Pre-opening overhead included in startup costs",
      `${c("preMonths")}*(${["rent", "software", "insurance", "marketing", "other"].map(c).join("+")})`,
      r.preOverhead,
    ],
  ];
  results.forEach(([label, formula, result]) => {
    const row = summary.addRow([label, { formula, result }]);
    row.getCell(2).numFmt = currency;
  });
  styleSheet(summary, [56, 26]);
  const monthly = w.addWorksheet("Monthly forecast");
  monthly.addRow(["24-MONTH CASH FORECAST"]);
  monthly.addRow([
    "Change inputs on the Assumptions sheet; formulas recalculate in Excel.",
  ]);
  monthly.addRow([
    "Revenue earned means expected collectible revenue, not gross charges.",
  ]);
  monthly.addRow([
    "Collections shift by a whole-month delay; no bad-debt adjustment beyond your net-per-visit input.",
  ]);
  monthly.addRow([
    "Opening cash after startup costs",
    { formula: "Summary!B10", result: r.openingCash },
  ]);
  monthly.getCell("B5").numFmt = currency;
  monthly.addRow([]);
  monthly.addRow([
    "Month",
    "Period",
    "Utilization",
    "Visits",
    "Revenue earned",
    "Cash collected",
    "Fixed costs",
    "Variable costs",
    "Operating outflow",
    "Operating cash",
    "Debt payment",
    "Net cash change",
    "Cash balance",
    "Uncollected revenue",
  ]);
  for (const m of r.months) {
    const row = m.month + 7;
    const prev = row - 1;
    const f = (formula: string, result: number) => ({ formula, result });
    const [year, month] = plan.opening.split("-").map(Number);
    const serial =
      (Date.UTC(year, month - 1 + m.month - 1, 1) - Date.UTC(1899, 11, 30)) /
      86400000;
    monthly.addRow([
      m.month,
      f(
        `DATE(YEAR(Assumptions!$B$4),MONTH(Assumptions!$B$4)+A${row}-1,1)`,
        serial,
      ),
      f(
        `IF(${c("ramp")}=1,1,${c("initial")}/100+(1-${c("initial")}/100)*MIN(1,(A${row}-1)/(${c("ramp")}-1)))`,
        m.utilization,
      ),
      f(`${c("providers")}*${c("visits")}*${c("days")}*C${row}`, m.visits),
      f(`D${row}*${blendedCell}`, m.earned),
      f(
        `IF(A${row}<=${c("lag")},0,INDEX(E$8:E$31,MAX(1,A${row}-${c("lag")})))`,
        m.collected,
      ),
      f("Summary!$B$11", r.fixed),
      f(`F${row}*${c("variable")}/100`, (m.collected * a.variable) / 100),
      f(`G${row}+H${row}`, m.expenses),
      f(`F${row}-I${row}`, m.operatingCash),
      f(c("debt"), a.debt),
      f(`J${row}-K${row}`, m.netCash),
      f(`${m.month === 1 ? "Summary!B10" : `M${prev}`}+L${row}`, m.balance),
      f(`${m.month === 1 ? "0" : `N${prev}`}+E${row}-F${row}`, m.receivables),
    ]);
    monthly.getCell(`B${row}`).numFmt = "mmm yyyy";
    monthly.getCell(`C${row}`).numFmt = "0.0%";
    monthly.getCell(`D${row}`).numFmt = "#,##0.0";
    for (const col of "EFGHIJKLMN")
      monthly.getCell(`${col}${row}`).numFmt = currency;
  }
  styleSheet(monthly, [10, 15, 14, 13, ...Array(10).fill(20)]);
  monthly.autoFilter = "A7:N7";
  const notes = w.addWorksheet("Method notes");
  [
    ["HOW THIS MODEL WORKS"],
    ["Free planning tool from Physician Practice Specialists"],
    ["https://practicestartupservices.com/resources/pro-forma/"],
    [
      "This is a cash planning model, not an accrual income statement or a financing recommendation.",
    ],
    [
      "All sample assumptions are illustrative. Replace them with your own quotes, contracts, costs, and capacity.",
    ],
    [
      "Funding is available before opening. Startup costs and contingency are paid at month zero.",
    ],
    [
      "Months 1–24 use constant provider count, working days, compensation, costs, and net revenue per visit.",
    ],
    [
      "Utilization grows linearly from the opening percentage to 100% in the specified ramp period. A one-month ramp begins at full capacity.",
    ],
    [
      "Revenue earned is visits times expected net collections per visit. It already reflects your contractual allowances and expected collection losses.",
    ],
    [
      "Payer mix: when 'Use payer mix' is 1, net collections per visit = (Commercial share x net + Medicare share x net + Medicaid share x net + Self-pay share x net) / 100. Shares must total 100%. When it is 0, the single net-per-visit input is used.",
    ],
    [
      "Pre-opening overhead = months of overhead before opening x (rent + software + insurance + marketing + other fixed costs). It is added to startup costs before contingency.",
    ],
    [
      "Starting assumptions from specialty, practice model, care setting, payer mix and launch stage are illustrative placeholders, not benchmarks or local data. A ZIP code only labels the plan.",
    ],
    [
      "Cash receipts are delayed by the selected whole number of months. Opening accounts receivable is zero. Uncollected revenue remains visible at month 24.",
    ],
    [
      "Variable costs are a percentage of cash collections and are paid in that month. Fixed costs start in month 1.",
    ],
    [
      "Provider/owner compensation and payroll burden are included as cash outflows. Debt payments include principal and interest as a combined cash outflow.",
    ],
    [
      "No tax liability, depreciation, inflation, seasonal variation, capital purchases after opening, debt amortization, or funding after opening is modeled.",
    ],
    [
      "Additional funding is the modeled shortfall to keep cash at or above zero; add your own reserve. A positive month does not mean startup investment is repaid.",
    ],
    [
      "Source for planning framework: https://www.sba.gov/counseling/plan-your-business/",
    ],
    [
      "Review this plan with qualified accounting, financing, and legal advisers.",
    ],
  ].forEach((row) => notes.addRow(row));
  notes.columns = [{ width: 120 }];
  notes.eachRow((row) => {
    row.alignment = { wrapText: true, vertical: "top" };
    row.height = 34;
  });
  return w;
}
export async function financeExcel(plan: FinancePlan) {
  const w = await financeWorkbook(plan);
  saveFile(
    (await w.xlsx.writeBuffer()) as ArrayBuffer,
    "practice-startup-pro-forma.xlsx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
}
export async function pdfDocument(title: string, subtitle: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  for (const weight of ["Regular", "Bold"]) {
    const response = await fetch(`/fonts/NotoSans-${weight}.ttf`);
    if (!response.ok) throw new Error("The PDF font could not be loaded.");
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
    doc.addFileToVFS(`NotoSans-${weight}.ttf`, btoa(binary));
    doc.addFont(`NotoSans-${weight}.ttf`, "NotoSans", weight === "Bold" ? "bold" : "normal");
  }
  let y = 20;
  const line = (text: string, size = 10, bold = false) => {
    doc.setFont("NotoSans", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, 172) as string[];
    for (const l of lines) {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(l, 19, y);
      y += size * 0.43 + 2;
    }
    y += 2;
  };
  line(title, 20, true);
  line(subtitle, 11);
  return {
    doc,
    line,
    link: (label: string, url: string) => {
      doc.setFont("NotoSans", "normal");
      doc.setFontSize(9);
      doc.setTextColor(35, 79, 70);
      for (const text of doc.splitTextToSize(`${label}: ${url}`, 172) as string[]) {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.textWithLink(text, 19, y, { url });
        y += 6;
      }
      y += 2;
      doc.setTextColor(0);
    },
    keep: (height: number) => { if (y + height > 275) { doc.addPage(); y = 20; } },
    space: () => {
      y += 5;
    },
    finish: (filename: string) => {
      const pages = doc.getNumberOfPages();
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(90);
        doc.text(
          `Physician Practice Specialists | practicestartupservices.com | ${i} / ${pages}`,
          19,
          288,
        );
      }
      doc.save(filename);
    },
  };
}
export async function checklistPdf(plan: Checklist) {
  const pdf = await pdfDocument(
    "My practice startup checklist",
    plan.profile.name || "My practice",
  );
  pdf.line(profileSummary(plan.profile));
  pdf.line(openingLine(plan));
  pdf.line(
    "Suggested dates are editable planning targets, not required lead times. This checklist is a starting point; verify current requirements with your licensing board and advisers.",
  );
  pdf.line("Optional PPS services, LaborGenie, and UnfairCPA resources are included alongside relevant tasks. You choose whether to use them.", 9);
  let phase = -1;
  for (const t of visibleTasks(plan)) {
    const help = supportForTask(t.id);
    if (t.phase !== phase) {
      pdf.keep(help ? 85 : 52);
      pdf.space();
      pdf.line(`${t.phase + 1}. ${stages[t.phase]}`, 14, true);
      phase = t.phase;
    }
    const p = taskProgress(plan, t);
    pdf.keep(help ? 65 : 32);
    pdf.line(`${p.done ? "[Done]" : "[Open]"} ${t.title}`, 11, true);
    pdf.line(t.detail);
    pdf.line(
      `Owner: ${p.owner || "Unassigned"} | Due: ${p.due || "Not set"}`,
      9,
    );
    if (p.notes) pdf.line(`Notes: ${p.notes}`);
    if (t.reason) pdf.line(`Why this is on your plan: ${t.reason}`, 9);
    if (t.link) pdf.link(`Official source: ${t.link.label}`, t.link.url);
    if (help) {
      pdf.keep(38);
      pdf.line(`Optional support: ${help.name}`, 9, true);
      pdf.line(help.description, 9);
      pdf.link(help.label, help.url);
    }
  }
  pdf.finish("practice-startup-checklist.pdf");
}
export async function financePdf(plan: FinancePlan) {
  const r = project(plan);
  const pdf = await pdfDocument(
    "My practice startup pro forma",
    `${plan.name || "My practice"} | Opening ${plan.opening} | USD`,
  );
  pdf.line(
    "Planning estimate based on your inputs. Sample values are illustrative, not industry benchmarks. This is a cash forecast, not an accrual income statement.",
  );
  if (plan.context) {
    pdf.line(`Starting assumptions from: ${contextSummary(plan.context)}`, 10, true);
    pdf.line(
      "Starting assumptions are illustrative placeholders, not benchmarks or local data. A ZIP code only labels the plan. Replace every starting assumption with your own fee schedules, contracts and quotes.",
      9,
    );
  }
  for (const [label, v] of [
    ["Startup costs", r.startup],
    ["Opening cash", r.openingCash],
    ["Lowest projected cash", r.lowestCash],
    ["Additional funding to stay at $0", r.fundingGap],
    ["Year 1 cash change after debt", r.year1],
    ["Year 2 cash change after debt", r.year2],
    ["Month 24 uncollected revenue", r.endingReceivables],
  ] as const)
    pdf.line(`${label}: ${cash(v)}`, 11, true);
  pdf.line(
    `First month with nonnegative cash change after debt: ${r.cashPositiveMonth ?? "Not within 24 months"}. This is not cumulative payback.`,
  );
  pdf.space();
  pdf.line("Your assumptions", 14, true);
  const preset = new Set(plan.context?.presetFields ?? []);
  for (const [key, label] of financeFields)
    pdf.line(`${label}: ${plan.values[key].toLocaleString("en-US")}${preset.has(key) ? " (starting assumption: replace)" : ""}`);
  pdf.line(`Pre-opening overhead = ${plan.values.preMonths} months x (rent + software + insurance + marketing + other) = ${cash(r.preOverhead)}. Included in startup costs.`);
  pdf.space();
  pdf.line("Payer mix", 14, true);
  const mix = plan.mix ?? newMix();
  for (const k of payerKeys)
    pdf.line(`${payerLabels[k]}: ${mix.payers[k].share}% of visits x ${cash(mix.payers[k].net)} net per visit${preset.has(`mix-${k}-net`) ? " (starting assumption: replace)" : ""}`);
  pdf.line(
    mix.enabled
      ? `Blended net collections per visit = ${payerKeys.map((k) => `${mix.payers[k].share}% x ${cash(mix.payers[k].net)}`).join(" + ")} = ${cash(r.netPerVisit)}. The forecast uses this value.`
      : `Payer mix is off. The forecast uses your single net collections per visit input: ${cash(r.netPerVisit)}.`,
    10,
    true,
  );
  pdf.space();
  pdf.line("Monthly cash forecast", 14, true);
  for (const m of r.months) {
    pdf.keep(28);
    pdf.line(
      `${m.month}. ${m.label} | Visits ${m.visits.toFixed(1)} | Utilization ${(m.utilization * 100).toFixed(0)}%`,
      11,
      true,
    );
    pdf.line(
      `Earned ${cash(m.earned)} | Collected ${cash(m.collected)} | Operating outflow ${cash(m.expenses)}`,
    );
    pdf.line(
      `Debt ${cash(plan.values.debt)} | Net cash ${cash(m.netCash)} | Cash balance ${cash(m.balance)}`,
    );
  }
  pdf.space();
  pdf.keep(65);
  pdf.line("Model notes", 14, true);
  pdf.line(
    "Startup costs are paid before opening. Available funding is received upfront. Volume ramps linearly; provider count and monthly costs remain constant. Collections lag by whole months. Variable costs follow cash collections. Owner/provider compensation and payroll burden are included.",
  );
  pdf.line(
    "Excludes taxes, depreciation, inflation, seasonal changes, later capital purchases, and later funding. Opening receivables are zero. Additional funding covers only the modeled shortfall, with no extra reserve. Review with your advisers.",
  );
  pdf.line(
    "Payer mix, when on, sets net collections per visit to the share-weighted sum of each payer's net per visit. Pre-opening overhead counts months of fixed costs before opening.",
  );
  pdf.line("Planning framework: sba.gov/counseling/plan-your-business/");
  pdf.finish("practice-startup-pro-forma.pdf");
}
