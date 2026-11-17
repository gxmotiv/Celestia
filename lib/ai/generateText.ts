import { GoogleGenAI } from "@google/genai";

export type CelestiaAIProvider = "freemodel" | "gemini";
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

const DEFAULT_BUDGET_MODEL = "gpt-6-luna";
const DEFAULT_REASONING_MODEL = "claude-haiku-5.5";

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

/**
 * FreeModel is selected per task:
 * - budget: GPT-6 Luna for short, routine responses
 * - reasoning: Claude Haiku 5.5 for detailed chart synthesis and Oracle work
 *
 * FREEMODEL_MODEL and FREEMODEL_REASONING_MODEL can override these public
 * catalogue IDs. The API key is read only on the server and is never returned.
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

  const freeModelKey = process.env.FREEMODEL_API_KEY?.trim();
  const modelTier = input.modelTier ?? "budget";
  const freeModelName = input.model?.trim() || (
    modelTier === "reasoning"
      ? process.env.FREEMODEL_REASONING_MODEL?.trim() || DEFAULT_REASONING_MODEL
      : process.env.FREEMODEL_MODEL?.trim() || DEFAULT_BUDGET_MODEL
  );
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  if (freeModelKey) {
    try {
      return await generateWithFreeModel(freeModelKey, freeModelName, options);
    } catch (error) {
      const status = (error as ProviderError | null)?.status;

      // A stale/incorrect tier model ID should not make the feature unusable.
      // Retry once with the known low-cost catalogue model; never print a key.
      if (status === 404 && freeModelName !== DEFAULT_BUDGET_MODEL) {
        console.warn(`FreeModel model ${freeModelName} was not found; retrying with ${DEFAULT_BUDGET_MODEL}.`);
        try {
          return await generateWithFreeModel(freeModelKey, DEFAULT_BUDGET_MODEL, options);
        } catch (fallbackError) {
          if (!geminiKey || !isRetryableProviderFailure(fallbackError)) throw fallbackError;
        }
      } else if (!geminiKey || !isRetryableProviderFailure(error)) {
        throw error;
      } else {
        console.warn("FreeModel failed transiently; trying configured Gemini fallback:", error);
      }
    }
  }

  if (geminiKey) {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${options.systemPrompt}\n\n${options.userPrompt}`,
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
        model: "gemini-2.5-flash",
        usage: metadata ? {
          promptTokens: metadata.promptTokenCount,
          completionTokens: metadata.candidatesTokenCount,
          totalTokens: metadata.totalTokenCount,
        } : undefined,
      };
    }
    throw new Error("Gemini returned an empty response.");
  }

  throw new Error("No AI provider is configured. Set FREEMODEL_API_KEY or GEMINI_API_KEY.");
}
