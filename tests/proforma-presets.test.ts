import test from "node:test";
import assert from "node:assert/strict";
import {
  newFinance,
  project,
  validateFinance,
  parseFinance,
  blendedNet,
  preOpeningOverhead,
  effectiveNetPerVisit,
} from "../src/lib/planners/finance.ts";
import { buildPreset, applyPreset, stagePreMonths, type PresetInput } from "../src/lib/planners/presets.ts";

const base: PresetInput = { specialty: "family-medicine", model: "solo", setting: "office", payerMix: "unsure", stage: "planning", zip: "" };

test("blended net collections = sum(share x net) and feeds revenue only when enabled", () => {
  const p = newFinance();
  p.mix!.payers = {
    commercial: { share: 50, net: 120 },
    medicare: { share: 25, net: 100 },
    medicaid: { share: 15, net: 65 },
    selfpay: { share: 10, net: 90 },
  };
  assert.equal(blendedNet(p.mix!), 0.5 * 120 + 0.25 * 100 + 0.15 * 65 + 0.1 * 90); // 103.75
  p.values.netPerVisit = 120;
  p.mix!.enabled = false;
  const off = project(p);
  assert.equal(off.netPerVisit, 120);
  p.mix!.enabled = true;
  const on = project(p);
  assert.equal(on.netPerVisit, 103.75);
  assert.ok(Math.abs(on.months[23].earned - on.months[23].visits * 103.75) < 1e-6);
  assert.ok(on.months[23].earned < off.months[23].earned);
  assert.equal(effectiveNetPerVisit(p), 103.75);
});

test("payer shares must total 100% when the mix is used; bad payer values fail closed", () => {
  const p = newFinance();
  p.mix!.enabled = true;
  p.mix!.payers.commercial.share = 60; // total 110
  assert.match(validateFinance(p).join(" "), /add up to 100%/);
  assert.throws(() => project(p));
  p.mix!.enabled = false; // ignored while off
  assert.equal(validateFinance(p).length, 0);
  p.mix!.payers.medicare.net = NaN;
  assert.ok(validateFinance(p).length);
});

test("legacy backups without payer mix or pre-opening months reproduce the original forecast", () => {
  const p = newFinance();
  const legacy = JSON.parse(JSON.stringify({ version: 1, kind: "proforma", name: p.name, opening: p.opening, values: p.values }));
  delete legacy.values.preMonths;
  const parsed = parseFinance(legacy);
  assert.equal(parsed.values.preMonths, 0);
  assert.equal(parsed.mix!.enabled, false);
  const r = project(parsed);
  assert.equal(r.netPerVisit, p.values.netPerVisit);
  assert.equal(r.preOverhead, 0);
  assert.equal(r.startupBase, p.values.legal + p.values.buildout + p.values.equipment + p.values.setup + p.values.enrollment + p.values.preopening);
});

test("pre-opening months add overhead to startup costs before contingency", () => {
  const p = newFinance();
  const before = project(p);
  p.values.preMonths = 3;
  const after = project(p);
  const overhead = 3 * (p.values.rent + p.values.software + p.values.insurance + p.values.marketing + p.values.other);
  assert.equal(preOpeningOverhead(p.values), overhead);
  assert.equal(after.startupBase - before.startupBase, overhead);
  assert.ok(Math.abs(after.startup - before.startup - overhead * (1 + p.values.contingency / 100)) < 1e-6);
  p.values.preMonths = 1.5;
  assert.ok(validateFinance(p).some((e) => /whole numbers/.test(e)));
});

