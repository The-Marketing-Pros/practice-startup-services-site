import test from "node:test";
import assert from "node:assert/strict";
import { validateBrief, numbersIn, allowedFor, citableIds } from "../src/lib/research/guard.ts";
import { briefInputs, briefSchema, BRIEF_HEADINGS } from "../src/lib/research/brief.ts";
import { sampleFacts, GOOD_BRIEF, PROFILE } from "./fixtures/brief.ts";

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const reasons = (r: ReturnType<typeof validateBrief>) => (r.ok ? [] : r.reasons);
type Kind = "fact" | "estimate" | "interpretation";

/** Validate a brief whose third section holds one test statement. */
async function verdict(text: string, kind: Kind = "interpretation", refs: string[] = []) {
  const facts = await sampleFacts();
  const b = clone(GOOD_BRIEF);
  b.sections[2].statements = [{ text, kind, refs }];
  return reasons(validateBrief(b, facts, briefInputs(PROFILE, facts)));
}

test("number extraction normalizes thousands separators, currency and percent", () => {
  assert.deepEqual(numbersIn("$142,350 and 15.4% of 54,321 people in 10016."), [142350, 15.4, 54321, 10016]);
});

test("accepts a brief whose numbers come from the items each statement cites", async () => {
  const facts = await sampleFacts();
  const r = validateBrief(GOOD_BRIEF, facts, briefInputs(PROFILE, facts));
  assert.deepEqual(reasons(r), []);
});

test("reviewer probes that previously passed are now rejected", async () => {
  const probes: Array<[string, Kind, string[], RegExp]> = [
    ["About 90% of new practices here break even within 5 years.", "interpretation", [], /number:90%|number:5/],
    ["About 90% of new practices here break even within 5 years.", "fact", ["acs_age65_pct"], /number:90%/],
    ["Roughly 3 in 5 residents lack a primary care doctor.", "interpretation", [], /quantity_phrase|number:3/],
    ["Local demand grew 200% since 2020.", "interpretation", [], /number:200%|number:2020/],
    ["Local demand grew 200% since 2020.", "fact", ["nppes_city_count"], /number:200%|number:2020/],
    ["Plan for １２ new patients a week.", "interpretation", [], /non_ascii_digit/],
    ["Consider census.gov/data for more detail.", "interpretation", [], /forbidden/],
  ];
  for (const [text, kind, refs, expect] of probes) {
    const r = await verdict(text, kind, refs);
    assert.ok(r.some((x) => expect.test(x)), `${text} (${kind}) -> ${r.join(",")}`);
  }
});

test("caveats, source names, vintages and the ZIP are never a number source", async () => {
  for (const text of [
    "Margins use 90 percent confidence.",
    "The ACS 5-year survey covers the area.",
    "Data covers 2020-2024.",
    "Tables DP03 and DP05 apply.",
    "The registry returns 200 records per search.",
    "The API is version 2.1.",
    "About 10016 residents live here.",
  ])
    assert.ok((await verdict(text, "fact", ["acs_population"])).some((x) => /number:|quantity_phrase/.test(x)), text);
  // A fact may only use numbers from the items it cites (not other facts).
  assert.ok((await verdict("The median household income is $142,350.", "fact", ["acs_population"])).some((x) => x.startsWith("s2.0:number:142350")));
  assert.deepEqual(await verdict("The median household income is $142,350.", "fact", ["acs_median_income"]), []);
});

test("% and $ must sit next to numbers from percent or dollar items", async () => {
  assert.ok((await verdict("There are 54,321% more residents.", "fact", ["acs_population"])).some((x) => x.includes("number:54321%")));
  assert.ok((await verdict("Income is $15.4 here.", "fact", ["acs_age65_pct"])).some((x) => x.includes("number:15.4")));
  assert.deepEqual(await verdict("About 15.4% of residents are 65 or older (margin of error 1.1 points).", "fact", ["acs_age65_pct"]), []);
});

