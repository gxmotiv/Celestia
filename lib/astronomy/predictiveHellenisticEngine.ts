/**
 * Western Predictive Techniques Engine:
 * 1. Secondary Progressions ("Day for a Year" with Progressed Moon Sign Changes & 27.3-yr Lunar Phases)
 * 2. Transit Timing System (Exact dates, orb curves, retrogrades, influence periods)
 * 3. Hellenistic Annual Profections (12-year house cycles & Lord of the Year)
 * 4. Zodiacal Releasing from Spirit & Fortune (Major L1, L2, L3 periods and Peak times)
 * 5. Medieval Firdaria (Chaldean planetary periods based on Day/Night Sect)
 */

import {
  WesternChartData,
  PlanetPosition,
  calculateJulianDay,
  calculateWesternChart,
  normalizeDegrees,
  formatDegreeMinute,
  ZODIAC_SIGNS,
} from "./ephemeris";
import { swissEphemeris } from "./swissEphemeris";

// ---------------------------------------------------------------------------
// 1. SECONDARY PROGRESSIONS
// ---------------------------------------------------------------------------

export interface MoonSignChangeEvent {
  age: number;
  year: number;
  fromSign: string;
  toSign: string;
  interpretation: string;
}

export interface ProgressedChartResult {
  age: number;
  progressedDate: string;
  progressedPlanets: PlanetPosition[];
  progressedSun: PlanetPosition;
  progressedMoon: PlanetPosition;
  progressedMoonPhase: {
    phaseName: string;
    illumination: number;
    angle: number;
    interpretation: string;
  };
  moonSignChanges: MoonSignChangeEvent[];
  keyHighlights: string[];
}

