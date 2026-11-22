export interface PollinationsTextModel {
  id: string;
  name: string;
  description: string;
  inputPrice: number | null;
  outputPrice: number | null;
  currency: string | null;
  health: string;
  privacyRisk: boolean;
  community: boolean;
  publisher: string;
  paidOnly: boolean;
  healthSuccessRate: number | null;
  healthRequests: number;
  contextLength: number | null;
  reasoning: boolean;
  tools: boolean;
}

type CatalogEntry = Record<string, unknown>;
let cachedAt = 0;
let cachedModels: PollinationsTextModel[] = [];

function parsePrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return null;
}

function isEligibleAvailableTextModel(entry: CatalogEntry, includeManualOnly = false): boolean {
  const health = entry.health && typeof entry.health === "object"
    ? (entry.health as Record<string, unknown>).status
    : undefined;
  const modelName = typeof entry.id === "string" ? entry.id : entry.name;
  const description = typeof entry.description === "string" ? entry.description : "";
  const privacyRisk = /retain|retention|used for training|collected for training|data may be collected/i.test(description);
  const community = entry.community === true || entry.source === "community" ||
    (typeof modelName === "string" && modelName.startsWith("community/"));

  return typeof modelName === "string" &&
    modelName.length > 0 &&
    entry.category === "text" &&
    (!community || includeManualOnly) &&
    entry.paid_only !== true &&
    entry.is_specialized !== true &&
    (!privacyRisk || includeManualOnly) &&
    health === "healthy" &&
    Array.isArray(entry.input_modalities) && entry.input_modalities.includes("text") &&
    Array.isArray(entry.output_modalities) && entry.output_modalities.includes("text") &&
    Array.isArray(entry.supported_endpoints) && entry.supported_endpoints.includes("/v1/chat/completions");
}

/**
 * Parses models available to non-paid-only Pollinations API keys.
 * IMPORTANT: paid_only:false does NOT mean zero-price. Per-token Pollen
 * charges are preserved in inputPrice/outputPrice for the UI and benchmark.
 */
export function parsePollinationsFreeTextModels(
  payload: unknown,
  options: { includeManualOnly?: boolean } = {},
): PollinationsTextModel[] {
  const entries = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)
      ? (payload as { data: unknown[] }).data
      : [];

  return (entries as CatalogEntry[])
    .filter((entry) => entry && typeof entry === "object" &&
      isEligibleAvailableTextModel(entry, options.includeManualOnly === true))
    .map((entry) => {
      const id = (typeof entry.id === "string" ? entry.id : entry.name) as string;
      const pricing = entry.pricing && typeof entry.pricing === "object"
        ? entry.pricing as Record<string, unknown>
        : {};
      const health = entry.health && typeof entry.health === "object"
        ? entry.health as Record<string, unknown>
        : {};
      const community = entry.community === true || entry.source === "community" || id.startsWith("community/");
      return {
        id,
        name: typeof entry.title === "string" ? entry.title : id,
        description: typeof entry.description === "string" ? entry.description : "",
        inputPrice: parsePrice(pricing.promptTextTokens),
        outputPrice: parsePrice(pricing.completionTextTokens),
        currency: typeof pricing.currency === "string" ? pricing.currency : null,
        health: typeof health.status === "string" ? health.status : "unknown",
        privacyRisk: /retain|retention|used for training|collected for training|data may be collected/i.test(
          typeof entry.description === "string" ? entry.description : "",
        ),
        community,
        publisher: typeof entry.publisher === "string" ? entry.publisher : (community ? "Community publisher" : "Pollinations official"),
        paidOnly: entry.paid_only === true,
        healthSuccessRate: typeof health.success_rate === "number" ? health.success_rate : null,
        healthRequests: typeof health.requests === "number" ? health.requests : 0,
        contextLength: typeof entry.context_length === "number" ? entry.context_length : null,
        reasoning: entry.reasoning === true || (Array.isArray(entry.capabilities) && entry.capabilities.includes("reasoning")),
        tools: entry.tools === true || (Array.isArray(entry.capabilities) && entry.capabilities.includes("tool_calling")),
      };
    })
    .sort((a, b) =>
      Number(b.reasoning) - Number(a.reasoning) ||
      Number(b.tools) - Number(a.tools) ||
      (b.healthSuccessRate ?? -1) - (a.healthSuccessRate ?? -1) ||
      b.healthRequests - a.healthRequests ||
      a.name.localeCompare(b.name)
    );
}

async function getPollinationsCatalogueModels(): Promise<PollinationsTextModel[]> {
  if (Date.now() - cachedAt < 60_000) return cachedModels;

  const apiKey = process.env.POLLINATIONS_API_KEY?.trim();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  const sources = ["official", "community"] as const;
  const responses = await Promise.all(sources.map((source) => fetch(
    `https://gen.pollinations.ai/text/models?source=${source}&reliability=reliable&limit=500`,
    { headers, cache: "no-store", signal: AbortSignal.timeout(12_000) },
  )));
  const failed = responses.find((response) => !response.ok);
  if (failed) throw new Error(`Pollinations model catalogue returned HTTP ${failed.status}.`);
  const payloads: unknown[] = await Promise.all(responses.map((response) => response.json()));
  const unique = new Map<string, PollinationsTextModel>();
  for (const payload of payloads) {
    for (const model of parsePollinationsFreeTextModels(payload, { includeManualOnly: true })) {
      unique.set(model.id, model);
    }
  }
  cachedModels = [...unique.values()];
  cachedAt = Date.now();
  return cachedModels;
}

/** Official models without a description-based data-retention warning. */
export async function getPollinationsFreeTextModels(): Promise<PollinationsTextModel[]> {
  return (await getPollinationsCatalogueModels()).filter((model) => !model.community && !model.privacyRisk);
}

/** Community-hosted models and models with retention warnings are manual-choice only. */
export async function getPollinationsManualOnlyTextModels(): Promise<PollinationsTextModel[]> {
  return (await getPollinationsCatalogueModels())
    .filter((model) => model.community || model.privacyRisk)
    .sort((a, b) =>
      (b.healthSuccessRate ?? -1) - (a.healthSuccessRate ?? -1) ||
      Number(b.reasoning) - Number(a.reasoning) ||
      (b.contextLength ?? 0) - (a.contextLength ?? 0) ||
      a.name.localeCompare(b.name)
    )
    .slice(0, 100);
}

export async function isPollinationsFreeTextModel(modelId: string, allowPrivacyRisk = false): Promise<boolean> {
  if (modelId === "auto-free") return true;
  const models = allowPrivacyRisk
    ? [...await getPollinationsFreeTextModels(), ...await getPollinationsManualOnlyTextModels()]
    : await getPollinationsFreeTextModels();
  return models.some((model) => model.id === modelId);
}
