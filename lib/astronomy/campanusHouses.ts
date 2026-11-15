/**
 * Campanus house cusps from equal divisions of the prime vertical.
 *
 * Divide the prime vertical into twelve 30° sectors. Great circles through
 * the horizon's north/south points and the corresponding prime-vertical
 * points intersect the ecliptic at the house cusps.
 *
 * This implementation uses a spherical-vector plane-intersection formula
 * independently derived from that construction. It is validated against
 * Swiss Ephemeris 2.10.03 houses_armc(..., 'C') reference fixtures.
 *
 * Inputs are ARMC (degrees), north-positive geographic latitude (degrees),
 * and true obliquity of date (degrees), all in a consistent frame.
 */
export interface CampanusHouseResult {
  ascendant: number;
  midheaven: number;
  /** Houses 1 through 12, zero-indexed in this array. */
  houseCusps: number[];
  /** True when the Swiss Ephemeris polar 180° orientation correction applies. */
  polarShifted: boolean;
}

const DEGREES_TO_RADIANS = Math.PI / 180;
const RADIANS_TO_DEGREES = 180 / Math.PI;

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function signedAngularDifference(from: number, to: number): number {
  return normalizeDegrees(from - to + 180) - 180;
}

/**
 * Calculate Campanus houses from ARMC, latitude and obliquity, in degrees.
 * Unlike Placidus and Koch, Campanus remains defined at polar latitudes;
 * its polar orientation is handled by the method's 180° frame correction.
 */
export function calculateCampanusHouses(
  armcDegrees: number,
  latitudeDegrees: number,
  obliquityDegrees: number
): CampanusHouseResult {
  if (![armcDegrees, latitudeDegrees, obliquityDegrees].every(Number.isFinite)) {
    throw new RangeError("Campanus houses require finite ARMC, latitude and obliquity.");
  }
  if (latitudeDegrees < -90 || latitudeDegrees > 90) {
    throw new RangeError("Campanus latitude must be between -90° and +90°.");
  }
  if (obliquityDegrees < 0 || obliquityDegrees >= 90) {
    throw new RangeError("Campanus obliquity must be between 0° inclusive and 90° exclusive.");
  }

  const theta = normalizeDegrees(armcDegrees) * DEGREES_TO_RADIANS;
  const phi = latitudeDegrees * DEGREES_TO_RADIANS;
  const epsilon = obliquityDegrees * DEGREES_TO_RADIANS;
  const sinLatitude = Math.sin(phi);
  const cosLatitude = Math.cos(phi);
  const sinEpsilon = Math.sin(epsilon);
  const cosEpsilon = Math.cos(epsilon);

  let ascendant = normalizeDegrees(Math.atan2(
    Math.cos(theta) * cosLatitude,
    -Math.sin(theta) * cosLatitude * cosEpsilon - sinLatitude * sinEpsilon
  ) * RADIANS_TO_DEGREES);
  let midheaven = normalizeDegrees(Math.atan2(
    Math.sin(theta),
    Math.cos(theta) * cosEpsilon
  ) * RADIANS_TO_DEGREES);

  // Prime-vertical point at angle a from the east point. Intersect the
  // ecliptic with the great circle through this point and the horizon's
  // north/south points. The plane normal gives the atan2 components below.
  const cuspAtPrimeVerticalOffset = (offsetDegrees: number): number => {
    const angle = offsetDegrees * DEGREES_TO_RADIANS;
    const cosAngle = Math.cos(angle);
    const sinAngle = Math.sin(angle);
    const y =
      cosAngle * Math.sin(theta) +
      sinAngle * cosLatitude * Math.cos(theta);
    const x = cosEpsilon * (
      cosAngle * Math.cos(theta) -
      sinAngle * cosLatitude * Math.sin(theta)
    ) - sinEpsilon * sinLatitude * sinAngle;

    if (Math.hypot(x, y) < 1e-14) {
      throw new RangeError("Campanus prime-vertical/ecliptic intersection is indeterminate at this coordinate.");
    }
    return normalizeDegrees(Math.atan2(y, x) * RADIANS_TO_DEGREES);
  };

  const cusps = new Array<number>(12).fill(Number.NaN);
  cusps[0] = ascendant;
  cusps[9] = midheaven;
  cusps[3] = normalizeDegrees(midheaven + 180);
  cusps[6] = normalizeDegrees(ascendant + 180);

  // Prime-vertical divisions 30°, 60°, 120° and 150° produce
  // cusps 11, 12, 2 and 3. Their opposite cusps are exactly 180° away.
  cusps[10] = cuspAtPrimeVerticalOffset(30);
  cusps[11] = cuspAtPrimeVerticalOffset(60);
  cusps[1] = cuspAtPrimeVerticalOffset(120);
  cusps[2] = cuspAtPrimeVerticalOffset(150);
  cusps[4] = normalizeDegrees(cusps[10] + 180);
  cusps[5] = normalizeDegrees(cusps[11] + 180);
  cusps[7] = normalizeDegrees(cusps[1] + 180);
  cusps[8] = normalizeDegrees(cusps[2] + 180);

  // Swiss Ephemeris' polar orientation rule keeps the Ascendant/MC on the
  // chart's selected hemisphere when the MC sinks below the horizon. At
  // these latitudes houses can run clockwise, so preserve the full frame
  // rotation rather than fabricating monotonically increasing cusp arcs.
  const polarShifted =
    Math.abs(latitudeDegrees) >= 90 - obliquityDegrees &&
    signedAngularDifference(ascendant, midheaven) < 0;
  if (polarShifted) {
    ascendant = normalizeDegrees(ascendant + 180);
    midheaven = normalizeDegrees(midheaven + 180);
    for (let index = 0; index < cusps.length; index += 1) {
      cusps[index] = normalizeDegrees(cusps[index] + 180);
    }
  }

  if (!cusps.every(Number.isFinite) ||
      !Number.isFinite(ascendant) ||
      !Number.isFinite(midheaven)) {
    throw new RangeError("Campanus house calculation could not produce twelve finite cusps.");
  }

  return { ascendant, midheaven, houseCusps: cusps, polarShifted };
}
