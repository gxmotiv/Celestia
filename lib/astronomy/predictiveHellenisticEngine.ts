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
import { isSunAboveHorizonInChart } from "./horizon";

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
  /** True on the L2 period where the sequence jumps opposite the L1 sign. */
  isLoosingOfBond?: boolean;
  /** Inclusive house count from the Lot of Fortune. */
  angleFromFortune?: number;
  peakRank?: "Major" | "Strong" | "Moderate" | "Weak" | null;
}

export interface ZodiacalReleasingReport {
  lotName: string;
  lotSign: string;
  currentL1Period: ReleasingPeriod;
  currentL2Period: ReleasingPeriod;
  allL1Periods: ReleasingPeriod[];
  allL2Periods: ReleasingPeriod[];
  peakPeriodsCount: number;
  interpretation: string;
  methodNote: string;
}

export class ZodiacalReleasingEngine {
  // Planetary minor years used by the Valens/Brennan 360-day-year convention.
  public static readonly SIGN_PERIODS: Record<string, number> = {
    Aries: 15, Taurus: 8, Gemini: 20, Cancer: 25,
    Leo: 19, Virgo: 20, Libra: 8, Scorpio: 15,
    Sagittarius: 12, Capricorn: 27, Aquarius: 30, Pisces: 12,
  };

  private static readonly SIGN_NAMES = ZODIAC_SIGNS.map((sign) => sign.name);
  private static readonly TOTAL_SIGN_PERIOD_UNITS = Object.values(ZodiacalReleasingEngine.SIGN_PERIODS)
    .reduce((sum, years) => sum + years, 0);
  private static readonly YEAR_DAYS = 360;
  private static readonly DAY_MS = 86400000;

  private makePeriod(
    level: "L1" | "L2",
    signIndex: number,
    startMs: number,
    endMs: number,
    fortuneSignIndex: number,
    isLoosingOfBond = false
  ): ReleasingPeriod {
    const sign = ZodiacalReleasingEngine.SIGN_NAMES[signIndex];
    const angleFromFortune = ((signIndex - fortuneSignIndex + 12) % 12) + 1;
    const peakRank: ReleasingPeriod["peakRank"] =
      angleFromFortune === 10 ? "Major" :
      angleFromFortune === 1 ? "Strong" :
      angleFromFortune === 7 ? "Moderate" :
      angleFromFortune === 4 ? "Weak" : null;
    return {
      level,
      sign,
      durationYears: (endMs - startMs) / (ZodiacalReleasingEngine.YEAR_DAYS * ZodiacalReleasingEngine.DAY_MS),
      startDate: new Date(startMs).toISOString(),
      endDate: new Date(endMs).toISOString(),
      isPeak: peakRank !== null,
      ruler: ProfectionsEngine.SIGN_RULERS[sign]?.ruler || "Sun",
      angleFromFortune,
      peakRank,
      isLoosingOfBond,
    };
  }

