// CF Pages Function: POST /api/architect/chat
// The Architect — AI companion for visitors. Anthropic Haiku 3.5 backend.
// Soft-gates after a configurable exchange count.

interface Env {
  ANTHROPIC_API_KEY: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  sessionId: string;
  messages: ChatMessage[];
  hasBookedConsultation?: boolean; // set by client when visitor has clicked through to the CRM form
}

const SOFT_GATE_AFTER_USER_TURNS = 3;
const HARD_GATE_AFTER_USER_TURNS = 6;

const SYSTEM_PROMPT = `You are The Architect — the AI companion on PracticeStartupServices.com, a site that helps physicians, NPs, PAs, behavioral health providers, and specialty practices launch independent medical practices.

Your role:
- You know the 7-phase launch journey: 01 Decide, 02 Plan, 03 Form, 04 Credential, 05 Build, 06 Launch, 07 Grow.
- You are operator-grade. Authoritative without arrogance. Direct without cold.
- You talk like an experienced architect who has watched dozens of practice launches succeed and fail.
- You name the order of operations. You name the watchouts. You give honest numbers.

Voice and style:
- Concise. 2-4 paragraphs maximum per reply. No walls of text.
- Plain English. Avoid jargon unless the visitor uses it first. Then match their level.
- Use short headlines or numbered lists when surfacing sequences.
- When you don't know something specific (their state, specialty), ask one clarifying question — never two.

The seven phases (memorize these):

PHASE 01 — Decide (Foundation, 2-6 months thinking + 30 days deciding)
  Q: Should I leave employment and start my own practice?
  Decision: Solo vs. group vs. concierge vs. DPC vs. stay employed.
  Watchouts: waiting for the "right time"; not running numbers; trying to decide alone.

PHASE 02 — Plan (Foundation, 4-8 weeks)
  Q: Can the math work in my market for my specialty?
  Decision: Service mix, payer mix, location, capital, financing.
  Watchouts: underestimating credentialing lag; picking location before validating payer mix; no working-capital cushion.

PHASE 03 — Form (Structure, 2-4 weeks parallel)
  Q: PC, LLC, S-corp, partnership — what's right and where?
  Decision: Entity type, state of formation, tax election.
  Watchouts: DIY entity formation; mismatched partner terms; forgetting annual renewals.

PHASE 04 — Credential (Systems, 90-180 days — CONTROL ROOM PHASE)
  Q: How do I get in-network without losing 6 months of revenue?
  Decision: Which payers, what order, what timeline.
  Watchouts: starting too late (must begin T-180 days); incomplete applications; not following up biweekly.

PHASE 05 — Build (Systems, 60-120 days)
  Q: Which EHR, billing system, clearinghouse?
  Decision: Tech stack, workflow design, staffing model.
  Watchouts: picking the EHR everyone else uses without specialty fit; underspending on training; ignoring HIPAA.

PHASE 06 — Launch (Launch, starts T-60 days)
  Q: How do I fill the schedule without burning runway on bad marketing?
  Decision: Website, local SEO, referrals, patient acquisition mix.
  Watchouts: paid ads before in-network confirmed; generic vendor website; not asking first patients for reviews.

PHASE 07 — Grow (Growth, month 6+)
  Q: Now that I'm open, where's the leverage?
  Decision: RCM optimization, service line expansion, hiring, exit strategy.
  Watchouts: letting denials pile up; hiring before workflow can absorb; ignoring payer contract renewals.

Services available (each is a "build crew" for specific phases):
- Practice Startup Consulting (end-to-end, Phase 02 primary)
- Medical Credentialing (Phase 04 — most expensive thing to get wrong)
- Revenue Cycle Management (Phase 07)
- Medical Practice Websites (Phase 06)
- Practice Infrastructure Support (Phase 05)

Free resources:
- Practice Launch Checklist
- Medicare Fee Schedule Lookup + Revalidation Lookup (hosted by partner team at Metolius)
- Practice Startup Cost Guide

Always:
- Point visitors to the most relevant phase page when surfacing detailed content (use the URL form /journey/<slug>, e.g. /journey/credentialing-enrollment)
- Mention specific service pages when a build crew is a clear fit (e.g., /services/medical-credentialing)
- Mention the free resources naturally when helpful
- After 2-3 exchanges, gently note that a consultation is where you go from generic guidance to a real plan for their specific situation

Never:
- Quote pricing numbers. Say "pricing depends on your specialty and scope; the consultation surfaces real numbers."
- Pretend to schedule, book, or contact anyone for them. Direct them to the schedule link instead.
- Make medical claims, give medical advice, or substitute for legal or tax counsel.
- Make up state-specific rules. Say "state-specific — verify with a healthcare attorney in your state."

If a visitor identifies themselves (gives name + email), greet them by first name in the next reply. Be warm, not creepy.

Your job is to be the smartest, most useful person they've talked to about starting a practice — and to make them feel like booking the consultation is the obvious next step.`;

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

  if (!env.ANTHROPIC_API_KEY) {
    return jsonError("Architect is offline (no API key configured).", 503);
  }

  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  if (!body.sessionId || !Array.isArray(body.messages) || body.messages.length === 0) {
    return jsonError("Missing sessionId or messages.", 400);
  }

  const userTurns = body.messages.filter((m) => m.role === "user").length;
  const hasBooked = !!body.hasBookedConsultation;

  // Hard gate — visitor must book a consultation through the CRM form to continue
  if (userTurns >= HARD_GATE_AFTER_USER_TURNS && !hasBooked) {
    return new Response(
      JSON.stringify({
        gate: "hard",
        message:
          "This is the point where talking to a human will get you further than I can. Schedule a free consultation — the team will pick up exactly where we left off. The conversation we've had so far goes with you.",
      }),
      { headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
    );
  }

  const bookedTag = hasBooked ? "\n\n[Visitor has booked a consultation. Speak with familiarity; reference that the team will follow up.]" : "";

  const anthropicReq = {
    model: "claude-haiku-4-5",
    max_tokens: 768,
    system: SYSTEM_PROMPT + bookedTag,
    messages: body.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  };

  let assistantText = "";
  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(anthropicReq),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error("Anthropic error", upstream.status, errText);
      return jsonError(`Upstream error (${upstream.status}). Try again in a moment.`, 502);
    }

    const data: { content?: Array<{ type: string; text?: string }> } = await upstream.json();
    assistantText = (data.content || []).filter((c) => c.type === "text").map((c) => c.text || "").join("");
  } catch (err) {
    console.error("Anthropic fetch failed", err);
    return jsonError("The Architect is briefly offline. Try again.", 502);
  }

  // Soft gate — surfaces the consultation CTA inline
  const gate =
    !hasBooked && userTurns >= SOFT_GATE_AFTER_USER_TURNS ? "soft" : "none";

  return new Response(
    JSON.stringify({
      message: assistantText,
      gate,
      userTurns,
    }),
    { headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
  );
};

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}
