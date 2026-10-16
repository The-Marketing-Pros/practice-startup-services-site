import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { deliverReport, reportBytes } from '../src/lib/research/delivery.ts';
import { createD1 } from './helpers/d1.ts';
import { buildFacts } from '../src/lib/research/facts.ts';
import { stubFetch, jsonResponse, URBAN_ACS, nppesBody } from './fixtures/research.ts';
import { PROFILE } from './fixtures/brief.ts';
const now = () => new Date('2026-10-16T12:00:00Z');
async function setup(opts: {owner?:string, fail?:string, fault?:string} = {}) {
  const {d1,sqlite} = createD1({faults:opts.fault ? [{match:new RegExp(opts.fault),error:'database failure'}]:[]});
  let failures = 0;
  const api = stubFetch([{match:/./,respond:(url,init) => {
    if(opts.fail && url.includes(opts.fail) && ++failures===1) throw new Error('network_failure');
    if(url.includes('/owners/')) return jsonResponse({id:'31',userId:7});
    if(url.includes('/contacts/')) return jsonResponse({id:'11',properties:{hubspot_owner_id:opts.owner ?? '31'}});
    if(url.includes('/files/')) return jsonResponse({id:'21',access:'PRIVATE'});
    if(url.includes('/notes')) return jsonResponse({id:'41'});
    if(url.includes('/tasks')) return jsonResponse({id:'51'});
    throw new Error('unexpected');
  }}]);
  const upstream = stubFetch([{match:/census/,respond:()=>jsonResponse(URBAN_ACS)},{match:/npiregistry/,respond:()=>jsonResponse(nppesBody([]))}]);
  const facts=await buildFacts(PROFILE,{fetcher:upstream.fetcher,censusKey:'test',now:now()});
  const result={reference:'PSS-11111111',generatedAt:now().toISOString(),facts,brief:null,briefStatus:'capacity'};
  const input={db:d1,env:{HUBSPOT_PRIVATE_APP_TOKEN:'test-secret',HUBSPOT_RESEARCH_FALLBACK_OWNER_ID:'32'},fetcher:api.fetcher,jobId:'11111111-1111-4111-8111-111111111111',email:'founder@example.com',result,now,render:async()=>new TextEncoder().encode('%PDF-fixture').buffer};
  return {input,api,sqlite,result};
}
test('uploads PRIVATE PDF, associates note/contact and schedules owner reminder only once',async()=>{
 const s=await setup(); await deliverReport(s.input); await deliverReport(s.input);
 const writes=s.api.calls.filter(c=>c.init?.method==='POST'); assert.equal(writes.length,3);
 const form=writes[0].init!.body as FormData;
 assert.equal(JSON.parse(String(form.get('options'))).access,'PRIVATE');
 assert.equal((form.get('file') as Blob).type,'application/pdf');
 const note=JSON.parse(String(writes[1].init!.body));
 assert.equal(note.properties.hs_attachment_ids,'21');assert.equal(note.associations[0].to.id,'11');
 assert.match(note.properties.hs_note_body,/Incomplete AI brief/);
 const task=JSON.parse(String(writes[2].init!.body));
 assert.equal(task.properties.hubspot_owner_id,'31');assert.ok(Number(task.properties.hs_task_reminders)>now().getTime());
 assert.equal(task.associations[0].types[0].associationTypeId,204);
 assert.ok(!JSON.stringify(s.sqlite.prepare('SELECT * FROM research_deliveries').all()).includes('founder@example.com'));
});
test('unowned contacts route task to configured fallback without changing contact ownership',async()=>{
 const s=await setup({owner:''}); await deliverReport(s.input);
 const task=s.api.calls.find(c=>c.url.endsWith('/tasks'))!;
 assert.equal(JSON.parse(String(task.init!.body)).properties.hubspot_owner_id,'32');
 assert.equal(s.api.calls.filter(c=>c.init?.method==='PATCH').length,0);
});
test('missing owner fails before uploading any report',async()=>{
 const s=await setup({owner:''});s.input.env.HUBSPOT_RESEARCH_FALLBACK_OWNER_ID='';
 await assert.rejects(deliverReport(s.input));assert.equal(s.api.calls.filter(c=>c.init?.method==='POST').length,0);
});
test('ambiguous file, note and task writes never repeat; acknowledged earlier steps persist',async()=>{
 for(const step of ['/files/','/notes','/tasks']) {
  const s=await setup({fail:step});
  await assert.rejects(deliverReport(s.input));await assert.rejects(deliverReport(s.input),/reconciliation/);
  assert.equal(s.api.calls.filter(c=>c.url.includes(step)&&c.init?.method==='POST').length,1);
  const row=s.sqlite.prepare('SELECT * FROM research_deliveries').get() as any;
  assert.ok(row.attempted_step); if(step!='/files/')assert.equal(row.file_id,'21');
 }
});
test('contact propagation errors can retry without duplicate external writes',async()=>{
 const s=await setup({fail:'/contacts/'});await assert.rejects(deliverReport(s.input));await deliverReport(s.input);
 assert.equal(s.api.calls.filter(c=>c.init?.method==='POST').length,3);
});
test('write-ahead database failure prevents any upload',async()=>{
 const s=await setup({fault:'SET attempted_step'});await assert.rejects(deliverReport(s.input));
 assert.equal(s.api.calls.filter(c=>c.init?.method==='POST').length,0);
});
test('server PDF renderer uses bundled public font bytes without a browser',async()=>{
 const s=await setup();
 const bytes=await reportBytes(s.result,async url=>{
   const name=new URL(url).pathname.split('/').pop();
   return new Response(await readFile(new URL(`../public/fonts/${name}`,import.meta.url)));
 });
 assert.equal(new TextDecoder().decode(bytes.slice(0,5)),'%PDF-');assert.ok(bytes.byteLength>10000);
});
test('concurrent requests cannot produce duplicate file/note/task writes',async()=>{
 const s=await setup();
 const results=await Promise.allSettled([deliverReport(s.input),deliverReport(s.input)]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.equal(s.api.calls.filter(c=>c.init?.method==='POST').length,3);
});
test('lost acknowledgement after successful upload is not uploaded again',async()=>{
 const s=await setup({fault:'SET file_id'});
 await assert.rejects(deliverReport(s.input));await assert.rejects(deliverReport(s.input),/reconciliation/);
 assert.equal(s.api.calls.filter(c=>c.url.includes('/files/')&&c.init?.method==='POST').length,1);
});
