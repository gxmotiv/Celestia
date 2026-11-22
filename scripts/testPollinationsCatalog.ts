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
assert.equal(parsePollinationsFreeTextModels([base])[0]?.zeroPriced, false);
passed += 1;
console.log("PASS preserves non-zero token prices and marks model as not free");

const zeroPriceModel = { ...base, pricing: { currency: "pollen" } };
check("accepts genuinely zero-priced model", [zeroPriceModel], 1);
assert.equal(parsePollinationsFreeTextModels([zeroPriceModel])[0]?.zeroPriced, true);
passed += 1;
console.log("PASS identifies currency-only catalogue pricing as zero-priced");

const nanoModel = {
  ...base,
  id: "openai/gpt-5-nano",
  title: "GPT-5 Nano",
  description: "Label messages or extract names quickly and at low cost for simple, high-volume tasks.",
  pricing: {
    currency: "pollen",
    promptTextTokens: "0.0000000375",
    promptCachedTokens: "0.00000000375",
    completionTextTokens: "0.0000003",
  },
  health: { status: "healthy", success_rate: 100, requests: 1227 },
  reasoning: true,
  tools: true,
  context_length: 400000,
};
const parsedNano = parsePollinationsFreeTextModels([nanoModel])[0];
assert.equal(parsedNano?.id, "openai/gpt-5-nano");
assert.equal(parsedNano?.zeroPriced, false);
assert.equal(parsedNano?.inputPrice, 0.0000000375);
assert.equal(parsedNano?.outputPrice, 0.0000003);
passed += 1;
console.log("PASS GPT-5 Nano is eligible for testing but correctly classified as paid, not free");

check("rejects unknown future billing field from zero-price classification but keeps available model", [{
  ...base,
  pricing: { currency: "pollen", futureTokenPrice: "0" },
}], 1);
assert.equal(parsePollinationsFreeTextModels([{
  ...base,
  pricing: { currency: "pollen", futureTokenPrice: "0" },
}])[0]?.zeroPriced, false);
passed += 1;
console.log("PASS unknown pricing dimensions fail closed for free classification");

check("rejects non-zero pricing variant from free classification but keeps model available", [{
  ...base,
  pricing: { currency: "pollen" },
  pricing_variants: [{ name: "long_context", pricing: { currency: "pollen", promptTextTokens: "0.0000003" } }],
}], 1);
assert.equal(parsePollinationsFreeTextModels([{
  ...base,
  pricing: { currency: "pollen" },
  pricing_variants: [{ name: "long_context", pricing: { currency: "pollen", promptTextTokens: "0.0000003" } }],
}])[0]?.zeroPriced, false);
passed += 1;
console.log("PASS non-zero pricing variants prevent free classification");

check("rejects non-zero pricing adjustment from free classification but keeps model available", [{
  ...base,
  pricing: { currency: "pollen" },
  pricing_adjustments: [{ name: "search", price: "1", currency: "pollen" }],
}], 1);
assert.equal(parsePollinationsFreeTextModels([{
  ...base,
  pricing: { currency: "pollen" },
  pricing_adjustments: [{ name: "search", price: "1", currency: "pollen" }],
}])[0]?.zeroPriced, false);
passed += 1;
console.log("PASS non-zero pricing adjustments prevent free classification");

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
console.log(`Pollinations catalogue tests: ${passed}/30 passed`);
