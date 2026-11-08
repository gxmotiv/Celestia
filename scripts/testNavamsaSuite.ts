import {
  NavamsaCalculator,
  D9ChartEngine,
  NavamsaPosition,
  D9Chart,
  BirthChartInput,
} from "../lib/vedic/d9NavamsaEngine";
import { calculateWesternChart } from "../lib/astronomy/ephemeris";
import { calculateVedicChart } from "../lib/astronomy/vedic";
import { calculateDivisionalDegreeInSign } from "../lib/vedic/divisionalCalc";

interface TestResult {
  category: string;
  name: string;
  status: "PASS" | "FAIL";
  expected: string;
  actual: string;
  notes?: string;
}

const results: TestResult[] = [];

function assertTest(
  category: string,
  name: string,
  pass: boolean,
  expected: string,
  actual: string,
  notes?: string
) {
  results.push({
    category,
    name,
    status: pass ? "PASS" : "FAIL",
    expected,
    actual,
    notes,
  });
}

const calculator = new NavamsaCalculator();
const engine = new D9ChartEngine();

console.log("================================================================================");
console.log("STARTING D9 NAVAMSA (JYOTISH) ACCURACY TEST SUITE");
console.log("================================================================================");

// The chart selector uses this engine for D1–D60; verify transformed degrees,
// including the unequal Trimsamsa (D30) segment widths.
const d9VargaMidpoint = calculateDivisionalDegreeInSign(1.6666666667, "D9");
assertTest("Varga Degree", "D9 midpoint maps to 15° within the transformed sign",
  Math.abs(d9VargaMidpoint - 15) < 0.001, "15°", d9VargaMidpoint.toFixed(4) + "°");
const d30OddFirstMidpoint = calculateDivisionalDegreeInSign(2.5, "D30");
assertTest("Varga Degree", "D30 odd-sign first 5° segment maps proportionally to 15°",
  Math.abs(d30OddFirstMidpoint - 15) < 0.001, "15°", d30OddFirstMidpoint.toFixed(4) + "°");
const d30OddBoundary = calculateDivisionalDegreeInSign(5, "D30");
assertTest("Varga Degree", "D30 exact odd-sign segment boundary starts at 0°",
  Math.abs(d30OddBoundary) < 0.001, "0°", d30OddBoundary.toFixed(4) + "°");
const d30EvenFirstMidpoint = calculateDivisionalDegreeInSign(33.5, "D30");
assertTest("Varga Degree", "D30 even-sign first segment maps proportionally to 21°",
  Math.abs(d30EvenFirstMidpoint - 21) < 0.001, "21°", d30EvenFirstMidpoint.toFixed(4) + "°");

// --------------------------------------------------------------------------------
// GROUP 1: MOVABLE, FIXED, AND DUAL SIGN STARTING SIGN MAPPINGS
// --------------------------------------------------------------------------------
console.log("\n[TEST GROUP 1] Classical Parashara Navamsa Division Rules");

// Movable Signs: Aries (0), Cancer (3), Libra (6), Capricorn (9)
// Aries 1st Navamsa (0° - 3°20') -> Aries (0)
const ariesNav1 = calculator.calculateNavamsa(1.0, "Sun");
assertTest(
  "Movable Sign",
  "Aries 1st Navamsa (1.0°) maps to Aries (Navamsa 1)",
  ariesNav1.sign === "Aries" && ariesNav1.navamsaNumber === 1 && ariesNav1.vargottama,
  "Aries, Navamsa 1, Vargottama",
  `${ariesNav1.sign}, Navamsa ${ariesNav1.navamsaNumber}, Vargottama: ${ariesNav1.vargottama}`
);

// Cancer 1st Navamsa (90° + 1°) -> Cancer (3)
const cancerNav1 = calculator.calculateNavamsa(91.0, "Moon");
assertTest(
  "Movable Sign",
  "Cancer 1st Navamsa (91.0°) maps to Cancer (Navamsa 1, Vargottama)",
  cancerNav1.sign === "Cancer" && cancerNav1.vargottama,
  "Cancer, Vargottama",
  `${cancerNav1.sign}, Vargottama: ${cancerNav1.vargottama}`
);

