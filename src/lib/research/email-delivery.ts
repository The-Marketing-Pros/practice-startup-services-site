import { reportBytes } from './delivery.ts';
import type { ResearchResult } from './pdf.ts';
import type { ReportContact } from './contract.ts';
import type { Fetcher } from './facts.ts';

export type ReportMailer = Pick<Service, 'fetch'>;
type Row = {email_id:string|null;alert_id:string|null;attempted_step:string|null};
const escapeHtml=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));

export async function emailReport(input:{db:D1Database;mailer:ReportMailer;fetcher:Fetcher;jobId:string;email:string;contact:ReportContact;result:ResearchResult;now:()=>Date;render?:(r:ResearchResult,c:ReportContact)=>Promise<ArrayBuffer>}) {
  const {db,jobId,now,contact,result}=input;
  await db.prepare('INSERT INTO research_email_deliveries (job_id, updated_at) VALUES (?1, ?2) ON CONFLICT(job_id) DO NOTHING').bind(jobId,now().getTime()).run();
  const read=()=>db.prepare('SELECT email_id, alert_id, attempted_step FROM research_email_deliveries WHERE job_id = ?1').bind(jobId).first<Row>();
  if((await read())?.email_id)return;
  const lease=crypto.randomUUID();
  const acquired=await db.prepare('UPDATE research_email_deliveries SET lease_token = ?2, lease_until = ?3 WHERE job_id = ?1 AND lease_until < ?4').bind(jobId,lease,now().getTime()+180000,now().getTime()).run();
  if(acquired.meta.changes!==1)throw new Error('delivery_in_progress');
  const save=async(column:string,value:string)=>{
    const saved=await db.prepare(`UPDATE research_email_deliveries SET ${column} = ?3, updated_at = ?4 WHERE job_id = ?1 AND lease_token = ?2`).bind(jobId,lease,value,now().getTime()).run();
    if(saved.meta.changes!==1)throw new Error('delivery_lease_lost');
  };
  try {
    const row=(await read())!;
    if(row.email_id)return;
    if(row.attempted_step)throw new Error('delivery_needs_reconciliation');
    let pdf:ArrayBuffer|undefined;
    try {pdf=await(input.render?input.render(result,contact):reportBytes(result,input.fetcher,contact));}
    catch {if(row.alert_id)throw new Error('report_render_failed');}
    const step=pdf?'email':'alert';
    const incomplete=result.briefStatus!=='ready';
    const title=pdf?(incomplete?'Review needed: partial startup report':'Startup report ready for review'):'Action needed: startup report PDF failed';
    const warning=pdf?(incomplete?`The AI brief is incomplete (${result.briefStatus}). Review and complete the attached planning materials before forwarding.`:'Review the AI-assisted report, sources and recommendations before forwarding it to the prospect.'):'The HubSpot form was submitted, but the PDF could not be prepared. Follow up with the prospect and reconcile this request. No report has been sent to the prospect.';
    const details=[`Prospect: ${contact.firstName} ${contact.lastName}`,`Practice: ${contact.practiceName}`,`Email: ${input.email}`,`Specialty: ${result.facts.labels.specialty}`,`Location: ZIP ${result.facts.zip} ${result.facts.labels.state || ''}`,`Reference: ${result.reference}`,`Request: ${jobId}`,`Prepared: ${result.generatedAt}`];
    const text=[title,'',...details,'',warning,'','Match this request to the HubSpot contact using the email above. The visitor sees only a confirmation; review and forward the PDF yourself.'].join('\n');
    const html=`<div style="font-family:Arial,sans-serif;color:#142544;max-width:640px"><p style="color:#3155d9;font-weight:bold">PRACTICE STARTUP SERVICES · BY PPS</p><h1>${escapeHtml(title)}</h1><div style="background:#f2f5fb;padding:20px;border-radius:12px">${details.map(x=>`<p>${escapeHtml(x)}</p>`).join('')}</div><p>${escapeHtml(warning)}</p><p>Match this request to the HubSpot contact using the email above. The visitor sees only a confirmation; review and forward the PDF yourself.</p></div>`;
    const form=new FormData();
    form.set('subject',`${title} · ${result.reference} · ${contact.firstName} ${contact.lastName}`.slice(0,250));
    form.set('text',text);form.set('html',html);
    if(pdf)form.set('file',new Blob([pdf],{type:'application/pdf'}),`PSS-${result.reference}.pdf`);
    // A durable marker precedes the external send. Ambiguous outcomes require
    // reconciliation; replay must not generate duplicate prospect reports.
    await save('attempted_step',step);
    const response=await input.mailer.fetch('https://report-mailer/send',{method:'POST',body:form,redirect:'manual',signal:AbortSignal.timeout(30000)});
    if(!response.ok)throw new Error('email_send_unconfirmed');
    const receipt=await response.json() as {ok?:boolean;messageId?:unknown};
    if(receipt.ok!==true||typeof receipt.messageId!=='string'||!receipt.messageId||receipt.messageId.length>500)throw new Error('email_send_unconfirmed');
    const ack=await db.prepare(`UPDATE research_email_deliveries SET ${step}_id = ?3, attempted_step = NULL, last_error = ?4, updated_at = ?5 WHERE job_id = ?1 AND lease_token = ?2`).bind(jobId,lease,receipt.messageId,pdf?'':'report_render_failed',now().getTime()).run();
    if(ack.meta.changes!==1)throw new Error('email_ack_failed');
    if(!pdf)throw new Error('report_render_failed');
  } catch(e) {
    await save('last_error',e instanceof Error&&/^[a-z_]+$/.test(e.message)?e.message:'email_delivery_error').catch(()=>{});
    throw e;
  } finally {
    await db.prepare('UPDATE research_email_deliveries SET lease_until = 0 WHERE job_id = ?1 AND lease_token = ?2').bind(jobId,lease).run();
  }
}
