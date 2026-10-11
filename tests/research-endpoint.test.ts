// Endpoint behavior against the real migration (node:sqlite) with stubbed
// Turnstile, HubSpot, OpenAI, NPPES, Census and Meta. No network.
import test from "node:test";
import assert from "node:assert/strict";
import { handleGate, handleAvailability, handlePreview, resetPreviewBlockedLog, type ResearchEnv } from "../src/lib/research/handler.ts";
import { createD1, type Fault } from "./helpers/d1.ts";
import { nppesRecord, nppesBody, URBAN_ACS, stubFetch, jsonResponse } from "./fixtures/research.ts";
import { GOOD_BRIEF, PROFILE, openAiResponse } from "./fixtures/brief.ts";
import { CONSENT_TEXT } from "../src/lib/research/copy.ts";

const ORIGIN = "https://practicestartupservices.com";
const NOW = new Date("2026-10-10T15:00:00Z");

type Opts = {
  env?: Partial<ResearchEnv>;
  faults?: Fault[];
  hideFirstSelects?: number;
  turnstile?: () => Response;
  hubspot?: Array<() => Response | Promise<Response>>;
  openai?: Array<() => Response | Promise<Response>>;
};

function setup(o: Opts = {}) {
  const { d1, sqlite } = createD1({ faults: o.faults, hideFirstSelects: o.hideFirstSelects });
  const hub = [...(o.hubspot ?? [])];
  const ai = [...(o.openai ?? [])];
  const stub = stubFetch([
    { match: /turnstile\/v0\/siteverify/, respond: o.turnstile ?? (() => jsonResponse({ success: true, hostname: "practicestartupservices.com", action: "startup_research" })) },
    { match: /api\.hsforms\.com/, respond: () => (hub.shift() ?? (() => jsonResponse({ inlineMessage: "Thanks" })))() },
    { match: /api\.openai\.com/, respond: () => (ai.shift() ?? (() => jsonResponse(openAiResponse(GOOD_BRIEF))))() },
    { match: /api\.census\.gov/, respond: () => jsonResponse(URBAN_ACS) },
    { match: /npiregistry/, respond: () => jsonResponse(nppesBody([1, 2, 3, 4].map((n) => nppesRecord(n, { zip: "10016", city: "NEW YORK", state: "NY", taxonomies: ["Orthopaedic Surgery"] })))) },
    { match: /graph\.facebook\.com/, respond: () => jsonResponse({ events_received: 1 }) },
  ]);
  const env: ResearchEnv = {
    RESEARCH_ENABLED: "true",
    RESEARCH_DB: d1,
    RESEARCH_HASH_SECRET: "test-hash-secret",
    TURNSTILE_SECRET_KEY: "test-turnstile-secret",
    HUBSPOT_RESEARCH_FORM_ID: "00000000-0000-4000-8000-000000000000",
    OPENAI_API_KEY: "test-openai-key",
    RESEARCH_MODEL: "test-model",
    ...o.env,
  };
  const pending: Promise<unknown>[] = [];
  let uuidN = 0;
  const deps = {
    env,
    fetcher: stub.fetcher,
    now: () => NOW,
    uuid: () => `00000000-0000-4000-8000-${String(++uuidN).padStart(12, "0")}`,
    waitUntil: (p: Promise<unknown>) => void pending.push(p),
    log: () => {},
  };
  return { deps, stub, sqlite, pending };
}

const RID = "11111111-1111-4111-8111-111111111111";
function body(extra: Record<string, unknown> = {}) {
  return { requestId: RID, email: "Founder@Example.com", consent: true, marketing: false, profile: PROFILE, token: "tok", attribution: { utm_source: "instagram", utm_campaign: "pss_free_resources_us_test01", utm_content: "startup_research", bogus: "x" }, ...extra };
}
function post(b: unknown, headers: Record<string, string> = {}) {
  return new Request(`${ORIGIN}/api/startup-research`, {
    method: "POST",
    headers: { Origin: ORIGIN, "Content-Type": "application/json", "CF-Connecting-IP": "203.0.113.9", "User-Agent": "test-agent", ...headers },
    body: typeof b === "string" ? b : JSON.stringify(b),
  });
}
async function read(r: Response) {
  assert.match(r.headers.get("content-type") || "", /application\/json/, "every response is JSON");
  assert.equal(r.headers.get("cache-control"), "no-store");
  return { status: r.status, json: (await r.json()) as Record<string, any> };
}
const HUB = /api\.hsforms\.com/;
const AI = /api\.openai\.com/;

