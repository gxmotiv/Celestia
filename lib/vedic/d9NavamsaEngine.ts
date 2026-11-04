/**
 * Complete D9 Navamsa Engine for Vedic Astrology (Jyotish)
 *
 * Implements classical Parashari and Jaimini Navamsa calculation rules:
 * - 108 Navamsas (9 divisions per sign of 3°20' each)
 * - Movable (Chara), Fixed (Sthira), and Dual (Dwisvabhava) starting sign determination
 * - Vargottama detection & strength assessment
 * - Pushkara Navamsa identification
 * - Atmakaraka & Karakamsha Lagna calculation
 * - Ishta Devata determination (12th from Karakamsha)
 * - Marriage and relationship indicators (Venus, Jupiter, 7th house in D9)
 * - Spiritual path & dharma analysis
 */

import type { VedicChartData } from "../astronomy/vedic";

export interface NavamsaPosition {
  planetName: string;
  symbol: string;
  sign: string;
  signSanskrit: string;
  signIndex: number; // 0 = Aries/Mesha ... 11 = Pisces/Meena
  degree: number; // 0 to 29.999° within the Navamsa sign
  degreeFormatted: string;
  navamsaNumber: number; // 1 to 9 within the Rasi sign
  signType: "Movable" | "Fixed" | "Dual";
  originalSign: string;
  originalSignIndex: number;
  originalDegree: number;
  originalDegreeFormatted: string;
  vargottama: boolean;
  isPushkara: boolean;
  dignity: "Exalted" | "Own Sign" | "Friendly" | "Neutral" | "Enemy" | "Debilitated";
  house: number; // 1 to 12 in D9 relative to D9 Ascendant
  ruler: string;
  element: "Fire" | "Earth" | "Air" | "Water";
  strength: PlanetStrength;
  interpretation: string;
  relationshipSignificance: string;
  spiritualSignificance: string;
}

export interface PlanetStrength {
  score: number; // 0 to 100
  classification: "Excellently Strong" | "Strong" | "Moderate" | "Challenged";
  factors: string[];
}

export interface D9House {
  house: number; // 1 to 12
  signIndex: number;
  signName: string;
  signSanskrit: string;
  lord: string;
  planets: NavamsaPosition[];
  significance: string;
  condition: "Fortified" | "Harmonious" | "Challenged" | "Neutral";
}

export type D9Houses = Record<number, D9House>;

export interface MarriageAnalysis {
  venusStrength: string;
  jupiterBlessing: string;
  seventhHouseCondition: string;
  marriageTiming: string;
  partnerCharacteristics: string;
  challenges: string;
  relationshipCompatibilityScore: number; // 0 to 100
  karmicLessons: string[];
}

export interface SpiritualPathAnalysis {
  pathSummary: string;
  dharmaOrientation: string;
  karakamshaLagna: {
    sign: string;
    signIndex: number;
    houseInD9: number;
    atmakarakaPlanet: string;
    meaning: string;
  };
  ishtaDevata: {
    sign: string;
    signIndex: number;
    rulingPlanet: string;
    deityName: string;
    mantra: string;
    guidance: string;
  };
  spiritualRemedies: string[];
}

export interface D9ChartAnalysis {
  overallStrengthScore: number; // 0 to 100
  vargottamaPlanets: NavamsaPosition[];
  pushkaraPlanets: NavamsaPosition[];
  exaltedPlanets: NavamsaPosition[];
  debilitatedPlanets: NavamsaPosition[];
  dharmaPlanets: NavamsaPosition[]; // Planets in Dharma trikona (1, 5, 9)
  keyHighlights: string[];
}

export interface D9Yoga {
  name: string;
  sanskritName: string;
  description: string;
  planetsInvolved: string[];
  intensity: "High" | "Moderate" | "Subtle";
  category: "Raja Yoga" | "Dignity Yoga" | "Spiritual Yoga" | "Relationship Yoga";
  isPresent: boolean;
}

export interface D9Chart {
  planets: Record<string, NavamsaPosition>;
  ascendant: NavamsaPosition;
  houses: D9Houses;
  analysis: D9ChartAnalysis;
  marriageIndicators: MarriageAnalysis;
  spiritualPath: SpiritualPathAnalysis;
  yogas: D9Yoga[];
}

export interface BirthChartInput {
  ascendant: number; // Sidereal longitude in degrees (0 to 360)
  planets: Record<string, { longitude: number; speed?: number; isRetrograde?: boolean }>;
}

