// PDF of the visitor's actual personalized work: facts with sources, dates and
// margins of error; labeled estimates; the AI brief with statement tags; and
// the tailored checklist summary. Generated on the server for private SDR delivery.
import { pdfDocument } from "../planners/pdf-layout.ts";
import { ECONOMY_NOTE, FRED_NOTICE, FRED_TERMS, economicPeriod } from "./economy.ts";
import type { FactsBundle } from "./facts.ts";
import type { Brief } from "./guard.ts";
import { competitorNote, competitorUrl, type CompetitorResearch } from "./competitors.ts";
import { researchToolLinks } from "./tool-links.ts";
import { stages } from "../planners/checklist.ts";
import type { Task } from "../planners/checklist.ts";
import type { ReportContact } from './contract.ts';

export type ResearchResult = {
  reference: string;
  generatedAt: string;
  facts: FactsBundle;
  brief: Brief | null;
  briefStatus: string;
  competitors?: CompetitorResearch;
};

const KIND_LABEL: Record<string, string> = { fact: "Fact", estimate: "Estimate", interpretation: "Interpretation" };

/** Confirmation heading: only claim a brief when one is actually shown. */
export function confirmationHeading(status: string): string {
  return status === "ready" ? "Your brief is ready." : "Request received. Your data tables and checklist are ready.";
}

export function briefStatusNote(status: string): string {
  switch (status) {
    case "ready":
      return "";
    case "rejected":
      return "The AI draft did not pass our accuracy checks, so we are not showing it. Your data tables and tailored checklist are complete.";
    case "capacity":
      return "We reached today's limit for written briefs. Your data tables and tailored checklist are complete.";
    case "insufficient_data":
      return "Public data was not available for this ZIP right now, so no written brief was generated. Your tailored checklist is complete.";
    default:
      return "The written brief could not be generated. Your data tables and tailored checklist are complete.";
  }
}

