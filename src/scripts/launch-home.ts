import { parseChecklist, visibleTasks, taskProgress, nextTasks } from "../lib/planners/checklist";
import { parseFinance, project } from "../lib/planners/finance";
import { escapeHtml as esc, element } from "../lib/planners/browser";

const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
function refresh() {
  // Read-only: never initialize, migrate, or overwrite a visitor's saved plans.
  element("saved-next").replaceChildren();
  element("saved-cash").replaceChildren();
  element("checklist-action").textContent = "Build my checklist →";
  element("finance-action").textContent = "Build my financial plan →";
  element("saved-checklist").textContent = "Create a plan with tasks that fit your practice, suggested dates, and clear owners.";
  element("saved-finance").textContent = "Estimate startup costs, monthly cash, and the funding needed to keep a reserve.";
  try {
    const raw = localStorage.getItem("pps-startup-checklist-v1");
    if (raw) {
      const plan = parseChecklist(JSON.parse(raw));
      const all = visibleTasks(plan);
      const done = all.filter(t => taskProgress(plan, t).done).length;
      element("saved-checklist").textContent = `${plan.profile.name || "Your practice"} · ${done} of ${all.length} tasks complete. ${done === all.length ? "Review readiness before deciding to open." : "Start with these suggested actions:"}`;
      element("saved-next").innerHTML = nextTasks(plan).map(t => `<li><a href="/resources/startup-checklist/#done-${esc(t.id)}">${esc(t.title)}</a></li>`).join("");
      element("checklist-action").textContent = "Continue my checklist →";
    }
  } catch {
    element("saved-checklist").textContent = "Your checklist could not be read. Open the checklist to restore a backup. Existing browser data has not been changed.";
  }
  try {
    const raw = localStorage.getItem("pps-startup-proforma-v1");
    if (raw) {
      const plan = parseFinance(JSON.parse(raw));
      const r = project(plan);
      element("saved-finance").textContent = `${plan.name || "Your practice"} · Opening ${plan.opening}. A forecast based on your saved assumptions.`;
      element("saved-cash").innerHTML = `<dl><dt>Lowest projected cash balance</dt><dd>${esc(money(r.lowestCash))}</dd><dt>Additional funding with reserve</dt><dd>${esc(money(r.reserveGap))}</dd></dl><p>Includes your ${esc(money(plan.values.reserve))} minimum reserve. Review the assumptions before relying on this estimate.</p>`;
      element("finance-action").textContent = "Review my financial plan →";
    }
  } catch {
    element("saved-finance").textContent = "Your forecast could not be read. Open the financial planner to restore a backup. Existing browser data has not been changed.";
  }
}
refresh();
window.addEventListener("storage", refresh);
window.addEventListener("pageshow", refresh);
