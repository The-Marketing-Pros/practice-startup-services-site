import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
const component = readFileSync(new URL("../src/components/OpenAIPixel.astro", import.meta.url), "utf8");
const script = component.split("<script is:inline>")[1].split("</script>")[0];
function run(hostname: string, existing?: unknown) {
  const scripts: unknown[] = [];
  const w = { oaiq: existing } as { oaiq?: { q: unknown[] } };
  const context = { window: w, location: { hostname }, document: { createElement: () => ({}), head: { appendChild: (s: unknown) => scripts.push(s) } } };
  runInNewContext(script, context);
  return { w, scripts, context };
}
test("only PSS production domains queue one SDK init and an explicit page view", () => {
  for (const host of ["practicestartupservices.com", "www.practicestartupservices.com"]) {
    const result = run(host);
    runInNewContext(script, result.context);
    assert.equal(result.scripts.length, 1);
    const queued = Array.from(result.w.oaiq!.q, (args: any) => Array.from(args));
    assert.equal(JSON.stringify(queued), JSON.stringify([
      ["init", { pixelId: "R5NpCwe1ExEDMYvfTv7AAj" }],
      ["measure", "page_viewed", { type: "contents" }],
    ]));
  }
});
test("previews, local builds and lookalike hosts never load the production SDK", () => {
  for (const host of ["localhost", "127.0.0.1", "practice-startup-services.pages.dev", "practicestartupservices.com.evil.test"]) {
    const result = run(host);
    assert.equal(result.scripts.length, 0);
    assert.equal(result.w.oaiq, undefined);
  }
});