test("presets change with specialty, model, setting, payer mix and stage", () => {
  const psych = buildPreset({ ...base, specialty: "psychiatry" });
  const ortho = buildPreset({ ...base, specialty: "orthopedics" });
  assert.notEqual(psych.values.visits, ortho.values.visits);
  assert.ok(ortho.values.equipment! > psych.values.equipment!);
  assert.equal(buildPreset({ ...base, model: "group" }).values.providers, 3);
  const dpc = buildPreset({ ...base, model: "membership" });
  assert.equal(dpc.mix.payers.selfpay.share, 100);
  assert.equal(dpc.mix.payers.commercial.share, 0);
  assert.equal(buildPreset({ ...base, setting: "telehealth" }).values.rent, 500);
  assert.equal(buildPreset({ ...base, payerMix: "medicaid" }).mix.payers.medicaid.share, 50);
  assert.equal(buildPreset({ ...base, payerMix: "cash" }).mix.payers.selfpay.share, 100);
  for (const [stage, months] of Object.entries(stagePreMonths)) assert.equal(buildPreset({ ...base, stage }).values.preMonths, months);
  for (const preset of [psych, ortho, dpc]) {
    const total = Object.values(preset.mix.payers).reduce((s, x) => s + x.share, 0);
    assert.equal(total, 100);
    assert.ok(preset.notes[0].includes("not benchmarks or local data"));
  }
});

test("ZIP only labels a preset; it never changes a cost", () => {
  const a = buildPreset({ ...base, zip: "10016" });
  const b = buildPreset({ ...base, zip: "59301" });
  assert.deepEqual(a.values, b.values);
  assert.deepEqual(a.mix, b.mix);
  assert.equal(a.context.state, "New York");
  assert.equal(b.context.state, "Montana");
  assert.ok(a.notes.some((n) => /does not set any cost/.test(n)));
});

test("applying a preset keeps name and opening, marks starting assumptions, and stays valid", () => {
  const p = newFinance();
  p.name = "Riverside Family Care";
  p.opening = "2027-03";
  const applied = applyPreset(p, { ...base, specialty: "pediatrics", payerMix: "both", stage: "soon", zip: "32073" });
  assert.equal(applied.name, "Riverside Family Care");
  assert.equal(applied.opening, "2027-03");
  assert.equal(applied.mix!.enabled, true);
  assert.ok(applied.context!.presetFields.includes("visits"));
  assert.ok(applied.context!.presetFields.includes("mix-medicaid-net"));
  assert.deepEqual(validateFinance(applied), []);
  const round = parseFinance(JSON.parse(JSON.stringify(applied)));
  assert.deepEqual(round.context, applied.context);
  assert.equal(project(round).netPerVisit, blendedNet(applied.mix!));
});

test("Excel export uses a live blended-rate formula that reconciles with the model", async () => {
  const { financeWorkbook } = await import("../src/lib/planners/downloads.ts");
  const p = applyPreset(newFinance(), { ...base, specialty: "dermatology", payerMix: "medicare", stage: "exploring" });
  p.opening = "2027-01";
  const expected = project(p);
  const w = await financeWorkbook(p);
  const a = w.getWorksheet("Assumptions")!;
  let blendedRow = 0;
  a.eachRow((row, n) => {
    if (String(row.getCell(1).value).startsWith("Net collections per visit used by the model")) blendedRow = n;
  });
  assert.ok(blendedRow > 0);
  const cell = a.getCell(`B${blendedRow}`);
  assert.match(String(cell.formula), /^IF\(Assumptions!\$B\$\d+=1,\(.+\)\/100,Assumptions!\$B\$\d+\)$/);
  assert.equal(cell.result, expected.netPerVisit);
  const m = w.getWorksheet("Monthly forecast")!;
  assert.match(String(m.getCell("E8").formula), new RegExp(`Assumptions!\\$B\\$${blendedRow}`));
  for (const month of expected.months) assert.equal(m.getCell(`E${month.month + 7}`).result, month.earned);
  const s = w.getWorksheet("Summary")!;
  assert.equal(s.getCell("B17").result, expected.netPerVisit);
  assert.equal(s.getCell("B18").result, expected.preOverhead);
  assert.match(String(s.getCell("B8").formula), /\*\(/, "startup formula includes pre-opening overhead");
  assert.equal(s.getCell("B13").result, expected.fundingGap);
  assert.match(String(a.getCell("A6").value), /Starting assumptions from: Dermatology/);
});
