/**
 * Classical Parashara Divisional Charts (Vargas) Calculator
 * Computes exact sign, house, and dignity for D1 through D60.
 */

import { VEDIC_RASIS, VedicPlanet } from "@/lib/astronomy/vedic";

export interface DivisionalPlanet {
  name: string;
  symbol: string;
  originalSign: string;
  sign: string;
  signIndex: number;
  degreeInSign: number;
  degreeFormatted: string;
  house: number;
  dignity: "Exalted" | "Own Sign" | "Friendly" | "Neutral" | "Debilitated";
  isRetrograde: boolean;
}

export interface DivisionalHouse {
  house: number;
  signName: string;
  signIndex: number;
  signSanskrit: string;
  planets: DivisionalPlanet[];
}

export interface DivisionalChartResult {
  divisionCode: string;
  divisionName: string;
  harmonic: number;
  significance: string;
  ascendant: {
    sign: string;
    signIndex: number;
    degreeFormatted: string;
  };
  planets: DivisionalPlanet[];
  houses: DivisionalHouse[];
}

export const DIVISIONAL_CHARTS_CONFIG: Record<
  string,
  { name: string; harmonic: number; significance: string; category: "Basic" | "Secondary" | "Higher" | "Devotional" | "Subtle" }
> = {
  D1: { name: "Rasi", harmonic: 1, significance: "Physical body, vitality & overall life path", category: "Basic" },
  D2: { name: "Hora", harmonic: 2, significance: "Wealth, prosperity, speech & liquid assets", category: "Basic" },
  D3: { name: "Drekkana", harmonic: 3, significance: "Siblings, vitality, courage & initiatives", category: "Basic" },
  D4: { name: "Chaturthamsa", harmonic: 4, significance: "Fixed assets, real estate, vehicles & fortune (Bhagya)", category: "Basic" },
  D7: { name: "Saptamsa", harmonic: 7, significance: "Children, progeny & creative fruit", category: "Secondary" },
  D9: { name: "Navamsa", harmonic: 9, significance: "Soul dharma, marriage, partner & fortune", category: "Basic" },
  D10: { name: "Dasamsa", harmonic: 10, significance: "Career, profession, reputation & public impact", category: "Secondary" },
  D12: { name: "Dwadasamsa", harmonic: 12, significance: "Parents, ancestry, lineage & genetic karma", category: "Secondary" },
  D16: { name: "Shodashamsa", harmonic: 16, significance: "Vehicles, conveyances & inner contentment", category: "Secondary" },
  D20: { name: "Vimsamsa", harmonic: 20, significance: "Spiritual practice, bhakti, upasana & devotional grace", category: "Devotional" },
  D24: { name: "Chaturvimsamsa", harmonic: 24, significance: "Higher learning, intellect & academic mastery", category: "Secondary" },
  D27: { name: "Saptavimsamsa", harmonic: 27, significance: "Strengths, weaknesses & subconscious impulses", category: "Higher" },
  D30: { name: "Trimsamsa", harmonic: 30, significance: "Misfortunes, arishta, health & karmic obstacles", category: "Higher" },
  D40: { name: "Khavedamsa", harmonic: 40, significance: "Auspicious & inauspicious karmic effects, spiritual blessings", category: "Subtle" },
  D45: { name: "Akshavedamsa", harmonic: 45, significance: "General character, purity, integrity & moral fiber", category: "Subtle" },
  D60: { name: "Shashtiamsa", harmonic: 60, significance: "Past life karma, root cause & micro-destiny", category: "Subtle" },
};

