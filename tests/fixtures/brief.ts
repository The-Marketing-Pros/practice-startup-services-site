import { buildFacts, type FactsBundle } from "../../src/lib/research/facts.ts";
import type { ResearchProfile } from "../../src/lib/research/contract.ts";
import { nppesRecord, nppesBody, URBAN_ACS, stubFetch, jsonResponse } from "./research.ts";

export const PROFILE: ResearchProfile = { provider: "physician", specialty: "orthopedics", zip: "10016", model: "group", setting: "office", payer: "insurance", mix: "commercial", stage: "exploring" };

export async function sampleFacts(): Promise<FactsBundle> {
  const s = stubFetch([
    { match: /api\.census\.gov/, respond: () => jsonResponse(URBAN_ACS) },
    { match: /npiregistry/, respond: () => jsonResponse(nppesBody([1, 2, 3, 4].map((n) => nppesRecord(n, { zip: "10016", city: "NEW YORK", state: "NY", taxonomies: ["Orthopaedic Surgery"] })))) },
  ]);
  return buildFacts(PROFILE, { fetcher: s.fetcher, now: new Date("2026-10-10T15:00:00Z") });
}

/** A brief that only restates grounded numbers. */
export const GOOD_BRIEF = {
  sections: [
    { heading: "Your area at a glance", statements: [
      { text: "Census estimates about 54,321 residents in ZCTA 10016, with a margin of error of 1,987.", kind: "fact", sourceIds: ["acs"] },
      { text: "Roughly 15% of residents are age 65 and over, and the median household income is $142,350.", kind: "fact", sourceIds: ["acs"] },
    ] },
    { heading: "Providers already listed nearby", statements: [
      { text: "The NPI Registry lists 4 orthopaedic surgeons with a practice location in ZIP 10016.", kind: "fact", sourceIds: ["nppes"] },
      { text: "That works out to an estimate of 13,580 residents per matching provider, a rough ratio only.", kind: "estimate", sourceIds: ["acs", "nppes", "derived"] },
    ] },
    { heading: "What this could mean for your plan", statements: [
      { text: "Registry listings do not show capacity, so talk with local referral sources before choosing a location.", kind: "interpretation", sourceIds: [] },
    ] },
    { heading: "Questions to answer next", statements: [
      { text: "Which hospitals and surgery centers will grant you privileges, and how long does that take?", kind: "interpretation", sourceIds: [] },
    ] },
  ],
};

export function openAiResponse(brief: unknown, status = "completed") {
  return { id: "resp_test", status, output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(brief) }] }], usage: { input_tokens: 1, output_tokens: 1 } };
}
