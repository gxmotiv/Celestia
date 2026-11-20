#!/usr/bin/env python3
"""Sequential APInex benchmark runner with bounded transient-gateway retries; never prints secrets."""
import argparse, datetime as dt, json, os, pathlib, re, sys, time, urllib.error, urllib.request
from response_validation import validate_response

ROOT = pathlib.Path(__file__).resolve().parent
CONFIG = json.loads((ROOT / "config.json").read_text(encoding="utf-8"))
CAPS = {name: task["max_tokens"] for name, task in CONFIG["tasks"].items()}
API_URL = "https://api.apinex.bond/v1/chat/completions"
SAFE_RESPONSE_HEADERS = ("cf-ray", "cf-mitigated", "server", "content-type", "date", "retry-after")

def capture_response_diagnostics(result, headers, body_text=""):
    """Save only allowlisted response metadata; never save request headers or credentials."""
    safe = {}
    if headers:
        for name in SAFE_RESPONSE_HEADERS:
            value = headers.get(name)
            if value:
                safe[name] = str(value)[:300]
    result["response_headers"] = safe
    ray = safe.get("cf-ray")
    if not ray and body_text:
        match = re.search(r"\bRay\s*ID\s*:\s*([a-f0-9-]+)", body_text, re.IGNORECASE)
        if match:
            ray = match.group(1)
    result["cloudflare_ray_id"] = ray

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True, choices=sorted(CONFIG["models"]))
    parser.add_argument("--task", required=True, choices=sorted(CONFIG["tasks"]))
    parser.add_argument("--output-dir", default="benchmark-results")
    args = parser.parse_args()

    key = os.environ.get("APINEX_API_KEY", "").strip()
    if not key:
        print("ERROR: APINEX_API_KEY is not configured in GitHub Actions secrets.", file=sys.stderr)
        return 2

    model = CONFIG["models"][args.model]
    task = CONFIG["tasks"][args.task]
    cap = CAPS[args.task]
    payload = {
        "model": model["id"],
        "messages": [
            {"role": "system", "content": CONFIG["system_prompt"]},
            {"role": "user", "content": task["prompt"]}
        ],
        "temperature": 0,
        "max_tokens": cap,
        "stream": False
    }
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    if len(body) > 45000:
        print("ERROR: prompt payload exceeds the 45 KB safety ceiling; request not sent.", file=sys.stderr)
        return 2

    request = urllib.request.Request(
        API_URL, data=body,
        headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"},
        method="POST"
    )
    started = time.monotonic()
    timestamp = dt.datetime.now(dt.timezone.utc)
    result = {
        "timestamp_utc": timestamp.isoformat(),
        "requested_model_alias": args.model,
        "requested_model_id": model["id"],
        "catalogue_allowance_weight": model["weight"],
        "task": args.task,
        "max_output_tokens": cap,
        "temperature": 0,
        "automatic_retries": 0,
        "status": "unknown",
        "latency_seconds": None,
        "usage": {"prompt_tokens": None, "completion_tokens": None, "total_tokens": None,
                  "estimated_weighted_tokens": None, "dashboard_allowance_before": None,
                  "dashboard_allowance_after": None, "actual_allowance_deducted": None},
        "returned_model": None,
        "routing_status": "unverified",
        "response_metadata": {},
        "finish_reason": None,
        "response_text": None,
        "error": None
    }
    try:
        # Retry only transient gateway/rate-limit responses. Never retry auth, model,
        # validation, or other client errors. Two retries maximum; no blind retry loop.
        raw = None
        for attempt in range(3):
            try:
                with urllib.request.urlopen(request, timeout=100) as response:
                    raw = response.read()
                    result["http_status"] = response.status
                    capture_response_diagnostics(result, response.headers)
                break
            except urllib.error.HTTPError as exc:
                if exc.code not in (429, 502, 503, 504) or attempt >= 2:
                    raise
                result["automatic_retries"] += 1
                retry_after = exc.headers.get("Retry-After") if exc.headers else None
                try:
                    delay = min(15.0, max(1.0, float(retry_after))) if retry_after else (2.0 ** (attempt + 1))
                except (TypeError, ValueError):
                    delay = 2.0 ** (attempt + 1)
                print(f"Transient HTTP {exc.code}; retry {attempt + 1}/2 in {delay:g}s.")
                exc.close()
                time.sleep(delay)
        data = json.loads(raw.decode("utf-8"))
        choices = data.get("choices") or []
        if not choices:
            raise ValueError("API response did not contain choices[0].")
        choice = choices[0]
        message = choice.get("message") or {}
        content = message.get("content")
        if isinstance(content, list):
            content = "\n".join(str(part.get("text", "")) for part in content if isinstance(part, dict))
        result["response_text"] = content if isinstance(content, str) else json.dumps(content, ensure_ascii=False)
        result["returned_model"] = data.get("model")
        result["routing_status"] = "exact_match" if result["returned_model"] == model["id"] else ("mismatch" if result["returned_model"] else "missing_returned_model")
        result["response_metadata"] = {k: data[k] for k in ("id", "object", "created", "system_fingerprint") if isinstance(data.get(k), (str, int, float, bool))}
        result["finish_reason"] = choice.get("finish_reason")
        usage = data.get("usage") or {}
        for source, target in (("prompt_tokens","prompt_tokens"),("completion_tokens","completion_tokens"),("total_tokens","total_tokens")):
            value = usage.get(source)
            if isinstance(value, int):
                result["usage"][target] = value
        total = result["usage"]["total_tokens"]
        if total is not None:
            result["usage"]["estimated_weighted_tokens"] = total * model["weight"]
        result["response_validation"] = validate_response(args.task, result["response_text"], CONFIG)
        completion_tokens = result["usage"].get("completion_tokens")
        if not result["response_text"]:
            result["status"] = "empty_response"
        elif isinstance(completion_tokens, int) and completion_tokens > cap:
            result["status"] = "token_limit_exceeded"
        elif result["response_validation"]["format"] == "invalid_json":
            result["status"] = "invalid_json"
        elif not result["response_validation"]["valid"]:
            result["status"] = "schema_invalid"
        elif result["routing_status"] != "exact_match":
            result["status"] = "routing_unverified" if result["routing_status"] == "missing_returned_model" else "model_id_mismatch"
        else:
            result["status"] = "success"
    except urllib.error.HTTPError as exc:
        result["http_status"] = exc.code
        # Extract only short, non-secret diagnostic fields from the gateway error.
        # Never print request headers, credentials, or an unrestricted response body.
        detail = ""
        try:
            error_body = exc.read(4096).decode("utf-8", errors="replace")
            capture_response_diagnostics(result, exc.headers, error_body)
            try:
                error_json = json.loads(error_body)
                error_obj = error_json.get("error", error_json) if isinstance(error_json, dict) else {}
                if isinstance(error_obj, dict):
                    detail = str(error_obj.get("message") or error_obj.get("detail") or error_obj.get("code") or "")
                elif isinstance(error_obj, str):
                    detail = error_obj
                if not detail:
                    detail = str(error_json.get("message", "")) if isinstance(error_json, dict) else ""
            except json.JSONDecodeError:
                detail = error_body
            detail = detail.replace(key, "[REDACTED]")
            detail = re.sub(r"sk-apx-[A-Za-z0-9_-]+", "[REDACTED_API_KEY]", detail)
            detail = re.sub(r"Bearer\s+\S+", "Bearer [REDACTED]", detail, flags=re.IGNORECASE)
            detail = re.sub(r"\s+", " ", detail).strip()[:400]
        except Exception:
            detail = ""
        result["error"] = "HTTP error " + str(exc.code) + ": " + exc.reason + ((" — " + detail) if detail else "")
        result["status"] = "http_error"
    except urllib.error.URLError as exc:
        result["error"] = "Network error: " + str(exc.reason)
        result["status"] = "network_error"
    except Exception as exc:
        result["error"] = type(exc).__name__ + ": " + str(exc)[:500]
        result["status"] = "parse_or_response_error"
    finally:
        result["latency_seconds"] = round(time.monotonic() - started, 3)

    out_dir = pathlib.Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    stamp = timestamp.strftime("%Y%m%dT%H%M%SZ")
    safe_model = re.sub(r"[^a-z0-9-]", "-", args.model.lower())
    out_path = out_dir / f"{stamp}_{safe_model}_{args.task}.json"
    out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Benchmark request completed.")
    print("Model:", model["id"])
    print("Task:", args.task, "| max output tokens:", cap)
    print("Status:", result["status"], "| HTTP:", result.get("http_status", "n/a"), "| latency:", result["latency_seconds"], "seconds")
    print("Token usage:", json.dumps(result["usage"], sort_keys=True))
    if result.get("response_validation") and not result["response_validation"]["valid"]:
        print("Response validation:", result["response_validation"]["format"])
        for validation_error in result["response_validation"]["errors"]:
            print("Validation detail:", validation_error)
    if result.get("error"):
        # run.py stores only sanitized gateway diagnostics; never print request headers or credentials.
        print("Failure detail:", result["error"])
    if result.get("cloudflare_ray_id"):
        print("Cloudflare Ray ID:", result["cloudflare_ray_id"])
    print("Result file:", out_path)
    if result["status"] != "success":
        return 1
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
