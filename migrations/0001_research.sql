-- Startup research (RESEARCH_DB, Cloudflare D1). Dedicated database; no
-- existing production table is altered. Apply with:
--   npx wrangler d1 migrations apply <database-name> --remote
-- (owner action; not run by this change).
--
-- Privacy: no email address, IP address or free text is stored. Email and IP
-- are stored only as keyed HMAC-SHA256 hashes (RESEARCH_HASH_SECRET) for
-- idempotency and daily caps. result_json holds public facts and the AI brief.
-- Retention: delete rows older than 90 days (owner to schedule), e.g.
--   DELETE FROM research_jobs WHERE created_at < (unixepoch() - 90*86400) * 1000;

CREATE TABLE IF NOT EXISTS research_jobs (
  id TEXT PRIMARY KEY,                 -- client requestId (UUID v4)
  identity_hash TEXT NOT NULL,         -- HMAC(email)
  ip_hash TEXT NOT NULL,               -- HMAC(ip|day)
  context_hash TEXT NOT NULL,          -- HMAC(profile|marketing)
  day TEXT NOT NULL,                   -- UTC YYYY-MM-DD
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'processing', 'failed', 'complete')),
  lease_until INTEGER NOT NULL DEFAULT 0,
  hubspot_status TEXT NOT NULL DEFAULT 'pending' CHECK (hubspot_status IN ('pending', 'submitted')),
  ai_attempts INTEGER NOT NULL DEFAULT 0,
  ai_rejected INTEGER NOT NULL DEFAULT 0,
  event_id TEXT NOT NULL,              -- shared by browser pixel and CAPI for dedup
  capi_status TEXT NOT NULL DEFAULT 'none',
  last_error TEXT,
  result_json TEXT
);
CREATE INDEX IF NOT EXISTS research_jobs_day_identity ON research_jobs (day, identity_hash);
CREATE INDEX IF NOT EXISTS research_jobs_day_ip ON research_jobs (day, ip_hash);

-- Daily AI usage. ai_calls is reserved atomically before each provider call and
-- capped by RESEARCH_MAX_AI_CALLS_PER_DAY. rejected_billed counts outputs the
-- provider returned (and billed) that failed the numeric/source guard.
CREATE TABLE IF NOT EXISTS research_usage (
  day TEXT PRIMARY KEY,
  ai_calls INTEGER NOT NULL DEFAULT 0,
  rejected_billed INTEGER NOT NULL DEFAULT 0,
  provider_errors INTEGER NOT NULL DEFAULT 0
);

-- Cache of public NPPES / Census responses (no personal data).
CREATE TABLE IF NOT EXISTS research_cache (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

-- Soft per-IP daily counter for the free preview (hashed IP only).
CREATE TABLE IF NOT EXISTS research_preview_usage (
  day TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, ip_hash)
);
