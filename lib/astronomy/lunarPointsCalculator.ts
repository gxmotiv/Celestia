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
import { calculateEastPointLongitude, calculateVertexLongitude } from "./anglePoints";

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
   * Mean Black Moon Lilith (mean lunar apogee).
   *
   * The prior implementation used 142.1903 + 40.664876*T with T in
   * Julian centuries. That rate was off by a factor of 100 and its J2000
   * epoch was inconsistent with the mean-apogee definition.
   *
   * This compact empirical fit is cross-checked against Swiss Ephemeris
   * mean-apogee reference output around 1900–2050. It is an approximation,
   * not a replacement for the full Moshier/ELP lunar theory.
   */
  private meanApogeeLongitude(jd: number): number {
    const daysSinceJ2000 = jd - 2451545.0;
    const phaseDegrees = 0.3287143373 * daysSinceJ2000 + 96.6084061482;
    return normalizeDegrees(
      263.3521188770 +
      0.1114036699 * daysSinceJ2000 +
      0.1156754590 * Math.sin(phaseDegrees * DEG2RAD)
    );
  }

  public calculateMeanLilithLon(jd: number): { lon: number; speed: number } {
    if (!Number.isFinite(jd)) {
      throw new RangeError("Mean lunar apogee requires a finite Julian Day.");
    }
    const stepDays = 0.5;
    const lon = this.meanApogeeLongitude(jd);
    const before = this.meanApogeeLongitude(jd - stepDays);
    const after = this.meanApogeeLongitude(jd + stepDays);
    const signedDelta = normalizeDegrees(after - before + 180) - 180;
    return { lon, speed: signedDelta / (2 * stepDays) };
  }

  /**
   * Approximate True-Lilith model using a compact periodic correction.
   * This is NOT a full osculating-apogee solution from lunar position/velocity vectors.
   */
  public calculateTrueLilithLon(jd: number): { lon: number; speed: number } {
    if (!Number.isFinite(jd)) {
      throw new RangeError("Approximate True Lilith requires a finite Julian Day.");
    }
    const correctedLongitude = (atJd: number) => {
      const t = (atJd - 2451545.0) / 36525.0;
      const meanLongitude = this.meanApogeeLongitude(atJd);
      const sunMeanAnomaly = normalizeDegrees(357.5291 + 35999.0503 * t) * DEG2RAD;
      const moonMeanAnomaly = normalizeDegrees(134.9634 + 477198.8676 * t) * DEG2RAD;
      const elongation = normalizeDegrees(297.8502 + 445267.1115 * t) * DEG2RAD;
      const periodic = 11.69 * Math.sin(2 * elongation - moonMeanAnomaly) +
        2.05 * Math.sin(sunMeanAnomaly) + 1.25 * Math.sin(2 * elongation) -
        0.68 * Math.sin(moonMeanAnomaly);
      return normalizeDegrees(meanLongitude + periodic);
    };
    const stepDays = 0.5;
    const longitude = correctedLongitude(jd);
    const before = correctedLongitude(jd - stepDays);
    const after = correctedLongitude(jd + stepDays);
    const signedDelta = normalizeDegrees(after - before + 180) - 180;
    return { lon: longitude, speed: signedDelta / (2 * stepDays) };
  }
  /**
   * Symbolic White Moon / Selena convention.
   * This is not a known physical body or an astronomical lunar orbit; multiple
   * astrological schools use different symbolic cycles and epochs.
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
   * Uses the same quadrant-aware prime-vertical intersection as the chart house-angle engine.
   */
  public calculateVertexLon(ramc: number, lat: number, obliquity: number): number {
    return calculateVertexLongitude(ramc, lat, obliquity);
  }

  /**
   * Astrological East Point: ecliptic longitude whose right ascension is RAMC + 90°.
   * It is distinct from the equatorial point on the eastern horizon.
   */
  public calculateEastPointLon(ramc: number, obliquity: number): number {
    return calculateEastPointLongitude(ramc, obliquity);
  }

  /**
   * Hypothetical symbolic points sometimes named Proserpine and Hypnos.
   * These are not measured orbits and must not be presented as physical planets.
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
