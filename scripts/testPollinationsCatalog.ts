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
  pricing: { currency: "pollen" },
  health: { status: "healthy", success_rate: 100, requests: 20 },
};

let passed = 0;
function check(name: string, payload: unknown, expectedCount: number, options: { includeManualOnly?: boolean } = {}) {
  const actual = parsePollinationsFreeTextModels(payload, options).length;
  assert.equal(actual, expectedCount, name);
  passed += 1;
  console.log(`PASS ${name}`);
}

check("accepts official free model using legacy name field", [base], 1);
check("prefers canonical id over legacy name field", [{ ...base, id: "sample/canonical-id" }], 1);
assert.equal(parsePollinationsFreeTextModels([{ ...base, id: "sample/canonical-id" }])[0]?.id, "sample/canonical-id");
passed += 1;
console.log("PASS preserves canonical id when both id and name are present");
check("accepts wrapped OpenAI-style data array", { data: [base] }, 1);
check("accepts explicit string zero prices", [{
  ...base,
  pricing: { currency: "pollen", promptTextTokens: "0", completionTextTokens: "0" },
}], 1);
check("rejects non-zero prompt price", [{
  ...base,
  pricing: { currency: "pollen", promptTextTokens: "0.000001", completionTextTokens: "0" },
}], 0);
check("rejects non-zero completion price", [{
  ...base,
  pricing: { currency: "pollen", promptTextTokens: "0", completionTextTokens: "0.000001" },
}], 0);
check("rejects non-healthy model", [{ ...base, health: { status: "down" } }], 0);
check("rejects unknown health", [{ ...base, health: { status: "unknown" } }], 0);
check("rejects community model", [{ ...base, community: true }], 0);
check("rejects paid-only model", [{ ...base, paid_only: true }], 0);
check("rejects specialized classifier", [{ ...base, is_specialized: true }], 0);
const glyph = {
  ...base,
  name: "stealth/glyph-cluster",
  title: "Glyph Cluster",
  description: "Prompts and replies may be retained and used for training; zero data retention is unavailable.",
};
check("excludes Glyph Cluster from automatic privacy-safe models", [glyph], 0);
check("exposes Glyph Cluster only when manual privacy-risk models are requested", [glyph], 1, { includeManualOnly: true });
assert.equal(parsePollinationsFreeTextModels([glyph], { includeManualOnly: true })[0]?.privacyRisk, true);
passed += 1;
console.log("PASS marks manually exposed Glyph Cluster as privacy-risk");
const communityModel = {
  ...base,
  name: "community/morriszdweck/glm-5.3-flash-free",
  title: "GLM 5.3 Flash (free, stable!)",
  publisher: "OSAII",
  community: true,
  reasoning: true,
  tools: true,
  context_length: 1000000,
  health: { status: "healthy", success_rate: 100, requests: 50 },
};
check("excludes community models from automatic privacy-safe models", [communityModel], 0);
check("exposes zero-priced healthy community models only for manual consent", [communityModel], 1, { includeManualOnly: true });
const upstreamTrainingWarning = { ...communityModel, description: "Upstream data may be collected for training." };
assert.equal(parsePollinationsFreeTextModels([upstreamTrainingWarning], { includeManualOnly: true })[0]?.privacyRisk, true);
passed += 1;
console.log("PASS detects upstream collection-for-training warning");
const parsedCommunity = parsePollinationsFreeTextModels([communityModel], { includeManualOnly: true })[0];
assert.equal(parsedCommunity?.community, true);
assert.equal(parsedCommunity?.publisher, "OSAII");
passed += 1;
console.log("PASS preserves community publisher identity for manual selection");
check("rejects missing pricing currency", [{ ...base, pricing: {} }], 0);
check("rejects unknown future billing field", [{
  ...base,
  pricing: { currency: "pollen", futureTokenPrice: "0" },
}], 0);
check("rejects paid pricing variants", [{
  ...base,
  pricing_variants: [{ name: "premium", pricing: { currency: "pollen", completionTextTokens: "0.1" } }],
}], 0);
check("rejects paid tool/search adjustments", [{
  ...base,
  pricing_adjustments: [{ name: "search", price: "1" }],
}], 0);
check("rejects models without chat-completions support", [{
  ...base,
  supported_endpoints: ["/text"],
}], 0);
check("rejects non-text category", [{ ...base, category: "image" }], 0);
check("rejects malformed payload", { models: [base] }, 0);

console.log(`Pollinations catalogue tests: ${passed}/24 passed`);
