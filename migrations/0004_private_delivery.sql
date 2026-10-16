-- Private HubSpot handoff. Only identifiers and delivery state, never email or
-- report content. Keep rows for the same lifetime as their research_jobs row.
CREATE TABLE research_deliveries (
 job_id TEXT PRIMARY KEY,
 contact_id TEXT,
 owner_id TEXT,
 file_id TEXT,
 note_id TEXT,
 task_id TEXT,
 attempted_step TEXT,
 lease_token TEXT,
 lease_until INTEGER NOT NULL DEFAULT 0,
 updated_at INTEGER NOT NULL,
 last_error TEXT
);
