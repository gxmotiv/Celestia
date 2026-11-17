/**
 * Regiomontanus house cusps from the spherical construction of equatorial
 * position circles.
 *
 * Divide the celestial equator into 30° arcs from the local meridian, then
 * intersect the ecliptic with the great circle through each division point
 * and the north/south points of the horizon. This implementation uses the
 * plane-normal / vector form of that construction rather than porting an
 * external implementation's helper routines.
 *
 * Independent numerical fixtures are recorded in
 * scripts/testRegiomontanusHouseSystemSuite.ts and were captured from
 * Swiss Ephemeris 2.10.03 houses_armc(..., 'R').
 */
export interface RegiomontanusHouseResult {
  ascendant: number;
  midheaven: number;
  /** Houses 1 through 12, zero-indexed in this array. */
  houseCusps: number[];
  /** Swiss Ephemeris polar orientation convention was applied. */
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
 * Calculate a Regiomontanus house frame from ARMC, geographic latitude and
 * obliquity, all in degrees. ARMC is east-positive and already includes the
 * observer's longitude.
 */
export function calculateRegiomontanusHouses(
  armcDegrees: number,
  latitudeDegrees: number,
  obliquityDegrees: number
): RegiomontanusHouseResult {
  if (![armcDegrees, latitudeDegrees, obliquityDegrees].every(Number.isFinite)) {
    throw new RangeError("Regiomontanus houses require finite ARMC, latitude and obliquity.");
  }
  if (latitudeDegrees < -90 || latitudeDegrees > 90) {
    throw new RangeError("Regiomontanus latitude must be between -90° and +90°.");
  }
  if (obliquityDegrees < 0 || obliquityDegrees >= 90) {
    throw new RangeError("Regiomontanus obliquity must be between 0° inclusive and 90° exclusive.");
  }

  const theta = normalizeDegrees(armcDegrees) * DEGREES_TO_RADIANS;
  const phi = latitudeDegrees * DEGREES_TO_RADIANS;
  const epsilon = obliquityDegrees * DEGREES_TO_RADIANS;
  const cosLatitude = Math.cos(phi);
  const sinLatitude = Math.sin(phi);
  const sinEpsilon = Math.sin(epsilon);
  const cosEpsilon = Math.cos(epsilon);

  // Ecliptic intersections with the meridian and horizon.
  let ascendant = normalizeDegrees(Math.atan2(
    Math.cos(theta) * cosLatitude,
    -Math.sin(theta) * cosLatitude * cosEpsilon - sinLatitude * sinEpsilon
  ) * RADIANS_TO_DEGREES);
  let midheaven = normalizeDegrees(Math.atan2(
    Math.sin(theta),
    Math.cos(theta) * cosEpsilon
  ) * RADIANS_TO_DEGREES);

  // For an equatorial point at RA = ARMC + H, the north/south horizon
  // position-circle intersection with the ecliptic is obtained from the
  // plane normal. The formula is continuous through the 0°/360° wrap.
  const cuspAtEquatorialOffset = (offsetDegrees: number): number => {
    const offset = offsetDegrees * DEGREES_TO_RADIANS;
    const rightAscension = theta + offset;
    const y = cosLatitude * Math.sin(rightAscension);
    const x =
      cosLatitude * Math.cos(rightAscension) * cosEpsilon -
      sinLatitude * Math.sin(offset) * sinEpsilon;
    if (Math.hypot(x, y) < 1e-14) {
      throw new RangeError("Regiomontanus position circle is indeterminate at this coordinate.");
    }
    return normalizeDegrees(Math.atan2(y, x) * RADIANS_TO_DEGREES);
  };

  const cusps = new Array<number>(12).fill(Number.NaN);
  cusps[0] = ascendant;
  cusps[9] = midheaven;
  cusps[3] = normalizeDegrees(midheaven + 180);
  cusps[6] = normalizeDegrees(ascendant + 180);

  // The 30°, 60°, 120° and 150° equatorial divisions produce cusps
  // 11, 12, 2 and 3. Their opposing cusps are exactly 180° away.
  cusps[10] = cuspAtEquatorialOffset(30);
  cusps[11] = cuspAtEquatorialOffset(60);
  cusps[1] = cuspAtEquatorialOffset(120);
  cusps[2] = cuspAtEquatorialOffset(150);
  cusps[4] = normalizeDegrees(cusps[10] + 180);
  cusps[5] = normalizeDegrees(cusps[11] + 180);
  cusps[7] = normalizeDegrees(cusps[1] + 180);
  cusps[8] = normalizeDegrees(cusps[2] + 180);

  // At and within the polar circle, some ARMC/latitude combinations place
  // the computed Ascendant on the western side. The Regiomontanus convention
  // rotates the entire house frame by 180° in this case; this is not the
  // Placidus-to-Porphyry fallback used by Celestia's separate policy.
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
    throw new RangeError("Regiomontanus house calculation could not produce twelve finite cusps.");
  }

  return { ascendant, midheaven, houseCusps: cusps, polarShifted };
}
