"""Strict recursive task-specific JSON validation; never repairs model output."""
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
    checks = {
        "object": lambda v: isinstance(v, dict),
        "array": lambda v: isinstance(v, list),
        "string": lambda v: isinstance(v, str),
        "integer": lambda v: isinstance(v, int) and not isinstance(v, bool),
        "number": lambda v: isinstance(v, (int, float)) and not isinstance(v, bool),
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
        if isinstance(schema.get("items"), dict):
            for index, item in enumerate(value):
                _validate(item, schema["items"], f"{path}[{index}]", errors)
    if isinstance(value, str):
        if len(value) < schema.get("minLength", 0):
            errors.append(f"{path}: shorter than minLength")
        if len(value) > schema.get("maxLength", 10**9):
            errors.append(f"{path}: exceeds maxLength")

def validate_response(task, response_text, config):
    """Return validation metadata; preserve original response exactly."""
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
    return {"valid": not errors, "format": "valid" if not errors else "schema_invalid", "errors": errors[:50]}
