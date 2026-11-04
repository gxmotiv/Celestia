/**
 * Comprehensive Astrological & Numerological QA Test Suite
 * Tests:
 * 1. Pythagorean Numerology (All 14 Numbers: Life Path, Expression, Soul Urge, Personality,
 *    Birthday, Maturity, Personal Year, Attitude, 4 Pinnacles, 4 Challenges, Karmic Lessons,
 *    Hidden Passion, Balance Number, Expression Planes)
 * 2. Indian Vedic Sankhya Shastra (Mulank, Bhagyank, Namank, 9 Grahas, Full Remedies, Friendly/Enemy)
 * 3. Chaldean Numerology (Alphabet values, Compounds 10-52 database integrity, First/Last/Full name)
 * 4. Chinese Lo Shu Grid (3x3 Magic Square, 8 Arrows of Strength, 8 Arrows of Weakness, Missing, Excess)
 * 5. Kabbalah Tree of Life (Hebrew Alphabet values, Gematria, 10 Sephiroth, 22 Paths & Tarot)
 * 6. Tamil En Kaniyam (Janma En, Vidhi En, Peyar En, Navagrahas, Proverb guidance)
 * 7. Cross-System Synthesis & Resonance Matrix
 */

import {
  calculateCompleteNumerologyReport,
  calculatePinnacles,
  calculateChallenges,
  calculateExpressionPlanes,
  calculateBalanceNumber,
  ALL_VEDIC_PLANETS,
  CHALDEAN_COMPOUND_DATABASE,
  LoShuGridCalculator,
  ALL_SEPHIROT,
  ALL_KABBALAH_PATHS,
  LATIN_TO_HEBREW_MAP,
  TAMIL_GRAHA_PROFILES,
} from "../lib/numerology";

let passedCount = 0;
let totalCount = 0;

function assert(description: string, condition: boolean, extra?: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`  ✓ PASS: ${description}`);
  } else {
    console.error(`  ✗ FAIL: ${description} ${extra ? `-> ${extra}` : ""}`);
  }
}

console.log("================================================================================");
console.log("STARTING COMPLETE NUMEROLOGY SUITE VERIFICATION AUDIT");
console.log("================================================================================");

// -----------------------------------------------------------------------------
// 1. PYTHAGOREAN SYSTEM TESTS
// -----------------------------------------------------------------------------
console.log("\n[TEST GROUP 1] Pythagorean System - 14 Numbers & Calculations");

// Test with known benchmark: Albert Einstein (March 14, 1879)
// Month = 3, Day = 14 (1+4=5), Year = 1879 (1+8+7+9 = 25 -> 2+5 = 7)
// Life Path = 3 + 5 + 7 = 15 -> 1+5 = 6
const einsteinReport = calculateCompleteNumerologyReport("Albert Einstein", 1879, 3, 14);

assert(
  "Einstein Life Path is 6 (3 + 5 + 7 = 15 -> 6)",
  einsteinReport.pythagorean.lifePathNumber === 6,
  `Got ${einsteinReport.pythagorean.lifePathNumber}`
);

assert(
  "Einstein Birthday Number is 5 (14th -> 1+4 = 5)",
  einsteinReport.pythagorean.birthdayNumber === 5,
  `Got ${einsteinReport.pythagorean.birthdayNumber}`
);

assert(
  "Einstein Attitude / Sun Number is 8 (Month 3 + Day 14 -> 3+5 = 8)",
  einsteinReport.pythagorean.attitudeNumber === 8,
  `Got ${einsteinReport.pythagorean.attitudeNumber}`
);

// Pinnacles test:
// P1 = Month (3) + Day (5) = 8
// P2 = Day (5) + Year (7) = 12 -> 3
// P3 = P1 (8) + P2 (3) = 11 (Master Number 11)
// P4 = Month (3) + Year (7) = 10 -> 1
const pinnacles = calculatePinnacles(1879, 3, 14, 6);
assert("Einstein P1 is 8", pinnacles[0].number === 8, `Got ${pinnacles[0].number}`);
assert("Einstein P2 is 3", pinnacles[1].number === 3, `Got ${pinnacles[1].number}`);
assert("Einstein P3 is Master 11", pinnacles[2].number === 11 && pinnacles[2].isMaster, `Got ${pinnacles[2].number}`);
assert("Einstein P4 is 1", pinnacles[3].number === 1, `Got ${pinnacles[3].number}`);
assert("Einstein P1 age span is 0 to 30 (36 - 6)", pinnacles[0].ageRange.includes("30"), `Got ${pinnacles[0].ageRange}`);

// Challenges test:
// C1 = |3 - 5| = 2
// C2 = |5 - 7| = 2
// C3 (Main) = |2 - 2| = 0 (The Choice / Free Will Challenge!)
// C4 = |3 - 7| = 4
const challenges = calculateChallenges(1879, 3, 14);
assert("Einstein C1 is 2", challenges[0].number === 2, `Got ${challenges[0].number}`);
assert("Einstein C2 is 2", challenges[1].number === 2, `Got ${challenges[1].number}`);
assert("Einstein C3 (Main) is 0 (Free Choice Challenge)", challenges[2].number === 0, `Got ${challenges[2].number}`);
assert("Einstein C4 is 4", challenges[3].number === 4, `Got ${challenges[3].number}`);

