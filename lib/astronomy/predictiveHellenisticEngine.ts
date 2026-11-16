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

/**
 * Returns completed Gregorian birth anniversaries for a UTC birth instant.
 * The caller should first normalize the recorded civil birth date/time and
 * applicable fixed UTC offset to UTC. With an offset-only birth record, this
 * uses that same offset for the anniversary; historical DST transitions
 * cannot be reconstructed without an IANA timezone identifier. Feb 29
 * anniversaries follow JavaScript's March 1 normalization in non-leap years.
 */
export function calculateCompletedAge(birthDate: Date, currentDate: Date): number {
  const birthMs = birthDate.getTime();
  const currentMs = currentDate.getTime();
  if (!Number.isFinite(birthMs) || !Number.isFinite(currentMs) || currentMs < birthMs) {
    return 0;
  }

  let age = currentDate.getUTCFullYear() - birthDate.getUTCFullYear();
  const anniversary = new Date(birthMs);
  anniversary.setUTCFullYear(birthDate.getUTCFullYear() + age);

  if (anniversary.getTime() > currentMs) {
    age -= 1;
  }

  return Math.max(0, age);
}

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
    const age = calculateCompletedAge(birthDate, currentDate);

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
    const currentYear = currentDate.getUTCFullYear();

    for (let delta = -2; delta <= 10; delta++) {
      const checkAge = age + delta;
      if (checkAge < 0) continue;
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
// 2. SOLAR ARC DIRECTIONS
// ---------------------------------------------------------------------------

export type SolarArcAspectName =
  | "Conjunction"
  | "Semisquare"
  | "Sextile"
  | "Square"
  | "Trine"
  | "Sesquiquadrate"
  | "Quincunx"
  | "Opposition";

export interface SolarArcDirectedPoint {
  name: string;
  symbol: string;
  natalLongitude: number;
  directedLongitude: number;
  sign: string;
  signDegreeFormatted: string;
}

export interface SolarArcDirectionContact {
  directedPoint: string;
  natalPoint: string;
  aspect: SolarArcAspectName;
  exactAngle: number;
  orb: number;
  directedLongitude: number;
  natalLongitude: number;
}

export interface SolarArcDirectionsReport {
  age: number;
  progressedDate: string;
  solarArcDegrees: number;
  maxOrb: number;
  directedPoints: SolarArcDirectedPoint[];
  contacts: SolarArcDirectionContact[];
  method: string;
}

/**
 * Solar Arc Directions applies the exact secondary-progressed solar arc
 * (progressed Sun longitude minus natal Sun longitude) to all natal planets
 * and angles. Contacts are directed-point to natal-point aspects. This
 * implementation uses the tropical zodiac and reports an explicit orb.
 */
export class SolarArcDirectionsEngine {
  private static readonly ASPECTS: Array<{
    name: SolarArcAspectName;
    angle: number;
  }> = [
    { name: "Conjunction", angle: 0 },
    { name: "Semisquare", angle: 45 },
    { name: "Sextile", angle: 60 },
    { name: "Square", angle: 90 },
    { name: "Trine", angle: 120 },
    { name: "Sesquiquadrate", angle: 135 },
    { name: "Quincunx", angle: 150 },
    { name: "Opposition", angle: 180 },
  ];

  private readonly progressionsEngine = new ProgressionsEngine();

  public calculateSolarArc(
    natalChart: WesternChartData,
    birthDate: Date,
    currentDate: Date,
    latitude: number,
    longitude: number,
    timezoneOffset: number,
    maxOrb = 1.0
  ): SolarArcDirectionsReport {
    const natalSun = natalChart.planets.find((planet) => planet.name === "Sun");
    if (!natalSun) {
      throw new Error("Solar Arc Directions requires a natal Sun position.");
    }

    const progressed = this.progressionsEngine.calculateProgressions(
      birthDate,
      currentDate,
      latitude,
      longitude,
      timezoneOffset
    );
    const solarArcDegrees = normalizeDegrees(
      progressed.progressedSun.longitude - natalSun.longitude
    );

    const natalPoints = [
      ...natalChart.planets,
      natalChart.ascendant,
      natalChart.midheaven,
    ];
    const directedPoints = natalPoints.map((point) => {
      const directedLongitude = normalizeDegrees(point.longitude + solarArcDegrees);
      return {
        name: point.name,
        symbol: point.symbol,
        natalLongitude: point.longitude,
        directedLongitude,
        sign: ZODIAC_SIGNS[Math.floor(directedLongitude / 30)]?.name || "Aries",
        signDegreeFormatted: formatDegreeMinute(directedLongitude),
      };
    });

    const contacts: SolarArcDirectionContact[] = [];
    directedPoints.forEach((directedPoint) => {
      natalPoints.forEach((natalPoint) => {
        // A directed point contacting its own natal position is a valid
        // direction, so self-pairs are retained (including solar arc Sun-Sun).
        const difference = Math.abs(
          directedPoint.directedLongitude - natalPoint.longitude
        );
        const separation = difference > 180 ? 360 - difference : difference;

        SolarArcDirectionsEngine.ASPECTS.forEach((aspect) => {
          const orb = Math.abs(separation - aspect.angle);
          if (orb <= maxOrb) {
            contacts.push({
              directedPoint: directedPoint.name,
              natalPoint: natalPoint.name,
              aspect: aspect.name,
              exactAngle: aspect.angle,
              orb: Math.round(orb * 1000) / 1000,
              directedLongitude: directedPoint.directedLongitude,
              natalLongitude: natalPoint.longitude,
            });
          }
        });
      });
    });

    contacts.sort((a, b) => a.orb - b.orb);

    return {
      age: progressed.age,
      progressedDate: progressed.progressedDate,
      solarArcDegrees: Math.round(solarArcDegrees * 10000) / 10000,
      maxOrb,
      directedPoints,
      contacts,
      method: "Exact secondary-progressed Sun longitude minus natal Sun longitude; the same tropical arc is added to natal planets, Ascendant and Midheaven. Contacts are directed-to-natal aspects.",
    };
  }
}

// ---------------------------------------------------------------------------
// 3. SOLAR RETURN CHARTS
// ---------------------------------------------------------------------------

export interface SolarReturnReport {
  targetYear: number;
  returnInstantUTC: string;
  natalSunLongitude: number;
  returnSunLongitude: number;
  latitude: number;
  longitude: number;
  houseSystem: WesternChartData["houseSystem"];
  returnChart: WesternChartData;
  method: string;
}

/**
 * Finds the exact annual tropical solar return by solving the instant at which
 * the transiting geocentric Sun reaches the natal Sun's longitude. A short
 * mean-motion estimate supplies the initial bracket; bisection refines the
 * crossing using the same SwissEphemeris facade as the natal chart.
 */
export class SolarReturnEngine {
  private static readonly DAY_MS = 86400000;
  private static readonly MEAN_SOLAR_MOTION = 360 / 365.2422;

  private calculateSunLongitude(instantMs: number): number {
    const date = new Date(instantMs);
    const julianDay = swissEphemeris.calculateJulianDay(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      0
    );
    return swissEphemeris.calculatePlanetPosition(
      swissEphemeris.SUN,
      julianDay
    ).longitude;
  }

  private signedAngularDifference(longitude: number, targetLongitude: number): number {
    let difference = normalizeDegrees(longitude - targetLongitude);
    if (difference > 180) difference -= 360;
    return difference;
  }

  public calculateSolarReturn(
    natalChart: WesternChartData,
    targetYear: number,
    latitude: number,
    longitude: number,
    houseSystem: WesternChartData["houseSystem"] = natalChart.houseSystem
  ): SolarReturnReport {
    if (!Number.isInteger(targetYear) || targetYear < 1 || targetYear > 9998) {
      throw new Error("Solar Return year must be a whole-number year between 1 and 9998.");
    }
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      throw new Error("Solar Return latitude must be between -90 and 90 degrees.");
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      throw new Error("Solar Return longitude must be between -180 and 180 degrees.");
    }

    const natalSun = natalChart.planets.find((planet) => planet.name === "Sun");
    if (!natalSun) {
      throw new Error("Solar Return requires a natal Sun longitude.");
    }

    const yearStartMs = Date.UTC(targetYear, 0, 1, 0, 0, 0);
    const yearStartLongitude = this.calculateSunLongitude(yearStartMs);
    const forwardArc = normalizeDegrees(natalSun.longitude - yearStartLongitude);
    const approximateReturnMs = yearStartMs
      + (forwardArc / SolarReturnEngine.MEAN_SOLAR_MOTION) * SolarReturnEngine.DAY_MS;

    let lowMs = 0;
    let highMs = 0;
    let bracketed = false;

    // The equation of center can move the actual crossing by around two days
    // from the mean-motion estimate. Expand defensively and require a signed
    // longitude crossing before starting bisection.
    for (const halfWidthDays of [2, 4, 8, 12]) {
      lowMs = approximateReturnMs - halfWidthDays * SolarReturnEngine.DAY_MS;
      highMs = approximateReturnMs + halfWidthDays * SolarReturnEngine.DAY_MS;
      const lowDifference = this.signedAngularDifference(
        this.calculateSunLongitude(lowMs),
        natalSun.longitude
      );
      const highDifference = this.signedAngularDifference(
        this.calculateSunLongitude(highMs),
        natalSun.longitude
      );

      if (lowDifference <= 0 && highDifference >= 0) {
        bracketed = true;
        break;
      }
    }

    if (!bracketed) {
      throw new Error(`Could not bracket the ${targetYear} Solar Return crossing.`);
    }

    let lowDifference = this.signedAngularDifference(
      this.calculateSunLongitude(lowMs),
      natalSun.longitude
    );
    for (let iteration = 0; iteration < 48; iteration++) {
      const midMs = (lowMs + highMs) / 2;
      const midDifference = this.signedAngularDifference(
        this.calculateSunLongitude(midMs),
        natalSun.longitude
      );
      if (midDifference < 0) {
        lowMs = midMs;
        lowDifference = midDifference;
      } else {
        highMs = midMs;
      }
      if (highMs - lowMs < 250) break;
    }

    const returnDate = new Date((lowMs + highMs) / 2);
    const returnChart = calculateWesternChart(
      returnDate.getUTCFullYear(),
      returnDate.getUTCMonth() + 1,
      returnDate.getUTCDate(),
      returnDate.getUTCHours(),
      returnDate.getUTCMinutes(),
      latitude,
      longitude,
      0,
      houseSystem,
      returnDate.getUTCSeconds()
    );
    const returnSun = returnChart.planets.find((planet) => planet.name === "Sun");
    if (!returnSun) {
      throw new Error("Solar Return chart did not contain a calculated Sun position.");
    }

    return {
      targetYear,
      returnInstantUTC: returnDate.toISOString(),
      natalSunLongitude: natalSun.longitude,
      returnSunLongitude: returnSun.longitude,
      latitude,
      longitude,
      houseSystem,
      returnChart,
      method: "Exact tropical return of the natal geocentric Sun longitude, solved with the shared SwissEphemeris facade and refined by bisection. Houses and angles use the supplied return-place coordinates; this panel defaults to the natal chart location.",
    };
  }
}

