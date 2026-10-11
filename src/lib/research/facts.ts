// Free research preview: attributable public data for a ZIP and specialty.
//
// Sources (no account needed to read; Census now requires a free API key):
// - CMS NPPES NPI Registry API v2.1: individual providers (NPI-1) whose
//   PRACTICE LOCATION address is in the ZIP (or city) and whose taxonomy
//   matches the specialty. Registry caveats are returned with the data.
// - U.S. Census Bureau ACS 5-year data profile at ZCTA level, with margins of
//   error and the vintage. ZCTAs approximate, but are not, USPS ZIP areas.
//
// Every number shown to the visitor comes from these responses or from a
// labeled formula over them. Nothing is estimated from outside data.

import { optionLabel, specialtyById, taxonomyFor, providerTypes, type TaxonomyQuery } from "../startup/options.ts";
import { stateForZip } from "../startup/zip3.ts";
import type { ResearchProfile } from "./contract.ts";

export const ACS_YEAR = 2024;
export const ACS_VINTAGE = `${ACS_YEAR - 4}-${ACS_YEAR}`;
// Data-profile variable codes are specific to the ACS_YEAR vintage. When
// changing ACS_YEAR, re-verify each code at
// https://api.census.gov/data/<year>/acs/acs5/profile/variables.json
export const ACS_VARIABLES = {
  population: { estimate: "DP05_0001E", moe: "DP05_0001M", label: "Total population" },
  age65: { estimate: "DP05_0024PE", moe: "DP05_0024PM", label: "Share of residents age 65 and over" },
  uninsured: { estimate: "DP03_0099PE", moe: "DP03_0099PM", label: "Share of residents with no health insurance (civilian noninstitutionalized population)" },
  income: { estimate: "DP03_0062E", moe: "DP03_0062M", label: "Median household income (inflation-adjusted dollars)" },
} as const;
export const NPPES_LIMIT = 200;

export type SourceId = "nppes" | "acs" | "zip3" | "derived";
export type Source = { id: SourceId; name: string; url: string; vintage: string; retrieved: string; notes: string };
export type Fact = {
  id: string;
  label: string;
  value: number | null;
  display: string;
  moe: number | null;
  moeDisplay: string;
  unit: "people" | "percent" | "usd" | "providers";
  sourceId: SourceId;
  geography: string;
  capped: boolean;
  note: string;
};
export type Estimate = {
  id: string;
  label: string;
  value: number | null;
  display: string;
  formula: string;
  sourceIds: SourceId[];
  note: string;
};
export type SectionStatus = { status: "ok" | "unavailable" | "error"; message: string };
export type FactsBundle = {
  version: 1;
  generatedAt: string;
  profile: ResearchProfile;
  labels: { provider: string; specialty: string; taxonomy: string; state: string; city: string };
  zip: string;
  state: { code: string; name: string } | null;
  sources: Source[];
  facts: Fact[];
  estimates: Estimate[];
  sections: { acs: SectionStatus; nppes: SectionStatus };
  caveats: string[];
};

export class UpstreamError extends Error {
  source: string;
  code: string;
  constructor(source: string, code: string, message: string) {
    super(message);
    this.source = source;
    this.code = code;
  }
}

export type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;
export type Cache = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, ttlSeconds: number): Promise<void>;
};
export const noCache: Cache = { get: async () => null, put: async () => {} };

const fmtInt = (n: number) => Math.round(n).toLocaleString("en-US");
const fmtPct = (n: number) => `${n.toFixed(1)}%`;
const fmtUsd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

// ---------------------------------------------------------------- Census

// The Census API marks unavailable estimates with large negative sentinels.
function censusNumber(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= -111111111) return null;
  return n;
}

export type AcsResult = {
  name: string;
  population: { e: number | null; m: number | null };
  age65: { e: number | null; m: number | null };
  uninsured: { e: number | null; m: number | null };
  income: { e: number | null; m: number | null };
};

