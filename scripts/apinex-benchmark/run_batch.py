#!/usr/bin/env python3
"""Sequential APInex batch runner with task-specific response validation."""
import argparse
import datetime as dt
import json
import os
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent
CONFIG = json.loads((ROOT / "config.json").read_text(encoding="utf-8"))
RUNNER = ROOT / "run.py"

def parse_models(raw):
    aliases = [part.strip() for part in raw.split(",") if part.strip()]
    if not aliases:
        raise ValueError("Select at least one model alias.")
    if len(aliases) > len(CONFIG["models"]):
        raise ValueError("Too many models selected.")
    if len(set(aliases)) != len(aliases):
        raise ValueError("Duplicate model aliases are not allowed.")
    unknown = [name for name in aliases if name not in CONFIG["models"]]
    if unknown:
        raise ValueError("Unknown model alias(es): " + ", ".join(unknown))
    return aliases

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--models", required=True, help="Comma-separated config aliases")
    parser.add_argument("--task", required=True, choices=sorted(CONFIG["tasks"]))
    parser.add_argument("--output-dir", default="benchmark-results")
    args = parser.parse_args()

    try:
        aliases = parse_models(args.models)
    except ValueError as exc:
        print("ERROR:", str(exc), file=sys.stderr)
        return 2

    if not os.environ.get("APINEX_API_KEY", "").strip():
        print("ERROR: APINEX_API_KEY is not configured; no requests sent.", file=sys.stderr)
        return 2

    out_dir = pathlib.Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    summary = {
        "created_at_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "task": args.task,
        "execution": "sequential",
        "automatic_retries": 0,
        "selected_models": aliases,
        "request_count_planned": len(aliases),
        "request_count_attempted": 0,
        "results": [],
        "overall_status": "incomplete"
    }

    for index, alias in enumerate(aliases, start=1):
        print(f"\n[{index}/{len(aliases)}] Running {alias} (one logical request; transient gateway retries only).", flush=True)
        filename_pattern = "*" + re.sub(r"[^a-z0-9-]", "-", alias.lower()) + "_" + args.task + ".json"
        before = {path.resolve() for path in out_dir.glob(filename_pattern)}
        completed = subprocess.run(
            [sys.executable, str(RUNNER), "--model", alias, "--task", args.task,
             "--output-dir", str(out_dir)],
            env=os.environ.copy(),
            check=False
        )
        summary["request_count_attempted"] += 1
        candidates = sorted(
            (path for path in out_dir.glob(filename_pattern) if path.resolve() not in before),
            key=lambda path: path.stat().st_mtime,
            reverse=True
        )
        if not candidates:
            summary["results"].append({
                "model_alias": alias, "status": "runner_failed_without_json",
                "runner_exit_code": completed.returncode, "result_file": None
            })
            continue

        result_path = candidates[0]
        try:
            result = json.loads(result_path.read_text(encoding="utf-8"))
            usage = result.get("usage") or {}
            completion = usage.get("completion_tokens")
            cap = result.get("max_output_tokens")
            warnings = list(result.get("warnings") or [])
            summary["automatic_retries"] += int(result.get("automatic_retries") or 0)
            if isinstance(completion, int) and isinstance(cap, int) and completion > cap:
                warning = f"completion_tokens_exceeded_cap:{completion}>{cap}"
                if warning not in warnings:
                    warnings.append(warning)
            result["warnings"] = warnings
            result["runner_exit_code"] = completed.returncode
            result_path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            summary["results"].append({
                "model_alias": alias,
                "returned_model": result.get("returned_model"),
                "routing_status": result.get("routing_status", "unverified"),
                "status": result.get("status", "unknown"),
                "http_status": result.get("http_status"),
                "finish_reason": result.get("finish_reason"),
                "latency_seconds": result.get("latency_seconds"),
                "usage": usage,
                "warnings": warnings,
                "response_validation": result.get("response_validation"),
                "error": result.get("error"),
                "runner_exit_code": completed.returncode,
                "result_file": result_path.name
            })
        except Exception as exc:
            summary["results"].append({
                "model_alias": alias, "status": "result_parse_error",
                "runner_exit_code": completed.returncode,
                "result_file": result_path.name,
                "error": type(exc).__name__ + ": " + str(exc)[:300]
            })

    successes = sum(1 for item in summary["results"] if item.get("status") == "success")
    summary["success_count"] = successes
    summary["failure_count"] = len(summary["results"]) - successes
    summary["overall_status"] = "success" if successes == len(aliases) else ("partial_success" if successes else "failed")
    stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    summary_path = out_dir / f"{stamp}_batch_{args.task}_summary.json"
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# APInex batch benchmark",
        "",
        f"- Task: {args.task}",
        f"- Execution: sequential; transient gateway retries only (maximum two retries per logical request)",
        f"- Overall: {summary['overall_status']} ({successes}/{len(aliases)} successful)",
        "",
        "| Model | Status | JSON/schema | HTTP | Latency (s) | Completion tokens | Warnings |",
        "|---|---|---:|---:|---:|---:|---|"
    ]
    for item in summary["results"]:
        usage = item.get("usage") or {}
        validation = item.get("response_validation") or {}
        lines.append("| {model} | {status} | {validation} | {http} | {latency} | {tokens} | {warnings} |".format(
            model=item.get("model_alias", ""),
            status=item.get("status", ""),
            validation=validation.get("format", "n/a"),
            http=item.get("http_status") or "",
            latency=item.get("latency_seconds") if item.get("latency_seconds") is not None else "",
            tokens=usage.get("completion_tokens") if usage.get("completion_tokens") is not None else "",
            warnings=", ".join(item.get("warnings") or [])
        ))
    (out_dir / f"{stamp}_batch_{args.task}_summary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"\nBatch finished: {successes}/{len(aliases)} successful.")
    print("Summary JSON:", summary_path)
    return 0 if successes == len(aliases) else 1

if __name__ == "__main__":
    raise SystemExit(main())
