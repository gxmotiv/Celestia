# Celestia AI provider free-tier matrix — 23 November 2026

This note records the provider choices reviewed for Celestia. Quotas and model availability can change; the live provider dashboard and API response headers remain authoritative. This is not a promise of continuous availability or low global traffic.

## Recommended provider roles

| Provider | Free allowance reviewed | Reset / limit type | Recommended model use | Celestia policy |
|---|---|---|---|---|
| FreeModel | 1,000,000 combined input + output tokens/month; up to 60 RPM | Monthly allowance; API reports minute limits; HTTP 402 when exhausted | deepseek-v4.1-flash for fast reasoning; glm-5.3-flash for quick bilingual/general work; choose other models only from the authenticated live chat catalogue | Suitable high-volume $0 allowance when the account is on its Free plan. No top-up or paid balance. |
| Groq | For openai/gpt-oss-120b and openai/gpt-oss-20b: 30 RPM, 1,000 RPD, 8K TPM, 200K TPD. For llama-3.1-8b-instant: 30 RPM, 14,400 RPD, 6K TPM, 500K TPD | Daily request/token caps plus per-minute caps. Exact reset countdown is exposed in response headers; do not assume a specific midnight timezone | GPT-OSS 120B for stronger reasoning; GPT-OSS 20B for lighter/faster tasks; Llama 3.1 8B Instant for high-volume simple questions | Recommended new provider, but blocked until GROQ_FREE_PLAN_CONFIRMED=true is explicitly set after checking the account is on the $0 Free plan. No Developer plan, paid upgrades or paid fallback. |
| OpenRouter | Free account: 20 RPM and 50 requests/day for :free variants | Daily request cap; failed attempts count too | openrouter/free for a low-volume spare route | Reserve only. Celestia preflights the live catalogue and accepts only concrete :free model IDs with both input and output price set to zero. Never top up to increase limits. |
| Pollinations | No dependable fixed daily/monthly request allowance is promised by this audit; model-specific published prices and health determine eligibility | Live catalogue pricing and health; provider/key conditions may change | Automatic selection from healthy official text models with explicit zero input and output prices | Keep strict live pricing/health validation. paid_only=false alone is not evidence that a model is free. |
| NaraRouter | Public plan endpoint observed 7,000,000 tokens/day and 15 RPM; published documentation also showed 5,000,000/day and 15 RPM | Daily quota; public docs and pricing endpoint disagreed | No model recommended yet | Keep blocked: the configured account's read-only diagnostics returned 46 model IDs, but none matched Celestia's one explicitly allowlisted Free-plan model agnes-2.5-flash; MCP returned HTTP 200 with no model IDs. Ask provider support to reconcile account entitlement and plan metadata. |
| Cloudflare Workers AI | 10,000 Neurons/day on Workers Free | Resets daily at 00:00 UTC. On Workers Paid, usage above the free allocation is billable | Potential future provider using a verified zero-retention model from the current Free-eligible model list | Do not enable until the account plan is confirmed as Workers Free and an eligible model is verified. Do not use models documented as requiring paid billing. |
| Gemini API | Free-tier model-specific limits vary by model and project | Project/model-specific request/token limits; daily limit reset is documented at midnight Pacific | Possible future opt-in provider | Not selected as the default for personal chart data: Google's free-tier terms say submitted content may be used to improve products. Require explicit privacy consent before use. |

## Sources checked

- [FreeModel Free API and quota](https://freemodel.in/free-ai-api)
- [FreeModel API model catalogue](https://freemodel.in/docs/models)
- [FreeModel authentication and rate-limit headers](https://freemodel.in/docs/authentication)
- [FreeModel Terms: monthly plan allowance and HTTP 402 exhaustion behaviour](https://freemodel.in/terms)
- [Groq rate limits](https://console.groq.com/docs/rate-limits)
- [Groq supported models](https://console.groq.com/docs/models)
- [Groq GPT-OSS 120B model card](https://console.groq.com/docs/model/openai/gpt-oss-120b)
- [OpenRouter free model collection and free-account limits](https://openrouter.ai/collections/free-models/)
- [OpenRouter pricing](https://openrouter.ai/pricing)
- [Cloudflare Workers AI pricing and daily allocation](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Google Gemini API pricing and free-tier data-use distinction](https://ai.google.dev/gemini-api/docs/pricing)

## Operational findings and limitations

1. Provider model lists do not prove an account's exact plan, remaining quota or ability to complete inference. Celestia distinguishes a configured key from a successful provider response.
2. Global queue depth, regional traffic and concurrent user load are not published consistently enough to rank providers by current congestion. Model throughput claims are not a guarantee of low traffic. Measure Celestia's own latency, 429 responses and provider failures only through authorised, cost-safe tests.
3. FreeModel's /v1/models requires the models:read key scope. Chat models are selected dynamically from the authenticated response. The API request path rechecks the catalogue so stale UI options cannot be called.
4. Groq's public quota table is a general plan reference. Account-specific limits can vary; inspect the Groq Console's Limits page. The new integration is hard-disabled unless the operator has confirmed the $0 Free plan.
5. OpenRouter's openrouter/free router may return the concrete model ID rather than the router alias. The integration validates the returned ID against a fresh catalogue of explicit :free variants with zero input and output price.
6. No paid plan, balance top-up, credit purchase, trial, live inference benchmark or production deployment is part of this change.

## Manual Groq setup (only after confirming the $0 plan)

1. Check Groq Console → Billing/Plans and confirm the account is still on Free. Do not select Developer or any pay-as-you-go upgrade.
2. Create an API key and add it only as the Cloudflare Worker server secret GROQ_API_KEY.
3. Set the non-secret Worker variable GROQ_FREE_PLAN_CONFIRMED=true only after checking step 1.
4. Keep GROQ_FREE_PLAN_CONFIRMED unset/false if the plan is unknown, changes, or becomes paid. The Groq models remain disabled in Celestia in that case.
5. Never paste the key into chat, commit it to Git, add it to browser code or print it in CI logs.

## Manual FreeModel setup

- Store FREEMODEL_API_KEY as a server-side Cloudflare Worker secret.
- Ensure the key retains both inference and models:read scopes.
- FreeModel's published Free allowance is 1M input + output tokens/month. Requests that exceed the included allowance are refused with HTTP 402 rather than drawing from prepaid balance under its current Terms. Do not buy credit or a larger plan for this project.
