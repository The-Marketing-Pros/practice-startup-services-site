-- Persist the outbound attempt BEFORE contacting HubSpot. A lost response
-- cannot prove rejection, so an ambiguous attempt requires reconciliation.
-- Existing confirmed submissions and saved reports remain usable.
ALTER TABLE research_jobs ADD COLUMN hubspot_attempted INTEGER NOT NULL DEFAULT 0 CHECK (hubspot_attempted IN (0, 1));
