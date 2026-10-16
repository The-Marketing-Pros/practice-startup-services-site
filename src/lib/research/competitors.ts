// Search evidence is rendered directly, never promoted to verified market facts
// or passed into the numeric AI brief. Only specialty/location reach Brave.
import type { FactsBundle, Fetcher, Cache } from './facts.ts';
export type Competitor = { title: string; url: string; description: string };
export type CompetitorResearch = {
  status: 'ok' | 'empty' | 'unavailable';
  query: string;
  retrieved: string;
  items: Competitor[];
};
export const COMPETITOR_NOTE = 'Search results identify potential competitors to investigate, not a verified or exhaustive market census. Confirm each practice’s location, services and current operations. Directory listings and search snippets may be incomplete or outdated.';
export function competitorNote(r: CompetitorResearch): string {
  if (r.status === 'unavailable') return 'Competitor research is unavailable for this report. Your other research and planning sections are still included.';
  if (r.status === 'empty') return 'No usable competitor websites were returned for this search. This does not mean there are no competitors.';
  return COMPETITOR_NOTE;
}
export function competitorUrl(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length > 2048) return null;
  try {
    const u = new URL(raw);
    const h = u.hostname.toLowerCase();
    if (u.protocol !== 'https:' || u.username || u.password || u.port || !h.includes('.') || /[\[\]:]/.test(h) || /^[\d.]+$/.test(h) || /(^|\.)(localhost|local|internal|test|invalid)$/.test(h)) return null;
    u.hash = '';
    return u.href;
  } catch { return null; }
}
const DIRECTORIES = ['healthgrades.com','zocdoc.com','vitals.com','webmd.com','yelp.com','yellowpages.com','npiprofile.com','npidb.org','facebook.com','linkedin.com','instagram.com'];
const plain = (value: unknown, max: number) => typeof value === 'string' ? value.replace(/<[^>]*>/g, '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '';
export function parseCompetitors(raw: unknown): Competitor[] {
  const results = (raw as { web?: { results?: unknown } } | null)?.web?.results;
  if (!Array.isArray(results)) throw new Error('invalid_search_response');
  const domains = new Set<string>();
  const items: Competitor[] = [];
  for (const row of results.slice(0, 20)) {
    if (!row || typeof row !== 'object') continue;
    const url = competitorUrl(row.url);
    const title = plain(row.title, 180);
    if (!url || !title) continue;
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (domains.has(host) || DIRECTORIES.some((d) => host === d || host.endsWith('.' + d))) continue;
    domains.add(host);
    items.push({ title, url, description: plain(row.description, 420) });
    if (items.length === 5) break;
  }
  return items;
}
export async function researchCompetitors(facts: FactsBundle, deps: {
  fetcher: Fetcher; apiKey?: string; cache?: Cache; now: Date;
  reserve: () => Promise<boolean>; log?: (event: string, detail: Record<string, unknown>) => void;
}): Promise<CompetitorResearch> {
  const query = `${facts.labels.specialty} medical practices clinics near ${facts.zip} ${facts.labels.city} ${facts.labels.state}`.replace(/\s+/g, ' ').trim().slice(0, 500);
  const unavailable: CompetitorResearch = { status: 'unavailable', query, retrieved: '', items: [] };
  if (!deps.apiKey) return unavailable;
  const cacheKey = `competitors:v1:${query}`;
  try {
    const cached = await deps.cache?.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached) as CompetitorResearch;
      if (data.query === query && ['ok', 'empty'].includes(data.status) && typeof data.retrieved === 'string' && Array.isArray(data.items)) {
        // Re-validate links/text even for persisted provider responses.
        const items = parseCompetitors({ web: { results: data.items } });
        return { status: items.length ? 'ok' : 'empty', query, retrieved: data.retrieved, items };
      }
    }
  } catch { /* Cache failure is not a license to bypass the search budget. */ }
  try {
    if (!await deps.reserve()) return unavailable;
    const u = new URL('https://api.search.brave.com/res/v1/web/search');
    u.search = new URLSearchParams({ q: query, country: 'US', search_lang: 'en', count: '10', safesearch: 'moderate', text_decorations: 'false' }).toString();
    const response = await deps.fetcher(u.href, { headers: { Accept: 'application/json', 'X-Subscription-Token': deps.apiKey }, redirect: 'manual', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('search_http_error');
    const items = parseCompetitors(await response.json());
    const result: CompetitorResearch = { status: items.length ? 'ok' : 'empty', query, retrieved: deps.now.toISOString(), items };
    await deps.cache?.put(cacheKey, JSON.stringify(result), 86400).catch(() => {});
    return result;
  } catch {
    deps.log?.('competitor_search_unavailable', {});
    return unavailable;
  }
}
