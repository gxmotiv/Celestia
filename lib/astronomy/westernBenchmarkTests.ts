/**
 * Western Astrology Benchmark & Deep Verification Test Suite
 * Mathematical assertions, Ptolemaic invariants, and classical ephemeris verification for:
 * 1. Astronomical Ephemeris & House Systems (Placidus, Whole Sign, Equal, ASC/MC orthogonality, polar fallback)
 * 2. Ptolemaic & Minor Aspect Geometries (Conjunction, Sextile, Square, Trine, Opposition, Quintile, Septile, Novile orbs)
 * 3. Hellenistic & Medieval Predictive Engines (Annual Profections 12-yr cycle, Zodiacal Releasing L1/L2, Firdaria diurnal/nocturnal)
 * 4. Advanced Western Systems (90° Midpoints, Harmonics H4/H5/H7/H8/H9, Declinations Parallels & OOB threshold)
 * 5. Classical Benchmark Charts (Leonardo da Vinci 1452, J2000.0 epoch standard, Noon vs Midnight sect)
 */

import { calculateWesternChart, WesternChartData, normalizeDegrees } from "./ephemeris";
import { isSunAboveHorizonInChart } from "./horizon";
import { swissEphemeris } from "./swissEphemeris";
import { MinorAspectsEngine } from "./minorAspects";
import { AsteroidCalculator } from "./asteroidCalculator";
import { LunarPointsCalculator } from "./lunarPointsCalculator";
import { ArabianPartsCalculator } from "./arabianPartsCalculator";
import {
  MidpointCalculator,
  HarmonicChartCalculator,
  DeclinationCalculator,
} from "./advancedWesternCalculators";
import {
  ProgressionsEngine,
  ProfectionsEngine,
  ZodiacalReleasingEngine,
  FirdariaEngine,
} from "./predictiveHellenisticEngine";
import {
  FixedStarsEngine,
  EclipseAnalyzer,
  MedicalAstrologyEngine,
  AstrocartographyEngine,
} from "./specializedWesternEngines";
import {
  SynastryEngine,
  CompositeChartEngine,
  DavisonChartEngine,
} from "./relationshipEngine";

export interface WesternTestCaseResult {
  id: string;
  name: string;
  category:
    | "Astronomical Ephemeris & Houses"
    | "Aspects & Orbs"
    | "Predictive Hellenistic"
    | "Advanced Systems & Harmonics"
    | "Relationship Astrology"
    | "Classical Benchmark Verification";
  standardReference: string; // e.g. "Ptolemy Tetrabiblos", "Swiss Ephemeris JPL DE405", "Valens Anthologies"
  expected: string;
  actual: string;
  passed: boolean;
  details?: string;
}

export interface WesternSuiteReport {
  timestamp: string;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  passRatePercent: number;
  durationMs: number;
  categories: Record<string, { total: number; passed: number }>;
  results: WesternTestCaseResult[];
}

export class WesternBenchmarkRunner {
  private minorAspectsEngine = new MinorAspectsEngine();
  private asteroidCalculator = new AsteroidCalculator();
  private lunarPointsCalculator = new LunarPointsCalculator();
  private arabianPartsCalculator = new ArabianPartsCalculator();
  private midpointCalculator = new MidpointCalculator();
  private harmonicCalculator = new HarmonicChartCalculator();
  private declinationCalculator = new DeclinationCalculator();
  private progressionsEngine = new ProgressionsEngine();
  private profectionsEngine = new ProfectionsEngine();
  private releasingEngine = new ZodiacalReleasingEngine();
  private firdariaEngine = new FirdariaEngine();
  private fixedStarsEngine = new FixedStarsEngine();
  private eclipseAnalyzer = new EclipseAnalyzer();
  private medicalEngine = new MedicalAstrologyEngine();
  private astrocartographyEngine = new AstrocartographyEngine();
  private compositeEngine = new CompositeChartEngine();
  private davisonEngine = new DavisonChartEngine();

