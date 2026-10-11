// Server logic for /api/startup-research (gated brief) and
// /api/startup-research-preview (free preview). Pure functions over injected
// dependencies so tests can run them against a real SQLite database and
// stubbed upstreams. Every response is JSON with an explicit `ok` and, on
// failure, a `kind` the browser maps to copy:
//   validation | verification | rate_limited | provider | system |
//   conflict | in_progress | unavailable
// Idempotency: the client sends one requestId per logical submission. The
// same requestId returns the stored result; HubSpot is submitted at most once
// per requestId; AI is called at most twice per requestId (one regeneration).

import { validateGate, validateProfile, referenceFor, ValidationError, type FailureKind, type GateRequest } from "./contract.ts";
import { buildFacts, type Cache, type FactsBundle, type Fetcher } from "./facts.ts";
import { generateBrief, briefInputs, ProviderError } from "./brief.ts";
import { validateBrief, citableIds, type Brief } from "./guard.ts";
import { CONSENT_TEXT, MARKETING_TEXT } from "./copy.ts";

export interface ResearchEnv {
  RESEARCH_ENABLED?: string;
  RESEARCH_DB?: D1Database;
  RESEARCH_HASH_SECRET?: string;
  TURNSTILE_SECRET_KEY?: string;
  HUBSPOT_RESEARCH_FORM_ID?: string;
  HUBSPOT_RESEARCH_FIELDS?: string;
  HUBSPOT_MARKETING_SUBSCRIPTION_ID?: string;
  OPENAI_API_KEY?: string;
  RESEARCH_MODEL?: string;
  RESEARCH_MAX_AI_CALLS_PER_DAY?: string;
  RESEARCH_DAILY_LIMIT?: string;
  RESEARCH_DAILY_PER_EMAIL?: string;
  RESEARCH_DAILY_PER_IP?: string;
  CENSUS_API_KEY?: string;
  RESEARCH_PREVIEW_DISABLED?: string;
  RESEARCH_PREVIEW_DAILY_PER_IP?: string;
  /** "true" only after the owner adds a Cloudflare rate-limiting rule for the preview endpoint. */
  RESEARCH_PREVIEW_WAF_CONFIRMED?: string;
  META_PIXEL_ID?: string;
  /** Must equal META_PIXEL_ID: the published browser pixel (and its privacy text) and CAPI share one switch. */
  PUBLIC_META_PIXEL_ID?: string;
  META_CAPI_TOKEN?: string;
  META_GRAPH_VERSION?: string;
}

export type Deps = {
  env: ResearchEnv;
  fetcher: Fetcher;
  now?: () => Date;
  uuid?: () => string;
  waitUntil?: (p: Promise<unknown>) => void;
  log?: (event: string, detail: Record<string, unknown>) => void;
};

export const HUBSPOT_PORTAL_ID = "1849537";
export const TURNSTILE_ACTION = "startup_research";
export const MAX_BODY_BYTES = 8192;
export const MAX_AI_ATTEMPTS_PER_REQUEST = 2;
// Covers HubSpot + facts + two 60 s AI calls; renewed before each AI call.
const LEASE_MS = 240_000;
export const PRODUCTION_HOSTS = ["practicestartupservices.com", "www.practicestartupservices.com"];

const HEADERS = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
export function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: HEADERS });
}

const MESSAGES: Record<FailureKind, string> = {
  validation: "Please check the highlighted field.",
  verification: "We could not verify this request. Complete the check and try again.",
  rate_limited: "The daily limit for written briefs has been reached. Your free preview, checklist and pro forma still work. Please try again tomorrow.",
  provider: "A service we rely on is temporarily unavailable. Your details are kept. Please try again in a minute.",
  system: "Something went wrong on our side. Please try again, or book a free first conversation instead.",
  conflict: "Your details changed since your last request. Submit again to start a new request.",
  in_progress: "Your brief is still being prepared. Please try again in a minute.",
  unavailable: "The written brief is not available yet. Your free preview, checklist and pro forma work now.",
};
const STATUS: Record<FailureKind, number> = { validation: 400, verification: 403, rate_limited: 429, provider: 502, system: 500, conflict: 409, in_progress: 409, unavailable: 503 };

export function fail(kind: FailureKind, extra: Record<string, unknown> = {}): Response {
  return json({ ok: false, kind, message: MESSAGES[kind], ...extra }, STATUS[kind]);
}

