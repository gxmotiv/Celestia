/**
 * Approximate Major-Asteroid Position Calculator
 * Estimates geocentric ecliptic longitudes, latitudes, speeds, and sign degrees
 * for Ceres, Pallas, Juno, and Vesta.
 *
 * Uses simplified Keplerian orbit mechanics with fixed J2000-era orbital elements.
 * Accuracy across dates has not been independently benchmarked against a current
 * small-body ephemeris; do not interpret display decimals as an accuracy guarantee.
 */

import { PlanetPosition, formatDegreeMinute, normalizeDegrees, ZODIAC_SIGNS } from "./ephemeris";

export interface OrbitalElements {
  a: number;   // Semi-major axis in AU
  e: number;   // Eccentricity
  i: number;   // Inclination in degrees
  node: number;// Longitude of ascending node (Ω) in degrees
  w: number;   // Argument of perihelion (ω) in degrees
  M0: number;  // Mean anomaly at epoch J2000.0 in degrees
  n: number;   // Mean daily motion in degrees/day
  epochJD: number; // 2451545.0
}

export interface AsteroidPositions {
  ceres: PlanetPosition;
  pallas: PlanetPosition;
  juno: PlanetPosition;
  vesta: PlanetPosition;
}

// Astrological symbols for major asteroids
export const ASTEROID_SYMBOLS: Record<string, string> = {
  Ceres: "⚳",
  Pallas: "⚴",
  Juno: "⚵",
  Vesta: "⚶",
};

const DEG2RAD = Math.PI / 180.0;
const RAD2DEG = 180.0 / Math.PI;

export class AsteroidCalculator {
  // Mean orbital elements at J2000.0 (JD 2451545.0)
  private static readonly CERES_ELEMENTS: OrbitalElements = {
    a: 2.7675,
    e: 0.0758,
    i: 10.593,
    node: 80.329,
    w: 73.597,
    M0: 95.989,
    n: 0.214081, // 360 / (4.60 * 365.25)
    epochJD: 2451545.0,
  };

  private static readonly PALLAS_ELEMENTS: OrbitalElements = {
    a: 2.7722,
    e: 0.2310,
    i: 34.841,
    node: 173.080,
    w: 310.048,
    M0: 42.115,
    n: 0.213537, // 360 / (4.62 * 365.25)
    epochJD: 2451545.0,
  };

  private static readonly JUNO_ELEMENTS: OrbitalElements = {
    a: 2.6706,
    e: 0.2555,
    i: 12.982,
    node: 169.851,
    w: 248.407,
    M0: 38.083,
    n: 0.225844, // 360 / (4.36 * 365.25)
    epochJD: 2451545.0,
  };

  private static readonly VESTA_ELEMENTS: OrbitalElements = {
    a: 2.3618,
    e: 0.0887,
    i: 7.140,
    node: 103.811,
    w: 151.198,
    M0: 20.863,
    n: 0.271526, // 360 / (3.63 * 365.25)
    epochJD: 2451545.0,
  };

  /**
   * Solve Kepler's equation: M = E - e * sin(E) for eccentric anomaly E
   */
  private solveKepler(M_rad: number, e: number): number {
    let E = M_rad;
    for (let iter = 0; iter < 15; iter++) {
      const dE = (E - e * Math.sin(E) - M_rad) / (1.0 - e * Math.cos(E));
      E -= dE;
      if (Math.abs(dE) < 1e-7) break;
    }
    return E;
  }

  /**
   * Compute heliocentric rectangular coordinates (x, y, z) in AU
   */
  private getHeliocentricPosition(elem: OrbitalElements, jd: number): { x: number; y: number; z: number } {
    const daysSinceEpoch = jd - elem.epochJD;
    const M_deg = normalizeDegrees(elem.M0 + elem.n * daysSinceEpoch);
    const M_rad = M_deg * DEG2RAD;

    const E_rad = this.solveKepler(M_rad, elem.e);

    // Heliocentric coordinates in orbital plane
    const x_orb = elem.a * (Math.cos(E_rad) - elem.e);
    const y_orb = elem.a * Math.sqrt(1 - elem.e * elem.e) * Math.sin(E_rad);

    // Rotate to ecliptic plane
    const node_rad = elem.node * DEG2RAD;
    const w_rad = elem.w * DEG2RAD;
    const i_rad = elem.i * DEG2RAD;

    const cosN = Math.cos(node_rad);
    const sinN = Math.sin(node_rad);
    const cosW = Math.cos(w_rad);
    const sinW = Math.sin(w_rad);
    const cosI = Math.cos(i_rad);
    const sinI = Math.sin(i_rad);

    // Transformation matrix elements
    const Px = cosW * cosN - sinW * sinN * cosI;
    const Py = cosW * sinN + sinW * cosN * cosI;
    const Pz = sinW * sinI;

    const Qx = -sinW * cosN - cosW * sinN * cosI;
    const Qy = -sinW * sinN + cosW * cosN * cosI;
    const Qz = cosW * sinI;

    const x = x_orb * Px + y_orb * Qx;
    const y = x_orb * Py + y_orb * Qy;
    const z = x_orb * Pz + y_orb * Qz;

    return { x, y, z };
  }

