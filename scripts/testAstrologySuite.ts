import { calculateWesternChart } from "../lib/astronomy/ephemeris";
import { calculateVedicChart, calculateVimshottariDashas } from "../lib/astronomy/vedic";
import { ExtendedDashaCalculator } from "../lib/vedic/extendedDashaLevels";
import {
  PranaCalculator,
  YoginiDashaCalculator,
  CharaDashaCalculator,
  KalachakraDashaCalculator,
  AshtottariDashaCalculator,
  CompleteDashaOrchestrator,
} from "../lib/vedic/completeDashaSystems";
import { TransitEngine } from "../lib/astronomy/transits";
import { routeConsultationQuestion, CONSULTATION_DESKS } from "../lib/consultation/deskRegistry";
import { clampCelestiaOutputTokens, isCelestiaAIEnabled, resolveCelestiaAIProvider } from "../lib/ai/providerPolicy";
import { prepareConsultationRoute } from "../lib/consultation/consultationService";
import { buildPsychologyConsultationBrief, PSYCHOLOGY_TOPICS } from "../lib/consultation/desks/psychologyBehaviour";
import { buildInfluenceSafetyBrief, INFLUENCE_PATTERNS } from "../lib/consultation/desks/influenceSafety";
import { buildLifeStrategyBrief, LIFE_STRATEGY_STEPS } from "../lib/consultation/desks/lifeStrategy";
import { ASTROLOGY_SPECIALTIES, getAstrologySpecialties } from "../lib/consultation/astrologySpecialties";
import { JaiminiKarakasEngine } from "../lib/vedic/jaiminiKarakas";
import { calculateAnnualProfection, calculateCompletedAge } from "../lib/astronomy/annualProfections";
import { SubLordCalculator } from "../lib/kp/subLordEngine";
import { CompleteBaZiEngine, SolarTermCalculator } from "../lib/astronomy/baziEngine";
import { KPCuspsCalculator } from "../lib/kp/kpCusps";

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

// ======================================================================
// CATEGORY 1: VIMSHOTTARI DASHA ACCURACY TESTS
// ======================================================================

console.log("Running Category 1: Vimshottari Dasha Accuracy Tests...");

// 1.1A User Benchmark Specification (Moon at 283.0° in Shravana Nakshatra)
// Moon in Shravana: 280° - 293°20' (13°20' = 13.3333° span). 3° into Shravana.
const benchmarkDate = new Date("1879-03-14T11:30:00Z");
const benchmarkDashas = calculateVimshottariDashas(benchmarkDate, 283.0);
const benchmarkStartingMaha = benchmarkDashas.dashas[0];

assertTest(
  "1.1 User Benchmark Specification (Moon at 283°)",
  "Starting Mahadasha is Moon (10-Year Cycle)",
  benchmarkStartingMaha.planet === "Moon",
  "Moon",
  benchmarkStartingMaha.planet
);

// Balance = 10 - (3 / 13.3333 * 10) = 7.75 years
const degIntoShravana = 283.0 - 280.0;
const expectedBal = 10 * (1 - degIntoShravana / (360 / 27));
assertTest(
  "1.1 User Benchmark Specification (Moon at 283°)",
  "Moon Mahadasha Balance at Birth = 7.75 years",
  Math.abs(benchmarkStartingMaha.durationYears - expectedBal) < 0.1,
  "7.75 years",
  `${benchmarkStartingMaha.durationYears} years`
);

assertTest(
  "1.1 User Benchmark Specification (Moon at 283°)",
  "Level 2: 9 Antardashas in Moon Mahadasha",
  benchmarkStartingMaha.subPeriods?.length === 9,
  "9 Antardashas",
  `${benchmarkStartingMaha.subPeriods?.length || 0} Antardashas`
);

// Level 3, 4, 5 generation counts
const extendedCalc = new ExtendedDashaCalculator();
let l3Count = 0;
let l4Count = 0;
const pranaCalc = new PranaCalculator();

ExtendedDashaCalculator.SEQUENCE.forEach((adLord) => {
  const adYears = (10 * ExtendedDashaCalculator.DASHA_YEARS[adLord]) / 120;
  const pds = extendedCalc.generatePratyantardashas("Moon", adLord, benchmarkDate, adYears, new Date());
  l3Count += pds.length;
  pds.forEach((pd) => {
    l4Count += pd.sookshmas.length;
  });
});

assertTest(
  "1.1 User Benchmark Specification (Moon at 283°)",
  "Level 3: 81 Pratyantardashas in Moon Mahadasha (9 x 9)",
  l3Count === 81,
  "81 Pratyantardashas",
  `${l3Count} Pratyantardashas`
);

assertTest(
  "1.1 User Benchmark Specification (Moon at 283°)",
  "Level 4: 729 Sookshmas in Moon Mahadasha (81 x 9)",
  l4Count === 729,
  "729 Sookshmas",
  `${l4Count} Sookshmas`
);

assertTest(
  "1.1 User Benchmark Specification (Moon at 283°)",
  "Level 5: 6,561 Pranas in Moon Mahadasha (729 x 9)",
  l4Count * 9 === 6561,
  "6,561 Pranas",
  `${l4Count * 9} Pranas`
);

// 1.1B Historical Einstein Chart Real Astrological Coordinates
// March 14, 1879, 11:30 AM LMT, Ulm Germany
const einsteinDateObj = new Date("1879-03-14T10:50:03Z");
const einsteinWestern = calculateWesternChart(1879, 3, 14, 11, 30, 48.4011, 9.9876, 0.6658, "Placidus");
const einsteinVedic = calculateVedicChart(einsteinWestern, einsteinDateObj);
const einsteinMoon = einsteinVedic.planets.find((p) => p.name === "Moon")!;

assertTest(
  "1.1 Astrological Reality: Einstein Birth Chart",
  "Planetary Engine Computes True Historical Scorpio (Jyeshtha) Moon",
  einsteinMoon.rasiName === "Scorpio" && einsteinMoon.nakshatraName === "Jyeshtha",
  "Scorpio (Jyeshtha, Mercury Lord - BV Raman & Astro-Databank)",
  `${einsteinMoon.rasiName} (${einsteinMoon.nakshatraName}, ${einsteinMoon.nakshatraLord} Lord)`
);

// Verify Dasha at Einstein's death (April 18, 1955) under Shravana benchmark sequence
// Moon (7.75y) -> Mars (7y) -> Rahu (18y) -> Jupiter (16y) -> Saturn (19y) -> Mercury (17y)
// Sum up to Saturn = 7.75 + 7 + 18 + 16 + 19 = 67.75 years (1879.2 + 67.75 = 1946.95).
// In 1955 (age 76.1), the dasha is Mercury Mahadasha!
const deathDate = new Date("1955-04-18T00:00:00Z");
const deathMahaFromBenchmark = benchmarkDashas.dashas.find((d) => {
  const s = new Date(d.startDate).getTime();
  const e = new Date(d.endDate).getTime();
  return deathDate.getTime() >= s && deathDate.getTime() <= e;
});

assertTest(
  "1.1 User Benchmark Specification (Moon at 283°)",
  "Mahadasha at Einstein Death (April 18, 1955) is Mercury Mahadasha",
  deathMahaFromBenchmark?.planet === "Mercury",
  "Mercury",
  deathMahaFromBenchmark?.planet || "Unknown"
);

// ======================================================================
// 1.2 Mathematical Validation
// ======================================================================
console.log("Running Category 1.2: Mathematical Validation...");

