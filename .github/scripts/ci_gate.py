"""Fail closed over the complete CI dependency result set; no network or secrets."""
import json
import os
import sys

REQUIRED = ['verify', 'gate-contract']
REMOTE = []


def evaluate(needs):
    if not isinstance(needs, dict) or set(needs) != set(REQUIRED + REMOTE):
        raise ValueError("Missing or unexpected CI dependencies")
    for job in REQUIRED + REMOTE:
        if not isinstance(needs[job], dict):
            raise ValueError(f"Malformed result for {job}")
    for job in REQUIRED:
        if needs[job].get("result") != "success":
            raise ValueError(f"Required job {job} did not succeed")
    if REMOTE:
        outputs = needs["remote-test-config"].get("outputs")
        if not isinstance(outputs, dict):
            raise ValueError("Missing remote test configuration output")
        configured = outputs.get("configured")
        if configured not in ("true", "false"):
            raise ValueError("Invalid remote test configuration output")
        expected = "success" if configured == "true" else "skipped"
        for job in REMOTE:
            if needs[job].get("result") != expected:
                raise ValueError(f"Remote job {job} must be {expected}")
        if configured == "false":
            return "Local CI passed. Remote RLS/RPC were NOT RUN: dedicated test configuration is incomplete."
    return "All configured CI validation passed."


def main():
    try:
        message = evaluate(json.loads(os.environ["CI_NEEDS"]))
    except (KeyError, ValueError, TypeError) as error:
        # Never dump the input: it can contain other jobs' outputs.
        print(f"::error::CI gate failed: {error}", file=sys.stderr)
        return 1
    print(message)
    if "GITHUB_STEP_SUMMARY" in os.environ:
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as summary:
            summary.write(message + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
