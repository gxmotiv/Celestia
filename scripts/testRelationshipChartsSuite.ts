/**
 * Celestia - Phase 1B Relationship Astrology Test Suite
 * Validates the Davison Time-Space Relationship Chart calculation engine:
 * 1. Timezone-normalized UTC birth instant conversion (with date/month rollovers).
 * 2. Fractional timezone offsets (e.g. India +5.5, Nepal +5.75, Newfoundland -3.5).
 * 3. Exact time midpoint calculation with sub-minute / second-level precision.
 * 4. Shortest angular arc longitude midpoint across the ±180° anti-meridian (Date Line).
 * 5. Deterministic antipodal longitude tie-breaking convention.
 * 6. Local Mean Time (LMT = UTC + midLon / 15.0h) calculation and formatting.
 * 7. Standard arithmetic mean latitude convention and terrestrial boundary clamping.
 * 8. Julian Day sub-minute precision propagation into ephemeris calculations.
 * 9. Backward compatibility when timezoneOffset is omitted.
 * 10. Robust process exit behavior (exits with non-zero on failure).
 */

import { DavisonChartEngine, DavisonPersonInput } from "../lib/astronomy/relationshipEngine";
import { swissEphemeris } from "../lib/astronomy/swissEphemeris";
import { calculateWesternChart } from "../lib/astronomy/ephemeris";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    passedCount++;
    console.log(`  ✓ ${testName}`);
  } else {
    failedCount++;
    console.error(`  ✗ FAIL: ${testName}${details ? ` -> ${details}` : ""}`);
  }
}

console.log("===============================================================================");
console.log("CELESTIA PHASE 1B: DAVISON RELATIONSHIP CHART AUDIT & VERIFICATION SUITE");
console.log("===============================================================================\n");

const engine = new DavisonChartEngine();

// ---------------------------------------------------------------------------
// TEST 1: UTC Birth Instant Conversion Across Date Boundary (Tokyo + San Francisco)
// ---------------------------------------------------------------------------
console.log("[TEST GROUP 1] Timezone Normalization Across Date Boundaries");
{
  // Person 1: Tokyo 2000-01-01 04:00 (TZ +9) -> UTC: 1999-12-31 19:00:00 (Previous Year/Day)
  // Person 2: San Francisco 2000-01-01 10:00 (TZ -8) -> UTC: 2000-01-01 18:00:00
  // Time span: 23 hours. Halfway: 11.5 hours after 1999-12-31 19:00:00 = 2000-01-01 06:30:00 UTC
  const p1: DavisonPersonInput = {
    birthDate: "2000-01-01",
    birthTime: "04:00",
    latitude: 35.6762,
    longitude: 139.6503,
    timezoneOffset: 9.0,
  };
  const p2: DavisonPersonInput = {
    birthDate: "2000-01-01",
    birthTime: "10:00",
    latitude: 37.7749,
    longitude: -122.4194,
    timezoneOffset: -8.0,
  };

  const result = engine.calculateDavison(p1, p2);

  assert(
    result.midpointDateUtc === "2000-01-01T06:30:00.000Z",
    "1.1 Tokyo (TZ+9) and SF (TZ-8) UTC midpoint correctly resolves to 2000-01-01T06:30:00.000Z",
    `Actual: ${result.midpointDateUtc}`
  );

  // Shortest angular arc between Tokyo (139.6503°E) and SF (-122.4194°W):
  // diff = -122.4194 - 139.6503 = -262.0697 -> +97.9303° (Pacific arc)
  // midLon = 139.6503 + 48.96515 = 188.61545 -> -171.38455° (-171.38°W)
  assert(
    Math.abs(result.midpointLocation.longitude - (-171.38)) < 0.05,
    "1.2 Pacific shortest-arc longitude correctly lands near -171.38° (not near Africa)",
    `Actual: ${result.midpointLocation.longitude}°`
  );

  // Mean latitude: (35.6762 + 37.7749) / 2 = 36.72555 -> 36.73°
  assert(
    Math.abs(result.midpointLocation.latitude - 36.73) < 0.05,
    "1.3 Mean latitude is (35.68 + 37.77)/2 = 36.73°",
    `Actual: ${result.midpointLocation.latitude}°`
  );
}

