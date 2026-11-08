/**
 * Complete Multi-System Classical Vedic Dasha Engine
 * 1. Vimshottari Level 5: Prana (59,049 combinations, ~1-3 days precision)
 * 2. Yogini Dasha: 36-Year Classical Cycle (8 Yoginis & Sub-Periods)
 * 3. Chara Dasha: Jaimini Sign-Based Dasha (12 Signs, 9th House Principle)
 * 4. Kalachakra Dasha: 108 Pada Deity & Directional Cycle
 * 5. Ashtottari Dasha: 108-Year Planetary Cycle (8 Planets)
 * 6. Unified Multi-Dasha Orchestrator & Cross-System Convergence Matrix
 */

import {
  DashaLevelItem,
  System5LevelHierarchy,
  All5LevelDashasResult,
  VedicDashaSystemId,
  generateChildrenForNode,
  Vimshottari5LevelEngine,
  Yogini5LevelEngine,
  Chara5LevelEngine,
  Ashtottari5LevelEngine,
  Kalachakra5LevelEngine,
  Shodashottari5LevelEngine,
  Dwisaptati5LevelEngine,
  Shastihayani5LevelEngine,
  Sthira5LevelEngine,
  Mandooka5LevelEngine,
} from "./fiveLevelDashaEngines";

export type { DashaLevelItem, System5LevelHierarchy, All5LevelDashasResult, VedicDashaSystemId };
export {
  generateChildrenForNode,
  Vimshottari5LevelEngine,
  Yogini5LevelEngine,
  Chara5LevelEngine,
  Ashtottari5LevelEngine,
  Kalachakra5LevelEngine,
  Shodashottari5LevelEngine,
  Dwisaptati5LevelEngine,
  Shastihayani5LevelEngine,
  Sthira5LevelEngine,
  Mandooka5LevelEngine,
};

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface PranaPeriod {
  lord: string;
  fullName: string; // e.g., "Rahu-Rahu-Rahu-Rahu-Rahu"
  startDate: Date;
  endDate: Date;
  startDateFormatted: string;
  endDateFormatted: string;
  durationYears: number;
  durationDays: number;
  durationHours: number;
  durationFormatted: string; // e.g., "3d 7h"
  isCurrent: boolean;
  interpretation: PranaInterpretation;
}

export interface PranaInterpretation {
  brief: string;
  energyQuality: "positive" | "neutral" | "challenging";
  hourlyInfluence: string;
  bestHours: string;
  actionAdvice: string;
}

export interface YoginiSubPeriod {
  yogini: string;
  lord: string;
  startDate: Date;
  endDate: Date;
  startDateFormatted: string;
  endDateFormatted: string;
  durationMonths: number;
  durationFormatted: string;
  isCurrent: boolean;
  interpretation: string;
}

export interface YoginiDashaPeriod {
  yogini: string;
  lord: string;
  startDate: Date;
  endDate: Date;
  startDateFormatted: string;
  endDateFormatted: string;
  durationYears: number;
  isCurrent: boolean;
  subPeriods: YoginiSubPeriod[];
  interpretation: YoginiInterpretation;
}

export interface YoginiInterpretation {
  title: string;
  nature: "benefic" | "malefic";
  themes: string[];
  positive: string;
  negative: string;
  bestActivities: string[];
}

export interface CharaDashaPeriod {
  sign: string;
  years: number;
  startDate: Date;
  endDate: Date;
  startDateFormatted: string;
  endDateFormatted: string;
  direction: "direct" | "reverse";
  lord: string; // Sign lord
  isCurrent: boolean;
  interpretation: CharaInterpretation;
}

export interface CharaInterpretation {
  title: string;
  karakaTheme: string;
  description: string;
  favorableFor: string[];
  unfavorableFor: string[];
}

export interface KalachakraDashaPeriod {
  deity: string;
  direction: string;
  sign: string;
  type: "Savya" | "Apasavya" | "Center";
  years: number;
  startDate: Date;
  endDate: Date;
  startDateFormatted: string;
  endDateFormatted: string;
  isCurrent: boolean;
  interpretation: KalachakraInterpretation;
}

export interface KalachakraInterpretation {
  title: string;
  themes: string[];
  description: string;
  favorable: string;
  unfavorable: string;
}

export interface AshtottariDashaPeriod {
  planet: string;
  years: number;
  startDate: Date;
  endDate: Date;
  startDateFormatted: string;
  endDateFormatted: string;
  isCurrent: boolean;
  interpretation: AshtottariInterpretation;
}

export interface AshtottariInterpretation {
  title: string;
  planetQuality: string;
  favorableAreas: string[];
  challengingAreas: string[];
  advice: string;
}

export interface ActiveDashaSummary {
  system: VedicDashaSystemId;
  activePeriodName: string;
  lordOrSign: string;
  durationRemaining: string;
  tone: "positive" | "neutral" | "challenging";
  coreTheme: string;
}

export interface AllDashaSystems {
  vimshottariPranas: PranaPeriod[];
  currentPrana: PranaPeriod | null;
  yogini: YoginiDashaPeriod[];
  currentYogini: YoginiDashaPeriod | null;
  currentYoginiSub: YoginiSubPeriod | null;
  chara: CharaDashaPeriod[];
  currentChara: CharaDashaPeriod | null;
  kalachakra: KalachakraDashaPeriod[];
  currentKalachakra: KalachakraDashaPeriod | null;
  ashtottari: AshtottariDashaPeriod[];
  currentAshtottari: AshtottariDashaPeriod | null;
  convergence: ActiveDashaSummary[];
  fiveLevels: All5LevelDashasResult;
}

// ============================================================
// PART 1: LEVEL 5 - PRANA CALCULATOR (VIMSHOTTARI)
// ============================================================

export class PranaCalculator {
  public static readonly DASHA_YEARS: Record<string, number> = {
    Ketu: 7,
    Venus: 20,
    Sun: 6,
    Moon: 10,
    Mars: 7,
    Rahu: 18,
    Jupiter: 16,
    Saturn: 19,
    Mercury: 17,
  };

  public static readonly SEQUENCE: string[] = [
    "Ketu",
    "Venus",
    "Sun",
    "Moon",
    "Mars",
    "Rahu",
    "Jupiter",
    "Saturn",
    "Mercury",
  ];

  public static readonly DAYS_PER_YEAR = 360; // Vedic Savana Calendar

  /**
   * Sequence starting from any specified planet
   */
  public getSequenceFrom(startPlanet: string): string[] {
    const startIndex = PranaCalculator.SEQUENCE.indexOf(startPlanet);
    if (startIndex === -1) return [...PranaCalculator.SEQUENCE];
    const result: string[] = [];
    for (let i = 0; i < 9; i++) {
      result.push(PranaCalculator.SEQUENCE[(startIndex + i) % 9]);
    }
    return result;
  }

