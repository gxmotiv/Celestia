/**
 * Comprehensive Master Vedic Relationship Astrology & Kundli Milan Engine
 * 
 * Implements classical Parashari Vivaha Melapak (Ashtakoota Milan - 36 Gunas),
 * Kuja (Manglik) Dosha calculation with classical Kuja Dosha Bhanga (8 cancellation rules),
 * Navamsa D9 synergy analysis, and traditional Vedic Shanti remedial prescriptions.
 */

import { VedicChartData, VedicPlanet } from "../astronomy/vedic";

export type KootaName =
  | "varna"
  | "vashya"
  | "tara"
  | "yoni"
  | "grahaMaitri"
  | "gana"
  | "bhakoot"
  | "nadi";

export interface KootaScoreDetail {
  name: KootaName;
  displayName: string;
  sanskritName: string;
  pointsEarned: number;
  maxPoints: number;
  person1Trait: string;
  person2Trait: string;
  description: string;
  doshaPresent: boolean;
  doshaName?: string;
  cancellationPresent?: boolean;
  cancellationReason?: string;
}

export interface ManglikPersonStatus {
  personName: string;
  isManglik: boolean;
  severity: "None" | "Anshik (Partial)" | "Poorna (Full)";
  marsHouseFromLagna: number;
  marsHouseFromMoon: number;
  marsHouseFromVenus: number;
  affectedHouses: number[];
  cancellations: string[];
  isCancelled: boolean;
  finalStatus: "Non-Manglik" | "Manglik (Cancelled)" | "Manglik (Active)";
  detail: string;
}

export interface ManglikPairAnalysis {
  person1: ManglikPersonStatus;
  person2: ManglikPersonStatus;
  mutualCancellation: boolean;
  compatibilitySummary: string;
  recommendations: string[];
}

export interface NavamsaSynergy {
  p1NavamsaMoonSign: string;
  p2NavamsaMoonSign: string;
  p1NavamsaVenusSign: string;
  p2NavamsaVenusSign: string;
  p1Navamsa7thLord: string;
  p2Navamsa7thLord: string;
  synergyScore: number; // 0 - 100
  soulConnectionLevel: "Karmic / Soulmate" | "Deeply Harmonious" | "Balanced Growth" | "Frictional Dynamics";
  summary: string;
  synergyHighlights: string[];
}

export interface ShantiRemedy {
  dosha: string;
  severity: "High" | "Moderate" | "Mild";
  deityPuja: string;
  mantra: string;
  gemstoneOrCharity: string;
  lifestyleAdvice: string;
}

export interface KundliMilanReport {
  person1Name: string;
  person2Name: string;
  totalGunas: number;
  maxGunas: number; // 36
  percentage: number;
  verdict: "Ati-Uttama (Supreme Match)" | "Uttama (Highly Auspicious)" | "Madhyama (Auspicious / Average)" | "Ashubha (Inauspicious / Remedial Need)";
  verdictGrade: "A+" | "A" | "B" | "C";
  verdictDescription: string;
  kootas: Record<KootaName, KootaScoreDetail>;
  manglikAnalysis: ManglikPairAnalysis;
  navamsaSynergy: NavamsaSynergy;
  activeDoshas: string[];
  cancellationsApplied: string[];
  shantiRemedies: ShantiRemedy[];
}

// -------------------------------------------------------------
// ASTRONOMICAL & VEDIC JYOTISH TABLES
// -------------------------------------------------------------

// Nakshatra Animal Yonis (14 pairs)
const NAKSHATRA_YONIS: Record<number, { animal: string; gender: "M" | "F" }> = {
  0: { animal: "Horse", gender: "M" }, // Ashwini
  1: { animal: "Elephant", gender: "M" }, // Bharani
  2: { animal: "Sheep", gender: "F" }, // Krittika
  3: { animal: "Serpent", gender: "M" }, // Rohini
  4: { animal: "Serpent", gender: "F" }, // Mrigashira
  5: { animal: "Dog", gender: "F" }, // Ardra
  6: { animal: "Cat", gender: "F" }, // Punarvasu
  7: { animal: "Sheep", gender: "M" }, // Pushya
  8: { animal: "Cat", gender: "M" }, // Ashlesha
  9: { animal: "Rat", gender: "M" }, // Magha
  10: { animal: "Rat", gender: "F" }, // Purva Phalguni
  11: { animal: "Cow", gender: "M" }, // Uttara Phalguni
  12: { animal: "Buffalo", gender: "F" }, // Hasta
  13: { animal: "Tiger", gender: "F" }, // Chitra
  14: { animal: "Buffalo", gender: "M" }, // Swati
  15: { animal: "Tiger", gender: "M" }, // Vishakha
  16: { animal: "Hare", gender: "F" }, // Anuradha
  17: { animal: "Hare", gender: "M" }, // Jyeshtha
  18: { animal: "Dog", gender: "M" }, // Moola
  19: { animal: "Monkey", gender: "M" }, // Purva Ashadha
  20: { animal: "Mongoose", gender: "M" }, // Uttara Ashadha
  21: { animal: "Monkey", gender: "F" }, // Shravana
  22: { animal: "Lion", gender: "F" }, // Dhanishta
  23: { animal: "Horse", gender: "F" }, // Shatabhisha
  24: { animal: "Lion", gender: "M" }, // Purva Bhadrapada
  25: { animal: "Cow", gender: "F" }, // Uttara Bhadrapada
  26: { animal: "Elephant", gender: "F" }, // Revati
};

// Yoni Enemy Pairs (Inimical Animals)
const YONI_ENEMIES: Record<string, string> = {
  Horse: "Buffalo",
  Buffalo: "Horse",
  Elephant: "Lion",
  Lion: "Elephant",
  Sheep: "Monkey",
  Monkey: "Sheep",
  Serpent: "Mongoose",
  Mongoose: "Serpent",
  Dog: "Hare",
  Hare: "Dog",
  Cat: "Rat",
  Rat: "Cat",
  Cow: "Tiger",
  Tiger: "Cow",
};