export class ProgressionsEngine {
  public calculateProgressions(
    birthDate: Date,
    currentDate: Date,
    lat: number,
    lon: number,
    timezoneOffset: number
  ): ProgressedChartResult {
    const diffMs = currentDate.getTime() - birthDate.getTime();
    const ageYears = diffMs / (365.2422 * 86400000);
    const age = Math.max(0, Math.floor(ageYears));

    // Secondary progression: 1 day after birth = 1 year of life
    const progressedTimeMs = birthDate.getTime() + ageYears * 86400000;
    const progDateObj = new Date(progressedTimeMs);

    const progChart = calculateWesternChart(
      progDateObj.getUTCFullYear(),
      progDateObj.getUTCMonth() + 1,
      progDateObj.getUTCDate(),
      progDateObj.getUTCHours(),
      progDateObj.getUTCMinutes(),
      lat,
      lon,
      0,
      "Placidus"
    );

    const progSun = progChart.planets.find((p) => p.name === "Sun") || progChart.planets[0];
    const progMoon = progChart.planets.find((p) => p.name === "Moon") || progChart.planets[1];

    // Progressed Moon phase (Moon minus Sun)
    const phaseAngle = normalizeDegrees(progMoon.longitude - progSun.longitude);
    let phaseName = "Progressed New Moon";
    let phaseInterp = "Initiation of a fresh 29.5-year evolutionary life chapter. Sowing quiet seeds.";

    if (phaseAngle >= 45 && phaseAngle < 90) {
      phaseName = "Progressed Crescent Moon";
      phaseInterp = "Overcoming resistance, asserting momentum, taking courageous first steps.";
    } else if (phaseAngle >= 90 && phaseAngle < 135) {
      phaseName = "Progressed First Quarter Moon";
      phaseInterp = "Action in crisis: building solid structures, tests of will and commitment.";
    } else if (phaseAngle >= 135 && phaseAngle < 180) {
      phaseName = "Progressed Gibbous Moon";
      phaseInterp = "Honing mastery, analytical adjustments, preparing for culmination.";
    } else if (phaseAngle >= 180 && phaseAngle < 225) {
      phaseName = "Progressed Full Moon";
      phaseInterp = "Culmination and peak illumination: the grand harvest of the 29-year cycle.";
    } else if (phaseAngle >= 225 && phaseAngle < 270) {
      phaseName = "Progressed Disseminating Moon";
      phaseInterp = "Sharing wisdom, teaching, distributing achievements to the collective.";
    } else if (phaseAngle >= 270 && phaseAngle < 315) {
      phaseName = "Progressed Last Quarter Moon";
      phaseInterp = "Re-evaluation of beliefs, shedding outworn structures, turning inward.";
    } else if (phaseAngle >= 315) {
      phaseName = "Progressed Balsamic Moon";
      phaseInterp = "Incubation and surrender: resting before the next cyclical rebirth.";
    }

    // Moon changes signs roughly every 2.3 to 2.5 years
    const moonSignChanges: MoonSignChangeEvent[] = [];
    const currentYear = currentDate.getFullYear();

    for (let delta = -2; delta <= 10; delta++) {
      const checkAge = age + delta;
      const checkTimeMs = birthDate.getTime() + checkAge * 86400000;
      const nextTimeMs = birthDate.getTime() + (checkAge + 1) * 86400000;

      const d1 = new Date(checkTimeMs);
      const d2 = new Date(nextTimeMs);

      const jd1 = swissEphemeris.calculateJulianDay(d1.getUTCFullYear(), d1.getUTCMonth() + 1, d1.getUTCDate(), d1.getUTCHours(), d1.getUTCMinutes());
      const jd2 = swissEphemeris.calculateJulianDay(d2.getUTCFullYear(), d2.getUTCMonth() + 1, d2.getUTCDate(), d2.getUTCHours(), d2.getUTCMinutes());

      const moonPos1 = swissEphemeris.calculatePlanetPosition(swissEphemeris.MOON, jd1);
      const moonPos2 = swissEphemeris.calculatePlanetPosition(swissEphemeris.MOON, jd2);

      if (moonPos1.sign !== moonPos2.sign) {
        moonSignChanges.push({
          age: checkAge,
          year: currentYear + delta,
          fromSign: moonPos1.sign,
          toSign: moonPos2.sign,
          interpretation: `Progressed Moon shifts into ${moonPos2.sign}: A 2.5-year chapter focusing emotional focus, lifestyle habits, and instincts into ${moonPos2.sign} themes.`,
        });
      }
    }

    return {
      age,
      progressedDate: progDateObj.toLocaleDateString(),
      progressedPlanets: progChart.planets,
      progressedSun: progSun,
      progressedMoon: progMoon,
      progressedMoonPhase: {
        phaseName,
        illumination: Math.round(((1 - Math.cos(phaseAngle * Math.PI / 180)) / 2) * 100),
        angle: Math.round(phaseAngle * 100) / 100,
        interpretation: phaseInterp,
      },
      moonSignChanges,
      keyHighlights: [
        `Progressed Sun in ${progSun.sign} (${progSun.signDegreeFormatted}): Core life vitality evolution.`,
        `Progressed Moon in ${progMoon.sign} (${progMoon.signDegreeFormatted}): Current emotional climate.`,
        `Progressed Lunar Phase: ${phaseName} (${Math.round(phaseAngle)}° ahead of Sun).`,
      ],
    };
  }
}

// ---------------------------------------------------------------------------
// 2. HELLENISTIC ANNUAL PROFECTIONS
// ---------------------------------------------------------------------------

export interface ProfectionResult {
  age: number;
  profectionHouse: number;
  profectionSign: string;
  lordOfTheYear: string;
  lordSymbol: string;
  theme: string;
  focusAreas: string[];
  interpretation: string;
}

