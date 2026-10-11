// Server-side acceptance gate for AI-written briefs. A brief is shown only if:
// - it matches the expected structure (sections > statements),
// - every statement is tagged fact | estimate | interpretation,
// - facts and estimates cite sources that exist AND returned data,
// - every number in the text appears in the facts bundle or user inputs
//   (formatting normalized; rounding to 0-1 decimals of a source value allowed),
// - it contains no spelled-out quantities, URLs or markup.
// Anything else is rejected and never displayed.

import type { FactsBundle, SourceId } from "./facts.ts";

export type StatementKind = "fact" | "estimate" | "interpretation";
export type Statement = { text: string; kind: StatementKind; sourceIds: string[] };
export type BriefSection = { heading: string; statements: Statement[] };
export type Brief = { sections: BriefSection[] };

const NUMBER = /\d[\d,]*(?:\.\d+)?/g;
// Spelled-out quantities could smuggle unverified figures past the numeric check.
const NUMBER_WORDS = /\b(two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|hundreds|thousand|thousands|million|millions|billion|dozen|dozens|percent|percentage|half|quarter|third|majority|minority|double|doubled|triple|tripled)\b/i;
const FORBIDDEN = /(https?:|www\.|<|>|\]\(|javascript:)/i;

/** Every number appearing in a string, normalized (commas removed). */
export function numbersIn(text: string): number[] {
  return (text.match(NUMBER) ?? [])
    .map((m) => m.replace(/,/g, "").replace(/\.$/, ""))
    .filter((m) => m !== "")
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

/** All numbers present anywhere in the bundle or inputs (values and text). */
export function allowedNumbers(bundle: unknown, inputs: unknown): number[] {
  const out = new Set<number>();
  const walk = (v: unknown) => {
    if (typeof v === "number" && Number.isFinite(v)) out.add(v);
    else if (typeof v === "string") for (const n of numbersIn(v)) out.add(n);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") Object.values(v).forEach(walk);
  };
  walk(bundle);
  walk(inputs);
  return [...out];
}

const close = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

export function numberAllowed(n: number, allowed: number[]): boolean {
  return allowed.some((a) => close(n, a) || close(n, Math.round(a)) || close(n, Math.round(a * 10) / 10));
}

/**
 * The exact data the model is given and may cite. Timestamps and retrieval
 * dates are excluded so their digits cannot "ground" an invented number.
 */
export function groundingView(bundle: FactsBundle) {
  return {
    zip: bundle.zip,
    state: bundle.state?.name ?? "",
    labels: bundle.labels,
    sections: bundle.sections,
    sources: bundle.sources.map((s) => ({ id: s.id, name: s.name, vintage: s.id === "nppes" ? "Live registry" : s.vintage })),
    facts: bundle.facts.map((f) => ({ id: f.id, label: f.label, value: f.value, display: f.display, marginOfError: f.moeDisplay, unit: f.unit, sourceId: f.sourceId, geography: f.geography, capped: f.capped, note: f.note })),
    estimates: bundle.estimates.map((e) => ({ id: e.id, label: e.label, value: e.value, display: e.display, formula: e.formula, sourceIds: e.sourceIds, note: e.note })),
    caveats: bundle.caveats,
  };
}

export type GuardResult = { ok: true; brief: Brief } | { ok: false; reasons: string[] };

export function validateBrief(raw: unknown, bundle: FactsBundle, inputs: Record<string, unknown>): GuardResult {
  const reasons: string[] = [];
  const b = raw as Brief;
  if (!b || typeof b !== "object" || !Array.isArray(b.sections)) return { ok: false, reasons: ["structure"] };
  if (b.sections.length < 2 || b.sections.length > 6) reasons.push("section_count");
  const sourceIds = new Set<string>(bundle.sources.map((s) => s.id));
  // A source only backs a fact if its section actually returned data.
  const live = new Set<SourceId>(["zip3", "derived"]);
  if (bundle.sections.acs.status === "ok" && bundle.facts.some((f) => f.sourceId === "acs")) live.add("acs");
  if (bundle.sections.nppes.status === "ok" && bundle.facts.some((f) => f.sourceId === "nppes")) live.add("nppes");
  const allowed = allowedNumbers(groundingView(bundle), inputs);
  const check = (text: unknown, where: string) => {
    if (typeof text !== "string" || !text.trim() || text.length > 500) {
      reasons.push(`${where}:text`);
      return;
    }
    if (FORBIDDEN.test(text)) reasons.push(`${where}:forbidden`);
    if (NUMBER_WORDS.test(text)) reasons.push(`${where}:number_word`);
    for (const n of numbersIn(text)) if (!numberAllowed(n, allowed)) reasons.push(`${where}:number:${n}`);
  };
  const clean: Brief = { sections: [] };
  b.sections.forEach((s, i) => {
    if (!s || typeof s !== "object" || !Array.isArray(s.statements)) {
      reasons.push(`s${i}:structure`);
      return;
    }
    check(s.heading, `s${i}:heading`);
    if (typeof s.heading === "string" && s.heading.length > 90) reasons.push(`s${i}:heading_length`);
    if (s.statements.length < 1 || s.statements.length > 6) reasons.push(`s${i}:statement_count`);
    const statements: Statement[] = [];
    s.statements.forEach((st, j) => {
      const where = `s${i}.${j}`;
      if (!st || typeof st !== "object") {
        reasons.push(`${where}:structure`);
        return;
      }
      check(st.text, where);
      if (!["fact", "estimate", "interpretation"].includes(st.kind)) reasons.push(`${where}:kind`);
      if (!Array.isArray(st.sourceIds) || st.sourceIds.some((id) => typeof id !== "string" || !sourceIds.has(id))) reasons.push(`${where}:source_unknown`);
      else if (st.kind !== "interpretation") {
        if (!st.sourceIds.length) reasons.push(`${where}:source_missing`);
        if (st.sourceIds.some((id) => !live.has(id as SourceId))) reasons.push(`${where}:source_no_data`);
      }
      statements.push({ text: String(st.text ?? ""), kind: st.kind, sourceIds: Array.isArray(st.sourceIds) ? [...st.sourceIds] : [] });
    });
    clean.sections.push({ heading: String(s.heading ?? ""), statements });
  });
  return reasons.length ? { ok: false, reasons } : { ok: true, brief: clean };
}
