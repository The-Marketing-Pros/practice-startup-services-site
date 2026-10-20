import { parseChecklist, type Checklist } from "./checklist.ts";
import { parseFinance, type FinancePlan } from "./finance.ts";

export const HANDOFF_VERSION = "pss-launch-2026-10-20";
export const MAX_HANDOFF_BYTES = 2_000_000;
export const CHECKLIST_KEY = "pps-startup-checklist-v1";
export const FINANCE_KEY = "pps-startup-proforma-v1";
export const SOURCE_KEY = "pps-practiceelf-source-v1";
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type Handoff = {
  version: typeof HANDOFF_VERSION;
  sourceId: string;
  checklist: Checklist | null;
  finance: FinancePlan | null;
};
export function parseHandoff(raw: unknown): Handoff {
  const p = raw as Handoff;
  if (!p || p.version !== HANDOFF_VERSION || !UUID.test(p.sourceId)
    || (!p.checklist && !p.finance)) throw Error("Choose a supported plan to save.");
  if (new TextEncoder().encode(JSON.stringify(raw)).length > MAX_HANDOFF_BYTES)
    throw Error("This plan is too large to transfer. Keep your backup and contact PPS.");
  return { version: HANDOFF_VERSION, sourceId: p.sourceId,
    checklist: p.checklist ? parseChecklist(p.checklist) : null,
    finance: p.finance ? parseFinance(p.finance) : null };
}

/** Read the other saved tool, but use the CURRENT page's in-memory model.
 * A failed browser save must never silently hand over older assumptions. */
export function collectHandoff(storage: Pick<Storage, "getItem" | "setItem">,
  current?: Checklist | FinancePlan): Handoff {
  let sourceId = storage.getItem(SOURCE_KEY);
  if (!sourceId || !UUID.test(sourceId)) {
    sourceId = crypto.randomUUID();
    storage.setItem(SOURCE_KEY, sourceId);
  }
  const read = (key: string) => {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  };
  return parseHandoff({
    version: HANDOFF_VERSION, sourceId,
    checklist: current?.kind === "checklist" ? current : read(CHECKLIST_KEY),
    finance: current?.kind === "proforma" ? current : read(FINANCE_KEY),
  });
}
