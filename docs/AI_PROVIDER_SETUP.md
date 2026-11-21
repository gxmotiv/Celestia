# Celestia AI provider setup

Celestia keeps provider credentials on the server. The model selector offers a live Pollinations catalogue and optional independent providers. An explicit selection is routed only to that provider/model. Celestia does not silently switch providers or substitute a paid model.

## Primary provider: Pollinations

Pollinations exposes OpenAI-compatible Chat Completions at `https://gen.pollinations.ai/v1/chat/completions`. Model discovery is public and does not need a key; text generation requires a secret `sk_` key from [enter.pollinations.ai](https://enter.pollinations.ai/).

Official documentation: [Pollinations API](https://gen.pollinations.ai/).

Celestia's server-side catalogue fetches `GET https://gen.pollinations.ai/text/models?source=official&reliability=all`, then keeps only:
- Official Pollinations text models returned by that endpoint.
- Models explicitly reporting a healthy status.
- Models whose published pricing values are all numeric zero (including prompt and completion prices).

The remaining models are sorted from lowest to highest published price. Because the eligible models are all zero-priced, this is effectively a stable price-low ordering. The selector refreshes the list through Celestia's API and generation rechecks that the selected model is still eligible before sending a request. If no eligible model is available, generation stops rather than using a paid model.

A zero-priced model is free at the Pollinations layer according to its official documentation. It does not guarantee uninterrupted availability or a permanent model ID. Pollinations may change catalogue fields, pricing, or health. If its catalogue shape changes, the safe behaviour is to show no eligible models rather than assume a model is free.

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

- The default selection is Pollinations automatic-free mode. It resolves to the first currently healthy, official, zero-priced text model.
- A named Pollinations model is checked against the current live free/healthy catalogue immediately before generation.
- Missing credentials, a stale/paid model, exhausted provider access, or an upstream error is reported. There is no silent fallback to another provider.
- The Pollinations model catalogue endpoint is public, but generation requires `POLLINATIONS_API_KEY`.
- No provider key is returned to the browser.
- Pollinations model metadata and price fields are authoritative; Celestia does not infer free status from model names.

## Historical benchmark records

The former APInex benchmark runs, workflow files, and result artifacts are retained as historical research records only. APInex is removed from Celestia's active model selector, provider-status endpoint, environment template, and generation routing. Historical APInex scores must not be treated as Pollinations benchmarks or current model rankings.

A model passing a JSON fixture or returning HTTP 200 does not establish astrology accuracy. Continue validating calculation-grounded answers against known fixtures, schema validity, repeatability, and human review.
