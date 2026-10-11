// POST /api/startup-research: gated research brief (email + Turnstile).
// GET  /api/startup-research: reports whether the gated step is configured.
// All logic lives in src/lib/research/handler.ts (unit-tested with stubs).
import { handleAvailability, handleGate, fail, type ResearchEnv } from "../../src/lib/research/handler.ts";

const log = (event: string, detail: Record<string, unknown>) => console.log(JSON.stringify({ event, ...detail }));

export const onRequestGet: PagesFunction<ResearchEnv> = async ({ env }) =>
  handleAvailability({ env, fetcher: (i, init) => fetch(i, init) });

export const onRequestPost: PagesFunction<ResearchEnv> = async ({ request, env, waitUntil }) =>
  handleGate(request, { env, fetcher: (i, init) => fetch(i, init), waitUntil, log });

export const onRequest: PagesFunction<ResearchEnv> = async () => fail("validation", { message: "Method not allowed." });
