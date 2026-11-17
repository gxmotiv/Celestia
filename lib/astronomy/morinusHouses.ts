/**
 * Morinus house cusps.
 *
 * The celestial equator is divided into twelve equal 30° arcs beginning at
 * the local meridian (ARMC). Each equatorial point (declination 0°) is
 * transformed to ecliptic coordinates. This is not the Meridian/Axial
 * Rotation system: the two use different spherical transformations.
 *
 * Morinus cusp geometry depends on ARMC and obliquity, not geographic
 * latitude. The Ascendant remains a separate chart angle and is handled by
 * the shared astronomy facade.
 */
export interface MorinusHouseResult {
  /** Houses 1 through 12, zero-indexed in this array. */
  houseCusps: number[];
}

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

/**
 * Transform an equatorial point on the celestial equator (RA, declination 0°)
 * into ecliptic longitude using the true obliquity of date.
 */
function equatorialEquatorPointToEcliptic(
  rightAscensionDegrees: number,
  obliquityDegrees: number
): number {
  const rightAscension = rightAscensionDegrees * DEG_TO_RAD;
  const obliquity = obliquityDegrees * DEG_TO_RAD;
  return normalizeDegrees(
    Math.atan2(
      Math.sin(rightAscension) * Math.cos(obliquity),
      Math.cos(rightAscension)
    ) * RAD_TO_DEG
  );
}

/**
 * Calculate Morinus houses from ARMC and obliquity, in degrees.
 *
 * Cusp 10 is the equatorial point at RA = ARMC; cusps 11 and 12 follow
 * at +30° and +60°, cusp 1 at +90°, and so on. Geographic latitude is
 * intentionally not an input because the Morinus house cusps are
 * latitude-independent.
 */
export function calculateMorinusHouses(
  armcDegrees: number,
  obliquityDegrees: number
): MorinusHouseResult {
  if (!Number.isFinite(armcDegrees) || !Number.isFinite(obliquityDegrees)) {
    throw new RangeError("Morinus houses require finite ARMC and obliquity.");
  }
  if (obliquityDegrees < 0 || obliquityDegrees >= 90) {
    throw new RangeError("Morinus obliquity must be between 0° inclusive and 90° exclusive.");
  }

  const armc = normalizeDegrees(armcDegrees);
  const houseCusps = Array.from({ length: 12 }, (_, index) => {
    const house = index + 1;
    const rightAscension = armc + (house - 10) * 30;
    return equatorialEquatorPointToEcliptic(rightAscension, obliquityDegrees);
  });

  if (!houseCusps.every(Number.isFinite)) {
    throw new RangeError("Morinus calculation did not produce twelve finite house cusps.");
  }

  return { houseCusps };
}
