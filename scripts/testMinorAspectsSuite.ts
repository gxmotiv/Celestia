import {
  MinorAspectsEngine,
  MinorAspect,
  AspectSettings,
  DEFAULT_ASPECT_SETTINGS,
} from "../lib/astronomy/minorAspects";
import { PlanetPosition } from "../lib/astronomy/ephemeris";

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

const engine = new MinorAspectsEngine();

// Helper to create mock planet position
function createMockPlanet(
  name: string,
  lon: number,
  speed = 1.0,
  isRetrograde = false
): PlanetPosition {
  const signIndex = Math.floor(lon / 30);
  const signs = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  return {
    id: name,
    name,
    symbol: "✦",
    longitude: lon,
    latitude: 0,
    speed,
    isRetrograde,
    sign: signs[signIndex] || "Aries",
    signIndex,
    signDegree: lon % 30,
    signDegreeFormatted: `${(lon % 30).toFixed(1)}° ${signs[signIndex]}`,
    house: Math.floor(lon / 30) + 1,
    element: "Fire",
    modality: "Cardinal",
  };
}

console.log("================================================================================");
console.log("STARTING MINOR ASPECTS & HARMONIC SYSTEM ACCURACY TEST SUITE");
console.log("================================================================================");

// --------------------------------------------------------------------------------
// GROUP 1: ALL 9 MINOR ASPECT DEFINITIONS & ANGLES
// --------------------------------------------------------------------------------
console.log("\n[TEST GROUP 1] Minor Aspect Types & Geometric Angles Verification");

const defs = MinorAspectsEngine.MINOR_ASPECTS;

assertTest(
  "Definitions",
  "Engine has all 9 minor aspect types",
  defs.length === 9,
  "9 aspects",
  `${defs.length} aspects`
);

const expectedAspects: Record<string, { angle: number; orb: number; nature: string; harmonic: number }> = {
  Semisquare: { angle: 45, orb: 2, nature: "challenging", harmonic: 8 },
  Sesquiquadrate: { angle: 135, orb: 2, nature: "challenging", harmonic: 8 },
  Quintile: { angle: 72, orb: 1.5, nature: "harmonious", harmonic: 5 },
  Biquintile: { angle: 144, orb: 1.5, nature: "harmonious", harmonic: 5 },
  Semisextile: { angle: 30, orb: 1, nature: "neutral", harmonic: 12 },
  Quincunx: { angle: 150, orb: 2, nature: "challenging", harmonic: 12 },
  Septile: { angle: 51.43, orb: 1, nature: "spiritual", harmonic: 7 },
  Novile: { angle: 40, orb: 1, nature: "spiritual", harmonic: 9 },
  Decile: { angle: 36, orb: 1, nature: "harmonious", harmonic: 10 },
};

Object.entries(expectedAspects).forEach(([name, exp]) => {
  const found = defs.find((d) => d.name === name);
  assertTest(
    "Aspect Exactitude",
    `${name} angle = ${exp.angle}°, default orb = ${exp.orb}°, nature = ${exp.nature}`,
    found !== undefined &&
      Math.abs(found.angle - exp.angle) < 0.01 &&
      found.orb === exp.orb &&
      found.nature === exp.nature &&
      found.harmonicNumber === exp.harmonic,
    `${exp.angle}° / orb ${exp.orb}° / ${exp.nature} / H${exp.harmonic}`,
    found ? `${found.angle}° / orb ${found.orb}° / ${found.nature} / H${found.harmonicNumber}` : "NOT FOUND"
  );
});

// --------------------------------------------------------------------------------
// GROUP 2: ACCURATE CALCULATION OF EACH MINOR ASPECT
// --------------------------------------------------------------------------------
console.log("\n[TEST GROUP 2] Planetary Distance Calculation for all 9 Aspects");

// 2.1 Semisquare (45°): Sun at 10° Aries, Moon at 25° Taurus (diff = 45°)
const sun45 = createMockPlanet("Sun", 10);
const moon45 = createMockPlanet("Moon", 55);
const asp45 = engine.calculateMinorAspects([sun45, moon45]);
assertTest(
  "Semisquare Detection",
  "Sun at 10° Aries and Moon at 25° Taurus form exact Semisquare (45°)",
  asp45.length > 0 && asp45[0].aspectType.name === "Semisquare" && asp45[0].orb === 0,
  "Semisquare (orb 0°)",
  asp45[0] ? `${asp45[0].aspectType.name} (orb ${asp45[0].orb}°)` : "None"
);

