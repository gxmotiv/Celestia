# Celestia APInex multi-model benchmark

## Design

The benchmark has **10 atomic tasks (A–J)**. The earlier composite tasks were separated so each result has a clearer interpretation and unrelated subtasks do not decide the same score.

The GitHub Actions workflow supports either one task (A–J) or the complete **ALL** suite. A single-task run evaluates every selected model on the same prompt and schema. ALL runs ten task batches sequentially; model workers are dispatched concurrently up to the configured in-flight limit, while a shared scheduler controls the start of every actual API attempt.

With the default 12 models:
- One task plans 12 first-pass API requests.
- ALL plans 120 first-pass API requests (10 tasks × 12 models).
- A five-second minimum interval between API attempts schedules 120 first-pass requests over approximately 9 minutes 55 seconds from first start to last start, before response time and any retries.

The default task is A. ALL must be explicitly selected and `confirm_api_call=true` must be set. The optional full-suite CLI also requires `--confirm-all`.

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

## Request pacing, retries, and rate limits

APInex's public errors documentation currently lists **15 requests per minute per account** for its Free tier. The harness uses a conservative five-second minimum interval (approximately 12 requests per minute) to leave headroom. This schedule is shared by all model subprocesses and all ten task batches. It applies to first attempts and retries, not merely to task starts.

This pacing is based on the provider's currently published documentation and should be rechecked if APInex changes its limits. Requests made by other applications using the same APInex account also consume the shared allowance; therefore, pacing cannot guarantee that a 429 will never occur.

- HTTP 429 is recorded and is **not automatically retried**. In ALL mode, a final 429 stops later task batches. This avoids every worker generating another synchronized retry wave after the shared account limit has already been reached.
- HTTP 502/503/504 may be retried at most twice per logical request. The runner respects the full `Retry-After` value (seconds or HTTP date), adds jitter, and sends every retry through the shared pacing scheduler.
- HTTP 401/402/403 stops the remaining ALL batches. Other failures are preserved; a schema-invalid HTTP 200 does not stop other model evaluations.
- Rate-limit response headers, including the available `x-ratelimit-*` fields and `retry-after`, are saved in the result diagnostics.
- Partial results, skipped task batches, and unattempted request counts are reported. Failed or skipped work is never represented as a successful full run.

The concurrency choice is a **maximum number of in-flight model workers**, not a requests-per-minute setting. With the five-second scheduler, a single-task run may take close to one minute to start all 12 models. This is intentional protection for the shared Free-tier quota.

## Fair-comparison controls and known limits

- Every model in a selected task receives the same system prompt, task prompt, response schema, temperature (0), and output-token ceiling.
- The benchmark records the selected model alias, requested and returned model IDs, benchmark version/commit, UTC timestamps, API latency, total elapsed time, pacing wait, retries, request count, token usage, HTTP status, finish reason, and response validation.
- `reasoning_effort` is not explicitly set because APInex documents support only for some model families. The gateway/provider default is therefore used and recorded as such; this is a known comparison limitation, not proof that reasoning budgets are equal.
- JSON/schema validity, returned-ID routing evidence, and answer quality are separate concepts. A valid JSON response or HTTP 200 is not automatically correct or high quality.
- Responses ending with a length-related finish reason are incomplete even if the partial text happens to parse as valid JSON. Responses reaching the output cap without a clear stop reason are marked as suspected truncations and excluded from quality rankings.
- The numerical fixture is checked against fixed expected values. Its validator is isolated to Task C.
- Task G requires exactly six distinct evidence levels; Task H requires all six evidence topics exactly once. These semantic requirements are checked in addition to JSON shape.
- Schemas reject duplicate JSON object keys, malformed JSON, non-standard/non-finite numbers, missing required fields, wrong types, unexpected properties, invalid enum values, and duplicate array items where uniqueness is required.
- Raw response text is preserved in each model result artifact. The harness does not silently repair or rewrite a model's answer.
- One sample per model/task is only a screening result. Repeat shortlisted models on identical, unchanged prompts before close rankings. Temperature 0 does not eliminate all sources of run-to-run variation.

The deterministic validator covers the fixed numerical fixture and output format. It does not fully grade open-ended astrology, engineering, code-audit, or research correctness. Human review using the scoring rubric remains necessary.

## Run instructions

1. Open GitHub Actions → **APInex Celestia Multi-Model Benchmark**.
2. Keep the default 12 model aliases, or enter a smaller selected set.
3. Select one task A–J, or choose **ALL** for all ten tasks.
4. Choose the maximum in-flight concurrency (1, 2, 4, 6, or 12). The global five-second API-attempt pacing remains active at every setting.
5. Set `confirm_api_call=true`.
6. Run the workflow and download the artifact.
7. Inspect each model JSON file, the per-task summaries, and—when ALL is selected—the combined summary.

The API key must remain in GitHub Actions Secrets under `APINEX_API_KEY`. Never put it in a file, commit, prompt, issue, or chat message.

## Allowance accounting

The result artifact records API-reported prompt/completion/total tokens and estimates weighted tokens using the configured APInex catalogue weight. Dashboard allowance before/after and actual debit remain null because the runner cannot verify those values through this API; check the APInex dashboard separately.

Estimated weighted tokens = API total tokens × configured catalogue weight. Catalogue weights are allowance estimates, not quality scores.

## Routing and provider identity

The requested model ID and returned API `model` field are recorded separately. An exact match is gateway-reported routing evidence, not cryptographic proof of upstream weights. Missing or mismatched IDs are excluded from answer-quality rankings as unverified/mismatched routing. A model's self-introduction (for example, "I am Google") is never identity proof.

## Results, artifacts, and privacy

Results are uploaded as GitHub Actions artifacts with 14-day retention and are not committed to the repository. Anyone with sufficient repository Actions/artifact access may be able to access them. Use synthetic, non-sensitive task evidence only.

ALL stores each suite execution in a unique timestamped session folder so reruns cannot accidentally reuse an older task summary. Request-pacing state is removed after the suite finishes; no credentials are written to the pacing state.

## Ranking policy

Publish task-level results first, alongside valid sample counts, schema/routing failures, truncations, critical failures, API latency, retries, and token use. Do not name a universal winner from one sample.

The scoring rubric intentionally does not force one arbitrary aggregate across different constructs. A project-weighted overall score may be published only after its weights are explicitly declared before examining the results. A critical failure must remain visible and cannot be averaged away. Repeat finalists on the same task before close rankings.

## Limits

- This benchmark evaluates model responses to its supplied tasks; it does not test or certify the live Celestia application or its calculation engine.
- Project context supplied in prompts is not proof of current repository state.
- Gateway-returned model IDs are not cryptographic attestation.
- Provider defaults for reasoning effort may differ across model families.
- Dashboard allowance and actual deduction cannot be independently verified by this runner.
- Keep all run artifacts and reports associated with their benchmark version and commit SHA; results from different major benchmark versions are not directly comparable.
