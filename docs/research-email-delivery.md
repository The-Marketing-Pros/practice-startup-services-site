# Private email report delivery

Owner direction, October 16, 2026: use email to Issah this week because HubSpot
service-key approval is unavailable. The lead still goes through a dedicated
HubSpot form, then the server prepares a named PDF and emails it privately to
Issah Meade. The visitor receives only a confirmation. Issah reviews and forwards
the PDF. This mode does not attach files in HubSpot or dynamically route to the
contact owner; it does not change existing ownership.

## Components

- Form requires first name, last name, practice/working name and email. Standard
  HubSpot contact fields: firstname, lastname, company, email. Names are not sent
  to OpenAI or Brave, stored in the research result/ledger, or put in tool URLs.
- Names are bound into the request HMAC. Changing a name cannot silently relabel
  a previously submitted report. PDF generation uses the validated request.
- `RESEARCH_DELIVERY_MODE=email` selects `REPORT_MAILER`, a private Cloudflare
  service binding. No HubSpot private token or owner ID is required in this mode.
- `workers/report-mailer` has no public route, workers.dev or preview URL. Sender
  and recipient come from deployment configuration. The email binding limits
  delivery to issah@drcred.com. PSS sender: startup@reports.practicestartupservices.com.
- The report email contains matching names, email, specialty, ZIP, reference,
  full request UUID and preparation date. Attachments are actual PDF bytes.
- AI fallback reports are flagged as partial, requiring review. A PDF rendering
  failure sends a separate action-needed notice (without a PDF) once, and returns
  an honest pending response. A later retry can deliver the recovered PDF.

## Reliability and limits

Generation and delivery remain synchronous after HubSpot capture. The visitor
must keep the page open. Email is attempted immediately after report generation;
no fixed delivery time or inbox receipt is promised. A provider acknowledgement
is not proof of inbox arrival. There is no background retry queue in this version.

Migration 0005 adds a separate email ledger. A lease prevents parallel sends; a
write-ahead marker prevents duplicate sends after ambiguous provider outcomes or
lost database acknowledgements. Operators must reconcile these markers against
Cloudflare email activity using the request reference. Do not blindly reset them.
The stored report remains available for retry without a second AI call. Names
and contact email are resupplied by the same validated form request, not persisted
in this ledger. Errors before report storage remain recorded on research_jobs;
HubSpot submission notifications give Issah the original lead even if generation
stops. The email alert covers PDF rendering failures, not a process crash or an
email-provider outage. Check pending rows during operations.

```sql
SELECT j.id, j.status, j.hubspot_status, j.last_error, e.email_id, e.alert_id,
       e.attempted_step, e.last_error AS email_error
FROM research_jobs j LEFT JOIN research_email_deliveries e ON e.job_id=j.id
WHERE j.hubspot_status='submitted' AND e.email_id IS NULL;
```

## Deployment

1. Keep RESEARCH_ENABLED off; inspect the remote schema and back up D1 before
   applying any missing migrations. Apply 0005; the existing report handler also
   needs 0003. 0004 supports the optional older HubSpot-delivery mode.
2. Onboard reports.practicestartupservices.com in Cloudflare Email Sending.
   Preserve the main domain's mail routes. Verify SPF, DKIM and DMARC.
3. Deploy workers/report-mailer/wrangler.jsonc after review. Add production Pages
   service binding REPORT_MAILER -> pss-report-mailer. Do not bind production mail
   to ordinary preview deployments; their tests use a fake sender.
4. Set production RESEARCH_DELIVERY_MODE=email and HUBSPOT_RESEARCH_FORM_ID to
   the dedicated form. It must accept email, firstname, lastname and company;
   notify Issah, leave prospect autoresponders off and create non-marketing
   contacts. Do not enable marketing subscription without separate consent setup.
5. Complete existing Turnstile, model, D1 and usage-cap configuration. Deploy
   frontend and Functions together; never use the local Turnstile test key live.
6. Verify one clearly labeled test: captured HubSpot lead, Issah notification,
   named PDF and actual email activity/receipt, no report in browser response,
   no duplicate on retry. Then enable visitor submissions.

## Verification

Automated tests use SQLite and mocked providers. They cover email mode without a
HubSpot key, capture-before-send ordering, name validation and replay binding,
PII exclusion from AI/storage/visitor responses, PDF attachments, fixed recipient,
concurrency, write-ahead/ack failures, rendering failure alert and recovery.
Live acceptance and configuration results belong in the dated review record.