// Ganas: 0: Deva, 1: Manushya, 2: Rakshasa
const NAKSHATRA_GANAS: Record<number, "Deva" | "Manushya" | "Rakshasa"> = {
  0: "Deva", 1: "Manushya", 2: "Rakshasa",
  3: "Manushya", 4: "Deva", 5: "Manushya",
  6: "Deva", 7: "Deva", 8: "Rakshasa",
  9: "Rakshasa", 10: "Manushya", 11: "Manushya",
  12: "Deva", 13: "Rakshasa", 14: "Deva",
  15: "Rakshasa", 16: "Deva", 17: "Rakshasa",
  18: "Rakshasa", 19: "Manushya", 20: "Manushya",
  21: "Deva", 22: "Rakshasa", 23: "Rakshasa",
  24: "Manushya", 25: "Manushya", 26: "Deva",
};

// Nadis: 0: Aadi (Vata), 1: Madhya (Pitta), 2: Antya (Kapha)
const NAKSHATRA_NADIS: Record<number, "Aadi" | "Madhya" | "Antya"> = {
  0: "Aadi", 1: "Madhya", 2: "Antya",
  5: "Aadi", 4: "Madhya", 3: "Antya",
  6: "Aadi", 7: "Madhya", 8: "Antya",
  11: "Aadi", 10: "Madhya", 9: "Antya",
  12: "Aadi", 13: "Madhya", 14: "Antya",
  17: "Aadi", 16: "Madhya", 15: "Antya",
  18: "Aadi", 19: "Madhya", 20: "Antya",
  23: "Aadi", 22: "Madhya", 21: "Antya",
  24: "Aadi", 25: "Madhya", 26: "Antya",
};

// Sign planetary lords
const SIGN_LORDS: Record<number, string> = {
  0: "Mars", 1: "Venus", 2: "Mercury", 3: "Moon",
  4: "Sun", 5: "Mercury", 6: "Venus", 7: "Mars",
  8: "Jupiter", 9: "Saturn", 10: "Saturn", 11: "Jupiter",
};

// Classical Planetary Relationships (Friend: 1, Neutral: 0, Enemy: -1)
const PLANET_RELATIONS: Record<string, Record<string, number>> = {
  Sun: { Sun: 1, Moon: 1, Mars: 1, Mercury: 0, Jupiter: 1, Venus: -1, Saturn: -1 },
  Moon: { Sun: 1, Moon: 1, Mars: 0, Mercury: 1, Jupiter: 0, Venus: 0, Saturn: 0 },
  Mars: { Sun: 1, Moon: 1, Mars: 1, Mercury: -1, Jupiter: 1, Venus: 0, Saturn: 0 },
  Mercury: { Sun: 1, Moon: -1, Mars: 0, Mercury: 1, Jupiter: 0, Venus: 1, Saturn: 0 },
  Jupiter: { Sun: 1, Moon: 1, Mars: 1, Mercury: -1, Jupiter: 1, Venus: -1, Saturn: 0 },
  Venus: { Sun: -1, Moon: -1, Mars: 0, Mercury: 1, Jupiter: 0, Venus: 1, Saturn: 1 },
  Saturn: { Sun: -1, Moon: -1, Mars: -1, Mercury: 1, Jupiter: 0, Venus: 1, Saturn: 1 },
};

