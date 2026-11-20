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


class RoutingTests(unittest.TestCase):
    def test_exact_returned_id_is_match(self):
        self.assertEqual(runner.evaluate_routing("free/model-a", "free/model-a"), "exact_match")

    def test_different_returned_id_is_mismatch(self):
        self.assertEqual(runner.evaluate_routing("free/model-a", "free/model-b"), "mismatch")

    def test_missing_returned_id_is_unverified(self):
        self.assertEqual(runner.evaluate_routing("free/model-a", None), "missing_returned_model")


class ResponseValidationTests(unittest.TestCase):
    def test_task_h_valid_nested_schema(self):
        payload = {"verified_identity":"UNKNOWN","self_report_is_proof":False,"evidence_ranking":["returned ID"],"mismatch_policy":"stop ranking","fallback_label_policy":"show fallback","remaining_limitations":["no attestation"]}
        result = validate_response("H", json.dumps(payload), CONFIG)
        self.assertTrue(result["valid"], result["errors"])

    def test_task_h_rejects_wrong_boolean_type(self):
        payload = {"verified_identity":"UNKNOWN","self_report_is_proof":"false","evidence_ranking":[],"mismatch_policy":"x","fallback_label_policy":"x","remaining_limitations":[]}
        self.assertFalse(validate_response("H", json.dumps(payload), CONFIG)["valid"])

    def test_task_c_rejects_wrong_nested_array_item_type(self):
        payload = {"minimum_inputs_by_system":{"western":[42],"vedic":[],"jaimini":[],"kp":[],"bazi":[],"numerology":[]},"calculation_vs_interpretation":[],"cross_system_conflict_policy":[],"uncertainty_standard":{"acceptable_phrases":[],"prohibited_or_misleading_phrases":[]},"phrasing_examples":[],"claims_not_possible_without_chart_data":[]}
        self.assertFalse(validate_response("C", json.dumps(payload), CONFIG)["valid"])

    def test_duplicate_json_keys_are_rejected(self):
        raw = '{"verified_identity":"UNKNOWN","verified_identity":"Google","self_report_is_proof":false,"evidence_ranking":[],"mismatch_policy":"x","fallback_label_policy":"x","remaining_limitations":[]}'
        self.assertFalse(validate_response("H", raw, CONFIG)["valid"])

    def test_task_i_requires_all_fields(self):
        self.assertFalse(validate_response("I", '{"user_facing_answer":"hello"}', CONFIG)["valid"])


if __name__ == "__main__":
    unittest.main()
