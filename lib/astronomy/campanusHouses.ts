/**
 * Campanus house cusps from the prime-vertical great-circle construction.
 *
 * The prime vertical (East point -> Zenith -> West point -> Nadir) is divided
 * into twelve equal 30-degree sectors. For each sector, the house-position
 * great circle through its prime-vertical point and the horizon's north/south
 * points is intersected with the ecliptic.
 *
 * This implementation derives the intersection from a plane normal and an
 * ecliptic unit vector. It does not port another library's helper routines.
 * Numerical fixtures in testCampanusHouseSystemSuite.ts are independently
 * captured from PySwissEph / Swiss Ephemeris 2.10.03 houses_armc(..., 'C').
 */
export interface CampanusHouseResult {
  ascendant: number;
  midheaven: number;
  /** Houses 1 through 12, zero-indexed in this array. */
  houseCusps: number[];
  /** True when the Swiss-compatible 180-degree polar orientation convention applies. */
  polarShifted: boolean;
}

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function signedAngularDifference(from: number, to: number): number {
  return normalizeDegrees(from - to + 180) - 180;
}

/**
 * Calculate the Campanus house frame from ARMC, geographic latitude and
 * ecliptic obliquity, all in degrees.
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
  if (Math.abs(latitudeDegrees) >= 90 - 1e-12) {
    throw new RangeError("Campanus houses are indeterminate at the geographic poles, where the local north/east frame is not unique.");
  }
  if (obliquityDegrees < 0 || obliquityDegrees >= 90) {
    throw new RangeError("Campanus obliquity must be between 0° inclusive and 90° exclusive.");
  }

  const theta = normalizeDegrees(armcDegrees) * DEG;
  const phi = latitudeDegrees * DEG;
  const epsilon = obliquityDegrees * DEG;
  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const sinEpsilon = Math.sin(epsilon);
  const cosEpsilon = Math.cos(epsilon);

  // Standard ecliptic/meridian and ecliptic/horizon intersections.
  let ascendant = normalizeDegrees(Math.atan2(
    Math.cos(theta),
    -Math.sin(theta) * cosEpsilon - Math.tan(phi) * sinEpsilon
  ) * RAD);
  let midheaven = normalizeDegrees(Math.atan2(
    Math.sin(theta),
    Math.cos(theta) * cosEpsilon
  ) * RAD);

  /**
   * A prime-vertical point at angle a from the zenith toward the East point
   * has a great-circle plane normal N cross P. Intersecting that plane with
   * the ecliptic unit vector gives the closed-form atan2 below. atan2 preserves
   * the longitude quadrant at every ARMC wrap.
   */
  const eclipticIntersection = (aDegrees: number): number => {
    const a = aDegrees * DEG;
    const y =
      Math.cos(a) * Math.sin(theta) +
      Math.sin(a) * cosPhi * Math.cos(theta);
    const x =
      cosEpsilon * (
        Math.cos(a) * Math.cos(theta) -
        Math.sin(a) * cosPhi * Math.sin(theta)
      ) -
      sinEpsilon * sinPhi * Math.sin(a);
    if (Math.hypot(x, y) < 1e-14) {
      throw new RangeError("Campanus prime-vertical intersection is indeterminate at this coordinate.");
    }
    return normalizeDegrees(Math.atan2(y, x) * RAD);
  };

  const cusps = new Array<number>(12).fill(Number.NaN);
  cusps[0] = ascendant;
  cusps[9] = midheaven;
  cusps[3] = normalizeDegrees(midheaven + 180);
  cusps[6] = normalizeDegrees(ascendant + 180);

  // Equal 30-degree prime-vertical divisions from the upper meridian toward
  // the East point: 11, 12, 2 and 3. Opposite cusps are exactly 180° apart.
  cusps[10] = eclipticIntersection(30);
  cusps[11] = eclipticIntersection(60);
  cusps[1] = eclipticIntersection(120);
  cusps[2] = eclipticIntersection(150);
  cusps[4] = normalizeDegrees(cusps[10] + 180);
  cusps[5] = normalizeDegrees(cusps[11] + 180);
  cusps[7] = normalizeDegrees(cusps[1] + 180);
  cusps[8] = normalizeDegrees(cusps[2] + 180);

  // At polar latitudes the ecliptic/horizon intersection can lie on the
  // western side of the meridian. Rotate the whole Campanus frame by 180°
  // where the established polar convention requires it. House placement
  // consumers must therefore support both increasing and decreasing cusps.
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
