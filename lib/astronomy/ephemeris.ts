/**
 * High-Precision Ephemeris and Astrological Calculations Engine
 * Computes geocentric ecliptic coordinates for the Sun, Moon, 8 planets, Lunar Nodes,
 * Midheaven (MC), Ascendant (ASC), and 12 House Cusps (Placidus, Equal, Whole Sign).
 * Fully client-side, self-contained, and compliant with astronomical standards (VSOP/Meeus).
 */

import { swissEphemeris } from "./swissEphemeris";
import { MinorAspect, MinorAspectsEngine } from "./minorAspects";
import { AsteroidCalculator, AsteroidPositions } from "./asteroidCalculator";
import { LunarPointsCalculator, AdditionalPoints } from "./lunarPointsCalculator";
import { ArabianPartsCalculator, ArabianPartsResult } from "./arabianPartsCalculator";
import { PlanetaryHoursCalculator, PlanetaryHoursResult } from "./planetaryHours";
import { AlmutenFigurisCalculator, AlmutenFigurisResult } from "./almutenFigurisCalculator";

export type SolarProximity = "Cazimi" | "Combust" | "UnderBeams" | "Free";

export interface PlanetPosition {
  id: string;
  name: string;
  symbol: string;
  longitude: number; // 0 to 360 degrees
  latitude?: number;
  speed?: number; // degrees per day (positive = direct, negative = retrograde)
  isRetrograde: boolean;
  sign: string;
  signIndex: number; // 0 = Aries, 11 = Pisces
  signDegree: number; // 0 to 29.999 degrees in sign
  signDegreeFormatted: string; // e.g. "14°23' Aries"
  house: number; // 1 to 12
  element: "Fire" | "Earth" | "Air" | "Water";
  modality: "Cardinal" | "Fixed" | "Mutable";
  solarProximity?: SolarProximity;
}

export interface HouseCusp {
  house: number;
  longitude: number;
  sign: string;
  signIndex: number;
  signDegreeFormatted: string;
}

export interface AspectData {
  planet1: string;
  planet2: string;
  aspectName: "Conjunction" | "Sextile" | "Square" | "Trine" | "Opposition" | "Quincunx" | "Semisextile";
  symbol: string;
  angle: number; // nominal angle: 0, 60, 90, 120, 180, etc.
  actualDiff: number; // absolute difference
  orb: number; // orb difference from exact
  isApplying: boolean;
  nature: "Harmonious" | "Challenging" | "Neutral";
}

export interface WesternChartData {
  planets: PlanetPosition[];
  houses: HouseCusp[];
  aspects: AspectData[];
  minorAspects?: MinorAspect[];
  ascendant: PlanetPosition;
  midheaven: PlanetPosition;
  descendant: number;
  imumCoeli: number;
  julianDay: number;
  siderealTime: number; // RAMC in degrees
  obliquity: number;
  houseSystem: "Placidus" | "Equal" | "WholeSign";
  asteroids?: AsteroidPositions;
  additionalPoints?: AdditionalPoints;
  arabianParts?: ArabianPartsResult;
  planetaryHours?: PlanetaryHoursResult;
  almutenFiguris?: AlmutenFigurisResult;
}

export const ZODIAC_SIGNS = [
  { name: "Aries", symbol: "♈", element: "Fire", modality: "Cardinal", ruler: "Mars" },
  { name: "Taurus", symbol: "♉", element: "Earth", modality: "Fixed", ruler: "Venus" },
  { name: "Gemini", symbol: "♊", element: "Air", modality: "Mutable", ruler: "Mercury" },
  { name: "Cancer", symbol: "♋", element: "Water", modality: "Cardinal", ruler: "Moon" },
  { name: "Leo", symbol: "♌", element: "Fire", modality: "Fixed", ruler: "Sun" },
  { name: "Virgo", symbol: "♍", element: "Earth", modality: "Mutable", ruler: "Mercury" },
  { name: "Libra", symbol: "♎", element: "Air", modality: "Cardinal", ruler: "Venus" },
  { name: "Scorpio", symbol: "♏", element: "Water", modality: "Fixed", ruler: "Pluto" },
  { name: "Sagittarius", symbol: "♐", element: "Fire", modality: "Mutable", ruler: "Jupiter" },
  { name: "Capricorn", symbol: "♑", element: "Earth", modality: "Cardinal", ruler: "Saturn" },
  { name: "Aquarius", symbol: "♒", element: "Air", modality: "Fixed", ruler: "Uranus" },
  { name: "Pisces", symbol: "♓", element: "Water", modality: "Mutable", ruler: "Neptune" },
] as const;

