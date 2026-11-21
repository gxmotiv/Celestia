export interface PollinationsTextModel {
  id: string;
  name: string;
  description: string;
  inputPrice: number;
  outputPrice: number;
  health: string;
  privacyRisk: boolean;
  community: boolean;
  publisher: string;
  healthSuccessRate: number | null;
  healthRequests: number;
  contextLength: number | null;
  reasoning: boolean;
  tools: boolean;
}

type CatalogEntry = Record<string, unknown>;

const PRICE_FIELDS = new Set([
  "promptTextTokens", "promptCachedTokens", "promptCacheWriteTokens",
  "promptAudioTokens", "promptAudioSeconds", "promptImageTokens", "promptVideoTokens",
  "completionTextTokens", "completionReasoningTokens", "completionAudioTokens",
  "completionAudioSeconds", "completionImageTokens", "completionVideoSeconds",
  "completionVideoTokens",
]);

let cachedAt = 0;
let cachedModels: PollinationsTextModel[] = [];

function parsePrice(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return undefined;
}

/**
 * Pollinations' official registry represents a zero-priced model with
 * pricing: { currency: "pollen" } and omits zero-valued price fields.
 * Unknown fields fail closed so a new billing dimension cannot be mistaken
 * for a free model.
 */
function hasZeroPricing(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const pricing = value as Record<string, unknown>;
  if (pricing.currency !== "pollen") return false;
  for (const [field, rawPrice] of Object.entries(pricing)) {
    if (field === "currency") continue;
    if (!PRICE_FIELDS.has(field)) return false;
    const price = parsePrice(rawPrice);
    if (price === undefined || price !== 0) return false;
  }
  return true;
}

function hasNoPaidAdjustments(entry: CatalogEntry): boolean {
  if (entry.pricing_adjustments === undefined) return true;
  if (!Array.isArray(entry.pricing_adjustments)) return false;
  return entry.pricing_adjustments.every((adjustment) => {
    if (!adjustment || typeof adjustment !== "object") return false;
    return parsePrice((adjustment as Record<string, unknown>).price) === 0;
  });
}

function isEligibleFreeTextModel(entry: CatalogEntry, includeManualOnly = false): boolean {
  const health = entry.health && typeof entry.health === "object"
    ? (entry.health as Record<string, unknown>).status
    : undefined;
  const modelName = typeof entry.name === "string" ? entry.name : entry.id;
  const description = typeof entry.description === "string" ? entry.description : "";
  const privacyRisk = /retain|retention|used for training|collected for training|data may be collected/i.test(description);
  const community = entry.community === true;

  return typeof modelName === "string" &&
    modelName.length > 0 &&
    entry.category === "text" &&
    (!community || includeManualOnly) &&
    entry.paid_only !== true &&
    entry.is_specialized !== true &&
    (!privacyRisk || includeManualOnly) &&
    health === "healthy" &&
    Array.isArray(entry.input_modalities) &&
    entry.input_modalities.includes("text") &&
    Array.isArray(entry.output_modalities) &&
    entry.output_modalities.includes("text") &&
    Array.isArray(entry.supported_endpoints) &&
    entry.supported_endpoints.includes("/v1/chat/completions") &&
    hasZeroPricing(entry.pricing) &&
    hasNoPaidAdjustments(entry) &&
    (entry.pricing_variants === undefined ||
      (Array.isArray(entry.pricing_variants) &&
        entry.pricing_variants.every((variant) =>
          Boolean(variant && typeof variant === "object" &&
            hasZeroPricing((variant as Record<string, unknown>).pricing))
        )));
}

/** Pure parser exported so the live Pollinations schema can be regression-tested. */
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
    .filter((entry) => entry && typeof entry === "object" && isEligibleFreeTextModel(entry, options.includeManualOnly === true))
    .map((entry) => {
      const id = (typeof entry.name === "string" ? entry.name : entry.id) as string;
      const pricing = entry.pricing as Record<string, unknown>;
      return {
        id,
        name: typeof entry.title === "string" ? entry.title : id,
        description: typeof entry.description === "string" ? entry.description : "Official Pollinations text model.",
        inputPrice: parsePrice(pricing.promptTextTokens) ?? 0,
        outputPrice: parsePrice(pricing.completionTextTokens) ?? 0,
        health: "healthy",
        privacyRisk: /retain|retention|used for training|collected for training|data may be collected/i.test(
          typeof entry.description === "string" ? entry.description : "",
        ),
        community: entry.community === true,
        publisher: typeof entry.publisher === "string" ? entry.publisher : (entry.community === true ? "Community publisher" : "Pollinations official"),
        healthSuccessRate: entry.health && typeof entry.health === "object" && typeof (entry.health as Record<string, unknown>).success_rate === "number"
          ? (entry.health as Record<string, unknown>).success_rate as number
          : null,
        healthRequests: entry.health && typeof entry.health === "object" && typeof (entry.health as Record<string, unknown>).requests === "number"
          ? (entry.health as Record<string, unknown>).requests as number
          : 0,
        contextLength: typeof entry.context_length === "number" ? entry.context_length : null,
        reasoning: entry.reasoning === true || (Array.isArray(entry.capabilities) && entry.capabilities.includes("reasoning")),
        tools: entry.tools === true || (Array.isArray(entry.capabilities) && entry.capabilities.includes("tool_calling")),
      };
    })
    .sort((a, b) => (a.inputPrice + a.outputPrice) - (b.inputPrice + b.outputPrice) || a.name.localeCompare(b.name));
}

async function getPollinationsCatalogueModels(): Promise<PollinationsTextModel[]> {
  if (Date.now() - cachedAt < 60_000) return cachedModels;

  // Query both Pollinations-operated and community-published models.
  const sources = ["official", "community"] as const;
  const responses = await Promise.all(sources.map((source) => fetch(
    `https://gen.pollinations.ai/text/models?source=${source}&reliability=all&limit=500`,
    {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    },
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

/** Only official, privacy-safe models can be selected automatically. */
export async function getPollinationsFreeTextModels(): Promise<PollinationsTextModel[]> {
  return (await getPollinationsCatalogueModels()).filter((model) => !model.community && !model.privacyRisk);
}

/** Community-hosted models and official models with retention warnings require explicit consent. */
export async function getPollinationsManualOnlyTextModels(): Promise<PollinationsTextModel[]> {
  return (await getPollinationsCatalogueModels())
    .filter((model) => model.community || model.privacyRisk)
    .sort((a, b) =>
      (b.healthSuccessRate ?? -1) - (a.healthSuccessRate ?? -1) ||
      Number(b.reasoning) - Number(a.reasoning) ||
      (b.contextLength ?? 0) - (a.contextLength ?? 0) ||
      a.name.localeCompare(b.name)
    );
}

export async function isPollinationsFreeTextModel(modelId: string, allowPrivacyRisk = false): Promise<boolean> {
  if (modelId === "auto-free") return true;
  const models = allowPrivacyRisk
    ? [...await getPollinationsFreeTextModels(), ...await getPollinationsManualOnlyTextModels()]
    : await getPollinationsFreeTextModels();
  return models.some((model) => model.id === modelId);
}
