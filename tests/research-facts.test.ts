import test from "node:test";
import assert from "node:assert/strict";
import { parseAcs, parseNppes, buildFacts, acsUrl, nppesUrl, ACS_VINTAGE, type Cache } from "../src/lib/research/facts.ts";
import { taxonomyFor } from "../src/lib/startup/options.ts";
import type { ResearchProfile } from "../src/lib/research/contract.ts";
import { nppesRecord, nppesBody, URBAN_ACS, RURAL_ACS, ACS_HEADER, stubFetch, jsonResponse } from "./fixtures/research.ts";

const NOW = new Date("2026-10-10T15:00:00Z");
const urbanOrtho: ResearchProfile = { provider: "physician", specialty: "orthopedics", zip: "10016", model: "group", setting: "office", payer: "insurance", mix: "commercial", stage: "exploring" };
const ruralNp: ResearchProfile = { provider: "np", specialty: "behavioral-health", zip: "59301", model: "solo", setting: "hybrid", payer: "insurance", mix: "medicaid", stage: "soon" };

test("Census parser reads estimates and margins by header name and nulls sentinel values", () => {
  const r = parseAcs(URBAN_ACS)!;
  assert.equal(r.population.e, 54321);
  assert.equal(r.population.m, 1987);
  assert.equal(r.age65.e, 15.4);
  assert.equal(r.income.m, 6120);
  const sentinel = JSON.parse(JSON.stringify(URBAN_ACS));
  sentinel[1][7] = "-666666666";
  sentinel[1][8] = "-222222222";
  assert.equal(parseAcs(sentinel)!.income.e, null);
  assert.equal(parseAcs(sentinel)!.income.m, null);
  assert.throws(() => parseAcs({ error: "x" }), /shape/);
  assert.throws(() => parseAcs([ACS_HEADER.slice(1), ["x"]]), /missing NAME/);
});

test("NPPES parser counts practice-location matches only, by taxonomy prefix, deduped, with a cap flag", () => {
  const q = taxonomyFor("family-medicine", "physician")[0];
  const body = nppesBody([
    nppesRecord(1, { taxonomies: ["Family Medicine"] }),
    nppesRecord(1, { taxonomies: ["Family Medicine"] }), // duplicate NPI
    nppesRecord(2, { taxonomies: ["Emergency Medicine", "Family Medicine"] }), // non-primary match counts
    nppesRecord(3, { taxonomies: ["Nurse Practitioner, Family"] }), // substring hit, wrong prefix
    nppesRecord(4, { zip: "32256", mailingZip: "32073", taxonomies: ["Family Medicine"] }), // mailing-only in ZIP
    nppesRecord(5, { taxonomies: [null] }),
    nppesRecord(6, { taxonomies: ["Family Medicine, Sports Medicine"] }),
  ]);
  const r = parseNppes(body, q, { zip: "32073" });
  assert.equal(r.count, 3);
  assert.equal(r.capped, false);
  assert.equal(r.cities.get("ORANGE PARK"), 3);
  const capped = nppesBody(Array.from({ length: 200 }, (_, i) => nppesRecord(1000 + i, { taxonomies: ["Family Medicine"] })));
  assert.equal(parseNppes(capped, q, { zip: "32073" }).capped, true);
  assert.throws(() => parseNppes({ Errors: [{ description: "bad" }] }, q, { zip: "32073" }), /rejected/);
  assert.throws(() => parseNppes({ result_count: 0 }, q, { zip: "32073" }), /no results/);
  // Trailing punctuation in NPPES descriptions is normalized.
  const slp = taxonomyFor("speech-therapy", "therapist")[0];
  assert.equal(parseNppes(nppesBody([nppesRecord(9, { taxonomies: ["Speech-Language Pathologist,  "] })]), slp, { zip: "32073" }).count, 1);
});

test("query URLs request practice locations, individuals and the 200-record limit", () => {
  const u = new URL(nppesUrl(taxonomyFor("psychiatry", "np")[0], { zip: "59301" }));
  assert.equal(u.searchParams.get("address_purpose"), "LOCATION");
  assert.equal(u.searchParams.get("enumeration_type"), "NPI-1");
  assert.equal(u.searchParams.get("limit"), "200");
  assert.equal(u.searchParams.get("taxonomy_description"), "Psych/Mental Health");
  assert.match(acsUrl("59301"), /acs5\/profile\?get=NAME,DP05_0001E,DP05_0001M/);
  assert.match(acsUrl("59301", "k&y"), /&key=k%26y$/);
});

function upstream(opts: { acs?: unknown; acsStatus?: number; acsRedirect?: string; nppes?: (url: string) => unknown; nppesText?: string }) {
  return stubFetch([
    {
      match: /api\.census\.gov/,
      respond: () => {
        if (opts.acsRedirect) return new Response("", { status: 302, headers: { Location: opts.acsRedirect } });
        if (opts.acsStatus === 204) return new Response(null, { status: 204 });
        return jsonResponse(opts.acs ?? URBAN_ACS, opts.acsStatus ?? 200);
      },
    },
    {
      match: /npiregistry\.cms\.hhs\.gov/,
      respond: (url) => (opts.nppesText ? new Response(opts.nppesText, { status: 200, headers: { "Content-Type": "text/html" } }) : jsonResponse(opts.nppes ? opts.nppes(url) : nppesBody([]))),
    },
  ]);
}