export class ProfectionsEngine {
  public static readonly SIGN_RULERS: Record<string, { ruler: string; symbol: string }> = {
    Aries: { ruler: "Mars", symbol: "♂" },
    Taurus: { ruler: "Venus", symbol: "♀" },
    Gemini: { ruler: "Mercury", symbol: "☿" },
    Cancer: { ruler: "Moon", symbol: "☽" },
    Leo: { ruler: "Sun", symbol: "☉" },
    Virgo: { ruler: "Mercury", symbol: "☿" },
    Libra: { ruler: "Venus", symbol: "♀" },
    Scorpio: { ruler: "Mars", symbol: "♂" },
    Sagittarius: { ruler: "Jupiter", symbol: "♃" },
    Capricorn: { ruler: "Saturn", symbol: "♄" },
    Aquarius: { ruler: "Saturn", symbol: "♄" },
    Pisces: { ruler: "Jupiter", symbol: "♃" },
  };

  public static readonly HOUSE_THEMES: Record<number, { theme: string; focus: string[] }> = {
    1: { theme: "Self, Vitality & New Beginnings", focus: ["Physical body", "Personal identity", "Initiation", "Appearance"] },
    2: { theme: "Finances, Possessions & Values", focus: ["Income sources", "Material assets", "Self-worth", "Expenditures"] },
    3: { theme: "Mind, Siblings & Local Environment", focus: ["Learning", "Writing/speech", "Short trips", "Neighborhood"] },
    4: { theme: "Home, Family, Roots & Ancestry", focus: ["Living situation", "Parents", "Private sanctuary", "Real estate"] },
    5: { theme: "Creativity, Romance & Joy", focus: ["Artistic output", "Romantic pleasure", "Children", "Play"] },
    6: { theme: "Health, Daily Routines & Service", focus: ["Physical health", "Work ethic", "Habits", "Pets"] },
    7: { theme: "Partnerships, Marriage & Contracts", focus: ["Committed relationships", "Business partners", "Agreements", "Open adversaries"] },
    8: { theme: "Shared Resources, Debt & Rebirth", focus: ["Investments", "Taxes/Inheritance", "Psychological transformation", "Mortality"] },
    9: { theme: "Higher Learning, Philosophy & Travel", focus: ["Foreign journeys", "Spiritual quests", "Publishing", "Universities"] },
    10: { theme: "Career, Public Standing & Honor", focus: ["Vocation", "Social status", "Promotions", "Reputation"] },
    11: { theme: "Friends, Alliances & Future Hopes", focus: ["Community networks", "Benefactors", "Collective aspirations", "Collaborations"] },
    12: { theme: "Solitude, Surrender & Healing", focus: ["Spiritual retreats", "Hidden matters", "Subconscious release", "Rest"] },
  };

  public calculateAnnualProfection(birthChart: WesternChartData, currentAge: number): ProfectionResult {
    // Profection advances 1 house per year from the Ascendant sign (Age 0 = House 1)
    const houseIndex = currentAge % 12; // 0 to 11
    const profectionHouse = houseIndex + 1; // 1 to 12

    // Sign of the profection house
    const ascSign = birthChart.ascendant.sign;
    const ascSignIdx = ZODIAC_SIGNS.findIndex((s) => s.name === ascSign);
    const profSignIdx = (ascSignIdx + houseIndex) % 12;
    const profectionSign = ZODIAC_SIGNS[profSignIdx]?.name || "Aries";

    const rulerInfo = ProfectionsEngine.SIGN_RULERS[profectionSign] || { ruler: "Sun", symbol: "☉" };
    const houseInfo = ProfectionsEngine.HOUSE_THEMES[profectionHouse];

    const interpretation = `At age ${currentAge}, you enter a ${profectionHouse}th House Profection Year ruled by ${profectionSign}. The Lord of the Year is ${rulerInfo.ruler} (${rulerInfo.symbol}). This year places paramount emphasis on ${houseInfo.theme.toLowerCase()}. Transits to and from ${rulerInfo.ruler} will carry outsized significance in shaping your major life events throughout this annual cycle.`;

    return {
      age: currentAge,
      profectionHouse,
      profectionSign,
      lordOfTheYear: rulerInfo.ruler,
      lordSymbol: rulerInfo.symbol,
      theme: houseInfo.theme,
      focusAreas: houseInfo.focus,
      interpretation,
    };
  }
}

