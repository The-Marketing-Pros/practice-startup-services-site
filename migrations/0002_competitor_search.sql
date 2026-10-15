-- Apply after 0001_research.sql. Daily Brave calls are reserved atomically;
-- failures consume a slot too. No email, IP address or search query is stored here.
CREATE TABLE IF NOT EXISTS research_search_usage (
  day TEXT PRIMARY KEY,
  calls INTEGER NOT NULL DEFAULT 0
);