test("availability and unconfigured gate report unavailable without calling any provider", async () => {
  const { deps, stub } = setup({ env: { HUBSPOT_RESEARCH_FORM_ID: undefined } });
  const a = await read(handleAvailability(new Request(`${ORIGIN}/api/startup-research`), deps));
  assert.equal(a.json.available, false);
  assert.equal(a.json.previewAvailable, true);
  const r = await read(await handleGate(post(body()), deps));
  assert.equal(r.status, 503);
  assert.equal(r.json.kind, "unavailable");
  assert.equal(stub.calls.length, 0);
  const off = setup({ env: { RESEARCH_ENABLED: "false" } });
  assert.equal((await read(handleAvailability(new Request(`${ORIGIN}/api/startup-research`), off.deps))).json.available, false);
});

test("success captures the lead once, returns a guarded brief, facts and a stable event id", async () => {
  const { deps, stub, sqlite } = setup();
  const r = await read(await handleGate(post(body()), deps));
  assert.equal(r.status, 200);
  assert.equal(r.json.ok, true);
  assert.equal(r.json.briefStatus, "ready");
  assert.equal(r.json.reference, "PSS-11111111");
  assert.equal(r.json.brief.sections.length, 4);
  assert.equal(r.json.facts.zip, "10016");
  assert.equal(r.json.saved, true);
  assert.equal(stub.count(HUB), 1);
  assert.equal(stub.count(AI), 1);
  // HubSpot payload: email only by default, UTMs on pageUri, consent text, no extra fields.
  const hub = JSON.parse(String(stub.calls.find((c) => HUB.test(c.url))!.init!.body));
  assert.deepEqual(hub.fields, [{ objectTypeId: "0-1", name: "email", value: "founder@example.com" }]);
  assert.equal(hub.context.pageUri, `${ORIGIN}/resources/startup-research/?utm_source=instagram&utm_campaign=pss_free_resources_us_test01&utm_content=startup_research`);
  assert.equal(hub.legalConsentOptions.consent.consentToProcess, true);
  assert.equal(hub.legalConsentOptions.consent.communications, undefined);
  // OpenAI: no web search, store disabled, strict schema, and the email never leaves for the model.
  const ai = JSON.parse(String(stub.calls.find((c) => AI.test(c.url))!.init!.body));
  assert.equal(ai.tools, undefined);
  assert.equal(ai.store, false);
  assert.equal(ai.text.format.strict, true);
  assert.ok(!JSON.stringify(ai).toLowerCase().includes("founder@example.com"));
  const row = sqlite.prepare("SELECT status, hubspot_status, ai_attempts, event_id, identity_hash FROM research_jobs").get() as any;
  assert.equal(row.status, "complete");
  assert.equal(row.hubspot_status, "submitted");
  assert.equal(row.ai_attempts, 1);
  assert.equal(row.event_id, r.json.eventId);
  assert.ok(!String(row.identity_hash).includes("@"), "email is stored only as a hash");
  assert.ok(!JSON.stringify(sqlite.prepare("SELECT * FROM research_jobs").all()).includes("founder@example.com"));
});

test("idempotent replay returns the stored result without new HubSpot or AI calls", async () => {
  const { deps, stub } = setup();
  const first = await read(await handleGate(post(body()), deps));
  const again = await read(await handleGate(post(body()), deps));
  assert.equal(again.status, 200);
  assert.equal(again.json.replay, true);
  assert.equal(again.json.eventId, first.json.eventId);
  assert.deepEqual(again.json.brief, first.json.brief);
  assert.equal(stub.count(HUB), 1);
  assert.equal(stub.count(AI), 1);
});

test("HubSpot outage is a provider error; the retry reuses the job (no new quota) and submits once", async () => {
  const { deps, stub, sqlite } = setup({ env: { RESEARCH_DAILY_PER_EMAIL: "1" }, hubspot: [() => jsonResponse({ status: "error" }, 503)] });
  const fail = await read(await handleGate(post(body()), deps));
  assert.equal(fail.status, 502);
  assert.equal(fail.json.kind, "provider");
  assert.equal(stub.count(AI), 0, "no paid AI call before the lead is captured");
  const ok = await read(await handleGate(post(body()), deps));
  assert.equal(ok.status, 200, "per-email cap of 1 is not consumed by the retry");
  assert.equal(stub.count(HUB), 2);
  assert.equal((sqlite.prepare("SELECT count(*) n FROM research_jobs").get() as any).n, 1);
});