// ---------------------------------------------------------------------------
// TEST 2: Fractional Timezone Offsets (India +5.5 vs New York -5.0)
// ---------------------------------------------------------------------------
console.log("\n[TEST GROUP 2] Fractional Timezone Offsets");
{
  // Person 1: New Delhi 2024-03-15 01:00 (TZ +5.5) -> UTC: 2024-03-14 19:30:00
  // Person 2: New York 2024-03-14 15:30 (TZ -5.0) -> UTC: 2024-03-14 20:30:00
  // Midpoint UTC: exactly 2024-03-14 20:00:00 UTC (1 hour difference, half is 30 mins)
  const p1: DavisonPersonInput = {
    birthDate: "2024-03-15",
    birthTime: "01:00",
    latitude: 28.6139,
    longitude: 77.209,
    timezoneOffset: 5.5,
  };
  const p2: DavisonPersonInput = {
    birthDate: "2024-03-14",
    birthTime: "15:30",
    latitude: 40.7128,
    longitude: -74.006,
    timezoneOffset: -5.0,
  };

  const result = engine.calculateDavison(p1, p2);

  assert(
    result.midpointDateUtc === "2024-03-14T20:00:00.000Z",
    "2.1 Fractional offset (+5.5) correctly computes midpoint instant 2024-03-14T20:00:00.000Z",
    `Actual: ${result.midpointDateUtc}`
  );

  // Longitude between Delhi (77.209°) and NY (-74.006°):
  // diff = -74.006 - 77.209 = -151.215° (shortest arc goes westward/across Atlantic)
  // midLon = 77.209 + (-75.6075) = 1.6015° -> ~1.60°E (near Greenwich/France)
  assert(
    Math.abs(result.midpointLocation.longitude - 1.6) < 0.05,
    "2.2 Delhi to NY longitude midpoint correctly lands near 1.60°E",
    `Actual: ${result.midpointLocation.longitude}°`
  );
}

// ---------------------------------------------------------------------------
// TEST 3: Anti-Meridian Longitude Crossing (Fiji 178°E vs Samoa 172°W)
// ---------------------------------------------------------------------------
console.log("\n[TEST GROUP 3] Anti-Meridian (Date Line) Shortest Arc");
{
  // Person 1: Fiji (+178.0° longitude)
  // Person 2: Samoa (-172.0° longitude)
  // Direct angular distance: 10° across the 180° meridian.
  // Halfway is 5° east of Fiji = 183° = -177.0° (177°W).
  // Buggy arithmetic mean would produce (178 - 172) / 2 = +3.0° (near Greenwich!).
  const p1: DavisonPersonInput = {
    birthDate: "2020-06-01",
    birthTime: "12:00",
    latitude: -18.1416,
    longitude: 178.4419,
    timezoneOffset: 12.0,
  };
  const p2: DavisonPersonInput = {
    birthDate: "2020-06-01",
    birthTime: "12:00",
    latitude: -13.8333,
    longitude: -171.75,
    timezoneOffset: 13.0,
  };

  const result = engine.calculateDavison(p1, p2);

  // Shortest arc midpoint:
  // diff = -171.75 - 178.4419 = -350.1919 -> +9.8081°
  // midLon = 178.4419 + 4.90405 = 183.34595 -> -176.65°
  assert(
    result.midpointLocation.longitude < -170 && result.midpointLocation.longitude > -180,
    "3.1 Longitude crosses anti-meridian correctly into western hemisphere (around -176.65°)",
    `Actual: ${result.midpointLocation.longitude}°`
  );

  assert(
    result.midpointLocation.longitude !== 3.35,
    "3.2 Anti-meridian avoids buggy arithmetic mean near +3.35°",
    `Actual: ${result.midpointLocation.longitude}°`
  );
}

