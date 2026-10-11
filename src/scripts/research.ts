// Startup research page: free preview (no email) and gated brief.
// UX contract: values kept after recoverable errors; submit disabled while in
// flight; one requestId per logical submission, reused on retry; responses are
// parsed only when they are JSON; success events fire only after the server
// confirms, once per reference.
import type { FactsBundle } from "../lib/research/facts";
import type { Brief } from "../lib/research/guard";
import { briefStatusNote, confirmationHeading, type ResearchResult } from "../lib/research/pdf";
import { attributionPayload } from "../lib/attribution";
import { requestJson, type Outcome } from "../lib/research/client";
import { trackLead, trackToolDownload, trackToolUse } from "../lib/measure";
import { newChecklist, visibleTasks, priorityTasks, type Checklist } from "../lib/planners/checklist";
import { personalTaskIds } from "../lib/planners/personal-tasks";
import { profileSummary } from "../lib/planners/context";
import { stateForZip } from "../lib/startup/zip3";

type Turnstile = {
  render: (el: string | HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  getResponse: (id?: string) => string | undefined;
};
type GateSuccess = ResearchResult & { ok: true; requestId: string; eventId: string; saved?: boolean; replay?: boolean };

const $ = <T = HTMLElement>(id: string) => document.getElementById(id) as unknown as T;
const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const profileForm = $<HTMLFormElement>("research-profile");
const previewStatus = $("preview-status");
const previewSubmit = $<HTMLButtonElement>("preview-submit");
const gateForm = $<HTMLFormElement>("gate-form");
const gateStatus = $("gate-status");
const gateSubmit = $<HTMLButtonElement>("gate-submit");

let facts: FactsBundle | null = null;
let profileKey = "";
let result: GateSuccess | null = null;
let gateAvailable = false;
let widgetId: string | undefined;
let busyPreview = false;
let busyGate = false;
// requestId is reused for retries of the same logical submission. It is bound
// to the content fingerprint once the server has seen it; any later change of
// content (or a server "conflict") starts a new requestId.
let requestId = crypto.randomUUID();
let boundFingerprint = "";

function fieldError(id: string, message: string) {
  const el = $(`${id}-error`);
  const input = $(id);
  if (!el || !input) return;
  el.textContent = message;
  el.hidden = !message;
  if (message) input.setAttribute("aria-invalid", "true");
  else input.removeAttribute("aria-invalid");
}

function clearErrors(prefix: string) {
  document.querySelectorAll<HTMLElement>(`[id^="${prefix}"][id$="-error"]`).forEach((el) => {
    el.hidden = true;
    el.textContent = "";
  });
  document.querySelectorAll(`[id^="${prefix}"][aria-invalid]`).forEach((el) => el.removeAttribute("aria-invalid"));
}

function readProfile() {
  const d = new FormData(profileForm);
  const v = (k: string) => String(d.get(k) || "");
  const payer = v("payer");
  return { provider: v("provider"), specialty: v("specialty"), zip: v("zip").trim(), model: v("model"), setting: v("setting"), payer, mix: payer === "cash" ? "" : v("mix"), stage: v("stage") };
}

function syncMix() {
  $("r-mix-field").hidden = ($<HTMLSelectElement>("r-payer").value === "cash");
}

// ------------------------------------------------------------------ preview

function checklistFor(p: ReturnType<typeof readProfile>): Checklist {
  const plan = newChecklist();
  Object.assign(plan.profile, { provider: p.provider, specialty: p.specialty, zip: p.zip, model: p.model, setting: p.setting, payer: p.payer, mix: p.mix, stage: p.stage, state: stateForZip(p.zip)?.name ?? "" });
  return plan;
}

function planSummary(p: ReturnType<typeof readProfile>) {
  const plan = checklistFor(p);
  const all = visibleTasks(plan);
  const personal = all.filter((t) => personalTaskIds.includes(t.id));
  return { summary: profileSummary(plan.profile), personal, first: priorityTasks(plan), total: all.length };
}

function handoffQuery(p: ReturnType<typeof readProfile>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(p)) if (v) q.set(k, v);
  return q.toString();
}

