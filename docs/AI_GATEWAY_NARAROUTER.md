# Celestia NaraRouter dual-model gateway

## Architecture

Celestia sends AI requests to its own same-origin Next.js API routes. The server-side route calls NaraRouter. The browser and Android WebView never receive `NARAROUTER_API_KEY` and never call `router.bynara.id` directly.

- `app/api/ai/chat/route.ts` is the unified OpenAI-compatible proxy. It supports JSON and SSE, text and image input, manual model selection, request validation and upstream retry.
- `app/api/ai/models/route.ts` checks the models actually visible to the configured NaraRouter key.
- `app/api/astrology/master-oracle/route.ts` connects the current Oracle chat UI, including screenshot input and streamed responses.
- `app/api/astrology/ai-reading/route.ts` routes existing multi-system readings through NaraRouter when configured. Existing Gemini/deterministic fallback remains for deployments without NaraRouter configured.
- `lib/ai/imageCompression.ts` resizes/compresses browser and Android WebView images before base64 encoding.
- `lib/ai/nararouter.ts` contains the server-only client, model router, validation, rate guard and retry policy.

## Add the API key securely

Do not put a real key in this repository, `.env.example`, `wrangler.jsonc`, a Client Component, or the Android APK.

### Cloudflare Worker secret

1. Open the Cloudflare dashboard and select **Workers & Pages**.
2. Open the `celestia` Worker.
3. Open **Settings → Variables and Secrets**.
4. Add a variable of type **Secret** named `NARAROUTER_API_KEY` and paste the API key into the value field.
5. Save/deploy the Worker so the runtime receives the secret.

The non-secret base URL and model alias settings are in `wrangler.jsonc`. Do not add the API key under `vars`.

### Local development

Copy the NaraRouter entries from `.env.example` to a local `.env.local` or `.dev.vars` file, then enter the key locally. These files are ignored by Git. Never commit them or paste the key into chat, logs or screenshots.

## Verify model access

After the Worker secret is configured and deployed, open:

`https://celestia.gagandeep-hwr.workers.dev/api/ai/models`

The response reports whether the configured key can see the exact aliases `agnes-2.5-flash` and `laguna-s-2.1`. The public documentation does not guarantee those exact aliases for every account, so treat this authenticated check as authoritative. If either alias is unavailable, update the corresponding non-secret `NARAROUTER_*_MODEL` variable to an ID returned by the endpoint.

## Gateway API

Endpoint: `POST /api/ai/chat`

Example JSON request:

```json
{
  "model": "auto",
  "stream": false,
  "messages": [
    { "role": "user", "content": "Explain this TypeScript error and suggest a fix." }
  ]
}
```

Allowed `model` values are `auto`, `agnes-2.5-flash`, and `laguna-s-2.1`. Auto mode sends images to Agnes, code/debugging/terminal-related text to Laguna, and general text to Agnes. Manual selection overrides auto-routing. An image cannot be forced to the code model.

Image input uses standard OpenAI-compatible content parts with `image_url.url` set to a JPEG, PNG or WebP base64 data URL, or a short HTTPS image URL. The gateway caps request bodies at 3.5 MB and each image data URL at 2 million characters. The Celestia Oracle UI compresses screenshots to JPEG, max dimension 1280 px and target file size 1.2 MB before upload.

Set `stream: true` to receive upstream Server-Sent Events (`text/event-stream`). Stream chunks are passed through from the provider. For non-stream requests the route returns the normal OpenAI Chat Completions JSON response with a `selected_model` field.

## Rate limit and retries

Celestia applies a best-effort limit of 10 requests per client IP per 60 seconds in a Worker isolate. The in-memory counter is not a strict global quota: isolate restarts and multiple isolates can cause counters to diverge. NaraRouter's own 429 response is still handled as authoritative; the client retries a limited number of transient 429/5xx/network failures using `Retry-After` when present and exponential backoff otherwise.

If a strict cross-isolate, account-wide limit is required before a public launch, move the counter to a Cloudflare Durable Object or a dedicated rate-limiting service. Keep upstream retries bounded to avoid amplifying usage.

## Web and Android 32-bit behaviour

The website and Android APK use the same HTTPS endpoints under the Celestia Worker origin. The APK is a WebView shell; no NaraRouter SDK, API key, model code or native ARM library is placed in the APK. The compressed data URL is sent from WebView to the same-origin Next.js route, which forwards it server-side.

AI features require a working Internet connection. The bundled offline Android calculator intentionally has no network connection and does not expose the online AI gateway when offline.

## Safety and execution boundary

`laguna-s-2.1` is used for code generation, code review, terminal-related explanations and debugging suggestions. Celestia does not execute generated code or arbitrary shell/terminal commands on the Cloudflare Worker. Treat model output as untrusted text and review code before use.

## Validation status

The routing unit suite covers automatic selection, manual overrides, unsupported roles, image/model conflicts, insecure remote image URLs and oversized prompts. A successful build and live model test still require GitHub Actions to execute and the Cloudflare Worker secret to be configured. No NaraRouter API key is stored in this repository.