export const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "♅",
  Neptune: "♆",
  Pluto: "♇",
  NorthNode: "☊",
  SouthNode: "☋",
  Chiron: "⚷",
  Ceres: "⚳",
  Pallas: "⚴",
  Juno: "⚵",
  Vesta: "⚶",
  MeanLilith: "⚸",
  TrueLilith: "⚸*",
  WhiteMoon: "☽*",
  Vertex: "Vx",
  AntiVertex: "AVx",
  EastPoint: "EP",
  Ascendant: "AC",
  Midheaven: "MC",
};

// Math helpers
const DEG2RAD = Math.PI / 180.0;
const RAD2DEG = 180.0 / Math.PI;

export function normalizeDegrees(deg: number): number {
  let d = deg % 360.0;
  if (d < 0) d += 360.0;
  return d;
}

export function formatDegreeMinute(deg: number): string {
  const norm = normalizeDegrees(deg);
  const signIdx = Math.floor(norm / 30);
  const sign = ZODIAC_SIGNS[signIdx]?.name || "Aries";
  const degInSign = norm - signIdx * 30;
  const d = Math.floor(degInSign);
  const m = Math.floor((degInSign - d) * 60);
  return `${d}°${m.toString().padStart(2, "0")}' ${sign}`;
}

/**
 * Calculates Julian Day from UTC Year, Month, Day, and decimal hour
 */
export function calculateJulianDay(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0
): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const decimalDay = day + (hour + minute / 60.0 + second / 3600.0) / 24.0;
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const jd =
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    decimalDay +
    B -
    1524.5;
  return jd;
}

/**
 * Greenwich Mean Sidereal Time in degrees
 */
export function calculateGMST(jd: number): number {
  const T = (jd - 2451545.0) / 36525.0;
  let gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000.0;
  return normalizeDegrees(gmst);
}

/**
 * True obliquity of the ecliptic in degrees
 */
export function calculateObliquity(T: number): number {
  return 23.43929111 - 0.013004167 * T - 0.000000164 * T * T + 0.0000005036 * T * T * T;
}

/**
 * Solve Kepler's equation: M = E - e * sin(E)
 */
function solveKepler(M: number, e: number): number {
  const mRad = M * DEG2RAD;
  let E = mRad;
  for (let i = 0; i < 20; i++) {
    const dE = (E - e * Math.sin(E) - mRad) / (1.0 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < 1e-8) break;
  }
  return E; // in radians
}

/**
 * Sun's true geocentric ecliptic longitude (VSOP87 / Meeus approximation)
 */
