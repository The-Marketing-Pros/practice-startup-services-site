// Research request contract shared by the browser and the Pages Function.
import {
  launchStages,
  payerMixes,
  practiceModels,
  providerTypes,
  specialtyIds,
} from "../startup/options.ts";
import { validZip } from "../startup/zip3.ts";
import { sanitizePayload } from "../attribution.ts";

export type ResearchProfile = {
  provider: string;
  specialty: string;
  zip: string;
  model: string;
  setting: string;
  payer: string;
  mix: string;
  stage: string;
};

export const settings = ["office", "telehealth", "hybrid"] as const;
export const payers = ["insurance", "cash", "hybrid"] as const;

export type FieldError = { field: string; message: string };

export class ValidationError extends Error {
  field: string;
  constructor(field: string, message: string) {
    super(message);
    this.field = field;
  }
}

const values = (list: ReadonlyArray<{ value: string }>) => list.map((o) => o.value);

/** Validate the practice profile. Throws ValidationError naming the field. */
export function validateProfile(raw: unknown): ResearchProfile {
  const x = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const pick = (field: string, allowed: readonly string[], message: string, optional = false) => {
    const v = x[field];
    if (optional && (v === undefined || v === "")) return "";
    if (typeof v !== "string" || !allowed.includes(v)) throw new ValidationError(field, message);
    return v;
  };
  const provider = pick("provider", values(providerTypes), "Choose your provider type.");
  const specialty = pick("specialty", specialtyIds, "Choose your specialty.");
  if (!validZip(x.zip)) throw new ValidationError("zip", "Enter a five-digit ZIP code.");
  const model = pick("model", values(practiceModels), "Choose a practice model.");
  const setting = pick("setting", settings, "Choose a care setting.");
  const payer = pick("payer", payers, "Choose a payment model.");
  const mix = payer === "cash" ? "" : pick("mix", values(payerMixes), "Choose your main payers.", true);
  const stage = pick("stage", values(launchStages), "Choose your launch stage.");
  return { provider, specialty, zip: x.zip as string, model, setting, payer, mix, stage };
}

export type GateRequest = {
  requestId: string;
  email: string;
  consent: true;
  marketing: boolean;
  profile: ResearchProfile;
  token: string;
  attribution: Record<string, string>;
};

const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function validateGate(raw: unknown): GateRequest {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new ValidationError("form", "Please check your details and try again.");
  const x = raw as Record<string, unknown>;
  if (typeof x.requestId !== "string" || !UUID.test(x.requestId)) throw new ValidationError("form", "Please reload the page and try again.");
  const email = typeof x.email === "string" ? x.email.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL.test(email)) throw new ValidationError("email", "Enter a valid email address.");
  if (x.consent !== true) throw new ValidationError("consent", "Check the box to request your brief.");
  if (x.marketing !== undefined && typeof x.marketing !== "boolean") throw new ValidationError("marketing", "Invalid preference.");
  if (typeof x.token !== "string" || !x.token || x.token.length > 2048) throw new ValidationError("verification", "Complete the verification check.");
  const profile = validateProfile(x.profile);
  return {
    requestId: x.requestId,
    email,
    consent: true,
    marketing: x.marketing === true,
    profile,
    token: x.token,
    attribution: sanitizePayload(x.attribution),
  };
}

/** Customer-facing reference code derived from the request id. */
export function referenceFor(requestId: string): string {
  return `PSS-${requestId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export type FailureKind =
  | "validation"
  | "verification"
  | "rate_limited"
  | "provider"
  | "system"
  | "conflict"
  | "in_progress"
  | "unavailable";