  /**
   * Earth's heliocentric position approximation
   */
  private getEarthPosition(jd: number): { x: number; y: number; z: number } {
    const T = (jd - 2451545.0) / 36525.0;
    const L0 = normalizeDegrees(280.46646 + 36000.76983 * T);
    const M = normalizeDegrees(357.52911 + 35999.05029 * T) * DEG2RAD;
    const C = (1.914602 - 0.004817 * T) * Math.sin(M) + (0.019993 - 0.000101 * T) * Math.sin(2 * M);
    const trueSunLon = (L0 + C) * DEG2RAD;
    const R = 1.00014061 - 0.01670862 * Math.cos(M) - 0.00013959 * Math.cos(2 * M);

    // Earth is opposite the Sun from the Sun's perspective
    return {
      x: -R * Math.cos(trueSunLon),
      y: -R * Math.sin(trueSunLon),
      z: 0,
    };
  }

  /**
   * Convert heliocentric body position to geocentric ecliptic longitude, latitude, and daily speed
   */
  public calculatePosition(elem: OrbitalElements, jd: number): { longitude: number; latitude: number; speed: number } {
    const p1 = this.getHeliocentricPosition(elem, jd);
    const earth1 = this.getEarthPosition(jd);

    const geoX = p1.x - earth1.x;
    const geoY = p1.y - earth1.y;
    const geoZ = p1.z - earth1.z;

    let lon = normalizeDegrees(Math.atan2(geoY, geoX) * RAD2DEG);
    const distXY = Math.sqrt(geoX * geoX + geoY * geoY);
    const lat = Math.atan2(geoZ, distXY) * RAD2DEG;

    // Daily speed estimation by evaluating jd + 1 day
    const p2 = this.getHeliocentricPosition(elem, jd + 1);
    const earth2 = this.getEarthPosition(jd + 1);
    const geoX2 = p2.x - earth2.x;
    const geoY2 = p2.y - earth2.y;
    const lon2 = normalizeDegrees(Math.atan2(geoY2, geoX2) * RAD2DEG);

    let speed = lon2 - lon;
    if (speed > 180) speed -= 360;
    if (speed < -180) speed += 360;

    return { longitude: lon, latitude: lat, speed };
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

  private buildPlanetPosition(
    id: string,
    name: string,
    lon: number,
    lat: number,
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
      symbol: ASTEROID_SYMBOLS[name] || "✦",
      longitude: Math.round(normalized * 1000) / 1000,
      latitude: Math.round(lat * 100) / 100,
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
   * Calculate all 4 major asteroids for a given Julian Day and house cusps
   */
  public calculateAsteroids(jd: number, cusps: number[] = []): AsteroidPositions {
    const ceresPos = this.calculatePosition(AsteroidCalculator.CERES_ELEMENTS, jd);
    const pallasPos = this.calculatePosition(AsteroidCalculator.PALLAS_ELEMENTS, jd);
    const junoPos = this.calculatePosition(AsteroidCalculator.JUNO_ELEMENTS, jd);
    const vestaPos = this.calculatePosition(AsteroidCalculator.VESTA_ELEMENTS, jd);

    return {
      ceres: this.buildPlanetPosition("Ceres", "Ceres", ceresPos.longitude, ceresPos.latitude, ceresPos.speed, cusps),
      pallas: this.buildPlanetPosition("Pallas", "Pallas", pallasPos.longitude, pallasPos.latitude, pallasPos.speed, cusps),
      juno: this.buildPlanetPosition("Juno", "Juno", junoPos.longitude, junoPos.latitude, junoPos.speed, cusps),
      vesta: this.buildPlanetPosition("Vesta", "Vesta", vestaPos.longitude, vestaPos.latitude, vestaPos.speed, cusps),
    };
  }
}
