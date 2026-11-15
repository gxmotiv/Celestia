/**
 * Jaimini Chara Karaka engine.
 *
 * Explicitly named variants:
 * - 7-Karaka: Sun through Saturn; seven roles, with no separate Pitrikaraka.
 * - 8-Karaka: Sun through Rahu; eight roles including Pitrikaraka. Rahu's
 *   in-sign degree is reversed (30° minus its actual degree).
 *
 * The variants are alternatives, not values to combine in one ranking.
 * Tie values equal to the nearest arcsecond fail closed for manual review
 * rather than being assigned by array order.
 */

export interface JaiminiKaraka {
  role: string;
  roleShort: "AK" | "AmK" | "BK" | "MK" | "PiK" | "PK" | "GK" | "DK";
  roleName: string;
  sanskritName: string;
  planet: string;
  symbol: string;
  /** Actual longitude within the sign, in degrees. */
  rasiDegree: number;
  rasiDegreeFormatted: string;
  /** Value used for descending Chara-Karaka ranking; reversed for Rahu. */
  rankingDegree: number;
  rankingDegreeFormatted: string;
  sign: string;
  house: number;
  signification: string;
  lifeDomain: string;
}

export interface JaiminiKarakasResult {
  scheme: "7-Karaka" | "8-Karaka";
  atmakaraka: JaiminiKaraka;
  karakas: JaiminiKaraka[];
  karakamsaSign: string;
  karakamsaSignIndex: number;
  karakamsaHouseFromLagna: number;
  summary: string;
}

export interface JaiminiPlanetPosition {
  name: string;
  siderealLongitude: number;
  house: number;
  rasiName: string;
}

type KarakaDefinition = Omit<JaiminiKaraka,
  "planet" | "symbol" | "rasiDegree" | "rasiDegreeFormatted" |
  "rankingDegree" | "rankingDegreeFormatted" | "sign" | "house"
>;

const KARAKA_DEFINITIONS_7: KarakaDefinition[] = [
  {
    roleShort: "AK",
    role: "Atmakaraka",
    roleName: "Soul Significator",
    sanskritName: "आत्मकारक",
    signification: "The principal movable significator of self and the chart's central life theme.",
    lifeDomain: "Core self, dharma, major life transformation",
  },
  {
    roleShort: "AmK",
    role: "Amatyakaraka",
    roleName: "Minister / Career Significator",
    sanskritName: "अमात्यकारक",
    signification: "The minister of the Atmakaraka; profession, counsel and capacity to execute the soul's agenda.",
    lifeDomain: "Career, livelihood, public influence, intellectual work",
  },
  {
    roleShort: "BK",
    role: "Bhratrikaraka",
    roleName: "Sibling Significator",
    sanskritName: "भ्रातृकारक",
    signification: "Siblings, courage, companions and teachers.",
    lifeDomain: "Siblings, spiritual guidance, courage, mentors",
  },
  {
    roleShort: "MK",
    role: "Matrikaraka",
    roleName: "Mother Significator",
    sanskritName: "मातृकारक",
    signification: "Mother, nurture, education and foundations.",
    lifeDomain: "Mother, home, learning, emotional foundations",
  },
  {
    roleShort: "PK",
    role: "Putrakaraka",
    roleName: "Children Significator",
    sanskritName: "पुत्रकारक",
    signification: "Children, intelligence, creativity and merit.",
    lifeDomain: "Children, creativity, learning, merit",
  },
  {
    roleShort: "GK",
    role: "Gnatikaraka",
    roleName: "Kinsmen & Obstacles Significator",
    sanskritName: "ज्ञातिकारक",
    signification: "Relatives, disputes, obstacles, debts and disease.",
    lifeDomain: "Relatives, conflicts, obstacles, health discipline",
  },
  {
    roleShort: "DK",
    role: "Darakaraka",
    roleName: "Spouse Significator",
    sanskritName: "दाराकारक",
    signification: "Spouse, intimate partnerships and agreements.",
    lifeDomain: "Marriage, partnerships, contracts",
  },
];

