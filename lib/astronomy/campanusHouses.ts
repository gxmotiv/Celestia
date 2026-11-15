/**
 * Campanus house cusps from the spherical construction of prime-vertical
 * position circles.
 *
 * The prime vertical is divided into twelve equal 30° arcs. Each division
 * point defines a great circle through the north and south points of the
 * local horizon; its ecliptic intersection is a house cusp. This implementation
 * solves that intersection from an independently derived plane-normal vector.
 *
 * Reference fixtures are from the independent Swiss Ephemeris 2.10.03
 * houses_armc(..., 'C') calculation; no Swiss Ephemeris source is vendored.
 */
export interface CampanusHouseResult {
  ascendant: number;
  midheaven: number;
  /** Houses 1 through 12, zero-indexed in this array. */
  houseCusps: number[];
  /** Swiss Ephemeris polar orientation convention was applied. */
  polarShifted: boolean;
}

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function signedAngularDifference(from: number, to: number): number {
  return normalizeDegrees(from - to + 180) - 180;
}

/**
 * Calculate Campanus houses from ARMC, geographic latitude and obliquity.
 * All inputs and returned longitudes are degrees. ARMC is east-positive and
 * already includes the observer's geographic longitude.
 *
 * The north/south points of the horizon are undefined at the exact geographic
 * poles, so the pure geometry rejects |latitude| = 90°. The application facade
 * explicitly uses Porphyry there and reports the actual method used.
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
  if (Math.abs(latitudeDegrees) >= 90) {
    throw new RangeError("Campanus horizon north/south points are indeterminate at the exact geographic poles.");
  }
  if (obliquityDegrees < 0 || obliquityDegrees >= 90) {
    throw new RangeError("Campanus obliquity must be between 0° inclusive and 90° exclusive.");
  }

  const theta = normalizeDegrees(armcDegrees) * DEG_TO_RAD;
  const phi = latitudeDegrees * DEG_TO_RAD;
  const epsilon = obliquityDegrees * DEG_TO_RAD;
  const sinLatitude = Math.sin(phi);
  const cosLatitude = Math.cos(phi);
  const sinEpsilon = Math.sin(epsilon);
  const cosEpsilon = Math.cos(epsilon);

  let midheaven = normalizeDegrees(
    Math.atan2(Math.sin(theta), Math.cos(theta) * cosEpsilon) * RAD_TO_DEG
  );
  let ascendant = normalizeDegrees(
    Math.atan2(
      Math.cos(theta),
      -Math.sin(theta) * cosEpsilon - Math.tan(phi) * sinEpsilon
    ) * RAD_TO_DEG
  );

  // A prime-vertical division point at angle a has vector
  // P(a) = cos(a)·Z + sin(a)·E. The house circle is the great circle through
  // P(a) and the horizon's north/south points. Intersecting its plane with the
  // ecliptic gives the following atan2 form, preserving the correct quadrant.
  const cuspAtPrimeVerticalOffset = (offsetDegrees: number): number => {
    const angle = offsetDegrees * DEG_TO_RAD;
    const sinAngle = Math.sin(angle);
    const cosAngle = Math.cos(angle);
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    const y = cosAngle * sinTheta + sinAngle * cosLatitude * cosTheta;
    const x =
      cosEpsilon * (cosAngle * cosTheta - sinAngle * cosLatitude * sinTheta) -
      sinEpsilon * sinLatitude * sinAngle;

    if (Math.hypot(x, y) < 1e-14) {
      throw new RangeError("Campanus position-circle/ecliptic intersection is indeterminate at this coordinate.");
    }
    return normalizeDegrees(Math.atan2(y, x) * RAD_TO_DEG);
  };

  const cusps = new Array<number>(12).fill(Number.NaN);
  cusps[0] = ascendant;
  cusps[9] = midheaven;
  cusps[3] = normalizeDegrees(midheaven + 180);
  cusps[6] = normalizeDegrees(ascendant + 180);

  // The prime-vertical offsets 30°, 60°, 120°, 150° produce houses
  // 11, 12, 2 and 3. Opposite cusps are exactly 180° away.
  cusps[10] = cuspAtPrimeVerticalOffset(30);
  cusps[11] = cuspAtPrimeVerticalOffset(60);
  cusps[1] = cuspAtPrimeVerticalOffset(120);
  cusps[2] = cuspAtPrimeVerticalOffset(150);
  cusps[4] = normalizeDegrees(cusps[10] + 180);
  cusps[5] = normalizeDegrees(cusps[11] + 180);
  cusps[7] = normalizeDegrees(cusps[1] + 180);
  cusps[8] = normalizeDegrees(cusps[2] + 180);

  // Within the polar circle, the standard Campanus orientation can place ASC
  // west of MC. Rotate the whole frame by 180° to preserve the conventional
  // house-cusp orientation. House assignment must support this reversed order.
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

  if (!cusps.every(Number.isFinite) || !Number.isFinite(ascendant) || !Number.isFinite(midheaven)) {
    throw new RangeError("Campanus house calculation could not produce twelve finite cusps.");
  }

  return { ascendant, midheaven, houseCusps: cusps, polarShifted };
}
