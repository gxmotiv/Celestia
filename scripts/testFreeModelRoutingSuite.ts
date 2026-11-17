import assert from "node:assert/strict";
import { chooseFreeModel, type FreeModelCatalogEntry } from "../lib/ai/freemodel";

let assertions = 0;
function check(value: unknown, message: string): void {
  assert.ok(value, message);
  assertions += 1;
}

const models: FreeModelCatalogEntry[] = [
  { id: "gemma-2-2b", context_window: 8192, capabilities: ["json_mode"], pricing: { input_per_1k: 0.0001, output_per_1k: 0.0002 } },
  { id: "mimo-v2.6-flash", context_window: 1_000_000, capabilities: ["reasoning", "vision", "tools", "streaming"], pricing: { input_per_1k: 0.00004, output_per_1k: 0.00008 } },
  { id: "deepseek-v4.1-flash", context_window: 1_000_000, capabilities: ["reasoning", "vision", "tools", "streaming"], pricing: { input_per_1k: 0.000056, output_per_1k: 0.000112 } },
  { id: "claude-opus-5-5", context_window: 1_000_000, capabilities: ["reasoning", "vision", "tools", "streaming"], pricing: { input_per_1k: 0.0083, output_per_1k: 0.01661 } },
  { id: "gpt-6-astra", context_window: 1_000_000, capabilities: ["reasoning", "vision", "tools", "streaming"], pricing: { input_per_1k: 0.00895, output_per_1k: 0.01789 } },
];

check(chooseFreeModel(models, "fast").id === "mimo-v2.6-flash",
  "Fast mode selects the low-cost, fast multimodal model when it is present");
check(chooseFreeModel(models, "reasoning").id === "claude-opus-5-5",
  "Reasoning mode selects the configured high-capability flagship preference");
check(chooseFreeModel(models, "coding").id === "claude-opus-5-5",
  "Coding mode selects a model that advertises both reasoning and tool calling");
check(chooseFreeModel(models, "auto").id === "mimo-v2.6-flash",
  "Auto mode uses the efficient model for ordinary requests");
check(chooseFreeModel(models, "auto", {
  apiKey: "test", configured: true, fastModel: "", reasoningModel: "", codingModel: "", visionModel: "",
}, true).id === "mimo-v2.6-flash",
  "Image requests select a vision-capable model");
check(chooseFreeModel(models, "reasoning", {
  apiKey: "test", configured: true, fastModel: "", reasoningModel: "gpt-6-astra", codingModel: "", visionModel: "",
}).id === "gpt-6-astra",
  "The environment can pin a verified model ID for reasoning work");

let visionRejected = false;
try {
  chooseFreeModel(models.filter((model) => model.id === "gemma-2-2b"), "auto", undefined, true);
} catch (error) {
  visionRejected = error instanceof Error && error.message.includes("vision-capable");
}
check(visionRejected, "Image requests fail clearly when no vision model is present");

let invalidModelRejected = false;
try {
  chooseFreeModel(models, "fast", {
    apiKey: "test", configured: true, fastModel: "missing-model", reasoningModel: "", codingModel: "", visionModel: "",
  });
} catch (error) {
  invalidModelRejected = error instanceof Error && error.message.includes("not available");
}
check(invalidModelRejected, "Pinned model IDs are checked against the live catalogue");

console.log(`FreeModel routing suite passed: ${assertions} assertions.`);
