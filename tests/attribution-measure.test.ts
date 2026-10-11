import test from "node:test";
import assert from "node:assert/strict";
import { captureAttribution, attributionPayload, sanitizePayload, clean, FIRST_TOUCH_TTL_MS } from "../src/lib/attribution.ts";
import { trackLead, trackToolDownload, trackToolUse } from "../src/lib/measure.ts";
import { classifyResponse } from "../src/lib/research/client.ts";

function store() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), m };
}
const AD = "https://practicestartupservices.com/resources/startup-research/?utm_source=instagram&utm_medium=paid_social&utm_campaign=pss_free_resources_us_test01&utm_content=startup_research&utm_id=123&adset_id=456&ad_id=789&placement=instagram_stories&fbclid=abc&email=leak@example.com";

test("captures the shared attribution keys, path-only landing page and origin-only referrer", () => {
  const local = store();
  const session = store();
  captureAttribution(AD, "https://l.instagram.com/some/path?x=1", local, session, 1000);
  const p = attributionPayload(local, session, 1000);
  assert.equal(p.utm_source, "instagram");
  assert.equal(p.utm_campaign, "pss_free_resources_us_test01");
  assert.equal(p.placement, "instagram_stories");
  assert.equal(p.fbclid, "abc");
  assert.equal(p.landing_page, "/resources/startup-research/");
  assert.equal(p.referrer, "https://l.instagram.com");
  assert.equal(p.ft_ad_id, "789");
  assert.ok(!JSON.stringify(p).includes("leak@example.com"), "non-attribution params are never captured");
});

test("values are trimmed, capped at 200 characters and stripped of control characters", () => {
  assert.equal(clean("  a\u0000b\u001fc\u007f  "), "abc");
  assert.equal(clean("x".repeat(500)).length, 200);
  assert.equal(clean(42), "");
});

test("first touch lasts 90 days and is not overwritten; last touch follows campaigns, not internal clicks", () => {
  const local = store();
  const session = store();
  captureAttribution(AD, "", local, session, 1000);
  captureAttribution("https://practicestartupservices.com/resources/pro-forma/?utm_source=google&utm_medium=cpc&gclid=g1", "", local, session, 2000);
  let p = attributionPayload(local, session, 2000);
  assert.equal(p.utm_source, "google");
  assert.equal(p.ft_utm_source, "instagram");
  captureAttribution("https://practicestartupservices.com/about/", "https://practicestartupservices.com/", local, session, 3000);
  p = attributionPayload(local, session, 3000);
  assert.equal(p.utm_source, "google", "internal navigation keeps the last campaign touch");
  assert.equal(p.landing_page, "/resources/pro-forma/");
  const later = 1000 + FIRST_TOUCH_TTL_MS + 1;
  assert.equal(attributionPayload(local, session, later).ft_utm_source, undefined, "expired first touch is not sent");
  captureAttribution("https://practicestartupservices.com/?utm_source=newsletter", "", local, session, later);
  assert.equal(attributionPayload(local, session, later).ft_utm_source, "newsletter");
});

test("blocked storage never throws", () => {
  const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => {} };
  assert.doesNotThrow(() => captureAttribution(AD, "", broken, broken, 1));
  assert.deepEqual(attributionPayload(broken, broken, 1), {});
});

test("server accepts only known attribution keys with clean values", () => {
  assert.deepEqual(sanitizePayload({ utm_source: " instagram ", ft_gclid: "g", email: "x@example.com", utm_term: 5, __proto__: { a: 1 } }), { utm_source: "instagram", ft_gclid: "g" });
  assert.deepEqual(sanitizePayload(["utm_source"]), {});
  // landing_page must be a same-site path; referrer a bare http(s) origin.
  assert.deepEqual(
    sanitizePayload({
      landing_page: "/resources/startup-research/", ft_landing_page: "https://evil.example/x",
      referrer: "https://l.instagram.com", ft_referrer: "https://l.instagram.com/path?q=1",
    }),
    { landing_page: "/resources/startup-research/", referrer: "https://l.instagram.com" },
  );
  for (const bad of ["//evil.example/x", "javascript:alert(1)", "resources/x", "/a?b=c", "/a#frag", "/a b"]) assert.deepEqual(sanitizePayload({ landing_page: bad }), {}, bad);
  for (const bad of ["ftp://x.example", "https://x.example/", "https://user@x.example", "x.example", "data:text/html,1"]) assert.deepEqual(sanitizePayload({ referrer: bad }), {}, bad);
});