test("an AI provider failure after lead capture never re-submits HubSpot on retry", async () => {
  const { deps, stub } = setup({ openai: [() => jsonResponse({ error: { message: "overloaded" } }, 500)] });
  const fail = await read(await handleGate(post(body()), deps));
  assert.equal(fail.status, 502);
  assert.equal(fail.json.kind, "provider");
  const ok = await read(await handleGate(post(body()), deps));
  assert.equal(ok.json.briefStatus, "ready");
  assert.equal(stub.count(HUB), 1, "HubSpot submitted exactly once per requestId");
  assert.equal(stub.count(AI), 2);
});

test("malformed or non-JSON AI responses are provider errors, not system or quota errors", async () => {
  for (const respond of [() => new Response("<html>bad gateway</html>", { status: 200, headers: { "Content-Type": "text/html" } }), () => new Response("", { status: 502 })]) {
    const { deps } = setup({ openai: [respond] });
    const r = await read(await handleGate(post(body()), deps));
    assert.equal(r.json.kind, "provider");
  }
});

test("database errors are 'system', never 'rate_limited'; unwrapped SELECT/UPDATE failures still return JSON", async () => {
  const insert = setup({ faults: [{ match: /^INSERT INTO research_jobs/, error: "D1_ERROR: database is locked: SQLITE_BUSY" }] });
  const a = await read(await handleGate(post(body()), insert.deps));
  assert.equal(a.status, 500);
  assert.equal(a.json.kind, "system");
  assert.equal(insert.stub.count(HUB), 0);
  const select = setup({ faults: [{ match: /^SELECT id, identity_hash/, error: "D1_ERROR: network connection lost" }] });
  const b = await read(await handleGate(post(body()), select.deps));
  assert.equal(b.json.kind, "system");
  const claim = setup({ faults: [{ match: /SET status = 'processing'/, error: "D1_ERROR: timeout" }] });
  const c = await read(await handleGate(post(body()), claim.deps));
  assert.equal(c.json.kind, "system");
  const usage = setup({ faults: [{ match: /UPDATE research_usage SET ai_calls/, error: "D1_ERROR: boom" }] });
  const d = await read(await handleGate(post(body()), usage.deps));
  assert.equal(d.json.kind, "system");
});

test("a duplicate-id INSERT (UNIQUE violation from a concurrent retry) resolves to the stored result, not a quota error", async () => {
  const { deps, stub } = setup();
  const first = await read(await handleGate(post(body()), deps));
  // Re-run with a SELECT that misses once, so INSERT hits the primary key.
  const sqliteDeps = { ...deps, env: { ...deps.env, RESEARCH_DB: hideOnce(deps.env.RESEARCH_DB!) } };
  const r = await read(await handleGate(post(body()), sqliteDeps));
  assert.equal(r.status, 200);
  assert.equal(r.json.replay, true);
  assert.equal(r.json.eventId, first.json.eventId);
  assert.equal(stub.count(HUB), 1);
});

function hideOnce(db: D1Database): D1Database {
  let hidden = false;
  return {
    prepare(sql: string) {
      const stmt = db.prepare(sql);
      if (!hidden && sql.startsWith("SELECT id, identity_hash")) {
        hidden = true;
        return { bind: () => ({ first: async () => null }) } as unknown as D1PreparedStatement;
      }
      return stmt;
    },
  } as unknown as D1Database;
}

test("quota limits return rate_limited (per email, per IP, global)", async () => {
  const { deps } = setup({ env: { RESEARCH_DAILY_PER_EMAIL: "2" } });
  for (const id of ["22222222-2222-4222-8222-222222222222", "33333333-3333-4333-8333-333333333333"])
    assert.equal((await read(await handleGate(post(body({ requestId: id })), deps))).status, 200);
  const third = await read(await handleGate(post(body({ requestId: "44444444-4444-4444-8444-444444444444" })), deps));
  assert.equal(third.status, 429);
  assert.equal(third.json.kind, "rate_limited");
  const ip = setup({ env: { RESEARCH_DAILY_PER_IP: "1" } });
  await handleGate(post(body()), ip.deps);
  const other = await read(await handleGate(post(body({ requestId: "55555555-5555-4555-8555-555555555555", email: "other@example.com" })), ip.deps));
  assert.equal(other.json.kind, "rate_limited");
  const global = setup({ env: { RESEARCH_DAILY_LIMIT: "0" } });
  assert.equal((await read(await handleGate(post(body()), global.deps))).json.kind, "rate_limited");
});