  /**
   * Generate ALL 9 Pranas for a given Sookshma
   * Formula: Prana Years = (Sookshma Years * Prana Planet Years) / 120
   * Total duration matches parent Sookshma exactly.
   */
  public generatePranas(
    mahadashaLord: string,
    antardashaLord: string,
    pratyantardashaLord: string,
    sookshmaLord: string,
    sookshmaStartDate: Date,
    sookshmaYears: number,
    referenceDate: Date = new Date()
  ): PranaPeriod[] {
    const pranas: PranaPeriod[] = [];
    let currentMs = sookshmaStartDate.getTime();
    const sequence = this.getSequenceFrom(sookshmaLord);

    for (let i = 0; i < 9; i++) {
      const pranaLord = sequence[i];

      // Exact Level 5 Parashari calculation
      const pranaYears = (sookshmaYears * PranaCalculator.DASHA_YEARS[pranaLord]) / 120;
      const pranaDays = pranaYears * PranaCalculator.DAYS_PER_YEAR;
      const durationMs = pranaDays * 24 * 3600 * 1000;

      const startDate = new Date(currentMs);
      const endDate = new Date(currentMs + durationMs);

      const daysPart = Math.floor(pranaDays);
      const hoursPart = Math.round((pranaDays - daysPart) * 24);

      const isCurrent =
        referenceDate.getTime() >= startDate.getTime() &&
        referenceDate.getTime() < endDate.getTime();

      const prana: PranaPeriod = {
        lord: pranaLord,
        fullName: `${mahadashaLord}-${antardashaLord}-${pratyantardashaLord}-${sookshmaLord}-${pranaLord}`,
        startDate,
        endDate,
        startDateFormatted: this.formatDate(startDate),
        endDateFormatted: this.formatDate(endDate),
        durationYears: Math.round(pranaYears * 1000000) / 1000000,
        durationDays: Math.round(pranaDays * 100) / 100,
        durationHours: hoursPart,
        durationFormatted: this.formatPranaDuration(daysPart, hoursPart),
        isCurrent,
        interpretation: this.getPranaInterpretation(pranaLord, sookshmaLord),
      };

      pranas.push(prana);
      currentMs += durationMs;
    }

    return pranas;
  }

  public getPranaInterpretation(lord: string, sookshmaLord: string): PranaInterpretation {
    const interpretations: Record<string, PranaInterpretation> = {
      Ketu: {
        brief: "Spiritual detachment, subtle psychic insight, releasing emotional clutter.",
        energyQuality: "neutral",
        hourlyInfluence: "Supreme clarity for silent contemplation, meditation, and research.",
        bestHours: "Dawn hours (4:00 AM – 6:30 AM)",
        actionAdvice: "Refrain from signing major commercial contracts; prioritize inner reflection.",
      },
      Venus: {
        brief: "Harmonious grace, artistic inspiration, romantic tenderness, and social refinement.",
        energyQuality: "positive",
        hourlyInfluence: "High charm and diplomatic appeal; interpersonal alignment flows effortlessly.",
        bestHours: "Evening twilight (5:30 PM – 8:00 PM)",
        actionAdvice: "Present creative designs, schedule romantic dates, and resolve social disputes.",
      },
      Sun: {
        brief: "Executive vitality, sovereign authority, leadership presentation, and core focus.",
        energyQuality: "positive",
        hourlyInfluence: "Peak solar empowerment, heightened confidence, clear decisions.",
        bestHours: "Midday Solar zenith (11:00 AM – 1:30 PM)",
        actionAdvice: "Confront critical leadership choices, meet with executives, pitch bold ideas.",
      },
      Moon: {
        brief: "Emotional receptivity, intuitive perception, nurturing connection, and creative flow.",
        energyQuality: "neutral",
        hourlyInfluence: "Fluid emotional sensitivity, public empathy, domestic bonding.",
        bestHours: "Late evening (8:30 PM – 11:00 PM)",
        actionAdvice: "Engage in creative writing, care for domestic sanctuaries, practice calm breathing.",
      },
      Mars: {
        brief: "Decisive physical energy, tactical initiative, courage, and technical execution.",
        energyQuality: "challenging",
        hourlyInfluence: "High physical momentum and sharp focus; guard against short-tempered reactions.",
        bestHours: "Early morning (6:30 AM – 8:30 AM)",
        actionAdvice: "Tackle demanding physical or technical tasks; avoid confrontational debates.",
      },
      Rahu: {
        brief: "Unconventional breakthrough thinking, digital innovation, and foreign connection.",
        energyQuality: "neutral",
        hourlyInfluence: "Restless creative genius; sudden unconventional ideas materialize.",
        bestHours: "Afternoon window (2:00 PM – 4:30 PM)",
        actionAdvice: "Focus on software coding, marketing experiments, and strategic networking.",
      },
      Jupiter: {
        brief: "Benevolent expansion, philosophical wisdom, generous mentorship, and optimism.",
        energyQuality: "positive",
        hourlyInfluence: "Highest spiritual and commercial favor; wisdom elevates all discussions.",
        bestHours: "Morning study window (8:30 AM – 11:00 AM)",
        actionAdvice: "Enroll in higher learning, seek teacher guidance, launch noble business proposals.",
      },
      Saturn: {
        brief: "Disciplined stoicism, meticulous organization, perseverance, and structural duty.",
        energyQuality: "challenging",
        hourlyInfluence: "Sober focus on difficult, tedious obligations; building enduring foundations.",
        bestHours: "Late afternoon (4:00 PM – 6:00 PM)",
        actionAdvice: "Audit accounts, organize standard procedures, and embrace patient labor.",
      },
      Mercury: {
        brief: "Analytical dexterity, commercial acumen, rapid communications, and wit.",
        energyQuality: "positive",
        hourlyInfluence: "Mental agility, rapid problem-solving, crisp writing and speech.",
        bestHours: "Mid-morning business window (9:30 AM – 12:00 PM)",
        actionAdvice: "Schedule negotiation meetings, draft agreements, publish articles.",
      },
    };

    return (
      interpretations[lord] || {
        brief: `Active planetary catalyst of ${lord} within the ${sookshmaLord} sub-cycle.`,
        energyQuality: "neutral",
        hourlyInfluence: "Balanced daily planetary current.",
        bestHours: "Daylight hours",
        actionAdvice: "Maintain centered awareness and deliberate action.",
      }
    );
  }

  private formatDate(date: Date): string {
    const y = date.getUTCFullYear();
    const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const d = date.getUTCDate().toString().padStart(2, "0");
    const h = date.getUTCHours().toString().padStart(2, "0");
    return `${y}-${m}-${d} ${h}:00`;
  }

  private formatPranaDuration(days: number, hours: number): string {
    if (days >= 1) {
      return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
    }
    return `${hours}h`;
  }
}

// ============================================================
// PART 2: YOGINI DASHA (36-YEAR NORTH INDIAN CYCLE)
// ============================================================

export class YoginiDashaCalculator {
  public static readonly YOGINIS: {
    name: string;
    lord: string;
    years: number;
    nature: "benefic" | "malefic";
  }[] = [
    { name: "Mangala", lord: "Moon", years: 1, nature: "benefic" },
    { name: "Pingala", lord: "Sun", years: 2, nature: "malefic" },
    { name: "Dhanya", lord: "Jupiter", years: 3, nature: "benefic" },
    { name: "Bhramari", lord: "Mars", years: 4, nature: "malefic" },
    { name: "Bhadrika", lord: "Mercury", years: 5, nature: "benefic" },
    { name: "Ulka", lord: "Saturn", years: 6, nature: "malefic" },
    { name: "Siddha", lord: "Venus", years: 7, nature: "benefic" },
    { name: "Sankata", lord: "Rahu", years: 8, nature: "malefic" },
  ];

  public static readonly TOTAL_CYCLE_YEARS = 36;

  /**
   * Starting Yogini Determination:
   * Formula: (Moon's 1-indexed Nakshatra Number + 3) / 8, take remainder
   */
  public determineStartingYoginiIndex(nakshatra1Indexed: number): number {
    const remainder = (nakshatra1Indexed + 3) % 8;
    // Remainder 1 = Mangala (idx 0), 2 = Pingala (idx 1) ... 0 = Sankata (idx 7)
    return remainder === 0 ? 7 : remainder - 1;
  }

