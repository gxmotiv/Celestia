# Celestia AI provider setup

Celestia uses FreeModel server-side and keeps Gemini as a backup.

## Configure FreeModel

1. Add `FREEMODEL_API_KEY` to your hosting platform's server-side secret manager. The key needs the `inference` scope. Do not paste it into source code, a browser variable, GitHub commits, or chat.
2. Celestia selects an available catalogue model automatically. The current defaults are:
   - `gpt-6-luna` for concise readings and routine requests.
   - `claude-haiku-5.5` for detailed chart reports and Master Oracle consultations.
3. Optional server-side overrides:
   - `FREEMODEL_MODEL`: change the standard/budget model.
   - `FREEMODEL_REASONING_MODEL`: change the model used for detailed reasoning.
4. The authenticated `GET https://freemodel.in/v1/models` response is the final source of truth for the IDs available to your key. A model-not-found response triggers one fallback attempt with `gpt-6-luna`.
5. Keep `GEMINI_API_KEY` configured as a backup. Gemini is used when FreeModel is not configured or a transient/network/upstream failure occurs. Invalid credentials and billing failures are not silently hidden by fallback.

FreeModel's key remains on the server. The application never returns it to the browser.

## Token budget and routing behavior

- Concise reports use the budget tier; detailed reports and Master Oracle use the reasoning tier.
- Output budgets are 2,048 tokens for concise reports and Oracle answers, and 4,096 for detailed reports.
- FreeModel documents a 2,048-token minimum for `max_tokens`; reasoning tokens may consume part of the completion budget.
- Prompt and completion tokens both count toward the allowance. The Oracle only sends the latest four conversation turns, with per-message length limits.
- The API response includes the actual provider, actual model returned by the gateway, and prompt/completion/total token usage when supplied by the provider.
- A local data-only fallback is returned only when no configured provider can produce a response.

## Model selection advice

The defaults separate genuinely lightweight requests from work where interpretation quality matters:

- `claude-haiku-5.5`: the default for both concise and detailed astrology reports and Master Oracle consultations. A concise report changes the answer length, not the model's reasoning quality.
- `gpt-6-luna`: the lower-cost budget tier for future lightweight classification, summaries, and other low-stakes tasks. It is not used for the app's astrology interpretation endpoints by default.
- If the configured reasoning model ID is unavailable and FreeModel returns 404, Celestia retries once with `gpt-6-luna` so the feature can still respond; the actual model is returned to the UI.

Artificial Analysis Intelligence Index v5 (October 27, 2026) scores Claude Haiku 5.5 at 36 and DeepSeek V4.1 Flash 1017 at 33; its estimated cost per benchmark task is $0.41 versus $0.60, respectively. These are benchmark-task estimates, not a promise of equal cost for every Celestia request. See the [Artificial Analysis v5 methodology and results](https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v5).

The authenticated FreeModel model list and dashboard usage are authoritative for the model IDs and token rates actually available to your key. Benchmark scores are not a substitute for Celestia-specific testing; compare chart-interpretation correctness, factual discipline, user satisfaction, latency, and tokens per completed response before changing defaults.

## Deploying

Set the two FreeModel variables as server-side variables/secrets in the environment that runs the Next.js API routes. For Cloudflare Workers, use the Worker's secret/variable configuration rather than committing secrets into `wrangler.jsonc`, `.env.example`, or GitHub.
