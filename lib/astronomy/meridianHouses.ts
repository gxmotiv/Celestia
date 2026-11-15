/**
 * Meridian / Axial Rotation house cusps (Swiss Ephemeris house code X).
 *
 * Unlike Morinus, this method divides the ecliptic at twelve points whose
 * right ascensions are ARMC + n × 30°. The corresponding ecliptic longitude is
 * obtained from the inverse equatorial transform:
 *   tan(RA) = tan(longitude) × cos(obliquity).
 *
 * Cusp geometry depends on ARMC and obliquity, not geographic latitude.
 * The astronomical Ascendant remains a separate, latitude-dependent angle.
 */
export interface MeridianHouseResult {
  /** Houses 1 through 12, zero-indexed in this array. */
  houseCusps: number[];
}

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

/** Convert the ecliptic point with a specified right ascension to longitude. */
function eclipticPointAtRightAscension(
  rightAscensionDegrees: number,
  obliquityDegrees: number
): number {
  const rightAscension = rightAscensionDegrees * DEG_TO_RAD;
  const obliquity = obliquityDegrees * DEG_TO_RAD;
  return normalizeDegrees(
    Math.atan2(
      Math.sin(rightAscension),
      Math.cos(rightAscension) * Math.cos(obliquity)
    ) * RAD_TO_DEG
  );
}

/**
 * Calculate Meridian / Axial Rotation houses from ARMC and obliquity.
 * Geographic latitude is intentionally not an input.
 */
export function calculateMeridianHouses(
  armcDegrees: number,
  obliquityDegrees: number
): MeridianHouseResult {
  if (!Number.isFinite(armcDegrees) || !Number.isFinite(obliquityDegrees)) {
    throw new RangeError("Meridian houses require finite ARMC and obliquity.");
  }
  if (obliquityDegrees < 0 || obliquityDegrees >= 90) {
    throw new RangeError("Meridian obliquity must be between 0° inclusive and 90° exclusive.");
  }

  const armc = normalizeDegrees(armcDegrees);
  const houseCusps = Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const rightAscension = armc + (house - 10) * 30;
    return eclipticPointAtRightAscension(rightAscension, obliquityDegrees);
  });

  if (!houseCusps.every(Number.isFinite)) {
    throw new RangeError("Meridian calculation did not produce twelve finite house cusps.");
  }

  return { houseCusps };
}