  /**
   * Calculate full Yogini Dasha lifecycle covering up to 3 cycles (108 years)
   */
  public calculateYoginiDasha(
    moonNakshatra1Indexed: number,
    moonDegreeInNakshatra: number, // 0 to 13.3333 degrees
    birthDate: Date,
    referenceDate: Date = new Date()
  ): YoginiDashaPeriod[] {
    const startingIndex = this.determineStartingYoginiIndex(moonNakshatra1Indexed);
    const startYogini = YoginiDashaCalculator.YOGINIS[startingIndex];

    // Calculate birth balance: fraction of 13°20' (13.3333°) remaining
    const totalSpan = 13.333333333333;
    const elapsedFraction = Math.max(0, Math.min(1, moonDegreeInNakshatra / totalSpan));
    const balanceFraction = 1 - elapsedFraction;
    const firstPeriodYears = Math.round(startYogini.years * balanceFraction * 1000) / 1000;

    const periods: YoginiDashaPeriod[] = [];
    let currentMs = birthDate.getTime();
    let currentIndex = startingIndex;

    // Generate up to 24 periods (3 full 36-year rounds = 108 years)
    for (let round = 0; round < 24; round++) {
      const yogini = YoginiDashaCalculator.YOGINIS[currentIndex];
      const years = round === 0 ? firstPeriodYears : yogini.years;
      const durationMs = years * 360 * 24 * 3600 * 1000;

      const startDate = new Date(currentMs);
      const endDate = new Date(currentMs + durationMs);

      const isCurrent =
        referenceDate.getTime() >= startDate.getTime() &&
        referenceDate.getTime() < endDate.getTime();

      const subPeriods = this.generateYoginiSubPeriods(
        yogini,
        startDate,
        years,
        referenceDate
      );

      periods.push({
        yogini: yogini.name,
        lord: yogini.lord,
        startDate,
        endDate,
        startDateFormatted: this.formatDate(startDate),
        endDateFormatted: this.formatDate(endDate),
        durationYears: years,
        isCurrent,
        subPeriods,
        interpretation: this.getYoginiInterpretation(yogini.name),
      });

      currentMs += durationMs;
      currentIndex = (currentIndex + 1) % 8;

      // Stop after 100 years
      if (round >= 8 && endDate.getUTCFullYear() - birthDate.getUTCFullYear() > 100) {
        break;
      }
    }

    return periods;
  }

  /**
   * Generate 8 sub-periods for a Yogini
   * Formula: SubYears = (TotalYears * SubYogini.years) / 36
   */
  public generateYoginiSubPeriods(
    parentYogini: (typeof YoginiDashaCalculator.YOGINIS)[0],
    startDate: Date,
    totalYears: number,
    referenceDate: Date = new Date()
  ): YoginiSubPeriod[] {
    const subPeriods: YoginiSubPeriod[] = [];
    let currentMs = startDate.getTime();
    const parentIdx = YoginiDashaCalculator.YOGINIS.findIndex((y) => y.name === parentYogini.name);

    for (let i = 0; i < 8; i++) {
      const subIdx = (parentIdx + i) % 8;
      const subYogini = YoginiDashaCalculator.YOGINIS[subIdx];
      const subYears = (totalYears * subYogini.years) / 36;
      const durationMs = subYears * 360 * 24 * 3600 * 1000;

      const sDate = new Date(currentMs);
      const eDate = new Date(currentMs + durationMs);
      const durationMonths = Math.round(subYears * 12 * 10) / 10;

      const isCurrent =
        referenceDate.getTime() >= sDate.getTime() && referenceDate.getTime() < eDate.getTime();

      subPeriods.push({
        yogini: subYogini.name,
        lord: subYogini.lord,
        startDate: sDate,
        endDate: eDate,
        startDateFormatted: this.formatDate(sDate),
        endDateFormatted: this.formatDate(eDate),
        durationMonths,
        durationFormatted: `${durationMonths} mos`,
        isCurrent,
        interpretation: `${parentYogini.name} major cycle with ${subYogini.name} sub-catalyst (${subYogini.lord}).`,
      });

      currentMs += durationMs;
    }

    return subPeriods;
  }

  public getYoginiInterpretation(name: string): YoginiInterpretation {
    const INTERPRETATIONS: Record<string, YoginiInterpretation> = {
      Mangala: {
        title: "Mangala - Auspicious Grace & Serenity (Chandra)",
        nature: "benefic",
        themes: ["Auspicious ceremonies", "Emotional peace", "Domestic harmony", "Maternal blessings"],
        positive: "Excellent for initiating ventures, spiritual pilgrimages, and emotional healing.",
        negative: "Mild emotional moodiness if the Moon is afflicted.",
        bestActivities: ["Family gatherings", "Artistic endeavors", "Charitable donations", "Spiritual devotion"],
      },
      Pingala: {
        title: "Pingala - Solar Authority & Recognition (Surya)",
        nature: "malefic",
        themes: ["Career recognition", "Leadership responsibility", "Institutional honors", "Father's influence"],
        positive: "Promotion, authority elevation, increased vitality, and public respect.",
        negative: "Ego friction with superiors, blood pressure or eye strain from stress.",
        bestActivities: ["Assuming leadership", "Resolving state/tax paperwork", "Vitality conditioning"],
      },
      Dhanya: {
        title: "Dhanya - Wealth, Grain & Spiritual Wisdom (Guru)",
        nature: "benefic",
        themes: ["Opulent prosperity", "Scholarly achievements", "Honorable mentors", "Family celebration"],
        positive: "Financial expansion, arrival of children or good news, virtuous deeds.",
        negative: "Weight gain or complacency from excessive good fortune.",
        bestActivities: ["Higher educational investments", "Mentoring others", "Real estate investments"],
      },
      Bhramari: {
        title: "Bhramari - Dynamic Courage & Travel (Mangala)",
        nature: "malefic",
        themes: ["Restlessness", "Frequent travel", "Physical valor", "Competitive triumphs"],
        positive: "Swift victory in contested situations, physical courage, breakthrough energy.",
        negative: "Haste, sudden disputes, fatigue from relentless displacement.",
        bestActivities: ["Competitive sports", "Technical challenges", "Engineering", "Decisive actions"],
      },
      Bhadrika: {
        title: "Bhadrika - Commercial Acumen & Intellect (Budha)",
        nature: "benefic",
        themes: ["Commercial prosperity", "Scholarly publications", "Diplomatic charm", "Agile networks"],
        positive: "Rapid intellectual success, lucrative trading contracts, joyous social camaraderie.",
        negative: "Scattered energy or nervous anxiety from overthinking.",
        bestActivities: ["Commercial trading", "Writing treatises", "Software development", "Public speaking"],
      },
      Ulka: {
        title: "Ulka - Stoic Endurance & Karmic Realism (Shani)",
        nature: "malefic",
        themes: ["Heavy responsibility", "Delayed gratification", "Karmic testing", "Character building"],
        positive: "Building unshakeable foundations, learning self-discipline, clearing long-standing debts.",
        negative: "Isolation, career roadblocks, bone or joint stiffness.",
        bestActivities: ["Long-term infrastructure", "Disciplined savings", "Serving the underprivileged"],
      },
      Siddha: {
        title: "Siddha - Masterful Accomplishment & Luxury (Shukra)",
        nature: "benefic",
        themes: ["Culmination of desires", "Aesthetic luxury", "Love & marriage", "Social eminence"],
        positive: "Fulfillment of key aspirations, financial affluence, exquisite romances.",
        negative: "Sensory overindulgence, financial extravagance.",
        bestActivities: ["Weddings and romance", "High cultural patronage", "Purchasing vehicles or art"],
      },
      Sankata: {
        title: "Sankata - Profound Transformation & Occult Insight (Rahu)",
        nature: "malefic",
        themes: ["Karmic turning points", "Deep transformation", "Foreign ventures", "Occult wisdom"],
        positive: "Unconventional breakthroughs, shedding obsolete attachments, intense awakening.",
        negative: "Sudden upheavals, illusions, legal or health turbulence if unprepared.",
        bestActivities: ["Occult research", "Deep psychological therapy", "Surrendering toxic attachments"],
      },
    };

    return (
      INTERPRETATIONS[name] || {
        title: `${name} Period`,
        nature: "benefic",
        themes: ["General Yogini cycle"],
        positive: "Favorable progress in alignment with personal dharma.",
        negative: "General life challenges.",
        bestActivities: ["Mindful action and meditation."],
      }
    );
  }

