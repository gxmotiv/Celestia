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

import * as Astronomy from "astronomy-engine";
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
   * Mean Lilith (mean lunar apogee).
   *
   * Meeus' polynomial gives the mean longitude of lunar perigee. Mean
   * apogee is the opposite point, so add 180 degrees. The polynomial's
   * independent variable is Julian centuries from J2000.0.
   */
  public calculateMeanLilithLon(jd: number): { lon: number; speed: number } {
    const T = (jd - 2451545.0) / 36525.0;
    const perigee =
      83.3532465
      + 4069.0137287 * T
      - 0.01032 * T * T
      - (T * T * T) / 80053
      + (T * T * T * T) / 18999000;
    const perigeeRatePerCentury =
      4069.0137287
      - 0.02064 * T
      - (3 * T * T) / 80053
      + (4 * T * T * T) / 18999000;

    return {
      lon: normalizeDegrees(perigee + 180),
      speed: perigeeRatePerCentury / 36525,
    };
  }

  /**
   * Calculate the osculating lunar apogee from the instantaneous geocentric
   * Moon state vector. The eccentricity vector points toward perigee; apogee
   * lies in the opposite direction. Astronomy Engine supplies the Moon's
   * position (AU) and velocity (AU/day) in J2000 equatorial coordinates.
   */
  private calculateOsculatingApogeeLongitude(jd: number): number {
    const time = new Astronomy.AstroTime(jd - 2451545.0);
    const state = Astronomy.GeoMoonState(time);

    const r = { x: state.x, y: state.y, z: state.z };
    const v = { x: state.vx, y: state.vy, z: state.vz };
    const rMagnitude = Math.hypot(r.x, r.y, r.z);
    if (!Number.isFinite(rMagnitude) || rMagnitude <= 0) {
      throw new Error("Invalid geocentric Moon position while calculating osculating apogee.");
    }

    // Earth + Moon gravitational parameter, converted to AU^3 / day^2.
    const earthMoonMuKm3PerSec2 = 398600.435507 + 4902.800118;
    const auKm = 149597870.7;
    const secondsPerDay = 86400;
    const mu = earthMoonMuKm3PerSec2 * secondsPerDay * secondsPerDay / (auKm * auKm * auKm);

    const h = {
      x: r.y * v.z - r.z * v.y,
      y: r.z * v.x - r.x * v.z,
      z: r.x * v.y - r.y * v.x,
    };
    const vCrossH = {
      x: v.y * h.z - v.z * h.y,
      y: v.z * h.x - v.x * h.z,
      z: v.x * h.y - v.y * h.x,
    };
    const eccentricity = {
      x: vCrossH.x / mu - r.x / rMagnitude,
      y: vCrossH.y / mu - r.y / rMagnitude,
      z: vCrossH.z / mu - r.z / rMagnitude,
    };
    const eccentricityMagnitude = Math.hypot(
      eccentricity.x,
      eccentricity.y,
      eccentricity.z
    );

    if (!Number.isFinite(eccentricityMagnitude) || eccentricityMagnitude < 1e-6) {
      throw new Error("The instantaneous lunar orbit is too close to circular to resolve an apogee direction.");
    }

    // The negative eccentricity vector points toward apogee.
    const apogeeVector = {
      x: -eccentricity.x,
      y: -eccentricity.y,
      z: -eccentricity.z,
      t: time,
    };
    const ecliptic = Astronomy.Ecliptic(apogeeVector);
    return normalizeDegrees(ecliptic.elon);
  }

  /**
   * True Lilith / osculating lunar apogee. Its instantaneous position is
   * calculated from the geocentric position-velocity state. Daily motion is
   * estimated from a centered finite difference to retain short-period motion.
   */
  public calculateTrueLilithLon(jd: number): { lon: number; speed: number } {
    const halfStepDays = 0.05;
    const lon = this.calculateOsculatingApogeeLongitude(jd);
    const before = this.calculateOsculatingApogeeLongitude(jd - halfStepDays);
    const after = this.calculateOsculatingApogeeLongitude(jd + halfStepDays);

    let delta = after - before;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    return {
      lon,
      speed: delta / (2 * halfStepDays),
    };
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
