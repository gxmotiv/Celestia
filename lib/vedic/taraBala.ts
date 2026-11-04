/**
 * Tara Bala (Tara Chakra) Engine
 * Implements the classical 9-fold Nakshatra Tara system.
 * Evaluates the auspiciousness of any day, transit, or planetary placement
 * relative to the native's Janma Nakshatra (natal Moon constellation).
 */

export interface TaraInfo {
  number: number; // 1 to 9
  name: string;
  sanskrit: string;
  nature: "Auspicious" | "Inauspicious" | "Cautionary";
  description: string;
  effect: string;
  score: number; // 0 to 100
}

export interface NakshatraTaraMapping {
  nakshatraIndex: number; // 0 to 26
  nakshatraName: string;
  nakshatraLord: string;
  cycle: "Janma (Cycle 1)" | "Anujanma (Cycle 2)" | "Trijanma (Cycle 3)";
  cycleNumber: number; // 1, 2, 3
  taraNumber: number;  // 1 to 9
  taraName: string;
  taraSanskrit: string;
  nature: "Auspicious" | "Inauspicious" | "Cautionary";
  score: number;
}

export interface TaraBalaResult {
  birthNakshatra: string;
  birthNakshatraIndex: number;
  taraGrid: NakshatraTaraMapping[];
  auspiciousTarasCount: number;
  inauspiciousTarasCount: number;
  summary: string;
}

export const TARA_DEFINITIONS: Record<number, TaraInfo> = {
  1: {
    number: 1,
    name: "Janma",
    sanskrit: "जन्म",
    nature: "Cautionary",
    description: "Birth Nakshatra. Indicates self, vitality, and vulnerability. Good for quiet routine, unfavorable for medical operations or conflict.",
    effect: "Average to delicate vitality; requires mindfulness.",
    score: 50,
  },
  2: {
    number: 2,
    name: "Sampat",
    sanskrit: "सम्पत्",
    nature: "Auspicious",
    description: "Wealth and Prosperity. Highly favorable for financial transactions, trade, contracts, and investments.",
    effect: "Material gain, prosperity, and joyous endeavors.",
    score: 95,
  },
  3: {
    number: 3,
    name: "Vipat",
    sanskrit: "विपत्",
    nature: "Inauspicious",
    description: "Danger, Losses, and Calamity. Unfavorable for beginning new projects, travel, or litigation.",
    effect: "Unexpected hurdles, wasted effort, and misunderstandings.",
    score: 20,
  },
  4: {
    number: 4,
    name: "Kshema",
    sanskrit: "क्षेम",
    nature: "Auspicious",
    description: "Security and Well-being. Excellent for healing, home, long-term construction, family blessings, and peace.",
    effect: "Comfort, protective shelter, and tranquil stability.",
    score: 90,
  },
  5: {
    number: 5,
    name: "Pratyak",
    sanskrit: "प्रत्यक्",
    nature: "Inauspicious",
    description: "Hostility and Adversity. Unfavorable for partnerships, agreements, or high-stakes negotiations.",
    effect: "Resistance from others, friction, and delays.",
    score: 25,
  },
  6: {
    number: 6,
    name: "Sadhaka",
    sanskrit: "साधक",
    nature: "Auspicious",
    description: "Success and Achievement. Supreme for executing ambitious goals, exams, interviews, and spiritual sadhana.",
    effect: "Accomplishment, victory over doubts, and spiritual fruition.",
    score: 100,
  },
  7: {
    number: 7,
    name: "Vadha (Naidhana)",
    sanskrit: "वध (नैधन)",
    nature: "Inauspicious",
    description: "Destruction and Severe Peril. Most hazardous Tara; strictly avoid starting any important venture.",
    effect: "High conflict, acute physical vulnerability, and major setbacks.",
    score: 10,
  },
  8: {
    number: 8,
    name: "Mitra",
    sanskrit: "मित्र",
    nature: "Auspicious",
    description: "Friendship and Harmony. Wonderful for social gatherings, romance, alliances, agreements, and celebrations.",
    effect: "Pleasant assistance, cordial alliances, and mutual goodwill.",
    score: 85,
  },
  9: {
    number: 9,
    name: "Param Mitra",
    sanskrit: "परम मित्र",
    nature: "Auspicious",
    description: "Supreme Best Friend. Exceptional for lifelong commitments, spiritual initiations, and bountiful ventures.",
    effect: "Profound blessings, benevolent benefactors, and deep fulfillment.",
    score: 95,
  },
};

const NAKSHATRA_NAMES = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

const NAKSHATRA_LORDS = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"
];

export class TaraBalaEngine {
  public calculateTaraBala(birthNakshatraIndex: number): TaraBalaResult {
    const grid: NakshatraTaraMapping[] = [];
    let auspiciousCount = 0;
    let inauspiciousCount = 0;

    for (let targetIdx = 0; targetIdx < 27; targetIdx++) {
      // Offset from birth nakshatra (1-indexed count)
      const diff = ((targetIdx - birthNakshatraIndex + 27) % 27) + 1;
      const taraNum = (((diff - 1) % 9) + 1);
      const cycleNum = Math.floor((diff - 1) / 9) + 1;
      const taraDef = TARA_DEFINITIONS[taraNum];

      const cycleLabel =
        cycleNum === 1
          ? "Janma (Cycle 1)"
          : cycleNum === 2
          ? "Anujanma (Cycle 2)"
          : "Trijanma (Cycle 3)";

      if (taraDef.nature === "Auspicious") auspiciousCount++;
      if (taraDef.nature === "Inauspicious") inauspiciousCount++;

      grid.push({
        nakshatraIndex: targetIdx,
        nakshatraName: NAKSHATRA_NAMES[targetIdx],
        nakshatraLord: NAKSHATRA_LORDS[targetIdx],
        cycle: cycleLabel,
        cycleNumber: cycleNum,
        taraNumber: taraNum,
        taraName: taraDef.name,
        taraSanskrit: taraDef.sanskrit,
        nature: taraDef.nature,
        score: taraDef.score,
      });
    }

    return {
      birthNakshatra: NAKSHATRA_NAMES[birthNakshatraIndex],
      birthNakshatraIndex,
      taraGrid: grid,
      auspiciousTarasCount: auspiciousCount,
      inauspiciousTarasCount: inauspiciousCount,
      summary: `Tara Chakra mapped for ${NAKSHATRA_NAMES[birthNakshatraIndex]}. Sampat (2), Kshema (4), Sadhaka (6), Mitra (8), and Param Mitra (9) are your powerhouse auspicious constellations.`,
    };
  }

  /**
   * Evaluates the Tara Bala for a specific transiting constellation.
   */
  public evaluateTransit(birthNakshatraIndex: number, currentTransitNakshatraIndex: number): TaraInfo {
    const diff = ((currentTransitNakshatraIndex - birthNakshatraIndex + 27) % 27) + 1;
    const taraNum = (((diff - 1) % 9) + 1);
    return TARA_DEFINITIONS[taraNum];
  }
}
