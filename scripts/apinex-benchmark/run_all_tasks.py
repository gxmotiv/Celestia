#!/usr/bin/env python3
"""Run every APInex benchmark task against the selected models sequentially."""
import argparse
import datetime as dt
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent
BATCH_RUNNER = ROOT / "run_batch.py"
CONFIG = json.loads((ROOT / "config.json").read_text(encoding="utf-8"))
TASKS = list(CONFIG["tasks"].keys())



STOP_SUITE_HTTP_STATUSES = {401, 402, 403, 429}


def find_suite_abort_condition(task_summary):
    """Stop launching later task batches on authentication, quota, or rate-limit failures."""
    for row in (task_summary or {}).get("results", []):
        status = row.get("http_status")
        if status in STOP_SUITE_HTTP_STATUSES:
            return {
                "model_alias": row.get("model_alias"),
                "http_status": status,
                "reason": "Stop after HTTP " + str(status) + " to avoid repeated auth/quota/rate-limit failures.",
            }
    return None


def build_combined_summary(task_summaries, models, concurrency=12, stopped_early_reason=None, skipped_tasks=None):
    rows = []
    for task in TASKS:
        summary = task_summaries.get(task) or {}
        for item in summary.get("results", []):
            row = dict(item)
            row["task"] = task
            rows.append(row)
    successes = sum(1 for row in rows if row.get("status") == "success")
    expected = len(TASKS) * len(models)
    attempted = len(rows)
    failures = sum(1 for row in rows if row.get("status") != "success")
    return {
        "benchmark_version": CONFIG.get("benchmark_version", "unknown"),
        "benchmark_commit": __import__("os").environ.get("GITHUB_SHA"),
        "created_at_utc": dt.datetime.now(dt.timezone.utc).isoformat(),
        "execution": "sequential_tasks_parallel_models",
        "max_parallel_models_per_task": concurrency,
        "tasks": TASKS,
        "selected_models": models,
        "request_count_planned": expected,
        "request_count_reported": len(rows),
        "request_count_attempted": attempted,
        "request_count_not_attempted": expected - attempted,
        "success_count": successes,
        "failure_count": failures,
        "stopped_early_reason": stopped_early_reason,
        "skipped_tasks": skipped_tasks or [],
        "overall_status": "success" if len(rows) == expected and successes == expected else ("partial_success" if successes else "failed"),
        "task_summaries": task_summaries,
        "results": rows,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--models", required=True, help="Comma-separated config aliases")
    parser.add_argument("--confirm-all", action="store_true", help="Explicitly confirm all configured task/model requests")
    parser.add_argument("--concurrency", type=int, default=12, help="Parallel model requests per task (1–12)")
    parser.add_argument("--output-dir", default="benchmark-results")
    args = parser.parse_args()
    if not args.confirm_all:
        print("No requests sent. Add --confirm-all to confirm the full task suite.")
        return 2
    if args.concurrency < 1 or args.concurrency > 12:
        print("ERROR: concurrency must be between 1 and 12.", file=sys.stderr)
        return 2
    models = [part.strip() for part in args.models.split(",") if part.strip()]
    unknown = [model for model in models if model not in CONFIG["models"]]
    if not models or len(set(models)) != len(models) or unknown:
        print("ERROR: provide a non-empty, duplicate-free list of configured model aliases.", file=sys.stderr)
        if unknown:
            print("Unknown model aliases: " + ", ".join(unknown), file=sys.stderr)
        return 2
    if not __import__("os").environ.get("APINEX_API_KEY", "").strip():
        print("ERROR: APINEX_API_KEY is not configured; no requests sent.", file=sys.stderr)
        return 2

    out_dir = pathlib.Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    task_summaries = {}
    any_failure = False
    stopped_early_reason = None
    skipped_tasks = []

    for index, task in enumerate(TASKS, start=1):
        task_dir = out_dir / task
        task_dir.mkdir(parents=True, exist_ok=True)
        print(f"\n========== TASK {task} ({index}/{len(TASKS)}) ==========", flush=True)
        completed = subprocess.run(
            [sys.executable, str(BATCH_RUNNER), "--models", args.models,
             "--task", task, "--concurrency", str(args.concurrency), "--output-dir", str(task_dir)],
            check=False,
        )
        summaries = sorted(task_dir.glob(f"*_batch_{task}_summary.json"))
        summary = json.loads(summaries[-1].read_text(encoding="utf-8")) if summaries else None
        if summary is None:
            any_failure = True
            task_summaries[task] = {
                "overall_status": "missing_summary",
                "runner_exit_code": completed.returncode,
                "results": [],
            }
        else:
            task_summaries[task] = summary
            if completed.returncode != 0 or summary.get("overall_status") != "success":
                any_failure = True
            abort = find_suite_abort_condition(summary)
            if abort:
                stopped_early_reason = abort
                any_failure = True
                skipped_tasks = TASKS[index:]
                for skipped_task in skipped_tasks:
                    task_summaries[skipped_task] = {
                        "overall_status": "skipped_after_api_guard",
                        "results": [],
                    }
                print("Stopping full suite after gateway safety condition:", json.dumps(abort), flush=True)
                break

    combined = build_combined_summary(
        task_summaries, models, args.concurrency,
        stopped_early_reason=stopped_early_reason,
        skipped_tasks=skipped_tasks,
    )
    stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    json_path = out_dir / f"{stamp}_all_tasks_summary.json"
    md_path = out_dir / f"{stamp}_all_tasks_summary.md"
    json_path.write_text(json.dumps(combined, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# APInex Celestia — all tasks benchmark",
        "",
        f"- Overall: {combined['overall_status']}",
        f"- Tasks: {', '.join(TASKS)}",
        f"- Models: {len(models)}",
        f"- Planned requests: {combined['request_count_planned']}",
        f"- Reported responses: {combined['request_count_reported']}",
        f"- Successful responses: {combined['success_count']}",
        f"- Failed responses: {combined['failure_count']}",
        "",
        "| Task | Successful | Failed |",
        "|---|---:|---:|",
    ]
    for task in TASKS:
        summary = task_summaries.get(task) or {}
        lines.append(f"| {task} | {summary.get('success_count', 0)} | {summary.get('failure_count', 0)} |")
    lines.extend(["", "Individual JSON files and per-task summaries are stored in their task subdirectories."])
    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"\nAll-task benchmark: {combined['success_count']}/{combined['request_count_planned']} successful.")
    print("Combined JSON:", json_path)
    print("Combined Markdown:", md_path)
    return 1 if any_failure or combined["overall_status"] != "success" else 0


if __name__ == "__main__":
    raise SystemExit(main())
