# Repository governance

Repository: `The-Marketing-Pros/practice-startup-services-site`. Adoption baseline: `c13072b7dcd42e88e8be775cf11b171db7ee9889`. Recorded 2026-09-12.

Andrew Eriksen (`@ppsonline`) is the sole human owner. Independent reviews may be performed by agents, including Iris, Alf or Charlie, and must be labeled as agent reviews with their actual identity and evidence. No second human reviewer is required. GitHub authors cannot approve their own PRs; use an eligible non-author agent review when a required approval is configured. Do not require CODEOWNERS approval from Andrew on a PR authored as `ppsonline`, invent another human gate, or use a routine bypass. Record Andrew's actual authorization separately from agent verification.

## Baseline and proposed controls

Classic main protection was not verified or not configured; see the saved settings snapshot. Existing settings and stronger satisfiable agent review rules must be preserved. The rollout proposes PR-only main changes, up-to-date GitHub Actions checks, resolved conversations, administrator enforcement and protection against force pushes and branch deletion. Required review settings must never depend on another human.

`required-ci` aggregates `.github/workflows/engineering-protocol.yml`. New PR verification runs npm ci, the existing Astro check command and the production build. Existing separate acceptance checks remain applicable. Configure a newly introduced check as required only after it has produced a successful hosted run. Its workflow must first be available to affected PRs; otherwise older PRs wait for a check they cannot run.

This branch's files are proposed until merged. Dependency graph, alerts, security updates and branch settings are live administrative controls; consult the actual saved settings/evidence rather than assuming this document enabled them. Weekly Dependabot update configuration takes effect only on the default branch. No automatic merge, access invitation or paid scanning is introduced.

## Evidence and remaining work

Hosting, form/scheduling destinations and browser accessibility are separate acceptance. No live deployment or asset replacement is performed.

Independent review and hosted checks must be linked in [the rollout record](reviews/engineering-protocol-rollout.md); no passing review is implied by this template.

## Integration boundary

0/5 new PR integrations after `c13072b7dcd42e88e8be775cf11b171db7ee9889`. Count all next five actual integrations into main, including this rollout only if merged, then run [the combined audit](integration-audit-protocol.md). Preserve previous rounds and source-presence evidence.
