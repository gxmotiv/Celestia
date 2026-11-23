import assert from "node:assert/strict";
import { validateRequestedModelResponse } from "../lib/ai/modelResponseValidation";

const model = "official/free-model";
const validPayload = {
  model,
  choices: [{ message: { role: "assistant", content: "CELESTIA_OK" } }],
};

assert.deepEqual(validateRequestedModelResponse(model, validPayload), {
  valid: true,
  answer: "CELESTIA_OK",
});
console.log("PASS accepts exact requested model with assistant text");

assert.equal(
  validateRequestedModelResponse(model, { ...validPayload, model: "official/different-model" }).valid,
  false,
);
console.log("PASS rejects provider model substitution");

assert.equal(
  validateRequestedModelResponse(model, { choices: validPayload.choices }).valid,
  false,
);
console.log("PASS rejects missing returned model ID");

assert.equal(
  validateRequestedModelResponse(model, { ...validPayload, choices: [{ message: { content: "  " } }] }).valid,
  false,
);
console.log("PASS rejects empty assistant text");

assert.equal(validateRequestedModelResponse(model, null).valid, false);
console.log("PASS rejects malformed response payload");

console.log("Pollinations response identity tests: 5 assertions passed");
