export function element<T = HTMLElement>(id: string) {
  const el = document.getElementById(id);
  if (!el) throw Error(`Missing ${id}`);
  return el as unknown as T;
}
export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
export function status(message: string, error = false) {
  const el = element("planner-status");
  el.textContent = message;
  el.classList.toggle("error", error);
}
export function store(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    element("save-status").textContent = "Saved on this browser.";
  } catch {
    element("save-status").textContent =
      "Browser saving is unavailable. Download a backup to keep your work.";
  }
}
export function restore<T>(
  key: string,
  parse: (raw: unknown) => T,
): T | undefined {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return parse(JSON.parse(raw));
  } catch {
    element("save-status").textContent =
      "Saved data could not be restored. Import a backup or start a new plan.";
  }
  return undefined;
}
export async function importPlan<T>(
  input: HTMLInputElement,
  parse: (raw: unknown) => T,
  onPlan: (plan: T) => void,
) {
  try {
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 500000) throw Error("Choose a backup smaller than 500 KB.");
    const plan = parse(JSON.parse(await file.text()));
    if (
      !confirm(
        "Replace the current plan with this backup? Download a backup first if you want to keep both.",
      )
    )
      return;
    onPlan(plan);
    status("Your backup has been restored.");
  } catch (e) {
    status(
      e instanceof Error ? e.message : "The backup could not be read.",
      true,
    );
  } finally {
    input.value = "";
  }
}
export async function exportPlan(
  button: HTMLButtonElement,
  fn: () => Promise<void>,
) {
  button.disabled = true;
  status("Preparing your download…");
  try {
    await fn();
    status("Your download is ready. Check your browser downloads.");
  } catch (error) {
    if (import.meta.env.DEV) console.error(error);
    status(
      "The download could not be created. Please try again, or download a backup to keep your work.",
      true,
    );
  } finally {
    button.disabled = false;
  }
}
