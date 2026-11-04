/**
 * Classical Vedic Astrological Benchmark & Invariant Testing Engine
 * Comprehensive mathematical verification for:
 * 1. Ashtakavarga Engine (SAV 337-point invariant, BAV individual invariants, Shodhana, Kakshas)
 * 2. Shadbala Engine (Sthana, Dig, Kala, Cheshta, Naisargika, Drik, Required Rupas)
 * 3. Avastha Engine (Baladi odd/even degree reversal, Jagradi, Deeptadi, Sayanadi)
 * 4. Classical Horary / Avatar Benchmark Horoscope validation (BPHS Ch. 27, 45, 66)
 */

import { AshtakavargaEngine, AshtakavargaBirthChart, STANDARD_BAV_TOTALS } from "./ashtakavargaEngine";
import { ShadbalaEngine, ShadbalaChartInput } from "./shadbalaEngine";
import { AvasthaEngine, AvasthaChartInput } from "./avasthaEngine";

export interface TestCaseResult {
  id: string;
  name: string;
  category: "Ashtakavarga" | "Shadbala" | "Avasthas" | "Classical Benchmark";
  shastraReference: string;
  expected: string;
  actual: string;
  passed: boolean;
  notes?: string;
}

export interface VedicSuiteReport {
  timestamp: string;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  passRatePercent: number;
  durationMs: number;
  categories: {
    ashtakavarga: { total: number; passed: number };
    shadbala: { total: number; passed: number };
    avasthas: { total: number; passed: number };
    benchmarks: { total: number; passed: number };
  };
  results: TestCaseResult[];
}

export class VedicBenchmarkRunner {
  private ashtakavargaEngine = new AshtakavargaEngine();
  private shadbalaEngine = new ShadbalaEngine();
  private avasthaEngine = new AvasthaEngine();

  /**
   * Run the full suite of automated unit tests and mathematical assertions.
   */
  public runFullSuite(customChart?: {
    ascendant: number;
    planets: Record<string, { longitude: number; isRetrograde?: boolean }>;
    birthDate?: Date;
  }): VedicSuiteReport {
    const startTime = performance.now();
    const results: TestCaseResult[] = [];

    // 1. Ashtakavarga Tests
    this.runAshtakavargaTests(results, customChart);

    // 2. Shadbala Tests
    this.runShadbalaTests(results, customChart);

    // 3. Avasthas Tests
    this.runAvasthaTests(results);

    // 4. Classical Benchmark Chart Tests
    this.runClassicalBenchmarkTests(results);

    const endTime = performance.now();
    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = results.length - passedCount;

    const countForCat = (cat: string) => ({
      total: results.filter((r) => r.category === cat).length,
      passed: results.filter((r) => r.category === cat && r.passed).length,
    });

    return {
      timestamp: new Date().toISOString(),
      totalTests: results.length,
      passedCount,
      failedCount,
      passRatePercent: Math.round((passedCount / results.length) * 1000) / 10,
      durationMs: Math.round((endTime - startTime) * 100) / 100,
      categories: {
        ashtakavarga: countForCat("Ashtakavarga"),
        shadbala: countForCat("Shadbala"),
        avasthas: countForCat("Avasthas"),
        benchmarks: countForCat("Classical Benchmark"),
      },
      results,
    };
  }

