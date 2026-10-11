// GET /api/startup-research-preview?provider=&specialty=&zip=&model=&setting=&payer=&mix=&stage=
// Free preview: public NPPES + Census data, no email, no AI.
import { handlePreview, fail, type ResearchEnv } from "../../src/lib/research/handler.ts";

const log = (event: string, detail: Record<string, unknown>) => console.log(JSON.stringify({ event, ...detail }));

export const onRequestGet: PagesFunction<ResearchEnv> = async ({ request, env }) =>
  handlePreview(request, { env, fetcher: (i, init) => fetch(i, init), log });

export const onRequest: PagesFunction<ResearchEnv> = async () => fail("validation", { message: "Method not allowed." });
