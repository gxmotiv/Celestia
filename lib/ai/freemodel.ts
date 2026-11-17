/**
 * Server-only FreeModel OpenAI-compatible adapter.
 * The API key is read only from Cloudflare Worker/server secrets and is never
 * returned to the browser. The provider model catalogue is discovered at
 * runtime so Celestia does not depend on a stale hard-coded model list.
 */
export type FreeModelMode = "auto" | "fast" | "reasoning" | "coding";

export interface FreeModelCatalogEntry {
  id: string;
  name?: string;
  description?: string;
  type?: string;
  context_window?: number;
  capabilities?: string[];
  pricing?: {
    input_per_1k?: number;
    output_per_1k?: number;
  };
}

interface FreeModelCatalogResponse {
  data?: FreeModelCatalogEntry[];
}

const FREEMODEL_BASE_URL = "https://freemodel.in/v1";
const CATALOG_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 90_000;
let catalogCache: { expiresAt: number; models: FreeModelCatalogEntry[] } | undefined;

export class FreeModelGatewayError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 502, code = "freemodel_gateway_error") {
    super(message);
    this.name = "FreeModelGatewayError";
    this.status = status;
    this.code = code;
  }
}

export function getFreeModelConfig() {
  const apiKey = process.env.FREEMODEL_API_KEY?.trim() || "";
  return {
    apiKey,
    configured: Boolean(apiKey),
    fastModel: process.env.FREEMODEL_FAST_MODEL?.trim() || "",
    reasoningModel: process.env.FREEMODEL_REASONING_MODEL?.trim() || "",
    codingModel: process.env.FREEMODEL_CODING_MODEL?.trim() || "",
    visionModel: process.env.FREEMODEL_VISION_MODEL?.trim() || "",
  };
}

function hasCapability(model: FreeModelCatalogEntry, capability: string): boolean {
  return Array.isArray(model.capabilities) && model.capabilities.includes(capability);
}

function modelCost(model: FreeModelCatalogEntry): number {
  const input = model.pricing?.input_per_1k;
  const output = model.pricing?.output_per_1k;
  if (typeof input !== "number" || typeof output !== "number") return Number.POSITIVE_INFINITY;
  return input + output;
}