/** Parse the Census array-of-arrays response for one ZCTA. Null when no row. */
export function parseAcs(body: unknown): AcsResult | null {
  if (!Array.isArray(body) || body.length < 2 || !Array.isArray(body[0]) || !Array.isArray(body[1]))
    throw new UpstreamError("acs", "malformed", "Unexpected Census response shape.");
  const [header, row] = body as [unknown[], unknown[]];
  const col = (name: string) => {
    const i = header.indexOf(name);
    if (i < 0) throw new UpstreamError("acs", "malformed", `Census response is missing ${name}.`);
    return row[i];
  };
  const pair = (k: keyof typeof ACS_VARIABLES) => ({
    e: censusNumber(col(ACS_VARIABLES[k].estimate)),
    m: censusNumber(col(ACS_VARIABLES[k].moe)),
  });
  return {
    name: String(col("NAME") ?? ""),
    population: pair("population"),
    age65: pair("age65"),
    uninsured: pair("uninsured"),
    income: pair("income"),
  };
}

export function acsUrl(zip: string, key?: string): string {
  const vars = ["NAME", ...Object.values(ACS_VARIABLES).flatMap((v) => [v.estimate, v.moe])].join(",");
  const u = `https://api.census.gov/data/${ACS_YEAR}/acs/acs5/profile?get=${vars}&for=zip%20code%20tabulation%20area:${zip}`;
  return key ? `${u}&key=${encodeURIComponent(key)}` : u;
}

export async function fetchAcs(zip: string, fetcher: Fetcher, key?: string): Promise<AcsResult | null> {
  let r: Response;
  try {
    r = await fetcher(acsUrl(zip, key), { redirect: "manual", signal: AbortSignal.timeout(10000) });
  } catch {
    throw new UpstreamError("acs", "network", "Census API did not respond.");
  }
  // A missing or invalid key is answered with a redirect to an HTML page.
  if (r.status >= 300 && r.status < 400) {
    const loc = r.headers.get("location") || "";
    throw new UpstreamError("acs", /key/i.test(loc) ? "key_required" : "redirect", "Census API requires a valid key.");
  }
  if (r.status === 204) return null; // No ZCTA matches this ZIP.
  const text = await r.text();
  if (!r.ok) {
    if (r.status === 400 && /unknown|ambiguous|no.*geograph/i.test(text)) return null;
    throw new UpstreamError("acs", `http_${r.status}`, "Census API returned an error.");
  }
  if (!text.trim()) return null;
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new UpstreamError("acs", "non_json", "Census API returned a non-JSON response.");
  }
  return parseAcs(body);
}

// ----------------------------------------------------------------- NPPES

type NppesAddress = { address_purpose?: string; city?: string; state?: string; postal_code?: string; country_code?: string };
type NppesResult = { number?: number | string; addresses?: NppesAddress[]; taxonomies?: Array<{ desc?: string | null }> };

const normDesc = (s: unknown) => String(s ?? "").replace(/[\s,]+$/g, "").trim().toLowerCase();

export type NppesCount = { count: number; capped: boolean; numbers: Set<string>; cities: Map<string, number> };

/** Count unique NPIs whose practice location matches and taxonomy matches a prefix. */
export function parseNppes(
  body: unknown,
  q: TaxonomyQuery | null,
  where: { zip?: string; city?: string; state?: string },
): NppesCount {
  if (!body || typeof body !== "object") throw new UpstreamError("nppes", "malformed", "Unexpected NPPES response.");
  const b = body as { results?: unknown; Errors?: unknown; result_count?: unknown };
  if (b.Errors) {
    // "No taxonomy codes found" means our search term is wrong, not an outage.
    const code = /taxonomy/i.test(JSON.stringify(b.Errors)) ? "taxonomy_not_found" : "api_error";
    throw new UpstreamError("nppes", code, "NPPES rejected the query.");
  }
  if (!Array.isArray(b.results)) throw new UpstreamError("nppes", "malformed", "NPPES response has no results list.");
  const results = b.results as NppesResult[];
  const prefixes = (q?.prefixes ?? []).map((p) => p.toLowerCase());
  const numbers = new Set<string>();
  const cities = new Map<string, number>();
  for (const r of results) {
    const loc = (r.addresses ?? []).find((a) => a.address_purpose === "LOCATION");
    if (!loc) continue;
    const postal = String(loc.postal_code ?? "");
    if (where.zip && !postal.startsWith(where.zip)) continue;
    if (where.city && (String(loc.city ?? "").toUpperCase() !== where.city || String(loc.state ?? "").toUpperCase() !== where.state)) continue;
    if (prefixes.length && !(r.taxonomies ?? []).some((t) => prefixes.some((p) => normDesc(t.desc).startsWith(p)))) continue;
    const id = String(r.number ?? "");
    if (!id || numbers.has(id)) continue;
    numbers.add(id);
    const city = String(loc.city ?? "").toUpperCase();
    if (city) cities.set(city, (cities.get(city) ?? 0) + 1);
  }
  return { count: numbers.size, capped: results.length >= NPPES_LIMIT, numbers, cities };
}

