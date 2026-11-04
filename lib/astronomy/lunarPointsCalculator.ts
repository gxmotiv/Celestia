/**
 * Lunar Points and Theoretical Points Calculator
 * Computes:
 * - Mean Lilith (Mean Lunar Apogee)
 * - True Lilith (Osculating Lunar Apogee with Evection & Solar pertubations)
 * - White Moon / Selena (Artemis - 7-year spiritual light cycle)
 * - Vertex (Intersection of Prime Vertical and Ecliptic in Western hemisphere)
 * - Anti-Vertex (Polar opposite of Vertex)
 * - East Point / Equatorial Ascendant (Ascendant on the celestial equator)
 * - Trans-Plutonian theoretical points (Proserpine, Hypnos)
 */

import { PlanetPosition, formatDegreeMinute, normalizeDegrees, ZODIAC_SIGNS } from "./ephemeris";

export interface LilithPositions {
  meanLilith: PlanetPosition;
  trueLilith: PlanetPosition;
}

export interface AdditionalPoints {
  meanLilith: PlanetPosition;
  trueLilith: PlanetPosition;
  whiteMoon: PlanetPosition;  // Selena / White Moon
  vertex: PlanetPosition;
  antiVertex: PlanetPosition;
  eastPoint: PlanetPosition;  // Equatorial Ascendant
  proserpine: PlanetPosition; // Theoretical outer archetype
  hypnos: PlanetPosition;     // Dream/subconscious archetype
}

const DEG2RAD = Math.PI / 180.0;
const RAD2DEG = 180.0 / Math.PI;

export class LunarPointsCalculator {
  /**
   * Mean Lilith (Lunar Apogee):
   * Longitude of lunar perigee at J2000.0 is ~83.353243°, apogee is perigee + 180° = 263.353243° or
   * standard Mean Apogee formula = 142.19° + 40.664876° * T (in Julian centuries).
   */
  public calculateMeanLilithLon(jd: number): { lon: number; speed: number } {
    const T = (jd - 2451545.0) / 36525.0;
    // Mean lunar apogee advances ~40.664876 degrees per Julian century
    const lon = normalizeDegrees(142.1903 + 40.664876 * T - 0.00014 * T * T);
    const speed = 40.664876 / 36525.0; // ~0.111° per day
    return { lon, speed };
  }

  /**
   * True (Osculating) Lilith:
   * Incorporates solar perturbations, evection, and annual inequality on the lunar apogee.
   */
  public calculateTrueLilithLon(jd: number): { lon: number; speed: number } {
    const T = (jd - 2451545.0) / 36525.0;
    const mean = this.calculateMeanLilithLon(jd).lon;

    // Solar mean anomaly
    const M_sun = normalizeDegrees(357.5291 + 35999.0503 * T) * DEG2RAD;
    // Lunar mean anomaly
    const M_moon = normalizeDegrees(134.9634 + 477198.8676 * T) * DEG2RAD;
    // Mean elongation of Moon from Sun (D)
    const D = normalizeDegrees(297.8502 + 445267.1115 * T) * DEG2RAD;

    // Main periodic oscillations (evection perturbation on lunar apogee reaches ~11.5°)
    const correction =
      11.69 * Math.sin(2 * D - M_moon) +
      2.05 * Math.sin(M_sun) +
      1.25 * Math.sin(2 * D) -
      0.68 * Math.sin(M_moon);

    const trueLon = normalizeDegrees(mean + correction);
    return { lon: trueLon, speed: 0.111 };
  }

  /**
   * White Moon / Selena:
   * 7-year rhythmic harmonic cycle of the white moon (revolution period exactly 7 sidereal years = ~2556.7 days).
   * Epoch J2000.0 longitude: ~298.15°
   */
  public calculateWhiteMoonLon(jd: number): { lon: number; speed: number } {
    const daysSinceEpoch = jd - 2451545.0;
    const dailyMotion = 360.0 / (7.0 * 365.2422); // ~0.1408° per day
    const lon = normalizeDegrees(298.15 + dailyMotion * daysSinceEpoch);
    return { lon, speed: dailyMotion };
  }

  /**
   * Vertex calculation:
   * The Vertex is the western intersection of the Prime Vertical with the Ecliptic.
   * Formula:
   * tan(V) = -cos(RAMC) / (sin(obliquity) * tan(lat) + cos(obliquity) * sin(RAMC))
   */
  public calculateVertexLon(ramc: number, lat: number, obliquity: number): number {
    const ramcRad = ramc * DEG2RAD;
    const latRad = lat * DEG2RAD;
    const epsRad = obliquity * DEG2RAD;

    // Vertex is in the western hemisphere:
    const num = -Math.cos(ramcRad);
    const den = Math.sin(epsRad) * Math.tan(latRad) + Math.cos(epsRad) * Math.sin(ramcRad);

    let vRad = Math.atan2(num, den);
    let vDeg = normalizeDegrees(vRad * RAD2DEG);

    // Vertex is traditionally on the western side of the meridian
    if (vDeg < 0) vDeg += 360;
    return vDeg;
  }

