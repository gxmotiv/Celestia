import { NARAROUTER_FREE_MODEL_IDS, parseNaraRouterFreeModels } from "../lib/ai/nararouterCatalog";

async function main() {
  const apiKey = process.env.NARAROUTER_API_KEY?.trim();
  if (!apiKey) {
    console.log("SKIP NaraRouter live catalogue check: NARAROUTER_API_KEY is not configured as a GitHub Actions secret.");
    return;
  }

  const baseUrl = (process.env.NARAROUTER_BASE_URL?.trim() || "https://router.bynara.id/v1").replace(/\\/+$/, "");
  const response = await fetch(baseUrl + "/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`NaraRouter GET /models returned HTTP ${response.status}`);
  }

  const payload: unknown = await response.json();
  const root = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const entries = Array.isArray(root.data) ? root.data : Array.isArray(root.models) ? root.models : [];
  const ids = entries.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const id = (entry as Record<string, unknown>).id;
    return typeof id === "string" && id.trim() ? [id.trim()] : [];
  });
  const models = parseNaraRouterFreeModels(payload);
  console.log(`PASS NaraRouter authenticated GET /models: HTTP ${response.status}; ${ids.length} model IDs returned.`);
  console.log(`NaraRouter returned model IDs (names only; no credentials or prompts): ${ids.join(", ") || "(none)"}`);
  console.log(`Celestia Free-plan allowlist: ${NARAROUTER_FREE_MODEL_IDS.join(", ")}`);

  if (models.length === 0) {
    console.warn("WARN API authentication succeeded, but none of the returned IDs match Celestia's current Free-plan allowlist.");
    console.warn("Do not select a paid model to work around this. Verify the account's Free-plan eligibility and provider's current model IDs.");
  } else {
    console.log(`PASS ${models.length} allowlisted Free-plan model(s) are available: ${models.map((model) => model.id).join(", ")}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown NaraRouter live catalogue error.";
  console.error(`FAIL NaraRouter live catalogue check: ${message}`);
  process.exitCode = 1;
});