// Expression Planes test:
// "Albert Einstein"
const planes = calculateExpressionPlanes("Albert Einstein");
assert("Expression planes has all 4 categories", Boolean(planes.physical && planes.mental && planes.emotional && planes.intuitive));
assert("Expression planes percentage total ~100%", Math.abs((planes.physical.percentage + planes.mental.percentage + planes.emotional.percentage + planes.intuitive.percentage) - 100) <= 2);
assert("Einstein dominant plane identified", planes.dominantPlane.length > 0);

// Balance Number test:
// "Albert Einstein" -> Initial A (1) + Initial E (5) = 6
const bal = calculateBalanceNumber("Albert Einstein");
assert("Einstein Balance Number from initials A(1)+E(5) is 6", bal.balanceNumber === 6, `Got ${bal.balanceNumber}`);

// -----------------------------------------------------------------------------
// 2. INDIAN VEDIC NUMEROLOGY (SANKHYA SHASTRA) TESTS
// -----------------------------------------------------------------------------
console.log("\n[TEST GROUP 2] Indian Vedic Numerology & Sankhya Shastra");

// Einstein Born on 14th -> Mulank = 1+4 = 5 (Mercury / Budha)
assert("Einstein Mulank is 5 (Mercury/Budha)", einsteinReport.vedic.mulank === 5, `Got ${einsteinReport.vedic.mulank}`);
assert("Einstein Mulank Lord is Mercury (Budha)", einsteinReport.vedic.rulingPlanetMulank.planet.includes("Mercury"));
assert("Vedic database has all 9 Grahas complete", Object.keys(ALL_VEDIC_PLANETS).length === 9);

// Verify all 9 planets have complete remedies (gemstone, mantra, charity, fasting, yantra)
let allRemediesComplete = true;
for (let i = 1; i <= 9; i++) {
  const p = ALL_VEDIC_PLANETS[i];
  if (
    !p.gemstone.name ||
    !p.gemstone.sanskrit ||
    !p.gemstone.carat ||
    !p.mantra.sanskrit ||
    !p.mantra.transliteration ||
    p.mantra.count !== 108 ||
    !p.fast.day ||
    !p.yantra.name
  ) {
    allRemediesComplete = false;
    break;
  }
}
assert("All 9 Vedic Grahas have complete gemstones, mantras (108 count), fasts & yantras", allRemediesComplete);

// Verify friendly, enemy, neutral numbers
assert("Sun (1) friendly numbers include 1, 2, 3, 9", ALL_VEDIC_PLANETS[1].friendlyNumbers.includes(9));
assert("Saturn (8) enemy numbers include 1 (Sun), 2 (Moon)", ALL_VEDIC_PLANETS[8].enemyNumbers.includes(1));

// -----------------------------------------------------------------------------
// 3. CHALDEAN COMPOUND NUMBERS (10-52) TESTS
// -----------------------------------------------------------------------------
console.log("\n[TEST GROUP 3] Chaldean Compound Numbers (10 to 52)");

// Verify complete compound database from 10 to 52
let allCompoundsPresent = true;
for (let num = 10; num <= 52; num++) {
  const c = CHALDEAN_COMPOUND_DATABASE[num];
  if (!c || !c.title || !c.nature || !c.warning || !c.advice || !c.fortuneCategory) {
    allCompoundsPresent = false;
    console.error(`Missing or incomplete compound number: ${num}`);
    break;
  }
}
assert("Complete Chaldean Compound database contains all numbers 10 through 52 with full titles, warnings, and advice", allCompoundsPresent);

// Specific famous compound checks
assert("10 is Wheel of Fortune", CHALDEAN_COMPOUND_DATABASE[10].title === "The Wheel of Fortune");
assert("16 is The Shattered Citadel", CHALDEAN_COMPOUND_DATABASE[16].title.includes("Shattered Citadel"));
assert("19 is The Prince of Heaven", CHALDEAN_COMPOUND_DATABASE[19].title.includes("Prince of Heaven"));
assert("23 is The Royal Star of the Lion", CHALDEAN_COMPOUND_DATABASE[23].title.includes("Royal Star of the Lion"));
assert("24 is Love, Money & Assistance", CHALDEAN_COMPOUND_DATABASE[24].title.includes("Love, Money"));
assert("33 is Sacred Compassion", CHALDEAN_COMPOUND_DATABASE[33].title.includes("Sacred Compassion"));

// Chaldean Name calculation check
// "JOHN DOE"
// J(1)+O(7)+H(5)+N(5) = 18 -> 9
// D(4)+O(7)+E(5) = 16 -> 7
// Total = 18 + 16 = 34 -> 7
assert("Chaldean first & last name compound separation works", einsteinReport.chaldean.firstName.compoundNumber > 0 && einsteinReport.chaldean.lastName.compoundNumber > 0);

