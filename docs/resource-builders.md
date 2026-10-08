# Free resource hub and planning tools

The homepage and `/resources/` expose the checklist and pro forma first, with the existing guides, readiness scan, Medicare tools, LaborGenie offer, and planned ebook below them. Existing service, specialty, state, and guide routes remain available.

## Customer flows

- `/resources/startup-checklist/`: profile-based tasks, completion tracking, owners, due dates, notes, custom tasks, Excel/PDF, and portable JSON backup/restore. Suggested dates follow the opening date until explicitly edited. Hidden tasks keep their saved progress.
- `/resources/pro-forma/`: 24-month cash forecast with editable illustrative assumptions, collection delay, upfront startup costs, provider compensation, payroll burden, debt payments, funding gap, and ending receivables. Excel has editable assumptions and cached formulas; PDF summarizes the current plan. This is not an accrual income statement. Model boundaries are visible in the UI and both exports.
- Both tools store a versioned plan in localStorage. No planner inputs are posted to a server or analytics. Site-wide analytics remain as before. Exports are created in the browser, with dependencies loaded only when needed.
- Browser saving can fail or be cleared. The UI explains local storage and offers backup/restore; invalid backups fail validation. Do not enter patient data.
- `/resources/hipaa-training/`: user-authorized free license offer. Requests use the dedicated HubSpot registration form, with the PPS contact page as an alternative. PPS must fulfill manually and confirm license scope. No automated activation, seat count, or term is promised. A completion certificate is not government certification or proof of organizational HIPAA compliance.
- Ebook is explicitly planned, with available online guides linked instead. No fake download or signup gate.

## Sources and assets

- Planning framework: https://www.sba.gov/counseling/plan-your-business/
- HIPAA scope: https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html
- Team headshots: existing owned PPS CAQH/practice-startup campaign assets (Lindsay Pauly, Tonya Barry, Marisa Martell).
- PDF fonts: Noto Sans Regular and Bold from https://github.com/notofonts/noto-fonts/tree/main/hinted/ttf/NotoSans with the SIL Open Font License in `public/fonts/OFL.txt`.
- Existing booking destination is preserved; it is not a new scheduling integration.

## Verification

Run `npm run test:planners`, `npm run check`, `npm run build`, and the existing CI gate regression suite. Verify browser flows against a production build (`npm run preview`), because concurrent Astro development/check processes can invalidate Vite's dependency optimization cache.

PDF/XLSX download packages are lazy imports. ExcelJS 4.4.0 brings a transitive uuid moderate audit advisory for buffer handling in UUID v3/v5/v6; this exporter does not call those APIs or parse workbooks. The repository also has existing Astro/Tailwind toolchain audit findings. No broad framework upgrade is included in this feature. A separate dependency maintenance change should address the existing toolchain.

## Service links and LaborGenie registration (2026-10-08)

Checklist tasks retain their stable IDs and progress. Relevant tasks show optional PPS, LaborGenie (staff training, compliance preparation, onboarding), or UnfairCPA help. These links are included in PDF and Excel exports; buying a service is never a completion requirement. UnfairCPA is a resource link, with no free-license promise.

The dedicated LaborGenie registration page embeds HubSpot portal 1849537 form a511bd25-cdf3-4265-aecb-d56ff941bf9e. Required fields: email and practice name (contact company property). The optional unchecked marketing checkbox mentions PPS resources, the upcoming EHR, LaborGenie, and UnfairCPA. HubSpot scripts load on the registration page only, not inside either planner. Checklist notes and financial assumptions remain local.

HubSpot form published through the existing account UI on October 8. CAPTCHA enabled; new email addresses create separate contacts. Marketing contact auto-classification is off: opt-in is captured, but future campaigns must select consenting recipients and activate their marketing-contact status. No follow-up campaign or automated license provisioning is configured. PPS manually arranges license access. Customized-plan email delivery is not implemented; direct PDF/Excel and JSON downloads remain available.

The HubSpot publisher warned that domains must be in Reports & Analytics Tracking. Added practicestartupservices.com as an external domain, saved the setting, and verified the saved list on October 8. No customer record or test email was submitted during implementation.
