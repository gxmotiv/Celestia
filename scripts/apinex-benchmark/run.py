#!/usr/bin/env python3
"""One-request-at-a-time APInex benchmark runner. No retries; never prints secrets."""
import argparse, datetime as dt, json, os, pathlib, re, sys, time, urllib.error, urllib.request

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
        "finish_reason": None,
        "response_text": None,
        "error": None
    }
    try:
        # Exactly one HTTP request. Deliberately no retry to avoid surprise quota use.
        with urllib.request.urlopen(request, timeout=100) as response:
            raw = response.read()
            result["http_status"] = response.status
            capture_response_diagnostics(result, response.headers)
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
        result["finish_reason"] = choice.get("finish_reason")
        usage = data.get("usage") or {}
        for source, target in (("prompt_tokens","prompt_tokens"),("completion_tokens","completion_tokens"),("total_tokens","total_tokens")):
            value = usage.get(source)
            if isinstance(value, int):
                result["usage"][target] = value
        total = result["usage"]["total_tokens"]
        if total is not None:
            result["usage"]["estimated_weighted_tokens"] = total * model["weight"]
        result["status"] = "success" if result["response_text"] else "empty_response"
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
    print("Status:", result["status"], "| latency:", result["latency_seconds"], "seconds")
    print("Token usage:", json.dumps(result["usage"], sort_keys=True))
    print("Result file:", out_path)
    if result["status"] != "success":
        return 1
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