export function calculateSun(T: number): { lon: number; R: number } {
  // Mean longitude of Sun
  const L0 = normalizeDegrees(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  // Mean anomaly of Sun
  const M = normalizeDegrees(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const mRad = M * DEG2RAD;
  // Equation of center
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(mRad) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * mRad) +
    0.000289 * Math.sin(3 * mRad);
  // True longitude
  const trueLon = L0 + C;
  // Apparent longitude correcting for nutation and aberration
  const omega = 125.04 - 1934.136 * T;
  const lambda = trueLon - 0.00569 - 0.00478 * Math.sin(omega * DEG2RAD);
  const e = 0.016708634 - 0.000042037 * T;
  const v = M + C;
  const R = (1.000001018 * (1 - e * e)) / (1 + e * Math.cos(v * DEG2RAD));
  return { lon: normalizeDegrees(lambda), R };
}

/**
 * Moon's true geocentric ecliptic longitude and latitude (Meeus Ch. 47 series)
 */
export function calculateMoon(T: number): { lon: number; lat: number } {
  const Lprime = normalizeDegrees(218.3164477 + 481267.88123421 * T);
  const D = normalizeDegrees(297.8501921 + 445267.1114034 * T); // elongation
  const M = normalizeDegrees(357.5291092 + 35999.0502909 * T); // Sun mean anomaly
  const Mprime = normalizeDegrees(134.9633964 + 477198.8675055 * T); // Moon mean anomaly
  const F = normalizeDegrees(93.272095 + 483202.0175233 * T); // Moon argument of latitude

  const dRad = D * DEG2RAD;
  const mRad = M * DEG2RAD;
  const mpRad = Mprime * DEG2RAD;
  const fRad = F * DEG2RAD;

  // Major periodic terms in longitude (degrees)
  let dL =
    6.288774 * Math.sin(mpRad) +
    1.274027 * Math.sin(2 * dRad - mpRad) +
    0.658314 * Math.sin(2 * dRad) +
    0.213618 * Math.sin(2 * mpRad) -
    0.185116 * Math.sin(mRad) -
    0.114332 * Math.sin(2 * fRad) +
    0.058793 * Math.sin(2 * dRad - 2 * mpRad) +
    0.057066 * Math.sin(2 * dRad - mRad - mpRad) +
    0.05332 * Math.sin(2 * dRad + mpRad) +
    0.046153 * Math.sin(2 * dRad - mRad) +
    0.015338 * Math.sin(2 * dRad - 2 * fRad) -
    0.012528 * Math.sin(mpRad + 2 * fRad) -
    0.01098 * Math.sin(mpRad - 2 * fRad);

  // Periodic terms in latitude (degrees)
  let dB =
    5.128122 * Math.sin(fRad) +
    0.280602 * Math.sin(mpRad + fRad) +
    0.277693 * Math.sin(mpRad - fRad) +
    0.173237 * Math.sin(2 * dRad - fRad) +
    0.055413 * Math.sin(2 * dRad - mpRad + fRad) +
    0.046271 * Math.sin(2 * dRad - mpRad - fRad) +
    0.032573 * Math.sin(2 * dRad + fRad);

  const lon = normalizeDegrees(Lprime + dL);
  return { lon, lat: dB };
}

// Keplerian orbital elements for planets at J2000 with century rates (Standish / JPL / Meeus)
interface OrbitalElements {
  a0: number; aDot: number; // AU
  e0: number; eDot: number;
  I0: number; IDot: number; // deg
  L0: number; LDot: number; // deg
  w0: number; wDot: number; // deg (longitude of perihelion)
  node0: number; nodeDot: number; // deg (longitude of ascending node)
}

const PLANET_ELEMENTS: Record<string, OrbitalElements> = {
  Mercury: {
    a0: 0.38709927, aDot: 0.00000037,
    e0: 0.20563593, eDot: 0.00001906,
    I0: 7.004979, IDot: -0.0059474,
    L0: 252.250323, LDot: 149472.674111,
    w0: 77.457796, wDot: 0.16047689,
    node0: 48.330765, nodeDot: -0.12534081,
  },
  Venus: {
    a0: 0.72333566, aDot: 0.0000039,
    e0: 0.00677672, eDot: -0.00004107,
    I0: 3.394676, IDot: -0.0007889,
    L0: 181.979099, LDot: 58517.815387,
    w0: 131.602467, wDot: 0.00268329,
    node0: 76.679842, nodeDot: -0.27769418,
  },
  Mars: {
    a0: 1.52371034, aDot: 0.00001847,
    e0: 0.0933941, eDot: 0.00007882,
    I0: 1.849691, IDot: -0.0081313,
    L0: -4.553432, LDot: 19140.302684,
    w0: -23.943629, wDot: 0.44441088,
    node0: 49.559538, nodeDot: -0.29257343,
  },
  Jupiter: {
    a0: 5.202887, aDot: -0.00011607,
    e0: 0.04838624, eDot: -0.00013253,
    I0: 1.304396, IDot: -0.0018371,
    L0: 34.39644, LDot: 3034.746128,
    w0: 14.728479, wDot: 0.21252668,
    node0: 100.473909, nodeDot: 0.20469106,
  },
  Saturn: {
    a0: 9.53667594, aDot: -0.0012506,
    e0: 0.05386179, eDot: -0.00050991,
    I0: 2.485991, IDot: 0.001936,
    L0: 49.954244, LDot: 1222.493622,
    w0: 92.598878, wDot: -0.41897216,
    node0: 113.662424, nodeDot: -0.28867794,
  },
  Uranus: {
    a0: 19.18916464, aDot: -0.00196155,
    e0: 0.04725744, eDot: -0.00004397,
    I0: 0.772637, IDot: -0.0024293,
    L0: 313.238104, LDot: 428.482028,
    w0: 170.954276, wDot: 0.40805281,
    node0: 74.016925, nodeDot: 0.04240589,
  },
  Neptune: {
    a0: 30.06992276, aDot: 0.00026291,
    e0: 0.0086064, eDot: 0.00005105,
    I0: 1.770043, IDot: 0.0003537,
    L0: -55.120029, LDot: 218.459453,
    w0: 44.964762, wDot: -0.32241464,
    node0: 131.784225, nodeDot: -0.00598758,
  },
  Pluto: {
    a0: 39.48211675, aDot: -0.00031596,
    e0: 0.2488273, eDot: 0.0000517,
    I0: 17.140012, IDot: 0.000048,
    L0: 238.929038, LDot: 145.207805,
    w0: 224.0688, wDot: -0.040629,
    node0: 110.303936, nodeDot: -0.011834,
  },
};

/**
 * Calculates geocentric ecliptic longitude for a planet using Keplerian orbits + major perturbations
 */
export function calculatePlanetGeocentric(planetName: string, T: number, sunLon: number, sunR: number): number {
  const el = PLANET_ELEMENTS[planetName];
  if (!el) return 0;

  const a = el.a0 + el.aDot * T;
  const e = el.e0 + el.eDot * T;
  const I = (el.I0 + el.IDot * T) * DEG2RAD;
  const L = normalizeDegrees(el.L0 + el.LDot * T);
  const w = normalizeDegrees(el.w0 + el.wDot * T);
  const node = normalizeDegrees(el.node0 + el.nodeDot * T) * DEG2RAD;

  // Mean anomaly M = L - w
  let M = normalizeDegrees(L - w);

  // Perturbations for Jupiter & Saturn (Great Inequality)
  if (planetName === "Jupiter" || planetName === "Saturn") {
    const M_J = normalizeDegrees(PLANET_ELEMENTS.Jupiter.L0 + PLANET_ELEMENTS.Jupiter.LDot * T - (PLANET_ELEMENTS.Jupiter.w0 + PLANET_ELEMENTS.Jupiter.wDot * T));
    const M_S = normalizeDegrees(PLANET_ELEMENTS.Saturn.L0 + PLANET_ELEMENTS.Saturn.LDot * T - (PLANET_ELEMENTS.Saturn.w0 + PLANET_ELEMENTS.Saturn.wDot * T));
    const phi = (2 * M_J - 5 * M_S - 67.6) * DEG2RAD;
    if (planetName === "Jupiter") {
      M += -0.332 * Math.sin(phi) - 0.056 * Math.sin(2 * phi);
    } else {
      M += 0.812 * Math.sin(phi) + 0.17 * Math.sin(2 * phi);
    }
  }

  // Solve Kepler equation
  const E = solveKepler(M, e);
  // Heliocentric coordinates in orbital plane
  const x_prime = a * (Math.cos(E) - e);
  const y_prime = a * Math.sqrt(1.0 - e * e) * Math.sin(E);

  // Rotate to ecliptic plane
  const w_rad = (w * DEG2RAD) - node;
  const cosW = Math.cos(w_rad);
  const sinW = Math.sin(w_rad);
  const cosNode = Math.cos(node);
  const sinNode = Math.sin(node);
  const cosI = Math.cos(I);
  const sinI = Math.sin(I);

  // Position in heliocentric ecliptic frame
  const x_h = (cosW * cosNode - sinW * sinNode * cosI) * x_prime + (-sinW * cosNode - cosW * sinNode * cosI) * y_prime;
  const y_h = (cosW * sinNode + sinW * cosNode * cosI) * x_prime + (-sinW * sinNode + cosW * cosNode * cosI) * y_prime;
  const z_h = (sinW * sinI) * x_prime + (cosW * sinI) * y_prime;

  // Earth's heliocentric position from Sun geocentric coordinates
  const earthSunLonRad = normalizeDegrees(sunLon + 180.0) * DEG2RAD;
  const x_earth = sunR * Math.cos(earthSunLonRad);
  const y_earth = sunR * Math.sin(earthSunLonRad);

  // Geocentric coordinates
  const x_g = x_h - x_earth;
  const y_g = y_h - y_earth;

  let geoLon = Math.atan2(y_g, x_g) * RAD2DEG;
  return normalizeDegrees(geoLon);
}

/**
 * Lunar North Node (True / Mean Node)
 */
export function calculateLunarNode(T: number): number {
  const node = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000.0;
  return normalizeDegrees(node);
}

/**
 * Houses calculation:
 * Midheaven (MC), Ascendant (ASC), and intermediate cusps (Placidus, Equal, Whole Sign)
 */
export function calculateHouses(
  ramc: number, // Right Ascension of Midheaven in degrees (Local Sidereal Time)
  lat: number, // Geographic latitude in degrees
  obliquity: number, // Obliquity of ecliptic in degrees
  system: "Placidus" | "Equal" | "WholeSign" = "Placidus"
): { mc: number; asc: number; cusps: number[] } {
  const ramcRad = ramc * DEG2RAD;
  const latRad = lat * DEG2RAD;
  const oblRad = obliquity * DEG2RAD;

  // Midheaven (MC)
  let mc = Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(oblRad)) * RAD2DEG;
  mc = normalizeDegrees(mc);

  // Ascendant (ASC)
  let asc = Math.atan2(
    Math.cos(ramcRad),
    -Math.sin(ramcRad) * Math.cos(oblRad) - Math.tan(latRad) * Math.sin(oblRad)
  ) * RAD2DEG;
  asc = normalizeDegrees(asc);

  const cusps = new Array<number>(12).fill(0);

  if (system === "Equal") {
    // Equal house: Each house is exactly 30 degrees starting from Ascendant
    for (let h = 0; h < 12; h++) {
      cusps[h] = normalizeDegrees(asc + h * 30);
    }
  } else if (system === "WholeSign") {
    // Whole Sign: 1st house begins at 0° of the Ascendant sign
    const ascSign = Math.floor(asc / 30);
    for (let h = 0; h < 12; h++) {
      cusps[h] = normalizeDegrees((ascSign + h) * 30);
    }
  } else {
    // Placidus House System
    // Polar regions (|lat| > 66°) fall back to Equal houses
    if (Math.abs(lat) > 66) {
      for (let h = 0; h < 12; h++) {
        cusps[h] = normalizeDegrees(asc + h * 30);
      }
    } else {
      cusps[0] = asc; // House 1
      cusps[9] = mc;  // House 10 (MC)
      cusps[6] = normalizeDegrees(asc + 180); // House 7 (Descendant)
      cusps[3] = normalizeDegrees(mc + 180);  // House 4 (IC)

      // Placidus semi-arc iteration for cusps 11, 12, 2, 3
      const calcPlacidusCusp = (ramcOffset: number, f: number): number => {
        let r = normalizeDegrees(ramc + ramcOffset) * DEG2RAD;
        let guess = r;
        for (let iter = 0; iter < 12; iter++) {
          const sinD = Math.sin(oblRad) * Math.sin(guess);
          const cosD = Math.sqrt(Math.max(0, 1 - sinD * sinD));
          const tanD = sinD / Math.max(cosD, 1e-6);
          const ad = Math.asin(Math.min(1, Math.max(-1, Math.tan(latRad) * tanD)));
          const target = normalizeDegrees(ramc + ramcOffset + f * ad * RAD2DEG) * DEG2RAD;
          const diff = Math.atan2(Math.sin(target - guess), Math.cos(target - guess));
          guess += diff * 0.7;
          if (Math.abs(diff) < 1e-5) break;
        }
        let lon = Math.atan2(Math.sin(guess), Math.cos(guess) * Math.cos(oblRad)) * RAD2DEG;
        return normalizeDegrees(lon);
      };

      cusps[10] = calcPlacidusCusp(30, 1 / 3);  // 11th cusp
      cusps[11] = calcPlacidusCusp(60, 2 / 3);  // 12th cusp
      cusps[1] = calcPlacidusCusp(120, 2 / 3);  // 2nd cusp
      cusps[2] = calcPlacidusCusp(150, 1 / 3);  // 3rd cusp

      // Opposite houses (180 deg)
      cusps[4] = normalizeDegrees(cusps[10] + 180); // 5th cusp
      cusps[5] = normalizeDegrees(cusps[11] + 180); // 6th cusp
      cusps[7] = normalizeDegrees(cusps[1] + 180);  // 8th cusp
      cusps[8] = normalizeDegrees(cusps[2] + 180);  // 9th cusp
    }
  }

  return { mc, asc, cusps };
}

