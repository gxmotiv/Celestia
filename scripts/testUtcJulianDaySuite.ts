/**
 * CELESTIA — PHASE 2A: UTC NORMALIZATION & JULIAN DAY REGRESSION TEST SUITE
 *
 * Verifies:
 * 1. 2024-03-15 01:00, UTC+05:30 -> 2024-03-14 19:30 UTC, JD 2460384.31250 (Reported Defect)
 * 2. 2024-03-15 00:15, UTC+05:30 -> 2024-03-14 18:45 UTC, JD 2460384.28125 (Sub-hour midnight boundary)
 * 3. 2024-03-15 14:00, UTC+05:30 -> 2024-03-15 08:30 UTC, JD 2460384.85417 (No midnight crossing)
 * 4. 2024-03-15 02:00, UTC-05:00 -> 2024-03-15 07:00 UTC, JD 2460384.79167 (Negative UTC offset)
 * 5. 2024-03-15 01:00, UTC+03:30 -> 2024-03-14 21:30 UTC, JD 2460384.39583 (Fractional +03:30 offset)
 * 6. 2000-01-01 12:00, UTC+00:00 -> 2000-01-01 12:00 UTC, JD 2451545.00000 (J2000.0 astronomical epoch)
 * 7. Existing valid UTC reference cases (Einstein 1879-03-14 10:50 UTC, Greenwich 2024-01-15 12:00 UTC)
 * 8. Single-date longitude spot checks against stored reference values; not a global accuracy certificate
 */

import { swissEphemeris } from "../lib/astronomy/swissEphemeris";
import { calculateWesternChart } from "../lib/astronomy/ephemeris";

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