export class KundliMilanEngine {
  /**
   * Main calculation entry point
   */
  public static calculateMilan(
    person1Vedic: VedicChartData,
    person2Vedic: VedicChartData,
    person1Name: string = "Person 1",
    person2Name: string = "Person 2",
    person1Gender: string = "Male",
    person2Gender: string = "Female"
  ): KundliMilanReport {
    // 1. Calculate each of the 8 Kootas
    const varna = this.evalVarna(person1Vedic, person2Vedic, person1Gender, person2Gender);
    const vashya = this.evalVashya(person1Vedic, person2Vedic);
    const tara = this.evalTara(person1Vedic, person2Vedic);
    const yoni = this.evalYoni(person1Vedic, person2Vedic);
    const grahaMaitri = this.evalGrahaMaitri(person1Vedic, person2Vedic);
    const gana = this.evalGana(person1Vedic, person2Vedic);
    const bhakoot = this.evalBhakoot(person1Vedic, person2Vedic);
    const nadi = this.evalNadi(person1Vedic, person2Vedic);

    const kootas: Record<KootaName, KootaScoreDetail> = {
      varna,
      vashya,
      tara,
      yoni,
      grahaMaitri,
      gana,
      bhakoot,
      nadi,
    };

    // Calculate total Gunas
    const totalGunas =
      varna.pointsEarned +
      vashya.pointsEarned +
      tara.pointsEarned +
      yoni.pointsEarned +
      grahaMaitri.pointsEarned +
      gana.pointsEarned +
      bhakoot.pointsEarned +
      nadi.pointsEarned;

    const percentage = Math.round((totalGunas / 36) * 100);

    // 2. Kuja (Manglik) Dosha Evaluation
    const manglikAnalysis = this.evalManglik(
      person1Vedic,
      person2Vedic,
      person1Name,
      person2Name
    );

    // 3. Navamsa D9 Synergy Evaluation
    const navamsaSynergy = this.evalNavamsaSynergy(person1Vedic, person2Vedic);

    // 4. Collect Active Doshas & Cancellations
    const activeDoshas: string[] = [];
    const cancellationsApplied: string[] = [];

    if (nadi.doshaPresent) {
      if (nadi.cancellationPresent) {
        cancellationsApplied.push(`Nadi Dosha Cancelled: ${nadi.cancellationReason}`);
      } else {
        activeDoshas.push("Nadi Dosha (Genetic & Physiological Discord)");
      }
    }

    if (bhakoot.doshaPresent) {
      if (bhakoot.cancellationPresent) {
        cancellationsApplied.push(`Bhakoot Dosha Cancelled: ${bhakoot.cancellationReason}`);
      } else {
        activeDoshas.push("Bhakoot Dosha (Emotional & Family Distance)");
      }
    }

    if (gana.doshaPresent) {
      if (gana.cancellationPresent) {
        cancellationsApplied.push(`Gana Dosha Cancelled: ${gana.cancellationReason}`);
      } else {
        activeDoshas.push("Gana Dosha (Temperament Friction)");
      }
    }

    if (manglikAnalysis.person1.isManglik && !manglikAnalysis.person1.isCancelled && !manglikAnalysis.mutualCancellation) {
      activeDoshas.push(`${person1Name} Active Kuja (Manglik) Dosha`);
    }
    if (manglikAnalysis.person2.isManglik && !manglikAnalysis.person2.isCancelled && !manglikAnalysis.mutualCancellation) {
      activeDoshas.push(`${person2Name} Active Kuja (Manglik) Dosha`);
    }
    if (manglikAnalysis.mutualCancellation) {
      cancellationsApplied.push("Mutual Manglik Cancellation (Both partners share Kuja placement)");
    }
    if (manglikAnalysis.person1.cancellations.length > 0) {
      cancellationsApplied.push(`${person1Name} Manglik Mitigations: ${manglikAnalysis.person1.cancellations.join(", ")}`);
    }
    if (manglikAnalysis.person2.cancellations.length > 0) {
      cancellationsApplied.push(`${person2Name} Manglik Mitigations: ${manglikAnalysis.person2.cancellations.join(", ")}`);
    }

    // 5. Generate Traditional Vedic Shanti Remedies
    const shantiRemedies = this.generateRemedies(activeDoshas, manglikAnalysis);

    // 6. Overall Verdict & Grading
    let verdict: KundliMilanReport["verdict"] = "Madhyama (Auspicious / Average)";
    let verdictGrade: KundliMilanReport["verdictGrade"] = "B";
    let verdictDescription = "";

    if (totalGunas >= 28) {
      verdict = "Ati-Uttama (Supreme Match)";
      verdictGrade = "A+";
      verdictDescription =
        "Exceptional alignment across spiritual, emotional, physiological, and psychological dimensions. Classical texts praise this union as universally auspicious for lifelong prosperity and mutual elevation.";
    } else if (totalGunas >= 21) {
      verdict = "Uttama (Highly Auspicious)";
      verdictGrade = "A";
      verdictDescription =
        "Solid, highly favorable match. The planetary and lunar archetypes share strong resonance, supporting harmonious marriage, shared growth, and familial joy.";
    } else if (totalGunas >= 18) {
      verdict = "Madhyama (Auspicious / Average)";
      verdictGrade = "B";
      verdictDescription =
        "Traditional threshold of acceptance (18+ Gunas). The union possesses adequate harmony. Practicing mutual understanding and observing recommended astrological remedies ensures steady longevity.";
    } else {
      verdict = "Ashubha (Inauspicious / Remedial Need)";
      verdictGrade = "C";
      verdictDescription =
        "Below the classical 18-Guna threshold. Deeper astrological considerations (individual strong 7th house, Jupiter aspects, and D9 Navamsa) along with specific Shanti homas are recommended before solemnizing.";
    }

    return {
      person1Name,
      person2Name,
      totalGunas,
      maxGunas: 36,
      percentage,
      verdict,
      verdictGrade,
      verdictDescription,
      kootas,
      manglikAnalysis,
      navamsaSynergy,
      activeDoshas,
      cancellationsApplied,
      shantiRemedies,
    };
  }

  // -------------------------------------------------------------
  // 1. VARNA KOOTA (1 Point)
  // -------------------------------------------------------------
  private static evalVarna(
    p1: VedicChartData,
    p2: VedicChartData,
    p1Gender: string,
    p2Gender: string
  ): KootaScoreDetail {
    // Varnas by Moon Rasi:
    // Brahmin (Water): Cancer(3), Scorpio(7), Pisces(11) -> rank 4
    // Kshatriya (Fire): Aries(0), Leo(4), Sagittarius(8) -> rank 3
    // Vaishya (Earth): Taurus(1), Virgo(5), Capricorn(9) -> rank 2
    // Shudra (Air): Gemini(2), Libra(6), Aquarius(10) -> rank 1
    const getVarnaInfo = (rasiIdx: number) => {
      switch (rasiIdx) {
        case 3: case 7: case 11: return { varna: "Brahmin (Spiritual / Water)", rank: 4 };
        case 0: case 4: case 8: return { varna: "Kshatriya (Protector / Fire)", rank: 3 };
        case 1: case 5: case 9: return { varna: "Vaishya (Commerce / Earth)", rank: 2 };
        default: return { varna: "Shudra (Service / Air)", rank: 1 };
      }
    };

    const v1 = getVarnaInfo(p1.lagna.rasiIndex ?? 0);
    // Find Moon rasi
    const moon1 = p1.planets.find((pl) => pl.name === "Moon");
    const moon2 = p2.planets.find((pl) => pl.name === "Moon");
    const varna1 = getVarnaInfo(moon1?.rasiIndex ?? 0);
    const varna2 = getVarnaInfo(moon2?.rasiIndex ?? 0);

    let points = 0;
    const isP1Male = p1Gender.toLowerCase() === "male";
    const isP2Male = p2Gender.toLowerCase() === "male";

    // Traditional rule: Groom varna >= Bride varna gives 1 pt.
    // For egalitarian / modern matrix: equal gets 1 pt, higher gets 1 pt, one step difference gets 1 pt if mutual respect.
    if (isP1Male && !isP2Male) {
      points = varna1.rank >= varna2.rank ? 1 : 0;
    } else if (isP2Male && !isP1Male) {
      points = varna2.rank >= varna1.rank ? 1 : 0;
    } else {
      points = Math.abs(varna1.rank - varna2.rank) <= 1 ? 1 : 0.5;
    }

    return {
      name: "varna",
      displayName: "Varna Koota (Spiritual Ego & Temperament)",
      sanskritName: "वर्ण कूट",
      pointsEarned: points,
      maxPoints: 1,
      person1Trait: varna1.varna,
      person2Trait: varna2.varna,
      description: "Measures mutual respect, spiritual capacity, and intrinsic ego harmony.",
      doshaPresent: points === 0,
      doshaName: points === 0 ? "Varna Asamyata" : undefined,
    };
  }

