/**
 * Specialized Western Astrology Engines:
 * 1. Fixed Stars Engine (35+ Classical, Royal & Archangel stars with orb detection & Ptolemaic natures)
 * 2. Eclipse Analyzer (Solar & Lunar eclipses affecting natal houses with 6-12 month impacts)
 * 3. Medical Astrology Indicators (Zodiac bodily rulerships, stress aspects, 6th/12th house vitality analysis)
 * 4. Astrocartography Power Lines (Planetary lines on AC, DC, MC, IC across geographic coordinates)
 */

import * as Astronomy from "astronomy-engine";
import { swissEphemeris } from "./swissEphemeris";
import {
  WesternChartData,
  PlanetPosition,
  normalizeDegrees,
  formatDegreeMinute,
  ZODIAC_SIGNS,
} from "./ephemeris";

// ---------------------------------------------------------------------------
// 1. FIXED STARS ENGINE
// ---------------------------------------------------------------------------

export interface FixedStar {
  name: string;
  constellation: string;
  longitude: number; // J2000 longitude
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
  starLongitude: number;
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

  public calculateStarContacts(chart: WesternChartData, maxOrb = 1.25): StarContact[] {
    const contacts: StarContact[] = [];
    const testPoints = [
      ...chart.planets,
      chart.ascendant,
      chart.midheaven,
    ];

    FixedStarsEngine.FIXED_STARS.forEach((star) => {
      testPoints.forEach((point) => {
        let diff = Math.abs(point.longitude - star.longitude);
        if (diff > 180) diff = 360 - diff;

        if (diff <= maxOrb) {
          contacts.push({
            starName: star.name,
            constellation: star.constellation,
            nature: star.nature,
            planetName: point.name,
            planetSymbol: point.symbol,
            starLongitude: star.longitude,
            planetLongitude: point.longitude,
            orb: Math.round(diff * 100) / 100,
            interpretation: `${point.name} (${point.signDegreeFormatted}) exactly conjuncts ${star.name} (${formatDegreeMinute(star.longitude)}, orb ${diff.toFixed(2)}°). Nature: ${star.nature} (${star.planetaryNature}). ${star.meaning}`,
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
  peakUtc: string;
  type: "Total Solar" | "Annular Solar" | "Total Lunar" | "Partial Lunar" | "Penumbral Lunar" | "Partial Solar";
  zodiacSign: string;
  degree: number;
  degreeFormatted: string;
  affectedHouse: number;
  intensity: "High" | "Extreme" | "Moderate";
  theme: string;
  recommendations: string[];
  visibilityNote: string;
}

export class EclipseAnalyzer {
  public analyzeEclipses(
    chart: WesternChartData,
    referenceDate: Date = new Date(),
    yearsAhead = 3
  ): EclipseItem[] {
    if (!Number.isFinite(referenceDate.getTime())) {
      throw new RangeError("Eclipse search requires a valid reference date.");
    }
    if (!Number.isFinite(yearsAhead) || yearsAhead <= 0 || yearsAhead > 20) {
      throw new RangeError("Eclipse search horizon must be greater than 0 and no more than 20 years.");
    }

    const endDate = new Date(referenceDate.getTime());
    endDate.setUTCFullYear(endDate.getUTCFullYear() + yearsAhead);

    const getHouse = (longitude: number) => {
      const cusps = chart.houses;
      if (!cusps || cusps.length !== 12) return 1;
      for (let i = 0; i < cusps.length; i++) {
        const current = cusps[i].longitude;
        const nextCusp = cusps[(i + 1) % cusps.length].longitude;
        if (current < nextCusp) {
          if (longitude >= current && longitude < nextCusp) return i + 1;
        } else if (longitude >= current || longitude < nextCusp) {
          return i + 1;
        }
      }
      return 1;
    };

    const houseThemes: Record<number, { theme: string; recs: string[] }> = {
      1: { theme: "Identity and self-presentation symbolism", recs: ["Reflect on personal priorities", "Review how you present yourself", "Set realistic intentions"] },
      2: { theme: "Resources and personal values symbolism", recs: ["Review your budget", "Clarify personal values", "Plan practical resource goals"] },
      3: { theme: "Learning and communication symbolism", recs: ["Organize learning goals", "Review important communications", "Reconnect with local community"] },
      4: { theme: "Home and foundations symbolism", recs: ["Review home priorities", "Organize family records", "Create a calmer home routine"] },
      5: { theme: "Creativity and enjoyment symbolism", recs: ["Make time for creative work", "Review leisure commitments", "Explore a hobby"] },
      6: { theme: "Work and routines symbolism", recs: ["Review daily routines", "Organize work processes", "Plan sustainable habits"] },
      7: { theme: "Partnership symbolism", recs: ["Review relationship expectations", "Clarify shared commitments", "Make space for honest dialogue"] },
      8: { theme: "Shared resources and change symbolism", recs: ["Review shared financial arrangements", "Organize relevant records", "Reflect on boundaries"] },
      9: { theme: "Study and worldview symbolism", recs: ["Review education goals", "Explore a new subject", "Reflect on beliefs"] },
      10: { theme: "Public role and vocation symbolism", recs: ["Review professional priorities", "Clarify long-term goals", "Plan a realistic next step"] },
      11: { theme: "Community and long-range hopes symbolism", recs: ["Review group commitments", "Reconnect with supportive networks", "Refine long-range plans"] },
      12: { theme: "Rest and reflection symbolism", recs: ["Protect time for rest", "Review personal boundaries", "Make room for reflection"] },
    };

    const toPeakDate = (peak: Astronomy.AstroTime): Date => new Date(peak.date.getTime());
    const julianDay = (date: Date) => swissEphemeris.calculateJulianDay(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      0
    );

    const raw: Array<{ peak: Date; type: EclipseItem["type"]; longitude: number }> = [];

    // Global solar eclipse searches (partial, annular and total).
    try {
      let event = Astronomy.SearchGlobalSolarEclipse(referenceDate);
      for (let count = 0; count < 16; count++) {
        const peak = toPeakDate(event.peak);
        if (peak.getTime() > endDate.getTime()) break;
        if (peak.getTime() >= referenceDate.getTime()) {
          const sunLongitude = swissEphemeris.getApparentSunLongitude(julianDay(peak));
          const type = event.kind === Astronomy.EclipseKind.Total ? "Total Solar"
            : event.kind === Astronomy.EclipseKind.Annular ? "Annular Solar" : "Partial Solar";
          raw.push({ peak, type, longitude: sunLongitude });
        }
        event = Astronomy.NextGlobalSolarEclipse(event.peak);
      }
    } catch {
      // If the astronomy library cannot resolve a future event, do not fall back
      // to stale hand-maintained eclipse dates.
    }

    // Lunar eclipse searches include penumbral events as well as partial/total.
    try {
      let event = Astronomy.SearchLunarEclipse(referenceDate);
      for (let count = 0; count < 16; count++) {
        const peak = toPeakDate(event.peak);
        if (peak.getTime() > endDate.getTime()) break;
        if (peak.getTime() >= referenceDate.getTime()) {
          const moonPosition = swissEphemeris.calculatePlanetPosition(
            swissEphemeris.MOON,
            julianDay(peak)
          );
          const type = event.kind === Astronomy.EclipseKind.Total ? "Total Lunar"
            : event.kind === Astronomy.EclipseKind.Partial ? "Partial Lunar" : "Penumbral Lunar";
          raw.push({ peak, type, longitude: moonPosition.longitude });
        }
        event = Astronomy.NextLunarEclipse(event.peak);
      }
    } catch {
      // Keep the valid events found by the other search, if any.
    }

    raw.sort((a, b) => a.peak.getTime() - b.peak.getTime());

    return raw.map((event) => {
      const longitude = normalizeDegrees(event.longitude);
      const house = getHouse(longitude);
      const signIndex = Math.floor(longitude / 30);
      const sign = ZODIAC_SIGNS[signIndex]?.name || "Aries";
      const info = houseThemes[house];
      const isTotal = event.type === "Total Solar" || event.type === "Total Lunar";
      const intensity: EclipseItem["intensity"] = isTotal ? "Extreme"
        : event.type === "Penumbral Lunar" ? "Moderate" : "High";

      return {
        date: event.peak.toISOString().slice(0, 10),
        peakUtc: event.peak.toISOString(),
        type: event.type,
        zodiacSign: sign,
        degree: longitude,
        degreeFormatted: formatDegreeMinute(longitude),
        affectedHouse: house,
        intensity,
        theme: info.theme,
        recommendations: info.recs,
        visibilityNote: "This is a global astronomical eclipse event. Local visibility depends on geographic location and is not implied by this natal-chart overlay.",
      };
    });
  }
}
// ---------------------------------------------------------------------------
// 3. MEDICAL ASTROLOGY INDICATORS
// ---------------------------------------------------------------------------

export interface MedicalIndicator {
  systemName: string;
  signRuler: string;
  traditionalBodyCorrespondence: string;
  chartEmphasis: "Key" | "Additional";
  traditionalInterpretation: string;
}

export interface MedicalAstrologyReport {
  traditionalSummary: string;
  traditionalCorrespondences: MedicalIndicator[];
  sixthHouseTheme: string;
  twelfthHouseTheme: string;
}

/**
 * Historical medical-astrology symbolism only.
 *
 * This deliberately does not infer disease, clinical risk, symptoms, or treatment
 * from a chart. Astrological body correspondences are cultural/historical
 * associations and have no diagnostic or predictive medical validity.
 */
export class MedicalAstrologyEngine {
  private static readonly BODY_RULERS: Record<string, {
    system: string;
    correspondence: string;
    interpretation: string;
  }> = {
    Aries: {
      system: "Head & face symbolism",
      correspondence: "Head, face and eyes",
      interpretation: "Some historical medical-astrology traditions associate Aries with the head and face. This does not provide evidence of a health condition or risk.",
    },
    Taurus: {
      system: "Neck & throat symbolism",
      correspondence: "Neck, throat and voice",
      interpretation: "Some historical traditions associate Taurus with the neck and throat. This does not indicate thyroid disease or a vocal-cord condition.",
    },
    Gemini: {
      system: "Shoulder & breath symbolism",
      correspondence: "Shoulders, arms and breathing",
      interpretation: "Some historical traditions associate Gemini with the shoulders, arms and breath. This does not assess lung or nerve function.",
    },
    Cancer: {
      system: "Chest & stomach symbolism",
      correspondence: "Chest and stomach",
      interpretation: "Some historical traditions associate Cancer with the chest and stomach. This does not assess digestive or breast health.",
    },
    Leo: {
      system: "Heart & upper-back symbolism",
      correspondence: "Heart symbolism and upper back",
      interpretation: "Some historical traditions associate Leo with the heart and upper back. This does not indicate cardiac health or risk.",
    },
    Virgo: {
      system: "Digestive symbolism",
      correspondence: "Intestinal and digestive symbolism",
      interpretation: "Some historical traditions associate Virgo with digestion and the intestines. This does not assess gut, spleen or other organ function.",
    },
    Libra: {
      system: "Kidney & lower-back symbolism",
      correspondence: "Kidney symbolism and lower back",
      interpretation: "Some historical traditions associate Libra with the kidneys and lower back. This does not assess renal function.",
    },
    Scorpio: {
      system: "Reproductive & eliminative symbolism",
      correspondence: "Reproductive and eliminative symbolism",
      interpretation: "Some historical traditions associate Scorpio with reproductive and eliminative themes. This does not assess reproductive or urological health.",
    },
    Sagittarius: {
      system: "Hip & liver symbolism",
      correspondence: "Hips, thighs and liver symbolism",
      interpretation: "Some historical traditions associate Sagittarius with the hips, thighs and liver. This does not assess liver function or recommend a cleanse.",
    },
    Capricorn: {
      system: "Bone & joint symbolism",
      correspondence: "Bones, knees, joints and teeth",
      interpretation: "Some historical traditions associate Capricorn with bones, knees, joints and teeth. This does not assess skeletal or dental conditions.",
    },
    Aquarius: {
      system: "Calf & ankle symbolism",
      correspondence: "Calves and ankles",
      interpretation: "Some historical traditions associate Aquarius with the calves and ankles. This does not assess circulation or neurological function.",
    },
    Pisces: {
      system: "Foot & fluid symbolism",
      correspondence: "Feet and traditional fluid symbolism",
      interpretation: "Some historical traditions associate Pisces with the feet and fluid symbolism. This does not assess immune, lymphatic or autoimmune conditions.",
    },
  };

  public analyzeTraditionalSymbolism(chart: WesternChartData): MedicalAstrologyReport {
    const sunSign = chart.planets.find((p) => p.name === "Sun")?.sign || "Aries";
    const moonSign = chart.planets.find((p) => p.name === "Moon")?.sign || "Taurus";
    const ascSign = chart.ascendant.sign;
    const mars = chart.planets.find((p) => p.name === "Mars");
    const saturn = chart.planets.find((p) => p.name === "Saturn");
    const keySigns = Array.from(new Set([
      sunSign,
      moonSign,
      ascSign,
      mars?.sign || "Aries",
      saturn?.sign || "Capricorn",
    ]));

    const traditionalCorrespondences: MedicalIndicator[] = keySigns.flatMap((sign) => {
      const data = MedicalAstrologyEngine.BODY_RULERS[sign];
      if (!data) return [];
      const isKeyChartFactor = sign === mars?.sign || sign === saturn?.sign;
      return [{
        systemName: data.system,
        signRuler: sign,
        traditionalBodyCorrespondence: data.correspondence,
        chartEmphasis: isKeyChartFactor ? "Key" : "Additional",
        traditionalInterpretation: data.interpretation,
      }];
    });

    const house6 = chart.houses[5];
    const house12 = chart.houses[11];

    return {
      traditionalSummary: `In historical medical-astrology symbolism, the Ascendant (${ascSign}), Sun (${sunSign}), and Moon (${moonSign}) are interpreted as symbolic themes. They do not describe physical condition and do not diagnose illness or estimate medical risk.`,
      traditionalCorrespondences,
      sixthHouseTheme: `The sixth house begins in ${house6.sign}. In this tradition it is associated with routines, service and illness symbolism; this is not a clinical indicator.`,
      twelfthHouseTheme: `The twelfth house begins in ${house12.sign}. In this tradition it is associated with retreat and hidden matters; it does not indicate hidden illness or exhaustion.`,
    };
  }
}

// ---------------------------------------------------------------------------
// 4. ASTROCARTOGRAPHY POWER LINES
// ---------------------------------------------------------------------------

export interface AstrocartographyCoordinate {
  latitude: number;
  longitude: number; // east-positive degrees in [-180, 180]
}

export interface AstrocartographyLine {
  planet: string;
  symbol: string;
  lineType: "AC (Ascendant)" | "DC (Descendant)" | "MC (Midheaven)" | "IC (Imum Coeli)";
  longitudeTarget: number; // reference longitude; for AC/DC this is the equator crossing
  longitudeStr: string;
  coordinates: AstrocartographyCoordinate[];
  theme: string;
  bestFor: string;
}

export interface AstrocartographyReport {
  powerLines: AstrocartographyLine[];
  topDestinations: Array<{ purpose: string; suggestedRegion: string; planetaryLine: string }>;
  calculationNote: string;
}

export class AstrocartographyEngine {
  public calculatePowerLines(chart: WesternChartData): AstrocartographyReport {
    const lines: AstrocartographyLine[] = [];
    const radians = (degrees: number) => degrees * Math.PI / 180;
    const degrees = (value: number) => value * 180 / Math.PI;
    const toSignedLongitude = (value: number) => {
      const normalized = normalizeDegrees(value);
      return normalized > 180 ? normalized - 360 : normalized;
    };
    const formatLongitude = (value: number) => {
      const signed = toSignedLongitude(value);
      return `${Math.abs(signed).toFixed(1)}° ${signed >= 0 ? "E" : "W"}`;
    };

    if (!Number.isFinite(chart.julianDay) || !Number.isFinite(chart.siderealTime) ||
        !Number.isFinite(chart.obliquity) || !Number.isFinite(chart.birthLongitude)) {
      return {
        powerLines: [],
        topDestinations: [],
        calculationNote: "A valid UTC birth instant, local sidereal time, obliquity and east-positive birth longitude are required. No lines were generated.",
      };
    }

    // siderealTime is the local RAMC (= GMST + east-positive birth longitude).
    const birthLongitude = chart.birthLongitude;
    if (typeof birthLongitude !== "number" || !Number.isFinite(birthLongitude)) {
      return {
        powerLines: [],
        topDestinations: [],
        calculationNote: "Birth longitude is unavailable. No geographic lines were generated.",
      };
    }
    const greenwichSidereal = normalizeDegrees(chart.siderealTime - birthLongitude);
    const obliquity = radians(chart.obliquity);
    const standardPlanets = new Set(["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]);

    chart.planets.filter((planet) => standardPlanets.has(planet.name)).forEach((planet) => {
      const lambda = radians(planet.longitude);
      const beta = radians(planet.latitude ?? 0);
      // Ecliptic to equatorial rotation using the chart's obliquity of date.
      const x = Math.cos(beta) * Math.cos(lambda);
      const y = Math.cos(beta) * Math.sin(lambda) * Math.cos(obliquity) - Math.sin(beta) * Math.sin(obliquity);
      const z = Math.cos(beta) * Math.sin(lambda) * Math.sin(obliquity) + Math.sin(beta) * Math.cos(obliquity);
      const rightAscension = normalizeDegrees(degrees(Math.atan2(y, x)));
      const declination = Math.asin(Math.max(-1, Math.min(1, z)));

      const addLine = (
        lineType: AstrocartographyLine["lineType"],
        coordinates: AstrocartographyCoordinate[],
        theme: string,
        bestFor: string,
        longitudeStr: string,
        longitudeTarget: number
      ) => {
        if (coordinates.length === 0) return;
        lines.push({
          planet: planet.name,
          symbol: planet.symbol,
          lineType,
          longitudeTarget: toSignedLongitude(longitudeTarget),
          longitudeStr,
          coordinates,
          theme,
          bestFor,
        });
      };

      // MC/IC are meridians: local sidereal time equals RA (or RA + 180°).
      const mcLongitude = toSignedLongitude(rightAscension - greenwichSidereal);
      const icLongitude = toSignedLongitude(mcLongitude + 180);
      const meridianLatitudes = Array.from({ length: 33 }, (_, index) => -80 + index * 5);
      addLine("MC (Midheaven)", meridianLatitudes.map((latitude) => ({ latitude, longitude: mcLongitude })),
        `In traditional astrocartography, ${planet.name} is on the upper meridian.`, "Career and public-role symbolism", formatLongitude(mcLongitude), mcLongitude);
      addLine("IC (Imum Coeli)", meridianLatitudes.map((latitude) => ({ latitude, longitude: icLongitude })),
        `In traditional astrocartography, ${planet.name} is on the lower meridian.`, "Home and private-life symbolism", formatLongitude(icLongitude), icLongitude);

      // AC/DC are horizon curves. Rising uses negative hour angle; setting positive.
      const ascendantPoints: AstrocartographyCoordinate[] = [];
      const descendantPoints: AstrocartographyCoordinate[] = [];
      for (let latitude = -89; latitude <= 89; latitude += 1) {
        const latitudeRadians = radians(latitude);
        const cosHourAngle = -Math.tan(latitudeRadians) * Math.tan(declination);
        if (!Number.isFinite(cosHourAngle) || cosHourAngle < -1 || cosHourAngle > 1) continue;
        const absoluteHourAngle = Math.acos(Math.max(-1, Math.min(1, cosHourAngle)));
        const risingHourAngle = -degrees(absoluteHourAngle);
        const settingHourAngle = degrees(absoluteHourAngle);
        ascendantPoints.push({ latitude, longitude: toSignedLongitude(rightAscension + risingHourAngle - greenwichSidereal) });
        descendantPoints.push({ latitude, longitude: toSignedLongitude(rightAscension + settingHourAngle - greenwichSidereal) });
      }
      const equatorAsc = ascendantPoints.find((point) => point.latitude === 0);
      const equatorDesc = descendantPoints.find((point) => point.latitude === 0);
      addLine("AC (Ascendant)", ascendantPoints,
        `Geometric rising curve for ${planet.name}; line exists only at latitudes where the planet crosses the horizon.`,
        "Identity and outward-expression symbolism", equatorAsc ? `Equator: ${formatLongitude(equatorAsc.longitude)}; curve varies by latitude` : "Latitude-dependent curve; no equator crossing", equatorAsc?.longitude ?? 0);
      addLine("DC (Descendant)", descendantPoints,
        `Geometric setting curve for ${planet.name}; line exists only at latitudes where the planet crosses the horizon.`,
        "Partnership and encounter symbolism", equatorDesc ? `Equator: ${formatLongitude(equatorDesc.longitude)}; curve varies by latitude` : "Latitude-dependent curve; no equator crossing", equatorDesc?.longitude ?? 0);
    });

    return {
      powerLines: lines,
      // City/region recommendations require a geospatial database and distance-to-line
      // calculation. Do not fabricate destination regions from planetary longitudes.
      topDestinations: [],
      calculationNote: "Lines use geocentric ecliptic coordinates converted to equatorial RA/declination, local sidereal time and geometric horizon curves. AC/DC curves terminate where no horizon crossing exists. This is an astronomy-based line geometry; astrological interpretations are traditional symbolism, not evidence-based location effects. The current UI does not yet calculate nearest cities or line-distance orbs.",
    };
  }
}
