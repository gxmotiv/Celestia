/**
 * Classical Gochar & Vedha (Transit Obstruction) Engine
 * Implements classical rules from Phaladeepika, Brihat Samhita, and Jataka Parijata.
 * Evaluates whether a transiting planet's auspicious house transit from natal Moon
 * is unhindered (Shuddha) or blocked by another planet occupying its paired Vedha house,
 * respecting the classical Father-Son exemption (Sun-Saturn) and Mother-Son exemption (Moon-Mercury).
 */

export interface PlanetTransitEvaluation {
  planet: string;
  symbol: string;
  transitHouseFromMoon: number;
  isNaturallyBeneficTransit: boolean;
  beneficMeaning: string;
  hasVedhaObstruction: boolean;
  obstructingPlanet?: string;
  obstructingHouse?: number;
  isExemptedByClassicalRule: boolean;
  exemptionReason?: string;
  effectiveTransitStatus: "Unobstructed Favorable" | "Blocked by Vedha" | "Adverse Transit" | "Neutral";
}

export interface GocharVedhaReport {
  natalMoonSign: string;
  evaluations: PlanetTransitEvaluation[];
  summary: string;
}

// Classical Benefic Houses & their paired Vedha houses
// [beneficHouse]: vedhaHouse
const SUN_RULES: Record<number, number> = { 3: 9, 6: 12, 10: 4, 11: 5 };
const MOON_RULES: Record<number, number> = { 1: 5, 3: 9, 6: 12, 7: 2, 10: 4, 11: 8 };
const MARS_RULES: Record<number, number> = { 3: 12, 6: 9, 11: 5 };
const MERCURY_RULES: Record<number, number> = { 2: 5, 4: 3, 6: 9, 8: 1, 10: 8, 11: 12 };
const JUPITER_RULES: Record<number, number> = { 2: 12, 5: 4, 7: 3, 9: 10, 11: 8 };
const VENUS_RULES: Record<number, number> = { 1: 8, 2: 7, 3: 1, 4: 10, 5: 9, 8: 5, 9: 11, 11: 6, 12: 3 };
const SATURN_RULES: Record<number, number> = { 3: 12, 6: 9, 11: 5 };

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mars: "♂", Mercury: "☿", Jupiter: "♃", Venus: "♀", Saturn: "♄", Rahu: "☊", Ketu: "☋"
};

const BENEFIC_DESCRIPTIONS: Record<string, Record<number, string>> = {
  Sun: {
    3: "Honor, courage, and victory over adversaries",
    6: "Removal of debts, diseases, and winning legal matters",
    10: "Promotion, royal favor, and career authority",
    11: "Financial influx, prestige, and realization of desires",
  },
  Moon: {
    1: "Physical vitality and sweet nourishment",
    3: "Gains through siblings and courageous travel",
    6: "Relief from distress and bodily healing",
    7: "Marital delight and public charm",
    10: "Professional acclaim and public admiration",
    11: "Prosperity, joyful gatherings, and happiness",
  },
  Mars: {
    3: "Supreme vigor, fearlessness, and enterprise",
    6: "Crushing obstacles and sudden triumph",
    11: "Substantial material acquisitions and gains",
  },
  Mercury: {
    2: "Financial wealth through speech and commerce",
    4: "Domestic happiness and mental peace",
    6: "Intellectual supremacy over competitors",
    8: "Gifts, unexpected windfalls, and legacy",
    10: "Business elevation and scholarly acclaim",
    11: "Abundant earnings and social respect",
  },
  Jupiter: {
    2: "Wealth creation, family auspiciousness, and speech",
    5: "Blessings of progeny, wisdom, and auspicious intuition",
    7: "Marital joy, noble unions, and prosperous alliances",
    9: "Spiritual grace, fortunate voyages, and father's blessings",
    11: "Supreme wealth, honor, and realization of grand life goals",
  },
  Venus: {
    1: "Sensory delight, elegance, and bodily vitality",
    2: "Financial sweetness and artistic acquisitions",
    3: "Artistic success and romantic happiness",
    4: "Vehicle purchases and domestic luxury",
    5: "Creative joy and romantic fulfillment",
    8: "Sensual pleasures and unexpected financial gifts",
    9: "Virtuous deeds and harmonious fortune",
    11: "Affluence, luxury vehicles, and elite friendships",
    12: "Joyful expenditures and luxurious comfort",
  },
  Saturn: {
    3: "Tenacity, fortitude, and conquest over hardships",
    6: "Dismantling of enduring enmities and enduring victory",
    11: "Accumulation of durable wealth, land, and stability",
  },
};

