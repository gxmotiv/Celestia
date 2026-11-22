/**
 * NaraRouter exposes an authenticated, account-scoped OpenAI-compatible model list.
 * The public pricing page currently identifies Laguna S 2.1 as the sole $0 Free-plan
 * model. Keep this allowlist deliberately narrow: unknown models are never assumed free.
 */
export const NARAROUTER_FREE_MODEL_IDS = [
  "agnes-2.5-flash",
  "laguna-s-2.1",
  "nemotron-3.5-lightning-free",
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
        "laguna-s-2.1": "Laguna S 2.1",
        "nemotron-3.5-lightning-free": "Nemotron 3.5 Lightning Free",
      } as const)[id],
      free: true as const,
      description: "Listed on NaraRouter's public Free plan; subject to the shared daily quota and rate limit.",
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
