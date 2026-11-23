# Celestia AI provider free-tier matrix — 23 November 2026

This note records the provider choices reviewed for Celestia. Quotas and model availability can change; the live provider dashboard and API response headers remain authoritative. This is not a promise of continuous availability or low global traffic.

## Recommended provider roles

| Provider | Free allowance reviewed | Reset / limit type | Recommended model use | Celestia policy |
|---|---|---|---|---|
| FreeModel | 1,000,000 combined input + output tokens/month; up to 60 RPM | Monthly allowance; resets each billing period | Models are chosen from the authenticated live chat catalogue | Free-plan requests stop with HTTP 402 when allowance is exhausted; Day Pass tokens are used first when a purchased pass is active. Celestia keeps inference blocked until the $0 plan and zero prepaid/Day Pass balance are confirmed. |
| Groq | For openai/gpt-oss-120b, openai/gpt-oss-20b and qwen/qwen3.8-27b: 30 RPM, 1,000 RPD, 8K TPM, 200K TPD | Daily request/token caps plus per-minute caps. Exact reset countdown is exposed in response headers; do not assume a specific midnight timezone | GPT-OSS 120B for stronger reasoning; GPT-OSS 20B for lighter/faster tasks; Qwen 3.8 27B as a third-party alternative | Recommended new provider, but blocked until GROQ_FREE_PLAN_CONFIRMED=true is explicitly set after checking the account is on the $0 Free plan. No Developer plan, paid upgrades or paid fallback. |
| OpenRouter | Free account: 20 RPM and 50 requests/day for :free variants | Daily request cap; failed attempts count too | openrouter/free for a low-volume spare route | Reserve only. Celestia preflights the live catalogue and accepts only concrete :free model IDs with both input and output price set to zero. Never top up to increase limits. |
| Pollinations | No dependable fixed daily/monthly request allowance is promised by this audit; model-specific published prices and health determine eligibility | Live catalogue pricing and health; provider/key conditions may change | Automatic selection from healthy official text models with explicit zero input and output prices | Keep strict live pricing/health validation. paid_only=false alone is not evidence that a model is free. |
| NaraRouter | Public plan endpoint observed 7,000,000 tokens/day and 15 RPM; published documentation also showed 5,000,000/day and 15 RPM | Daily quota; public docs and pricing endpoint disagreed | No model recommended yet | Keep blocked: the configured account's read-only diagnostics returned 46 model IDs, but none matched Celestia's one explicitly allowlisted Free-plan model agnes-2.5-flash; MCP returned HTTP 200 with no model IDs. Ask provider support to reconcile account entitlement and plan metadata. |
| Cloudflare Workers AI | 10,000 shared Neurons/day on Workers Free | Resets daily at 00:00 UTC; excess operations fail on Workers Free. On Workers Paid, usage above the allocation costs $0.011/1,000 Neurons | @cf/openai/gpt-oss-20b for lower-latency reasoning; @cf/qwen/qwen3.8-27b for longer-context multilingual reasoning and vision. Both are documented as zero-data-retention and are not in Cloudflare's current list of models requiring paid billing | Best fit for Celestia because it runs through the existing Worker binding without another vendor API key. Hard-block inference until the Workers Free plan is manually confirmed. Never enable this for a Workers Paid account. |
| Gemini API | Free-tier model-specific limits vary by model and project | Project/model-specific request/token limits; daily limit reset is documented at midnight Pacific | Possible future opt-in provider | Not selected as the default for personal chart data: Google's free-tier terms say submitted content may be used to improve products. Require explicit privacy consent before use. |

## Sources checked

