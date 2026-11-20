import importlib.util
import pathlib
import unittest

SCRIPT = pathlib.Path(__file__).parents[1] / "run_all_tasks.py"
SPEC = importlib.util.spec_from_file_location("run_all_tasks", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class AllTasksSummaryTests(unittest.TestCase):
    def test_combines_all_ten_configured_atomic_tasks_and_counts_results(self):
        summaries = {
            task: {
                "success_count": 1,
                "failure_count": 0,
                "results": [{"model_alias": "model-a", "trial": 1, "api_attempt_count": 1, "status": "success"}],
            }
            for task in MODULE.TASKS
        }
        combined = MODULE.build_combined_summary(summaries, ["model-a"])
        self.assertEqual(combined["tasks"], list("ABCDEFGHIJ"))
        self.assertEqual(combined["request_count_planned"], 10)
        self.assertEqual(combined["request_count_reported"], 10)
        self.assertEqual(combined["request_count_attempted"], 10)
        self.assertEqual(combined["api_attempt_count_reported"], 10)
        self.assertEqual(combined["success_count"], 10)
        self.assertEqual(combined["failure_count"], 0)
        self.assertEqual(combined["overall_status"], "success")
        self.assertEqual({row["task"] for row in combined["results"]}, set(MODULE.TASKS))

    def test_suite_stops_on_quota_and_rate_limit_errors(self):
        for code in (401, 402, 403, 429):
            with self.subTest(http_status=code):
                condition = MODULE.find_suite_abort_condition({
                    "results": [{"model_alias": "model-a", "http_status": code, "status": "http_error"}]
                })
                self.assertIsNotNone(condition)
                self.assertEqual(condition["http_status"], code)

    def test_non_quota_response_failure_does_not_abort_other_tasks(self):
        condition = MODULE.find_suite_abort_condition({
            "results": [{"model_alias": "model-a", "http_status": 200, "status": "schema_invalid"}]
        })
        self.assertIsNone(condition)

    def test_combined_summary_reports_skipped_requests_after_early_stop(self):
        summaries = {
            "A": {"results": [{"model_alias": "model-a", "api_attempt_count": 1, "status": "success"}]},
            "B": {"results": [{"model_alias": "model-a", "api_attempt_count": 1, "status": "http_error", "http_status": 429}]},
        }
        skipped = list("CDEFGHIJ")
        for task in skipped:
            summaries[task] = {"results": []}
        combined = MODULE.build_combined_summary(
            summaries, ["model-a"], concurrency=4,
            stopped_early_reason={"http_status": 429},
            skipped_tasks=skipped,
        )
        self.assertEqual(combined["request_count_planned"], 10)
        self.assertEqual(combined["request_count_reported"], 2)
        self.assertEqual(combined["request_count_not_attempted"], 8)
        self.assertEqual(combined["failure_count"], 1)
        self.assertEqual(combined["skipped_tasks"], skipped)
        self.assertEqual(combined["max_parallel_models_per_task"], 4)

    def test_full_twelve_model_suite_would_require_120_first_pass_requests(self):
        combined = MODULE.build_combined_summary({}, [f"model-{i}" for i in range(12)])
        self.assertEqual(combined["request_count_planned"], 120)
        self.assertEqual(combined["request_count_attempted"], 0)
        self.assertEqual(combined["request_count_not_attempted"], 120)
        self.assertEqual(combined["request_count_reported"], 0)
        self.assertNotEqual(combined["overall_status"], "success")

    def test_three_trials_require_360_first_pass_requests_for_twelve_models(self):
        combined = MODULE.build_combined_summary(
            {}, [f"model-{i}" for i in range(12)], trials=3
        )
        self.assertEqual(combined["trials_per_model_task"], 3)
        self.assertEqual(combined["request_count_planned"], 360)
        self.assertEqual(combined["request_count_not_attempted"], 360)

    def test_shared_guard_skips_are_not_counted_as_api_failures(self):
        summaries = {
            "A": {"results": [
                {"model_alias": "model-a", "api_attempt_count": 1, "status": "http_error", "http_status": 429},
                {"model_alias": "model-b", "api_attempt_count": 0, "status": "skipped_after_shared_guard"},
            ]}
        }
        combined = MODULE.build_combined_summary(
            summaries, ["model-a", "model-b"], trials=1, stopped_early_reason={"http_status": 429},
            skipped_tasks=list("BCDEFGHIJ"),
        )
        self.assertEqual(combined["request_count_attempted"], 1)
        self.assertEqual(combined["request_count_not_attempted"], 19)
        self.assertEqual(combined["failure_count"], 1)
        self.assertEqual(combined["skipped_count"], 1)

    def test_missing_or_failed_results_cannot_be_reported_as_success(self):
        summaries = {
            task: {"results": [{"model_alias": "model-a", "status": "success"}]}
            for task in MODULE.TASKS[:-1]
        }
        summaries[MODULE.TASKS[-1]] = {
            "results": [{"model_alias": "model-a", "api_attempt_count": 1, "status": "invalid_json"}]
        }
        combined = MODULE.build_combined_summary(summaries, ["model-a"])
        self.assertEqual(combined["success_count"], len(MODULE.TASKS) - 1)
        self.assertEqual(combined["failure_count"], 1)
        self.assertEqual(combined["overall_status"], "partial_success")


if __name__ == "__main__":
    unittest.main()
