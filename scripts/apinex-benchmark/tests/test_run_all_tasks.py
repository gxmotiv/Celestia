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
                "results": [{"model_alias": "model-a", "status": "success"}],
            }
            for task in MODULE.TASKS
        }
        combined = MODULE.build_combined_summary(summaries, ["model-a"])
        self.assertEqual(combined["tasks"], list("ABCDEFGHIJ"))
        self.assertEqual(combined["request_count_planned"], 10)
        self.assertEqual(combined["request_count_reported"], 10)
        self.assertEqual(combined["success_count"], 10)
        self.assertEqual(combined["failure_count"], 0)
        self.assertEqual(combined["overall_status"], "success")
        self.assertEqual({row["task"] for row in combined["results"]}, set(MODULE.TASKS))

    def test_full_twelve_model_suite_would_require_120_requests(self):
        combined = MODULE.build_combined_summary({}, [f"model-{i}" for i in range(12)])
        self.assertEqual(combined["request_count_planned"], 120)
        self.assertEqual(combined["request_count_reported"], 0)
        self.assertNotEqual(combined["overall_status"], "success")

    def test_missing_or_failed_results_cannot_be_reported_as_success(self):
        summaries = {
            task: {"results": [{"model_alias": "model-a", "status": "success"}]}
            for task in MODULE.TASKS[:-1]
        }
        summaries[MODULE.TASKS[-1]] = {
            "results": [{"model_alias": "model-a", "status": "invalid_json"}]
        }
        combined = MODULE.build_combined_summary(summaries, ["model-a"])
        self.assertEqual(combined["success_count"], len(MODULE.TASKS) - 1)
        self.assertEqual(combined["failure_count"], 1)
        self.assertEqual(combined["overall_status"], "partial_success")


if __name__ == "__main__":
    unittest.main()
