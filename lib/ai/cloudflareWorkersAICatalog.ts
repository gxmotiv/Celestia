export interface CloudflareWorkersAIModel {
  id: string;
  name: string;
  role: string;
  description: string;
  contextWindow: number;
  zeroDataRetention: true;
}

/**
 * This is an explicit allowlist, not the entire Cloudflare model catalogue.
 * Both entries are documented text-generation models and are not listed by
 * Cloudflare as requiring a paid billing method as of 2026-11-23.
 */
export const CLOUDFLARE_WORKERS_AI_FREE_MODELS: readonly CloudflareWorkersAIModel[] = [
  {
    id: "@cf/openai/gpt-oss-20b",
    name: "GPT-OSS 20B",
    role: "Reasoning · lower latency",
    description: "Open-weight reasoning and agentic model for lower-latency use.",
    contextWindow: 128_000,
    zeroDataRetention: true,
  },
  {
    id: "@cf/qwen/qwen3.8-27b",
    name: "Qwen 3.8 27B",
    role: "Reasoning · multilingual · vision",
    description: "General-purpose instruction model with reasoning, multilingual and vision capability.",
    contextWindow: 262_144,
    zeroDataRetention: true,
  },
] as const;

export function getCloudflareWorkersAIModel(modelId: string): CloudflareWorkersAIModel | undefined {
  return CLOUDFLARE_WORKERS_AI_FREE_MODELS.find((model) => model.id === modelId);
}

export interface CloudflareWorkersAIBinding {
  run(
    model: string,
    input: {
      messages: Array<{ role: "system" | "user"; content: string }>;
      max_tokens: number;
      temperature: number;
      stream: false;
    },
  ): Promise<unknown>;
}

export function parseCloudflareWorkersAIResponse(payload: unknown): {
  text: string;
  model?: string;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
} {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Cloudflare Workers AI returned a malformed response.");
  }
  const result = payload as Record<string, unknown>;
  if (result.success === false || result.error) {
    const rawError = typeof result.error === "string"
      ? result.error
      : result.error && typeof result.error === "object" && typeof (result.error as Record<string, unknown>).message === "string"
        ? String((result.error as Record<string, unknown>).message)
        : typeof result.message === "string" ? result.message : "Unknown upstream model error";
    const errorCode = typeof result.code === "string" ? result.code : "";
    const safeError = rawError.replace(/(?:Bearer\\s+)[A-Za-z0-9._~-]+/gi, "Bearer [redacted]").slice(0, 240);
    throw new Error(`Cloudflare Workers AI error ${errorCode}: ${safeError}`.trim());
  }
  // Newer chat models return OpenAI-compatible choices[].message.content;
  // older text-generation models return { response: string }.
  const choices = Array.isArray(result.choices) ? result.choices : [];
  const firstChoice = choices[0] && typeof choices[0] === "object"
    ? choices[0] as Record<string, unknown>
    : undefined;
  const message = firstChoice?.message && typeof firstChoice.message === "object"
    ? firstChoice.message as Record<string, unknown>
    : undefined;
  const choiceContent = typeof message?.content === "string" ? message.content.trim() : "";
  const text = (typeof result.response === "string" ? result.response.trim() : "") || choiceContent;
  if (!text) {
    const keys = Object.keys(result).slice(0, 12).join(", ");
    throw new Error(`Cloudflare Workers AI returned no assistant text (response keys: ${keys || "none"}).`);
  }
  const model = typeof result.model === "string" && result.model.trim() ? result.model.trim() : undefined;
  const usageRaw = result.usage && typeof result.usage === "object"
    ? result.usage as Record<string, unknown>
    : {};
  const promptTokens = typeof usageRaw.prompt_tokens === "number" ? usageRaw.prompt_tokens : undefined;
  const completionTokens = typeof usageRaw.completion_tokens === "number" ? usageRaw.completion_tokens : undefined;
  const totalTokens = typeof usageRaw.total_tokens === "number"
    ? usageRaw.total_tokens
    : promptTokens !== undefined && completionTokens !== undefined
      ? promptTokens + completionTokens
      : undefined;
  const usage = promptTokens === undefined && completionTokens === undefined && totalTokens === undefined
    ? undefined
    : { promptTokens, completionTokens, totalTokens };
  return { text, model, usage };
}
