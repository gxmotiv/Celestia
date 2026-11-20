"""Strict task-specific JSON response validation for the APInex benchmark.

The raw model response is never repaired or rewritten. Invalid output remains
available in the artifact for human review, but is not counted as a success.
"""
import json


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
    return {
        "object": lambda v: isinstance(v, dict),
        "array": lambda v: isinstance(v, list),
        "string": lambda v: isinstance(v, str),
        "integer": lambda v: isinstance(v, int) and not isinstance(v, bool),
        "number": lambda v: isinstance(v, (int, float)) and not isinstance(v, bool),
        "boolean": lambda v: isinstance(v, bool),
        "null": lambda v: v is None,
    }.get(expected, lambda _v: False)(value)


def validate_response(task, response_text, config):
    """Return {valid, format, errors}; never mutate or repair response_text."""
    if not isinstance(response_text, str) or not response_text.strip():
        return {"valid": False, "format": "missing", "errors": ["Response is empty or not text."]}

    try:
        parsed = json.loads(
            response_text,
            parse_constant=_reject_constant,
            object_pairs_hook=_unique_object,
        )
    except (json.JSONDecodeError, ValueError) as exc:
        return {"valid": False, "format": "invalid_json", "errors": [str(exc)[:400]]}

    schema = config.get("tasks", {}).get(task, {}).get("response_schema")
    if not isinstance(schema, dict):
        return {"valid": False, "format": "schema_missing", "errors": [f"No response schema configured for task {task}."]}

    errors = []
    if schema.get("type") == "object" and not isinstance(parsed, dict):
        errors.append("Top-level response must be a JSON object.")
    elif schema.get("type") != "object":
        errors.append("Configured response schema must require an object at the top level.")

    if isinstance(parsed, dict):
        for key in schema.get("required", []):
            if key not in parsed:
                errors.append(f"Missing required key: {key}")
        for key, definition in schema.get("properties", {}).items():
            if key in parsed:
                expected = definition.get("type") if isinstance(definition, dict) else None
                if expected and not _matches_type(parsed[key], expected):
                    errors.append(f"Key '{key}' must have JSON type '{expected}'.")

    return {
        "valid": not errors,
        "format": "valid" if not errors else "schema_invalid",
        "errors": errors[:30],
    }