  // -------------------------------------------------------------
  // 2. VASHYA KOOTA (2 Points)
  // -------------------------------------------------------------
  private static evalVashya(p1: VedicChartData, p2: VedicChartData): KootaScoreDetail {
    const getVashya = (rasiIdx: number) => {
      switch (rasiIdx) {
        case 0: case 1: return "Chatushpada (Quadruped)"; // Aries, Taurus
        case 2: case 5: case 6: case 10: return "Manava (Human / Biped)"; // Gemini, Virgo, Libra, Aquarius
        case 3: case 11: return "Jalachara (Aquatic)"; // Cancer, Pisces
        case 4: return "Vanachara (Wild / Lion)"; // Leo
        case 7: return "Keeta (Insect / Scorpion)"; // Scorpio
        case 8: return "Dwipada-Chatushpada (Human/Quadruped)"; // Sag
        case 9: return "Jala-Chatushpada (Aquatic/Quadruped)"; // Cap
        default: return "Manava (Human)";
      }
    };

    const m1 = p1.planets.find((pl) => pl.name === "Moon");
    const m2 = p2.planets.find((pl) => pl.name === "Moon");
    const v1 = getVashya(m1?.rasiIndex ?? 0);
    const v2 = getVashya(m2?.rasiIndex ?? 0);

    let points = 1;
    if (v1 === v2) {
      points = 2;
    } else if (
      (v1.includes("Manava") && v2.includes("Manava")) ||
      (v1.includes("Chatushpada") && v2.includes("Manava"))
    ) {
      points = 1.5;
    } else if (v1.includes("Vanachara") || v2.includes("Vanachara")) {
      points = 0.5; // Lion predator archetype
    }

    return {
      name: "vashya",
      displayName: "Vashya Koota (Mutual Magnetic Attraction)",
      sanskritName: "वश्य कूट",
      pointsEarned: points,
      maxPoints: 2,
      person1Trait: v1,
      person2Trait: v2,
      description: "Assesses instinctual attraction, power dynamics, and mutual willingness to listen.",
      doshaPresent: points < 1,
    };
  }

  // -------------------------------------------------------------
  // 3. TARA KOOTA (3 Points)
  // -------------------------------------------------------------
  private static evalTara(p1: VedicChartData, p2: VedicChartData): KootaScoreDetail {
    const m1 = p1.planets.find((pl) => pl.name === "Moon");
    const m2 = p2.planets.find((pl) => pl.name === "Moon");
    const n1 = m1?.nakshatraIndex ?? 0;
    const n2 = m2?.nakshatraIndex ?? 0;

    // Count from n1 to n2
    const d1to2 = ((n2 - n1 + 27) % 27) + 1;
    const tara1 = (d1to2 % 9) || 9;

    // Count from n2 to n1
    const d2to1 = ((n1 - n2 + 27) % 27) + 1;
    const tara2 = (d2to1 % 9) || 9;

    const auspiciousTaras = [1, 2, 4, 6, 8, 9];
    const isT1Good = auspiciousTaras.includes(tara1);
    const isT2Good = auspiciousTaras.includes(tara2);

    let points = 0;
    if (isT1Good && isT2Good) points = 3;
    else if (isT1Good || isT2Good) points = 1.5;
    else points = 0;

    const TARA_NAMES: Record<number, string> = {
      1: "Janma (Birth)", 2: "Sampat (Wealth)", 3: "Vipat (Danger)",
      4: "Kshema (Well-being)", 5: "Pratyak (Obstacles)", 6: "Sadhana (Success)",
      7: "Naidhana (Distress)", 8: "Mitra (Friendship)", 9: "Parama Mitra (Supreme Ally)",
    };

    return {
      name: "tara",
      displayName: "Tara Koota (Destiny & Auspicious Star Rhythm)",
      sanskritName: "तारा कूट",
      pointsEarned: points,
      maxPoints: 3,
      person1Trait: `Tara ${tara1}: ${TARA_NAMES[tara1] ?? "Neutral"}`,
      person2Trait: `Tara ${tara2}: ${TARA_NAMES[tara2] ?? "Neutral"}`,
      description: "Evaluates health, longevity, and destiny resonance between birth stars.",
      doshaPresent: points === 0,
      doshaName: points === 0 ? "Tara Dosha" : undefined,
    };
  }

  // -------------------------------------------------------------
  // 4. YONI KOOTA (4 Points)
  // -------------------------------------------------------------
  private static evalYoni(p1: VedicChartData, p2: VedicChartData): KootaScoreDetail {
    const m1 = p1.planets.find((pl) => pl.name === "Moon");
    const m2 = p2.planets.find((pl) => pl.name === "Moon");
    const n1 = m1?.nakshatraIndex ?? 0;
    const n2 = m2?.nakshatraIndex ?? 0;

    const yoni1 = NAKSHATRA_YONIS[n1] || { animal: "Cow", gender: "F" };
    const yoni2 = NAKSHATRA_YONIS[n2] || { animal: "Cow", gender: "M" };

    let points = 2; // neutral base
    let dosha = false;

    if (yoni1.animal === yoni2.animal) {
      points = 4; // Perfect same animal match
    } else if (YONI_ENEMIES[yoni1.animal] === yoni2.animal) {
      points = 0; // Sworn natural enemies
      dosha = true;
    } else {
      points = 2.5; // Friendly/neutral animals
    }

    return {
      name: "yoni",
      displayName: "Yoni Koota (Physical, Instinctual & Biological Harmony)",
      sanskritName: "योनि कूट",
      pointsEarned: points,
      maxPoints: 4,
      person1Trait: `${yoni1.animal} (${yoni1.gender === "M" ? "Male" : "Female"})`,
      person2Trait: `${yoni2.animal} (${yoni2.gender === "M" ? "Male" : "Female"})`,
      description: "Measures biological, sexual, and instinctual compatibility through classical animal archetypes.",
      doshaPresent: dosha,
      doshaName: dosha ? "Yoni Virodha (Instinctual Friction)" : undefined,
    };
  }