  public runFullSuite(customChart?: WesternChartData): WesternSuiteReport {
    const startTime = performance.now();
    const results: WesternTestCaseResult[] = [];

    // Use default Leonardo da Vinci chart or passed custom chart
    const chart =
      customChart ||
      calculateWesternChart(1452, 4, 15, 22, 0, 43.7844, 10.9253, 1, "Placidus");

    // 1. Astronomical Ephemeris & Houses
    this.runEphemerisAndHousesTests(results, chart);

    // 2. Aspects & Geometry
    this.runAspectGeometryTests(results, chart);

    // 3. Predictive Hellenistic & Medieval Engines
    this.runPredictiveTests(results, chart);

    // 4. Advanced Systems (Harmonics, Declinations, Midpoints)
    this.runAdvancedSystemsTests(results, chart);

    // 5. Relationship Astrology (Synastry, Composite, Davison)
    this.runRelationshipTests(results, chart);

    // 6. Classical Benchmark Invariants
    this.runClassicalBenchmarkTests(results);

    const endTime = performance.now();
    const totalTests = results.length;
    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = totalTests - passedCount;
    const passRatePercent = Math.round((passedCount / totalTests) * 100);

    const categories: Record<string, { total: number; passed: number }> = {};
    results.forEach((r) => {
      if (!categories[r.category]) {
        categories[r.category] = { total: 0, passed: 0 };
      }
      categories[r.category].total += 1;
      if (r.passed) categories[r.category].passed += 1;
    });

    return {
      timestamp: new Date().toISOString(),
      totalTests,
      passedCount,
      failedCount,
      passRatePercent,
      durationMs: Math.round((endTime - startTime) * 100) / 100,
      categories,
      results,
    };
  }

  // --- Category 1: Astronomical Ephemeris & Houses ---
  private runEphemerisAndHousesTests(results: WesternTestCaseResult[], chart: WesternChartData): void {
    // Test 1: Exactly 12 House Cusps generated
    results.push({
      id: "W-EPH-01",
      name: "12 House Cusps Count Invariant",
      category: "Astronomical Ephemeris & Houses",
      standardReference: "Ptolemy / Placidus de Titis (1650)",
      expected: "12 cusps",
      actual: `${chart.houses.length} cusps`,
      passed: chart.houses.length === 12,
      details: "Every valid Western astrological chart must contain exactly 12 house boundaries.",
    });

    // Test 2: Ascendant equals House 1 Cusp (within 0.01°)
    const h1Diff = Math.abs(chart.houses[0].longitude - chart.ascendant.longitude);
    results.push({
      id: "W-EPH-02",
      name: "Ascendant to House 1 Cusp Identity",
      category: "Astronomical Ephemeris & Houses",
      standardReference: "Astrological House Architecture",
      expected: `0.00° diff (Ascendant = House 1)`,
      actual: `${h1Diff.toFixed(4)}° diff`,
      passed: h1Diff < 0.05,
      details: "In quadrant house systems (Placidus, Koch, Regiomontanus), House 1 cusp must coincide with the eastern Ascendant horizon.",
    });

    // Test 3: Descendant is exactly Ascendant + 180°
    const dscExpected = normalizeDegrees(chart.ascendant.longitude + 180.0);
    const dscDiff = Math.abs(normalizeDegrees(chart.descendant - dscExpected));
    results.push({
      id: "W-EPH-03",
      name: "Descendant / Ascendant 180° Horizon Invariant",
      category: "Astronomical Ephemeris & Houses",
      standardReference: "Spherical Astronomy (Great Circle of Horizon)",
      expected: `Ascendant + 180° = ${dscExpected.toFixed(2)}°`,
      actual: `${chart.descendant.toFixed(2)}° (diff ${dscDiff.toFixed(4)}°)`,
      passed: dscDiff < 0.05,
      details: "The horizon line is an exact astronomical great circle; the western Descendant is strictly 180° opposite the Ascendant.",
    });

    // Test 4: IC is exactly Midheaven + 180°
    const icExpected = normalizeDegrees(chart.midheaven.longitude + 180.0);
    const icDiff = Math.abs(normalizeDegrees(chart.imumCoeli - icExpected));
    results.push({
      id: "W-EPH-04",
      name: "IC (Imum Coeli) to Midheaven 180° Meridian Invariant",
      category: "Astronomical Ephemeris & Houses",
      standardReference: "Celestial Meridian Orthogonality",
      expected: `MC + 180° = ${icExpected.toFixed(2)}°`,
      actual: `${chart.imumCoeli.toFixed(2)}° (diff ${icDiff.toFixed(4)}°)`,
      passed: icDiff < 0.05,
      details: "The celestial meridian intersects the northern nadir at exactly 180° opposite the southern culmination (Midheaven).",
    });

    // Helper for smallest angular difference on a circle (0-180)
    const angularDiff = (a: number, b: number) => {
      let d = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
      if (d > 180) d = 360 - d;
      return d;
    };

    // Test 5: Placidus Opposite House Cusps (180° Axis Invariant)
    // House 7 = House 1 + 180°, House 8 = House 2 + 180°, House 9 = House 3 + 180°, etc.
    let axisPairsPassed = 0;
    for (let h = 0; h < 6; h++) {
      const c1 = chart.houses[h].longitude;
      const cOpp = chart.houses[h + 6].longitude;
      const expOpp = normalizeDegrees(c1 + 180.0);
      if (angularDiff(cOpp, expOpp) < 0.05) {
        axisPairsPassed += 1;
      }
    }
    results.push({
      id: "W-EPH-05",
      name: "Placidus 6-House Axis Polarity (180° pairs)",
      category: "Astronomical Ephemeris & Houses",
      standardReference: "Placidus Semi-Arc Division",
      expected: "6 of 6 polar pairs exact 180°",
      actual: `${axisPairsPassed} of 6 polar pairs verified`,
      passed: axisPairsPassed === 6,
      details: "House pairs (1-7, 2-8, 3-9, 4-10, 5-11, 6-12) must maintain exact 180° antipodal symmetry.",
    });

    // Test 6: Whole Sign House System validation
    const wsHouses = swissEphemeris.calculateHouses(
      chart.julianDay,
      chart.birthLatitude ?? 43.7844,
      chart.birthLongitude ?? 10.9253,
      "W"
    );
    const ascSignIdx = Math.floor(chart.ascendant.longitude / 30);
    const expectedH1Ws = ascSignIdx * 30.0;
    const wsDiff = Math.abs(wsHouses.houseCusps[0] - expectedH1Ws);
    results.push({
      id: "W-EPH-06",
      name: "Hellenistic Whole Sign House 0° Sign Alignment",
      category: "Astronomical Ephemeris & Houses",
      standardReference: "Vettius Valens / Dorotheus of Sidon",
      expected: `House 1 starts at exactly ${expectedH1Ws}° (0° of Ascendant sign)`,
      actual: `House 1 starts at ${wsHouses.houseCusps[0]}°`,
      passed: wsDiff < 0.01,
      details: "In Whole Sign houses, the entire sign containing the Ascendant constitutes the 1st House, commencing at 0°00'.",
    });

    // Test 7: Equal House System 30° Spacing Invariant
    const eqHouses = swissEphemeris.calculateHouses(chart.julianDay, 43.7844, 10.9253, "E");
    let eqPassed = true;
    for (let i = 0; i < 12; i++) {
      const expectedDeg = normalizeDegrees(chart.ascendant.longitude + i * 30.0);
      if (angularDiff(eqHouses.houseCusps[i], expectedDeg) > 0.05) {
        eqPassed = false;
      }
    }
    results.push({
      id: "W-EPH-07",
      name: "Equal House System Exact 30° Increments",
      category: "Astronomical Ephemeris & Houses",
      standardReference: "Equal House Doctrine (Ptolemy Tetrabiblos III.10)",
      expected: "Every cusp = ASC + (h-1)*30°",
      actual: eqPassed ? "Verified: all 12 cusps spaced at exact 30° intervals" : "Discrepancy detected",
      passed: eqPassed,
      details: "Equal house division creates twelve uniform 30-degree segments starting strictly from the Ascendant degree.",
    });
  }