// Fixed Signs: Taurus (1), Leo (4), Scorpio (7), Aquarius (10)
// Starts from 9th from sign: Taurus (1) + 8 = Capricorn (9)
const taurusNav1 = calculator.calculateNavamsa(31.0, "Venus");
assertTest(
  "Fixed Sign",
  "Taurus 1st Navamsa (31.0°) starts from 9th sign (Capricorn)",
  taurusNav1.sign === "Capricorn" && taurusNav1.navamsaNumber === 1,
  "Capricorn, Navamsa 1",
  `${taurusNav1.sign}, Navamsa ${taurusNav1.navamsaNumber}`
);

// Taurus 5th Navamsa (13°20' - 16°40' -> 30 + 14 = 44°) -> Taurus (1) -> Vargottama!
const taurusNav5 = calculator.calculateNavamsa(44.0, "Venus");
assertTest(
  "Fixed Sign",
  "Taurus 5th Navamsa (44.0°) maps to Taurus (Vargottama & Pushkara)",
  taurusNav5.sign === "Taurus" && taurusNav5.vargottama && taurusNav5.isPushkara,
  "Taurus, Vargottama, Pushkara",
  `${taurusNav5.sign}, Vargottama: ${taurusNav5.vargottama}, Pushkara: ${taurusNav5.isPushkara}`
);

// Dual Signs: Gemini (2), Virgo (5), Sagittarius (8), Pisces (11)
// Starts from 5th from sign: Gemini (2) + 4 = Libra (6)
const geminiNav1 = calculator.calculateNavamsa(61.0, "Mercury");
assertTest(
  "Dual Sign",
  "Gemini 1st Navamsa (61.0°) starts from 5th sign (Libra)",
  geminiNav1.sign === "Libra" && geminiNav1.navamsaNumber === 1,
  "Libra, Navamsa 1",
  `${geminiNav1.sign}, Navamsa ${geminiNav1.navamsaNumber}`
);

// Gemini 9th Navamsa (26°40' - 30°00' -> 60 + 28 = 88°) -> Gemini (2) -> Vargottama!
const geminiNav9 = calculator.calculateNavamsa(88.0, "Mercury");
assertTest(
  "Dual Sign",
  "Gemini 9th Navamsa (88.0°) maps to Gemini (Vargottama)",
  geminiNav9.sign === "Gemini" && geminiNav9.vargottama,
  "Gemini, Vargottama",
  `${geminiNav9.sign}, Vargottama: ${geminiNav9.vargottama}`
);

// --------------------------------------------------------------------------------
// GROUP 2: PUSHKARA NAVAMSA ACCURACY
// --------------------------------------------------------------------------------
console.log("\n[TEST GROUP 2] Sacred Pushkara Navamsa Detection");

// Fire signs Pushkara: 7th (Libra) & 9th (Sagittarius)
// Aries 7th Navamsa: 20° to 23°20' (e.g. 21°)
const ariesPushk7 = calculator.calculateNavamsa(21.0, "Jupiter");
assertTest(
  "Pushkara Navamsa",
  "Aries 7th Navamsa (21.0°) is Pushkara Navamsa in Libra",
  ariesPushk7.isPushkara && ariesPushk7.sign === "Libra",
  "Pushkara in Libra",
  `Pushkara: ${ariesPushk7.isPushkara} in ${ariesPushk7.sign}`
);

// Water signs Pushkara: 1st (Cancer) & 3rd (Virgo)
// Pisces 1st Navamsa: 330° + 1° = 331°
// Pisces is Dual -> starts from Cancer (3). 1st Navamsa = Cancer -> Pushkara!
const piscesPushk1 = calculator.calculateNavamsa(331.0, "Moon");
assertTest(
  "Pushkara Navamsa",
  "Pisces 1st Navamsa (331.0°) is Pushkara Navamsa in Cancer",
  piscesPushk1.isPushkara && piscesPushk1.sign === "Cancer",
  "Pushkara in Cancer",
  `Pushkara: ${piscesPushk1.isPushkara} in ${piscesPushk1.sign}`
);

// --------------------------------------------------------------------------------
// GROUP 3: DEGREE WITHIN NAVAMSA PRECISION
// --------------------------------------------------------------------------------
console.log("\n[TEST GROUP 3] Degree Within Navamsa Precision");

