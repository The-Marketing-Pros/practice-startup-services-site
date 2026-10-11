// Local verification server (development only; never deployed).
// Serves the built site from dist/ and runs the REAL research handlers from
// src/lib/research/handler.ts against an in-memory SQLite copy of the D1
// migration. Turnstile, HubSpot, OpenAI and Meta are MOCKED here; NPPES can be
// live (read-only public API) or fixture; Census is fixture unless
// CENSUS_MODE=live (which, without a key, shows the real "key required" path).
//
//   npm run build && node --experimental-strip-types scripts/dev/research-mock-server.ts
//   NPPES_MODE=live CENSUS_MODE=live PORT=8799 node --experimental-strip-types scripts/dev/research-mock-server.ts
//
// POST /__scenario {"name": "..."} switches the mocked provider behavior:
//   ok | verification | hubspot_down | ai_down | ai_invented | db_down | rate_limited | capacity | no_data | unconfigured
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { handleAvailability, handleGate, handlePreview, type ResearchEnv } from "../../src/lib/research/handler.ts";
import { createD1 } from "../../tests/helpers/d1.ts";
import { nppesRecord, nppesBody, URBAN_ACS, RURAL_ACS, acsBody, jsonResponse } from "../../tests/fixtures/research.ts";
import { GOOD_BRIEF, openAiResponse } from "../../tests/fixtures/brief.ts";

const PORT = Number(process.env.PORT || 8799);
const DIST = fileURLToPath(new URL("../../dist/", import.meta.url));
const NPPES_MODE = process.env.NPPES_MODE || "fixture";
const CENSUS_MODE = process.env.CENSUS_MODE || "fixture";
let scenario = "ok";
let { d1 } = createD1();

const TYPES: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".ttf": "font/ttf", ".json": "application/json", ".xml": "application/xml", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json", ".txt": "text/plain" };

function acsFor(zip: string) {
  if (zip === "10016") return URBAN_ACS;
  if (zip === "59301") return RURAL_ACS;
  return acsBody(zip, { pop: "23456", popM: "1200", age: "18.2", ageM: "1.5", unins: "7.1", uninsM: "1.3", inc: "71250", incM: "4100" });
}

// Brief that restates the facts the handler fetched, so it passes the guard.
function briefFor(body: string) {
  try {
    const input = JSON.parse(JSON.parse(body).input[0].content);
    const facts = input.FACTS;
    const pop = facts.facts.find((f: any) => f.id === "acs_population");
    const zipCount = facts.facts.find((f: any) => f.id === "nppes_zip_count");
    const s: any = { sections: [
      { heading: "Your area at a glance", statements: pop ? [{ text: `Census estimates ${pop.display} residents in ${pop.geography} (margin of error ${pop.marginOfError.replace("± ", "")}).`, kind: "fact", refs: ["acs_population"] }] : [{ text: "Census data was unavailable for this ZIP right now.", kind: "interpretation", refs: [] }] },
      { heading: "Providers already listed nearby", statements: zipCount ? [{ text: `The NPI Registry lists ${zipCount.display} providers with a matching taxonomy at a practice location in ZIP ${facts.zip}.`, kind: "fact", refs: ["nppes_zip_count"] }] : [{ text: "Provider counts were unavailable for this combination.", kind: "interpretation", refs: [] }] },
      { heading: "What this could mean for your plan", statements: [{ text: "Registry listings are not capacity, so confirm referral patterns and payer networks locally before choosing a site.", kind: "interpretation", refs: [] }] },
      { heading: "Questions to answer next", statements: [{ text: `Which payers in ${facts.state || "your state"} are accepting new ${input.INPUTS.providerType.toLowerCase()}s, and how long does enrollment take?`, kind: "interpretation", refs: [] }] },
    ] };
    return s;
  } catch {
    return GOOD_BRIEF;
  }
}