  // -------------------------------------------------------------
  // 5. GRAHA MAITRI KOOTA (5 Points)
  // -------------------------------------------------------------
  private static evalGrahaMaitri(p1: VedicChartData, p2: VedicChartData): KootaScoreDetail {
    const m1 = p1.planets.find((pl) => pl.name === "Moon");
    const m2 = p2.planets.find((pl) => pl.name === "Moon");
    const r1 = m1?.rasiIndex ?? 0;
    const r2 = m2?.rasiIndex ?? 0;

    const lord1 = SIGN_LORDS[r1] || "Mars";
    const lord2 = SIGN_LORDS[r2] || "Venus";

    let points = 3;
    let cancellation = false;
    let cancelReason = "";

    if (lord1 === lord2) {
      points = 5;
      cancellation = true;
      cancelReason = "Identical Moon lords grant supreme planetary friendship.";
    } else {
      const rel1to2 = PLANET_RELATIONS[lord1]?.[lord2] ?? 0;
      const rel2to1 = PLANET_RELATIONS[lord2]?.[lord1] ?? 0;

      if (rel1to2 === 1 && rel2to1 === 1) points = 5;
      else if ((rel1to2 === 1 && rel2to1 === 0) || (rel1to2 === 0 && rel2to1 === 1)) points = 4;
      else if (rel1to2 === 0 && rel2to1 === 0) points = 3;
      else if ((rel1to2 === 1 && rel2to1 === -1) || (rel1to2 === -1 && rel2to1 === 1)) points = 1;
      else if ((rel1to2 === 0 && rel2to1 === -1) || (rel1to2 === -1 && rel2to1 === 0)) points = 0.5;
      else points = 0;
    }

    return {
      name: "grahaMaitri",
      displayName: "Graha Maitri Koota (Psychological & Mental Friendship)",
      sanskritName: "ग्रह मैत्री कूट",
      pointsEarned: points,
      maxPoints: 5,
      person1Trait: `${lord1} (Lord of ${p1.moonSignRasi || "Moon Rasi"})`,
      person2Trait: `${lord2} (Lord of ${p2.moonSignRasi || "Moon Rasi"})`,
      description: "Assesses intellectual wavelength, worldview synchronization, and genuine friendship.",
      doshaPresent: points <= 1,
      cancellationPresent: cancellation,
      cancellationReason: cancelReason,
    };
  }

  // -------------------------------------------------------------
  // 6. GANA KOOTA (6 Points)
  // -------------------------------------------------------------
  private static evalGana(p1: VedicChartData, p2: VedicChartData): KootaScoreDetail {
    const m1 = p1.planets.find((pl) => pl.name === "Moon");
    const m2 = p2.planets.find((pl) => pl.name === "Moon");
    const n1 = m1?.nakshatraIndex ?? 0;
    const n2 = m2?.nakshatraIndex ?? 0;

    const g1 = NAKSHATRA_GANAS[n1] || "Deva";
    const g2 = NAKSHATRA_GANAS[n2] || "Manushya";

    let points = 0;
    let dosha = false;
    let cancellation = false;
    let cancelReason = "";

    if (g1 === g2) {
      points = 6;
    } else if ((g1 === "Deva" && g2 === "Manushya") || (g1 === "Manushya" && g2 === "Deva")) {
      points = 5;
    } else if ((g1 === "Deva" && g2 === "Rakshasa") || (g1 === "Rakshasa" && g2 === "Deva")) {
      points = 1;
      dosha = true;
    } else {
      // Manushya + Rakshasa
      points = 0;
      dosha = true;
    }

    // Classical Gana Dosha Bhanga (Cancellation)
    const r1 = m1?.rasiIndex ?? 0;
    const r2 = m2?.rasiIndex ?? 0;
    const lord1 = SIGN_LORDS[r1];
    const lord2 = SIGN_LORDS[r2];

    if (dosha && (r1 === r2 || lord1 === lord2 || (PLANET_RELATIONS[lord1]?.[lord2] === 1 && PLANET_RELATIONS[lord2]?.[lord1] === 1))) {
      cancellation = true;
      cancelReason = "Cancelled: Moon lords are identical or intimate friends.";
      points = 4; // Mitigated score
    }

    return {
      name: "gana",
      displayName: "Gana Koota (Temperament & Behavioral Constitution)",
      sanskritName: "गण कूट",
      pointsEarned: points,
      maxPoints: 6,
      person1Trait: `${g1} Gana`,
      person2Trait: `${g2} Gana`,
      description: "Examines spiritual temperament (Deva = Angelic, Manushya = Mortal, Rakshasa = Assertive).",
      doshaPresent: dosha,
      doshaName: dosha ? "Gana Dosha" : undefined,
      cancellationPresent: cancellation,
      cancellationReason: cancelReason,
    };
  }