  private formatDate(date: Date): string {
    const y = date.getUTCFullYear();
    const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const d = date.getUTCDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
}

// ============================================================
// PART 3: CHARA DASHA (JAIMINI SIGN-BASED SYSTEM)
// ============================================================

export class CharaDashaCalculator {
  public static readonly SIGNS = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ];

  public static readonly SIGN_LORDS: Record<string, string> = {
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
  };

  /**
   * Calculate complete Chara Dasha cycle based on Jaimini Upadesha Sutras
   */
  public calculateCharaDasha(
    ascendantSign: string,
    planetsInSigns: Record<string, string>, // { "Aries": "Mars", "Taurus": "Sun" }
    birthDate: Date,
    referenceDate: Date = new Date()
  ): CharaDashaPeriod[] {
    const periods: CharaDashaPeriod[] = [];
    const startIndex = CharaDashaCalculator.SIGNS.indexOf(ascendantSign);
    const validStartIndex = startIndex === -1 ? 0 : startIndex;

    // Odd sign = direct zodiacal progression; Even sign = reverse progression
    const isOddSign = validStartIndex % 2 === 0; // Aries = idx 0 (odd sign 1)
    const direction: "direct" | "reverse" = isOddSign ? "direct" : "reverse";

    let currentIndex = validStartIndex;
    let currentMs = birthDate.getTime();

    // 12 sign periods
    for (let i = 0; i < 12; i++) {
      const sign = CharaDashaCalculator.SIGNS[currentIndex];
      const years = this.calculateSignYears(sign, planetsInSigns, direction);
      const durationMs = years * 360 * 24 * 3600 * 1000;

      const startDate = new Date(currentMs);
      const endDate = new Date(currentMs + durationMs);

      const isCurrent =
        referenceDate.getTime() >= startDate.getTime() &&
        referenceDate.getTime() < endDate.getTime();

      periods.push({
        sign,
        years,
        startDate,
        endDate,
        startDateFormatted: this.formatDate(startDate),
        endDateFormatted: this.formatDate(endDate),
        direction,
        lord: CharaDashaCalculator.SIGN_LORDS[sign],
        isCurrent,
        interpretation: this.getCharaInterpretation(sign, years),
      });

      if (direction === "direct") {
        currentIndex = (currentIndex + 1) % 12;
      } else {
        currentIndex = (currentIndex - 1 + 12) % 12;
      }

      currentMs += durationMs;
    }

    return periods;
  }

  /**
   * Determine sign duration based on 9th house principle:
   * Count signs from current sign to the 9th house sign or its lord.
   */
  private calculateSignYears(
    sign: string,
    planetsInSigns: Record<string, string>,
    direction: "direct" | "reverse"
  ): number {
    const signIndex = CharaDashaCalculator.SIGNS.indexOf(sign);

    let ninthIndex: number;
    if (direction === "direct") {
      ninthIndex = (signIndex + 8) % 12;
    } else {
      ninthIndex = (signIndex - 8 + 12) % 12;
    }

    const ninthSign = CharaDashaCalculator.SIGNS[ninthIndex];
    const ninthLord = CharaDashaCalculator.SIGN_LORDS[ninthSign];

    // If 9th sign contains planets, count to 9th sign
    if (planetsInSigns[ninthSign]) {
      return this.countSignsBetween(signIndex, ninthIndex, direction);
    }

    // Otherwise count to where 9th lord is located
    const lordSign = Object.keys(planetsInSigns).find((s) => planetsInSigns[s] === ninthLord);
    if (lordSign) {
      const lordIndex = CharaDashaCalculator.SIGNS.indexOf(lordSign);
      return this.countSignsBetween(signIndex, lordIndex, direction);
    }

    return this.countSignsBetween(signIndex, ninthIndex, direction);
  }

  private countSignsBetween(
    fromIndex: number,
    toIndex: number,
    direction: "direct" | "reverse"
  ): number {
    let count = 1;
    let curr = fromIndex;

    while (curr !== toIndex) {
      if (direction === "direct") {
        curr = (curr + 1) % 12;
      } else {
        curr = (curr - 1 + 12) % 12;
      }
      count++;
      if (count > 9) break; // Standard Jaimini upper bound
    }

    return Math.max(1, Math.min(count, 9));
  }

  private getCharaInterpretation(sign: string, years: number): CharaInterpretation {
    const MAP: Record<string, CharaInterpretation> = {
      Aries: {
        title: "Mesha (Aries) Chara Dasha",
        karakaTheme: "Initiative, pioneering leadership, physical transformation",
        description: `A ${years}-year period of dynamic activity and pioneering enterprise. Great focus on personal independence, physical energy, and overcoming obstacles.`,
        favorableFor: ["Launching autonomous projects", "Physical fitness", "Competitive ventures"],
        unfavorableFor: ["Passive compromise", "Impatience with collaborators"],
      },
      Taurus: {
        title: "Vrishabha (Taurus) Chara Dasha",
        karakaTheme: "Material assets, family lineage, artistic stability",
        description: `A ${years}-year period of consolidating wealth, strengthening family foundations, and enjoying sensory refinement and stable assets.`,
        favorableFor: ["Real estate acquisition", "Financial investments", "Artistic design"],
        unfavorableFor: ["Rigid stubbornness", "Financial extravagance"],
      },
      Gemini: {
        title: "Mithuna (Gemini) Chara Dasha",
        karakaTheme: "Intellectual agility, commerce, writing, travel",
        description: `A ${years}-year period marked by intense communications, media publications, commercial networking, and frequent short journeys.`,
        favorableFor: ["Publishing & media", "Software development", "Commercial trade"],
        unfavorableFor: ["Scattered focus", "Nervous exhaustion"],
      },
      Cancer: {
        title: "Karka (Cancer) Chara Dasha",
        karakaTheme: "Emotional security, domestic sanctuary, public empathy",
        description: `A ${years}-year phase revolving around domestic peace, maternal karma, emotional maturation, and public favor.`,
        favorableFor: ["Home acquisition", "Community care", "Creative ideation"],
        unfavorableFor: ["Emotional over-reactivity", "Isolation"],
      },
      Leo: {
        title: "Simha (Leo) Chara Dasha",
        karakaTheme: "Sovereign authority, public eminence, creative self-expression",
        description: `A ${years}-year chapter of executive leadership, high visibility, royal favors, and decisive creative achievements.`,
        favorableFor: ["Executive leadership", "Political advancement", "High-visibility projects"],
        unfavorableFor: ["Arrogance", "Ego clashes with mentors"],
      },
      Virgo: {
        title: "Kanya (Virgo) Chara Dasha",
        karakaTheme: "Service, health optimization, technical craftsmanship",
        description: `A ${years}-year period of rigorous work ethic, solving complex operational problems, and fine-tuning daily routines.`,
        favorableFor: ["Analytical research", "Health rehabilitation", "Service enterprise"],
        unfavorableFor: ["Excessive self-criticism", "Perfectionist paralysis"],
      },
      Libra: {
        title: "Tula (Libra) Chara Dasha",
        karakaTheme: "Sacred partnership, diplomacy, aesthetic commerce",
        description: `A ${years}-year period highlighting business alliances, marriage, commercial contracts, and harmonious diplomacy.`,
        favorableFor: ["Marriage & alliances", "Legal negotiations", "Luxury trade"],
        unfavorableFor: ["Indecisiveness", "People-pleasing compromise"],
      },
      Scorpio: {
        title: "Vrischika (Scorpio) Chara Dasha",
        karakaTheme: "Metamorphosis, hidden knowledge, shared resources",
        description: `A ${years}-year deep transformative cycle. Uncovering hidden truths, paying off karmic debts, and psychological rebirth.`,
        favorableFor: ["Occult research", "Strategic finance", "Psychological healing"],
        unfavorableFor: ["Suspicion", "Power struggles", "Vindictiveness"],
      },
      Sagittarius: {
        title: "Dhanu (Sagittarius) Chara Dasha",
        karakaTheme: "Higher dharma, philosophy, international expansion",
        description: `A ${years}-year phase of spiritual illumination, academic degrees, international pilgrimages, and noble mentorship.`,
        favorableFor: ["Higher education", "Publishing", "Spiritual pilgrimage"],
        unfavorableFor: ["Dogmatism", "Overextending commitments"],
      },
      Capricorn: {
        title: "Makara (Capricorn) Chara Dasha",
        karakaTheme: "Professional eminence, disciplined perseverance, public duty",
        description: `A ${years}-year chapter of heavy responsibility rewarded with career culmination, institutional authority, and lasting reputation.`,
        favorableFor: ["Career milestones", "Enterprise building", "Long-term legacy"],
        unfavorableFor: ["Cold cynicism", "Overworking to exhaustion"],
      },
      Aquarius: {
        title: "Kumbha (Aquarius) Chara Dasha",
        karakaTheme: "Humanitarian alliances, innovation, collective goals",
        description: `A ${years}-year period of progressive innovation, social movements, collective networking, and unconventional income streams.`,
        favorableFor: ["Tech startups", "Social impact ventures", "Large-scale networking"],
        unfavorableFor: ["Emotional detachment", "Alienation from close ties"],
      },
      Pisces: {
        title: "Meena (Pisces) Chara Dasha",
        karakaTheme: "Moksha, sacred solitude, artistic channeling, closure",
        description: `A ${years}-year mystical period closing a major life cycle. Sacred spiritual awakening, foreign residence, and creative flow.`,
        favorableFor: ["Spiritual liberation", "Foreign travel", "Charity and artistic arts"],
        unfavorableFor: ["Escapism", "Financial carelessness"],
      },
    };

    return (
      MAP[sign] || {
        title: `${sign} Period`,
        karakaTheme: "General sign influence",
        description: `A ${years}-year sign period activating Jaimini planetary yogas.`,
        favorableFor: ["Constructive planning"],
        unfavorableFor: ["Hasty actions"],
      }
    );
  }

