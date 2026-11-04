/**
 * Krishnamurti Padhdhati (KP) Sub-Lord & Star-Lord Calculation Engine
 * 
 * Rules of KP Sub-Division:
 * 1. Each of the 27 Nakshatras spans 13°20' (800' arcminutes = 13.333333°).
 * 2. Each Nakshatra is sub-divided into 9 unequal parts according to the
 *    Vimshottari Dasha years:
 *    Ketu (7), Venus (20), Sun (6), Moon (10), Mars (7), Rahu (18), Jupiter (16), Saturn (19), Mercury (17).
 *    Total = 120 years.
 * 3. The sub-division inside a Nakshatra begins with the lord of that Nakshatra itself,
 *    and follows the cyclical order of Vimshottari Dasha!
 * 4. Sub-Sub division further divides each Sub into 9 parts using the same proportional rule.
 */

import { SubLordResult } from "./kpTypes";

export const NAKSHATRAS = [
  { index: 0, name: "Ashwini", lord: "Ketu" },
  { index: 1, name: "Bharani", lord: "Venus" },
  { index: 2, name: "Krittika", lord: "Sun" },
  { index: 3, name: "Rohini", lord: "Moon" },
  { index: 4, name: "Mrigashira", lord: "Mars" },
  { index: 5, name: "Ardra", lord: "Rahu" },
  { index: 6, name: "Punarvasu", lord: "Jupiter" },
  { index: 7, name: "Pushya", lord: "Saturn" },
  { index: 8, name: "Ashlesha", lord: "Mercury" },
  { index: 9, name: "Magha", lord: "Ketu" },
  { index: 10, name: "Purva Phalguni", lord: "Venus" },
  { index: 11, name: "Uttara Phalguni", lord: "Sun" },
  { index: 12, name: "Hasta", lord: "Moon" },
  { index: 13, name: "Chitra", lord: "Mars" },
  { index: 14, name: "Swati", lord: "Rahu" },
  { index: 15, name: "Vishakha", lord: "Jupiter" },
  { index: 16, name: "Anuradha", lord: "Saturn" },
  { index: 17, name: "Jyeshtha", lord: "Mercury" },
  { index: 18, name: "Moola", lord: "Ketu" },
  { index: 19, name: "Purva Ashadha", lord: "Venus" },
  { index: 20, name: "Uttara Ashadha", lord: "Sun" },
  { index: 21, name: "Shravana", lord: "Moon" },
  { index: 22, name: "Dhanishta", lord: "Mars" },
  { index: 23, name: "Shatabhisha", lord: "Rahu" },
  { index: 24, name: "Purva Bhadrapada", lord: "Jupiter" },
  { index: 25, name: "Uttara Bhadrapada", lord: "Saturn" },
  { index: 26, name: "Revati", lord: "Mercury" },
];

export const VIMSHOTTARI_CYCLE = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
] as const;

