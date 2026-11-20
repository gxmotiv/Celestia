# Celestia AI provider setup

Celestia keeps provider credentials on the server. The website/app selector lets you choose a provider and model; an explicit selection is sent only to that provider. It does not silently switch to a different model or provider if the selected provider fails.

## Free provider options checked on 20 November 2026

| Provider | Free API offer shown in official docs | Celestia option | Credential |
|---|---|---|---|
| APInex | Free-category catalogue IDs; account-specific quota and multiplier apply | 12 APInex model choices | `APINEX_API_KEY` |
| FreeModel | 1M combined prompt/completion tokens per month, up to 60 requests/minute, no card; all catalogue models available | DeepSeek V4.1 Flash, GLM 5.3 Flash, MiMo V2.6 Pro, GPT-6 Luna | `FREEMODEL_API_KEY` |
| NaraRouter | Free plan: Agnes 2.5 Flash, 7M tokens/day, 15 requests/minute, no card | Agnes 2.5 Flash | `NARAROUTER_API_KEY` |
| OpenRouter | Free model variants; 20 requests/minute and 50 requests/day without purchased credits | Free-model auto-router (`openrouter/free`) | `OPENROUTER_API_KEY` |

Free allowances, rate limits, model IDs, and provider availability can change. Check each provider's own dashboard and live model list before relying on a particular model. FreeModel's allowance counts prompt and completion tokens together. OpenRouter's `openrouter/free` route is intentionally used without any paid fallback list. NaraRouter's authenticated `/v1/models` endpoint is the final authority for aliases available to your account.

Official references:
- [APInex Chat Completions](https://apinex.bond/developers/models/chat)
- [FreeModel free API and monthly allowance](https://freemodel.in/free-ai-api)
- [FreeModel API documentation](https://freemodel.in/docs)
- [NaraRouter plans](https://router.bynara.id/pricing)
- [NaraRouter API documentation](https://router.bynara.id/docs)
- [OpenRouter free-model collection](https://openrouter.ai/collections/free-models)
- [OpenRouter free variants and limits](https://openrouter.ai/docs/api_reference/limits)

## Add provider secrets to the Cloudflare Worker

Add only the provider keys you have chosen as **server-side Worker secrets**. Do not place them in source files, browser code, GitHub commits, public repository variables, or chat messages.

| Secret name | Provider dashboard |
|---|---|
| `APINEX_API_KEY` | APInex |
| `FREEMODEL_API_KEY` | FreeModel |
| `NARAROUTER_API_KEY` | NaraRouter |
| `OPENROUTER_API_KEY` | OpenRouter |

The in-app selector displays whether each provider secret is configured. It never returns a key or key fragment to the browser. After adding a secret, redeploy the Worker so the running deployment receives it.

For Cloudflare Workers, add secrets through the Worker secret configuration. Do not put credentials in `wrangler.jsonc`, `.env.example`, or browser variables.

## Routing and no-paid-fallback guarantee

- When a user chooses a model, Celestia routes to that exact provider and provider model ID.
- If its server key is missing, Celestia returns a clear configuration error; it does not send the request to another provider.
- If the provider rejects the request, Celestia surfaces the error; it does not retry with a paid model elsewhere.
- OpenRouter uses only `openrouter/free`, with no paid fallback models in the request.
- Do not add credits or paid balances to any provider account for this project. Stay within the published free allowance; a provider may reject requests after that allowance is exhausted.
- Calls without an explicit model selection retain the legacy APInex → FreeModel → NaraRouter automatic fallback chain. The app's selector always sends an explicit selection.

## Existing model and research limitations

A model passing a JSON fixture or returning HTTP 200 does not establish astrology accuracy. The 20 November 2026 benchmark run passed the numerical fixture task (Task C) for all 12 APInex models, but many free-form task responses failed the strict 1–6 item JSON schema. Do not use the earlier Task D score labels as a current overall ranking. More repeated, schema-valid A–J trials and human review are needed before ranking model quality.

Provider-specific quota weights are usage multipliers, not cash prices. Free API offers are not guarantees of uninterrupted availability or permanent model IDs.
