export const CELESTIA_AI_MODELS = [
  { id: "pollinations:auto-free", providerId: "pollinations", providerName: "Pollinations", providerModelId: "auto-free", secretName: "POLLINATIONS_API_KEY", name: "Automatic free model", role: "Recommended default", description: "Automatically selects a currently healthy, official, zero-priced text model from Pollinations. The live catalogue is checked before each generation.", quotaNote: "Only models whose published input and output prices are both zero are eligible." },
  { id: "freemodel:deepseek-v4.1-flash", providerId: "freemodel", providerName: "FreeModel", providerModelId: "deepseek-v4.1-flash", secretName: "FREEMODEL_API_KEY", name: "DeepSeek V4.1 Flash", role: "FreeModel free plan", description: "Available in FreeModel's OpenAI-compatible catalogue.", quotaNote: "FreeModel account allowance applies." },
  { id: "freemodel:glm-5.3-flash", providerId: "freemodel", providerName: "FreeModel", providerModelId: "glm-5.3-flash", secretName: "FREEMODEL_API_KEY", name: "GLM 5.3 Flash", role: "FreeModel free plan", description: "Available in FreeModel's model catalogue.", quotaNote: "FreeModel account allowance applies." },
  { id: "freemodel:mimo-v2.6-pro", providerId: "freemodel", providerName: "FreeModel", providerModelId: "mimo-v2.6-pro", secretName: "FREEMODEL_API_KEY", name: "MiMo V2.6 Pro", role: "FreeModel free plan", description: "Available in FreeModel's model catalogue.", quotaNote: "FreeModel account allowance applies." },
  { id: "freemodel:gpt-6-luna", providerId: "freemodel", providerName: "FreeModel", providerModelId: "gpt-6-luna", secretName: "FREEMODEL_API_KEY", name: "GPT-6 Luna", role: "FreeModel free plan", description: "Available in FreeModel's model catalogue.", quotaNote: "FreeModel account allowance applies." },
  { id: "openrouter:openrouter/free", providerId: "openrouter", providerName: "OpenRouter", providerModelId: "openrouter/free", secretName: "OPENROUTER_API_KEY", name: "Auto-select a free model", role: "OpenRouter free router", description: "Uses OpenRouter's free-model router only.", quotaNote: "OpenRouter free-variant limits apply." },
] as const;

export type CelestiaAIModel = (typeof CELESTIA_AI_MODELS)[number];
type CelestiaAIDynamicModel = { id: string; providerId: CelestiaAIProviderId; providerName: string; providerModelId: string; secretName: string; name: string; role: string; description: string; quotaNote: string };
export type CelestiaAIModelId = string;
export type CelestiaAIProviderId = "pollinations" | "freemodel" | "nararouter" | "openrouter";

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
