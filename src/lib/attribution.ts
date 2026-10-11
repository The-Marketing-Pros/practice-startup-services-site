// Campaign attribution capture (SHARED-SPEC "Attribution capture").
// First touch: localStorage for 90 days. Last touch: sessionStorage.
// Values are trimmed, capped at 200 characters and stripped of control
// characters. Only campaign parameters, the landing path (no query) and the
// referrer origin are stored. Form contents never pass through here.

export const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_id",
  "adset_id",
  "ad_id",
  "placement",
  "fbclid",
  "gclid",
  "gbraid",
  "wbraid",
] as const;
export type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];
export type Touch = Partial<Record<AttributionKey, string>> & {
  landing_page?: string;
  referrer?: string;
  captured_at?: number;
};

const FIRST_KEY = "pss_attr_first";
const LAST_KEY = "pss_attr_last";
export const FIRST_TOUCH_TTL_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_LEN = 200;

export function clean(value: unknown): string {
  if (typeof value !== "string") return "";
  // Strip C0/C1 control characters, then trim and cap.
  return value.replace(/[\u0000-\u001f\u007f-\u009f]/g, "").trim().slice(0, MAX_LEN);
}

function originOf(referrer: string): string {
  try {
    const u = new URL(referrer);
    return u.protocol === "http:" || u.protocol === "https:" ? u.origin : "";
  } catch {
    return "";
  }
}

/**
 * Build a touch from a URL and referrer. `campaign` is true when the URL
 * carries at least one campaign parameter.
 */
export function touchFromUrl(href: string, referrer: string, now: number): { touch: Touch; campaign: boolean } | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  const touch: Touch = {};
  let campaign = false;
  for (const key of ATTRIBUTION_KEYS) {
    const v = clean(url.searchParams.get(key));
    if (v) {
      touch[key] = v;
      campaign = true;
    }
  }
  touch.landing_page = clean(url.pathname);
  const ref = originOf(referrer);
  if (ref && ref !== url.origin) touch.referrer = clean(ref);
  touch.captured_at = now;
  return { touch, campaign };
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function read(storage: StorageLike | undefined, key: string): Touch | null {
  try {
    const raw = storage?.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Touch;
    return parsed && typeof parsed === "object" ? sanitizeTouch(parsed) : null;
  } catch {
    return null;
  }
}

export function sanitizeTouch(raw: unknown): Touch {
  const out: Touch = {};
  if (!raw || typeof raw !== "object") return out;
  const r = raw as Record<string, unknown>;
  for (const key of [...ATTRIBUTION_KEYS, "landing_page", "referrer"] as const) {
    const v = clean(r[key]);
    if (v) out[key] = v;
  }
  if (typeof r.captured_at === "number" && Number.isFinite(r.captured_at)) out.captured_at = r.captured_at;
  return out;
}

/**
 * Record a page view. A URL with campaign parameters always becomes the last
 * touch. Without parameters, the first page of a session is recorded as the
 * last touch (landing page + referrer origin) and internal navigation never
 * overwrites it. The first touch is the first recorded touch in 90 days.
 */
export function captureAttribution(
  href: string,
  referrer: string,
  local: StorageLike | undefined,
  session: StorageLike | undefined,
  now = Date.now(),
): void {
  const result = touchFromUrl(href, referrer, now);
  if (!result) return;
  const { touch, campaign } = result;
  try {
    if (campaign || !read(session, LAST_KEY)) session?.setItem(LAST_KEY, JSON.stringify(touch));
  } catch {
    /* storage unavailable: attribution is best effort */
  }
  const first = read(local, FIRST_KEY);
  const expired = !first || !first.captured_at || now - first.captured_at > FIRST_TOUCH_TTL_MS;
  if (expired) {
    try {
      local?.setItem(FIRST_KEY, JSON.stringify(touch));
    } catch {
      /* ignore */
    }
  }
}

/**
 * Flat attribution payload for a submission: last touch as plain keys and
 * first touch as ft_* keys. Expired first touches are dropped.
 */
export function attributionPayload(
  local: StorageLike | undefined,
  session: StorageLike | undefined,
  now = Date.now(),
): Record<string, string> {
  const out: Record<string, string> = {};
  const last = read(session, LAST_KEY);
  const first = read(local, FIRST_KEY);
  for (const [touch, prefix] of [[last, ""], [first && first.captured_at && now - first.captured_at <= FIRST_TOUCH_TTL_MS ? first : null, "ft_"]] as const) {
    if (!touch) continue;
    for (const key of [...ATTRIBUTION_KEYS, "landing_page", "referrer"] as const) {
      const v = touch[key];
      if (v) out[`${prefix}${key}`] = v;
    }
  }
  return out;
}

/** Server-side: accept only known attribution keys with clean values. */
export const ALLOWED_PAYLOAD_KEYS = new Set(
  [...ATTRIBUTION_KEYS, "landing_page", "referrer"].flatMap((k) => [k, `ft_${k}`]),
);
const SAME_SITE_PATH = /^\/[A-Za-z0-9\-._~!$&'()*+,;=:@%/]*$/;
/** A same-site path: starts with one "/", no scheme, host, query or fragment. */
export function validLandingPath(v: string): boolean {
  return SAME_SITE_PATH.test(v) && !v.startsWith("//") && !v.includes("\\");
}
/** A bare http(s) origin: scheme + host (+ port), nothing else. */
export function validOrigin(v: string): boolean {
  try {
    const u = new URL(v);
    return (u.protocol === "http:" || u.protocol === "https:") && u.origin === v;
  } catch {
    return false;
  }
}
export function sanitizePayload(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!ALLOWED_PAYLOAD_KEYS.has(k)) continue;
    const c = clean(v);
    if (!c) continue;
    const base = k.startsWith("ft_") ? k.slice(3) : k;
    if (base === "landing_page" && !validLandingPath(c)) continue;
    if (base === "referrer" && !validOrigin(c)) continue;
    out[k] = c;
  }
  return out;
}