export class GocharVedhaEngine {
  public evaluateAllTransits(
    natalMoonRasiIndex: number,
    transits: { planet: string; rasiIndex: number }[]
  ): GocharVedhaReport {
    // Map of houses from natal Moon occupied by each transiting planet
    const houseOccupants: Record<number, string[]> = {};
    const planetHouseMap: Record<string, number> = {};

    transits.forEach((t) => {
      // 1 to 12 from natal Moon
      const h = ((t.rasiIndex - natalMoonRasiIndex + 12) % 12) + 1;
      planetHouseMap[t.planet] = h;
      if (!houseOccupants[h]) houseOccupants[h] = [];
      houseOccupants[h].push(t.planet);
    });

    const evaluations: PlanetTransitEvaluation[] = [];

    const classicalPlanets = [
      { name: "Sun", rules: SUN_RULES },
      { name: "Moon", rules: MOON_RULES },
      { name: "Mars", rules: MARS_RULES },
      { name: "Mercury", rules: MERCURY_RULES },
      { name: "Jupiter", rules: JUPITER_RULES },
      { name: "Venus", rules: VENUS_RULES },
      { name: "Saturn", rules: SATURN_RULES },
    ];

    classicalPlanets.forEach(({ name, rules }) => {
      const h = planetHouseMap[name] || 1;
      const isBeneficHouse = Boolean(rules[h]);
      const meaning = BENEFIC_DESCRIPTIONS[name]?.[h] || "General transit cycle";

      if (!isBeneficHouse) {
        evaluations.push({
          planet: name,
          symbol: PLANET_SYMBOLS[name] || "",
          transitHouseFromMoon: h,
          isNaturallyBeneficTransit: false,
          beneficMeaning: meaning,
          hasVedhaObstruction: false,
          isExemptedByClassicalRule: false,
          effectiveTransitStatus: "Adverse Transit",
        });
        return;
      }

      // It is a benefic transit house! Check if its paired Vedha house is occupied
      const pairedVedhaHouse = rules[h];
      const occupantsInVedha = houseOccupants[pairedVedhaHouse] || [];

      // Filter out self if somehow in that house (cannot be)
      let obstructingPlanet = occupantsInVedha.find((p) => p !== name);
      let isExempted = false;
      let exemptionReason: string | undefined = undefined;

      if (obstructingPlanet) {
        // Check Father-Son exemption (Sun vs Saturn)
        if ((name === "Sun" && obstructingPlanet === "Saturn") || (name === "Saturn" && obstructingPlanet === "Sun")) {
          isExempted = true;
          exemptionReason = "Father & Son classical exemption: Sun and Saturn never cause Vedha to each other.";
          obstructingPlanet = undefined;
        }
        // Check Mother-Son exemption (Moon vs Mercury)
        else if ((name === "Moon" && obstructingPlanet === "Mercury") || (name === "Mercury" && obstructingPlanet === "Moon")) {
          isExempted = true;
          exemptionReason = "Mother & Son classical exemption: Moon and Mercury never cause Vedha to each other.";
          obstructingPlanet = undefined;
        }
      }

      const hasObstruction = Boolean(obstructingPlanet);

      evaluations.push({
        planet: name,
        symbol: PLANET_SYMBOLS[name] || "",
        transitHouseFromMoon: h,
        isNaturallyBeneficTransit: true,
        beneficMeaning: meaning,
        hasVedhaObstruction: hasObstruction,
        obstructingPlanet,
        obstructingHouse: hasObstruction ? pairedVedhaHouse : undefined,
        isExemptedByClassicalRule: isExempted,
        exemptionReason,
        effectiveTransitStatus: hasObstruction ? "Blocked by Vedha" : "Unobstructed Favorable",
      });
    });

    const favorableCount = evaluations.filter((e) => e.effectiveTransitStatus === "Unobstructed Favorable").length;
    const blockedCount = evaluations.filter((e) => e.effectiveTransitStatus === "Blocked by Vedha").length;

    const rasiNames = [
      "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
      "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
    ];

    return {
      natalMoonSign: rasiNames[natalMoonRasiIndex] || "Moon Sign",
      evaluations,
      summary: `${favorableCount} planet(s) enjoy pure unobstructed (Shuddha) favorable transits. ${blockedCount} favorable transit(s) are obstructed by classical Vedha.`,
    };
  }
}