test("Turnstile failure is 'verification'; verification outage is 'provider'; neither reaches HubSpot", async () => {
  const bad = setup({ turnstile: () => jsonResponse({ success: false, "error-codes": ["invalid-input-response"] }) });
  const a = await read(await handleGate(post(body()), bad.deps));
  assert.equal(a.status, 403);
  assert.equal(a.json.kind, "verification");
  assert.equal(bad.stub.count(HUB), 0);
  const host = setup({ turnstile: () => jsonResponse({ success: true, hostname: "evil.example", action: "startup_research" }) });
  assert.equal((await read(await handleGate(post(body()), host.deps))).json.kind, "verification");
  const action = setup({ turnstile: () => jsonResponse({ success: true, hostname: "practicestartupservices.com", action: "other" }) });
  assert.equal((await read(await handleGate(post(body()), action.deps))).json.kind, "verification");
  const down = setup({ turnstile: () => { throw new Error("network"); } });
  const d = await read(await handleGate(post(body()), down.deps));
  assert.equal(d.json.kind, "provider");
  assert.equal(down.stub.count(HUB), 0);
});

test("request hygiene: exact origin, JSON content type, body cap, malformed JSON, field validation", async () => {
  const { deps, stub } = setup();
  assert.equal((await read(await handleGate(post(body(), { Origin: "https://evil.example" }), deps))).json.kind, "verification");
  assert.equal((await read(await handleGate(post(body(), { Origin: "https://practicestartupservices.com.evil.example" }), deps))).json.kind, "verification");
  assert.equal((await read(await handleGate(post(body(), { "Content-Type": "text/plain" }), deps))).json.kind, "validation");
  const big = await read(await handleGate(post(body({ pad: "x".repeat(9000) })), deps));
  assert.equal(big.json.kind, "validation");
  assert.equal((await read(await handleGate(post("{not json"), deps))).json.kind, "validation");
  const email = await read(await handleGate(post(body({ email: "not-an-email" })), deps));
  assert.equal(email.json.field, "email");
  const consent = await read(await handleGate(post(body({ consent: false })), deps));
  assert.equal(consent.json.field, "consent");
  const zip = await read(await handleGate(post(body({ profile: { ...PROFILE, zip: "1234" } })), deps));
  assert.equal(zip.json.field, "zip");
  const marketing = await read(await handleGate(post(body({ marketing: true })), deps));
  assert.equal(marketing.json.field, "marketing", "marketing consent requires a configured subscription");
  assert.equal(stub.calls.length, 0, "nothing reaches a provider before validation passes");
});

test("numeric guard rejection: never shown, counted as billed, one regeneration only, then fallback", async () => {
  const invented = { ...GOOD_BRIEF, sections: GOOD_BRIEF.sections.map((s, i) => (i === 0 ? { ...s, statements: [{ kind: "interpretation", refs: [], text: "About 3,200 locals need surgery." }] } : s)) };
  const { deps, stub, sqlite } = setup({ openai: [() => jsonResponse(openAiResponse(invented)), () => jsonResponse(openAiResponse(invented))] });
  const r = await read(await handleGate(post(body()), deps));
  assert.equal(r.status, 200, "the lead was captured; the visitor gets the deterministic deliverable");
  assert.equal(r.json.brief, null);
  assert.equal(r.json.briefStatus, "rejected");
  assert.ok(!JSON.stringify(r.json).includes("3,200"));
  assert.equal(stub.count(AI), 2, "stops after one regeneration");
  const usage = sqlite.prepare("SELECT ai_calls, rejected_billed FROM research_usage").get() as any;
  assert.equal(usage.ai_calls, 2);
  assert.equal(usage.rejected_billed, 2);
  const again = await read(await handleGate(post(body()), deps));
  assert.equal(again.json.replay, true);
  assert.equal(stub.count(AI), 2, "a replay never calls the model again");
});

test("first output rejected, regeneration accepted", async () => {
  const { deps, sqlite } = setup({ openai: [() => jsonResponse(openAiResponse(GOOD_BRIEF, "incomplete")), () => jsonResponse(openAiResponse(GOOD_BRIEF))] });
  const r = await read(await handleGate(post(body()), deps));
  assert.equal(r.json.briefStatus, "ready");
  assert.equal((sqlite.prepare("SELECT rejected_billed FROM research_usage").get() as any).rejected_billed, 1);
});

test("daily AI cap: no model call, lead still captured, honest fallback status", async () => {
  const { deps, stub } = setup({ env: { RESEARCH_MAX_AI_CALLS_PER_DAY: "0" } });
  const r = await read(await handleGate(post(body()), deps));
  assert.equal(r.status, 200);
  assert.equal(r.json.briefStatus, "capacity");
  assert.equal(stub.count(AI), 0);
  assert.equal(stub.count(HUB), 1);
});

