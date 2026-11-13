import {
  calculateWesternChart,
  formatDegreeMinute,
  normalizeDegrees,
  ZODIAC_SIGNS,
  type PlanetPosition,
  type WesternChartData,
  type WesternHouseSystem,
} from "./ephemeris";
import { swissEphemeris } from "./swissEphemeris";

const DAY_MS = 86400000;
const NAIBOD_KEY_DEGREES_PER_YEAR = 0.98564733;

export interface SolarArcContact {
  directedPoint: string;
  natalPoint: string;
  aspect: string;
  angle: number;
  orb: number;
}

export interface SolarArcDirectionsReport {
  ageYears: number;
  arcDegrees: number;
  key: "Naibod";
  directedPlanets: Array<{ name: string; longitude: number; signDegreeFormatted: string }>;
  directedAngles: Array<{ name: string; longitude: number; signDegreeFormatted: string }>;
  contacts: SolarArcContact[];
  methodNote: string;
}

export interface ReturnChartReport {
  kind: "Solar Return" | "Lunar Return";
  targetLongitude: number;
  returnLongitude: number;
  longitudeErrorDegrees: number;
  exactUtc: string;
  location: { latitude: number; longitude: number };
  houseSystem: string;
  chart: WesternChartData;
  methodNote: string;
}

function signedLongitudeDifference(longitude: number, target: number): number {
  const difference = normalizeDegrees(longitude - target);
  return difference >= 180 ? difference - 360 : difference;
}

function validateCoordinates(latitude: number, longitude: number): void {
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new RangeError("Return calculations require latitude ±90° and east-positive longitude ±180°.");
  }
}

function validateDate(date: Date, label: string): void {
  if (!Number.isFinite(date.getTime())) {
    throw new RangeError(label + " must be a valid date.");
  }
}

function julianDayUtc(date: Date): number {
  return swissEphemeris.calculateJulianDay(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds() + date.getUTCMilliseconds() / 1000,
    0
  );
}

function pointLongitude(body: "Sun" | "Moon", date: Date): number {
  const jd = julianDayUtc(date);
  const id = body === "Sun" ? swissEphemeris.SUN : swissEphemeris.MOON;
  return normalizeDegrees(swissEphemeris.calculatePlanetPosition(id, jd).longitude);
}

function signDegree(longitude: number): string {
  return formatDegreeMinute(normalizeDegrees(longitude));
}

/**
 * Solar Arc Directions, Naibod key.
 * The symbolic solar arc is mean daily solar motion (0.98564733°) multiplied
 * by elapsed tropical years, applied equally to natal ecliptic longitudes
 * (including the four chart angles). Interpretations are traditional symbolism.
 */
export class SolarArcDirectionsEngine {
  public calculate(
    chart: WesternChartData,
    birthUtc: Date,
    referenceDate: Date,
    orbLimit = 1
  ): SolarArcDirectionsReport {
    validateDate(birthUtc, "Birth UTC");
    validateDate(referenceDate, "Reference date");
    if (referenceDate.getTime() < birthUtc.getTime()) {
      throw new RangeError("Solar arc reference date cannot precede birth.");
    }
    if (!Number.isFinite(orbLimit) || orbLimit <= 0 || orbLimit > 10) {
      throw new RangeError("Solar arc contact orb must be greater than 0° and no more than 10°.");
    }

    const ageYears = (referenceDate.getTime() - birthUtc.getTime()) / (365.2422 * DAY_MS);
    const arcDegrees = ageYears * NAIBOD_KEY_DEGREES_PER_YEAR;
    const directedPlanets = chart.planets.map((planet) => {
      const longitude = normalizeDegrees(planet.longitude + arcDegrees);
      return { name: planet.name, longitude, signDegreeFormatted: signDegree(longitude) };
    });
    const natalAngles = [
      { name: "Ascendant", longitude: chart.ascendant.longitude },
      { name: "Midheaven", longitude: chart.midheaven.longitude },
      { name: "Descendant", longitude: chart.descendant },
      { name: "Imum Coeli", longitude: chart.imumCoeli },
    ];
    const directedAngles = natalAngles.map((angle) => {
      const longitude = normalizeDegrees(angle.longitude + arcDegrees);
      return { name: angle.name, longitude, signDegreeFormatted: signDegree(longitude) };
    });

    const natalPoints = [
      ...chart.planets.map((planet) => ({ name: planet.name, longitude: planet.longitude })),
      ...natalAngles,
    ];
    const directedPoints = [
      ...directedPlanets.map((planet) => ({ name: planet.name, longitude: planet.longitude })),
      ...directedAngles,
    ];
    const aspectDefinitions = [
      { name: "Conjunction", angle: 0 },
      { name: "Sextile", angle: 60 },
      { name: "Square", angle: 90 },
      { name: "Trine", angle: 120 },
      { name: "Quincunx", angle: 150 },
      { name: "Opposition", angle: 180 },
    ];
    const contacts: SolarArcContact[] = [];
    for (const directed of directedPoints) {
      for (const natal of natalPoints) {
        if (directed.name === natal.name) continue;
        const separation = Math.min(
          normalizeDegrees(directed.longitude - natal.longitude),
          normalizeDegrees(natal.longitude - directed.longitude)
        );
        for (const aspect of aspectDefinitions) {
          const orb = Math.abs(separation - aspect.angle);
          if (orb <= orbLimit) {
            contacts.push({
              directedPoint: directed.name,
              natalPoint: natal.name,
              aspect: aspect.name,
              angle: aspect.angle,
              orb: Math.round(orb * 1000) / 1000,
            });
          }
        }
      }
    }
    contacts.sort((a, b) => a.orb - b.orb);

    return {
      ageYears,
      arcDegrees,
      key: "Naibod",
      directedPlanets,
      directedAngles,
      contacts,
      methodNote: "Naibod solar arc: elapsed tropical age × 0.98564733°/year, applied equally to natal planets and angles. This is one symbolic directing key; other keys and interpretive traditions differ. It is not a transit or a prediction guarantee.",
    };
  }
}