export class NavamsaCalculator {
  public static readonly SIGN_NAMES = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];

  public static readonly SIGN_SANSKRIT = [
    "Mesha (मेष)", "Vrishabha (वृषभ)", "Mithuna (मिथुन)", "Karka (कर्क)",
    "Simha (सिंह)", "Kanya (कन्या)", "Tula (तुला)", "Vrischika (वृश्चिक)",
    "Dhanu (धनु)", "Makara (मकर)", "Kumbha (कुम्भ)", "Meena (मीन)"
  ];

  public static readonly SIGN_RULERS = [
    "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
    "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"
  ];

  public static readonly SIGN_ELEMENTS: ("Fire" | "Earth" | "Air" | "Water")[] = [
    "Fire", "Earth", "Air", "Water", "Fire", "Earth",
    "Air", "Water", "Fire", "Earth", "Air", "Water"
  ];

  public static readonly PLANET_SYMBOLS: Record<string, string> = {
    Sun: "☉", Moon: "☽", Mars: "♂", Mercury: "☿", Jupiter: "♃",
    Venus: "♀", Saturn: "♄", Rahu: "☊", Ketu: "☋", Ascendant: "Asc", Lagna: "Lg"
  };

  /**
   * Pushkara Navamsa mapping (Jaimini/Parashari standard)
   * Navamsa number (1-9) within specific signs that fall in Pushkara
   */
  public static readonly PUSHKARA_NAVAMSAS: Record<number, number[]> = {
    // Fire signs (Aries, Leo, Sagittarius): 7th (Libra/Venus) & 9th (Sagittarius/Jupiter)
    0: [7, 9], 4: [7, 9], 8: [7, 9],
    // Earth signs (Taurus, Virgo, Capricorn): 3rd (Pisces/Jupiter) & 5th (Taurus/Venus)
    1: [3, 5], 5: [3, 5], 9: [3, 5],
    // Air signs (Gemini, Libra, Aquarius): 6th (Pisces/Jupiter) & 8th (Taurus/Venus)
    2: [6, 8], 6: [6, 8], 10: [6, 8],
    // Water signs (Cancer, Scorpio, Pisces): 1st (Cancer/Moon) & 3rd (Virgo/Mercury)
    3: [1, 3], 7: [1, 3], 11: [1, 3],
  };

  /**
   * Calculate Navamsa (D9) position for a given sidereal longitude
   */
  public calculateNavamsa(
    longitude: number,
    planetName: string = "Point"
  ): NavamsaPosition {
    const norm = (longitude % 360 + 360) % 360;
    const signIndex = Math.floor(norm / 30);
    const degreeInSign = norm % 30;

    // Calculate Navamsa part (0 to 8)
    const navamsaNumberZeroIndexed = Math.floor(degreeInSign / (30.0 / 9.0)); // 0 to 8
    const navamsaNumber = navamsaNumberZeroIndexed + 1; // 1 to 9

    let navamsaSignIndex: number;

    // Movable signs (Aries, Cancer, Libra, Capricorn) start from sign itself
    if ([0, 3, 6, 9].includes(signIndex)) {
      navamsaSignIndex = (signIndex + navamsaNumberZeroIndexed) % 12;
    }
    // Fixed signs (Taurus, Leo, Scorpio, Aquarius) start from 9th from sign (+8)
    else if ([1, 4, 7, 10].includes(signIndex)) {
      navamsaSignIndex = (signIndex + 8 + navamsaNumberZeroIndexed) % 12;
    }
    // Dual signs (Gemini, Virgo, Sagittarius, Pisces) start from 5th from sign (+4)
    else {
      navamsaSignIndex = (signIndex + 4 + navamsaNumberZeroIndexed) % 12;
    }

    // Degree within Navamsa sign (0° to 30°)
    const degreeInNavamsa = (degreeInSign % (30.0 / 9.0)) * 9.0;
    const isVarg = this.isVargottama(signIndex, navamsaSignIndex);
    const isPushk = this.isPushkaraNavamsa(signIndex, navamsaNumber);
    const dignity = this.evaluateD9Dignity(planetName, navamsaSignIndex);

    const degMin = this.formatDegrees(degreeInNavamsa);
    const origDegMin = this.formatDegrees(degreeInSign);

    const interpretation = this.getNavamsaInterpretation(navamsaSignIndex, navamsaNumber, planetName);
    const relSignificance = this.getRelationshipSignificance(planetName, navamsaSignIndex, navamsaNumber);
    const spiritSignificance = this.getSpiritualSignificance(planetName, navamsaSignIndex, navamsaNumber);

    const strength = this.assessPlanetStrength({
      vargottama: isVarg,
      isPushkara: isPushk,
      dignity,
      navamsaNumber,
      signIndex: navamsaSignIndex,
      planetName,
    });

    return {
      planetName,
      symbol: NavamsaCalculator.PLANET_SYMBOLS[planetName] || "✦",
      sign: NavamsaCalculator.SIGN_NAMES[navamsaSignIndex],
      signSanskrit: NavamsaCalculator.SIGN_SANSKRIT[navamsaSignIndex],
      signIndex: navamsaSignIndex,
      degree: Math.round(degreeInNavamsa * 1000) / 1000,
      degreeFormatted: `${degMin} ${NavamsaCalculator.SIGN_NAMES[navamsaSignIndex]}`,
      navamsaNumber,
      signType: this.getSignType(signIndex),
      originalSign: NavamsaCalculator.SIGN_NAMES[signIndex],
      originalSignIndex: signIndex,
      originalDegree: Math.round(degreeInSign * 1000) / 1000,
      originalDegreeFormatted: `${origDegMin} ${NavamsaCalculator.SIGN_NAMES[signIndex]}`,
      vargottama: isVarg,
      isPushkara: isPushk,
      dignity,
      house: 1, // Will be set once D9 Ascendant is known
      ruler: NavamsaCalculator.SIGN_RULERS[navamsaSignIndex],
      element: NavamsaCalculator.SIGN_ELEMENTS[navamsaSignIndex],
      strength,
      interpretation,
      relationshipSignificance: relSignificance,
      spiritualSignificance: spiritSignificance,
    };
  }

  /**
   * Check if position is Vargottama (same sign in D1 Rasi and D9 Navamsa)
   */
  public isVargottama(rasiSign: number, navamsaSign: number): boolean {
    return rasiSign === navamsaSign;
  }

  /**
   * Check if position is in a sacred Pushkara Navamsa
   */
  public isPushkaraNavamsa(rasiSign: number, navamsaNumber: number): boolean {
    const list = NavamsaCalculator.PUSHKARA_NAVAMSAS[rasiSign];
    return list ? list.includes(navamsaNumber) : false;
  }

  /**
   * Sign type classification (Movable, Fixed, Dual)
   */
  public getSignType(signIndex: number): "Movable" | "Fixed" | "Dual" {
    if ([0, 3, 6, 9].includes(signIndex)) return "Movable";
    if ([1, 4, 7, 10].includes(signIndex)) return "Fixed";
    return "Dual";
  }

  /**
   * Assess planetary dignity inside D9 Navamsa sign
   */
  public evaluateD9Dignity(
    planetName: string,
    navamsaSignIndex: number
  ): NavamsaPosition["dignity"] {
    switch (planetName) {
      case "Sun":
        if (navamsaSignIndex === 0) return "Exalted"; // Aries
        if (navamsaSignIndex === 6) return "Debilitated"; // Libra
        if (navamsaSignIndex === 4) return "Own Sign"; // Leo
        if ([8, 11, 0, 7].includes(navamsaSignIndex)) return "Friendly";
        return "Neutral";

      case "Moon":
        if (navamsaSignIndex === 1) return "Exalted"; // Taurus
        if (navamsaSignIndex === 7) return "Debilitated"; // Scorpio
        if (navamsaSignIndex === 3) return "Own Sign"; // Cancer
        if ([0, 4, 8].includes(navamsaSignIndex)) return "Friendly";
        return "Neutral";

      case "Mars":
        if (navamsaSignIndex === 9) return "Exalted"; // Capricorn
        if (navamsaSignIndex === 3) return "Debilitated"; // Cancer
        if ([0, 7].includes(navamsaSignIndex)) return "Own Sign"; // Aries, Scorpio
        if ([4, 8, 11].includes(navamsaSignIndex)) return "Friendly";
        return "Neutral";

      case "Mercury":
        if (navamsaSignIndex === 5) return "Exalted"; // Virgo
        if (navamsaSignIndex === 11) return "Debilitated"; // Pisces
        if ([2, 5].includes(navamsaSignIndex)) return "Own Sign"; // Gemini, Virgo
        if ([1, 6, 4].includes(navamsaSignIndex)) return "Friendly";
        return "Neutral";

      case "Jupiter":
        if (navamsaSignIndex === 3) return "Exalted"; // Cancer
        if (navamsaSignIndex === 9) return "Debilitated"; // Capricorn
        if ([8, 11].includes(navamsaSignIndex)) return "Own Sign"; // Sag, Pisces
        if ([0, 4, 7].includes(navamsaSignIndex)) return "Friendly";
        return "Neutral";

      case "Venus":
        if (navamsaSignIndex === 11) return "Exalted"; // Pisces
        if (navamsaSignIndex === 5) return "Debilitated"; // Virgo
        if ([1, 6].includes(navamsaSignIndex)) return "Own Sign"; // Taurus, Libra
        if ([2, 9, 10].includes(navamsaSignIndex)) return "Friendly";
        return "Neutral";

      case "Saturn":
        if (navamsaSignIndex === 6) return "Exalted"; // Libra
        if (navamsaSignIndex === 0) return "Debilitated"; // Aries
        if ([9, 10].includes(navamsaSignIndex)) return "Own Sign"; // Cap, Aqua
        if ([1, 2, 5].includes(navamsaSignIndex)) return "Friendly";
        return "Neutral";

      case "Rahu":
        if ([1, 2].includes(navamsaSignIndex)) return "Exalted";
        if ([7, 8].includes(navamsaSignIndex)) return "Debilitated";
        if (navamsaSignIndex === 10) return "Own Sign";
        return "Neutral";

      case "Ketu":
        if ([7, 8].includes(navamsaSignIndex)) return "Exalted";
        if ([1, 2].includes(navamsaSignIndex)) return "Debilitated";
        if (navamsaSignIndex === 8) return "Own Sign";
        return "Neutral";

      default:
        return "Neutral";
    }
  }

  /**
   * Assess numerical strength score (0 to 100) and factors
   */
  public assessPlanetStrength(params: {
    vargottama: boolean;
    isPushkara: boolean;
    dignity: string;
    navamsaNumber: number;
    signIndex: number;
    planetName: string;
  }): PlanetStrength {
    let score = 50; // Base score
    const factors: string[] = ["Base baseline score (+50)"];

    if (params.vargottama) {
      score += 30;
      factors.push("Vargottama: Identical D1 & D9 sign reinforces core stability (+30)");
    }

    if (params.isPushkara) {
      score += 20;
      factors.push("Pushkara Navamsa: Sacred degree division bestowing healing & nourishment (+20)");
    }

    if (params.dignity === "Exalted") {
      score += 20;
      factors.push("Exalted in Navamsa: Highest functional expression (+20)");
    } else if (params.dignity === "Own Sign") {
      score += 15;
      factors.push("Swakshetra: Comfort and autonomy in own Navamsa (+15)");
    } else if (params.dignity === "Friendly") {
      score += 8;
      factors.push("Mitra Rasi: Supportive friendly Navamsa environment (+8)");
    } else if (params.dignity === "Debilitated") {
      score -= 20;
      factors.push("Debilitated in Navamsa: Requires conscious karmic transmutation (-20)");
    }

    // Navamsa number adds subtle nuance (1st Navamsa represents pioneering vigor)
    const numberBonus = (9 - params.navamsaNumber) * 2;
    score += numberBonus;
    factors.push(`Navamsa Pada ${params.navamsaNumber} placement bonus (+${numberBonus})`);

    const finalScore = Math.max(10, Math.min(100, Math.round(score)));

    let classification: PlanetStrength["classification"] = "Moderate";
    if (finalScore >= 85) classification = "Excellently Strong";
    else if (finalScore >= 70) classification = "Strong";
    else if (finalScore < 45) classification = "Challenged";

    return {
      score: finalScore,
      classification,
      factors,
    };
  }

  /**
   * Detailed Navamsa Sign & Pada interpretation
   */
  public getNavamsaInterpretation(
    signIndex: number,
    navamsaNumber: number,
    planetName: string
  ): string {
    const signName = NavamsaCalculator.SIGN_NAMES[signIndex];

    const signDescriptions: Record<number, string> = {
      0: "Aries Navamsa: Infuses dynamic courage, independent pioneering spirit, and a direct, passion-driven approach to life goals and commitments.",
      1: "Taurus Navamsa: Bestows aesthetic elegance, sensual steadfastness, emotional loyalty, and a craving for long-term tangible security.",
      2: "Gemini Navamsa: Radiates communicative versatility, intellectual curiosity, wit, and a perpetual need for stimulating dialogue.",
      3: "Cancer Navamsa: Enhances deep empathetic intuition, nurturing instincts, emotional sanctuary, and ancestral devotion.",
      4: "Leo Navamsa: Endows noble generosity, creative pride, magnetic charisma, and an inherent need to be genuinely honored by one's peers.",
      5: "Virgo Navamsa: Fosters analytical precision, discerning craft, practical devotion, and a dedication to improving daily routines.",
      6: "Libra Navamsa: Inspires graceful diplomacy, harmonious aesthetic taste, fairness, and a sophisticated approach to partnerships.",
      7: "Scorpio Navamsa: Instills intense psychological depth, transformative emotional power, unwavering loyalty, and acute psychic radar.",
      8: "Sagittarius Navamsa: Elevates philosophical idealism, spiritual questing, boundless enthusiasm, and a hunger for universal truth.",
      9: "Capricorn Navamsa: Develops pragmatic discipline, patient structural ambition, ethical responsibility, and enduring perseverance.",
      10: "Aquarius Navamsa: Channels progressive humanitarian vision, unorthodox originality, intellectual brotherhood, and community service.",
      11: "Pisces Navamsa: Imparts transcendent compassion, boundless imagination, spiritual surrender, and profound mystical sensitivity.",
    };

    const padaMeanings: Record<number, string> = {
      1: "First Navamsa (Dharma): High vitality and direct soul initiative.",
      2: "Second Navamsa (Artha): Practical manifestation, material responsibility, and resource building.",
      3: "Third Navamsa (Kama): Sociable expression, creative curiosity, and communicative play.",
      4: "Fourth Navamsa (Moksha): Deep internal sanctuary, emotional reflection, and spiritual peace.",
      5: "Fifth Navamsa (Dharma): Creative self-expression, romantic nobility, and philosophical intellect.",
      6: "Sixth Navamsa (Artha): Detailed service, analytical discrimination, and overcoming hurdles.",
      7: "Seventh Navamsa (Kama): Relational equilibrium, partnership agreements, and public grace.",
      8: "Eighth Navamsa (Moksha): Psychological transformation, esoteric perception, and soul rebirth.",
      9: "Ninth Navamsa (Dharma): Highest philosophical maturity, spiritual synthesis, and divine grace.",
    };

    return `${planetName} in ${signName} Navamsa (Pada ${navamsaNumber}): ${signDescriptions[signIndex]} ${padaMeanings[navamsaNumber]}`;
  }

  /**
   * Relationship-specific significance in D9
   */
  public getRelationshipSignificance(
    planetName: string,
    signIndex: number,
    _navamsaNumber: number
  ): string {
    const signName = NavamsaCalculator.SIGN_NAMES[signIndex];
    switch (planetName) {
      case "Venus":
        return `Venus in ${signName} Navamsa reveals that in intimate commitments, your soul seeks ${
          signIndex === 11 ? "unconditional, poetic devotion (Exalted)" :
          signIndex === 5 ? "practical acts of service and high intellectual standards" :
          signIndex === 1 || signIndex === 6 ? "sensual luxury, fairness, and unwavering loyalty" :
          "mutual intellectual growth, respect, and shared ideals"
        }.`;
      case "Jupiter":
        return `Jupiter in ${signName} Navamsa bestows moral nobility, spiritual guidance, and divine protection within sacred marital bonds.`;
      case "Moon":
        return `Moon in ${signName} Navamsa reflects your deepest subconscious emotional sanctuary in committed domestic life.`;
      case "Sun":
        return `Sun in ${signName} Navamsa shows how personal sovereignty and creative ego express themselves inside long-term alliances.`;
      case "Mars":
        return `Mars in ${signName} Navamsa indicates physical passion, drive, and how conflict or assertiveness is handled with partners.`;
      default:
        return `${planetName} in ${signName} Navamsa influences relationship karma through its elemental and planetary lordship.`;
    }
  }

  /**
   * Spiritual and Dharma significance in D9
   */
  public getSpiritualSignificance(
    planetName: string,
    signIndex: number,
    navamsaNumber: number
  ): string {
    const signName = NavamsaCalculator.SIGN_NAMES[signIndex];
    if (navamsaNumber === 9) {
      return `${planetName} sits in the 9th Navamsa of ${signName}, marking a high degree of dharmic completion and spiritual blessings.`;
    }
    return `${planetName} in ${signName} Navamsa supports inner spiritual evolution through self-knowledge, ethical discernment, and meditative discipline.`;
  }

  private formatDegrees(deg: number): string {
    const d = Math.floor(deg);
    const m = Math.floor((deg - d) * 60);
    return `${d}°${m.toString().padStart(2, "0")}'`;
  }
}

