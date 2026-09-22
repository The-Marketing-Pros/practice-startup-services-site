
## Engineering protocol rollout

Read [engineering protocol](docs/engineering-protocol.md), [developer handoff](docs/developer-handoff.md) and [repository governance](docs/repository-governance.md). Preserve existing architecture, files, branches and unrelated work. Use isolated PR branches.

Andrew Eriksen (`@ppsonline`) is the sole human owner. Independent reviews may be performed by agents, including Iris, Alf or Charlie, and must be labeled as agent reviews with their actual identity and evidence. No second human reviewer is required. GitHub authors cannot approve their own PRs; use an eligible non-author agent review when a required approval is configured. Do not require CODEOWNERS approval from Andrew on a PR authored as `ppsonline`, invent another human gate, or use a routine bypass. Record Andrew's actual authorization separately from agent verification.

Keep actual V1 implementer checks and independent R1/R2 agent reviews separate, with exact snapshots and limitations. Use the adopted code-review-loop within current authorization. After every five newly integrated PRs perform [the combined audit](docs/integration-audit-protocol.md), including **The eleventh thing**. Do not claim tests or reviews that did not run.
