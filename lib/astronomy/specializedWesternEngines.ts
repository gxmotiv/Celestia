/**
 * Specialized Western Astrology Engines:
 * 1. Fixed Stars Engine (20 classical, Royal & Archangel catalogue entries with epoch-aware contact checks)
 * 2. Eclipse Analyzer (Solar & Lunar eclipses affecting natal houses with 6-12 month impacts)
 * 3. Medical Astrology Indicators (Zodiac bodily rulerships, stress aspects, 6th/12th house vitality analysis)
 * 4. Astrocartography Power Lines (Planetary lines on AC, DC, MC, IC across geographic coordinates)
 */

import {
  WesternChartData,
  PlanetPosition,
  normalizeDegrees,
  formatDegreeMinute,
  ZODIAC_SIGNS,
} from "./ephemeris";
import { swissEphemeris } from "./swissEphemeris";

// ---------------------------------------------------------------------------
// 1. FIXED STARS ENGINE
// ---------------------------------------------------------------------------

export interface FixedStar {
  name: string;
  constellation: string;
  longitude: number; // J2000 tropical ecliptic longitude (catalog epoch)
  magnitude: number;
  nature: "Royal" | "Benefic" | "Malefic" | "Mixed";
  planetaryNature: string; // e.g. "Jupiter / Mars"
  color: string;
  meaning: string;
}

export interface StarContact {
  starName: string;
  constellation: string;
  nature: FixedStar["nature"];
  planetName: string;
  planetSymbol: string;
  /** Approximate precession-adjusted tropical longitude for the chart epoch. */
  starLongitude: number;
  /** Unadjusted catalogue longitude at J2000. */
  j2000Longitude: number;
  /** Applied longitude-only general-precession estimate in degrees. */
  precessionCorrectionDegrees: number;
  planetLongitude: number;
  orb: number;
  interpretation: string;
}