// ---------------------------------------------------------------------------
// 3. ZODIACAL RELEASING (Spirit & Fortune)
// ---------------------------------------------------------------------------

export interface ReleasingPeriod {
  level: "L1" | "L2";
  sign: string;
  durationYears: number;
  startDate: string;
  endDate: string;
  isPeak: boolean;
  ruler: string;
}

export interface ZodiacalReleasingReport {
  lotName: string;
  lotSign: string;
  currentL1Period: ReleasingPeriod;
  currentL2Period: ReleasingPeriod;
  allL1Periods: ReleasingPeriod[];
  peakPeriodsCount: number;
  interpretation: string;
}

export class ZodiacalReleasingEngine {
  /** Traditional Valens/Brennan sign-period allotments in ideal years. */
  public static readonly SIGN_PERIODS: Record<string, number> = {
    Aries: 15, Taurus: 8, Gemini: 20, Cancer: 25, Leo: 19, Virgo: 20,
    Libra: 8, Scorpio: 15, Sagittarius: 12, Capricorn: 27, Aquarius: 30, Pisces: 12,
  };

  private static readonly IDEAL_YEAR_DAYS = 360;
  private static readonly IDEAL_MONTH_DAYS = 30;

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private makePeriod(
    level: "L1" | "L2", sign: string, start: Date, end: Date, lotSignIdx: number
  ): ReleasingPeriod {
    const durationDays = (end.getTime() - start.getTime()) / 86400000;
    const signIdx = ZODIAC_SIGNS.findIndex((item) => item.name === sign);
    const distance = (signIdx - lotSignIdx + 12) % 12;
    return {
      level, sign,
      durationYears: Math.round((durationDays / ZodiacalReleasingEngine.IDEAL_YEAR_DAYS) * 10000) / 10000,
      startDate: this.formatDate(start),
      endDate: this.formatDate(end),
      isPeak: distance === 0 || distance === 3 || distance === 6 || distance === 9,
      ruler: ProfectionsEngine.SIGN_RULERS[sign]?.ruler || "Sun",
    };
  }