test("a failed 'complete' write still returns the paid result instead of discarding it", async () => {
  const { deps, stub } = setup({ faults: [{ match: /SET status = 'complete'/, error: "D1_ERROR: write failed" }] });
  const r = await read(await handleGate(post(body()), deps));
  assert.equal(r.status, 200);
  assert.equal(r.json.saved, false);
  assert.equal(r.json.briefStatus, "ready");
  assert.equal(stub.count(AI), 1);
});

test("changed details on the same requestId is a conflict; a live lease is in_progress", async () => {
  const { deps } = setup();
  await handleGate(post(body()), deps);
  const conflict = await read(await handleGate(post(body({ email: "someone-else@example.com" })), deps));
  assert.equal(conflict.status, 409);
  assert.equal(conflict.json.kind, "conflict");
  const lease = setup();
  await handleGate(post(body({ requestId: "66666666-6666-4666-8666-666666666666" })), lease.deps);
  lease.sqlite.prepare("UPDATE research_jobs SET status = 'processing', lease_until = ?1, result_json = NULL").run(NOW.getTime() + 60000);
  const busy = await read(await handleGate(post(body({ requestId: "66666666-6666-4666-8666-666666666666" })), lease.deps));
  assert.equal(busy.json.kind, "in_progress");
});

test("Meta CAPI: sent once with the shared event id and no email/phone; skipped on replay or when unset", async () => {
  const off = setup();
  await handleGate(post(body()), off.deps);
  assert.equal(off.stub.count(/graph\.facebook\.com/), 0);
  // CAPI only runs when its dataset is the published browser pixel (one switch for behavior and disclosure).
  const mismatch = setup({ env: { META_PIXEL_ID: "123456789012345", META_CAPI_TOKEN: "test-capi-token" } });
  await handleGate(post(body()), mismatch.deps);
  assert.equal(mismatch.stub.count(/graph\.facebook\.com/), 0, "no CAPI without the matching PUBLIC_META_PIXEL_ID");
  const other = setup({ env: { META_PIXEL_ID: "123456789012345", PUBLIC_META_PIXEL_ID: "999999999999999", META_CAPI_TOKEN: "test-capi-token" } });
  await handleGate(post(body()), other.deps);
  assert.equal(other.stub.count(/graph\.facebook\.com/), 0);
  const { deps, stub, pending, sqlite } = setup({ env: { META_PIXEL_ID: "123456789012345", PUBLIC_META_PIXEL_ID: "123456789012345", META_CAPI_TOKEN: "test-capi-token" } });
  const r = await read(await handleGate(post(body(), { Cookie: "_fbp=fb.1.1.2; _fbc=fb.1.1.abc" }), deps));
  await Promise.all(pending);
  const call = stub.calls.find((c) => /graph\.facebook\.com/.test(c.url))!;
  assert.ok(!call.url.includes("test-capi-token") && !call.url.includes("access_token"), "token never in the URL");
  assert.equal(call.url, "https://graph.facebook.com/v23.0/123456789012345/events");
  assert.equal(JSON.parse(String(call.init!.body)).access_token, "test-capi-token");
  const event = JSON.parse(String(call.init!.body)).data[0];
  assert.equal(event.event_name, "Lead");
  assert.equal(event.event_id, r.json.eventId);
  assert.equal(event.action_source, "website");
  assert.deepEqual(Object.keys(event.user_data).sort(), ["client_ip_address", "client_user_agent", "fbc", "fbp"]);
  assert.deepEqual(event.custom_data, { content_name: "pss_startup_research", content_category: "startup_research" });
  assert.equal((sqlite.prepare("SELECT capi_status FROM research_jobs").get() as any).capi_status, "sent");
  await handleGate(post(body()), deps);
  await Promise.all(pending);
  assert.equal(stub.count(/graph\.facebook\.com/), 1);
});

test("HubSpot extra fields are sent only when the owner lists them", async () => {
  const { deps, stub } = setup({ env: { HUBSPOT_RESEARCH_FIELDS: "utm_source,utm_campaign,pss_specialty,pss_reference,unknown_field" } });
  await handleGate(post(body()), deps);
  const hub = JSON.parse(String(stub.calls.find((c) => HUB.test(c.url))!.init!.body));
  assert.deepEqual(hub.fields.map((f: any) => f.name), ["email", "utm_source", "utm_campaign", "pss_specialty", "pss_reference"]);
  assert.equal(hub.fields.find((f: any) => f.name === "pss_reference").value, "PSS-11111111");
});