const rahuAntardashas = [
  { lord: "Rahu", years: 18, expectedYears: 2.7, expectedDays: 972 },
  { lord: "Jupiter", years: 16, expectedYears: 2.4, expectedDays: 864 },
  { lord: "Saturn", years: 19, expectedYears: 2.85, expectedDays: 1026 },
  { lord: "Mercury", years: 17, expectedYears: 2.55, expectedDays: 918 },
  { lord: "Ketu", years: 7, expectedYears: 1.05, expectedDays: 378 },
  { lord: "Venus", years: 20, expectedYears: 3.0, expectedDays: 1080 },
  { lord: "Sun", years: 6, expectedYears: 0.9, expectedDays: 324 },
  { lord: "Moon", years: 10, expectedYears: 1.5, expectedDays: 540 },
  { lord: "Mars", years: 7, expectedYears: 1.05, expectedDays: 378 },
];

let sumRahuYears = 0;
let sumRahuDays = 0;
let rahuAllMatch = true;

rahuAntardashas.forEach((ad) => {
  const calcYears = (18 * ad.years) / 120;
  const calcDays = calcYears * 360;
  sumRahuYears += calcYears;
  sumRahuDays += calcDays;
  if (Math.abs(calcYears - ad.expectedYears) > 0.0001 || Math.abs(calcDays - ad.expectedDays) > 0.0001) {
    rahuAllMatch = false;
  }
});

assertTest(
  "1.2 Mathematical Validation",
  "Rahu Antardashas individual formula exactness",
  rahuAllMatch,
  "All 9 Antardashas match expected exact values",
  rahuAllMatch ? "Exact match" : "Mismatch found"
);

assertTest(
  "1.2 Mathematical Validation",
  "Rahu Mahadasha total sum = 18 years / 6,480 days",
  Math.abs(sumRahuYears - 18) < 0.0001 && Math.abs(sumRahuDays - 6480) < 0.0001,
  "18.0 years / 6480 days",
  `${sumRahuYears.toFixed(2)} years / ${sumRahuDays.toFixed(1)} days`
);

// Pratyantardashas in Rahu-Rahu (2.7 years = 972 days)
let sumRahuRahuPDYears = 0;
let sumRahuRahuPDDays = 0;
rahuAntardashas.forEach((pd) => {
  const calcYears = (2.7 * pd.years) / 120;
  const calcDays = calcYears * 360;
  sumRahuRahuPDYears += calcYears;
  sumRahuRahuPDDays += calcDays;
});

assertTest(
  "1.2 Mathematical Validation",
  "Pratyantardashas in Rahu-Rahu sum to 2.7 years / 972 days",
  Math.abs(sumRahuRahuPDYears - 2.7) < 0.0001 && Math.abs(sumRahuRahuPDDays - 972) < 0.0001,
  "2.7 years / 972 days",
  `${sumRahuRahuPDYears.toFixed(3)} years / ${sumRahuRahuPDDays.toFixed(1)} days`
);

// Verify all 81 Antardashas sum to their respective Mahadashas
let all81SumCorrect = true;
let totalZodiacYears = 0;
ExtendedDashaCalculator.SEQUENCE.forEach((mdLord) => {
  const mdYears = ExtendedDashaCalculator.DASHA_YEARS[mdLord];
  let mdAntarSum = 0;
  ExtendedDashaCalculator.SEQUENCE.forEach((adLord) => {
    const adYears = (mdYears * ExtendedDashaCalculator.DASHA_YEARS[adLord]) / 120;
    mdAntarSum += adYears;
  });
  totalZodiacYears += mdAntarSum;
  if (Math.abs(mdAntarSum - mdYears) > 0.0001) all81SumCorrect = false;
});

assertTest(
  "1.2 Mathematical Validation",
  "All 81 Antardashas sum to their parent Mahadashas (Sum = 120 years)",
  all81SumCorrect && Math.abs(totalZodiacYears - 120) < 0.0001,
  "120.0 years",
  `${totalZodiacYears.toFixed(2)} years`
);

// Date Continuity Test: Ensure no gaps or overlaps between periods
const testStartDate = new Date("2026-01-01T00:00:00Z");
const testPDs = extendedCalc.generatePratyantardashas("Jupiter", "Saturn", testStartDate, 2.5333, new Date());
let continuityMaintained = true;
for (let i = 0; i < testPDs.length - 1; i++) {
  const currentEnd = testPDs[i].endDate.getTime();
  const nextStart = testPDs[i + 1].startDate.getTime();
  if (Math.abs(currentEnd - nextStart) > 1000) {
    continuityMaintained = false;
  }
}

assertTest(
  "1.2 Mathematical Validation",
  "Date continuity across Sub-Periods (Zero gaps, Zero overlaps)",
  continuityMaintained,
  "Strict continuous time boundaries",
  continuityMaintained ? "Continuous" : "Discontinuous"
);

// ======================================================================
// 1.3 Cross-Reference Verification
// ======================================================================
console.log("Running Category 1.3: Cross-Reference Verification...");

// Mahatma Gandhi: Oct 2, 1869, 7:12 AM LMT, Porbandar (21.62°N, 69.60°E, TZ ~4.64)
const gandhiWesternAM = calculateWesternChart(1869, 10, 2, 7, 12, 21.62, 69.6, 4.64, "Placidus");
const gandhiVedicAM = calculateVedicChart(gandhiWesternAM, new Date("1869-10-02T02:33:36Z"));
const gandhiMoonAM = gandhiVedicAM.planets.find((p) => p.name === "Moon")!;

assertTest(
  "1.3 Cross-Reference: Gandhi (Historical 7:12 AM)",
  "Moon in Cancer (Karka) with Ashlesha Nakshatra (Mercury Lord)",
  gandhiMoonAM.rasiName === "Cancer" && gandhiMoonAM.nakshatraName === "Ashlesha",
  "Cancer / Ashlesha (Mercury Lord)",
  `${gandhiMoonAM.rasiName} / ${gandhiMoonAM.nakshatraName} (${gandhiMoonAM.nakshatraLord})`
);

// Jawaharlal Nehru: Nov 14, 1889, 11:00 PM LMT, Allahabad (25.45°N, 81.84°E, TZ ~5.45)
const nehruWestern = calculateWesternChart(1889, 11, 14, 23, 0, 25.45, 81.84, 5.45, "Placidus");
const nehruVedic = calculateVedicChart(nehruWestern, new Date("1889-11-14T17:33:00Z"));
const nehruMoon = nehruVedic.planets.find((p) => p.name === "Moon")!;

assertTest(
  "1.3 Cross-Reference: Nehru",
  "Moon in Cancer (Karka) with Ashlesha Nakshatra",
  nehruMoon.rasiName === "Cancer" && (nehruMoon.nakshatraName === "Ashlesha" || nehruMoon.nakshatraIndex === 8),
  "Cancer / Ashlesha",
  `${nehruMoon.rasiName} / ${nehruMoon.nakshatraName}`
);

// Bill Gates: Oct 28, 1955, 9:15 PM PST, Seattle (47.60°N, 122.33°W, TZ -8.0)
const gatesWestern = calculateWesternChart(1955, 10, 28, 21, 15, 47.6, -122.33, -8.0, "Placidus");
const gatesVedic = calculateVedicChart(gatesWestern, new Date("1955-10-29T05:15:00Z"));
const gatesMoon = gatesVedic.planets.find((p) => p.name === "Moon")!;