  // -------------------------------------------------------------
  // 7. BHAKOOT / RASHI KOOTA (7 Points)
  // -------------------------------------------------------------
  private static evalBhakoot(p1: VedicChartData, p2: VedicChartData): KootaScoreDetail {
    const m1 = p1.planets.find((pl) => pl.name === "Moon");
    const m2 = p2.planets.find((pl) => pl.name === "Moon");
    const r1 = m1?.rasiIndex ?? 0;
    const r2 = m2?.rasiIndex ?? 0;

    const diff = Math.abs(r1 - r2);
    const dist1 = ((r2 - r1 + 12) % 12) + 1;
    const dist2 = ((r1 - r2 + 12) % 12) + 1;
    const pair = `${Math.min(dist1, dist2)}/${Math.max(dist1, dist2)}`;

    let points = 7;
    let dosha = false;
    let doshaType = "";
    let cancellation = false;
    let cancelReason = "";

    // Inauspicious combinations:
    // 2/12 (Dwirdwadasa) -> Financial/emotional loss
    // 6/8 (Shadashtaka) -> Strife & medical burdens
    // 9/5 (Navapanchama) -> Can cause delays in children unless cancelled
    if (pair === "2/12") {
      dosha = true;
      doshaType = "Dwirdwadasa Bhakoot Dosha (2/12 Moon distance)";
      points = 0;
    } else if (pair === "6/8") {
      dosha = true;
      doshaType = "Shadashtaka Bhakoot Dosha (6/8 Moon distance)";
      points = 0;
    }

    // Classical Bhakoot Dosha Cancellations:
    // 1. Same planetary lord (Aries & Scorpio = Mars, Taurus & Libra = Venus)
    // 2. Mutual friendly lords (Sun/Jupiter, Moon/Jupiter)
    const lord1 = SIGN_LORDS[r1];
    const lord2 = SIGN_LORDS[r2];
    if (dosha) {
      if (lord1 === lord2) {
        cancellation = true;
        cancelReason = `Nullified: Both signs share the same planetary lord (${lord1}).`;
        points = 7;
      } else if (PLANET_RELATIONS[lord1]?.[lord2] === 1 && PLANET_RELATIONS[lord2]?.[lord1] === 1) {
        cancellation = true;
        cancelReason = `Mitigated: Lords ${lord1} and ${lord2} are intimate natural friends.`;
        points = 7;
      }
    }

    return {
      name: "bhakoot",
      displayName: "Bhakoot Koota (Emotional Fulfilment & Progeny Health)",
      sanskritName: "भकूट कूट",
      pointsEarned: points,
      maxPoints: 7,
      person1Trait: `${p1.moonSignRasi} (${r1 + 1})`,
      person2Trait: `${p2.moonSignRasi} (${r2 + 1})`,
      description: "Evaluates emotional closeness, family welfare, financial peace, and mutual prosperity.",
      doshaPresent: dosha,
      doshaName: dosha ? doshaType : undefined,
      cancellationPresent: cancellation,
      cancellationReason: cancelReason,
    };
  }

  // -------------------------------------------------------------
  // 8. NADI KOOTA (8 Points)
  // -------------------------------------------------------------
  private static evalNadi(p1: VedicChartData, p2: VedicChartData): KootaScoreDetail {
    const m1 = p1.planets.find((pl) => pl.name === "Moon");
    const m2 = p2.planets.find((pl) => pl.name === "Moon");
    const n1 = m1?.nakshatraIndex ?? 0;
    const n2 = m2?.nakshatraIndex ?? 0;
    const pada1 = m1?.pada ?? 1;
    const pada2 = m2?.pada ?? 1;
    const r1 = m1?.rasiIndex ?? 0;
    const r2 = m2?.rasiIndex ?? 0;

    const nadi1 = NAKSHATRA_NADIS[n1] || "Aadi";
    const nadi2 = NAKSHATRA_NADIS[n2] || "Madhya";

    let points = 8;
    let dosha = false;
    let cancellation = false;
    let cancelReason = "";

    if (nadi1 === nadi2) {
      dosha = true;
      points = 0;

      // Classical Nadi Dosha Bhanga rules:
      // 1. Same Nakshatra but different Padas
      if (n1 === n2 && pada1 !== pada2) {
        cancellation = true;
        cancelReason = "Cancelled: Same Nakshatra with distinct Padas (quarters).";
        points = 8;
      }
      // 2. Same Rasi but different Nakshatras
      else if (r1 === r2 && n1 !== n2) {
        cancellation = true;
        cancelReason = "Cancelled: Same Moon Rasi with differing Nakshatras.";
        points = 8;
      }
      // 3. Classical exempt Nakshatras: Rohini, Mrigashira, Ardra, Magha, Hasta, Swati, Anuradha, Jyeshtha
      else if ([3, 4, 5, 9, 12, 14, 16, 17].includes(n1)) {
        cancellation = true;
        cancelReason = "Nullified: Nakshatra belongs to classical exempted list for Nadi Dosha.";
        points = 8;
      }
    }

    const NADI_DOSHA_LABELS: Record<string, string> = {
      Aadi: "Aadi Nadi (Vata / Nervous System)",
      Madhya: "Madhya Nadi (Pitta / Metabolic Fire)",
      Antya: "Antya Nadi (Kapha / Lymphatic & Structural)",
    };

    return {
      name: "nadi",
      displayName: "Nadi Koota (Genetic Synergy & Nervous System Concord)",
      sanskritName: "नाडी कूट",
      pointsEarned: points,
      maxPoints: 8,
      person1Trait: NADI_DOSHA_LABELS[nadi1] ?? nadi1,
      person2Trait: NADI_DOSHA_LABELS[nadi2] ?? nadi2,
      description: "Highest-weighted Koota (8 pts). Governs genetic health, progeny vitality, and longevity.",
      doshaPresent: dosha,
      doshaName: dosha ? `Nadi Dosha (${nadi1} - ${nadi2})` : undefined,
      cancellationPresent: cancellation,
      cancellationReason: cancelReason,
    };
  }

