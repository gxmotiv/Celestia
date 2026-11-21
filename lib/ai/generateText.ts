import { getCelestiaAIModel } from "./modelCatalog";
import { getPollinationsFreeTextModels, isPollinationsFreeTextModel } from "./pollinationsCatalog";

export type CelestiaAIProvider = "pollinations" | "freemodel" | "nararouter" | "openrouter";
export type CelestiaAIModelTier = "budget" | "reasoning";

export interface CelestiaAIUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface CelestiaAIResult {
  text: string;
  provider: CelestiaAIProvider;
  model: string;
  usage?: CelestiaAIUsage;
}

interface GenerateTextOptions {
  systemPrompt: string;
  userPrompt: string;
  maxOutputTokens?: number;
  temperature?: number;
  modelTier?: CelestiaAIModelTier;
  model?: string;
}

type ProviderError = Error & { status?: number };

function readUsage(value: unknown): CelestiaAIUsage | undefined {
  if (!value || typeof value !== "object") return undefined;
  const usage = value as Record<string, unknown>;
  const promptTokens = typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : undefined;
  const completionTokens = typeof usage.completion_tokens === "number" ? usage.completion_tokens : undefined;
  const totalTokens = typeof usage.total_tokens === "number"
    ? usage.total_tokens
    : promptTokens !== undefined && completionTokens !== undefined
      ? promptTokens + completionTokens
      : undefined;
  if (promptTokens === undefined && completionTokens === undefined && totalTokens === undefined) return undefined;
  return { promptTokens, completionTokens, totalTokens };
}

async function generateWithPollinations(
  apiKey: string,
  requestedModel: string,
  options: { systemPrompt: string; userPrompt: string; maxOutputTokens: number; temperature: number },
): Promise<CelestiaAIResult> {
  const eligible = await getPollinationsFreeTextModels();
  const model = requestedModel === "auto-free"
    ? eligible[0]?.id
    : eligible.find((candidate) => candidate.id === requestedModel)?.id;
  if (!model) {
    throw new Error("No healthy, official, zero-priced Pollinations text model is currently available. Refresh the model list later.");
  }
  if (!await isPollinationsFreeTextModel(model)) {
    throw new Error("The selected Pollinations model is no longer listed as healthy and zero-priced. Select a refreshed model.");
  }

  const response = await fetch("https://gen.pollinations.ai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(60_000),
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: options.systemPrompt },
        { role: "user", content: options.userPrompt },
      ],
      temperature: options.temperature,
      max_tokens: options.maxOutputTokens,
      stream: false,
    }),
  });
  const body = await response.json().catch(() => null) as
    | { model?: string; choices?: Array<{ message?: { content?: string | null } }>; usage?: unknown; error?: { message?: string } }
    | null;
  if (!response.ok) {
    const error = new Error(body?.error?.message || `Pollinations request failed with HTTP ${response.status}.`) as ProviderError;
    error.status = response.status;
    throw error;
  }
  const text = body?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("Pollinations returned an empty or unsupported response.");
  return { text: text.trim(), provider: "pollinations", model: body?.model || model, usage: readUsage(body?.usage) };
}

async function generateWithFreeModel(
  apiKey: string,
  model: string,
  options: { systemPrompt: string; userPrompt: string; maxOutputTokens: number; temperature: number },
): Promise<CelestiaAIResult> {
  const response = await fetch("https://freemodel.in/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: options.systemPrompt }, { role: "user", content: options.userPrompt }],
      temperature: options.temperature,
      max_tokens: options.maxOutputTokens,
      stream: false,
    }),
  });
  const body = await response.json().catch(() => null) as
    | { model?: string; choices?: Array<{ message?: { content?: string | null } }>; usage?: unknown; error?: { message?: string } }
    | null;
  if (!response.ok) {
    const error = new Error(body?.error?.message || `FreeModel request failed with HTTP ${response.status}.`) as ProviderError;
    error.status = response.status;
    throw error;
  }
  const text = body?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("FreeModel returned an empty or unsupported response.");
  return { text: text.trim(), provider: "freemodel", model: body?.model || model, usage: readUsage(body?.usage) };
}

