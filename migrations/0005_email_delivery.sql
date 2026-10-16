-- Email handoff state contains identifiers only. Names/email stay in HubSpot
-- and the email, not this ledger or the stored research result.
CREATE TABLE research_email_deliveries (
 job_id TEXT PRIMARY KEY,
 email_id TEXT,
 alert_id TEXT,
 attempted_step TEXT,
 lease_token TEXT,
 lease_until INTEGER NOT NULL DEFAULT 0,
 updated_at INTEGER NOT NULL,
 last_error TEXT
);
