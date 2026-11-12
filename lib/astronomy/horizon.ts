/**
 * Horizon geometry shared by Western and Hellenistic techniques.
 *
 * Sect is determined by the Sun's actual altitude above/below the local
 * astronomical horizon, not by an ecliptic-sign house number. This keeps
 * day/night classification stable when the user changes house systems.
 */

export interface SolarHorizonInput {
  eclipticLongitude: number;
  eclipticLatitude?: number;
  obliquity: number;
  localSiderealTime: number;
  geographicLatitude: number;
}

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function signedDegrees(value: number): number {
  const normalized = normalizeDegrees(value);
  return normalized > 180 ? normalized - 360 : normalized;
}

/**
 * Geometric altitude of an ecliptic point at a given local sidereal time.
 * No atmospheric refraction or solar semidiameter correction is applied:
 * traditional chart sect uses the geometric centre crossing the horizon.
 */
export function calculateSolarAltitudeDegrees(input: SolarHorizonInput): number {
  const {
    eclipticLongitude,
    eclipticLatitude = 0,
    obliquity,
    localSiderealTime,
    geographicLatitude,
  } = input;

  const values = [eclipticLongitude, eclipticLatitude, obliquity, localSiderealTime, geographicLatitude];
  if (!values.every(Number.isFinite)) {
    throw new RangeError("Solar horizon inputs must all be finite.");
  }
  if (geographicLatitude < -90 || geographicLatitude > 90) {
    throw new RangeError("Geographic latitude must be between -90° and +90°.");
  }
  if (Math.abs(eclipticLatitude) > 90 || Math.abs(obliquity) > 90) {
    throw new RangeError("Ecliptic latitude and obliquity must be within ±90°.");
  }

  const lambda = normalizeDegrees(eclipticLongitude) * DEG_TO_RAD;
  const beta = eclipticLatitude * DEG_TO_RAD;
  const epsilon = obliquity * DEG_TO_RAD;
  const phi = geographicLatitude * DEG_TO_RAD;

  // Ecliptic -> equatorial rectangular unit vector.
  const x = Math.cos(beta) * Math.cos(lambda);
  const y = Math.cos(beta) * Math.sin(lambda) * Math.cos(epsilon) - Math.sin(beta) * Math.sin(epsilon);
  const z = Math.cos(beta) * Math.sin(lambda) * Math.sin(epsilon) + Math.sin(beta) * Math.cos(epsilon);

  const rightAscension = normalizeDegrees(Math.atan2(y, x) * RAD_TO_DEG);
  const declination = Math.asin(Math.max(-1, Math.min(1, z)));
  const hourAngle = signedDegrees(localSiderealTime - rightAscension) * DEG_TO_RAD;

  const sinAltitude =
    Math.sin(phi) * Math.sin(declination) +
    Math.cos(phi) * Math.cos(declination) * Math.cos(hourAngle);

  return Math.asin(Math.max(-1, Math.min(1, sinAltitude))) * RAD_TO_DEG;
}

/** Returns true when the Sun's geometric centre is above the local horizon. */
export function isSunAboveHorizon(input: SolarHorizonInput): boolean {
  return calculateSolarAltitudeDegrees(input) > 0;
}

/**
 * Resolve sect from a complete natal chart. The geometric calculation is the
 * primary path; the existing planetary-hours flag is a backwards-compatible
 * fallback for imported charts that lack location/sidereal-time metadata.
 */
export function isSunAboveHorizonInChart(chart: {
  planets: Array<{ name: string; longitude: number; latitude?: number }>;
  obliquity: number;
  siderealTime: number;
  birthLatitude?: number;
  planetaryHours?: { isBirthInDaytime?: boolean };
}): boolean {
  const sun = chart.planets.find((planet) => planet.name === "Sun");
  if (!sun) {
    throw new RangeError("A Sun position is required to determine chart sect.");
  }

  if (
    Number.isFinite(chart.birthLatitude) &&
    Number.isFinite(chart.obliquity) &&
    Number.isFinite(chart.siderealTime)
  ) {
    return isSunAboveHorizon({
      eclipticLongitude: sun.longitude,
      eclipticLatitude: sun.latitude ?? 0,
      obliquity: chart.obliquity,
      localSiderealTime: chart.siderealTime,
      geographicLatitude: chart.birthLatitude as number,
    });
  }

  if (typeof chart.planetaryHours?.isBirthInDaytime === "boolean") {
    return chart.planetaryHours.isBirthInDaytime;
  }

  throw new RangeError("Chart latitude and local sidereal time are required to determine sect.");
}
