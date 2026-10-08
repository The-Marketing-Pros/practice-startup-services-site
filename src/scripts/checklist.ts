import {
  newChecklist,
  parseChecklist,
  visibleTasks,
  taskProgress,
  stages,
  type Profile,
} from "../lib/planners/checklist";
import {
  element,
  escapeHtml as esc,
  status,
  store,
  restore,
  importPlan,
  exportPlan,
} from "../lib/planners/browser";
import {
  saveBackup,
  checklistExcel,
  checklistPdf,
} from "../lib/planners/downloads";
const key = "pps-startup-checklist-v1";
let plan = restore(key, parseChecklist) || newChecklist();
let openOnly = false;
const profile = element<HTMLFormElement>("practice-profile");
const list = element("checklist-tasks");
function fill() {
  for (const [name, value] of Object.entries(plan.profile)) {
    const input = profile.elements.namedItem(name) as
      | HTMLInputElement
      | HTMLSelectElement;
    input.value = value;
  }
}
function summary() {
  const all = visibleTasks(plan);
  const complete = all.filter((t) => taskProgress(plan, t).done).length;
  element("checklist-count").textContent =
    `${complete} of ${all.length} tasks complete`;
  element("checklist-progress").style.width =
    `${all.length ? (complete / all.length) * 100 : 0}%`;
}
function render() {
  summary();
  const all = visibleTasks(plan).filter(
    (t) => !openOnly || !taskProgress(plan, t).done,
  );
  list.innerHTML =
    stages
      .map((stage, phase) => {
        const items = all.filter((t) => t.phase === phase);
        if (!items.length) return "";
        return `<section class="rs-phase" id="phase-0${phase + 1}"><div class="rs-phase-heading"><h3>${phase + 1}. ${stage}</h3><span class="rs-small">${items.length} tasks</span></div>${items
          .map((t) => {
            const p = taskProgress(plan, t);
            return `<article class="rs-task ${p.done ? "done" : ""}" data-task="${t.id}"><div class="rs-task-line"><input type="checkbox" id="done-${t.id}" data-field="done" ${p.done ? "checked" : ""}><label class="rs-task-title" for="done-${t.id}">${esc(t.title)}</label>${t.id.startsWith("custom-") ? `<button class="rs-icon-btn" data-remove="${t.id}" aria-label="Remove ${esc(t.title)}">Remove</button>` : ""}</div><p class="rs-task-desc">${esc(t.detail)}</p><details><summary>Owner, due date & notes${p.owner ? ` · ${esc(p.owner)}` : ""}${p.due ? ` · ${esc(p.due)}` : ""}</summary><div class="rs-task-fields"><div class="rs-field"><label for="owner-${t.id}">Owner</label><input id="owner-${t.id}" data-field="owner" value="${esc(p.owner)}" maxlength="100"></div><div class="rs-field"><label for="due-${t.id}">Due date</label><input type="date" id="due-${t.id}" data-field="due" value="${p.due}" min="2000-01-01" max="2100-12-31"></div><div class="rs-field wide"><label for="notes-${t.id}">Notes</label><textarea id="notes-${t.id}" data-field="notes" maxlength="2000" rows="2">${esc(p.notes)}</textarea></div></div></details></article>`;
          })
          .join("")}</section>`;
      })
      .join("") ||
    '<p class="rs-notice">All current tasks are complete. You can add your own tasks below.</p>';
}
profile.addEventListener("submit", (e) => e.preventDefault());
profile.addEventListener("change", () => {
  if (!profile.reportValidity()) return;
  const data = new FormData(profile);
  for (const name of Object.keys(plan.profile) as Array<keyof Profile>)
    plan.profile[name] = String(data.get(name) || "");
  store(key, plan);
  render();
});
list.addEventListener("input", (event) => {
  const input = event.target as HTMLInputElement | HTMLTextAreaElement;
  if (!input.dataset.field || !input.checkValidity()) return;
  const id = input.closest<HTMLElement>("[data-task]")!.dataset.task!;
  const task = visibleTasks(plan).find((t) => t.id === id)!;
  const progress = {
    ...(plan.progress[task.id] || {
      done: false,
      owner: "",
      due: null,
      notes: "",
    }),
  };
  if (input.dataset.field === "done")
    progress.done = (input as HTMLInputElement).checked;
  else if (["owner", "due", "notes"].includes(input.dataset.field))
    progress[input.dataset.field as "owner" | "due" | "notes"] = input.value;
  plan.progress[id] = progress;
  store(key, plan);
  input.closest(".rs-task")?.classList.toggle("done", progress.done);
  summary();
  if (input.dataset.field === "done" && openOnly) {
    const index = [...list.querySelectorAll("input[type=checkbox]")].indexOf(input);
    render();
    const next = list.querySelectorAll<HTMLInputElement>("input[type=checkbox]");
    (next[Math.min(index, next.length - 1)] || element("show-all")).focus();
  }
});
list.addEventListener("click", (e) => {
  const button = (e.target as HTMLElement).closest<HTMLElement>(
    "[data-remove]",
  );
  if (!button) return;
  const id = button.dataset.remove!;
  plan.custom = plan.custom.filter((t) => t.id !== id);
  delete plan.progress[id];
  store(key, plan);
  render();
  element<HTMLInputElement>("custom-title").focus();
  status("Custom task removed.");
});
for (const [id, value] of [
  ["show-all", false],
  ["show-open", true],
] as const)
  element(id).addEventListener("click", () => {
    openOnly = value;
    element("show-all").setAttribute("aria-pressed", String(!value));
    element("show-open").setAttribute("aria-pressed", String(value));
    render();
  });
element("custom-task").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = element<HTMLInputElement>("custom-title");
  if (!input.value.trim()) return;
  if (plan.custom.length >= 100) {
    status("You can add up to 100 custom tasks.", true);
    return;
  }
  plan.custom.push({
    id: `custom-${crypto.randomUUID()}`,
    title: input.value.trim(),
    phase: Number(element<HTMLSelectElement>("custom-phase").value),
    detail: "Your custom task.",
    weeks: 0,
  });
  input.value = "";
  store(key, plan);
  render();
  status("Your task has been added.");
});
element("backup-plan").addEventListener("click", () => saveBackup(plan));
element("restore-plan").addEventListener("click", () =>
  element<HTMLInputElement>("backup-file").click(),
);
element("backup-file").addEventListener("change", (e) =>
  importPlan(e.target as HTMLInputElement, parseChecklist, (p) => {
    plan = p;
    store(key, plan);
    fill();
    render();
  }),
);
element("reset-plan").addEventListener("click", () => {
  if (
    !confirm(
      "Start a new checklist? This replaces your saved plan on this browser. Download a backup first to keep it.",
    )
  )
    return;
  plan = newChecklist();
  store(key, plan);
  fill();
  render();
  status("A new checklist is ready.");
});
for (const [id, fn] of [
  ["checklist-xlsx", checklistExcel],
  ["checklist-pdf", checklistPdf],
] as const) {
  const b = element<HTMLButtonElement>(id);
  b.addEventListener("click", () => {
    if (profile.reportValidity()) exportPlan(b, () => fn(structuredClone(plan)));
  });
}
fill();
render();
document.documentElement.classList.add("rs-js");
