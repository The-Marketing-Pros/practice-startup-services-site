import test from "node:test";
import assert from "node:assert/strict";
import {
  newChecklist,
  visibleTasks,
  parseChecklist,
  anchorDate,
  priorityTasks,
  taskProgress,
  tasks,
  type Checklist,
} from "../src/lib/planners/checklist.ts";
import { stateForZip } from "../src/lib/startup/zip3.ts";

const TODAY = new Date("2026-10-10T12:00:00Z");
function plan(profile: Partial<Checklist["profile"]>): Checklist {
  const p = newChecklist();
  Object.assign(p.profile, profile);
  return p;
}
const ids = (p: Checklist) => visibleTasks(p).map((t) => t.id);

test("specialty adds and removes specialty-specific tasks", () => {
  const psych = ids(plan({ specialty: "psychiatry" }));
  const ortho = ids(plan({ specialty: "orthopedics" }));
  assert.ok(psych.includes("p-sp-crisis") && psych.includes("p-sp-controlled") && psych.includes("p-sp-sessions"));
  assert.ok(!psych.includes("p-sp-imaging") && !psych.includes("p-privileges"));
  assert.ok(ortho.includes("p-sp-imaging") && ortho.includes("p-privileges") && ortho.includes("p-sp-procedures"));
  assert.ok(!ortho.includes("p-sp-crisis"));
  // Therapists do not get controlled-substance registration even in behavioral health.
  assert.ok(!ids(plan({ specialty: "psychiatry", provider: "therapist" })).includes("p-sp-controlled"));
});

