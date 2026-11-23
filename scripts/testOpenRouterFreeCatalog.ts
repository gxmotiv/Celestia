import assert from "node:assert/strict";
import { parseOpenRouterFreeModels, validateOpenRouterFreeResponse } from "../lib/ai/openrouterCatalog";

const models = parseOpenRouterFreeModels({
  data: [
    { id: "meta/free-model:free", name: "Free Model", architecture: { input_modalities: ["text"], output_modalities: ["text"], modality: "text->text" }, pricing: { prompt: "0", completion: "0" } },
    { id: "meta/paid-model", name: "Paid Model", pricing: { prompt: "0.000001", completion: "0.000002" } },
    { id: "meta/missing-price:free", name: "Missing Price", pricing: { prompt: "0" } },
    { id: "meta/non-zero:free", name: "Non-zero", architecture: { input_modalities: ["text"], output_modalities: ["text"] }, pricing: { prompt: "0", completion: "0.01" } },
    { id: "meta/free-image:free", name: "Free Image", architecture: { input_modalities: ["image"], output_modalities: ["image"], modality: "image->image" }, pricing: { prompt: "0", completion: "0" } },
  ],
});
assert.deepEqual(models.map((model) => model.id), ["meta/free-model:free"]);
assert.deepEqual(validateOpenRouterFreeResponse({
  model: "meta/free-model:free",
  choices: [{ message: { content: "Free route OK" } }],
}, ["meta/free-model:free"]), {
  valid: true,
  answer: "Free route OK",
  model: "meta/free-model:free",
});
assert.equal(validateOpenRouterFreeResponse({
  model: "meta/paid-model",
  choices: [{ message: { content: "must reject" } }],
}, ["meta/free-model:free"]).valid, false);
assert.equal(validateOpenRouterFreeResponse({
  model: "meta/free-model:free",
  choices: [{ message: { content: " " } }],
}, ["meta/free-model:free"]).valid, false);
assert.deepEqual(parseOpenRouterFreeModels({ data: [] }), []);
console.log("OpenRouter free catalogue tests: 5 assertions passed");
