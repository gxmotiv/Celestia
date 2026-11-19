/**
 * Chara Karaka engines for two explicitly separated classical conventions.
 *
 * Parashari seven-karaka: Sun through Saturn; no Rahu and no Dara Karaka.
 * Jaimini eight-karaka: Sun through Saturn plus Rahu (counted in reverse
 * within its sign); Dara Karaka is the eighth role.
 *
 * Historical/commentarial variants exist. These outputs are named by the
 * selected convention and must not be presented as the only possible school.
 */
import { NavamsaCalculator } from "./d9NavamsaEngine";

export type CharaKarakaScheme = "Parashari-7" | "Jaimini-8";

export interface JaiminiKaraka {
  role: string;
  roleShort: "AK" | "AmK" | "BK" | "MK" | "PiK" | "PK" | "GK" | "DK";
  roleName: string;
  sanskritName: string;
  planet: string;
  symbol: string;
  /** Actual longitude within the sign, before any Rahu reversal. */
  rasiDegree: number;
  rasiDegreeFormatted: string;
  /** Degree used for ranking. For Rahu in Jaimini-8 this is 30° - raw degree. */
  effectiveDegree: number;
  effectiveDegreeFormatted: string;
  isReverseCounted: boolean;
  sign: string;
  house: number;
  signification: string;
  lifeDomain: string;
}

export interface JaiminiKarakasResult {
  scheme: CharaKarakaScheme;
  label: string;
  includesRahu: boolean;
  atmakaraka: JaiminiKaraka;
  karakas: JaiminiKaraka[];
  karakamsaSign: string;
  karakamsaSignIndex: number;
  karakamsaHouseFromLagna: number;
  warnings: string[];
  summary: string;
}

type PlanetInput = {
  name: string;
  siderealLongitude: number;
  house: number;
  rasiName: string;
};
type AscendantInput = { siderealLongitude: number };

const CLASSICAL_GRAHAS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const;
const VIMSHOTTARI_GRAHAS = [...CLASSICAL_GRAHAS, "Rahu"] as const;

const ROLE_DEFINITIONS = {
  AK: {
    role: "Atmakaraka", roleName: "Self / Soul Significator", sanskritName: "आत्मकारक",
    signification: "Primary Chara Karaka for the self and the native's central life themes.",
    lifeDomain: "Self, identity, purpose and major life themes",
  },
  AmK: {
    role: "Amatyakaraka", roleName: "Minister / Career Significator", sanskritName: "अमात्यकारक",
    signification: "The minister or aide associated with work, counsel and execution.",
    lifeDomain: "Career, livelihood, counsel and execution",
  },
  BK: {
    role: "Bhratrikaraka", roleName: "Sibling Significator", sanskritName: "भ्रातृकारक",
    signification: "Significator for siblings and related themes.",
    lifeDomain: "Siblings, peers and courage",
  },
  MK: {
    role: "Matrikaraka", roleName: "Mother Significator", sanskritName: "मातृकारक",
    signification: "Significator for mother and nurturing foundations.",
    lifeDomain: "Mother, care and foundations",
  },
  PiK: {
    role: "Pitrikaraka", roleName: "Father Significator", sanskritName: "पितृकारक",
    signification: "Significator for father and paternal themes.",
    lifeDomain: "Father, authority and lineage",
  },
  PK: {
    role: "Putrakaraka", roleName: "Child Significator", sanskritName: "पुत्रकारक",
    signification: "Significator for children and related themes.",
    lifeDomain: "Children, creativity and learning",
  },
  GK: {
    role: "Gnatikaraka", roleName: "Relatives / Obstacles Significator", sanskritName: "ज्ञातिकारक",
    signification: "Significator for relatives, conflicts and obstacles.",
    lifeDomain: "Extended kin, conflicts and obstacles",
  },
  DK: {
    role: "Darakaraka", roleName: "Spouse Significator", sanskritName: "दारकारक",
    signification: "Significator for spouse and partnership themes.",
    lifeDomain: "Spouse, partnership and close bonds",
  },
} as const;

const PARASHARI_7_ROLES = ["AK", "AmK", "BK", "MK", "PiK", "PK", "GK"] as const;
const JAIMINI_8_ROLES = ["AK", "AmK", "BK", "MK", "PiK", "PK", "GK", "DK"] as const;

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mars: "♂", Mercury: "☿", Jupiter: "♃",
  Venus: "♀", Saturn: "♄", Rahu: "☊",
};

function normalizeLongitude(longitude: number): number {
  return ((longitude % 360) + 360) % 360;
}