/**
 * Complete D9 Chart Engine orchestrating house placements, marriage, and spiritual analysis
 */
export class D9ChartEngine {
  private calculator = new NavamsaCalculator();

  /**
   * Calculate complete D9 chart from VedicChartData or raw birth coordinates
   */
  public calculateCompleteD9Chart(
    input: VedicChartData | BirthChartInput
  ): D9Chart {
    let ascendantLon = 0;
    const rawPlanets: Record<string, number> = {};

    if ("ayanamsa" in input && "lagna" in input) {
      // VedicChartData format
      ascendantLon = input.lagna.siderealLongitude;
      input.planets.forEach((p) => {
        rawPlanets[p.name] = p.siderealLongitude;
      });
    } else {
      // BirthChartInput format
      ascendantLon = input.ascendant;
      Object.entries(input.planets).forEach(([name, p]) => {
        rawPlanets[name] = p.longitude;
      });
    }

    // 1. Calculate D9 Ascendant
    const d9Ascendant = this.calculator.calculateNavamsa(ascendantLon, "Ascendant");
    const d9LagnaRasiIndex = d9Ascendant.signIndex;

    // 2. Calculate D9 position for each planet and assign D9 house
    const d9Planets: Record<string, NavamsaPosition> = {};
    Object.entries(rawPlanets).forEach(([planetName, lon]) => {
      const navPos = this.calculator.calculateNavamsa(lon, planetName);
      // House in D9 = Whole sign from D9 Ascendant
      const houseNum = ((navPos.signIndex - d9LagnaRasiIndex + 12) % 12) + 1;
      navPos.house = houseNum;
      d9Planets[planetName] = navPos;
    });

    // Ensure both traditional Jyotish (Rahu/Ketu) and node naming conventions are accessible
    if (d9Planets["NorthNode"] && !d9Planets["Rahu"]) {
      d9Planets["Rahu"] = { ...d9Planets["NorthNode"], planetName: "Rahu", symbol: "☊" };
    } else if (d9Planets["Rahu"] && !d9Planets["NorthNode"]) {
      d9Planets["NorthNode"] = { ...d9Planets["Rahu"], planetName: "NorthNode", symbol: "☊" };
    }

    if (d9Planets["SouthNode"] && !d9Planets["Ketu"]) {
      d9Planets["Ketu"] = { ...d9Planets["SouthNode"], planetName: "Ketu", symbol: "☋" };
    } else if (d9Planets["Ketu"] && !d9Planets["SouthNode"]) {
      d9Planets["SouthNode"] = { ...d9Planets["Ketu"], planetName: "SouthNode", symbol: "☋" };
    }

    // Ascendant house is always 1
    d9Ascendant.house = 1;

    // 3. Build D9 Houses (Whole Sign system based on D9 Lagna)
    const d9Houses = this.calculateD9Houses(d9Ascendant, d9Planets);

    // 4. Overall Chart Analysis
    const analysis = this.analyzeD9Chart(d9Planets, d9Houses);

    // 5. Marriage & Relationship Indicators
    const marriageIndicators = this.analyzeMarriageProspects(d9Planets, d9Houses);

    // 6. Spiritual Path & Karakamsha Analysis
    const spiritualPath = this.analyzeSpiritualPath(d9Planets, rawPlanets);

    // 7. Calculate D9-Specific Sacred Yogas & Auspicious Formations
    const yogas = this.calculateD9Yogas(d9Planets, d9Houses, d9Ascendant);

    return {
      planets: d9Planets,
      ascendant: d9Ascendant,
      houses: d9Houses,
      analysis,
      marriageIndicators,
      spiritualPath,
      yogas,
    };
  }

