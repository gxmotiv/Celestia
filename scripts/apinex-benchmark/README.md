# APInex Celestia benchmark

This harness sends **exactly one** Chat Completions request per confirmed workflow run.

## Secret

In GitHub: Settings → Secrets and variables → Actions → New repository secret.

- Name: `APINEX_API_KEY`
- Value: your APInex API key

Never put the key in a file, commit, issue, prompt, or chat message.

## Run safely

1. Open Actions → **APInex Celestia Model Benchmark**.
2. Select one model.
3. Select one task. Start with **H** (routing/identity honesty), then **D** (hallucination check). Tasks A–I are now available.
4. Keep `confirm_api_call` false to make a no-request dry safety run.
5. Only when ready to spend free allowance, set `confirm_api_call` true and run.
6. Download the resulting artifact from the workflow run.
7. Score the response with [the shared model-scoring rubric](../../docs/benchmark/model-scoring-rubric.md).

The single-run workflow sends one logical request per selected model and task. The full-suite runner reads all configured tasks dynamically; the expanded suite is A–I. The runner retries only transient HTTP 429/502/503/504 responses, at most twice; it does not retry authentication, validation, or other client errors. It has no schedule or push trigger. Run comparisons sequentially: keep the task and evidence identical when comparing models; keep the model and evidence identical when comparing tasks.

## Output ceilings

| Task | Purpose | max_tokens |
|---|---|---:|
| D | Hallucination / evidence discipline | 700 |
| A | Calculation integrity audit | 1400 |
| B | Engineering review and safe patch plan | 1400 |
| C | Astrology domain reasoning | 1200 |
| E | Test architecture | 1400 |
| F | Research and evidence quality | 1200 |
| G | Source-grounded repository code audit | 2600 |
| H | Provider identity and routing honesty | 900 |
| I | Real user-facing answer quality | 1400 |

These are output ceilings only. Input tokens also consume allowance. The runner enforces a 45 KB serialized-request ceiling and one 100-second HTTP timeout.

## Allowance accounting

The JSON artifact records API-reported prompt/completion/total tokens and estimates weighted tokens using the configured APInex catalogue weight. Dashboard allowance before/after and actual debit are left null because the runner cannot verify those values through this documented API. Record them manually from the APInex dashboard.

Estimated weighted tokens = API total_tokens × catalogue weight.

## Results and privacy

The response is saved only as a GitHub Actions artifact with 14-day retention; it is not committed to the repository. Anyone with sufficient repository Actions/artifact access may be able to access it. Use synthetic/non-sensitive test context. The API key is passed only as an Actions secret environment variable and is never written into the result or printed.

## Limitations

- The runner validates strict JSON syntax and nested task-specific schemas. Invalid responses are preserved raw in the artifact but counted as failures. It does not semantically grade answer quality; use the shared scoring rubric separately.
- A run is counted as successful only when the API `model` response field exactly matches the requested APInex model ID. Missing or mismatched IDs are marked `routing_unverified` or `model_id_mismatch` and must not enter quality rankings.
- A matching API model field is gateway-reported routing evidence, not cryptographic proof of upstream model weights. Model self-introductions are never identity evidence.
- The workflow runs local Python unit tests before sending a quota-consuming request.
- APInex aliases, weights, free quotas, and model availability can change. Re-check the APInex dashboard/catalogue before each test.
- A successful HTTP response does not establish the upstream model's exact weights or independent quality.
- No benchmark request is made until `confirm_api_call=true`.
- The harness does not inspect Celestia source code or execute Celestia tests. It runs only its own benchmark-runner unit tests before sending API requests.