  // -------------------------------------------------------------
  // 1. ASHTAKAVARGA TESTS
  // -------------------------------------------------------------
  private runAshtakavargaTests(
    results: TestCaseResult[],
    customChart?: {
      ascendant: number;
      planets: Record<string, { longitude: number; isRetrograde?: boolean }>;
    }
  ) {
    const sampleChart: AshtakavargaBirthChart = customChart || {
      ascendant: 24.5, // Mesha / Aries
      planets: {
        Sun: { longitude: 35.2 }, // Vrishabha
        Moon: { longitude: 102.8 }, // Karka
        Mars: { longitude: 298.4 }, // Makara
        Mercury: { longitude: 48.1 }, // Vrishabha
        Jupiter: { longitude: 105.6 }, // Karka
        Venus: { longitude: 357.2 }, // Meena
        Saturn: { longitude: 204.0 }, // Tula
      },
    };

    const bav = this.ashtakavargaEngine.calculateBhinnashtakavarga(sampleChart);
    const sav = this.ashtakavargaEngine.calculateSarvashtakavarga(bav);

    // Test 1.1: Sarvashtakavarga Total Invariant = 337
    results.push({
      id: "AV-01",
      name: "Sarvashtakavarga Total Bindus Invariant (337)",
      category: "Ashtakavarga",
      shastraReference: "BPHS Ch. 66, Sloka 31-33",
      expected: "337 points",
      actual: `${sav.totalPoints} points`,
      passed: sav.totalPoints === 337,
      notes: "Classical invariant: 7 planets sum must equal 337 bindus across all 12 signs without exception.",
    });

    // Test 1.2: Individual BAV Planetary Totals
    const expectedTotals: Record<string, number> = {
      Sun: 48,
      Moon: 49,
      Mars: 39,
      Mercury: 54,
      Jupiter: 56,
      Venus: 52,
      Saturn: 39,
    };

    for (const [planet, expected] of Object.entries(expectedTotals)) {
      const actual = bav.totals[planet] || 0;
      results.push({
        id: `AV-02-${planet}`,
        name: `Bhinnashtakavarga Donor Invariant for ${planet}`,
        category: "Ashtakavarga",
        shastraReference: `BPHS Ch. 66 (${planet} Ashtakavarga)`,
        expected: `${expected} bindus`,
        actual: `${actual} bindus`,
        passed: actual === expected,
        notes: `Total points donated to all 12 signs must strictly be ${expected}.`,
      });
    }

    // Test 1.3: Lagna BAV Total Invariant = 49
    const lagnaActual = bav.totals["Ascendant"] || 0;
    results.push({
      id: "AV-03-Ascendant",
      name: "Ascendant (Lagna) BAV Total Invariant",
      category: "Ashtakavarga",
      shastraReference: "BPHS Ch. 66 (Lagna Ashtakavarga)",
      expected: "49 bindus",
      actual: `${lagnaActual} bindus`,
      passed: lagnaActual === 49,
      notes: "Ascendant Bhinnashtakavarga invariant total is 49 points.",
    });

    // Test 1.4: Trikona Shodhana Reduction Integrity
    const testRasiBindus = [4, 5, 3, 2, 6, 4, 3, 5, 2, 3, 4, 6];
    const trikonaReduced = this.ashtakavargaEngine.performTrikonaShodhana(testRasiBindus);
    const hasNegatives = trikonaReduced.some((v) => v < 0);
    const sumBefore = testRasiBindus.reduce((a, b) => a + b, 0);
    const sumAfter = trikonaReduced.reduce((a, b) => a + b, 0);
    results.push({
      id: "AV-04",
      name: "Trikona Shodhana Non-Negative & Bound Reduction",
      category: "Ashtakavarga",
      shastraReference: "BPHS Ch. 67 (Trikona Shodhana)",
      expected: "Non-negative values and sum reduction (<= 47)",
      actual: `Min value: ${Math.min(...trikonaReduced)}, Sum reduced from ${sumBefore} to ${sumAfter}`,
      passed: !hasNegatives && sumAfter <= sumBefore,
      notes: "Trikona Shodhana subtracts the minimum of the trine signs (1-5-9, 2-6-10, 3-7-11, 4-8-12).",
    });

    // Test 1.5: Kaksha Divisions
    const kakshas = AshtakavargaEngine.KAKSHA_LORDS;
    const kakshaLordsPassed =
      kakshas.length === 8 &&
      kakshas[0] === "Saturn" &&
      kakshas[1] === "Jupiter" &&
      kakshas[2] === "Mars" &&
      kakshas[3] === "Sun" &&
      kakshas[4] === "Venus" &&
      kakshas[5] === "Mercury" &&
      kakshas[6] === "Moon" &&
      kakshas[7] === "Ascendant";

    results.push({
      id: "AV-05",
      name: "Kaksha Planetary Rulership Order (3°45' each)",
      category: "Ashtakavarga",
      shastraReference: "BPHS Ch. 71, Sloka 1-4",
      expected: "Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon, Ascendant",
      actual: kakshas.join(", "),
      passed: kakshaLordsPassed,
      notes: "Kaksha lords must strictly follow the classical orbital speed hierarchy from slowest (Saturn) to fastest (Moon/Ascendant).",
    });
  }