export class FixedStarsEngine {
  public static readonly FIXED_STARS: FixedStar[] = [
    // 4 Royal Archangel Stars of Persia
    { name: "Regulus (Cor Leonis)", constellation: "Leo", longitude: 150.08, magnitude: 1.35, nature: "Royal", planetaryNature: "Mars / Jupiter", color: "White-Blue", meaning: "Archangel Raphael. Supreme leadership, royal honor, courage, and sudden fame; downfall only occurs if revenge is taken." },
    { name: "Aldebaran", constellation: "Taurus", longitude: 69.95, magnitude: 0.85, nature: "Royal", planetaryNature: "Mars", color: "Orange", meaning: "Archangel Michael. Integrity brings glorious success in business, military, and statecraft; corruption brings rapid loss." },
    { name: "Antares (Cor Scorpionis)", constellation: "Scorpio", longitude: 249.93, magnitude: 0.96, nature: "Royal", planetaryNature: "Mars / Jupiter", color: "Fiery Red", meaning: "Archangel Uriel. Strategic boldness, fearless confrontation with danger, deep occult power, and triumphant transformation." },
    { name: "Fomalhaut", constellation: "Piscis Austrinus", longitude: 333.87, magnitude: 1.16, nature: "Royal", planetaryNature: "Venus / Mercury", color: "Pure White", meaning: "Archangel Gabriel. Fame through poetic artistry, visionary ideals, and spiritual magic; requires unwavering moral clarity." },

    // Brilliant Benefic Stars
    { name: "Sirius (The Dog Star)", constellation: "Canis Major", longitude: 104.35, magnitude: -1.46, nature: "Benefic", planetaryNature: "Jupiter / Mars", color: "Diamond White", meaning: "Brightest star in the heavens. Immense spiritual wealth, renown, devotion, and guardian protection." },
    { name: "Spica", constellation: "Virgo", longitude: 204.01, magnitude: 0.98, nature: "Benefic", planetaryNature: "Venus / Mars", color: "White-Blue", meaning: "The Pearl of the Virgin. Supreme artistic genius, immaculate gifts, scientific brilliance, and unearned cosmic favor." },
    { name: "Vega", constellation: "Lyra", longitude: 285.45, magnitude: 0.03, nature: "Benefic", planetaryNature: "Venus / Mercury", color: "Sapphire Blue", meaning: "The Cosmic Harp. Magnetic charisma, musical and poetic mastery, refined aesthetic taste, and spiritual enchantment." },
    { name: "Arcturus", constellation: "Boötes", longitude: 204.24, magnitude: -0.05, nature: "Benefic", planetaryNature: "Mars / Jupiter", color: "Golden Orange", meaning: "The Great Navigator. Fearless pioneering initiative, righteous expansion, and protection when exploring uncharted realms." },
    { name: "Canopus", constellation: "Carina", longitude: 105.15, magnitude: -0.74, nature: "Benefic", planetaryNature: "Saturn / Jupiter", color: "Silver White", meaning: "The Sacred Helmsman. Ancient wisdom, navigational genius, dignified diplomacy, and deep philosophical piety." },
    { name: "Pollux", constellation: "Gemini", longitude: 113.22, magnitude: 1.14, nature: "Mixed", planetaryNature: "Mars", color: "Orange", meaning: "Immortal twin. Dauntless courage, pugilistic spirit, physical stamina, and protective brotherhood." },
    { name: "Castor", constellation: "Gemini", longitude: 110.25, magnitude: 1.58, nature: "Mixed", planetaryNature: "Mercury", color: "White", meaning: "Mortal twin. Brilliant linguistic intellect, storytelling, publishing, and analytical agility." },
    { name: "Bellatrix", constellation: "Orion", longitude: 81.18, magnitude: 1.64, nature: "Mixed", planetaryNature: "Mars / Mercury", color: "Pale Yellow", meaning: "The Amazon Star. Quick decision-making, strategic valor, high organizational standing, and vocal independence." },
    { name: "Betelgeuse", constellation: "Orion", longitude: 88.75, magnitude: 0.50, nature: "Benefic", planetaryNature: "Mars / Mercury", color: "Deep Orange", meaning: "Right hand of Orion. Unprecedented military and industrial honors, lightning luck, and boundless generosity." },
    { name: "Rigel", constellation: "Orion", longitude: 76.99, magnitude: 0.18, nature: "Benefic", planetaryNature: "Jupiter / Saturn", color: "Blue-White", meaning: "Left foot of Orion. Inventive genius, mechanical mastery, benevolent leadership, and abundant wealth." },
    { name: "Alcyone (Pleiades)", constellation: "Taurus", longitude: 60.00, magnitude: 2.87, nature: "Mixed", planetaryNature: "Moon / Mars", color: "Green-Blue", meaning: "The Weeping Sisters. Profound psychic intuition, mystical visions, deep emotional empathy, and spiritual transcendence." },

    // Potent & Challenging Malefic Stars
    { name: "Algol (Caput Algol)", constellation: "Perseus", longitude: 56.47, magnitude: 2.12, nature: "Malefic", planetaryNature: "Saturn / Jupiter", color: "Pulsing White", meaning: "The Demon Star / Head of Medusa. Raw primordial feminine rage, immense psychological intensity, danger of losing one's head under fury, and ultimate Kundalini power." },
    { name: "Scheat", constellation: "Pegasus", longitude: 359.36, magnitude: 2.42, nature: "Malefic", planetaryNature: "Mars / Mercury", color: "Dark Red", meaning: "Extreme literary and philosophical brilliance, but warns against shipwrecks, water hazards, and sudden catastrophe." },
    { name: "Unukalhai", constellation: "Serpens", longitude: 232.06, magnitude: 2.65, nature: "Malefic", planetaryNature: "Saturn / Mars", color: "Yellow", meaning: "The Serpent's Heart. Medical and surgical acumen, profound toxicological and psychological insight, and esoteric alchemy." },
    { name: "Deneb Adige", constellation: "Cygnus", longitude: 335.33, magnitude: 1.25, nature: "Benefic", planetaryNature: "Venus / Mercury", color: "White", meaning: "The Swan. Spiritual artistry, swift intellectual perception, and graceful transcendence of worldly pettiness." },
    { name: "Achernar", constellation: "Eridanus", longitude: 345.31, magnitude: 0.46, nature: "Benefic", planetaryNature: "Jupiter", color: "Bright Blue", meaning: "The End of the River. Religious devotion, high moral authority, philanthropic success, and spiritual benevolence." },
  ];

