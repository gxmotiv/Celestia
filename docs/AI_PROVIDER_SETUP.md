# Celestia AI provider setup

Celestia keeps provider credentials on the server. The model selector offers a live Pollinations catalogue and optional independent providers. An explicit selection is routed only to that provider/model. Celestia does not silently switch providers or substitute a paid model.

## Primary provider: Pollinations

Pollinations exposes OpenAI-compatible Chat Completions at `https://gen.pollinations.ai/v1/chat/completions`. Model discovery is public and does not need a key; text generation requires a secret `sk_` key from [enter.pollinations.ai](https://enter.pollinations.ai/).

Official references:
- [Pollinations API documentation](https://gen.pollinations.ai/)
- [Official model catalogue schema](https://github.com/pollinations/pollinations/blob/main/gen.pollinations.ai/src/docs/models.md)
- [Official model registry schema and pricing fields](https://github.com/pollinations/pollinations/blob/main/shared/registry/model-info.ts)

Celestia fetches `GET https://gen.pollinations.ai/text/models?source=official&reliability=all&limit=500`. The official `/text/models` response uses `name` as the canonical model ID, `category: "text"`, `health.status`, and a `pricing` object whose currency is `pollen`. The registry omits zero-valued price fields; a free model therefore has a pricing object containing only its currency when no usage prices apply.

Celestia then applies stricter local checks:
- Official catalogue entry; not community-sourced.
- `category: "text"`, text input/output, and `/v1/chat/completions` support.
- `health.status === "healthy"`.
- No paid-only restriction, specialized classifier role, positive price fields, paid pricing variants, or paid pricing adjustments.
- No explicit description warning that prompts may be retained or used for training for automatic selection. This is a conservative privacy guard because Celestia may send personal birth/chart details to an AI provider.
- Models with explicit retention/training warnings are returned separately as manual-only choices. They are never auto-selected and require an explicit in-app acknowledgement before generation.
- Unknown pricing fields fail closed rather than being assumed free.

The automatic eligible list is sorted by published input + output price. Since all eligible entries are zero-priced, the final tie-break is model name. Generation rechecks the current catalogue before sending any prompt. If no suitable model passes these checks, Celestia stops instead of selecting a paid, specialized, or privacy-risk model. A separate manual-only list may expose models that otherwise pass the zero-price, health, and general-purpose checks but carry an explicit retention/training warning. Those require an explicit acknowledgement, are revalidated before generation, and are never considered by automatic mode.

**Live research finding (21 November 2026):** the Pollinations model directory showed two healthy zero-priced text entries in the inspected snapshot. Qwen3Guard 8B is a specialized safety classifier and remains excluded. Glyph Cluster is a general-purpose reasoning model but explicitly warns that prompts and replies may be retained and used for training; it is exposed only as a manual opt-in, with a consent checkbox and a server-side acknowledgement check. It is not used by automatic mode. No other suitable general-purpose model passed the inspected zero-price and health checks. The list can change as Pollinations updates its catalogue.

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
| NaraRouter | Agnes 2.5 Flash / configured alias | `NARAROUTER_API_KEY` |
| OpenRouter | Free-model auto-router (`openrouter/free`) | `OPENROUTER_API_KEY` |

Optional provider limits and availability can change. Check the provider's own dashboard and current terms before relying on a particular offer.

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