// ---------------------------------------------------------------------------
// 4. HELLENISTIC ANNUAL PROFECTIONS
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
// 5. ZODIACAL RELEASING (Spirit & Fortune)
// ---------------------------------------------------------------------------

export type ReleasingLevel = "L1" | "L2" | "L3" | "L4";

export interface ReleasingPeriod {
  level: ReleasingLevel;
  sign: string;
  /** Duration expressed as 360-day ideal years (fractional for L2-L4). */
  durationYears: number;
  /** Exact period length in days under the selected 360-day-year convention. */
  durationDays: number;
  startDate: string;
  endDate: string;
  isAngular: boolean;
  /** 1st, 4th, 7th, 10th from the Lot of Fortune; null if unavailable. */
  angleFromFortune: number | null;
  /** The 10th sign from Fortune is the traditional major peak. */
  isPeak: boolean;
  /** Marks the period immediately following a completed 12-sign circuit. */
  isLoosingBond: boolean;
  ruler: string;
}

export interface ZodiacalReleasingReport {
  lotName: string;
  lotSign: string;
  fortuneSign: string;
  releasingStartSign: string;
  currentL1Period: ReleasingPeriod;
  currentL2Period: ReleasingPeriod;
  currentL3Period: ReleasingPeriod;
  currentL4Period: ReleasingPeriod;
  allL1Periods: ReleasingPeriod[];
  currentL2Periods: ReleasingPeriod[];
  currentL3Periods: ReleasingPeriod[];
  currentL4Periods: ReleasingPeriod[];
  peakPeriodsCount: number;
  calculationStandard: string;
  interpretation: string;
}