  private formatDate(date: Date): string {
    const y = date.getUTCFullYear();
    const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const d = date.getUTCDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
}

// ============================================================
// PART 4: KALACHAKRA DASHA (108 PADA DEITY CYCLE)
// ============================================================

export class KalachakraDashaCalculator {
  public static readonly DEITIES = [
    { name: "Indra", direction: "East", type: "Savya" as const, years: 5 },
    { name: "Agni", direction: "Southeast", type: "Savya" as const, years: 5 },
    { name: "Yama", direction: "South", type: "Savya" as const, years: 5 },
    { name: "Nirriti", direction: "Southwest", type: "Savya" as const, years: 5 },
    { name: "Varuna", direction: "West", type: "Apasavya" as const, years: 5 },
    { name: "Vayu", direction: "Northwest", type: "Apasavya" as const, years: 5 },
    { name: "Kubera", direction: "North", type: "Apasavya" as const, years: 5 },
    { name: "Ishana", direction: "Northeast", type: "Apasavya" as const, years: 5 },
    { name: "Brahma", direction: "Center", type: "Center" as const, years: 5 },
  ];

  public calculateKalachakraDasha(
    moonLongitude: number,
    birthDate: Date,
    referenceDate: Date = new Date()
  ): KalachakraDashaPeriod[] {
    const nakshatraIndex = Math.floor(moonLongitude / (360 / 27));
    const degreeInNak = moonLongitude % (360 / 27);
    const pada = Math.floor(degreeInNak / (13.333333333333 / 4)); // 0 to 3

    const totalPadaIndex = nakshatraIndex * 4 + pada; // 0 to 107
    const startingDeityIndex = totalPadaIndex % 9;

    const periods: KalachakraDashaPeriod[] = [];
    let currentMs = birthDate.getTime();

    // Generate two 45-year rounds (90 years total)
    for (let i = 0; i < 18; i++) {
      const deity = KalachakraDashaCalculator.DEITIES[(startingDeityIndex + i) % 9];
      const durationMs = deity.years * 360 * 24 * 3600 * 1000;

      const startDate = new Date(currentMs);
      const endDate = new Date(currentMs + durationMs);

      const isCurrent =
        referenceDate.getTime() >= startDate.getTime() &&
        referenceDate.getTime() < endDate.getTime();

      periods.push({
        deity: deity.name,
        direction: deity.direction,
        sign: this.getSignForDeity(deity.name),
        type: deity.type,
        years: deity.years,
        startDate,
        endDate,
        startDateFormatted: this.formatDate(startDate),
        endDateFormatted: this.formatDate(endDate),
        isCurrent,
        interpretation: this.getKalachakraInterpretation(deity.name, deity.direction),
      });

      currentMs += durationMs;
    }

    return periods;
  }

  private getSignForDeity(name: string): string {
    const MAP: Record<string, string> = {
      Indra: "Aries",
      Agni: "Taurus",
      Yama: "Gemini",
      Nirriti: "Cancer",
      Varuna: "Leo",
      Vayu: "Virgo",
      Kubera: "Libra",
      Ishana: "Scorpio",
      Brahma: "Sagittarius",
    };
    return MAP[name] || "Aries";
  }