  // -------------------------------------------------------------
  // KUJA (MANGLIK) DOSHA CALCULATION & CANCELLATIONS
  // -------------------------------------------------------------
  private static evalManglik(
    p1: VedicChartData,
    p2: VedicChartData,
    name1: string,
    name2: string
  ): ManglikPairAnalysis {
    const evalSingle = (chart: VedicChartData, personName: string): ManglikPersonStatus => {
      const mars = chart.planets.find((pl) => pl.name === "Mars");
      const moon = chart.planets.find((pl) => pl.name === "Moon");
      const venus = chart.planets.find((pl) => pl.name === "Venus");
      const lagnaRasi = chart.lagna.rasiIndex ?? 0;

      if (!mars) {
        return {
          personName,
          isManglik: false,
          severity: "None",
          marsHouseFromLagna: 1,
          marsHouseFromMoon: 1,
          marsHouseFromVenus: 1,
          affectedHouses: [],
          cancellations: [],
          isCancelled: false,
          finalStatus: "Non-Manglik",
          detail: "Mars position unavailable.",
        };
      }

      const marsRasi = mars.rasiIndex ?? 0;
      const moonRasi = moon?.rasiIndex ?? 0;
      const venusRasi = venus?.rasiIndex ?? 0;

      const houseFromLagna = ((marsRasi - lagnaRasi + 12) % 12) + 1;
      const houseFromMoon = ((marsRasi - moonRasi + 12) % 12) + 1;
      const houseFromVenus = ((marsRasi - venusRasi + 12) % 12) + 1;

      const doshaHouses = [1, 2, 4, 7, 8, 12];
      const lagnaDosha = doshaHouses.includes(houseFromLagna);
      const moonDosha = doshaHouses.includes(houseFromMoon);
      const venusDosha = doshaHouses.includes(houseFromVenus);

      const isManglik = lagnaDosha || moonDosha || venusDosha;
      const affectedHouses: number[] = [];
      if (lagnaDosha) affectedHouses.push(houseFromLagna);

      const cancellations: string[] = [];

      // Classical Kuja Dosha Bhanga Rules:
      // 1. Mars in Aries in 1st house
      if (houseFromLagna === 1 && marsRasi === 0) {
        cancellations.push("Mars in own sign Aries in 1st house cancels Kuja Dosha.");
      }
      // 2. Mars in Scorpio in 4th house
      if (houseFromLagna === 4 && marsRasi === 7) {
        cancellations.push("Mars in own sign Scorpio in 4th house cancels Kuja Dosha.");
      }
      // 3. Mars in Capricorn (exalted) in 7th or any house
      if (marsRasi === 9) {
        cancellations.push("Exalted Mars in Capricorn fully mitigates Kuja Dosha.");
      }
      // 4. Mars in Sagittarius or Pisces (Jupiter signs) in 8th house
      if (houseFromLagna === 8 && (marsRasi === 8 || marsRasi === 11)) {
        cancellations.push("Mars in Jupiterian sign in 8th house cancels Dosha.");
      }
      // 5. Mars in Leo or Aquarius in 12th house
      if (houseFromLagna === 12 && (marsRasi === 4 || marsRasi === 10)) {
        cancellations.push("Mars in Leo/Aquarius in 12th house neutralizes Dosha.");
      }
      // 6. Jupiter conjunction or aspect
      const jupiter = chart.planets.find((pl) => pl.name === "Jupiter");
      if (jupiter && jupiter.rasiIndex === marsRasi) {
        cancellations.push("Conjunction of beneficent Jupiter with Mars cancels Kuja Dosha.");
      }

      let severity: ManglikPersonStatus["severity"] = "None";
      if (isManglik) {
        severity = lagnaDosha && (moonDosha || venusDosha) ? "Poorna (Full)" : "Anshik (Partial)";
      }

      const isCancelled = cancellations.length > 0;
      let finalStatus: ManglikPersonStatus["finalStatus"] = "Non-Manglik";
      if (isManglik) {
        finalStatus = isCancelled ? "Manglik (Cancelled)" : "Manglik (Active)";
      }

      return {
        personName,
        isManglik,
        severity,
        marsHouseFromLagna: houseFromLagna,
        marsHouseFromMoon: houseFromMoon,
        marsHouseFromVenus: houseFromVenus,
        affectedHouses,
        cancellations,
        isCancelled,
        finalStatus,
        detail: isManglik
          ? `Mars resides in House ${houseFromLagna} from Lagna, House ${houseFromMoon} from Moon, House ${houseFromVenus} from Venus.`
          : "Mars resides outside classical Kuja houses (3, 5, 6, 9, 10, 11).",
      };
    };

    const p1Status = evalSingle(p1, name1);
    const p2Status = evalSingle(p2, name2);

    // Mutual Cancellation: When both partners are Manglik, the doshas naturally balance
    const mutualCancellation = p1Status.isManglik && p2Status.isManglik;

    let summary = "";
    const recs: string[] = [];

    if (!p1Status.isManglik && !p2Status.isManglik) {
      summary = "Both charts are clear of Kuja (Manglik) Dosha. Auspicious baseline for marital ease.";
    } else if (mutualCancellation) {
      summary = "Both partners share Kuja Dosha, resulting in classical Mutual Cancellation (Manglik Bhanga). Passion and assertiveness balance equally.";
      recs.push("Channel joint energy into collaborative creative or athletic pursuits.");
    } else if (p1Status.isCancelled || p2Status.isCancelled) {
      summary = "Kuja Dosha is present but tempered by classical planetary cancellations (Kuja Bhanga).";
      recs.push("Auspicious planetary alignment shields marital peace.");
    } else {
      summary = "Unilateral Kuja Dosha detected. Classical remedies (Kumbha Vivaha, Angaraka Homa) ensure smooth marital harmony.";
      recs.push("Recite the Mangal Gayatri mantra on Tuesdays.");
      recs.push("Foster mindful communication during high-energy Mars transits.");
    }

    return {
      person1: p1Status,
      person2: p2Status,
      mutualCancellation,
      compatibilitySummary: summary,
      recommendations: recs,
    };
  }

