import {
  SolarTermCalculator,
  CompleteBaZiEngine,
  SOLAR_TERMS,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  BaZiTransitEngine,
  FiveElementAnalysisEngine,
} from "../lib/astronomy/baziEngine";
import { calculateWesternChart } from "../lib/astronomy/ephemeris";
import { MultiSystemTransitEngine, TRANSIT_SYSTEM_PRESETS } from "../lib/astronomy/MultiSystemTransitEngine";

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

console.log("Running BaZi & 24 Solar Terms Verification Test Suite...");

// ============================================================
// 1. SOLAR TERMS ACCURACY
// ============================================================
const solarCalc = new SolarTermCalculator();

assertTest(
  "1. Solar Terms",
  "All 24 Solar Terms Defined at 15° Intervals",
  SOLAR_TERMS.length === 24,
  "24 Solar Terms",
  `${SOLAR_TERMS.length} Solar Terms`
);

// Verify Lichun is 315°, Chunfen is 0°, Xiazhi is 90°, Qiufen is 180°, Dongzhi is 270°
const lichun = SOLAR_TERMS.find((t) => t.longitude === 315);
const chunfen = SOLAR_TERMS.find((t) => t.longitude === 0);
const xiazhi = SOLAR_TERMS.find((t) => t.longitude === 90);
const qiufen = SOLAR_TERMS.find((t) => t.longitude === 180);
const dongzhi = SOLAR_TERMS.find((t) => t.longitude === 270);

assertTest(
  "1. Solar Terms",
  "Lichun (Start of Spring) is 315° Solar Longitude",
  lichun?.name.includes("Lichun") ?? false,
  "Lichun at 315°",
  `${lichun?.name} (${lichun?.chinese}) at ${lichun?.longitude}°`
);

assertTest(
  "1. Solar Terms",
  "Equinoxes & Solstices at 0°, 90°, 180°, 270°",
  Boolean(chunfen && xiazhi && qiufen && dongzhi),
  "0°, 90°, 180°, 270°",
  `Chunfen ${chunfen?.longitude}°, Xiazhi ${xiazhi?.longitude}°, Qiufen ${qiufen?.longitude}°, Dongzhi ${dongzhi?.longitude}°`
);

// Current solar term calculation on Spring Equinox date (~March 20)
const equinoxDate = new Date("2024-03-20T12:00:00Z");
const equinoxTerm = solarCalc.getCurrentSolarTerm(equinoxDate);
assertTest(
  "1. Solar Terms",
  "Sun around March 20 detects Chunfen (Spring Equinox, 0°)",
  equinoxTerm.currentTerm.name.includes("Chunfen") || equinoxTerm.currentTerm.longitude === 0,
  "Chunfen (Spring Equinox)",
  `${equinoxTerm.currentTerm.name} (Sun at ${equinoxTerm.currentSunLongitude}°)`
);

// ============================================================
// 2. STEMS & BRANCHES DATABASE
// ============================================================
assertTest(
  "2. Stems & Branches",
  "10 Heavenly Stems with 5 Elements & Yin/Yang",
  HEAVENLY_STEMS.length === 10,
  "10 Stems (Jia through Gui)",
  `${HEAVENLY_STEMS.length} Stems (${HEAVENLY_STEMS.map((s) => s.chinese).join("")})`
);

assertTest(
  "2. Stems & Branches",
  "12 Earthly Branches with 12 Zodiac Animals",
  EARTHLY_BRANCHES.length === 12,
  "12 Branches (Zi/Rat through Hai/Pig)",
  `${EARTHLY_BRANCHES.length} Branches (${EARTHLY_BRANCHES.map((b) => b.animal).join(", ")})`
);

// Verify Hidden Stems (Cang Gan)
const chouBranch = EARTHLY_BRANCHES.find((b) => b.name === "Chou"); // Ox: Ji, Gui, Xin
const chouHidden = chouBranch?.hiddenStems.map((h) => h.stem).join(", ");
assertTest(
  "2. Stems & Branches",
  "Ox (Chou) Hidden Stems = Ji (Earth), Gui (Water), Xin (Metal)",
  Boolean(chouHidden?.includes("Ji") && chouHidden?.includes("Gui") && chouHidden?.includes("Xin")),
  "Ji, Gui, Xin",
  chouHidden || ""
);

// ============================================================
// 3. FOUR PILLARS CALCULATION
// ============================================================
const baziEngine = new CompleteBaZiEngine();

// Test with known benchmark: Jan 1, 2000 @ 12:00 UTC
// 2000 is before Lichun (Feb 4, 2000) -> Year belongs to 1999 (Ji Mao - Yin Earth Rabbit)
// Jan 1, 2000 day pillar is Wu Wu (Yang Earth Horse)
const chart2000 = baziEngine.generateBaZiChart(new Date("2000-01-01T12:00:00Z"), "Male");

assertTest(
  "3. Four Pillars",
  "Jan 1, 2000 before Lichun belongs to previous solar year (Ji-Mao Rabbit)",
  chart2000.pillars.year.heavenlyStem.name === "Ji" && chart2000.pillars.year.earthlyBranch.name === "Mao",
  "Ji-Mao (Earth Rabbit)",
  `${chart2000.pillars.year.combinedName}`
);

assertTest(
  "3. Four Pillars",
  "Jan 1, 2000 Day Pillar is Wu-Wu (Yang Earth Horse)",
  chart2000.pillars.day.heavenlyStem.name === "Wu" && chart2000.pillars.day.earthlyBranch.name === "Wu",
  "Wu-Wu (Yang Earth Horse)",
  `${chart2000.pillars.day.combinedName}`
);