  /**
   * East Point (Equatorial Ascendant):
   * The intersection of the eastern horizon and the celestial equator.
   * Longitude = atan2(sin(RAMC), cos(RAMC) * cos(obliquity))
   */
  public calculateEastPointLon(ramc: number, obliquity: number): number {
    const ramcRad = ramc * DEG2RAD;
    const epsRad = obliquity * DEG2RAD;

    const y = Math.sin(ramcRad);
    const x = Math.cos(ramcRad) * Math.cos(epsRad);
    let ep = normalizeDegrees(Math.atan2(y, x) * RAD2DEG);
    return ep;
  }

  /**
   * Trans-Plutonian Hypnos & Proserpine (Symbolic theoretical archetypes)
   * Proserpine: ~650-year ultra-slow cycle (subconscious regeneration)
   * Hypnos: ~720-year cycle (the dream world and liminal gates)
   */
  public calculateTheoreticalPoints(jd: number): { proserpine: number; hypnos: number } {
    const T = (jd - 2451545.0) / 36525.0;
    const proserpine = normalizeDegrees(224.5 + 5.53 * T); // In Scorpio/Sagittarius zone
    const hypnos = normalizeDegrees(312.8 + 5.01 * T);     // In Aquarius zone
    return { proserpine, hypnos };
  }

  private assignHouse(lon: number, cusps: number[]): number {
    if (!cusps || cusps.length < 12) return 1;
    for (let i = 0; i < 12; i++) {
      const current = cusps[i];
      const next = cusps[(i + 1) % 12];
      if (next > current) {
        if (lon >= current && lon < next) return i + 1;
      } else {
        if (lon >= current || lon < next) return i + 1;
      }
    }
    return 1;
  }

  private buildPoint(
    id: string,
    name: string,
    symbol: string,
    lon: number,
    speed: number,
    cusps: number[]
  ): PlanetPosition {
    const normalized = normalizeDegrees(lon);
    const signIndex = Math.floor(normalized / 30);
    const signData = ZODIAC_SIGNS[signIndex] || ZODIAC_SIGNS[0];
    const signDegree = normalized - signIndex * 30;
    const house = this.assignHouse(normalized, cusps);

    return {
      id,
      name,
      symbol,
      longitude: Math.round(normalized * 1000) / 1000,
      latitude: 0,
      speed: Math.round(speed * 1000) / 1000,
      isRetrograde: speed < 0,
      sign: signData.name,
      signIndex,
      signDegree: Math.round(signDegree * 1000) / 1000,
      signDegreeFormatted: formatDegreeMinute(normalized),
      house,
      element: signData.element,
      modality: signData.modality,
    };
  }

  /**
   * Computes all points for a chart
   */
  public calculateAll(
    jd: number,
    ramc: number,
    lat: number,
    obliquity: number,
    cusps: number[]
  ): AdditionalPoints {
    const meanL = this.calculateMeanLilithLon(jd);
    const trueL = this.calculateTrueLilithLon(jd);
    const whiteM = this.calculateWhiteMoonLon(jd);
    const vLon = this.calculateVertexLon(ramc, lat, obliquity);
    const antiVLon = normalizeDegrees(vLon + 180.0);
    const epLon = this.calculateEastPointLon(ramc, obliquity);
    const theo = this.calculateTheoreticalPoints(jd);

    return {
      meanLilith: this.buildPoint("MeanLilith", "Mean Lilith", "⚸", meanL.lon, meanL.speed, cusps),
      trueLilith: this.buildPoint("TrueLilith", "True Lilith", "⚸*", trueL.lon, trueL.speed, cusps),
      whiteMoon: this.buildPoint("WhiteMoon", "White Moon (Selena)", "☽*", whiteM.lon, whiteM.speed, cusps),
      vertex: this.buildPoint("Vertex", "Vertex", "Vx", vLon, 0, cusps),
      antiVertex: this.buildPoint("AntiVertex", "Anti-Vertex", "AVx", antiVLon, 0, cusps),
      eastPoint: this.buildPoint("EastPoint", "East Point", "EP", epLon, 0, cusps),
      proserpine: this.buildPoint("Proserpine", "Proserpine", "⚹P", theo.proserpine, 0.001, cusps),
      hypnos: this.buildPoint("Hypnos", "Hypnos", "⚹H", theo.hypnos, 0.001, cusps),
    };
  }
}