test("HubSpot rejecting the email is a validation error on the email field", async () => {
  const { deps } = setup({ hubspot: [() => jsonResponse({ status: "error", errors: [{ errorType: "INVALID_EMAIL" }] }, 400)] });
  const r = await read(await handleGate(post(body()), deps));
  assert.equal(r.json.kind, "validation");
  assert.equal(r.json.field, "email");
  const cfg = setup({ hubspot: [() => jsonResponse({ status: "error" }, 404)] });
  assert.equal((await read(await handleGate(post(body()), cfg.deps))).json.kind, "system");
});

const PREVIEW_HOST = "https://abc123.practice-startup-services.pages.dev";
test("free preview works without a database binding on preview deployments and validates input", async () => {
  const { deps, stub } = setup({ env: { RESEARCH_DB: undefined, RESEARCH_ENABLED: undefined } });
  const ok = await read(await handlePreview(new Request(`${PREVIEW_HOST}/api/startup-research-preview?${new URLSearchParams(PROFILE as Record<string, string>)}`), deps));
  assert.equal(ok.status, 200);
  assert.equal(ok.json.facts.sections.nppes.status, "ok");
  assert.equal(stub.count(HUB) + stub.count(AI), 0, "the preview never captures a lead or calls the model");
  const bad = await read(await handlePreview(new Request(`${PREVIEW_HOST}/api/startup-research-preview?${new URLSearchParams({ ...PROFILE, zip: "abc" } as Record<string, string>)}`), deps));
  assert.equal(bad.json.field, "zip");
  const paused = setup({ env: { RESEARCH_PREVIEW_DISABLED: "true" } });
  assert.equal((await read(await handlePreview(new Request(`${ORIGIN}/api/startup-research-preview`), paused.deps))).json.kind, "unavailable");
});

test("free preview soft per-IP cap and cache use the database when bound", async () => {
  const { deps, stub } = setup({ env: { RESEARCH_PREVIEW_DAILY_PER_IP: "2" } });
  const req = () => new Request(`${ORIGIN}/api/startup-research-preview?${new URLSearchParams(PROFILE as Record<string, string>)}`, { headers: { "CF-Connecting-IP": "198.51.100.4" } });
  assert.equal((await handlePreview(req(), deps)).status, 200);
  const calls = stub.calls.length;
  assert.equal((await handlePreview(req(), deps)).status, 200);
  assert.equal(stub.calls.length, calls, "second preview served from the D1 cache");
  assert.equal((await read(await handlePreview(req(), deps))).json.kind, "rate_limited");
});

const q = () => new URLSearchParams(PROFILE as Record<string, string>).toString();

test("production previews require an abuse limit; IPs are never hashed with a public key", async () => {
  const noDb = setup({ env: { RESEARCH_DB: undefined } });
  const r = await read(await handlePreview(new Request(`${ORIGIN}/api/startup-research-preview?${q()}`), noDb.deps));
  assert.equal(r.json.kind, "unavailable", "no DB counter and no confirmed WAF rule on production");
  const waf = setup({ env: { RESEARCH_DB: undefined, RESEARCH_PREVIEW_WAF_CONFIRMED: "true" } });
  assert.equal((await handlePreview(new Request(`${ORIGIN}/api/startup-research-preview?${q()}`), waf.deps)).status, 200);
  // DB bound but no hash secret: the counter is skipped entirely (no fallback key).
  const noSecret = setup({ env: { RESEARCH_HASH_SECRET: undefined } });
  assert.equal((await handlePreview(new Request(`${PREVIEW_HOST}/api/startup-research-preview?${q()}`, { headers: { "CF-Connecting-IP": "198.51.100.7" } }), noSecret.deps)).status, 200);
  assert.equal((noSecret.sqlite.prepare("SELECT count(*) n FROM research_preview_usage").get() as any).n, 0);
  assert.equal((await read(await handlePreview(new Request(`${ORIGIN}/api/startup-research-preview?${q()}`), noSecret.deps))).json.kind, "unavailable");
});

test("a failed hubspot_status write cannot cause a second HubSpot submission", async () => {
  const { deps, stub, sqlite } = setup({
    faults: [{ match: /^UPDATE research_jobs SET hubspot_status = 'submitted', updated_at/, error: "D1_ERROR: write failed", times: 2 }],
    openai: [() => jsonResponse({ error: { message: "overloaded" } }, 503)],
  });
  assert.equal((await read(await handleGate(post(body()), deps))).json.kind, "provider");
  assert.equal((sqlite.prepare("SELECT hubspot_status FROM research_jobs").get() as any).hubspot_status, "submitted", "release() recorded it");
  const ok = await read(await handleGate(post(body()), deps));
  assert.equal(ok.json.briefStatus, "ready");
  assert.equal(stub.count(HUB), 1);
});

