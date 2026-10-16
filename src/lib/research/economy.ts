// National economic context, kept separate from ZIP facts and AI grounding.
// Fixed public-domain FRED series only; no visitor inputs reach FRED.
import type { Cache, Fetcher } from './facts.ts';

export const ECONOMY_NOTE = 'U.S. indicators provide national context. They do not measure conditions in your ZIP, patient demand, local rents or the viability of a practice. Release dates differ and historical figures may be revised.';
export const FRED_NOTICE = 'This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis.';
export const FRED_TERMS = 'https://fred.stlouisfed.org/docs/api/terms_of_use.html';
export const ECONOMIC_SERIES = [
  { id: 'UNRATE', label: 'Unemployment rate', source: 'U.S. Bureau of Labor Statistics', unit: 'percent', note: 'Share of the civilian labor force that is unemployed. Monthly, seasonally adjusted.' },
  { id: 'CPIAUCNS', label: 'Consumer inflation', source: 'U.S. Bureau of Labor Statistics', unit: 'inflation', note: 'All-items CPI-U, U.S. city average, not seasonally adjusted. Calculated as (index / index for the same month a year earlier - 1) x 100.' },
  { id: 'HOUST', label: 'Housing starts', source: 'U.S. Census Bureau and U.S. Department of Housing and Urban Development', unit: 'housing', note: 'New privately owned housing units started. Monthly, seasonally adjusted annual rate; not the number built during that month.' },
  { id: 'PERMIT', label: 'Housing permits', source: 'U.S. Census Bureau and U.S. Department of Housing and Urban Development', unit: 'housing', note: 'New privately owned housing units authorized in permit-issuing places. Monthly, seasonally adjusted annual rate; permits may not become completed homes.' },
] as const;
type Series = typeof ECONOMIC_SERIES[number];
export type Observation = { date: string; value: number };
export type EconomicIndicator = {
  id: string; label: string; source: string; url: string; note: string;
  value: number | null; display: string; period: string; comparison: string; retrieved: string; stale: boolean;
};
export type Economy = { status: 'ok' | 'partial' | 'unavailable'; items: EconomicIndicator[] };

export function parseObservations(body: unknown, today: string): Observation[] {
  const rows = (body as { observations?: unknown } | null)?.observations;
  if (!Array.isArray(rows)) throw new Error('invalid_observations');
  const seen = new Set<string>();
  const out: Observation[] = [];
  for (const row of rows.slice(0, 36)) {
    if (!row || typeof row !== 'object') continue;
    const { date, value } = row;
    if (typeof date !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])-01$/.test(date) || date > today || seen.has(date)) continue;
    if (typeof value !== 'string' || !/^\d+(\.\d+)?$/.test(value.trim())) continue;
    const n = Number(value);
    if (!Number.isFinite(n)) continue;
    seen.add(date);
    out.push({ date, value: n });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}
function shiftMonth(date: string, months: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}
export function economicPeriod(date: string): string {
  return date ? new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'No observation available';
}
const signed = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(1)}`;
export function economicIndicator(series: Series, observations: Observation[], retrieved: string, now: Date): EconomicIndicator {
  const result: EconomicIndicator = { id: series.id, label: series.label, source: series.source, url: `https://fred.stlouisfed.org/series/${series.id}`, note: series.note, value: null, display: 'Temporarily unavailable', period: '', comparison: '', retrieved, stale: false };
  const latest = observations[0];
  if (!latest) return result;
  const at = (date: string) => observations.find((x) => x.date === date)?.value;
  const inflationAt = (date: string) => {
    const a = at(date), b = at(shiftMonth(date, -12));
    return a !== undefined && b !== undefined && b > 0 ? (a / b - 1) * 100 : null;
  };
  const value = series.unit === 'inflation' ? inflationAt(latest.date) : latest.value;
  if (value === null || !Number.isFinite(value) || (series.id === 'UNRATE' && value > 100)) return result;
  result.value = value;
  result.period = latest.date;
  result.stale = now.getTime() - Date.parse(latest.date) > 120 * 86400000;
  result.display = series.unit === 'housing' ? `${Math.round(value * 1000).toLocaleString('en-US')} units / year` : `${value.toFixed(1)}%${series.unit === 'inflation' ? ' year over year' : ''}`;
  const priorDate = shiftMonth(latest.date, -1);
  const prior = series.unit === 'inflation' ? inflationAt(priorDate) : at(priorDate);
  if (prior !== null && prior !== undefined) {
    if (series.unit === 'housing' && prior > 0) result.comparison = `${signed((value / prior - 1) * 100)}% vs. ${economicPeriod(priorDate)}`;
    else if (series.unit !== 'housing') result.comparison = `${signed(value - prior)} percentage points vs. ${economicPeriod(priorDate)}`;
  }
  return result;
}

export async function fetchEconomy(deps: { fetcher: Fetcher; apiKey?: string; cache?: Cache; now: Date; log?: (event: string, detail: Record<string, unknown>) => void }): Promise<Economy> {
  const key = deps.apiKey?.trim();
  const items = await Promise.all(ECONOMIC_SERIES.map(async (series) => {
    const unavailable = () => economicIndicator(series, [], '', deps.now);
    if (!key) return unavailable();
    const cacheKey = `fred:v1:${series.id}`;
    const today = deps.now.toISOString().slice(0, 10);
    try {
      const hit = await deps.cache?.get(cacheKey);
      if (hit) {
        const stored = JSON.parse(hit);
        const retrieved = Date.parse(stored.retrieved);
        if (Number.isFinite(retrieved) && retrieved <= deps.now.getTime() && deps.now.getTime() - retrieved < 6 * 3600000) {
          const parsed = parseObservations(stored.body, today);
          const item = economicIndicator(series, parsed, stored.retrieved, deps.now);
          if (item.value !== null) return item;
        }
      }
    } catch { /* Malformed/missing cache: query the public source. */ }
    try {
      const params = new URLSearchParams({ series_id: series.id, api_key: key, file_type: 'json', sort_order: 'desc', limit: '36', observation_end: today });
      const response = await deps.fetcher(`https://api.stlouisfed.org/fred/series/observations?${params}`, { redirect: 'error', signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('fred_unavailable');
      const body = await response.json();
      const observations = parseObservations(body, today);
      const retrieved = deps.now.toISOString();
      const item = economicIndicator(series, observations, retrieved, deps.now);
      if (item.value === null) throw new Error('fred_no_data');
      // Persist only validated public observations, never response metadata or request URLs.
      const cleanBody = { observations: observations.map((x) => ({ date: x.date, value: String(x.value) })) };
      await deps.cache?.put(cacheKey, JSON.stringify({ body: cleanBody, retrieved }), 6 * 3600).catch(() => {});
      return item;
    } catch {
      deps.log?.('fred_unavailable', { series: series.id });
      return unavailable();
    }
  }));
  const available = items.filter((x) => x.value !== null).length;
  return { status: available === items.length ? 'ok' : available ? 'partial' : 'unavailable', items };
}
