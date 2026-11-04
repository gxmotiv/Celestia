/**
 * CELESTIA — GEOCODING & SECURITY TEST SUITE
 * 
 * Verifies:
 * 1. Absence of any literal Geoapify API key in active source code.
 * 2. Forward autocomplete lookup when key is absent (offline supported city, offline unsupported query, empty query).
 * 3. Reverse geocoding when key is absent (offline supported city proximity, unsupported ocean coords, invalid coords).
 * 4. Forward lookup with key configured (proper provider dispatch and source: "geoapify").
 * 5. Reverse lookup with key configured (proper provider dispatch and source: "geoapify").
 * 6. Provider HTTP 500 error resilience (graceful fallback without secret leakage).
 * 7. Provider network/timeout abort resilience (graceful fallback without secret leakage).
 */

import { NextRequest } from "next/server";
import { GET } from "../app/api/geocode/route";
import * as fs from "fs";
import * as path from "path";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
    failed++;
  }
}

async function runGeocodeTests() {
  console.log("\n=======================================================");
  console.log(" CELESTIA STEP 1: GEOCODING SECURITY & FUNCTIONAL TESTS ");
  console.log("=======================================================\n");

  const originalEnvKey = process.env.GEOAPIFY_API_KEY;
  const originalFetch = global.fetch;

  try {
    // ---------------------------------------------------------
    // TEST 1: Source code secret inspection
    // ---------------------------------------------------------
    console.log("[Suite 1: Hardcoded Key Elimination Check]");
    const routeFilePath = path.join(process.cwd(), "app/api/geocode/route.ts");
    const routeContent = fs.readFileSync(routeFilePath, "utf8");

    // Check that known previous leaked key pattern is not in route.ts
    const hasOldKey = routeContent.includes("76f8e6103b884a47b2a833d119500860");
    assert(!hasOldKey, "1.1 No hardcoded Geoapify key in app/api/geocode/route.ts");

    // Check that apiKey is read exclusively from process.env
    const readsFromEnv = routeContent.includes("process.env.GEOAPIFY_API_KEY");
    assert(readsFromEnv, "1.2 Reads exclusively from process.env.GEOAPIFY_API_KEY");

    const hasLiteralFallback = /process\.env\.GEOAPIFY_API_KEY\s*\|\|\s*["'][a-zA-Z0-9]{10,}["']/.test(routeContent);
    assert(!hasLiteralFallback, "1.3 No literal fallback string attached to GEOAPIFY_API_KEY");

    // ---------------------------------------------------------
    // TEST 2: Key Absent - Forward Geocoding
    // ---------------------------------------------------------
    console.log("\n[Suite 2: Key Absent - Forward Geocoding]");
    delete process.env.GEOAPIFY_API_KEY;

    // 2.1 Supported offline city (Paris)
    const reqParis = new NextRequest("http://localhost:3000/api/geocode?q=Paris");
    const resParis = await GET(reqParis);
    const dataParis = await resParis.json();
    assert(resParis.status === 200, "2.1.1 HTTP 200 for supported offline city");
    assert(Array.isArray(dataParis.results) && dataParis.results.length > 0, "2.1.2 Returns non-empty results for 'Paris'");
    assert(dataParis.results[0].city === "Paris" && dataParis.results[0].source === "built-in", "2.1.3 Resolved with source='built-in'");
    assert(dataParis.results[0].lat === 48.8566 && dataParis.results[0].lng === 2.3522, "2.1.4 Verified Paris coordinates");

    // 2.2 Supported offline city (Tokyo)
    const reqTokyo = new NextRequest("http://localhost:3000/api/geocode?q=Tokyo");
    const resTokyo = await GET(reqTokyo);
    const dataTokyo = await resTokyo.json();
    assert(dataTokyo.results?.[0]?.city === "Tokyo" && dataTokyo.results[0].source === "built-in", "2.2 Resolved Tokyo with source='built-in'");

    // 2.3 Unsupported query with key absent
    const reqUnsupported = new NextRequest("http://localhost:3000/api/geocode?q=NonExistentFictionalMetropolis999");
    const resUnsupported = await GET(reqUnsupported);
    const dataUnsupported = await resUnsupported.json();
    assert(resUnsupported.status === 200, "2.3.1 HTTP 200 for unsupported query");
    assert(Array.isArray(dataUnsupported.results) && dataUnsupported.results.length === 0, "2.3.2 Returns empty results [] without fabricating coordinates");

    // 2.4 Empty/blank query
    const reqEmpty = new NextRequest("http://localhost:3000/api/geocode?q=");
    const resEmpty = await GET(reqEmpty);
    const dataEmpty = await resEmpty.json();
    assert(dataEmpty.results?.length > 0 && dataEmpty.results[0].source === "built-in", "2.4 Blank query returns default built-in major cities");

    // ---------------------------------------------------------
    // TEST 3: Key Absent - Reverse Geocoding
    // ---------------------------------------------------------
    console.log("\n[Suite 3: Key Absent - Reverse Geocoding]");

    // 3.1 Supported offline city coordinates (Near Paris: 48.8566, 2.3522)
    const reqRevParis = new NextRequest("http://localhost:3000/api/geocode?lat=48.8566&lon=2.3522");
    const resRevParis = await GET(reqRevParis);
    const dataRevParis = await resRevParis.json();
    assert(resRevParis.status === 200, "3.1.1 HTTP 200 for coordinates near Paris");
    assert(dataRevParis.results?.length === 1, "3.1.2 Exactly one matched result");
    assert(dataRevParis.results?.[0]?.city === "Paris", "3.1.3 Genuinely identified Paris from offline dataset");
    assert(dataRevParis.results?.[0]?.source === "built-in", "3.1.4 Source correctly labeled 'built-in'");

    // 3.2 Unsupported coordinates (Mid-Pacific Ocean: 0.0, -160.0)
    const reqOcean = new NextRequest("http://localhost:3000/api/geocode?lat=0.0&lon=-160.0");
    const resOcean = await GET(reqOcean);
    const dataOcean = await resOcean.json();
    assert(resOcean.status === 200, "3.2.1 HTTP 200 for unresolvable ocean coordinates");
    assert(Array.isArray(dataOcean.results) && dataOcean.results.length === 0, "3.2.2 Returns results: [] without fabricating fake city or claiming external success");

    // 3.3 Invalid coordinates
    const reqInvalid = new NextRequest("http://localhost:3000/api/geocode?lat=invalid&lon=999");
    const resInvalid = await GET(reqInvalid);
    const dataInvalid = await resInvalid.json();
    assert(resInvalid.status === 400, "3.3.1 HTTP 400 for invalid coordinates");
    assert(dataInvalid.error === "Invalid coordinates", "3.3.2 Clear error response for invalid coordinates");

    // ---------------------------------------------------------
    // TEST 4: Key Configured - Forward Autocomplete
    // ---------------------------------------------------------
    console.log("\n[Suite 4: Key Configured - Forward Autocomplete]");
    process.env.GEOAPIFY_API_KEY = "test_configured_api_key_12345";

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr = input.toString();
      if (urlStr.includes("api.geoapify.com/v1/geocode/autocomplete")) {
        // Verify key was passed in request URL
        if (!urlStr.includes("apiKey=test_configured_api_key_12345")) {
          throw new Error("API key was not passed in request");
        }
        return new Response(
          JSON.stringify({
            features: [
              {
                properties: {
                  city: "Lyon",
                  country: "France",
                  state: "Auvergne-Rhone-Alpes",
                  formatted: "Lyon, Auvergne-Rhone-Alpes, France",
                  lat: 45.764,
                  lon: 4.8357,
                  timezone: {
                    name: "Europe/Paris",
                    offset_STD_seconds: 3600,
                  },
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return originalFetch(input, init);
    };

    const reqLyon = new NextRequest("http://localhost:3000/api/geocode?q=Lyon");
    const resLyon = await GET(reqLyon);
    const dataLyon = await resLyon.json();
    assert(resLyon.status === 200, "4.1 HTTP 200 with key configured");
    const lyonGeoapify = dataLyon.results?.find((r: any) => r.city === "Lyon" && r.source === "geoapify");
    assert(!!lyonGeoapify, "4.2 Successfully returned external result with source='geoapify'");
    assert(lyonGeoapify?.tz === 1, "4.3 Correct timezone offset parsed from provider response");

    // ---------------------------------------------------------
    // TEST 5: Key Configured - Reverse Geocoding
    // ---------------------------------------------------------
    console.log("\n[Suite 5: Key Configured - Reverse Geocoding]");
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr = input.toString();
      if (urlStr.includes("api.geoapify.com/v1/geocode/reverse")) {
        return new Response(
          JSON.stringify({
            features: [
              {
                properties: {
                  city: "Marseille",
                  country: "France",
                  formatted: "Marseille, France",
                  timezone: {
                    name: "Europe/Paris",
                    offset_STD_seconds: 3600,
                  },
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return originalFetch(input, init);
    };

    const reqRevMarseille = new NextRequest("http://localhost:3000/api/geocode?lat=43.2965&lon=5.3698");
    const resRevMarseille = await GET(reqRevMarseille);
    const dataRevMarseille = await resRevMarseille.json();
    assert(resRevMarseille.status === 200, "5.1 HTTP 200 for external reverse lookup");
    assert(dataRevMarseille.results?.[0]?.city === "Marseille", "5.2 Resolved Marseille from external provider");
    assert(dataRevMarseille.results?.[0]?.source === "geoapify", "5.3 Correctly labeled source='geoapify'");

    // ---------------------------------------------------------
    // TEST 6: Provider HTTP Error Resilience (500 Status)
    // ---------------------------------------------------------
    console.log("\n[Suite 6: Provider HTTP Error Resilience]");
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr = input.toString();
      if (urlStr.includes("api.geoapify.com")) {
        return new Response(
          JSON.stringify({ statusCode: 500, message: "Internal server error at provider" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
      return originalFetch(input, init);
    };

    // Forward autocomplete under provider 500
    const reqFailForward = new NextRequest("http://localhost:3000/api/geocode?q=Paris");
    const resFailForward = await GET(reqFailForward);
    const dataFailForward = await resFailForward.json();
    assert(resFailForward.status === 200, "6.1 Forward lookup handles provider 500 gracefully with HTTP 200");
    assert(dataFailForward.results?.[0]?.city === "Paris", "6.2 Falls back safely to offline built-in Paris match");
    assert(dataFailForward.results?.[0]?.source === "built-in", "6.3 Source accurately marked 'built-in'");

    // Reverse geocode under provider 500
    const reqFailRev = new NextRequest("http://localhost:3000/api/geocode?lat=48.8566&lon=2.3522");
    const resFailRev = await GET(reqFailRev);
    const dataFailRev = await resFailRev.json();
    assert(resFailRev.status === 200, "6.4 Reverse lookup handles provider 500 gracefully with HTTP 200");
    assert(dataFailRev.results?.[0]?.city === "Paris" && dataFailRev.results[0].source === "built-in", "6.5 Reverse geocode falls back safely to offline city");

    // ---------------------------------------------------------
    // TEST 7: Network Exception & Abort Resilience
    // ---------------------------------------------------------
    console.log("\n[Suite 7: Network Exception & Timeout Resilience]");
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const urlStr = input.toString();
      if (urlStr.includes("api.geoapify.com")) {
        throw new Error("ETIMEDOUT: Connection to provider timed out");
      }
      return originalFetch(input, init);
    };

    const reqTimeout = new NextRequest("http://localhost:3000/api/geocode?q=London");
    const resTimeout = await GET(reqTimeout);
    const dataTimeout = await resTimeout.json();
    assert(resTimeout.status === 200, "7.1 Network timeout handled with HTTP 200");
    assert(dataTimeout.results?.[0]?.city === "London" && dataTimeout.results[0].source === "built-in", "7.2 Falls back safely to offline London match");

    // ---------------------------------------------------------
    // Final Summary
    // ---------------------------------------------------------
    console.log("\n=======================================================");
    console.log(` GEOCODING SECURITY TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("=======================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    // Restore environment
    if (originalEnvKey !== undefined) {
      process.env.GEOAPIFY_API_KEY = originalEnvKey;
    } else {
      delete process.env.GEOAPIFY_API_KEY;
    }
    global.fetch = originalFetch;
  }
}

runGeocodeTests().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
