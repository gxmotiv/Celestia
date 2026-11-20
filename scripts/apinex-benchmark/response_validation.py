"""Strict recursive task-specific JSON validation; never repairs model output."""
import json
import math


def _reject_constant(value):
    raise ValueError(f"Non-standard JSON constant: {value}")


def _unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"Duplicate JSON object key: {key}")
        result[key] = value
    return result


def _matches_type(value, expected):
    checks = {
        "object": lambda v: isinstance(v, dict),
        "array": lambda v: isinstance(v, list),
        "string": lambda v: isinstance(v, str),
        "integer": lambda v: isinstance(v, int) and not isinstance(v, bool),
        "number": lambda v: (
            isinstance(v, (int, float))
            and not isinstance(v, bool)
            and (not isinstance(v, float) or math.isfinite(v))
        ),
        "boolean": lambda v: isinstance(v, bool),
        "null": lambda v: v is None,
    }
    return checks.get(expected, lambda _v: False)(value)


def _validate(value, schema, path, errors):
    if not isinstance(schema, dict):
        errors.append(f"{path}: invalid schema definition")
        return
    expected = schema.get("type")
    if expected and not _matches_type(value, expected):
        errors.append(f"{path}: expected {expected}")
        return
    if "enum" in schema and value not in schema["enum"]:
        errors.append(f"{path}: value is not in allowed enum")
    if isinstance(value, dict):
        for key in schema.get("required", []):
            if key not in value:
                errors.append(f"Missing required key: {key}" if path == "$" else f"{path}: missing required key {key}")
        props = schema.get("properties", {})
        for key, child in props.items():
            if key in value:
                _validate(value[key], child, f"{path}.{key}", errors)
        if schema.get("additionalProperties") is False:
            extras = sorted(set(value) - set(props))
            if extras:
                errors.append(f"{path}: unexpected keys {', '.join(extras[:8])}")
    if isinstance(value, list):
        if len(value) < schema.get("minItems", 0):
            errors.append(f"{path}: fewer than minItems")
        if len(value) > schema.get("maxItems", 10**9):
            errors.append(f"{path}: exceeds maxItems")
        if schema.get("uniqueItems") is True:
            seen = set()
            for index, item in enumerate(value):
                key = json.dumps(item, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
                if key in seen:
                    errors.append(f"{path}[{index}]: duplicate array item; uniqueItems is required")
                seen.add(key)
        if isinstance(schema.get("items"), dict):
            for index, item in enumerate(value):
                _validate(item, schema["items"], f"{path}[{index}]", errors)
    if isinstance(value, str):
        if len(value) < schema.get("minLength", 0):
            errors.append(f"{path}: shorter than minLength")
        if len(value) > schema.get("maxLength", 10**9):
            errors.append(f"{path}: exceeds maxLength")


def _validate_numeric_fixture(numeric, errors):
    expected = {
        "Ascendant": ("Pisces", 13.925929, 343.925929),
        "Sun": ("Sagittarius", 16.863212, 256.863212),
        "Moon": ("Aquarius", 6.468547, 306.468547),
        "Rahu": ("Capricorn", 24.729703, 294.729703),
    }
    positions = numeric["positions"]
    for body, (sign, degree, longitude) in expected.items():
        actual = positions[body]
        prefix = f"$.positions.{body}"
        if actual["sign"] != sign:
            errors.append(f"{prefix}.sign: expected {sign}")
        if abs(actual["degree_in_sign"] - degree) > 0.0001:
            errors.append(f"{prefix}.degree_in_sign: outside 0.0001 degree tolerance")
        if abs(actual["longitude_decimal"] - longitude) > 0.0000015:
            errors.append(f"{prefix}.longitude_decimal: does not preserve supplied fixture")
    if abs(numeric["ayanamsha_difference_arcseconds"] - 11.8404) > 0.01:
        errors.append("$.ayanamsha_difference_arcseconds: expected 11.8404 within 0.01 arcsecond")


def validate_response(task, response_text, config):
    """Return validation metadata; preserve the original model response exactly."""
    if not isinstance(response_text, str) or not response_text.strip():
        return {"valid": False, "format": "missing", "errors": ["Response is empty or not text."]}
    try:
        parsed = json.loads(response_text, parse_constant=_reject_constant, object_pairs_hook=_unique_object)
    except (json.JSONDecodeError, ValueError) as exc:
        return {"valid": False, "format": "invalid_json", "errors": [str(exc)[:400]]}

    schema = config.get("tasks", {}).get(task, {}).get("response_schema")
    if not isinstance(schema, dict):
        return {"valid": False, "format": "schema_missing", "errors": [f"No response schema configured for task {task}."]}

    errors = []
    _validate(parsed, schema, "$", errors)
    if not errors and task == "C":
        _validate_numeric_fixture(parsed, errors)
    if not errors and task == "G":
        expected_levels = {
            "traditional_textual_authority",
            "modern_interpretation",
            "anecdote",
            "retrospective_matching",
            "observational_evidence",
            "prospective_out_of_sample_validation",
        }
        actual_levels = [item.get("level") for item in parsed["evidence_levels"]]
        if len(actual_levels) != len(expected_levels) or set(actual_levels) != expected_levels:
            errors.append("$.evidence_levels: must contain each of the six required evidence levels exactly once")
    if not errors and task == "H":
        expected_topics = {
            "repository_inspection",
            "test_execution",
            "deployment_status",
            "planetary_placements",
            "predictive_accuracy",
            "evidence_classification",
        }
        actual_topics = [item.get("topic") for item in parsed["answers"]]
        if len(actual_topics) != len(expected_topics) or set(actual_topics) != expected_topics:
            errors.append("$.answers: must contain all six required topics exactly once")
    if not errors and task == "I" and parsed.get("self_report_is_proof") is not False:
        errors.append("$.self_report_is_proof: must be false; model self-introduction is not identity evidence")

    return {"valid": not errors, "format": "valid" if not errors else "schema_invalid", "errors": errors[:50]}
