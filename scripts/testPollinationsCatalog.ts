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
function check(name: string, payload: unknown, expectedCount: number) {
  const actual = parsePollinationsFreeTextModels(payload).length;
  assert.equal(actual, expectedCount, name);
  passed += 1;
  console.log(`PASS ${name}`);
}

check("accepts official free model using Pollinations name field", [base], 1);
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
check("rejects model with explicit prompt-retention/training warning", [{
  ...base,
  description: "Prompts and replies may be retained and used for training.",
}], 0);
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

console.log(`Pollinations catalogue tests: ${passed}/18 passed`);
