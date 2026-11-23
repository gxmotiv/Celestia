import assert from "node:assert/strict";
import { GROQ_FREE_MODEL_IDS, GROQ_FREE_MODELS, parseGroqModelIds } from "../lib/ai/groqCatalog";
import { getCelestiaAIModel, isCelestiaAIModelId } from "../lib/ai/modelCatalog";

const ids = parseGroqModelIds({
  object: "list",
  data: [
    { id: "openai/gpt-oss-120b" },
    { id: "openai/gpt-oss-20b" },
    { id: "qwen/qwen3.8-27b" },
    { id: "some/paid-model" },
  ],
});
assert.deepEqual(ids, ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b", "some/paid-model"]);
assert.equal(GROQ_FREE_MODELS.length, 3);
assert.deepEqual(GROQ_FREE_MODEL_IDS, ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]);
assert.equal(getCelestiaAIModel("groq:openai/gpt-oss-120b")?.providerId, "groq");
assert.equal(isCelestiaAIModelId("groq:some/paid-model"), false);
assert.deepEqual(parseGroqModelIds(null), []);
console.log("Groq free-model catalogue tests: 6 assertions passed");