  /**
   * Approximate J2000-to-date shift using general precession in longitude.
   * The catalogue stores only ecliptic longitude, not full 3D position or
   * proper motion, so this is a transparent longitude-only correction rather
   * than a full astrometric transformation. It is most suitable for modest
   * epoch offsets and should not be presented as a precision star ephemeris.
   */
  public getStarLongitudeAtEpoch(star: FixedStar, julianDay: number): {
    longitude: number;
    correctionDegrees: number;
  } {
    const T = (julianDay - 2451545.0) / 36525.0;
    const precessionArcSeconds = 5028.796195 * T + 1.11113 * T * T;
    const correctionDegrees = precessionArcSeconds / 3600;
    return {
      longitude: normalizeDegrees(star.longitude + correctionDegrees),
      correctionDegrees,
    };
  }

  public calculateStarContacts(chart: WesternChartData, maxOrb = 1.25): StarContact[] {
    const contacts: StarContact[] = [];
    const testPoints = [
      ...chart.planets,
      chart.ascendant,
      chart.midheaven,
    ];

    FixedStarsEngine.FIXED_STARS.forEach((star) => {
      const starPosition = this.getStarLongitudeAtEpoch(star, chart.julianDay);
      testPoints.forEach((point) => {
        let diff = Math.abs(point.longitude - starPosition.longitude);
        if (diff > 180) diff = 360 - diff;

        if (diff <= maxOrb) {
          contacts.push({
            starName: star.name,
            constellation: star.constellation,
            nature: star.nature,
            planetName: point.name,
            planetSymbol: point.symbol,
            starLongitude: starPosition.longitude,
            j2000Longitude: star.longitude,
            precessionCorrectionDegrees: starPosition.correctionDegrees,
            planetLongitude: point.longitude,
            orb: Math.round(diff * 100) / 100,
            interpretation: `${point.name} (${point.signDegreeFormatted}) is within ${diff.toFixed(2)}° of ${star.name} (${formatDegreeMinute(starPosition.longitude)}, approximate date-adjusted longitude). Nature: ${star.nature} (${star.planetaryNature}). ${star.meaning}`,
          });
        }
      });
    });

    return contacts.sort((a, b) => a.orb - b.orb);
  }
}

// ---------------------------------------------------------------------------
// 2. ECLIPSE ANALYZER
// ---------------------------------------------------------------------------

export interface EclipseItem {
  date: string;
  type: "Total Solar" | "Annular Solar" | "Total Lunar" | "Partial Lunar" | "Partial Solar" | "Penumbral Lunar";
  zodiacSign: string;
  degree: number;
  degreeFormatted: string;
  affectedHouse: number;
  intensity: "High" | "Extreme" | "Moderate";
  theme: string;
  recommendations: string[];
}

type EclipseCatalogEvent = {
  date: string;
  time: string;
  type: EclipseItem["type"];
};

/**
 * Future eclipse greatest-eclipse dates and UT times are sourced from NASA
 * GSFC's annual eclipse catalogues (Five Millennium Canon / Espenak & Meeus).
 * Tropical longitudes are calculated at runtime from the geocentric Sun for
 * solar eclipses and Moon for lunar eclipses using the shared ephemeris.
 */
export class EclipseAnalyzer {
  private static readonly FUTURE_ECLIPSES: EclipseCatalogEvent[] = [
    { date: "2027-02-06", time: "16:00", type: "Annular Solar" },
    { date: "2027-02-20", time: "23:13", type: "Penumbral Lunar" },
    { date: "2027-07-18", time: "16:03", type: "Penumbral Lunar" },
    { date: "2027-08-02", time: "10:07", type: "Total Solar" },
    { date: "2027-08-17", time: "07:14", type: "Penumbral Lunar" },
    { date: "2028-01-12", time: "04:13", type: "Partial Lunar" },
    { date: "2028-01-26", time: "15:08", type: "Annular Solar" },
    { date: "2028-07-06", time: "18:20", type: "Partial Lunar" },
    { date: "2028-07-22", time: "02:55", type: "Total Solar" },
    { date: "2028-12-31", time: "16:52", type: "Total Lunar" },
    { date: "2029-01-14", time: "17:13", type: "Partial Solar" },
    { date: "2029-06-12", time: "04:05", type: "Partial Solar" },
    { date: "2029-06-26", time: "03:22", type: "Total Lunar" },
    { date: "2029-07-11", time: "15:36", type: "Partial Solar" },
    { date: "2029-12-05", time: "15:03", type: "Partial Solar" },
    { date: "2029-12-20", time: "22:42", type: "Total Lunar" },
    { date: "2030-06-01", time: "06:28", type: "Annular Solar" },
    { date: "2030-06-15", time: "18:33", type: "Partial Lunar" },
    { date: "2030-11-25", time: "06:50", type: "Total Solar" },
    { date: "2030-12-09", time: "22:28", type: "Penumbral Lunar" },
  ];