  private getKalachakraInterpretation(name: string, direction: string): KalachakraInterpretation {
    const MAP: Record<string, KalachakraInterpretation> = {
      Indra: {
        title: "Indra - Sovereign Radiance (East)",
        themes: ["Leadership", "Executive victory", "Elevation in rank", "State recognition"],
        description: `Governed by Indra, the king of deities. A 5-year phase of authoritative prominence, overcoming rivals, and institutional elevation toward the ${direction}.`,
        favorable: "Assuming executive office, launching major public campaigns, diplomacy.",
        unfavorable: "Arrogance, conflict with lawful superiors.",
      },
      Agni: {
        title: "Agni - Sacred Fire & Purification (Southeast)",
        themes: ["Energy", "Purification", "Technical feats", "Transmutation"],
        description: `A 5-year period of fiery propulsion, purification of impurities, and vigorous technical or physical breakthroughs.`,
        favorable: "Initiating new endeavors, scientific and technical mastery, decisive actions.",
        unfavorable: "Combative impatience, inflammatory burnout.",
      },
      Yama: {
        title: "Yama - Dharma & Lawful Restraint (South)",
        themes: ["Strict justice", "Clearing karmic debts", "Endurance", "Duty"],
        description: `A 5-year period honoring cosmic law and accountability. Karmic accounts are balanced with unflinching justice.`,
        favorable: "Legal reconciliations, settling long debts, moral rectitude.",
        unfavorable: "Ethical shortcuts, evasion of responsibility.",
      },
      Nirriti: {
        title: "Nirriti - Dissolution of Obstacles (Southwest)",
        themes: ["Breaking stagnant ties", "Occult insight", "Root healing"],
        description: `A 5-year period pruning away dead wood from one's life. Profound spiritual transformation through shedding what is obsolete.`,
        favorable: "Psychic cleansing, detoxifying routines, profound inner therapy.",
        unfavorable: "Clinging to collapsing structures.",
      },
      Varuna: {
        title: "Varuna - Cosmic Water & Moral Order (West)",
        themes: ["Oceanic vision", "Emotional expansion", "International connections"],
        description: `A 5-year phase of expansive worldview, international travels across waters, and moral clarity under Varuna's divine gaze.`,
        favorable: "Maritime travel, broad-scale collaborations, ethical foundations.",
        unfavorable: "Deceptive agreements, overpromising.",
      },
      Vayu: {
        title: "Vayu - Prana & Intellectual Agility (Northwest)",
        themes: ["Swift movement", "Intellect", "Breath & vitality", "Rapid changes"],
        description: `A fast-moving 5-year period of swift adaptation, respiratory vitality, communication networks, and intellectual agility.`,
        favorable: "Scientific publishing, respiratory conditioning (Pranayama), rapid logistics.",
        unfavorable: "Restless instability, erratic lifestyle.",
      },
      Kubera: {
        title: "Kubera - Opulent Wealth & Treasure (North)",
        themes: ["Accumulation of riches", "Treasury", "Prosperity", "Generosity"],
        description: `A 5-year period of exceptional material prosperity, financial expansion, and patronage of sacred arts.`,
        favorable: "Wealth generation, philanthropy, lucrative commercial trade.",
        unfavorable: "Greed, hoarding assets without productive flow.",
      },
      Ishana: {
        title: "Ishana - Divine Consciousness & Grace (Northeast)",
        themes: ["Shiva consciousness", "Spiritual illumination", "Highest knowledge"],
        description: `A blessed 5-year period oriented toward the sacred Northeast. Profound mystical enlightenment, divine protection, and inner serenity.`,
        favorable: "Spiritual initiation, temple consecration, philosophical mastery.",
        unfavorable: "Cynical materialism, pride in spiritual attainments.",
      },
      Brahma: {
        title: "Brahma - Creative Genesis & Foundation (Center)",
        themes: ["Creation", "Cosmic knowledge", "Foundational beginnings"],
        description: `A pivotal 5-year period of creative genesis. Laying the blueprint for entirely new chapters of life and conscious creation.`,
        favorable: "Creating masterworks, founding institutions, deep scholarly writing.",
        unfavorable: "Superficiality, neglecting foundational details.",
      },
    };

    return (
      MAP[name] || {
        title: `${name} Period`,
        themes: ["Kalachakra divine movement"],
        description: `Period guided by deity ${name} facing ${direction}.`,
        favorable: "Constructive endeavors",
        unfavorable: "Negative actions",
      }
    );
  }

  private formatDate(date: Date): string {
    const y = date.getUTCFullYear();
    const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const d = date.getUTCDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
}

// ============================================================
// PART 5: ASHTOTTARI DASHA (108-YEAR CYCLE)
// ============================================================

export class AshtottariDashaCalculator {
  public static readonly PERIODS: { planet: string; years: number }[] = [
    { planet: "Sun", years: 6 },
    { planet: "Moon", years: 15 },
    { planet: "Mars", years: 8 },
    { planet: "Mercury", years: 17 },
    { planet: "Saturn", years: 10 },
    { planet: "Jupiter", years: 19 },
    { planet: "Rahu", years: 12 },
    { planet: "Venus", years: 21 },
  ];

  public static readonly TOTAL_CYCLE_YEARS = 108;

  /**
   * Ashtottari Nakshatra mapping:
   * 28 asterisms mapped to the 8 planets in 108-year system
   */
  public getPlanetForNakshatra(nakshatraIndex0Indexed: number): string {
    // 0 = Ashwini, 1 = Bharani, etc.
    if ([2, 3, 4].includes(nakshatraIndex0Indexed)) return "Sun"; // Krittika, Rohini, Mrigashira
    if ([5, 6, 7, 8].includes(nakshatraIndex0Indexed)) return "Moon"; // Ardra, Punarvasu, Pushya, Ashlesha
    if ([9, 10, 11].includes(nakshatraIndex0Indexed)) return "Mars"; // Magha, P.Phalguni, U.Phalguni
    if ([12, 13, 14, 15].includes(nakshatraIndex0Indexed)) return "Mercury"; // Hasta, Chitra, Swati, Vishakha
    if ([16, 17, 18].includes(nakshatraIndex0Indexed)) return "Saturn"; // Anuradha, Jyeshtha, Mula
    if ([19, 20, 21].includes(nakshatraIndex0Indexed)) return "Jupiter"; // P.Ashadha, U.Ashadha, Shravana
    if ([22, 23, 24].includes(nakshatraIndex0Indexed)) return "Rahu"; // Dhanishta, Shatabhisha, P.Bhadrapada
    return "Venus"; // U.Bhadrapada, Revati, Ashwini, Bharani (25, 26, 0, 1)
  }

  public calculateAshtottariDasha(
    nakshatraIndex0Indexed: number,
    moonDegreeInNakshatra: number,
    birthDate: Date,
    referenceDate: Date = new Date()
  ): AshtottariDashaPeriod[] {
    const startPlanet = this.getPlanetForNakshatra(nakshatraIndex0Indexed);
    let currentIndex = AshtottariDashaCalculator.PERIODS.findIndex(
      (p) => p.planet === startPlanet
    );
    if (currentIndex === -1) currentIndex = 0;

    const firstPeriodData = AshtottariDashaCalculator.PERIODS[currentIndex];

    // Calculate birth balance
    const totalSpan = 13.333333333333;
    const elapsedFraction = Math.max(0, Math.min(1, moonDegreeInNakshatra / totalSpan));
    const balanceFraction = 1 - elapsedFraction;
    const firstPeriodYears = Math.round(firstPeriodData.years * balanceFraction * 1000) / 1000;

    const periods: AshtottariDashaPeriod[] = [];
    let currentMs = birthDate.getTime();

    // Generate full 8 periods (108 years)
    for (let i = 0; i < 8; i++) {
      const pData = AshtottariDashaCalculator.PERIODS[currentIndex];
      const years = i === 0 ? firstPeriodYears : pData.years;
      const durationMs = years * 360 * 24 * 3600 * 1000;

      const startDate = new Date(currentMs);
      const endDate = new Date(currentMs + durationMs);

      const isCurrent =
        referenceDate.getTime() >= startDate.getTime() &&
        referenceDate.getTime() < endDate.getTime();

      periods.push({
        planet: pData.planet,
        years,
        startDate,
        endDate,
        startDateFormatted: this.formatDate(startDate),
        endDateFormatted: this.formatDate(endDate),
        isCurrent,
        interpretation: this.getAshtottariInterpretation(pData.planet),
      });

      currentMs += durationMs;
      currentIndex = (currentIndex + 1) % 8;
    }

    return periods;
  }

