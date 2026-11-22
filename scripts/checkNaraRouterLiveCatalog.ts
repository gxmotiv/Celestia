import { NARAROUTER_FREE_MODEL_IDS, parseNaraRouterFreeModels } from "../lib/ai/nararouterCatalog";

async function main() {
  const apiKey = process.env.NARAROUTER_API_KEY?.trim();
  if (!apiKey) {
    console.log("SKIP NaraRouter live catalogue check: NARAROUTER_API_KEY is not configured as a GitHub Actions secret.");
    return;
  }

  const baseUrl = (process.env.NARAROUTER_BASE_URL?.trim() || "https://router.bynara.id/v1").replace(/\/+$/, "");
  const response = await fetch(baseUrl + "/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(`NaraRouter GET /models returned HTTP ${response.status}`);
  }

  const payload: unknown = await response.json();
  // NaraRouter documents MCP list_models as a free read that returns the
  // models this API key can use. Compare it with /v1/models without generating.
  const mcpResponse = await fetch("https://router.bynara.id/mcp", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "list_models", arguments: {} },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!mcpResponse.ok) {
    console.warn(`WARN NaraRouter MCP list_models returned HTTP ${mcpResponse.status}; /v1/models remains the only checked catalogue.`);
  } else {
    const mcpPayload: unknown = await mcpResponse.json();
    const serializedMcp = JSON.stringify(mcpPayload);
    const mcpIds = [...serializedMcp.matchAll(/"id"\\s*:\\s*"([^"]+)"/g)].map((match) => match[1]);
    console.log(`NaraRouter MCP list_models read-only response: HTTP ${mcpResponse.status}; ${mcpIds.length} model IDs parsed: ${mcpIds.join(", ") || "(none or non-JSON content)"}`);
  }

  const plansResponse = await fetch("https://router.bynara.id/api/plans", {
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!plansResponse.ok) {
    console.warn(`WARN NaraRouter public /api/plans returned HTTP ${plansResponse.status}; retaining the strict existing allowlist.`);
  } else {
    const plansPayload: unknown = await plansResponse.json();
    const serializedPlans = JSON.stringify(plansPayload);
    console.log(`NaraRouter public /api/plans top-level shape: ${plansPayload && typeof plansPayload === "object" ? Object.keys(plansPayload as Record<string, unknown>).join(", ") : typeof plansPayload}`);
    console.log(`NaraRouter public plan metadata (read-only): ${serializedPlans.slice(0, 8000)}`);
  }
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
    console.warn("Do not select a paid model to work around this. NaraRouter says Free-model access requires Telegram linking; verify Telegram is linked and the Free plan is active in the dashboard. PAYG/Overages can expose paid models in /v1/models.");
  } else {
    console.log(`PASS ${models.length} allowlisted Free-plan model(s) are available: ${models.map((model) => model.id).join(", ")}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown NaraRouter live catalogue error.";
  console.error(`FAIL NaraRouter live catalogue check: ${message}`);
  process.exitCode = 1;
});