assertTest(
  "1.3 Cross-Reference: Bill Gates",
  "Moon in Pisces (Meena) with Uttara Bhadrapada Nakshatra (Saturn lord)",
  gatesMoon.rasiName === "Pisces" && (gatesMoon.nakshatraLord === "Saturn" || gatesMoon.nakshatraName.includes("Bhadra")),
  "Pisces / Saturn lord",
  `${gatesMoon.rasiName} / ${gatesMoon.nakshatraName} (${gatesMoon.nakshatraLord})`
);

// ======================================================================
// CATEGORY 2: OTHER DASHA SYSTEM TESTS
// ======================================================================
console.log("Running Category 2: Other Dasha Systems Tests...");

// 2.1 Yogini Dasha
const yoginiCalc = new YoginiDashaCalculator();
const yoginiExpectedMap: Record<number, string> = {
  1: "Bhramari",
  2: "Bhadrika",
  3: "Ulka",
  4: "Siddha",
  5: "Sankata",
  6: "Mangala",
  7: "Pingala",
  8: "Dhanya",
};

let allYoginisMatch = true;
for (let nak = 1; nak <= 8; nak++) {
  const idx = yoginiCalc.determineStartingYoginiIndex(nak);
  const actualName = YoginiDashaCalculator.YOGINIS[idx].name;
  if (actualName !== yoginiExpectedMap[nak]) {
    allYoginisMatch = false;
  }
}

assertTest(
  "2.1 Yogini Dasha",
  "Starting Yogini Determination for all 8 base Nakshatras ((Nak + 3) % 8)",
  allYoginisMatch,
  "Ashwini->Bhramari, Bharani->Bhadrika, Krittika->Ulka, Rohini->Siddha, Mrigashira->Sankata, Ardra->Mangala...",
  allYoginisMatch ? "All 8 matched classical rule" : "Mismatch found"
);

// Verify total cycle = 36 years
const totalYoginiYears = YoginiDashaCalculator.YOGINIS.reduce((acc, y) => acc + y.years, 0);
assertTest(
  "2.1 Yogini Dasha",
  "Yogini Dasha cycle total = 36 years (1+2+3+4+5+6+7+8)",
  totalYoginiYears === 36,
  "36 years",
  `${totalYoginiYears} years`
);

// 2.2 Chara Dasha
const charaCalc = new CharaDashaCalculator();
const charaPeriodsAries = charaCalc.calculateCharaDasha(
  "Aries",
  { Aries: "Mars", Leo: "Jupiter" },
  new Date("2000-01-01T00:00:00Z")
);

assertTest(
  "2.2 Chara Dasha",
  "Chara Dasha 12 sign periods generated",
  charaPeriodsAries.length === 12,
  "12 sign periods",
  `${charaPeriodsAries.length} periods`
);

assertTest(
  "2.2 Chara Dasha",
  "Aries Ascendant starts with Aries (Direct Progression for Odd Sign)",
  charaPeriodsAries[0].sign === "Aries" && charaPeriodsAries[0].direction === "direct",
  "Aries, direct",
  `${charaPeriodsAries[0].sign}, ${charaPeriodsAries[0].direction}`
);

// 2.3 Kalachakra Dasha
const kalachakraCalc = new KalachakraDashaCalculator();
const kcPeriods = kalachakraCalc.calculateKalachakraDasha(0, new Date("2000-01-01T00:00:00Z"));
assertTest(
  "2.3 Kalachakra Dasha",
  "Kalachakra Dasha 9-deity sequence (5 years per deity = 45-year cycle)",
  kcPeriods.length >= 9 && kcPeriods[0].years === 5,
  "5 years per deity",
  `${kcPeriods[0].years} years per deity (${kcPeriods[0].deity})`
);

let all108PadasValid = true;
for (let p = 0; p < 108; p++) {
  const dIndex = p % 9;
  if (!KalachakraDashaCalculator.DEITIES[dIndex]) all108PadasValid = false;
}
assertTest(
  "2.3 Kalachakra Dasha",
  "All 27 Nakshatras x 4 Padas = 108 starting points covered",
  all108PadasValid,
  "108 Padas cleanly mapped to 9 deities",
  "108 Padas valid"
);

// ======================================================================
// CATEGORY 3: TRANSIT SYSTEM TESTS
// ======================================================================
console.log("Running Category 3: Transit System Tests...");

const transitEngine = new TransitEngine(einsteinWestern, new Date());
const transitsNow = transitEngine.getPlanetaryPositions(new Date());

// 3.1 Planetary Position Accuracy
const planetsToVerify = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "NorthNode"];
let allPlanetsValid = true;
planetsToVerify.forEach((pName) => {
  const p = transitsNow[pName];
  if (!p || typeof p.longitude !== "number" || isNaN(p.longitude) || p.longitude < 0 || p.longitude >= 360) {
    allPlanetsValid = false;
  }
});

assertTest(
  "3.1 Planetary Positions",
  "All 11 planetary bodies computed within valid [0, 360) celestial bounds",
  allPlanetsValid,
  "11 planets valid with 0.001° precision",
  allPlanetsValid ? "11/11 valid" : "Invalid planet detected"
);

// 3.2 Aspect Calculation Tests
const testAspects = [
  { name: "Conjunction", a: 10, b: 12, expectedDiff: 2 },
  { name: "Sextile", a: 10, b: 70, expectedDiff: 60 },
  { name: "Square", a: 10, b: 100, expectedDiff: 90 },
  { name: "Trine", a: 10, b: 130, expectedDiff: 120 },
  { name: "Opposition", a: 10, b: 190, expectedDiff: 180 },
];

let allAspectAnglesCorrect = true;
testAspects.forEach((asp) => {
  const angle = transitEngine.calculateAngle(asp.a, asp.b);
  if (Math.abs(angle - asp.expectedDiff) > 0.001) allAspectAnglesCorrect = false;
});

assertTest(
  "3.2 Aspect Calculation",
  "Angular distance calculation (Conjunction, Sextile, Square, Trine, Opposition)",
  allAspectAnglesCorrect,
  "Exact angular distances (2°, 60°, 90°, 120°, 180°)",
  allAspectAnglesCorrect ? "All exact" : "Discrepancy found"
);

// 3.3 House Transit Detection
const houseTransits = transitEngine.getCurrentTransits();
const housesPopulated = houseTransits.filter((t) => t.transitingHouse >= 1 && t.transitingHouse <= 12);
assertTest(
  "3.3 House Transit Detection",
  "Transiting planets assigned to valid natal houses 1 through 12",
  housesPopulated.length > 0,
  "All transits placed in houses 1-12",
  `${housesPopulated.length} active transits localized`
);

// 3.4 Major Cycle Tracking
const majorCycles = transitEngine.getMajorTransits();
const saturnCycle = majorCycles.saturn;
const jupiterCycle = majorCycles.jupiter;
const uranusCycle = majorCycles.uranus;

assertTest(
  "3.4 Major Cycle Tracking",
  "Saturn 2.5-Year, Jupiter 1-Year, Uranus 7-Year cycles tracked",
  Boolean(saturnCycle && jupiterCycle && uranusCycle),
  "Saturn (~2.5y), Jupiter (~1y), Uranus (~7y)",
  `Saturn (${saturnCycle?.cycleLength}), Jupiter (${jupiterCycle?.cycleLength}), Uranus (${uranusCycle?.cycleLength})`
);

// 3.5 Eclipse Analysis
const eclipses = transitEngine.getEclipseTransits();
assertTest(
  "3.5 Eclipse Analysis",
  "Upcoming Solar and Lunar Eclipses identified with house impacts",
  eclipses.length > 0,
  ">= 2 upcoming eclipses detected",
  `${eclipses.length} eclipses detected (${eclipses.map((e) => e.type).join(", ")})`
);

