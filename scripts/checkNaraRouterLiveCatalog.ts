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
    // MCP servers may return JSON or Server-Sent Events even when the
    // Accept header includes application/json. Read text first, then parse
    // JSON bodies and each SSE data frame without ever logging raw payloads.
    const mcpText = await mcpResponse.text();
    const parsedFrames: unknown[] = [];
    const parseFrame = (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed || trimmed === "[DONE]") return;
      try { parsedFrames.push(JSON.parse(trimmed) as unknown); } catch { /* ignore non-JSON SSE frames */ }
    };
    try {
      parseFrame(mcpText);
    } catch { /* handled by parseFrame */ }
    if (parsedFrames.length === 0) {
      for (const line of mcpText.split(/\r?\n/)) {
        if (line.startsWith("data:")) parseFrame(line.slice(5));
      }
    }

    const mcpIds = new Set<string>();
    const visit = (value: unknown, depth = 0): void => {
      if (depth > 12 || value === null || typeof value !== "object") return;
      if (Array.isArray(value)) {
        for (const item of value) visit(item, depth + 1);
        return;
      }
      const record = value as Record<string, unknown>;
      if (typeof record.id === "string" && record.id.trim()) mcpIds.add(record.id.trim());
      for (const child of Object.values(record)) {
        if (typeof child === "string" && child.trim().startsWith("{")) {
          parseFrame(child);
        } else if (child && typeof child === "object") {
          visit(child, depth + 1);
        }
      }
    };
    for (const frame of parsedFrames) visit(frame);
    console.log(`NaraRouter MCP list_models read-only response: HTTP ${mcpResponse.status}; ${mcpIds.size} model IDs parsed: ${[...mcpIds].join(", ") || "(none returned)"}`);
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
    console.warn("If the account's Free plan is active and Telegram is linked, contact NaraRouter support: the public Free plan lists Agnes 2.5 Flash, but this key's /v1/models response exposes a broader catalogue. Do not select a paid model to work around this.");
  } else {
    console.log(`PASS ${models.length} allowlisted Free-plan model(s) are available: ${models.map((model) => model.id).join(", ")}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown NaraRouter live catalogue error.";
  console.error(`FAIL NaraRouter live catalogue check: ${message}`);
  process.exitCode = 1;
});