/**
 * Determine which house a given ecliptic longitude falls into
 */
export function getHouseNumber(lon: number, cusps: number[]): number {
  const norm = normalizeDegrees(lon);
  for (let i = 0; i < 12; i++) {
    const c1 = cusps[i];
    const c2 = cusps[(i + 1) % 12];
    if (c1 <= c2) {
      if (norm >= c1 && norm < c2) return i + 1;
    } else {
      // Crosses 0 degrees Aries
      if (norm >= c1 || norm < c2) return i + 1;
    }
  }
  return 1;
}

/**
 * Formats a celestial point into a PlanetPosition object
 */
export function formatPoint(
  id: string,
  name: string,
  lon: number,
  cusps: number[],
  speed = 0,
  lat = 0
): PlanetPosition {
  const normalized = normalizeDegrees(lon);
  const signIndex = Math.floor(normalized / 30);
  const signData = ZODIAC_SIGNS[signIndex] || ZODIAC_SIGNS[0];
  const signDegree = normalized - signIndex * 30;
  const house = getHouseNumber(normalized, cusps);

  return {
    id,
    name,
    symbol: PLANET_SYMBOLS[name] || PLANET_SYMBOLS[id] || "✦",
    longitude: normalized,
    latitude: lat,
    speed,
    isRetrograde: speed < 0,
    sign: signData.name,
    signIndex,
    signDegree,
    signDegreeFormatted: formatDegreeMinute(normalized),
    house,
    element: signData.element,
    modality: signData.modality,
  };
}

