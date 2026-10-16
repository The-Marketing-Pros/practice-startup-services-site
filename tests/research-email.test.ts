import test from 'node:test';
import assert from 'node:assert/strict';
import {emailReport} from '../src/lib/research/email-delivery.ts';
import {createD1} from './helpers/d1.ts';
import {buildFacts} from '../src/lib/research/facts.ts';
import {stubFetch,jsonResponse,URBAN_ACS,nppesBody} from './fixtures/research.ts';
import {PROFILE} from './fixtures/brief.ts';
import mailer from '../workers/report-mailer/index.ts';
const now=()=>new Date('2026-10-16T12:00:00Z');
async function setup(fault?:string) {
 const {d1,sqlite}=createD1({faults:fault?[{match:new RegExp(fault),error:'failure'}]:[]});
 const upstream=stubFetch([{match:/census/,respond:()=>jsonResponse(URBAN_ACS)},{match:/npiregistry/,respond:()=>jsonResponse(nppesBody([]))}]);
 const facts=await buildFacts(PROFILE,{fetcher:upstream.fetcher,censusKey:'test',now:now()});
 const calls:FormData[]=[];
 const binding={fetch:async(_url:unknown,init?:RequestInit)=>{calls.push(init!.body as FormData);return jsonResponse({ok:true,messageId:'message-1'});}};
 const input={db:d1,mailer:binding,fetcher:upstream.fetcher,jobId:'11111111-1111-4111-8111-111111111111',email:'founder@example.com',contact:{firstName:'Morgan',lastName:'Example',practiceName:'Example & Partners'},result:{reference:'PSS-11111111',generatedAt:now().toISOString(),facts,brief:null,briefStatus:'capacity'},now,render:async()=>new TextEncoder().encode('%PDF-fixture').buffer};
 return {input,sqlite,calls};
}
test('email includes named prospect, practice, request and real PDF; replay sends once',async()=>{
 const s=await setup();await emailReport(s.input);await emailReport(s.input);
 assert.equal(s.calls.length,1);assert.match(String(s.calls[0].get('text')),/Morgan Example/);assert.match(String(s.calls[0].get('text')),/founder@example.com/);
 assert.match(String(s.calls[0].get('html')),/Example &amp; Partners/);assert.match(String(s.calls[0].get('subject')),/partial/);
 assert.equal(await (s.calls[0].get('file') as Blob).text(),'%PDF-fixture');
 const ledger=JSON.stringify(s.sqlite.prepare('SELECT * FROM research_email_deliveries').all());assert.ok(!ledger.includes('Morgan'));assert.ok(!ledger.includes('founder@example.com'));
});
test('concurrent delivery has one sender; failed marker prevents send',async()=>{
 const s=await setup();const r=await Promise.allSettled([emailReport(s.input),emailReport(s.input)]);assert.equal(r.filter(x=>x.status==='fulfilled').length,1);assert.equal(s.calls.length,1);
 const f=await setup('SET attempted_step');await assert.rejects(emailReport(f.input));assert.equal(f.calls.length,0);
});
test('ambiguous email timeout and lost acknowledgement never send again',async()=>{
 const s=await setup();let count=0;s.input.mailer.fetch=async()=>{count++;throw new Error('timeout');};
 await assert.rejects(emailReport(s.input));await assert.rejects(emailReport(s.input),/reconciliation/);assert.equal(count,1);
 const f=await setup('SET email_id');await assert.rejects(emailReport(f.input));await assert.rejects(emailReport(f.input),/reconciliation/);assert.equal(f.calls.length,1);
});
test('PDF failure sends one action-needed notice; recovered renderer later sends PDF',async()=>{
 const s=await setup();const render=s.input.render;s.input.render=async()=>{throw new Error('font failed');};
 await assert.rejects(emailReport(s.input));await assert.rejects(emailReport(s.input));assert.equal(s.calls.length,1);assert.equal(s.calls[0].get('file'),null);assert.match(String(s.calls[0].get('subject')),/Action needed/);
 s.input.render=render;await emailReport(s.input);assert.equal(s.calls.length,2);assert.ok(s.calls[1].get('file'));
});
test('private relay fixes recipient and sender, preserves PDF binary and refuses malformed requests',async()=>{
 const s=await setup();await emailReport(s.input);let sent:any;
 const env={EMAIL:{send:async(message:unknown)=>{sent=message;return {messageId:'sent-id'};}},REPORT_FROM:'startup@reports.practicestartupservices.com',REPORT_TO:'issah@drcred.com'} as ReportMailerEnv;
 const form=s.calls[0];form.set('to','attacker@example.org');
 const r=await mailer.fetch(new Request('https://report-mailer/send',{method:'POST',body:form}),env);assert.equal(r.status,200);assert.equal(sent.to,'issah@drcred.com');assert.equal(sent.from.email,env.REPORT_FROM);assert.equal(new TextDecoder().decode(sent.attachments[0].content),'%PDF-fixture');
 assert.equal((await mailer.fetch(new Request('https://report-mailer/send'),env)).status,404);
 form.set('subject','header\ninjection');assert.equal((await mailer.fetch(new Request('https://report-mailer/send',{method:'POST',body:form}),env)).status,400);
 form.set('subject','report');form.set('file',new Blob(['not PDF'],{type:'application/pdf'}),'report.pdf');assert.equal((await mailer.fetch(new Request('https://report-mailer/send',{method:'POST',body:form}),env)).status,400);
});