// 2.2 Quintile (72°): Venus at 0° Aries, Mars at 12° Gemini (diff = 72°)
const ven72 = createMockPlanet("Venus", 0);
const mars72 = createMockPlanet("Mars", 72);
const asp72 = engine.calculateMinorAspects([ven72, mars72]);
assertTest(
  "Quintile Detection",
  "Venus at 0° Aries and Mars at 12° Gemini form exact Quintile (72°)",
  asp72.length > 0 && asp72[0].aspectType.name === "Quintile" && asp72[0].orb === 0,
  "Quintile (orb 0°)",
  asp72[0] ? `${asp72[0].aspectType.name} (orb ${asp72[0].orb}°)` : "None"
);

// 2.3 Biquintile (144°): Mercury at 15° Leo, Jupiter at 9° Capricorn (diff = 144°)
const merc144 = createMockPlanet("Mercury", 135);
const jup144 = createMockPlanet("Jupiter", 279);
const asp144 = engine.calculateMinorAspects([merc144, jup144]);
assertTest(
  "Biquintile Detection",
  "Mercury and Jupiter separated by 144° form exact Biquintile",
  asp144.length > 0 && asp144[0].aspectType.name === "Biquintile" && asp144[0].orb === 0,
  "Biquintile (orb 0°)",
  asp144[0] ? `${asp144[0].aspectType.name} (orb ${asp144[0].orb}°)` : "None"
);

// 2.4 Septile (51.43°): Moon at 10° Cancer, Uranus at 1.43° Virgo (diff = 51.43°)
const moonSep = createMockPlanet("Moon", 100);
const uranSep = createMockPlanet("Uranus", 151.43);
const aspSep = engine.calculateMinorAspects([moonSep, uranSep]);
assertTest(
  "Septile Detection",
  "Moon and Uranus separated by 51.43° form exact 7th Harmonic Septile",
  aspSep.length > 0 && aspSep[0].aspectType.name === "Septile" && aspSep[0].orb === 0,
  "Septile (orb 0°)",
  aspSep[0] ? `${aspSep[0].aspectType.name} (orb ${aspSep[0].orb}°)` : "None"
);

// 2.5 Novile (40°): Sun at 20° Scorpio, Saturn at 0° Capricorn (diff = 40°)
const sunNov = createMockPlanet("Sun", 230);
const satNov = createMockPlanet("Saturn", 270);
const aspNov = engine.calculateMinorAspects([sunNov, satNov]);
assertTest(
  "Novile Detection",
  "Sun and Saturn separated by 40° form exact 9th Harmonic Novile",
  aspNov.length > 0 && aspNov[0].aspectType.name === "Novile" && aspNov[0].orb === 0,
  "Novile (orb 0°)",
  aspNov[0] ? `${aspNov[0].aspectType.name} (orb ${aspNov[0].orb}°)` : "None"
);

// 2.6 Decile (36°): Mars at 4° Taurus, Neptune at 10° Gemini (diff = 36°)
const marsDec = createMockPlanet("Mars", 34);
const nepDec = createMockPlanet("Neptune", 70);
const aspDec = engine.calculateMinorAspects([marsDec, nepDec]);
assertTest(
  "Decile Detection",
  "Mars and Neptune separated by 36° form exact 10th Harmonic Decile",
  aspDec.length > 0 && aspDec[0].aspectType.name === "Decile" && aspDec[0].orb === 0,
  "Decile (orb 0°)",
  aspDec[0] ? `${aspDec[0].aspectType.name} (orb ${aspDec[0].orb}°)` : "None"
);

// 2.7 Quincunx (150°): Sun at 10° Aries, Pluto at 10° Virgo (diff = 150°)
const sun150 = createMockPlanet("Sun", 10);
const pluto150 = createMockPlanet("Pluto", 160);
const asp150 = engine.calculateMinorAspects([sun150, pluto150]);
assertTest(
  "Quincunx Detection",
  "Sun and Pluto separated by 150° form exact Quincunx",
  asp150.length > 0 && asp150[0].aspectType.name === "Quincunx" && asp150[0].orb === 0,
  "Quincunx (orb 0°)",
  asp150[0] ? `${asp150[0].aspectType.name} (orb ${asp150[0].orb}°)` : "None"
);

