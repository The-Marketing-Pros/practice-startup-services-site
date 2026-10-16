# PSS ChatGPT Ads measurement

Dedicated source: PSS | Website Conversions. Pixel: `R5NpCwe1ExEDMYvfTv7AAj`.
Campaign: PSS | Free Startup Tools, in the existing PPS Ads account. Its inquiry conversion uses only the PSS source.

| Action | OpenAI event | Trigger |
| --- | --- | --- |
| Page visit | page_viewed | One bootstrap per page on the two production PSS hostnames |
| Free-license request | lead_created | HubSpot onFormSubmitted callback; stable ID and once-per-form guard |
| Research request | lead_created | Existing server-confirmed success and stable event ID/session guard; only when the research gate is operational |
| Checklist download | custom: pss_checklist_download | Successful local export |
| Pro forma download | custom: pss_proforma_download | Successful local export |
| Research PDF download | custom: pss_research_download | Successful local export |
| Market preview | contents_viewed | Preview successfully rendered, content ID pss_research_preview |

Page views, SDK initialization, previews and downloads are not inquiries. Never fire a lead from a button click, form readiness, generic thank-you page visit, or failed request. Cross-domain PPS form submissions are not currently forwarded to this PSS pixel. No OpenAI CAPI is configured.

The SDK loads only on practicestartupservices.com and www.practicestartupservices.com. Local and preview domains are excluded. The SDK manages its own ad-click identifier and first-party cookies. No manual email or phone hashing is added; automatic matching is controlled by Ads Manager. Explicit event payloads contain no planner inputs or form fields. Privacy disclosures cover the SDK and conditional matching.

## Verify after deployment

Visit a production PSS page, then make a real checklist/pro forma download. In Ads Manager, filter Event Stream to PSS | Website Conversions. Confirm page_viewed and the matching download event, not just SDK initialization. Check a real confirmed inquiry separately; avoid fabricating production leads for a test. Attribution requires an eligible real ad interaction; receipt alone does not prove ad attribution. Keep campaign paused until measurement and launch settings are accepted.

Rollback: revert this PR through the normal deployment path. Existing Google/Meta wiring and the PPS source are unchanged.

References: https://developers.openai.com/ads/measurement-pixel and https://developers.openai.com/ads/supported-events .
