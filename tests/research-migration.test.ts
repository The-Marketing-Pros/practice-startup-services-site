import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";

test("HubSpot attempt migration preserves populated jobs and saved report contents", () => {
  const db = new DatabaseSync(":memory:");
  const migration = (name: string) => readFileSync(new URL(`../migrations/${name}`, import.meta.url), "utf8");
  db.exec(migration("0001_research.sql"));
  db.exec(migration("0002_competitor_search.sql"));
  db.exec(`INSERT INTO research_jobs (id, identity_hash, ip_hash, context_hash, day, created_at, updated_at, event_id, status, hubspot_status, result_json)
    VALUES ('saved', 'email-hash', 'ip-hash', 'context-hash', '2026-10-15', 1, 1, 'event', 'complete', 'submitted', '{"ok":true}'),
           ('pending', 'email-hash', 'ip-hash', 'context-hash', '2026-10-15', 1, 1, 'event2', 'failed', 'pending', NULL);`);
  const before = db.prepare("SELECT * FROM research_jobs ORDER BY id").all();
  db.exec(migration("0003_hubspot_attempt.sql"));
  const after = db.prepare("SELECT * FROM research_jobs ORDER BY id").all();
  assert.equal(after.length, before.length);
  after.forEach((row, i) => {
    const { hubspot_attempted, ...original } = row;
    assert.equal(hubspot_attempted, row.id === "pending" ? 1 : 0);
    assert.deepEqual(original, { ...before[i] });
  });
  db.close();
});
