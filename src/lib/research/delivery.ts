// Server-only private report handoff. Never return CRM IDs, URLs or report data
// to a visitor. A write-ahead marker prevents duplicate external writes after
// an ambiguous timeout/crash; operators reconcile those using the request ID.
import { researchPdf, type ResearchResult } from './pdf.ts';
import { newChecklist, visibleTasks, priorityTasks } from '../planners/checklist.ts';
import { personalTaskIds } from '../planners/personal-tasks.ts';
import { profileSummary } from '../planners/context.ts';
import { stateForZip } from '../startup/zip3.ts';
import type { Fetcher } from './facts.ts';

export type DeliveryEnv = {
  HUBSPOT_PRIVATE_APP_TOKEN?: string;
  HUBSPOT_RESEARCH_FALLBACK_OWNER_ID?: string;
};
type DeliveryRow = {
  contact_id: string | null; owner_id: string | null; file_id: string | null;
  note_id: string | null; task_id: string | null; attempted_step: string | null;
};
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const id = (v: unknown): string => { if (typeof v !== 'string' || !/^\d+$/.test(v)) throw new Error('invalid_crm_id'); return v; };

export async function reportBytes(result: ResearchResult, fetcher: Fetcher): Promise<ArrayBuffer> {
  const plan = newChecklist();
  Object.assign(plan.profile, result.facts.profile, {state: stateForZip(result.facts.zip)?.name ?? ''});
  const tasks = visibleTasks(plan);
  return researchPdf(result, {summary: profileSummary(plan.profile), personal: tasks.filter(t => personalTaskIds.includes(t.id)), first: priorityTasks(plan), total: tasks.length},
    ((path: string) => fetcher(`https://practicestartupservices.com${path}`, {redirect:'manual', signal:AbortSignal.timeout(10000)})) as typeof fetch);
}