  /**
   * Calculate specific Navamsa (D9) Yogas & Auspicious Formations
   */
  public calculateD9Yogas(
    d9Planets: Record<string, NavamsaPosition>,
    d9Houses: D9Houses,
    _d9Ascendant: NavamsaPosition
  ): D9Yoga[] {
    const yogas: D9Yoga[] = [];

    // 1. Vargottama Mahayoga
    const vargPlanets = Object.values(d9Planets).filter((p) => p.vargottama);
    if (vargPlanets.length > 0) {
      vargPlanets.forEach((p) => {
        yogas.push({
          name: `Vargottama Mahayoga (${p.planetName})`,
          sanskritName: "वर्गोत्तमा महायोग",
          description: `${p.planetName} occupies the exact same sign (${p.sign}) in both Rasi (D1) and Navamsa (D9). This confers unshakeable stability, character firmness, and results equivalent to an exalted planet throughout life.`,
          planetsInvolved: [p.planetName],
          intensity: "High",
          category: "Dignity Yoga",
          isPresent: true,
        });
      });
    }

    // 2. Pushkara Navamsa Sacred Blessing
    const pushkPlanets = Object.values(d9Planets).filter((p) => p.isPushkara);
    if (pushkPlanets.length > 0) {
      pushkPlanets.forEach((p) => {
        yogas.push({
          name: `Pushkara Navamsa Blessing (${p.planetName})`,
          sanskritName: "पुष्कर नवांश योग",
          description: `${p.planetName} resides in the sacred Pushkara Navamsa division in ${p.sign}. This imparts divine healing nectar (Amrita), granting deep soul rejuvenation and the ability to bounce back gracefully from life crises.`,
          planetsInvolved: [p.planetName],
          intensity: "High",
          category: "Spiritual Yoga",
          isPresent: true,
        });
      });
    }

    // 3. D9 Dharma-Karmadhipati Raja Yoga
    const lord9 = d9Houses[9]?.lord;
    const lord10 = d9Houses[10]?.lord;
    if (lord9 && lord10 && lord9 !== lord10) {
      const p9 = d9Planets[lord9];
      const p10 = d9Planets[lord10];
      if (p9 && p10) {
        if (p9.house === p10.house) {
          yogas.push({
            name: "D9 Dharma-Karmadhipati Raja Yoga",
            sanskritName: "धर्म-कर्माधिपति नवांश राजयोग",
            description: `The 9th Lord of Dharma (${lord9}) and 10th Lord of Karma (${lord10}) unite in House ${p9.house} (${p9.sign}) in Navamsa. Confers immense spiritual nobility, righteous professional success, and enduring legacy in the second half of life.`,
            planetsInvolved: [lord9, lord10],
            intensity: "High",
            category: "Raja Yoga",
            isPresent: true,
          });
        } else if (Math.abs(p9.house - p10.house) === 6) {
          yogas.push({
            name: "D9 Dharma-Karmadhipati Mutual Aspect Yoga",
            sanskritName: "धर्म-कर्माधिपति समसप्तक योग",
            description: `The 9th Lord (${lord9}) and 10th Lord (${lord10}) directly aspect each other across Houses ${p9.house} and ${p10.house} in D9, harmonizing ethical wisdom with worldly responsibility.`,
            planetsInvolved: [lord9, lord10],
            intensity: "Moderate",
            category: "Raja Yoga",
            isPresent: true,
          });
        }
      }
    }

    // 4. D9 Gajakesari Yoga
    const moon = d9Planets["Moon"];
    const jupiter = d9Planets["Jupiter"];
    if (moon && jupiter) {
      const houseDiff = ((moon.house - jupiter.house + 12) % 12) + 1;
      if ([1, 4, 7, 10].includes(houseDiff)) {
        yogas.push({
          name: "D9 Gajakesari Yoga",
          sanskritName: "नवांश गजकेसरी योग",
          description: `Jupiter and Moon sit in mutual Kendra houses (${jupiter.sign} and ${moon.sign}) in the Navamsa chart. Bestows moral eminence, spiritual serenity, spotless reputation, and emotional equilibrium in marriage.`,
          planetsInvolved: ["Jupiter", "Moon"],
          intensity: "High",
          category: "Raja Yoga",
          isPresent: true,
        });
      }
    }

    // 5. D9 Budhaditya Yoga
    const sun = d9Planets["Sun"];
    const mercury = d9Planets["Mercury"];
    if (sun && mercury && sun.house === mercury.house) {
      yogas.push({
        name: "D9 Budhaditya Yoga",
        sanskritName: "नवांश बुधादित्य योग",
        description: `Sun and Mercury unite in House ${sun.house} (${sun.sign}) in Navamsa. Confers piercing intellectual discernment, dharmic eloquence, analytical excellence, and refined strategic vision.`,
        planetsInvolved: ["Sun", "Mercury"],
        intensity: "Moderate",
        category: "Raja Yoga",
        isPresent: true,
      });
    }

    // 6. D9 Pancha Mahapurusha Yogas
    const kendraHouses = [1, 4, 7, 10];
    const mahapurushaMap = [
      { planet: "Mars", name: "Ruchaka Yoga in D9", sanskrit: "नवांश रुचक योग", trait: "fearless physical courage and martial discipline" },
      { planet: "Mercury", name: "Bhadra Yoga in D9", sanskrit: "नवांश भद्र योग", trait: "scholarly brilliance, mercantile genius, and linguistic mastery" },
      { planet: "Jupiter", name: "Hamsa Yoga in D9", sanskrit: "नवांश हंस योग", trait: "spiritual wisdom, guru blessings, and high ethical ideals" },
      { planet: "Venus", name: "Malavya Yoga in D9", sanskrit: "नवांश मालव्य योग", trait: "aesthetic magnificence, marital devotion, and gracious living" },
      { planet: "Saturn", name: "Sasa Yoga in D9", sanskrit: "नवांश शश योग", trait: "enduring patience, ascetic mastery, and profound leadership over masses" },
    ];

    mahapurushaMap.forEach(({ planet, name, sanskrit, trait }) => {
      const p = d9Planets[planet];
      if (p && kendraHouses.includes(p.house) && (p.dignity === "Exalted" || p.dignity === "Own Sign")) {
        yogas.push({
          name,
          sanskritName: sanskrit,
          description: `${planet} is ${p.dignity} in Kendra House ${p.house} (${p.sign}) in D9, manifesting ${trait} in the native's inner soul nature.`,
          planetsInvolved: [planet],
          intensity: "High",
          category: "Raja Yoga",
          isPresent: true,
        });
      }
    });

    // 7. D9 Subha Kalathra Yoga
    const h7Planets = d9Houses[7]?.planets || [];
    const h7Benefics = h7Planets.filter((p) => ["Jupiter", "Venus", "Moon", "Mercury"].includes(p.planetName));
    if (h7Benefics.length > 0) {
      yogas.push({
        name: "D9 Subha Kalathra Yoga (Auspicious Marriage)",
        sanskritName: "नवांश शुभ कलत्र योग",
        description: `Natural benefic planet(s) (${h7Benefics.map((p) => p.planetName).join(", ")}) occupy the 7th House of Marriage in Navamsa. Indicates a compassionate, noble, supportive, and emotionally nourishing life partner.`,
        planetsInvolved: h7Benefics.map((p) => p.planetName),
        intensity: "High",
        category: "Relationship Yoga",
        isPresent: true,
      });
    }

    // 8. D9 Neecha-Bhanga & Navamsa Elevation
    Object.values(d9Planets).forEach((p) => {
      if ((p.dignity === "Exalted" || p.dignity === "Own Sign") && p.originalSign) {
        const isDebInD1 =
          (p.planetName === "Sun" && p.originalSign === "Libra") ||
          (p.planetName === "Moon" && p.originalSign === "Scorpio") ||
          (p.planetName === "Mars" && p.originalSign === "Cancer") ||
          (p.planetName === "Mercury" && p.originalSign === "Pisces") ||
          (p.planetName === "Jupiter" && p.originalSign === "Capricorn") ||
          (p.planetName === "Venus" && p.originalSign === "Virgo") ||
          (p.planetName === "Saturn" && p.originalSign === "Aries");

        if (isDebInD1) {
          yogas.push({
            name: `D9 Neecha-Bhanga Navamsa Elevation (${p.planetName})`,
            sanskritName: "नवांश नीचभंग राजयोग",
            description: `${p.planetName} was debilitated in Rasi (${p.originalSign}) but ascends to ${p.dignity} status in Navamsa (${p.sign}). This creates a powerful Neecha-Bhanga elevation, symbolizing dramatic triumph over early challenges and great prosperity in mature life.`,
            planetsInvolved: [p.planetName],
            intensity: "High",
            category: "Raja Yoga",
            isPresent: true,
          });
        }
      }
    });

    // 9. D9 Dharma Trikona Alignment
    const dharmaPlanets = Object.values(d9Planets).filter(
      (p) => [1, 5, 9].includes(p.house) && ["Jupiter", "Sun", "Moon", "Mercury", "Venus"].includes(p.planetName)
    );
    if (dharmaPlanets.length >= 2) {
      yogas.push({
        name: "D9 Dharma Trikona Alignment",
        sanskritName: "नवांश धर्म त्रिकोण योग",
        description: `Natural benefics (${dharmaPlanets.map((p) => p.planetName).join(", ")}) illuminate the sacred Dharma houses (1st, 5th, 9th) in D9, indicating strong past-life merit (Purva Punya) and intuitive alignment with spiritual truth.`,
        planetsInvolved: dharmaPlanets.map((p) => p.planetName),
        intensity: "Moderate",
        category: "Spiritual Yoga",
        isPresent: true,
      });
    }

    return yogas;
  }