  // -------------------------------------------------------------
  // NAVAMSA D9 RELATIONSHIP SYNERGY
  // -------------------------------------------------------------
  private static evalNavamsaSynergy(p1: VedicChartData, p2: VedicChartData): NavamsaSynergy {
    const m1 = p1.planets.find((pl) => pl.name === "Moon");
    const m2 = p2.planets.find((pl) => pl.name === "Moon");
    const v1 = p1.planets.find((pl) => pl.name === "Venus");
    const v2 = p2.planets.find((pl) => pl.name === "Venus");

    const p1D9Moon = m1?.navamsaRasiName ?? "Cancer";
    const p2D9Moon = m2?.navamsaRasiName ?? "Taurus";
    const p1D9Venus = v1?.navamsaRasiName ?? "Pisces";
    const p2D9Venus = v2?.navamsaRasiName ?? "Libra";

    // 7th house lord in Navamsa
    const p1LagnaD9 = p1.lagna.navamsaRasiIndex ?? 0;
    const p2LagnaD9 = p2.lagna.navamsaRasiIndex ?? 0;
    const p1SeventhLord = SIGN_LORDS[(p1LagnaD9 + 6) % 12];
    const p2SeventhLord = SIGN_LORDS[(p2LagnaD9 + 6) % 12];

    const highlights: string[] = [];
    let synergyScore = 75; // baseline

    if (p1D9Moon === p2D9Moon) {
      synergyScore += 15;
      highlights.push("Identical D9 Navamsa Moon sign reflects profound soul-level emotional understanding.");
    }

    if (p1D9Venus === p2D9Venus) {
      synergyScore += 10;
      highlights.push("Shared D9 Venus sign indicates identical aesthetic and devotional values.");
    }

    if (p1SeventhLord === p2SeventhLord) {
      synergyScore += 10;
      highlights.push("Harmonious 7th house lordship in Navamsa suggests shared karmic relationship objectives.");
    }

    synergyScore = Math.min(100, Math.max(45, synergyScore));

    let soulConnectionLevel: NavamsaSynergy["soulConnectionLevel"] = "Balanced Growth";
    if (synergyScore >= 88) soulConnectionLevel = "Karmic / Soulmate";
    else if (synergyScore >= 75) soulConnectionLevel = "Deeply Harmonious";
    else if (synergyScore >= 60) soulConnectionLevel = "Balanced Growth";
    else soulConnectionLevel = "Frictional Dynamics";

    return {
      p1NavamsaMoonSign: p1D9Moon,
      p2NavamsaMoonSign: p2D9Moon,
      p1NavamsaVenusSign: p1D9Venus,
      p2NavamsaVenusSign: p2D9Venus,
      p1Navamsa7thLord: p1SeventhLord,
      p2Navamsa7thLord: p2SeventhLord,
      synergyScore,
      soulConnectionLevel,
      summary: `Navamsa D9 analysis reveals a ${soulConnectionLevel.toLowerCase()} bond, uniting ${p1D9Moon} and ${p2D9Moon} soul-moon archetypes.`,
      synergyHighlights: highlights.length > 0 ? highlights : [
        "Complementary karmic roles in Navamsa encourage mutual spiritual evolution.",
      ],
    };
  }

  // -------------------------------------------------------------
  // SHANTI REMEDIES PRESCRIPTION
  // -------------------------------------------------------------
  private static generateRemedies(
    activeDoshas: string[],
    manglik: ManglikPairAnalysis
  ): ShantiRemedy[] {
    const remedies: ShantiRemedy[] = [];

    if (activeDoshas.some((d) => d.includes("Nadi"))) {
      remedies.push({
        dosha: "Nadi Dosha Shanti",
        severity: "High",
        deityPuja: "Maha Mrityunjaya Puja & Golden Cow (Godan) Charity",
        mantra: "Om Tryambakam Yajamahe Sugandhim Pushtivardhanam",
        gemstoneOrCharity: "Donate sesame seeds, grains, or support children's health causes.",
        lifestyleAdvice: "Prioritize joint wellness checkups and incorporate gentle daily pranayama together.",
      });
    }

    if (activeDoshas.some((d) => d.includes("Bhakoot"))) {
      remedies.push({
        dosha: "Bhakoot Dosha Shanti",
        severity: "Moderate",
        deityPuja: "Lord Shiva & Parvati (Uma-Maheshwara) Vivaha Puja",
        mantra: "Om Namah Shivaya / Om Shri Durgaye Namah",
        gemstoneOrCharity: "Donate white rice, silver coin, or milk on Mondays.",
        lifestyleAdvice: "Maintain transparency around household finances and share domestic responsibilities equally.",
      });
    }

    if (
      !manglik.mutualCancellation &&
      (manglik.person1.finalStatus === "Manglik (Active)" || manglik.person2.finalStatus === "Manglik (Active)")
    ) {
      remedies.push({
        dosha: "Kuja (Manglik) Shanti",
        severity: "Moderate",
        deityPuja: "Lord Kartikeya / Hanuman Puja on Tuesdays",
        mantra: "Om Kram Kreem Kroum Sah Bhaumaya Namah",
        gemstoneOrCharity: "Donate red lentils (masoor dal) and copper utensils to charitable workers.",
        lifestyleAdvice: "Practice intentional pause before responding in moments of dispute; channel physical energy into yoga or athletics.",
      });
    }

    // Default auspicious booster
    if (remedies.length === 0) {
      remedies.push({
        dosha: "General Vivaha Soukhya (Auspicious Vitality)",
        severity: "Mild",
        deityPuja: "Sri Lakshmi Narayana Aradhana",
        mantra: "Om Namo Bhagavate Vasudevaya",
        gemstoneOrCharity: "Plant a Tulsi or sacred tree in the home garden together.",
        lifestyleAdvice: "Celebrate anniversaries with gratitude and acts of kindness to nurture celestial goodwill.",
      });
    }

    return remedies;
  }
}
