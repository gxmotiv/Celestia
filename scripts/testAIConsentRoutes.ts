import assert from "node:assert/strict";
import type { NextRequest } from "next/server";
import { POST as masterOraclePost } from "../app/api/astrology/master-oracle/route";
import { POST as blueprintPost } from "../app/api/astrology/ai-reading/route";

function mockRequest(payload: unknown): NextRequest {
  return {
    json: async () => payload,
  } as unknown as NextRequest;
}

async function assertConsentRequired(
  routeName: string,
  post: (request: NextRequest) => Promise<Response>,
) {
  for (const payload of [{}, { externalDataConsent: false }, { externalDataConsent: "true" }]) {
    const response = await post(mockRequest(payload));
    assert.equal(response.status, 400, `${routeName} must reject missing/non-boolean consent`);
    const body = await response.json() as { error?: string };
    assert.match(body.error ?? "", /explicit consent is required/i);
  }
}

async function main() {
  await assertConsentRequired("Master Oracle", masterOraclePost);
  await assertConsentRequired("Blueprint", blueprintPost);
  console.log("AI route consent-gate tests: 6 assertions passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
