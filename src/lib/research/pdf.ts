// PDF of the visitor's actual personalized work: facts with sources, dates and
// margins of error; labeled estimates; the AI brief with statement tags; and
// the tailored checklist summary. Generated on the server for private SDR delivery.
import { pdfDocument } from "../planners/pdf-layout.ts";
import { ECONOMY_NOTE, FRED_NOTICE, FRED_TERMS, economicPeriod } from "./economy.ts";
import type { FactsBundle } from "./facts.ts";
import type { Brief } from "./guard.ts";
import { competitorNote, competitorUrl, type CompetitorResearch } from "./competitors.ts";
import type { Task } from "../planners/checklist.ts";

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

export async function researchPdf(result: ResearchResult, plan: { summary: string; personal: Task[]; first: Task[]; total: number }, fontFetch: typeof fetch = fetch) {
  const f = result.facts;
  const pdf = await pdfDocument(
    "My startup research",
    `${f.labels.provider} | ${f.labels.specialty} | ZIP ${f.zip}${f.labels.state ? ` (${f.labels.state})` : ""}`,
    fontFetch,
  );
  pdf.line(`Reference ${result.reference} | Generated ${result.generatedAt.slice(0, 10)}`, 9);
  pdf.line("Facts come from public sources named below. Estimates are calculated from those facts and labeled. Interpretations are planning suggestions, not advice. Confirm requirements with your licensing board, payers and advisers.", 9);

  pdf.space();
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
  pdf.line("Your tailored startup checklist", 14, true);
  pdf.line(plan.summary, 9);
  pdf.line(`${plan.total} tasks in your plan. Steps added for your situation:`);
  for (const t of plan.personal) pdf.line(`- ${t.title}${t.reason ? ` (${t.reason})` : ""}`);
  if (plan.first.length) {
    pdf.line("Start these first (suggested start dates have passed for your timeline):", 10, true);
    for (const t of plan.first) pdf.line(`- ${t.title}`);
  }
  pdf.link("Open and edit your full checklist", "https://practicestartupservices.com/resources/startup-checklist/");

  pdf.space();
  pdf.line("Sources and limits", 14, true);
  for (const s of f.sources) {
    pdf.line(`${s.name}${s.vintage ? ` (${s.vintage})` : ""}`, 9, true);
    if (s.url) pdf.link("Source", s.url);
    if (s.notes) pdf.line(s.notes, 8);
  }
  return pdf.finish();
}
