export interface OpenRouterFreeModel {
  id: string;
  name: string;
}

function zeroPrice(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value) && value === 0;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed === 0;
  }
  return false;
}

/** Only explicit :free variants with zero input AND output pricing are eligible. */
export function parseOpenRouterFreeModels(payload: unknown): OpenRouterFreeModel[] {
  const root = payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : {};
  const entries = Array.isArray(root.data) ? root.data : [];
  const models = new Map<string, OpenRouterFreeModel>();

  for (const raw of entries) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const entry = raw as Record<string, unknown>;
    const id = typeof entry.id === "string" ? entry.id.trim() : "";
    const pricing = entry.pricing && typeof entry.pricing === "object"
      ? entry.pricing as Record<string, unknown>
      : {};
    const architecture = entry.architecture && typeof entry.architecture === "object"
      ? entry.architecture as Record<string, unknown>
      : {};
    const inputModalities = Array.isArray(architecture.input_modalities) ? architecture.input_modalities : [];
    const outputModalities = Array.isArray(architecture.output_modalities) ? architecture.output_modalities : [];
    const modality = typeof architecture.modality === "string" ? architecture.modality : "";
    const acceptsText = inputModalities.length > 0 ? inputModalities.includes("text") : modality.startsWith("text->");
    const returnsText = outputModalities.length > 0 ? outputModalities.includes("text") : modality.endsWith("->text");
    if (!id.endsWith(":free") || !acceptsText || !returnsText || !zeroPrice(pricing.prompt) || !zeroPrice(pricing.completion)) continue;
    models.set(id, {
      id,
      name: typeof entry.name === "string" && entry.name.trim() ? entry.name.trim() : id,
    });
  }

  return [...models.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export type OpenRouterResponseValidation =
  | { valid: true; answer: string; model: string }
  | { valid: false; reason: string };

/** The openrouter/free router may return the concrete model it selected, not the router alias. */
export function validateOpenRouterFreeResponse(
  payload: unknown,
  eligibleModelIds: readonly string[],
): OpenRouterResponseValidation {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { valid: false, reason: "Response payload is not a JSON object." };
  }
  const response = payload as Record<string, unknown>;
  const returnedModel = typeof response.model === "string" ? response.model.trim() : "";
  if (!returnedModel || !eligibleModelIds.includes(returnedModel)) {
    return { valid: false, reason: "OpenRouter did not confirm a model in the current zero-priced :free catalogue." };
  }
  const choices = response.choices;
  const firstChoice = Array.isArray(choices) ? choices[0] : undefined;
  const message = firstChoice && typeof firstChoice === "object"
    ? (firstChoice as Record<string, unknown>).message
    : undefined;
  const answer = message && typeof message === "object"
    ? (message as Record<string, unknown>).content
    : undefined;
  if (typeof answer !== "string" || !answer.trim()) {
    return { valid: false, reason: "OpenRouter response contained no non-empty assistant text." };
  }
  return { valid: true, answer, model: returnedModel };
}

let cachedAt = 0;
let cachedModels: OpenRouterFreeModel[] = [];

export async function getOpenRouterFreeModels(apiKey: string): Promise<OpenRouterFreeModel[]> {
  if (Date.now() - cachedAt < 30_000 && cachedModels.length > 0) return cachedModels;
  const response = await fetch("https://openrouter.ai/api/v1/models?input_modalities=text&output_modalities=text", {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) {
    const error = new Error(`OpenRouter model catalogue failed with HTTP ${response.status}.`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  const models = parseOpenRouterFreeModels(await response.json());
  if (models.length === 0) throw new Error("OpenRouter has no currently listed zero-priced :free chat models.");
  cachedModels = models;
  cachedAt = Date.now();
  return models;
}