type ReleasingPeriodInternal = ReleasingPeriod & {
  startMs: number;
  endMs: number;
};

export class ZodiacalReleasingEngine {
  /**
   * Valens/Brennan-style minor-year allotments used by the common 360-day
   * Zodiacal Releasing convention. Capricorn is 27; Aquarius remains 30.
   * Other historical variants exist, so the selected convention is reported.
   */
  public static readonly SIGN_PERIODS: Record<string, number> = {
    Aries: 15,
    Taurus: 8,
    Gemini: 20,
    Cancer: 25,
    Leo: 19,
    Virgo: 20,
    Libra: 8,
    Scorpio: 15,
    Sagittarius: 12,
    Capricorn: 27,
    Aquarius: 30,
    Pisces: 12,
  };

  public static readonly YEAR_LENGTH_DAYS = 360;
  private static readonly DAY_MS = 86400000;
  private static readonly SIGN_NAMES = ZODIAC_SIGNS.map((sign) => sign.name);

  private getAngleFromFortune(signIndex: number, fortuneIndex: number | null): number | null {
    if (fortuneIndex === null) return null;
    return ((signIndex - fortuneIndex + 12) % 12) + 1;
  }

  private buildPeriod(
    level: ReleasingLevel,
    signIndex: number,
    startMs: number,
    durationDays: number,
    fortuneIndex: number | null,
    isLoosingBond: boolean
  ): ReleasingPeriodInternal {
    const signName = ZodiacalReleasingEngine.SIGN_NAMES[signIndex] || "Aries";
    const angle = this.getAngleFromFortune(signIndex, fortuneIndex);
    const endMs = startMs + durationDays * ZodiacalReleasingEngine.DAY_MS;
    const startDate = new Date(startMs);
    const endDate = new Date(endMs);

    return {
      level,
      sign: signName,
      durationDays,
      durationYears: durationDays / ZodiacalReleasingEngine.YEAR_LENGTH_DAYS,
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
      isAngular: angle !== null && (angle === 1 || angle === 4 || angle === 7 || angle === 10),
      angleFromFortune: angle !== null && (angle === 1 || angle === 4 || angle === 7 || angle === 10) ? angle : null,
      isPeak: angle === 10,
      isLoosingBond,
      ruler: ProfectionsEngine.SIGN_RULERS[signName]?.ruler || "Sun",
      startMs,
      endMs,
    };
  }