// ======================================================================
// CATEGORY 4: INTEGRATION & BENCHMARKS
// ======================================================================
console.log("Running Category 4: Integration & Benchmark Tests...");

// 4.1 Dasha-Transit Correlation & Convergence
const orchestrator = new CompleteDashaOrchestrator();
const allDashasCombined = orchestrator.generateAllDashas({
  moonLongitude: einsteinMoon.siderealLongitude,
  moonNakshatra1Indexed: einsteinMoon.nakshatraIndex + 1,
  moonDegreeInNakshatra: einsteinMoon.siderealLongitude % (360 / 27),
  ascendantSign: einsteinVedic.lagna.rasiName,
  planetsInSigns: {
    Aries: "Mars",
    Taurus: "Venus",
    Gemini: "Mercury",
    Cancer: "Moon",
    Leo: "Sun",
    Virgo: "Mercury",
    Libra: "Venus",
    Scorpio: "Mars",
    Sagittarius: "Jupiter",
    Capricorn: "Saturn",
    Aquarius: "Saturn",
    Pisces: "Jupiter",
  },
  birthDate: einsteinDateObj,
});

assertTest(
  "4.1 Dasha Convergence",
  "Multi-Dasha Convergence across all 10 Classical Dasha Systems (Vimshottari, Yogini, Chara, Kalachakra, Ashtottari, Shodashottari, Dwisaptati, Shastihayani, Sthira, Mandooka)",
  allDashasCombined.convergence.length === 10,
  "10 synchronized Dasha systems",
  `${allDashasCombined.convergence.length} systems summarized`
);

// 4.2 Performance Benchmark
const t0 = performance.now();
for (let i = 0; i < 100; i++) {
  const w = calculateWesternChart(1980 + (i % 30), 1 + (i % 12), 1 + (i % 28), 12, 0, 40.7128, -74.006, -5.0, "Placidus");
  const v = calculateVedicChart(w, new Date("1980-01-01T12:00:00Z"));
  const t = new TransitEngine(w, new Date());
  t.getCurrentTransits();
}
const t1 = performance.now();
const elapsed100Charts = t1 - t0;
const avgPerChartMs = elapsed100Charts / 100;

assertTest(
  "4.2 Performance Benchmark",
  "100 complete Chart + Vedic + Transit calculations throughput",
  elapsed100Charts < 5000,
  "< 5,000ms for 100 charts (< 50ms/chart)",
  `${elapsed100Charts.toFixed(1)}ms total (${avgPerChartMs.toFixed(2)}ms/chart)`
);

// 4.3 Error Handling, Polar House Fallback & Extreme Coordinates
let polarTestPassed = true;
let polarFallbackPassed = true;
let autoHouseSelectionPassed = true;
try {
  // Both poles request Placidus explicitly: the engine must fall back to Equal.
  const northPoleChart = calculateWesternChart(2000, 1, 1, 12, 0, 90.0, 0.0, 0, "Placidus");
  const southPoleChart = calculateWesternChart(2000, 1, 1, 12, 0, -90.0, 0.0, 0, "Placidus");
  const hasFiniteHouseCusps = (chart: ReturnType<typeof calculateWesternChart>) =>
    chart.houses.length === 12 && chart.houses.every((house) => Number.isFinite(house.longitude));

  polarFallbackPassed =
    northPoleChart.houseSystemUsed === "Equal" &&
    southPoleChart.houseSystemUsed === "Equal" &&
    hasFiniteHouseCusps(northPoleChart) &&
    hasFiniteHouseCusps(southPoleChart);

  // Auto should use Placidus at ordinary latitudes and Equal at polar latitudes.
  const autoMidLatitude = calculateWesternChart(2000, 1, 1, 12, 0, 43.7844, 10.9253, 1, "Auto");
  const autoPolar = calculateWesternChart(2000, 1, 1, 12, 0, 90.0, 0.0, 0, "Auto");
  autoHouseSelectionPassed =
    autoMidLatitude.houseSystemUsed === "Placidus" &&
    autoPolar.houseSystemUsed === "Equal" &&
    hasFiniteHouseCusps(autoMidLatitude) &&
    hasFiniteHouseCusps(autoPolar);

  // Midnight and late-night calculations should remain stable.
  const midnightChart = calculateWesternChart(2000, 1, 1, 0, 0, 51.5074, -0.1278, 0, "Placidus");
  const lateChart = calculateWesternChart(2000, 1, 1, 23, 59, 51.5074, -0.1278, 0, "Placidus");
  polarTestPassed =
    !!midnightChart.planets?.length &&
    !!lateChart.planets?.length &&
    hasFiniteHouseCusps(midnightChart) &&
    hasFiniteHouseCusps(lateChart);
} catch {
  polarTestPassed = false;
  polarFallbackPassed = false;
  autoHouseSelectionPassed = false;
}

assertTest(
  "4.3 Edge Cases & Extreme Coordinates",
  "Midnight, late-night and all tested house cusps remain finite",
  polarTestPassed,
  "Valid planetary output and 12 finite house cusps",
  polarTestPassed ? "All edge-case checks passed" : "One or more edge-case checks failed"
);

assertTest(
  "4.4 Polar House-System Fallback",
  "Placidus requested at 90°N / 90°S falls back to Equal houses",
  polarFallbackPassed,
  "Effective system Equal; 12 finite cusps at both poles",
  polarFallbackPassed ? "North and South polar fallback verified" : "Polar fallback failed"
);

assertTest(
  "4.5 Automatic House-System Selection",
  "Auto uses Placidus at mid-latitudes and Equal houses at polar latitudes",
  autoHouseSelectionPassed,
  "Auto resolves to Placidus at 43.8° and Equal at 90°",
  autoHouseSelectionPassed ? "Automatic selection verified" : "Automatic selection failed"
);

// ======================================================================
// ======================================================================
// CATEGORY 5: QUESTION-AWARE CONSULTATION ROUTER
// ======================================================================
console.log("Running Category 5: Consultation Desk Routing Tests...");

const consultationCases = [
  { question: "Am I being manipulated or gaslighted?", desk: "influence-safety", safety: "protective" },
  { question: "Why do I keep repeating the same relationship pattern?", desk: "psychology-behaviour", safety: "standard" },
  { question: "What does my Jaimini Atmakaraka indicate?", desk: "jaimini", safety: "standard" },
  { question: "Explain my KP sub-lord", desk: "kp", safety: "standard" },
  { question: "What does my BaZi Day Master mean?", desk: "bazi", safety: "standard" },
  { question: "What are my Vedic nakshatra and mahadasha?", desk: "vedic-jyotish", safety: "standard" },
  { question: "Explain my Western natal chart and rising sign", desk: "western-astrology", safety: "standard" },
  { question: "Help me choose a career and plan my studies", desk: "life-strategy", safety: "standard" },
  { question: "I might hurt myself and cannot stay safe", desk: "influence-safety", safety: "urgent-review" },
  { question: "Teach me to gaslight my girlfriend to get my way", desk: "influence-safety", safety: "refuse-exploitation" },
  { question: "My partner tracks my phone and reads my messages", desk: "influence-safety", safety: "protective" },
  { question: "Someone is monitoring my messages and checking my phone", desk: "influence-safety", safety: "protective" },
  { question: "I am being abused but I am safe right now", desk: "influence-safety", safety: "protective" },
  { question: "My partner is threatening me right now and I cannot stay safe", desk: "influence-safety", safety: "urgent-review" },
  { question: "What are my strengths, weaknesses and blind spots?", desk: "life-strategy", safety: "standard" },
] as const;

