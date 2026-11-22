import assert from "node:assert/strict";
import { NARAROUTER_FREE_MODEL_IDS, parseNaraRouterFreeModels } from "../lib/ai/nararouterCatalog";
import { getCelestiaAIModel, isCelestiaAIModelId } from "../lib/ai/modelCatalog";

const available = parseNaraRouterFreeModels({
  object: "list",
  data: [
    { id: "agnes-2.5-flash", object: "model", owned_by: "bynara" },
    { id: "laguna-s-2.1", object: "model", owned_by: "bynara" },
    { id: "nemotron-3.5-lightning-free", object: "model", owned_by: "nvidia" },
    { id: "deepseek-v4-flash", object: "model", owned_by: "deepseek" },
    { id: "claude-haiku-5.5", object: "model", owned_by: "anthropic" },
  ],
});
assert.deepEqual(available.map((model) => model.id), ["agnes-2.5-flash", "laguna-s-2.1", "nemotron-3.5-lightning-free"]);
assert.equal(available[0].free, true);
assert.match(available[0].description, /daily quota/i);
console.log("PASS only the provider-published Free-plan model is selectable");

assert.deepEqual(parseNaraRouterFreeModels({ data: [{ id: "deepseek-v4-flash" }, { id: "claude-haiku-5.5" }] }), []);
console.log("PASS paid models are excluded even when the key can access them");

assert.deepEqual(parseNaraRouterFreeModels({ models: [{ id: "agnes-2.5-flash" }, { id: "laguna-s-2.1" }, { id: "nemotron-3.5-lightning-free" }] }).map((model) => model.id), ["agnes-2.5-flash", "laguna-s-2.1", "nemotron-3.5-lightning-free"]);
console.log("PASS alternate models-array response shape");

assert.deepEqual(parseNaraRouterFreeModels({ data: [{ name: "laguna-s-2.1" }] }), []);
console.log("PASS malformed model entries are rejected");

assert.deepEqual(parseNaraRouterFreeModels(null), []);
assert.deepEqual(parseNaraRouterFreeModels({ data: "not-an-array" }), []);
console.log("PASS malformed catalogues fail closed");

assert.deepEqual(NARAROUTER_FREE_MODEL_IDS, ["agnes-2.5-flash", "laguna-s-2.1", "nemotron-3.5-lightning-free"]);
console.log("PASS free-model allowlist is explicit and minimal");

assert.equal(getCelestiaAIModel("nararouter:laguna-s-2.1")?.providerId, "nararouter");
assert.equal(getCelestiaAIModel("nararouter:agnes-2.5-flash")?.providerModelId, "agnes-2.5-flash");
assert.equal(isCelestiaAIModelId("nararouter:laguna-s-2.1"), true);
console.log("PASS NaraRouter dynamic aliases are parsed for server-side revalidation");
console.log("NaraRouter catalogue tests: 9 assertions passed");
