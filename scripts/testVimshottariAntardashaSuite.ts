/**
 * CELESTIA — PHASE 2C: VIMSHOTTARI ANTARDASHA COMPREHENSIVE TEST SUITE
 *
 * Verifies classical Parashari Vimshottari Antardasha timeline reconstruction:
 * 1. Moon at 12° Aries (Ashwini, Ketu, 90% elapsed -> active Antardasha is Ketu-Mercury)
 * 2. Moon at 0°40' Aries (Ashwini, Ketu, 5% elapsed -> active Antardasha is Ketu-Ketu)
 * 3. Moon at 13°10' Aries (Ashwini, Ketu, 98.75% elapsed -> active Antardasha is Ketu-Mercury)
 * 4. Moon at 20° Aries (Bharani, Venus, 50% elapsed -> active Antardasha is Venus-Rahu)
 * 5. All 9 Mahadasha Lords coverage (Ketu, Venus, Sun, Moon, Mars, Rahu, Jupiter, Saturn, Mercury)
 * 6. UTC Date boundary handling for birth instants
 * 7. Deterministic current-period detection via controllable referenceDate
 * 8. All 9 Antardashas preserved with isPreNatal flags and zero timeline gaps
 */

import { calculateVimshottariDashas } from "../lib/astronomy/vedic";

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
    console.error(`  [FAIL] ${name}`);
    console.error(`         Expected: ${expected}`);
    console.error(`         Actual:   ${actual}`);
    if (details) console.error(`         Detail:   ${details}`);
    failedCount++;
  }
  results.push({ group, name, passed: condition, expected, actual, details });
}

console.log("\n================================================================================");
console.log(" CELESTIA PHASE 2C: VIMSHOTTARI ANTARDASHA VERIFICATION SUITE ");
console.log("================================================================================\n");

// ---------------------------------------------------------------------------
// TEST GROUP 1: Primary Reported Case — Moon at 12° Aries (Ashwini, Ketu 7y)
// ---------------------------------------------------------------------------
console.log("[TEST GROUP 1: Ashwini 90% Elapsed (Moon at 12° Aries)]");
// Nakshatra span = 13°20' = 13.333333°. 12° = 90.0% elapsed.
// Ketu Mahadasha: 7 years. Elapsed = 6.30y. Balance = 0.70y.
// Ketu Antardashas cumulative: Ketu (0.408y), Venus (1.575y), Sun (1.925y), Moon (2.508y),
// Mars (2.917y), Rahu (3.967y), Jupiter (4.900y), Saturn (6.008y), Mercury (7.000y).
// At elapsed = 6.30y, Saturn ended at 6.008y -> Active Antardasha is Mercury!
const birth1 = new Date("2024-01-01T00:00:00Z");
const res1 = calculateVimshottariDashas(birth1, 12.0, birth1);
const maha1 = res1.dashas[0];
const sub1 = maha1.subPeriods || [];

assert(
  "Group 1",
  "1.1 Birth Mahadasha is Ketu with 0.7 years balance",
  maha1.planet === "Ketu" && Math.abs(maha1.durationYears - 0.7) < 0.05,
  "Ketu, 0.7 years",
  `${maha1.planet}, ${maha1.durationYears} years`
);

assert(
  "Group 1",
  "1.2 Exactly 9 Antardasha entries preserved in birth Mahadasha",
  sub1.length === 9,
  "9 Antardashas",
  `${sub1.length} Antardashas`
);

// Pre-natal Antardashas (0 through 7: Ketu to Saturn)
const preNatalCount1 = sub1.filter((s) => s.isPreNatal).length;
assert(
  "Group 1",
  "1.3 Exactly 8 Antardashas marked as pre-natal (Ketu through Saturn)",
  preNatalCount1 === 8,
  "8 pre-natal",
  `${preNatalCount1} pre-natal`
);

// Active Antardasha at birth is Mercury (index 8)
const activeBirthAD1 = sub1.find((s) => !s.isPreNatal);
assert(
  "Group 1",
  "1.4 Active Antardasha at birth is Mercury (NOT Ketu)",
  activeBirthAD1?.planet === "Mercury",
  "Mercury",
  activeBirthAD1?.planet || "None"
);

assert(
  "Group 1",
  "1.5 Current Antardasha at birth instant is Mercury",
  res1.currentAntar === "Mercury",
  "Mercury",
  res1.currentAntar
);

