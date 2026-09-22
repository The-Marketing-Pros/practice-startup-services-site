# Security and preservation

Andrew Eriksen (`@ppsonline`) is the repository owner. Report suspected vulnerabilities through an already established private channel; do not publish credentials, exploit details, private review packets or customer records. This file does not claim a reporting feature or scanner is enabled.

Preserve repository files, branches and history. Do not force-push, force-upgrade dependencies, modify production data or run destructive cleanup. Use the committed lockfile and the repo-specific package manager from the developer handoff. Review dependency PRs and relevant failure paths before an owner-authorized merge.

Keep provider/service-role keys server-side. CI verification uses synthetic configuration or a confirmed disposable local fixture, never a customer backend. Bound workflow token permissions to what each job needs. Never execute untrusted PR code with privileged pull_request_target credentials. Review receipts must contain only sanitized evidence.

Independent agent reviews are acceptable; Andrew is the sole human decision-maker. No second human approval is required. Review evidence, actual GitHub reviews, owner authorization and production acceptance are distinct records. This document does not itself authorize merge, deployment, messaging, new access or spending.
