// Synthetic upstream responses with the exact shapes observed from the live
// public APIs on 2026-10-10 (NPPES API v2.1; Census ACS 5-year data profile).
// Values and NPIs are invented for tests; no real provider records are stored.
import { ACS_VARIABLES } from "../../src/lib/research/facts.ts";

export function nppesRecord(npi: number, opts: { zip?: string; city?: string; state?: string; mailingZip?: string; taxonomies: Array<string | null> }) {
  const loc = { address_purpose: "LOCATION", city: opts.city ?? "ORANGE PARK", state: opts.state ?? "FL", postal_code: `${opts.zip ?? "32073"}1234`, country_code: "US" };
  const mail = { address_purpose: "MAILING", city: "JACKSONVILLE", state: "FL", postal_code: `${opts.mailingZip ?? "32256"}6004`, country_code: "US" };
  return {
    number: npi,
    enumeration_type: "NPI-1",
    basic: { status: "A" },
    addresses: [mail, loc],
    taxonomies: opts.taxonomies.map((desc, i) => ({ code: "000000000X", desc, primary: i === 0, state: opts.state ?? "FL" })),
  };
}

export function nppesBody(results: unknown[]) {
  return { result_count: results.length, results };
}

export const ACS_HEADER = ["NAME", ...Object.values(ACS_VARIABLES).flatMap((v) => [v.estimate, v.moe]), "zip code tabulation area"];

export function acsBody(zip: string, v: { pop: string; popM: string; age: string; ageM: string; unins: string; uninsM: string; inc: string; incM: string }) {
  return [ACS_HEADER, [`ZCTA5 ${zip}`, v.pop, v.popM, v.age, v.ageM, v.unins, v.uninsM, v.inc, v.incM, zip]];
}

export const URBAN_ACS = acsBody("10016", { pop: "54321", popM: "1987", age: "15.4", ageM: "1.1", unins: "3.9", uninsM: "0.8", inc: "142350", incM: "6120" });
export const RURAL_ACS = acsBody("59301", { pop: "12204", popM: "731", age: "21.7", ageM: "2.3", unins: "9.6", uninsM: "2.4", inc: "61875", incM: "5402" });

type Route = { match: RegExp; respond: (url: string, init?: RequestInit) => Response | Promise<Response> };

/** fetch stub: routes by URL regex and records every call. */
export function stubFetch(routes: Route[]) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetcher = async (input: string, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    const route = routes.find((r) => r.match.test(url));
    if (!route) throw new Error(`unexpected fetch ${url}`);
    return route.respond(url, init);
  };
  return { fetcher, calls, count: (re: RegExp) => calls.filter((c) => re.test(c.url)).length };
}

export const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