  public analyzeEclipses(chart: WesternChartData, currentDate: Date = new Date()): EclipseItem[] {
    const getHouse = (lon: number) => {
      const cusps = chart.houses;
      for (let i = 0; i < cusps.length; i++) {
        const current = cusps[i].longitude;
        const next = cusps[(i + 1) % cusps.length].longitude;
        if (next > current) {
          if (lon >= current && lon < next) return i + 1;
        } else if (lon >= current || lon < next) {
          return i + 1;
        }
      }
      return 1;
    };

    const HOUSE_THEMES: Record<number, { theme: string; recs: string[] }> = {
      1: { theme: "Radical Identity & Body Rebirth", recs: ["Reconsider personal boundaries", "Review how you present yourself", "Set intentions for a new personal chapter"] },
      2: { theme: "Financial Re-orientation & Self-Worth", recs: ["Review income and spending priorities", "Clarify personal values", "Reassess material commitments"] },
      3: { theme: "Mental Breakthroughs & New Communications", recs: ["Begin a writing or learning project", "Revisit communication patterns", "Organize local commitments"] },
      4: { theme: "Home Sanctuary & Ancestral Foundations", recs: ["Review home and family priorities", "Reassess domestic responsibilities", "Strengthen your private support system"] },
      5: { theme: "Creative Culmination & Romantic Renewal", recs: ["Make room for creative work", "Review romantic expectations", "Reconnect with play and recreation"] },
      6: { theme: "Work, Routines & Daily Responsibilities", recs: ["Review work systems", "Adjust daily routines", "Plan sustainable rest and workload boundaries"] },
      7: { theme: "Relationship Evolution & Partnership Contracts", recs: ["Review relationship agreements", "Clarify shared expectations", "Revisit collaboration boundaries"] },
      8: { theme: "Shared Resources & Psychological Change", recs: ["Review shared finances and obligations", "Clarify debt and risk exposure", "Make space for reflective work"] },
      9: { theme: "Philosophical Awakening & World Horizons", recs: ["Plan study or travel goals", "Revisit beliefs and assumptions", "Explore teaching or publishing plans"] },
      10: { theme: "Career Direction & Public Standing", recs: ["Review long-term career direction", "Reassess public responsibilities", "Clarify professional goals"] },
      11: { theme: "Community Re-alignment & Future Hopes", recs: ["Review group commitments", "Reconnect with supportive networks", "Reassess long-term plans"] },
      12: { theme: "Rest, Reflection & Closure", recs: ["Create space for reflection", "Review unresolved commitments", "Prioritize restorative downtime"] },
    };

    return EclipseAnalyzer.FUTURE_ECLIPSES.flatMap((event) => {
      const instant = new Date(`${event.date}T${event.time}:00.000Z`);
      if (!Number.isFinite(instant.getTime()) || instant.getTime() < currentDate.getTime()) return [];

      const julianDay = swissEphemeris.calculateJulianDay(
        instant.getUTCFullYear(),
        instant.getUTCMonth() + 1,
        instant.getUTCDate(),
        instant.getUTCHours(),
        instant.getUTCMinutes(),
        instant.getUTCSeconds(),
        0
      );
      const isSolar = event.type.includes("Solar");
      const eventBody = isSolar ? swissEphemeris.SUN : swissEphemeris.MOON;
      const longitude = swissEphemeris.calculatePlanetPosition(eventBody, julianDay).longitude;
      const house = getHouse(longitude);
      const signIndex = Math.floor(longitude / 30);
      const sign = ZODIAC_SIGNS[signIndex]?.name || "Aries";
      const houseInfo = HOUSE_THEMES[house];
      const intensity: EclipseItem["intensity"] = event.type.includes("Total")
        ? "Extreme"
        : event.type.includes("Penumbral")
          ? "Moderate"
          : "High";

      return [{
        date: `${event.date} · ${event.time} UTC`,
        type: event.type,
        zodiacSign: sign,
        degree: longitude,
        degreeFormatted: formatDegreeMinute(longitude),
        affectedHouse: house,
        intensity,
        theme: houseInfo.theme,
        recommendations: houseInfo.recs,
      }];
    });
  }
}

// ---------------------------------------------------------------------------
// 3. MEDICAL ASTROLOGY INDICATORS
// ---------------------------------------------------------------------------