function normalizeDeg(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

/**
 * Degree within the selected divisional sign. Equal-width vargas map each
 * subdivision linearly to 0°–30°. D30 uses its traditional unequal segments.
 */
export function calculateDivisionalDegreeInSign(
  siderealLon: number,
  divisionCode: string
): number {
  const normalized = normalizeDeg(siderealLon);
  const signIndex = Math.floor(normalized / 30);
  const degreeInRasi = normalized - signIndex * 30;

  if (divisionCode === "D30") {
    const isOddSign = signIndex % 2 === 0;
    const segments = isOddSign
      ? [5, 5, 8, 7, 5]
      : [5, 7, 8, 5, 5];
    let segmentStart = 0;
    for (const width of segments) {
      if (degreeInRasi < segmentStart + width || segmentStart + width >= 30) {
        return Math.min(29.999999999, Math.max(0, ((degreeInRasi - segmentStart) / width) * 30));
      }
      segmentStart += width;
    }
    return 0;
  }

  const harmonic = DIVISIONAL_CHARTS_CONFIG[divisionCode]?.harmonic ?? 1;
  return (degreeInRasi * harmonic) % 30;
}

function formatDivisionalDegree(degree: number): string {
  const safeDegree = Math.min(29.999999999, Math.max(0, degree));
  const wholeDegrees = Math.floor(safeDegree);
  const minutes = Math.floor((safeDegree - wholeDegrees) * 60);
  return `${wholeDegrees}°${minutes.toString().padStart(2, "0")}′`;
}

/**
 * Calculates the divisional sign index (0-11) for a given sidereal longitude.
 */
export function calculateDivisionalSignIndex(
  siderealLon: number,
  divisionCode: string
): number {
  const normLon = normalizeDeg(siderealLon);
  const rasiIdx = Math.floor(normLon / 30);
  const degInRasi = normLon - rasiIdx * 30;
  const isOddSign = rasiIdx % 2 === 0; // Aries = 0 (odd in astrology), Taurus = 1 (even)

  switch (divisionCode) {
    case "D1":
      return rasiIdx;

    case "D2": { // Hora (15° each)
      // Odd signs: 0-15° Leo (4), 15-30° Cancer (3)
      // Even signs: 0-15° Cancer (3), 15-30° Leo (4)
      const firstHalf = degInRasi < 15;
      if (isOddSign) {
        return firstHalf ? 4 : 3;
      } else {
        return firstHalf ? 3 : 4;
      }
    }

    case "D3": { // Drekkana (10° each)
      // 0-10°: Same sign
      // 10-20°: 5th from it
      // 20-30°: 9th from it
      const part = Math.floor(degInRasi / 10);
      if (part === 0) return rasiIdx;
      if (part === 1) return (rasiIdx + 4) % 12;
      return (rasiIdx + 8) % 12;
    }

    case "D4": { // Chaturthamsa (7.5° each)
      // Part 0 (0-7.5°): same sign
      // Part 1 (7.5-15°): 4th from it
      // Part 2 (15-22.5°): 7th from it
      // Part 3 (22.5-30°): 10th from it
      const part = Math.floor(degInRasi / 7.5);
      return (rasiIdx + part * 3) % 12;
    }

    case "D7": { // Saptamsa (30/7 = 4.2857° each)
      const part = Math.floor(degInRasi / (30 / 7));
      const startSign = isOddSign ? rasiIdx : (rasiIdx + 6) % 12;
      return (startSign + part) % 12;
    }

    case "D9": { // Navamsa (3°20' = 3.3333° each)
      const navPart = Math.floor(degInRasi / (30 / 9));
      // Movable (Chara: Aries, Cancer, Libra, Cap) -> starts from sign itself
      // Fixed (Sthira: Taurus, Leo, Scorpio, Aqu) -> starts from 9th from it
      // Dual (Dwisvabhava: Gemini, Virgo, Sag, Pis) -> starts from 5th from it
      const modality = rasiIdx % 3;
      let startSign = rasiIdx;
      if (modality === 0) startSign = rasiIdx; // Movable
      else if (modality === 1) startSign = (rasiIdx + 8) % 12; // Fixed
      else startSign = (rasiIdx + 4) % 12; // Dual
      return (startSign + navPart) % 12;
    }

    case "D10": { // Dasamsa (3° each)
      const part = Math.floor(degInRasi / 3);
      // Odd signs: from sign itself. Even signs: from 9th sign.
      const startSign = isOddSign ? rasiIdx : (rasiIdx + 8) % 12;
      return (startSign + part) % 12;
    }

    case "D12": { // Dwadasamsa (2°30' = 2.5° each)
      const part = Math.floor(degInRasi / 2.5);
      return (rasiIdx + part) % 12;
    }

    case "D16": { // Shodashamsa (1°52'30" = 1.875° each)
      const part = Math.floor(degInRasi / 1.875);
      // Movable: from Aries (0). Fixed: from Leo (4). Dual: from Sagittarius (8).
      const modality = rasiIdx % 3;
      const startSign = modality === 0 ? 0 : modality === 1 ? 4 : 8;
      return (startSign + part) % 12;
    }

    case "D20": { // Vimsamsa (1.5° each)
      const part = Math.floor(degInRasi / 1.5);
      // Movable: from Aries. Fixed: from Sag. Dual: from Leo.
      const modality = rasiIdx % 3;
      const startSign = modality === 0 ? 0 : modality === 1 ? 8 : 4;
      return (startSign + part) % 12;
    }

    case "D24": { // Chaturvimsamsa (1.25° each)
      const part = Math.floor(degInRasi / 1.25);
      // Odd: from Leo (4). Even: from Cancer (3).
      const startSign = isOddSign ? 4 : 3;
      return (startSign + part) % 12;
    }

    case "D27": { // Saptavimsamsa / Nakshatramsa (1°06'40" = 1.1111° each)
      const part = Math.floor(degInRasi / (30 / 27));
      // Fire: Aries (0). Earth: Cancer (3). Air: Libra (6). Water: Capricorn (9).
      const element = rasiIdx % 4;
      const startSign = element === 0 ? 0 : element === 1 ? 3 : element === 2 ? 6 : 9;
      return (startSign + part) % 12;
    }

    case "D30": { // Trimsamsa
      // Odd signs: Mars (Aries=0, 0-5°), Saturn (Aquarius=10, 5-10°), Jupiter (Sagittarius=8, 10-18°), Mercury (Gemini=2, 18-25°), Venus (Taurus=1, 25-30°)
      // Even signs: Venus (Taurus=1, 0-5°), Mercury (Virgo=5, 5-12°), Jupiter (Pisces=11, 12-20°), Saturn (Capricorn=9, 20-25°), Mars (Scorpio=7, 25-30°)
      if (isOddSign) {
        if (degInRasi < 5) return 0; // Aries
        if (degInRasi < 10) return 10; // Aquarius
        if (degInRasi < 18) return 8; // Sagittarius
        if (degInRasi < 25) return 2; // Gemini
        return 1; // Taurus
      } else {
        if (degInRasi < 5) return 1; // Taurus
        if (degInRasi < 12) return 5; // Virgo
        if (degInRasi < 20) return 11; // Pisces
        if (degInRasi < 25) return 9; // Capricorn
        return 7; // Scorpio
      }
    }

    case "D40": { // Khavedamsa (45' = 0.75° each)
      // Odd signs: from Aries (0). Even signs: from Libra (6).
      const part = Math.floor(degInRasi / 0.75);
      const startSign = isOddSign ? 0 : 6;
      return (startSign + part) % 12;
    }

    case "D45": { // Akshavedamsa (40' = 0.6667° each)
      // Movable (Chara): Aries (0). Fixed (Sthira): Leo (4). Dual: Sagittarius (8).
      const part = Math.floor(degInRasi / (30 / 45));
      const modality = rasiIdx % 3;
      const startSign = modality === 0 ? 0 : modality === 1 ? 4 : 8;
      return (startSign + part) % 12;
    }

    case "D60": { // Shashtiamsa (0.5° each)
      const part = Math.floor(degInRasi / 0.5);
      const startSign = isOddSign ? rasiIdx : (rasiIdx + 6) % 12;
      return (startSign + part) % 12;
    }

    default:
      return rasiIdx;
  }
}

/**
 * Calculates a full divisional chart given Vedic planets & ascendant longitude
 */
export function calculateDivisionalChart(
  planets: VedicPlanet[],
  ascendantSiderealLon: number,
  divisionCode: string
): DivisionalChartResult {
  const config = DIVISIONAL_CHARTS_CONFIG[divisionCode] || DIVISIONAL_CHARTS_CONFIG.D1;

  // 1. Ascendant in Division
  const ascSignIdx = calculateDivisionalSignIndex(ascendantSiderealLon, divisionCode);
  const ascSignName = VEDIC_RASIS[ascSignIdx].name;

  // 2. Planets in Division
  const divisionalPlanets: DivisionalPlanet[] = [];

  for (const p of planets) {
    if (p.name === "Ascendant") continue;
    const signIdx = calculateDivisionalSignIndex(p.siderealLongitude, divisionCode);
    const signName = VEDIC_RASIS[signIdx].name;
    const house = ((signIdx - ascSignIdx + 12) % 12) + 1;

    // Dignity evaluation
    let dignity: DivisionalPlanet["dignity"] = "Neutral";
    if (p.name === "Sun") {
      if (signIdx === 0) dignity = "Exalted";
      else if (signIdx === 6) dignity = "Debilitated";
      else if (signIdx === 4) dignity = "Own Sign";
      else if ([3, 8, 0, 7, 11].includes(signIdx)) dignity = "Friendly";
    } else if (p.name === "Moon") {
      if (signIdx === 1) dignity = "Exalted";
      else if (signIdx === 7) dignity = "Debilitated";
      else if (signIdx === 3) dignity = "Own Sign";
      else if ([4, 2, 5].includes(signIdx)) dignity = "Friendly";
    } else if (p.name === "Mars") {
      if (signIdx === 9) dignity = "Exalted";
      else if (signIdx === 3) dignity = "Debilitated";
      else if (signIdx === 0 || signIdx === 7) dignity = "Own Sign";
      else if ([4, 8, 11].includes(signIdx)) dignity = "Friendly";
    } else if (p.name === "Mercury") {
      if (signIdx === 5) dignity = "Exalted";
      else if (signIdx === 11) dignity = "Debilitated";
      else if (signIdx === 2) dignity = "Own Sign";
      else if ([1, 4, 6].includes(signIdx)) dignity = "Friendly";
    } else if (p.name === "Jupiter") {
      if (signIdx === 3) dignity = "Exalted";
      else if (signIdx === 9) dignity = "Debilitated";
      else if (signIdx === 8 || signIdx === 11) dignity = "Own Sign";
      else if ([0, 4, 7].includes(signIdx)) dignity = "Friendly";
    } else if (p.name === "Venus") {
      if (signIdx === 11) dignity = "Exalted";
      else if (signIdx === 5) dignity = "Debilitated";
      else if (signIdx === 1 || signIdx === 6) dignity = "Own Sign";
      else if ([2, 9, 10].includes(signIdx)) dignity = "Friendly";
    } else if (p.name === "Saturn") {
      if (signIdx === 6) dignity = "Exalted";
      else if (signIdx === 0) dignity = "Debilitated";
      else if (signIdx === 9 || signIdx === 10) dignity = "Own Sign";
      else if ([1, 2, 5].includes(signIdx)) dignity = "Friendly";
    }

    const degInSign = calculateDivisionalDegreeInSign(p.siderealLongitude, divisionCode);

    divisionalPlanets.push({
      name: p.name,
      symbol: p.symbol,
      originalSign: p.rasiName,
      sign: signName,
      signIndex: signIdx,
      degreeInSign: degInSign,
      degreeFormatted: formatDivisionalDegree(degInSign),
      house,
      dignity,
      isRetrograde: p.isRetrograde,
    });
  }

  // 3. Assemble 12 Houses
  const houses: DivisionalHouse[] = [];
  for (let h = 1; h <= 12; h++) {
    const signIdx = (ascSignIdx + h - 1) % 12;
    const signObj = VEDIC_RASIS[signIdx];
    const occupants = divisionalPlanets.filter((item) => item.house === h);

    houses.push({
      house: h,
      signName: signObj.name,
      signIndex: signIdx,
      signSanskrit: signObj.sanskrit,
      planets: occupants,
    });
  }

  return {
    divisionCode,
    divisionName: config.name,
    harmonic: config.harmonic,
    significance: config.significance,
    ascendant: {
      sign: ascSignName,
      signIndex: ascSignIdx,
      degreeFormatted: formatDivisionalDegree(calculateDivisionalDegreeInSign(ascendantSiderealLon, divisionCode)),
    },
    planets: divisionalPlanets,
    houses,
  };
}

export interface VaisheshikamsaRank {
  planet: string;
  favorableCount: number;
  rankName: string;
  rankSanskrit: string;
  favorableVargas: string[];
  significance: string;
}

export function calculateVaisheshikamsa(
  planets: VedicPlanet[],
  ascendantSiderealLon: number,
  vargaKeys: string[] = [
    "D1",
    "D2",
    "D3",
    "D4",
    "D7",
    "D9",
    "D10",
    "D12",
    "D16",
    "D20",
    "D24",
    "D27",
    "D30",
    "D40",
    "D45",
    "D60",
  ]
): VaisheshikamsaRank[] {
  const chartResults = vargaKeys.map((code) =>
    calculateDivisionalChart(planets, ascendantSiderealLon, code)
  );

  const mainPlanets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

  return mainPlanets.map((pName) => {
    const favorableVargas: string[] = [];

    chartResults.forEach((chart) => {
      const p = chart.planets.find((item) => item.name === pName);
      if (p && (p.dignity === "Exalted" || p.dignity === "Own Sign")) {
        favorableVargas.push(chart.divisionCode);
      }
    });

    const count = favorableVargas.length;
    let rankName = "Samanya (Normal)";
    let rankSanskrit = "सामान्य";
    let significance = "Standard planetary expression across divisional hierarchies.";

    if (count >= 11) {
      rankName = "Brahmaloka (Transcendent Mastery)";
      rankSanskrit = "ब्रह्मलोक";
      significance = "Supreme auspiciousness; planet commands cosmic benevolence, effortless fortune, and liberation.";
    } else if (count === 10) {
      rankName = "Saumya (Nectarine Royalty)";
      rankSanskrit = "सौम्य";
      significance = "Sublime grace, radiant wisdom, and lasting historic legacy.";
    } else if (count === 9) {
      rankName = "Vaishnavamsa (Divine Grace)";
      rankSanskrit = "वैष्णवांश";
      significance = "Exceptional spiritual protection, sovereign prosperity, and universal honor.";
    } else if (count === 8) {
      rankName = "Iravata (Elephant of Indra)";
      rankSanskrit = "ऐरावत";
      significance = "Towering power, royal dignity, victory over all obstacles, and vast wealth.";
    } else if (count === 7) {
      rankName = "Devaloka (Heavenly Realm)";
      rankSanskrit = "देवलोक";
      significance = "Great fame, spotless reputation, virtue, and philanthropic triumph.";
    } else if (count === 6) {
      rankName = "Paravata (High Peak)";
      rankSanskrit = "पारावत";
      significance = "Sovereign authority, immovable foundation, and commanding leadership.";
    } else if (count === 5) {
      rankName = "Simhasana (Royal Throne)";
      rankSanskrit = "सिंहासन";
      significance = "Crown authority, high public office, and unassailable social stature.";
    } else if (count === 4) {
      rankName = "Gopura (City Gate / Fort)";
      rankSanskrit = "गोपुर";
      significance = "Substantial landed wealth, intellectual esteem, and familial honor.";
    } else if (count === 3) {
      rankName = "Uttama (Noble Quality)";
      rankSanskrit = "उत्तम";
      significance = "High creative intelligence, auspicious fortune, and refined character.";
    } else if (count === 2) {
      rankName = "Parijata (Celestial Flower)";
      rankSanskrit = "पारिजात";
      significance = "Steady growth, auspicious endeavors, and honorable achievements.";
    }

    return {
      planet: pName,
      favorableCount: count,
      rankName,
      rankSanskrit,
      favorableVargas,
      significance,
    };
  });
}