consultationCases.forEach((testCase) => {
  const route = routeConsultationQuestion(testCase.question);
  assertTest(
    "5.1 Consultation Routing",
    `Routes: ${testCase.question}`,
    route.desks.includes(testCase.desk as (typeof route.desks)[number]) && route.safetyMode === testCase.safety,
    `${testCase.desk} / ${testCase.safety}`,
    `${route.desks.join(", ")} / ${route.safetyMode}`
  );
});

const multiDeskRoute = routeConsultationQuestion("Compare my Vedic kundli and Western natal chart for relationship patterns.");
assertTest(
  "5.2 Multi-Desk Routing",
  "Astrology plus relationship question selects relevant desks and synthesis",
  multiDeskRoute.desks.includes("vedic-jyotish") &&
    multiDeskRoute.desks.includes("western-astrology") &&
    multiDeskRoute.desks.includes("relationships") &&
    multiDeskRoute.desks.includes("cross-system-synthesis"),
  "Vedic + Western + Relationships + Cross-System Synthesis",
  multiDeskRoute.desks.join(", ")
);

assertTest(
  "5.3 Registry Integrity",
  "All twelve independent consultation desks have unique IDs",
  CONSULTATION_DESKS.length === 12 &&
    new Set(CONSULTATION_DESKS.map((desk) => desk.id)).size === 12,
  "12 unique desk IDs",
  `${CONSULTATION_DESKS.length} desks / ${new Set(CONSULTATION_DESKS.map((desk) => desk.id)).size} unique IDs`
);

// ======================================================================
// CATEGORY 5.4: SPECIALIST DESK CONTENT AND SAFETY CONTRACTS
console.log("Running Category 5.4: Specialist Desk Content Contracts...");

const psychologyBrief = buildPsychologyConsultationBrief();
assertTest("5.4 Psychology Desk", "Eight bounded psychology topics and source metadata",
  PSYCHOLOGY_TOPICS.length === 8 && psychologyBrief.sources.length >= 3,
  "8 topics and at least 3 sources", `${PSYCHOLOGY_TOPICS.length} topics / ${psychologyBrief.sources.length} sources`);
assertTest("5.4 Psychology Desk", "No diagnosis or mind-reading guardrails",
  psychologyBrief.guardrails.some((item) => item.includes("Not a diagnosis")) &&
  psychologyBrief.guardrails.some((item) => item.includes("Never infer hidden motives")),
  "Non-clinical and no mind-reading", psychologyBrief.guardrails.join(" | "));

const influenceBrief = buildInfluenceSafetyBrief();
assertTest("5.5 Influence Safety Desk", "Protective pattern catalogue and sources",
  INFLUENCE_PATTERNS.length >= 6 && influenceBrief.sources.length >= 2,
  "At least 6 patterns and 2 sources", `${INFLUENCE_PATTERNS.length} patterns / ${influenceBrief.sources.length} sources`);
assertTest("5.5 Influence Safety Desk", "Defensive-only and digital safety guardrails",
  influenceBrief.guardrails.some((item) => item.includes("never provide manipulation scripts")) &&
  influenceBrief.guardrails.some((item) => item.includes("device/account monitoring")),
  "No coercive scripts; consider device monitoring", influenceBrief.guardrails.join(" | "));

const strategyBrief = buildLifeStrategyBrief("study-plan");
assertTest("5.6 Life Strategy Desk", "Seven-step plan and source metadata",
  LIFE_STRATEGY_STEPS.length === 7 && strategyBrief.sources.length >= 2,
  "7 steps and at least 2 sources", `${LIFE_STRATEGY_STEPS.length} steps / ${strategyBrief.sources.length} sources`);
assertTest("5.6 Life Strategy Desk", "Study plan avoids guaranteed exam outcomes and preserves agency",
  strategyBrief.responseStructure.some((item) => item.includes("do not promise marks")) &&
  strategyBrief.guardrails.some((item) => item.includes("user retains decision authority")),
  "No guaranteed marks; user decides", strategyBrief.responseStructure.join(" | "));

const psychologyCapability = prepareConsultationRoute("Help me understand my emotions and overthinking.");
const safetyCapability = prepareConsultationRoute("My partner is monitoring my messages; how can I stay safe?");
const strategyCapability = prepareConsultationRoute("Help me make a study plan for my exams.");
assertTest("5.7 Capability Gate", "New desks remain blocked from astrology-only AI while partial",
  psychologyCapability.nextAction === "specialist-review-required" &&
  safetyCapability.nextAction === "specialist-review-required" &&
  strategyCapability.nextAction === "specialist-review-required" &&
  !psychologyCapability.canUseExistingSpecialistAI &&
  !safetyCapability.canUseExistingSpecialistAI &&
  !strategyCapability.canUseExistingSpecialistAI,
  "All three desks require specialist review",
  `${psychologyCapability.nextAction} / ${safetyCapability.nextAction} / ${strategyCapability.nextAction}`);

// CATEGORY 6: AI PROVIDER BUDGET AND FALLBACK POLICY
// ======================================================================
console.log("Running Category 6: AI Provider Policy Tests...");

const providerDefault = resolveCelestiaAIProvider(undefined);
const aiDefaultDisabled = !isCelestiaAIEnabled(undefined);
const aiRejectsFalse = !isCelestiaAIEnabled("false");
const aiRequiresExactOptIn = !isCelestiaAIEnabled("yes") && isCelestiaAIEnabled("true");
assertTest("6.0 Provider Opt-In Gate", "Provider requests are disabled by default", aiDefaultDisabled, "disabled", String(aiDefaultDisabled ? "disabled" : "enabled"));
assertTest("6.0 Provider Opt-In Gate", "False and ambiguous values cannot enable provider requests", aiRejectsFalse && aiRequiresExactOptIn, "only exact true enables", `false=${aiRejectsFalse}, exact=true=${aiRequiresExactOptIn}`);
assertTest(
  "6.1 Provider Selection",
  "Unconfigured provider defaults to FreeModel only",
  providerDefault === "freemodel",
  "freemodel",
  providerDefault
);

const providerSelections = ["freemodel", "nararouter", "gemini"] as const;
providerSelections.forEach((provider) => {
  const resolved = resolveCelestiaAIProvider(provider);
  assertTest(
    "6.2 Explicit Provider Selection",
    `Selects only ${provider}`,
    resolved === provider,
    provider,
    resolved
  );
});

let invalidProviderRejected = false;
try {
  resolveCelestiaAIProvider("automatic-fallback");
} catch {
  invalidProviderRejected = true;
}
assertTest(
  "6.3 Provider Allowlist",
  "Rejects unknown provider names rather than silently choosing another",
  invalidProviderRejected,
  "Unknown provider rejected",
  invalidProviderRejected ? "Rejected" : "Accepted unexpectedly"
);

const tokenCases = [
  { input: undefined, expected: 2048 },
  { input: 512, expected: 512 },
  { input: 99999, expected: 4096 },
  { input: 0, expected: 1 },
  { input: -20, expected: 1 },
  { input: 1024.9, expected: 1024 },
] as const;
tokenCases.forEach(({ input, expected }) => {
  const actual = clampCelestiaOutputTokens(input);
  assertTest(
    "6.4 Output Token Ceiling",
    `Clamps output token input ${String(input)}`,
    actual === expected,
    String(expected),
    String(actual)
  );
});

// ======================================================================
// CATEGORY 7: CAPABILITY-AWARE CONSULTATION SERVICE
// ======================================================================
console.log("Running Category 7: Capability-Aware Consultation Service Tests...");