export function nppesUrl(q: TaxonomyQuery | null, where: { zip?: string; city?: string; state?: string }): string {
  const p = new URLSearchParams({ version: "2.1", enumeration_type: "NPI-1", address_purpose: "LOCATION", limit: String(NPPES_LIMIT) });
  if (q) p.set("taxonomy_description", q.query);
  if (where.zip) p.set("postal_code", where.zip);
  if (where.city) p.set("city", where.city);
  if (where.state) p.set("state", where.state);
  return `https://npiregistry.cms.hhs.gov/api/?${p.toString()}`;
}

async function nppesQuery(fetcher: Fetcher, q: TaxonomyQuery | null, where: { zip?: string; city?: string; state?: string }): Promise<NppesCount> {
  let r: Response;
  try {
    r = await fetcher(nppesUrl(q, where), { signal: AbortSignal.timeout(10000), headers: { Accept: "application/json" } });
  } catch {
    throw new UpstreamError("nppes", "network", "NPPES did not respond.");
  }
  if (!r.ok) throw new UpstreamError("nppes", `http_${r.status}`, "NPPES returned an error.");
  let body: unknown;
  try {
    body = JSON.parse(await r.text());
  } catch {
    throw new UpstreamError("nppes", "non_json", "NPPES returned a non-JSON response.");
  }
  return parseNppes(body, q, where);
}

/** Union of several taxonomy queries; capped when any underlying query hit the limit. */
export async function countProviders(
  fetcher: Fetcher,
  queries: TaxonomyQuery[],
  where: { zip?: string; city?: string; state?: string },
): Promise<NppesCount> {
  const all = new Set<string>();
  const cities = new Map<string, number>();
  let capped = false;
  for (const q of queries) {
    const r = await nppesQuery(fetcher, q, where);
    capped ||= r.capped;
    for (const n of r.numbers) all.add(n);
    for (const [c, n] of r.cities) cities.set(c, (cities.get(c) ?? 0) + n);
  }
  return { count: all.size, capped, numbers: all, cities };
}

function topCity(cities: Map<string, number>): string {
  let best = "";
  let n = 0;
  for (const [c, k] of cities) if (k > n) [best, n] = [c, k];
  return best;
}

// ------------------------------------------------------------ Bundle

export const CAVEATS = {
  nppes: [
    "NPPES lists National Provider Identifier registrations. A listing does not show that a provider is actively seeing patients, accepting new patients, or competing for the same patients.",
    "Counts use the practice location address providers reported, which may be out of date. Mailing addresses are excluded.",
    "A provider matches when any taxonomy on their record matches, not only their primary specialty.",
    `The registry returns at most ${NPPES_LIMIT} records per search. When a search reaches that limit, the count is shown with a plus sign and is a minimum.`,
  ],
  acs: [
    `Census figures are American Community Survey ${ACS_VINTAGE} 5-year estimates. They describe an average over those years, not today.`,
    "Census data uses ZIP Code Tabulation Areas (ZCTAs), which approximate but do not exactly match USPS ZIP code delivery areas. Some ZIP codes, such as PO box or single-building ZIPs, have no ZCTA.",
    "The margin of error (90 percent confidence) shows how much an estimate could differ. Small areas can have large margins.",
  ],
};

function fact(f: Omit<Fact, "moeDisplay" | "capped" | "note"> & Partial<Pick<Fact, "capped" | "note" | "moeDisplay">>): Fact {
  return { capped: false, note: "", moeDisplay: "", ...f };
}

export type BuildDeps = { fetcher: Fetcher; cache?: Cache; censusKey?: string; now?: Date };

