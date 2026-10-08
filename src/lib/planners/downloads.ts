import type { Checklist } from "./checklist.ts";
import { stages, visibleTasks, taskProgress } from "./checklist.ts";
import { financeFields, project, type FinancePlan } from "./finance.ts";
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
export async function checklistExcel(plan: Checklist) {
  const w = await workbook();
  const s = w.addWorksheet("Startup checklist");
  s.addRow(["YOUR PRACTICE STARTUP CHECKLIST"]);
  s.addRow([plan.profile.name || "My practice"]);
  s.addRow([
    `${plan.profile.state || "State not selected"} | ${plan.profile.provider} | ${plan.profile.setting} | ${plan.profile.payer}`,
  ]);
  s.addRow([`Target opening: ${plan.profile.opening || "Not set"}`]);
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
  ]);
  for (const t of visibleTasks(plan)) {
    const p = taskProgress(plan, t);
    s.addRow([
      stages[t.phase],
      t.title,
      p.done ? "Complete" : "Open",
      p.owner,
      p.due,
      p.notes,
      t.detail,
    ]);
  }
  styleSheet(s, [17, 48, 14, 23, 15, 50, 70]);
  s.autoFilter = "A7:G7";
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
  inputs.addRow(["See Method notes for model boundaries."]);
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
  styleSheet(inputs, [56, 25, 28]);
  for (let i = 8; i <= inputs.rowCount; i++)
    inputs.getCell(`B${i}`).font = {
      name: "Calibri",
      size: 11,
      color: { argb: "FF2458A4" },
    };
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
    .join("+");
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
      f(`D${row}*${c("netPerVisit")}`, m.earned),
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
async function pdfDocument(title: string, subtitle: string) {
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
  pdf.line(
    `${plan.profile.state || "State not selected"} | ${plan.profile.provider} | ${plan.profile.setting} | ${plan.profile.payer}`,
  );
  pdf.line(`Target opening: ${plan.profile.opening || "Not set"}`);
  pdf.line(
    "Suggested dates are editable planning targets, not required lead times. This checklist is a starting point; verify current requirements with your licensing board and advisers.",
  );
  let phase = -1;
  for (const t of visibleTasks(plan)) {
    if (t.phase !== phase) {
      pdf.space();
      pdf.line(`${t.phase + 1}. ${stages[t.phase]}`, 14, true);
      phase = t.phase;
    }
    const p = taskProgress(plan, t);
    pdf.keep(32);
    pdf.line(`${p.done ? "[Done]" : "[Open]"} ${t.title}`, 11, true);
    pdf.line(t.detail);
    pdf.line(
      `Owner: ${p.owner || "Unassigned"} | Due: ${p.due || "Not set"}`,
      9,
    );
    if (p.notes) pdf.line(`Notes: ${p.notes}`);
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
  for (const [key, label] of financeFields)
    pdf.line(`${label}: ${plan.values[key].toLocaleString("en-US")}`);
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
  pdf.line("Model notes", 14, true);
  pdf.line(
    "Startup costs are paid before opening. Available funding is received upfront. Volume ramps linearly; provider count and monthly costs remain constant. Collections lag by whole months. Variable costs follow cash collections. Owner/provider compensation and payroll burden are included.",
  );
  pdf.line(
    "Excludes taxes, depreciation, inflation, seasonal changes, later capital purchases, and later funding. Opening receivables are zero. Additional funding covers only the modeled shortfall, with no extra reserve. Review with your advisers.",
  );
  pdf.line("Planning framework: sba.gov/counseling/plan-your-business/");
  pdf.finish("practice-startup-pro-forma.pdf");
}