  private getNextSignIndex(signIndex: number, loosenBond: boolean): number {
    // After a complete 12-sign circuit, the sequence resumes at the sign
    // opposite the sign that would otherwise have followed the parent sign.
    return (signIndex + 1 + (loosenBond ? 6 : 0)) % 12;
  }

  private generateL1Periods(
    startSignIndex: number,
    startMs: number,
    cutoffMs: number,
    fortuneIndex: number | null
  ): ReleasingPeriodInternal[] {
    const periods: ReleasingPeriodInternal[] = [];
    let signIndex = startSignIndex;
    let periodStart = startMs;
    let signsProcessed = 0;

    // Always retain one complete 12-sign L1 circuit for compatibility and context.
    while ((periodStart < cutoffMs || periods.length < 12) && periods.length < 10000) {
      const signName = ZodiacalReleasingEngine.SIGN_NAMES[signIndex] || "Aries";
      const durationDays = ZodiacalReleasingEngine.SIGN_PERIODS[signName] * ZodiacalReleasingEngine.YEAR_LENGTH_DAYS;
      periods.push(
        this.buildPeriod("L1", signIndex, periodStart, durationDays, fortuneIndex, signsProcessed === 12)
      );

      const loosenBond = signsProcessed === 11;
      signsProcessed += 1;
      signIndex = this.getNextSignIndex(signIndex, loosenBond);
      periodStart += durationDays * ZodiacalReleasingEngine.DAY_MS;
    }

    return periods;
  }

