// Browser-side response handling for the research endpoints. Kept free of DOM
// access so the success/failure decision (which gates every lead event) is
// unit-tested.
import type { FailureKind } from "./contract.ts";

export type Outcome =
  | { type: "success"; body: Record<string, unknown> }
  | { type: "failure"; kind: FailureKind; message?: string; field?: string };

/**
 * Success only for HTTP 200 + JSON content type + `ok: true`. A non-JSON body
 * (an HTML error page, a proxy timeout) is never parsed as data.
 */
export function classifyResponse(status: number, contentType: string, text: string): Outcome {
  if (status === 0) return { type: "failure", kind: "provider" };
  if (!contentType.toLowerCase().includes("application/json")) return { type: "failure", kind: status >= 500 || status === 0 ? "provider" : "system" };
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return { type: "failure", kind: "system" };
  }
  if (!body || typeof body !== "object") return { type: "failure", kind: "system" };
  const b = body as Record<string, unknown>;
  if (status === 200 && b.ok === true) return { type: "success", body: b };
  const kind = typeof b.kind === "string" ? (b.kind as FailureKind) : status >= 500 ? "provider" : "system";
  return {
    type: "failure",
    kind,
    message: typeof b.message === "string" ? b.message : undefined,
    field: typeof b.field === "string" ? b.field : undefined,
  };
}

export async function requestJson(fetcher: typeof fetch, url: string, init?: RequestInit): Promise<Outcome> {
  let r: Response;
  try {
    r = await fetcher(url, { cache: "no-store", ...init });
  } catch {
    return classifyResponse(0, "", "");
  }
  const text = await r.text().catch(() => "");
  return classifyResponse(r.status, r.headers.get("content-type") || "", text);
}
