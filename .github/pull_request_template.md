## Change

Describe the trigger, resulting behavior and scope.

## Verification

List the checks actually run, their environments, failure paths and known gaps.

## Review evidence

Link a committed, sanitized record in `docs/reviews/` and the relevant CI runs. Preserve each round. Fill only channels that actually ran; a blank template is not a review.

| Channel | Reviewer role / independence | Requested / actual reported model | Date | Exact reviewed head / base | Scope, verdict, findings and dispositions | Evidence, CI links and limitations |
| --- | --- | --- | --- | --- | --- | --- |
| V1 | Implementer verification | Record or unavailable | | | | |

Add R1/R2 rows only for separately assigned independent reviews. Auxiliary models and repeated calls do not count as extra independent reviewers. Record unavailable/failed reviews as incomplete. Identify evidence-only commits separately; a code change after review requires re-review. No private source packets, credentials, raw provider logs or customer records in published evidence.

Owner authorization and agent review: Andrew is the sole human owner. Record his actual authorization and each independent agent review separately. No additional human approval is required. Never claim self-approval or an agent receipt is a GitHub review that did not occur.

Integration counter: list this PR's actual main integration when it occurs, the current batch, and the next five-PR audit boundary. No merge or deployment is authorized by completing this template.