class Halt extends Error {
  response: Response;
  constructor(response: Response) {
    super("halt");
    this.response = response;
  }
}

function int(v: string | undefined, fallback: number, max = 100000): number {
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= max ? n : fallback;
}

export function gateConfigured(env: ResearchEnv): boolean {
  return env.RESEARCH_ENABLED === "true" && !!(env.RESEARCH_DB && env.RESEARCH_HASH_SECRET && env.TURNSTILE_SECRET_KEY && env.HUBSPOT_RESEARCH_FORM_ID && env.OPENAI_API_KEY && env.RESEARCH_MODEL);
}

async function hmac(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function d1Cache(db: D1Database | undefined, now: () => Date): Cache | undefined {
  if (!db) return undefined;
  return {
    async get(key) {
      const row = await db.prepare("SELECT value FROM research_cache WHERE key = ?1 AND expires_at > ?2").bind(key, now().getTime()).first<{ value: string }>();
      return row?.value ?? null;
    },
    async put(key, value, ttl) {
      await db.prepare("INSERT INTO research_cache (key, value, expires_at) VALUES (?1, ?2, ?3) ON CONFLICT(key) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at").bind(key, value, now().getTime() + ttl * 1000).run();
    },
  };
}

function cookie(request: Request, name: string): string {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=").slice(0, 300);
  }
  return "";
}

// ------------------------------------------------------------- GET

/** Whether the free preview may run on this hostname (same rule as handlePreview). */
export function previewAllowed(hostname: string, env: ResearchEnv): { ok: boolean; reason: "" | "disabled" | "unconfigured" } {
  if (env.RESEARCH_PREVIEW_DISABLED === "true") return { ok: false, reason: "disabled" };
  // Production previews need an abuse limit: the D1 counter (DB + hash secret)
  // or a confirmed Cloudflare rate-limiting rule. Preview deployments stay open.
  const limited = !!(env.RESEARCH_DB && env.RESEARCH_HASH_SECRET);
  if (PRODUCTION_HOSTS.includes(hostname) && !limited && env.RESEARCH_PREVIEW_WAF_CONFIRMED !== "true") return { ok: false, reason: "unconfigured" };
  return { ok: true, reason: "" };
}

// Log a blocked production preview at most once per isolate (no PII, no noise).
let previewBlockedLogged = false;
export function resetPreviewBlockedLog(): void {
  previewBlockedLogged = false;
}
function logPreviewBlocked(deps: Deps, where: string): void {
  if (previewBlockedLogged) return;
  previewBlockedLogged = true;
  deps.log?.("preview_blocked_unconfigured", { where });
}

export function handleAvailability(request: Request, deps: Deps): Response {
  const { env } = deps;
  const preview = previewAllowed(new URL(request.url).hostname, env);
  if (preview.reason === "unconfigured") logPreviewBlocked(deps, "availability");
  return json({
    ok: true,
    available: gateConfigured(env),
    marketingAvailable: gateConfigured(env) && !!env.HUBSPOT_MARKETING_SUBSCRIPTION_ID,
    previewAvailable: preview.ok,
  });
}

// --------------------------------------------------------- Preview

export async function handlePreview(request: Request, deps: Deps): Promise<Response> {
  const { env } = deps;
  const now = deps.now ?? (() => new Date());
  const url = new URL(request.url);
  const allowed = previewAllowed(url.hostname, env);
  if (allowed.reason === "disabled") return fail("unavailable", { message: "The free preview is paused. Your checklist and pro forma still work." });
  if (allowed.reason === "unconfigured") {
    logPreviewBlocked(deps, "preview");
    return fail("unavailable", { message: "The free preview is not available yet. Your checklist and pro forma still work." });
  }
  let profile;
  try {
    profile = validateProfile(Object.fromEntries(url.searchParams));
  } catch (e) {
    if (e instanceof ValidationError) return fail("validation", { field: e.field, message: e.message });
    return fail("validation");
  }
  const db = env.RESEARCH_DB;
  const limited = !!(db && env.RESEARCH_HASH_SECRET);
  if (limited) {
    // Per-IP daily cap on a keyed hash (never a public fallback key).
    try {
      const day = now().toISOString().slice(0, 10);
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const ipHash = await hmac(env.RESEARCH_HASH_SECRET!, `preview|${ip}|${day}`);
      const row = await db!
        .prepare("INSERT INTO research_preview_usage (day, ip_hash, n) VALUES (?1, ?2, 1) ON CONFLICT(day, ip_hash) DO UPDATE SET n = n + 1 RETURNING n")
        .bind(day, ipHash)
        .first<{ n: number }>();
      if (row && row.n > int(env.RESEARCH_PREVIEW_DAILY_PER_IP, 60)) return fail("rate_limited", { message: "You have run many previews today. Please try again tomorrow. Your checklist and pro forma still work." });
    } catch (e) {
      deps.log?.("preview_usage_error", { error: String(e).slice(0, 200) });
    }
  }
  try {
    const facts = await buildFacts(profile, { fetcher: deps.fetcher, cache: d1Cache(db, now), censusKey: env.CENSUS_API_KEY, now: now() });
    return json({ ok: true, facts });
  } catch (e) {
    deps.log?.("preview_error", { error: String(e).slice(0, 200) });
    return fail("system");
  }
}

