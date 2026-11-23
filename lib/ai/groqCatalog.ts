export const GROQ_FREE_MODEL_IDS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
] as const;

export interface GroqFreeModel {
  id: (typeof GROQ_FREE_MODEL_IDS)[number];
  name: string;
  quota: string;
  description: string;
}

export const GROQ_FREE_MODELS: GroqFreeModel[] = [
  {
    id: "openai/gpt-oss-120b",
    name: "GPT-OSS 120B",
    quota: "30 RPM · 1,000 requests/day · 8K TPM · 200K tokens/day",
    description: "Higher-capability reasoning, coding and tool-use model. Free-plan quota is shared at the Groq organisation level.",
  },
  {
    id: "openai/gpt-oss-20b",
    name: "GPT-OSS 20B",
    quota: "30 RPM · 1,000 requests/day · 8K TPM · 200K tokens/day",
    description: "Smaller, faster GPT-OSS option for routine consultation and shorter tasks.",
  },
];

export function parseGroqModelIds(payload: unknown): string[] {
  const root = payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : {};
  const entries = Array.isArray(root.data) ? root.data : Array.isArray(root.models) ? root.models : [];
  return [...new Set(entries.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const id = (entry as Record<string, unknown>).id;
    return typeof id === "string" && id.trim() ? [id.trim()] : [];
  }))].sort();
}

let cachedAt = 0;
let cachedIds: string[] = [];

export async function getGroqAvailableFreeModels(apiKey: string): Promise<GroqFreeModel[]> {
  if (Date.now() - cachedAt < 30_000 && cachedIds.length > 0) {
    return GROQ_FREE_MODELS.filter((model) => cachedIds.includes(model.id));
  }

  const response = await fetch("https://api.groq.com/openai/v1/models", {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) {
    const error = new Error(`Groq model catalogue failed with HTTP ${response.status}.`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  cachedIds = parseGroqModelIds(await response.json());
  cachedAt = Date.now();
  return GROQ_FREE_MODELS.filter((model) => cachedIds.includes(model.id));
}