export class WesternReturnEngine {
  private findReturn(
    body: "Sun" | "Moon",
    targetLongitude: number,
    start: Date,
    maxDays: number,
    strictlyAfterStart = false
  ): { exactDate: Date; longitude: number; error: number } {
    const target = normalizeDegrees(targetLongitude);
    const stepMilliseconds = DAY_MS;
    let left = new Date(start.getTime());
    let leftDifference = signedLongitudeDifference(pointLongitude(body, left), target);
    const endTime = start.getTime() + maxDays * DAY_MS;
    let bracket: { left: Date; right: Date } | null = null;

    for (let time = start.getTime() + stepMilliseconds; time <= endTime; time += stepMilliseconds) {
      const right = new Date(Math.min(time, endTime));
      const rightDifference = signedLongitudeDifference(pointLongitude(body, right), target);
      if (
        leftDifference <= 0 &&
        rightDifference >= 0 &&
        (leftDifference < 0 || rightDifference > 0) &&
        (!strictlyAfterStart || leftDifference < 0)
      ) {
        bracket = { left, right };
        break;
      }
      left = right;
      leftDifference = rightDifference;
      if (right.getTime() === endTime) break;
    }

    if (!bracket) {
      throw new RangeError("No " + body + " longitude return was found within the requested search window.");
    }

    let low = bracket.left.getTime();
    let high = bracket.right.getTime();
    for (let iteration = 0; iteration < 60 && high - low > 250; iteration++) {
      const middle = low + Math.floor((high - low) / 2);
      const difference = signedLongitudeDifference(pointLongitude(body, new Date(middle)), target);
      if (difference < 0) low = middle;
      else high = middle;
    }

    // Return the upper edge of the bracket: it is on/after the crossing,
    // so a subsequent strictly-after search cannot rediscover this return.
    const exactDate = new Date(high);
    const longitude = pointLongitude(body, exactDate);
    const rawError = Math.abs(signedLongitudeDifference(longitude, target));
    return { exactDate, longitude, error: rawError };
  }

  public calculateSolarReturn(
    natalChart: WesternChartData,
    targetYear: number,
    latitude: number,
    longitude: number,
    houseSystem: WesternHouseSystem = natalChart.houseSystem
  ): ReturnChartReport {
    if (!Number.isInteger(targetYear) || targetYear < 1600 || targetYear > 2600) {
      throw new RangeError("Solar return year must be an integer between 1600 and 2600.");
    }
    validateCoordinates(latitude, longitude);
    const start = new Date(Date.UTC(targetYear, 0, 1));
    const solved = this.findReturn("Sun", natalChart.planets.find((p) => p.name === "Sun")?.longitude ?? Number.NaN, start, 370);
    if (solved.exactDate.getUTCFullYear() !== targetYear) {
      throw new RangeError("The next solar return does not fall within the selected calendar year.");
    }
    const d = solved.exactDate;
    const chart = calculateWesternChart(
      d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(),
      d.getUTCHours(), d.getUTCMinutes(), latitude, longitude, 0, houseSystem,
      d.getUTCSeconds() + d.getUTCMilliseconds() / 1000
    );
    return {
      kind: "Solar Return",
      targetLongitude: normalizeDegrees(natalChart.planets.find((p) => p.name === "Sun")?.longitude ?? Number.NaN),
      returnLongitude: solved.longitude,
      longitudeErrorDegrees: solved.error,
      exactUtc: d.toISOString(),
      location: { latitude, longitude },
      houseSystem: chart.houseSystem,
      chart,
      methodNote: "Exact tropical/geocentric Sun longitude return solved against the natal Sun longitude. Houses and angles are recalculated for the supplied return location. Relocation changes houses, not the return instant. This is a chart calculation, not a scientifically validated forecast.",
    };
  }

  public calculateNextLunarReturn(
    natalChart: WesternChartData,
    referenceDate: Date,
    latitude: number,
    longitude: number,
    houseSystem: WesternHouseSystem = natalChart.houseSystem
  ): ReturnChartReport {
    validateDate(referenceDate, "Lunar return reference date");
    validateCoordinates(latitude, longitude);
    const natalMoon = natalChart.planets.find((p) => p.name === "Moon")?.longitude ?? Number.NaN;
    const solved = this.findReturn("Moon", natalMoon, referenceDate, 36, true);
    const d = solved.exactDate;
    const chart = calculateWesternChart(
      d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(),
      d.getUTCHours(), d.getUTCMinutes(), latitude, longitude, 0, houseSystem,
      d.getUTCSeconds() + d.getUTCMilliseconds() / 1000
    );
    return {
      kind: "Lunar Return",
      targetLongitude: normalizeDegrees(natalMoon),
      returnLongitude: solved.longitude,
      longitudeErrorDegrees: solved.error,
      exactUtc: d.toISOString(),
      location: { latitude, longitude },
      houseSystem: chart.houseSystem,
      chart,
      methodNote: "Next exact tropical/geocentric Moon longitude return to the natal Moon, found by an ephemeris crossing search. Houses and angles are recalculated for the supplied return location. This is a chart calculation, not a scientifically validated forecast.",
    };
  }
}