test("interpretations carry no numbers except echoes of the visitor's inputs", async () => {
  assert.deepEqual(await verdict("Before signing a lease near ZIP 10016, confirm referral patterns with local surgeons.", "interpretation", []), []);
  assert.ok((await verdict("Aim to see 54,321 residents.", "interpretation", [])).some((x) => x.includes("number:54321")));
  // The stage label is an input echo only when the visitor chose it.
  const facts = await sampleFacts();
  const b = clone(GOOD_BRIEF);
  b.sections[2].statements = [{ text: "Because you are opening within 6 months, start payer enrollment now.", kind: "interpretation", refs: [] }];
  assert.ok(reasons(validateBrief(b, facts, briefInputs(PROFILE, facts))).some((x) => x.includes("number:6")), "PROFILE stage is exploring");
  const soon = { ...PROFILE, stage: "soon" };
  assert.deepEqual(reasons(validateBrief(b, facts, briefInputs(soon, facts))), []);
});

test("ordinary planning language passes; quantity phrases are rejected", async () => {
  for (const ok of [
    "Ask third-party payers how they credential new practices.",
    "Have every application double-checked before you submit it.",
    "Ask which quarter each payer reviews new applications.",
    "A majority decision among partners should be written into the owners' agreement.",
    "Talk with two or three referral sources before choosing a location.",
  ])
    assert.deepEqual(await verdict(ok), [], ok);
  for (const bad of [
    "A third of residents are older adults.",
    "The majority of residents have commercial coverage.",
    "Half of the local population is insured.",
    "One in four residents is uninsured.",
    "Thousands of patients may need care.",
    "Demand doubled recently.",
    "Twenty residents per provider is typical.",
  ])
    assert.ok((await verdict(bad)).some((x) => x.endsWith("quantity_phrase")), bad);
});

test("refs must be citable items; facts cite facts and estimates cite an estimate", async () => {
  assert.ok((await verdict("Census estimates 54,321 residents.", "fact", [])).includes("s2.0:fact_refs"));
  assert.ok((await verdict("Census estimates 54,321 residents.", "fact", ["wikipedia"])).includes("s2.0:ref_unknown"));
  assert.ok((await verdict("An estimate of 13,580 residents per provider.", "estimate", ["acs_population"])).includes("s2.0:estimate_refs"));
  assert.deepEqual(await verdict("An estimate of 13,580 residents per matching provider.", "estimate", ["est_residents_per_provider"]), []);
  // A fact whose section failed is not citable.
  const facts = await sampleFacts();
  const noAcs = clone(facts);
  noAcs.sections.acs = { status: "error", message: "down" };
  noAcs.facts = noAcs.facts.filter((f) => f.sourceId !== "acs");
  assert.ok(reasons(validateBrief(GOOD_BRIEF, noAcs, {})).includes("s0.0:ref_unknown"));
  const kind = clone(GOOD_BRIEF);
  (kind.sections[1].statements[0] as { kind: string }).kind = "opinion";
  assert.ok(reasons(validateBrief(kind, facts, {})).includes("s1.0:kind"));
});

test("structure is enforced", async () => {
  const facts = await sampleFacts();
  assert.deepEqual(reasons(validateBrief({}, facts, {})), ["structure"]);
  assert.ok(reasons(validateBrief({ sections: [GOOD_BRIEF.sections[0]] }, facts, {})).includes("section_count"));
  const noRefs = clone(GOOD_BRIEF) as any;
  delete noRefs.sections[0].statements[0].refs;
  assert.ok(reasons(validateBrief(noRefs, facts, {})).includes("s0.0:refs"));
});

test("allowed numbers come only from cited items", async () => {
  const facts = await sampleFacts();
  const nums = allowedFor(["nppes_zip_count"], facts).map((a) => a.n);
  assert.deepEqual([...new Set(nums)], [4]);
});

test("structured-output schema restricts headings and refs to citable ids", async () => {
  const facts = await sampleFacts();
  const schema = briefSchema(citableIds(facts)) as any;
  const item = schema.properties.sections.items;
  assert.deepEqual(item.properties.heading.enum, BRIEF_HEADINGS);
  assert.deepEqual(item.properties.statements.items.properties.refs.items.enum, ["acs_population", "acs_age65_pct", "acs_uninsured_pct", "acs_median_income", "nppes_zip_count", "nppes_city_count", "est_residents_per_provider"]);
  assert.equal(schema.additionalProperties, false);
});
