// Server-side acceptance gate for AI-written briefs.
//
// Design (R1 round 2): the model never writes a number.
// - "fact" and "estimate" statements: the model only chooses which item ids
//   to include (and their order). Our code RENDERS the sentence from each
//   cited item with a fixed template (label, value/display, unit, margin of
//   error, vintage or retrieval date, "at least" for capped counts). Any text
//   the model put in these statements is discarded.
// - "interpretation" statements: model-written planning text that must
//   contain no digits, no cardinal words (two and up), no fraction or
//   quantity words, no unit words, no URLs/domains and no markup. A small
//   idiom allowlist (one-on-one, third-party, double-check, first-pass) is
//   removed before checking. The only permitted echoes are the visitor's own
//   inputs (ZIP as "ZIP 12345", the chosen stage label).
// Anything else is rejected and never displayed.

import type { FactsBundle, Fact, Estimate } from "./facts.ts";

export type StatementKind = "fact" | "estimate" | "interpretation";
export type Statement = { text: string; kind: StatementKind; refs: string[] };
export type BriefSection = { heading: string; statements: Statement[] };
export type Brief = { sections: BriefSection[] };

const IDIOMS = /\b(one-on-one|third-party|third-parties|double-check(?:ed|ing|s)?|first-pass)\b/gi;
const CARDINALS =
  "two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fourty|fifty|sixty|seventy|eighty|ninety";
// Each pattern is a reason code; any hit rejects an interpretation.
export const INTERPRETATION_BANS: Array<[string, RegExp]> = [
  ["digit", /\p{Nd}/u],
  ["cardinal", new RegExp(`\\b(${CARDINALS})(?:-[a-z]+)?\\b`, "i")],
  ["cardinal", /\b(hundreds?|thousands?|millions?|billions?|dozens?|couple|several|a\s+few|few|twice|thrice|tens\s+of)\b/i],
  ["fraction", /\b(half|halves|halfs|thirds|quarters|fifths|tenths|-tenths)\b/i],
  ["fraction", /\b(a|one)\s+(third|quarter|fifth|tenth)\b/i],
  ["fraction", /\b(third|quarter|fifth|tenth)s?\s+of\b/i],
  ["fraction", /\b(majority|minority|plurality)\s+of\b/i],
  ["unit", /\b(percent|percentage|per\s?cent|pct|dollars?|bucks|cents?)\b|[%$]/i],
  ["multiplier", /\b(doubled?|tripled?|quadrupled?|(?:ten|hundred)fold|fold\s+increase)\b/i],
  ["url", /(https?:|:\/\/|www\.|javascript:|\b[a-z0-9-]+\.(gov|com|org|net|edu|us|info)\b(?:\/|\s|$|[.,;)]))/i],
  ["markup", /[<>]|\]\(/],
];

/** Strip exact echoes of visitor inputs (ZIP as an identifier, chosen labels). */
export function stripInputEchoes(text: string, bundle: FactsBundle, inputs: Record<string, unknown>): string {
  let t = text.replace(new RegExp(`\\b(ZIP(\\s+code)?|ZCTA)\\s+${bundle.zip}\\b`, "gi"), "$1");
  // Only multi-word labels (e.g. "Opening within 6 months"); a bare ZIP is echoed only as "ZIP 12345".
  const labels = Object.values(inputs).filter((v): v is string => typeof v === "string" && /\d/.test(v) && /[a-z]/i.test(v) && v.length > 3);
  for (const label of labels) t = t.replace(new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "");
  return t;
}

/** Reason codes for an interpretation (empty = acceptable). */
export function interpretationProblems(text: string, bundle: FactsBundle, inputs: Record<string, unknown>): string[] {
  const t = stripInputEchoes(text.normalize("NFKC"), bundle, inputs).replace(IDIOMS, " ");
  const hits = new Set<string>();
  // Check the raw text for non-ASCII digits too (NFKC folds full-width digits).
  if (/(?![0-9])\p{Nd}/u.test(text)) hits.add("digit");
  for (const [code, re] of INTERPRETATION_BANS) if (re.test(t)) hits.add(code);
  return [...hits];
}

const vintageOf = (bundle: FactsBundle, id: string) => bundle.sources.find((s) => s.id === id);

/** Fixed sentence for a fact, using exactly the strings shown in the tables. */
export function renderFact(f: Fact, bundle: FactsBundle): string {
  if (f.sourceId === "acs") {
    const src = vintageOf(bundle, "acs");
    return `${f.label}, ${f.geography}: ${f.display}${f.moeDisplay ? ` (margin of error ${f.moeDisplay})` : ""}. Source: ${src?.vintage ?? "American Community Survey"}.`;
  }
  const src = vintageOf(bundle, "nppes");
  return `${f.label}: ${f.display}. Source: NPI Registry, retrieved ${src?.retrieved ?? ""}.`;
}

