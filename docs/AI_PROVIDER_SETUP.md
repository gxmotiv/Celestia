# Celestia AI provider setup

Celestia keeps provider credentials on the server. The model selector offers a live Pollinations catalogue and optional independent providers. An explicit selection is routed only to that provider/model. Celestia does not silently switch providers or substitute a paid model.

## Primary provider: Pollinations

Pollinations exposes OpenAI-compatible Chat Completions at `https://gen.pollinations.ai/v1/chat/completions`. Model discovery is public and does not need a key; text generation requires a secret `sk_` key from [enter.pollinations.ai](https://enter.pollinations.ai/).

Official references:
- [Pollinations API documentation](https://gen.pollinations.ai/)
- [Official model catalogue schema](https://github.com/pollinations/pollinations/blob/main/gen.pollinations.ai/src/docs/models.md)
- [Official model registry schema and pricing fields](https://github.com/pollinations/pollinations/blob/main/shared/registry/model-info.ts)
- [Pollinations privacy policy, including community-provider data handling](https://pollinations.ai/privacy)

Celestia fetches both `GET https://gen.pollinations.ai/text/models?source=official&reliability=all&limit=500` and `GET https://gen.pollinations.ai/text/models?source=community&reliability=all&limit=500`. Current catalogue entries expose the canonical model identifier in `id` (with older `name`-based responses accepted as a compatibility fallback), plus `category: "text"`, `health.status`, and a `pricing` object whose currency is `pollen`. The registry omits zero-valued price fields; a free model therefore has a pricing object containing only its currency when no usage prices apply.

Celestia then applies stricter local checks:
- For automatic selection: official catalogue entry; not community-sourced.
- Community catalogue entries are manual-only because their upstream providers operate independently of Pollinations.
- `category: "text"`, text input/output, and `/v1/chat/completions` support.
- `health.status === "healthy"`.
- No paid-only restriction, specialized classifier role, positive price fields, paid pricing variants, or paid pricing adjustments.
- No explicit description warning that prompts may be retained or used for training for automatic selection. This is a conservative privacy guard because Celestia may send personal birth/chart details to an AI provider.
- Models with explicit retention/training warnings and all community models are returned separately as manual-only choices. They are never auto-selected and require an explicit in-app acknowledgement before generation.
- Unknown pricing fields fail closed rather than being assumed free.

The automatic eligible list is sorted by published input + output price. Since all eligible entries are zero-priced, the final tie-break is model name. Generation rechecks the current catalogue before sending any prompt. If no suitable model passes these checks, Celestia stops instead of selecting a paid, specialized, or privacy-risk model. A separate manual-only list may expose models that otherwise pass the zero-price, health, and general-purpose checks but are community-hosted or carry an explicit retention/training warning. Those require an explicit acknowledgement, are revalidated before generation, and are never considered by automatic mode.

**Live research finding (21 November 2026):** the official catalogue showed Qwen3Guard 8B (specialized classifier) and Glyph Cluster (general-purpose reasoning, but explicit retention/training warning). The community catalogue also showed zero-priced healthy candidates, including GLM 5.3 Flash (100% success across 50 requests) and Nemotron 3.5 Lightning (98% across 50 requests). These community endpoints are manual-only because Pollinations states that external community providers control their own data handling and are not verified by Pollinations. Automatic selection remains restricted to official, privacy-safe models. The list and health values can change.

A zero-priced model means no published model-token price at the Pollinations layer; it does not guarantee permanent availability, unlimited usage, or zero cost for every optional capability. Pollinations may change catalogue fields, prices, health, access permissions, or model IDs. If the schema changes, Celestia shows no eligible models rather than assuming a model is free.

## Add the Pollinations secret to the Cloudflare Worker

1. Create a secret key at [enter.pollinations.ai/keys](https://enter.pollinations.ai/keys).
2. Give it permission to call text models. Do not expose the secret in browser code, source files, GitHub commits, public variables, or chat.
3. Add it to the Celestia Cloudflare Worker as the server-side secret named `POLLINATIONS_API_KEY`.
4. Do not add paid credits or a paid fallback. Select only models shown by Celestia as $0 input and $0 output.
5. Redeploy the Worker after adding the secret.

Pollinations documents secret keys (`sk_`) for API requests and App Keys (`pk_`) for user-authorised Pollinations Pay flows. A `pk_` key is not itself an API bearer token. Celestia's current server-side integration expects a secret `sk_` key.

## Optional providers

| Provider | Celestia option | Credential |
|---|---|---|
| FreeModel | Selected FreeModel catalogue models | `FREEMODEL_API_KEY` |
| NaraRouter | Live authenticated Free-plan models only (Agnes 2.5 Flash, Laguna S 2.1, Nemotron 3.5 Lightning Free) | `NARAROUTER_API_KEY` |
| OpenRouter | Free-model auto-router (`openrouter/free`) | `OPENROUTER_API_KEY` |

NaraRouter official references: [API docs](https://router.bynara.id/docs) and [live pricing/plans](https://router.bynara.id/pricing). NaraRouter's current public Free-plan listing includes Agnes 2.5 Flash, Laguna S 2.1, and Nemotron 3.5 Lightning Free, with a shared 7M-token daily quota and 15 requests/minute. Its English pricing page and localized landing page have shown different subsets at different times, so Celestia uses a conservative three-model allowlist and still requires each alias to appear in the authenticated `/v1/models` response. The authenticated `GET /v1/models` endpoint returns the aliases available to the account. Celestia intersects that list with the provider-published Free-plan model allowlist; all other aliases are hidden from the selector and rejected again before generation. This is intentionally fail-closed so an API key that also has paid entitlements cannot accidentally spend credits through Celestia. The plan's quota and model availability can change; verify the provider dashboard before use.

## NaraRouter setup

1. Create an API key in the [NaraRouter dashboard](https://router.bynara.id/).
2. Add it to the Cloudflare Worker as the server-side secret `NARAROUTER_API_KEY`; never put it in browser code, a public GitHub variable, or chat.
3. Keep `NARAROUTER_BASE_URL` at `https://router.bynara.id/v1` unless the provider officially changes it.
4. Celestia calls authenticated `GET /v1/models` and displays only the current provider-published Free-plan aliases. It does not default to the old `auto/bynara` router alias; it shows the known Free-plan aliases only after authenticated discovery confirms availability.
5. Link your Telegram account in the NaraRouter dashboard if the provider requires it for free-model access. Its official onboarding notice says Telegram linking is required to use Free models.
6. Generation rechecks the same allowlist before sending a prompt. If no Free model is returned, the request is blocked rather than falling through to a paid model.

The Free plan is quota-limited (7M tokens/day and 15 requests/minute according to the provider's current public pages). The provider explicitly warns that the 7M daily quota does not make every model free: PAYG-enabled keys may see paid models in `/v1/models`, and those are billed from balance. Celestia therefore intersects the account catalogue with a strict Free-plan allowlist. “Free” does not mean unlimited. Celestia does not run paid NaraRouter benchmark calls or select paid models.

## Routing and cost safeguards

- The default selection is Pollinations automatic-free mode, but it resolves only when a currently eligible model exists.
- A named Pollinations model is checked against the current live free/healthy/privacy-filtered catalogue immediately before generation.
- Missing credentials, a stale/paid model, exhausted provider access, or an upstream error is reported. There is no silent fallback to another provider.
- The Pollinations model catalogue endpoint is public, but generation requires `POLLINATIONS_API_KEY`.
- No provider key is returned to the browser.
- Pollinations model metadata and price fields are authoritative; Celestia does not infer free status from model names.

## Historical benchmark records

The former APInex benchmark runs, workflow files, and result artifacts are retained as historical research records only. APInex is removed from Celestia's active model selector, provider-status endpoint, environment template, and generation routing. Historical APInex scores must not be treated as Pollinations benchmarks or current model rankings.

A model passing a JSON fixture or returning HTTP 200 does not establish astrology accuracy. Continue validating calculation-grounded answers against known fixtures, schema validity, repeatability, and human review.