// ---------------------------------------------------------------------------
// TEST 4: Deterministic Antipodal Longitude Tie-Breaking
// ---------------------------------------------------------------------------
console.log("\n[TEST GROUP 4] Antipodal Longitude Deterministic Tie-Breaking");
{
  // Case A: Person 1 at -90°, Person 2 at +90°. Angular distance = 180°.
  // Documented convention: resolve eastward from person 1 (+180°).
  // Midpoint = -90 + 90 = 0.0° (Prime Meridian).
  const p1: DavisonPersonInput = {
    birthDate: "2000-01-01",
    birthTime: "12:00",
    latitude: 0,
    longitude: -90.0,
    timezoneOffset: 0,
  };
  const p2: DavisonPersonInput = {
    birthDate: "2000-01-01",
    birthTime: "12:00",
    latitude: 0,
    longitude: 90.0,
    timezoneOffset: 0,
  };

  const resultA = engine.calculateDavison(p1, p2);
  assert(
    Math.abs(resultA.midpointLocation.longitude - 0.0) < 1e-4,
    "4.1 Antipodal -90° and +90° resolves eastward from P1 to 0.0° Prime Meridian",
    `Actual: ${resultA.midpointLocation.longitude}°`
  );

  // Case B: Person 1 at +90°, Person 2 at -90°.
  // Eastward from P1: +90 + 90 = 180.0° (Anti-meridian).
  const resultB = engine.calculateDavison(p2, p1);
  assert(
    Math.abs(Math.abs(resultB.midpointLocation.longitude) - 180.0) < 1e-4,
    "4.2 Antipodal +90° and -90° resolves eastward from P1 to ±180.0° Anti-Meridian",
    `Actual: ${resultB.midpointLocation.longitude}°`
  );
}

// ---------------------------------------------------------------------------
// TEST 5: Sub-Minute and Second-Level Precision in Julian Day & Planets
// ---------------------------------------------------------------------------
console.log("\n[TEST GROUP 5] Sub-Minute / Second-Level Precision Propagation");
{
  // Person 1: 12:00:10 UTC
  // Person 2: 12:00:50 UTC
  // Midpoint time: 12:00:30 UTC.
  const p1: DavisonPersonInput = {
    birthDate: "2024-01-01",
    birthTime: "12:00:10",
    latitude: 0,
    longitude: 0,
    timezoneOffset: 0,
  };
  const p2: DavisonPersonInput = {
    birthDate: "2024-01-01",
    birthTime: "12:00:50",
    latitude: 0,
    longitude: 0,
    timezoneOffset: 0,
  };

  const result = engine.calculateDavison(p1, p2);
  assert(
    result.midpointDateUtc === "2024-01-01T12:00:30.000Z",
    "5.1 Exact seconds midpoint is preserved at 12:00:30.000Z",
    `Actual: ${result.midpointDateUtc}`
  );

  // Verify that passing second: 30 changes Julian Day by exactly 30/86400 days
  const jd0 = swissEphemeris.calculateJulianDay(2024, 1, 1, 12, 0, 0, 0);
  const jd30 = swissEphemeris.calculateJulianDay(2024, 1, 1, 12, 0, 30, 0);
  const expectedDeltaJd = 30 / 86400;
  assert(
    Math.abs(jd30 - jd0 - expectedDeltaJd) < 1e-9,
    "5.2 Julian Day reflects exact 30-second increment (delta = 30/86400 days)",
    `Actual delta: ${(jd30 - jd0).toFixed(8)}, Expected: ${expectedDeltaJd.toFixed(8)}`
  );

  // Verify that calculateWesternChart passes second to Swiss Ephemeris
  const chart0 = calculateWesternChart(2024, 1, 1, 12, 0, 0, 0, 0, "Placidus", 0);
  const chart30 = calculateWesternChart(2024, 1, 1, 12, 0, 0, 0, 0, "Placidus", 30);
  // Moon moves ~13.2° per day = ~0.00458° per 30 seconds
  const moon0 = chart0.planets.find((p) => p.name === "Moon")?.longitude ?? 0;
  const moon30 = chart30.planets.find((p) => p.name === "Moon")?.longitude ?? 0;
  const moonDelta = Math.abs(moon30 - moon0);
  assert(
    moonDelta > 0.001,
    "5.3 Planetary positions in Western chart reflect second-level temporal motion",
    `Moon 30s movement: ${moonDelta.toFixed(5)}°`
  );
}

