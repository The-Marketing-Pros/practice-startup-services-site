// CF Pages Function: POST /api/architect/identify
// Lead capture — soft or hard gate completion.
// Forwards to CRM webhook if configured + persists locally.

interface Env {
  CRM_LEAD_WEBHOOK?: string;
  ARCHITECT_LEADS?: KVNamespace;
}

interface IdentifyRequest {
  sessionId: string;
  name: string;
  email: string;
  transcript?: Array<{ role: string; content: string }>;
  source?: string;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  let body: IdentifyRequest;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON.", 400);
  }

  if (!body.sessionId || !body.name || !body.email) {
    return jsonError("Missing sessionId, name, or email.", 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return jsonError("Email looks invalid.", 400);
  }

  const lead = {
    sessionId: body.sessionId,
    name: body.name.trim(),
    email: body.email.trim().toLowerCase(),
    source: body.source || "the-architect-companion",
    site: "practicestartupservices.com",
    capturedAt: new Date().toISOString(),
    transcript: body.transcript || [],
    intent: deriveIntent(body.transcript || []),
  };

  // Persist to KV
  if (env.ARCHITECT_LEADS) {
    try {
      await env.ARCHITECT_LEADS.put(`lead:${body.sessionId}`, JSON.stringify(lead), {
        expirationTtl: 60 * 60 * 24 * 365,
      });
    } catch (e) {
      console.warn("KV write failed", e);
    }
  }

  // Forward to CRM (placeholder if not set — won't block the identify response)
  let crmStatus = "skipped:no-webhook-configured";
  if (env.CRM_LEAD_WEBHOOK && env.CRM_LEAD_WEBHOOK !== "{{CRM_LEAD_WEBHOOK}}") {
    try {
      const r = await fetch(env.CRM_LEAD_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
      crmStatus = `forwarded:${r.status}`;
    } catch (e) {
      crmStatus = `failed:${e instanceof Error ? e.message : "unknown"}`;
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      crmStatus,
      message:
        "Thanks — your conversation is saved. The team will reach out if you'd like to talk to a human about your launch. In the meantime, keep asking The Architect.",
    }),
    { headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
  );
};

function deriveIntent(transcript: Array<{ role: string; content: string }>): string {
  const allUser = transcript
    .filter((m) => m.role === "user")
    .map((m) => m.content.toLowerCase())
    .join(" ");
  const hits: string[] = [];
  if (/credential|cms|855|caqh|payer|in.network/.test(allUser)) hits.push("credentialing");
  if (/cost|budget|capital|loan|financ|expensive|price/.test(allUser)) hits.push("costs");
  if (/credential|enrollment|payer/.test(allUser)) hits.push("phase-04");
  if (/np|nurse practitioner|nurse|pa\b|physician assistant|behavioral|therap|psych/.test(allUser)) hits.push("non-physician");
  if (/start|launch|new practice|open/.test(allUser)) hits.push("phase-01-02");
  if (/website|seo|marketing|patients|grow/.test(allUser)) hits.push("phase-06");
  if (/ehr|emr|billing|hipaa|infrastructure/.test(allUser)) hits.push("phase-05");
  return hits.length ? hits.join(",") : "general-inquiry";
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}