const mockFetch = async (input: string, init?: RequestInit): Promise<Response> => {
  const url = String(input);
  if (url.includes("turnstile/v0/siteverify"))
    return scenario === "verification" ? jsonResponse({ success: false, "error-codes": ["invalid-input-response"] }) : jsonResponse({ success: true, hostname: "localhost", action: "startup_research" });
  if (url.includes("api.hsforms.com")) return scenario === "hubspot_down" ? jsonResponse({ status: "error", message: "mock outage" }, 503) : jsonResponse({ inlineMessage: "Thanks (mock)" });
  if (url.includes("api.openai.com")) {
    await new Promise((r) => setTimeout(r, 900));
    if (scenario === "ai_down") return jsonResponse({ error: { message: "mock overload" } }, 503);
    if (scenario === "ai_invented") return jsonResponse(openAiResponse({ sections: [{ heading: "Your area at a glance", statements: [{ text: "About 4,800 people here need this specialty.", kind: "fact", refs: ["acs_population"] }] }, ...GOOD_BRIEF.sections.slice(1)] }));
    return jsonResponse(openAiResponse(briefFor(String(init?.body))));
  }
  if (url.includes("graph.facebook.com")) return jsonResponse({ events_received: 1 });
  if (url.includes("api.census.gov")) {
    if (scenario === "no_data") return jsonResponse({ error: "mock outage" }, 500);
    if (CENSUS_MODE === "live") return fetch(url, init);
    const zip = new URL(url).searchParams.get("for")!.split(":")[1];
    return jsonResponse(acsFor(zip));
  }
  if (url.includes("npiregistry.cms.hhs.gov")) {
    if (scenario === "no_data") return new Response("<html>mock outage</html>", { status: 503, headers: { "Content-Type": "text/html" } });
    if (NPPES_MODE === "live") return fetch(url, init);
    const u = new URL(url);
    if (Number(u.searchParams.get("skip") || 0) > 0) return jsonResponse(nppesBody([]));
    const zip = u.searchParams.get("postal_code");
    const n = zip === "59301" ? 3 : zip === "10016" ? 27 : 9;
    const city = zip === "59301" ? "MILES CITY" : zip === "10016" ? "NEW YORK" : "SPRINGFIELD";
    const state = zip === "59301" ? "MT" : zip === "10016" ? "NY" : "IL";
    const tax = (u.searchParams.get("taxonomy_description") || "Family Medicine");
    const desc = tax.startsWith("Psych") ? "Nurse Practitioner, Psych/Mental Health" : tax.startsWith("Orthopaedic") ? "Orthopaedic Surgery" : tax;
    const count = zip ? n : zip === null && state === "NY" ? 200 : 14;
    return jsonResponse(nppesBody(Array.from({ length: u.searchParams.get("city") === "NEW YORK" ? 200 : count }, (_, i) => nppesRecord(9000000 + i, { zip: zip || "10001", city: u.searchParams.get("city") || city, state: u.searchParams.get("state") || state, taxonomies: [desc] }))));
  }
  throw new Error(`unexpected upstream ${url}`);
};

function env(): ResearchEnv {
  const base: ResearchEnv = {
    RESEARCH_ENABLED: "true",
    RESEARCH_DB: d1,
    RESEARCH_HASH_SECRET: "local-dev-only",
    TURNSTILE_SECRET_KEY: "local-dev-only",
    HUBSPOT_RESEARCH_FORM_ID: "00000000-0000-4000-8000-000000000000",
    OPENAI_API_KEY: "local-dev-only",
    RESEARCH_MODEL: "mock-model",
    RESEARCH_DAILY_PER_EMAIL: "20",
    RESEARCH_DAILY_PER_IP: "50",
    RESEARCH_PREVIEW_DAILY_PER_IP: "500",
  };
  if (scenario === "unconfigured") return { RESEARCH_DB: d1 };
  if (scenario === "rate_limited") return { ...base, RESEARCH_DAILY_LIMIT: "0" };
  if (scenario === "capacity") return { ...base, RESEARCH_MAX_AI_CALLS_PER_DAY: "0" };
  if (scenario === "db_down") return { ...base, RESEARCH_DB: createD1({ faults: [{ match: /research_jobs/, error: "D1_ERROR: mock outage" }] }).d1 };
  return base;
}

createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const body = Buffer.concat(chunks);
  if (url.pathname === "/__scenario" && req.method === "POST") {
    scenario = JSON.parse(body.toString() || "{}").name || "ok";
    if (scenario === "reset") ({ d1 } = createD1()), (scenario = "ok");
    res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ scenario }));
    return;
  }
  if (url.pathname.startsWith("/api/")) {
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) if (typeof v === "string") headers.set(k, v);
    headers.set("CF-Connecting-IP", "127.0.0.1");
    const request = new Request(url, { method: req.method, headers, body: ["GET", "HEAD"].includes(req.method || "GET") ? undefined : body });
    const deps = { env: env(), fetcher: mockFetch, log: (e: string, d: Record<string, unknown>) => console.log("[handler]", e, JSON.stringify(d)) };
    let response: Response;
    if (url.pathname === "/api/startup-research-preview" && req.method === "GET") response = await handlePreview(request, deps);
    else if (url.pathname === "/api/startup-research" && req.method === "GET") response = handleAvailability(deps);
    else if (url.pathname === "/api/startup-research" && req.method === "POST") response = await handleGate(request, deps);
    else response = new Response(JSON.stringify({ ok: false, kind: "validation" }), { status: 405, headers: { "Content-Type": "application/json" } });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
    return;
  }
  let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  if (path.endsWith("/")) path += "index.html";
  let file = join(DIST, path);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    const data = await readFile(file);
    res.writeHead(200, { "Content-Type": TYPES[extname(file)] || "application/octet-stream" }).end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html" }).end(await readFile(join(DIST, "404.html")).catch(() => "Not found"));
  }
}).listen(PORT, () => console.log(`research mock server on http://localhost:${PORT} (NPPES ${NPPES_MODE}, Census ${CENSUS_MODE})`));