/**
 * Calculate major aspects between planets and angles
 */
export function calculateAspects(planets: PlanetPosition[]): AspectData[] {
  const aspects: AspectData[] = [];
  const MAJOR_ASPECTS = [
    { name: "Conjunction", symbol: "☌", angle: 0, defaultOrb: 8, nature: "Neutral" as const },
    { name: "Sextile", symbol: "⚹", angle: 60, defaultOrb: 6, nature: "Harmonious" as const },
    { name: "Square", symbol: "□", angle: 90, defaultOrb: 7, nature: "Challenging" as const },
    { name: "Trine", symbol: "△", angle: 120, defaultOrb: 8, nature: "Harmonious" as const },
    { name: "Opposition", symbol: "☍", angle: 180, defaultOrb: 8, nature: "Challenging" as const },
    { name: "Quincunx", symbol: "⚻", angle: 150, defaultOrb: 3, nature: "Challenging" as const },
    { name: "Semisextile", symbol: "⚺", angle: 30, defaultOrb: 2.5, nature: "Neutral" as const },
  ];

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];

      // Exclude North Node - South Node opposition (it's always 180° by definition)
      if (
        (p1.id === "NorthNode" && p2.id === "SouthNode") ||
        (p1.id === "SouthNode" && p2.id === "NorthNode")
      ) {
        continue;
      }

      let diff = Math.abs(p1.longitude - p2.longitude);
      if (diff > 180) diff = 360 - diff;

      // Allow slightly wider orbs for Sun and Moon
      const isLum = p1.name === "Sun" || p1.name === "Moon" || p2.name === "Sun" || p2.name === "Moon";
      const orbBonus = isLum ? 1.5 : 0;

      for (const asp of MAJOR_ASPECTS) {
        const maxOrb = asp.defaultOrb + orbBonus;
        const orbDiff = Math.abs(diff - asp.angle);

        if (orbDiff <= maxOrb) {
          // Applying vs separating check based on relative speeds
          const relativeSpeed = (p1.speed || 1) - (p2.speed || 0.5);
          const isApplying = relativeSpeed > 0 ? diff < asp.angle : diff > asp.angle;

          aspects.push({
            planet1: p1.name,
            planet2: p2.name,
            aspectName: asp.name as AspectData["aspectName"],
            symbol: asp.symbol,
            angle: asp.angle,
            actualDiff: Math.round(diff * 100) / 100,
            orb: Math.round(orbDiff * 100) / 100,
            isApplying,
            nature: asp.nature,
          });
          break; // Keep the closest aspect
        }
      }
    }
  }

  // Sort by tightness of orb
  return aspects.sort((a, b) => a.orb - b.orb);
}

