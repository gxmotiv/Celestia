import assert from "node:assert/strict";
import { toSafeAIProviderError } from "../lib/ai/providerErrors";

const quota = toSafeAIProviderError(Object.assign(new Error("FreeModel HTTP 402"), { status: 402 }), "freemodel");
assert.equal(quota.status, 402);
assert.equal(quota.body.code, "FREE_ALLOWANCE_EXHAUSTED");
assert.match(quota.body.error, /do not add credits/i);

const rate = toSafeAIProviderError(Object.assign(new Error("HTTP 429"), { status: 429 }), "groq");
assert.equal(rate.status, 429);
assert.equal(rate.body.code, "PROVIDER_RATE_LIMITED");

const auth = toSafeAIProviderError(Object.assign(new Error("HTTP 401"), { status: 401 }), "openrouter");
assert.equal(auth.status, 503);
assert.equal(auth.body.code, "PROVIDER_AUTH_FAILED");

const missing = toSafeAIProviderError(new Error("Groq is disabled until GROQ_FREE_PLAN_CONFIRMED=true"), "groq");
const freeModelGuard = toSafeAIProviderError(new Error("FreeModel is disabled until FREEMODEL_FREE_PLAN_CONFIRMED=true"), "freemodel");
assert.equal(missing.status, 503);
assert.equal(missing.body.code, "PROVIDER_NOT_CONFIGURED");
assert.equal(freeModelGuard.status, 503);
assert.equal(freeModelGuard.body.code, "PROVIDER_NOT_CONFIGURED");

console.log("AI provider error tests: 11 assertions passed");
