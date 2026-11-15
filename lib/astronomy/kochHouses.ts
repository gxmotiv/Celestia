/**
 * Koch (Birthplace) house cusps from the semi-diurnal arc of the MC.
 *
 * The MC's ascensional difference is trisected to derive four pseudo-sidereal
 * times. The ecliptic's rising intersections at those times form cusps 11, 12,
 * 2 and 3; the opposite cusps are exactly 180 degrees away.
 *
 * Inputs use ARMC (degrees), north-positive geographic latitude (degrees),
 * and the true obliquity of date (degrees). The caller is responsible for
 * deriving ARMC and obliquity in a consistent apparent/mean reference frame.
 */
export interface KochHouseResult {
  ascendant: number;
  midheaven: number;
  /** Houses 1 through 12, zero-indexed in this array. */
  houseCusps: number[];
  /** MC ascensional difference used to divide the semi-diurnal arc. */
  midheavenAscensionalDifference: number;
}

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function clampUnit(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

/**
 * Rising ecliptic intersection for a pseudo-local sidereal angle.
 * This is expressed directly with atan2 to preserve the correct quadrant
 * across 0/360 degrees.
 */
function risingEclipticIntersection(
  pseudoSiderealAngle: number,
  latitudeRadians: number,
  sinObliquity: number,
  cosObliquity: number
): number {
  const angle = pseudoSiderealAngle * DEG;
  const y = Math.sin(angle);
  const x =
    cosObliquity * Math.cos(angle) -
    Math.tan(latitudeRadians) * sinObliquity;
  if (Math.hypot(x, y) < 1e-14) {
    throw new RangeError("Koch cusp intersection is indeterminate at this coordinate.");
  }
  return normalizeDegrees(Math.atan2(y, x) * RAD);
}

/**
 * Calculate the Koch house frame from ARMC, latitude and obliquity, in degrees.
 *
 * Koch houses are not defined inside the polar circle. This pure calculator
 * rejects those coordinates; the application facade may explicitly fall
 * back to Porphyry and must report the system actually used.
 */
export function calculateKochHouses(
  armcDegrees: number,
  latitudeDegrees: number,
  obliquityDegrees: number
): KochHouseResult {
  if (![armcDegrees, latitudeDegrees, obliquityDegrees].every(Number.isFinite)) {
    throw new RangeError("Koch houses require finite ARMC, latitude and obliquity.");
  }
  if (latitudeDegrees < -90 || latitudeDegrees > 90) {
    throw new RangeError("Koch latitude must be between -90° and +90°.");
  }
  if (obliquityDegrees < 0 || obliquityDegrees >= 90) {
    throw new RangeError("Koch obliquity must be between 0° inclusive and 90° exclusive.");
  }
  if (Math.abs(latitudeDegrees) >= 90 - obliquityDegrees) {
    throw new RangeError("Koch houses are undefined within the polar circle; use a supported alternative such as Porphyry, Equal or Whole Sign.");
  }

  const thetaDegrees = normalizeDegrees(armcDegrees);
  const theta = thetaDegrees * DEG;
  const latitude = latitudeDegrees * DEG;
  const epsilon = obliquityDegrees * DEG;
  const sinEpsilon = Math.sin(epsilon);
  const cosEpsilon = Math.cos(epsilon);
  const cosLatitude = Math.cos(latitude);

  const midheaven = normalizeDegrees(
    Math.atan2(Math.sin(theta), Math.cos(theta) * cosEpsilon) * RAD
  );
  const ascendant = normalizeDegrees(
    Math.atan2(
      Math.cos(theta),
      -Math.sin(theta) * cosEpsilon - Math.tan(latitude) * sinEpsilon
    ) * RAD
  );

  // Declination of the MC on the ecliptic.
  const sinMCHelio = clampUnit(Math.sin(midheaven * DEG) * sinEpsilon);
  const mcDeclination = Math.asin(sinMCHelio);

  // Spherical-triangle form of the MC ascensional difference. The clamped
  // construction remains finite near the polar boundary, where tan(phi)*tan
  // (delta_MC) can otherwise overflow or leave the real domain.
  const sinA = clampUnit(
    (Math.sin(midheaven * DEG) * sinEpsilon) / cosLatitude
  );
  const cosA = Math.sqrt(Math.max(0, 1 - sinA * sinA));
  const auxiliaryAngle = Math.atan2(Math.tan(latitude), cosA);
  const ascensionalDifference = Math.asin(
    clampUnit(Math.sin(auxiliaryAngle) * sinA)
  );

  // Koch divides the MC's semi-diurnal arc in thirds. The four pseudo-sidereal
  // angles are offset by 30/60/120/150 degrees and the appropriate one- and
  // two-third ascensional-difference corrections.
  const adThird = (ascensionalDifference * RAD) / 3;
  const cusp11 = risingEclipticIntersection(
    thetaDegrees + 30 - 2 * adThird, latitude, sinEpsilon, cosEpsilon
  );
  const cusp12 = risingEclipticIntersection(
    thetaDegrees + 60 - adThird, latitude, sinEpsilon, cosEpsilon
  );
  const cusp2 = risingEclipticIntersection(
    thetaDegrees + 120 + adThird, latitude, sinEpsilon, cosEpsilon
  );
  const cusp3 = risingEclipticIntersection(
    thetaDegrees + 150 + 2 * adThird, latitude, sinEpsilon, cosEpsilon
  );

  const cusps = [
    ascendant,
    cusp2,
    cusp3,
    normalizeDegrees(midheaven + 180),
    normalizeDegrees(cusp11 + 180),
    normalizeDegrees(cusp12 + 180),
    normalizeDegrees(ascendant + 180),
    normalizeDegrees(cusp2 + 180),
    normalizeDegrees(cusp3 + 180),
    midheaven,
    cusp11,
    cusp12,
  ];

  if (!cusps.every(Number.isFinite)) {
    throw new RangeError("Koch house calculation could not produce twelve finite cusps.");
  }

  return {
    ascendant,
    midheaven,
    houseCusps: cusps,
    midheavenAscensionalDifference: ascensionalDifference * RAD,
  };
}
