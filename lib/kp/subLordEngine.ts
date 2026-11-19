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
  // Exact rational partition units: 1 unit = 1/3 arc-second.
  public static readonly UNITS_PER_DEGREE = 10800;
  public static readonly NAKSHATRA_UNITS = 144000; // 13°20'
  public static readonly PADA_UNITS = 36000; // 3°20'
  public static readonly SIGN_UNITS = 324000; // 30°
  public static readonly BOUNDARY_EPSILON = 1e-7;

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
    if (!Number.isFinite(longitude)) {
      throw new Error("KP longitude must be a finite number.");
    }

    const normLon = ((longitude % 360) + 360) % 360;
    const positionUnits = normLon * SubLordCalculator.UNITS_PER_DEGREE;
    const nakshatraIndex = Math.min(
      26,
      Math.floor(positionUnits / SubLordCalculator.NAKSHATRA_UNITS)
    );
    const nakshatra = NAKSHATRAS[nakshatraIndex];
    const starLord = nakshatra.lord;
    const offsetUnits = positionUnits - nakshatraIndex * SubLordCalculator.NAKSHATRA_UNITS;
    const degreeInNakshatra = offsetUnits / SubLordCalculator.UNITS_PER_DEGREE;
    const pada = Math.min(
      4,
      Math.floor(offsetUnits / SubLordCalculator.PADA_UNITS) + 1
    );

    // Work in one-third arc-second units. A nakshatra is exactly 144,000
    // units and each Vimshottari year owns exactly 1,200 units of it.
    // Segments use left-closed, right-open boundaries.
    const starLordSequenceIndex = VIMSHOTTARI_CYCLE.indexOf(starLord as any);
    let cumulativeUnits = 0;
    let subLord = starLord;
    let degreeInSubUnits = 0;
    let activeSubSpanUnits = 0;

    for (let i = 0; i < 9; i++) {
      const planet = VIMSHOTTARI_CYCLE[(starLordSequenceIndex + i) % 9];
      const subSpanUnits = 1200 * DASHA_YEARS[planet];
      const endUnits = cumulativeUnits + subSpanUnits;
      if (offsetUnits < endUnits - SubLordCalculator.BOUNDARY_EPSILON || i === 8) {
        subLord = planet;
        degreeInSubUnits = Math.max(0, offsetUnits - cumulativeUnits);
        activeSubSpanUnits = subSpanUnits;
        break;
      }
      cumulativeUnits = endUnits;
    }

    // Each sub's sub-sub cycle starts again with that sub's own lord.
    const subLordSequenceIndex = VIMSHOTTARI_CYCLE.indexOf(subLord as any);
    let cumulativeSubSubUnits = 0;
    let subSubLord = subLord;

    for (let j = 0; j < 9; j++) {
      const planet = VIMSHOTTARI_CYCLE[(subLordSequenceIndex + j) % 9];
      const subSubSpanUnits = 10 * DASHA_YEARS[subLord] * DASHA_YEARS[planet];
      const endUnits = cumulativeSubSubUnits + subSubSpanUnits;
      if (degreeInSubUnits < endUnits - SubLordCalculator.BOUNDARY_EPSILON || j === 8) {
        subSubLord = planet;
        break;
      }
      cumulativeSubSubUnits = endUnits;
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
      degreeInSub: degreeInSubUnits / SubLordCalculator.UNITS_PER_DEGREE,
      subDivisionSpan: activeSubSpanUnits / SubLordCalculator.UNITS_PER_DEGREE,
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
      const starLordIdx = VIMSHOTTARI_CYCLE.indexOf(starLord as any);
      let cumulativeUnits = 0;
      const nakStartUnits = nakIdx * SubLordCalculator.NAKSHATRA_UNITS;

      for (let s = 0; s < 9; s++) {
        const subLord = VIMSHOTTARI_CYCLE[(starLordIdx + s) % 9];
        const subSpanUnits = 1200 * DASHA_YEARS[subLord];
        const subStartUnits = nakStartUnits + cumulativeUnits;
        const subEndUnits = subStartUnits + subSpanUnits;
        const startLongitude = subStartUnits / SubLordCalculator.UNITS_PER_DEGREE;
        const endLongitude = subEndUnits / SubLordCalculator.UNITS_PER_DEGREE;
        const startSign = Math.floor(subStartUnits / SubLordCalculator.SIGN_UNITS);
        const endSign = Math.floor((subEndUnits - SubLordCalculator.BOUNDARY_EPSILON) / SubLordCalculator.SIGN_UNITS);

        const pushEntry = (signIndex: number, startUnits: number, endUnits: number) => {
          const start = startUnits / SubLordCalculator.UNITS_PER_DEGREE;
          const end = endUnits / SubLordCalculator.UNITS_PER_DEGREE;
          table.push({
            seed: seedCounter++,
            signIndex,
            signName: SubLordCalculator.getSignName(signIndex),
            signLord: SubLordCalculator.getSignLord(signIndex),
            nakshatraIndex: nakIdx,
            nakshatraName: nakshatra.name,
            starLord,
            subLord,
            startLongitude: start,
            endLongitude: end,
            centerLongitude: (start + end) / 2,
            spanDms: SubLordCalculator.formatDMS(start % 30) + " - " + SubLordCalculator.formatDMS(end % 30),
          });
        };

        if (startSign !== endSign) {
          const boundaryUnits = (startSign + 1) * SubLordCalculator.SIGN_UNITS;
          pushEntry(startSign, subStartUnits, boundaryUnits);
          pushEntry(endSign, boundaryUnits, subEndUnits);
        } else {
          pushEntry(startSign, subStartUnits, subEndUnits);
        }

        cumulativeUnits += subSpanUnits;
      }
    }

    SubLordCalculator.cached249Table = table;
    return table;
  }

  /**
   * Generates the 2,193 KP sub-sub table: 2,187 proportional sub-subs plus
   * the six sign-boundary splits. Build it from 243 unsplit nakshatra subs;
   * subdividing an already split 249-row table would count the six splits
   * nine times and incorrectly produce 2,241 rows.
   */
  public static generate2193Table(): KP2193Entry[] {
    if (SubLordCalculator.cached2193Table) {
      return SubLordCalculator.cached2193Table;
    }

    const table: KP2193Entry[] = [];
    let seedCounter = 1;

    for (let nakIdx = 0; nakIdx < 27; nakIdx++) {
      const nakshatra = NAKSHATRAS[nakIdx];
      const starLord = nakshatra.lord;
      const starLordIdx = VIMSHOTTARI_CYCLE.indexOf(starLord as any);
      const nakStartUnits = nakIdx * SubLordCalculator.NAKSHATRA_UNITS;
      let cumulativeSubUnits = 0;

      for (let s = 0; s < 9; s++) {
        const subLord = VIMSHOTTARI_CYCLE[(starLordIdx + s) % 9];
        const subSpanUnits = 1200 * DASHA_YEARS[subLord];
        const subStartUnits = nakStartUnits + cumulativeSubUnits;
        let cumulativeSubSubUnits = 0;
        const subLordIdx = VIMSHOTTARI_CYCLE.indexOf(subLord as any);

        for (let ss = 0; ss < 9; ss++) {
          const subSubLord = VIMSHOTTARI_CYCLE[(subLordIdx + ss) % 9];
          const subSubSpanUnits = 10 * DASHA_YEARS[subLord] * DASHA_YEARS[subSubLord];
          const subSubStartUnits = subStartUnits + cumulativeSubSubUnits;
          const subSubEndUnits = subSubStartUnits + subSubSpanUnits;
          const startSign = Math.floor(subSubStartUnits / SubLordCalculator.SIGN_UNITS);
          const endSign = Math.floor((subSubEndUnits - SubLordCalculator.BOUNDARY_EPSILON) / SubLordCalculator.SIGN_UNITS);

          const pushEntry = (signIndex: number, startUnits: number, endUnits: number) => {
            const start = startUnits / SubLordCalculator.UNITS_PER_DEGREE;
            const end = endUnits / SubLordCalculator.UNITS_PER_DEGREE;
            table.push({
              seed: seedCounter++,
              signIndex,
              signName: SubLordCalculator.getSignName(signIndex),
              signLord: SubLordCalculator.getSignLord(signIndex),
              nakshatraIndex: nakIdx,
              nakshatraName: nakshatra.name,
              starLord,
              subLord,
              subSubLord,
              startLongitude: start,
              endLongitude: end,
              centerLongitude: (start + end) / 2,
              spanDms: SubLordCalculator.formatDMS(start % 30) + " - " + SubLordCalculator.formatDMS(end % 30),
            });
          };

          if (startSign !== endSign) {
            const boundaryUnits = (startSign + 1) * SubLordCalculator.SIGN_UNITS;
            pushEntry(startSign, subSubStartUnits, boundaryUnits);
            pushEntry(endSign, boundaryUnits, subSubEndUnits);
          } else {
            pushEntry(startSign, subSubStartUnits, subSubEndUnits);
          }

          cumulativeSubSubUnits += subSubSpanUnits;
        }

        cumulativeSubUnits += subSpanUnits;
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