export const DASHA_YEARS: Record<string, number> = {
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

export const ZODIAC_SIGNS = [
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

export const SIGN_LORDS: Record<number, string> = {
  0: "Mars", // Aries
  1: "Venus", // Taurus
  2: "Mercury", // Gemini
  3: "Moon", // Cancer
  4: "Sun", // Leo
  5: "Mercury", // Virgo
  6: "Venus", // Libra
  7: "Mars", // Scorpio
  8: "Jupiter", // Sagittarius
  9: "Saturn", // Capricorn
  10: "Saturn", // Aquarius
  11: "Jupiter", // Pisces
};

export class SubLordCalculator {
  public static readonly TOTAL_DASHA_YEARS = 120;
  public static readonly NAKSHATRA_SPAN = 360 / 27; // 13.333333333333334° (13°20')
  public static readonly PADA_SPAN = 360 / 108; // 3.3333333333333335° (3°20')

  /**
   * Helper to get Sign Name from 0-indexed sign index
   */
  public static getSignName(signIndex: number): string {
    const norm = ((signIndex % 12) + 12) % 12;
    return ZODIAC_SIGNS[norm];
  }

  /**
   * Helper to get Sign Lord from 0-indexed sign index
   */
  public static getSignLord(signIndex: number): string {
    const norm = ((signIndex % 12) + 12) % 12;
    return SIGN_LORDS[norm];
  }

  /**
   * Formats degrees into Degree° Minute' Second" string
   */
  public static formatDMS(deg: number): string {
    const d = Math.floor(deg);
    const mTotal = (deg - d) * 60;
    const m = Math.floor(mTotal);
    const s = Math.round((mTotal - m) * 60);
    return `${d}° ${m.toString().padStart(2, "0")}' ${s.toString().padStart(2, "0")}"`;
  }

  /**
   * Calculate Star Lord, Sub Lord, and Sub-Sub Lord for any sidereal longitude (0 - 360°)
   */
  public calculateSubLord(longitude: number): SubLordResult {
    const normLon = ((longitude % 360) + 360) % 360;

    // 1. Find Nakshatra
    const nakshatraIndex = Math.min(26, Math.floor(normLon / SubLordCalculator.NAKSHATRA_SPAN));
    const nakshatra = NAKSHATRAS[nakshatraIndex];
    const starLord = nakshatra.lord;
    const degreeInNakshatra = normLon - nakshatraIndex * SubLordCalculator.NAKSHATRA_SPAN;

    // 2. Find Pada (1 to 4)
    const pada = Math.min(4, Math.floor(degreeInNakshatra / SubLordCalculator.PADA_SPAN) + 1);

    // 3. Calculate Sub-Lord based on Vimshottari proportions
    // Crucial KP Rule: The sequence begins with the Star Lord of the Nakshatra!
    const starLordSequenceIndex = VIMSHOTTARI_CYCLE.indexOf(starLord as any);
    let cumulativeSpan = 0;
    let subLord = starLord;
    let degreeInSub = 0;
    let activeSubSpan = 0;

    for (let i = 0; i < 9; i++) {
      const planet = VIMSHOTTARI_CYCLE[(starLordSequenceIndex + i) % 9];
      const planetYears = DASHA_YEARS[planet];
      const subSpan = (planetYears / SubLordCalculator.TOTAL_DASHA_YEARS) * SubLordCalculator.NAKSHATRA_SPAN;

      if (degreeInNakshatra < cumulativeSpan + subSpan || i === 8) {
        subLord = planet;
        degreeInSub = degreeInNakshatra - cumulativeSpan;
        activeSubSpan = subSpan;
        break;
      }
      cumulativeSpan += subSpan;
    }

    // 4. Calculate Sub-Sub Lord
    // The sub-sub division of a sub begins with the Sub Lord itself!
    const subLordSequenceIndex = VIMSHOTTARI_CYCLE.indexOf(subLord as any);
    let cumulativeSubSub = 0;
    let subSubLord = subLord;

    for (let j = 0; j < 9; j++) {
      const planet = VIMSHOTTARI_CYCLE[(subLordSequenceIndex + j) % 9];
      const planetYears = DASHA_YEARS[planet];
      const subSubSpan = (planetYears / SubLordCalculator.TOTAL_DASHA_YEARS) * activeSubSpan;

      if (degreeInSub < cumulativeSubSub + subSubSpan || j === 8) {
        subSubLord = planet;
        break;
      }
      cumulativeSubSub += subSubSpan;
    }

    return {
      starLord,
      subLord,
      subSubLord,
      longitude: normLon,
      nakshatraIndex,
      nakshatraName: nakshatra.name,
      pada,
      degreeInNakshatra,
      degreeInSub,
      subDivisionSpan: activeSubSpan,
    };
  }

  // Cached tables for high performance
  private static cached249Table: KP249Entry[] | null = null;
  private static cached2193Table: KP2193Entry[] | null = null;

  /**
   * Generates the authentic Classical KP 1 to 249 Sub-Lord Table.
   * Total 243 subs + 6 sign boundary splits = exactly 249 divisions.
   */
  public static generate249Table(): KP249Entry[] {
    if (SubLordCalculator.cached249Table) {
      return SubLordCalculator.cached249Table;
    }

    const table: KP249Entry[] = [];
    let seedCounter = 1;

    for (let nakIdx = 0; nakIdx < 27; nakIdx++) {
      const nakshatra = NAKSHATRAS[nakIdx];
      const starLord = nakshatra.lord;
      const nakStartLon = nakIdx * SubLordCalculator.NAKSHATRA_SPAN;
      const starLordIdx = VIMSHOTTARI_CYCLE.indexOf(starLord as any);

      let cumulativeSpan = 0;

      for (let s = 0; s < 9; s++) {
        const subLord = VIMSHOTTARI_CYCLE[(starLordIdx + s) % 9];
        const planetYears = DASHA_YEARS[subLord];
        const subSpan = (planetYears / SubLordCalculator.TOTAL_DASHA_YEARS) * SubLordCalculator.NAKSHATRA_SPAN;
        const subStartLon = nakStartLon + cumulativeSpan;
        const subEndLon = subStartLon + subSpan;

        // Check if a 30° sign boundary cuts this sub
        const startSign = Math.floor(subStartLon / 30);
        const endSign = Math.floor((subEndLon - 0.0000001) / 30);

        if (startSign !== endSign) {
          // Boundary crossed! Split into two entries:
          const boundaryLon = endSign * 30;

          // Part 1: in previous sign
          table.push({
            seed: seedCounter++,
            signIndex: startSign,
            signName: SubLordCalculator.getSignName(startSign),
            signLord: SubLordCalculator.getSignLord(startSign),
            nakshatraIndex: nakIdx,
            nakshatraName: nakshatra.name,
            starLord,
            subLord,
            startLongitude: subStartLon,
            endLongitude: boundaryLon,
            centerLongitude: (subStartLon + boundaryLon) / 2,
            spanDms: `${SubLordCalculator.formatDMS(subStartLon % 30)} - 30° 00' 00"`,
          });

          // Part 2: in next sign
          table.push({
            seed: seedCounter++,
            signIndex: endSign,
            signName: SubLordCalculator.getSignName(endSign),
            signLord: SubLordCalculator.getSignLord(endSign),
            nakshatraIndex: nakIdx,
            nakshatraName: nakshatra.name,
            starLord,
            subLord,
            startLongitude: boundaryLon,
            endLongitude: subEndLon,
            centerLongitude: (boundaryLon + subEndLon) / 2,
            spanDms: `0° 00' 00" - ${SubLordCalculator.formatDMS(subEndLon % 30)}`,
          });
        } else {
          // Normal single entry
          table.push({
            seed: seedCounter++,
            signIndex: startSign,
            signName: SubLordCalculator.getSignName(startSign),
            signLord: SubLordCalculator.getSignLord(startSign),
            nakshatraIndex: nakIdx,
            nakshatraName: nakshatra.name,
            starLord,
            subLord,
            startLongitude: subStartLon,
            endLongitude: subEndLon,
            centerLongitude: (subStartLon + subEndLon) / 2,
            spanDms: `${SubLordCalculator.formatDMS(subStartLon % 30)} - ${SubLordCalculator.formatDMS(subEndLon % 30)}`,
          });
        }

        cumulativeSpan += subSpan;
      }
    }

    SubLordCalculator.cached249Table = table;
    return table;
  }

  /**
   * Generates the Modern KP 1 to 2193 Sub-Sub Lord Table.
   */
  public static generate2193Table(): KP2193Entry[] {
    if (SubLordCalculator.cached2193Table) {
      return SubLordCalculator.cached2193Table;
    }

    const base249 = SubLordCalculator.generate249Table();
    const table: KP2193Entry[] = [];
    let seedCounter = 1;

    for (const entry249 of base249) {
      const subLordIdx = VIMSHOTTARI_CYCLE.indexOf(entry249.subLord as any);
      const totalSpan = entry249.endLongitude - entry249.startLongitude;
      let cumSubSub = 0;

      for (let ss = 0; ss < 9; ss++) {
        const subSubLord = VIMSHOTTARI_CYCLE[(subLordIdx + ss) % 9];
        const planetYears = DASHA_YEARS[subSubLord];
        const ssSpan = (planetYears / SubLordCalculator.TOTAL_DASHA_YEARS) * totalSpan;
        const ssStart = entry249.startLongitude + cumSubSub;
        const ssEnd = ssStart + ssSpan;

        table.push({
          seed: seedCounter++,
          signIndex: entry249.signIndex,
          signName: entry249.signName,
          signLord: entry249.signLord,
          nakshatraIndex: entry249.nakshatraIndex,
          nakshatraName: entry249.nakshatraName,
          starLord: entry249.starLord,
          subLord: entry249.subLord,
          subSubLord,
          startLongitude: ssStart,
          endLongitude: ssEnd,
          centerLongitude: (ssStart + ssEnd) / 2,
          spanDms: `${SubLordCalculator.formatDMS(ssStart % 30)} - ${SubLordCalculator.formatDMS(ssEnd % 30)}`,
        });

        cumSubSub += ssSpan;
      }
    }

    SubLordCalculator.cached2193Table = table;
    return table;
  }

  public static getHorary249Entry(seed: number): KP249Entry {
    const table = SubLordCalculator.generate249Table();
    const safeSeed = Math.max(1, Math.min(table.length, Math.round(seed)));
    return table[safeSeed - 1];
  }

  public static getHorary2193Entry(seed: number): KP2193Entry {
    const table = SubLordCalculator.generate2193Table();
    const safeSeed = Math.max(1, Math.min(table.length, Math.round(seed)));
    return table[safeSeed - 1];
  }
}

export interface KP249Entry {
  seed: number;
  signIndex: number;
  signName: string;
  signLord: string;
  nakshatraIndex: number;
  nakshatraName: string;
  starLord: string;
  subLord: string;
  startLongitude: number;
  endLongitude: number;
  centerLongitude: number;
  spanDms: string;
}

export interface KP2193Entry {
  seed: number;
  signIndex: number;
  signName: string;
  signLord: string;
  nakshatraIndex: number;
  nakshatraName: string;
  starLord: string;
  subLord: string;
  subSubLord: string;
  startLongitude: number;
  endLongitude: number;
  centerLongitude: number;
  spanDms: string;
}