  private getAshtottariInterpretation(planet: string): AshtottariInterpretation {
    const MAP: Record<string, AshtottariInterpretation> = {
      Sun: {
        title: "Surya Ashtottari (6 Years)",
        planetQuality: "Executive Sovereignty, Vital Health, Institutional Honor",
        favorableAreas: ["Leadership roles", "Government patronage", "Dignified public life"],
        challengingAreas: ["Ego friction", "Physical fatigue from overexertion"],
        advice: "Lead with humble magnanimity and honor foundational obligations.",
      },
      Moon: {
        title: "Chandra Ashtottari (15 Years)",
        planetQuality: "Emotional Prosperity, Domestic Comfort, Public Favor",
        favorableAreas: ["Family expansion", "Real estate peace", "Creative ideation"],
        challengingAreas: ["Mood fluctuations", "Over-sentimentality"],
        advice: "Nurture emotional sanctuaries and practice daily meditation.",
      },
      Mars: {
        title: "Mangala Ashtottari (8 Years)",
        planetQuality: "Physical Valor, Courageous Breakthroughs, Land & Assets",
        favorableAreas: ["Acquiring land", "Athletic/technical accomplishments", "Decisive victories"],
        challengingAreas: ["Accident-prone haste", "Combative arguments"],
        advice: "Channel intense propulsion into structured, constructive craft.",
      },
      Mercury: {
        title: "Budha Ashtottari (17 Years)",
        planetQuality: "Commercial Brilliance, Analytical Mastery, Intellectual Success",
        favorableAreas: ["Enterprise trading", "Publishing & literature", "Strategic negotiations"],
        challengingAreas: ["Nervous tension", "Scattered focus"],
        advice: "Consolidate communication platforms and document agreements meticulously.",
      },
      Saturn: {
        title: "Shani Ashtottari (10 Years)",
        planetQuality: "Stoic Discipline, Karmic Maturity, Enduring Foundation",
        favorableAreas: ["Systematic infrastructure", "Clearing karmic obligations", "Steadfast mastery"],
        challengingAreas: ["Delays", "Heaviness", "Pessimism"],
        advice: "Embrace duty with patience; time will reward uncomplaining dedication.",
      },
      Jupiter: {
        title: "Guru Ashtottari (19 Years)",
        planetQuality: "Supreme Wisdom, Dharma, Progeny, Opulent Prosperity",
        favorableAreas: ["Higher spiritual study", "Teaching honors", "Generous wealth growth"],
        challengingAreas: ["Complacency", "Overextending commitments"],
        advice: "Share accumulated wisdom generously and anchor endeavors in ethical truth.",
      },
      Rahu: {
        title: "Rahu Ashtottari (12 Years)",
        planetQuality: "Unconventional Evolution, Technology, Material Ambition",
        favorableAreas: ["Digital innovations", "Foreign opportunities", "Sudden breakthroughs"],
        challengingAreas: ["Speculative greed", "Illusory attachments"],
        advice: "Balance bold worldly ambition with unwavering moral discernment.",
      },
      Venus: {
        title: "Shukra Ashtottari (21 Years)",
        planetQuality: "Supreme Aesthetic Fulfillment, Wealth, Sacred Partnership",
        favorableAreas: ["Marital bliss", "Luxury assets", "Diplomatic and artistic triumph"],
        challengingAreas: ["Extravagance", "Sensory indulgence"],
        advice: "Cultivate refined elegance and celebrate sincere, enduring relationships.",
      },
    };

    return (
      MAP[planet] || {
        title: `${planet} Ashtottari Period`,
        planetQuality: "Planetary period influence",
        favorableAreas: ["Constructive planning"],
        challengingAreas: ["Obstacles"],
        advice: "Maintain balance and discipline.",
      }
    );
  }

  private formatDate(date: Date): string {
    const y = date.getUTCFullYear();
    const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const d = date.getUTCDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
}

// ============================================================
// PART 6: COMPLETE MULTI-DASHA ORCHESTRATOR
// ============================================================

export class CompleteDashaOrchestrator {
  public pranaCalculator: PranaCalculator;
  public yoginiCalculator: YoginiDashaCalculator;
  public charaCalculator: CharaDashaCalculator;
  public kalachakraCalculator: KalachakraDashaCalculator;
  public ashtottariCalculator: AshtottariDashaCalculator;
  public v5Engine: Vimshottari5LevelEngine;
  public y5Engine: Yogini5LevelEngine;
  public c5Engine: Chara5LevelEngine;
  public a5Engine: Ashtottari5LevelEngine;
  public k5Engine: Kalachakra5LevelEngine;
  public s116Engine: Shodashottari5LevelEngine;
  public d168Engine: Dwisaptati5LevelEngine;
  public sh60Engine: Shastihayani5LevelEngine;
  public st96Engine: Sthira5LevelEngine;
  public mn96Engine: Mandooka5LevelEngine;

  constructor() {
    this.pranaCalculator = new PranaCalculator();
    this.yoginiCalculator = new YoginiDashaCalculator();
    this.charaCalculator = new CharaDashaCalculator();
    this.kalachakraCalculator = new KalachakraDashaCalculator();
    this.ashtottariCalculator = new AshtottariDashaCalculator();
    this.v5Engine = new Vimshottari5LevelEngine();
    this.y5Engine = new Yogini5LevelEngine();
    this.c5Engine = new Chara5LevelEngine();
    this.a5Engine = new Ashtottari5LevelEngine();
    this.k5Engine = new Kalachakra5LevelEngine();
    this.s116Engine = new Shodashottari5LevelEngine();
    this.d168Engine = new Dwisaptati5LevelEngine();
    this.sh60Engine = new Shastihayani5LevelEngine();
    this.st96Engine = new Sthira5LevelEngine();
    this.mn96Engine = new Mandooka5LevelEngine();
  }

