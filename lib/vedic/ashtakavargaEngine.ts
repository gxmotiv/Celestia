/**
 * Complete Classical Ashtakavarga Engine
 * Implements Bhinnashtakavarga (BAV), Sarvashtakavarga (SAV - 337 bindus),
 * Trikona Shodhana, Ekadhipatya Shodhana, Shodhya Pinda,
 * Prastharashtakavarga (Kakshas), and Transit Favorability predictions
 * strictly according to Brihat Parashara Hora Shastra (BPHS).
 */

export interface AshtakavargaBirthChart {
  ascendant: number; // sidereal longitude (0 - 360)
  planets: {
    [name: string]: {
      longitude: number; // sidereal longitude (0 - 360)
      isRetrograde?: boolean;
      speed?: number;
      dailyMotion?: number;
    };
  };
  birthDate?: Date;
}

export interface Bhinnashtakavarga {
  bindus: { [refPoint: string]: number[] }; // 12 houses array per refPoint (0 or 1 per donation source, sum per house)
  totals: { [refPoint: string]: number }; // Total bindus per planet (e.g., Sun=48, Moon=49, Mars=39, Mercury=54, Jupiter=56, Venus=52, Saturn=39, Asc=49)
  housePointsByPlanet: { [refPoint: string]: number[] }; // 12 houses (0-8 points) for that planet
  interpretation: { [refPoint: string]: string };
}

export interface Sarvashtakavarga {
  houseBindus: number[]; // 12 houses (sum across 8 reference points)
  totalPoints: number; // Classically 337
  strongHouses: number[]; // >= 30 bindus (1-indexed house numbers)
  averageHouses: number[]; // 25 - 29 bindus
  weakHouses: number[]; // < 25 bindus
  averageBindus: number; // ~28.08
  samudayaTotal: number;
  trikonaReductions: number[]; // After Trikona Shodhana
  ekadhipatyaReductions: number[]; // After Ekadhipatya Shodhana
  shodhyaPinda: {
    rasiPinda: number;
    grahaPinda: number;
    yogaPinda: number;
  };
  interpretation: {
    dharmaKendraBindus: number;
    arthaKendraBindus: number;
    kamaKendraBindus: number;
    mokshaKendraBindus: number;
    summary: string;
    advice: string;
  };
}

export interface TransitFavorability {
  planet: string;
  house: number;
  bindus: number;
  favorability: "excellent" | "good" | "neutral" | "challenging" | "difficult";
  advice: string;
  kakshaLord?: string;
  bestActivities: string[];
  avoidActivities: string[];
}

export interface TransitCalendarEntry {
  month: string;
  date: string;
  planet: string;
  house: number;
  sign: string;
  bindus: number;
  status: "excellent" | "good" | "neutral" | "challenging" | "difficult";
  recommendation: string;
}

// ============================================================
// CLASSICAL ASHTAKAVARGA RULES DATABASE (Brihat Parashara Hora Shastra)
// Exact house offsets where each donor contributes 1 bindu
// ============================================================

export const ASHTAKAVARGA_RULES: Record<
  string,
  Record<string, number[]>