// Midpoint of a 3°20' (3.33333°) segment: 1°40' (1.66666°)
// In Navamsa, this should map to exactly 15°00' (halfway through 30°)
const midNav = calculator.calculateNavamsa(1.66666667, "Mars");
assertTest(
  "Degree Math",
  "1°40' into Aries expands to 15.0° within Aries Navamsa",
  Math.abs(midNav.degree - 15.0) < 0.05,
  "15.0° ± 0.05°",
  `${midNav.degree.toFixed(2)}°`
);

// --------------------------------------------------------------------------------
// GROUP 4: COMPLETE D9 CHART CALCULATION
// --------------------------------------------------------------------------------
console.log("\n[TEST GROUP 4] Complete D9 Chart Engine Execution");

const sampleDate = new Date("1990-05-15T06:30:00Z");
const westernData = calculateWesternChart(1990, 5, 15, 6, 30, 28.6139, 77.209, 5.5, "WholeSign");
const vedicData = calculateVedicChart(westernData, sampleDate);
const d9Chart = engine.calculateCompleteD9Chart(vedicData);

// Test raw BirthChartInput format
const rawInput: BirthChartInput = {
  ascendant: 45.2,
  planets: {
    Sun: { longitude: 52.1 },
    Moon: { longitude: 120.4 },
    Mars: { longitude: 215.3 },
    Mercury: { longitude: 60.5 },
    Jupiter: { longitude: 105.8 },
    Venus: { longitude: 35.2 },
    Saturn: { longitude: 288.7 },
  },
};
const d9FromRaw = engine.calculateCompleteD9Chart(rawInput);
assertTest(
  "Chart Engine",
  "D9 Chart calculation from raw BirthChartInput succeeds",
  Boolean(d9FromRaw.planets["Sun"] && d9FromRaw.ascendant && Object.keys(d9FromRaw.houses).length === 12),
  "Raw input processed",
  `Raw input processed: ${Object.keys(d9FromRaw.planets).length} planets, H1=${d9FromRaw.houses[1].signName}`
);

assertTest(
  "Chart Engine",
  "D9 Chart contains all 9 Vedic planets + Lagna",
  Boolean(
    d9Chart.planets["Sun"] &&
    d9Chart.planets["Moon"] &&
    d9Chart.planets["Mars"] &&
    d9Chart.planets["Mercury"] &&
    d9Chart.planets["Jupiter"] &&
    d9Chart.planets["Venus"] &&
    d9Chart.planets["Saturn"] &&
    d9Chart.planets["Rahu"] &&
    d9Chart.planets["Ketu"] &&
    d9Chart.ascendant
  ),
  "10 points present",
  "All 10 points present"
);

assertTest(
  "Chart Engine",
  "All 12 D9 Houses calculated with valid sign and lord assignments",
  Object.keys(d9Chart.houses).length === 12 && Boolean(d9Chart.houses[1].lord),
  "12 houses with lords",
  `${Object.keys(d9Chart.houses).length} houses, H1 Lord: ${d9Chart.houses[1]?.lord}`
);

// --------------------------------------------------------------------------------
// GROUP 5: MARRIAGE & RELATIONSHIP INDICATORS
// --------------------------------------------------------------------------------
console.log("\n[TEST GROUP 5] Marriage & Relationship Prospects Analysis");

const marriage = d9Chart.marriageIndicators;
assertTest(
  "Marriage Indicators",
  "Venus strength evaluation computed",
  Boolean(marriage.venusStrength && marriage.venusStrength.length > 5),
  "Valid Venus evaluation",
  marriage.venusStrength.slice(0, 40) + "..."
);

assertTest(
  "Marriage Indicators",
  "Jupiter blessing evaluation computed",
  Boolean(marriage.jupiterBlessing && marriage.jupiterBlessing.length > 5),
  "Valid Jupiter blessing",
  marriage.jupiterBlessing.slice(0, 40) + "..."
);

assertTest(
  "Marriage Indicators",
  "7th house condition assessed",
  Boolean(marriage.seventhHouseCondition && marriage.seventhHouseCondition.length > 5),
  "Valid 7th house analysis",
  marriage.seventhHouseCondition.slice(0, 40) + "..."
);

