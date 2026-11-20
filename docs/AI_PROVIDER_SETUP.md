# Celestia AI provider setup

Celestia uses APInex as its primary server-side AI provider. Gemini has been removed from the application provider chain. Optional FreeModel and NaraRouter integrations remain as fallbacks. API keys are read only on the server and are never returned to the browser.

## Primary APInex models

Set `APINEX_API_KEY` as a server-side secret in the Cloudflare Worker (or the server-side secret manager used by the deployment). Never commit the key, place it in browser code, or paste it into chat.

APInex uses the OpenAI-compatible endpoint `https://api.apinex.bond/v1/chat/completions`.

| Celestia tier | APInex model | Purpose |
|---|---|---|
| reasoning (detailed chart readings and Oracle work) | `free/deepseek-v4.1-flash` | Primary detailed-reasoning model; requests high reasoning effort |
| budget (routine/short requests) | `free/mimo-v2.6-pro` | Lower-quota-weight alternative |

Optional server-side overrides:
- `APINEX_BASE_URL`: defaults to `https://api.apinex.bond/v1`.
- `APINEX_REASONING_MODEL`: defaults to `free/deepseek-v4.1-flash`.
- `APINEX_BUDGET_MODEL`: defaults to `free/mimo-v2.6-pro`.

The model IDs above match the APInex catalogue IDs used by the Celestia benchmark configuration. Confirm current availability and free-category eligibility in the APInex dashboard before relying on a fixed quota. APInex documents the OpenAI-compatible Chat Completions endpoint, Bearer authentication, `max_tokens`, and `reasoning_effort` values. See [APInex Chat Completions documentation](https://apinex.bond/developers/models/chat).

## Provider fallback order

1. APInex, when `APINEX_API_KEY` is configured.
2. FreeModel, when `FREEMODEL_API_KEY` is configured and APInex is unavailable due to a transient/network/upstream failure or unavailable model.
3. NaraRouter, when `NARAROUTER_API_KEY` is configured and the previous provider is unavailable.

Gemini is not part of the provider chain. Authentication, permission, and billing errors are surfaced instead of being silently hidden by another provider.

## Optional FreeModel fallback

- `FREEMODEL_API_KEY`: server-side key.
- `FREEMODEL_MODEL`: budget fallback model; defaults to `gpt-6-luna`.
- `FREEMODEL_REASONING_MODEL`: reasoning fallback model; defaults to `claude-haiku-5.5`.

## Optional NaraRouter fallback

- `NARAROUTER_API_KEY`: server-side key.
- `NARAROUTER_BASE_URL`: defaults to `https://router.bynara.id/v1`.
- `NARAROUTER_MODEL`: budget fallback alias; defaults to `auto/bynara`.
- `NARAROUTER_REASONING_MODEL`: reasoning fallback alias; defaults to `NARAROUTER_MODEL`.

NaraRouter advertises a free plan with daily quota and request limits; check its current pricing/eligibility before relying on it.

## Usage, safety, and testing

- Celestia returns the actual provider, model returned by the gateway, and prompt/completion/total token usage when supplied by the upstream API.
- Keys are never returned to the client.
- The local data-only fallback remains available if no configured provider can produce a response.
- APInex quota weights are provider-side allowance multipliers, not a direct cash-price guarantee. Check the live dashboard for the account's actual allowance and debit.
- A successful API response or valid JSON does not prove astrology correctness. Compare models using identical chart evidence and score calculation accuracy, tradition-specific rule adherence, unsupported-claim rate, reasoning quality, consistency, latency, and weighted token usage.

For Cloudflare Workers, add secrets through the Worker secret configuration. Do not put credentials in `wrangler.jsonc`, `.env.example`, browser variables, or source code.
