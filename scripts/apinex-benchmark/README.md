# Celestia APInex multi-model benchmark

## Design

The benchmark has **10 atomic tasks (A–J)**. Earlier composite tasks were split so unrelated capabilities no longer determine the same task score.

The GitHub Actions workflow supports one task (A–J) or the complete **ALL** suite. ALL is explicit; the default task is A. Each task gives all selected models the same prompt and schema. In ALL mode, tasks run sequentially, and selected model/trial workers are launched subject to the in-flight concurrency limit and shared request scheduler.

With the default 12 models:
- One task plans 12 first-pass requests per trial.
- ALL plans 120 first-pass requests per trial.
- The workflow supports 1, 3, or 5 trials (default 1).
- ALL therefore plans 120, 360, or 600 first-pass model/task/trial requests for 1, 3, or 5 trials.
- A five-second minimum interval schedules 120 requests over approximately 9 minutes 55 seconds from first start to last start, before response time and retries. Three and five trials take approximately 30 and 50 minutes respectively, before response time and retries.

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

## Request pacing, retries, and safety stop

APInex's public errors documentation currently lists **15 requests per minute per account** for its Free tier. The harness uses a conservative five-second minimum interval (approximately 12 requests per minute) to leave headroom. This schedule is shared by all model subprocesses, all trials, and all ten task batches. It applies to first attempts and retries.

This pacing is based on the provider's currently published documentation and should be rechecked if APInex changes its limits. Requests made by other applications using the same APInex account also consume the shared allowance; pacing cannot guarantee that a 429 will never occur.

- HTTP 429 is recorded and is **not automatically retried**. HTTP 401/402/403 are also treated as shared safety-stop conditions.
- On HTTP 401/402/403/429, the worker marks the shared schedule halted. Workers still waiting for a request slot check this marker and save a skipped result without sending the queued API call. Requests already in flight cannot be recalled and may still finish.
- In ALL mode, a final 401/402/403/429 stops all later task batches. Partial results, skipped workers/tasks, and unattempted counts remain visible.
- HTTP 502/503/504 may be retried at most twice per logical trial. The runner respects the full `Retry-After` value (seconds or HTTP date), adds jitter, and routes each retry through the same shared schedule.
- Rate-limit response headers, including available `x-ratelimit-*` fields and `retry-after`, are saved in diagnostics.
- HTTP 200 with invalid JSON/schema does not stop other tasks. Other failures are preserved and not silently repaired.

The concurrency setting is the **maximum number of in-flight workers**, not a requests-per-minute setting. The five-second scheduler controls request starts regardless of the selected concurrency.

## Fair-comparison controls and known limits

- Every model within a selected task receives the same system prompt, task prompt, response schema, temperature (0), and output-token ceiling.
- The benchmark records model alias, requested/returned model IDs, trial number, benchmark version/commit, timestamps, API latency, total elapsed time, pacing wait, retry wait/count, actual API attempts, token usage, HTTP status, finish reason, and validation result.
- `reasoning_effort` is not explicitly set because APInex documents support only for some model families. Provider defaults are used and this is recorded as a known comparison limitation; identical reasoning budgets are not claimed.
- JSON/schema validity, returned-ID routing evidence, and answer quality are separate concepts. A valid JSON response or HTTP 200 is not automatically a correct or high-quality answer.
- Responses ending because of a length-related finish reason are incomplete even if partial text happens to parse as valid JSON. Responses reaching the output cap without a clear end-of-turn reason are marked as suspected truncations.
- The numerical fixture is checked against fixed expected values. Its validator is isolated to Task C.
- Task G requires exactly the six named evidence levels, each once. Task H requires all six evidence topics exactly once.
- Schemas reject duplicate JSON object keys, malformed JSON, non-standard/non-finite numbers, missing required fields, wrong types, unexpected properties, invalid enums, and duplicate array entries where uniqueness is required.
- Raw response text is preserved. The harness never silently repairs an answer.
- One trial is a screening result. Use 3 or 5 trials for finalists or close comparisons; keep the prompt/configuration unchanged across repeated trials. Temperature 0 does not eliminate all run-to-run variation.

The validator checks output structure and the fixed numerical fixture. It does not fully grade open-ended astrology, engineering, source-audit, or research correctness. Human review using the scoring rubric remains necessary.

## Run instructions

1. Open GitHub Actions → **APInex Celestia Multi-Model Benchmark**.
2. Keep the default 12 model aliases, or enter a smaller selected set.
3. Select one task A–J, or choose **ALL** for all ten tasks.
4. Choose maximum in-flight concurrency (1, 2, 4, 6, or 12). The global five-second API-attempt pacing remains active.
5. Choose **1, 3, or 5 trials**. Start with 1 for a screening run; use 3 or 5 for finalists.
6. Set `confirm_api_call=true`. With all 12 models, ALL means 120/360/600 first-pass requests for 1/3/5 trials.
7. Run the workflow and download the artifact.
8. Inspect each model/trial JSON file, the per-task summaries, and—when ALL is selected—the combined summary.

The API key must remain in GitHub Actions Secrets under `APINEX_API_KEY`. Never put it in a file, commit, prompt, issue, or chat message.

## Request and allowance accounting

Reports distinguish:
- planned model/task/trial requests;
- result rows reported;
- logical model/task/trial requests that actually sent at least one API call;
- requests not attempted;
- physical API attempts, including retries;
- successful, failed-after-send, and skipped-before-send results.

API-reported prompt/completion/total tokens and estimated weighted tokens are recorded. Dashboard allowance before/after and actual debit remain null because the runner cannot independently verify those values through this API; check the APInex dashboard separately.

Estimated weighted tokens = API total tokens × configured APInex catalogue weight. Catalogue weights are allowance estimates, not quality scores.

## Routing and provider identity

The requested model ID and returned API `model` field are recorded separately. An exact match is gateway-reported routing evidence, not cryptographic proof of upstream weights. Missing or mismatched IDs are excluded from answer-quality rankings as unverified/mismatched routing. A model's self-introduction (for example, "I am Google") is never identity proof.

## Results, artifacts, and privacy

Results are uploaded as GitHub Actions artifacts with 14-day retention and are not committed to the repository. Anyone with sufficient repository Actions/artifact access may be able to access them. Use synthetic, non-sensitive task evidence only.

Each ALL execution uses a unique timestamped session folder so reruns cannot reuse an older task summary. Shared pacing state is removed after the suite; no credentials are written to it.

## Ranking policy

Publish task-level results first, alongside valid sample counts, schema/routing failures, truncations, critical failures, API latency, retries, and token use. Do not name a universal winner from one sample.

Use 3 or 5 identical trials for shortlisted models before close rankings. Report each sample and a suitable summary of variation. The scoring rubric does not force one arbitrary aggregate across different constructs. A project-weighted overall score may be published only after its weights are declared before examining finalist results. A critical failure must remain visible and cannot be averaged away.

## Limits

- This benchmark evaluates model responses to supplied tasks; it does not test or certify the live Celestia application or calculation engine.
- Project context supplied in prompts is not proof of current repository state.
- Gateway-returned model IDs are not cryptographic attestation.
- Provider-default reasoning effort may differ across model families.
- APInex rate limits are account-wide and may change; external usage of the same account can still cause 429 errors.
- Dashboard allowance and actual deduction cannot be independently verified by this runner.
- Results from different major benchmark versions are not directly comparable.