- [FreeModel Free API and quota](https://freemodel.in/free-ai-api)
- [FreeModel API model catalogue](https://freemodel.in/docs/models)
- [FreeModel authentication and rate-limit headers](https://freemodel.in/docs/authentication)
- [FreeModel Terms: monthly plan allowance and HTTP 402 exhaustion behaviour](https://freemodel.in/terms)
- [FreeModel pricing: Day Pass tokens are consumed first; exhausted plan allowance pauses requests](https://freemodel.in/pricing)
- [Groq rate limits](https://console.groq.com/docs/rate-limits)
- [Groq supported models](https://console.groq.com/docs/models)
- [Groq GPT-OSS 120B model card](https://console.groq.com/docs/model/openai/gpt-oss-120b)
- [OpenRouter free model collection and free-account limits](https://openrouter.ai/collections/free-models/)
- [OpenRouter pricing](https://openrouter.ai/pricing)
- [Cloudflare Workers AI pricing and daily allocation](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Cloudflare GPT-OSS 20B model card and zero-data-retention status](https://developers.cloudflare.com/workers-ai/models/gpt-oss-20b/)
- [Cloudflare Qwen 3.8 27B model card and zero-data-retention status](https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/)
- [OpenNext Cloudflare bindings and getCloudflareContext](https://opennext.js.org/cloudflare/bindings)
- [Google Gemini API pricing and free-tier data-use distinction](https://ai.google.dev/gemini-api/docs/pricing)

## Operational findings and limitations

1. Provider model lists do not prove an account's exact plan, remaining quota or ability to complete inference. Celestia distinguishes a configured key/binding from a successful provider response.
2. Cloudflare Workers AI is the preferred zero-key option only when the account is on Workers Free. The daily 10,000-Neuron allocation is shared across models and resets at 00:00 UTC; a Workers Paid account can incur charges above the free allocation. The code uses a manual confirmation flag because the runtime binding cannot independently read the account billing plan.
3. Cloudflare Workers AI models with a documented paid-billing requirement are not included in Celestia's allowlist. The new allowlist contains only GPT-OSS 20B and Qwen 3.8 27B, both marked zero-data-retention by their model cards.
4. Global queue depth, regional traffic and concurrent user load are not published consistently enough to rank providers by current congestion. Model throughput claims are not a guarantee of low traffic. Measure Celestia's own latency, 429 responses and provider failures only through authorised, cost-safe tests.
5. FreeModel's /v1/models requires the models:read key scope. Chat models are selected dynamically from the authenticated response. The API request path rechecks the catalogue so stale UI options cannot be called.
6. Groq's public quota table is a general plan reference. Account-specific limits can vary; inspect the Groq Console's Limits page. The new integration is hard-disabled unless the operator has confirmed the $0 Free plan.
7. OpenRouter's openrouter/free router may return the concrete model ID rather than the router alias. The integration validates the returned ID against a fresh catalogue of explicit :free variants with zero input and output price.
8. No paid plan, balance top-up, credit purchase, trial, live inference benchmark or production deployment is part of this change.

## Manual Cloudflare Workers AI setup (only after confirming Workers Free)

1. In Cloudflare Dashboard, verify that the account plan is Workers Free, not Workers Paid. Do not enable paid billing or add a payment method for this integration.
2. The Worker configuration now declares an AI binding. After the PR is merged and the Worker is deployed by an explicitly approved workflow, verify the binding is present in the deployed Worker.
3. Set the non-secret Worker variable CLOUDFLARE_WORKERS_AI_FREE_PLAN_CONFIRMED=true only after step 1. Leave it unset/false if the plan is uncertain or becomes Workers Paid.
4. The shared 10,000-Neuron daily allocation resets at 00:00 UTC. On Workers Free, further operations fail when the allowance or another limit is reached. Do not switch to Workers Paid to increase capacity.
5. No separate AI provider API key is required. Do not add AI Gateway or vendor API credentials for this binding.

## Manual Groq setup (only after confirming the $0 plan)

1. Check Groq Console → Billing/Plans and confirm the account is still on Free. Do not select Developer or any pay-as-you-go upgrade.
2. Create an API key and add it only as the Cloudflare Worker server secret GROQ_API_KEY.
3. Set the non-secret Worker variable GROQ_FREE_PLAN_CONFIRMED=true only after checking step 1.
4. Keep GROQ_FREE_PLAN_CONFIRMED unset/false if the plan is unknown, changes, or becomes paid. The Groq models remain disabled in Celestia in that case.
5. Never paste the key into chat, commit it to Git, add it to browser code or print it in CI logs.

## Manual FreeModel setup

- Store FREEMODEL_API_KEY as a server-side Cloudflare Worker secret.
- Ensure the key retains both inference and models:read scopes.
- Confirm the account is on the $0 Free plan and its prepaid balance and Day Pass balance are both zero. The current FreeModel Terms describe plan exhaustion as a pre-inference HTTP 402 stop, but its homepage FAQ also says requests may fall back to account balance. Treat this contradiction as a cost risk; do not enable inference while any prepaid balance could be consumed.
- Only after confirming the zero-balance condition, set the non-secret Worker variable FREEMODEL_FREE_PLAN_CONFIRMED=true.
- If the account page, plan, balance or terms are unclear, leave the flag unset so Celestia blocks FreeModel inference. Never purchase credits or Day Passes for this project.