// ---------------------------------------------------------------------------
// TEST 6: Local Mean Time (LMT) Verification
// ---------------------------------------------------------------------------
console.log("\n[TEST GROUP 6] Local Mean Time (LMT) Computation & Formatting");
{
  // Midpoint at UTC 12:00:00, longitude -75.0° (West)
  // LMT offset = -75 / 15 = -5.0 hours -> LMT is 07:00:00 UTC-05:00
  const p1: DavisonPersonInput = {
    birthDate: "2024-06-01",
    birthTime: "12:00:00",
    latitude: 40.0,
    longitude: -75.0,
    timezoneOffset: 0,
  };
  const p2: DavisonPersonInput = {
    birthDate: "2024-06-01",
    birthTime: "12:00:00",
    latitude: 40.0,
    longitude: -75.0,
    timezoneOffset: 0,
  };

  const result = engine.calculateDavison(p1, p2);
  assert(
    result.lmtOffsetHours === -5.0,
    "6.1 LMT offset for longitude -75.0° is exactly -5.0 hours",
    `Actual: ${result.lmtOffsetHours}`
  );
  assert(
    result.midpointLmt.includes("07:00:00 LMT (UTC-05:00)"),
    "6.2 Formatted LMT string shows 07:00:00 LMT (UTC-05:00)",
    `Actual: ${result.midpointLmt}`
  );
}

// ---------------------------------------------------------------------------
// TEST 7: Terrestrial Latitude Mean & Clamping
// ---------------------------------------------------------------------------
console.log("\n[TEST GROUP 7] Terrestrial Latitude Clamping");
{
  const p1: DavisonPersonInput = {
    birthDate: "2020-01-01",
    birthTime: "12:00",
    latitude: 88.0,
    longitude: 0,
    timezoneOffset: 0,
  };
  const p2: DavisonPersonInput = {
    birthDate: "2020-01-01",
    birthTime: "12:00",
    latitude: 86.0,
    longitude: 0,
    timezoneOffset: 0,
  };

  const result = engine.calculateDavison(p1, p2);
  assert(
    result.midpointLocation.latitude === 87.0,
    "7.1 Arithmetic mean latitude (88 + 86) / 2 = 87.0°",
    `Actual: ${result.midpointLocation.latitude}`
  );
}

// ---------------------------------------------------------------------------
// TEST 8: Backward Compatibility with Missing Timezone Offset
// ---------------------------------------------------------------------------
console.log("\n[TEST GROUP 8] Backward Compatibility");
{
  // Input without timezoneOffset field
  const p1 = {
    birthDate: "2024-01-01",
    birthTime: "12:00",
    latitude: 51.5074,
    longitude: -0.1278,
  };
  const p2 = {
    birthDate: "2024-01-01",
    birthTime: "14:00",
    latitude: 48.8566,
    longitude: 2.3522,
  };

  const result = engine.calculateDavison(p1, p2);
  assert(
    result.midpointDateUtc === "2024-01-01T13:00:00.000Z",
    "8.1 Davison handles omitted timezoneOffset defaulting to UTC (13:00:00Z)",
    `Actual: ${result.midpointDateUtc}`
  );
  assert(
    typeof result.midpointDate === "string" && result.midpointDate.length > 0,
    "8.2 Legacy midpointDate property is populated and compatible",
    `Actual: ${result.midpointDate}`
  );
  assert(
    result.chartData.planets.length >= 10,
    "8.3 Western natal chart data is fully calculated with all planets",
    `Planets count: ${result.chartData.planets.length}`
  );
}

