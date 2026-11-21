export interface PollinationsTextModel {
  id: string;
  name: string;
  description: string;
  inputPrice: number;
  outputPrice: number;
  health: string;
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

function isEligibleFreeTextModel(entry: CatalogEntry): boolean {
  const health = entry.health && typeof entry.health === "object"
    ? (entry.health as Record<string, unknown>).status
    : undefined;
  const modelName = typeof entry.name === "string" ? entry.name : entry.id;
  const description = typeof entry.description === "string" ? entry.description : "";
  const privacyRisk = /retain(?:ed|s)?|used for training|training data|data retention/i.test(description);

  return typeof modelName === "string" &&
    modelName.length > 0 &&
    entry.category === "text" &&
    entry.community !== true &&
    entry.paid_only !== true &&
    entry.is_specialized !== true &&
    !privacyRisk &&
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
export function parsePollinationsFreeTextModels(payload: unknown): PollinationsTextModel[] {
  const entries = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)
      ? (payload as { data: unknown[] }).data
      : [];

  return (entries as CatalogEntry[])
    .filter((entry) => entry && typeof entry === "object" && isEligibleFreeTextModel(entry))
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
      };
    })
    .sort((a, b) => (a.inputPrice + a.outputPrice) - (b.inputPrice + b.outputPrice) || a.name.localeCompare(b.name));
}

export async function getPollinationsFreeTextModels(): Promise<PollinationsTextModel[]> {
  if (Date.now() - cachedAt < 60_000) return cachedModels;

  const response = await fetch("https://gen.pollinations.ai/text/models?source=official&reliability=all&limit=500", {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Pollinations model catalogue returned HTTP ${response.status}.`);
  const payload: unknown = await response.json();
  const models = parsePollinationsFreeTextModels(payload);
  cachedModels = models;
  cachedAt = Date.now();
  return models;
}

export async function isPollinationsFreeTextModel(modelId: string): Promise<boolean> {
  if (modelId === "auto-free") return true;
  const models = await getPollinationsFreeTextModels();
  return models.some((model) => model.id === modelId);
}
