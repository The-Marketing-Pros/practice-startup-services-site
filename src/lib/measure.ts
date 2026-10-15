// Success-event measurement (SHARED-SPEC "Measurement contract").
// - Lead events fire ONLY after the server confirms success, once per
//   reference (sessionStorage guard), with the server-issued event id.
// - GA4 uses this site's own property via the gtag already loaded in
//   BaseLayout. Meta fires only if the pixel was loaded (fbq exists), which
//   BaseLayout allows only when PUBLIC_META_PIXEL_ID is set on production.
// - Tool downloads are usage events, never leads, and never reach Meta.
// - No form contents (email, ZIP, notes) are ever passed to analytics.

type Gtag = (...args: unknown[]) => void;
type Fbq = (...args: unknown[]) => void;
export type MeasureEnv = {
  gtag?: Gtag;
  fbq?: Fbq;
  session?: Pick<Storage, "getItem" | "setItem">;
};

function browserEnv(): MeasureEnv {
  const w = globalThis as unknown as { gtag?: Gtag; fbq?: Fbq; sessionStorage?: Storage };
  let session: Storage | undefined;
  try {
    session = w.sessionStorage;
  } catch {
    session = undefined;
  }
  return { gtag: typeof w.gtag === "function" ? w.gtag : undefined, fbq: typeof w.fbq === "function" ? w.fbq : undefined, session };
}

export type LeadEvent = {
  /** Stable per logical submission (the client requestId / server reference). */
  reference: string;
  /** Server-issued event id, shared with the server-side Conversions API. */
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
  return true;
}

/** Tool usage (downloads). Not a lead; GA4 only. */
export function trackToolDownload(tool: "checklist" | "proforma" | "research", format: string, env: MeasureEnv = browserEnv()): void {
  env.gtag?.("event", "pss_tool_download", { tool, format });
}

/** Non-lead engagement (e.g. a research preview was shown). GA4 only. */
export function trackToolUse(tool: "research_preview", env: MeasureEnv = browserEnv()): void {
  env.gtag?.("event", "pss_tool_use", { tool });
}
