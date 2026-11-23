import { getCelestiaAIModel } from "./modelCatalog";
import { getPollinationsFreeTextModels, getPollinationsManualOnlyTextModels, isPollinationsFreeTextModel } from "./pollinationsCatalog";
import { getNaraRouterFreeModels } from "./nararouterCatalog";
import { getFreeModelChatCatalog } from "./freemodelCatalog";
import { getGroqAvailableFreeModels } from "./groqCatalog";
import { getOpenRouterFreeModels, validateOpenRouterFreeResponse } from "./openrouterCatalog";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getCloudflareWorkersAIModel, parseCloudflareWorkersAIResponse, type CloudflareWorkersAIBinding } from "./cloudflareWorkersAICatalog";
import { validateRequestedModelResponse } from "./modelResponseValidation";

export type CelestiaAIProvider = "pollinations" | "freemodel" | "nararouter" | "openrouter" | "groq" | "cloudflare-workers-ai";
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
  allowPrivacyRiskModel?: boolean;
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
  options: { systemPrompt: string; userPrompt: string; maxOutputTokens: number; temperature: number; allowPrivacyRiskModel?: boolean },
): Promise<CelestiaAIResult> {
  const eligible = await getPollinationsFreeTextModels();
  const manualOnly = options.allowPrivacyRiskModel ? await getPollinationsManualOnlyTextModels() : [];
  const model = requestedModel === "auto-free"
    ? eligible[0]?.id
    : (eligible.find((candidate) => candidate.id === requestedModel) ??
      manualOnly.find((candidate) => candidate.id === requestedModel))?.id;
  if (!model) {
    throw new Error("No healthy, official, zero-priced Pollinations text model is currently available. Refresh the model list later.");
  }
  if (!await isPollinationsFreeTextModel(model, options.allowPrivacyRiskModel === true)) {
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
  const validation = validateRequestedModelResponse(model, body);
  if (!validation.valid) throw new Error(`Pollinations response validation failed: ${validation.reason}`);
  return { text: validation.answer.trim(), provider: "pollinations", model, usage: readUsage(body?.usage) };
}

async function generateWithFreeModel(
  apiKey: string,
  model: string,
  options: { systemPrompt: string; userPrompt: string; maxOutputTokens: number; temperature: number },
): Promise<CelestiaAIResult> {
  const catalogue = await getFreeModelChatCatalog(apiKey);
  if (!catalogue.some((candidate) => candidate.id === model)) {
    throw new Error("The selected FreeModel ID is not present in the current authenticated chat catalogue. Refresh the model list; unavailable IDs are blocked.");
  }
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
  const validation = validateRequestedModelResponse(model, body);
  if (!validation.valid) throw new Error(`FreeModel response validation failed: ${validation.reason}`);
  return { text: validation.answer.trim(), provider: "freemodel", model, usage: readUsage(body?.usage) };
}

async function generateWithOpenRouter(
  apiKey: string,
  model: string,
  options: { systemPrompt: string; userPrompt: string; maxOutputTokens: number; temperature: number },
): Promise<CelestiaAIResult> {
  const eligibleFreeModels = await getOpenRouterFreeModels(apiKey);
  if (eligibleFreeModels.length === 0) throw new Error("OpenRouter has no currently verified zero-priced free model.");
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
  const validation = validateOpenRouterFreeResponse(body, eligibleFreeModels.map((candidate) => candidate.id));
  if (!validation.valid) throw new Error(`OpenRouter free-router response validation failed: ${validation.reason}`);
  return { text: validation.answer.trim(), provider: "openrouter", model: validation.model, usage: readUsage(body?.usage) };
}

async function generateWithGroq(
  apiKey: string,
  model: string,
  options: { systemPrompt: string; userPrompt: string; maxOutputTokens: number; temperature: number },
): Promise<CelestiaAIResult> {
  if (process.env.GROQ_FREE_PLAN_CONFIRMED?.trim().toLowerCase() !== "true") {
    throw new Error("Groq is disabled until GROQ_FREE_PLAN_CONFIRMED=true is set after verifying that the account is on the $0 Free plan. Do not enable the paid Developer plan.");
  }
  const available = await getGroqAvailableFreeModels(apiKey);
  if (!available.some((candidate) => candidate.id === model)) {
    throw new Error("The selected Groq model is not in the current account catalogue or Celestia verified Free-plan allowlist.");
  }
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
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
    const error = new Error(body?.error?.message || "Groq request failed with HTTP " + response.status + ".") as ProviderError;
    error.status = response.status;
    throw error;
  }
  const validation = validateRequestedModelResponse(model, body);
  if (!validation.valid) throw new Error("Groq response validation failed: " + validation.reason);
  return { text: validation.answer.trim(), provider: "groq", model, usage: readUsage(body?.usage) };
}