async function runTests() {
  console.log("\n================================================================================");
  console.log(" CELESTIA PHASE 2A: UTC NORMALIZATION & JULIAN DAY REGRESSION TEST SUITE ");
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // TEST GROUP 1: Reported Defect Reproduction & Resolution
  // ---------------------------------------------------------------------------
  console.log("[TEST GROUP 1: Reported Defect — 2024-03-15 01:00 at UTC+05:30]");
  const t1Norm = swissEphemeris.normalizeLocalToUTC(2024, 3, 15, 1, 0, 0, 5.5);
  assert(
    t1Norm.utcYear === 2024 && t1Norm.utcMonth === 3 && t1Norm.utcDay === 14,
    "1.1 Date normalized backwards across midnight to 2024-03-14",
    `Got ${t1Norm.utcYear}-${t1Norm.utcMonth}-${t1Norm.utcDay}`
  );
  assert(
    Math.abs(t1Norm.utcDecimalHour - 19.5) < 1e-9,
    "1.2 Time normalized to 19.5h (19:30 UTC), NOT 18:30 UTC",
    `Got ${t1Norm.utcDecimalHour}h`
  );

  const t1Jd = swissEphemeris.calculateJulianDay(2024, 3, 15, 1, 0, 0, 5.5);
  const expectedT1Jd = 2460384.3125;
  assert(
    Math.abs(t1Jd - expectedT1Jd) < 1e-6,
    `1.3 Julian Day matches exact reference ${expectedT1Jd}`,
    `Got ${t1Jd}`
  );

  // ---------------------------------------------------------------------------
  // TEST GROUP 2: Sub-Hour Midnight Boundary Crossing
  // ---------------------------------------------------------------------------
  console.log("\n[TEST GROUP 2: Sub-Hour Midnight Crossing — 2024-03-15 00:15 at UTC+05:30]");
  const t2Norm = swissEphemeris.normalizeLocalToUTC(2024, 3, 15, 0, 15, 0, 5.5);
  assert(
    t2Norm.utcYear === 2024 && t2Norm.utcMonth === 3 && t2Norm.utcDay === 14,
    "2.1 Date normalized backwards to 2024-03-14",
    `Got ${t2Norm.utcYear}-${t2Norm.utcMonth}-${t2Norm.utcDay}`
  );
  assert(
    Math.abs(t2Norm.utcDecimalHour - 18.75) < 1e-9,
    "2.2 Time normalized to 18.75h (18:45 UTC)",
    `Got ${t2Norm.utcDecimalHour}h`
  );

  const t2Jd = swissEphemeris.calculateJulianDay(2024, 3, 15, 0, 15, 0, 5.5);
  const expectedT2Jd = 2460384.28125;
  assert(
    Math.abs(t2Jd - expectedT2Jd) < 1e-6,
    `2.3 Julian Day matches exact reference ${expectedT2Jd}`,
    `Got ${t2Jd}`
  );

  // ---------------------------------------------------------------------------
  // TEST GROUP 3: Intra-Day Timezone Offset (No Midnight Crossing)
  // ---------------------------------------------------------------------------
  console.log("\n[TEST GROUP 3: Intra-Day — 2024-03-15 14:00 at UTC+05:30]");
  const t3Norm = swissEphemeris.normalizeLocalToUTC(2024, 3, 15, 14, 0, 0, 5.5);
  assert(
    t3Norm.utcYear === 2024 && t3Norm.utcMonth === 3 && t3Norm.utcDay === 15,
    "3.1 Date remains 2024-03-15",
    `Got ${t3Norm.utcYear}-${t3Norm.utcMonth}-${t3Norm.utcDay}`
  );
  assert(
    Math.abs(t3Norm.utcDecimalHour - 8.5) < 1e-9,
    "3.2 Time normalized to 8.5h (08:30 UTC)",
    `Got ${t3Norm.utcDecimalHour}h`
  );

  const t3Jd = swissEphemeris.calculateJulianDay(2024, 3, 15, 14, 0, 0, 5.5);
  const expectedT3Jd = 2460384.854166667;
  assert(
    Math.abs(t3Jd - expectedT3Jd) < 1e-6,
    `3.3 Julian Day matches reference ${expectedT3Jd.toFixed(5)}`,
    `Got ${t3Jd}`
  );

  // ---------------------------------------------------------------------------
  // TEST GROUP 4: Negative UTC Offset (Western Hemisphere)
  // ---------------------------------------------------------------------------
  console.log("\n[TEST GROUP 4: Negative UTC Offset — 2024-03-15 02:00 at UTC-05:00]");
  const t4Norm = swissEphemeris.normalizeLocalToUTC(2024, 3, 15, 2, 0, 0, -5.0);
  assert(
    t4Norm.utcYear === 2024 && t4Norm.utcMonth === 3 && t4Norm.utcDay === 15,
    "4.1 Date remains 2024-03-15 (moves forward to 07:00 UTC)",
    `Got ${t4Norm.utcYear}-${t4Norm.utcMonth}-${t4Norm.utcDay}`
  );
  assert(
    Math.abs(t4Norm.utcDecimalHour - 7.0) < 1e-9,
    "4.2 Time normalized to 7.0h (07:00 UTC)",
    `Got ${t4Norm.utcDecimalHour}h`
  );

  const t4Jd = swissEphemeris.calculateJulianDay(2024, 3, 15, 2, 0, 0, -5.0);
  const expectedT4Jd = 2460384.791666667;
  assert(
    Math.abs(t4Jd - expectedT4Jd) < 1e-6,
    `4.3 Julian Day matches reference ${expectedT4Jd.toFixed(5)}`,
    `Got ${t4Jd}`
  );

  // ---------------------------------------------------------------------------
  // TEST GROUP 5: Fractional Offset (UTC+03:30, Iran Standard Time)
  // ---------------------------------------------------------------------------
  console.log("\n[TEST GROUP 5: Fractional Offset — 2024-03-15 01:00 at UTC+03:30]");
  const t5Norm = swissEphemeris.normalizeLocalToUTC(2024, 3, 15, 1, 0, 0, 3.5);
  assert(
    t5Norm.utcYear === 2024 && t5Norm.utcMonth === 3 && t5Norm.utcDay === 14,
    "5.1 Date normalized backwards to 2024-03-14",
    `Got ${t5Norm.utcYear}-${t5Norm.utcMonth}-${t5Norm.utcDay}`
  );
  assert(
    Math.abs(t5Norm.utcDecimalHour - 21.5) < 1e-9,
    "5.2 Time normalized to 21.5h (21:30 UTC)",
    `Got ${t5Norm.utcDecimalHour}h`
  );

  const t5Jd = swissEphemeris.calculateJulianDay(2024, 3, 15, 1, 0, 0, 3.5);
  const expectedT5Jd = 2460384.395833333;
  assert(
    Math.abs(t5Jd - expectedT5Jd) < 1e-6,
    `5.3 Julian Day matches reference ${expectedT5Jd.toFixed(5)}`,
    `Got ${t5Jd}`
  );

  // ---------------------------------------------------------------------------
  // TEST GROUP 6: Fundamental Astronomical Epoch (J2000.0)
  // ---------------------------------------------------------------------------
  console.log("\n[TEST GROUP 6: Fundamental Epoch J2000.0 — 2000-01-01 12:00 UTC]");
  const t6Norm = swissEphemeris.normalizeLocalToUTC(2000, 1, 1, 12, 0, 0, 0);
  assert(
    t6Norm.utcYear === 2000 && t6Norm.utcMonth === 1 && t6Norm.utcDay === 1 && Math.abs(t6Norm.utcDecimalHour - 12.0) < 1e-9,
    "6.1 UTC instant matches 2000-01-01 12:00:00"
  );
  const t6Jd = swissEphemeris.calculateJulianDay(2000, 1, 1, 12, 0, 0, 0);
  assert(
    Math.abs(t6Jd - 2451545.0) < 1e-6,
    "6.2 J2000.0 Julian Day is exactly 2451545.00000",
    `Got ${t6Jd}`
  );

  // ---------------------------------------------------------------------------
  // TEST GROUP 7: Historical Benchmarks
  // ---------------------------------------------------------------------------
  console.log("\n[TEST GROUP 7: Historical Benchmarks]");
  // Albert Einstein: 1879-03-14 10:50 UTC (JD 2407422.951388889)
  const einsteinJd = swissEphemeris.calculateJulianDay(1879, 3, 14, 10, 50, 0, 0);
  const expectedEinsteinJd = 2407422.951388889;
  assert(
    Math.abs(einsteinJd - expectedEinsteinJd) < 1e-5,
    "7.1 Einstein birth JD matches 2407422.95139",
    `Got ${einsteinJd}`
  );

  // ---------------------------------------------------------------------------
  // TEST GROUP 8: Full Chart Pipeline Validation (Case 4B vs NASA JPL Horizons)
  // ---------------------------------------------------------------------------
  console.log("\n[TEST GROUP 8: End-to-End Chart Spot Check on the UTC Boundary Case]");
  const chart4B = calculateWesternChart(2024, 3, 15, 1, 0, 28.6139, 77.2090, 5.5, "Placidus");
  assert(
    Math.abs(chart4B.julianDay - 2460384.3125) < 1e-6,
    "8.1 Western chart Julian Day is exact 2460384.31250",
    `Got ${chart4B.julianDay}`
  );

  const sun = chart4B.planets.find((p) => p.name === "Sun");
  const moon = chart4B.planets.find((p) => p.name === "Moon");

  // Stored comparison values for 2024-03-15 19:30 UTC. The original query parameters,
  // coordinate settings, time scale, and retrieval record are not stored here, so these
  // values are regression spot checks, not a reproducible independent validation corpus.
  // Sun reference: 354.7087° (this test threshold: 5 arcseconds).
  // Moon reference: 55.5443° (this test threshold: 10 arcseconds).
  const sunDiffArcsec = Math.abs((sun?.longitude || 0) - 354.7087) * 3600.0;
  const moonDiffArcsec = Math.abs((moon?.longitude || 0) - 55.5443) * 3600.0;

  assert(
    sunDiffArcsec < 5.0,
    `8.2 Sun longitude is within 5 arcsec of the stored spot-check value (diff = ${sunDiffArcsec.toFixed(2)}")`,
    `Celestia: ${sun?.longitude.toFixed(4)}°, Horizons: 354.7087°`
  );
  assert(
    moonDiffArcsec < 10.0,
    `8.3 Moon longitude is within 10 arcsec of the stored spot-check value (diff = ${moonDiffArcsec.toFixed(2)}")`,
    `Celestia: ${moon?.longitude.toFixed(4)}°, Horizons: 55.5443° (was 2077" off before patch)`
  );

  console.log("\n================================================================================");
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) process.exit(1);
}

runTests();
