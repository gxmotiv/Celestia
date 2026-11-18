/**
 * Jaimini Chara Karakas Engine
 * Current implementation: seven-karaka ordering by descending planetary
 * longitude within each sidereal sign, plus Karakamsa derived through the
 * shared Navamsa calculator. Eight-karaka/Rahu variants are not implemented.
 */

import { NavamsaCalculator } from "./d9NavamsaEngine";

export interface JaiminiKaraka {
  role: string;
  roleShort: "AK" | "AmK" | "BK" | "MK" | "PiK" | "PK" | "GK" | "DK";
  roleName: string;
  sanskritName: string;
  planet: string;
  symbol: string;
  rasiDegree: number; // 0 to 30
  rasiDegreeFormatted: string;
  sign: string;
  house: number;
  signification: string;
  lifeDomain: string;
}

export interface JaiminiKarakasResult {
  scheme: "7-Karaka";
  atmakaraka: JaiminiKaraka;
  karakas: JaiminiKaraka[];
  karakamsaSign: string;
  karakamsaSignIndex: number;
  karakamsaHouseFromLagna: number;
  summary: string;
}

const KARAKA_DEFINITIONS_7 = [
  {
    roleShort: "AK" as const,
    role: "Atmakaraka",
    roleName: "Soul Significator",
    sanskritName: "आत्मकारक",
    signification: "The supreme director of the incarnating soul, spiritual destiny, and life purpose.",
    lifeDomain: "Core self, dharma, enlightenment, major life transformation",
  },
  {
    roleShort: "AmK" as const,
    role: "Amatyakaraka",
    roleName: "Minister / Career Significator",
    sanskritName: "अमात्यकारक",
    signification: "The minister of the soul, professional authority, intellectual capacity, and social status.",
    lifeDomain: "Career, livelihood, public influence, intellectual achievements",
  },
  {
    roleShort: "BK" as const,
    role: "Bhratrikaraka",
    roleName: "Sibling & Guru Significator",
    sanskritName: "भ्रातृकारक",
    signification: "Siblings, companions, spiritual teachers (Gurus), courage, and noble advisors.",
    lifeDomain: "Spiritual guidance, siblings, inner courage, mentors",
  },
  {
    roleShort: "MK" as const,
    role: "Matrikaraka",
    roleName: "Mother & Foundation Significator",
    sanskritName: "मातृकारक",
    signification: "Mother, nurturing foundations, emotional peace, ancestral shelter, and lands.",
    lifeDomain: "Motherhood, domestic sanctuary, real estate, emotional security",
  },
  {
    roleShort: "PK" as const,
    role: "Putrakaraka",
    roleName: "Progeny & Wisdom Significator",
    sanskritName: "पुत्रकारक",
    signification: "Children, creative intelligence, speculative intuition, and purva punya (past-life merit).",
    lifeDomain: "Progeny, creativity, higher learning, artistic creation",
  },
  {
    roleShort: "GK" as const,
    role: "Gnatikaraka",
    roleName: "Kinsmen & Obstacles Significator",
    sanskritName: "ज्ञातिकारक",
    signification: "Rivals, disputes, debts, disease, collaterals, and karmic struggles that forge character.",
    lifeDomain: "Overcoming adversaries, legal battles, health discipline, competitors",
  },
  {
    roleShort: "DK" as const,
    role: "Darakaraka",
    roleName: "Spouse & Union Significator",
    sanskritName: "दाराकारक",
    signification: "Spouse, intimate partners, trade relationships, and deep interpersonal connections.",
    lifeDomain: "Marriage, life partner qualities, sacred unions, contracts",
  },
];

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mars: "♂", Mercury: "☿", Jupiter: "♃", Venus: "♀", Saturn: "♄", Rahu: "☊"
};

