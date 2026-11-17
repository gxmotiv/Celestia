import { GoogleGenAI } from "@google/genai";

export type CelestiaAIProvider = "freemodel" | "gemini";

export interface CelestiaAIResult {
  text: string;
  provider: CelestiaAIProvider;
  model: string;
}

interface GenerateTextOptions {
  systemPrompt: string;
  userPrompt: string;
  maxOutputTokens?: number;
  temperature?: number;
}

type ProviderError = Error & { status?: number };

function isRetryableProviderFailure(error: unknown): boolean {
  const status = (error as ProviderError | null)?.status;
  // A configuration or billing error should be visible rather than silently
  // routing to another service. Retryable upstream and network failures may
  // use the configured Gemini backup.
  return status === undefined || [408, 425, 429, 500, 502, 503, 504, 529].includes(status);
}

async function generateWithFreeModel(
  apiKey: string,
  model: string,
  options: Required<GenerateTextOptions>
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
        error?: { message?: string };
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
  };
}

/**
 * Uses FreeModel first when both its key and exact dashboard model ID are set.
 * Gemini is retained as a bounded fallback for transient/upstream failures.
 * Provider credentials are only read on the server and are never returned.
 */
export async function generateCelestiaText(
  input: GenerateTextOptions
): Promise<CelestiaAIResult> {
  const options: Required<GenerateTextOptions> = {
    systemPrompt: input.systemPrompt,
    userPrompt: input.userPrompt,
    maxOutputTokens: input.maxOutputTokens ?? 2048,
    temperature: input.temperature ?? 0.35,
  };

  const freeModelKey = process.env.FREEMODEL_API_KEY?.trim();
  const freeModelName = process.env.FREEMODEL_MODEL?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  if (freeModelKey && !freeModelName) {
    throw new Error("FREEMODEL_MODEL must be set to an exact model ID from GET /v1/models.");
  }

  if (freeModelKey && freeModelName) {
    try {
      return await generateWithFreeModel(freeModelKey, freeModelName, options);
    } catch (error) {
      if (!geminiKey || !isRetryableProviderFailure(error)) {
        throw error;
      }
      console.warn("FreeModel failed transiently; trying configured Gemini fallback:", error);
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
      return {
        text: response.text.trim(),
        provider: "gemini",
        model: "gemini-2.5-flash",
      };
    }
    throw new Error("Gemini returned an empty response.");
  }

  throw new Error("No AI provider is configured. Set FREEMODEL_API_KEY and FREEMODEL_MODEL or GEMINI_API_KEY.");
}