function renderPreview(f: FactsBundle, p: ReturnType<typeof readProfile>) {
  const sectionError = (msg: string) => `<p class="research-section-error">${esc(msg)}</p>`;
  const acs = f.facts.filter((x) => x.sourceId === "acs");
  const acsSource = f.sources.find((s) => s.id === "acs");
  $("acs-content").innerHTML =
    f.sections.acs.status !== "ok"
      ? sectionError(f.sections.acs.message)
      : `<table class="research-table"><thead><tr><th scope="col">Measure</th><th scope="col">Estimate</th></tr></thead><tbody>${acs
          .map((x) => `<tr><th scope="row">${esc(x.label)}${x.note ? `<span class="moe">${esc(x.note)}</span>` : ""}</th><td class="num">${esc(x.display)}${x.moeDisplay ? `<span class="moe">Margin of error ${esc(x.moeDisplay)}</span>` : ""}</td></tr>`)
          .join("")}</tbody></table><p class="research-meta"><span class="research-tag fact">Fact</span>Census ZIP Code Tabulation Area ${esc(f.zip)}${f.labels.state ? `, ${esc(f.labels.state)}` : ""}. Source: ${esc(acsSource?.vintage ?? "")} (U.S. Census Bureau). ZCTAs approximate ZIP code areas.</p>`;
  const nppes = f.facts.filter((x) => x.sourceId === "nppes");
  $("nppes-content").innerHTML =
    f.sections.nppes.status !== "ok"
      ? sectionError(f.sections.nppes.message)
      : `<p class="rs-small">Matching taxonomy: ${esc(f.labels.taxonomy)}</p><table class="research-table"><tbody>${nppes
          .map((x) => `<tr><th scope="row">${esc(x.label)}${x.note ? `<span class="moe">${esc(x.note)}</span>` : ""}</th><td class="num">${esc(x.display)}</td></tr>`)
          .join("")}</tbody></table>${f.sections.nppes.note ? `<p class="rs-small">${esc(f.sections.nppes.note)}</p>` : ""}<p class="research-meta"><span class="research-tag fact">Fact</span>CMS NPPES NPI Registry, retrieved ${esc(f.sources.find((s) => s.id === "nppes")?.retrieved ?? f.generatedAt.slice(0, 10))}. A listing is a registration, not proof that a provider is seeing patients or competing for the same patients.</p>`;
  const est = f.estimates[0];
  $("estimate-block").hidden = !est;
  if (est)
    $("estimate-content").innerHTML = `<p><span class="research-tag estimate">Estimate</span><strong>${esc(est.label)}: ${esc(est.display)}</strong></p><p class="research-meta">Formula: ${esc(est.formula)}. ${esc(est.note)}</p>`;
  const plan = planSummary(p);
  $("plan-content").innerHTML = `<p class="rs-small">${esc(plan.summary)}</p><p>Your plan has <strong>${plan.total} tasks</strong>. ${plan.personal.length ? "Steps added for your situation:" : "Add your state and practice details to see steps added for you."}</p><ul class="research-plan-list">${plan.personal
    .slice(0, 8)
    .map((t) => `<li>${esc(t.title)}<small>${esc(t.reason ?? "")}</small></li>`)
    .join("")}</ul>${plan.first.length ? `<p style="margin-top:14px"><strong>Start these first:</strong> their suggested start dates have already passed for your launch stage.</p><ul class="research-plan-list">${plan.first.map((t) => `<li>${esc(t.title)}</li>`).join("")}</ul>` : ""}`;
  const q = handoffQuery(p);
  $<HTMLAnchorElement>("open-checklist").href = `/resources/startup-checklist/?${q}`;
  $<HTMLAnchorElement>("open-proforma").href = `/resources/pro-forma/?${q}`;
  $("sources-content").innerHTML = `<ul>${f.sources
    .map((s) => `<li><strong>${esc(s.name)}</strong>${s.vintage ? ` (${esc(s.vintage)})` : ""}${s.url ? `. <a href="${esc(s.url)}" target="_blank" rel="noopener">Source<span class="sr-only"> (opens in a new tab)</span></a>` : ""}${s.notes ? `<br>${esc(s.notes)}` : ""}</li>`)
    .join("")}</ul>`;
  $("preview-empty").hidden = true;
  $("preview-body").hidden = false;
}

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (busyPreview) return;
  clearErrors("r-");
  const p = readProfile();
  if (!p.specialty) return fieldError("r-specialty", "Choose your specialty.");
  if (!/^\d{5}$/.test(p.zip)) return fieldError("r-zip", "Enter a five-digit ZIP code.");
  busyPreview = true;
  previewSubmit.disabled = true;
  previewStatus.classList.remove("error");
  previewStatus.textContent = "Looking up public data for your ZIP and specialty…";
  const outcome = await requestJson(fetch, `/api/startup-research-preview?${new URLSearchParams(p)}`);
  busyPreview = false;
  previewSubmit.disabled = false;
  if (outcome.type === "success" && outcome.body.facts) {
    facts = outcome.body.facts as FactsBundle;
    profileKey = JSON.stringify(p);
    if (result && JSON.stringify(result.facts.profile) !== profileKey) resetResult();
    renderPreview(facts, p);
    previewStatus.textContent = "Your preview is ready below.";
    if (window.matchMedia("(max-width: 900px)").matches) $("research-results").scrollIntoView({ block: "start" });
    trackToolUse("research_preview");
    syncGate();
    return;
  }
  const f = outcome.type === "failure" ? outcome : null;
  previewStatus.classList.add("error");
  if (f?.kind === "validation" && f.field) {
    fieldError(`r-${f.field}`, f.message || "Check this field.");
    previewStatus.textContent = "Please check the highlighted field.";
  } else previewStatus.textContent = f?.message || "The preview could not load. Please try again. Your selections are kept.";
});
profileForm.addEventListener("change", (e) => {
  syncMix();
  if ((e.target as HTMLElement).id && facts && JSON.stringify(readProfile()) !== profileKey)
    previewStatus.textContent = "You changed your details. Show the preview again to update it.";
});

