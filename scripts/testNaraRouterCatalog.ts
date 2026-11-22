import assert from "node:assert/strict";
import { NARAROUTER_FREE_MODEL_IDS, parseNaraRouterFreeModels } from "../lib/ai/nararouterCatalog";

const available = parseNaraRouterFreeModels({
  object: "list",
  data: [
    { id: "laguna-s-2.1", object: "model", owned_by: "bynara" },
    { id: "deepseek-v4-flash", object: "model", owned_by: "deepseek" },
    { id: "claude-haiku-5.5", object: "model", owned_by: "anthropic" },
  ],
});
assert.deepEqual(available.map((model) => model.id), ["laguna-s-2.1"]);
assert.equal(available[0].free, true);
assert.match(available[0].description, /daily quota/i);
console.log("PASS only the provider-published Free-plan model is selectable");

assert.deepEqual(parseNaraRouterFreeModels({ data: [{ id: "deepseek-v4-flash" }] }), []);
console.log("PASS paid models are excluded even when the key can access them");

assert.deepEqual(parseNaraRouterFreeModels({ models: [{ id: "laguna-s-2.1" }] }).map((model) => model.id), ["laguna-s-2.1"]);
console.log("PASS alternate models-array response shape");

assert.deepEqual(parseNaraRouterFreeModels({ data: [{ name: "laguna-s-2.1" }] }), []);
console.log("PASS malformed model entries are rejected");

assert.deepEqual(parseNaraRouterFreeModels(null), []);
assert.deepEqual(parseNaraRouterFreeModels({ data: "not-an-array" }), []);
console.log("PASS malformed catalogues fail closed");

assert.deepEqual(NARAROUTER_FREE_MODEL_IDS, ["laguna-s-2.1"]);
console.log("PASS free-model allowlist is explicit and minimal");
console.log("NaraRouter catalogue tests: 6 assertions passed");
