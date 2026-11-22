/**
 * NaraRouter exposes an authenticated, account-scoped OpenAI-compatible model list.
 * The current provider pricing page lists Agnes 2.5 Flash on the Free plan.
 * Older aliases and every PAYG model are excluded unless the provider updates its public plan listing.
 */
export const NARAROUTER_FREE_MODEL_IDS = [
  "agnes-2.5-flash",
] as const;

export interface NaraRouterModel {
  id: string;
  name: string;
  free: true;
  description: string;
}

export function parseNaraRouterFreeModels(payload: unknown): NaraRouterModel[] {
  const root = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const entries = Array.isArray(root.data) ? root.data : Array.isArray(root.models) ? root.models : [];
  const available = new Set<string>();
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const id = (entry as Record<string, unknown>).id;
    if (typeof id === "string" && id.trim()) available.add(id.trim());
  }
  return NARAROUTER_FREE_MODEL_IDS
    .filter((id) => available.has(id))
    .map((id) => ({
      id,
      name: ({
        "agnes-2.5-flash": "Agnes 2.5 Flash",
      } as const)[id],
      free: true as const,
      description: "Listed on NaraRouter's current public Free plan; subject to its quota and rate limits.",
    }));
}

export async function getNaraRouterFreeModels(apiKey: string): Promise<NaraRouterModel[]> {
  const baseUrl = (process.env.NARAROUTER_BASE_URL?.trim() || "https://router.bynara.id/v1").replace(/\/+$/, "");
  const response = await fetch(baseUrl + "/models", {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`NaraRouter model discovery failed with HTTP ${response.status}.`);
  }
  return parseNaraRouterFreeModels(await response.json());
}
/** Extract model IDs from the documented JSON-RPC MCP list_models result. */
export function parseNaraRouterMcpModelIds(payload: unknown): string[] {
  const ids = new Set<string>();
  const seen = new Set<unknown>();
  const visit = (value: unknown, depth = 0): void => {
    if (depth > 16 || value === null || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value) visit(item, depth + 1);
      return;
    }
    const record = value as Record<string, unknown>;
    if (typeof record.id === "string" && record.id.trim()) ids.add(record.id.trim());
    for (const key of ["models", "data", "content", "structuredContent", "result"]) {
      const child = record[key];
      if (key === "models" && Array.isArray(child)) {
        for (const model of child) {
          if (typeof model === "string" && model.trim()) ids.add(model.trim());
          else visit(model, depth + 1);
        }
      } else if (child !== undefined) visit(child, depth + 1);
    }
    if (typeof record.text === "string") {
      const text = record.text.trim();
      if (text.startsWith("{") || text.startsWith("[")) {
        try { visit(JSON.parse(text) as unknown, depth + 1); } catch { /* text is not JSON */ }
      } else {
        for (const line of text.split(/\r?\n/)) {
          const match = line.match(/^\s*(?:[-*]\s*)?([a-z0-9][a-z0-9._/-]{1,100})\s*$/i);
          if (match) ids.add(match[1]);
        }
      }
    }
  };
  visit(payload);
  return [...ids].sort();
}
