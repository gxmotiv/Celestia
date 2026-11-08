/**
 * Specialized Western Astrology Engines:
 * 1. Fixed Stars Engine (35+ Classical, Royal & Archangel stars with orb detection & Ptolemaic natures)
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
  type: "Total Solar" | "Annular Solar" | "Total Lunar" | "Partial Lunar" | "Partial Solar";
  zodiacSign: string;
  degree: number;
  degreeFormatted: string;
  affectedHouse: number;
  intensity: "High" | "Extreme" | "Moderate";
  theme: string;
  recommendations: string[];
}

export class EclipseAnalyzer {
  private static readonly UPCOMING_ECLIPSES = [
    { date: "March 14, 2025", type: "Total Lunar" as const, lon: 173.9 },    // ~23° Virgo
    { date: "March 29, 2025", type: "Partial Solar" as const, lon: 9.0 },     // ~9° Aries
    { date: "September 7, 2025", type: "Total Lunar" as const, lon: 345.3 }, // ~15° Pisces
    { date: "September 21, 2025", type: "Partial Solar" as const, lon: 179.0 },// ~29° Virgo
    { date: "February 17, 2026", type: "Annular Solar" as const, lon: 328.8 }, // ~28° Aquarius
    { date: "March 3, 2026", type: "Total Lunar" as const, lon: 162.8 },      // ~12° Virgo
    { date: "August 12, 2026", type: "Total Solar" as const, lon: 140.0 },     // ~20° Leo
    { date: "August 28, 2026", type: "Partial Lunar" as const, lon: 334.8 },   // ~4° Pisces
  ];

  public analyzeEclipses(chart: WesternChartData): EclipseItem[] {
    const getHouse = (lon: number) => {
      const cusps = chart.houses;
      for (let i = 0; i < cusps.length; i++) {
        const c = cusps[i].longitude;
        const n = cusps[(i + 1) % cusps.length].longitude;
        if (n > c) {
          if (lon >= c && lon < n) return i + 1;
        } else {
          if (lon >= c || lon < n) return i + 1;
        }
      }
      return 1;
    };

    const HOUSE_THEMES: Record<number, { theme: string; recs: string[] }> = {
      1: { theme: "Radical Identity & Body Rebirth", recs: ["Revitalize personal appearance", "Redefine life boundaries", "Step boldly into individual agency"] },
      2: { theme: "Financial Re-orientation & Self-Worth", recs: ["Restructure income streams", "Release scarcity fears", "Invest in core personal values"] },
      3: { theme: "Mental Breakthroughs & New Communications", recs: ["Begin a writing project", "Resolve neighborly or sibling ties", "Upgrade technical skills"] },
      4: { theme: "Home Sanctuary & Ancestral Foundations", recs: ["Relocate or renovate sanctuary", "Address ancestral roots", "Create deeper emotional peace"] },
      5: { theme: "Creative Culmination & Romantic Renewal", recs: ["Launch artistic passion projects", "Celebrate inner-child joy", "Embrace heart vulnerability"] },
      6: { theme: "Wellness Overhaul & Daily Discipline", recs: ["Adopt holistic health rituals", "Reorganize work habits", "Prioritize restorative rest"] },
      7: { theme: "Relationship Evolution & Partnership Contracts", recs: ["Re-evaluate contractual parity", "Commit or gracefully release", "Foster transparent honesty"] },
      8: { theme: "Psychological Metamorphosis & Shared Capital", recs: ["Transform debts and investments", "Heal deep psychological taboos", "Release mortal anxieties"] },
      9: { theme: "Philosophical Awakening & World Horizons", recs: ["Embark on a spiritual pilgrimage", "Publish or teach your wisdom", "Expand cross-cultural understanding"] },
      10: { theme: "Career Destiny & Public Recognition", recs: ["Step into executive leadership", "Align profession with true calling", "Claim public reputation with dignity"] },
      11: { theme: "Community Re-alignment & Future Hopes", recs: ["Prune toxic peer groups", "Join visionary collectives", "Cast bold intentions for the coming era"] },
      12: { theme: "Subconscious Surrender & Spiritual Healing", recs: ["Enter sacred solitary retreat", "Engage dreamwork & meditation", "Forgive and release past burdens"] },
    };

    return EclipseAnalyzer.UPCOMING_ECLIPSES.map((e) => {
      const house = getHouse(e.lon);
      const signIdx = Math.floor(e.lon / 30);
      const sign = ZODIAC_SIGNS[signIdx]?.name || "Aries";
      const info = HOUSE_THEMES[house];

      return {
        date: e.date,
        type: e.type,
        zodiacSign: sign,
        degree: e.lon,
        degreeFormatted: formatDegreeMinute(e.lon),
        affectedHouse: house,
        intensity: e.type.includes("Total") ? "Extreme" : "High",
        theme: info.theme,
        recommendations: info.recs,
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
  governedAnatomy: string;
  stressLevel: "Low" | "Moderate" | "Elevated";
  preventiveAdvice: string;
}

export interface MedicalAstrologyReport {
  vitalityConstitution: string;
  vulnerableSystems: MedicalIndicator[];
  sixthHouseNote: string;
  twelfthHouseNote: string;
  preventivePractices: string[];
}

export class MedicalAstrologyEngine {
  private static readonly BODY_RULERS: Record<string, { system: string; anatomy: string; advice: string }> = {
    Aries: { system: "Cranio-Facial & Neural Vitality", anatomy: "Brain, skull, eyes, adrenal adrenaline surges", advice: "Maintain balanced hydration, avoid excessive caffeine, and practice active stress release." },
    Taurus: { system: "Thyroid & Vocal/Cervical Spine", anatomy: "Neck, throat, thyroid gland, vocal cords", advice: "Support thyroid health with iodine/selenium, practice neck stretching, and soothe vocal strain." },
    Gemini: { system: "Respiratory & Nervous Branching", anatomy: "Lungs, bronchial tubes, shoulders, arms, peripheral nerves", advice: "Practice deep pranayama breathing, protect against nervous burnout, and take digital detoxes." },
    Cancer: { system: "Digestive Core & Epigastric Sanctuary", anatomy: "Stomach, epigastrium, breasts, lymphatic fluid", advice: "Nourish the gut microbiome, consume warm soothing broths, and avoid eating under emotional stress." },
    Leo: { system: "Cardiovascular & Spinal Axis", anatomy: "Heart, thoracic spine, aorta, solar vitality", advice: "Prioritize heart-healthy cardio, support spinal alignment, and nurture emotional joy." },
    Virgo: { system: "Enteric & Intestinal Assimilation", anatomy: "Small intestine, spleen, autonomic assimilation", advice: "Consume fiber-rich, unrefined whole foods; avoid hypochondriac worrying; prioritize calm digestion." },
    Libra: { system: "Renal & Acid-Base Equilibrium", anatomy: "Kidneys, adrenal cortex, lumbar region, skin filtration", advice: "Drink abundant alkaline water, limit sodium spikes, and maintain peaceful aesthetic surroundings." },
    Scorpio: { system: "Urogenital & Regenerative Excretion", anatomy: "Reproductive organs, prostate, colon, cellular detox", advice: "Support lymphatic and colon detoxification, honor emotional release, and drink clean herbal teas." },
    Sagittarius: { system: "Hepatic & Locomotor Musculature", anatomy: "Liver, hips, thighs, sciatic nerve, arterial system", advice: "Cleanse liver with milk thistle/bitters, avoid over-indulgence in rich foods, and maintain athletic walking." },
    Capricorn: { system: "Skeletal, Joint & Dermal Framework", anatomy: "Bones, knees, joints, teeth, connective tissue, skin", advice: "Ensure adequate calcium and magnesium intake, support joint mobility, and respect adequate rest." },
    Aquarius: { system: "Circulatory & Bio-Electric Pathways", anatomy: "Circulation, calves, ankles, neurological synapses", advice: "Elevate legs, stimulate healthy venous circulation, and ground nervous electrical tension." },
    Pisces: { system: "Lymphatic, Immune & Somatic Receptors", anatomy: "Feet, lymphatic drainage, pineal gland, autoimmune sensitivity", advice: "Practice Epsom salt foot soaks, strengthen mucosal immunity, and protect subtle energetic boundaries." },
  };

  public analyzeHealth(chart: WesternChartData): MedicalAstrologyReport {
    const sunSign = chart.planets.find((p) => p.name === "Sun")?.sign || "Aries";
    const moonSign = chart.planets.find((p) => p.name === "Moon")?.sign || "Taurus";
    const ascSign = chart.ascendant.sign;

    const vulnerable: MedicalIndicator[] = [];

    // Evaluate signs occupied by challenging aspects or Mars/Saturn
    const mars = chart.planets.find((p) => p.name === "Mars");
    const saturn = chart.planets.find((p) => p.name === "Saturn");

    const keySigns = Array.from(new Set([sunSign, moonSign, ascSign, mars?.sign || "Aries", saturn?.sign || "Capricorn"]));

    keySigns.forEach((sign) => {
      const data = MedicalAstrologyEngine.BODY_RULERS[sign];
      if (data) {
        const isStressed = sign === mars?.sign || sign === saturn?.sign;
        vulnerable.push({
          systemName: data.system,
          signRuler: sign,
          governedAnatomy: data.anatomy,
          stressLevel: isStressed ? "Elevated" : "Moderate",
          preventiveAdvice: data.advice,
        });
      }
    });

    const house6 = chart.houses[5];
    const house12 = chart.houses[11];

    return {
      vitalityConstitution: `Your somatic vitality combines ${ascSign} physical constitution with ${sunSign} solar recuperative force and ${moonSign} lunar emotional regulation.`,
      vulnerableSystems: vulnerable,
      sixthHouseNote: `House 6 starts in ${house6.sign}: Optimal daily healing routines flourish through disciplined ${house6.sign} wellness habits.`,
      twelfthHouseNote: `House 12 starts in ${house12.sign}: Guard against hidden exhaustion; regenerative healing occurs through quiet retreat and sound sleep.`,
      preventivePractices: [
        "Align daily rhythm with constitutional somatic needs.",
        "Emphasize targeted hydration and seasonal nutrient-dense foods.",
        "Integrate grounding restorative movement to disperse planetary nervous tension.",
      ],
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