  private generateSubperiods(
    parent: ReleasingPeriodInternal,
    level: Exclude<ReleasingLevel, "L1">,
    fortuneIndex: number | null
  ): ReleasingPeriodInternal[] {
    if (!parent) {
      throw new Error(`Cannot generate ${level}: the active parent period was not found.`);
    }
    if (
      !Number.isFinite(parent.startMs)
      || !Number.isFinite(parent.endMs)
      || parent.endMs <= parent.startMs
    ) {
      throw new Error(
        `Cannot generate ${level}: invalid parent interval for ${parent.level} ${parent.sign} (${parent.startMs}–${parent.endMs}).`
      );
    }

    const periods: ReleasingPeriodInternal[] = [];
    const levelNumber = Number(level.slice(1));
    const unitDays = ZodiacalReleasingEngine.YEAR_LENGTH_DAYS / (12 ** (levelNumber - 1));
    const parentDurationMs = parent.endMs - parent.startMs;

    let signIndex = ZodiacalReleasingEngine.SIGN_NAMES.findIndex((sign) => sign === parent.sign);
    if (signIndex < 0) signIndex = 0;

    let elapsedMs = 0;
    let signsProcessed = 0;

    while (elapsedMs < parentDurationMs - 0.001 && periods.length < 10000) {
      const signName = ZodiacalReleasingEngine.SIGN_NAMES[signIndex] || "Aries";
      const idealDurationDays = ZodiacalReleasingEngine.SIGN_PERIODS[signName] * unitDays;
      const idealDurationMs = idealDurationDays * ZodiacalReleasingEngine.DAY_MS;
      const remainingMs = parentDurationMs - elapsedMs;
      const actualDurationMs = Math.min(idealDurationMs, remainingMs);
      const actualDurationDays = actualDurationMs / ZodiacalReleasingEngine.DAY_MS;
      const wasTruncated = actualDurationMs < idealDurationMs - 0.001;

      periods.push(
        this.buildPeriod(
          level,
          signIndex,
          parent.startMs + elapsedMs,
          actualDurationDays,
          fortuneIndex,
          signsProcessed === 12
        )
      );

      elapsedMs += actualDurationMs;
      if (wasTruncated) break;

      const loosenBond = signsProcessed === 11;
      signsProcessed += 1;
      signIndex = this.getNextSignIndex(signIndex, loosenBond);
    }

    return periods;
  }

  private findActivePeriod(periods: ReleasingPeriodInternal[], instantMs: number): ReleasingPeriodInternal {
    if (periods.length === 0) {
      throw new Error("Cannot resolve an active Zodiacal Releasing period: the generated level contains no periods.");
    }
    return periods.find((period) => instantMs >= period.startMs && instantMs < period.endMs)
      || periods[periods.length - 1];
  }

  private toPublicPeriod(period: ReleasingPeriodInternal): ReleasingPeriod {
    const { startMs: _startMs, endMs: _endMs, ...publicPeriod } = period;
    return publicPeriod;
  }

