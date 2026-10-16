import { stateForZip } from '../startup/zip3.ts';

/** Only practice context belongs in tool URLs. Never include email, report IDs or tokens. */
export function researchToolLinks(profile: Record<string, unknown>) {
  const q = new URLSearchParams();
  for (const key of ['provider', 'specialty', 'zip', 'model', 'setting', 'payer', 'mix', 'stage']) {
    const value = profile[key];
    if (typeof value === 'string' && value && !(key === 'mix' && profile.payer === 'cash')) q.set(key, value);
  }
  // Carry the current ZIP's state explicitly so a previously saved checklist
  // from another state does not silently retain its old state-specific tasks.
  const state = typeof profile.zip === 'string' ? stateForZip(profile.zip)?.name : undefined;
  if (state) q.set('state', state);
  return {
    checklist: `/resources/startup-checklist/?${q}`,
    proforma: `/resources/pro-forma/?${q}`,
  };
}
