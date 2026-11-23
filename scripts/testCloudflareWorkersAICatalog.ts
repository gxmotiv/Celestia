import assert from "node:assert/strict";
import {
  CLOUDFLARE_WORKERS_AI_FREE_MODELS,
  getCloudflareWorkersAIModel,
  parseCloudflareWorkersAIResponse,
} from "../lib/ai/cloudflareWorkersAICatalog";

assert.equal(CLOUDFLARE_WORKERS_AI_FREE_MODELS.length, 2);
assert.equal(getCloudflareWorkersAIModel("@cf/openai/gpt-oss-20b")?.zeroDataRetention, true);
assert.equal(getCloudflareWorkersAIModel("@cf/qwen/qwen3.8-27b")?.contextWindow, 262144);
assert.equal(getCloudflareWorkersAIModel("@cf/zai-org/glm-5.3-flash"), undefined);
assert.deepEqual(parseCloudflareWorkersAIResponse({
  response: "Workers AI response",
  usage: { prompt_tokens: 12, completion_tokens: 8, total_tokens: 20 },
}), {
  text: "Workers AI response",
  usage: { promptTokens: 12, completionTokens: 8, totalTokens: 20 },
});
assert.throws(() => parseCloudflareWorkersAIResponse({ response: " " }), /no assistant text/i);
assert.throws(() => parseCloudflareWorkersAIResponse(null), /malformed response/i);
console.log("Cloudflare Workers AI catalogue/response tests: 7 assertions passed");
