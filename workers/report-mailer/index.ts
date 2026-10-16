// Private service binding only: no workers.dev, preview URL or public route.
// Recipient/sender are deployment settings, never taken from request fields.
export default {
  async fetch(request: Request, env: ReportMailerEnv): Promise<Response> {
    const reply = (body: object, status = 200) => Response.json(body, {status, headers:{'Cache-Control':'no-store'}});
    if (request.method !== 'POST' || new URL(request.url).pathname !== '/send') return reply({ok:false},404);
    const max = 3 * 1024 * 1024;
    if (!request.body) return reply({ok:false},400);
    const reader = request.body.getReader();
    const parts: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > max) { await reader.cancel(); return reply({ok:false},413); }
      parts.push(value);
    }
    try {
      const bytes = new Uint8Array(size); let offset=0;
      for (const part of parts) {bytes.set(part,offset);offset+=part.length;}
      const form = await new Response(bytes,{headers:{'Content-Type':request.headers.get('Content-Type') || ''}}).formData();
      const subject=form.get('subject'), text=form.get('text'), html=form.get('html'), file=form.get('file');
      if (typeof subject!=='string'||subject.length>250||/[\r\n]/.test(subject)||typeof text!=='string'||text.length>20000||typeof html!=='string'||html.length>40000) return reply({ok:false},400);
      if (file && (!(file instanceof File)||file.type!=='application/pdf'||file.size>2*1024*1024)) return reply({ok:false},400);
      const attachments: EmailAttachment[] = [];
      if (file instanceof File) {
        const pdf=await file.arrayBuffer();
        if(new TextDecoder().decode(pdf.slice(0,5))!=='%PDF-')return reply({ok:false},400);
        attachments.push({filename:'PSS-startup-report.pdf',type:'application/pdf',disposition:'attachment',content:pdf});
      }
      const sent=await env.EMAIL.send({from:{email:env.REPORT_FROM,name:'PPS Startup Reports'},to:env.REPORT_TO,subject,text,html,attachments});
      if (!sent.messageId) return reply({ok:false},502);
      return reply({ok:true,messageId:sent.messageId});
    } catch {
      // Provider errors can include addresses/content. Do not log or return them.
      console.error(JSON.stringify({event:'report_email_send_failed'}));
      return reply({ok:false},502);
    }
  }
};