  /**
   * Determine D9 Houses and populate with situated planets
   */
  public calculateD9Houses(
    ascendant: NavamsaPosition,
    planets: Record<string, NavamsaPosition>
  ): D9Houses {
    const houses: D9Houses = {};
    const lagnaSign = ascendant.signIndex;

    const houseMeanings: Record<number, string> = {
      1: "Self, vitality, core spiritual inclination, physical radiance in second half of life.",
      2: "Speech, family wealth, accumulated resources, vocal grace.",
      3: "Courage, communicative initiative, artistic craft, siblings.",
      4: "Emotional happiness, inner peace, domestic bliss, ancestral comfort.",
      5: "Purva Punya (past life merit), creative intellect, children, mantra siddhi.",
      6: "Overcoming obstacles, competitive resilience, daily health, service.",
      7: "Marriage, spouse qualities, intimate commitments, public partnerships.",
      8: "Longevity, deep esoteric knowledge, occult wisdom, sudden transformations.",
      9: "Dharma, fortune (Bhagya), spiritual guru, philosophical ethics.",
      10: "Soul career, karmic deeds, social status, enduring legacy.",
      11: "Gains, fulfillment of hopes, expansive networks, worldly recognition.",
      12: "Moksha, spiritual liberation, meditation, subconscious surrender.",
    };

    for (let h = 1; h <= 12; h++) {
      const signIdx = (lagnaSign + h - 1) % 12;
      const signName = NavamsaCalculator.SIGN_NAMES[signIdx];
      const signSanskrit = NavamsaCalculator.SIGN_SANSKRIT[signIdx];
      const lord = NavamsaCalculator.SIGN_RULERS[signIdx];

      const planetsInThisHouse = Object.values(planets).filter((p) => p.house === h);

      // Determine condition of house
      let condition: D9House["condition"] = "Neutral";
      const hasBenefic = planetsInThisHouse.some((p) => ["Jupiter", "Venus", "Mercury", "Moon"].includes(p.planetName));
      const hasMalefic = planetsInThisHouse.some((p) => ["Saturn", "Mars", "Rahu", "Ketu"].includes(p.planetName));
      const hasExalted = planetsInThisHouse.some((p) => p.dignity === "Exalted" || p.vargottama);

      if (hasExalted) condition = "Fortified";
      else if (hasBenefic && !hasMalefic) condition = "Harmonious";
      else if (hasMalefic && !hasBenefic) condition = "Challenged";

      houses[h] = {
        house: h,
        signIndex: signIdx,
        signName,
        signSanskrit,
        lord,
        planets: planetsInThisHouse,
        significance: houseMeanings[h],
        condition,
      };
    }

    return houses;
  }