async function generateWithOpenRouter(
  apiKey: string,
  model: string,
  options: { systemPrompt: string; userPrompt: string; maxOutputTokens: number; temperature: number },
): Promise<CelestiaAIResult> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://gxmotiv.github.io/Celestia",
      "X-Title": "Celestia",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: options.systemPrompt }, { role: "user", content: options.userPrompt }],
      temperature: options.temperature,
      max_tokens: options.maxOutputTokens,
      stream: false,
    }),
  });
  const body = await response.json().catch(() => null) as
    | { model?: string; choices?: Array<{ message?: { content?: string | null } }>; usage?: unknown; error?: { message?: string } }
    | null;
  if (!response.ok) {
    const error = new Error(body?.error?.message || `OpenRouter request failed with HTTP ${response.status}.`) as ProviderError;
    error.status = response.status;
    throw error;
  }
  const text = body?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("OpenRouter returned an empty or unsupported response.");
  return { text: text.trim(), provider: "openrouter", model: body?.model || model, usage: readUsage(body?.usage) };
}

async function generateWithNaraRouter(
  apiKey: string,
  model: string,
  options: { systemPrompt: string; userPrompt: string; maxOutputTokens: number; temperature: number },
): Promise<CelestiaAIResult> {
  const baseUrl = (process.env.NARAROUTER_BASE_URL?.trim() || "https://router.bynara.id/v1").replace(/\/+$/, "");
  const response = await fetch(baseUrl + "/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: options.systemPrompt }, { role: "user", content: options.userPrompt }],
      temperature: options.temperature,
      max_tokens: options.maxOutputTokens,
      stream: false,
    }),
  });
  const body = await response.json().catch(() => null) as
    | { model?: string; choices?: Array<{ message?: { content?: string | null } }>; usage?: unknown; error?: { message?: string } }
    | null;
  if (!response.ok) {
    const error = new Error(body?.error?.message || `NaraRouter request failed with HTTP ${response.status}.`) as ProviderError;
    error.status = response.status;
    throw error;
  }
  const text = body?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("NaraRouter returned an empty or unsupported response.");
  return { text: text.trim(), provider: "nararouter", model: body?.model || model, usage: readUsage(body?.usage) };
}

/** Explicit model selections are routed only to that provider. No automatic provider fallback is performed. */
export async function generateCelestiaText(input: GenerateTextOptions): Promise<CelestiaAIResult> {
  const options = {
    systemPrompt: input.systemPrompt,
    userPrompt: input.userPrompt,
    maxOutputTokens: input.maxOutputTokens ?? 2048,
    temperature: input.temperature ?? 0.35,
  };
  const selectedId = input.model?.trim() || "pollinations:auto-free";
  const selectedModel = getCelestiaAIModel(selectedId);
  if (!selectedModel) throw new Error("The selected Celestia model is not in the supported provider catalogue.");

  switch (selectedModel.providerId) {
    case "pollinations": {
      const key = process.env.POLLINATIONS_API_KEY?.trim();
      if (!key) throw new Error("Pollinations is not configured. Add the POLLINATIONS_API_KEY Cloudflare Worker secret.");
      return generateWithPollinations(key, selectedModel.providerModelId, options);
    }
    case "freemodel": {
      const key = process.env.FREEMODEL_API_KEY?.trim();
      if (!key) throw new Error("FreeModel is not configured. Add the FREEMODEL_API_KEY server secret.");
      return generateWithFreeModel(key, selectedModel.providerModelId, options);
    }
    case "nararouter": {
      const key = process.env.NARAROUTER_API_KEY?.trim();
      if (!key) throw new Error("NaraRouter is not configured. Add the NARAROUTER_API_KEY server secret.");
      const model = input.modelTier === "reasoning"
        ? process.env.NARAROUTER_REASONING_MODEL?.trim() || process.env.NARAROUTER_MODEL?.trim() || selectedModel.providerModelId
        : selectedModel.providerModelId;
      return generateWithNaraRouter(key, model, options);
    }
    case "openrouter": {
      const key = process.env.OPENROUTER_API_KEY?.trim();
      if (!key) throw new Error("OpenRouter is not configured. Add the OPENROUTER_API_KEY server secret.");
      return generateWithOpenRouter(key, selectedModel.providerModelId, options);
    }
  }
}
