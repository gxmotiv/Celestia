import assert from "node:assert/strict";
import { NARAROUTER_FREE_MODEL_IDS, parseNaraRouterFreeModels } from "../lib/ai/nararouterCatalog";
import { getCelestiaAIModel, isCelestiaAIModelId } from "../lib/ai/modelCatalog";

const available = parseNaraRouterFreeModels({
  object: "list",
  data: [
    { id: "agnes-2.5-flash", object: "model", owned_by: "bynara" },
    { id: "deepseek-v4-flash", object: "model", owned_by: "deepseek" },
    { id: "claude-haiku-5.5", object: "model", owned_by: "anthropic" },
  ],
});
assert.deepEqual(available.map((model) => model.id), ["agnes-2.5-flash"]);
assert.equal(available[0].free, true);
assert.match(available[0].description, /Free plan/i);
console.log("PASS only current provider-published Free-plan models are selectable");

assert.deepEqual(parseNaraRouterFreeModels({ data: [{ id: "deepseek-v4-flash" }, { id: "claude-haiku-5.5" }] }), []);
console.log("PASS paid models are excluded even when the key can access them");

assert.deepEqual(
  parseNaraRouterFreeModels({ models: [{ id: "agnes-2.5-flash" }, { id: "laguna-s-2.1" }, { id: "nemotron-3.5-lightning-free" }] }).map((model) => model.id),
  ["agnes-2.5-flash"],
);
console.log("PASS alternate models-array response shape and stale alias rejection");

assert.deepEqual(parseNaraRouterFreeModels({ data: [{ name: "agnes-2.5-flash" }] }), []);
console.log("PASS malformed model entries are rejected");

assert.deepEqual(parseNaraRouterFreeModels(null), []);
assert.deepEqual(parseNaraRouterFreeModels({ data: "not-an-array" }), []);
console.log("PASS malformed catalogues fail closed");

assert.deepEqual(NARAROUTER_FREE_MODEL_IDS, ["agnes-2.5-flash"]);
console.log("PASS current Free-plan allowlist is explicit and minimal");

assert.equal(getCelestiaAIModel("nararouter:agnes-2.5-flash")?.providerModelId, "agnes-2.5-flash");
assert.equal(isCelestiaAIModelId("nararouter:agnes-2.5-flash"), true);
assert.equal(parseNaraRouterFreeModels({ data: [{ id: "laguna-s-2.1" }, { id: "nemotron-3.5-lightning-free" }] }).length, 0);
console.log("PASS dynamic alias routing and older/unconfirmed aliases remain blocked");

console.log("NaraRouter catalogue tests: 12 assertions passed");