// 2.8 Sesquiquadrate (135°): Venus at 5° Gemini, Saturn at 20° Libra (diff = 135°)
const ven135 = createMockPlanet("Venus", 65);
const sat135 = createMockPlanet("Saturn", 200);
const asp135 = engine.calculateMinorAspects([ven135, sat135]);
assertTest(
  "Sesquiquadrate Detection",
  "Venus and Saturn separated by 135° form exact Sesquiquadrate",
  asp135.length > 0 && asp135[0].aspectType.name === "Sesquiquadrate" && asp135[0].orb === 0,
  "Sesquiquadrate (orb 0°)",
  asp135[0] ? `${asp135[0].aspectType.name} (orb ${asp135[0].orb}°)` : "None"
);

// 2.9 Semisextile (30°): Mercury at 12° Aquarius, Moon at 12° Pisces (diff = 30°)
const merc30 = createMockPlanet("Mercury", 312);
const moon30 = createMockPlanet("Moon", 342);
const asp30 = engine.calculateMinorAspects([merc30, moon30]);
assertTest(
  "Semisextile Detection",
  "Mercury and Moon separated by 30° form exact Semisextile",
  asp30.length > 0 && asp30[0].aspectType.name === "Semisextile" && asp30[0].orb === 0,
  "Semisextile (orb 0°)",
  asp30[0] ? `${asp30[0].aspectType.name} (orb ${asp30[0].orb}°)` : "None"
);

// --------------------------------------------------------------------------------
// GROUP 3: APPLYING VS SEPARATING ACCURACY
// --------------------------------------------------------------------------------
console.log("\n[TEST GROUP 3] Applying vs Separating Dynamics");

// Faster Moon (13°/day) at 54° moving toward Venus at 0° (angle = 54°, target = 45° Semisquare, distance is closing)
// Actually Moon is at 54°, Venus at 0°. diff = 54°. Since target is 45°, in 0.2 days Moon moves to 56.6°, so diff increases! That is separating.
// If Moon is at 43°, Venus at 0°. diff = 43°. Target = 45°. In 0.2 days Moon moves to 45.6°, so diff gets closer to 45°! That is applying.
const moonApplying = createMockPlanet("Moon", 43, 13.0);
const venDirect = createMockPlanet("Venus", 0, 1.0);
const isApp = engine.isAspectApplying(venDirect, moonApplying, 45);
assertTest(
  "Applying Aspect Calculation",
  "Faster Moon at 43° advancing toward 45° exactitude from 0° is APPLYING",
  isApp === true,
  "true (Applying)",
  `${isApp}`
);

// Faster Moon at 47° moving to 50° away from 45° exactitude
const moonSeparating = createMockPlanet("Moon", 47, 13.0);
const isSep = engine.isAspectApplying(venDirect, moonSeparating, 45);
assertTest(
  "Separating Aspect Calculation",
  "Faster Moon at 47° moving away from 45° exactitude is SEPARATING",
  isSep === false,
  "false (Separating)",
  `${isSep}`
);

// Missing speed is not a licence to substitute an average; zero is a valid
// instantaneous speed and a stationary relative pair has no applying phase.
const stationaryVenus = createMockPlanet("Venus", 0, 0);
const stationaryMoon = createMockPlanet("Moon", 43, 0);
const stationaryPhase = engine.isAspectApplying(stationaryVenus, stationaryMoon, 45);
assertTest(
  "Stationary Aspect Direction",
  "Two bodies with explicitly zero relative speed are not guessed to be applying or separating",
  stationaryPhase === null,
  "null (Direction unavailable)",
  String(stationaryPhase)
);

const unavailableSpeedMoon = { ...createMockPlanet("Moon", 43), speed: undefined };
const unavailablePhase = engine.isAspectApplying(venDirect, unavailableSpeedMoon, 45);
assertTest(
  "Missing Speed Direction",
  "A missing instantaneous speed is reported as unavailable instead of using a default average",
  unavailablePhase === null,
  "null (Direction unavailable)",
  String(unavailablePhase)
);

// A 0.2-day projection can jump past exactitude when the Moon is already very
// close. Instantaneous relative motion correctly reports this 0.5° orb as applying.
const closeApplyingMoon = createMockPlanet("Moon", 44.5, 13.0);
const closeApplying = engine.isAspectApplying(stationaryVenus, closeApplyingMoon, 45);
assertTest(
  "Near-Exact Applying Direction",
  "A 0.5° orb with the Moon moving toward exactitude remains applying",
  closeApplying === true,
  "true (Applying)",
  String(closeApplying)
);

