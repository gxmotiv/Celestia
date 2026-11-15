/**
 * Traditional antiscia and contra-antiscia: exact zodiacal mirror points.
 *
 * Declared method: William Lilly, Christian Astrology (1647), Book I,
 * pp. 90-92. The antiscion is the zodiacal degree reflected across the
 * solstitial axis (0° Cancer / 0° Capricorn). The contra-antiscion is the
 * degree opposite the antiscion.
 *
 * This is a zodiacal-longitude projection. It is not a declination parallel,
 * a celestial-latitude conjunction, or a claim about physical bodies.
 * This module calculates points only; it does not decide traditional contact
 * orbs, aspect doctrine, or predictive meanings.
 */

import {
  formatDegreeMinute,
  normalizeDegrees,
  ZODIAC_SIGNS,
} from "./ephemeris";

export interface AntisciaPoint {
  longitude: number;
  sign: string;
  signIndex: number;
  degreeInSign: number;
  degreeFormatted: string;
}

export interface AntisciaPosition {
  sourceName: string;
  sourceLongitude: number;
  antiscion: AntisciaPoint;
  contraAntiscion: AntisciaPoint;
  formula: "Antiscion = (180° - longitude) mod 360°; contra = antiscion + 180°";
  method: "Lilly-Christian-Astrology-1647";
}

export interface AntisciaInputPoint {
  name: string;
  longitude: number;
}

function createPoint(longitude: number): AntisciaPoint {
  const normalized = normalizeDegrees(longitude);
  const signIndex = Math.floor(normalized / 30);
  const sign = ZODIAC_SIGNS[signIndex];
  if (!sign) throw new RangeError("Antiscia longitude did not resolve to a zodiac sign.");
  return {
    longitude: Math.round(normalized * 1e8) / 1e8,
    sign: sign.name,
    signIndex,
    degreeInSign: Math.round((normalized - signIndex * 30) * 1e8) / 1e8,
    degreeFormatted: formatDegreeMinute(normalized),
  };
}

export class AntisciaCalculator {
  /**
   * Compute the exact antiscion and contra-antiscion for one ecliptic longitude.
   * Finite out-of-range longitudes are normalized onto the zodiacal circle.
   */
  public calculate(longitude: number, sourceName = "Point"): AntisciaPosition {
    if (!Number.isFinite(longitude)) {
      throw new RangeError("Antiscia requires a finite ecliptic longitude.");
    }

    const sourceLongitude = normalizeDegrees(longitude);
    const antiscionLongitude = normalizeDegrees(180 - sourceLongitude);
    const contraAntiscionLongitude = normalizeDegrees(antiscionLongitude + 180);

    return {
      sourceName,
      sourceLongitude: Math.round(sourceLongitude * 1e8) / 1e8,
      antiscion: createPoint(antiscionLongitude),
      contraAntiscion: createPoint(contraAntiscionLongitude),
      formula: "Antiscion = (180° - longitude) mod 360°; contra = antiscion + 180°",
      method: "Lilly-Christian-Astrology-1647",
    };
  }

  /** Calculate mirror points for a named set of chart longitudes. */
  public calculateAll(points: readonly AntisciaInputPoint[]): AntisciaPosition[] {
    if (!Array.isArray(points)) {
      throw new TypeError("Antiscia inputs must be an array of named longitude points.");
    }
    const names = new Set<string>();
    return points.map((point) => {
      if (!point || typeof point.name !== "string" || !point.name.trim()) {
        throw new RangeError("Every antiscia input requires a non-empty point name.");
      }
      if (names.has(point.name)) {
        throw new RangeError("Duplicate antiscia input name: " + point.name + ".");
      }
      names.add(point.name);
      return this.calculate(point.longitude, point.name);
    });
  }
}
