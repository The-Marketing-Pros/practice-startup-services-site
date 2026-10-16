import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchEconomy, parseObservations, economicIndicator, ECONOMIC_SERIES } from '../src/lib/research/economy.ts';
import { buildFacts, type Cache } from '../src/lib/research/facts.ts';
import { jsonResponse, URBAN_ACS, nppesBody } from './fixtures/research.ts';
const NOW = new Date('2026-10-16T01:00:00Z');
const observations = [
  { date: '2026-09-01', value: '330' }, { date: '2026-08-01', value: '324' },
  { date: '2025-09-01', value: '300' }, { date: '2025-08-01', value: '300' },
];
const body = { observations };
const forUrl = (url: string) => new URL(url).searchParams.get("series_id") === "UNRATE" ? {observations: [{date:"2026-09-01",value:"4.2"}]} : body;

test('FRED rejects missing, blank, nonnumeric, invalid and future monthly observations without inventing zeroes', () => {
  assert.deepEqual(parseObservations({ observations: [
    {date:'2026-10-01',value:'.'}, {date:'2026-09-01',value:' '},
    {date:'2026-08-01',value:null}, {date:'2026-07-01',value:'Infinity'},
    {date:'2026-13-01',value:'5'}, {date:'2026-07-32',value:'5'},
    {date:'2027-01-01',value:'5'}, {date:'2026-06-01',value:'4.2'},
    {date:'2026-06-01',value:'4.3'}, {date:'2026-05-01',value:'0'},
  ] }, '2026-10-16'), [{date:'2026-06-01',value:4.2},{date:'2026-05-01',value:0}]);
  assert.throws(()=>parseObservations({ error:'bad key' }, '2026-10-16'));
});

test('inflation uses the exact year-earlier month; rate changes use percentage points', () => {
  const item = economicIndicator(ECONOMIC_SERIES[1], parseObservations(body,'2026-10-16'), NOW.toISOString(), NOW);
  assert.equal(item.display, '10.0% year over year');
  assert.equal(item.comparison, '+2.0 percentage points vs. Aug 2026');
  const gap = economicIndicator(ECONOMIC_SERIES[1], parseObservations({observations:observations.filter(x=>x.date!=='2025-09-01')},'2026-10-16'),NOW.toISOString(),NOW);
  assert.equal(gap.value,null, 'never substitute a different month for the year-earlier denominator');
  const zero = economicIndicator(ECONOMIC_SERIES[1], [{date:'2026-09-01',value:330},{date:'2025-09-01',value:0}],NOW.toISOString(),NOW);
  assert.equal(zero.value,null);
});

test('housing levels convert thousands to units and remain annualized; comparisons require the previous calendar month', () => {
  const item = economicIndicator(ECONOMIC_SERIES[2], [{date:'2026-09-01',value:1500},{date:'2026-08-01',value:1200}],NOW.toISOString(),NOW);
  assert.equal(item.display,'1,500,000 units / year');
  assert.equal(item.comparison,'+25.0% vs. Aug 2026');
  assert.match(item.note,/annual rate/);
  const gap = economicIndicator(ECONOMIC_SERIES[0], [{date:'2026-09-01',value:4.2},{date:'2026-07-01',value:4.1}],NOW.toISOString(),NOW);
  assert.equal(gap.comparison,'');
  const old = economicIndicator(ECONOMIC_SERIES[0], [{date:'2025-09-01',value:4.2}],NOW.toISOString(),NOW);
  assert.equal(old.stale,true);
});

test('FRED series fail independently and logs/responses cannot leak the API key or provider error', async () => {
  const logs: unknown[]=[];
  const result = await fetchEconomy({now:NOW,apiKey:'sensitive-key',log:(e,d)=>logs.push({e,d}),fetcher:async (url,init)=>{
    const u=new URL(url);
    assert.equal(u.hostname,'api.stlouisfed.org');
    assert.equal(u.searchParams.get('api_key'),'sensitive-key');
    assert.equal(init?.redirect,'error');
    if(u.searchParams.get('series_id')==='CPIAUCNS') throw new Error(url);
    return jsonResponse({observations:[{date:'2026-09-01',value:'4.2'}]});
  }});
  assert.equal(result.status,'partial');
  assert.equal(result.items[1].value,null);
  assert.equal(result.items[0].value,4.2);
  assert.doesNotMatch(JSON.stringify({result,logs}),/sensitive-key|api_key/);
  assert.deepEqual(logs,[{e:'fred_unavailable',d:{series:'CPIAUCNS'}}]);
});

test('successful national observations share a six-hour cache, retain original retrieval dates, and expire', async () => {
  const store=new Map<string,string>();let calls=0;
  const cache:Cache={get:async k=>store.get(k)??null,put:async(k,v,ttl)=>{assert.equal(ttl,21600);store.set(k,v);}};
  const fetcher=async(url:string)=>{calls++;return jsonResponse(forUrl(url));};
  const first=await fetchEconomy({fetcher,cache,now:NOW,apiKey:'test'});
  const second=await fetchEconomy({fetcher,cache,now:new Date(NOW.getTime()+3600000),apiKey:'test'});
  assert.equal(calls,4);assert.deepEqual(second,first);
  assert.equal(second.items[0].retrieved,NOW.toISOString());
  await fetchEconomy({fetcher,cache,now:new Date(NOW.getTime()+7*3600000),apiKey:'test'});
  assert.equal(calls,8);
  const disabled=await fetchEconomy({fetcher,cache,now:NOW});
  assert.equal(disabled.status,'unavailable');assert.equal(calls,8);
});

test('failed requests and malformed caches recover without caching secret-bearing metadata', async()=>{
  const store=new Map<string,string>([['fred:v1:UNRATE','invalid-json']]);let fail=true;
  const cache:Cache={get:async k=>store.get(k)??null,put:async(k,v)=>{store.set(k,v);}};
  const fetcher=async(url:string)=>fail?jsonResponse({error_message:'secret'},403):jsonResponse({...forUrl(url),api_key:'secret'});
  assert.equal((await fetchEconomy({fetcher,cache,now:NOW,apiKey:'secret'})).status,'unavailable');
  fail=false;
  assert.equal((await fetchEconomy({fetcher,cache,now:NOW,apiKey:'secret'})).status,'ok');
  assert.doesNotMatch(JSON.stringify([...store]),/secret|api_key/);
});

test('economic context survives Census and NPPES outages and stays out of ZIP facts and AI grounding',async()=>{
  const fetcher=async(url:string)=>url.includes('stlouisfed.org')?jsonResponse(forUrl(url)):jsonResponse({},503);
  const profile={provider:'physician',specialty:'primary-care',zip:'10016',model:'solo',setting:'office',payer:'insurance',mix:'commercial',stage:'planning'};
  const f=await buildFacts(profile,{fetcher,now:NOW,fredKey:'test'});
  assert.equal(f.economy?.status,'ok');assert.equal(f.sections.acs.status,'error');
  assert.equal(f.facts.length,0);
  const {groundingView}=await import('../src/lib/research/guard.ts');
  assert.doesNotMatch(JSON.stringify(groundingView(f)),/UNRATE|CPIAUCNS|HOUST|PERMIT/);
  const healthy=await buildFacts(profile,{fetcher:async url=>url.includes('census.gov')?jsonResponse(URBAN_ACS):url.includes('npiregistry')?jsonResponse(nppesBody([])):jsonResponse({},500),now:NOW,fredKey:'test'});
  assert.equal(healthy.sections.acs.status,'ok');assert.equal(healthy.economy?.status,'unavailable');
});