  // --- Category 2: Aspects & Geometry ---
  private runAspectGeometryTests(results: WesternTestCaseResult[], chart: WesternChartData): void {
    // Test 8: Major Ptolemaic Aspects Angles (Conjunction 0°, Sextile 60°, Square 90°, Trine 120°, Opposition 180°)
    const aspects = chart.aspects;
    let anglesValid = true;
    const standardAngles: Record<string, number> = {
      Conjunction: 0,
      Sextile: 60,
      Square: 90,
      Trine: 120,
      Opposition: 180,
      Quincunx: 150,
      Semisextile: 30,
    };

    for (const asp of aspects) {
      const expAngle = standardAngles[asp.aspectName];
      if (expAngle !== undefined && asp.angle !== expAngle) {
        anglesValid = false;
        break;
      }
    }
    results.push({
      id: "W-ASP-01",
      name: "Ptolemaic Aspect Nominal Angle Compliance",
      category: "Aspects & Orbs",
      standardReference: "Ptolemy Tetrabiblos Book I, Ch. 13",
      expected: "0°, 30°, 60°, 90°, 120°, 150°, 180° exact",
      actual: anglesValid ? "All aspects conform to standard nominal angles" : "Mismatch found",
      passed: aspects.length > 0 && anglesValid,
      details: "Ptolemaic and Keplerian aspects must adhere strictly to their canonical geometric arc divisions.",
    });

    // Test 9: Aspect Orb Calculation Precision (|actualDiff - angle| = orb)
    let orbsCorrect = true;
    for (const asp of aspects) {
      const expectedOrb = Math.round(Math.abs(asp.actualDiff - asp.angle) * 100) / 100;
      if (Math.abs(asp.orb - expectedOrb) > 0.05) {
        orbsCorrect = false;
        break;
      }
    }
    results.push({
      id: "W-ASP-02",
      name: "Aspect Orb Mathematical Integrity (|diff - angle|)",
      category: "Aspects & Orbs",
      standardReference: "Mathematical Aspect Definition",
      expected: "|actualDiff - nominalAngle| == orb",
      actual: orbsCorrect ? "Verified: orbs computed with 100% mathematical consistency" : "Mismatch found",
      passed: aspects.length > 0 && orbsCorrect,
      details: "Orb represents the exact deviation of the planetary separation from the true geometric aspect angle.",
    });

    // Test 10: North Node & South Node Opposition Exclusion
    const nodalAspects = aspects.filter(
      (a) =>
        (a.planet1 === "NorthNode" && a.planet2 === "SouthNode") ||
        (a.planet1 === "SouthNode" && a.planet2 === "NorthNode")
    );
    results.push({
      id: "W-ASP-03",
      name: "Nodal Axis Self-Opposition Filtering",
      category: "Aspects & Orbs",
      standardReference: "Modern Astrological Ephemeris Standards",
      expected: "0 redundant Node-Node oppositions in table",
      actual: `${nodalAspects.length} detected`,
      passed: nodalAspects.length === 0,
      details: "Because the South Node is mathematically defined as North Node + 180°, counting their opposition as an aspect is redundant.",
    });

    // Test 11: Controlled exact-angle fixtures for the 5th, 7th, 8th and 9th harmonic families.
    const template = chart.planets[0];
    const harmonicFixtures = [
      { name: "Quintile", angle: 72 },
      { name: "Septile", angle: 360 / 7 },
      { name: "Semisquare", angle: 45 },
      { name: "Novile", angle: 40 },
    ];
    const harmonicChecks = harmonicFixtures.map((fixture) => {
      const syntheticPair = [
        { ...template, id: "SyntheticA", name: "SyntheticA", longitude: 0, speed: 0.1 },
        { ...template, id: "SyntheticB", name: "SyntheticB", longitude: fixture.angle, speed: 0.05 },
      ];
      const detected = this.minorAspectsEngine.calculateMinorAspects(syntheticPair, {
        useMinorAspects: true,
        minorOrbMultiplier: 1,
        includeHarmonics: false,
        harmonicNumber: 5,
        showWeakAspects: true,
        aspectTypes: [fixture.name],
        filterNature: "all",
      });
      return detected.some((aspect) => aspect.aspectType.name === fixture.name && aspect.orb < 0.001);
    });
    const harmonicFamiliesPassed = harmonicChecks.every(Boolean);
    results.push({
      id: "W-ASP-04",
      name: "Controlled 5th, 7th, 8th and 9th Harmonic Geometry",
      category: "Aspects & Orbs",
      standardReference: "Harmonic divisions: 360°/5, 360°/7, 360°/8, 360°/9",
      expected: "Exact Quintile, Septile, Semisquare and Novile detected in synthetic two-point charts",
      actual: harmonicChecks.map((passed, index) => `${harmonicFixtures[index].name}: ${passed ? "pass" : "fail"}`).join("; "),
      passed: harmonicFamiliesPassed,
      details: "Each harmonic family is tested with a controlled pair at its exact mathematical angle; this does not validate interpretive meaning.",
    });
  }