export async function fetchFreeModelCatalog(apiKey?: string): Promise<FreeModelCatalogEntry[]> {
  const config = getFreeModelConfig();
  const token = apiKey || config.apiKey;
  if (!token) {
    throw new FreeModelGatewayError("FreeModel is not configured. Add FREEMODEL_API_KEY as a Cloudflare Worker secret.", 503, "provider_not_configured");
  }

  if (catalogCache && catalogCache.expiresAt > Date.now()) {
    return catalogCache.models;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${FREEMODEL_BASE_URL}/models`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) {
      const status = response.status === 401 || response.status === 403 ? 503 : response.status;
      throw new FreeModelGatewayError(
        response.status === 401 || response.status === 403
          ? "FreeModel rejected the server API key. Check the FREEMODEL_API_KEY Worker secret."
          : response.status === 429
            ? "FreeModel model catalogue is rate-limited. Please retry shortly."
            : "FreeModel's model catalogue could not be loaded.",
        status,
        response.status === 429 ? "rate_limited" : "catalog_unavailable"
      );
    }
    const body = await response.json() as FreeModelCatalogResponse;
    const models = Array.isArray(body?.data)
      ? body.data.filter((item): item is FreeModelCatalogEntry =>
          Boolean(item && typeof item.id === "string" && item.id.trim() && (item.type === undefined || item.type === "chat"))
        )
      : [];
    if (models.length === 0) {
      throw new FreeModelGatewayError("FreeModel returned an empty or invalid chat-model catalogue.", 502, "empty_catalog");
    }
    catalogCache = { expiresAt: Date.now() + CATALOG_TTL_MS, models };
    return models;
  } catch (error) {
    if (error instanceof FreeModelGatewayError) throw error;
    throw new FreeModelGatewayError(
      error instanceof Error && error.name === "AbortError"
        ? "FreeModel's model catalogue request timed out."
        : "Could not reach FreeModel's model catalogue.",
      502,
      "catalog_unavailable"
    );
  } finally {
    clearTimeout(timeout);
  }
}

const FAST_MODEL_PREFERENCES = [
  "mimo-v2.6-flash",
  "deepseek-v4.1-flash",
  "glm-5.3-flash",
  "gemini-3.7-flash",
  "gpt-6-luna",
  "claude-haiku-5.5",
];
const REASONING_MODEL_PREFERENCES = [
  "claude-opus-5-5",
  "gpt-6-astra",
  "claude-fable-5-1",
  "claude-opus-5",
  "gpt-5.6-sol",
  "kimi-k3",
  "deepseek-v4-pro-max",
  "gemini-3.1-pro",
];
const CODING_MODEL_PREFERENCES = [
  "claude-fable-5-1",
  "claude-opus-5-5",
  "gpt-6-astra",
  "kimi-k3",
  "deepseek-v4-pro-max",
  "claude-sonnet-5.5",
  "claude-sonnet-5-5",
  "gpt-5.6-sol",
];

function findPreferred(
  models: FreeModelCatalogEntry[],
  preferences: string[],
  requiredCapabilities: string[] = []
): FreeModelCatalogEntry | undefined {
  for (const id of preferences) {
    const found = models.find((model) => model.id.toLowerCase() === id.toLowerCase());
    if (found && requiredCapabilities.every((capability) => hasCapability(found, capability))) return found;
  }
  return undefined;
}

export function chooseFreeModel(
  models: FreeModelCatalogEntry[],
  mode: FreeModelMode = "auto",
  config = getFreeModelConfig(),
  requiresVision = false
): FreeModelCatalogEntry {
  if (!Array.isArray(models) || models.length === 0) {
    throw new FreeModelGatewayError("No FreeModel chat models are available to this API key.", 404, "no_models");
  }

  const candidates = models.filter((model) =>
    !requiresVision || hasCapability(model, "vision")
  );
  if (candidates.length === 0) {
    throw new FreeModelGatewayError("The available FreeModel catalogue has no vision-capable model for this image request.", 400, "vision_unavailable");
  }

  const pinned = mode === "fast" ? config.fastModel
    : mode === "reasoning" ? config.reasoningModel
      : mode === "coding" ? config.codingModel
        : requiresVision ? config.visionModel
          : "";
  if (pinned) {
    const selected = candidates.find((model) => model.id === pinned);
    if (!selected) {
      throw new FreeModelGatewayError(`Configured FreeModel model "${pinned}" is not available for this request or lacks a required capability.`, 400, "configured_model_unavailable");
    }
    if ((mode === "reasoning" || mode === "coding") && !hasCapability(selected, "reasoning")) {
      throw new FreeModelGatewayError(`Configured FreeModel model "${pinned}" does not advertise reasoning capability.`, 400, "model_capability_mismatch");
    }
    if (mode === "coding" && !hasCapability(selected, "tools")) {
      throw new FreeModelGatewayError(`Configured FreeModel model "${pinned}" does not advertise tool calling capability.`, 400, "model_capability_mismatch");
    }
    return selected;
  }

  let selected: FreeModelCatalogEntry | undefined;
  if (mode === "fast" || mode === "auto") {
    selected = findPreferred(candidates, requiresVision
      ? FAST_MODEL_PREFERENCES
      : FAST_MODEL_PREFERENCES);
    if (selected && mode === "fast") return selected;
  }
  if (mode === "reasoning") {
    selected = findPreferred(candidates, REASONING_MODEL_PREFERENCES, ["reasoning"]);
  } else if (mode === "coding") {
    selected = findPreferred(candidates, CODING_MODEL_PREFERENCES, ["reasoning", "tools"]);
  } else if (mode === "auto" && requiresVision) {
    selected = findPreferred(candidates, FAST_MODEL_PREFERENCES, ["vision"]);
  }

  if (!selected && (mode === "reasoning" || mode === "coding")) {
    const capable = candidates.filter((model) =>
      hasCapability(model, "reasoning") && (mode !== "coding" || hasCapability(model, "tools"))
    );
    selected = capable.sort((a, b) => b.context_window! - a.context_window! || modelCost(a) - modelCost(b))[0];
  }
  if (!selected) {
    selected = candidates
      .filter((model) => mode !== "coding" || hasCapability(model, "tools"))
      .sort((a, b) => modelCost(a) - modelCost(b))[0];
  }
  if (!selected) {
    throw new FreeModelGatewayError("No model in the FreeModel catalogue matches this task.", 400, "no_matching_model");
  }
  return selected;
}

export async function requestFreeModelChatCompletion(args: {
  messages: Array<{ role: "system" | "developer" | "user" | "assistant"; content: string | Array<unknown> }>;
  mode?: FreeModelMode;
  stream?: boolean;
  requestSignal?: AbortSignal;
  maxTokens?: number;
}): Promise<{ response: Response; model: string; streamed: boolean }> {
  const config = getFreeModelConfig();
  if (!config.apiKey) {
    throw new FreeModelGatewayError("FreeModel is not configured. Add FREEMODEL_API_KEY as a Cloudflare Worker secret.", 503, "provider_not_configured");
  }
  const requiresVision = args.messages.some((message) =>
    Array.isArray(message.content) && message.content.some((part) =>
      Boolean(part && typeof part === "object" && ((part as { type?: string }).type === "image_url" || (part as { type?: string }).type === "input_image"))
    )
  );
  const catalog = await fetchFreeModelCatalog(config.apiKey);
  const selected = chooseFreeModel(catalog, args.mode || "auto", config, requiresVision);
  const streamed = args.stream === true && hasCapability(selected, "streaming");
  const maxTokens = typeof args.maxTokens === "number" && Number.isFinite(args.maxTokens)
    ? Math.max(2048, Math.min(16_384, Math.floor(args.maxTokens)))
    : args.mode === "reasoning" || args.mode === "coding" ? 8192 : 2048;

  const controller = new AbortController();
  const abortFromCaller = () => controller.abort();
  args.requestSignal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${FREEMODEL_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        Accept: args.stream ? "text/event-stream" : "application/json",
      },
      body: JSON.stringify({
        model: selected.id,
        messages: args.messages,
        stream: streamed,
        temperature: 0.3,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    return { response, model: selected.id, streamed };
  } catch (error) {
    if (args.requestSignal?.aborted) {
      throw new FreeModelGatewayError("The request was cancelled.", 499, "request_cancelled");
    }
    throw new FreeModelGatewayError(
      error instanceof Error && error.name === "AbortError"
        ? "FreeModel request timed out."
        : "Could not reach FreeModel.",
      502,
      "upstream_unavailable"
    );
  } finally {
    clearTimeout(timeout);
    args.requestSignal?.removeEventListener("abort", abortFromCaller);
  }
}

export function extractFreeModelAssistantText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const choices = (payload as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) return "";
  const message = (choices[0] as { message?: { content?: unknown } })?.message;
  if (typeof message?.content === "string") return message.content;
  if (Array.isArray(message?.content)) {
    return message.content.map((part) =>
      part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string"
        ? (part as { text: string }).text
        : ""
    ).join("");
  }
  return "";
}