export class JaiminiKarakasEngine {
  public calculate7Karakas(
    planets: { name: string; siderealLongitude: number; house: number; rasiName: string }[],
    ascendantInput?: { siderealLongitude: number }
  ): JaiminiKarakasResult {
    const classicalNames = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
    const candidates = planets
      .filter((planet) => classicalNames.includes(planet.name))
      .map((planet) => {
        if (!Number.isFinite(planet.siderealLongitude) || !Number.isFinite(planet.house)) {
          throw new Error(`Invalid Jaimini input for ${planet.name}: longitude and house must be finite numbers.`);
        }
        if (!Number.isInteger(planet.house) || planet.house < 1 || planet.house > 12) {
          throw new Error("Invalid Jaimini house: expected an integer from 1 to 12.");
        }
        const normalizedLongitude = ((planet.siderealLongitude % 360) + 360) % 360;
        const signIndex = Math.floor(normalizedLongitude / 30);
        return {
          ...planet,
          siderealLongitude: normalizedLongitude,
          rasiName: NavamsaCalculator.SIGN_NAMES[signIndex],
          rasiDeg: normalizedLongitude % 30,
        };
      });

    const counts = new Map<string, number>();
    candidates.forEach((planet) => counts.set(planet.name, (counts.get(planet.name) ?? 0) + 1));
    const missing = classicalNames.filter((name) => counts.get(name) !== 1);
    if (missing.length > 0 || candidates.length !== 7) {
      throw new Error(`Jaimini 7-Karaka calculation requires exactly one of each classical graha. Invalid: ${missing.join(", ") || "duplicate or unexpected input"}.`);
    }

    // Chara Karaka order is determined by descending degrees within each sign.
    candidates.sort((a, b) => b.rasiDeg - a.rasiDeg);

    const karakas: JaiminiKaraka[] = candidates.map((candidate, index) => {
      const definition = KARAKA_DEFINITIONS_7[index];
      const totalSeconds = Math.round(candidate.rasiDeg * 3600);
      const degrees = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return {
        role: definition.role,
        roleShort: definition.roleShort,
        roleName: definition.roleName,
        sanskritName: definition.sanskritName,
        planet: candidate.name,
        symbol: PLANET_SYMBOLS[candidate.name] || "",
        rasiDegree: candidate.rasiDeg,
        rasiDegreeFormatted: `${degrees}°${minutes.toString().padStart(2, "0")}'${seconds.toString().padStart(2, "0")}\"`,
        sign: candidate.rasiName,
        house: candidate.house,
        signification: definition.signification,
        lifeDomain: definition.lifeDomain,
      };
    });

    const atmakaraka = karakas[0];
    const atmakarakaPlanet = candidates[0];
    const navamsaCalculator = new NavamsaCalculator();
    const karakamsaPosition = navamsaCalculator.calculateNavamsa(
      atmakarakaPlanet.siderealLongitude,
      atmakarakaPlanet.name
    );
    const karakamsaSignIdx = karakamsaPosition.signIndex;
    const rasiNames = NavamsaCalculator.SIGN_NAMES;
    const ascendant = ascendantInput ?? planets.find((planet) => planet.name === "Ascendant" || planet.name === "Lagna");
    if (!ascendant || !Number.isFinite(ascendant.siderealLongitude)) {
      throw new Error("Jaimini Karakamsa house calculation requires a valid Ascendant or Lagna longitude.");
    }
    const ascendantLongitude = ((ascendant.siderealLongitude % 360) + 360) % 360;
    const ascendantSignIndex = Math.floor(ascendantLongitude / 30);
    const karakamsaHouseFromLagna = ((karakamsaSignIdx - ascendantSignIndex + 12) % 12) + 1;

    return {
      scheme: "7-Karaka",
      atmakaraka,
      karakas,
      karakamsaSign: rasiNames[karakamsaSignIdx],
      karakamsaSignIndex: karakamsaSignIdx,
      karakamsaHouseFromLagna,
      summary: `Atmakaraka is ${atmakaraka.planet} at ${atmakaraka.rasiDegreeFormatted} in ${atmakaraka.sign} (House ${atmakaraka.house}). Its Navamsa sign is ${rasiNames[karakamsaSignIdx]} (Karakamsa).`,
    };
  }
}
