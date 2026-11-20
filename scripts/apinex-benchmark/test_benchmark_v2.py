import importlib.util
import json
import pathlib
import threading
import time
import unittest
from unittest import mock

ROOT = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("benchmark_run", ROOT / "run.py")
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
from response_validation import validate_response

batch_spec = importlib.util.spec_from_file_location("benchmark_batch", ROOT / "run_batch.py")
batch_runner = importlib.util.module_from_spec(batch_spec)
batch_spec.loader.exec_module(batch_runner)

CONFIG = json.loads((ROOT / "config.json").read_text(encoding="utf-8"))


def sample_from_schema(schema):
    kind = schema.get("type")
    if "enum" in schema:
        return schema["enum"][0]
    if kind == "object":
        return {
            key: sample_from_schema(value)
            for key, value in schema.get("properties", {}).items()
            if key in schema.get("required", [])
        }
    if kind == "array":
        count = schema.get("minItems", 1)
        return [sample_from_schema(schema.get("items", {"type": "string"})) for _ in range(count)]
    if kind == "string":
        return "test"
    if kind == "boolean":
        return False
    if kind in ("number", "integer"):
        return 0
    if kind == "null":
        return None
    return None


def valid_task_payload(task):
    payload = sample_from_schema(CONFIG["tasks"][task]["response_schema"])
    if task == "C":
        payload = {
            "positions": {
                "Ascendant": {"sign": "Pisces", "degree_in_sign": 13.925929, "longitude_decimal": 343.925929},
                "Sun": {"sign": "Sagittarius", "degree_in_sign": 16.863212, "longitude_decimal": 256.863212},
                "Moon": {"sign": "Aquarius", "degree_in_sign": 6.468547, "longitude_decimal": 306.468547},
                "Rahu": {"sign": "Capricorn", "degree_in_sign": 24.729703, "longitude_decimal": 294.729703},
            },
            "ayanamsha_difference_arcseconds": 11.8404,
            "method_note": "degree_in_sign = longitude - sign lower bound; arcseconds = degree difference × 3600",
        }
    return payload



class ParallelDispatchTests(unittest.TestCase):
    def test_selected_models_are_dispatched_concurrently_for_one_task(self):
        lock = threading.Lock()
        active = 0
        maximum_active = 0

        def fake_run(alias, task, out_dir):
            nonlocal active, maximum_active
            self.assertEqual(task, "A")
            with lock:
                active += 1
                maximum_active = max(maximum_active, active)
            time.sleep(0.08)
            with lock:
                active -= 1
            return {"model_alias": alias, "status": "success"}

        aliases = ["m1", "m2", "m3", "m4"]
        with mock.patch.object(batch_runner, "run_one_model", side_effect=fake_run):
            results = batch_runner.run_models_in_parallel(aliases, "A", pathlib.Path("."), 4)

        self.assertEqual(set(results), set(aliases))
        self.assertTrue(all(row["status"] == "success" for row in results.values()))
        self.assertGreater(maximum_active, 1)


class RoutingTests(unittest.TestCase):
    def test_exact_returned_id_is_match(self):
        self.assertEqual(runner.evaluate_routing("free/model-a", "free/model-a"), "exact_match")

    def test_different_returned_id_is_mismatch(self):
        self.assertEqual(runner.evaluate_routing("free/model-a", "free/model-b"), "mismatch")

    def test_missing_returned_id_is_unverified(self):
        self.assertEqual(runner.evaluate_routing("free/model-a", None), "missing_returned_model")


class ResponseValidationTests(unittest.TestCase):
    def test_every_atomic_task_accepts_valid_schema_payload(self):
        self.assertEqual(list(CONFIG["tasks"]), list("ABCDEFGHIJ"))
        for task in CONFIG["tasks"]:
            with self.subTest(task=task):
                result = validate_response(task, json.dumps(valid_task_payload(task)), CONFIG)
                self.assertTrue(result["valid"], result["errors"])

    def test_task_c_rejects_wrong_zodiac_sign(self):
        payload = valid_task_payload("C")
        payload["positions"]["Ascendant"]["sign"] = "Aquarius"
        self.assertFalse(validate_response("C", json.dumps(payload), CONFIG)["valid"])

    def test_task_c_rejects_wrong_ayanamsha_difference(self):
        payload = valid_task_payload("C")
        payload["ayanamsha_difference_arcseconds"] = 11850.9972
        self.assertFalse(validate_response("C", json.dumps(payload), CONFIG)["valid"])

    def test_task_b_rejects_wrong_nested_array_item_type(self):
        payload = valid_task_payload("B")
        payload["minimum_inputs_by_system"]["western"] = [42]
        self.assertFalse(validate_response("B", json.dumps(payload), CONFIG)["valid"])

    def test_task_i_requires_boolean_and_rejects_self_report_as_proof(self):
        payload = valid_task_payload("I")
        payload["self_report_is_proof"] = "false"
        self.assertFalse(validate_response("I", json.dumps(payload), CONFIG)["valid"])
        payload["self_report_is_proof"] = True
        self.assertFalse(validate_response("I", json.dumps(payload), CONFIG)["valid"])

    def test_duplicate_json_keys_are_rejected(self):
        raw = '{"verified_facts":["one"],"verified_facts":["two"],"unverified_leads":["lead"],"risk_ranking":["risk"],"test_plan":["test"],"do_not_claim":["claim"],"overall_assessment":"unknown"}'
        self.assertFalse(validate_response("A", raw, CONFIG)["valid"])

    def test_malformed_json_is_rejected(self):
        self.assertFalse(validate_response("A", '{"verified_facts":', CONFIG)["valid"])

    def test_markdown_fence_is_rejected(self):
        fence = chr(96) * 3
        self.assertFalse(validate_response("A", fence + 'json\n{}\n' + fence, CONFIG)["valid"])

    def test_task_j_requires_complete_user_answer(self):
        payload = {"user_facing_answer": "hello"}
        self.assertFalse(validate_response("J", json.dumps(payload), CONFIG)["valid"])


if __name__ == "__main__":
    unittest.main()