export interface MedicalIndicator {
  systemName: string;
  signRuler: string;
  governedAnatomy: string;
  symbolicAssociation: string;
}

export interface MedicalAstrologyReport {
  disclaimer: string;
  constitutionSymbolism: string;
  traditionalBodyCorrespondences: MedicalIndicator[];
  sixthHouseSymbolism: string;
  twelfthHouseSymbolism: string;
  reflectionPrompts: string[];
}

/**
 * Presents the historical sign/body correspondences found in medical astrology
 * as symbolism only. It intentionally does not assess a person's health,
 * infer vulnerability, predict illness, or recommend medical treatment.
 */
export class MedicalAstrologyEngine {
  private static readonly BODY_RULERS: Record<string, {
    system: string;
    anatomy: string;
    symbolism: string;
  }> = {
    Aries: { system: "Cranio-facial symbolism", anatomy: "Head, face and skull", symbolism: "Traditional Aries symbolism emphasizes initiative, urgency and the head/face correspondence." },
    Taurus: { system: "Throat and neck symbolism", anatomy: "Throat, neck and vocal region", symbolism: "Traditional Taurus symbolism emphasizes steadiness, voice and the throat/neck correspondence." },
    Gemini: { system: "Respiratory and shoulder symbolism", anatomy: "Lungs, shoulders, arms and hands", symbolism: "Traditional Gemini symbolism emphasizes communication, movement and the respiratory/limb correspondence." },
    Cancer: { system: "Chest and stomach symbolism", anatomy: "Chest, breasts and stomach", symbolism: "Traditional Cancer symbolism emphasizes nourishment, protection and the chest/stomach correspondence." },
    Leo: { system: "Heart and back symbolism", anatomy: "Heart, upper back and spine", symbolism: "Traditional Leo symbolism emphasizes expression, warmth and the heart/back correspondence." },
    Virgo: { system: "Digestive symbolism", anatomy: "Intestines and digestive region", symbolism: "Traditional Virgo symbolism emphasizes discernment, service and the digestive correspondence." },
    Libra: { system: "Kidney and lumbar symbolism", anatomy: "Kidneys, lower back and lumbar region", symbolism: "Traditional Libra symbolism emphasizes balance, proportion and the kidney/lumbar correspondence." },
    Scorpio: { system: "Reproductive and eliminative symbolism", anatomy: "Reproductive and eliminative organs", symbolism: "Traditional Scorpio symbolism emphasizes depth, transformation and reproductive/eliminative correspondences." },
    Sagittarius: { system: "Hip and thigh symbolism", anatomy: "Hips, thighs and upper legs", symbolism: "Traditional Sagittarius symbolism emphasizes movement, exploration and the hip/thigh correspondence." },
    Capricorn: { system: "Skeletal and joint symbolism", anatomy: "Bones, knees, joints and teeth", symbolism: "Traditional Capricorn symbolism emphasizes structure, endurance and skeletal/joint correspondences." },
    Aquarius: { system: "Ankle and circulation symbolism", anatomy: "Calves, ankles and circulatory pathways", symbolism: "Traditional Aquarius symbolism emphasizes networks, circulation and the lower-leg correspondence." },
    Pisces: { system: "Foot and lymphatic symbolism", anatomy: "Feet and lymphatic imagery", symbolism: "Traditional Pisces symbolism emphasizes sensitivity, permeability and the foot/lymphatic correspondence." },
  };

