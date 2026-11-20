import { getCelestiaAIModel } from "./modelCatalog";

export type CelestiaAIProvider = "apinex" | "freemodel" | "nararouter" | "openrouter";
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

const DEFAULT_APINEX_BUDGET_MODEL = "free/mimo-v2.6-pro";
const DEFAULT_APINEX_REASONING_MODEL = "free/deepseek-v4.1-flash";
const DEFAULT_FREEMODEL_BUDGET_MODEL = "gpt-6-luna";
const DEFAULT_FREEMODEL_REASONING_MODEL = "claude-haiku-5.5";

function isRetryableProviderFailure(error: unknown): boolean {
  const status = (error as ProviderError | null)?.status;
  // Do not disguise bad credentials, missing permissions, or exhausted billing.
  return status === undefined || [408, 425, 429, 500, 502, 503, 504, 529].includes(status);
}

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

  if (promptTokens === undefined && completionTokens === undefined && totalTokens === undefined) {
    return undefined;
  }
  return { promptTokens, completionTokens, totalTokens };
}

async function generateWithApinex(apiKey: string, model: string, options: Required<Pick<GenerateTextOptions, "systemPrompt" | "userPrompt" | "maxOutputTokens" | "temperature">>, reasoningEffort?: "low" | "medium" | "high"): Promise<CelestiaAIResult> {
  let baseUrl = process.env.APINEX_BASE_URL?.trim() || "https://api.apinex.bond/v1";
  while (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
  const response = await fetch(baseUrl + "/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: options.systemPrompt },
        { role: "user", content: options.userPrompt },
      ],
      temperature: options.temperature,
      max_tokens: options.maxOutputTokens,
      ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
      stream: false,
    }),
  });
  const body = await response.json().catch(() => null) as
    | { model?: string; choices?: Array<{ message?: { content?: string | null } }>; usage?: unknown; error?: { message?: string; code?: string } }
    | null;
  if (!response.ok) {
    const error = new Error(body?.error?.message || `APInex request failed with HTTP ${response.status}.`) as ProviderError;
    error.status = response.status;
    throw error;
  }
  const text = body?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("APInex returned an empty or unsupported response.");
  return { text: text.trim(), provider: "apinex", model: body?.model || "unreported", usage: readUsage(body?.usage) };
}

async function generateWithFreeModel(
  apiKey: string,
  model: string,
  options: Required<Pick<GenerateTextOptions, "systemPrompt" | "userPrompt" | "maxOutputTokens" | "temperature">>
): Promise<CelestiaAIResult> {
  const response = await fetch("https://freemodel.in/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(45_000),
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
    | {
        model?: string;
        choices?: Array<{ message?: { content?: string | null } }>;
        usage?: unknown;
        error?: { message?: string; code?: string };
      }
    | null;

  if (!response.ok) {
    const error = new Error(
      body?.error?.message || `FreeModel request failed with HTTP ${response.status}.`
    ) as ProviderError;
    error.status = response.status;
    throw error;
  }

  const text = body?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("FreeModel returned an empty or unsupported response.");
  }

  return {
    text: text.trim(),
    provider: "freemodel",
    model: body?.model || "unreported",
    usage: readUsage(body?.usage),
  };
}

async function generateWithOpenRouter(
  apiKey: string,
  model: string,
  options: Required<Pick<GenerateTextOptions, "systemPrompt" | "userPrompt" | "maxOutputTokens" | "temperature">>
): Promise<CelestiaAIResult> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://gxmotiv.github.io/Celestia",
      "X-Title": "Celestia",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(45_000),
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
    const error = new Error(body?.error?.message || "OpenRouter request failed with HTTP " + response.status + ".") as ProviderError;
    error.status = response.status;
    throw error;
  }
  const text = body?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) throw new Error("OpenRouter returned an empty or unsupported response.");
  return { text: text.trim(), provider: "openrouter", model: body?.model || "unreported", usage: readUsage(body?.usage) };
}

async function generateWithNaraRouter(
  apiKey: string,
  model: string,
  options: Required<Pick<GenerateTextOptions, "systemPrompt" | "userPrompt" | "maxOutputTokens" | "temperature">>,
  baseUrl: string,
  reasoningEffort: "low" | "medium"
): Promise<CelestiaAIResult> {
  const response = await fetch(baseUrl + "/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(45_000),
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: options.systemPrompt },
        { role: "user", content: options.userPrompt },
      ],
      temperature: options.temperature,
      max_tokens: options.maxOutputTokens,
      reasoning_effort: reasoningEffort,
      stream: false,
    }),
  });

  const body = await response.json().catch(() => null) as
    | {
        model?: string;
        choices?: Array<{ message?: { content?: string | null } }>;
        usage?: unknown;
        error?: { message?: string; code?: string };
      }
    | null;

  if (!response.ok) {
    const error = new Error(
      body?.error?.message || "NaraRouter request failed with HTTP " + response.status + "."
    ) as ProviderError;
    error.status = response.status;
    throw error;
  }

  const text = body?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("NaraRouter returned an empty or unsupported response.");
  }

  return {
    text: text.trim(),
    provider: "nararouter",
    model: body?.model || "unreported",
    usage: readUsage(body?.usage),
  };
}
/**
 * Explicit catalogue selections are routed only to the selected provider/model.
 * Calls without an explicit selection keep the legacy APInex -> FreeModel ->
 * NaraRouter fallback order.
 */