  // --- Category 3: Predictive Hellenistic & Medieval Engines ---
  private runPredictiveTests(results: WesternTestCaseResult[], chart: WesternChartData): void {
    // Test 12: Hellenistic Annual Profections 12-Year House Cycle
    // Age 0 = 1st House, Age 1 = 2nd House, ..., Age 12 = 1st House, Age 35 = 12th House
    const prof35 = this.profectionsEngine.calculateAnnualProfection(chart, 35);
    const expectedHouse35 = (35 % 12) + 1; // 12
    results.push({
      id: "W-PRED-01",
      name: "Annual Profection House Cycle (Age % 12 + 1)",
      category: "Predictive Hellenistic",
      standardReference: "Vettius Valens Anthologies Book IV",
      expected: `Age 35 -> House ${expectedHouse35} (12th House)`,
      actual: `Age ${prof35.age} -> House ${prof35.profectionHouse} (${prof35.profectionSign}, Lord: ${prof35.lordOfTheYear})`,
      passed: prof35.profectionHouse === expectedHouse35,
      details: "Classical Hellenistic profections advance the native's solar year focus by exactly one house per year of life.",
    });

    // Test 13: Diurnal vs Nocturnal Sect Detection (Day vs Night Chart)
    // Sun in House 7..12 = Diurnal; Sun in House 1..6 = Nocturnal
    const sunHouse = chart.planets.find((p) => p.name === "Sun")?.house || 1;
    const isDiurnalExpected = isSunAboveHorizonInChart(chart);
    const firdariaRep = this.firdariaEngine.calculateFirdaria(chart, 30);
    results.push({
      id: "W-PRED-02",
      name: "Solar Sect Discrimination (Diurnal vs Nocturnal)",
      category: "Predictive Hellenistic",
      standardReference: "Ptolemy / Abu Ma'shar (Great Conjunctions)",
      expected: `Sun in House ${sunHouse} -> ${isDiurnalExpected ? "Diurnal (Day)" : "Nocturnal (Night)"}`,
      actual: `Sect calculated as: ${firdariaRep.isDiurnal ? "Diurnal" : "Nocturnal"}`,
      passed: firdariaRep.isDiurnal === isDiurnalExpected,
      details: "Planets above the horizon (Houses 7 through 12) establish a Diurnal sect; below horizon establishes a Nocturnal sect.",
    });

    // Test 14: Medieval Firdaria Total Years Cycle Sum (75 Years)
    // Diurnal sequence: Sun 10, Venus 8, Merc 13, Moon 9, Sat 11, Jup 12, Mars 7 + Nodes 3+2 = 75 years
    const firdariaTotalYears = firdariaRep.allPeriods.reduce((acc, p) => acc + p.years, 0);
    results.push({
      id: "W-PRED-03",
      name: "Medieval Firdaria 75-Year Master Cycle Invariant",
      category: "Predictive Hellenistic",
      standardReference: "Abu Ma'shar / Guido Bonatti Liber Astronomiae",
      expected: "75 total years across 9 planetary lords",
      actual: `${firdariaTotalYears} total years in ${firdariaRep.allPeriods.length} periods`,
      passed: firdariaTotalYears === 75,
      details: "The Chaldean Firdaria sequence runs for exactly 75 years before repeating its planetary cycles.",
    });

    // Test 15: Zodiacal Releasing L1 12-Period Sequence
    const spiritLon = chart.arabianParts?.partOfSpirit.longitude || 0;
    const zrReport = this.releasingEngine.calculateReleasing(
      new Date("1990-01-01T12:00:00Z"),
      spiritLon,
      "Spirit (Career & Purpose)"
    );
    results.push({
      id: "W-PRED-04",
      name: "Zodiacal Releasing 12-Sign Zodiacal Cascade",
      category: "Predictive Hellenistic",
      standardReference: "Vettius Valens Anthologies Book IV.4–10",
      expected: "12 successive L1 sign periods generated",
      actual: `${zrReport.allL1Periods.length} L1 periods starting in ${zrReport.lotSign}`,
      passed: zrReport.allL1Periods.length === 12,
      details: "Zodiacal releasing from the Lot of Spirit cycles through all twelve zodiacal signs with planet-specific periods.",
    });

    // Test 16: Secondary Progressions "Day for a Year" (1 Day = 1 Year)
    const progRep = this.progressionsEngine.calculateProgressions(
      new Date("1990-01-01T12:00:00Z"),
      new Date("2025-01-01T12:00:00Z"),
      40.7128,
      -74.006,
      -5
    );
    results.push({
      id: "W-PRED-05",
      name: "Secondary Progressions Day-for-a-Year Ephemeris",
      category: "Predictive Hellenistic",
      standardReference: "Placidus / Alan Leo (1905)",
      expected: "Progressed Sun & Moon advance proportionally to age",
      actual: `At age ${progRep.age}, Progressed Sun in ${progRep.progressedSun.sign}, Moon in ${progRep.progressedMoon.sign} (${progRep.progressedMoonPhase.phaseName})`,
      passed: progRep.age === 35 && progRep.progressedPlanets.length >= 10,
      details: "Secondary progressions map each day following birth to one full year of chronological development.",
    });
  }

