import assert from "node:assert/strict";
import { parsePollinationsFreeTextModels } from "../lib/ai/pollinationsCatalog";

const base = {
  name: "sample/free-chat",
  title: "Sample Free Chat",
  description: "A general-purpose text assistant.",
  category: "text",
  community: false,
  paid_only: false,
  is_specialized: false,
  input_modalities: ["text"],
  output_modalities: ["text"],
  supported_endpoints: ["/v1/chat/completions"],
  pricing: { currency: "pollen", promptTextTokens: "0.00000015", completionTextTokens: "0.0000009" },
  health: { status: "healthy", success_rate: 99.9, requests: 100 },
};

let passed = 0;
function check(name: string, payload: unknown, expectedCount: number, options: { includeManualOnly?: boolean } = {}) {
  const actual = parsePollinationsFreeTextModels(payload, options).length;
  assert.equal(actual, expectedCount, name);
  passed += 1;
  console.log(`PASS ${name}`);
}

check("accepts available official model with non-zero Pollen pricing", [base], 1);
assert.equal(parsePollinationsFreeTextModels([base])[0]?.inputPrice, 0.00000015);
assert.equal(parsePollinationsFreeTextModels([base])[0]?.outputPrice, 0.0000009);
passed += 1;
console.log("PASS preserves non-zero per-token Pollen prices");
check("accepts genuinely zero-priced model", [{ ...base, pricing: { currency: "pollen" } }], 1);
check("prefers canonical id over legacy name field", [{ ...base, id: "sample/canonical-id" }], 1);
assert.equal(parsePollinationsFreeTextModels([{ ...base, id: "sample/canonical-id" }])[0]?.id, "sample/canonical-id");
passed += 1;
console.log("PASS preserves canonical model ID");
check("accepts wrapped data array", { data: [base] }, 1);
check("rejects paid-only model", [{ ...base, paid_only: true }], 0);
check("rejects unhealthy model", [{ ...base, health: { status: "down" } }], 0);
check("rejects degraded model", [{ ...base, health: { status: "degraded" } }], 0);
check("rejects unknown health", [{ ...base, health: { status: "unknown" } }], 0);
check("rejects community model from automatic list", [{ ...base, community: true }], 0);
check("includes community model only in manual list", [{ ...base, community: true }], 1, { includeManualOnly: true });
check("rejects specialized classifier", [{ ...base, is_specialized: true }], 0);
const privacyRisk = { ...base, description: "Prompts may be retained and used for training." };
check("excludes retention-warning model from automatic list", [privacyRisk], 0);
check("includes retention-warning model only for manual choice", [privacyRisk], 1, { includeManualOnly: true });
check("rejects missing chat-completions support", [{ ...base, supported_endpoints: ["/text"] }], 0);
check("rejects non-text category", [{ ...base, category: "image" }], 0);
check("rejects missing text input", [{ ...base, input_modalities: ["image"] }], 0);
check("rejects missing text output", [{ ...base, output_modalities: ["image"] }], 0);
check("accepts optional paid search adjustment (not used by plain chat calls)", [{
  ...base,
  pricing_adjustments: [{ name: "web search", price: "14", currency: "pollen" }],
}], 1);
check("accepts long-context price variant while preserving base price", [{
  ...base,
  pricing_variants: [{ name: "long_context", pricing: { currency: "pollen", promptTextTokens: "0.0000003" } }],
}], 1);
check("rejects malformed payload", { models: [base] }, 0);
console.log(`Pollinations catalogue tests: ${passed}/21 passed`);