// ---------------------------------------------------------------------------
// TEST 9: Exact resolved UTC instants take precedence over numeric offsets
// ---------------------------------------------------------------------------
console.log("\n[TEST GROUP 9] Resolved UTC Instant Preservation");
{
  const instant = "2024-03-14T20:00:30.250Z";
  const p1: DavisonPersonInput = {
    birthDate: "2000-01-01",
    birthTime: "12:00",
    latitude: 28.6139,
    longitude: 77.209,
    timezoneOffset: 5.5,
    utcInstant: instant,
  };
  const p2: DavisonPersonInput = {
    birthDate: "2000-01-01",
    birthTime: "12:00",
    latitude: 28.6139,
    longitude: 77.209,
    timezoneOffset: -8,
    utcInstant: instant,
  };
  const result = engine.calculateDavison(p1, p2);
  assert(
    result.midpointDateUtc === instant,
    "9.1 Explicit UTC instants override conflicting legacy local clocks and offsets",
    `Actual: ${result.midpointDateUtc}`
  );
  assert(
    result.midpointDateUtc.endsWith(".250Z"),
    "9.2 Explicit UTC instant preserves millisecond precision",
    `Actual: ${result.midpointDateUtc}`
  );
}

// ---------------------------------------------------------------------------
// TEST 10: Strict validation prevents invalid civil times and coordinates
// ---------------------------------------------------------------------------
console.log("\n[TEST GROUP 10] Davison Input Validation");
{
  const valid: DavisonPersonInput = {
    birthDate: "2024-01-01",
    birthTime: "12:00",
    latitude: 0,
    longitude: 0,
    timezoneOffset: 0,
  };
  const rejects = (action: () => unknown): boolean => {
    try {
      action();
      return false;
    } catch {
      return true;
    }
  };

  assert(
    rejects(() => engine.calculateDavison({ ...valid, birthDate: "2024-02-30" }, valid)),
    "10.1 Invalid Gregorian dates are rejected instead of normalized"
  );
  assert(
    rejects(() => engine.calculateDavison({ ...valid, birthTime: "24:00" }, valid)),
    "10.2 Out-of-range clock hours are rejected"
  );
  assert(
    rejects(() => engine.calculateDavison({ ...valid, birthTime: "12:60" }, valid)),
    "10.3 Out-of-range clock minutes are rejected"
  );
  assert(
    rejects(() => engine.calculateDavison({ ...valid, birthTime: "12:00:60" }, valid)),
    "10.4 Leap-second-style values are not silently normalized as civil birth times"
  );
  assert(
    rejects(() => engine.calculateDavison({ ...valid, timezoneOffset: Number.NaN }, valid)),
    "10.5 Non-finite numeric UTC offsets are rejected"
  );
  assert(
    rejects(() => engine.calculateDavison({ ...valid, timezoneOffset: 24.5 }, valid)),
    "10.6 Numeric UTC offsets outside the supported range are rejected"
  );
  assert(
    rejects(() => engine.calculateDavison({ ...valid, latitude: 90.1 }, valid)),
    "10.7 Latitude outside the terrestrial range is rejected"
  );
  assert(
    rejects(() => engine.calculateDavison({ ...valid, longitude: 180.1 }, valid)),
    "10.8 Longitude outside the accepted range is rejected"
  );
  assert(
    rejects(() => engine.calculateDavison({ ...valid, utcInstant: "2024-02-30T00:00:00.000Z" }, valid)),
    "10.9 Invalid ISO UTC instants are rejected"
  );
}

// ---------------------------------------------------------------------------
// TEST 11: Strict legacy offset path still preserves fractional local seconds
// ---------------------------------------------------------------------------
console.log("\n[TEST GROUP 11] Legacy Fractional-Second Compatibility");
{
  const p1: DavisonPersonInput = {
    birthDate: "2024-03-15",
    birthTime: "01:30:10.500",
    latitude: 28.6139,
    longitude: 77.209,
    timezoneOffset: 5.5,
  };
  const p2: DavisonPersonInput = { ...p1 };
  const result = engine.calculateDavison(p1, p2);
  assert(
    result.midpointDateUtc === "2024-03-14T20:00:10.500Z",
    "11.1 Legacy offset conversion accepts precise seconds and retains milliseconds",
    `Actual: ${result.midpointDateUtc}`
  );
}

console.log("\n===============================================================================");
console.log(`SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("===============================================================================");

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
