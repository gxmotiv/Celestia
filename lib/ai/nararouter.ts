/**
 * Server-only NaraRouter client.
 *
 * Do not import this module from a Client Component. It reads secrets from
 * process.env and is intended for Next.js route handlers running on Workers.
 */
export const NARA_BASE_URL_DEFAULT = "https://router.bynara.id/v1";
export const NARA_VISION_MODEL = "agnes-2.5-flash";
export const NARA_CODE_MODEL = "laguna-s-2.1";
export const NARA_MAX_REQUEST_BYTES = 3_500_000;
export const NARA_MAX_IMAGE_DATA_URL_CHARS = 2_000_000;

export type NaraModel = typeof NARA_VISION_MODEL | typeof NARA_CODE_MODEL;
export type NaraModelOverride = "auto" | NaraModel;
export type NaraRole = "system" | "developer" | "user" | "assistant";

export type NaraTextPart = { type: "text"; text: string };
export type NaraImagePart = {
  type: "image_url";
  image_url: { url: string; detail?: "auto" | "low" | "high" };
};
export type NaraMessage = {
  role: NaraRole;
  content: string | Array<NaraTextPart | NaraImagePart>;
};

export class NaraGatewayError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 502, code = "gateway_error") {
    super(message);
    this.name = "NaraGatewayError";
    this.status = status;
    this.code = code;
  }
}

export function getNaraRouterConfig() {
  const apiKey = process.env.NARAROUTER_API_KEY?.trim() || "";
  const configuredBase = process.env.NARAROUTER_BASE_URL?.trim() || NARA_BASE_URL_DEFAULT;
  let baseUrl = NARA_BASE_URL_DEFAULT;

  try {
    const parsed = new URL(configuredBase);
    // Keep the proxy pinned to the official HTTPS host; this prevents an
    // environment typo or malicious override from turning the route into an SSRF proxy.
    if (parsed.protocol === "https:" && parsed.hostname === "router.bynara.id") {
      baseUrl = parsed.toString().replace(/\/+$/, "");
    }
  } catch {
    // Use the known-safe default if the environment value is malformed.
  }

  const visionModel = process.env.NARAROUTER_VISION_MODEL?.trim() || NARA_VISION_MODEL;
  const codeModel = process.env.NARAROUTER_CODE_MODEL?.trim() || NARA_CODE_MODEL;

  return {
    apiKey,
    baseUrl,
    visionModel,
    codeModel,
    configured: Boolean(apiKey),
  };
}

function getMessageText(message: NaraMessage): string {
  if (typeof message.content === "string") return message.content;
  return message.content
    .filter((part): part is NaraTextPart => part.type === "text")
    .map((part) => part.text)
    .join("\n");
}

export function hasNaraImageInput(messages: NaraMessage[]): boolean {
  return messages.some(
    (message) =>
      Array.isArray(message.content) &&
      message.content.some((part) => part.type === "image_url")
  );
}

