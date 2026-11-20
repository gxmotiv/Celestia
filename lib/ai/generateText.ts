import { GoogleGenAI } from "@google/genai";
import { clampCelestiaOutputTokens, isCelestiaAIEnabled, resolveCelestiaAIProvider } from "./providerPolicy";

export type CelestiaAIProvider = "freemodel" | "nararouter" | "gemini";
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

type ProviderError = Error & { status?: number };

interface GenerateTextOptions {
  systemPrompt: string;
  userPrompt: string;
  maxOutputTokens?: number;
  temperature?: number;
  modelTier?: CelestiaAIModelTier;
  model?: string;
}


const DEFAULT_BUDGET_MODEL = "gpt-6-luna";
const DEFAULT_REASONING_MODEL = "claude-haiku-5.5";

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
    model: body?.model || model,
    usage: readUsage(body?.usage),
  };
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
    model: body?.model || model,
    usage: readUsage(body?.usage),
  };
}
/**
 * Exactly one provider is selected for each consultation.
 *
 * CELESTIA_AI_PROVIDER accepts: freemodel (default), nararouter, gemini.
 * Provider failures are returned to the caller; no cross-provider fallback,
 * model substitution or automatic retry is performed.
 */
export async function generateCelestiaText(
  input: GenerateTextOptions
): Promise<CelestiaAIResult> {
  const options = {
    systemPrompt: input.systemPrompt,
    userPrompt: input.userPrompt,
    maxOutputTokens: clampCelestiaOutputTokens(input.maxOutputTokens),
    temperature: input.temperature ?? 0.35,
  };

  if (!isCelestiaAIEnabled(process.env.CELESTIA_AI_ENABLED)) {
    throw new Error("AI provider calls are disabled. Set CELESTIA_AI_ENABLED=true only after explicitly approving outbound model usage.");
  }

  const modelTier = input.modelTier ?? "budget";
  const provider = resolveCelestiaAIProvider(process.env.CELESTIA_AI_PROVIDER);

  if (provider === "freemodel") {
    const apiKey = process.env.FREEMODEL_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("CELESTIA_AI_PROVIDER is freemodel, but FREEMODEL_API_KEY is not configured.");
    }
    const model = input.model?.trim() || (
      modelTier === "reasoning"
        ? process.env.FREEMODEL_REASONING_MODEL?.trim() || DEFAULT_REASONING_MODEL
        : process.env.FREEMODEL_MODEL?.trim() || DEFAULT_BUDGET_MODEL
    );
    return generateWithFreeModel(apiKey, model, options);
  }

  if (provider === "nararouter") {
    const apiKey = process.env.NARAROUTER_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("CELESTIA_AI_PROVIDER is nararouter, but NARAROUTER_API_KEY is not configured.");
    }
    const model = input.model?.trim() || (
      modelTier === "reasoning"
        ? process.env.NARAROUTER_REASONING_MODEL?.trim() || process.env.NARAROUTER_MODEL?.trim() || "auto/bynara"
        : process.env.NARAROUTER_MODEL?.trim() || "auto/bynara"
    );
    const baseUrl = (process.env.NARAROUTER_BASE_URL?.trim() || "https://router.bynara.id/v1")
      .replace(/\/+$/, "");
    return generateWithNaraRouter(
      apiKey,
      model,
      options,
      baseUrl,
      modelTier === "reasoning" ? "medium" : "low"
    );
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("CELESTIA_AI_PROVIDER is gemini, but GEMINI_API_KEY is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: input.model?.trim() || "gemini-2.5-flash",
    contents: options.systemPrompt + "\n\n" + options.userPrompt,
    config: {
      temperature: options.temperature,
      maxOutputTokens: options.maxOutputTokens,
    },
  });

  if (response.text?.trim()) {
    const metadata = response.usageMetadata;
    return {
      text: response.text.trim(),
      provider: "gemini",
      model: input.model?.trim() || "gemini-2.5-flash",
      usage: metadata ? {
        promptTokens: metadata.promptTokenCount,
        completionTokens: metadata.candidatesTokenCount,
        totalTokens: metadata.totalTokenCount,
      } : undefined,
    };
  }
  throw new Error("Gemini returned an empty response.");
}