  // --- Category 4: Advanced Systems (Harmonics, Declinations, Midpoints) ---
  private runAdvancedSystemsTests(results: WesternTestCaseResult[], chart: WesternChartData): void {
    // Test 17: Harmonic 4 (H4) Quadrature Projection (Longitude * 4 % 360)
    const h4 = this.harmonicCalculator.calculateHarmonic(chart.planets, 4);
    const p1 = chart.planets[0];
    const expH4Lon = normalizeDegrees(p1.longitude * 4);
    const actualH4Lon = h4.planets[0].harmonicLongitude;
    const h4Diff = Math.abs(expH4Lon - actualH4Lon);
    results.push({
      id: "W-ADV-01",
      name: "4th Harmonic (H4) Mathematical Frequency Multiplication",
      category: "Advanced Systems & Harmonics",
      standardReference: "John Addey (Harmonics in Astrology, 1976)",
      expected: `Sun H4 = (${p1.longitude.toFixed(2)}° * 4) % 360 = ${expH4Lon.toFixed(2)}°`,
      actual: `${actualH4Lon.toFixed(2)}° (diff ${h4Diff.toFixed(4)}°)`,
      passed: h4Diff < 0.05,
      details: "Harmonic charts multiply each planet's ecliptic longitude by the harmonic number modulo 360°.",
    });

    // Test 18: 9th Harmonic (H9) Navamsha Analogy (Longitude * 9 % 360)
    const h9 = this.harmonicCalculator.calculateHarmonic(chart.planets, 9);
    const expH9Lon = normalizeDegrees(p1.longitude * 9);
    const actualH9Lon = h9.planets[0].harmonicLongitude;
    const h9Diff = Math.abs(expH9Lon - actualH9Lon);
    results.push({
      id: "W-ADV-02",
      name: "9th Harmonic (H9) Soul Dharma / Navamsha Alignment",
      category: "Advanced Systems & Harmonics",
      standardReference: "John Addey / Vedic D9 Navamsha correspondence",
      expected: `Sun H9 = (${p1.longitude.toFixed(2)}° * 9) % 360 = ${expH9Lon.toFixed(2)}°`,
      actual: `${actualH9Lon.toFixed(2)}° (diff ${h9Diff.toFixed(4)}°)`,
      passed: h9Diff < 0.05,
      details: "The 9th harmonic reveals the novile (40°) geometry, directly matching the 9-fold division of the zodiac.",
    });

    // Test 19: Out of Bounds (OOB) Declination Threshold (23.43929°)
    const decRep = this.declinationCalculator.calculateAll(chart.planets, chart.obliquity);
    results.push({
      id: "W-ADV-03",
      name: "Equatorial Declination & Out of Bounds (OOB) Threshold",
      category: "Advanced Systems & Harmonics",
      standardReference: "Celestial Mechanics (Max Solar Obliquity ε = 23°26')",
      expected: "Parallels / Contraparallels evaluated against 23.439° limit",
      actual: `${decRep.parallels.length} Parallels, ${decRep.contraparallels.length} Contraparallels, ${decRep.outOfBoundsCount} OOB planets`,
      passed: decRep.declinations.length === chart.planets.length &&
        decRep.declinations.every((entry) => Number.isFinite(entry.declination)) &&
        decRep.outOfBoundsCount >= 0 && decRep.outOfBoundsCount <= chart.planets.length &&
        Math.abs(this.declinationCalculator.calculateDeclination(90, 0, chart.obliquity) - chart.obliquity) < 1e-6,
      details: "Planets exceeding the Sun's maximum declination of ~23°26' are deemed Out of Bounds (OOB), acting with unbounded autonomy.",
    });

    // Test 20: 90° Cosmobiology Dial Modulus (Midpoint % 90)
    const midpoints = this.midpointCalculator.calculateAllMidpoints(chart.planets);
    let dial90Correct = true;
    for (const m of midpoints.slice(0, 10)) {
      const expDial = Math.round((m.midpoint % 90.0) * 100) / 100;
      if (Math.abs(m.dial90 - expDial) > 0.05) {
        dial90Correct = false;
        break;
      }
    }
    results.push({
      id: "W-ADV-04",
      name: "Ebertin 90° Cosmobiology Dial Modulus (midpoint % 90)",
      category: "Advanced Systems & Harmonics",
      standardReference: "Reinhold Ebertin (The Combination of Stellar Influences)",
      expected: "dial90 == midpoint % 90.0",
      actual: dial90Correct ? "Verified: all midpoints projected onto 90° dial correctly" : "Mismatch found",
      passed: dial90Correct,
      details: "The 90-degree dial folds the hard aspect series (0°, 45°, 90°, 135°, 180°) into a unified quadrant for direct midpoint visualization.",
    });

    // Test 21: Arabian Part of Fortune Day/Night Formula
    const arabianRep = chart.arabianParts;
    const isDay = arabianRep?.isDayChart ?? true;
    const fortuneFormula = isDay ? "ASC + Moon - Sun" : "ASC + Sun - Moon";
    results.push({
      id: "W-ADV-05",
      name: "Pars Fortunae (Part of Fortune) Diurnal/Nocturnal Formula",
      category: "Advanced Systems & Harmonics",
      standardReference: "Ptolemy Tetrabiblos III.10 / Al-Biruni (1029)",
      expected: `Formula matches sect: ${fortuneFormula}`,
      actual: `${arabianRep?.partOfFortune.formula} -> ${arabianRep?.partOfFortune.signDegreeFormatted}`,
      passed: !!arabianRep && arabianRep.partOfFortune.formula.includes(isDay ? "Day" : "Night"),
      details: "Classical doctrine reverses the arc from Sun to Moon at night to maintain the luminaries' respective daytime and nighttime roles.",
    });
  }