test("OpenAI 400/401/403/404 is a system error with no retry and the reserved call refunded", async () => {
  for (const status of [400, 401, 403, 404]) {
    const { deps, stub, sqlite } = setup({ openai: [() => jsonResponse({ error: { message: "bad" } }, status)] });
    const r = await read(await handleGate(post(body()), deps));
    assert.equal(r.json.kind, "system", String(status));
    assert.equal(stub.count(AI), 1, "no second call in the same request");
    assert.equal((sqlite.prepare("SELECT ai_calls FROM research_usage").get() as any).ai_calls, 0);
    assert.equal((sqlite.prepare("SELECT ai_attempts FROM research_jobs").get() as any).ai_attempts, 0);
  }
});

test("lease covers the AI calls and is renewed; bodies without Content-Length are stream-capped", async () => {
  const { deps, sqlite, stub } = setup({ faults: [{ match: /SET status = 'complete'/, error: "D1_ERROR: keep processing", times: 2 }] });
  await handleGate(post(body()), deps);
  const lease = (sqlite.prepare("SELECT lease_until FROM research_jobs").get() as any).lease_until;
  assert.ok(lease >= NOW.getTime() + 240000, "lease is at least 240 s");
  const big = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(JSON.stringify(body({ pad: "x".repeat(10000) })))); c.close(); } });
  const req = new Request(`${ORIGIN}/api/startup-research`, { method: "POST", headers: { Origin: ORIGIN, "Content-Type": "application/json" }, body: big, duplex: "half" } as RequestInit);
  assert.equal(req.headers.get("content-length"), null);
  const r = await read(await handleGate(req, deps));
  assert.equal(r.json.kind, "validation");
  assert.equal(r.json.message, "Request too large.");
  void stub;
});

test("HubSpot receives exactly the consent text shown in the form", async () => {
  const { deps, stub } = setup();
  await handleGate(post(body()), deps);
  const hub = JSON.parse(String(stub.calls.find((c) => HUB.test(c.url))!.init!.body));
  assert.equal(hub.legalConsentOptions.consent.text, CONSENT_TEXT);
});

test("CAPI never fires from preview deployments, even with matching IDs", async () => {
  const { deps, stub, pending } = setup({ env: { META_PIXEL_ID: "123456789012345", PUBLIC_META_PIXEL_ID: "123456789012345", META_CAPI_TOKEN: "t" }, turnstile: () => jsonResponse({ success: true, hostname: "abc123.practice-startup-services.pages.dev", action: "startup_research" }) });
  const req = new Request(`${PREVIEW_HOST}/api/startup-research`, { method: "POST", headers: { Origin: PREVIEW_HOST, "Content-Type": "application/json" }, body: JSON.stringify(body()) });
  const r = await read(await handleGate(req, deps));
  assert.equal(r.status, 200);
  await Promise.all(pending);
  assert.equal(stub.count(/graph\.facebook\.com/), 0);
});

test("availability reports the real previewAvailable for the hostname (same rule as the preview)", async () => {
  const cases: Array<[Partial<ResearchEnv>, string, boolean]> = [
    [{ RESEARCH_DB: undefined }, ORIGIN, false],
    [{ RESEARCH_HASH_SECRET: undefined }, ORIGIN, false],
    [{}, ORIGIN, true],
    [{ RESEARCH_DB: undefined, RESEARCH_PREVIEW_WAF_CONFIRMED: "true" }, ORIGIN, true],
    [{ RESEARCH_DB: undefined }, PREVIEW_HOST, true],
    [{ RESEARCH_PREVIEW_DISABLED: "true" }, PREVIEW_HOST, false],
  ];
  for (const [env, host, expected] of cases) {
    resetPreviewBlockedLog();
    const logs: string[] = [];
    const { deps } = setup({ env });
    const d = { ...deps, log: (e: string) => void logs.push(e) };
    const a = await read(handleAvailability(new Request(`${host}/api/startup-research`), d));
    assert.equal(a.json.previewAvailable, expected, JSON.stringify(env) + host);
    const p = await handlePreview(new Request(`${host}/api/startup-research-preview?${q()}`), d);
    assert.equal(p.status === 200, expected, "preview endpoint agrees with availability");
    if (!expected && !env.RESEARCH_PREVIEW_DISABLED) assert.ok(logs.includes("preview_blocked_unconfigured"));
  }
});