export async function generateCelestiaText(
  input: GenerateTextOptions
): Promise<CelestiaAIResult> {
  const options = {
    systemPrompt: input.systemPrompt,
    userPrompt: input.userPrompt,
    maxOutputTokens: input.maxOutputTokens ?? 2048,
    temperature: input.temperature ?? 0.35,
  };

  const modelTier = input.modelTier ?? "budget";
  const apinexKey = process.env.APINEX_API_KEY?.trim();
  const freeModelKey = process.env.FREEMODEL_API_KEY?.trim();
  const naraRouterKey = process.env.NARAROUTER_API_KEY?.trim();
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();

  const apinexModelName = input.model?.trim() || (
    modelTier === "reasoning"
      ? process.env.APINEX_REASONING_MODEL?.trim() || DEFAULT_APINEX_REASONING_MODEL
      : process.env.APINEX_BUDGET_MODEL?.trim() || DEFAULT_APINEX_BUDGET_MODEL
  );
  const freeModelName = modelTier === "reasoning"
    ? process.env.FREEMODEL_REASONING_MODEL?.trim() || DEFAULT_FREEMODEL_REASONING_MODEL
    : process.env.FREEMODEL_MODEL?.trim() || DEFAULT_FREEMODEL_BUDGET_MODEL;
  // These names are only for legacy automatic fallback when no model was selected.
  // Explicit selections are resolved and routed directly above.
  const naraRouterName = modelTier === "reasoning"
    ? process.env.NARAROUTER_REASONING_MODEL?.trim() || process.env.NARAROUTER_MODEL?.trim() || "auto/bynara"
    : process.env.NARAROUTER_MODEL?.trim() || "auto/bynara";
  const naraRouterBaseUrl = (
    process.env.NARAROUTER_BASE_URL?.trim() || "https://router.bynara.id/v1"
  ).replace(/\/+$/, "");

  const selectedModel = input.model ? getCelestiaAIModel(input.model) : undefined;
  if (input.model && !selectedModel) {
    throw new Error("The selected Celestia model is not in the supported provider catalogue.");
  }

  if (selectedModel) {
    switch (selectedModel.providerId) {
      case "apinex":
        if (!apinexKey) throw new Error("APInex is not configured. Add the APINEX_API_KEY server secret.");
        return generateWithApinex(apinexKey, selectedModel.providerModelId, options, modelTier === "reasoning" ? "high" : undefined);
      case "freemodel":
        if (!freeModelKey) throw new Error("FreeModel is not configured. Add the FREEMODEL_API_KEY server secret.");
        return generateWithFreeModel(freeModelKey, selectedModel.providerModelId, options);
      case "nararouter":
        if (!naraRouterKey) throw new Error("NaraRouter is not configured. Add the NARAROUTER_API_KEY server secret.");
        return generateWithNaraRouter(naraRouterKey, selectedModel.providerModelId, options, naraRouterBaseUrl, modelTier === "reasoning" ? "medium" : "low");
      case "openrouter":
        if (!openRouterKey) throw new Error("OpenRouter is not configured. Add the OPENROUTER_API_KEY server secret.");
        return generateWithOpenRouter(openRouterKey, selectedModel.providerModelId, options);
    }
  }

  let lastProviderError: unknown;

  // APInex is primary. Detailed work uses DeepSeek V4.1 Flash at high reasoning
  // effort; the budget tier uses MiMo V2.6 Pro.
  if (apinexKey) {
    try {
      return await generateWithApinex(apinexKey, apinexModelName, options, modelTier === "reasoning" ? "high" : undefined);
    } catch (error) {
      const status = (error as ProviderError | null)?.status;
      if (isRetryableProviderFailure(error) || status === 404) {
        lastProviderError = error;
        console.warn("APInex failed; trying the next configured provider:", error);
      } else {
        throw error;
      }
    }
  }

  // Existing providers remain optional fallbacks when APInex is unavailable.
  if (freeModelKey) {
    try {
      return await generateWithFreeModel(freeModelKey, freeModelName, options);
    } catch (error) {
      const status = (error as ProviderError | null)?.status;
      if (status === 404 && freeModelName !== DEFAULT_FREEMODEL_BUDGET_MODEL) {
        console.warn("FreeModel model " + freeModelName + " was not found; retrying with " + DEFAULT_FREEMODEL_BUDGET_MODEL + ".");
        try {
          return await generateWithFreeModel(freeModelKey, DEFAULT_FREEMODEL_BUDGET_MODEL, options);
        } catch (retryError) {
          const retryStatus = (retryError as ProviderError | null)?.status;
          if (![404, 408, 425, 429, 500, 502, 503, 504, 529].includes(retryStatus ?? -1)) {
            throw retryError;
          }
          lastProviderError = retryError;
          console.warn("FreeModel fallback model also failed; trying the next configured provider.");
        }
      } else if (isRetryableProviderFailure(error) || status === 404) {
        lastProviderError = error;
        console.warn("FreeModel failed; trying the next configured provider:", error);
      } else {
        // Do not hide invalid credentials or billing/permission failures.
        throw error;
      }
    }
  }

  if (naraRouterKey) {
    try {
      return await generateWithNaraRouter(naraRouterKey, naraRouterName, options, naraRouterBaseUrl, modelTier === "reasoning" ? "medium" : "low");
    } catch (error) {
      const status = (error as ProviderError | null)?.status;
      if (isRetryableProviderFailure(error) || status === 404) {
        lastProviderError = error;
        console.warn("NaraRouter failed; trying the next configured provider:", error);
      } else {
        // Keep authentication, permission, and billing errors visible.
        throw error;
      }
    }
  }

  if (lastProviderError) throw lastProviderError;
  throw new Error("No AI provider is configured. Set APINEX_API_KEY, FREEMODEL_API_KEY, NARAROUTER_API_KEY, or OPENROUTER_API_KEY.");
}
