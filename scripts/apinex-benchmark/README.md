# Celestia APInex multi-model benchmark

## Design

The benchmark has **10 independent tasks (A–J)**. The former five composite tasks bundled multiple skills together; those modules are now separated so each result has a clearer interpretation.

Each GitHub Actions run selects **one task** and sends that exact task prompt to every selected model **concurrently**. With the default 12 models, one run makes **12 first-pass API requests**, not 60. The workflow offers A–J and an explicit `ALL` option. The default remains A. Selecting `ALL` deliberately starts the full 120-request first-pass comparison for 12 models.

| Task | Independent capability | Output ceiling |
|---|---|---:|
| A | Calculation integrity and risk analysis | 2,400 |
| B | Astrology-system knowledge and convention separation | 3,000 |
| C | Numerical reference fixture (longitude conversion and unit arithmetic) | 1,000 |
| D | Software engineering review | 2,500 |
| E | Test architecture and release gates | 2,400 |
| F | Source-grounded code audit | 2,600 |
| G | Research quality and predictive-validation methodology | 2,600 |
| H | Hallucination resistance and evidence discipline | 1,700 |
| I | Provider identity and routing honesty | 1,400 |
| J | User-facing Celestia response quality | 1,000 |

To compare all 10 tasks across all 12 models, run A, then B, and so on through J as **10 separate workflow runs**: 120 first-pass requests in total. You can stop after any task, inspect the artifact, and decide whether to continue.

## Fair-comparison controls

- Every model in a selected run receives the same system prompt, task prompt, task schema, temperature (0), and output-token ceiling.
- The benchmark version, commit SHA, selected models, concurrency, timestamps, returned model ID, HTTP status, finish reason, prompt/completion/total tokens, latency, and retry counts are recorded.
- All 12 requests are launched concurrently (one per model). Transient HTTP 429/502/503/504 errors may be retried at most twice; the retry count is recorded. Other failures are preserved, not silently repaired.
- JSON/schema validity, gateway-reported routing, and answer quality are separate concepts. A valid JSON response is not automatically a correct or high-quality answer.
- The numerical fixture is checked against fixed expected values. Its validator is isolated to Task C; it no longer causes unrelated calculation-integrity answers to fail.
- The task schemas reject duplicate keys, malformed JSON, missing required fields, wrong field types, and unexpected fields. Raw model responses remain in the run artifact for review.
- A single first-pass response per model/task is a screening result, not a conclusive leaderboard. Repeat finalists on the same task before making close rankings. API models can be stochastic even at temperature 0.

Concurrent requests may expose APInex rate limits or shared gateway contention. Any 429, retry, timeout, or HTTP error must remain visible in the result; do not interpret a rate-limit failure as low model intelligence. If a run shows widespread 429s, lower concurrency in a deliberate follow-up and mark it as a different execution condition rather than mixing the runs.

## Run instructions

1. Open GitHub Actions → **APInex Celestia Multi-Model Benchmark**.
2. Select all 12 model aliases (the default).
3. Select exactly one task A–J.
4. Set `confirm_api_call=true`.
5. Run the workflow and download its artifact.
6. Inspect the per-model JSON files and the task summary before starting the next task.

The API key must remain in GitHub Actions Secrets under `APINEX_API_KEY`. Never put it in a file, commit, prompt, issue, or chat message.

## Allowance accounting

The result artifact records API-reported prompt/completion/total tokens and estimates weighted tokens using the configured APInex catalogue weight. Dashboard allowance before/after and actual debit are left null because the runner cannot verify those values through this API. Record them manually from the APInex dashboard.

Estimated weighted tokens = API total_tokens × configured catalogue weight. Catalogue weights are allowance estimates, not quality scores.

## Routing and provider identity

The requested model ID and returned API `model` field are recorded separately. Exact matches are gateway-reported routing evidence, not cryptographic proof of upstream weights. Missing or mismatched IDs are excluded from quality ranking as unverified/mismatched routing. A model's self-introduction (for example, "I am Google") is never identity proof.

## Artifacts and privacy

Results are uploaded as GitHub Actions artifacts with 14-day retention and are not committed to the repository. Anyone with sufficient repository Actions/artifact access may be able to access them. Use synthetic, non-sensitive task evidence only.

## Optional full-suite CLI

The GitHub workflow intentionally has no all-tasks selection. The local `run_all_tasks.py` helper requires an explicit `--confirm-all` flag because it makes 10 × number-of-selected-models requests. The normal and recommended workflow is one task at a time.

## Limits

- The automatic validator checks transport, routing-reported fields, JSON shape, required types, and the deterministic numeric fixture only. It does not fully grade open-ended domain quality.
- Use the shared scoring rubric for human review. Do not treat model self-reported identity, APInex catalogue metadata, or an HTTP 200 as proof of upstream weights or quality.
- Celestia calculation correctness still requires independent fixtures and direct application tests; this model benchmark does not test or certify the live app.
