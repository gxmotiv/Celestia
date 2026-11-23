export interface FreeModelChatModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number | null;
  capabilities: string[];
}

type ModelEntry = Record<string, unknown>;

export function parseFreeModelChatCatalog(payload: unknown): FreeModelChatModel[] {
  const root = payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : {};
  const entries = Array.isArray(root.data) ? root.data : Array.isArray(root.models) ? root.models : [];
  const byId = new Map<string, FreeModelChatModel>();

  for (const raw of entries) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const entry = raw as ModelEntry;
    const id = typeof entry.id === "string" ? entry.id.trim() : "";
    if (!id || entry.type !== "chat") continue;
    const capabilities = Array.isArray(entry.capabilities)
      ? entry.capabilities.filter((item): item is string => typeof item === "string")
      : [];
    byId.set(id, {
      id,
      name: typeof entry.name === "string" && entry.name.trim() ? entry.name.trim() : id,
      description: typeof entry.description === "string" ? entry.description : "Available in the authenticated FreeModel chat catalogue.",
      contextWindow: typeof entry.context_window === "number" && Number.isFinite(entry.context_window)
        ? entry.context_window
        : null,
      capabilities,
    });
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

let cachedAt = 0;
let cachedModels: FreeModelChatModel[] = [];

export async function getFreeModelChatCatalog(apiKey: string): Promise<FreeModelChatModel[]> {
  if (Date.now() - cachedAt < 30_000 && cachedModels.length > 0) return cachedModels;

  const response = await fetch("https://freemodel.in/v1/models", {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) {
    const error = new Error(`FreeModel model catalogue failed with HTTP ${response.status}. Check that the key has the models:read scope.`) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  const models = parseFreeModelChatCatalog(await response.json());
  if (models.length === 0) throw new Error("FreeModel returned no active chat models in its authenticated catalogue.");
  cachedModels = models;
  cachedAt = Date.now();
  return models;
}