/**
 * Main calculation entry point for Western Natal Chart
 */
export function calculateWesternChart(
  year: number,
  month: number, // 1 to 12
  day: number,
  hour: number, // 0 to 23
  minute: number, // 0 to 59
  latitude: number,
  longitude: number,
  timezoneOffsetHours: number, // e.g. -5 for EST, 5.5 for IST
  houseSystem: "Placidus" | "Equal" | "WholeSign" = "Placidus",
  second: number = 0
): WesternChartData {
  // High-precision Swiss Ephemeris calculation (0.001° accuracy)
  // Unambiguously normalizes local birth time and timezone offset to UTC and computes Julian Day
  const jd = swissEphemeris.calculateJulianDay(year, month, day, hour, minute, second, timezoneOffsetHours);
  const sysCode = houseSystem === "WholeSign" ? "W" : houseSystem === "Equal" ? "E" : "P";
  const swissHouses = swissEphemeris.calculateHouses(jd, latitude, longitude, sysCode);
  const rawCusps = swissHouses.houseCusps;
  const asc = swissHouses.ascendant;
  const mc = swissHouses.midheaven;

  const T = (jd - 2451545.0) / 36525.0;
  const gmst = calculateGMST(jd);
  const ramc = normalizeDegrees(gmst + longitude);
  const obliquity = calculateObliquity(T);

  // Compute all planets with Swiss Ephemeris
  const sp = swissEphemeris.calculateAllPlanets(jd, false);

  const planetsList: PlanetPosition[] = [];
  planetsList.push(formatPoint("Sun", "Sun", sp.sun.longitude, rawCusps, sp.sun.speed, sp.sun.latitude));
  planetsList.push(formatPoint("Moon", "Moon", sp.moon.longitude, rawCusps, sp.moon.speed, sp.moon.latitude));
  planetsList.push(formatPoint("Mercury", "Mercury", sp.mercury.longitude, rawCusps, sp.mercury.speed, sp.mercury.latitude));
  planetsList.push(formatPoint("Venus", "Venus", sp.venus.longitude, rawCusps, sp.venus.speed, sp.venus.latitude));
  planetsList.push(formatPoint("Mars", "Mars", sp.mars.longitude, rawCusps, sp.mars.speed, sp.mars.latitude));
  planetsList.push(formatPoint("Jupiter", "Jupiter", sp.jupiter.longitude, rawCusps, sp.jupiter.speed, sp.jupiter.latitude));
  planetsList.push(formatPoint("Saturn", "Saturn", sp.saturn.longitude, rawCusps, sp.saturn.speed, sp.saturn.latitude));
  planetsList.push(formatPoint("Uranus", "Uranus", sp.uranus.longitude, rawCusps, sp.uranus.speed, sp.uranus.latitude));
  planetsList.push(formatPoint("Neptune", "Neptune", sp.neptune.longitude, rawCusps, sp.neptune.speed, sp.neptune.latitude));
  planetsList.push(formatPoint("Pluto", "Pluto", sp.pluto.longitude, rawCusps, sp.pluto.speed, sp.pluto.latitude));

  // Lunar Nodes
  planetsList.push(formatPoint("NorthNode", "NorthNode", sp.rahu.longitude, rawCusps, sp.rahu.speed));
  const southNodeLon = normalizeDegrees(sp.rahu.longitude + 180.0);
  planetsList.push(formatPoint("SouthNode", "SouthNode", southNodeLon, rawCusps, sp.rahu.speed));

  // Chiron calculation (~50.7-year orbit between Saturn and Uranus)
  const chironT = (jd - 2451545.0) / 36525.0;
  const chironM = normalizeDegrees(339.8 + 719.9 * chironT);
  const chironLon = normalizeDegrees(71.9 + chironM + 12.0 * Math.sin(chironM * (Math.PI / 180)));
  planetsList.push(formatPoint("Chiron", "Chiron", chironLon, rawCusps, 0.05));

  // Ascendant and Midheaven
  const ascPoint = formatPoint("Ascendant", "Ascendant", asc, rawCusps);
  const mcPoint = formatPoint("Midheaven", "Midheaven", mc, rawCusps);

  // Calculate 4 Major Asteroids
  const asteroidCalc = new AsteroidCalculator();
  const asteroids = asteroidCalc.calculateAsteroids(jd, rawCusps);

  // Calculate Lunar Points & Theoretical Points
  const lunarPointsCalc = new LunarPointsCalculator();
  const additionalPoints = lunarPointsCalc.calculateAll(jd, ramc, latitude, obliquity, rawCusps);

  // Calculate Arabian Parts
  const arabianCalc = new ArabianPartsCalculator();
  const arabianParts = arabianCalc.calculateAll({
    ascendant: asc,
    sun: sp.sun.longitude,
    moon: sp.moon.longitude,
    mercury: sp.mercury.longitude,
    venus: sp.venus.longitude,
    mars: sp.mars.longitude,
    jupiter: sp.jupiter.longitude,
    saturn: sp.saturn.longitude,
    houseCusps: rawCusps,
  });

  // Format House Cusps
  const formattedHouses: HouseCusp[] = rawCusps.map((c, idx) => {
    const signIdx = Math.floor(c / 30);
    return {
      house: idx + 1,
      longitude: c,
      sign: ZODIAC_SIGNS[signIdx]?.name || "Aries",
      signIndex: signIdx,
      signDegreeFormatted: formatDegreeMinute(c),
    };
  });

  // Calculate Solar Proximity (Cazimi <= 17', Combust <= 8.5°, Under Beams <= 17°)
  const sunLon = sp.sun.longitude;
  planetsList.forEach((p) => {
    if (p.id === "Sun") {
      p.solarProximity = "Free";
      return;
    }
    const diff = Math.abs(normalizeDegrees(p.longitude - sunLon));
    const dist = diff > 180 ? 360 - diff : diff;
    if (dist <= 17.0 / 60.0) {
      p.solarProximity = "Cazimi";
    } else if (dist <= 8.5) {
      p.solarProximity = "Combust";
    } else if (dist <= 17.0) {
      p.solarProximity = "UnderBeams";
    } else {
      p.solarProximity = "Free";
    }
  });

  // Calculate aspects including planets, North Node, Ascendant, and Midheaven
  const aspectTargets = [...planetsList, ascPoint, mcPoint];
  const aspects = calculateAspects(aspectTargets);
  const minorAspects = new MinorAspectsEngine().calculateMinorAspects(planetsList);

  // Calculate Traditional Planetary Hours and Day Ruler
  const planetaryHoursCalc = new PlanetaryHoursCalculator();
  const planetaryHours = planetaryHoursCalc.calculate(year, month, day, hour, minute, latitude);

  // Calculate Ibn Ezra / Lilly Almuten Figuris (Ruler of Geniture)
  const almutenCalc = new AlmutenFigurisCalculator();
  const partOfFortune = arabianParts.partOfFortune.longitude;
  const almutenFiguris = almutenCalc.calculate({
    ascendant: asc,
    sun: sunLon,
    moon: sp.moon.longitude,
    partOfFortune,
    planets: planetsList.map((p) => ({ name: p.name, longitude: p.longitude, house: p.house })),
    isDayChart: planetaryHours.isBirthInDaytime,
    dayRuler: planetaryHours.dayRuler,
    hourRuler: planetaryHours.currentHourRuler,
  });

  return {
    planets: planetsList,
    houses: formattedHouses,
    aspects,
    minorAspects,
    ascendant: ascPoint,
    midheaven: mcPoint,
    descendant: normalizeDegrees(asc + 180),
    imumCoeli: normalizeDegrees(mc + 180),
    julianDay: jd,
    siderealTime: ramc,
    obliquity,
    houseSystem,
    asteroids,
    additionalPoints,
    arabianParts,
    planetaryHours,
    almutenFiguris,
  };
}
