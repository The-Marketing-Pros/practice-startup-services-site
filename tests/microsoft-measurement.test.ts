import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { trackLead, trackOpenAILead, trackToolDownload, trackConsultationBooked } from '../src/lib/measure.ts';
import { captureAttribution, attributionPayload } from '../src/lib/attribution.ts';
const script = readFileSync(new URL('../src/components/MicrosoftPixel.astro', import.meta.url), 'utf8').split('<script is:inline>')[1].split('</script>')[0];
function storage() { const m = new Map<string,string>(); return {getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>void m.set(k,v),removeItem:(k:string)=>void m.delete(k)}; }
test('UET only loads once on PSS production and preserves queued successes', () => {
  for (const hostname of ['practicestartupservices.com','www.practicestartupservices.com','localhost','practice-startup-services.pages.dev','practicestartupservices.com.evil.test']) {
    const scripts:any[]=[]; const events:any[]=[];
    const w:any={UET: function(options:any){ events.push(options); this.push=(...args:any[])=>events.push(args); }};
    const context={window:w,URL,location:{hostname,href:`https://${hostname}/resources/hipaa-training/?msclkid=abc123#startup-registration`},document:{readyState:"complete",referrer:"",createElement:()=>({}),head:{appendChild:(s:any)=>scripts.push(s)}}};
    runInNewContext(script,context); runInNewContext(script,context);
    const production=hostname==='practicestartupservices.com'||hostname==='www.practicestartupservices.com';
    assert.equal(scripts.length,production?1:0);
    if(production){ trackToolDownload('checklist','xlsx',{uetq:w.uetq}); scripts[0].onload(); assert.equal(events[0].ti,'187281708'); assert.equal(events[0].q[1],'pss_checklist_download'); assert.equal(events[1][0],'pageLoad'); }
  }
});
test('downloads stay distinct from leads and bookings; duplicate success callbacks are suppressed',()=>{
  const calls:unknown[][]=[]; const env={uetq:{push:(...args:unknown[])=>calls.push(args)},session:storage()};
  trackToolDownload('checklist','xlsx',env); trackToolDownload('proforma','pdf',env);
  trackOpenAILead('registration-1',env);trackOpenAILead('registration-1',env);
  trackConsultationBooked('booking-1',env);trackConsultationBooked('booking-1',env);
  assert.deepEqual(calls,['pss_checklist_download','pss_proforma_download','pss_inquiry_submitted','pss_booking_complete'].map(e=>['event',e,{}]));
});
test('blocked providers do not prevent Microsoft success events or interrupt tools',()=>{
  const calls:unknown[][]=[]; const fail=()=>{throw Error('blocked');};
  const env={uetq:{push:(...a:unknown[])=>calls.push(a)},gtag:fail,fbq:fail,oaiq:fail,session:storage()};
  trackLead({reference:'r',eventId:'e',leadType:'startup_research',contentName:'x'},env);
  trackToolDownload('checklist','pdf',env);trackConsultationBooked('b',env);
  assert.equal(calls.length,3);
  assert.doesNotThrow(()=>trackToolDownload('proforma','xlsx',{uetq:{push:fail}}));
});
test('Microsoft click ID survives internal navigation without capturing contact fields',()=>{
  const local=storage(),session=storage();
  captureAttribution('https://practicestartupservices.com/?msclkid=abc123&email=private@example.com','',local,session,1);
  captureAttribution('https://practicestartupservices.com/resources/pro-forma/','',local,session,2);
  const payload=attributionPayload(local,session,2);
  assert.equal(payload.msclkid,'abc123');assert.equal(payload.ft_msclkid,'abc123');assert.ok(!JSON.stringify(payload).includes('private@'));
});

test('UET waits for planner cleanup and refuses sensitive URL contexts', () => {
  for (const blocked of [false, true]) {
    const scripts:any[]=[]; const listeners:any={};
    const location={hostname:'practicestartupservices.com',href:'https://practicestartupservices.com/resources/pro-forma/?specialty=psychiatry&zip=90210&msclkid=abc123'};
    const document={readyState:'loading',referrer:'',createElement:()=>({}),head:{appendChild:(s:any)=>scripts.push(s)},addEventListener:(name:string,fn:any)=>{listeners[name]=fn;}};
    runInNewContext(script,{window:{},location,document,URL});
    assert.equal(scripts.length,0);
    if (!blocked) location.href='https://practicestartupservices.com/resources/pro-forma/?msclkid=abc123';
    listeners.DOMContentLoaded();
    assert.equal(scripts.length,blocked?0:1);
  }
  const scripts:any[]=[];
  runInNewContext(script,{window:{},location:{hostname:'practicestartupservices.com',href:'https://practicestartupservices.com/'},document:{readyState:'complete',referrer:'https://practicestartupservices.com/research/?zip=90210',createElement:()=>({}),head:{appendChild:(s:any)=>scripts.push(s)}},URL});
  assert.equal(scripts.length,0);
});
