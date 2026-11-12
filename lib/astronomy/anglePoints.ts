import { normalizeDegrees } from "./ephemeris";

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

function asc2(equatorIntersection: number, poleLatitude: number, obliquity: number): number {
  const x = normalizeDegrees(equatorIntersection);
  const f = poleLatitude * DEG2RAD;
  const eps = obliquity * DEG2RAD;
  const sineX = Math.sin(x * DEG2RAD);
  const denominator = -Math.tan(f) * Math.sin(eps) + Math.cos(eps) * Math.cos(x * DEG2RAD);
  let angle = Math.atan2(sineX, denominator) * RAD2DEG;
  if (angle < 0) angle += 180;
  return normalizeDegrees(angle);
}

function eclipticIntersection(equatorIntersection: number, poleLatitude: number, obliquity: number): number {
  const x = normalizeDegrees(equatorIntersection);
  const quadrant = Math.floor(x / 90) + 1;
  if (Math.abs(90 - poleLatitude) < 1e-10) return 180;
  if (Math.abs(90 + poleLatitude) < 1e-10) return 0;

  let value: number;
  if (quadrant === 1) value = asc2(x, poleLatitude, obliquity);
  else if (quadrant === 2) value = 180 - asc2(180 - x, -poleLatitude, obliquity);
  else if (quadrant === 3) value = 180 + asc2(x - 180, -poleLatitude, obliquity);
  else value = 360 - asc2(360 - x, poleLatitude, obliquity);

  return normalizeDegrees(value);
}

/** Ecliptic longitude of the Vertex (western prime-vertical/ecliptic intersection). */
export function calculateVertexLongitude(ramc: number, latitude: number, obliquity: number): number {
  if (![ramc, latitude, obliquity].every(Number.isFinite) || latitude < -90 || latitude > 90 || Math.abs(obliquity) > 90) {
    throw new RangeError("Vertex calculation requires finite RAMC/obliquity and latitude within ±90°.");
  }
  const poleLatitude = latitude >= 0 ? 90 - latitude : -90 - latitude;
  let vertex = eclipticIntersection(ramc - 90, poleLatitude, obliquity);

  // In tropical latitudes, retain the western Vertex branch relative to MC.
  if (Math.abs(latitude) <= Math.abs(obliquity)) {
    const mc = normalizeDegrees(Math.atan2(
      Math.sin(ramc * DEG2RAD),
      Math.cos(ramc * DEG2RAD) * Math.cos(obliquity * DEG2RAD)
    ) * RAD2DEG);
    const signedDifference = normalizeDegrees(vertex - mc + 180) - 180;
    if (signedDifference > 0) vertex = normalizeDegrees(vertex + 180);
  }
  return vertex;
}

/**
 * Astrological East Point: the ecliptic point whose right ascension is
 * RAMC + 90°. This is distinct from the equatorial point on the eastern horizon.
 */
export function calculateEastPointLongitude(ramc: number, obliquity: number): number {
  if (![ramc, obliquity].every(Number.isFinite) || Math.abs(obliquity) > 90) {
    throw new RangeError("East Point calculation requires finite RAMC and obliquity.");
  }
  return eclipticIntersection(ramc + 90, 0, obliquity);
}