// ------------------------------------------------------------ Gate

type JobRow = {
  id: string;
  identity_hash: string;
  context_hash: string;
  status: string;
  lease_until: number;
  hubspot_status: string;
  ai_attempts: number;
  ai_rejected: number;
  event_id: string;
  capi_status: string;
  result_json: string | null;
  config_errors: number;
};

const SELECT_JOB = "SELECT id, identity_hash, context_hash, status, lease_until, hubspot_status, ai_attempts, ai_rejected, event_id, capi_status, result_json, config_errors FROM research_jobs WHERE id = ?1";

async function dbStep<T>(label: string, deps: Deps, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    deps.log?.("db_error", { step: label, error: String(e).slice(0, 200) });
    throw new Halt(fail("system"));
  }
}

async function verifyTurnstile(request: Request, token: string, deps: Deps): Promise<void> {
  let result: { success?: boolean; hostname?: string; action?: string };
  try {
    const r = await deps.fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: deps.env.TURNSTILE_SECRET_KEY!, response: token, remoteip: request.headers.get("CF-Connecting-IP") || "" }),
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw new Error(`siteverify_${r.status}`);
    result = (await r.json()) as typeof result;
  } catch {
    throw new Halt(fail("provider", { message: "The verification service is temporarily unavailable. Your details are kept. Please try again in a minute." }));
  }
  if (!result.success || result.hostname !== new URL(request.url).hostname || result.action !== TURNSTILE_ACTION)
    throw new Halt(fail("verification", { field: "verification" }));
}

const HUBSPOT_FIELD_SOURCES: Record<string, (g: GateRequest, ref: string) => string> = {
  pss_specialty: (g) => g.profile.specialty,
  pss_provider_type: (g) => g.profile.provider,
  pss_zip: (g) => g.profile.zip,
  pss_practice_model: (g) => g.profile.model,
  pss_payment_model: (g) => g.profile.payer,
  pss_launch_stage: (g) => g.profile.stage,
  pss_reference: (_g, ref) => ref,
};

export function hubspotPayload(g: GateRequest, origin: string, env: ResearchEnv, hutk: string, now: Date) {
  const ref = referenceFor(g.requestId);
  // pageUri carries last-touch UTMs so HubSpot records the campaign source.
  const params = new URLSearchParams();
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id"]) if (g.attribution[k]) params.set(k, g.attribution[k]);
  const pageUri = `${origin}/resources/startup-research/${params.toString() ? `?${params}` : ""}`;
  // Only fields the owner confirmed exist on the HubSpot form are sent.
  const allow = new Set((env.HUBSPOT_RESEARCH_FIELDS || "").split(",").map((s) => s.trim()).filter(Boolean));
  const fields: Array<{ objectTypeId: string; name: string; value: string }> = [{ objectTypeId: "0-1", name: "email", value: g.email }];
  for (const name of allow) {
    const value = HUBSPOT_FIELD_SOURCES[name]?.(g, ref) ?? g.attribution[name] ?? "";
    if (value && name !== "email") fields.push({ objectTypeId: "0-1", name, value });
  }
  const consent: Record<string, unknown> = {
    consentToProcess: true,
    text: CONSENT_TEXT,
  };
  if (g.marketing && env.HUBSPOT_MARKETING_SUBSCRIPTION_ID)
    consent.communications = [{ value: true, subscriptionTypeId: Number(env.HUBSPOT_MARKETING_SUBSCRIPTION_ID), text: MARKETING_TEXT }];
  const context: Record<string, string> = { pageUri, pageName: "Startup research brief" };
  if (hutk) context.hutk = hutk;
  return { submittedAt: String(now.getTime()), fields, context, legalConsentOptions: { consent } };
}

