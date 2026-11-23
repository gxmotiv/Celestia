import assert from "node:assert/strict";
import { toSafeAIProviderError } from "../lib/ai/providerErrors";
import { getVerifiedDashaInputs, hasExternalChartDataConsent } from "../lib/ai/oracleDataGuards";

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
const cloudflareGuard = toSafeAIProviderError(new Error("Cloudflare Workers AI is disabled until CLOUDFLARE_WORKERS_AI_FREE_PLAN_CONFIRMED=true"), "cloudflare-workers-ai");
const cloudflareQuota = toSafeAIProviderError(Object.assign(new Error("Cloudflare Workers AI daily neuron quota exhausted"), { status: 429 }), "cloudflare-workers-ai");
assert.equal(missing.status, 503);
assert.equal(missing.body.code, "PROVIDER_NOT_CONFIGURED");
assert.equal(freeModelGuard.status, 503);
assert.equal(freeModelGuard.body.code, "PROVIDER_NOT_CONFIGURED");
assert.equal(cloudflareGuard.status, 503);
assert.equal(cloudflareGuard.body.code, "PROVIDER_NOT_CONFIGURED");
assert.equal(cloudflareQuota.status, 429);
assert.equal(cloudflareQuota.body.code, "PROVIDER_RATE_LIMITED");

assert.equal(hasExternalChartDataConsent(true), true);
assert.equal(hasExternalChartDataConsent(false), false);
assert.equal(hasExternalChartDataConsent("true"), false);

const missingDate = getVerifiedDashaInputs({
  birthDate: "", birthTime: "16:49", ascendantSign: "Aries", moonLongitude: 11.4, nakshatraIndex: 1, timezoneOffsetHours: 5.5,
});
const invalidDate = getVerifiedDashaInputs({
  birthDate: "2008-02-30", birthTime: "16:49", ascendantSign: "Aries", moonLongitude: 11.4, nakshatraIndex: 1, timezoneOffsetHours: 5.5,
});
const invalidTime = getVerifiedDashaInputs({
  birthDate: "2008-11-05", birthTime: "25:49", ascendantSign: "Aries", moonLongitude: 11.4, nakshatraIndex: 1, timezoneOffsetHours: 5.5,
});
const missingMoon = getVerifiedDashaInputs({
  birthDate: "2008-11-05", birthTime: "16:49", ascendantSign: "Aries", moonLongitude: undefined, nakshatraIndex: 1, timezoneOffsetHours: 5.5,
});
const outOfRangeMoon = getVerifiedDashaInputs({
  birthDate: "2008-11-05", birthTime: "16:49", ascendantSign: "Aries", moonLongitude: 360, nakshatraIndex: 1, timezoneOffsetHours: 5.5,
});
assert.equal(missingDate, null);
assert.equal(invalidDate, null);
assert.equal(invalidTime, null);
assert.equal(missingMoon, null);
assert.equal(outOfRangeMoon, null);

const zeroLongitude = getVerifiedDashaInputs({
  birthDate: "2008-11-05", birthTime: "16:49", ascendantSign: "Aries", moonLongitude: 0, nakshatraIndex: 0, timezoneOffsetHours: 5.5,
});
assert.ok(zeroLongitude);
assert.equal(zeroLongitude.moonLongitude, 0, "zero degrees is valid and must not trigger a fallback");
assert.equal(zeroLongitude.moonNakshatra1Indexed, 1);
assert.equal(zeroLongitude.birthDate.toISOString(), "2008-11-05T11:19:00.000Z");
const missingTimezone = getVerifiedDashaInputs({
  birthDate: "2008-11-05", birthTime: "16:49", ascendantSign: "Aries", moonLongitude: 0, nakshatraIndex: 0,
  timezoneOffsetHours: undefined,
});
const invalidTimezone = getVerifiedDashaInputs({
  birthDate: "2008-11-05", birthTime: "16:49", ascendantSign: "Aries", moonLongitude: 0, nakshatraIndex: 0,
  timezoneOffsetHours: 15,
});
assert.equal(missingTimezone, null);
assert.equal(invalidTimezone, null);

console.log("AI provider and Oracle data-guard tests passed");