const equalSpeedVenus = createMockPlanet("Venus", 0, 1.0);
const equalSpeedMoon = createMockPlanet("Moon", 43, 1.0);
const equalSpeedPhase = engine.isAspectApplying(equalSpeedVenus, equalSpeedMoon, 45);
assertTest(
  "Equal Relative Speed Direction",
  "Equal angular speeds preserve the separation and leave the phase unavailable",
  equalSpeedPhase === null,
  "null (Direction unavailable)",
  String(equalSpeedPhase)
);

// --------------------------------------------------------------------------------
// GROUP 4: CIRCLE BOUNDARIES & 0° ARIES WRAP-AROUND
// --------------------------------------------------------------------------------
console.log("\n[TEST GROUP 4] 360° Circular Coordinates & Aries Ingress Wrap-Around");

// Planet 1 at 355° (Pisces), Planet 2 at 40° (Taurus). Shortest distance: 360 - 355 + 40 = 45° (Semisquare!)
const pPisces = createMockPlanet("Jupiter", 355);
const pTaurus = createMockPlanet("Mars", 40);
const aspWrap = engine.calculateMinorAspects([pPisces, pTaurus]);
assertTest(
  "Circle Wrap Around",
  "Jupiter at 355° and Mars at 40° correctly compute 45° shortest distance (Semisquare across 0° Aries)",
  aspWrap.length > 0 && aspWrap[0].aspectType.name === "Semisquare" && aspWrap[0].orb === 0,
  "Semisquare across 0° Aries (orb 0°)",
  aspWrap[0] ? `${aspWrap[0].aspectType.name} (orb ${aspWrap[0].orb}°)` : "None"
);

// --------------------------------------------------------------------------------
// GROUP 5: ORB MULTIPLIER SETTINGS
// --------------------------------------------------------------------------------
console.log("\n[TEST GROUP 5] Aspect Settings & Orb Multipliers");

// Angle = 46.8° (diff = 46.8°, orb for Semisquare = 1.8°).
// With standard orb (2.0°): PASSES (1.8 <= 2.0).
// With tight orb (0.5x = 1.0°): REJECTED (1.8 > 1.0).
// With wide orb (1.5x = 3.0°): PASSES (1.8 <= 3.0).
const pA = createMockPlanet("Sun", 0);
const pB = createMockPlanet("Mercury", 46.8);

const resStandard = engine.calculateMinorAspects([pA, pB], {
  ...DEFAULT_ASPECT_SETTINGS,
  minorOrbMultiplier: 1.0,
  showWeakAspects: true,
});
const resTight = engine.calculateMinorAspects([pA, pB], {
  ...DEFAULT_ASPECT_SETTINGS,
  minorOrbMultiplier: 0.5,
  showWeakAspects: true,
});
const resWide = engine.calculateMinorAspects([pA, pB], {
  ...DEFAULT_ASPECT_SETTINGS,
  minorOrbMultiplier: 1.5,
  showWeakAspects: true,
});

assertTest(
  "Orb Multiplier Standard",
  "Semisquare with 1.8° orb detected under Standard (1.0x) multiplier",
  resStandard.length === 1,
  "1 aspect",
  `${resStandard.length} aspect`
);

assertTest(
  "Orb Multiplier Tight",
  "Semisquare with 1.8° orb filtered out under Tight (0.5x = max 1.0°) multiplier",
  resTight.length === 0,
  "0 aspects",
  `${resTight.length} aspects`
);

assertTest(
  "Orb Multiplier Wide",
  "Semisquare with 1.8° orb detected under Wide (1.5x = max 3.0°) multiplier",
  resWide.length === 1,
  "1 aspect",
  `${resWide.length} aspect`
);

// --------------------------------------------------------------------------------
// GROUP 6: HARMONIC BREAKDOWN ANALYSIS
// --------------------------------------------------------------------------------
console.log("\n[TEST GROUP 6] Harmonic Breakdown & Classification");

