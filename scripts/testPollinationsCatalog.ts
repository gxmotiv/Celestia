import assert from "node:assert/strict";
import { parsePollinationsAvailableTextModels } from "../lib/ai/pollinationsCatalog";

const base = {
  id: "sample/free-chat",
  title: "Sample Free Chat",
  description: "A general-purpose text assistant.",
  category: "text",
  community: false,
  paid_only: false,
  is_specialized: false,
  input_modalities: ["text"],
  output_modalities: ["text"],
  supported_endpoints: ["/v1/chat/completions"],
  pricing: {
    currency: "pollen",
    promptTextTokens: "0",
    completionTextTokens: "0",
  },
  health: { status: "healthy", success_rate: 99.9, requests: 100 },
};

let passed = 0;
function check(name: string, payload: unknown, expectedCount: number, options: { includeManualOnly?: boolean } = {}) {
  const actual = parsePollinationsAvailableTextModels(payload, options).length;
  assert.equal(actual, expectedCount, name);
  passed += 1;
  console.log(`PASS ${name}`);
}
function parsed(entry: unknown) {
  return parsePollinationsAvailableTextModels([entry])[0];
}

check("accepts available official model", [base], 1);
assert.equal(parsed(base)?.zeroPriced, true);
assert.equal(parsed(base)?.pricingStatus, "free_verified");
passed += 1;
console.log("PASS complete explicit zero rates are verified free");

const currencyOnly = { ...base, pricing: { currency: "pollen" } };
check("keeps currency-only pricing available but unknown-cost", [currencyOnly], 1);
assert.equal(parsed(currencyOnly)?.zeroPriced, false);
assert.equal(parsed(currencyOnly)?.pricingStatus, "unknown");
passed += 1;
console.log("PASS currency-only pricing is never treated as free");

const missingOutput = { ...base, pricing: { currency: "pollen", promptTextTokens: "0" } };
assert.equal(parsed(missingOutput)?.zeroPriced, false);
assert.equal(parsed(missingOutput)?.pricingStatus, "unknown");
passed += 1;
console.log("PASS missing output rate is unknown");

const paid = { ...base, pricing: { currency: "pollen", promptTextTokens: "0", completionTextTokens: "0.0000003" } };
assert.equal(parsed(paid)?.zeroPriced, false);
assert.equal(parsed(paid)?.pricingStatus, "paid");
passed += 1;
console.log("PASS any nonzero text rate is paid");

const nanoModel = {
  ...base,
  id: "openai/gpt-5-nano",
  title: "GPT-5 Nano",
  description: "Small text model.",
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
assert.equal(parsed(nanoModel)?.id, "openai/gpt-5-nano");
assert.equal(parsed(nanoModel)?.zeroPriced, false);
assert.equal(parsed(nanoModel)?.pricingStatus, "paid");
assert.equal(parsed(nanoModel)?.inputPrice, 0.0000000375);
assert.equal(parsed(nanoModel)?.outputPrice, 0.0000003);
passed += 1;
console.log("PASS GPT-5 Nano is discoverable but not falsely labelled free");

const unknownField = { ...base, pricing: { ...base.pricing, futureTokenPrice: "0" } };
assert.equal(parsed(unknownField)?.zeroPriced, false);
passed += 1;
console.log("PASS unknown future billing dimensions fail closed");

const nonzeroVariant = { ...base, pricing_variants: [{ name: "long_context", pricing: {
  currency: "pollen", promptTextTokens: "0", completionTextTokens: "0.0000003",
} }] };
assert.equal(parsed(nonzeroVariant)?.zeroPriced, false);
passed += 1;
console.log("PASS nonzero pricing variants prevent free classification");

const nonzeroAdjustment = { ...base, pricing_adjustments: [{ name: "search", price: "1", currency: "pollen" }] };
assert.equal(parsed(nonzeroAdjustment)?.zeroPriced, false);
passed += 1;
console.log("PASS nonzero pricing adjustments prevent free classification");

check("accepts wrapped data array", { data: [base] }, 1);
check("excludes agent models", [{ ...base, agent: true, base_model: "openai/gpt-5-nano" }], 0);
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
check("rejects malformed payload", { models: [base] }, 0);

console.log(`Pollinations catalogue tests: ${passed} assertions passed`);
