# Research activation and retry repair — 2026-10-15

Owner authorization: Andrew asked to fix and enable Census demographics, competitor research and the written report/PDF. This authorization is separate from agent verification. No additional human approval is required by the repository protocol. Full provider acceptance remains incomplete; this repair does not claim otherwise.

Base: `37fa2c54d8a67d68201f80ccf909b32e02f9114c`.
Final reviewed implementation: `00d948317e68422bb6b724bbbae3cbdbf52bb79e`.
Whole binary diff SHA-256: `47405ce9c0f5dc463280e78c7339d69a3cd152885e70fcbb4c64175c394dc2e0`.

## Verification and independent reviews

All reviews were separate agent assignments required by AGENTS.md. Requested models inherited the session default; actual model identifiers were unavailable. No review below is a GitHub approval.

| Channel / round | Agent and role | Exact head | Verdict and evidence |
| --- | --- | --- | --- |
| V1 | /root, implementer | 00d948317e68422bb6b724bbbae3cbdbf52bb79e | PASS locally:111 Node tests,8 CI gate tests,Astro check0 errors/0 warnings/4 existing hints,production build71 pages,diff check. |
| R1 /1 | /root/consulting_r1, independent | a80bd14523ef411d2e2741a08eb09b9fcaa90b7d | Changes required:P2 migration default could repeat a pre-upgrade ambiguous submission. Independently reproduced old handler acceptance/response loss → migration → new handler duplicate.39 tests passed. |
| R2 /1 | /root/consulting_r2, independent | a80bd14523ef411d2e2741a08eb09b9fcaa90b7d | Changes required:P2 frontend discarded system recovery instructions/reference. Reproduced actual message selection.111 tests,8 gate tests,check/build passed. |
| R1 /2 | /root/consulting_r1, independent | 8d6a1b537ed84b6fb4c4afde8ba43ae66ec39522 | PASS:conservative migration backfill and drain instructions resolve prior finding. Repeated old→new probe:three retries blocked,one HubSpot call; confirmed receipt resumes without repost.49 tests/check passed. |
| R2 /2 | /root/consulting_r2, independent | 8d6a1b537ed84b6fb4c4afde8ba43ae66ec39522 | PASS:system recovery instructions now selected and rendered as text.111 tests/check/build passed; migration matrix checked all8 job/submission status combinations. |
| R1 /3 | /root/consulting_r1, independent | 00d948317e68422bb6b724bbbae3cbdbf52bb79e | PASS:Census diagnostic delta reviewed atop prior receipt. Only internal error codes logged; surrounding key whitespace removed.63 targeted tests/diff check passed. |
| R2 /3 | /root/consulting_r2, independent | 00d948317e68422bb6b724bbbae3cbdbf52bb79e | PASS:Census logger/whitespace delta reviewed atop prior receipt.111 tests/check passed. |

Round1 diff digest:`7c8337d85b1e4144a26708a6c8a2ffb85c0496a33e8134aecdb3b7eb49722d49`.
Round2 diff digest:`b74590d2fe07eabd8fe5aa2d11f65ef329332236fadf3f11589e3540fd522393`.
Each reviewer independently verified its digest and clean worktree. The evidence-only commit containing this record is after the reviewed implementation and has no runtime change.

Limits:independent tests used local SQLite and stubbed providers. They do not establish live provider correctness. Census diagnostics intentionally exclude URLs, credentials, bodies and exception messages. This fixes the combined audit's accepted-but-lost HubSpot retry defect, with manual reconciliation for genuinely ambiguous attempts.

## Production configuration evidence (implementer only)

- Existing Census,Brave and OpenAI secret names found; no values exposed or replaced.
- Created dedicated `pss-startup-research` D1 database `61725c37-d236-4a8a-a9a2-00c9691937f5`, verified no research_jobs table before0001, applied0001/0002 and bound production as RESEARCH_DB.
- Generated a server-only random32-byte RESEARCH_HASH_SECRET through stdin. No value saved in source or logs.
- Redeployed existing main37fa2c5 as Cloudflare deployment `8de0623f-5837-43d2-a528-7c3ecc130ef1`; status success. Production availability now reports previewAvailable:true,available:false. Browser reload confirmed preview form enabled.
- Live physician/primary-care/10016 preview returned NPPES results but Census status:error. No claim of restored Census yet.
- Verified full gate remained unavailable and research_jobs count0; applied independently reviewed0003 before handler deployment. No historical production jobs required reconciliation.
- HubSpot login expired; owner sign-in requested. Turnstile API credential lacks widget scope. These and model/usage configuration remain full-report activation dependencies.

Hosted CI results belong on the PR after they run. Integration counter:PR28 is first integration after the prior five-PR audit; this repair will be second only when merged. No completed integration is claimed here.
