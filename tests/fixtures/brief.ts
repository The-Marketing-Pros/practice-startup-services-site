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
      { kind: "fact", refs: ["acs_population"], text: "" },
      { kind: "fact", refs: ["acs_age65_pct", "acs_median_income"], text: "" },
    ] },
    { heading: "Providers already listed nearby", statements: [
      { kind: "fact", refs: ["nppes_zip_count"], text: "" },
      { kind: "estimate", refs: ["est_residents_per_provider"], text: "" },
    ] },
    { heading: "What this could mean for your plan", statements: [
      { kind: "interpretation", refs: [], text: "Registry listings are not capacity, so confirm referral patterns locally before choosing a location." },
    ] },
    { heading: "Questions to answer next", statements: [
      { kind: "interpretation", refs: [], text: "Which hospitals and surgery centers will grant you privileges, and how long does that take?" },
    ] },
  ],
};

export function openAiResponse(brief: unknown, status = "completed") {
  return { id: "resp_test", status, output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(brief) }] }], usage: { input_tokens: 1, output_tokens: 1 } };
}