  // -------------------------------------------------------------
  // 2. SHADBALA TESTS
  // -------------------------------------------------------------
  private runShadbalaTests(
    results: TestCaseResult[],
    customChart?: {
      ascendant: number;
      planets: Record<string, { longitude: number; isRetrograde?: boolean }>;
      birthDate?: Date;
    }
  ) {
    const shadInput: ShadbalaChartInput = {
      ascendant: customChart?.ascendant ?? 0,
      birthDate: customChart?.birthDate ?? new Date("1990-06-15T12:00:00Z"),
      latitude: 28.6139,
      longitude: 77.209,
      planets: customChart?.planets ?? {
        Sun: { longitude: 60, speed: 1.0 },
        Moon: { longitude: 330, speed: 13.2 },
        Mars: { longitude: 280, isRetrograde: false },
        Mercury: { longitude: 70, speed: 1.2 },
        Jupiter: { longitude: 95, isRetrograde: true },
        Venus: { longitude: 40, speed: 1.1 },
        Saturn: { longitude: 210, isRetrograde: false },
      },
    };

    // Test 2.1: Naisargika Bala Invariant Points
    const naisargikaPoints = ShadbalaEngine.NAISARGIKA_POINTS;
    const naisargikaCorrect =
      naisargikaPoints["Sun"] === 60.0 &&
      naisargikaPoints["Moon"] === 51.43 &&
      naisargikaPoints["Venus"] === 42.85 &&
      naisargikaPoints["Jupiter"] === 34.28 &&
      naisargikaPoints["Mercury"] === 25.71 &&
      naisargikaPoints["Mars"] === 17.14 &&
      naisargikaPoints["Saturn"] === 8.57;

    results.push({
      id: "SB-01",
      name: "Naisargika Bala Fixed Virupas (Sun to Saturn)",
      category: "Shadbala",
      shastraReference: "BPHS Ch. 27, Sloka 19-20",
      expected: "Sun: 60, Moon: 51.43, Venus: 42.85, Jupiter: 34.28, Mercury: 25.71, Mars: 17.14, Saturn: 8.57",
      actual: `Sun: ${naisargikaPoints["Sun"]}, Moon: ${naisargikaPoints["Moon"]}, Venus: ${naisargikaPoints["Venus"]}, Saturn: ${naisargikaPoints["Saturn"]}`,
      passed: naisargikaCorrect,
      notes: "Naisargika (natural) strength reflects relative luminosity and optical visibility.",
    });

    // Test 2.2: Dig Bala Maximum at Cardinal Points
    // Jupiter peaks in 1st House (0° from Ascendant = 60 Virupas)
    const jupiterAtLagnaInput: ShadbalaChartInput = {
      ascendant: 90,
      planets: {
        Jupiter: { longitude: 90 }, // exactly at Lagna
      },
    };
    const jupDig = this.shadbalaEngine.calculateDigBala("Jupiter", jupiterAtLagnaInput);
    results.push({
      id: "SB-02",
      name: "Jupiter Dig Bala Peak at Lagna (1st House)",
      category: "Shadbala",
      shastraReference: "BPHS Ch. 27, Sloka 13-14",
      expected: "60.0 Virupas",
      actual: `${jupDig.points} Virupas`,
      passed: jupDig.points >= 59.9,
      notes: "Jupiter and Mercury achieve peak directional strength (60 Virupas) in the 1st House (East).",
    });

    // Test 2.3: Mars Dig Bala Peak at 10th House
    const marsAt10thInput: ShadbalaChartInput = {
      ascendant: 0,
      planets: {
        Mars: { longitude: 270 }, // 10th house cusp (South)
      },
    };
    const marsDig = this.shadbalaEngine.calculateDigBala("Mars", marsAt10thInput);
    results.push({
      id: "SB-03",
      name: "Mars Dig Bala Peak at Midheaven (10th House)",
      category: "Shadbala",
      shastraReference: "BPHS Ch. 27, Sloka 13-14",
      expected: "60.0 Virupas",
      actual: `${marsDig.points} Virupas`,
      passed: marsDig.points >= 59.9,
      notes: "Sun and Mars achieve peak directional strength (60 Virupas) at the South point (10th House).",
    });

    // Test 2.4: Saturn Dig Bala Peak at 7th House
    const saturnAt7thInput: ShadbalaChartInput = {
      ascendant: 0,
      planets: {
        Saturn: { longitude: 180 }, // 7th house cusp (West)
      },
    };
    const satDig = this.shadbalaEngine.calculateDigBala("Saturn", saturnAt7thInput);
    results.push({
      id: "SB-04",
      name: "Saturn Dig Bala Peak at Descendant (7th House)",
      category: "Shadbala",
      shastraReference: "BPHS Ch. 27, Sloka 13-14",
      expected: "60.0 Virupas",
      actual: `${satDig.points} Virupas`,
      passed: satDig.points >= 59.9,
      notes: "Saturn achieves peak directional strength (60 Virupas) in the West (7th House).",
    });

    // Test 2.5: Cheshta Bala for Retrograde Planet
    const retroJupiterInput: ShadbalaChartInput = {
      ascendant: 0,
      planets: {
        Jupiter: { longitude: 100, isRetrograde: true },
      },
    };
    const retroCheshta = this.shadbalaEngine.calculateCheshtaBala("Jupiter", retroJupiterInput);
    results.push({
      id: "SB-05",
      name: "Cheshta Bala (Motional Strength) for Retrograde (Vakra)",
      category: "Shadbala",
      shastraReference: "BPHS Ch. 27, Sloka 21-22",
      expected: "60.0 Virupas (Vakra max potency)",
      actual: `${retroCheshta.points} Virupas (${retroCheshta.state})`,
      passed: retroCheshta.points === 60.0,
      notes: "A retrograde planet receives maximum Cheshta Bala (60 Virupas) due to proximity to Earth.",
    });

    // Test 2.6: Required Rupas Minimum Thresholds
    const reqRupas = ShadbalaEngine.REQUIRED_RUPAS;
    const reqCorrect =
      reqRupas["Sun"] === 6.5 &&
      reqRupas["Moon"] === 6.0 &&
      reqRupas["Mars"] === 5.0 &&
      reqRupas["Mercury"] === 7.0 &&
      reqRupas["Jupiter"] === 6.5 &&
      reqRupas["Venus"] === 5.5 &&
      reqRupas["Saturn"] === 5.0;

    results.push({
      id: "SB-06",
      name: "Standard Required Minimum Rupas Thresholds",
      category: "Shadbala",
      shastraReference: "BPHS Ch. 28, Sloka 1-3",
      expected: "Sun: 6.5, Moon: 6.0, Mars: 5.0, Mercury: 7.0, Jupiter: 6.5, Venus: 5.5, Saturn: 5.0",
      actual: `Sun: ${reqRupas["Sun"]}, Moon: ${reqRupas["Moon"]}, Mars: ${reqRupas["Mars"]}, Mercury: ${reqRupas["Mercury"]}, Jupiter: ${reqRupas["Jupiter"]}, Venus: ${reqRupas["Venus"]}, Saturn: ${reqRupas["Saturn"]}`,
      passed: reqCorrect,
      notes: "Required Rupas ensure each planet meets its shastric strength benchmark.",
    });
  }