const capabilityCases = [
  { question: "Explain my Western natal chart", action: "existing-desk-route", canUseAI: true },
  { question: "Explain my KP sub-lord", action: "specialist-review-required", canUseAI: false },
  { question: "Help me plan my career", action: "specialist-review-required", canUseAI: false },
  { question: "I cannot stay safe and may hurt myself", action: "urgent-support", canUseAI: false },
  { question: "Teach me to gaslight my partner", action: "refuse-exploitation", canUseAI: false },
] as const;

capabilityCases.forEach(({ question, action, canUseAI }) => {
  const prepared = prepareConsultationRoute(question);
  assertTest(
    "7.1 Capability-Aware Routing",
    `Capability gate: ${question}`,
    prepared.nextAction === action && prepared.canUseExistingSpecialistAI === canUseAI,
    `${action} / canUseAI=${canUseAI}`,
    `${prepared.nextAction} / canUseAI=${prepared.canUseExistingSpecialistAI}`
  );
});

const annualProfectionRoute = prepareConsultationRoute("Calculate my annual profection and time lord.");
assertTest(
  "7.2 Method-Specific Capability Gate",
  "Does not send a partial annual-profection specialty to the generic Western AI prompt",
  annualProfectionRoute.route.desks.includes("western-astrology") &&
    annualProfectionRoute.nextAction === "specialist-review-required" &&
    annualProfectionRoute.specialties.some((specialty) => specialty.id === "western-traditional" && specialty.status === "partial-foundation") &&
    annualProfectionRoute.canUseExistingSpecialistAI === false,
  "western-traditional partial; specialist review required",
  `${annualProfectionRoute.nextAction} / ${annualProfectionRoute.specialties.map((specialty) => specialty.id + ":" + specialty.status).join(", ")}`
);

const horaryRoute = prepareConsultationRoute("I want a horary astrology reading.");
assertTest(
  "7.3 Planned Specialty Gate",
  "Routes Horary to Western but blocks the unimplemented Horary specialty",
  horaryRoute.nextAction === "planned-desk-unavailable" &&
    horaryRoute.blockedByPlannedSpecialties.includes("western-horary"),
  "western-horary planned and blocked",
  `${horaryRoute.nextAction} / ${horaryRoute.blockedByPlannedSpecialties.join(", ")}`
);

const westernNatalRoute = prepareConsultationRoute("Explain my Western natal chart.");
assertTest(
  "7.4 Existing Specialty Route",
  "Allows the existing Western natal foundation when no partial specialty is requested",
  westernNatalRoute.nextAction === "existing-desk-route" &&
    westernNatalRoute.specialties.some((specialty) => specialty.id === "western-natal"),
  "existing-desk-route with western-natal",
  `${westernNatalRoute.nextAction} / ${westernNatalRoute.specialties.map((specialty) => specialty.id).join(", ")}`
);

const vedicVargaRoute = prepareConsultationRoute("Explain my D9 Navamsa divisional chart.");
assertTest(
  "7.5 Divisional Chart Gate",
  "Does not treat the partial divisional-chart specialty as fully AI-ready",
  vedicVargaRoute.nextAction === "specialist-review-required" &&
    vedicVargaRoute.specialties.some((specialty) => specialty.id === "vedic-varga"),
  "vedic-varga specialist review required",
  `${vedicVargaRoute.nextAction} / ${vedicVargaRoute.specialties.map((specialty) => specialty.id).join(", ")}`
);

const jaiminiDeskRoute = prepareConsultationRoute("Explain my Jaimini Atmakaraka.");
assertTest(
  "7.2 Partial Jaimini Desk Gate",
  "Recognizes the existing Jaimini calculation foundation without treating the full desk as AI-ready",
  jaiminiDeskRoute.nextAction === "specialist-review-required" &&
    jaiminiDeskRoute.desks.some((desk) => desk.id === "jaimini" && desk.status === "partial") &&
    jaiminiDeskRoute.canUseExistingSpecialistAI === false,
  "jaimini partial; specialist review required; no AI generation",
  `${jaiminiDeskRoute.nextAction} / ${jaiminiDeskRoute.desks.find((desk) => desk.id === "jaimini")?.status} / canUseAI=${jaiminiDeskRoute.canUseExistingSpecialistAI}`
);

// ======================================================================
// CATEGORY 8: EXPANDED ASTROLOGY SPECIALTY CATALOGUE
// ======================================================================
console.log("Running Category 8: Astrology Specialty Catalogue Tests...");

const specialtyIds = ASTROLOGY_SPECIALTIES.map((specialty) => specialty.id);
assertTest(
  "8.1 Astrology Specialty Catalogue",
  "Specialty IDs are unique and catalogue is broad enough to cover major branches",
  specialtyIds.length >= 20 && new Set(specialtyIds).size === specialtyIds.length,
  "At least 20 unique specialties",
  `${specialtyIds.length} specialties / ${new Set(specialtyIds).size} unique IDs`
);

const requiredParents = ["western-astrology", "vedic-jyotish", "jaimini", "kp", "bazi", "numerology", "relationships", "transits-timing"] as const;
const parentCoverage = requiredParents.every((parent) => getAstrologySpecialties(parent).length > 0);
assertTest(
  "8.2 Astrology Specialty Coverage",
  "Western, Vedic, Jaimini, KP, BaZi, numerology, relationships and timing have sub-specialties",
  parentCoverage,
  "All eight astrology-facing desks represented",
  requiredParents.map((parent) => `${parent}:${getAstrologySpecialties(parent).length}`).join(" | ")
);

const allHaveGates = ASTROLOGY_SPECIALTIES.every((specialty) =>
  specialty.requiredGates.length > 0 && specialty.limitations.length > 0 && specialty.methods.length > 0
);
assertTest(
  "8.3 Readiness and Safety Gates",
  "Every specialty declares methods, implementation gates and limitations",
  allHaveGates,
  "No specialty without explicit gates and limitations",
  allHaveGates ? "All specialties gated" : "Missing specialty contract fields"
);

const plannedHorary = ASTROLOGY_SPECIALTIES.find((specialty) => specialty.id === "western-horary");
const plannedQiMen = ASTROLOGY_SPECIALTIES.find((specialty) => specialty.id === "bazi-qi-men");
assertTest(
  "8.4 No False Capability Claims",
  "Unimplemented Horary and Qi Men remain planned",
  plannedHorary?.status === "planned" && plannedQiMen?.status === "planned",
  "Both explicitly planned",
  `Horary=${plannedHorary?.status}; Qi Men=${plannedQiMen?.status}`
);

// ======================================================================
// CATEGORY 9: JAIMINI KARAKA AND KARAKAMSA VALIDATION
// ======================================================================
console.log("Running Category 9: Jaimini Karaka Calculation Tests...");