  public calculateReleasing(
    birthDate: Date,
    lotLongitude: number,
    lotName: "Spirit (Career & Purpose)" | "Fortune (Physical Health & Material Fortune)",
    fortuneLongitude?: number,
    currentDate: Date = new Date()
  ): ZodiacalReleasingReport {
    const lotSignIndex = Math.floor(((lotLongitude % 360) + 360) % 360 / 30);
    const hasFortune = typeof fortuneLongitude === "number" && Number.isFinite(fortuneLongitude);
    const fortuneSignIndex: number | null = hasFortune
      ? Math.floor(((fortuneLongitude % 360) + 360) % 360 / 30)
      : null;
    const lotSign = ZodiacalReleasingEngine.SIGN_NAMES[lotSignIndex] || "Aries";
    const fortuneSign = hasFortune && fortuneSignIndex !== null
      ? ZodiacalReleasingEngine.SIGN_NAMES[fortuneSignIndex] || "Aries"
      : "Not supplied";

    // Valens' same-sign Spirit adjustment: apply only when Fortune was
    // explicitly supplied and both lots occupy the same sign. Legacy callers
    // without Fortune retain the unadjusted releasing start sign.
    const applySpiritAdjustment = hasFortune
      && lotName.startsWith("Spirit")
      && lotSignIndex === fortuneSignIndex;
    const releasingStartIndex = applySpiritAdjustment ? (lotSignIndex + 1) % 12 : lotSignIndex;
    const releasingStartSign = ZodiacalReleasingEngine.SIGN_NAMES[releasingStartIndex] || "Aries";

    const birthMs = birthDate.getTime();
    const nowMs = Math.max(currentDate.getTime(), birthMs);
    const ageInYears = Math.max(0, (nowMs - birthMs) / (365.2425 * ZodiacalReleasingEngine.DAY_MS));
    const horizonYears = Math.max(120, Math.ceil(ageInYears) + 10);
    const cutoffMs = birthMs + horizonYears * 365.2425 * ZodiacalReleasingEngine.DAY_MS;

    // L1 periods use the 360-day ideal year and continue far enough to include
    // the current period plus a useful forward horizon for older birth dates.
    const l1Internal = this.generateL1Periods(releasingStartIndex, birthMs, cutoffMs, fortuneSignIndex);
    const currentL1Internal = this.findActivePeriod(l1Internal, nowMs);
    // L2, L3 and L4 are generated recursively from the active parent period.
    // Each level subdivides by the same 12 sign-period allotments, with the
    // final child truncated exactly at its parent's end.
    const l2Internal = this.generateSubperiods(currentL1Internal, "L2", fortuneSignIndex);
    const currentL2Internal = this.findActivePeriod(l2Internal, nowMs);
    const l3Internal = this.generateSubperiods(currentL2Internal, "L3", fortuneSignIndex);
    const currentL3Internal = this.findActivePeriod(l3Internal, nowMs);

    const l4Internal = this.generateSubperiods(currentL3Internal, "L4", fortuneSignIndex);
    const currentL4Internal = this.findActivePeriod(l4Internal, nowMs);

    const currentL1 = this.toPublicPeriod(currentL1Internal);
    const currentL2 = this.toPublicPeriod(currentL2Internal);
    const currentL3 = this.toPublicPeriod(currentL3Internal);
    const currentL4 = this.toPublicPeriod(currentL4Internal);
    const allL1Periods = l1Internal.map((period) => this.toPublicPeriod(period));

    return {
      lotName,
      lotSign,
      fortuneSign,
      releasingStartSign,
      currentL1Period: currentL1,
      currentL2Period: currentL2,
      currentL3Period: currentL3,
      currentL4Period: currentL4,
      allL1Periods,
      currentL2Periods: l2Internal.map((period) => this.toPublicPeriod(period)),
      currentL3Periods: l3Internal.map((period) => this.toPublicPeriod(period)),
      currentL4Periods: l4Internal.map((period) => this.toPublicPeriod(period)),
      peakPeriodsCount: allL1Periods.filter((period) => period.isPeak).length,
      calculationStandard: "Valens/Brennan-style releasing: 360-day ideal years, Capricorn 27 / Aquarius 30, opposite-sign Loosing of the Bond, and truncated child periods.",
      interpretation: `Zodiacal Releasing from ${lotName} begins in ${releasingStartSign} (the Lot itself is in ${lotSign}; Fortune is in ${fortuneSign}). The active L1 chapter is ${currentL1.sign}, ruled by ${currentL1.ruler}, from ${currentL1.startDate} to ${currentL1.endDate}.${currentL1.isPeak ? " This is a 10th-from-Fortune peak period." : ""} The active L2 period is ${currentL2.sign}, with L3 in ${currentL3.sign} and L4 in ${currentL4.sign}.`,
    };
  }
}