  /**
   * Analyze chart strengths, Vargottama planets, and Pushkara divisions
   */
  public analyzeD9Chart(
    planets: Record<string, NavamsaPosition>,
    houses: D9Houses
  ): D9ChartAnalysis {
    const list = Object.values(planets);

    const vargottamaPlanets = list.filter((p) => p.vargottama);
    const pushkaraPlanets = list.filter((p) => p.isPushkara);
    const exaltedPlanets = list.filter((p) => p.dignity === "Exalted");
    const debilitatedPlanets = list.filter((p) => p.dignity === "Debilitated");
    const dharmaPlanets = list.filter((p) => [1, 5, 9].includes(p.house));

    // Calculate composite strength score
    const avgScore = list.reduce((sum, p) => sum + p.strength.score, 0) / (list.length || 1);
    const vargBonus = vargottamaPlanets.length * 4;
    const pushkBonus = pushkaraPlanets.length * 3;
    const overallStrengthScore = Math.min(100, Math.round(avgScore + vargBonus + pushkBonus));

    const keyHighlights: string[] = [];

    if (vargottamaPlanets.length > 0) {
      keyHighlights.push(
        `${vargottamaPlanets.map((p) => p.planetName).join(", ")} ${
          vargottamaPlanets.length === 1 ? "is" : "are"
        } Vargottama, bestowing deep-seated character strength and unshakeable karmic resilience.`
      );
    }

    if (pushkaraPlanets.length > 0) {
      keyHighlights.push(
        `${pushkaraPlanets.map((p) => p.planetName).join(", ")} occupy Pushkara Navamsa, providing divine rejuvenation and healing blessings.`
      );
    }

    if (exaltedPlanets.length > 0) {
      keyHighlights.push(
        `${exaltedPlanets.map((p) => p.planetName).join(", ")} reach peak exaltation (Uchha) inside the Navamsa realm.`
      );
    }

    if (houses[9].planets.length > 0) {
      keyHighlights.push(
        `The 9th House of Dharma is energized by ${houses[9].planets.map((p) => p.planetName).join(", ")}, directing the soul toward higher philosophical wisdom.`
      );
    }

    return {
      overallStrengthScore,
      vargottamaPlanets,
      pushkaraPlanets,
      exaltedPlanets,
      debilitatedPlanets,
      dharmaPlanets,
      keyHighlights,
    };
  }