// --------------------------------------------------------------------- gate

function syncGate() {
  const sitekey = gateForm.dataset.sitekey || "";
  const usable = gateAvailable && !!sitekey;
  $("gate-unavailable").hidden = usable;
  gateForm.hidden = !usable || !!result;
  if (usable && widgetId === undefined) loadTurnstile(sitekey);
}

function loadTurnstile(sitekey: string) {
  const w = window as Window & { turnstile?: Turnstile };
  const render = () => {
    try {
      widgetId = w.turnstile!.render("#g-verification", { sitekey, action: "startup_research", appearance: "interaction-only" });
    } catch {
      fieldError("g-verification", "The verification check could not load. Reload the page to try again.");
    }
  };
  if (w.turnstile) return render();
  widgetId = "";
  const s = document.createElement("script");
  s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  s.async = true;
  s.onload = render;
  s.onerror = () => fieldError("g-verification", "The verification check could not load. Reload the page to try again, or use the free tools above.");
  document.head.appendChild(s);
}

const MESSAGES: Record<string, string> = {
  verification: "We could not verify this request. Complete the check and try again. Your details are kept.",
  rate_limited: "The daily limit for written briefs has been reached. Your preview, checklist and pro forma still work. Please try again tomorrow.",
  provider: "A service we rely on is temporarily unavailable. Your details are kept. Please try again in a minute.",
  system: "Something went wrong on our side. Please try again, or book a free first conversation instead.",
  conflict: "Your details changed since your last request. Submit again to start a new request.",
  in_progress: "Your brief is still being prepared. Please try again in a minute.",
  unavailable: "The written brief is not available yet. Your preview, checklist and pro forma work now.",
};

gateForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (busyGate || !facts) return;
  clearErrors("g-");
  gateStatus.classList.remove("error");
  const d = new FormData(gateForm);
  const email = String(d.get("email") || "").trim();
  const consent = d.get("consent") === "on";
  const marketing = d.get("marketing") === "on";
  if (!email || !$<HTMLInputElement>("g-email").checkValidity()) {
    fieldError("g-email", "Enter a valid email address.");
    $("g-email").focus();
    return;
  }
  if (!consent) {
    fieldError("g-consent", "Check the box to request your brief.");
    return;
  }
  const w = window as Window & { turnstile?: Turnstile };
  const token = (widgetId && w.turnstile?.getResponse(widgetId)) || "";
  if (!token) {
    fieldError("g-verification", "Complete the verification check, then submit again.");
    return;
  }
  const profile = JSON.parse(profileKey) as ReturnType<typeof readProfile>;
  const fingerprint = JSON.stringify({ email, marketing, profile });
  if (boundFingerprint && boundFingerprint !== fingerprint) requestId = crypto.randomUUID();
  busyGate = true;
  gateSubmit.disabled = true;
  gateStatus.textContent = "Preparing your brief. This can take up to a minute…";
  let attribution: Record<string, string> = {};
  try {
    attribution = attributionPayload(window.localStorage, window.sessionStorage);
  } catch {
    /* attribution is best effort */
  }
  const outcome: Outcome = await requestJson(fetch, "/api/startup-research", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestId, email, consent, marketing, profile, token, attribution }),
  });
  busyGate = false;
  gateSubmit.disabled = false;
  try {
    if (widgetId) w.turnstile?.reset(widgetId);
  } catch {
    /* ignore */
  }
  if (outcome.type === "success") {
    boundFingerprint = fingerprint;
    showResult(outcome.body as unknown as GateSuccess);
    return;
  }
  const f = outcome;
  const kind = f.kind;
  // The server saw this content unless it was rejected before processing.
  if (kind !== "validation" && kind !== "verification" && kind !== "unavailable") boundFingerprint = fingerprint;
  if (kind === "conflict") {
    requestId = crypto.randomUUID();
    boundFingerprint = "";
  }
  gateStatus.classList.add("error");
  if (kind === "validation") {
    const field = f?.field === "email" || f?.field === "consent" || f?.field === "marketing" ? f.field : "";
    if (field && field !== "marketing") fieldError(`g-${field}`, f?.message || "Check this field.");
    gateStatus.textContent = f?.message || "Please check the highlighted field.";
  } else if (kind === "verification") {
    fieldError("g-verification", "Complete the verification check again.");
    gateStatus.textContent = MESSAGES.verification;
  } else {
    gateStatus.textContent = (kind === "provider" && f?.message) || MESSAGES[kind] || MESSAGES.system;
    if (kind === "unavailable") {
      gateAvailable = false;
      syncGate();
    }
  }
});

/** New practice details after a completed brief start a new logical request. */
function resetResult() {
  result = null;
  requestId = crypto.randomUUID();
  boundFingerprint = "";
  try {
    sessionStorage.removeItem("pss_research_last");
  } catch {
    /* ignore */
  }
  $("gate-confirm").hidden = true;
  $("brief-content").innerHTML = "";
}

function renderBrief(brief: Brief | null, status: string) {
  const box = $("brief-content");
  if (!brief) {
    box.innerHTML = "";
    return;
  }
  box.innerHTML = `<div class="research-brief"><p class="rs-small">Written by AI from the facts above only, then checked so every number matches the data. Each statement is labeled.</p>${brief.sections
    .map(
      (s) =>
        `<section><h4>${esc(s.heading)}</h4>${s.statements
          .map((st) => `<p><span class="research-tag ${esc(st.kind)}">${esc(st.kind)}</span>${esc(st.text)}</p>`)
          .join("")}</section>`,
    )
    .join("")}</div>`;
  void status;
}