  /**
   * Calculate active L1/L2 periods from the selected Lot.
   *
   * Valens/Brennan convention: sign minor years, 360-day releasing years,
   * 30-day L2 months, angularity measured from the Lot of Fortune, and the
   * Loosing-of-the-Bond jump for L1 chapters that exceed one 211-month L2 lap.
   */
  public calculateReleasing(
    birthDate: Date,
    lotLongitude: number,
    lotName: "Spirit (Career & Purpose)" | "Fortune (Physical Health & Material Fortune)",
    referenceDate: Date = new Date(),
    lotOfFortuneLongitude: number = lotLongitude
  ): ZodiacalReleasingReport {
    if (!Number.isFinite(birthDate.getTime()) || !Number.isFinite(referenceDate.getTime())) {
      throw new RangeError("Zodiacal Releasing requires valid birth and reference dates.");
    }
    if (!Number.isFinite(lotLongitude) || !Number.isFinite(lotOfFortuneLongitude)) {
      throw new RangeError("Zodiacal Releasing requires finite Lot longitudes.");
    }
    if (referenceDate.getTime() < birthDate.getTime()) {
      throw new RangeError("The Zodiacal Releasing reference date cannot precede birth.");
    }

    const startSignIdx = Math.floor(normalizeDegrees(lotLongitude) / 30);
    const fortuneSignIdx = Math.floor(normalizeDegrees(lotOfFortuneLongitude) / 30);
    const lotSign = ZodiacalReleasingEngine.SIGN_NAMES[startSignIdx];
    const birthMs = birthDate.getTime();
    const nowMs = referenceDate.getTime();
    const yearMs = ZodiacalReleasingEngine.YEAR_DAYS * ZodiacalReleasingEngine.DAY_MS;

    const l1Periods: ReleasingPeriod[] = [];
    let l1Start = birthMs;
    let signIndex = startSignIdx;
    let currentL1: ReleasingPeriod | undefined;

    // Keep every elapsed L1 chapter plus twelve future chapters for context.
    for (let guard = 0; guard < 512; guard++) {
      const sign = ZodiacalReleasingEngine.SIGN_NAMES[signIndex];
      const durationYears = ZodiacalReleasingEngine.SIGN_PERIODS[sign];
      const l1End = l1Start + durationYears * yearMs;
      const period = this.makePeriod("L1", signIndex, l1Start, l1End, fortuneSignIdx);
      l1Periods.push(period);
      if (nowMs >= l1Start && nowMs < l1End) currentL1 = period;
      l1Start = l1End;
      signIndex = (signIndex + 1) % 12;

      if (currentL1 && l1Periods.length >= l1Periods.indexOf(currentL1) + 13) break;
      if (!currentL1 && l1Start > nowMs && l1Periods.length >= 12) break;
    }

    if (!currentL1) {
      throw new RangeError("Unable to locate the current L1 Zodiacal Releasing period.");
    }

    const currentL1Start = new Date(currentL1.startDate).getTime();
    const currentL1End = new Date(currentL1.endDate).getTime();
    const totalL2Months = (currentL1End - currentL1Start) / (30 * ZodiacalReleasingEngine.DAY_MS);
    const allL2Periods: ReleasingPeriod[] = [];
    let elapsedMonths = 0;
    const currentL1SignIndex = ZodiacalReleasingEngine.SIGN_NAMES.findIndex((name) => name === currentL1.sign);
    if (currentL1SignIndex < 0) {
      throw new RangeError("The active Zodiacal Releasing sign is not a recognized zodiac sign.");
    }
    let l2SignIndex = currentL1SignIndex;
    let loosingOfBondApplied = false;

    for (let guard = 0; elapsedMonths < totalL2Months - 1e-9 && guard < 36; guard++) {
      let isLoosingOfBond = false;
      if (guard === 12 && totalL2Months > ZodiacalReleasingEngine.TOTAL_SIGN_PERIOD_UNITS) {
        // After the first complete 12-sign L2 circuit, jump to the sign
        // opposite the parent L1 sign instead of repeating the parent sign.
        l2SignIndex = (currentL1SignIndex + 6) % 12;
        isLoosingOfBond = true;
        loosingOfBondApplied = true;
      }

      const subSign = ZodiacalReleasingEngine.SIGN_NAMES[l2SignIndex];
      const allottedMonths = ZodiacalReleasingEngine.SIGN_PERIODS[subSign];
      const actualMonths = Math.min(allottedMonths, totalL2Months - elapsedMonths);
      const subStart = currentL1Start + elapsedMonths * 30 * ZodiacalReleasingEngine.DAY_MS;
      const subEnd = Math.min(currentL1End, subStart + actualMonths * 30 * ZodiacalReleasingEngine.DAY_MS);
      allL2Periods.push(this.makePeriod("L2", l2SignIndex, subStart, subEnd, fortuneSignIdx, isLoosingOfBond));
      elapsedMonths += actualMonths;
      l2SignIndex = (l2SignIndex + 1) % 12;
    }

    const currentL2 = allL2Periods.find((period) => {
      const start = new Date(period.startDate).getTime();
      const end = new Date(period.endDate).getTime();
      return nowMs >= start && nowMs < end;
    });
    if (!currentL2) {
      throw new RangeError("Unable to locate the current L2 Zodiacal Releasing period.");
    }

    const peakPeriodsCount = l1Periods.filter((period) => period.isPeak).length;
    const interpretation =
      `Zodiacal Releasing from ${lotName} (${lotSign}) uses 360-day years. Current L1: ${currentL1.sign} (${currentL1.startDate.slice(0, 10)} to ${currentL1.endDate.slice(0, 10)}); current L2: ${currentL2.sign}. ` +
      (currentL1.peakRank ? `This L1 sign is ${currentL1.peakRank.toLowerCase()} and angular to the Lot of Fortune.` : "This L1 sign is not angular to the Lot of Fortune.") +
      (currentL2.isLoosingOfBond || loosingOfBondApplied ? " A Loosing-of-the-Bond transition occurs in this L1 chapter." : "");

    return {
      lotName,
      lotSign,
      currentL1Period: currentL1,
      currentL2Period: currentL2,
      allL1Periods: l1Periods,
      allL2Periods,
      peakPeriodsCount,
      interpretation,
      methodNote: "Valens/Brennan-style reconstruction: 360-day releasing year, 30-day L2 month, sign minor years, angularity from the Lot of Fortune, and Loosing of the Bond after a full 211-month L2 circuit. This is one documented convention; other reconstructions differ.",
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
    if (!Number.isFinite(currentAge) || currentAge < 0) {
      throw new RangeError("Firdaria age must be a finite non-negative number of tropical years.");
    }
    // Sect is based on actual solar altitude, not whichever house system the
    // user selected for the displayed Western wheel.
    const isDiurnal = isSunAboveHorizonInChart(chart);
    const sequence = isDiurnal ? FirdariaEngine.DIURNAL_LORDS : FirdariaEngine.NOCTURNAL_LORDS;
    const sevenPlanetSequence = sequence.slice(0, 7);
    const periods: FirdariaPeriod[] = [];
    const cycleNumber = Math.floor(currentAge / 75);
    const ageWithinCycle = currentAge - cycleNumber * 75;
    const cycleStartAge = cycleNumber * 75;

    let cumulativeYears = 0;
    let activeMajor = sequence[0].planet;
    let activeSub = "No active sub-period";
    let activeRange = "";

    sequence.forEach((item, itemIndex) => {
      const localStart = cumulativeYears;
      const localEnd = cumulativeYears + item.years;
      const startAge = cycleStartAge + localStart;
      const endAge = cycleStartAge + localEnd;
      const subPeriods: FirdariaPeriod["subPeriods"] = [];

      // The seven classical planetary major periods are divided into seven
      // sub-periods, beginning with that major ruler and continuing in the
      // same sect-specific Chaldean sequence. Node majors have no sub-periods.
      if (itemIndex < 7) {
        const majorPosition = sevenPlanetSequence.findIndex((period) => period.planet === item.planet);
        const subYears = item.years / 7;
        for (let subIndex = 0; subIndex < 7; subIndex++) {
          const subLord = sevenPlanetSequence[(majorPosition + subIndex) % 7].planet;
          const subStart = startAge + subIndex * subYears;
          const subEnd = subIndex === 6 ? endAge : startAge + (subIndex + 1) * subYears;
          subPeriods.push({ subLord, startAge: subStart, endAge: subEnd });
          if (ageWithinCycle >= localStart && ageWithinCycle < localEnd &&
              currentAge >= subStart && currentAge < subEnd) {
            activeSub = subLord;
          }
        }
      }

      if (ageWithinCycle >= localStart && ageWithinCycle < localEnd) {
        activeMajor = item.planet;
        activeRange = `Age ${startAge.toFixed(2)} to ${endAge.toFixed(2)}`;
        if (itemIndex >= 7) activeSub = "No sub-period in this node-period variant";
      }

      periods.push({
        planet: item.planet,
        symbol: item.symbol,
        years: item.years,
        startAge,
        endAge,
        subPeriods,
      });
      cumulativeYears = localEnd;
    });

    return {
      isDiurnal,
      activeMajorLord: activeMajor,
      activeSubLord: activeSub,
      activeYearsRange: activeRange,
      allPeriods: periods,
      interpretation: `Under the medieval ${isDiurnal ? "day" : "night"} Firdaria sequence, cycle ${cycleNumber + 1} is active. Current major ruler: ${activeMajor} (${activeRange}); sub-ruler: ${activeSub}.`,
    };
  }
}
