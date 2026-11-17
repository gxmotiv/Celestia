# Celestia AI provider setup

Celestia supports a server-side FreeModel route with the existing Gemini integration as a backup.

## Configure FreeModel

1. Create or open your FreeModel account and create an API key with the `inference` scope. Keep the key private.
2. Retrieve the model list using the key:

   ```bash
   curl https://freemodel.in/v1/models \
     -H "Authorization: Bearer $FREEMODEL_API_KEY"
   ```

3. Choose a model ID from that authenticated response. Set these runtime variables in your deployment's server-side environment/secrets:

   - `FREEMODEL_API_KEY`: the private API key
   - `FREEMODEL_MODEL`: the exact model ID returned by `/v1/models`

4. Keep `GEMINI_API_KEY` configured as a fallback. FreeModel is attempted first when both FreeModel variables are present. Gemini is used when FreeModel is not configured, or when a request fails due to a transient/network/upstream error. Authentication and billing errors are not silently retried through Gemini.

Do not expose either key in client-side code, browser variables, screenshots, or Git commits. Never paste a key into a chat.

## Token budget and routing behavior

- The report endpoint uses a 2,048-token output budget for concise reports and 4,096 for detailed reports.
- The Oracle endpoint uses a 2,048-token output budget.
- FreeModel documents a 2,048-token minimum for `max_tokens`; lower settings may be raised by the gateway.
- Input and output both count toward the FreeModel monthly allowance. Long chart context and conversation history therefore cost tokens too.
- The code records the provider and model name in the API response for basic observability.
- A local data-only fallback is returned when no configured provider can produce a response.

## Model selection advice

Do not assume that a gateway's displayed model label proves upstream identity or quality. Choose an exact ID from your authenticated catalogue, then test it on Celestia's own tasks: TypeScript diagnosis, house-system regression tests, long-context repository review, and tool/function calling if enabled.

For low-cost coding research, DeepSeek's official direct API documentation currently lists `deepseek-flash` with a 1M-token context and tool calling. The route configured above will use that ID only if it is actually present in your FreeModel catalogue; do not assume the two providers have identical model IDs or prices.

## Deploying

Set the two FreeModel variables as server-side variables/secrets in the environment that runs the Next.js API routes. For Cloudflare Workers, use the Worker's secret/variable configuration rather than committing secrets into `wrangler.jsonc`, `.env.example`, or GitHub.
