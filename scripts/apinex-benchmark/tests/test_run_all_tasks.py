import importlib.util
import pathlib
import unittest

SCRIPT = pathlib.Path(__file__).parents[1] / "run_all_tasks.py"
SPEC = importlib.util.spec_from_file_location("run_all_tasks", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class AllTasksSummaryTests(unittest.TestCase):
    def test_combines_all_seven_tasks_and_counts_results(self):
        summaries = {
            task: {
                "success_count": 1,
                "failure_count": 0,
                "results": [{"model_alias": "model-a", "status": "success"}],
            }
            for task in MODULE.TASKS
        }
        combined = MODULE.build_combined_summary(summaries, ["model-a"])
        self.assertEqual(combined["tasks"], ["A", "B", "C", "D", "E", "F", "G"])
        self.assertEqual(combined["request_count_planned"], 7)
        self.assertEqual(combined["request_count_reported"], 7)
        self.assertEqual(combined["success_count"], 7)
        self.assertEqual(combined["failure_count"], 0)
        self.assertEqual(combined["overall_status"], "success")
        self.assertEqual({row["task"] for row in combined["results"]}, set(MODULE.TASKS))

    def test_missing_or_failed_results_cannot_be_reported_as_success(self):
        summaries = {
            task: {"results": [{"model_alias": "model-a", "status": "success"}]}
            for task in MODULE.TASKS[:-1]
        }
        summaries["G"] = {"results": [{"model_alias": "model-a", "status": "invalid_json"}]}
        combined = MODULE.build_combined_summary(summaries, ["model-a"])
        self.assertEqual(combined["success_count"], 6)
        self.assertEqual(combined["failure_count"], 1)
        self.assertEqual(combined["overall_status"], "partial_success")


if __name__ == "__main__":
    unittest.main()
