/**
 * Alcabitius house cusps from divisions of the Ascendant's diurnal and
 * nocturnal semi-arcs.
 *
 * The Ascendant's declination determines the diurnal semi-arc (SDA) and
 * nocturnal semi-arc (SNA). The SDA and SNA are each trisected in right
 * ascension; the resulting equatorial points are projected to the ecliptic.
 *
 * Reference fixtures are captured independently from PySwissEph /
 * Swiss Ephemeris 2.10.03 houses_armc(..., b"B"). This module is a separate
 * mathematical derivation and does not call or bundle Swiss Ephemeris.
 */
export interface AlcabitiusHouseResult {
  ascendant: number;
  midheaven: number;
  /** Houses 1 through 12, zero-indexed in this array. */
  houseCusps: number[];
  /** True when the 180° ascendant orientation adjustment was required. */
  orientationAdjusted: boolean;
  semiDiurnalArc: number;
  semiNocturnalArc: number;
}

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function clampUnit(value: number): number {
  return Math.max(-1, Math.min(1, value));
}

function signedAngularDifference(from: number, to: number): number {
  return normalizeDegrees(from - to + 180) - 180;
}

/** Convert a right ascension on the celestial equator to ecliptic longitude. */
function equatorialRightAscensionToEcliptic(
  rightAscensionDegrees: number,
  cosObliquity: number
): number {
  const rightAscension = rightAscensionDegrees * DEG_TO_RAD;
  return normalizeDegrees(
    Math.atan2(
      Math.sin(rightAscension),
      Math.cos(rightAscension) * cosObliquity
    ) * RAD_TO_DEG
  );
}

/**
 * Calculate Alcabitius houses from ARMC, geographic latitude and obliquity.
 * All inputs and returned longitudes are degrees. ARMC is east-positive and
 * already includes the observer's geographic longitude.
 *
 * The local meridian / horizon construction is singular at the exact
 * geographic poles. The pure calculator rejects those inputs; the shared
 * application facade explicitly falls back to Porphyry and discloses it.
 */
export function calculateAlcabitiusHouses(
  armcDegrees: number,
  latitudeDegrees: number,
  obliquityDegrees: number
): AlcabitiusHouseResult {
  if (![armcDegrees, latitudeDegrees, obliquityDegrees].every(Number.isFinite)) {
    throw new RangeError("Alcabitius houses require finite ARMC, latitude and obliquity.");
  }
  if (latitudeDegrees < -90 || latitudeDegrees > 90) {
    throw new RangeError("Alcabitius latitude must be between -90° and +90°.");
  }
  if (Math.abs(latitudeDegrees) >= 90) {
    throw new RangeError("Alcabitius semi-arc construction is indeterminate at the exact geographic poles.");
  }
  if (obliquityDegrees < 0 || obliquityDegrees >= 90) {
    throw new RangeError("Alcabitius obliquity must be between 0° inclusive and 90° exclusive.");
  }

  const armc = normalizeDegrees(armcDegrees);
  const theta = armc * DEG_TO_RAD;
  const latitude = latitudeDegrees * DEG_TO_RAD;
  const obliquity = obliquityDegrees * DEG_TO_RAD;
  const sinObliquity = Math.sin(obliquity);
  const cosObliquity = Math.cos(obliquity);

  const midheaven = normalizeDegrees(
    Math.atan2(Math.sin(theta), Math.cos(theta) * cosObliquity) * RAD_TO_DEG
  );

  let ascendant = normalizeDegrees(
    Math.atan2(
      Math.cos(theta),
      -Math.sin(theta) * cosObliquity - Math.tan(latitude) * sinObliquity
    ) * RAD_TO_DEG
  );

  // Follow the published Alcabitius orientation convention: if the signed
  // ASC-to-MC arc is negative, rotate the Ascendant by 180° before deriving
  // its declination and semi-arcs. This is not a house-system fallback.
  const orientationAdjusted = signedAngularDifference(ascendant, midheaven) < 0;
  if (orientationAdjusted) ascendant = normalizeDegrees(ascendant + 180);

  const ascendantDeclination = Math.asin(
    clampUnit(Math.sin(ascendant * DEG_TO_RAD) * sinObliquity)
  );
  const semiDiurnalRatio = clampUnit(
    -Math.tan(latitude) * Math.tan(ascendantDeclination)
  );
  const semiDiurnalArc = Math.acos(semiDiurnalRatio) * RAD_TO_DEG;
  const semiNocturnalArc = 180 - semiDiurnalArc;

  const cusp11 = equatorialRightAscensionToEcliptic(
    armc + semiDiurnalArc / 3,
    cosObliquity
  );
  const cusp12 = equatorialRightAscensionToEcliptic(
    armc + (2 * semiDiurnalArc) / 3,
    cosObliquity
  );
  const cusp2 = equatorialRightAscensionToEcliptic(
    armc + 180 - (2 * semiNocturnalArc) / 3,
    cosObliquity
  );
  const cusp3 = equatorialRightAscensionToEcliptic(
    armc + 180 - semiNocturnalArc / 3,
    cosObliquity
  );
  const opposite = (longitude: number) => normalizeDegrees(longitude + 180);

  const houseCusps = [
    ascendant,
    cusp2,
    cusp3,
    opposite(midheaven),
    opposite(cusp11),
    opposite(cusp12),
    opposite(ascendant),
    opposite(cusp2),
    opposite(cusp3),
    midheaven,
    cusp11,
    cusp12,
  ];

  if (!houseCusps.every(Number.isFinite)) {
    throw new RangeError("Alcabitius calculation did not produce twelve finite house cusps.");
  }

  return {
    ascendant,
    midheaven,
    houseCusps,
    orientationAdjusted,
    semiDiurnalArc,
    semiNocturnalArc,
  };
}