const KARAKA_DEFINITIONS_8: KarakaDefinition[] = [
  KARAKA_DEFINITIONS_7[0],
  KARAKA_DEFINITIONS_7[1],
  KARAKA_DEFINITIONS_7[2],
  KARAKA_DEFINITIONS_7[3],
  {
    roleShort: "PiK",
    role: "Pitrikaraka",
    roleName: "Father Significator",
    sanskritName: "पितृकारक",
    signification: "Father, ancestry, authority and paternal foundations.",
    lifeDomain: "Father, lineage, authority, paternal dharma",
  },
  KARAKA_DEFINITIONS_7[4],
  KARAKA_DEFINITIONS_7[5],
  KARAKA_DEFINITIONS_7[6],
];

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉",
  Moon: "☽",
  Mars: "♂",
  Mercury: "☿",
  Jupiter: "♃",
  Venus: "♀",
  Saturn: "♄",
  Rahu: "☊",
};

const RASI_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

const CLASSICAL_7 = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const;
const CLASSICAL_8 = [...CLASSICAL_7, "Rahu"] as const;

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function formatDms(degrees: number): string {
  const totalArcSeconds = Math.round(degrees * 3600);
  const wholeDegrees = Math.floor(totalArcSeconds / 3600);
  const minutes = Math.floor((totalArcSeconds % 3600) / 60);
  const seconds = totalArcSeconds % 60;
  return `${wholeDegrees}°${minutes.toString().padStart(2, "0")}'${seconds.toString().padStart(2, "0")}"`;
}

function validatePositions(
  planets: JaiminiPlanetPosition[],
  requiredNames: readonly string[],
  ascendantLongitude: number | undefined
): { byName: Map<string, JaiminiPlanetPosition>; ascendant: number } {
  if (!Array.isArray(planets)) {
    throw new TypeError("Jaimini Chara Karakas require a planetary position array.");
  }
  const byName = new Map<string, JaiminiPlanetPosition>();
  for (const planet of planets) {
    if (!planet || typeof planet.name !== "string") {
      throw new RangeError("Every Jaimini planetary position must have a name.");
    }
    if (!requiredNames.includes(planet.name)) continue;
    if (byName.has(planet.name)) {
      throw new RangeError("Duplicate Jaimini position supplied for " + planet.name + ".");
    }
    if (!Number.isFinite(planet.siderealLongitude) ||
        !Number.isFinite(planet.house) ||
        planet.house < 1 || planet.house > 12 ||
        typeof planet.rasiName !== "string" || !planet.rasiName.trim()) {
      throw new RangeError("Jaimini position for " + planet.name + " is incomplete or invalid.");
    }
    byName.set(planet.name, planet);
  }

  const missing = requiredNames.filter((name) => !byName.has(name));
  if (missing.length) {
    throw new RangeError(
      "Jaimini " + requiredNames.length + "-Karaka scheme requires positions for: " +
      missing.join(", ") + "."
    );
  }

  const suppliedAscendant = ascendantLongitude ??
    planets.find((planet) => planet.name === "Ascendant" || planet.name === "Lagna")?.siderealLongitude;
  if (!Number.isFinite(suppliedAscendant)) {
    throw new RangeError("Jaimini Karakamsa requires the sidereal Ascendant longitude.");
  }

  return { byName, ascendant: normalizeDegrees(suppliedAscendant as number) };
}

export class JaiminiKarakasEngine {
  /**
   * Seven-karaka variant: the seven classical grahas, without Rahu or a
   * separate Pitrikaraka office. This preserves the existing Celestia default.
   */
  public calculate7Karakas(
    planets: JaiminiPlanetPosition[],
    ascendantLongitude?: number
  ): JaiminiKarakasResult {
    return this.calculateScheme("7-Karaka", planets, ascendantLongitude);
  }

  /**
   * Eight-karaka variant: includes Rahu with a reversed in-sign degree and
   * assigns Pitrikaraka between Matrikaraka and Putrakaraka.
   */
  public calculate8Karakas(
    planets: JaiminiPlanetPosition[],
    ascendantLongitude?: number
  ): JaiminiKarakasResult {
    return this.calculateScheme("8-Karaka", planets, ascendantLongitude);
  }