test("ZIP infers the state and state-specific actions name it; explicit state wins", () => {
  assert.deepEqual(stateForZip("32073"), { code: "FL", name: "Florida" });
  assert.equal(stateForZip("59301")?.name, "Montana");
  assert.equal(stateForZip("00901"), null); // Puerto Rico is outside the planner's states.
  const fl = visibleTasks(plan({ zip: "32073" }));
  assert.match(fl.find((t) => t.id === "p-state-license")!.title, /Florida/);
  assert.match(fl.find((t) => t.id === "p-state-entity")!.title, /Florida's business filing office/);
  const explicit = visibleTasks(plan({ zip: "32073", state: "Georgia" }));
  assert.match(explicit.find((t) => t.id === "p-state-license")!.title, /Georgia/);
  assert.ok(!ids(plan({})).some((id) => id.startsWith("p-state")), "no state, no state tasks");
  // Board wording follows provider type.
  assert.match(visibleTasks(plan({ zip: "32073", provider: "np" })).find((t) => t.id === "p-state-license")!.detail, /Florida board of nursing/);
});

test("payer mix adds Medicare and Medicaid enrollment; cash-pay swaps in a Medicare status decision", () => {
  const medicaid = visibleTasks(plan({ zip: "59301", mix: "medicaid" }));
  assert.ok(medicaid.some((t) => t.id === "p-state-medicaid" && /Montana Medicaid/.test(t.title)));
  assert.ok(!medicaid.some((t) => t.id === "p-medicare"));
  const medicare = visibleTasks(plan({ mix: "medicare" }));
  const pecos = medicare.find((t) => t.id === "p-medicare")!;
  assert.equal(pecos.link?.url, "https://pecos.cms.hhs.gov/");
  assert.ok(!medicare.some((t) => t.id === "p-state-medicaid"));
  const cash = ids(plan({ payer: "cash", mix: "both" }));
  assert.ok(!cash.includes("p-medicare") && !cash.includes("p-state-medicaid") && !cash.includes("task-15"));
  assert.ok(cash.includes("p-medicare-status"));
});

test("practice model adds model-specific tasks", () => {
  assert.ok(ids(plan({ model: "group" })).includes("p-model-agreement"));
  assert.ok(ids(plan({ model: "group" })).includes("p-model-group-enroll"));
  assert.ok(ids(plan({ model: "membership" })).includes("p-model-membership"));
  assert.ok(ids(plan({ model: "hospital" })).includes("p-model-affiliation"));
  assert.ok(ids(plan({ model: "solo" })).includes("p-model-coverage"));
});

test("launch stage removes tasks, reorders phases by lead time and anchors dates", () => {
  const exploring = visibleTasks(plan({ stage: "exploring" }));
  assert.ok(!exploring.some((t) => t.phase === 6), "growth tasks wait until later");
  assert.ok(exploring.some((t) => t.id === "p-stage-talk"));
  const opening = plan({ stage: "opening" });
  const openIds = ids(opening);
  for (const id of ["task-1", "task-2", "task-4"]) assert.ok(!openIds.includes(id));
  assert.ok(openIds.includes("task-3"), "employment obligations stay");
  // Within each phase, longest lead time first.
  const phase3 = visibleTasks(opening).filter((t) => t.phase === 3).map((t) => t.weeks);
  assert.deepEqual(phase3, [...phase3].sort((a, b) => b - a));
  const planning = visibleTasks(plan({ stage: "planning" })).filter((t) => t.phase === 3).map((t) => t.id);
  assert.deepEqual(planning.slice(0, 2), ["task-14", "task-15"], "default order is preserved before late stages");
  // Anchors: explicit date wins; stages imply a window from today.
  assert.deepEqual(anchorDate(plan({ stage: "planning" }).profile, TODAY), { date: "2027-10-10", assumed: true });
  assert.deepEqual(anchorDate(plan({ stage: "soon" }).profile, TODAY), { date: "2027-04-10", assumed: true });
  assert.deepEqual(anchorDate(plan({ stage: "soon", opening: "2027-01-15" }).profile, TODAY), { date: "2027-01-15", assumed: false });
  assert.deepEqual(anchorDate(plan({ stage: "exploring" }).profile, TODAY), { date: "", assumed: false });
  // Opening now: long-lead tasks are already overdue and listed first.
  const first = priorityTasks(opening, TODAY);
  assert.ok(first.length > 0);
  assert.ok(first.every((t) => t.phase >= 2), "late stages reserve the lane for outside lead times");
  // "Soon" with no date assumes about 26 weeks: no outside-lead step is overdue yet.
  assert.equal(priorityTasks(plan({ stage: "soon", zip: "59301", mix: "medicaid" }), TODAY).length, 0);
  const soonFirst = priorityTasks(plan({ stage: "soon", zip: "59301", mix: "medicaid", opening: "2026-12-15" }), TODAY);
  assert.ok(soonFirst.length > 0 && soonFirst.every((t) => t.phase >= 2));
  assert.equal(soonFirst[0].weeks, 24, "longest outside lead time first");
  assert.ok(soonFirst.some((t) => t.id === "p-state-license"));
  // Without a late stage, any overdue task can appear (here: a date in the near term).
  assert.ok(priorityTasks(plan({ opening: "2026-12-01" }), TODAY).some((t) => t.phase === 0));
  assert.deepEqual(first.map((t) => t.weeks), [...first.map((t) => t.weeks)].sort((a, b) => b - a));
  assert.equal(priorityTasks(plan({ stage: "planning", opening: "2028-06-01" }), TODAY).length, 0);
  // Suggested due dates follow the stage anchor until the visitor sets a date.
  const t = visibleTasks(opening).find((x) => x.id === "task-3")!;
  assert.equal(taskProgress(opening, t, TODAY).due, "2026-04-13"); // anchor 2026-11-09 minus 30 weeks
});

test("contrasting founders get materially different plans", () => {
  const np = plan({ provider: "np", specialty: "behavioral-health", zip: "59301", model: "solo", setting: "hybrid", payer: "insurance", mix: "medicaid", stage: "soon" });
  const md = plan({ provider: "physician", specialty: "orthopedics", zip: "10016", model: "group", setting: "office", payer: "insurance", mix: "commercial", stage: "exploring" });
  const a = new Set(ids(np));
  const b = new Set(ids(md));
  const onlyA = [...a].filter((x) => !b.has(x));
  const onlyB = [...b].filter((x) => !a.has(x));
  assert.ok(onlyA.length >= 6, `NP plan unique tasks: ${onlyA}`);
  assert.ok(onlyB.length >= 6, `MD plan unique tasks: ${onlyB}`);
  assert.match(visibleTasks(np).find((t) => t.id === "p-state-license")!.title, /Montana/);
  assert.match(visibleTasks(md).find((t) => t.id === "p-state-license")!.title, /New York/);
  assert.ok(a.has("task-10"), "NP scope-of-practice task");
  assert.ok(!b.has("task-10"));
});

test("legacy backups without new fields parse with neutral defaults and an unchanged task list", () => {
  const legacy = {
    version: 1,
    kind: "checklist",
    profile: { name: "Old plan", state: "", provider: "physician", setting: "office", payer: "insurance", opening: "", staff: "yes" },
    progress: { "task-8": { done: true, owner: "Me", due: null, notes: "" } },
    custom: [],
  };
  const parsed = parseChecklist(legacy);
  assert.equal(parsed.profile.specialty, "");
  assert.equal(parsed.profile.stage, "");
  const before = tasks.filter((t) => !t.when || { insurance: true, office: true, telehealth: false, staff: true, "np-pa": false }[t.when]).map((t) => t.id);
  assert.deepEqual(ids(parsed), before);
  assert.equal(parsed.progress["task-8"].done, true);
});

test("progress on personalized tasks survives backup round trips; bad new fields are rejected", () => {
  const p = plan({ zip: "32073", specialty: "pediatrics" });
  p.progress["p-state-license"] = { done: true, owner: "Dr. A", due: "2027-01-01", notes: "Renewal due" };
  p.progress["p-sp-vaccines"] = { done: false, owner: "", due: null, notes: "Call program" };
  const back = parseChecklist(JSON.parse(JSON.stringify(p)));
  assert.deepEqual(back.progress["p-state-license"], p.progress["p-state-license"]);
  assert.equal(back.progress["p-sp-vaccines"].notes, "Call program");
  for (const bad of [{ zip: "1234" }, { specialty: "not-a-specialty" }, { stage: "someday" }, { model: "franchise" }, { mix: "everything" }])
    assert.throws(() => parseChecklist({ ...p, profile: { ...p.profile, ...bad } }));
});

test("checklist Excel export adds why-this-is-here and official-source columns", async () => {
  const { checklistWorkbook } = await import("../src/lib/planners/downloads.ts");
  const p = plan({ zip: "32073", mix: "medicare", specialty: "family-medicine", stage: "planning" });
  const w = await checklistWorkbook(p);
  const s = w.getWorksheet("Startup checklist")!;
  assert.equal(s.getCell("J7").value, "Why this is on your plan");
  const row = visibleTasks(p).findIndex((t) => t.id === "p-medicare") + 8;
  assert.equal(s.getCell(`J${row}`).value, "Your payer mix includes Medicare.");
  assert.equal(s.getCell(`K${row}`).hyperlink, "https://pecos.cms.hhs.gov/");
  assert.match(String(s.getCell("A3").value), /Family medicine/);
  assert.match(String(s.getCell("A4").value), /assume opening around/);
});