  public calculateReleasing(
    birthDate: Date,
    lotLongitude: number,
    lotName: "Spirit (Career & Purpose)" | "Fortune (Physical Health & Material Fortune)",
    currentDate: Date = new Date()
  ): ZodiacalReleasingReport {
    if (!Number.isFinite(lotLongitude) || lotLongitude < 0 || lotLongitude >= 360) {
      throw new RangeError("Zodiacal Releasing requires a Lot longitude from 0° inclusive to 360° exclusive.");
    }
    if (!Number.isFinite(birthDate.getTime()) || !Number.isFinite(currentDate.getTime())) {
      throw new RangeError("Zodiacal Releasing requires valid birth and current dates.");
    }
    if (currentDate.getTime() < birthDate.getTime()) {
      throw new RangeError("The current date cannot be earlier than the birth date.");
    }

    const lotSignIdx = Math.floor(lotLongitude / 30);
    const lotSign = ZODIAC_SIGNS[lotSignIdx].name;
    const periods: ReleasingPeriod[] = [];
    let cursor = new Date(birthDate.getTime());
    let signIdx = lotSignIdx;
    let signsProcessed = 0;
    const horizon = currentDate.getTime() + 30 * ZodiacalReleasingEngine.IDEAL_YEAR_DAYS * 86400000;

    // L1: one sign-period allotment per major chapter. After the first 12 signs,
    // Valens' Loosing of the Bond jumps from the Lot sign to its opposite.
    while (periods.length < 60 && cursor.getTime() <= horizon) {
      const sign = ZODIAC_SIGNS[signIdx].name;
      const days = ZodiacalReleasingEngine.SIGN_PERIODS[sign] * ZodiacalReleasingEngine.IDEAL_YEAR_DAYS;
      const next = new Date(cursor.getTime() + days * 86400000);
      periods.push(this.makePeriod("L1", sign, cursor, next, lotSignIdx));
      cursor = next;
      signsProcessed += 1;
      if (signsProcessed === 12) {
        signIdx = (lotSignIdx + 6) % 12;
      } else {
        signIdx = (signIdx + 1) % 12;
      }
    }

    const currentL1 = periods.find((period) => {
      const startMs = Date.parse(period.startDate + "T00:00:00.000Z");
      const endMs = Date.parse(period.endDate + "T00:00:00.000Z");
      return currentDate.getTime() >= startMs && currentDate.getTime() < endMs;
    });
    if (!currentL1) throw new Error("Unable to locate the active Zodiacal Releasing L1 period.");

    // L2: begin again from the active L1 sign. Each sign receives its minor-year
    // allotment in ideal months (30 days); the final subperiod is truncated at
    // the exact parent L1 boundary. Loosing of the Bond is applied after 12 signs.
    const parentStart = new Date(Date.parse(currentL1.startDate + "T00:00:00.000Z"));
    const parentEnd = new Date(Date.parse(currentL1.endDate + "T00:00:00.000Z"));
    const parentSignIdx = ZODIAC_SIGNS.findIndex((item) => item.name === currentL1.sign);
    let l2SignIdx = parentSignIdx;
    let l2Cursor = parentStart;
    let l2Count = 0;
    let currentL2: ReleasingPeriod | undefined;
    while (l2Cursor.getTime() < parentEnd.getTime() && l2Count < 24) {
      const sign = ZODIAC_SIGNS[l2SignIdx].name;
      const idealDays = ZodiacalReleasingEngine.SIGN_PERIODS[sign] * ZodiacalReleasingEngine.IDEAL_MONTH_DAYS;
      const candidateEnd = new Date(l2Cursor.getTime() + idealDays * 86400000);
      const subEnd = candidateEnd.getTime() > parentEnd.getTime() ? parentEnd : candidateEnd;
      const subperiod = this.makePeriod("L2", sign, l2Cursor, subEnd, lotSignIdx);
      const startMs = l2Cursor.getTime();
      if (currentDate.getTime() >= startMs && currentDate.getTime() < subEnd.getTime()) {
        currentL2 = subperiod;
      }
      l2Cursor = subEnd;
      l2Count += 1;
      if (l2Count === 12) {
        l2SignIdx = (parentSignIdx + 6) % 12;
      } else {
        l2SignIdx = (l2SignIdx + 1) % 12;
      }
    }
    if (!currentL2) throw new Error("Unable to locate the active Zodiacal Releasing L2 period.");

    const peakCount = periods.filter((period) => period.isPeak).length;
    const interpretation = "Zodiacal Releasing from " + lotName + " begins in " + lotSign + ". " +
      "The active L1 chapter is " + currentL1.sign + " (" + currentL1.ruler + "), from " +
      currentL1.startDate + " to " + currentL1.endDate + "; the active L2 subperiod is " +
      currentL2.sign + " (" + currentL2.ruler + "). Periods use the traditional 360-day ideal year, " +
      "30-day ideal month, parent-boundary truncation, and the opposite-sign Loosing of the Bond after the first 12-sign circuit.";

    return {
      lotName, lotSign, currentL1Period: currentL1, currentL2Period: currentL2,
      allL1Periods: periods, peakPeriodsCount: peakCount, interpretation,
    };
  }
}
// ---------------------------------------------------------------------------
// 4. MEDIEVAL FIRDARIA
// ---------------------------------------------------------------------------

export interface FirdariaPeriod {
  planet: string;
  symbol: string;
  years: number;
  startAge: number;
  endAge: number;
  subPeriods: Array<{ subLord: string; startAge: number; endAge: number }>;
}