  /**
   * Orchestrate all 5 Dasha systems simultaneously
   */
  public generateAllDashas(params: {
    moonLongitude: number;
    moonNakshatra1Indexed: number;
    moonDegreeInNakshatra: number;
    ascendantSign: string;
    planetsInSigns: Record<string, string>;
    birthDate: Date;
    sookshmaContext?: {
      mahadasha: string;
      antardasha: string;
      pratyantardasha: string;
      sookshma: string;
      startDate: Date;
      years: number;
    };
    referenceDate?: Date;
  }): AllDashaSystems {
    const refDate = params.referenceDate || new Date();

    // 1. Level 5 Prana (Vimshottari)
    let vimshottariPranas: PranaPeriod[] = [];
    let currentPrana: PranaPeriod | null = null;

    if (params.sookshmaContext) {
      vimshottariPranas = this.pranaCalculator.generatePranas(
        params.sookshmaContext.mahadasha,
        params.sookshmaContext.antardasha,
        params.sookshmaContext.pratyantardasha,
        params.sookshmaContext.sookshma,
        params.sookshmaContext.startDate,
        params.sookshmaContext.years,
        refDate
      );
      currentPrana = vimshottariPranas.find((p) => p.isCurrent) || null;
    }

    // 2. Yogini Dasha
    const yogini = this.yoginiCalculator.calculateYoginiDasha(
      params.moonNakshatra1Indexed,
      params.moonDegreeInNakshatra,
      params.birthDate,
      refDate
    );
    const currentYogini = yogini.find((y) => y.isCurrent) || null;
    const currentYoginiSub =
      currentYogini?.subPeriods.find((s) => s.isCurrent) || null;

    // 3. Jaimini Chara Dasha
    const chara = this.charaCalculator.calculateCharaDasha(
      params.ascendantSign,
      params.planetsInSigns,
      params.birthDate,
      refDate
    );
    const currentChara = chara.find((c) => c.isCurrent) || null;

    // 4. Kalachakra Dasha
    const kalachakra = this.kalachakraCalculator.calculateKalachakraDasha(
      params.moonLongitude,
      params.birthDate,
      refDate
    );
    const currentKalachakra = kalachakra.find((k) => k.isCurrent) || null;

    // 5. Ashtottari Dasha
    const ashtottari = this.ashtottariCalculator.calculateAshtottariDasha(
      params.moonNakshatra1Indexed - 1, // 0-indexed
      params.moonDegreeInNakshatra,
      params.birthDate,
      refDate
    );
    const currentAshtottari = ashtottari.find((a) => a.isCurrent) || null;

    // 6. Cross-System Convergence Matrix
    const convergence: ActiveDashaSummary[] = [];

    if (currentPrana) {
      convergence.push({
        system: "Vimshottari",
        activePeriodName: `L5 Prana: ${currentPrana.lord}`,
        lordOrSign: currentPrana.lord,
        durationRemaining: currentPrana.durationFormatted,
        tone: currentPrana.interpretation.energyQuality,
        coreTheme: currentPrana.interpretation.brief,
      });
    }

    if (currentYogini) {
      convergence.push({
        system: "Yogini",
        activePeriodName: `${currentYogini.yogini} (${currentYoginiSub?.yogini || ""})`,
        lordOrSign: currentYogini.lord,
        durationRemaining: `${currentYogini.durationYears}y`,
        tone: currentYogini.interpretation.nature === "benefic" ? "positive" : "challenging",
        coreTheme: currentYogini.interpretation.positive,
      });
    }

    if (currentChara) {
      convergence.push({
        system: "Chara",
        activePeriodName: `${currentChara.sign} Sign Dasha`,
        lordOrSign: currentChara.lord,
        durationRemaining: `${currentChara.years}y`,
        tone: "positive",
        coreTheme: currentChara.interpretation.karakaTheme,
      });
    }

    if (currentKalachakra) {
      convergence.push({
        system: "Kalachakra",
        activePeriodName: `${currentKalachakra.deity} (${currentKalachakra.direction})`,
        lordOrSign: currentKalachakra.deity,
        durationRemaining: `${currentKalachakra.years}y`,
        tone: "positive",
        coreTheme: currentKalachakra.interpretation.themes.join(", "),
      });
    }

    if (currentAshtottari) {
      convergence.push({
        system: "Ashtottari",
        activePeriodName: `${currentAshtottari.planet} Period`,
        lordOrSign: currentAshtottari.planet,
        durationRemaining: `${currentAshtottari.years}y`,
        tone: "neutral",
        coreTheme: currentAshtottari.interpretation.planetQuality,
      });
    }

    // 7. Full 5-Level Hierarchies for All 10 Systems
    const v5 = this.v5Engine.calculate(
      params.moonNakshatra1Indexed - 1,
      params.moonDegreeInNakshatra,
      params.birthDate,
      refDate
    );

    const y5 = this.y5Engine.calculate(
      params.moonNakshatra1Indexed,
      params.moonDegreeInNakshatra,
      params.birthDate,
      refDate
    );

    const c5 = this.c5Engine.calculate(
      params.ascendantSign,
      params.planetsInSigns,
      params.birthDate,
      refDate
    );

    const a5 = this.a5Engine.calculate(
      params.moonNakshatra1Indexed - 1,
      params.moonDegreeInNakshatra,
      params.birthDate,
      refDate
    );

    const k5 = this.k5Engine.calculate(
      params.moonLongitude,
      params.birthDate,
      refDate
    );

    const s116 = this.s116Engine.calculate(
      params.moonNakshatra1Indexed - 1,
      params.moonDegreeInNakshatra,
      params.birthDate,
      refDate
    );

    const d168 = this.d168Engine.calculate(
      params.moonNakshatra1Indexed - 1,
      params.moonDegreeInNakshatra,
      params.birthDate,
      refDate
    );

    const sh60 = this.sh60Engine.calculate(
      params.moonNakshatra1Indexed - 1,
      params.moonDegreeInNakshatra,
      params.birthDate,
      refDate
    );

    const st96 = this.st96Engine.calculate(
      params.ascendantSign,
      params.birthDate,
      refDate
    );

    const mn96 = this.mn96Engine.calculate(
      params.ascendantSign,
      params.birthDate,
      refDate
    );

    // Add new systems to Convergence
    if (s116.activeHierarchy.level1) {
      convergence.push({
        system: "Shodashottari",
        activePeriodName: `${s116.activeHierarchy.level1.name} (${s116.activeHierarchy.level2?.name || "Sub"})`,
        lordOrSign: s116.activeHierarchy.level1.lord || s116.activeHierarchy.level1.name,
        durationRemaining: s116.activeHierarchy.level1.durationFormatted,
        tone: s116.activeHierarchy.level1.tone,
        coreTheme: s116.activeHierarchy.level1.brief,
      });
    }

    if (d168.activeHierarchy.level1) {
      convergence.push({
        system: "Dwisaptati",
        activePeriodName: `${d168.activeHierarchy.level1.name} (${d168.activeHierarchy.level2?.name || "Sub"})`,
        lordOrSign: d168.activeHierarchy.level1.lord || d168.activeHierarchy.level1.name,
        durationRemaining: d168.activeHierarchy.level1.durationFormatted,
        tone: d168.activeHierarchy.level1.tone,
        coreTheme: d168.activeHierarchy.level1.brief,
      });
    }

    if (sh60.activeHierarchy.level1) {
      convergence.push({
        system: "Shastihayani",
        activePeriodName: `${sh60.activeHierarchy.level1.name} Period`,
        lordOrSign: sh60.activeHierarchy.level1.lord || sh60.activeHierarchy.level1.name,
        durationRemaining: sh60.activeHierarchy.level1.durationFormatted,
        tone: sh60.activeHierarchy.level1.tone,
        coreTheme: sh60.activeHierarchy.level1.brief,
      });
    }

    if (st96.activeHierarchy.level1) {
      convergence.push({
        system: "Sthira",
        activePeriodName: `${st96.activeHierarchy.level1.name} Sign`,
        lordOrSign: st96.activeHierarchy.level1.lord || st96.activeHierarchy.level1.name,
        durationRemaining: st96.activeHierarchy.level1.durationFormatted,
        tone: st96.activeHierarchy.level1.tone,
        coreTheme: st96.activeHierarchy.level1.brief,
      });
    }

    if (mn96.activeHierarchy.level1) {
      convergence.push({
        system: "Mandooka",
        activePeriodName: `${mn96.activeHierarchy.level1.name} Leap`,
        lordOrSign: mn96.activeHierarchy.level1.lord || mn96.activeHierarchy.level1.name,
        durationRemaining: mn96.activeHierarchy.level1.durationFormatted,
        tone: mn96.activeHierarchy.level1.tone,
        coreTheme: mn96.activeHierarchy.level1.brief,
      });
    }

    const fiveLevels: All5LevelDashasResult = {
      vimshottari: v5,
      yogini: y5,
      chara: c5,
      ashtottari: a5,
      kalachakra: k5,
      shodashottari: s116,
      dwisaptati: d168,
      shastihayani: sh60,
      sthira: st96,
      mandooka: mn96,
    };

    return {
      vimshottariPranas,
      currentPrana,
      yogini,
      currentYogini,
      currentYoginiSub,
      chara,
      currentChara,
      kalachakra,
      currentKalachakra,
      ashtottari,
      currentAshtottari,
      convergence,
      fiveLevels,
    };
  }

  /**
   * Alias for generateAllDashas
   */
  public generateAllSystems(params: {
    moonLongitude?: number;
    moonNakshatra1Indexed?: number;
    moonNakshatraIndex?: number;
    moonDegreeInNakshatra?: number;
    ascendantSign?: string;
    lagnaRasiIndex?: number;
    planetsInSigns?: Record<string, string>;
    birthDate: Date;
    sookshmaContext?: any;
    referenceDate?: Date;
    [key: string]: any;
  }): AllDashaSystems {
    const moonLong = params.moonLongitude ?? 180;
    const nak1Indexed = params.moonNakshatra1Indexed ?? ((params.moonNakshatraIndex ?? 13) + 1);
    const degInNak = params.moonDegreeInNakshatra ?? (moonLong % (360 / 27));
    const ascSign = params.ascendantSign ?? "Aries";

    return this.generateAllDashas({
      moonLongitude: moonLong,
      moonNakshatra1Indexed: nak1Indexed,
      moonDegreeInNakshatra: degInNak,
      ascendantSign: ascSign,
      planetsInSigns: params.planetsInSigns || {},
      birthDate: params.birthDate,
      sookshmaContext: params.sookshmaContext,
      referenceDate: params.referenceDate || new Date(),
    });
  }
}
