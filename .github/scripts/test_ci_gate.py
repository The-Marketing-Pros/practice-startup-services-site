import copy
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import unittest

import ci_gate

ROOT = Path(__file__).resolve().parents[2]


def successful(configured="true"):
    needs = {job: {"result": "success"} for job in ci_gate.REQUIRED + ci_gate.REMOTE}
    if ci_gate.REMOTE:
        needs["remote-test-config"]["outputs"] = {"configured": configured}
        if configured == "false":
            for job in ci_gate.REMOTE:
                needs[job]["result"] = "skipped"
    return needs


class GateTests(unittest.TestCase):
    def test_pass(self):
        self.assertIn("passed", ci_gate.evaluate(successful()))

    def test_each_required_failure_cancellation_skip_missing_and_unknown(self):
        for job in ci_gate.REQUIRED:
            for result in ("failure", "cancelled", "skipped", "neutral", "", None):
                with self.subTest(job=job, result=result):
                    needs = successful()
                    needs[job]["result"] = result
                    with self.assertRaises(ValueError):
                        ci_gate.evaluate(needs)

    def test_removed_dependency_fails(self):
        for job in ci_gate.REQUIRED + ci_gate.REMOTE:
            needs = successful()
            del needs[job]
            with self.assertRaises(ValueError):
                ci_gate.evaluate(needs)

    def test_malformed_and_unexpected_dependencies_fail(self):
        for needs in (None, [], {}, {**successful(), "forgotten-job": {"result": "success"}}):
            with self.assertRaises(ValueError):
                ci_gate.evaluate(needs)
        for job in ci_gate.REQUIRED + ci_gate.REMOTE:
            needs = successful()
            needs[job] = None
            with self.assertRaises(ValueError):
                ci_gate.evaluate(needs)

    def test_remote_configuration_and_results(self):
        if not ci_gate.REMOTE:
            return
        self.assertIn("NOT RUN", ci_gate.evaluate(successful("false")))
        for config in (None, {}, {"configured": ""}, {"configured": True}):
            needs = successful()
            needs["remote-test-config"]["outputs"] = config
            with self.assertRaises(ValueError):
                ci_gate.evaluate(needs)
        for configured, allowed in (("true", "success"), ("false", "skipped")):
            for job in ci_gate.REMOTE:
                for state in ("failure", "cancelled", "skipped", "success", None):
                    if state == allowed:
                        continue
                    needs = successful(configured)
                    needs[job]["result"] = state
                    with self.assertRaises(ValueError):
                        ci_gate.evaluate(needs)

    def test_cli_fails_on_missing_or_invalid_input(self):
        for raw in (None, "{", "[]", "{}"):
            env = {k: v for k, v in os.environ.items() if k not in ("CI_NEEDS", "GITHUB_STEP_SUMMARY")}
            if raw is not None:
                env["CI_NEEDS"] = raw
            result = subprocess.run([sys.executable, str(Path(ci_gate.__file__))], env=env, capture_output=True)
            self.assertEqual(result.returncode, 1)

    def test_cli_success(self):
        env = {k: v for k, v in os.environ.items() if k != "GITHUB_STEP_SUMMARY"}
        env["CI_NEEDS"] = json.dumps(successful())
        result = subprocess.run([sys.executable, str(Path(ci_gate.__file__))], env=env, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_workflow_covers_every_job_and_change_category(self):
        # Guard the workflow wiring, not just the Python function. The workflow
        # intentionally uses simple two-space job headings and an inline needs list.
        workflow = (ROOT / ".github/workflows/engineering-protocol.yml").read_text()
        triggers, jobs = workflow.split("jobs:\n", 1)
        self.assertIn("pull_request:", triggers)
        self.assertNotRegex(triggers, r"(?m)^\s*paths(?:-ignore)?:")
        self.assertNotIn("continue-on-error:", jobs)
        job_ids = set(re.findall(r"(?m)^  ([a-z][a-z0-9-]*):$", jobs))
        expected = set(ci_gate.REQUIRED + ci_gate.REMOTE)
        self.assertEqual(job_ids, expected | {"required-ci"})
        gate = jobs.split("  required-ci:\n", 1)[1]
        needs = re.search(r"needs: \[(.*?)\]", gate).group(1)
        self.assertEqual({item.strip() for item in needs.split(",")}, expected)
        self.assertIn("if: ${{ always() }}", gate)
        self.assertIn("CI_NEEDS: ${{ toJSON(needs) }}", gate)
        self.assertIn("python3 .github/scripts/ci_gate.py", gate)
        # With no path dispatch, docs-only, frontend, backend, and combined
        # changes all execute the same complete local suite and configuration check.
        for category in ("docs-only", "frontend-only", "backend-only", "combined", "workflow", "lockfile"):
            with self.subTest(category=category):
                for job in ci_gate.REQUIRED:
                    block = re.split(r"(?m)^  [a-z][a-z0-9-]*:$", jobs.split(f"  {job}:\n", 1)[1])[0]
                    self.assertNotRegex(block, r"(?m)^    if:")


if __name__ == "__main__":
    unittest.main()