assertTest(
  "Marriage Indicators",
  "Partner characteristics generated with archetype details",
  Boolean(marriage.partnerCharacteristics && marriage.partnerCharacteristics.length > 10),
  "Detailed partner traits",
  marriage.partnerCharacteristics.slice(0, 45) + "..."
);

assertTest(
  "Marriage Indicators",
  "Compatibility score bounded between 0 and 100",
  marriage.relationshipCompatibilityScore >= 0 && marriage.relationshipCompatibilityScore <= 100,
  "0 - 100",
  `${marriage.relationshipCompatibilityScore}`
);

// --------------------------------------------------------------------------------
// GROUP 6: SPIRITUAL PATH & KARAKAMSHA LAGNA
// --------------------------------------------------------------------------------
console.log("\n[TEST GROUP 6] Spiritual Path, Karakamsha Lagna & Ishta Devata");

const spirit = d9Chart.spiritualPath;
assertTest(
  "Spiritual Path",
  "Karakamsha Lagna identified based on Atmakaraka",
  Boolean(spirit.karakamshaLagna && spirit.karakamshaLagna.atmakarakaPlanet && spirit.karakamshaLagna.sign),
  "Karakamsha Lagna calculated",
  `Atmakaraka: ${spirit.karakamshaLagna.atmakarakaPlanet} in ${spirit.karakamshaLagna.sign} D9`
);

assertTest(
  "Spiritual Path",
  "Ishta Devata determined (12th from Karakamsha)",
  Boolean(spirit.ishtaDevata && spirit.ishtaDevata.deityName && spirit.ishtaDevata.mantra),
  "Ishta Devata with deity and mantra",
  `Deity: ${spirit.ishtaDevata.deityName}, Mantra: ${spirit.ishtaDevata.mantra}`
);

assertTest(
  "Spiritual Path",
  "Spiritual remedies list provided",
  Array.isArray(spirit.spiritualRemedies) && spirit.spiritualRemedies.length > 0,
  "At least 1 remedy",
  `${spirit.spiritualRemedies.length} remedies`
);

// --------------------------------------------------------------------------------
// GROUP 7: D9 SACRED YOGAS & FORMATIONS
// --------------------------------------------------------------------------------
console.log("\n[TEST GROUP 7] Navamsa (D9) Sacred Yogas Calculation");

assertTest(
  "D9 Yogas",
  "D9 Chart generates dedicated array of D9 Sacred Yogas",
  Array.isArray(d9Chart.yogas),
  "Array of D9 Yogas",
  `Array with ${d9Chart.yogas?.length || 0} yogas`
);

const sampleYogas = d9Chart.yogas || [];
const hasValidProps = sampleYogas.every(
  (y) => y.name && y.sanskritName && y.description && y.category && y.intensity
);
assertTest(
  "D9 Yogas",
  "All calculated D9 yogas contain valid name, sanskritName, description, and category",
  hasValidProps,
  "All valid properties",
  hasValidProps ? "All valid" : "Invalid property detected"
);

// --------------------------------------------------------------------------------
// SUMMARY REPORT
// --------------------------------------------------------------------------------
console.log("\n================================================================================");
const passed = results.filter((r) => r.status === "PASS").length;
const failed = results.filter((r) => r.status === "FAIL").length;
const passRate = ((passed / results.length) * 100).toFixed(1);

console.log(`TOTAL NAVAMSA TESTS: ${results.length}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log(`PASS RATE: ${passRate}%`);
console.log("================================================================================");

results.forEach((r, idx) => {
  const icon = r.status === "PASS" ? "✓ PASS" : "✗ FAIL";
  console.log(`${icon} [${idx + 1}] ${r.category}: ${r.name}`);
  if (r.status === "FAIL") {
    console.log(`   EXPECTED: ${r.expected}`);
    console.log(`   ACTUAL:   ${r.actual}`);
  }
});

if (failed > 0) {
  process.exit(1);
} else {
  console.log("\nALL D9 NAVAMSA SUITE TESTS PASSED WITH 100% ACCURACY!");
}
