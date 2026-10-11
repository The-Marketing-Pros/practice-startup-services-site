import test from "node:test";
import assert from "node:assert/strict";
import { validateBrief, interpretationProblems, renderFact, renderEstimate, citableIds } from "../src/lib/research/guard.ts";
import { briefInputs, briefSchema, BRIEF_HEADINGS } from "../src/lib/research/brief.ts";
import { sampleFacts, GOOD_BRIEF, PROFILE } from "./fixtures/brief.ts";

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const reasons = (r: ReturnType<typeof validateBrief>) => (r.ok ? [] : r.reasons);
type Kind = "fact" | "estimate" | "interpretation";

async function run(text: string, kind: Kind = "interpretation", refs: string[] = [], profile = PROFILE) {
  const facts = await sampleFacts();
  const b = clone(GOOD_BRIEF);
  b.sections[2].statements = [{ text, kind, refs }];
  return { facts, r: validateBrief(b, facts, briefInputs(profile, facts)) };
}

const REVIEWER_STRINGS = [
  "Fourteen providers already practice here.",
  "Thirteen surgeons left the area.",
  "Seventeen orthopedists retired.",
  "Two new practices opened nearby last year.",
  "Three-quarters of residents and nearly half the patients are insured.",
  "Five years of runway is typical; demand is five times higher.",
  "Expect a couple of competitors and several new clinics.",
  "Roughly 3.9% of residents are age 65 and over.",
  "About 1,987 residents in this area will need orthopedic care.",
  "There are 1,987 orthopaedic surgeons nearby.",
  "Expect 65 new patients a month among residents.",
  "Median income is 142,350 dollars.",
  "Uninsured share is 15 pct.",
  "There are 522 providers in the city.",
  "About 90% of new practices here break even within 5 years.",
  "Roughly 3 in 5 residents lack a primary care doctor.",
  "Local demand grew 200% since 2020.",
  "Plan for １２ new patients a week.",
  "Consider census.gov/data for more detail.",
  "A third of residents are older adults.",
  "The majority of residents have commercial coverage.",
  "Demand doubled recently.",
  "Twenty-five clinics opened.",
];

test("every reviewer string is rejected as an interpretation", async () => {
  for (const text of REVIEWER_STRINGS) {
    const { r } = await run(text);
    assert.equal(r.ok, false, text);
  }
});

test("model text can never carry a number into a fact or estimate: it is discarded and rendered from the cited item", async () => {
  for (const text of REVIEWER_STRINGS) {
    for (const [kind, refs] of [["fact", ["acs_age65_pct", "acs_uninsured_pct"]], ["fact", ["nppes_city_count"]], ["estimate", ["est_residents_per_provider"]]] as const) {
      const { facts, r } = await run(text, kind, [...refs]);
      assert.equal(r.ok, true, `${kind} ${text}`);
      const out = r.ok ? r.brief.sections[2].statements[0] : null;
      assert.ok(!out!.text.includes(text), "model text never reaches the output");
      const expected = kind === "estimate" ? renderEstimate(facts.estimates[0]) : refs.map((id) => renderFact(facts.facts.find((f) => f.id === id)!, facts)).join(" ");
      assert.equal(out!.text, expected);
    }
  }
});

test("rendered fact sentences use exactly the strings shown in the tables", async () => {
  const facts = await sampleFacts();
  for (const f of facts.facts) {
    const s = renderFact(f, facts);
    assert.ok(s.includes(f.label) && s.includes(f.display), f.id);
    if (f.moeDisplay) assert.ok(s.includes(`margin of error ${f.moeDisplay}`), f.id);
    assert.match(s, f.sourceId === "acs" ? /Source: ACS 2020-2024 5-year\./ : /Source: NPI Registry, retrieved \d{4}-\d{2}-\d{2}\./);
  }
  const city = facts.facts.find((f) => f.id === "nppes_city_count")!;
  const capped = { ...city, value: 200, capped: true, display: "at least 200 (registry limit reached)" };
  assert.match(renderFact(capped, facts), /: at least 200 \(registry limit reached\)\./);
  const e = facts.estimates[0];
  assert.equal(renderEstimate(e), `${e.label}: ${e.display}. Formula: ${e.formula}. ${e.note}`);
});

test("ordinary planning interpretations pass (idioms allowlisted, 'most of' allowed)", async () => {
  const facts = await sampleFacts();
  const inputs = briefInputs(PROFILE, facts);
  for (const ok of [
    "Registry listings are not capacity, so confirm referral patterns locally.",
    "Consider offering one-on-one visits for new patients.",
    "Most of the residents you will serve may prefer evening appointments; ask referral partners.",
    "Ask third-party payers how they credential new practices.",
    "Have every application double-checked before you submit it.",
    "Ask which quarter each payer reviews new applications.",
    "A majority decision among partners should be written into the owners' agreement.",
    "Before signing a lease near ZIP 10016, confirm referral patterns with local surgeons.",
    "Review co-signing and guarantee terms with your lender; compare rates.Co-signing terms vary.",
  ])
    assert.deepEqual(interpretationProblems(ok, facts, inputs), [], ok);
});

test("the stage label is an echo only when the visitor chose it", async () => {
  const text = "Because you are opening within 6 months, start payer enrollment now.";
  assert.ok(!(await run(text)).r.ok, "PROFILE stage is exploring");
  assert.ok((await run(text, "interpretation", [], { ...PROFILE, stage: "soon" })).r.ok);
});

test("refs must be citable items of the right kind; interpretations cite nothing", async () => {
  assert.ok(reasons((await run("", "fact", [])).r).includes("s2.0:fact_refs"));
  assert.ok(reasons((await run("", "fact", ["est_residents_per_provider"])).r).includes("s2.0:fact_refs"));
  assert.ok(reasons((await run("", "estimate", ["acs_population"])).r).includes("s2.0:estimate_refs"));
  assert.ok(reasons((await run("Confirm referral patterns.", "interpretation", ["acs_population"])).r).includes("s2.0:interpretation_refs"));
  const facts = await sampleFacts();
  const noAcs = clone(facts);
  noAcs.sections.acs = { status: "error", message: "down" };
  noAcs.facts = noAcs.facts.filter((f) => f.sourceId !== "acs");
  assert.ok(reasons(validateBrief(GOOD_BRIEF, noAcs, {})).includes("s0.0:fact_refs"));
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

test("accepted brief: facts rendered by code, interpretations unchanged", async () => {
  const facts = await sampleFacts();
  const r = validateBrief(GOOD_BRIEF, facts, briefInputs(PROFILE, facts));
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.match(r.brief.sections[0].statements[0].text, /^Total population, ZCTA 10016: 54,321 \(margin of error ± 1,987\)\./);
  assert.equal(r.brief.sections[2].statements[0].text, GOOD_BRIEF.sections[2].statements[0].text);
});

test("structured-output schema: headings fixed, refs restricted to citable ids", async () => {
  const facts = await sampleFacts();
  const schema = briefSchema(citableIds(facts)) as any;
  const item = schema.properties.sections.items;
  assert.deepEqual(item.properties.heading.enum, BRIEF_HEADINGS);
  assert.deepEqual(item.properties.statements.items.properties.refs.items.enum, ["acs_population", "acs_age65_pct", "acs_uninsured_pct", "acs_median_income", "nppes_zip_count", "nppes_city_count", "est_residents_per_provider"]);
  assert.deepEqual(item.properties.statements.items.required, ["kind", "refs", "text"]);
});
