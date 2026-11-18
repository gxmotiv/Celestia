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
3. Select one task. Start with **D** (hallucination check).
4. Keep `confirm_api_call` false to make a no-request dry safety run.
5. Only when ready to spend free allowance, set `confirm_api_call` true and run.
6. Download the resulting artifact from the workflow run.

The workflow never loops over models or tasks. It does not retry failed API calls. It has no schedule or push trigger.

## Output ceilings

| Task | max_tokens |
|---|---:|
| D — hallucination | 700 |
| A — calculation integrity | 1400 |
| B — engineering review | 1400 |
| C — astrology reasoning | 1200 |
| E — test architecture | 1400 |
| F — research quality | 1200 |

These are output ceilings only. Input tokens also consume allowance. The runner enforces a 45 KB serialized-request ceiling and one 100-second HTTP timeout.

## Allowance accounting

The JSON artifact records API-reported prompt/completion/total tokens and estimates weighted tokens using the configured APInex catalogue weight. Dashboard allowance before/after and actual debit are left null because the runner cannot verify those values through this documented API. Record them manually from the APInex dashboard.

Estimated weighted tokens = API total_tokens × catalogue weight.

## Results and privacy

The response is saved only as a GitHub Actions artifact with 14-day retention; it is not committed to the repository. Anyone with sufficient repository Actions/artifact access may be able to access it. Use synthetic/non-sensitive test context. The API key is passed only as an Actions secret environment variable and is never written into the result or printed.

## Limitations

- The runner does not grade answers automatically. Use the shared scoring rubric separately.
- APInex aliases, weights, free quotas, and model availability can change. Re-check the APInex dashboard/catalogue before each test.
- A successful HTTP response does not establish the upstream model's exact weights or independent quality.
- No benchmark request is made until `confirm_api_call=true`.
- The harness does not inspect Celestia source code or execute Celestia tests.
