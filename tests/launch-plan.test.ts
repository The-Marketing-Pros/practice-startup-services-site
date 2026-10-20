import test from "node:test";
import assert from "node:assert/strict";
import { newFinance, parseFinance, project, forecastDecisions } from "../src/lib/planners/finance.ts";
import { newChecklist, nextTasks, relatedOpenTasks, visibleTasks, parseChecklist } from "../src/lib/planners/checklist.ts";
import { financeWorkbook, checklistWorkbook } from "../src/lib/planners/downloads.ts";

function cashCase() {
  const p = newFinance();
  Object.assign(p.values, { legal: 0, buildout: 0, equipment: 0, setup: 0, enrollment: 0,
    preopening: 0, preMonths: 0, contingency: 0, providers: 1, visits: 1, days: 20,
    netPerVisit: 100, initial: 100, ramp: 1, lag: 2, providerPay: 1000, staffPay: 0,
    benefits: 0, rent: 0, software: 0, insurance: 0, marketing: 0, other: 0,
    variable: 0, debt: 0, funding: 1500, reserve: 500 });
  return p;
}

test("reserve is a cash target, not an expense; shortfall timing includes opening", () => {
  const p = cashCase();
  const r = project(p);
  assert.equal(r.months[0].balance, 500);
  assert.equal(r.months[1].balance, -500);
  assert.equal(r.months[2].balance, 500);
  assert.equal(r.firstShortfall, 2);
  assert.equal(r.firstBelowReserve, 2);
  assert.equal(r.lowestCashMonth, 2);
  assert.equal(r.fundingGap, 500);
  assert.equal(r.reserveGap, 1000);
  assert.equal(r.requiredFunding, 2500);
  assert.equal(r.breakEvenVisits, .5);
  p.values.reserve = 0;
  assert.deepEqual(project(p).months, r.months);
  p.values.reserve = 2000;
  assert.equal(project(p).firstBelowReserve, 0);
  p.values.reserve = 500; p.values.funding = 10000;
  assert.equal(project(p).reserveGap, 0);
  assert.equal(project(p).requiredFunding, 2500);
});

test("old backups preserve cash results and receive a neutral reserve; invalid reserve is rejected", () => {
  const p = cashCase();
  const raw = JSON.parse(JSON.stringify(p));
  delete raw.values.reserve;
  assert.equal(parseFinance(raw).values.reserve, 0);
  assert.deepEqual(project(parseFinance(raw)).months, project(p).months);
  raw.values.reserve = -1;
  assert.throws(() => parseFinance(raw));
});

test("break-even uses blended collections, owner compensation and debt, and exposes undefined cases", () => {
  const p = cashCase();
  p.mix!.enabled = true;
  for (const payer of Object.values(p.mix!.payers)) payer.net = 200;
  p.values.variable = 50; p.values.debt = 1000;
  assert.equal(project(p).breakEvenVisits, 1);
  p.values.days = 0;
  assert.equal(project(p).breakEvenVisits, null);
  assert.match(forecastDecisions(p).join(" "), /cannot be calculated/);
  p.values.days = 20; p.values.variable = 100;
  assert.equal(project(p).breakEvenVisits, null);
});

test("next actions respect unfinished related work and preserve saved progress", () => {
  const p = newChecklist();
  const today = new Date("2026-10-20T12:00:00Z");
  p.profile.opening = "2027-06-01";
  const budget = visibleTasks(p).find(t => t.id === "task-6")!;
  assert.deepEqual(relatedOpenTasks(p, budget).map(t => t.id), ["task-1"]);
  assert.ok(!nextTasks(p, today, 100).some(t => t.id === "task-6"));
  p.progress["task-1"] = { done: true, owner: "Founder", due: "2026-10-01", notes: "Keep this note" };
  assert.ok(nextTasks(p, today, 100).some(t => t.id === "task-6"));
  const before = structuredClone(p);
  nextTasks(p, today);
  assert.deepEqual(p, before);
  assert.deepEqual(parseChecklist(p).progress, before.progress);
  p.profile.payer = "cash";
  const readiness = visibleTasks(p).find(t => t.id === "task-32")!;
  assert.ok(!relatedOpenTasks(p, readiness).some(t => t.id === "task-18"));
  for (const t of visibleTasks(p)) p.progress[t.id] = { done: true, owner: "", due: null, notes: "" };
  assert.deepEqual(nextTasks(p, today), []);
});

test("new financial decisions and task instructions survive workbook serialization", async () => {
  const p = cashCase();
  const w = await financeWorkbook(p);
  assert.equal(w.worksheets[0].name, "Summary");
  assert.equal(w.getWorksheet("Summary")!.getCell("B20").result, 1000);
  assert.equal(w.getWorksheet("Summary")!.getCell("B21").result, .5);
  assert.equal(w.getWorksheet("Summary")!.getCell("B22").result, 2500);
  const { default: ExcelJS } = await import("exceljs");
  const reopened = new ExcelJS.Workbook();
  await reopened.xlsx.load(await w.xlsx.writeBuffer());
  assert.equal(reopened.getWorksheet("Summary")!.getCell("B20").formula, "MAX(0,B19-B12)");
  const checklist = await checklistWorkbook(newChecklist());
  const sheet = checklist.getWorksheet("Startup checklist")!;
  assert.equal(sheet.getCell("L7").value, "Done when");
  assert.match(String(sheet.getCell("M8").value), /patients and services/);
});