  private calculateScheme(
    scheme: "7-Karaka" | "8-Karaka",
    planets: JaiminiPlanetPosition[],
    ascendantLongitude?: number
  ): JaiminiKarakasResult {
    const isEight = scheme === "8-Karaka";
    const requiredNames: readonly string[] = isEight ? CLASSICAL_8 : CLASSICAL_7;
    const definitions = isEight ? KARAKA_DEFINITIONS_8 : KARAKA_DEFINITIONS_7;
    const { byName, ascendant } = validatePositions(
      planets,
      requiredNames,
      ascendantLongitude
    );

    const candidates = requiredNames.map((name) => {
      const position = byName.get(name)!;
      const absoluteLongitude = normalizeDegrees(position.siderealLongitude);
      const actualDegree = absoluteLongitude % 30;
      // Jaimini Sutra commentary convention: Rahu is ranked backwards.
      const rankingDegree = isEight && name === "Rahu"
        ? 30 - actualDegree
        : actualDegree;
      const rankingArcSeconds = Math.round(rankingDegree * 3600);
      return {
        ...position,
        absoluteLongitude,
        actualDegree,
        rankingDegree,
        rankingArcSeconds,
      };
    });

    candidates.sort((a, b) => b.rankingArcSeconds - a.rankingArcSeconds);

    // Sutra 1.1.11 in the Rao/Raman edition directs comparison by minutes and
    // seconds when whole degrees tie. If the arcseconds also tie, Celestia
    // refuses to let input-array order decide the karaka.
    for (let index = 1; index < candidates.length; index += 1) {
      if (candidates[index - 1].rankingArcSeconds === candidates[index].rankingArcSeconds) {
        throw new RangeError(
          "Unresolved Jaimini Chara Karaka tie at arcsecond precision between " +
          candidates[index - 1].name + " and " + candidates[index].name +
          ". Review the selected lineage's tie-filling rule."
        );
      }
    }

    const karakas: JaiminiKaraka[] = candidates.map((candidate, index) => {
      const definition = definitions[index];
      if (!definition) {
        throw new Error("No Jaimini karaka definition exists for rank " + (index + 1) + ".");
      }
      return {
        ...definition,
        planet: candidate.name,
        symbol: PLANET_SYMBOLS[candidate.name] || "",
        rasiDegree: candidate.actualDegree,
        rasiDegreeFormatted: formatDms(candidate.actualDegree),
        rankingDegree: candidate.rankingDegree,
        rankingDegreeFormatted: formatDms(candidate.rankingDegree),
        sign: candidate.rasiName,
        house: candidate.house,
      };
    });

    const atmakaraka = karakas[0];
    const atmakarakaPosition = candidates[0];

    // Each 3°20′ division is one Navamsa. The uninterrupted 108-part count
    // produces the Parashari/Jaimini D9 sign sequence across the zodiac.
    const karakamsaSignIndex =
      Math.floor(atmakarakaPosition.absoluteLongitude / (30 / 9)) % 12;
    const karakamsaSign = RASI_NAMES[karakamsaSignIndex];
    const lagnaSignIndex = Math.floor(ascendant / 30);
    const karakamsaHouseFromLagna =
      ((karakamsaSignIndex - lagnaSignIndex + 12) % 12) + 1;

    const rahuNote = isEight
      ? " Rahu was ranked by 30° minus its actual in-sign degree."
      : "";
    return {
      scheme,
      atmakaraka,
      karakas,
      karakamsaSign,
      karakamsaSignIndex: karakamsaSignIndex,
      karakamsaHouseFromLagna,
      summary:
        `${scheme}: Atmakaraka is ${atmakaraka.planet} at ${atmakaraka.rasiDegreeFormatted} in ${atmakaraka.sign} (House ${atmakaraka.house}).` +
        rahuNote,
    };
  }
}