test("lead events fire once per reference with the server event id; GA4 + Meta Lead only", () => {
  const calls: unknown[][] = [];
  const session = store();
  const env = { gtag: (...a: unknown[]) => void calls.push(["gtag", ...a]), fbq: (...a: unknown[]) => void calls.push(["fbq", ...a]), session };
  const e = { reference: "PSS-11111111", eventId: "evt-1", leadType: "startup_research", contentName: "pss_startup_research" };
  assert.equal(trackLead(e, env), true);
  assert.equal(trackLead(e, env), false, "reload / double callback does not double count");
  assert.deepEqual(calls, [
    ["gtag", "event", "generate_lead", { lead_type: "startup_research" }],
    ["fbq", "track", "Lead", { content_name: "pss_startup_research", content_category: "startup_research" }, { eventID: "evt-1" }],
  ]);
});

test("without the pixel only GA4 fires; tool downloads and previews never reach Meta and are not leads", () => {
  const calls: unknown[][] = [];
  const env = { gtag: (...a: unknown[]) => void calls.push(["gtag", ...a]), session: store() };
  trackLead({ reference: "PSS-2", eventId: "e", leadType: "startup_research", contentName: "pss_startup_research" }, env);
  assert.equal(calls.length, 1);
  const fbq: unknown[] = [];
  const env2 = { gtag: (...a: unknown[]) => void calls.push(["gtag", ...a]), fbq: (...a: unknown[]) => void fbq.push(a), session: store() };
  trackToolDownload("checklist", "xlsx", env2);
  trackToolUse("research_preview", env2);
  assert.equal(fbq.length, 0);
  assert.deepEqual(calls.slice(1), [["gtag", "event", "pss_tool_download", { tool: "checklist", format: "xlsx" }], ["gtag", "event", "pss_tool_use", { tool: "research_preview" }]]);
});

test("only an HTTP 200 JSON ok:true response counts as success (the gate for every lead event)", () => {
  const ok = classifyResponse(200, "application/json; charset=utf-8", JSON.stringify({ ok: true, reference: "PSS-1" }));
  assert.equal(ok.type, "success");
  for (const [status, type, text, kind] of [
    [502, "text/html", "<html>Bad gateway</html>", "provider"],
    [200, "text/html", "<html>ok</html>", "system"],
    [200, "application/json", "{not json", "system"],
    [200, "application/json", JSON.stringify({ ok: false, kind: "provider" }), "provider"],
    [500, "application/json", JSON.stringify({ ok: true }), "provider"],
    [429, "application/json", JSON.stringify({ ok: false, kind: "rate_limited", message: "m" }), "rate_limited"],
    [400, "application/json", JSON.stringify({ ok: false, kind: "validation", field: "email" }), "validation"],
    [403, "application/json", JSON.stringify({ ok: false, kind: "verification" }), "verification"],
    [0, "", "", "provider"],
  ] as const) {
    const o = classifyResponse(status, type, text);
    assert.equal(o.type, "failure", `${status} ${text}`);
    assert.equal(o.type === "failure" && o.kind, kind);
  }
});

test("hand-off parameters are stripped after use; campaign tags and hash stay", async () => {
  const { stripParams } = await import("../src/lib/attribution.ts");
  assert.equal(
    stripParams("https://practicestartupservices.com/resources/startup-checklist/?provider=np&utm_source=instagram&zip=59301&stage=soon#phase-03", ["provider", "zip", "stage"]),
    "/resources/startup-checklist/?utm_source=instagram#phase-03",
  );
});

test("confirmation heading only claims a brief when one is shown", async () => {
  const { confirmationHeading, briefStatusNote } = await import("../src/lib/research/pdf.ts");
  assert.equal(confirmationHeading("ready"), "Your brief is ready.");
  for (const status of ["rejected", "capacity", "insufficient_data", "unavailable"]) {
    assert.equal(confirmationHeading(status), "Request received. Your data tables and checklist are ready.");
    assert.ok(briefStatusNote(status).length > 0);
  }
  assert.equal(briefStatusNote("ready"), "");
});