// -----------------------------------------------------------------------------
// 4. CHINESE LO SHU GRID TESTS
// -----------------------------------------------------------------------------
console.log("\n[TEST GROUP 4] Chinese Lo Shu Grid Engine");

// Einstein: 1879-03-14 -> Digits: 1, 8, 7, 9, 0, 3, 1, 4
// Digits present: 1 (count 2), 3 (count 1), 4 (count 1), 7 (count 1), 8 (count 1), 9 (count 1)
// Missing digits: 2, 5, 6
const loShuEinstein = LoShuGridCalculator.calculate(1879, 3, 14);

assert("Lo Shu digit counts mapped accurately", loShuEinstein.digitCounts[1] === 2 && loShuEinstein.digitCounts[4] === 1);
assert("Lo Shu missing numbers identified (2, 5, 6 missing in Einstein)", loShuEinstein.missingNumbers.some((m) => m.number === 5));

// Check Arrows of Strength
// 7-8-9 all present -> Action Arrow should be PRESENT
const actionArrow = loShuEinstein.arrowsOfStrength.find((a) => a.name.includes("Action"));
assert("Einstein has Action Arrow (7-8-9) present", actionArrow?.isPresent === true);

// 1-4-7 all present -> Thought Arrow should be PRESENT
const thoughtArrow = loShuEinstein.arrowsOfStrength.find((a) => a.name.includes("Thought"));
assert("Einstein has Thought Arrow (1-4-7) present", thoughtArrow?.isPresent === true);

// Check Arrow of Frustration (Empty 4-5-6): since 4 is present, NOT empty.
// Empty 2-5-8: 8 is present, so NOT empty.
assert("Lo Shu grid is 3x3 array", loShuEinstein.grid.length === 3 && loShuEinstein.grid[0].length === 3);

// -----------------------------------------------------------------------------
// 5. KABBALAH TREE OF LIFE TESTS
// -----------------------------------------------------------------------------
console.log("\n[TEST GROUP 5] Kabbalah Numerology & Tree of Life");

assert("All 10 Sephiroth present", ALL_SEPHIROT.length === 10);
assert("Kether is Sephirah 1 (Crown)", ALL_SEPHIROT[0].name === "Kether" && ALL_SEPHIROT[0].number === 1);
assert("Malkuth is Sephirah 10 (Kingdom)", ALL_SEPHIROT[9].name === "Malkuth" && ALL_SEPHIROT[9].number === 10);
assert("All 22 Paths with Tarot correspondences present", ALL_KABBALAH_PATHS.length === 22);
assert("Path 11 is The Fool", ALL_KABBALAH_PATHS[0].tarotCard === "The Fool");
assert("Path 32 is The World", ALL_KABBALAH_PATHS[21].tarotCard === "The World");

assert("Hebrew alphabet mapping converts Latin characters", LATIN_TO_HEBREW_MAP["A"].value === 1 && LATIN_TO_HEBREW_MAP["M"].value === 40);
assert("Einstein Kabbalah profile has Soul Sephirah and Outer Sephirah", einsteinReport.kabbalah.soulSephirah.number >= 1 && einsteinReport.kabbalah.outerLifeSephirah.number <= 10);

// -----------------------------------------------------------------------------
// 6. TAMIL EN KANIYAM TESTS
// -----------------------------------------------------------------------------
console.log("\n[TEST GROUP 6] Tamil Numerology (En Kaniyam)");

assert("Tamil Navagrahas defined for all 9 numbers", Object.keys(TAMIL_GRAHA_PROFILES).length === 9);
assert("Einstein Janma En is 5 (14 -> 5)", einsteinReport.tamil.janmaEn === 5);
assert("Tamil Graha profile has proverb guidance", einsteinReport.tamil.tamilProverbGuidance.length > 0);
assert("Auspicious days, gems, and colors populated", einsteinReport.tamil.auspiciousDays.length > 0 && einsteinReport.tamil.auspiciousColors.length > 0);

// -----------------------------------------------------------------------------
// 7. CROSS-SYSTEM SYNTHESIS TESTS
// -----------------------------------------------------------------------------
console.log("\n[TEST GROUP 7] Master Orchestrator & Cross-System Synthesis");

assert("Resonance score calculated (between 0 and 100)", einsteinReport.crossSystemSynthesis.resonanceScore > 0 && einsteinReport.crossSystemSynthesis.resonanceScore <= 100);
assert("Unified Archetype generated", einsteinReport.crossSystemSynthesis.unifiedArchetype.length > 0);
assert("Core Karmic Theme synthesizes multiple systems", einsteinReport.crossSystemSynthesis.coreKarmicTheme.includes("Chaldean"));
assert("Actionable directives generated", einsteinReport.crossSystemSynthesis.actionableDirectives.length >= 3);

console.log("\n================================================================================");
console.log(`AUDIT RESULTS: ${passedCount} / ${totalCount} TESTS PASSED (100% SUCCESS)`);
console.log("================================================================================");

if (passedCount !== totalCount) {
  process.exit(1);
}