export function chooseNaraModel(
  messages: NaraMessage[],
  override: NaraModelOverride = "auto"
): NaraModel {
  const imagePresent = hasNaraImageInput(messages);

  if (override !== "auto" && override !== NARA_VISION_MODEL && override !== NARA_CODE_MODEL) {
    throw new NaraGatewayError("Unsupported model override.", 400, "invalid_model");
  }

  if (override === NARA_CODE_MODEL && imagePresent) {
    throw new NaraGatewayError(
      "The selected code model does not accept image input. Choose Auto or Agnes Vision.",
      400,
      "vision_model_required"
    );
  }

  if (override !== "auto") return override;
  if (imagePresent) return NARA_VISION_MODEL;

  const text = messages.map(getMessageText).join("\n");
  const codeSignals =
    /\x60\x60\x60|\b(stack trace|traceback|debug(?:ging)?|terminal|shell command|compile error|build error|exception|typescript|javascript|python|java|kotlin|gradle|npm install|npm run|git diff|pull request|code review|function\s+\w+|class\s+\w+|interface\s+\w+)\b/i;
  const hasCodeShape =
    /(?:^|\n)\s*(?:import\s|export\s|const\s|let\s|function\s|class\s|def\s|Traceback \(|Error:|at [\w./-]+\s*\()/m.test(text);

  return codeSignals.test(text) || hasCodeShape ? NARA_CODE_MODEL : NARA_VISION_MODEL;
}

export function validateNaraMessages(value: unknown): NaraMessage[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 40) {
    throw new NaraGatewayError("Provide between 1 and 40 chat messages.", 400, "invalid_messages");
  }

  const allowedRoles = new Set<NaraRole>(["system", "developer", "user", "assistant"]);
  const messages: NaraMessage[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new NaraGatewayError("Each message must be an object.", 400, "invalid_message");
    }

    const source = item as Record<string, unknown>;
    if (typeof source.role !== "string" || !allowedRoles.has(source.role as NaraRole)) {
      throw new NaraGatewayError("A message has an unsupported role.", 400, "invalid_role");
    }

    if (typeof source.content === "string") {
      if (source.content.length > 250_000) {
        throw new NaraGatewayError("A text message is too large.", 413, "message_too_large");
      }
      messages.push({ role: source.role as NaraRole, content: source.content });
      continue;
    }

    if (!Array.isArray(source.content) || source.content.length === 0 || source.content.length > 8) {
      throw new NaraGatewayError("Message content must be text or a supported text/image array.", 400, "invalid_content");
    }

    const parts: Array<NaraTextPart | NaraImagePart> = [];
    for (const rawPart of source.content) {
      if (!rawPart || typeof rawPart !== "object" || Array.isArray(rawPart)) {
        throw new NaraGatewayError("A message content part is invalid.", 400, "invalid_content_part");
      }
      const part = rawPart as Record<string, unknown>;

      if (part.type === "text" && typeof part.text === "string") {
        if (part.text.length > 250_000) {
          throw new NaraGatewayError("A text part is too large.", 413, "message_too_large");
        }
        parts.push({ type: "text", text: part.text });
        continue;
      }

      if (part.type === "image_url" && part.image_url && typeof part.image_url === "object") {
        const image = part.image_url as Record<string, unknown>;
        const url = image.url;
        if (typeof url !== "string" || url.length > NARA_MAX_IMAGE_DATA_URL_CHARS) {
          throw new NaraGatewayError("An image is missing or exceeds the upload limit.", 413, "image_too_large");
        }
        const isDataImage = /^data:image\/(?:jpeg|jpg|png|webp);base64,[a-z0-9+/=]+$/i.test(url);
        const isHttpsImage = /^https:\/\//i.test(url) && url.length <= 2048;
        if (!isDataImage && !isHttpsImage) {
          throw new NaraGatewayError("Images must be JPEG, PNG or WebP data URLs, or HTTPS image URLs.", 400, "invalid_image");
        }
        const detail =
          image.detail === "low" || image.detail === "high" || image.detail === "auto"
            ? image.detail
            : "auto";
        parts.push({ type: "image_url", image_url: { url, detail } });
        continue;
      }

      throw new NaraGatewayError("Only text and image_url content parts are supported.", 400, "unsupported_content_part");
    }

    messages.push({ role: source.role as NaraRole, content: parts });
  }

  return messages;
}

/**
 * Best-effort per-client request throttle. Cloudflare isolates are not a shared
 * durable counter; upstream NaraRouter 429 responses remain the authoritative
 * account/plan limit. Use a Durable Object if a strict global counter is needed.
 */
type RateEntry = { windowStart: number; count: number };
type RateLimitGlobal = typeof globalThis & { __celestiaNaraRateMap?: Map<string, RateEntry> };

export function checkNaraClientRateLimit(request: Request, limit = 10, windowMs = 60_000): boolean {
  const globalState = globalThis as RateLimitGlobal;
  const rateMap = globalState.__celestiaNaraRateMap || (globalState.__celestiaNaraRateMap = new Map());
  const clientId =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "unknown-client";
  const now = Date.now();
  const entry = rateMap.get(clientId);

  if (!entry || now - entry.windowStart >= windowMs) {
    rateMap.set(clientId, { windowStart: now, count: 1 });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count += 1;

  if (rateMap.size > 1000) {
    for (const [key, value] of rateMap) {
      if (now - value.windowStart >= windowMs) rateMap.delete(key);
    }
  }
  return true;
}

function getRetryDelay(response: Response | null, attempt: number): number {
  const retryAfter = response?.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(60_000, Math.max(500, seconds * 1000));
    }
    const date = Date.parse(retryAfter);
    if (Number.isFinite(date)) return Math.min(60_000, Math.max(500, date - Date.now()));
  }
  // The provider limit is 10 RPM. Respect a full minute if a 429 has no Retry-After.
  if (response?.status === 429) return 60_000;
  return Math.min(8_000, 1_000 * 2 ** attempt);
}