  /**
   * Analyze marriage and relationship prospects from D9 (Venus, Jupiter, 7th house)
   */
  public analyzeMarriageProspects(
    planets: Record<string, NavamsaPosition>,
    houses: D9Houses
  ): MarriageAnalysis {
    const venus = planets["Venus"];
    const jupiter = planets["Jupiter"];
    const seventhHouse = houses[7];

    // 1. Venus strength & condition
    let venusStrength = "Venus is neutrally placed in Navamsa.";
    if (venus) {
      if (venus.vargottama) {
        venusStrength = `Venus is Vargottama in ${venus.sign}! Relationships have tremendous endurance, romantic loyalty, and aesthetic grace.`;
      } else if (venus.dignity === "Exalted") {
        venusStrength = `Venus is Exalted in ${venus.sign} Navamsa (House ${venus.house}). You possess an exalted, artistic, and deeply romantic ideal in marriage.`;
      } else if (venus.dignity === "Own Sign") {
        venusStrength = `Venus is in its own sign of ${venus.sign} in D9 (House ${venus.house}), granting harmonious romantic partnerships and refined domestic happiness.`;
      } else if (venus.dignity === "Debilitated") {
        venusStrength = `Venus is Debilitated in ${venus.sign} Navamsa. Teaches the soul to value practical loyalty over superficial perfectionism in partnerships.`;
      } else {
        venusStrength = `Venus is placed in ${venus.sign} Navamsa in House ${venus.house} with a strength rating of ${venus.strength.score}/100.`;
      }
    }

    // 2. Jupiter Blessing
    let jupiterBlessing = "Jupiter provides balanced wisdom in relationships.";
    if (jupiter) {
      if (jupiter.vargottama) {
        jupiterBlessing = `Jupiter is Vargottama in ${jupiter.sign}! Blessed with profound moral integrity, auspicious counsel, and mutual respect in partnerships.`;
      } else if (jupiter.dignity === "Exalted") {
        jupiterBlessing = `Jupiter is Exalted in ${jupiter.sign} Navamsa (House ${jupiter.house}). Bestows divine grace, wisdom, and spiritual expansion through marriage.`;
      } else if (jupiter.dignity === "Debilitated") {
        jupiterBlessing = `Jupiter is in Capricorn Navamsa. Urges grounding idealistic expectations into realistic shared duties.`;
      } else if ([1, 5, 7, 9].includes(jupiter.house)) {
        jupiterBlessing = `Jupiter occupies an auspicious angle/trine (House ${jupiter.house}) in D9, casting protective grace over marital longevity.`;
      } else {
        jupiterBlessing = `Jupiter in ${jupiter.sign} Navamsa (House ${jupiter.house}) supports mutual ethical growth and long-term stability.`;
      }
    }

    // 3. 7th House Condition
    let seventhHouseCondition = `The 7th House in D9 is governed by ${seventhHouse.signName} (Lord: ${seventhHouse.lord}).`;
    if (seventhHouse.planets.length > 0) {
      const pNames = seventhHouse.planets.map((p) => p.planetName).join(", ");
      seventhHouseCondition += ` Occupied by ${pNames}, making partnerships a central focus of personal evolution.`;
    } else {
      seventhHouseCondition += ` Unoccupied by planets, indicating a clean slate governed primarily by ${seventhHouse.lord}'s dignity.`;
    }

    // 4. Partner Characteristics
    const partnerCharacteristics = this.describePartner(venus, jupiter, seventhHouse);

    // 5. Marriage Timing
    const marriageTiming = this.predictMarriageTiming(planets, houses);

    // 6. Challenges
    const challenges = this.identifyChallenges(venus, jupiter, seventhHouse);

    // Compatibility Score calculation
    let compScore = 65;
    if (venus && (venus.vargottama || venus.dignity === "Exalted" || venus.dignity === "Own Sign")) compScore += 15;
    if (jupiter && (jupiter.vargottama || jupiter.dignity === "Exalted")) compScore += 12;
    if (seventhHouse.condition === "Fortified" || seventhHouse.condition === "Harmonious") compScore += 10;
    if (seventhHouse.condition === "Challenged") compScore -= 12;
    const finalCompScore = Math.max(30, Math.min(98, compScore));

    const karmicLessons = [
      "Cultivate emotional transparency without fear of vulnerability.",
      "Honor your partner's individuality while nurturing shared spiritual rituals.",
      "Balance romantic passion with everyday practical mutual support.",
    ];

    return {
      venusStrength,
      jupiterBlessing,
      seventhHouseCondition,
      marriageTiming,
      partnerCharacteristics,
      challenges,
      relationshipCompatibilityScore: finalCompScore,
      karmicLessons,
    };
  }

  /**
   * Describe partner characteristics based on D9 7th house and Venus
   */
  private describePartner(
    venus: NavamsaPosition | undefined,
    _jupiter: NavamsaPosition | undefined,
    seventhHouse: D9House
  ): string {
    const sign = seventhHouse.signName;
    const lord = seventhHouse.lord;

    const descriptions: Record<string, string> = {
      Aries: "Independent, assertive, energetic, courageous, and direct in communication.",
      Taurus: "Loyal, grounded, artistic, fond of sensual comforts, patient, and dependable.",
      Gemini: "Witty, intellectually curious, versatile, talkative, and youthful in spirit.",
      Cancer: "Deeply empathetic, domestic, intuitive, family-oriented, and nurturing.",
      Leo: "Dignified, warm-hearted, magnetic, proud, creative, and protective.",
      Virgo: "Analytical, methodical, health-conscious, detail-oriented, and quietly devoted.",
      Libra: "Diplomatic, aesthetically refined, fair-minded, charming, and cooperative.",
      Scorpio: "Intense, deeply perceptive, passionate, magnetic, and fiercely loyal.",
      Sagittarius: "Philosophical, adventurous, broad-minded, optimistic, and candid.",
      Capricorn: "Ambitious, responsible, disciplined, mature, and focused on lasting stability.",
      Aquarius: "Original, progressive, humanitarian, independent, and socially visionary.",
      Pisces: "Compassionate, poetic, spiritually attuned, imaginative, and tender-hearted.",
    };

    const base = descriptions[sign] || "Refined, supportive, and karmically aligned.";
    const venusNote = venus ? ` Infused with ${venus.sign} Venus subtleties of ${venus.element.toLowerCase()} nature.` : "";

    return `Your partner is characterized by ${sign} qualities (governed by ${lord}): ${base}${venusNote}`;
  }

  /**
   * Predict general marriage timing windows
   */
  private predictMarriageTiming(
    _planets: Record<string, NavamsaPosition>,
    houses: D9Houses
  ): string {
    const lord = houses[7].lord;
    return `Prime relational windows activate during Mahadashas or Antardashas of the D9 7th Lord (${lord}), Venus, or transit Jupiter aspecting the D9 7th House (${houses[7].signName}). Mid-twenties to early thirties typically bring mature partnership realizations.`;
  }

