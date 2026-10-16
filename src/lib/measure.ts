// Success-event measurement (SHARED-SPEC "Measurement contract").
// - Lead events fire ONLY after the server confirms success, once per
//   reference (sessionStorage guard), with a stable submission event id.
// - GA4 uses this site's own property via the gtag already loaded in
//   BaseLayout. Meta fires only if the pixel was loaded (fbq exists), which
//   BaseLayout allows only when PUBLIC_META_PIXEL_ID is set on production.
// - OpenAI receives confirmed leads and separate tool-use events.
// - Tool downloads are usage events, never leads, and never reach Meta.
// - These event payloads never include form contents (email, ZIP, notes).
//   OpenAI SDK matching follows the data source settings in Ads Manager.

type Gtag = (...args: unknown[]) => void;
type Fbq = (...args: unknown[]) => void;
export type MeasureEnv = {
  gtag?: Gtag;
  fbq?: Fbq;
  oaiq?: (...args: unknown[]) => void;
  session?: Pick<Storage, "getItem" | "setItem">;
};

function browserEnv(): MeasureEnv {
  const w = globalThis as unknown as { gtag?: Gtag; fbq?: Fbq; oaiq?: (...args: unknown[]) => void; sessionStorage?: Storage };
  let session: Storage | undefined;
  try {
    session = w.sessionStorage;
  } catch {
    session = undefined;
  }
  return { oaiq: typeof w.oaiq === "function" ? w.oaiq : undefined, gtag: typeof w.gtag === "function" ? w.gtag : undefined, fbq: typeof w.fbq === "function" ? w.fbq : undefined, session };
}

export type LeadEvent = {
  /** Stable per logical submission (the client requestId / server reference). */
  reference: string;
  /** Stable event ID; research IDs also match its server-side Meta event. */
  eventId: string;
  leadType: string; // e.g. "startup_research"
  contentName: string; // e.g. "pss_startup_research"
};

/** Returns true when the event fired, false when it was already counted. */
export function trackLead(e: LeadEvent, env: MeasureEnv = browserEnv()): boolean {
  const guard = `pss_lead_fired_${e.reference}`;
  try {
    if (env.session?.getItem(guard)) return false;
    env.session?.setItem(guard, "1");
  } catch {
    /* without storage we still fire once per page via the caller's state */
  }
  env.gtag?.("event", "generate_lead", { lead_type: e.leadType });
  env.fbq?.("track", "Lead", { content_name: e.contentName, content_category: e.leadType }, { eventID: e.eventId });
  openai(env, "lead_created", { type: "customer_action" }, { event_id: e.eventId });
  return true;
}

// A blocked or failing measurement provider must never break a successful action.
function openai(env: MeasureEnv, event: string, data: Record<string, unknown>, options: Record<string, unknown> = {}): void {
  try { env.oaiq?.("measure", event, data, options); } catch { /* best-effort measurement */ }
}

/** Tool downloads are separate custom events, never leads. */
export function trackToolDownload(tool: "checklist" | "proforma" | "research", format: string, env: MeasureEnv = browserEnv()): void {
  env.gtag?.("event", "pss_tool_download", { tool, format });
  openai(env, "custom", { type: "custom" }, { custom_event_name: `pss_${tool}_download` });
}

/** A successfully displayed market preview is content engagement, not a lead. */
export function trackToolUse(tool: "research_preview", env: MeasureEnv = browserEnv()): void {
  env.gtag?.("event", "pss_tool_use", { tool });
  openai(env, "contents_viewed", { type: "contents", contents: [{ id: "pss_research_preview", content_type: "tool" }] });
}
