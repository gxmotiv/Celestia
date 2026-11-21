export interface PollinationsTextModel {
  id: string;
  name: string;
  description: string;
  inputPrice: number;
  outputPrice: number;
  health: string;
}

type CatalogEntry = Record<string, unknown>;
let cachedAt = 0;
let cachedModels: PollinationsTextModel[] = [];

function numericPrices(value: unknown): number[] {
  if (typeof value === "number" && Number.isFinite(value)) return [value];
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return [Number(value)];
  if (Array.isArray(value)) return value.flatMap(numericPrices);
  if (value && typeof value === "object") return Object.values(value as Record<string, unknown>).flatMap(numericPrices);
  return [];
}

function zeroPriced(entry: CatalogEntry): boolean {
  const prices = numericPrices(entry.pricing);
  return prices.length >= 2 && prices.every((price) => price === 0);
}

function healthy(entry: CatalogEntry): boolean {
  const health = entry.health && typeof entry.health === "object"
    ? (entry.health as Record<string, unknown>).status
    : undefined;
  const status = typeof health === "string" ? health : entry.status;
  return typeof status === "string" && status.toLowerCase() === "healthy";
}

function priceValue(value: unknown): number {
  const values = numericPrices(value);
  return values.length ? values[0] : 0;
}

export async function getPollinationsFreeTextModels(): Promise<PollinationsTextModel[]> {
  if (Date.now() - cachedAt < 60_000 && cachedModels.length) return cachedModels;

  const response = await fetch("https://gen.pollinations.ai/text/models?source=official&reliability=all", {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Pollinations model catalogue returned HTTP ${response.status}.`);
  const payload: unknown = await response.json();
  const entries = Array.isArray(payload)
    ? payload
    : payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)
      ? (payload as { data: unknown[] }).data
      : [];
  const models = (entries as CatalogEntry[])
    .filter((entry) => typeof entry.id === "string" && zeroPriced(entry) && healthy(entry))
    .map((entry) => {
      const pricing = entry.pricing as Record<string, unknown>;
      const inputPrice = priceValue(pricing.promptTextToken ?? pricing.input ?? pricing.prompt ?? pricing.input_token);
      const outputPrice = priceValue(pricing.completionTextToken ?? pricing.output ?? pricing.completion ?? pricing.output_token);
      return {
        id: entry.id as string,
        name: typeof entry.name === "string" ? entry.name : typeof entry.title === "string" ? entry.title : entry.id as string,
        description: typeof entry.description === "string" ? entry.description : "Official Pollinations text model.",
        inputPrice,
        outputPrice,
        health: "healthy",
      };
    })
    .sort((a, b) => (a.inputPrice + a.outputPrice) - (b.inputPrice + b.outputPrice) || a.name.localeCompare(b.name));

  cachedModels = models;
  cachedAt = Date.now();
  return models;
}

export async function isPollinationsFreeTextModel(modelId: string): Promise<boolean> {
  if (modelId === "auto-free") return true;
  const models = await getPollinationsFreeTextModels();
  return models.some((model) => model.id === modelId);
}