export async function researchPdf(result: ResearchResult, plan: { summary: string; personal: Task[]; first: Task[]; total: number; all: Task[] }, fontFetch: typeof fetch = fetch, contact?: ReportContact) {
  const f = result.facts;
  const pdf = await pdfDocument(
    "Your practice launch plan",
    `${f.labels.provider} | ${f.labels.specialty} | ZIP ${f.zip}${f.labels.state ? ` (${f.labels.state})` : ""}`,
    fontFetch,
  );
  if (contact) {
    pdf.line(`Prepared for ${contact.firstName} ${contact.lastName}`, 16, true);
    pdf.line(contact.practiceName, 13, true);
    pdf.space();
  }
  pdf.line(`Reference ${result.reference} | Generated ${result.generatedAt.slice(0, 10)}`, 9);
  pdf.line("Facts come from public sources named below. Estimates are calculated from those facts and labeled. Interpretations are planning suggestions, not advice. Confirm requirements with your licensing board, payers and advisers.", 9);

  const links = researchToolLinks(f.profile);
  const origin = "https://practicestartupservices.com";
  pdf.space();
  pdf.section("Your roadmap");
  pdf.line("Use this report to organize your launch, investigate your market and decide what to validate next. Your PPS specialist can help you turn the findings into an action plan.");
  if (result.briefStatus !== "ready") pdf.line(`Report status: ${briefStatusNote(result.briefStatus)}`, 9, true);
  pdf.jump("01  Market research and planning brief", "market");
  pdf.jump("02  Marketing action plan", "marketing");
  pdf.jump("03  Full startup checklist", "checklist");
  pdf.jump("04  Pro forma and financial planning", "proforma");
  pdf.jump("05  Sources and limits", "sources");
  pdf.space();
  pdf.line("Continue with your editable tools", 12, true);
  pdf.link("Open your full startup checklist", origin + links.checklist);
  pdf.link("Open your pro forma builder", origin + links.proforma);
  pdf.line("These links carry your practice details. Checklist progress and financial assumptions are edited and saved in your browser; they are not embedded in these links.", 9);

  pdf.section("01 / Market research", "market", true);
  pdf.line("Your area at a glance", 14, true);
  if (f.sections.acs.status !== "ok") pdf.line(f.sections.acs.message);
  for (const x of f.facts.filter((x) => x.sourceId === "acs"))
    pdf.line(`${x.label} (${x.geography}): ${x.display}${x.moeDisplay ? ` (margin of error ${x.moeDisplay})` : ""}${x.note ? `. ${x.note}` : ""}`);

  pdf.space();
  pdf.line("Providers already listed nearby", 14, true);
  if (f.sections.nppes.status !== "ok") pdf.line(f.sections.nppes.message);
  if (f.labels.taxonomy) pdf.line(`Matching taxonomy: ${f.labels.taxonomy}`, 9);
  for (const x of f.facts.filter((x) => x.sourceId === "nppes")) pdf.line(`${x.label}: ${x.display}${x.note ? `. ${x.note}` : ""}`);
  if (f.sections.nppes.note) pdf.line(f.sections.nppes.note, 9);
  const nppesSource = f.sources.find((s) => s.id === "nppes");
  if (nppesSource && f.sections.nppes.status === "ok") pdf.line(`NPI Registry data retrieved ${nppesSource.retrieved}.`, 9);

  for (const e of f.estimates) {
    pdf.space();
    pdf.line(`${e.label}: ${e.display}`, 12, true);
    pdf.line(`Formula: ${e.formula}`, 9);
    pdf.line(e.note, 9);
  }

  pdf.space();
  if (f.economy) {
    pdf.keep(95);
    pdf.line("U.S. economy and housing", 14, true);
    pdf.line(ECONOMY_NOTE, 9);
    for (const x of f.economy.items) {
      pdf.keep(50);
      pdf.line(`${x.label}: ${x.display}`, 11, true);
      if (x.period) pdf.line(`${economicPeriod(x.period)} | United States${x.comparison ? ` | ${x.comparison}` : ""}`, 9);
      if (x.stale) pdf.line("Latest available observation is more than four months old.", 9);
      pdf.line(x.note, 9);
      pdf.line(`${x.source} via FRED${x.retrieved ? ` | Retrieved ${x.retrieved.slice(0,10)}` : ""}`, 8);
      pdf.link(x.id, x.url);
      pdf.space();
    }
    pdf.line(FRED_NOTICE, 8);
    pdf.link("FRED API terms", FRED_TERMS);
    pdf.space();
  }
  pdf.keep(60);
  pdf.line("Your planning brief", 14, true);
  if (result.brief) {
    for (const s of result.brief.sections) {
      pdf.keep(30);
      pdf.line(s.heading, 12, true);
      for (const st of s.statements) pdf.line(`[${KIND_LABEL[st.kind] ?? st.kind}] ${st.text}`);
    }
    pdf.line("Facts and estimates are written by our system from the data tables, word for word. AI chose which to include and wrote the interpretations, which contain no numbers. Review before relying on it.", 9);
  } else pdf.line(briefStatusNote(result.briefStatus));

  pdf.space();
  if (result.competitors) {
    pdf.line("Potential competitors to investigate", 14, true);
    pdf.line(competitorNote(result.competitors), 9);
    if (result.competitors.retrieved) pdf.line(`Brave Search | Retrieved ${result.competitors.retrieved.slice(0, 10)} | Query: ${result.competitors.query}`, 9);
    for (const item of result.competitors.items) {
      const url = competitorUrl(item.url);
      if (!url) continue;
      pdf.keep(32);
      pdf.line(item.title, 11, true);
      if (item.description) pdf.line(`Search excerpt: ${item.description}`, 9);
      pdf.link("Practice website", url);
      pdf.space();
    }
    pdf.line("Before positioning your practice, compare services, geography, payer participation and appointment access directly with each practice.", 9);
    pdf.space();
  }
  pdf.section("02 / Marketing action plan", "marketing", true);
  pdf.line(`${f.labels.specialty} | ZIP ${f.zip}`, 11, true);
  pdf.line("A planning framework tailored to the practice details you supplied. These are suggested actions, not verified market opportunities, forecasts or AI findings. Validate them with your PPS specialist and the sources in this report.", 9);
  const actions = [
    ["Define your position", `Describe who your ${f.labels.specialty.toLowerCase()} practice will serve, which services you will offer and how patients will access care. Compare the potential competitors in this report directly before making claims about gaps in the market.`],
    ["Build the patient discovery path", f.profile.setting === "telehealth" ? "Build a clear specialty and service-area page for the states where you can practice. Explain the virtual visit process and test the appointment request flow before promoting it." : "Prepare your practice website and eligible local business listing with consistent location, service and appointment information. Test the path from a local search to a completed inquiry."],
    ["Make access clear", f.profile.payer === "cash" ? "Explain your self-pay services, published prices and payment policies. Confirm the offer with your team before using it in advertising." : "Publish only confirmed payer participation and explain the difference between enrollment in progress and plans you currently accept. Make it easy for patients to ask about coverage."],
    ["Develop referral relationships", "Identify relevant local clinicians and community organizations. Prepare a concise service introduction, a referral process and a contact person; verify that each relationship fits your specialty and care model."],
    ["Launch, measure and adjust", "Choose an initial outreach channel and agree on a budget before launch. Track inquiries, booked visits, attended visits and referral sources. Review results against capacity and cash flow before expanding. Keep patient and sensitive health information out of advertising analytics."],
  ];
  for (const [title, text] of actions) { pdf.keep(38); pdf.line(title, 12, true); pdf.line(text); pdf.space(); }
  pdf.line("Working decisions to complete with your specialist: priority audience, service offer, channel, owner, launch date, budget and success measure.", 9);

  pdf.section("03 / Full startup checklist", "checklist", true);
  pdf.line(plan.summary, 9);
  pdf.line(`${plan.total} tasks tailored to your practice. Use the editable checklist to assign owners, set dates, track progress and download a working copy.`, 10);
  pdf.link("Open and edit your full checklist", origin + links.checklist);
  if (plan.first.length) {
    pdf.line("Start these first", 12, true);
    pdf.line("Suggested start dates have passed for your timeline. These are planning targets, not required lead times.", 9);
    for (const t of plan.first) pdf.line(`- ${t.title}`, 9);
  }
  let phase = -1;
  for (const t of plan.all) {
    if (t.phase !== phase) { pdf.keep(50); pdf.space(); pdf.line(stages[t.phase], 13, true); phase = t.phase; }
    pdf.keep(28);
    pdf.line(`[ ] ${t.title}`, 10, true);
    pdf.line(t.detail, 9);
    if (t.reason) pdf.line(`Why it applies: ${t.reason}`, 8);
    if (t.link) pdf.link(t.link.label, t.link.url);
  }

  pdf.section("04 / Pro forma and financial planning", "proforma", true);
  pdf.line("Build your cash forecast", 14, true);
  pdf.line("Your practice details are carried into the pro forma builder. Review the starting assumptions, then enter your own costs, capacity, expected collections, payer mix and funding. The report does not assume you have supplied financial figures.");
  pdf.link("Open your pro forma builder", origin + links.proforma);
  pdf.line("Complete the assumptions", 12, true);
  pdf.line("Replace sample values with your actual quotes, contracts and expected staffing. Apply your selected practice context in the builder only when you are ready to replace its starting inputs.");
  pdf.line("Review the forecast", 12, true);
  pdf.line("Check startup costs, opening cash, monthly cash balance and any modeled funding shortfall. Adjust the launch and marketing plan to the resources available.");
  pdf.line("Export and share", 12, true);
  pdf.line("Download the editable Excel workbook or formatted PDF from the builder. Review the assumptions and model limits with your advisers. Saved browser inputs do not travel with the link.");

  pdf.section("05 / Sources and limits", "sources", true);
  for (const s of f.sources) {
    pdf.line(`${s.name}${s.vintage ? ` (${s.vintage})` : ""}`, 9, true);
    if (s.url) pdf.link("Source", s.url);
    if (s.notes) pdf.line(s.notes, 8);
  }
  return pdf.finish();
}
