export const CELESTIA_AI_MODELS = [
  { id: "pollinations:auto-free", providerId: "pollinations", providerName: "Pollinations", providerModelId: "auto-free", secretName: "POLLINATIONS_API_KEY", name: "Automatic free model", role: "Recommended default", description: "Automatically selects a currently healthy, official, zero-priced text model from Pollinations. The live catalogue is checked before each generation.", quotaNote: "Only models whose published input and output prices are both zero are eligible." },
  { id: "openrouter:openrouter/free", providerId: "openrouter", providerName: "OpenRouter", providerModelId: "openrouter/free", secretName: "OPENROUTER_API_KEY", name: "Auto-select a free model", role: "OpenRouter free router", description: "Uses OpenRouter's free-model router only.", quotaNote: "20 RPM · 50 requests/day on a free account; failed requests count toward the daily cap." },
  { id: "groq:openai/gpt-oss-120b", providerId: "groq", providerName: "Groq", providerModelId: "openai/gpt-oss-120b", secretName: "GROQ_API_KEY", name: "GPT-OSS 120B", role: "Groq Free plan · reasoning", description: "High-capability reasoning, coding and tool-use model.", quotaNote: "30 RPM · 1,000 requests/day · 8K TPM · 200K tokens/day. Requires confirmation that the account remains on Groq Free." },
  { id: "groq:openai/gpt-oss-20b", providerId: "groq", providerName: "Groq", providerModelId: "openai/gpt-oss-20b", secretName: "GROQ_API_KEY", name: "GPT-OSS 20B", role: "Groq Free plan · faster", description: "Smaller GPT-OSS model for routine chat and shorter tasks.", quotaNote: "30 RPM · 1,000 requests/day · 8K TPM · 200K tokens/day. Requires confirmation that the account remains on Groq Free." },
] as const;

export type CelestiaAIModel = (typeof CELESTIA_AI_MODELS)[number];
type CelestiaAIDynamicModel = { id: string; providerId: CelestiaAIProviderId; providerName: string; providerModelId: string; secretName: string; name: string; role: string; description: string; quotaNote: string };
export type CelestiaAIModelId = string;
export type CelestiaAIProviderId = "pollinations" | "freemodel" | "nararouter" | "openrouter" | "groq";

export const DEFAULT_CELESTIA_AI_MODEL: CelestiaAIModelId = "pollinations:auto-free";

export function getCelestiaAIModel(value: unknown): CelestiaAIModel | CelestiaAIDynamicModel | undefined {
  if (typeof value !== "string") return undefined;
  const known = CELESTIA_AI_MODELS.find((model) => model.id === value);
  if (known) return known;
  if (value.startsWith("pollinations:") && value.length > "pollinations:".length) {
    return {
      ...CELESTIA_AI_MODELS[0],
      id: value,
      providerModelId: value.slice("pollinations:".length),
    };
  }
  if (value.startsWith("freemodel:") && value.length > "freemodel:".length) {
    const providerModelId = value.slice("freemodel:".length);
    return {
      id: value, providerId: "freemodel", providerName: "FreeModel", providerModelId,
      secretName: "FREEMODEL_API_KEY", name: providerModelId,
      role: "FreeModel monthly free allowance",
      description: "Dynamically discovered from the authenticated FreeModel chat catalogue.",
      quotaNote: "1,000,000 input + output tokens per month; up to 60 RPM. Requests stop at HTTP 402 when the free allowance is exhausted.",
    };
  }
  if (value.startsWith("nararouter:") && value.length > "nararouter:".length) {
    const providerModelId = value.slice("nararouter:".length);
    return {
      id: value,
      providerId: "nararouter",
      providerName: "NaraRouter",
      providerModelId,
      secretName: "NARAROUTER_API_KEY",
      name: providerModelId,
      role: "NaraRouter Free plan",
      description: "Dynamically discovered from the authenticated NaraRouter account catalogue.",
      quotaNote: "Only provider-published Free-plan models are selectable. Daily quota and rate limits apply.",
    };
  }
  return undefined;
}

export function isCelestiaAIModelId(value: unknown): value is CelestiaAIModelId {
  return getCelestiaAIModel(value) !== undefined;
}
