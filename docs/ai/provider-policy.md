# Celestia AI provider policy

## Selection

Celestia uses exactly one provider for a request. Set the server-side environment variable:

- `CELESTIA_AI_PROVIDER=freemodel`
- `CELESTIA_AI_PROVIDER=nararouter`
- `CELESTIA_AI_PROVIDER=gemini`

If the variable is unset, the safe default is `freemodel`. This preserves the previous primary provider but intentionally does not fall through to another provider.

The selected provider must have its matching server-side key configured:

| Provider | Required secret |
|---|---|
| FreeModel | `FREEMODEL_API_KEY` |
| NaraRouter | `NARAROUTER_API_KEY` |
| Gemini | `GEMINI_API_KEY` |

If the selected provider's key is absent, the request fails clearly. Celestia does not silently select another provider.

## Request and token policy

- One selected provider call per consultation attempt.
- No automatic cross-provider fallback.
- No automatic model substitution after a model-not-found response.
- No automatic retry after network, quota, authentication or server errors.
- Default output-token limit: 2,048.
- Hard output-token ceiling: 4,096.
- Usage metadata is returned only when the provider supplies it.
- Provider/model names and usage are not proof of a zero-cost request; account quota and provider billing terms remain authoritative.

## Deployment migration warning

Before deploying a version that uses this policy, verify which provider key is actually configured in the target runtime and set `CELESTIA_AI_PROVIDER` to that provider. For example, a deployment with only `NARAROUTER_API_KEY` configured must explicitly set `CELESTIA_AI_PROVIDER=nararouter`; otherwise the default FreeModel selection will return a configuration error and the API route may show its local fallback.

Do not add, print, commit or expose API keys in source code, issues, build logs or client-side configuration. Provider selection is not a secret; provider keys are.

## Verification

Offline tests cover provider allowlisting, default selection and output-token clamping. CI does not make live provider requests. A provider integration smoke test must be a separately authorised action because it can consume quota or incur cost.