  public analyzeTraditionalSymbolism(chart: WesternChartData): MedicalAstrologyReport {
    const sunSign = chart.planets.find((p) => p.name === "Sun")?.sign || "Aries";
    const moonSign = chart.planets.find((p) => p.name === "Moon")?.sign || "Taurus";
    const ascSign = chart.ascendant.sign;
    const marsSign = chart.planets.find((p) => p.name === "Mars")?.sign;
    const saturnSign = chart.planets.find((p) => p.name === "Saturn")?.sign;

    const keySigns = Array.from(new Set([
      sunSign,
      moonSign,
      ascSign,
      marsSign,
      saturnSign,
    ].filter((sign): sign is string => Boolean(sign))));

    const correspondences = keySigns.flatMap((sign) => {
      const data = MedicalAstrologyEngine.BODY_RULERS[sign];
      return data
        ? [{
            systemName: data.system,
            signRuler: sign,
            governedAnatomy: data.anatomy,
            symbolicAssociation: data.symbolism,
          }]
        : [];
    });

    const sixthHouse = chart.houses[5]?.sign || "Unknown";
    const twelfthHouse = chart.houses[11]?.sign || "Unknown";

    return {
      disclaimer: "Historical astrological symbolism only. This is not a medical assessment, diagnosis, health-risk prediction, or treatment advice. Do not use chart placements to assess symptoms, change medication, or delay professional care.",
      constitutionSymbolism: `In this tradition, the Ascendant (${ascSign}), Sun (${sunSign}) and Moon (${moonSign}) are interpreted as symbolic themes of embodiment, vitality and emotional life—not as measurements of biological health.`,
      traditionalBodyCorrespondences: correspondences,
      sixthHouseSymbolism: `The 6th house is traditionally associated with work, routine, service and illness in astrological literature. Its sign here is ${sixthHouse}; this is a symbolic correspondence, not a health indicator.`,
      twelfthHouseSymbolism: `The 12th house is traditionally associated with retreat, seclusion and hidden matters. Its sign here is ${twelfthHouse}; this is a symbolic correspondence, not a diagnosis or prediction.`,
      reflectionPrompts: [
        "Which everyday routines feel sustainable and supportive?",
        "What boundaries help you balance service, work and rest?",
        "Which traditional sign/body associations would you like to explore as cultural history?",
      ],
    };
  }
}

// ---------------------------------------------------------------------------
// 4. ASTROCARTOGRAPHY POWER LINES
// ---------------------------------------------------------------------------

export interface AstrocartographyPathPoint {
  latitude: number;
  longitude: number;
}

export interface AstrocartographyLine {
  planet: string;
  symbol: string;
  lineType: "AC (Ascendant)" | "DC (Descendant)" | "MC (Midheaven)" | "IC (Imum Coeli)";
  /** MC/IC meridian longitude; AC/DC use their equator-crossing reference longitude. */
  longitudeTarget: number;
  longitudeStr: string;
  /** Sampled longitude-versus-latitude curve for AC/DC; MC/IC are meridians. */
  pathPoints: AstrocartographyPathPoint[];
  theme: string;
  bestFor: string;
}

export interface AstrocartographyReport {
  powerLines: AstrocartographyLine[];
  lineGuidance: Array<{ purpose: string; planetaryLine: string; guidance: string }>;
  method: string;
}

/**
 * Computes astrocartography from a natal geocentric ecliptic position and the
 * Greenwich sidereal angle at the birth instant. MC/IC are meridians; AC/DC
 * are horizon-intersection curves and therefore vary with terrestrial latitude.
 */
export class AstrocartographyEngine {
  private formatLongitude(longitude: number): string {
    const signed = longitude > 180 ? longitude - 360 : longitude;
    const hemisphere = signed >= 0 ? "E" : "W";
    return `${Math.abs(signed).toFixed(2)}° ${hemisphere}`;
  }

  private toEquatorial(
    longitude: number,
    latitude: number,
    obliquity: number
  ): { rightAscension: number; declination: number } {
    const lambda = longitude * Math.PI / 180;
    const beta = latitude * Math.PI / 180;
    const epsilon = obliquity * Math.PI / 180;

    const x = Math.cos(beta) * Math.cos(lambda);
    const y = Math.cos(beta) * Math.sin(lambda) * Math.cos(epsilon)
      - Math.sin(beta) * Math.sin(epsilon);
    const z = Math.cos(beta) * Math.sin(lambda) * Math.sin(epsilon)
      + Math.sin(beta) * Math.cos(epsilon);

    const rightAscension = normalizeDegrees(Math.atan2(y, x) * 180 / Math.PI);
    const declination = Math.asin(Math.max(-1, Math.min(1, z))) * 180 / Math.PI;
    return { rightAscension, declination };
  }

  private calculateHorizonPath(
    rightAscension: number,
    declination: number,
    greenwichSiderealDegrees: number,
    rising: boolean
  ): AstrocartographyPathPoint[] {
    const points: AstrocartographyPathPoint[] = [];
    const decRad = declination * Math.PI / 180;

    for (let latitude = -85; latitude <= 85; latitude += 5) {
      const latRad = latitude * Math.PI / 180;
      const cosHourAngle = -Math.tan(latRad) * Math.tan(decRad);
      if (cosHourAngle < -1 || cosHourAngle > 1) continue;

      const absoluteHourAngle = Math.acos(cosHourAngle) * 180 / Math.PI;
      // Rising bodies have a negative hour angle; setting bodies have a positive one.
      const hourAngle = rising ? -absoluteHourAngle : absoluteHourAngle;
      const longitude = normalizeDegrees(rightAscension + hourAngle - greenwichSiderealDegrees);
      points.push({
        latitude,
        longitude: Math.round(longitude * 10000) / 10000,
      });
    }

    return points;
  }

