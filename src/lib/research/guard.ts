// Server-side acceptance gate for AI-written briefs. A brief is shown only if:
// - it matches the expected structure (sections > statements),
// - every statement is tagged fact | estimate | interpretation and lists the
//   fact/estimate ids it relies on (`refs`),
// - each number in a statement comes from the items THAT statement cites
//   (their value, display or margin of error, with 0-1 decimal rounding);
//   caveats, source names, vintages and the ZIP are never a number source,
// - interpretations contain no digits except echoes of the visitor's inputs,
// - "%" and "$" appear only next to numbers from percent / dollar items,
// - digits are ASCII after Unicode normalization (no full-width tricks),
// - there are no quantity phrases (for example "majority of", "a third of",
//   "3 in 5", "thousands"), URLs, bare domains or markup.
// Anything else is rejected and never displayed.

import type { FactsBundle } from "./facts.ts";

export type StatementKind = "fact" | "estimate" | "interpretation";
export type Statement = { text: string; kind: StatementKind; refs: string[] };
export type BriefSection = { heading: string; statements: Statement[] };
export type Brief = { sections: BriefSection[] };

const NUMBER = /(\$\s?)?(\d[\d,]*(?:\.\d+)?)(\s?%)?/g;
// Quantity phrases that could smuggle unverified figures past the digit check.
// Ordinary words ("third-party", "double-checked", "which quarter") are allowed.
const CARDINAL = "one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety";
const COUNT_NOUN = "residents|people|patients|providers|practices|households|doctors|physicians|clinicians|competitors|visits|families|adults|children|seniors";
export const QUANTITY_PATTERNS: RegExp[] = [
  /\b(a|one|two)\s+(half|third|quarter|fifth|tenth)s?\s+of\b/i,
  /\b(half|majority|minority|bulk|most|plurality)\s+of\s+(the\s+)?(local\s+|area\s+|nearby\s+)?(residents|people|patients|population|providers|households|practices|adults|children|seniors|families|doctors|physicians)\b/i,
  new RegExp(`\\b(${CARDINAL}|\\d+)\\s+(in|out\\s+of)\\s+(${CARDINAL}|\\d+)\\b`, "i"),
  new RegExp(`\\b(${CARDINAL})\\s+(${COUNT_NOUN})\\b`, "i"),
  /\b(hundreds?|thousands?|millions?|billions?|dozens?)\b/i,
  /\b(percent|percentage|per\s?cent)\b/i,
  /\b(doubled|tripled|quadrupled|twice\s+as|three\s+times|ten\s?fold|several\s?fold)\b/i,
];
const FORBIDDEN = /(https?:|:\/\/|www\.|<|>|\]\(|javascript:|\b[a-z0-9-]+\.(gov|com|org|net|edu|io|us|info|health|co|ai|app)\b)/i;
const NON_ASCII_DIGIT = /(?![0-9])\p{Nd}/u;

/** Every number in a string with its unit markers (commas removed). */
export function numberTokens(text: string): Array<{ n: number; dollar: boolean; percent: boolean }> {
  const out: Array<{ n: number; dollar: boolean; percent: boolean }> = [];
  for (const m of text.matchAll(NUMBER)) {
    const n = Number(m[2].replace(/,/g, "").replace(/\.$/, ""));
    if (Number.isFinite(n)) out.push({ n, dollar: !!m[1], percent: !!m[3] });
  }
  return out;
}
export function numbersIn(text: string): number[] {
  return numberTokens(text).map((t) => t.n);
}

type Allowed = { n: number; unit: string };
const close = (a: number, b: number) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
function matches(n: number, a: number): boolean {
  return close(n, a) || close(n, Math.round(a)) || close(n, Math.round(a * 10) / 10);
}

/** Numbers a statement may use: only from the items it cites. */
export function allowedFor(refs: string[], bundle: FactsBundle): Allowed[] {
  const out: Allowed[] = [];
  for (const id of refs) {
    const f = bundle.facts.find((x) => x.id === id);
    if (f) {
      if (f.value !== null) out.push({ n: f.value, unit: f.unit });
      for (const n of numbersIn(f.display)) out.push({ n, unit: f.unit });
      if (f.moe !== null) out.push({ n: f.moe, unit: f.unit === "percent" ? "points" : f.unit });
      // Numbers that name the measure itself (e.g. "age 65 and over"), never the ZIP.
      for (const n of numbersIn(f.label.replace(/\b(ZCTA|ZIP)\s+\d{5}\b/g, ""))) out.push({ n, unit: "label" });
      continue;
    }
    const e = bundle.estimates.find((x) => x.id === id);
    if (e && e.value !== null) {
      out.push({ n: e.value, unit: "ratio" });
      // The formula's operands are the cited population and count.
      for (const n of numbersIn(e.formula.replace(/\b(ZCTA|ZIP)\s+\d{5}\b/g, ""))) out.push({ n, unit: "operand" });
    }
  }
  return out;
}