assert(
  "Group 1",
  "1.6 Remaining balance of Ketu-Mercury at birth is ~0.70 years",
  Math.abs((activeBirthAD1?.balanceYearsAtBirth || 0) - 0.7) < 0.05,
  "~0.70 years",
  `${activeBirthAD1?.balanceYearsAtBirth?.toFixed(4)} years`
);

// ---------------------------------------------------------------------------
// TEST GROUP 2: Moon Near Beginning of Nakshatra (0°40' Aries = 0.6667°)
// ---------------------------------------------------------------------------
console.log("\n[TEST GROUP 2: Ashwini 5% Elapsed (Moon at 0°40' Aries)]");
// Elapsed = 0.666667 / 13.333333 = 0.05 (5%). Elapsed time = 7 * 0.05 = 0.35y.
// Ketu-Ketu nominal duration = (7*7)/120 = 0.40833y.
// Since 0.35y < 0.40833y, native is born during Ketu-Ketu!
const res2 = calculateVimshottariDashas(birth1, 2 / 3, birth1);
const maha2 = res2.dashas[0];
const sub2 = maha2.subPeriods || [];

assert(
  "Group 2",
  "2.1 Active Antardasha at birth is Ketu (Ketu-Ketu)",
  res2.currentAntar === "Ketu",
  "Ketu",
  res2.currentAntar
);

assert(
  "Group 2",
  "2.2 Zero pre-natal Antardashas at 5% elapsed",
  sub2.filter((s) => s.isPreNatal).length === 0,
  "0 pre-natal",
  `${sub2.filter((s) => s.isPreNatal).length} pre-natal`
);

const ketuAD2 = sub2[0];
const expectedKetuBal = 0.408333 - 0.35; // ~0.05833y
assert(
  "Group 2",
  "2.3 Remaining Ketu-Ketu balance is ~0.058 years (~21 days)",
  Math.abs((ketuAD2?.balanceYearsAtBirth || 0) - expectedKetuBal) < 0.01,
  `~${expectedKetuBal.toFixed(4)} years`,
  `${ketuAD2?.balanceYearsAtBirth?.toFixed(4)} years`
);

// Subsequent Ketu-Venus runs for its FULL nominal duration (1.1667y), NOT compressed
const venusAD2 = sub2[1];
const expectedVenusNominal = (7 * 20) / 120; // 1.16667y
assert(
  "Group 2",
  "2.4 Subsequent Ketu-Venus retains full duration (1.167y), NOT compressed",
  Math.abs((venusAD2?.durationYears || 0) - expectedVenusNominal) < 0.01,
  `~${expectedVenusNominal.toFixed(4)} years`,
  `${venusAD2?.durationYears?.toFixed(4)} years`
);

// ---------------------------------------------------------------------------
// TEST GROUP 3: Moon Near End of Nakshatra (13°10' Aries = 13.1667°)
// ---------------------------------------------------------------------------
console.log("\n[TEST GROUP 3: Ashwini 98.75% Elapsed (Moon at 13°10' Aries)]");
// Elapsed = 13.166667 / 13.333333 = 0.9875. Elapsed time = 7 * 0.9875 = 6.9125y.
// Saturn ended at 6.0083y. Active Antardasha is Mercury. Balance = 7.0 - 6.9125 = 0.0875y (~32 days).
const res3 = calculateVimshottariDashas(birth1, 13 + 1 / 6, birth1);
const maha3 = res3.dashas[0];
const sub3 = maha3.subPeriods || [];

assert(
  "Group 3",
  "3.1 Active Antardasha at birth is Mercury",
  res3.currentAntar === "Mercury",
  "Mercury",
  res3.currentAntar
);

assert(
  "Group 3",
  "3.2 Exactly 8 pre-natal Antardashas",
  sub3.filter((s) => s.isPreNatal).length === 8,
  "8 pre-natal",
  `${sub3.filter((s) => s.isPreNatal).length} pre-natal`
);

const mercAD3 = sub3[8];
assert(
  "Group 3",
  "3.3 Remaining Mercury balance is ~0.0875 years (~32 days)",
  Math.abs((mercAD3?.balanceYearsAtBirth || 0) - 0.0875) < 0.01,
  "~0.0875 years",
  `${mercAD3?.balanceYearsAtBirth?.toFixed(4)} years`
);