test("preview facts carry values, margins, vintage, sources and a labeled estimate with its formula", async () => {
  const s = upstream({
    nppes: (url) => {
      const u = new URL(url);
      if (u.searchParams.get("postal_code")) return nppesBody([1, 2, 3, 4].map((n) => nppesRecord(n, { zip: "10016", city: "NEW YORK", state: "NY", taxonomies: ["Orthopaedic Surgery"] })));
      return nppesBody(Array.from({ length: 200 }, (_, i) => nppesRecord(500 + i, { zip: "10001", city: "NEW YORK", state: "NY", taxonomies: ["Orthopaedic Surgery, Hand Surgery"] })));
    },
  });
  const f = await buildFacts(urbanOrtho, { fetcher: s.fetcher, now: NOW });
  assert.equal(f.sections.acs.status, "ok");
  assert.equal(f.sections.nppes.status, "ok");
  const pop = f.facts.find((x) => x.id === "acs_population")!;
  assert.equal(pop.display, "54,321");
  assert.equal(pop.moeDisplay, "± 1,987");
  assert.equal(pop.geography, "ZCTA 10016");
  assert.equal(f.facts.find((x) => x.id === "acs_age65_pct")!.display, "15.4%");
  assert.equal(f.facts.find((x) => x.id === "acs_median_income")!.display, "$142,350");
  assert.equal(f.facts.find((x) => x.id === "nppes_zip_count")!.display, "4");
  const city = f.facts.find((x) => x.id === "nppes_city_count")!;
  assert.equal(city.display, "at least 200 (registry limit reached)");
  assert.equal(city.capped, true);
  assert.equal(f.labels.city, "New York");
  const est = f.estimates[0];
  assert.equal(est.value, Math.round(54321 / 4));
  assert.match(est.formula, /ZCTA 10016 population \(54,321\) \/ matching providers .* \(4\)/);
  assert.ok(f.sources.find((x) => x.id === "acs")!.vintage.includes(ACS_VINTAGE));
  assert.equal(f.state?.code, "NY");
  assert.ok(f.caveats.some((c) => /ZIP Code Tabulation Areas/.test(c)));
});

test("capped ZIP counts say 'at least N (registry limit reached)' and suppress the ratio", async () => {
  const s = upstream({ acs: RURAL_ACS, nppes: () => nppesBody(Array.from({ length: 200 }, (_, i) => nppesRecord(i + 1, { zip: "59301", city: "MILES CITY", state: "MT", taxonomies: ["Nurse Practitioner, Psych/Mental Health"] }))) });
  const f = await buildFacts(ruralNp, { fetcher: s.fetcher, now: NOW });
  assert.equal(f.facts.find((x) => x.id === "nppes_zip_count")!.display, "at least 200 (registry limit reached)");
  assert.equal(f.estimates[0].value, null);
  assert.match(f.estimates[0].note, /registry limit/);
});

test("each section fails independently: Census key redirect, Census no ZCTA, NPPES non-JSON", async () => {
  const keyMissing = await buildFacts(urbanOrtho, { fetcher: upstream({ acsRedirect: "https://api.census.gov/data/missing_key.html" }).fetcher, now: NOW });
  assert.equal(keyMissing.sections.acs.status, "error");
  assert.match(keyMissing.sections.acs.message, /API key/);
  assert.equal(keyMissing.sections.nppes.status, "ok");
  assert.equal(keyMissing.estimates.length, 0);
  const noZcta = await buildFacts(urbanOrtho, { fetcher: upstream({ acsStatus: 204 }).fetcher, now: NOW });
  assert.equal(noZcta.sections.acs.status, "unavailable");
  const badNppes = await buildFacts(urbanOrtho, { fetcher: upstream({ nppesText: "<html>maintenance</html>" }).fetcher, now: NOW });
  assert.equal(badNppes.sections.nppes.status, "error");
  assert.equal(badNppes.sections.acs.status, "ok");
  const census500 = await buildFacts(urbanOrtho, { fetcher: upstream({ acsStatus: 500, acs: { error: "x" } }).fetcher, now: NOW });
  assert.equal(census500.sections.acs.status, "error");
});

test("no matching NPPES taxonomy means no count and no NPPES call", async () => {
  const s = upstream({});
  const f = await buildFacts({ ...urbanOrtho, specialty: "urgent-care" }, { fetcher: s.fetcher, now: NOW });
  assert.equal(f.sections.nppes.status, "unavailable");
  assert.equal(s.count(/npiregistry/), 0);
});