async function generateWithCloudflareWorkersAI(
  model: string,
  options: { systemPrompt: string; userPrompt: string; maxOutputTokens: number; temperature: number },
): Promise<CelestiaAIResult> {
  if (process.env.CLOUDFLARE_WORKERS_AI_FREE_PLAN_CONFIRMED?.trim().toLowerCase() !== "true") {
    throw new Error("Cloudflare Workers AI is disabled until CLOUDFLARE_WORKERS_AI_FREE_PLAN_CONFIRMED=true is set after confirming the account is on Workers Free. Workers Paid can bill usage above the daily free allocation.");
  }
  if (!getCloudflareWorkersAIModel(model)) {
    throw new Error("The selected Cloudflare Workers AI model is not in Celestia's verified Free-plan allowlist.");
  }

  let binding: CloudflareWorkersAIBinding | undefined;
  try {
    const context = getCloudflareContext();
    binding = (context.env as unknown as { AI?: CloudflareWorkersAIBinding }).AI;
  } catch {
    throw new Error("The Cloudflare Workers AI binding is unavailable in this runtime. Confirm the AI binding is present in wrangler.jsonc and deploy the Worker after review.");
  }
  if (!binding || typeof binding.run !== "function") {
    throw new Error("Cloudflare Workers AI binding AI is missing. Check the Worker configuration before selecting this provider.");
  }

  let output: unknown;
  try {
    output = await binding.run(model, {
      messages: [
        { role: "system", content: options.systemPrompt },
        { role: "user", content: options.userPrompt },
      ],
      max_tokens: Math.min(Math.max(256, options.maxOutputTokens), 4096),
      temperature: options.temperature,
      stream: false,
    });
  } catch (caught) {
    const error = (caught instanceof Error ? caught : new Error("Cloudflare Workers AI request failed.")) as ProviderError;
    if (!error.status && /429|rate.?limit|quota|neuron|daily limit|capacity exceeded/i.test(error.message)) {
      error.status = 429;
    }
    throw error;
  }

  const parsed = parseCloudflareWorkersAIResponse(output);
  // AI.run is invoked with the exact allowlisted model ID. Its documented
  // response body returns response/usage, not a model field, so the selected
  // model attribution is based on the explicit binding invocation.
  return {
    text: parsed.text,
    provider: "cloudflare-workers-ai",
    model,
    usage: parsed.usage,
  };
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
  const validation = validateRequestedModelResponse(model, body);
  if (!validation.valid) throw new Error(`NaraRouter response validation failed: ${validation.reason}`);
  return { text: validation.answer.trim(), provider: "nararouter", model, usage: readUsage(body?.usage) };
}

/** Explicit model selections are routed only to that provider. No automatic provider fallback is performed. */
export async function generateCelestiaText(input: GenerateTextOptions): Promise<CelestiaAIResult> {
  const options = {
    systemPrompt: input.systemPrompt,
    userPrompt: input.userPrompt,
    allowPrivacyRiskModel: input.allowPrivacyRiskModel === true,
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
      if (process.env.FREEMODEL_FREE_PLAN_CONFIRMED?.trim().toLowerCase() !== "true") {
        throw new Error("FreeModel is disabled until FREEMODEL_FREE_PLAN_CONFIRMED=true is set after confirming the $0 Free plan and zero prepaid/Day Pass balance. This prevents fallback to paid account balance.");
      }
      return generateWithFreeModel(key, selectedModel.providerModelId, options);
    }
    case "groq": {
      const key = process.env.GROQ_API_KEY?.trim();
      if (!key) throw new Error("Groq is not configured. Add GROQ_API_KEY as a server-side Cloudflare Worker secret.");
      return generateWithGroq(key, selectedModel.providerModelId, options);
    }
    case "cloudflare-workers-ai": {
      return generateWithCloudflareWorkersAI(selectedModel.providerModelId, options);
    }
    case "nararouter": {
      const key = process.env.NARAROUTER_API_KEY?.trim();
      if (!key) throw new Error("NaraRouter is not configured. Add the NARAROUTER_API_KEY server secret.");
      const model = selectedModel.providerModelId;
      const freeModels = await getNaraRouterFreeModels(key);
      if (!freeModels.some((candidate) => candidate.id === model)) {
        throw new Error("The selected NaraRouter model is not currently verified on the provider's Free plan. Refresh the model list; paid models are blocked.");
      }
      return generateWithNaraRouter(key, model, options);
    }
    case "openrouter": {
      const key = process.env.OPENROUTER_API_KEY?.trim();
      if (!key) throw new Error("OpenRouter is not configured. Add the OPENROUTER_API_KEY server secret.");
      return generateWithOpenRouter(key, selectedModel.providerModelId, options);
    }
  }
}