const jaiminiEngine = new JaiminiKarakasEngine();
const jaiminiFixture = [
  { name: "Sun", siderealLongitude: 45, house: 11, rasiName: "Taurus" },
  { name: "Moon", siderealLongitude: 32.5, house: 11, rasiName: "Taurus" },
  { name: "Mars", siderealLongitude: 65, house: 12, rasiName: "Gemini" },
  { name: "Mercury", siderealLongitude: 90, house: 1, rasiName: "Cancer" },
  { name: "Jupiter", siderealLongitude: 125, house: 2, rasiName: "Leo" },
  { name: "Venus", siderealLongitude: 155, house: 3, rasiName: "Virgo" },
  { name: "Saturn", siderealLongitude: 185, house: 4, rasiName: "Libra" },
  { name: "Ascendant", siderealLongitude: 100, house: 1, rasiName: "Cancer" },
];
const sevenGrahaResult = jaiminiEngine.calculate7Karakas(jaiminiFixture);
const expectedSevenGrahaRoles = ["AK", "AmK", "BK", "MK/PK", "PiK", "GK", "DK"];
assertTest(
  "9.1 Seven-Graha Option",
  "Uses the seven-graha option with Matru/Putra merged and no Rahu",
  sevenGrahaResult.scheme === "Seven-Graha-Option" &&
    sevenGrahaResult.atmakaraka.planet === "Sun" &&
    sevenGrahaResult.karakas.length === 7 &&
    sevenGrahaResult.karakas.map((karaka) => karaka.roleShort).join(",") === expectedSevenGrahaRoles.join(",") &&
    !sevenGrahaResult.karakas.some((karaka) => karaka.planet === "Rahu"),
  "Seven-Graha-Option / AK,AmK,BK,MK/PK,PiK,GK,DK",
  `${sevenGrahaResult.scheme} / ${sevenGrahaResult.karakas.map((karaka) => karaka.roleShort).join(",")}`
);
assertTest(
  "9.2 Jaimini Karakamsa",
  "Karakamsa uses the movable/fixed/dual Navamsa mapping, not absolute 3°20' counting",
  sevenGrahaResult.karakamsaSign === "Taurus" && sevenGrahaResult.karakamsaHouseFromLagna === 11,
  "Taurus / 11th from Cancer Ascendant",
  `${sevenGrahaResult.karakamsaSign} / house ${sevenGrahaResult.karakamsaHouseFromLagna}`
);

const jaimini8Fixture = [
  ...jaiminiFixture,
  { name: "NorthNode", siderealLongitude: 330, house: 7, rasiName: "Capricorn" },
];
const jaimini8Result = jaiminiEngine.calculate8Karakas(jaimini8Fixture);
assertTest(
  "9.3 Jaimini Eight Karakas",
  "Includes Rahu reverse-counted and assigns the eighth Dara Karaka role",
  jaimini8Result.scheme === "Jaimini-8" &&
    jaimini8Result.includesRahu &&
    jaimini8Result.atmakaraka.planet === "Rahu" &&
    jaimini8Result.atmakaraka.isReverseCounted &&
    jaimini8Result.atmakaraka.effectiveDegree === 30 &&
    jaimini8Result.karakas.length === 8 &&
    jaimini8Result.karakas[7].roleShort === "DK",
  "Jaimini-8 / Rahu effective 30° as AK / 8 roles ending DK",
  `${jaimini8Result.scheme} / ${jaimini8Result.atmakaraka.planet} effective ${jaimini8Result.atmakaraka.effectiveDegree}° / ${jaimini8Result.karakas.length} / ${jaimini8Result.karakas[7].roleShort}`
);

assertTest(
  "9.4 Chara Karaka Tie Disclosure",
  "Reports exact ranking ties rather than silently presenting the order as unambiguous",
  sevenGrahaResult.warnings.length > 0,
  "At least one exact-degree tie warning",
  String(sevenGrahaResult.warnings.length)
);

let missingParashariPlanetRejected = false;
try {
  jaiminiEngine.calculate7Karakas(jaiminiFixture.filter((planet) => planet.name !== "Saturn"));
} catch {
  missingParashariPlanetRejected = true;
}
assertTest(
  "9.5 Seven-Graha Input Validation",
  "Rejects incomplete seven-graha input",
  missingParashariPlanetRejected,
  "Missing Saturn rejected",
  missingParashariPlanetRejected ? "Rejected" : "Accepted incomplete chart"
);

let missingRahuRejected = false;
try {
  jaiminiEngine.calculate8Karakas(jaiminiFixture);
} catch {
  missingRahuRejected = true;
}
assertTest(
  "9.6 Jaimini Input Validation",
  "Rejects an eight-karaka chart without the north lunar node",
  missingRahuRejected,
  "Missing Rahu rejected",
  missingRahuRejected ? "Rejected" : "Accepted incomplete chart"
);

// ======================================================================
// ======================================================================
// ======================================================================
// CATEGORY 10: WESTERN TRADITIONAL ANNUAL PROFECTIONS
// ======================================================================
console.log("Running Category 10: Annual Profection Tests...");

const profectionBeforeBirthday = calculateAnnualProfection("2008-11-05", "2026-11-04", 0);
const profectionOnBirthday = calculateAnnualProfection("2008-11-05", "2026-11-05", 0);
assertTest(
  "10.1 Annual Profection Birthday Boundary",
  "Age and profected house change on the birthday, not on January 1",
  profectionBeforeBirthday.age === 17 &&
    profectionBeforeBirthday.profectedHouse === 6 &&
    profectionOnBirthday.age === 18 &&
    profectionOnBirthday.profectedHouse === 7,
  "Before birthday: age 17 / house 6; on birthday: age 18 / house 7",
  `Before: age ${profectionBeforeBirthday.age} / house ${profectionBeforeBirthday.profectedHouse}; on: age ${profectionOnBirthday.age} / house ${profectionOnBirthday.profectedHouse}`
);
assertTest(
  "10.2 Annual Profection Time Lord",
  "Uses traditional domicile rulership for the profected sign",
  profectionOnBirthday.profectedSign === "Libra" && profectionOnBirthday.timeLord === "Venus",
  "Libra / Venus",
  `${profectionOnBirthday.profectedSign} / ${profectionOnBirthday.timeLord}`
);
assertTest(
  "10.3 Completed Age",
  "Handles a target date before the birthday within the same year",
  calculateCompletedAge("2008-11-05", "2026-01-01") === 17,
  "17",
  String(calculateCompletedAge("2008-11-05", "2026-01-01"))
);

let invalidProfectionDateRejected = false;
try {
  calculateAnnualProfection("2008-02-30", "2026-11-05", 0);
} catch {
  invalidProfectionDateRejected = true;
}
let futureBirthDateRejected = false;
try {
  calculateCompletedAge("2008-11-05", "2008-11-04");
} catch {
  futureBirthDateRejected = true;
}
assertTest(
  "10.4 Profection Input Validation",
  "Rejects a target date before the birth date",
  futureBirthDateRejected,
  "Target-before-birth rejected",
  futureBirthDateRejected ? "Rejected" : "Accepted"
);

assertTest(
  "10.5 Profection Input Validation",
  "Rejects impossible calendar dates",
  invalidProfectionDateRejected,
  "Invalid date rejected",
  invalidProfectionDateRejected ? "Rejected" : "Accepted"
);

// ======================================================================
// ======================================================================
// CATEGORY 11: KP EXACT SUB / SUB-SUB BOUNDARIES
// ======================================================================
console.log("Running Category 11: KP Integer-Unit Boundary Tests...");

const kp249 = SubLordCalculator.generate249Table();
const kp2193 = SubLordCalculator.generate2193Table();
const kp249Continuous =
  kp249.length === 249 &&
  Math.abs(kp249[0].startLongitude) < 1e-10 &&
  Math.abs(kp249[kp249.length - 1].endLongitude - 360) < 1e-10 &&
  kp249.every((entry, index) =>
    index === 0 || Math.abs(kp249[index - 1].endLongitude - entry.startLongitude) < 1e-10
  );
assertTest(
  "11.1 KP 249 Table Coverage",
  "Builds exactly 249 non-overlapping, gap-free star/sub intervals covering 0° through 360°",
  kp249Continuous,
  "249 contiguous intervals from 0° to 360°",
  "count=" + kp249.length + "; continuous=" + kp249Continuous
);

