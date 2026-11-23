import assert from "node:assert/strict";
import { parseCloudflareWorkersAIResponse } from "../lib/ai/cloudflareWorkersAICatalog";

const chat = parseCloudflareWorkersAIResponse({
  id: "chatcmpl-test",
  object: "chat.completion",
  model: "@cf/qwen/qwen3.8-27b",
  choices: [{ index: 0, message: { role: "assistant", content: "CELESTIA_CHAT_OK" }, finish_reason: "stop" }],
  usage: { prompt_tokens: 12, completion_tokens: 4, total_tokens: 16 },
});
assert.equal(chat.text, "CELESTIA_CHAT_OK");
assert.equal(chat.model, "@cf/qwen/qwen3.8-27b");
assert.equal(chat.usage?.totalTokens, 16);

const legacy = parseCloudflareWorkersAIResponse({
  response: "CELESTIA_LEGACY_OK",
  usage: { prompt_tokens: 3, completion_tokens: 2 },
});
assert.equal(legacy.text, "CELESTIA_LEGACY_OK");
assert.equal(legacy.model, undefined);
assert.equal(legacy.usage?.totalTokens, 5);

assert.throws(() => parseCloudflareWorkersAIResponse({ choices: [] }), /no assistant text/i);
assert.throws(() => parseCloudflareWorkersAIResponse(null), /malformed response/i);
assert.throws(() => parseCloudflareWorkersAIResponse({ success: false, error: "model unavailable" }), /model unavailable/i);

console.log("Cloudflare Workers AI response-shape tests passed (chat + legacy + failure cases)");
