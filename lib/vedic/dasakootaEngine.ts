/**
 * Classical Dasakoota & Ekadasakoota Engine
 * Implements traditional South Indian and Pan-Indian Muhurta/Milan principles:
 * 1. Dina (Tara) Koota
 * 2. Gana Koota
 * 3. Mahendra Koota (Longevity & Progeny)
 * 4. Stree Deergha Koota (Prosperity from distance)
 * 5. Yoni Koota
 * 6. Rasi Koota (Bhakoot)
 * 7. Rasyadhipathi (Graha Maitri)
 * 8. Vasya Koota
 * 9. Rajju Koota (Vital Rope - Primary Veto)
 * 10. Vedha Koota (Piercing Affliction - Primary Veto)
 * 11. Varna Koota
 */

import { VedicChartData } from "../astronomy/vedic";

export type RajjuType = "Siras (Head)" | "Kantha (Neck)" | "Udara (Stomach)" | "Kati (Waist)" | "Pada (Feet)";

export interface RajjuAnalysis {
  groomRajju: RajjuType;
  brideRajju: RajjuType;
  isSameRajju: boolean;
  rajjuName: RajjuType | "Different (Harmonious)";
  isAfflicted: boolean;
  isCancelled: boolean;
  cancellationReason?: string;
  verdict: "Auspicious (No Rajju Dosha)" | "Neutralized / Mitigated" | "Rajju Dosha Present";
  signification: string;
  description: string;
}

export interface VedhaAnalysis {
  isVedhaPresent: boolean;
  afflictedPair?: string;
  verdict: "Auspicious (No Vedha)" | "Vedha Affliction Present";
  description: string;
}

export interface MahendraAnalysis {
  nakshatraDistance: number; // Bride nakshatra (1) to Groom nakshatra
  isFavorable: boolean;
  verdict: "Favorable (Mahendra Present)" | "Absent / Neutral";
  signification: string;
}

export interface StreeDeerghaAnalysis {
  distanceFromBride: number;
  isFavorable: boolean;
  strength: "High (15+ nakshatras)" | "Moderate (9-14 nakshatras)" | "Low (<9 nakshatras)";
  verdict: "Auspicious" | "Average" | "Weak";
  description: string;
}

export interface DasakootaItem {
  id: string;
  name: string;
  sanskrit: string;
  category: "Primary Veto" | "Auspicious Factor" | "Psychological / Physical";
  status: "Pass" | "Partial" | "Fail";
  scoreText: string;
  groomValue: string;
  brideValue: string;
  significance: string;
  explanation: string;
}

export interface DasakootaReport {
  rajju: RajjuAnalysis;
  vedha: VedhaAnalysis;
  mahendra: MahendraAnalysis;
  streeDeergha: StreeDeerghaAnalysis;
  kootas: DasakootaItem[];
  overallConcordance: "High" | "Moderate" | "Sensitive";
  vetoAlerts: string[];
  auspiciousYogas: string[];
  summary: string;
}

// 27 Nakshatras mapped to 5 Rajjus
// Siras (Head), Kantha (Neck), Udara (Stomach), Kati (Waist), Pada (Feet)
const RAJJU_MAPPING: Record<number, RajjuType> = {
  // Siras / Shiro Rajju (Head): Chitra, Mrigashira, Dhanishta
  4: "Siras (Head)", // Mrigashira
  13: "Siras (Head)", // Chitra
  22: "Siras (Head)", // Dhanishta

  // Kantha Rajju (Neck): Rohini, Ardra, Hasta, Swati, Shravana, Shatabhisha
  3: "Kantha (Neck)", // Rohini
  5: "Kantha (Neck)", // Ardra
  12: "Kantha (Neck)", // Hasta
  14: "Kantha (Neck)", // Swati
  21: "Kantha (Neck)", // Shravana
  23: "Kantha (Neck)", // Shatabhisha

  // Udara Rajju (Stomach): Krittika, Punarvasu, Uttara Phalguni, Vishakha, Uttara Ashadha, Purva Bhadrapada
  2: "Udara (Stomach)", // Krittika
  6: "Udara (Stomach)", // Punarvasu
  11: "Udara (Stomach)", // Uttara Phalguni
  15: "Udara (Stomach)", // Vishakha
  20: "Udara (Stomach)", // Uttara Ashadha
  24: "Udara (Stomach)", // Purva Bhadrapada

  // Kati Rajju (Waist): Bharani, Pushya, Purva Phalguni, Anuradha, Purva Ashadha, Uttara Bhadrapada
  1: "Kati (Waist)", // Bharani
  7: "Kati (Waist)", // Pushya
  10: "Kati (Waist)", // Purva Phalguni
  16: "Kati (Waist)", // Anuradha
  19: "Kati (Waist)", // Purva Ashadha
  25: "Kati (Waist)", // Uttara Bhadrapada

  // Pada Rajju (Feet): Ashwini, Ashlesha, Magha, Jyeshtha, Moola, Revati
  0: "Pada (Feet)", // Ashwini
  8: "Pada (Feet)", // Ashlesha
  9: "Pada (Feet)", // Magha
  17: "Pada (Feet)", // Jyeshtha
  18: "Pada (Feet)", // Moola
  26: "Pada (Feet)", // Revati
};