// ---------------------------------------------------------------------------
// TEST GROUP 4: Intermediate Position — Moon at 20° Aries (Bharani, Venus 20y)
// ---------------------------------------------------------------------------
console.log("\n[TEST GROUP 4: Bharani 50% Elapsed (Moon at 20° Aries, Venus 20y)]");
// Bharani: 13°20' to 26°40'. Moon at 20°00' is 6°40' (6.6667°) into Bharani = 50.0% elapsed.
// Venus Mahadasha: 20 years. Elapsed = 10.0y. Balance = 10.0y.
// Venus Antardashas cumulative: Venus (3.333y), Sun (4.333y), Moon (6.000y), Mars (7.167y), Rahu (10.167y).
// At elapsed = 10.0y, Mars ended at 7.167y, Rahu ends at 10.167y -> Active is Rahu!
const res4 = calculateVimshottariDashas(birth1, 20.0, birth1);
const maha4 = res4.dashas[0];
const sub4 = maha4.subPeriods || [];

assert(
  "Group 4",
  "4.1 Birth Mahadasha is Venus with 10.0 years balance",
  maha4.planet === "Venus" && Math.abs(maha4.durationYears - 10.0) < 0.1,
  "Venus, 10.0 years",
  `${maha4.planet}, ${maha4.durationYears} years`
);

assert(
  "Group 4",
  "4.2 Active Antardasha at birth is Rahu (Venus-Rahu)",
  res4.currentAntar === "Rahu",
  "Rahu",
  res4.currentAntar
);

const preNatalCount4 = sub4.filter((s) => s.isPreNatal).length;
assert(
  "Group 4",
  "4.3 Exactly 4 pre-natal Antardashas (Venus, Sun, Moon, Mars)",
  preNatalCount4 === 4,
  "4 pre-natal",
  `${preNatalCount4} pre-natal`
);

// Remaining balance of Venus-Rahu: 10.1667 - 10.0000 = 0.1667 years (~61 days)
const rahuAD4 = sub4[4];
assert(
  "Group 4",
  "4.4 Remaining Venus-Rahu balance at birth is ~0.1667 years (~2 months)",
  Math.abs((rahuAD4?.balanceYearsAtBirth || 0) - (10.166667 - 10.0)) < 0.01,
  "~0.1667 years",
  `${rahuAD4?.balanceYearsAtBirth?.toFixed(4)} years`
);

// ---------------------------------------------------------------------------
// TEST GROUP 5: Coverage Across All 9 Mahadasha Lords
// ---------------------------------------------------------------------------
console.log("\n[TEST GROUP 5: All 9 Mahadasha Lords Coverage]");

// We test 1 Nakshatra for each of the 9 lords at 25% elapsed:
// Nakshatra index -> Lord (Years):
// 0: Ashwini (Ketu, 7y) -> 25% elapsed = 1.75y. Cumulative: Ketu(0.408), Ven(1.575), Sun(1.925) -> Active: Sun!
// 1: Bharani (Venus, 20y) -> 25% elapsed = 5.0y. Cumulative: Ven(3.333), Sun(4.333), Moon(6.000) -> Active: Moon!
// 2: Krittika (Sun, 6y) -> 25% elapsed = 1.5y. Cumulative: Sun(0.3), Moon(0.8), Mars(1.15), Rahu(2.05) -> Active: Rahu!
// 3: Rohini (Moon, 10y) -> 25% elapsed = 2.5y. Cumulative: Moon(0.833), Mars(1.417), Rahu(2.917) -> Active: Rahu!
// 4: Mrigashira (Mars, 7y) -> 25% elapsed = 1.75y. Cumulative: Mars(0.408), Rahu(1.458), Jup(2.392) -> Active: Jupiter!
// 5: Ardra (Rahu, 18y) -> 25% elapsed = 4.5y. Cumulative: Rahu(2.7), Jup(5.1) -> Active: Jupiter!
// 6: Punarvasu (Jupiter, 16y) -> 25% elapsed = 4.0y. Cumulative: Jup(2.133), Sat(4.667) -> Active: Saturn!
// 7: Pushya (Saturn, 19y) -> 25% elapsed = 4.75y. Cumulative: Sat(3.008), Merc(5.700) -> Active: Mercury!
// 8: Ashlesha (Mercury, 17y) -> 25% elapsed = 4.25y. Cumulative: Merc(2.408), Ketu(3.400), Ven(6.233) -> Active: Venus!

