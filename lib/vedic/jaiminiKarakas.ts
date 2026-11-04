/**
 * Jaimini Chara Karakas Engine
 * Implements classical Jaimini Upadesha Sutras and Maharishi Parashara doctrines.
 * Computes both 7-Karaka and 8-Karaka schemes based on the decreasing order
 * of sidereal longitudes within their respective rasis (0° to 30°).
 */

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
  scheme: "7-Karaka" | "8-Karaka";
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
    planets: { name: string; siderealLongitude: number; house: number; rasiName: string }[]
  ): JaiminiKarakasResult {
    // 7 classical Grahas only: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn
    const classicalNames = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
    const candidates = planets
      .filter((p) => classicalNames.includes(p.name))
      .map((p) => {
        const rasiDeg = p.siderealLongitude % 30;
        return {
          ...p,
          rasiDeg,
        };
      });

    // Sort by descending degree within sign
    candidates.sort((a, b) => b.rasiDeg - a.rasiDeg);

    const karakas: JaiminiKaraka[] = candidates.map((c, idx) => {
      const def = KARAKA_DEFINITIONS_7[idx];
      const deg = Math.floor(c.rasiDeg);
      const min = Math.floor((c.rasiDeg % 1) * 60);
      const sec = Math.floor(((c.rasiDeg * 60) % 1) * 60);

      return {
        role: def.role,
        roleShort: def.roleShort,
        roleName: def.roleName,
        sanskritName: def.sanskritName,
        planet: c.name,
        symbol: PLANET_SYMBOLS[c.name] || "",
        rasiDegree: c.rasiDeg,
        rasiDegreeFormatted: `${deg}°${min.toString().padStart(2, "0")}'${sec.toString().padStart(2, "0")}"`,
        sign: c.rasiName,
        house: c.house,
        signification: def.signification,
        lifeDomain: def.lifeDomain,
      };
    });

    const ak = karakas[0];
    const akPlanet = candidates[0];

    // Karakamsa is the sign occupied by Atmakaraka in the D9 Navamsha chart
    // Approximate Navamsha sign of AK from its sidereal longitude
    const totalNavamsaUnits = Math.floor(akPlanet.siderealLongitude / (30 / 9));
    const karakamsaSignIdx = totalNavamsaUnits % 12;
    const rasiNames = [
      "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
      "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ];
    const karakamsaSign = rasiNames[karakamsaSignIdx];

    return {
      scheme: "7-Karaka",
      atmakaraka: ak,
      karakas,
      karakamsaSign,
      karakamsaSignIndex: karakamsaSignIdx,
      karakamsaHouseFromLagna: ((karakamsaSignIdx - Math.floor(planets.find(p => p.name === "Ascendant" || p.name === "Lagna")?.siderealLongitude || 0) / 30 + 12) % 12) + 1,
      summary: `Atmakaraka is ${ak.planet} at ${ak.rasiDegreeFormatted} in ${ak.sign} (House ${ak.house}). It signifies the soul's primary spiritual curriculum in this lifetime.`,
    };
  }
}