const testPlanets = [
  createMockPlanet("Sun", 0),       // 0°
  createMockPlanet("Moon", 72),     // 72° -> Sun-Moon Quintile (H5)
  createMockPlanet("Mercury", 144),  // 144° -> Sun-Merc Biquintile (H5)
  createMockPlanet("Venus", 45),    // 45° -> Sun-Venus Semisquare (H8)
  createMockPlanet("Mars", 51.43),  // 51.43° -> Sun-Mars Septile (H7)
  createMockPlanet("Jupiter", 40),  // 40° -> Sun-Jup Novile (H9)
];

const allFound = engine.calculateMinorAspects(testPlanets, {
  ...DEFAULT_ASPECT_SETTINGS,
  showWeakAspects: true,
});
const breakdown = engine.getHarmonicBreakdown(allFound);

assertTest(
  "Harmonic Grouping",
  "Harmonic breakdown categorizes 5th, 7th, 8th, 9th harmonics correctly",
  breakdown.some((b) => b.harmonicNumber === 5) &&
    breakdown.some((b) => b.harmonicNumber === 8) &&
    breakdown.some((b) => b.harmonicNumber === 7) &&
    breakdown.some((b) => b.harmonicNumber === 9),
  "H5, H7, H8, H9 detected",
  breakdown.map((b) => `H${b.harmonicNumber}`).join(", ")
);

// --------------------------------------------------------------------------------
// GROUP 7: DETAILED INTERPRETATIONS QUALITY AUDIT
// --------------------------------------------------------------------------------
console.log("\n[TEST GROUP 7] Psychological Interpretations Audit");

const pSun = createMockPlanet("Sun", 0);
const pMoon = createMockPlanet("Moon", 45);
const pVen = createMockPlanet("Venus", 0);
const pMar = createMockPlanet("Mars", 72);
const pJup = createMockPlanet("Jupiter", 0);
const pSat = createMockPlanet("Saturn", 135);

const interpSunMoon = engine.getDetailedInterpretation(
  pSun,
  pMoon,
  defs.find((d) => d.name === "Semisquare")!
);
const interpVenMar = engine.getDetailedInterpretation(
  pVen,
  pMar,
  defs.find((d) => d.name === "Quintile")!
);
const interpJupSat = engine.getDetailedInterpretation(
  pJup,
  pSat,
  defs.find((d) => d.name === "Sesquiquadrate")!
);

assertTest(
  "Interpretation Sun-Moon Semisquare",
  "Sun-Moon Semisquare generates specific friction and growth interpretation",
  interpSunMoon.includes("friction") || interpSunMoon.includes("will and emotional"),
  "Specific interpretation present",
  interpSunMoon.slice(0, 60) + "..."
);

assertTest(
  "Interpretation Venus-Mars Quintile",
  "Venus-Mars Quintile generates specific artistic virtuosity and creative interpretation",
  interpVenMar.includes("virtuosity") || interpVenMar.includes("artistic") || interpVenMar.includes("creative"),
  "Specific interpretation present",
  interpVenMar.slice(0, 60) + "..."
);

assertTest(
  "Interpretation Jupiter-Saturn Sesquiquadrate",
  "Jupiter-Saturn Sesquiquadrate generates institutional hurdle and discipline interpretation",
  interpJupSat.includes("hurdles") || interpJupSat.includes("discipline") || interpJupSat.includes("expansion"),
  "Specific interpretation present",
  interpJupSat.slice(0, 60) + "..."
);

// --------------------------------------------------------------------------------
// PRINT AUDIT SUMMARY
// --------------------------------------------------------------------------------
const total = results.length;
const passed = results.filter((r) => r.status === "PASS").length;
const failed = results.filter((r) => r.status === "FAIL").length;

console.log("\n================================================================================");
console.log(`TOTAL MINOR ASPECTS TESTS: ${total}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log(`PASS RATE: ${((passed / total) * 100).toFixed(1)}%`);
console.log("================================================================================");

results.forEach((r, idx) => {
  const icon = r.status === "PASS" ? "✓ PASS" : "✗ FAIL";
  console.log(`${icon} [${idx + 1}] ${r.category}: ${r.name}`);
  if (r.status === "FAIL") {
    console.log(`   Expected: ${r.expected}`);
    console.log(`   Actual:   ${r.actual}`);
  }
});

if (failed > 0) {
  process.exit(1);
} else {
  console.log("\nALL " + total + " MINOR ASPECTS SUITE TESTS PASSED. A green software suite does not certify astronomical accuracy.");
}