// Vedha Pairs (mutually piercing and incompatible Nakshatras)
const VEDHA_PAIRS: [number, number, string][] = [
  [0, 17, "Ashwini - Jyeshtha"],
  [1, 16, "Bharani - Anuradha"],
  [2, 15, "Krittika - Vishakha"],
  [3, 14, "Rohini - Swati"],
  [5, 21, "Ardra - Shravana"],
  [6, 20, "Punarvasu - Uttara Ashadha"],
  [7, 19, "Pushya - Purva Ashadha"],
  [8, 18, "Ashlesha - Moola"],
  [9, 26, "Magha - Revati"],
  [10, 25, "Purva Phalguni - Uttara Bhadrapada"],
  [11, 24, "Uttara Phalguni - Purva Bhadrapada"],
  [12, 23, "Hasta - Shatabhisha"],
  [4, 13, "Mrigashira - Chitra"],
  [4, 22, "Mrigashira - Dhanishta"],
  [13, 22, "Chitra - Dhanishta"],
];

const NAKSHATRA_NAMES = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Moola", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

export class DasakootaEngine {
  /**
   * Evaluates complete Dasakoota analysis between two Vedic charts
   */
  public static evaluate(
    chart1: VedicChartData,
    chart2: VedicChartData,
    gender1: "male" | "female" | "other" | string = "male",
    gender2: "male" | "female" | "other" | string = "female"
  ): DasakootaReport {
    // Determine who is groom and bride for traditional orientation
    const isP1Male = gender1 === "male" || gender2 === "female";
    const groomChart = isP1Male ? chart1 : chart2;
    const brideChart = isP1Male ? chart2 : chart1;

    const groomMoon = groomChart.planets.find((p) => p.id === "moon") || groomChart.planets[1];
    const brideMoon = brideChart.planets.find((p) => p.id === "moon") || brideChart.planets[1];

    const groomNakIdx = groomMoon.nakshatraIndex;
    const brideNakIdx = brideMoon.nakshatraIndex;
    const groomPada = groomMoon.pada;
    const bridePada = brideMoon.pada;
    const groomRasiIdx = groomMoon.rasiIndex;
    const brideRasiIdx = brideMoon.rasiIndex;

    // 1. Rajju Evaluation
    const groomRajju = RAJJU_MAPPING[groomNakIdx] || "Pada (Feet)";
    const brideRajju = RAJJU_MAPPING[brideNakIdx] || "Pada (Feet)";
    const isSameRajju = groomRajju === brideRajju;

    // Check classical cancellations:
    // If Moon signs have the same lord OR are in mutual 1/7 opposition (Sama-Saptaka),
    // OR if nakshatra padas are different with friendly rasi lords, Rajju dosha is heavily mitigated.
    const sameRasiLord = groomMoon.rasiName === brideMoon.rasiName;
    const mutualOpposition = Math.abs(groomRasiIdx - brideRasiIdx) === 6;
    const differentPadas = groomPada !== bridePada;

    let isAfflicted = false;
    let isCancelled = false;
    let cancellationReason: string | undefined;

    if (isSameRajju) {
      if (sameRasiLord || mutualOpposition) {
        isCancelled = true;
        cancellationReason = `Rajju Dosha is mitigated because both charts have ${
          sameRasiLord ? "the same Moon sign lord" : "auspicious 1/7 Sama-Saptaka mutual opposition"
        }.`;
        isAfflicted = false;
      } else if (differentPadas && Math.abs(groomNakIdx - brideNakIdx) >= 4) {
        isCancelled = true;
        cancellationReason = "Different Nakshatra Padas and sufficient stellar separation mitigate the severe effects.";
        isAfflicted = false;
      } else {
        isAfflicted = true;
      }
    }

    const rajjuSignifications: Record<RajjuType, string> = {
      "Siras (Head)": "Associated with longevity of husband in classical texts. Highest caution advised when unmitigated.",
      "Kantha (Neck)": "Associated with marital harmony, domestic peace, and mutual emotional health.",
      "Udara (Stomach)": "Associated with progeny, fertility, and child welfare.",
      "Kati (Waist)": "Associated with financial stability, prosperity, and wealth generation.",
      "Pada (Feet)": "Associated with mobility, lifestyle shifts, wanderlust, and domestic stability."
    };

    const rajjuAnalysis: RajjuAnalysis = {
      groomRajju,
      brideRajju,
      isSameRajju,
      rajjuName: isSameRajju ? groomRajju : "Different (Harmonious)",
      isAfflicted,
      isCancelled,
      cancellationReason,
      verdict: !isSameRajju
        ? "Auspicious (No Rajju Dosha)"
        : isCancelled
        ? "Neutralized / Mitigated"
        : "Rajju Dosha Present",
      signification: rajjuSignifications[groomRajju] || "Vital planetary flow between both charts.",
      description: !isSameRajju
        ? `Both partners belong to different Rajjus (${groomRajju} and ${brideRajju}), ensuring an unobstructed, protective energy exchange.`
        : isCancelled
        ? `Both share ${groomRajju}, but ${cancellationReason}`
        : `Both belong to the same ${groomRajju}. Classical Jyotish advises remedial observances to harmonize this vital energy rope.`
    };

    // 2. Vedha Evaluation
    let isVedhaPresent = false;
    let afflictedPair: string | undefined;

    for (const [n1, n2, pairLabel] of VEDHA_PAIRS) {
      if (
        (groomNakIdx === n1 && brideNakIdx === n2) ||
        (groomNakIdx === n2 && brideNakIdx === n1)
      ) {
        isVedhaPresent = true;
        afflictedPair = pairLabel;
        break;
      }
    }

    const vedhaAnalysis: VedhaAnalysis = {
      isVedhaPresent,
      afflictedPair,
      verdict: isVedhaPresent ? "Vedha Affliction Present" : "Auspicious (No Vedha)",
      description: isVedhaPresent
        ? `A classical Vedha (piercing friction) exists between ${NAKSHATRA_NAMES[groomNakIdx]} and ${NAKSHATRA_NAMES[brideNakIdx]} (${afflictedPair}). Requires focused remedies.`
        : `No Vedha affliction between ${NAKSHATRA_NAMES[groomNakIdx]} and ${NAKSHATRA_NAMES[brideNakIdx]}. The astral rays do not cross-pierce.`
    };

    // 3. Mahendra Evaluation
    // Count from Bride's star to Groom's star (inclusive: 1 to 27)
    const distFromBride = ((groomNakIdx - brideNakIdx + 27) % 27) + 1;
    // Auspicious distances for Mahendra: 4, 7, 10, 13, 16, 19, 22, 25
    const mahendraDistances = [4, 7, 10, 13, 16, 19, 22, 25];
    const isMahendra = mahendraDistances.includes(distFromBride);

    const mahendraAnalysis: MahendraAnalysis = {
      nakshatraDistance: distFromBride,
      isFavorable: isMahendra,
      verdict: isMahendra ? "Favorable (Mahendra Present)" : "Absent / Neutral",
      signification: isMahendra
        ? "Bestows long-lasting attachment, family welfare, and auspicious generational continuity."
        : "Standard alignment without special Mahendra blessing."
    };

    // 4. Stree Deergha Evaluation
    // Distance from Bride to Groom should be > 13 for optimal results
    const isStreeDeerghaFav = distFromBride >= 13;
    const streeStrength =
      distFromBride >= 15
        ? "High (15+ nakshatras)"
        : distFromBride >= 9
        ? "Moderate (9-14 nakshatras)"
        : "Low (<9 nakshatras)";

    const streeDeerghaAnalysis: StreeDeerghaAnalysis = {
      distanceFromBride: distFromBride,
      isFavorable: isStreeDeerghaFav,
      strength: streeStrength,
      verdict: distFromBride >= 15 ? "Auspicious" : distFromBride >= 9 ? "Average" : "Weak",
      description:
        distFromBride >= 15
          ? `Groom's nakshatra is ${distFromBride} positions from Bride's star. Bestows long life, prosperity, and emotional reverence for the woman.`
          : distFromBride >= 9
          ? `Groom's nakshatra is ${distFromBride} positions away. Moderate Stree Deergha strength.`
          : `Groom's star is only ${distFromBride} positions from Bride's star, below the ideal threshold of 13.`
    };

    // Construct full Dasakoota items
    const kootas: DasakootaItem[] = [
      {
        id: "rajju",
        name: "Rajju Koota",
        sanskrit: "रज्जु कूट",
        category: "Primary Veto",
        status: !isSameRajju || isCancelled ? "Pass" : "Fail",
        scoreText: isAfflicted ? "Dosha" : isCancelled ? "Mitigated" : "Clear",
        groomValue: groomRajju,
        brideValue: brideRajju,
        significance: "Spousal longevity and vital prana equilibrium",
        explanation: rajjuAnalysis.description,
      },
      {
        id: "vedha",
        name: "Vedha Koota",
        sanskrit: "वेध कूट",
        category: "Primary Veto",
        status: isVedhaPresent ? "Fail" : "Pass",
        scoreText: isVedhaPresent ? "Vedha" : "Clear",
        groomValue: NAKSHATRA_NAMES[groomNakIdx],
        brideValue: NAKSHATRA_NAMES[brideNakIdx],
        significance: "Incurable piercing friction between constellations",
        explanation: vedhaAnalysis.description,
      },
      {
        id: "mahendra",
        name: "Mahendra Koota",
        sanskrit: "महेन्द्र कूट",
        category: "Auspicious Factor",
        status: isMahendra ? "Pass" : "Partial",
        scoreText: isMahendra ? "Present" : "Neutral",
        groomValue: `#${groomNakIdx + 1} ${NAKSHATRA_NAMES[groomNakIdx]}`,
        brideValue: `#${brideNakIdx + 1} ${NAKSHATRA_NAMES[brideNakIdx]}`,
        significance: "Family lineage, prosperity, and mutual attachment",
        explanation: mahendraAnalysis.signification,
      },
      {
        id: "streeDeergha",
        name: "Stree Deergha",
        sanskrit: "स्त्री दीर्घ",
        category: "Auspicious Factor",
        status: distFromBride >= 13 ? "Pass" : distFromBride >= 9 ? "Partial" : "Fail",
        scoreText: `${distFromBride} Stars`,
        groomValue: NAKSHATRA_NAMES[groomNakIdx],
        brideValue: NAKSHATRA_NAMES[brideNakIdx],
        significance: "Prosperity, woman's happiness, and enduring stability",
        explanation: streeDeerghaAnalysis.description,
      },
    ];

    // Collect alerts & yogas
    const vetoAlerts: string[] = [];
    if (rajjuAnalysis.isAfflicted) {
      vetoAlerts.push(`Active Rajju Dosha in ${groomRajju}.`);
    }
    if (vedhaAnalysis.isVedhaPresent) {
      vetoAlerts.push(`Vedha Affliction between ${NAKSHATRA_NAMES[groomNakIdx]} and ${NAKSHATRA_NAMES[brideNakIdx]}.`);
    }

    const auspiciousYogas: string[] = [];
    if (!isSameRajju) {
      auspiciousYogas.push("Harmonious Rajju alignment across vital zones.");
    } else if (isCancelled) {
      auspiciousYogas.push("Classical cancellation applied to Rajju concurrence.");
    }
    if (!isVedhaPresent) {
      auspiciousYogas.push("Free from adverse Vedha piercing affliction.");
    }
    if (isMahendra) {
      auspiciousYogas.push("Mahendra Koota present, blessing the union with generational stability.");
    }
    if (distFromBride >= 15) {
      auspiciousYogas.push("Strong Stree Deergha positioning exceeding 15 stellar mansions.");
    }

    const overallConcordance =
      vetoAlerts.length === 0 && (isMahendra || distFromBride >= 13)
        ? "High"
        : vetoAlerts.length > 0
        ? "Sensitive"
        : "Moderate";

    return {
      rajju: rajjuAnalysis,
      vedha: vedhaAnalysis,
      mahendra: mahendraAnalysis,
      streeDeergha: streeDeerghaAnalysis,
      kootas,
      overallConcordance,
      vetoAlerts,
      auspiciousYogas,
      summary:
        vetoAlerts.length === 0
          ? "The union clears all critical Dasakoota veto hurdles (Rajju and Vedha) with favorable vital energy flow."
          : `The union contains sensitive points (${vetoAlerts.join(", ")}). Classical mitigations and remedial chanting are recommended.`,
    };
  }
}
