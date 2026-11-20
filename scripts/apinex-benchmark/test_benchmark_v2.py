import importlib.util
import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("benchmark_run", ROOT / "run.py")
runner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(runner)
from response_validation import validate_response

CONFIG = json.loads((ROOT / "config.json").read_text(encoding="utf-8"))


def sample_from_schema(schema):
    kind = schema.get("type")
    if kind == "object":
        return {key: sample_from_schema(value) for key, value in schema.get("properties", {}).items() if key in schema.get("required", [])}
    if kind == "array":
        return []
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
    if task == "A":
        payload["numeric_fixture"] = {
            "positions": {
                "Ascendant": {"sign":"Pisces","degree_in_sign":13.925929,"longitude_decimal":343.925929},
                "Sun": {"sign":"Sagittarius","degree_in_sign":16.863212,"longitude_decimal":256.863212},
                "Moon": {"sign":"Aquarius","degree_in_sign":6.468547,"longitude_decimal":306.468547},
                "Rahu": {"sign":"Capricorn","degree_in_sign":24.729703,"longitude_decimal":294.729703}
            },
            "ayanamsha_difference_arcseconds":11.8404,
            "method_note":"Reference longitude conversion."
        }
    return payload


class RoutingTests(unittest.TestCase):
    def test_exact_returned_id_is_match(self):
        self.assertEqual(runner.evaluate_routing("free/model-a", "free/model-a"), "exact_match")

    def test_different_returned_id_is_mismatch(self):
        self.assertEqual(runner.evaluate_routing("free/model-a", "free/model-b"), "mismatch")

    def test_missing_returned_id_is_unverified(self):
        self.assertEqual(runner.evaluate_routing("free/model-a", None), "missing_returned_model")


class ResponseValidationTests(unittest.TestCase):
    def test_every_composite_task_accepts_valid_schema_payload(self):
        for task in CONFIG["tasks"]:
            with self.subTest(task=task):
                result = validate_response(task, json.dumps(valid_task_payload(task)), CONFIG)
                self.assertTrue(result["valid"], result["errors"])

    def test_task_a_rejects_wrong_zodiac_sign(self):
        payload = valid_task_payload("A")
        payload["numeric_fixture"]["positions"]["Ascendant"]["sign"] = "Aquarius"
        self.assertFalse(validate_response("A", json.dumps(payload), CONFIG)["valid"])

    def test_task_d_rejects_wrong_provider_honesty_boolean(self):
        payload = valid_task_payload("D")
        payload["provider_identity"]["self_report_is_proof"] = "false"
        self.assertFalse(validate_response("D", json.dumps(payload), CONFIG)["valid"])

    def test_task_a_rejects_wrong_nested_array_item_type(self):
        payload = valid_task_payload("A")
        payload["astrology_domain"]["minimum_inputs_by_system"]["western"] = [42]
        self.assertFalse(validate_response("A", json.dumps(payload), CONFIG)["valid"])

    def test_duplicate_json_keys_are_rejected(self):
        raw = '{"calculation_integrity":{},"calculation_integrity":{},"astrology_domain":{},"numeric_fixture":{}}'
        self.assertFalse(validate_response("A", raw, CONFIG)["valid"])

    def test_task_e_requires_complete_user_answer(self):
        payload = {"user_facing_answer":{"user_facing_answer":"hello"}}
        self.assertFalse(validate_response("E", json.dumps(payload), CONFIG)["valid"])


if __name__ == "__main__":
    unittest.main()