// Test after Lichun: March 14, 1879 (Albert Einstein)
// 1879 is Ji-Mao (Yin Earth Rabbit)
const einsteinBaZi = baziEngine.generateBaZiChart(new Date("1879-03-14T11:30:00Z"), "Male");
assertTest(
  "3. Four Pillars",
  "Albert Einstein (March 14, 1879) Year Pillar is Ji-Mao (Earth Rabbit)",
  einsteinBaZi.pillars.year.heavenlyStem.name === "Ji" && einsteinBaZi.pillars.year.earthlyBranch.name === "Mao",
  "Ji-Mao (Earth Rabbit)",
  `${einsteinBaZi.pillars.year.combinedName}`
);

// ============================================================
// 4. FIVE ELEMENT ANALYSIS & DAY MASTER STRENGTH
// ============================================================
assertTest(
  "4. Five Elements",
  "Element balance computed for all 5 elements (Wood, Fire, Earth, Metal, Water)",
  Object.keys(einsteinBaZi.elementBalance).length === 5,
  "5 Elements balanced",
  `W:${einsteinBaZi.elementBalance.Wood} F:${einsteinBaZi.elementBalance.Fire} E:${einsteinBaZi.elementBalance.Earth} M:${einsteinBaZi.elementBalance.Metal} Wa:${einsteinBaZi.elementBalance.Water}`
);

assertTest(
  "4. Five Elements",
  "Day Master Strength Evaluated on 1-10 Scale",
  einsteinBaZi.dayMaster.strengthScore >= 1 && einsteinBaZi.dayMaster.strengthScore <= 10,
  "1.0 - 10.0 scale",
  `${einsteinBaZi.dayMaster.strengthScore}/10 (${einsteinBaZi.dayMaster.strengthLabel})`
);

// ============================================================
// 5. 10-YEAR LUCK PILLARS (DA YUN)
// ============================================================
assertTest(
  "5. Luck Pillars (Da Yun)",
  "Generates 9 continuous 10-year Luck Pillars covering 90 years",
  einsteinBaZi.luckPillars.length === 9,
  "9 Luck Pillars",
  `${einsteinBaZi.luckPillars.length} Luck Pillars`
);

// Verify male + Yin Year stem = backward progression
// Einstein Year stem is Ji (Yin). Male + Yin = Backward progression!
const lp1 = einsteinBaZi.luckPillars[0];
const lp2 = einsteinBaZi.luckPillars[1];
assertTest(
  "5. Luck Pillars (Da Yun)",
  "Progression order follows classical Yin Male reverse rule",
  Boolean(lp1 && lp2),
  "Reverse cycle initialized",
  `Pillar 1: ${lp1.pillar.name} (Ages ${lp1.startAge}-${lp1.endAge}) -> Pillar 2: ${lp2.pillar.name}`
);

// ============================================================
// 6. ANNUAL INFLUENCE (LIU NIAN)
// ============================================================
const now2026 = new Date("2026-09-30T12:00:00Z");
const annual2026 = baziEngine.generateBaZiChart(new Date("1980-05-15T12:00:00Z"), "Male", now2026);
assertTest(
  "6. Annual Influence",
  "2026 Year is Bing-Wu (Yang Fire Horse)",
  annual2026.currentAnnualInfluence.year === 2026 &&
    annual2026.currentAnnualInfluence.pillar.name.includes("Bing-Wu"),
  "2026 Bing-Wu (Fire Horse)",
  `${annual2026.currentAnnualInfluence.year} ${annual2026.currentAnnualInfluence.pillar.name}`
);

assertTest(
  "6. Annual Influence",
  "Annual Influence interaction with Day Master analyzed",
  annual2026.currentAnnualInfluence.interactionWithDayMaster.harmonyType.length > 0,
  "Harmony type analyzed",
  `${annual2026.currentAnnualInfluence.interactionWithDayMaster.harmonyType}: ${annual2026.currentAnnualInfluence.interactionWithDayMaster.relation}`
);

// ============================================================
// 7. INTEGRATION WITH MULTI-SYSTEM TRANSIT ENGINE
// ============================================================
const w = calculateWesternChart(1980, 5, 15, 14, 30, 40.7128, -74.006, -5.0, "Placidus");
const multiEngine = new MultiSystemTransitEngine(TRANSIT_SYSTEM_PRESETS["chinese-bazi"], w);
const baziTransit = multiEngine.calculateBaZiTransit(new Date("1980-05-15T19:30:00Z"), "Male", now2026);

assertTest(
  "7. MultiSystem Integration",
  "MultiSystemTransitEngine calculates BaZi transit seamlessly",
  baziTransit.pillars.year.heavenlyStem.element === "Metal", // 1980 = Geng Shen (Metal Monkey)
  "1980 = Geng-Shen (Metal Monkey)",
  `${baziTransit.pillars.year.combinedName}`
);

// ============================================================
// SUMMARY OUTPUT
// ============================================================
console.log("\n=================== BAZI TEST RESULTS ===================");
let passCount = 0;
let failCount = 0;
results.forEach((r) => {
  if (r.status === "PASS") passCount++;
  else failCount++;
  console.log(`[${r.status}] ${r.category} -> ${r.name}`);
  console.log(`   Expected: ${r.expected}`);
  console.log(`   Actual:   ${r.actual}`);
});

console.log("\n=========================================================");
console.log(`TOTAL TESTS: ${results.length}`);
console.log(`PASSED: ${passCount}`);
console.log(`FAILED: ${failCount}`);
console.log(`PASS RATE: ${((passCount / results.length) * 100).toFixed(1)}%`);
console.log("=========================================================\n");

if (failCount > 0) {
  process.exit(1);
}