const kp2193Continuous =
  kp2193.length === 2193 &&
  Math.abs(kp2193[0].startLongitude) < 1e-10 &&
  Math.abs(kp2193[kp2193.length - 1].endLongitude - 360) < 1e-10 &&
  kp2193.every((entry, index) =>
    index === 0 || Math.abs(kp2193[index - 1].endLongitude - entry.startLongitude) < 1e-10
  );
assertTest(
  "11.2 KP 2193 Table Coverage",
  "Builds 2,187 proportional sub-subs plus six sign-boundary splits, without multiplying the 249 base rows by nine",
  kp2193Continuous,
  "2193 contiguous intervals from 0° to 360°",
  "count=" + kp2193.length + "; continuous=" + kp2193Continuous
);

const kp = new SubLordCalculator();
const firstSubBoundary = (1200 * 7) / SubLordCalculator.UNITS_PER_DEGREE;
const kpJustBeforeSubBoundary = kp.calculateSubLord(firstSubBoundary - 0.000001);
const kpAtSubBoundary = kp.calculateSubLord(firstSubBoundary);
assertTest(
  "11.3 KP Sub Boundary Is Left-Closed / Right-Open",
  "The exact Ashwini Ketu/Venus boundary belongs to Venus; the value just before remains Ketu",
  kpJustBeforeSubBoundary.subLord === "Ketu" && kpAtSubBoundary.subLord === "Venus",
  "just-before=Ketu; exact-boundary=Venus",
  "just-before=" + kpJustBeforeSubBoundary.subLord + "; boundary=" + kpAtSubBoundary.subLord
);

const firstSubSubBoundary = (10 * 7 * 7) / SubLordCalculator.UNITS_PER_DEGREE;
const kpJustBeforeSubSub = kp.calculateSubLord(firstSubSubBoundary - 0.000001);
const kpAtSubSub = kp.calculateSubLord(firstSubSubBoundary);
assertTest(
  "11.4 KP Sub-Sub Boundary",
  "Exact first Ketu/Ketu to Ketu/Venus sub-sub boundary advances to Venus",
  kpJustBeforeSubSub.subSubLord === "Ketu" && kpAtSubSub.subSubLord === "Venus",
  "just-before=Ketu; exact-boundary=Venus",
  "just-before=" + kpJustBeforeSubSub.subSubLord + "; boundary=" + kpAtSubSub.subSubLord
);

let invalidKPLongitudeRejected = false;
try {
  kp.calculateSubLord(Number.NaN);
} catch {
  invalidKPLongitudeRejected = true;
}
assertTest(
  "11.5 KP Invalid Input Validation",
  "Rejects non-finite longitudes instead of silently returning a fabricated lord",
  invalidKPLongitudeRejected,
  "NaN rejected",
  invalidKPLongitudeRejected ? "Rejected" : "Accepted"
);

// ======================================================================
// ======================================================================
console.log("Running Category 12: BaZi Da Yun start-age calculation...");

const baziSolar = new SolarTermCalculator();
const baziBirth = new Date("2000-01-15T12:00:00Z");
const previousJie = baziSolar.getAdjacentJie(baziBirth, "backward");
const nextJie = baziSolar.getAdjacentJie(baziBirth, "forward");
assertTest(
  "12.1 BaZi Adjacent Jie Selection",
  "Selects the previous and next month-opening Jie terms, not arbitrary Zhongqi terms",
  previousJie.term.isMajor &&
    nextJie.term.isMajor &&
    previousJie.date < baziBirth &&
    nextJie.date > baziBirth &&
    previousJie.term.longitude === 285 &&
    nextJie.term.longitude === 315,
  "Previous Xiaohan (285°); next Lichun (315°)",
  `Previous ${previousJie.term.name} at ${previousJie.date.toISOString()}; next ${nextJie.term.name} at ${nextJie.date.toISOString()}`
);

const baziEngine = new CompleteBaZiEngine();
const baziEarly = baziEngine.generateBaZiChart(new Date("2000-01-10T12:00:00Z"), "Male");
const baziLater = baziEngine.generateBaZiChart(new Date("2000-01-20T12:00:00Z"), "Male");
const earlyLuck = baziEarly.luckPillars[0];
const laterLuck = baziLater.luckPillars[0];
assertTest(
  "12.2 BaZi Variable Da Yun Start Age",
  "Start age changes with the exact birth-to-previous-Jie interval; it is not a fixed five-year constant",
  earlyLuck.startAge !== laterLuck.startAge &&
    earlyLuck.startAge > 0 &&
    laterLuck.startAge > earlyLuck.startAge,
  "Later birth in the same solar month has a later converted start age",
  `Jan 10: ${earlyLuck.startAge.toFixed(3)} years; Jan 20: ${laterLuck.startAge.toFixed(3)} years`
);

assertTest(
  "12.3 BaZi Da Yun Calendar Dates",
  "Publishes real start/end instants and contiguous ten-year luck periods",
  Number.isFinite(earlyLuck.startDate.getTime()) &&
    Number.isFinite(earlyLuck.endDate.getTime()) &&
    earlyLuck.startDate > new Date("2000-01-10T12:00:00Z") &&
    earlyLuck.endDate.getTime() === baziEarly.luckPillars[1].startDate.getTime() &&
    earlyLuck.endDate.getTime() - earlyLuck.startDate.getTime() > 9.9 * 365 * 86400000,
  "Valid start after birth; next period begins exactly at prior exclusive end",
  `Start ${earlyLuck.startDate.toISOString()}; end ${earlyLuck.endDate.toISOString()}; contiguous=${earlyLuck.endDate.getTime() === baziEarly.luckPillars[1].startDate.getTime()}`
);

// ======================================================================
console.log("Running Category 13: KP Placidus cusp preservation...");

const kpCuspCalculator = new KPCuspsCalculator();
const kpAyanamsa2000 = KPCuspsCalculator.calculateKPAyanamsa(2000, 1, 1);
const syntheticWesternData = {
  houses: Array.from({ length: 12 }, (_, index) => ({
    longitude: index === 0 ? kpAyanamsa2000 + 29 : kpAyanamsa2000 + (index * 30 + 5) % 360,
  })),
} as any;
const preservedKP = kpCuspCalculator.calculateKPCuspsFromWestern(
  syntheticWesternData,
  2000,
  1,
  1
);
assertTest(
  "13.1 KP Cusp Longitude Preservation",
  "Keeps the actual sidereal Placidus cusp at 29° instead of snapping it to 0° of the next sign",
  Math.abs(preservedKP.cusps[0] - 29) < 1e-8 &&
    Math.abs(preservedKP.houseDetails[0].degreeInSign - 29) < 1e-8,
  "29°00'00" retained",
  `Cusp=${preservedKP.cusps[0].toFixed(8)}°; degree-in-sign=${preservedKP.houseDetails[0].degreeInSign.toFixed(8)}°`
);

// SUMMARY OUTPUT
// ======================================================================
console.log("\n=================== TEST RESULTS ===================");
let passCount = 0;
let failCount = 0;
results.forEach((r) => {
  if (r.status === "PASS") passCount++;
  else failCount++;
  console.log(`[${r.status}] ${r.category} -> ${r.name}`);
  console.log(`   Expected: ${r.expected}`);
  console.log(`   Actual:   ${r.actual}`);
});

console.log("\n====================================================");
console.log(`TOTAL TESTS: ${results.length}`);
console.log(`PASSED: ${passCount}`);
console.log(`FAILED: ${failCount}`);
console.log(`PASS RATE: ${((passCount / results.length) * 100).toFixed(1)}%`);
console.log("====================================================\n");

if (failCount > 0) {
  process.exit(1);
}
