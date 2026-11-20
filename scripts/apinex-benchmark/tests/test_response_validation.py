import json
import pathlib
import sys
import unittest

HERE = pathlib.Path(__file__).resolve()
sys.path.insert(0, str(HERE.parents[1]))
from response_validation import validate_response


CONFIG = {
    "tasks": {
        "E": {
            "response_schema": {
                "type": "object",
                "required": ["test_layers", "limitations"],
                "properties": {
                    "test_layers": {"type": "array"},
                    "limitations": {"type": "array"},
                },
            }
        }
    }
}


class ResponseValidationTests(unittest.TestCase):
    def test_valid_json_and_schema(self):
        self.assertTrue(validate_response("E", '{"test_layers":[],"limitations":[]}', CONFIG)["valid"])

    def test_malformed_json_rejected(self):
        result = validate_response("E", '{"test_layers":[] "limitations":[]}', CONFIG)
        self.assertFalse(result["valid"])
        self.assertEqual(result["format"], "invalid_json")

    def test_markdown_fence_rejected(self):
        result = validate_response("E", '```json\n{"test_layers":[],"limitations":[]}\n```', CONFIG)
        self.assertEqual(result["format"], "invalid_json")

    def test_missing_required_key_rejected(self):
        result = validate_response("E", '{"test_layers":[]}', CONFIG)
        self.assertEqual(result["format"], "schema_invalid")
        self.assertIn("Missing required key: limitations", result["errors"])

    def test_wrong_field_type_rejected(self):
        result = validate_response("E", '{"test_layers":"not-an-array","limitations":[]}', CONFIG)
        self.assertEqual(result["format"], "schema_invalid")

    def test_duplicate_keys_rejected(self):
        result = validate_response("E", '{"test_layers":[],"test_layers":[1],"limitations":[]}', CONFIG)
        self.assertEqual(result["format"], "invalid_json")
        self.assertIn("Duplicate", result["errors"][0])

    def test_nonstandard_nan_rejected(self):
        result = validate_response("E", '{"test_layers":[],"limitations":[],"extra":NaN}', CONFIG)
        self.assertEqual(result["format"], "invalid_json")

    def test_non_object_root_rejected(self):
        result = validate_response("E", '[]', CONFIG)
        self.assertEqual(result["format"], "schema_invalid")


if __name__ == "__main__":
    unittest.main()
