# Cloudflare research provider compatibility — 2026-10-15

Andrew asked to finish FRED integration after supplying the key in Cloudflare. This owner authorization is separate from verification. Production PR30 deployed but its FRED calls failed before reaching the provider. Cloudflare's official workerd source rejects `redirect: error` and recommends `manual` with status checks. This change applies that correction to FRED and the same defect in Brave. Existing non-OK checks reject redirects without forwarding credentials. FRED logs only fixed series IDs and sanitized failure-stage codes.

Base: `473b4d7351de24c3cb56699193feafa5a6735d42`.
Frozen implementation: `d8f20e19467da6175c2a6b0b721cd7c25a910d08`.
Binary diff SHA-256: `1a415054a687db9943c17c0bb7cebdd6a76c9d3779d733d930da4fd3286aebe7`.
Runtime source: https://raw.githubusercontent.com/cloudflare/workerd/main/src/workerd/api/http.c++

## V1 implementer checks

`/root`, inherited model (actual identifier unavailable):120 Node tests passed;8 Python CI gate tests passed; Astro check0 errors/0 warnings/4 existing hints; production build71 pages; whitespace check passed. Regression tests cover3xx rejection, provider HTTP errors, no failed-result caching and secret-safe outputs. No UI or PDF behavior changed. Hosted preview and production acceptance results will be recorded in the PR after they run, not inferred from Node tests.

## Independent reviews

R1 and R2 independently reviewed all four changed files at the exact frozen snapshot and verified the digest. Both requested the inherited model; actual identifiers unavailable. These are agent reviews, not GitHub approvals. No source edits by reviewers.

- R1 `/root/consulting_r1`: PASS, no findings.50 affected tests passed. Independent probes covered network, non-JSON, malformed data, missing observations and HTTP303; diagnostics, no failed caches and no credential/body/destination leakage verified. Whitespace check passed.
- R2 `/root/consulting_r2`: PASS, no actionable findings.12 affected tests passed. Additional network/non-JSON/invalid-data/no-data probes verified diagnostics and no injected-secret leakage. Working tree clean.

Both inspected official workerd source; neither ran workerd or live upstream/browser/deployment acceptance. V1 results are not relabeled independent. The receipt commit is evidence only; it does not alter the reviewed implementation. Hosted CI links and live acceptance will be added to the PR after completion.

## Limits

Census authentication and full-report configuration remain incomplete and are not enabled by this patch. Brave is regression-tested but the gated live path remains off. This fix is integration4/5 following PR28,29,30; combined audit is due after the next integrated PR.