  // --- Category 5: Relationship Astrology (Synastry, Composite, Davison) ---
  private runRelationshipTests(results: WesternTestCaseResult[], chart: WesternChartData): void {
    // Generate partner chart for testing (e.g. 2 years later, Los Angeles)
    const partnerChart = calculateWesternChart(
      1454,
      5,
      20,
      14,
      30,
      34.0522,
      -118.2437,
      -8,
      "Placidus"
    );

    // Test 22: Synastry Inter-Aspects Generation
    const synEngine = new SynastryEngine(
      chart,
      partnerChart,
      "Partner A",
      "Partner B",
      "unspecified",
      "unspecified",
      "romantic"
    );
    const synRep = synEngine.calculateCompleteSynastry();
    results.push({
      id: "W-REL-01",
      name: "Synastry Inter-Aspects Cross-Matrix Calculation",
      category: "Relationship Astrology",
      standardReference: "Classical Synastry (Ptolemaic Inter-Chart Contacts)",
      expected: "Cross-aspects between all planets generated with weighted affinity",
      actual: `${synRep.interAspects.length} inter-aspects detected, overall affinity score: ${synRep.scores.overall}/100 (${synRep.scores.verdict})`,
      passed: synRep.interAspects.length > 0 && synRep.scores.overall >= 0 && synRep.scores.overall <= 100,
      details: "Synastry cross-analyzes each planet of Person A with each planet of Person B to measure interpersonal resonance and friction.",
    });

    // Test 23: Composite Midpoint Chart Invariant (Planetary Midpoints)
    const compRep = this.compositeEngine.calculateComposite(chart, partnerChart, "romantic");
    const p1Sun = chart.planets[0].longitude;
    const p2Sun = partnerChart.planets[0].longitude;
    const expCompSun = this.midpointCalculator.calculateMidpoint(p1Sun, p2Sun);
    const actualCompSun = compRep.planets.find((p) => p.name === "Sun")?.longitude || 0;
    const rawCompSunDiff = Math.abs(expCompSun - actualCompSun);
    const compSunDiff = Math.min(rawCompSunDiff, 360 - rawCompSunDiff);
    results.push({
      id: "W-REL-02",
      name: "Composite Chart Mathematical Midpoint Invariant",
      category: "Relationship Astrology",
      standardReference: "John Townley / Robert Hand (Planets in Composite, 1975)",
      expected: `Composite Sun = Midpoint(${p1Sun.toFixed(1)}°, ${p2Sun.toFixed(1)}°) = ${expCompSun.toFixed(2)}°`,
      actual: `${actualCompSun.toFixed(2)}° (diff ${compSunDiff.toFixed(4)}°)`,
      passed: compSunDiff < 0.05,
      details: "The composite chart represents the third energetic entity created by the union, calculating the midpoint of each pair of planets.",
    });

    // Test 24: Davison Relationship Chart Time-Space Midpoint
    const davRep = this.davisonEngine.calculateDavison(
      { birthDate: "1452-04-15", birthTime: "22:00", latitude: 43.7844, longitude: 10.9253 },
      { birthDate: "1454-05-20", birthTime: "14:30", latitude: 34.0522, longitude: -118.2437 }
    );
    results.push({
      id: "W-REL-03",
      name: "Davison Time-Space Midpoint Astronomical Chart",
      category: "Relationship Astrology",
      standardReference: "Ronald C. Davison (The Technique of Prediction, 1955)",
      expected: "Actual astrological chart cast for physical space-time midpoint",
      actual: `Midpoint Date: ${davRep.midpointDate}, Lat: ${davRep.midpointLocation.latitude}°, Lon: ${davRep.midpointLocation.longitude}°`,
      passed: davRep.chartData.planets.length >= 10 && davRep.chartData.houses.length === 12,
      details: "Unlike mathematical composite midpoints, the Davison chart casts an actual astronomical event at the precise space-time midpoint of the two souls.",
    });
  }

