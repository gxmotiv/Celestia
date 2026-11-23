import assert from "node:assert/strict";
import { parseFreeModelChatCatalog } from "../lib/ai/freemodelCatalog";

const parsed = parseFreeModelChatCatalog({
  object: "list",
  data: [
    { id: "deepseek-v4.1-flash", name: "DeepSeek V4.1 Flash", type: "chat", context_window: 1000000, capabilities: ["reasoning", "tools"] },
    { id: "glm-5.3-flash", name: "GLM 5.3 Flash", type: "chat", capabilities: ["reasoning"] },
    { id: "image-generator", name: "Image Generator", type: "image" },
    { name: "Missing ID", type: "chat" },
    null,
  ],
});

assert.deepEqual(parsed.map((model) => model.id), ["deepseek-v4.1-flash", "glm-5.3-flash"]);
assert.equal(parsed[0].contextWindow, 1000000);
assert.deepEqual(parsed[0].capabilities, ["reasoning", "tools"]);
assert.deepEqual(parseFreeModelChatCatalog({ data: "bad" }), []);
console.log("FreeModel catalogue tests: 4 assertions passed");
