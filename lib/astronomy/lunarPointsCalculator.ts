/**
 * Lunar Points and Theoretical Points Calculator
 * Computes:
 * - Mean Lilith (Mean Lunar Apogee) — W-02 FIX: delegates to verifiedFixes
 *   (Swiss-Ephemeris-verified hybrid: max err 0.124° in 1900–2100, ≤0.4° outside).
 * - True Lilith (Osculating-style approximation) — flagged approximate (honesty).
 * - White Moon / Selena — NON-STANDARD point (no standard ephemeris source); flagged.
 * - Vertex — W-04 FIX: verified prime-vertical closed form (≤0.0016° vs Swiss Ephemeris).
 * - Anti-Vertex (Polar opposite of Vertex)
 * - East Point / Equatorial Ascendant — W-03 FIX: verified convention (was ≡ MC).
 * - Trans-Plutonian theoretical points (Proserpine, Hypnos) — NON-STANDARD symbolic
 *   points (fabricated linear formulas, no ephemeris source); flagged non-standard.
 */

import { PlanetPosition, formatDegreeMinute, normalizeDegrees, ZODIAC_SIGNS } from "./ephemeris";
import {
  calculateMeanLilith as vfMeanLilith,
  calculateTrueLilithApprox as vfTrueLilith,
  calculateVertex as vfVertex,
  calculateEastPoint as vfEastPoint,
} from "./verifiedFixes";

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


export class LunarPointsCalculator {
  /**
   * Mean Lilith (Lunar Apogee) — W-02 FIX.
   * The previous in-class formula (142.19° + 40.664876°·T per Julian CENTURY)
   * advanced ~100× too slowly (real mean-apogee rate ≈ 40.69°/YEAR), producing
   * 17°–167° errors across 1452–2026. The replacement is the audit-verified
   * hybrid in verifiedFixes.ts (quintic fit to Swiss Ephemeris MEAN_APOG
   * 1900–2100 + Meeus-derived analytic outside the window).
   * Reference values (Swiss Ephemeris MEAN_APOG, Moshier): 263.464333° at J2000,
   * 234.839363° at jd 2448057.0, 273.828040° at jd 2461332.5.
   */
  public calculateMeanLilithLon(jd: number): { lon: number; speed: number } {
    return vfMeanLilith(jd);
  }

  /**
   * True (Osculating-style) Lilith — approximate.
   * Uses the verified mean base + principal solar/evection corrections. The
   * osculating apogee is intrinsically erratic (verified residual up to ~15°
   * vs Swiss Ephemeris OSCU_APOG without a full lunar theory); UI must render
   * this point with an "approximate" badge (see audit Phase E for the
   * ephemeris-grade upgrade path).
   */
  public calculateTrueLilithLon(jd: number): { lon: number; speed: number } {
    return vfTrueLilith(jd);
  }

  /**
   * White Moon / Selena — NON-STANDARD point.
   * 7-year rhythmic harmonic cycle (revolution period exactly 7 sidereal years
   * ≈ 2556.7 days). Epoch J2000.0 longitude: ~298.15°. There is NO standard
   * ephemeris source for this point; it is retained for display continuity but
   * flagged `nonStandard` — show it only behind a labeled toggle.
   */
  public calculateWhiteMoonLon(jd: number): { lon: number; speed: number } {
    const daysSinceEpoch = jd - 2451545.0;
    const dailyMotion = 360.0 / (7.0 * 365.2422); // ~0.1408° per day
    const lon = normalizeDegrees(298.15 + dailyMotion * daysSinceEpoch);
    return { lon, speed: dailyMotion };
  }

  /**
   * Vertex calculation — W-04 FIX.
   * The Vertex is the western intersection of the Prime Vertical with the
   * Ecliptic. The previous in-class closed form was off by 15°–44° vs Swiss
   * Ephemeris `ascmc[3]`; the replacement in verifiedFixes.ts is verified to
   * ≤0.0016° across 8 global cities / 1960–2026.
   */
  public calculateVertexLon(ramc: number, lat: number, obliquity: number): number {
    return vfVertex(ramc, lat, obliquity);
  }

  /**
   * East Point (Equatorial Ascendant) — W-03 FIX.
   * The previous formula was character-identical to the MC formula (East Point
   * always equal to Midheaven). Correct convention: the ecliptic longitude
   * whose right ascension is RAMC + 90° (equals the Ascendant at the equator).
   * Display the convention name ("Equatorial Ascendant / East Point") in the UI.
   */
  public calculateEastPointLon(ramc: number, obliquity: number): number {
    return vfEastPoint(ramc, obliquity);
  }

  /**
   * Trans-Plutonian Hypnos & Proserpine (Symbolic theoretical archetypes)
   * NON-STANDARD: fabricated linear formulas with no ephemeris source
   * (Proserpine: ~650-year cycle; Hypnos: ~720-year cycle). Retained for
   * display continuity but flagged `nonStandard` — show only behind a
   * labeled toggle (audit honesty contract §7).
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

    const meanLilith = this.buildPoint("MeanLilith", "Mean Lilith", "⚸", meanL.lon, meanL.speed, cusps);
    const trueLilith = this.buildPoint("TrueLilith", "True Lilith", "⚸*", trueL.lon, trueL.speed, cusps);
    trueLilith.approximate = true; // osculating-style approximation — honesty badge
    const whiteMoon = this.buildPoint("WhiteMoon", "White Moon (Selena)", "☽*", whiteM.lon, whiteM.speed, cusps);
    whiteMoon.nonStandard = true;  // no standard ephemeris source — honesty badge
    const vertex = this.buildPoint("Vertex", "Vertex", "Vx", vLon, 0, cusps);
    const antiVertex = this.buildPoint("AntiVertex", "Anti-Vertex", "AVx", antiVLon, 0, cusps);
    const eastPoint = this.buildPoint("EastPoint", "East Point", "EP", epLon, 0, cusps);
    const proserpine = this.buildPoint("Proserpine", "Proserpine", "⚹P", theo.proserpine, 0.001, cusps);
    proserpine.nonStandard = true; // fabricated linear formula — honesty badge
    const hypnos = this.buildPoint("Hypnos", "Hypnos", "⚹H", theo.hypnos, 0.001, cusps);
    hypnos.nonStandard = true;     // fabricated linear formula — honesty badge

    return {
      meanLilith,
      trueLilith,
      whiteMoon,
      vertex,
      antiVertex,
      eastPoint,
      proserpine,
      hypnos,
    };
  }
}