  // -------------------------------------------------------------
  // 3. AVASTHAS TESTS
  // -------------------------------------------------------------
  private runAvasthaTests(results: TestCaseResult[]) {
    // Test 3.1: Baladi Avastha in Odd Sign (Aries = Odd)
    // 0°-6° Bala (25%), 6°-12° Kumara (50%), 12°-18° Yuva (100%), 18°-24° Vriddha (50%), 24°-30° Mrita (10%)
    const oddInput: AvasthaChartInput = {
      ascendant: 0,
      planets: {
        Sun: { longitude: 4.5 }, // Aries (Odd) at 4.5° -> Bala
        Moon: { longitude: 8.2 }, // Aries at 8.2° -> Kumara
        Mars: { longitude: 15.0 }, // Aries at 15° -> Yuva
        Mercury: { longitude: 21.0 }, // Aries at 21° -> Vriddha
        Jupiter: { longitude: 28.5 }, // Aries at 28.5° -> Mrita
      },
    };

    const sunAvastha = this.avasthaEngine.calculatePlanetAvasthas("Sun", oddInput);
    const marsAvastha = this.avasthaEngine.calculatePlanetAvasthas("Mars", oddInput);
    const jupAvastha = this.avasthaEngine.calculatePlanetAvasthas("Jupiter", oddInput);

    results.push({
      id: "AVS-01",
      name: "Baladi Avastha in Odd Sign (Aries 0°-6° = Bala)",
      category: "Avasthas",
      shastraReference: "BPHS Ch. 45, Sloka 3-5",
      expected: "Bala (Child) - 25% potency",
      actual: `${sunAvastha.baladi.state} - ${sunAvastha.baladi.strengthPercent}%`,
      passed: sunAvastha.baladi.state === "Bala (Child)" && sunAvastha.baladi.strengthPercent === 25,
      notes: "In odd signs, degrees 0°-6° represent infancy (Bala).",
    });

    results.push({
      id: "AVS-02",
      name: "Baladi Avastha in Odd Sign (Aries 12°-18° = Yuva Peak 100%)",
      category: "Avasthas",
      shastraReference: "BPHS Ch. 45, Sloka 3-5",
      expected: "Yuva (Adult) - 100% peak potency",
      actual: `${marsAvastha.baladi.state} - ${marsAvastha.baladi.strengthPercent}%`,
      passed: marsAvastha.baladi.state === "Yuva (Adult)" && marsAvastha.baladi.strengthPercent === 100,
      notes: "In odd signs, degrees 12°-18° represent full adult prime potency (Yuva 100%).",
    });

    results.push({
      id: "AVS-03",
      name: "Baladi Avastha in Odd Sign (Aries 24°-30° = Mrita)",
      category: "Avasthas",
      shastraReference: "BPHS Ch. 45, Sloka 3-5",
      expected: "Mrita (Dead) - 10% potency",
      actual: `${jupAvastha.baladi.state} - ${jupAvastha.baladi.strengthPercent}%`,
      passed: jupAvastha.baladi.state === "Mrita (Dead)" && jupAvastha.baladi.strengthPercent === 10,
      notes: "In odd signs, degrees 24°-30° represent dormant/end state (Mrita).",
    });

    // Test 3.2: Baladi Avastha Classical Reversal in Even Sign (Taurus = Even)
    // In Even Sign: 0°-6° Mrita (10%), 6°-12° Vriddha (50%), 12°-18° Yuva (100%), 18°-24° Kumara (50%), 24°-30° Bala (25%)
    const evenInput: AvasthaChartInput = {
      ascendant: 0,
      planets: {
        Venus: { longitude: 33.0 }, // Taurus (Even) at 3° -> Mrita (Reversed!)
        Saturn: { longitude: 57.0 }, // Taurus at 27° -> Bala (Reversed!)
      },
    };

    const venAvastha = this.avasthaEngine.calculatePlanetAvasthas("Venus", evenInput);
    const satAvastha = this.avasthaEngine.calculatePlanetAvasthas("Saturn", evenInput);

    results.push({
      id: "AVS-04",
      name: "Baladi Even Sign Reversal (Taurus 0°-6° = Mrita)",
      category: "Avasthas",
      shastraReference: "BPHS Ch. 45, Sloka 5-6",
      expected: "Mrita (Dead) - 10% potency (Reversed in even sign)",
      actual: `${venAvastha.baladi.state} - ${venAvastha.baladi.strengthPercent}%`,
      passed: venAvastha.baladi.state === "Mrita (Dead)" && venAvastha.baladi.strengthPercent === 10,
      notes: "Critical Parashari rule: Even signs invert the age sequence completely.",
    });

    results.push({
      id: "AVS-05",
      name: "Baladi Even Sign Reversal (Taurus 24°-30° = Bala)",
      category: "Avasthas",
      shastraReference: "BPHS Ch. 45, Sloka 5-6",
      expected: "Bala (Child) - 25% potency (Reversed in even sign)",
      actual: `${satAvastha.baladi.state} - ${satAvastha.baladi.strengthPercent}%`,
      passed: satAvastha.baladi.state === "Bala (Child)" && satAvastha.baladi.strengthPercent === 25,
      notes: "In even signs, 24°-30° is Bala (Infant), exactly inverse of odd signs.",
    });

    // Test 3.3: Jagradi Avastha (Exalted = Jagrata / Awake)
    const exaltedSunInput: AvasthaChartInput = {
      ascendant: 0,
      planets: {
        Sun: { longitude: 10.0 }, // Aries 10° = Exalted
      },
    };
    const jagradiRes = this.avasthaEngine.calculatePlanetAvasthas("Sun", exaltedSunInput);
    results.push({
      id: "AVS-06",
      name: "Jagradi Avastha for Exalted Planet (Jagrata / Awake)",
      category: "Avasthas",
      shastraReference: "BPHS Ch. 45, Sloka 7-9",
      expected: "Jagrata (Awake) - 100% functional output",
      actual: `${jagradiRes.jagradi.state} - ${jagradiRes.jagradi.functionalPercent}%`,
      passed: jagradiRes.jagradi.state === "Jagrata (Awake)" && jagradiRes.jagradi.functionalPercent === 100,
      notes: "A planet in exaltation or own sign is Jagrata (Awake and fully capable).",
    });

    // Test 3.4: Sayanadi Avastha 12 Activity States Valid Bounds
    results.push({
      id: "AVS-07",
      name: "Sayanadi Avastha Modulo 12 Mapping Range (1 to 12)",
      category: "Avasthas",
      shastraReference: "BPHS Ch. 45, Sloka 11-18",
      expected: "Index between 1 and 12 with valid Sanskrit name",
      actual: `Index ${jagradiRes.sayanadi.index} (${jagradiRes.sayanadi.name})`,
      passed: jagradiRes.sayanadi.index >= 1 && jagradiRes.sayanadi.index <= 12 && !!jagradiRes.sayanadi.name,
      notes: "Sayanadi calculates one of 12 physiological and behavioral states from Sayana to Nidra.",
    });
  }