export interface FirdariaReport {
  isDiurnal: boolean;
  activeMajorLord: string;
  activeSubLord: string;
  activeYearsRange: string;
  allPeriods: FirdariaPeriod[];
  interpretation: string;
}

export class FirdariaEngine {
  // Diurnal Order: Sun (10), Venus (8), Mercury (13), Moon (9), Saturn (11), Jupiter (12), Mars (7), North Node (3), South Node (2)
  private static readonly DIURNAL_LORDS = [
    { planet: "Sun", symbol: "☉", years: 10 },
    { planet: "Venus", symbol: "♀", years: 8 },
    { planet: "Mercury", symbol: "☿", years: 13 },
    { planet: "Moon", symbol: "☽", years: 9 },
    { planet: "Saturn", symbol: "♄", years: 11 },
    { planet: "Jupiter", symbol: "♃", years: 12 },
    { planet: "Mars", symbol: "♂", years: 7 },
    { planet: "NorthNode", symbol: "☊", years: 3 },
    { planet: "SouthNode", symbol: "☋", years: 2 },
  ];

  // Nocturnal Order: Moon (9), Saturn (11), Jupiter (12), Mars (7), Sun (10), Venus (8), Mercury (13), North Node (3), South Node (2)
  private static readonly NOCTURNAL_LORDS = [
    { planet: "Moon", symbol: "☽", years: 9 },
    { planet: "Saturn", symbol: "♄", years: 11 },
    { planet: "Jupiter", symbol: "♃", years: 12 },
    { planet: "Mars", symbol: "♂", years: 7 },
    { planet: "Sun", symbol: "☉", years: 10 },
    { planet: "Venus", symbol: "♀", years: 8 },
    { planet: "Mercury", symbol: "☿", years: 13 },
    { planet: "NorthNode", symbol: "☊", years: 3 },
    { planet: "SouthNode", symbol: "☋", years: 2 },
  ];

  public calculateFirdaria(chart: WesternChartData, currentAge: number): FirdariaReport {
    // Diurnal if Sun is in Houses 7 through 12
    const sunHouse = chart.planets.find((p) => p.name === "Sun")?.house || 1;
    const isDiurnal = sunHouse >= 7 && sunHouse <= 12;

    const sequence = isDiurnal ? FirdariaEngine.DIURNAL_LORDS : FirdariaEngine.NOCTURNAL_LORDS;
    const periods: FirdariaPeriod[] = [];

    let cumAge = 0;
    let activeMajor = sequence[0].planet;
    let activeSub = sequence[0].planet;
    let activeRange = "";

    sequence.forEach((item) => {
      const start = cumAge;
      const end = cumAge + item.years;
      const subYears = item.years / 7;

      const subPeriods: FirdariaPeriod["subPeriods"] = [];
      for (let s = 0; s < 7; s++) {
        const subStart = Math.round((start + s * subYears) * 10) / 10;
        const subEnd = Math.round((start + (s + 1) * subYears) * 10) / 10;
        const subLord = sequence[s % 7].planet;
        subPeriods.push({ subLord, startAge: subStart, endAge: subEnd });

        if (currentAge >= subStart && currentAge < subEnd) {
          activeSub = subLord;
        }
      }

      if (currentAge >= start && currentAge < end) {
        activeMajor = item.planet;
        activeRange = `Age ${start} to ${end}`;
      }

      periods.push({
        planet: item.planet,
        symbol: item.symbol,
        years: item.years,
        startAge: start,
        endAge: end,
        subPeriods,
      });

      cumAge = end;
    });

    return {
      isDiurnal,
      activeMajorLord: activeMajor,
      activeSubLord: activeSub,
      activeYearsRange: activeRange,
      allPeriods: periods,
      interpretation: `Under the medieval ${isDiurnal ? "Day (Diurnal)" : "Night (Nocturnal)"} Firdaria cycle, your current life master is ${activeMajor} (${activeRange}), with the active sub-ruler ${activeSub} shaping daily events and opportunities.`,
    };
  }
}