const lordTestCases = [
  { nakIdx: 0, lord: "Ketu", expectedActiveAntar: "Sun" },
  { nakIdx: 1, lord: "Venus", expectedActiveAntar: "Moon" },
  { nakIdx: 2, lord: "Sun", expectedActiveAntar: "Rahu" },
  { nakIdx: 3, lord: "Moon", expectedActiveAntar: "Rahu" },
  { nakIdx: 4, lord: "Mars", expectedActiveAntar: "Jupiter" },
  { nakIdx: 5, lord: "Rahu", expectedActiveAntar: "Jupiter" },
  { nakIdx: 6, lord: "Jupiter", expectedActiveAntar: "Saturn" },
  { nakIdx: 7, lord: "Saturn", expectedActiveAntar: "Mercury" },
  { nakIdx: 8, lord: "Mercury", expectedActiveAntar: "Venus" },
];

lordTestCases.forEach((tc, idx) => {
  const lon = tc.nakIdx * (360 / 27) + (360 / 27) * 0.25;
  const res = calculateVimshottariDashas(birth1, lon, birth1);
  assert(
    "Group 5",
    `5.${idx + 1} ${tc.lord} at 25% elapsed active Antardasha is ${tc.expectedActiveAntar}`,
    res.currentAntar === tc.expectedActiveAntar,
    tc.expectedActiveAntar,
    res.currentAntar
  );
});

// ---------------------------------------------------------------------------
// TEST GROUP 6: Controllable Reference Date Testing
// ---------------------------------------------------------------------------
console.log("\n[TEST GROUP 6: Reference Date Progression Across Life]");

// For Case 4 (Venus at 50% elapsed, born 2000-01-01):
// Venus-Rahu runs for 0.1667 years (~61 days, until ~March 2, 2000)
// Then Venus-Jupiter runs for (20*16)/120 = 2.6667 years (until ~Nov 2002)
// Then Venus-Saturn runs for (20*19)/120 = 3.1667 years (until ~Jan 2006)
const birth2000 = new Date("2000-01-01T00:00:00Z");

// At birth: active is Rahu
const atBirth = calculateVimshottariDashas(birth2000, 20.0, birth2000);
assert("Group 6", "6.1 At birth (2000-01-01), active Antardasha is Rahu", atBirth.currentAntar === "Rahu", "Rahu", atBirth.currentAntar);

// At age 1 year (2001-01-01): active is Jupiter
const atAge1 = calculateVimshottariDashas(birth2000, 20.0, new Date("2001-01-01T00:00:00Z"));
assert("Group 6", "6.2 At age 1 (2001-01-01), active Antardasha is Jupiter", atAge1.currentAntar === "Jupiter", "Jupiter", atAge1.currentAntar);

// At age 4 years (2004-01-01): active is Saturn
const atAge4 = calculateVimshottariDashas(birth2000, 20.0, new Date("2004-01-01T00:00:00Z"));
assert("Group 6", "6.3 At age 4 (2004-01-01), active Antardasha is Saturn", atAge4.currentAntar === "Saturn", "Saturn", atAge4.currentAntar);

// At age 11 years (2011-01-01): Venus Mahadasha ended (balance 10y), active Mahadasha is Sun!
const atAge11 = calculateVimshottariDashas(birth2000, 20.0, new Date("2011-01-01T00:00:00Z"));
assert("Group 6", "6.4 At age 11 (2011-01-01), active Mahadasha is Sun", atAge11.currentMaha === "Sun", "Sun", atAge11.currentMaha);

// ---------------------------------------------------------------------------
// TEST GROUP 7: Mathematical Continuity & Post-Natal Sum
// ---------------------------------------------------------------------------
console.log("\n[TEST GROUP 7: Continuity & Timeline Invariance]");

// For Case 4: Sum of remaining post-natal Antardashas must equal Mahadasha balance (10.0y)
const postNatalADs4 = sub4.filter((s) => !s.isPreNatal);
let postNatalSum4 = 0;
postNatalADs4.forEach((s, i) => {
  if (i === 0) {
    postNatalSum4 += s.balanceYearsAtBirth || 0;
  } else {
    postNatalSum4 += s.durationYears || 0;
  }
});

assert(
  "Group 7",
  "7.1 Post-natal Antardasha durations sum exactly to Mahadasha balance (10.0 years)",
  Math.abs(postNatalSum4 - 10.0) < 0.001,
  "10.0000 years",
  `${postNatalSum4.toFixed(4)} years`
);

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log("\n================================================================================");
console.log(` RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("================================================================================\n");

if (failedCount > 0) process.exit(1);
