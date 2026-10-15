-- Persist the outbound attempt BEFORE contacting HubSpot. A lost response
-- cannot prove rejection, so an ambiguous attempt requires reconciliation.
-- Existing confirmed submissions and saved reports remain usable.
ALTER TABLE research_jobs ADD COLUMN hubspot_attempted INTEGER NOT NULL DEFAULT 0 CHECK (hubspot_attempted IN (0, 1));
-- The old handler cannot distinguish a lost response from non-delivery.
-- Preserve uncertainty for historical jobs that entered processing. Deploy
-- with the gate off and old requests drained before applying this migration.
UPDATE research_jobs SET hubspot_attempted = 1
WHERE hubspot_status = 'pending' AND status != 'new';