async function submitHubspot(g: GateRequest, request: Request, deps: Deps, now: Date): Promise<void> {
  const origin = new URL(request.url).origin;
  let r: Response;
  try {
    r = await deps.fetcher(`https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${deps.env.HUBSPOT_RESEARCH_FORM_ID}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hubspotPayload(g, origin, deps.env, cookie(request, "hubspotutk"), now)),
      signal: AbortSignal.timeout(12000),
    });
  } catch {
    throw new HubspotFailure("provider", "network");
  }
  if (r.ok) return;
  const text = await r.text().catch(() => "");
  if (r.status === 400 && /INVALID_EMAIL|BLOCKED_EMAIL/i.test(text)) throw new HubspotFailure("validation", "invalid_email");
  if (r.status >= 500 || r.status === 429) throw new HubspotFailure("provider", `http_${r.status}`);
  // Other 4xx means our form configuration is wrong: an agency-side error.
  throw new HubspotFailure("system", `http_${r.status}`);
}

class HubspotFailure extends Error {
  kind: FailureKind;
  code: string;
  constructor(kind: FailureKind, code: string) {
    super(code);
    this.kind = kind;
    this.code = code;
  }
}

async function reserveAiCall(db: D1Database, day: string, cap: number): Promise<boolean> {
  await db.prepare("INSERT INTO research_usage (day) VALUES (?1) ON CONFLICT(day) DO NOTHING").bind(day).run();
  const r = await db.prepare("UPDATE research_usage SET ai_calls = ai_calls + 1 WHERE day = ?1 AND ai_calls < ?2").bind(day, cap).run();
  return (r.meta?.changes ?? 0) === 1;
}

function sendCapi(request: Request, deps: Deps, eventId: string, db: D1Database, jobId: string, now: Date): void {
  const { env } = deps;
  // CAPI runs only for the same dataset the site publishes (and discloses).
  if (!env.META_PIXEL_ID || !env.META_CAPI_TOKEN || env.PUBLIC_META_PIXEL_ID?.trim() !== env.META_PIXEL_ID.trim()) return;
  // Never from preview deployments or local hosts: production hostnames only.
  if (!PRODUCTION_HOSTS.includes(new URL(request.url).hostname)) return;
  const version = env.META_GRAPH_VERSION || "v23.0";
  const userData: Record<string, string> = {};
  const ip = request.headers.get("CF-Connecting-IP");
  const ua = request.headers.get("User-Agent");
  if (ip) userData.client_ip_address = ip;
  if (ua) userData.client_user_agent = ua.slice(0, 500);
  const fbp = cookie(request, "_fbp");
  const fbc = cookie(request, "_fbc");
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;
  const body = {
    access_token: env.META_CAPI_TOKEN,
    data: [{
      event_name: "Lead",
      event_time: Math.floor(now.getTime() / 1000),
      event_id: eventId,
      action_source: "website",
      event_source_url: `https://${new URL(request.url).hostname}/resources/startup-research/`,
      user_data: userData,
      custom_data: { content_name: "pss_startup_research", content_category: "startup_research" },
    }],
  };
  const task = (async () => {
    try {
      // Token travels in the JSON body, never in the URL.
      const r = await deps.fetcher(`https://graph.facebook.com/${version}/${encodeURIComponent(env.META_PIXEL_ID!)}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
      });
      await db.prepare("UPDATE research_jobs SET capi_status = ?2 WHERE id = ?1").bind(jobId, r.ok ? "sent" : `failed_${r.status}`).run();
    } catch {
      // Never log the token or fail the lead because of measurement.
      await db.prepare("UPDATE research_jobs SET capi_status = 'failed' WHERE id = ?1").bind(jobId).run().catch(() => {});
    }
  })();
  if (deps.waitUntil) deps.waitUntil(task);
}

/** Read at most `max` bytes; null when the body is larger (works without Content-Length). */
export async function readCapped(request: Request, max: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let o = 0;
  for (const c of chunks) {
    all.set(c, o);
    o += c.byteLength;
  }
  return new TextDecoder().decode(all);
}

export async function handleGate(request: Request, deps: Deps): Promise<Response> {
  try {
    return await gate(request, deps);
  } catch (e) {
    if (e instanceof Halt) return e.response;
    deps.log?.("gate_unhandled", { error: String(e).slice(0, 200) });
    return fail("system");
  }
}

async function gate(request: Request, deps: Deps): Promise<Response> {
  const { env } = deps;
  const now = deps.now ?? (() => new Date());
  if (!gateConfigured(env)) return fail("unavailable");
  const url = new URL(request.url);
  if (request.headers.get("Origin") !== url.origin) return fail("verification", { message: "Please use the form on this page." });
  if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) return fail("validation", { field: "form" });
  const declared = Number(request.headers.get("Content-Length") || "0");
  if (declared > MAX_BODY_BYTES) return fail("validation", { field: "form", message: "Request too large." });
  const raw = await readCapped(request, MAX_BODY_BYTES);
  if (raw === null) return fail("validation", { field: "form", message: "Request too large." });
  let g: GateRequest;
  try {
    g = validateGate(JSON.parse(raw));
  } catch (e) {
    if (e instanceof ValidationError) return fail("validation", { field: e.field, message: e.message });
    return fail("validation", { field: "form" });
  }
  if (g.marketing && !env.HUBSPOT_MARKETING_SUBSCRIPTION_ID) return fail("validation", { field: "marketing", message: "Optional email updates are not available yet. Uncheck that box to continue." });

  await verifyTurnstile(request, g.token, deps);

  const db = env.RESEARCH_DB!;
  const t = now();
  const day = t.toISOString().slice(0, 10);
  const identity = await hmac(env.RESEARCH_HASH_SECRET!, `email|${g.email}`);
  const ipHash = await hmac(env.RESEARCH_HASH_SECRET!, `ip|${request.headers.get("CF-Connecting-IP") || "unknown"}|${day}`);
  const context = await hmac(env.RESEARCH_HASH_SECRET!, `context|${JSON.stringify(g.profile)}|${g.marketing}`);
  const reference = referenceFor(g.requestId);

  let job = await dbStep("select", deps, () => db.prepare(SELECT_JOB).bind(g.requestId).first<JobRow>());
  if (!job) {
    const eventId = (deps.uuid ?? (() => crypto.randomUUID()))();
    let inserted = 0;
    try {
      const r = await db
        .prepare(
          `INSERT INTO research_jobs (id, identity_hash, ip_hash, context_hash, day, created_at, updated_at, event_id)
           SELECT ?1, ?2, ?3, ?4, ?5, ?6, ?6, ?7
           WHERE (SELECT count(*) FROM research_jobs WHERE day = ?5) < ?8
             AND (SELECT count(*) FROM research_jobs WHERE day = ?5 AND identity_hash = ?2) < ?9
             AND (SELECT count(*) FROM research_jobs WHERE day = ?5 AND ip_hash = ?3) < ?10`,
        )
        .bind(g.requestId, identity, ipHash, context, day, t.getTime(), eventId, int(env.RESEARCH_DAILY_LIMIT, 50), int(env.RESEARCH_DAILY_PER_EMAIL, 2), int(env.RESEARCH_DAILY_PER_IP, 5))
        .run();
      inserted = r.meta?.changes ?? 0;
    } catch (e) {
      // A concurrent request with the same id won the insert: not a quota error.
      if (!/UNIQUE|PRIMARY KEY/i.test(String(e))) {
        deps.log?.("db_error", { step: "insert", error: String(e).slice(0, 200) });
        return fail("system");
      }
    }
    job = await dbStep("reselect", deps, () => db.prepare(SELECT_JOB).bind(g.requestId).first<JobRow>());
    if (!job) {
      if (inserted === 0) return fail("rate_limited");
      return fail("system");
    }
  }
  if (job.identity_hash !== identity || job.context_hash !== context) return fail("conflict");
  if (job.status === "complete" && job.result_json) return replay(job);

  // Claim a short lease (with an owner token) so concurrent retries cannot double-submit.
  const leaseToken = crypto.randomUUID();
  const claim = await dbStep("claim", deps, () =>
    db.prepare("UPDATE research_jobs SET status = 'processing', lease_until = ?2, updated_at = ?3, lease_token = ?4 WHERE id = ?1 AND status != 'complete' AND (status != 'processing' OR lease_until < ?3)")
      .bind(g.requestId, t.getTime() + LEASE_MS, t.getTime(), leaseToken)
      .run(),
  );
  if ((claim.meta?.changes ?? 0) !== 1) {
    const latest = await dbStep("recheck", deps, () => db.prepare(SELECT_JOB).bind(g.requestId).first<JobRow>());
    if (latest?.status === "complete" && latest.result_json) return replay(latest);
    return fail("in_progress");
  }

  // Set once HubSpot accepted the lead in THIS call, so every later write
  // (including release) records it even if the dedicated write failed.
  let hubspotDone = job.hubspot_status === "submitted";
  const release = async (error: string) => {
    await db
      .prepare("UPDATE research_jobs SET status = 'failed', lease_until = 0, last_error = ?2, updated_at = ?3, hubspot_status = CASE WHEN ?4 = 1 THEN 'submitted' ELSE hubspot_status END WHERE id = ?1 AND lease_token = ?5")
      .bind(g.requestId, error, now().getTime(), hubspotDone ? 1 : 0, leaseToken)
      .run()
      .catch(() => {});
  };

  // 1. Lead capture, once per requestId.
  if (job.hubspot_status !== "submitted") {
    try {
      await submitHubspot(g, request, deps, t);
    } catch (e) {
      const f = e instanceof HubspotFailure ? e : new HubspotFailure("system", "unknown");
      deps.log?.("hubspot_failed", { code: f.code });
      await release(`hubspot_${f.code}`);
      return f.kind === "validation" ? fail("validation", { field: "email", message: "HubSpot did not accept this email address. Please check it." }) : fail(f.kind);
    }
    hubspotDone = true;
    // Record immediately (retried once) so a later failure never re-submits HubSpot.
    const mark = () => db.prepare("UPDATE research_jobs SET hubspot_status = 'submitted', updated_at = ?2 WHERE id = ?1").bind(g.requestId, now().getTime()).run();
    await mark().catch(() => mark()).catch((e: unknown) => deps.log?.("db_error", { step: "hubspot_status", error: String(e).slice(0, 200) }));
  }

  // 2. Facts (server-fetched; client-supplied facts are never trusted).
  let facts: FactsBundle;
  try {
    facts = await buildFacts(g.profile, { fetcher: deps.fetcher, cache: d1Cache(db, now), censusKey: env.CENSUS_API_KEY, now: t });
  } catch {
    await release("facts");
    return fail("system");
  }

  // 3. AI brief: at most MAX_AI_ATTEMPTS_PER_REQUEST calls, bounded by the daily cap.
  let brief: Brief | null = null;
  let briefStatus: "ready" | "rejected" | "capacity" | "insufficient_data" | "unavailable" = "unavailable";
  const hasData = citableIds(facts).length > 0;
  if (!hasData) briefStatus = "insufficient_data";
  let attempts = job.ai_attempts;
  const CONFIG_ERROR_CAP = 2;
  if (hasData && job.config_errors >= CONFIG_ERROR_CAP) {
    await release("ai_config_capped");
    return fail("unavailable");
  }
  while (hasData && !brief && attempts < MAX_AI_ATTEMPTS_PER_REQUEST) {
    // Renew our lease first (owner token). A failed or lost renewal consumes nothing.
    const renew = await dbStep("renew_lease", deps, () =>
      db.prepare("UPDATE research_jobs SET lease_until = ?2 WHERE id = ?1 AND lease_token = ?3").bind(g.requestId, now().getTime() + LEASE_MS, leaseToken).run(),
    );
    if ((renew.meta?.changes ?? 0) !== 1) return fail("in_progress");
    const reserved = await dbStep("reserve_ai", deps, () => reserveAiCall(db, day, int(env.RESEARCH_MAX_AI_CALLS_PER_DAY, 40)));
    if (!reserved) {
      if (briefStatus !== "rejected") briefStatus = "capacity";
      break;
    }
    const bump = await dbStep("bump_attempt", deps, () =>
      db.prepare("UPDATE research_jobs SET ai_attempts = ai_attempts + 1 WHERE id = ?1 AND ai_attempts < ?2").bind(g.requestId, MAX_AI_ATTEMPTS_PER_REQUEST).run(),
    );
    if ((bump.meta?.changes ?? 0) !== 1) break;
    attempts++;
    let call;
    try {
      call = await generateBrief(deps.fetcher, { OPENAI_API_KEY: env.OPENAI_API_KEY!, RESEARCH_MODEL: env.RESEARCH_MODEL! }, facts, g.profile);
    } catch (e) {
      const code = e instanceof ProviderError ? e.code : "unknown";
      deps.log?.("ai_provider_error", { code });
      if (/^http_(400|401|403|404)$/.test(code)) {
        // Our configuration is wrong (key, model, request): not billed, not retryable.
        // Refund the reserved daily call and this attempt; count the config error.
        await db.prepare("UPDATE research_usage SET ai_calls = max(ai_calls - 1, 0) WHERE day = ?1").bind(day).run().catch(() => {});
        await db.prepare("UPDATE research_jobs SET ai_attempts = max(ai_attempts - 1, 0), config_errors = config_errors + 1 WHERE id = ?1").bind(g.requestId).run().catch(() => {});
        // An earlier billed output was already rejected: finish with the fallback.
        if (briefStatus === "rejected" || job.ai_rejected > 0) {
          briefStatus = "rejected";
          break;
        }
        await release(`ai_${code}`);
        if (job.config_errors + 1 >= CONFIG_ERROR_CAP) {
          deps.log?.("ai_config_error_cap", { code });
          return fail("unavailable");
        }
        return fail("system");
      }
      await db.prepare("UPDATE research_usage SET provider_errors = provider_errors + 1 WHERE day = ?1").bind(day).run().catch(() => {});
      if (attempts < MAX_AI_ATTEMPTS_PER_REQUEST) {
        await release(`ai_${code}`);
        return fail("provider", { message: "Your request is saved, but the written brief could not be generated right now. Please try again in a minute." });
      }
      break;
    }
    const verdict = call.kind === "ok" ? validateBrief(call.brief, facts, briefInputs(g.profile, facts)) : { ok: false as const, reasons: [call.reason] };
    if (verdict.ok) {
      brief = verdict.brief;
      briefStatus = "ready";
    } else {
      // The model answered (billed) but the output failed the guard: never shown.
      deps.log?.("ai_rejected", { reasons: verdict.reasons.slice(0, 10) });
      briefStatus = "rejected";
      await db.prepare("UPDATE research_usage SET rejected_billed = rejected_billed + 1 WHERE day = ?1").bind(day).run().catch(() => {});
      await db.prepare("UPDATE research_jobs SET ai_rejected = ai_rejected + 1 WHERE id = ?1").bind(g.requestId).run().catch(() => {});
    }
  }

  const result = {
    ok: true,
    requestId: g.requestId,
    reference,
    eventId: job.event_id,
    generatedAt: t.toISOString(),
    facts,
    brief,
    briefStatus,
  };
  // 4. Persist; retry once. If both fail the visitor still gets the result
  // (already paid for) and the client keeps it for this session.
  const save = () =>
    db.prepare("UPDATE research_jobs SET status = 'complete', result_json = ?2, hubspot_status = 'submitted', lease_until = 0, updated_at = ?3 WHERE id = ?1 AND lease_token = ?4")
      .bind(g.requestId, JSON.stringify(result), now().getTime(), leaseToken)
      .run();
  let saved = true;
  try {
    saved = ((await save()).meta?.changes ?? 0) === 1;
  } catch {
    try {
      saved = ((await save()).meta?.changes ?? 0) === 1;
    } catch (e) {
      saved = false;
      deps.log?.("db_error", { step: "complete", error: String(e).slice(0, 200) });
    }
  }
  if (!saved) deps.log?.("result_not_saved", { reason: "write_failed_or_lease_lost" });
  if (job.capi_status === "none") sendCapi(request, deps, job.event_id, db, g.requestId, t);
  return json({ ...result, saved, replay: false });
}

function replay(job: JobRow): Response {
  try {
    return json({ ...(JSON.parse(job.result_json!) as Record<string, unknown>), saved: true, replay: true });
  } catch {
    return fail("system");
  }
}