function formatDegree(degree: number): string {
  const totalSeconds = Math.round(degree * 3600);
  const degrees = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return \`\${degrees}°\${minutes.toString().padStart(2, "0")}'\${seconds.toString().padStart(2, "0")}\\\"\`;
}

function normalizePlanetName(name: string): string {
  const trimmed = name.trim();
  return trimmed === "NorthNode" || trimmed.toLowerCase() === "north node" || trimmed === "Rahu"
    ? "Rahu"
    : trimmed;
}

export class JaiminiKarakasEngine {
  /** Parashari seven-karaka convention: excludes Rahu and Dara Karaka. */
  public calculate7Karakas(planets: PlanetInput[], ascendantInput?: AscendantInput): JaiminiKarakasResult {
    return this.calculateScheme("Parashari-7", planets, ascendantInput);
  }

  /** Jaimini eight-karaka convention: includes Rahu at reverse degree and Dara Karaka. */
  public calculate8Karakas(planets: PlanetInput[], ascendantInput?: AscendantInput): JaiminiKarakasResult {
    return this.calculateScheme("Jaimini-8", planets, ascendantInput);
  }

  private calculateScheme(
    scheme: CharaKarakaScheme,
    planets: PlanetInput[],
    ascendantInput?: AscendantInput
  ): JaiminiKarakasResult {
    const includeRahu = scheme === "Jaimini-8";
    const requiredNames: readonly string[] = includeRahu ? VIMSHOTTARI_GRAHAS : CLASSICAL_GRAHAS;
    const roles: readonly (keyof typeof ROLE_DEFINITIONS)[] = includeRahu ? JAIMINI_8_ROLES : PARASHARI_7_ROLES;

    const candidates = planets
      .filter((planet) => requiredNames.includes(normalizePlanetName(planet.name)))
      .map((planet) => {
        const canonicalName = normalizePlanetName(planet.name);
        if (!Number.isFinite(planet.siderealLongitude)) {
          throw new Error(\`Invalid Chara Karaka longitude for \${planet.name}.\`);
        }
        if (!Number.isInteger(planet.house) || planet.house < 1 || planet.house > 12) {
          throw new Error(\`Invalid Chara Karaka house for \${planet.name}: expected an integer from 1 to 12.\`);
        }
        const longitude = normalizeLongitude(planet.siderealLongitude);
        const signIndex = Math.floor(longitude / 30);
        const degreeInSign = longitude - signIndex * 30;
        const effectiveDegree = canonicalName === "Rahu" && includeRahu
          ? 30 - degreeInSign
          : degreeInSign;
        return {
          name: canonicalName,
          longitude,
          degreeInSign,
          effectiveDegree,
          isReverseCounted: canonicalName === "Rahu" && includeRahu,
          sign: NavamsaCalculator.SIGN_NAMES[signIndex],
          house: planet.house,
        };
      });

    const counts = new Map<string, number>();
    candidates.forEach((candidate) => counts.set(candidate.name, (counts.get(candidate.name) ?? 0) + 1));
    const invalid = requiredNames.filter((name) => counts.get(name) !== 1);
    if (invalid.length || candidates.length !== requiredNames.length) {
      throw new Error(
        \`\${scheme} requires exactly one of each required graha. Missing/duplicate: \${invalid.join(", ") || "unexpected duplicate input"}.\`
      );
    }

    // A tie is not silently broken as an astrological judgement. Sorting by name
    // only stabilizes display order; the warning preserves the ambiguity.
    candidates.sort((a, b) =>
      b.effectiveDegree - a.effectiveDegree || a.name.localeCompare(b.name)
    );
    const warnings: string[] = [];
    for (let i = 1; i < candidates.length; i++) {
      if (Math.abs(candidates[i - 1].effectiveDegree - candidates[i].effectiveDegree) < 1e-9) {
        warnings.push(
          \`Exact Chara Karaka degree tie between \${candidates[i - 1].name} and \${candidates[i].name}; role ordering needs a declared tie rule.\`
        );
      }
    }

    const karakas: JaiminiKaraka[] = candidates.map((candidate, index) => {
      const roleShort = roles[index];
      const definition = ROLE_DEFINITIONS[roleShort];
      return {
        role: definition.role,
        roleShort,
        roleName: definition.roleName,
        sanskritName: definition.sanskritName,
        planet: candidate.name,
        symbol: PLANET_SYMBOLS[candidate.name] || "",
        rasiDegree: candidate.degreeInSign,
        rasiDegreeFormatted: formatDegree(candidate.degreeInSign),
        effectiveDegree: candidate.effectiveDegree,
        effectiveDegreeFormatted: formatDegree(candidate.effectiveDegree),
        isReverseCounted: candidate.isReverseCounted,
        sign: candidate.sign,
        house: candidate.house,
        signification: definition.signification,
        lifeDomain: definition.lifeDomain,
      };
    });

    const atmakaraka = karakas[0];
    const atmakarakaPlanet = candidates[0];
    const navamsaCalculator = new NavamsaCalculator();
    const karakamsaPosition = navamsaCalculator.calculateNavamsa(
      atmakarakaPlanet.longitude,
      atmakarakaPlanet.name
    );
    const karakamsaSignIndex = karakamsaPosition.signIndex;
    const ascendant = ascendantInput ?? planets.find(
      (planet) => planet.name === "Ascendant" || planet.name === "Lagna"
    );
    if (!ascendant || !Number.isFinite(ascendant.siderealLongitude)) {
      throw new Error("Karakamsa house calculation requires a valid Ascendant or Lagna longitude.");
    }
    const ascendantSignIndex = Math.floor(normalizeLongitude(ascendant.siderealLongitude) / 30);
    const karakamsaHouseFromLagna = ((karakamsaSignIndex - ascendantSignIndex + 12) % 12) + 1;
    const label = includeRahu ? "Jaimini 8-Karaka (Rahu reverse-counted)" : "Parashari 7-Karaka";

    return {
      scheme,
      label,
      includesRahu: includeRahu,
      atmakaraka,
      karakas,
      karakamsaSign: NavamsaCalculator.SIGN_NAMES[karakamsaSignIndex],
      karakamsaSignIndex,
      karakamsaHouseFromLagna,
      warnings,
      summary: \`\${label}: \${atmakaraka.planet} is Atmakaraka at \${atmakaraka.rasiDegreeFormatted} in \${atmakaraka.sign}. Its Navamsa sign is \${NavamsaCalculator.SIGN_NAMES[karakamsaSignIndex]} (Karakamsa).\`,
    };
  }
}
