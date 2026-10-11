import test from "node:test";
import assert from "node:assert/strict";
import { validateBrief, numbersIn, allowedNumbers, groundingView } from "../src/lib/research/guard.ts";
import { briefInputs, briefSchema, BRIEF_HEADINGS } from "../src/lib/research/brief.ts";
import { sampleFacts, GOOD_BRIEF, PROFILE } from "./fixtures/brief.ts";

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const reasons = (r: ReturnType<typeof validateBrief>) => (r.ok ? [] : r.reasons);

test("number extraction normalizes thousands separators, currency and percent", () => {
  assert.deepEqual(numbersIn("$142,350 and 15.4% of 54,321 people in 10016."), [142350, 15.4, 54321, 10016]);
});

test("accepts a brief whose numbers all come from the facts (formatting and rounding normalized)", async () => {
  const facts = await sampleFacts();
  const r = validateBrief(GOOD_BRIEF, facts, briefInputs(PROFILE, facts));
  assert.deepEqual(reasons(r), []);
  assert.equal(r.ok, true);
});

test("rejects an invented local statistic even when it is tagged and sourced", async () => {
  const facts = await sampleFacts();
  const bad = clone(GOOD_BRIEF);
  bad.sections[0].statements.push({ text: "About 3,200 residents here need orthopedic care each year.", kind: "fact", sourceIds: ["acs"] });
  assert.ok(reasons(validateBrief(bad, facts, briefInputs(PROFILE, facts))).includes("s0.2:number:3200"));
});

test("timestamps and retrieval dates cannot ground an invented number", async () => {
  const facts = await sampleFacts();
  const allowed = allowedNumbers(groundingView(facts), briefInputs(PROFILE, facts));
  // generatedAt and retrieval dates are 2026-10-10; neither "10" nor "2026" is citable.
  assert.ok(!allowed.includes(10) && !allowed.includes(2026));
  const bad = clone(GOOD_BRIEF);
  bad.sections[2].statements[0].text = "Plan for 10 new patients a week starting in 2026.";
  const r = reasons(validateBrief(bad, facts, briefInputs(PROFILE, facts)));
  assert.ok(r.includes("s2.0:number:10") && r.includes("s2.0:number:2026"));
});

test("rejects spelled-out quantities, URLs and markup", async () => {
  const facts = await sampleFacts();
  for (const [text, code] of [
    ["Nearly half of residents are older adults.", "number_word"],
    ["See https://example.com for more.", "forbidden"],
    ["<b>Important</b> local demand.", "forbidden"],
    ["A few thousand patients may need care.", "number_word"],
  ] as const) {
    const bad = clone(GOOD_BRIEF);
    bad.sections[2].statements[0].text = text;
    assert.ok(reasons(validateBrief(bad, facts, briefInputs(PROFILE, facts))).includes(`s2.0:${code}`), text);
  }
});

test("facts must cite a known source that returned data; interpretations may be unsourced", async () => {
  const facts = await sampleFacts();
  const unsourced = clone(GOOD_BRIEF);
  unsourced.sections[0].statements[0].sourceIds = [];
  assert.ok(reasons(validateBrief(unsourced, facts, {})).includes("s0.0:source_missing"));
  const unknown = clone(GOOD_BRIEF);
  unknown.sections[0].statements[0].sourceIds = ["wikipedia"];
  assert.ok(reasons(validateBrief(unknown, facts, {})).includes("s0.0:source_unknown"));
  const noData = clone(facts);
  noData.sections.acs = { status: "error", message: "down" };
  noData.facts = noData.facts.filter((f) => f.sourceId !== "acs");
  const r = reasons(validateBrief(GOOD_BRIEF, noData, {}));
  assert.ok(r.includes("s0.0:source_no_data"), "a fact cannot cite a section that failed");
  const kind = clone(GOOD_BRIEF);
  (kind.sections[1].statements[0] as { kind: string }).kind = "opinion";
  assert.ok(reasons(validateBrief(kind, facts, {})).includes("s1.0:kind"));
});

test("structure is enforced", async () => {
  const facts = await sampleFacts();
  assert.deepEqual(reasons(validateBrief({}, facts, {})), ["structure"]);
  assert.deepEqual(reasons(validateBrief(null, facts, {})), ["structure"]);
  assert.ok(reasons(validateBrief({ sections: [GOOD_BRIEF.sections[0]] }, facts, {})).includes("section_count"));
});

test("structured-output schema restricts headings and source ids", async () => {
  const facts = await sampleFacts();
  const schema = briefSchema(facts.sources.map((s) => s.id)) as any;
  const item = schema.properties.sections.items;
  assert.deepEqual(item.properties.heading.enum, BRIEF_HEADINGS);
  assert.deepEqual(item.properties.statements.items.properties.sourceIds.items.enum, ["nppes", "acs", "zip3", "derived"]);
  assert.equal(schema.additionalProperties, false);
});