/** Fetch, cache and assemble the preview facts. Each section fails independently. */
export async function buildFacts(profile: ResearchProfile, deps: BuildDeps): Promise<FactsBundle> {
  const cache = deps.cache ?? noCache;
  const now = deps.now ?? new Date();
  const day = now.toISOString().slice(0, 10);
  const zip = profile.zip;
  const state = stateForZip(zip);
  const specialty = specialtyById(profile.specialty);
  const queries = taxonomyFor(profile.specialty, profile.provider);
  const taxonomyLabel = queries.map((q) => q.label).join("; ");
  const facts: Fact[] = [];
  const estimates: Estimate[] = [];
  const sections: FactsBundle["sections"] = {
    acs: { status: "ok", message: "" },
    nppes: { status: "ok", message: "" },
  };

  // Census ACS
  let acs: AcsResult | null = null;
  try {
    const key = `acs:${ACS_YEAR}:${zip}`;
    const hit = await cache.get(key).catch(() => null);
    if (hit) acs = JSON.parse(hit) as AcsResult | null;
    else {
      acs = await fetchAcs(zip, deps.fetcher, deps.censusKey);
      await cache.put(key, JSON.stringify(acs), 30 * 86400).catch(() => {});
    }
    if (!acs) sections.acs = { status: "unavailable", message: `No Census ZIP Code Tabulation Area matches ${zip}. This is common for PO box and single-building ZIP codes.` };
  } catch (e) {
    const code = e instanceof UpstreamError ? e.code : "unknown";
    sections.acs = { status: "error", message: code === "key_required" ? "Census data is not available right now (the site's Census API key is not configured)." : "Census data is temporarily unavailable. Try again later." };
  }
  const zcta = `ZCTA ${zip}`;
  if (acs) {
    const add = (id: string, k: keyof typeof ACS_VARIABLES, unit: Fact["unit"], fmt: (n: number) => string, moeFmt: (n: number) => string) => {
      const v = acs![k];
      facts.push(fact({
        id, label: ACS_VARIABLES[k].label, value: v.e, display: v.e === null ? "Not available" : fmt(v.e),
        moe: v.m, moeDisplay: v.m === null ? "" : `± ${moeFmt(v.m)}`, unit, sourceId: "acs", geography: zcta,
        note: v.e === null ? "The Census Bureau did not publish this estimate for this area." : "",
      }));
    };
    add("acs_population", "population", "people", fmtInt, fmtInt);
    add("acs_age65_pct", "age65", "percent", fmtPct, (n) => `${n.toFixed(1)} points`);
    add("acs_uninsured_pct", "uninsured", "percent", fmtPct, (n) => `${n.toFixed(1)} points`);
    add("acs_median_income", "income", "usd", fmtUsd, fmtUsd);
  }

  // NPPES
  let zipCount: NppesCount | null = null;
  let city = "";
  if (!queries.length) {
    sections.nppes = { status: "unavailable", message: `NPPES has no individual provider taxonomy that matches ${specialty?.label ?? "this specialty"} for ${optionLabel(providerTypes, profile.provider).toLowerCase()}s, so no provider count is shown.` };
  } else {
    try {
      const taxKey = `${profile.provider}:${profile.specialty}`;
      const key = `nppes:v1:${zip}:${taxKey}`;
      const hit = await cache.get(key).catch(() => null);
      let cached: { zip: { count: number; capped: boolean }; city: string; cityCount: { count: number; capped: boolean } | null } | null = hit ? JSON.parse(hit) : null;
      if (!cached) {
        const z = await countProviders(deps.fetcher, queries, { zip });
        city = topCity(z.cities);
        if (!city) {
          // No matching providers: find the ZIP's city from any provider there.
          const any = await nppesQuery(deps.fetcher, null, { zip });
          city = topCity(any.cities);
        }
        let cityCount: { count: number; capped: boolean } | null = null;
        if (city && state) {
          const c = await countProviders(deps.fetcher, queries, { city, state: state.code });
          cityCount = { count: c.count, capped: c.capped };
        }
        cached = { zip: { count: z.count, capped: z.capped }, city, cityCount };
        await cache.put(key, JSON.stringify(cached), 7 * 86400).catch(() => {});
      }
      zipCount = { count: cached.zip.count, capped: cached.zip.capped, numbers: new Set(), cities: new Map() };
      city = cached.city;
      const show = (c: { count: number; capped: boolean }) => (c.capped ? `${fmtInt(c.count)}+` : fmtInt(c.count));
      facts.push(fact({
        id: "nppes_zip_count", label: `Individual providers listed with a matching taxonomy and a practice location in ZIP ${zip}`,
        value: cached.zip.count, display: show(cached.zip), moe: null, unit: "providers", sourceId: "nppes", geography: `ZIP ${zip}`,
        capped: cached.zip.capped, note: cached.zip.capped ? "Search reached the registry limit; the true number is at least this." : "",
      }));
      if (cached.cityCount && state) {
        const cityName = titleCase(city);
        facts.push(fact({
          id: "nppes_city_count", label: `Individual providers listed with a matching taxonomy and a practice location in ${cityName}, ${state.code}`,
          value: cached.cityCount.count, display: show(cached.cityCount), moe: null, unit: "providers", sourceId: "nppes", geography: `${cityName}, ${state.code}`,
          capped: cached.cityCount.capped, note: cached.cityCount.capped ? "Search reached the registry limit; the true number is at least this." : "City taken from NPPES practice addresses in this ZIP.",
        }));
      }
    } catch (e) {
      sections.nppes =
        e instanceof UpstreamError && e.code === "taxonomy_not_found"
          ? { status: "unavailable", message: "The NPI Registry did not recognize the taxonomy search for this specialty, so no provider count is shown." }
          : { status: "error", message: "The NPI Registry is temporarily unavailable. Try again later." };
    }
  }

  // Derived estimate: residents per matching provider (ZCTA population / ZIP count).
  const pop = facts.find((f) => f.id === "acs_population")?.value ?? null;
  if (pop !== null && zipCount) {
    const ok = zipCount.count > 0 && !zipCount.capped;
    const value = ok ? Math.round(pop / zipCount.count) : null;
    estimates.push({
      id: "est_residents_per_provider",
      label: "Residents per matching provider (estimate)",
      value,
      display: value === null ? "Not calculated" : fmtInt(value),
      formula: `${zcta} population (${fmtInt(pop)}) / matching providers with a practice location in ZIP ${zip} (${zipCount.capped ? `${fmtInt(zipCount.count)}+` : fmtInt(zipCount.count)})`,
      sourceIds: ["acs", "nppes", "derived"],
      note: value === null
        ? zipCount.capped
          ? "Not calculated because the provider search reached the registry limit."
          : "Not calculated because no matching providers are listed at this ZIP."
        : "A rough ratio, not a measure of demand or capacity. ZCTA and ZIP boundaries differ, patients cross ZIP lines, and listed providers may not be accepting patients.",
    });
  }

  const retrieved = day;
  const sources: Source[] = [
    { id: "nppes", name: "CMS National Plan and Provider Enumeration System (NPPES) NPI Registry API, version 2.1", url: "https://npiregistry.cms.hhs.gov/api-page", vintage: `Live registry, retrieved ${retrieved}`, retrieved, notes: CAVEATS.nppes.join(" ") },
    { id: "acs", name: `U.S. Census Bureau, American Community Survey ${ACS_VINTAGE} 5-year estimates, data profiles (DP03, DP05)`, url: `https://api.census.gov/data/${ACS_YEAR}/acs/acs5/profile`, vintage: `ACS ${ACS_VINTAGE} 5-year`, retrieved, notes: CAVEATS.acs.join(" ") },
    { id: "zip3", name: "State inferred from the first three digits of the ZIP code (USPS sectional center)", url: "https://www.census.gov/programs-surveys/geography/guidance/geo-areas/zctas.html", vintage: "Static table", retrieved, notes: "A few ZIP prefixes cross state lines; confirm your state." },
    { id: "derived", name: "Calculated on this page from the figures above", url: "", vintage: "", retrieved, notes: "Formulas are shown with each estimate." },
  ];

  return {
    version: 1,
    generatedAt: now.toISOString(),
    profile,
    labels: {
      provider: optionLabel(providerTypes, profile.provider),
      specialty: specialty?.label ?? profile.specialty,
      taxonomy: taxonomyLabel,
      state: state?.name ?? "",
      city: city ? titleCase(city) : "",
    },
    zip,
    state,
    sources,
    facts,
    estimates,
    sections,
    caveats: [...CAVEATS.acs, ...CAVEATS.nppes],
  };
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());
}