  // --- Category 6: Classical Benchmark Invariants ---
  private runClassicalBenchmarkTests(results: WesternTestCaseResult[]): void {
    // Test 25: J2000.0 Epoch Reference Solar Longitude (~280.46° at 2000-01-01 12:00 TT)
    const j2000Chart = calculateWesternChart(2000, 1, 1, 12, 0, 51.4769, 0.0, 0, "Placidus");
    const sunJ2000 = j2000Chart.planets.find((p) => p.name === "Sun")!;
    // Rounded J2000 solar-longitude reference (~280.46°); coarse sanity check only.
    const expectedSunJ2000 = 280.46;
    const diffJ2000 = Math.abs(sunJ2000.longitude - expectedSunJ2000);
    results.push({
      id: "W-BENCH-01",
      name: "J2000.0 Epoch Astronomical Calibration (Greenwich 12:00)",
      category: "Classical Benchmark Verification",
      standardReference: "Rounded J2000 solar-longitude sanity reference (not an independent DE405 comparison)",
      expected: `Sun at ~280.46° (10°27' Capricorn)`,
      actual: `Sun at ${sunJ2000.longitude.toFixed(2)}° (${sunJ2000.signDegreeFormatted}, diff ${diffJ2000.toFixed(2)}°)`,
      passed: diffJ2000 < 0.25,
      details: "Checks a broad epoch/sign value only; this does not certify planetary ephemeris accuracy.",
    });

    // Test 26: Historical Leonardo da Vinci Classical Chart (April 15, 1452, Vinci, Italy)
    // Leonardo da Vinci's historical horoscope has Sun in early/mid Taurus in Gregorian or 25° Aries in Julian calendar
    const leoChart = calculateWesternChart(1452, 4, 15, 22, 0, 43.7844, 10.9253, 1, "Placidus");
    const leoSun = leoChart.planets.find((p) => p.name === "Sun")!;
    const leoMoon = leoChart.planets.find((p) => p.name === "Moon")!;
    results.push({
      id: "W-BENCH-02",
      name: "Leonardo da Vinci (1452) Historical Natal Chart Benchmark",
      category: "Classical Benchmark Verification",
      standardReference: "Historical Horoscopes / Rodden Rating AA (Diary of Antonio da Vinci)",
      expected: "Sun in Aries 25°, Moon in Scorpio 26°, Ascendant in Sagittarius",
      actual: `Sun: ${leoSun.signDegreeFormatted}, Moon: ${leoMoon.signDegreeFormatted}, ASC: ${leoChart.ascendant.signDegreeFormatted}`,
      passed: leoSun.sign === "Aries" && leoMoon.sign === "Scorpio" && leoChart.ascendant.sign === "Sagittarius",
      details: "Matches historical archival birth records documented by Leonardo's grandfather in the State Archives of Florence.",
    });

    // Test 27: Royal Archangel Fixed Star Regulus Longitude Calibration
    // Regulus entered Virgo 0°00' in 2011; J2000 longitude was 150.08° (29°50' Leo)
    const regulus = FixedStarsEngine.FIXED_STARS.find((s) => s.name.includes("Regulus"));
    results.push({
      id: "W-BENCH-03",
      name: "Royal Archangel Fixed Star Regulus J2000 Calibration",
      category: "Classical Benchmark Verification",
      standardReference: "Ptolemaic Star Catalogue / Hipparchus Precession Rate",
      expected: "Regulus at 150.08° (Leo 29°50' / Archangel Raphael)",
      actual: `${regulus?.name} calibrated at ${regulus?.longitude}° (${regulus?.nature})`,
      passed: !!regulus && Math.abs(regulus.longitude - 150.08) < 0.05,
      details: "The 4 Royal Archangel stars of Persia anchor celestial orientation across millennia of precession.",
    });
  }
}