test("AI config errors are capped per job; after a rejected output a 4xx finishes with the fallback", async () => {
  const { deps, stub } = setup({ openai: [() => jsonResponse({ error: {} }, 401), () => jsonResponse({ error: {} }, 401)] });
  assert.equal((await read(await handleGate(post(body()), deps))).json.kind, "system");
  assert.equal((await read(await handleGate(post(body()), deps))).json.kind, "unavailable", "second config error caps the job");
  assert.equal((await read(await handleGate(post(body()), deps))).json.kind, "unavailable");
  assert.equal(stub.count(AI), 2, "no further AI calls once capped");
  const invented = { ...GOOD_BRIEF, sections: GOOD_BRIEF.sections.map((s, i) => (i === 2 ? { ...s, statements: [{ kind: "interpretation", refs: [], text: "Expect 40 visits a day." }] } : s)) };
  const mixed = setup({ openai: [() => jsonResponse(openAiResponse(invented)), () => jsonResponse({ error: {} }, 400)] });
  const r = await read(await handleGate(post(body()), mixed.deps));
  assert.equal(r.status, 200);
  assert.equal(r.json.briefStatus, "rejected");
  assert.equal(r.json.brief, null);
});

test("lease renewal is owner-checked and never consumes an attempt when it fails or is lost", async () => {
  const failing = setup({ faults: [{ match: /SET lease_until = \?2 WHERE id = \?1 AND lease_token/, error: "D1_ERROR: timeout" }] });
  assert.equal((await read(await handleGate(post(body()), failing.deps))).json.kind, "system");
  assert.equal(failing.stub.count(AI), 0);
  assert.equal((failing.sqlite.prepare("SELECT ai_attempts FROM research_jobs").get() as any).ai_attempts, 0);
  assert.equal((failing.sqlite.prepare("SELECT count(*) n FROM research_usage WHERE ai_calls > 0").get() as any).n, 0);
  // Another worker takes the lease while we wait on HubSpot.
  let steal = () => {};
  const lost = setup({ hubspot: [() => { steal(); return jsonResponse({ inlineMessage: "ok" }); }] });
  steal = () => lost.sqlite.prepare("UPDATE research_jobs SET lease_token = 'other-worker'").run();
  assert.equal((await read(await handleGate(post(body()), lost.deps))).json.kind, "in_progress");
  assert.equal(lost.stub.count(AI), 0);
  assert.equal((lost.sqlite.prepare("SELECT ai_attempts FROM research_jobs").get() as any).ai_attempts, 0);
});

test("concurrent submissions with the same requestId: one 200, the rest 409, one HubSpot, one AI", async () => {
  const slow = (r: Response) => new Promise<Response>((res) => setTimeout(() => res(r), 30));
  const { deps, stub } = setup({
    hubspot: [() => slow(jsonResponse({ inlineMessage: "ok" })), () => slow(jsonResponse({ inlineMessage: "ok" })), () => slow(jsonResponse({ inlineMessage: "ok" }))],
  });
  const results = await Promise.all([1, 2, 3].map(async () => read(await handleGate(post(body()), deps))));
  const statuses = results.map((r) => r.status).sort();
  assert.deepEqual(statuses, [200, 409, 409]);
  assert.ok(results.filter((r) => r.status === 409).every((r) => r.json.kind === "in_progress"));
  assert.equal(stub.count(HUB), 1);
  assert.equal(stub.count(AI), 1);
});

test("preview_blocked_unconfigured is logged once per isolate, not per request", async () => {
  resetPreviewBlockedLog();
  const logs: string[] = [];
  const { deps } = setup({ env: { RESEARCH_DB: undefined } });
  const d = { ...deps, log: (e: string) => void logs.push(e) };
  for (let i = 0; i < 5; i++) {
    handleAvailability(new Request(`${ORIGIN}/api/startup-research`), d);
    await handlePreview(new Request(`${ORIGIN}/api/startup-research-preview?${q()}`), d);
  }
  assert.equal(logs.filter((e) => e === "preview_blocked_unconfigured").length, 1);
});

test("release and save only write while this request still holds the lease", async () => {
  let steal = () => {};
  const { deps, sqlite } = setup({ openai: [() => { steal(); return jsonResponse(openAiResponse(GOOD_BRIEF)); }] });
  steal = () => sqlite.prepare("UPDATE research_jobs SET lease_token = 'other-worker'").run();
  const r = await read(await handleGate(post(body()), deps));
  assert.equal(r.status, 200, "the visitor still gets the paid result");
  assert.equal(r.json.saved, false);
  assert.equal((sqlite.prepare("SELECT status FROM research_jobs").get() as any).status, "processing", "no write over another worker's lease");
});
