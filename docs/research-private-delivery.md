# Private report delivery to the SDR

Owner direction (2026-10-16): show a free preview, require a form submission,
prepare the full report privately, attach it to the HubSpot lead/contact, and
notify the assigned SDR to review and forward it. Do not expose the complete
report on the visitor page, in browser storage, or in API responses.

## Implemented flow

The existing validated/Turnstile-protected form captures consent in HubSpot.
The server fetches facts, generates and checks the AI brief, searches potential
competitors and saves the report in D1. It renders the PDF on the server and:

1. Resolves the contact by submitted email; reads its current owner.
2. Uses `HUBSPOT_RESEARCH_FALLBACK_OWNER_ID` only if the contact is unowned.
   Contact ownership itself is not changed. The selected owner must be active.
3. Uploads the PDF with `access: PRIVATE` to `/pss-startup-research` in HubSpot.
4. Creates an associated note with the PDF, request ID, practice details, and
   review instructions. Missing/rejected AI output is explicitly flagged.
5. Creates an associated task assigned to that owner, due in one hour, with a
   reminder one minute after creation. Verify the user's HubSpot notification
   settings in the live acceptance test; creating a task does not prove an
   email/push notification was received.
6. Returns an allowlisted receipt only after all delivery steps acknowledge.

There is no public report download endpoint. Existing session-cached reports
are discarded. Free Census/provider/economic tables and checklist previews
remain visible; paid provider calls and complete report generation require the
validated form. No prospect email is sent automatically.

## Configuration and activation

In addition to `docs/research-deployment.md` prerequisites:

- Apply `migrations/0004_private_delivery.sql` once to the target D1 database
  after migrations 0001–0003. It creates a separate delivery table; it does not
  alter existing jobs. Back up and inspect the migration ledger before applying.
- Set encrypted `HUBSPOT_PRIVATE_APP_TOKEN` in the Pages environment. Use the
  intended portal (1849537), with access to read contacts/owners and upload files
  and create contact-associated notes/tasks. Verify actual endpoint permissions;
  do not broaden an existing app without owner authorization.
- Set `HUBSPOT_RESEARCH_FALLBACK_OWNER_ID` to the confirmed SDR's numeric HubSpot
  owner ID (not user ID). This is required before the form reports availability.
- Verify the dedicated form, consent, assignment rules, no prospect autoresponder,
  Turnstile widget/site key, OpenAI model, usage caps and provider budget.
- Deploy the frontend and Functions together. Do not enable the older direct
  browser-report implementation. Preview must have separate test configuration.
- Run a clearly labeled owner-authorized test lead: inspect the private PDF,
  contact association, assigned task and actual notification. Confirm every
  success/replay/error response contains no report or private URLs. Then enable
  production and verify the same flow. No live acceptance is claimed by local
  fixture tests.

HubSpot API references:
- https://developers.hubspot.com/docs/api-reference/legacy/files/guide
- https://developers.hubspot.com/docs/api-reference/legacy/crm/activities/notes/guide
- https://developers.hubspot.com/docs/api-reference/legacy/crm/activities/tasks/guide

## Failure recovery and operational limits

This version completes generation/delivery during the form request. It does not
have an automatic background queue. If a read/PDF generation fails, retrying the
same request resumes the persisted report without another AI call. The visitor
must keep the page open and use the same request to retry. An operator must
reconcile abandoned failed handoffs before launch monitoring is considered complete.

External POSTs use durable write-ahead markers. If an upload/note/task times out,
returns an error, or loses its D1 acknowledgement, automatic replay stops rather
than duplicating the object. Find the full UUID in the file name and note/task
body. After checking HubSpot, an operator may populate the verified file/note/task
ID and clear `attempted_step`, or clear it only when the operation definitely did
not happen. Never blindly reset markers after a timeout. Successful earlier steps
are retained. `last_error` contains codes only. No email or tokens are stored in
this table. Normal browser replays still require matching email/profile and a
fresh Turnstile token.

Inspect pending deliveries (read-only):

```sql
SELECT j.id, j.status, d.contact_id, d.owner_id, d.file_id, d.note_id,
       d.task_id, d.attempted_step, d.last_error
FROM research_jobs j LEFT JOIN research_deliveries d ON d.job_id = j.id
WHERE j.status = 'complete' AND d.task_id IS NULL;
```

Preserve these pending records for reconciliation; prune completed delivery rows
alongside expired research jobs under the site's retention policy. HubSpot file,
note and task retention is separate and needs the business's existing policy.
