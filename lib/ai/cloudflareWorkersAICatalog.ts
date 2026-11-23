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
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
} {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Cloudflare Workers AI returned a malformed response.");
  }
  const result = payload as Record<string, unknown>;
  const text = typeof result.response === "string" ? result.response.trim() : "";
  if (!text) throw new Error("Cloudflare Workers AI returned no assistant text.");
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
  return { text, usage };
}