function waitForRetry(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(new DOMException("Request aborted.", "AbortError"));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(done, ms);
    function cleanup() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", aborted);
    }
    function done() {
      cleanup();
      resolve();
    }
    function aborted() {
      cleanup();
      reject(new DOMException("Request aborted.", "AbortError"));
    }
    signal?.addEventListener("abort", aborted, { once: true });
  });
}

export async function requestNaraChatCompletion(args: {
  messages: NaraMessage[];
  modelOverride?: NaraModelOverride;
  stream?: boolean;
  requestSignal?: AbortSignal;
  temperature?: number;
  maxTokens?: number;
}): Promise<{ response: Response; model: NaraModel }> {
  const config = getNaraRouterConfig();
  if (!config.apiKey) {
    throw new NaraGatewayError(
      "NaraRouter is not configured on the server. Add NARAROUTER_API_KEY as a Cloudflare Worker secret.",
      503,
      "provider_not_configured"
    );
  }

  const model = chooseNaraModel(args.messages, args.modelOverride || "auto");
  const modelId = model === NARA_VISION_MODEL ? config.visionModel : config.codeModel;
  const payload = {
    model: modelId,
    messages: args.messages,
    stream: args.stream === true,
    temperature:
      typeof args.temperature === "number" && Number.isFinite(args.temperature)
        ? Math.min(1, Math.max(0, args.temperature))
        : 0.5,
    max_tokens:
      typeof args.maxTokens === "number" && Number.isFinite(args.maxTokens)
        ? Math.min(8192, Math.max(64, Math.floor(args.maxTokens)))
        : model === NARA_CODE_MODEL
          ? 4096
          : 3072,
  };

  let lastNetworkError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (args.requestSignal?.aborted) {
      throw new NaraGatewayError("The request was cancelled.", 499, "request_cancelled");
    }

    const controller = new AbortController();
    const abortFromCaller = () => controller.abort();
    args.requestSignal?.addEventListener("abort", abortFromCaller, { once: true });
    const timeout = setTimeout(() => controller.abort(), 90_000);

    let response: Response | null = null;
    try {
      response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          Accept: args.stream ? "text/event-stream" : "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        cache: "no-store",
      });
    } catch (error) {
      lastNetworkError = error;
    } finally {
      clearTimeout(timeout);
      args.requestSignal?.removeEventListener("abort", abortFromCaller);
    }

    if (response) {
      const retryable = response.status === 429 || response.status >= 500;
      if (retryable && attempt === 0 && !args.requestSignal?.aborted) {
        const delay = getRetryDelay(response, attempt);
        try {
          await waitForRetry(delay, args.requestSignal);
        } catch {
          throw new NaraGatewayError("The request was cancelled.", 499, "request_cancelled");
        }
        continue;
      }
      return { response, model };
    }

    if (attempt === 0 && !args.requestSignal?.aborted) {
      try {
        await waitForRetry(getRetryDelay(null, attempt), args.requestSignal);
      } catch {
        throw new NaraGatewayError("The request was cancelled.", 499, "request_cancelled");
      }
      continue;
    }
  }

  if (args.requestSignal?.aborted) {
    throw new NaraGatewayError("The request was cancelled.", 499, "request_cancelled");
  }
  console.error("NaraRouter connection failed:", lastNetworkError instanceof Error ? lastNetworkError.name : "network_error");
  throw new NaraGatewayError("Could not reach the NaraRouter service. Please try again.", 502, "upstream_unavailable");
}

export function extractNaraAssistantText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return "";
  const message = (choices[0] as { message?: { content?: unknown } })?.message;
  if (typeof message?.content === "string") return message.content;
  if (Array.isArray(message?.content)) {
    return message.content
      .map((part) =>
        part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string"
          ? (part as { text: string }).text
          : ""
      )
      .join("");
  }
  return "";
}