export function renderEstimate(e: Estimate): string {
  return `${e.label}: ${e.display}. Formula: ${e.formula}. ${e.note}`;
}

/** The exact data the model is given. Retrieval dates and timestamps are excluded. */
export function groundingView(bundle: FactsBundle) {
  return {
    zip: bundle.zip,
    state: bundle.state?.name ?? "",
    labels: bundle.labels,
    sections: bundle.sections,
    sources: bundle.sources.map((s) => ({ id: s.id, name: s.name })),
    facts: bundle.facts.map((f) => ({ id: f.id, label: f.label, value: f.value, display: f.display, marginOfError: f.moeDisplay, unit: f.unit, sourceId: f.sourceId, geography: f.geography, capped: f.capped, note: f.note })),
    estimates: bundle.estimates.map((e) => ({ id: e.id, label: e.label, value: e.value, display: e.display, formula: e.formula, note: e.note })),
    caveats: bundle.caveats,
  };
}

/** Ids a statement may cite: facts with data and calculated estimates. */
export function citableIds(bundle: FactsBundle): string[] {
  return [...bundle.facts.filter((f) => f.value !== null).map((f) => f.id), ...bundle.estimates.filter((e) => e.value !== null).map((e) => e.id)];
}

export type GuardResult = { ok: true; brief: Brief } | { ok: false; reasons: string[] };

export function validateBrief(raw: unknown, bundle: FactsBundle, inputs: Record<string, unknown>): GuardResult {
  const reasons: string[] = [];
  const b = raw as Brief;
  if (!b || typeof b !== "object" || !Array.isArray(b.sections)) return { ok: false, reasons: ["structure"] };
  if (b.sections.length < 2 || b.sections.length > 6) reasons.push("section_count");
  const facts = new Map(bundle.facts.filter((f) => f.value !== null).map((f) => [f.id, f]));
  const estimates = new Map(bundle.estimates.filter((e) => e.value !== null).map((e) => [e.id, e]));

  const clean: Brief = { sections: [] };
  b.sections.forEach((s, i) => {
    if (!s || typeof s !== "object" || !Array.isArray(s.statements)) {
      reasons.push(`s${i}:structure`);
      return;
    }
    if (typeof s.heading !== "string" || !s.heading.trim() || s.heading.length > 90) reasons.push(`s${i}:heading`);
    else for (const code of interpretationProblems(s.heading, bundle, inputs)) reasons.push(`s${i}:heading:${code}`);
    if (s.statements.length < 1 || s.statements.length > 6) reasons.push(`s${i}:statement_count`);
    const statements: Statement[] = [];
    s.statements.forEach((st, j) => {
      const where = `s${i}.${j}`;
      if (!st || typeof st !== "object") return void reasons.push(`${where}:structure`);
      const refs = Array.isArray(st.refs) && st.refs.every((r) => typeof r === "string") ? st.refs : null;
      if (!refs) return void reasons.push(`${where}:refs`);
      if (st.kind === "fact") {
        if (!refs.length || refs.some((r) => !facts.has(r))) return void reasons.push(`${where}:fact_refs`);
        // Model text is discarded; the sentence is rendered from the cited items.
        statements.push({ kind: "fact", refs: [...refs], text: refs.map((r) => renderFact(facts.get(r)!, bundle)).join(" ") });
      } else if (st.kind === "estimate") {
        if (!refs.length || refs.some((r) => !estimates.has(r))) return void reasons.push(`${where}:estimate_refs`);
        statements.push({ kind: "estimate", refs: [...refs], text: refs.map((r) => renderEstimate(estimates.get(r)!)).join(" ") });
      } else if (st.kind === "interpretation") {
        if (refs.length) reasons.push(`${where}:interpretation_refs`);
        if (typeof st.text !== "string" || !st.text.trim() || st.text.length > 500) return void reasons.push(`${where}:text`);
        for (const code of interpretationProblems(st.text, bundle, inputs)) reasons.push(`${where}:${code}`);
        statements.push({ kind: "interpretation", refs: [], text: st.text });
      } else reasons.push(`${where}:kind`);
    });
    clean.sections.push({ heading: String(s.heading ?? ""), statements });
  });
  return reasons.length ? { ok: false, reasons } : { ok: true, brief: clean };
}