  public calculatePowerLines(
    chart: WesternChartData,
    birthLongitude: number
  ): AstrocartographyReport {
    const lines: AstrocartographyLine[] = [];
    // Chart siderealTime is the local RAMC (GST + natal longitude).
    const greenwichSiderealDegrees = normalizeDegrees(chart.siderealTime - birthLongitude);
    const classicalBodies = new Set([
      "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter",
      "Saturn", "Uranus", "Neptune", "Pluto", "Chiron",
    ]);

    chart.planets.filter((planet) => classicalBodies.has(planet.name)).forEach((planet) => {
      const equatorial = this.toEquatorial(
        planet.longitude,
        planet.latitude || 0,
        chart.obliquity
      );
      const mcLongitude = normalizeDegrees(equatorial.rightAscension - greenwichSiderealDegrees);
      const icLongitude = normalizeDegrees(mcLongitude + 180);
      const risingPath = this.calculateHorizonPath(
        equatorial.rightAscension,
        equatorial.declination,
        greenwichSiderealDegrees,
        true
      );
      const settingPath = this.calculateHorizonPath(
        equatorial.rightAscension,
        equatorial.declination,
        greenwichSiderealDegrees,
        false
      );
      const risingEquator = risingPath.find((point) => point.latitude === 0);
      const settingEquator = settingPath.find((point) => point.latitude === 0);

      const addLine = (
        lineType: AstrocartographyLine["lineType"],
        longitudeTarget: number,
        pathPoints: AstrocartographyPathPoint[],
        theme: string,
        bestFor: string,
        isCurve: boolean
      ) => {
        lines.push({
          planet: planet.name,
          symbol: planet.symbol,
          lineType,
          longitudeTarget,
          longitudeStr: isCurve
            ? `Equator reference ${this.formatLongitude(longitudeTarget)}`
            : this.formatLongitude(longitudeTarget),
          pathPoints,
          theme,
          bestFor,
        });
      };

      addLine(
        "MC (Midheaven)",
        mcLongitude,
        [],
        `Culmination of ${planet.name} on the local meridian: public visibility, career and vocation.`,
        "Career, visibility and public role",
        false
      );
      addLine(
        "IC (Imum Coeli)",
        icLongitude,
        [],
        `Lower-meridian emphasis of ${planet.name}: home, roots, privacy and inner foundations.`,
        "Home, roots and private life",
        false
      );

      if (risingEquator && risingPath.length > 1) {
        addLine(
          "AC (Ascendant)",
          risingEquator.longitude,
          risingPath,
          `Rising horizon path for ${planet.name}; the curve shifts with latitude.`,
          "Self-expression, embodiment and beginnings",
          true
        );
      }
      if (settingEquator && settingPath.length > 1) {
        addLine(
          "DC (Descendant)",
          settingEquator.longitude,
          settingPath,
          `Setting horizon path for ${planet.name}; the curve shifts with latitude.`,
          "Partnerships, encounters and collaboration",
          true
        );
      }
    });

    return {
      powerLines: lines,
      lineGuidance: [
        { purpose: "Career & public profile", planetaryLine: "Sun-MC / Jupiter-MC", guidance: "Compare these meridians with actual cities; the line itself is a geometric track, not a destination recommendation." },
        { purpose: "Relationships & collaboration", planetaryLine: "Venus-DC / Jupiter-DC", guidance: "Evaluate the latitude-dependent setting curves against the coordinates of places you are considering." },
        { purpose: "Home & private foundations", planetaryLine: "Moon-IC / Venus-IC", guidance: "Use the calculated IC meridians as a starting point for location comparison." },
        { purpose: "Personal reinvention", planetaryLine: "Sun-AC / Mars-AC", guidance: "Compare the rising curves by latitude; an AC line is not one fixed longitude." },
      ],
      method: "MC/IC meridians are derived from right ascension and Greenwich sidereal angle. AC/DC are geometric horizon crossings sampled every 5° of latitude (geometric horizon; no atmospheric refraction).",
    };
  }
}
