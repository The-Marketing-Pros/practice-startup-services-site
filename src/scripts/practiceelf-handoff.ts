import { collectHandoff } from "../lib/planners/handoff";
import type { Checklist } from "../lib/planners/checklist";
import type { FinancePlan } from "../lib/planners/finance";

export function initPracticeElfHandoff(current?: () => Checklist | FinancePlan) {
  const section = document.querySelector<HTMLElement>("[data-elf-handoff]");
  if (!section) return;
  const button = section.querySelector<HTMLButtonElement>("[data-elf-save]")!;
  const status = section.querySelector<HTMLElement>("[data-elf-status]")!;
  if (!current) {
    const visible = () => {
      try { section.hidden = !localStorage.getItem("pps-startup-checklist-v1") && !localStorage.getItem("pps-startup-proforma-v1"); }
      catch { section.hidden = true; }
    };
    visible(); window.addEventListener("storage",visible); window.addEventListener("pageshow",visible);
  }
  button.addEventListener("click", () => {
    let payload;
    try { payload = collectHandoff(localStorage, current?.()); }
    catch {
      status.textContent = "We couldn’t prepare the complete plan. Check both tools for invalid inputs or saved-data errors, and download a backup before trying again.";
      return;
    }
    // The local destination is compiled out of production. Never accept an arbitrary
    // destination from the URL, saved data, or a message.
    const origin = import.meta.env.DEV ? "http://localhost:5181" : "https://practiceelf.com";
    const nonce = crypto.randomUUID();
    const target = window.open(`${origin}/dashboard/launch-import#${nonce}`, "_blank");
    if (!target) { status.textContent = "Allow a new tab for PracticeElf, then try again. Your plan is still here."; return; }
    button.disabled = true;
    status.textContent = "Opening PracticeElf. Keep this tab open until your plan arrives.";
    let received = false;
    const finish = () => { window.removeEventListener("message", receive); clearTimeout(timeout); button.disabled = false; };
    const receive = (event: MessageEvent) => {
      if (event.origin !== origin || event.source !== target || event.data?.nonce !== nonce) return;
      if (event.data?.type === "practiceelf:ready") target.postMessage({ type:"pss:plan", nonce, payload }, origin);
      if (event.data?.type === "practiceelf:received") {
        received = true;
        status.textContent = "Your plan is ready to review in PracticeElf. Sign in there and confirm to save your workspace.";
        finish();
      }
    };
    const timeout = window.setTimeout(() => {
      if (!received) status.textContent = "We couldn’t confirm the transfer. Your plan is still here. Close the new tab and try again, or download a backup.";
      finish();
    }, 30_000);
    window.addEventListener("message", receive);
  });
}
