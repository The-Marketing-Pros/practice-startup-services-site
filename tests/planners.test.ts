import test from "node:test";
import assert from "node:assert/strict";
import {
  newFinance,
  project,
  validateFinance,
  parseFinance,
} from "../src/lib/planners/finance.ts";
import {
  newChecklist,
  visibleTasks,
  parseChecklist,
  validDate,
  suggestedDate,
  taskProgress,
} from "../src/lib/planners/checklist.ts";
test("cash forecast reconciles collections, receivables, expenses, debt and opening costs", () => {
  const p = newFinance();
  Object.assign(p.values, {
    providers: 1,
    visits: 10,
    days: 20,
    netPerVisit: 100,
    initial: 100,
    ramp: 1,
    lag: 2,
    funding: 100000,
    legal: 1000,
    buildout: 0,
    equipment: 0,
    setup: 0,
    enrollment: 0,
    preopening: 0,
    contingency: 10,
    providerPay: 5000,
    staffPay: 1000,
    benefits: 10,
    rent: 1000,
    software: 100,
    insurance: 200,
    marketing: 100,
    other: 0,
    variable: 5,
    debt: 1000,
  });
  const r = project(p);
  assert.equal(r.startup, 1100);
  assert.equal(r.openingCash, 98900);
  assert.ok(Math.abs(r.fixed - 8000) < 1e-7);
  assert.equal(r.months[0].collected, 0);
  assert.equal(r.months[1].collected, 0);
  assert.equal(r.months[2].collected, 20000);
  assert.ok(Math.abs(r.months[2].netCash - 10000) < 1e-7);
  assert.equal(r.endingReceivables, 40000);
  assert.equal(r.totalCollections, 440000);
  assert.ok(Math.abs(r.months[23].balance - 300900) < 1e-7);
  assert.equal(r.cashPositiveMonth, 3);
});
test("zero visits and no collections show shortfall including upfront costs", () => {
  const p = newFinance();
  p.values.visits = 0;
  p.values.funding = 0;
  const r = project(p);
  assert.equal(r.totalCollections, 0);
  assert.equal(r.cashPositiveMonth, null);
  assert.equal(r.fundingGap, r.startup + 24 * (r.fixed + p.values.debt));
});
test("cash month zero and one-month ramp are handled explicitly", () => {
  const p = newFinance();
  p.values.lag = 0;
  p.values.ramp = 1;
  const r = project(p);
  assert.equal(r.months[0].utilization, 1);
  assert.equal(r.months[0].earned, r.months[0].collected);
  assert.equal(r.endingReceivables, 0);
  assert.ok(r.lowestCash <= r.openingCash);
});
test("linear ramp reaches full volume on selected month", () => {
  const p = newFinance();
  p.values.initial = 25;
  p.values.ramp = 4;
  const r = project(p);
  assert.deepEqual(
    r.months.slice(0, 5).map((m) => m.utilization),
    [0.25, 0.5, 0.75, 1, 1],
  );
});
test("invalid, missing and nonfinite assumptions fail closed", () => {
  for (const value of [NaN, Infinity, -1, 7, 0.5]) {
    const p = newFinance();
    p.values.lag = value;
    assert.ok(validateFinance(p).length);
    assert.throws(() => project(p));
  }
  const p = newFinance();
  p.opening = "2026-13";
  assert.throws(() => parseFinance(p));
  assert.throws(() => parseFinance({ version: 1, kind: "proforma" }));
});
test("calendar rolls into subsequent years", () => {
  const p = newFinance();
  p.opening = "2026-12";
  assert.equal(project(p).months[1].label, "Jan 27");
});
test("profile filters tasks without destroying saved progress", () => {
  const p = newChecklist();
  const insurance = visibleTasks(p).find((t) => t.when === "insurance")!;
  p.progress[insurance.id] = {
    done: true,
    owner: "Owner",
    due: "2027-03-04",
    notes: "Keep this",
  };
  p.profile.payer = "cash";
  p.profile.setting = "telehealth";
  p.profile.staff = "no";
  assert.ok(
    !visibleTasks(p).some(
      (t) =>
        t.when === "insurance" || t.when === "office" || t.when === "staff",
    ),
  );
  p.profile.payer = "insurance";
  assert.equal(taskProgress(p, insurance).notes, "Keep this");
  p.profile.provider = "np";
  assert.ok(visibleTasks(p).some((t) => t.when === "np-pa"));
});
test("suggested dates use calendar arithmetic without timezone drift", () => {
  assert.equal(suggestedDate("2028-03-01", 1), "2028-02-23");
  assert.equal(suggestedDate("2028-03-01", -1), "2028-03-08");
  for (const value of ["2026-02-30", "2026-13-01", "2026-00-01", "not-date"])
    assert.equal(validDate(value), false);
});
test("backup validation strips unknown fields and rejects bad custom tasks", () => {
  const p = newChecklist();
  const parsed = parseChecklist({
    ...p,
    unknown: "ignored",
    progress: JSON.parse('{"__proto__":{"done":true}}'),
  });
  assert.deepEqual(parsed.progress, {});
  assert.equal(Object.getPrototypeOf(parsed.progress), Object.prototype);
  p.custom = [
    { id: "custom-ok", title: "Task", phase: 1, detail: "x", weeks: 0 },
  ];
  assert.equal(parseChecklist(p).custom.length, 1);
  p.custom.push(p.custom[0]);
  assert.throws(() => parseChecklist(p));
  assert.throws(() => parseChecklist({ version: 1, kind: "checklist" }));
});

test("suggested due dates follow opening changes until explicitly edited", () => {
  const p = newChecklist();
  const t = visibleTasks(p)[0];
  p.profile.opening = "2027-06-01";
  p.progress[t.id] = { done: true, owner: "A", notes: "", due: null };
  const before = taskProgress(p, t).due;
  p.profile.opening = "2027-07-01";
  assert.notEqual(taskProgress(p, t).due, before);
  p.progress[t.id].due = "2027-01-01";
  p.profile.opening = "2027-08-01";
  assert.equal(taskProgress(p, t).due, "2027-01-01");
});