test("responses are cached by ZIP and taxonomy; the second preview makes no upstream calls", async () => {
  const store = new Map<string, string>();
  const cache: Cache = { get: async (k) => store.get(k) ?? null, put: async (k, v) => void store.set(k, v) };
  const s = upstream({ nppes: () => nppesBody([nppesRecord(1, { zip: "10016", city: "NEW YORK", state: "NY", taxonomies: ["Orthopaedic Surgery"] })]) });
  await buildFacts(urbanOrtho, { fetcher: s.fetcher, cache, now: NOW });
  const first = s.calls.length;
  const again = await buildFacts(urbanOrtho, { fetcher: s.fetcher, cache, now: NOW });
  assert.equal(s.calls.length, first);
  assert.equal(again.facts.find((x) => x.id === "nppes_zip_count")!.value, 1);
});

test("taxonomy search terms are the NPPES-verified forms (classification OR specialization, never both)", async () => {
  const { specialties } = await import("../src/lib/startup/options.ts");
  const terms = new Set(specialties.flatMap((s) => Object.values(s.taxonomy).flatMap((qs) => (qs ?? []).map((q) => q.query))));
  // Verified live 2026-10-10: these combined forms return "No taxonomy codes found".
  for (const bad of ["Nurse Practitioner, Psych", "Nurse Practitioner, Family", "Nurse Practitioner, Gerontology", "Nurse Practitioner, Pediatrics"]) assert.ok(!terms.has(bad), bad);
  for (const good of ["Psych/Mental Health", "Gerontology", "Women's Health", "Primary Care", "Medical Oncology"]) assert.ok(terms.has(good), good);
});

test("an NPPES 'no taxonomy codes found' reply is reported as no count, not as an outage", async () => {
  const s = stubFetch([
    { match: /api\.census\.gov/, respond: () => jsonResponse(URBAN_ACS) },
    { match: /npiregistry/, respond: () => jsonResponse({ Errors: [{ description: "No taxonomy codes found with entered description", field: "taxonomy_description", number: "14" }] }) },
  ]);
  const f = await buildFacts(urbanOrtho, { fetcher: s.fetcher, now: NOW });
  assert.equal(f.sections.nppes.status, "unavailable");
  assert.match(f.sections.nppes.message, /did not recognize/);
});

test("NPPES pagination: bounded skip pages, exact count when the last page is partial", async () => {
  const pages = [200, 200, 50];
  const s = upstream({
    nppes: (url) => {
      const u = new URL(url);
      if (!u.searchParams.get("postal_code")) return nppesBody([]);
      const skip = Number(u.searchParams.get("skip") || 0);
      const n = pages[skip / 200] ?? 0;
      return nppesBody(Array.from({ length: n }, (_, i) => nppesRecord(10000 + skip + i, { zip: "10016", city: "NEW YORK", state: "NY", taxonomies: ["Orthopaedic Surgery"] })));
    },
  });
  const f = await buildFacts(urbanOrtho, { fetcher: s.fetcher, now: NOW });
  const z = f.facts.find((x) => x.id === "nppes_zip_count")!;
  assert.equal(z.value, 450);
  assert.equal(z.capped, false);
  assert.equal(z.display, "450");
  const zipCalls = s.calls.filter((c) => /npiregistry/.test(c.url) && new URL(c.url).searchParams.get("postal_code"));
  assert.deepEqual(zipCalls.map((c) => new URL(c.url).searchParams.get("skip")), [null, "200", "400"]);
});

test("a capped city count below the ZIP count is not shown, with an explanation", async () => {
  // Every page full for both searches; ZIP pages carry more distinct NPIs than city pages.
  const s = upstream({
    nppes: (url) => {
      const u = new URL(url);
      const skip = Number(u.searchParams.get("skip") || 0);
      if (u.searchParams.get("postal_code")) return nppesBody(Array.from({ length: 200 }, (_, i) => nppesRecord(20000 + skip + i, { zip: "10016", city: "NEW YORK", state: "NY", taxonomies: ["Orthopaedic Surgery"] })));
      return nppesBody(Array.from({ length: 200 }, (_, i) => nppesRecord(30000 + i, { zip: "10001", city: "NEW YORK", state: "NY", taxonomies: ["Orthopaedic Surgery"] })));
    },
  });
  const f = await buildFacts(urbanOrtho, { fetcher: s.fetcher, now: NOW });
  assert.equal(f.facts.find((x) => x.id === "nppes_zip_count")!.display, "at least 600 (registry limit reached)");
  assert.equal(f.facts.find((x) => x.id === "nppes_city_count"), undefined);
  assert.match(f.sections.nppes.note ?? "", /not shown because the registry limit was reached/);
});

test("cached NPPES results keep and show their original retrieval date", async () => {
  const store = new Map<string, string>();
  const cache: Cache = { get: async (k) => store.get(k) ?? null, put: async (k, v) => void store.set(k, v) };
  const s = upstream({ nppes: () => nppesBody([nppesRecord(1, { zip: "10016", city: "NEW YORK", state: "NY", taxonomies: ["Orthopaedic Surgery"] })]) });
  await buildFacts(urbanOrtho, { fetcher: s.fetcher, cache, now: new Date("2026-10-03T12:00:00Z") });
  const later = await buildFacts(urbanOrtho, { fetcher: s.fetcher, cache, now: NOW });
  const src = later.sources.find((x) => x.id === "nppes")!;
  assert.equal(src.retrieved, "2026-10-03");
  assert.match(src.vintage, /retrieved 2026-10-03/);
});
