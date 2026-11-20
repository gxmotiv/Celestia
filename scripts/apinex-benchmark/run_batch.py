#!/usr/bin/env python3
"""Run one benchmark task against multiple models concurrently and validate each response."""
import argparse
import concurrent.futures
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
MAX_MODELS = len(CONFIG["models"])


def parse_models(raw):
    aliases = [part.strip() for part in raw.split(",") if part.strip()]
    if not aliases:
        raise ValueError("Select at least one model alias.")
    if len(aliases) > MAX_MODELS:
        raise ValueError(f"Select no more than {MAX_MODELS} models.")
    if len(set(aliases)) != len(aliases):
        raise ValueError("Duplicate model aliases are not allowed.")
    unknown = [name for name in aliases if name not in CONFIG["models"]]
    if unknown:
        raise ValueError("Unknown model alias(es): " + ", ".join(unknown))
    return aliases


def run_one_model(alias, task, out_dir, pacing_file=None, minimum_interval=5.0, trial=1):
    filename_pattern = "*" + re.sub(r"[^a-z0-9-]", "-", alias.lower()) + "_" + task + f"_trial{trial}.json"
    before = {path.resolve() for path in out_dir.glob(filename_pattern)}
    try:
        completed = subprocess.run(
            [sys.executable, str(RUNNER), "--model", alias, "--task", task,
             "--trial", str(trial), "--output-dir", str(out_dir)],
            env={
                **os.environ.copy(),
                "APINEX_BENCHMARK_PACING_FILE": str(pacing_file or ""),
                "APINEX_BENCHMARK_MIN_INTERVAL_SECONDS": str(minimum_interval),
            },
            capture_output=True,
            text=True,
            check=False,
        )
    except Exception as exc:
        return {
            "model_alias": alias,
            "status": "runner_exception",
            "runner_exit_code": None,
            "result_file": None,
            "error": type(exc).__name__ + ": " + str(exc)[:300],
            "runner_log": "",
        }

    candidates = sorted(
        (path for path in out_dir.glob(filename_pattern) if path.resolve() not in before),
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    if not candidates:
        return {
            "model_alias": alias,
            "status": "runner_failed_without_json",
            "runner_exit_code": completed.returncode,
            "result_file": None,
            "error": (completed.stderr or "")[-500:],
            "runner_log": completed.stdout or "",
        }

    result_path = candidates[0]
    try:
        result = json.loads(result_path.read_text(encoding="utf-8"))
        usage = result.get("usage") or {}
        completion = usage.get("completion_tokens")
        cap = result.get("max_output_tokens")
        warnings = list(result.get("warnings") or [])
        if isinstance(completion, int) and isinstance(cap, int) and completion > cap:
            warning = f"completion_tokens_exceeded_cap:{completion}>{cap}"
            if warning not in warnings:
                warnings.append(warning)
        result["warnings"] = warnings
        result["runner_exit_code"] = completed.returncode
        result_path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        row = {
            "model_alias": alias,
            "trial": trial,
            "requested_model_id": result.get("requested_model_id"),
            "returned_model": result.get("returned_model"),
            "routing_status": result.get("routing_status", "unverified"),
            "status": result.get("status", "unknown"),
            "http_status": result.get("http_status"),
            "finish_reason": result.get("finish_reason"),
            "latency_seconds": result.get("latency_seconds"),
            "usage": usage,
            "automatic_retries": result.get("automatic_retries", 0),
            "api_attempt_count": result.get("api_attempt_count", 0),
            "pacing_wait_seconds": result.get("pacing_wait_seconds", 0),
            "retry_wait_seconds": result.get("retry_wait_seconds", 0),
            "total_elapsed_seconds": result.get("total_elapsed_seconds"),
            "warnings": warnings,
            "response_validation": result.get("response_validation"),
            "error": result.get("error"),
            "runner_exit_code": completed.returncode,
            "result_file": result_path.name,
            "runner_log": completed.stdout or "",
        }
        return row
    except Exception as exc:
        return {
            "model_alias": alias,
            "status": "result_parse_error",
            "runner_exit_code": completed.returncode,
            "result_file": result_path.name,
            "error": type(exc).__name__ + ": " + str(exc)[:300],
            "runner_log": completed.stdout or "",
        }


def run_models_in_parallel(aliases, task, out_dir, concurrency, pacing_file=None, minimum_interval=5.0, trials=1):
    """Launch one request per alias concurrently and return results in completion-independent mapping."""
    results_by_alias = {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as pool:
        work_items = [(alias, trial) for alias in aliases for trial in range(1, trials + 1)]
        future_to_item = {
            pool.submit(run_one_model, alias, task, out_dir, pacing_file, minimum_interval, trial): (alias, trial)
            for alias, trial in work_items
        }
        for future in concurrent.futures.as_completed(future_to_item):
            alias, trial = future_to_item[future]
            try:
                results_by_alias[(alias, trial)] = future.result()
            except Exception as exc:
                results_by_alias[(alias, trial)] = {
                    "model_alias": alias,
                    "trial": trial,
                    "status": "runner_exception",
                    "runner_exit_code": None,
                    "result_file": None,
                    "error": type(exc).__name__ + ": " + str(exc)[:300],
                    "runner_log": "",
                }
    return results_by_alias


def main():
    parser = argparse.ArgumentParser(
        description="Run one selected task against all selected models in parallel."
    )
    parser.add_argument("--models", required=True, help="Comma-separated configured model aliases")
    parser.add_argument("--task", required=True, choices=sorted(CONFIG["tasks"]))
    parser.add_argument("--trials", type=int, choices=(1, 3, 5), default=1,
                        help="Repeat each selected model/task 1, 3, or 5 times (default 1).")
    parser.add_argument("--output-dir", default="benchmark-results")
    parser.add_argument(
        "--schedule-state-file",
        default=None,
        help="Shared pacing state file used by the all-task runner; normally leave unset.",
    )
    parser.add_argument(
        "--concurrency", type=int, default=12,
        help="Maximum simultaneous model requests (1–12; default 12)",
    )
    args = parser.parse_args()

    try:
        aliases = parse_models(args.models)
    except ValueError as exc:
        print("ERROR:", str(exc), file=sys.stderr)
        return 2
    if args.concurrency < 1 or args.concurrency > 12:
        print("ERROR: concurrency must be between 1 and 12.", file=sys.stderr)
        return 2
    effective_concurrency = min(args.concurrency, len(aliases))
    minimum_interval = float(CONFIG.get("execution_policy", {}).get("min_request_interval_seconds", 5.0))
    if minimum_interval < 4.0 or minimum_interval > 60.0:
        print("ERROR: configured request interval must be between 4 and 60 seconds.", file=sys.stderr)
        return 2
    if not os.environ.get("APINEX_API_KEY", "").strip():
        print("ERROR: APINEX_API_KEY is not configured; no requests sent.", file=sys.stderr)
        return 2

    out_dir = pathlib.Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    task_name = CONFIG["tasks"][args.task].get("name", args.task)
    started = dt.datetime.now(dt.timezone.utc)
    summary = {
        "benchmark_version": CONFIG.get("benchmark_version", "unknown"),
        "benchmark_commit": os.environ.get("GITHUB_SHA"),
        "created_at_utc": started.isoformat(),
        "task": args.task,
        "task_name": task_name,
        "trials_per_model_task": args.trials,
        "execution": "parallel_models_one_task",
        "max_parallel_requests": effective_concurrency,
        "minimum_request_interval_seconds": minimum_interval,
        "rate_limit_policy": "Globally pace every API attempt, including retries, to leave headroom under the documented APInex Free-tier limit.",
        "automatic_retries_policy": "At most two retries for HTTP 502/503/504; HTTP 429 is recorded without automatic retry.",
        "selected_models": aliases,
        "request_count_planned": len(aliases) * args.trials,
        "request_count_attempted": 0,
        "automatic_retries": 0,
        "results": [],
        "overall_status": "incomplete",
    }

    print(f"Task {args.task}: {task_name}")
    pacing_file = pathlib.Path(args.schedule_state_file) if args.schedule_state_file else (out_dir / ".request_pacing.json")
    print(f"Starting {len(aliases)} model request(s) with max in-flight concurrency {effective_concurrency}.")
    print(f"Global API-attempt pacing: one request every {minimum_interval:g} seconds.", flush=True)
    print("Every selected model receives the same task prompt and task-specific output schema.", flush=True)

    rows_by_alias = run_models_in_parallel(
        aliases, args.task, out_dir, effective_concurrency, pacing_file, minimum_interval, args.trials
    )

    # Preserve model order and trial order in summaries, independent of completion order.
    for alias in aliases:
        for trial in range(1, args.trials + 1):
            row = rows_by_alias[(alias, trial)]
            log = row.pop("runner_log", "")
            if log.strip():
                print(f"\n--- {alias} (trial {trial}) ---\n{log.rstrip()}")
            summary["results"].append(row)
            summary["request_count_attempted"] += 1
            summary["automatic_retries"] += int(row.get("automatic_retries") or 0)

    summary["api_attempt_count_reported"] = sum(
        int(item.get("api_attempt_count") or 0) for item in summary["results"]
    )
    successes = sum(1 for item in summary["results"] if item.get("status") == "success")
    summary["success_count"] = successes
    summary["failure_count"] = len(summary["results"]) - successes
    summary["finished_at_utc"] = dt.datetime.now(dt.timezone.utc).isoformat()
    expected_results = summary["request_count_planned"]
    summary["overall_status"] = (
        "success" if successes == expected_results
        else ("partial_success" if successes else "failed")
    )
    stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    summary_path = out_dir / f"{stamp}_batch_{args.task}_summary.json"
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# APInex parallel task benchmark",
        "",
        f"- Task: {args.task} — {task_name}",
        f"- Execution: paced API attempts; max in-flight concurrency {effective_concurrency}",
        f"- Minimum request interval: {minimum_interval:g} seconds",
        f"- Overall: {summary['overall_status']} ({successes}/{expected_results} successful)",
        f"- Trials per model/task: {args.trials}",
        f"- Planned / attempted model-task-trials: {summary['request_count_planned']} / {summary['request_count_attempted']}",
        f"- Actual API attempts (including retries): {summary['api_attempt_count_reported']}",
        f"- Automatic transient retries: {summary['automatic_retries']}",
        "",
        "| Model | Status | Routing | JSON/schema | HTTP | API latency (s) | Pacing wait (s) | Completion tokens | Retries |",
        "|---|---|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for item in summary["results"]:
        usage = item.get("usage") or {}
        validation = item.get("response_validation") or {}
        lines.append("| {model} | {status} | {routing} | {validation} | {http} | {latency} | {pacing} | {tokens} | {retries} |".format(
            model=item.get("model_alias", ""),
            status=item.get("status", ""),
            routing=item.get("routing_status", "unverified"),
            validation=validation.get("format", "n/a"),
            http=item.get("http_status") or "",
            latency=item.get("latency_seconds") if item.get("latency_seconds") is not None else "",
            pacing=item.get("pacing_wait_seconds", 0),
            tokens=usage.get("completion_tokens") if usage.get("completion_tokens") is not None else "",
            retries=item.get("automatic_retries", 0),
        ))
    (out_dir / f"{stamp}_batch_{args.task}_summary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"\nTask {args.task} finished: {successes}/{expected_results} successful.")
    print("Summary JSON:", summary_path)
    if not args.schedule_state_file:
        pacing_file.unlink(missing_ok=True)
        pacing_file.with_name(pacing_file.name + ".lock").unlink(missing_ok=True)
    return 0 if successes == expected_results else 1


if __name__ == "__main__":
    raise SystemExit(main())