  // -------------------------------------------------------------
  // 4. CLASSICAL BENCHMARK CHARTS
  // -------------------------------------------------------------
  private runClassicalBenchmarkTests(results: TestCaseResult[]) {
    // Benchmark 1: Classical Avatar / Parashara Exemplar Horoscope
    // Sun in Aries 10° (Exalted), Moon in Cancer 3° (Own Sign/Moolatrikona),
    // Mars in Capricorn 28° (Exalted), Jupiter in Cancer 5° (Exalted),
    // Venus in Pisces 27° (Exalted), Saturn in Libra 20° (Exalted), Lagna in Cancer.
    const avatarChart: AshtakavargaBirthChart = {
      ascendant: 95.0, // Cancer
      planets: {
        Sun: { longitude: 10.0 }, // Aries
        Moon: { longitude: 93.0 }, // Cancer
        Mars: { longitude: 298.0 }, // Capricorn
        Mercury: { longitude: 25.0 }, // Aries
        Jupiter: { longitude: 95.0 }, // Cancer
        Venus: { longitude: 357.0 }, // Pisces
        Saturn: { longitude: 200.0 }, // Libra
      },
    };

    const bav = this.ashtakavargaEngine.calculateBhinnashtakavarga(avatarChart);
    const sav = this.ashtakavargaEngine.calculateSarvashtakavarga(bav);

    results.push({
      id: "BM-01",
      name: "Exalted Graha Benchmark Chart SAV Invariant Consistency",
      category: "Classical Benchmark",
      shastraReference: "BPHS Ch. 66 & Sripathi Paddhati",
      expected: "Total 337 bindus across all 12 signs",
      actual: `${sav.totalPoints} bindus`,
      passed: sav.totalPoints === 337,
      notes: "All 5 exalted planets retain the mathematical 337-point law.",
    });

    // Benchmark 2: Check that exalted planets have high Uccha Bala (> 50 Virupas)
    const shadAvatarInput: ShadbalaChartInput = {
      ascendant: 95.0,
      planets: {
        Sun: { longitude: 10.0 }, // Exalted Aries 10°
        Jupiter: { longitude: 95.0 }, // Exalted Cancer 5°
      },
    };
    const sunSthana = this.shadbalaEngine.calculateSthanaBala("Sun", shadAvatarInput);
    results.push({
      id: "BM-02",
      name: "Exalted Sun Uccha Bala Peak Benchmark",
      category: "Classical Benchmark",
      shastraReference: "BPHS Ch. 27, Sloka 2-3",
      expected: "Uccha Bala >= 55 Virupas (Exalted in Aries 10°)",
      actual: `${sunSthana.ucchaBala} Virupas`,
      passed: sunSthana.ucchaBala >= 55,
      notes: "Sun at deep exaltation degree (10° Aries) receives near maximum 60 Uccha Bala Virupas.",
    });

    const jupSthana = this.shadbalaEngine.calculateSthanaBala("Jupiter", shadAvatarInput);
    results.push({
      id: "BM-03",
      name: "Exalted Jupiter Uccha Bala Peak Benchmark",
      category: "Classical Benchmark",
      shastraReference: "BPHS Ch. 27, Sloka 2-3",
      expected: "Uccha Bala >= 55 Virupas (Exalted in Cancer 5°)",
      actual: `${jupSthana.ucchaBala} Virupas`,
      passed: jupSthana.ucchaBala >= 55,
      notes: "Jupiter at deep exaltation degree (5° Cancer) receives near maximum 60 Uccha Bala Virupas.",
    });
  }
}