  /**
   * Identify relationship challenge points
   */
  private identifyChallenges(
    venus: NavamsaPosition | undefined,
    _jupiter: NavamsaPosition | undefined,
    seventhHouse: D9House
  ): string {
    const hasMars = seventhHouse.planets.some((p) => p.planetName === "Mars");
    const hasSaturn = seventhHouse.planets.some((p) => p.planetName === "Saturn");
    const hasRahu = seventhHouse.planets.some((p) => p.planetName === "Rahu");

    if (hasMars) {
      return "Mars in 7th House of D9 indicates high passion that must be tempered against sudden impatience or heated arguments.";
    }
    if (hasSaturn) {
      return "Saturn in 7th House of D9 can delay marriage until maturity (age 28-32), but ensures lasting, rock-solid endurance once established.";
    }
    if (hasRahu) {
      return "Rahu in 7th House of D9 suggests unconventional or cross-cultural partnerships requiring realistic expectations over illusion.";
    }
    if (venus && venus.dignity === "Debilitated") {
      return "Venus in Virgo Navamsa reminds you to avoid micromanaging your partner; true love thrives in acceptance.";
    }

    return "No major afflictions detected in D9 7th house. Primary challenge is maintaining open communication and daily gratitude.";
  }

  /**
   * Analyze Spiritual Path & Karakamsha Lagna (Jaimini Chara Karaka principles)
   */
  public analyzeSpiritualPath(
    d9Planets: Record<string, NavamsaPosition>,
    rawLongitudes: Record<string, number>
  ): SpiritualPathAnalysis {
    // 1. Identify Atmakaraka (highest degree within sign in D1 among traditional 7 planets)
    const candidates = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
    let maxDegreeInSign = -1;
    let atmakarakaPlanet = "Sun";

    candidates.forEach((name) => {
      const lon = rawLongitudes[name];
      if (lon !== undefined) {
        const degInSign = lon % 30;
        if (degInSign > maxDegreeInSign) {
          maxDegreeInSign = degInSign;
          atmakarakaPlanet = name;
        }
      }
    });

    const akNavamsa = d9Planets[atmakarakaPlanet] || d9Planets["Sun"];
    const karakamshaSignIndex = akNavamsa.signIndex;
    const karakamshaSign = akNavamsa.sign;
    const karakamshaHouse = akNavamsa.house;

    // 2. Identify 12th from Karakamsha (Ishta Devata gateway)
    const ishtaSignIndex = (karakamshaSignIndex + 11) % 12;
    const ishtaSign = NavamsaCalculator.SIGN_NAMES[ishtaSignIndex];
    const ishtaLord = NavamsaCalculator.SIGN_RULERS[ishtaSignIndex];

    const ishtaDeityMap: Record<string, { name: string; mantra: string; guidance: string }> = {
      Sun: {
        name: "Lord Shiva / Sri Rama",
        mantra: "Om Namah Shivaya / Om Sri Ramaya Namaha",
        guidance: "Channeling divine solar truth, righteous leadership, and inner illumination.",
      },
      Moon: {
        name: "Goddess Parvati / Sri Krishna",
        mantra: "Om Kleem Krishnaya Namaha / Om Durgaye Namaha",
        guidance: "Devotional love, emotional surrender, and nurturing maternal grace.",
      },
      Mars: {
        name: "Lord Kartikeya (Murugan) / Narasimha",
        mantra: "Om Sharavana Bhavaya Namaha / Om Narasimhaya Namaha",
        guidance: "Courageous protection, triumph over internal negativity, and yogic discipline.",
      },
      Mercury: {
        name: "Lord Vishnu / Sri Narayana",
        mantra: "Om Namo Bhagavate Vasudevaya",
        guidance: "Intellectual discrimination, sacred scriptural study, and balanced preservation.",
      },
      Jupiter: {
        name: "Lord Shiva as Dakshinamurti / The Guru",
        mantra: "Om Dakshinamurtaye Namaha / Om Gurave Namaha",
        guidance: "Higher philosophical enlightenment, teaching, and sacred Vedic wisdom.",
      },
      Venus: {
        name: "Maha Lakshmi / Sri Radha",
        mantra: "Om Shreem Mahalakshmaye Namaha",
        guidance: "Unconditional devotion (Bhakti), spiritual beauty, and universal abundance.",
      },
      Saturn: {
        name: "Lord Brahma / Kurma Avatar / Lord Shiva in Mahakala aspect",
        mantra: "Om Sham Shanaishcharaya Namaha",
        guidance: "Austere meditation, detachment from transient illusions, and patient service.",
      },
    };

    const deityInfo = ishtaDeityMap[ishtaLord] || ishtaDeityMap["Jupiter"];

    const karakamshaMeaning = `Your Atmakaraka (Soul Planet) is ${atmakarakaPlanet}, placed in ${karakamshaSign} Navamsa (House ${karakamshaHouse} of D9). This Karakamsha alignment indicates your soul incarnated to master ${
      karakamshaSign === "Aries" || karakamshaSign === "Leo" || karakamshaSign === "Sagittarius" ? "pioneering leadership, spiritual courage, and inspired visionary action" :
      karakamshaSign === "Taurus" || karakamshaSign === "Virgo" || karakamshaSign === "Capricorn" ? "practical manifestation, grounding spiritual ethics into society, and selfless service" :
      karakamshaSign === "Gemini" || karakamshaSign === "Libra" || karakamshaSign === "Aquarius" ? "disseminating higher knowledge, artistic creation, and humanitarian community elevation" :
      "transcendent empathy, deep meditative surrender, and sacred healing"
    }.`;

    return {
      pathSummary: `Your D9 Navamsa reveals a ${akNavamsa.element.toLowerCase()}-oriented dharma rooted in ${karakamshaSign}. Through ${atmakarakaPlanet}'s soul lessons, life experiences refine your consciousness toward spiritual liberation (Moksha).`,
      dharmaOrientation: `${akNavamsa.element} Trikona Alignment: Living in harmony with cosmic truth and authentic purpose.`,
      karakamshaLagna: {
        sign: karakamshaSign,
        signIndex: karakamshaSignIndex,
        houseInD9: karakamshaHouse,
        atmakarakaPlanet,
        meaning: karakamshaMeaning,
      },
      ishtaDevata: {
        sign: ishtaSign,
        signIndex: ishtaSignIndex,
        rulingPlanet: ishtaLord,
        deityName: deityInfo.name,
        mantra: deityInfo.mantra,
        guidance: deityInfo.guidance,
      },
      spiritualRemedies: [
        `Daily japa of ${deityInfo.mantra} at sunrise or twilight.`,
        "Regular contemplative solitude and introspection to connect with your Atmakaraka lessons.",
        "Perform selfless service (Seva) and donate to education or spiritual sanctuaries on Thursdays.",
      ],
    };
  }
}