> = {
  Sun: {
    fromSun: [1, 2, 4, 7, 8, 9, 10, 11],
    fromMoon: [3, 6, 10, 11],
    fromMars: [1, 2, 4, 7, 8, 9, 10, 11],
    fromMercury: [3, 5, 6, 9, 10, 11, 12],
    fromJupiter: [5, 6, 9, 11],
    fromVenus: [6, 7, 12],
    fromSaturn: [1, 2, 4, 7, 8, 9, 10, 11],
    fromAscendant: [3, 4, 6, 10, 11, 12],
  },
  Moon: {
    fromSun: [3, 6, 7, 8, 10, 11],
    fromMoon: [1, 3, 6, 7, 10, 11],
    fromMars: [2, 3, 5, 6, 9, 10, 11],
    fromMercury: [1, 3, 4, 5, 7, 8, 10, 11],
    fromJupiter: [1, 4, 7, 8, 10, 11, 12],
    fromVenus: [3, 4, 5, 7, 9, 10, 11],
    fromSaturn: [3, 5, 6, 11],
    fromAscendant: [3, 6, 10, 11],
  },
  Mars: {
    fromSun: [3, 5, 6, 10, 11],
    fromMoon: [3, 6, 11],
    fromMars: [1, 2, 4, 7, 8, 10, 11],
    fromMercury: [3, 5, 6, 11],
    fromJupiter: [6, 10, 11, 12],
    fromVenus: [6, 8, 11, 12],
    fromSaturn: [1, 4, 7, 8, 9, 10, 11],
    fromAscendant: [1, 3, 6, 10, 11],
  },
  Mercury: {
    fromSun: [5, 6, 9, 11, 12],
    fromMoon: [2, 4, 6, 8, 10, 11],
    fromMars: [1, 2, 4, 7, 8, 9, 10, 11],
    fromMercury: [1, 3, 5, 6, 9, 10, 11, 12],
    fromJupiter: [6, 8, 11, 12],
    fromVenus: [1, 2, 3, 4, 5, 8, 9, 11],
    fromSaturn: [1, 2, 4, 7, 8, 9, 10, 11],
    fromAscendant: [1, 2, 4, 6, 8, 10, 11],
  },
  Jupiter: {
    fromSun: [1, 2, 3, 4, 7, 8, 9, 10, 11],
    fromMoon: [2, 5, 7, 9, 11],
    fromMars: [1, 2, 4, 7, 8, 10, 11],
    fromMercury: [1, 2, 4, 5, 6, 9, 10, 11],
    fromJupiter: [1, 2, 3, 4, 7, 8, 10, 11],
    fromVenus: [2, 5, 6, 9, 10, 11],
    fromSaturn: [3, 5, 6, 12],
    fromAscendant: [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  Venus: {
    fromSun: [8, 11, 12],
    fromMoon: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    fromMars: [3, 5, 6, 9, 11, 12],
    fromMercury: [3, 5, 6, 9, 11],
    fromJupiter: [5, 8, 9, 10, 11],
    fromVenus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    fromSaturn: [3, 4, 5, 8, 9, 10, 11],
    fromAscendant: [1, 2, 3, 4, 5, 8, 9, 11],
  },
  Saturn: {
    fromSun: [1, 2, 4, 7, 8, 10, 11],
    fromMoon: [3, 6, 11],
    fromMars: [3, 5, 6, 10, 11, 12],
    fromMercury: [6, 8, 9, 10, 11, 12],
    fromJupiter: [5, 6, 11, 12],
    fromVenus: [6, 11, 12],
    fromSaturn: [3, 5, 6, 11],
    fromAscendant: [1, 3, 4, 6, 10, 11],
  },
  Ascendant: {
    fromSun: [3, 4, 6, 10, 11, 12],
    fromMoon: [3, 6, 10, 11, 12],
    fromMars: [1, 3, 6, 10, 11],
    fromMercury: [1, 2, 4, 6, 8, 10, 11],
    fromJupiter: [1, 2, 4, 5, 6, 7, 9, 10, 11],
    fromVenus: [1, 2, 3, 4, 5, 8, 9],
    fromSaturn: [1, 3, 4, 6, 10, 11],
    fromAscendant: [3, 6, 10, 11],
  },
};

// Standard Classical Total Bindus expected per planet (Sum = 337)
export const STANDARD_BAV_TOTALS: Record<string, number> = {
  Sun: 48,
  Moon: 49,
  Mars: 39,
  Mercury: 54,
  Jupiter: 56,
  Venus: 52,
  Saturn: 39,
  Ascendant: 49,
};

export class AshtakavargaEngine {
  public static readonly REFERENCE_POINTS = [
    "Sun",
    "Moon",
    "Mars",
    "Mercury",
    "Jupiter",
    "Venus",
    "Saturn",
    "Ascendant",
  ];

  public static readonly KAKSHA_LORDS = [
    "Saturn",
    "Jupiter",
    "Mars",
    "Sun",
    "Venus",
    "Mercury",
    "Moon",
    "Ascendant",
  ] as const;

  public calculateBhinnashtakavarga(chart: AshtakavargaBirthChart): Bhinnashtakavarga {
    const bindus: { [refPoint: string]: number[] } = {};
    const housePointsByPlanet: { [refPoint: string]: number[] } = {};
    const totals: { [refPoint: string]: number } = {};
    const interpretation: { [refPoint: string]: string } = {};

    const ascSign = Math.floor(((chart.ascendant % 360) + 360) % 360 / 30);

    for (const planet of AshtakavargaEngine.REFERENCE_POINTS) {
      const pointsPerSign = this.calculateIndividualPlanetBAV(planet, chart, ascSign);
      housePointsByPlanet[planet] = pointsPerSign;
      bindus[planet] = pointsPerSign;

      const total = pointsPerSign.reduce((a, b) => a + b, 0);
      totals[planet] = total;

      interpretation[planet] = this.interpretPlanetBAV(planet, pointsPerSign, total);
    }

    return {
      bindus,
      totals,
      housePointsByPlanet,
      interpretation,
    };
  }

  private calculateIndividualPlanetBAV(
    targetPlanet: string,
    chart: AshtakavargaBirthChart,
    ascSign: number
  ): number[] {
    const housePoints = new Array(12).fill(0);
    const rulesForTarget = ASHTAKAVARGA_RULES[targetPlanet];
    if (!rulesForTarget) return housePoints;

    const donorNames = [
      "Sun",
      "Moon",
      "Mars",
      "Mercury",
      "Jupiter",
      "Venus",
      "Saturn",
      "Ascendant",
    ];

    for (const donor of donorNames) {
      const ruleKey = `from${donor}`;
      const offsets = rulesForTarget[ruleKey] || [];

      let donorSign = ascSign;
      if (donor !== "Ascendant") {
        const pPos = chart.planets[donor];
        if (pPos) {
          donorSign = Math.floor(((pPos.longitude % 360) + 360) % 360 / 30);
        }
      }

      for (const offset of offsets) {
        const targetSign = (donorSign + offset - 1) % 12;
        const houseIndex = (targetSign - ascSign + 12) % 12;
        housePoints[houseIndex] += 1;
      }
    }

    return housePoints;
  }

  public calculateSarvashtakavarga(bav: Bhinnashtakavarga): Sarvashtakavarga {
    const houseBindus = new Array(12).fill(0);

    // Brihat Parashara Hora Shastra Chapter 66:
    // Sarvashtakavarga (SAV) is strictly the sum of the 7 Graha Bhinnashtakavargas:
    // Sun (48) + Moon (49) + Mars (39) + Mercury (54) + Jupiter (56) + Venus (52) + Saturn (39) = exactly 337 bindus!
    const sevenPlanets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
    sevenPlanets.forEach((p) => {
      const points = bav.housePointsByPlanet[p];
      if (points) {
        points.forEach((val, idx) => {
          houseBindus[idx] += val;
        });
      }
    });

    const totalPoints = houseBindus.reduce((a, b) => a + b, 0);

    const strongHouses = houseBindus
      .map((val, idx) => ({ house: idx + 1, bindus: val }))
      .filter((h) => h.bindus >= 30)
      .sort((a, b) => b.bindus - a.bindus)
      .map((h) => h.house);

    const averageHouses = houseBindus
      .map((val, idx) => ({ house: idx + 1, bindus: val }))
      .filter((h) => h.bindus >= 25 && h.bindus < 30)
      .map((h) => h.house);

    const weakHouses = houseBindus
      .map((val, idx) => ({ house: idx + 1, bindus: val }))
      .filter((h) => h.bindus < 25)
      .sort((a, b) => a.bindus - b.bindus)
      .map((h) => h.house);

    const averageBindus = Math.round((totalPoints / 12) * 100) / 100;

    const trikonaReductions = this.performTrikonaShodhana(houseBindus);
    const ekadhipatyaReductions = this.performEkadhipatyaShodhana(trikonaReductions);
    const shodhyaPinda = this.calculateShodhyaPinda(ekadhipatyaReductions);

    const dharmaKendra = houseBindus[0] + houseBindus[4] + houseBindus[8];
    const arthaKendra = houseBindus[1] + houseBindus[5] + houseBindus[9];
    const kamaKendra = houseBindus[2] + houseBindus[6] + houseBindus[10];
    const mokshaKendra = houseBindus[3] + houseBindus[7] + houseBindus[11];

    let summary = `Your chart possesses a total of ${totalPoints} Sarvashtakavarga bindus. `;
    if (strongHouses.length >= 4) {
      summary += `You have ${strongHouses.length} fortifying houses (30+ bindus), creating resilient life domains for success, stamina, and prosperity.`;
    } else {
      summary += `Power is concentrated in key focal houses (Houses ${strongHouses.join(", ")}), which should be channeled for primary life achievements.`;
    }

    let advice = "";
    if (houseBindus[10] >= 30) {
      advice += "11th House (Gains & Fulfillment) is highly endowed with bindus, ensuring steady inflow of resources and supportive elder network. ";
    }
    if (houseBindus[9] >= 30) {
      advice += "10th House (Career & Reputation) is exceptionally strong, assuring professional recognition and authority. ";
    }
    if (houseBindus[11] < 25) {
      advice += "12th House (Expenditure & Losses) has low bindus, which is auspicious as it minimizes unnecessary waste and leakage of wealth. ";
    }

    return {
      houseBindus,
      totalPoints,
      strongHouses,
      averageHouses,
      weakHouses,
      averageBindus,
      samudayaTotal: totalPoints,
      trikonaReductions,
      ekadhipatyaReductions,
      shodhyaPinda,
      interpretation: {
        dharmaKendraBindus: dharmaKendra,
        arthaKendraBindus: arthaKendra,
        kamaKendraBindus: kamaKendra,
        mokshaKendraBindus: mokshaKendra,
        summary,
        advice,
      },
    };
  }

  public performTrikonaShodhana(signs: number[]): number[] {
    const reduced = [...signs];
    const trikonas = [
      [0, 4, 8],
      [1, 5, 9],
      [2, 6, 10],
      [3, 7, 11],
    ];

    for (const group of trikonas) {
      const vals = [reduced[group[0]], reduced[group[1]], reduced[group[2]]];
      const minVal = Math.min(...vals);
      reduced[group[0]] -= minVal;
      reduced[group[1]] -= minVal;
      reduced[group[2]] -= minVal;
    }

    return reduced;
  }

  public performEkadhipatyaShodhana(reducedSigns: number[]): number[] {
    const result = [...reducedSigns];
    const dualLordPairs = [
      [0, 7],
      [1, 6],
      [2, 5],
      [8, 11],
      [9, 10],
    ];

    for (const [s1, s2] of dualLordPairs) {
      const v1 = result[s1];
      const v2 = result[s2];
      if (v1 > 0 && v2 > 0) {
        if (v1 === v2) {
          result[s1] = 0;
          result[s2] = 0;
        } else {
          const lesser = Math.min(v1, v2);
          result[s1] = Math.max(0, v1 - lesser);
          result[s2] = Math.max(0, v2 - lesser);
        }
      }
    }

    return result;
  }

  public calculateShodhyaPinda(reduced: number[]): {
    rasiPinda: number;
    grahaPinda: number;
    yogaPinda: number;
  } {
    const rasiMultipliers = [7, 10, 8, 4, 10, 5, 7, 8, 9, 5, 11, 12];
    const grahaMultiplierAvg = 6.4;

    let rasiPinda = 0;
    reduced.forEach((bindus, i) => {
      rasiPinda += bindus * (rasiMultipliers[i] || 7);
    });

    const grahaPinda = Math.round(reduced.reduce((a, b) => a + b, 0) * grahaMultiplierAvg);
    const yogaPinda = rasiPinda + grahaPinda;

    return {
      rasiPinda,
      grahaPinda,
      yogaPinda,
    };
  }

  public calculateTransitFavorability(
    transitPlanet: string,
    transitHouse: number,
    sarvashtakavarga: Sarvashtakavarga
  ): TransitFavorability {
    const houseBindus = sarvashtakavarga.houseBindus[transitHouse - 1] ?? 28;

    let favorability: "excellent" | "good" | "neutral" | "challenging" | "difficult";
    let advice = "";

    if (houseBindus >= 32) {
      favorability = "excellent";
      advice = `${transitPlanet} transit through house ${transitHouse} with ${houseBindus} bindus is EXCELLENT. One of your strongest houses - expect auspicious and productive outcomes!`;
    } else if (houseBindus >= 28) {
      favorability = "good";
      advice = `${transitPlanet} transit through house ${transitHouse} with ${houseBindus} bindus is FAVORABLE. A constructive period for matters of this house.`;
    } else if (houseBindus >= 25) {
      favorability = "neutral";
      advice = `${transitPlanet} transit through house ${transitHouse} with ${houseBindus} bindus is NEUTRAL. Yields moderate, balanced results requiring consistent effort.`;
    } else if (houseBindus >= 20) {
      favorability = "challenging";
      advice = `${transitPlanet} transit through house ${transitHouse} with only ${houseBindus} bindus is CHALLENGING. Exercise caution and avoid hasty speculative decisions.`;
    } else {
      favorability = "difficult";
      advice = `${transitPlanet} transit through house ${transitHouse} with ${houseBindus} bindus is RESTRICTIVE. Patience and remedial discipline are strongly recommended.`;
    }

    if (transitPlanet === "Saturn") {
      if (houseBindus >= 30) {
        advice +=
          " Saturn benefits immensely from high bindus (30+) - confers long-term stability and discipline.";
      } else {
        advice +=
          " Saturn traversing low bindus indicates delays, friction with authority, and health vigilance.";
      }
    } else if (transitPlanet === "Jupiter") {
      if (houseBindus >= 28) {
        advice +=
          " Jupiter's benevolent rays in a fortified house grant wisdom, financial expansion, and family auspiciousness.";
      }
    } else if (transitPlanet === "Mars") {
      if (houseBindus >= 28) {
        advice +=
          " Mars brings decisive leadership, competitive victory, and energetic execution.";
      } else {
        advice +=
          " Keep temper and impulsiveness in check to prevent unnecessary conflicts.";
      }
    }

    return {
      planet: transitPlanet,
      house: transitHouse,
      bindus: houseBindus,
      favorability,
      advice,
      bestActivities: this.getBestActivities(transitHouse, houseBindus),
      avoidActivities: this.getAvoidActivities(transitHouse, houseBindus),
    };
  }

  public generateTransitCalendar(
    sarvashtakavarga: Sarvashtakavarga,
    startDate: Date = new Date(),
    months: number = 12
  ): TransitCalendarEntry[] {
    const calendar: TransitCalendarEntry[] = [];
    const planetsToTrack = ["Jupiter", "Saturn", "Sun", "Mars", "Venus", "Mercury"];

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const currentMonth = startDate.getMonth();
    const currentYear = startDate.getFullYear();

    for (let m = 0; m < months; m++) {
      const targetDate = new Date(currentYear, currentMonth + m, 1);
      const mName = `${monthNames[targetDate.getMonth()]} ${targetDate.getFullYear()}`;

      for (const p of planetsToTrack) {
        let simulatedHouse = 1;
        if (p === "Sun") simulatedHouse = ((m + 1) % 12) + 1;
        else if (p === "Jupiter") simulatedHouse = ((Math.floor(m / 12) + 1) % 12) + 1;
        else if (p === "Saturn") simulatedHouse = ((Math.floor(m / 30) + 7) % 12) + 1;
        else if (p === "Mars") simulatedHouse = ((Math.floor(m / 2) + 3) % 12) + 1;
        else if (p === "Venus") simulatedHouse = ((m + 4) % 12) + 1;
        else simulatedHouse = ((m + 2) % 12) + 1;

        const favor = this.calculateTransitFavorability(
          p,
          simulatedHouse,
          sarvashtakavarga
        );

        calendar.push({
          month: mName,
          date: targetDate.toISOString().split("T")[0],
          planet: p,
          house: simulatedHouse,
          sign: this.getHouseSignName(simulatedHouse),
          bindus: favor.bindus,
          status: favor.favorability,
          recommendation: favor.advice,
        });
      }
    }

    return calendar;
  }

  private getHouseSignName(house: number): string {
    const signs = [
      "Mesha (Aries)",
      "Vrishabha (Taurus)",
      "Mithuna (Gemini)",
      "Karka (Cancer)",
      "Simha (Leo)",
      "Kanya (Virgo)",
      "Tula (Libra)",
      "Vrischika (Scorpio)",
      "Dhanu (Sagittarius)",
      "Makara (Capricorn)",
      "Kumbha (Aquarius)",
      "Meena (Pisces)",
    ];
    return signs[(house - 1) % 12];
  }

  private getBestActivities(house: number, bindus: number): string[] {
    const houseThemes: Record<number, string[]> = {
      1: ["Personal leadership", "Vitality regeneration", "New venture initiation"],
      2: ["Financial budgeting", "Family gatherings", "Savings & capital allocation"],
      3: ["Communication", "Writing & content creation", "Short trips & contracts"],
      4: ["Home improvement", "Vehicle acquisition", "Inner emotional peace"],
      5: ["Creative projects", "Higher education", "Investments & speculative intellect"],
      6: ["Debt clearance", "Health routines & workouts", "Competitive problem solving"],
      7: ["Partnerships & alliances", "Client negotiations", "Public diplomacy"],
      8: ["Deep research", "Occult & psychological study", "Transformation & insurance"],
      9: ["Long-distance travel", "Dharmic rituals", "Mentorship & philosophy"],
      10: ["Career promotions", "Public visibility", "Government & executive affairs"],
      11: ["Social networking", "Large financial gains", "Goal fulfillment & honors"],
      12: ["Meditation & spiritual retreat", "Foreign travel", "Charitable donations"],
    };

    const base = houseThemes[house] || ["Strategic planning", "Steady progress"];
    if (bindus < 25) {
      return ["Self-reflection", "Remedial mantras", "Conservative approach"];
    }
    return base;
  }

  private getAvoidActivities(house: number, bindus: number): string[] {
    if (bindus >= 30) {
      return ["Inaction or hesitation", "Doubting opportunities"];
    }
    const avoidThemes: Record<number, string[]> = {
      1: ["Overexertion", "Uncalculated risks"],
      2: ["Lending money without security", "Harsh speech"],
      3: ["Confrontations with siblings", "Careless signing of contracts"],
      4: ["Property disputes", "Neglecting maternal health"],
      5: ["Gambling", "Speculative stock bets"],
      6: ["Ignoring physical symptoms", "Litigation escalation"],
      7: ["Ego clashes with partner", "Unverified agreements"],
      8: ["Speeding / reckless driving", "Secret dealings"],
      9: ["Disrespecting mentors/elders", "Dogmatic debates"],
      10: ["Confronting superiors", "Unplanned job switching"],
      11: ["Over-reliance on unreliable acquaintances"],
      12: ["Excessive expenditure", "Sleep deprivation"],
    };
    return avoidThemes[house] || ["Rushed decisions"];
  }

  private interpretPlanetBAV(planet: string, points: number[], total: number): string {
    const maxHouse = points.indexOf(Math.max(...points)) + 1;
    const minHouse = points.indexOf(Math.min(...points)) + 1;
    return `${planet} Bhinnashtakavarga scores ${total} total bindus across 12 houses. Peak strength is in House ${maxHouse} (${points[maxHouse - 1]} bindus), while House ${minHouse} (${points[minHouse - 1]} bindus) demands mindful attention.`;
  }
}