export async function deliverReport(input: {
  db: D1Database; env: DeliveryEnv; fetcher: Fetcher; jobId: string;
  email: string; result: ResearchResult; now: () => Date;
  render?: (r: ResearchResult) => Promise<ArrayBuffer>;
}): Promise<void> {
  const {db, env, fetcher, jobId, result, now} = input;
  if (!env.HUBSPOT_PRIVATE_APP_TOKEN) throw new Error('delivery_not_configured');
  await db.prepare('INSERT INTO research_deliveries (job_id, updated_at) VALUES (?1, ?2) ON CONFLICT(job_id) DO NOTHING').bind(jobId, now().getTime()).run();
  const read = () => db.prepare('SELECT contact_id, owner_id, file_id, note_id, task_id, attempted_step FROM research_deliveries WHERE job_id = ?1').bind(jobId).first<DeliveryRow>();
  let row = (await read())!;
  if (row.task_id) return;
  const token = crypto.randomUUID();
  const lease = await db.prepare('UPDATE research_deliveries SET lease_token = ?2, lease_until = ?3 WHERE job_id = ?1 AND lease_until < ?4').bind(jobId, token, now().getTime()+180000, now().getTime()).run();
  if (lease.meta.changes !== 1) throw new Error('delivery_in_progress');
  const save = async (column: string, value: string) => {
    const r = await db.prepare(`UPDATE research_deliveries SET ${column} = ?3, updated_at = ?4 WHERE job_id = ?1 AND lease_token = ?2`).bind(jobId, token, value, now().getTime()).run();
    if (r.meta.changes !== 1) throw new Error('delivery_lease_lost');
  };
  const api = async (path: string, init: RequestInit = {}) => {
    const response = await fetcher(`https://api.hubapi.com${path}`, {...init, headers:{...init.headers, Authorization:`Bearer ${env.HUBSPOT_PRIVATE_APP_TOKEN}`}, redirect:'manual', signal:AbortSignal.timeout(12000)});
    if (!response.ok) throw new Error(`hubspot_${response.status}`);
    return response.json() as Promise<any>;
  };
  const jsonPost = (path: string, body: unknown) => api(path, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  // IDs are saved after each step. On uncertain POST outcomes, do not resend.
  const write = async (step: 'file'|'note'|'task', perform: () => Promise<any>) => {
    if (row[`${step}_id`]) return row[`${step}_id`]!;
    if (row.attempted_step) throw new Error('delivery_needs_reconciliation');
    await save('attempted_step', step);
    const created = await perform();
    const createdId = id(created.id);
    const ack = await db.prepare(`UPDATE research_deliveries SET ${step}_id = ?3, attempted_step = NULL, updated_at = ?4 WHERE job_id = ?1 AND lease_token = ?2`).bind(jobId, token, createdId, now().getTime()).run();
    if (ack.meta.changes !== 1) throw new Error('delivery_ack_failed');
    row[`${step}_id`] = createdId;
    return createdId;
  };
  try {
    row = (await read())!;
    if (row.task_id) return;
    if (row.attempted_step) throw new Error('delivery_needs_reconciliation');
    if (!row.contact_id) {
      const contact = await api(`/crm/v3/objects/contacts/${encodeURIComponent(input.email)}?idProperty=email&properties=hubspot_owner_id`);
      row.contact_id = id(contact.id);
      await save('contact_id', row.contact_id);
    }
    if (!row.owner_id) {
      const contact = await api(`/crm/v3/objects/contacts/${row.contact_id}?properties=hubspot_owner_id`);
      row.owner_id = id(contact.properties?.hubspot_owner_id || env.HUBSPOT_RESEARCH_FALLBACK_OWNER_ID);
      const owner = await api(`/crm/v3/owners/${row.owner_id}`);
      if (owner.archived || !owner.userId) throw new Error('inactive_sdr_owner');
      await save('owner_id', row.owner_id);
    }
    if (!row.file_id) {
      const bytes = await (input.render ? input.render(result) : reportBytes(result, fetcher));
      await write('file', async () => {
        const form = new FormData();
        form.set('file', new Blob([bytes], {type:'application/pdf'}), `pss-startup-report-${jobId}.pdf`);
        form.set('folderPath', '/pss-startup-research');
        form.set('options', JSON.stringify({access:'PRIVATE', overwrite:false}));
        const uploaded = await api('/files/v3/files', {method:'POST',body:form});
        if (uploaded.access !== 'PRIVATE') throw new Error('file_privacy_unconfirmed');
        return uploaded;
      });
    }
    const association = (associationTypeId: number) => [{to:{id:row.contact_id},types:[{associationCategory:'HUBSPOT_DEFINED',associationTypeId}]}];
    const summary = Object.entries(result.facts.profile).map(([k,v]) => `${escapeHtml(k)}: ${escapeHtml(String(v))}`).join('<br>');
    const warning = result.briefStatus === 'ready' ? 'AI-assisted draft. Review sources and recommendations before forwarding.' : `Incomplete AI brief (${escapeHtml(result.briefStatus)}). Review and complete before forwarding.`;
    await write('note', () => jsonPost('/crm/v3/objects/notes', {
      properties:{hs_timestamp:now().toISOString(),hubspot_owner_id:row.owner_id, hs_attachment_ids:row.file_id,
        hs_note_body:`<p>PSS startup report — ${escapeHtml(result.reference)}</p><p>Request ${jobId}</p><p>${summary}</p><p>${warning}</p><p>The prospect has received a request confirmation only. The report is attached privately for SDR review and forwarding.</p>`},
      associations:association(202),
    }));
    await write('task', () => jsonPost('/crm/v3/objects/tasks', {
      properties:{hs_timestamp:new Date(now().getTime()+3600000).toISOString(), hs_task_reminders:String(now().getTime()+60000), hubspot_owner_id:row.owner_id,
        hs_task_subject:`Review and send PSS report ${result.reference}`, hs_task_body:`Request ${jobId}. Review the private PDF attached to the PSS report note on this contact, then forward it to the prospect. ${warning}`, hs_task_status:'NOT_STARTED', hs_task_priority:'HIGH', hs_task_type:'TODO'},
      associations:association(204),
    }));
    await save('last_error', '');
  } catch(e) {
    // Error messages here are codes only. Never log API bodies, tokens or email.
    await save('last_error', e instanceof Error && /^[a-z_]+(?:_\d{3})?$/.test(e.message) ? e.message : 'delivery_error').catch(()=>{});
    throw e;
  } finally {
    await db.prepare('UPDATE research_deliveries SET lease_until = 0 WHERE job_id = ?1 AND lease_token = ?2').bind(jobId,token).run();
  }
}
