/**
 * CELESTIA — VEDIC BIRTH TIMESTAMP & VIMSHOTTARI DASHA TIMEZONE TEST SUITE
 *
 * Verifies that local birth times and timezone offsets are correctly normalized
 * to true UTC Date instances for Vedic Vimshottari Dasha calculations.
 */

import { swissEphemeris } from "../lib/astronomy/swissEphemeris";
import { calculateWesternChart } from "../lib/astronomy/ephemeris";
import { calculateVedicChart, calculateVimshottariDashas } from "../lib/astronomy/vedic";

interface TestResult {
  group: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

const results: TestResult[] = [];
let passedCount = 0;
let failedCount = 0;

function assert(
  group: string,
  name: string,
  condition: boolean,
  expected: string,
  actual: string,
  details?: string
) {
  if (condition) {
    console.log(`  [PASS] ${name}`);
    passedCount++;
  } else {
    console.error(`  [FAIL] ${name} (Expected: ${expected}, Actual: ${actual})`);
    if (details) console.error(`         Detail: ${details}`);
    failedCount++;
  }
  results.push({ group, name, passed: condition, expected, actual, details });
}

console.log("\n================================================================================");
console.log(" CELESTIA: VEDIC BIRTH TIMESTAMP & VIMSHOTTARI TIMEZONE VERIFICATION ");
console.log("================================================================================\n");

// ---------------------------------------------------------------------------
// TEST GROUP 1: Primary Defect Reproduction & Resolution
// ---------------------------------------------------------------------------
console.log("[TEST GROUP 1: Reported Defect — 2024-03-15 01:00 at UTC+05:30 (New Delhi)]");

// 1.1 UTC Date creation
const t1Date = swissEphemeris.createUTCDate(2024, 3, 15, 1, 0, 0, 5.5);
assert(
  "Group 1: Defect Case",
  "1.1 UTC Instant ISO string matches 2024-03-14T19:30:00.000Z",
  t1Date.toISOString() === "2024-03-14T19:30:00.000Z",
  "2024-03-14T19:30:00.000Z",
  t1Date.toISOString()
);

assert(
  "Group 1: Defect Case",
  "1.2 UTC Epoch timestamp is exactly 1710444600000 ms",
  t1Date.getTime() === 1710444600000,
  "1710444600000",
  `${t1Date.getTime()}`
);

// 1.3 Vimshottari Dasha starting date
const moonSiderealLon = 55.5448; // Sidereal Taurus
const t1Dashas = calculateVimshottariDashas(t1Date, moonSiderealLon);
const firstDasha = t1Dashas.dashas[0];

assert(
  "Group 1: Defect Case",
  "1.3 Starting Mahadasha startDate reflects Mar 14, 2024 (was Mar 15, 2024 before fix)",
  firstDasha.startDate.startsWith("Mar 14, 2024"),
  "Mar 14, 2024",
  firstDasha.startDate
);

// ---------------------------------------------------------------------------
// TEST GROUP 2: Intra-Day Case (No Midnight Crossing)
// ---------------------------------------------------------------------------
console.log("\n[TEST GROUP 2: Intra-Day — 2024-03-15 14:00 at UTC+05:30]");

const t2Date = swissEphemeris.createUTCDate(2024, 3, 15, 14, 0, 0, 5.5);
assert(
  "Group 2: Intra-Day",
  "2.1 UTC Instant matches 2024-03-15T08:30:00.000Z",
  t2Date.toISOString() === "2024-03-15T08:30:00.000Z",
  "2024-03-15T08:30:00.000Z",
  t2Date.toISOString()
);

const t2Dashas = calculateVimshottariDashas(t2Date, moonSiderealLon);
assert(
  "Group 2: Intra-Day",
  "2.2 Starting Mahadasha startDate is Mar 15, 2024",
  t2Dashas.dashas[0].startDate.startsWith("Mar 15, 2024"),
  "Mar 15, 2024",
  t2Dashas.dashas[0].startDate
);

// ---------------------------------------------------------------------------
// TEST GROUP 3: Year Boundary Crossing
// ---------------------------------------------------------------------------
console.log("\n[TEST GROUP 3: Year Boundary — 2024-01-01 01:00 at UTC+05:30]");

const t3Date = swissEphemeris.createUTCDate(2024, 1, 1, 1, 0, 0, 5.5);
assert(
  "Group 3: Year Boundary",
  "3.1 UTC Instant crosses into previous year (2023-12-31T19:30:00.000Z)",
  t3Date.toISOString() === "2023-12-31T19:30:00.000Z",
  "2023-12-31T19:30:00.000Z",
  t3Date.toISOString()
);

const t3Dashas = calculateVimshottariDashas(t3Date, moonSiderealLon);
assert(
  "Group 3: Year Boundary",
  "3.2 Starting Mahadasha startDate is Dec 31, 2023 (not Jan 1, 2024)",
  t3Dashas.dashas[0].startDate.startsWith("Dec 31, 2023"),
  "Dec 31, 2023",
  t3Dashas.dashas[0].startDate
);

// ---------------------------------------------------------------------------
// TEST GROUP 4: Negative UTC Offset (Western Hemisphere)
// ---------------------------------------------------------------------------
console.log("\n[TEST GROUP 4: Negative Offset — 2024-03-15 02:00 at UTC-05:00]");

const t4Date = swissEphemeris.createUTCDate(2024, 3, 15, 2, 0, 0, -5.0);
assert(
  "Group 4: Negative Offset",
  "4.1 UTC Instant advances forward to 2024-03-15T07:00:00.000Z",
  t4Date.toISOString() === "2024-03-15T07:00:00.000Z",
  "2024-03-15T07:00:00.000Z",
  t4Date.toISOString()
);

const t4Dashas = calculateVimshottariDashas(t4Date, moonSiderealLon);
assert(
  "Group 4: Negative Offset",
  "4.2 Starting Mahadasha startDate is Mar 15, 2024",
  t4Dashas.dashas[0].startDate.startsWith("Mar 15, 2024"),
  "Mar 15, 2024",
  t4Dashas.dashas[0].startDate
);

// ---------------------------------------------------------------------------
// TEST GROUP 5: Zero UTC Offset (Greenwich Standard)
// ---------------------------------------------------------------------------
console.log("\n[TEST GROUP 5: Zero Offset — 2024-03-15 12:00 at UTC+00:00]");

const t5Date = swissEphemeris.createUTCDate(2024, 3, 15, 12, 0, 0, 0);
assert(
  "Group 5: Zero Offset",
  "5.1 UTC Instant is identical 2024-03-15T12:00:00.000Z",
  t5Date.toISOString() === "2024-03-15T12:00:00.000Z",
  "2024-03-15T12:00:00.000Z",
  t5Date.toISOString()
);

// ---------------------------------------------------------------------------
// TEST GROUP 6: Leap-Year Boundary Rollback
// ---------------------------------------------------------------------------
console.log("\n[TEST GROUP 6: Leap-Year Boundary — 2024-03-01 02:00 at UTC+05:30]");

const t6Date = swissEphemeris.createUTCDate(2024, 3, 1, 2, 0, 0, 5.5);
assert(
  "Group 6: Leap Year",
  "6.1 UTC Instant rolls back to leap day 2024-02-29T20:30:00.000Z",
  t6Date.toISOString() === "2024-02-29T20:30:00.000Z",
  "2024-02-29T20:30:00.000Z",
  t6Date.toISOString()
);

const t6Dashas = calculateVimshottariDashas(t6Date, moonSiderealLon);
assert(
  "Group 6: Leap Year",
  "6.2 Starting Mahadasha startDate is Feb 29, 2024 (leap day)",
  t6Dashas.dashas[0].startDate.startsWith("Feb 29, 2024"),
  "Feb 29, 2024",
  t6Dashas.dashas[0].startDate
);

// ---------------------------------------------------------------------------
// TEST GROUP 7: Non-Leap-Year Boundary Rollback
// ---------------------------------------------------------------------------
console.log("\n[TEST GROUP 7: Non-Leap-Year Boundary — 2023-03-01 02:00 at UTC+05:30]");

const t7Date = swissEphemeris.createUTCDate(2023, 3, 1, 2, 0, 0, 5.5);
assert(
  "Group 7: Non-Leap Year",
  "7.1 UTC Instant rolls back to 2023-02-28T20:30:00.000Z",
  t7Date.toISOString() === "2023-02-28T20:30:00.000Z",
  "2023-02-28T20:30:00.000Z",
  t7Date.toISOString()
);

const t7Dashas = calculateVimshottariDashas(t7Date, moonSiderealLon);
assert(
  "Group 7: Non-Leap Year",
  "7.2 Starting Mahadasha startDate is Feb 28, 2023",
  t7Dashas.dashas[0].startDate.startsWith("Feb 28, 2023"),
  "Feb 28, 2023",
  t7Dashas.dashas[0].startDate
);

// ---------------------------------------------------------------------------
// TEST GROUP 8: Full End-to-End Vedic Chart Generation
// ---------------------------------------------------------------------------
console.log("\n[TEST GROUP 8: End-to-End Vedic Chart Pipeline]");

// Run full pipeline matching app/page.tsx for the defect case:
const wData = calculateWesternChart(2024, 3, 15, 1, 0, 28.6139, 77.2090, 5.5, "Placidus");
const birthDateObj = swissEphemeris.createUTCDate(2024, 3, 15, 1, 0, 0, 5.5);
const vData = calculateVedicChart(wData, birthDateObj);

assert(
  "Group 8: End-to-End",
  "8.1 Western Chart Julian Day matches 2460384.31250",
  Math.abs(wData.julianDay - 2460384.3125) < 1e-6,
  "2460384.3125",
  `${wData.julianDay}`
);

assert(
  "Group 8: End-to-End",
  "8.2 Vedic Lagna correctly computed in Sidereal Scorpio (235.86°)",
  vData.lagna.rasiName === "Scorpio",
  "Scorpio",
  vData.lagna.rasiName
);

assert(
  "Group 8: End-to-End",
  "8.3 Vedic Moon correctly computed in Sidereal Taurus (Krittika)",
  vData.moonSignRasi === "Taurus" && vData.birthNakshatra === "Krittika",
  "Taurus / Krittika",
  `${vData.moonSignRasi} / ${vData.birthNakshatra}`
);

assert(
  "Group 8: End-to-End",
  "8.4 Starting Mahadasha is Sun (Krittika ruler) starting Mar 14, 2024",
  vData.vimshottariDashas[0].planet === "Sun" && vData.vimshottariDashas[0].startDate.startsWith("Mar 14, 2024"),
  "Sun starting Mar 14, 2024",
  `${vData.vimshottariDashas[0].planet} starting ${vData.vimshottariDashas[0].startDate}`
);

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log("\n================================================================================");
console.log(` RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("================================================================================\n");

if (failedCount > 0) {
  process.exit(1);
}