function showResult(r: GateSuccess) {
  result = r;
  try {
    sessionStorage.setItem("pss_research_last", JSON.stringify(r));
  } catch {
    /* keep in memory only */
  }
  trackLead({ reference: r.reference, eventId: r.eventId, leadType: "startup_research", contentName: "pss_startup_research" });
  gateForm.hidden = true;
  gateStatus.textContent = "";
  // The brief must only cite numbers that are on screen: re-render the tables
  // from the exact facts the server used for this brief.
  facts = r.facts;
  renderPreview(r.facts, r.facts.profile as ReturnType<typeof readProfile>);
  $("confirm-title").textContent = confirmationHeading(r.briefStatus);
  $("confirm-next").textContent = r.brief ? "your brief and PDF are below." : "your data tables and checklist are above, and the PDF is ready to download.";
  $("confirm-ref").textContent = r.reference;
  const note = briefStatusNote(r.briefStatus);
  $("confirm-note").hidden = !note;
  $("confirm-note").textContent = note;
  renderBrief(r.brief, r.briefStatus);
  const confirm = $("gate-confirm");
  confirm.hidden = false;
  confirm.focus();
}

$("brief-pdf").addEventListener("click", async () => {
  if (!result) return;
  const button = $<HTMLButtonElement>("brief-pdf");
  const status = $("pdf-status");
  button.disabled = true;
  status.classList.remove("error");
  status.textContent = "Preparing your PDF…";
  try {
    const { researchPdf } = await import("../lib/research/pdf");
    await researchPdf(result, planSummary(result.facts.profile as ReturnType<typeof readProfile>));
    status.textContent = "Your PDF is ready. Check your browser downloads.";
    trackToolDownload("research", "pdf");
  } catch {
    status.classList.add("error");
    status.textContent = "The PDF could not be created. Reload the page and try again; your brief stays on this page for this visit.";
  } finally {
    button.disabled = false;
  }
});

// ------------------------------------------------------------------- start

function prefillFromQuery() {
  const q = new URLSearchParams(location.search);
  for (const k of ["provider", "specialty", "zip", "model", "setting", "payer", "mix", "stage"]) {
    const v = q.get(k);
    const el = document.getElementById(`r-${k}`) as HTMLInputElement | HTMLSelectElement | null;
    if (!v || !el) continue;
    if (el instanceof HTMLSelectElement ? [...el.options].some((o) => o.value === v) : /^\d{5}$/.test(v)) el.value = v;
  }
}

async function init() {
  prefillFromQuery();
  syncMix();
  const avail = await requestJson(fetch, "/api/startup-research");
  gateAvailable = avail.type === "success" && avail.body.available === true;
  $("g-marketing-wrap").hidden = !(gateAvailable && avail.type === "success" && avail.body.marketingAvailable === true);
  // Restore this visit's result (for example after a reload).
  try {
    const raw = sessionStorage.getItem("pss_research_last");
    if (raw) {
      const r = JSON.parse(raw) as GateSuccess;
      if (r?.ok && r.facts) {
        facts = r.facts;
        const p = r.facts.profile as ReturnType<typeof readProfile>;
        for (const [k, v] of Object.entries(p)) {
          const el = document.getElementById(`r-${k}`) as HTMLInputElement | HTMLSelectElement | null;
          if (el && v) el.value = v;
        }
        syncMix();
        profileKey = JSON.stringify(readProfile());
        renderPreview(r.facts, readProfile());
        showResult(r);
      }
    }
  } catch {
    /* ignore a corrupt saved result */
  }
  syncGate();
}
void init();
document.documentElement.classList.add("rs-js");
