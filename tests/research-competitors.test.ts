import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCompetitors, competitorUrl, researchCompetitors } from '../src/lib/research/competitors.ts';
import { buildFacts, type Cache } from '../src/lib/research/facts.ts';
import { PROFILE } from './fixtures/brief.ts';
import { URBAN_ACS, jsonResponse, nppesBody } from './fixtures/research.ts';
const NOW = new Date('2026-10-15T12:00:00Z');
const rows = { web: { results: [
  { title: '<b>Example Practice</b>', url: 'https://practice.example.org/services', description: '<b>Orthopedics</b> in New York.' },
  { title: 'Duplicate', url: 'https://practice.example.org/about' },
  { title: 'Directory', url: 'https://www.healthgrades.com/example' },
  { title: 'Unsafe', url: 'javascript:alert(1)' },
  { title: 'Local', url: 'https://127.0.0.1/data' },
] } };
const facts = () => buildFacts(PROFILE, { fetcher: async (url) => jsonResponse(url.includes('census') ? URBAN_ACS : nppesBody([])), now: NOW });
test('competitor results strip markup, deduplicate domains, exclude known directories and unsafe URLs', () => {
  assert.deepEqual(parseCompetitors(rows), [{ title: 'Example Practice', url: 'https://practice.example.org/services', description: 'Orthopedics in New York.' }]);
  for (const url of ['https://user:pass@host.com','http://example.com','https://[::1]','https://x.internal','https://host.com:8443','data:text/html,foo']) assert.equal(competitorUrl(url), null);
});
test('search sends only the market query and header credential, caches results with original retrieval date', async () => {
  const f = await facts();
  const stored = new Map<string,string>();
  const cache: Cache = { get: async (k) => stored.get(k) ?? null, put: async (k,v) => { stored.set(k,v); } };
  let calls = 0, reservations = 0;
  const deps = { apiKey: 'test-private-key', cache, now: NOW, reserve: async () => { reservations++; return true; }, fetcher: async (input: string, init?: RequestInit) => {
    calls++;
    const u = new URL(input);
    assert.equal(u.origin, 'https://api.search.brave.com');
    assert.ok(u.searchParams.get('q')?.includes('10016'));
    assert.equal(u.searchParams.get('count'), '10');
    assert.equal(init?.redirect, 'error');
    assert.equal(new Headers(init?.headers).get('X-Subscription-Token'), 'test-private-key');
    assert.doesNotMatch(input, /test-private-key|@|email/);
    return jsonResponse(rows);
  } };
  const r = await researchCompetitors(f, deps);
  assert.equal(r.status, 'ok');
  const again = await researchCompetitors(f, {...deps, now: new Date('2026-10-16')});
  assert.equal(again.retrieved, NOW.toISOString());
  assert.equal(calls, 1); assert.equal(reservations, 1);
});
test('missing key and exhausted budget do not call Brave; outages and malformed/empty results are honest', async () => {
  const f = await facts(); let calls = 0;
  const deps = { now: NOW, reserve: async () => true, fetcher: async () => { calls++; return jsonResponse(rows); } };
  assert.equal((await researchCompetitors(f, deps)).status, 'unavailable');
  assert.equal((await researchCompetitors(f, {...deps, apiKey:'key', reserve:async()=>false})).status,'unavailable');
  assert.equal(calls,0);
  for (const fetcher of [async()=>jsonResponse({},429),async()=>jsonResponse({}),async()=>{throw new Error('timeout');}]) {
    assert.equal((await researchCompetitors(f,{...deps,apiKey:'key',fetcher})).status,'unavailable');
  }
  assert.equal((await researchCompetitors(f,{...deps,apiKey:'key',fetcher:async()=>jsonResponse({web:{results:[]}})})).status,'empty');
});