// ---------------------------------------------------------------------------
// 6. MEDIEVAL FIRDARIA
// ---------------------------------------------------------------------------

export interface FirdariaPeriod {
  planet: string;
  symbol: string;
  years: number;
  /** One-based 75-year Firdaria cycle number. */
  cycleNumber: number;
  startAge: number;
  endAge: number;
  /** Lunar-node major periods have no sub-periods in the standard 75-year sequence. */
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
    // Diurnal if Sun is in Houses 7 through 12.
    const sunHouse = chart.planets.find((p) => p.name === "Sun")?.house || 1;
    const isDiurnal = sunHouse >= 7 && sunHouse <= 12;
    const sequence = isDiurnal ? FirdariaEngine.DIURNAL_LORDS : FirdariaEngine.NOCTURNAL_LORDS;
    const planetarySubperiodOrder = sequence.slice(0, 7);
    const cycleLengthYears = sequence.reduce((sum, item) => sum + item.years, 0); // 75 years
    const safeAge = Math.max(0, Number.isFinite(currentAge) ? currentAge : 0);
    const cycleIndex = Math.floor(safeAge / cycleLengthYears);
    const cycleStartAge = cycleIndex * cycleLengthYears;
    const periods: FirdariaPeriod[] = [];

    let cumulativeAge = cycleStartAge;
    let activeMajor = "No active Firdaria period";
    let activeSub = "No active sub-period";
    let activeRange = "";

    sequence.forEach((item) => {
      const start = cumulativeAge;
      const end = start + item.years;
      const subPeriods: FirdariaPeriod["subPeriods"] = [];

      const majorSubperiodStartIndex = planetarySubperiodOrder.findIndex(
        (planet) => planet.planet === item.planet
      );

      // The seven classical planets receive seven equal subdivisions. Each
      // major's sub-period sequence starts with that major lord and continues
      // through the sect-specific Chaldean order. The lunar-node majors stand
      // alone and are not split into planetary sub-periods in this variant.
      if (majorSubperiodStartIndex >= 0) {
        const subYears = item.years / 7;
        for (let subIndex = 0; subIndex < 7; subIndex++) {
          const subLord = planetarySubperiodOrder[
            (majorSubperiodStartIndex + subIndex) % planetarySubperiodOrder.length
          ].planet;
          const subStart = start + subIndex * subYears;
          const subEnd = subIndex === 6 ? end : start + (subIndex + 1) * subYears;

          subPeriods.push({
            subLord,
            startAge: subStart,
            endAge: subEnd,
          });

          if (safeAge >= subStart && safeAge < subEnd) {
            activeSub = subLord;
          }
        }
      }

      if (safeAge >= start && safeAge < end) {
        activeMajor = item.planet;
        activeRange = `Age ${start.toFixed(2)} to ${end.toFixed(2)}`;
        if (subPeriods.length === 0) {
          activeSub = "No traditional sub-period (lunar-node major)";
        }
      }

      periods.push({
        planet: item.planet,
        symbol: item.symbol,
        years: item.years,
        cycleNumber: cycleIndex + 1,
        startAge: start,
        endAge: end,
        subPeriods,
      });

      cumulativeAge = end;
    });

    return {
      isDiurnal,
      activeMajorLord: activeMajor,
      activeSubLord: activeSub,
      activeYearsRange: activeRange,
      allPeriods: periods,
      interpretation: `Under the medieval ${isDiurnal ? "Day (Diurnal)" : "Night (Nocturnal)"} Firdaria cycle, your current cycle is number ${cycleIndex + 1} (ages ${cycleStartAge}–${cycleStartAge + cycleLengthYears}). The active major lord is ${activeMajor} (${activeRange}), with ${activeSub.toLowerCase()} shaping the current sub-period where the traditional system assigns one.`,
    };
  }}
