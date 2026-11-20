# APInex Celestia benchmark

The harness sends one Chat Completions request per selected model/task pair. A single-model run sends one request; the 12-model × five-task comparison sends 60 requests.

## Secret

In GitHub: Settings → Secrets and variables → Actions → New repository secret.

- Name: `APINEX_API_KEY`
- Value: your APInex API key

Never put the key in a file, commit, issue, prompt, or chat message.

## Run safely

1. Open Actions → **APInex Celestia Model Benchmark**.
2. Select one model.
3. Select one of five composite tasks. Start with **D** for provider identity and honesty.
4. Keep `confirm_api_call` false to make a no-request dry safety run.
5. Only when ready to spend free allowance, set `confirm_api_call` true and run.
6. Download the resulting artifact from the workflow run.
7. Score the response with [the shared model-scoring rubric](../../docs/benchmark/model-scoring-rubric.md).

The single-run workflow sends one logical request per selected model and task. For the 12-model comparison, use Actions → **APInex Celestia Multi-Model Benchmark**. Choose `ALL` to run every configured task A–E for every selected model. With all 12 models selected, that is **60 logical requests** (before any bounded transient retries), so review your remaining free allowance first. The full-suite runner reads configured tasks dynamically. The runner retries only transient HTTP 429/502/503/504 responses, at most twice; it does not retry authentication, validation, or other client errors. It has no schedule or push trigger. Run comparisons sequentially: keep the task and evidence identical when comparing models; keep the model and evidence identical when comparing tasks.

## Output ceilings

| Task | Combined coverage | max_tokens |
|---|---|---:|
| A | Calculation integrity + astrology-system reasoning + numerical reference fixture | 3800 |
| B | Engineering review + test architecture + source-grounded code audit | 4200 |
| C | Research quality and predictive-validation design | 2200 |
| D | Hallucination resistance + provider identity and routing honesty | 2200 |
| E | Real user-facing Celestia answer quality | 1400 |

These are output ceilings only. Input tokens also consume allowance. The runner enforces a 45 KB serialized-request ceiling and one 100-second HTTP timeout. The multi-model `ALL` workflow has a 6-hour job ceiling.

## Allowance accounting

The JSON artifact records API-reported prompt/completion/total tokens and estimates weighted tokens using the configured APInex catalogue weight. Dashboard allowance before/after and actual debit are left null because the runner cannot verify those values through this documented API. Record them manually from the APInex dashboard.

Estimated weighted tokens = API total_tokens × catalogue weight.

## Results and privacy

The response is saved only as a GitHub Actions artifact with 14-day retention; it is not committed to the repository. Anyone with sufficient repository Actions/artifact access may be able to access it. Use synthetic/non-sensitive test context. The API key is passed only as an Actions secret environment variable and is never written into the result or printed.

## Limitations

- The runner validates strict JSON syntax and nested task-specific schemas. Task A's numeric-fixture module receives deterministic semantic grading against the supplied reference longitudes (zodiac signs, degree offsets and ayanamsha arcseconds). Invalid responses are preserved raw in the artifact but counted as failures. It does not semantically grade answer quality; use the shared scoring rubric separately.
- A run is counted as successful only when the API `model` response field exactly matches the requested APInex model ID. Missing or mismatched IDs are marked `routing_unverified` or `model_id_mismatch` and must not enter quality rankings.
- A matching API model field is gateway-reported routing evidence, not cryptographic proof of upstream model weights. Model self-introductions are never identity evidence. A reply saying 'I am Google' or 'built by Google' is not accepted as proof; check the artifact's `requested_model_id`, `returned_model`, `routing_status` and provider metadata.
- The workflow runs local Python unit tests before sending a quota-consuming request.
- APInex aliases, weights, free quotas, and model availability can change. Re-check the APInex dashboard/catalogue before each test.
- A successful HTTP response does not establish the upstream model's exact weights or independent quality.
- No benchmark request is made until `confirm_api_call=true`.
- The harness does not inspect Celestia source code or execute Celestia tests. It runs only its own benchmark-runner unit tests before sending API requests.
