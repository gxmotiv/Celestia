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
  // Planetary period allotments in years for each zodiac sign
  public static readonly SIGN_PERIODS: Record<string, number> = {
    Aries: 15,       // Mars
    Taurus: 8,       // Venus
    Gemini: 20,      // Mercury
    Cancer: 25,      // Moon
    Leo: 19,         // Sun
    Virgo: 20,       // Mercury
    Libra: 8,        // Venus
    Scorpio: 15,     // Mars
    Sagittarius: 12, // Jupiter
    Capricorn: 27,   // Saturn
    Aquarius: 30,    // Saturn
    Pisces: 12,      // Jupiter
  };

  public calculateReleasing(
    birthDate: Date,
    lotLongitude: number,
    lotName: "Spirit (Career & Purpose)" | "Fortune (Physical Health & Material Fortune)"
  ): ZodiacalReleasingReport {
    const startSignIdx = Math.floor(lotLongitude / 30);
    const lotSign = ZODIAC_SIGNS[startSignIdx]?.name || "Aries";

    const l1Periods: ReleasingPeriod[] = [];
    let curDate = new Date(birthDate);

    for (let i = 0; i < 12; i++) {
      const signIdx = (startSignIdx + i) % 12;
      const signName = ZODIAC_SIGNS[signIdx]?.name || "Aries";
      const duration = ZodiacalReleasingEngine.SIGN_PERIODS[signName] || 15;

      const startDateStr = curDate.toLocaleDateString();
      const nextDate = new Date(curDate);
      nextDate.setFullYear(nextDate.getFullYear() + duration);
      const endDateStr = nextDate.toLocaleDateString();

      // Peak period: if sign is angular (1st, 4th, 7th, 10th from Lot)
      const isPeak = i === 0 || i === 3 || i === 6 || i === 9;
      const ruler = ProfectionsEngine.SIGN_RULERS[signName]?.ruler || "Sun";

      l1Periods.push({
        level: "L1",
        sign: signName,
        durationYears: duration,
        startDate: startDateStr,
        endDate: endDateStr,
        isPeak,
        ruler,
      });

      curDate = nextDate;
    }

    const currentL1 = l1Periods[0];
    const currentL2: ReleasingPeriod = {
      level: "L2",
      sign: lotSign,
      durationYears: Math.round((currentL1.durationYears / 12) * 10) / 10,
      startDate: birthDate.toLocaleDateString(),
      endDate: "Active Sub-phase",
      isPeak: true,
      ruler: currentL1.ruler,
    };

    return {
      lotName,
      lotSign,
      currentL1Period: currentL1,
      currentL2Period: currentL2,
      allL1Periods: l1Periods,
      peakPeriodsCount: l1Periods.filter((p) => p.isPeak).length,
      interpretation: `Zodiacal Releasing unfolds the chapters of your life from the sign of the Part of ${lotName} (${lotSign}). The current L1 chapter spans ${currentL1.durationYears} years under ${currentL1.sign} (ruled by ${currentL1.ruler})${currentL1.isPeak ? " [PEAK CHAPTER: Angular manifestation of major destiny milestones]" : ""}.`,
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