/** Strip exact echoes of visitor inputs (ZIP as an identifier, chosen labels). */
export function stripInputEchoes(text: string, bundle: FactsBundle, inputs: Record<string, unknown>): string {
  let t = text.replace(new RegExp(`\\b(ZIP(\\s+code)?|ZCTA)\\s+${bundle.zip}\\b`, "gi"), "$1");
  // Only multi-word labels (e.g. "Opening within 6 months"); a bare ZIP is echoed only as "ZIP 12345".
  const labels = Object.values(inputs).filter((v): v is string => typeof v === "string" && /\d/.test(v) && /[a-z]/i.test(v) && v.length > 3);
  for (const label of labels) t = t.replace(new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "");
  return t;
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
  const factIds = new Set(bundle.facts.filter((f) => f.value !== null).map((f) => f.id));
  const estimateIds = new Set(bundle.estimates.filter((e) => e.value !== null).map((e) => e.id));

  const checkText = (text: unknown, refs: string[], where: string) => {
    if (typeof text !== "string" || !text.trim() || text.length > 500) {
      reasons.push(`${where}:text`);
      return;
    }
    if (NON_ASCII_DIGIT.test(text)) reasons.push(`${where}:non_ascii_digit`);
    const norm = text.normalize("NFKC");
    if (FORBIDDEN.test(norm)) reasons.push(`${where}:forbidden`);
    if (QUANTITY_PATTERNS.some((re) => re.test(norm))) reasons.push(`${where}:quantity_phrase`);
    const allowed = allowedFor(refs, bundle);
    for (const tok of numberTokens(stripInputEchoes(norm, bundle, inputs))) {
      const hits = allowed.filter((a) => matches(tok.n, a.n));
      const ok = hits.some((a) => (!tok.percent || a.unit === "percent") && (!tok.dollar || a.unit === "usd"));
      if (!ok) reasons.push(`${where}:number:${tok.n}${tok.percent ? "%" : ""}`);
    }
  };

  const clean: Brief = { sections: [] };
  b.sections.forEach((s, i) => {
    if (!s || typeof s !== "object" || !Array.isArray(s.statements)) {
      reasons.push(`s${i}:structure`);
      return;
    }
    checkText(s.heading, [], `s${i}:heading`);
    if (typeof s.heading === "string" && s.heading.length > 90) reasons.push(`s${i}:heading_length`);
    if (s.statements.length < 1 || s.statements.length > 6) reasons.push(`s${i}:statement_count`);
    const statements: Statement[] = [];
    s.statements.forEach((st, j) => {
      const where = `s${i}.${j}`;
      if (!st || typeof st !== "object") {
        reasons.push(`${where}:structure`);
        return;
      }
      const refs = Array.isArray(st.refs) && st.refs.every((r) => typeof r === "string") ? st.refs : null;
      if (!refs) {
        reasons.push(`${where}:refs`);
        return;
      }
      if (refs.some((r) => !factIds.has(r) && !estimateIds.has(r))) reasons.push(`${where}:ref_unknown`);
      if (!["fact", "estimate", "interpretation"].includes(st.kind)) reasons.push(`${where}:kind`);
      if (st.kind === "fact" && (!refs.length || refs.some((r) => !factIds.has(r)))) reasons.push(`${where}:fact_refs`);
      if (st.kind === "estimate" && !refs.some((r) => estimateIds.has(r))) reasons.push(`${where}:estimate_refs`);
      // Interpretations cite nothing numeric: digits only as input echoes.
      checkText(st.text, st.kind === "interpretation" ? [] : refs, where);
      statements.push({ text: String(st.text ?? ""), kind: st.kind, refs: [...refs] });
    });
    clean.sections.push({ heading: String(s.heading ?? ""), statements });
  });
  return reasons.length ? { ok: false, reasons } : { ok: true, brief: clean };
}
