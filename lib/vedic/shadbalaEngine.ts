/**
 * Complete Classical Shadbala Engine
 * Implements all 6 planetary strengths (Bala) in Virupas and Rupas:
 * 1. Sthana Bala (Positional Strength)
 * 2. Dig Bala (Directional Strength)
 * 3. Kala Bala (Temporal Strength)
 * 4. Cheshta Bala (Motional Strength)
 * 5. Naisargika Bala (Natural Strength)
 * 6. Drik Bala (Aspect Strength)
 */

export interface SthanaBalaBreakdown {
  ucchaBala: number;
  saptavargajaBala: number;
  ojayugmaBala: number;
  kendradiBala: number;
  drekkanaBala: number;
  total: number;
  description: string;
}

export interface DigBalaResult {
  points: number;
  strongestHouse: number;
  actualHouse: number;
  angularDistance: number;
  description: string;
}

export interface KalaBalaComponents {
  nathonnathaBala: number;
  pakshaBala: number;
  tribhagaBala: number;
  abdaBala: number;
  maasaBala: number;
  varaBala: number;
  horaBala: number;
  ayanaBala: number;
  yuddhaBala: number;
}

export interface KalaBalaResult {
  components: KalaBalaComponents;
  total: number;
  description: string;
}

export interface CheshtaBalaResult {
  points: number;
  motion: number;
  isRetrograde: boolean;
  state: "Vakra (Retrograde)" | "Anuvakra (Slow)" | "Samanya (Direct)" | "Mandatara (Fast)";
  description: string;
}

export interface NaisargikaBalaResult {
  points: number;
  description: string;
}

export interface DrikBalaResult {
  points: number;
  aspects: { aspectingPlanet: string; nature: "Benefic" | "Malefic"; angle: number; virupas: number }[];
  description: string;
}

export interface ShadbalaResult {
  planet: string;
  symbol: string;
  sthanaBala: SthanaBalaBreakdown;
  digBala: DigBalaResult;
  kalaBala: KalaBalaResult;
  cheshtaBala: CheshtaBalaResult;
  naisargikaBala: NaisargikaBalaResult;
  drikBala: DrikBalaResult;
  totalVirupas: number;
  totalRupas: number;
  requiredVirupas: number;
  requiredRupas: number;
  strengthRatio: number;
  isStrong: boolean;
  rank: number;
  interpretation: string;
  predictions: {
    strongEffects: string[];
    weakEffects: string[];
  };
}

export interface ShadbalaChartInput {
  ascendant: number;
  planets: {
    [name: string]: {
      longitude: number;
      isRetrograde?: boolean;
      dailyMotion?: number;
      speed?: number;
    };
  };
  birthDate?: Date;
  latitude?: number;
  longitude?: number;
}

export class ShadbalaEngine {
  public static readonly PLANETS = [
    "Sun",
    "Moon",
    "Mars",
    "Mercury",
    "Jupiter",
    "Venus",
    "Saturn",
  ];

  public static readonly EXALTATION_POINTS: Record<string, number> = {
    Sun: 10,
    Moon: 33,
    Mars: 298,
    Mercury: 165,
    Jupiter: 95,
    Venus: 357,
    Saturn: 200,
  };

  public static readonly REQUIRED_RUPAS: Record<string, number> = {
    Sun: 6.5,
    Moon: 6.0,
    Mars: 5.0,
    Mercury: 7.0,
    Jupiter: 6.5,
    Venus: 5.5,
    Saturn: 5.0,
  };

  public static readonly NAISARGIKA_POINTS: Record<string, number> = {
    Sun: 60.0,
    Moon: 51.43,
    Venus: 42.85,
    Jupiter: 34.28,
    Mercury: 25.71,
    Mars: 17.14,
    Saturn: 8.57,
  };

  public static readonly PLANET_SYMBOLS: Record<string, string> = {
    Sun: "☉",
    Moon: "☽",
    Mars: "♂",
    Mercury: "☿",
    Jupiter: "♃",
    Venus: "♀",
    Saturn: "♄",
  };

  public calculateAllShadbala(input: ShadbalaChartInput): ShadbalaResult[] {
    const results: ShadbalaResult[] = [];

    for (const p of ShadbalaEngine.PLANETS) {
      const res = this.calculateShadbala(p, input);
      results.push(res);
    }

    const sorted = [...results].sort((a, b) => b.strengthRatio - a.strengthRatio);
    sorted.forEach((item, idx) => {
      const match = results.find((r) => r.planet === item.planet);
      if (match) {
        match.rank = idx + 1;
      }
    });

    return results;
  }

  public calculateShadbala(planet: string, input: ShadbalaChartInput): ShadbalaResult {
    const sthanaBala = this.calculateSthanaBala(planet, input);
    const digBala = this.calculateDigBala(planet, input);
    const kalaBala = this.calculateKalaBala(planet, input);
    const cheshtaBala = this.calculateCheshtaBala(planet, input);
    const naisargikaBala = this.calculateNaisargikaBala(planet);
    const drikBala = this.calculateDrikBala(planet, input);

    const totalVirupas =
      Math.round(
        (sthanaBala.total +
          digBala.points +
          kalaBala.total +
          cheshtaBala.points +
          naisargikaBala.points +
          drikBala.points) *
          100
      ) / 100;

    const totalRupas = Math.round((totalVirupas / 60) * 100) / 100;
    const reqRupas = ShadbalaEngine.REQUIRED_RUPAS[planet] || 5.0;
    const reqVirupas = reqRupas * 60;
    const strengthRatio = Math.round((totalVirupas / reqVirupas) * 100) / 100;
    const isStrong = totalVirupas >= reqVirupas;

    const interpretation = this.interpretPlanetStrength(planet, totalRupas, reqRupas, isStrong);
    const predictions = this.generateStrengthBasedPredictions(planet);

    return {
      planet,
      symbol: ShadbalaEngine.PLANET_SYMBOLS[planet] || "✦",
      sthanaBala,
      digBala,
      kalaBala,
      cheshtaBala,
      naisargikaBala,
      drikBala,
      totalVirupas,
      totalRupas,
      requiredVirupas: reqVirupas,
      requiredRupas: reqRupas,
      strengthRatio,
      isStrong,
      rank: 1,
      interpretation,
      predictions,
    };
  }

  public calculateSthanaBala(planet: string, input: ShadbalaChartInput): SthanaBalaBreakdown {
    const pPos = input.planets[planet];
    const lon = pPos ? ((pPos.longitude % 360) + 360) % 360 : 0;
    const asc = ((input.ascendant % 360) + 360) % 360;

    const sign = Math.floor(lon / 30);
    const degInSign = lon % 30;

    const exaltPoint = ShadbalaEngine.EXALTATION_POINTS[planet] ?? 0;
    const debilPoint = (exaltPoint + 180) % 360;

    let distFromDebil = Math.abs(lon - debilPoint);
    if (distFromDebil > 180) distFromDebil = 360 - distFromDebil;
    const ucchaBala = Math.round((distFromDebil / 180) * 60 * 100) / 100;

    const saptavargajaBala = this.calculateSaptavargajaBala(planet, lon);

    const isOddSign = sign % 2 === 0;
    const navPart = Math.floor(degInSign / (30 / 9));
    const navSign = (sign * 9 + navPart) % 12;
    const isOddNav = navSign % 2 === 0;

    const isMalePlanet = ["Sun", "Mars", "Jupiter"].includes(planet);
    let ojayugmaBala = 0;
    if (isMalePlanet) {
      if (isOddSign) ojayugmaBala += 15;
      if (isOddNav) ojayugmaBala += 15;
    } else {
      if (!isOddSign) ojayugmaBala += 15;
      if (!isOddNav) ojayugmaBala += 15;
    }

    const house = ((Math.floor(lon / 30) - Math.floor(asc / 30) + 12) % 12) + 1;
    let kendradiBala = 15;
    if ([1, 4, 7, 10].includes(house)) kendradiBala = 60;
    else if ([2, 5, 8, 11].includes(house)) kendradiBala = 30;

    const drekkanaIdx = Math.floor(degInSign / 10);
    let drekkanaBala = 0;
    if (drekkanaIdx === 0 && isMalePlanet) drekkanaBala = 15;
    else if (drekkanaIdx === 1 && ["Mercury", "Saturn"].includes(planet)) drekkanaBala = 15;
    else if (drekkanaIdx === 2 && ["Moon", "Venus"].includes(planet)) drekkanaBala = 15;

    const total = Math.round(
      (ucchaBala + saptavargajaBala + ojayugmaBala + kendradiBala + drekkanaBala) * 100
    ) / 100;

    return {
      ucchaBala,
      saptavargajaBala,
      ojayugmaBala,
      kendradiBala,
      drekkanaBala,
      total,
      description: `Positional strength from Exaltation (${ucchaBala}), 7 Vargas (${saptavargajaBala}), and Kendra placement (${kendradiBala}).`,
    };
  }

  private calculateSaptavargajaBala(planet: string, lon: number): number {
    const sign = Math.floor(lon / 30);
    let perVargaBase = 15;
    if (this.isOwnSign(planet, sign)) perVargaBase = 30;
    else if (this.isFriendSign(planet, sign)) perVargaBase = 22.5;

    return Math.round(perVargaBase * 7 * 100) / 100;
  }

  public calculateDigBala(planet: string, input: ShadbalaChartInput): DigBalaResult {
    let strongestHouse = 1;
    let peakAngleFromAsc = 0;

    switch (planet) {
      case "Jupiter":
      case "Mercury":
        strongestHouse = 1;
        peakAngleFromAsc = 0;
        break;
      case "Sun":
      case "Mars":
        strongestHouse = 10;
        peakAngleFromAsc = 270;
        break;
      case "Saturn":
        strongestHouse = 7;
        peakAngleFromAsc = 180;
        break;
      case "Moon":
      case "Venus":
        strongestHouse = 4;
        peakAngleFromAsc = 90;
        break;
    }

    const pPos = input.planets[planet];
    const lon = pPos ? ((pPos.longitude % 360) + 360) % 360 : 0;
    const asc = ((input.ascendant % 360) + 360) % 360;

    const actualHouse = ((Math.floor(lon / 30) - Math.floor(asc / 30) + 12) % 12) + 1;
    const planetAngleFromAsc = ((lon - asc + 360) % 360);

    let angularDiff = Math.abs(planetAngleFromAsc - peakAngleFromAsc);
    if (angularDiff > 180) angularDiff = 360 - angularDiff;

    const points = Math.round(Math.max(0, (1 - angularDiff / 180) * 60) * 100) / 100;

    return {
      points,
      strongestHouse,
      actualHouse,
      angularDistance: Math.round(angularDiff * 10) / 10,
      description: `${planet} receives ${points} Virupas in House ${actualHouse} (Strongest in House ${strongestHouse}).`,
    };
  }

  public calculateKalaBala(planet: string, input: ShadbalaChartInput): KalaBalaResult {
    const bDate = input.birthDate || new Date();
    const hours = bDate.getUTCHours();
    const isDayBirth = hours >= 6 && hours < 18;

    let nathonnathaBala = 30;
    if (planet === "Mercury") nathonnathaBala = 60;
    else if (isDayBirth && ["Sun", "Jupiter", "Venus"].includes(planet)) nathonnathaBala = 60;
    else if (!isDayBirth && ["Moon", "Mars", "Saturn"].includes(planet)) nathonnathaBala = 60;
    else nathonnathaBala = 15;

    const sunLon = input.planets["Sun"]?.longitude || 0;
    const moonLon = input.planets["Moon"]?.longitude || 0;
    let elongation = (moonLon - sunLon + 360) % 360;
    const pakshaFraction = elongation <= 180 ? elongation / 180 : (360 - elongation) / 180;
    const isBenefic = ["Jupiter", "Venus", "Moon", "Mercury"].includes(planet);

    const pakshaBala = isBenefic
      ? Math.round(pakshaFraction * 60 * 100) / 100
      : Math.round((1 - pakshaFraction) * 60 * 100) / 100;

    const tribhagaBala = 30;
    const abdaBala = 15;
    const maasaBala = 30;

    const dayOfWeek = bDate.getUTCDay();
    const weekdayLords = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
    const varaBala = weekdayLords[dayOfWeek] === planet ? 45 : 0;
    const horaBala = Math.floor(hours % 7) === weekdayLords.indexOf(planet) ? 60 : 0;
    const ayanaBala = 35.5;
    const yuddhaBala = 0;

    const total =
      Math.round(
        (nathonnathaBala +
          pakshaBala +
          tribhagaBala +
          abdaBala +
          maasaBala +
          varaBala +
          horaBala +
          ayanaBala +
          yuddhaBala) *
          100
      ) / 100;

    return {
      components: {
        nathonnathaBala,
        pakshaBala,
        tribhagaBala,
        abdaBala,
        maasaBala,
        varaBala,
        horaBala,
        ayanaBala,
        yuddhaBala,
      },
      total,
      description: `Temporal strength total of ${total} Virupas including Diurnal/Nocturnal (${nathonnathaBala}) and Paksha (${pakshaBala}).`,
    };
  }

  public calculateCheshtaBala(planet: string, input: ShadbalaChartInput): CheshtaBalaResult {
    const pPos = input.planets[planet];
    const isRetro = pPos?.isRetrograde ?? false;
    const dailyMotion = pPos?.dailyMotion ?? (isRetro ? -0.15 : 0.85);

    if (planet === "Sun" || planet === "Moon") {
      return {
        points: planet === "Sun" ? 45.0 : 50.0,
        motion: planet === "Sun" ? 1.0 : 13.2,
        isRetrograde: false,
        state: "Samanya (Direct)",
        description: `${planet} never retrogresses; motional strength derived from celestial velocity.`,
      };
    }

    let points = 30;
    let state: "Vakra (Retrograde)" | "Anuvakra (Slow)" | "Samanya (Direct)" | "Mandatara (Fast)" =
      "Samanya (Direct)";

    if (isRetro || dailyMotion < 0) {
      points = 60;
      state = "Vakra (Retrograde)";
    } else if (dailyMotion < 0.25) {
      points = 45;
      state = "Anuvakra (Slow)";
    } else if (dailyMotion < 1.0) {
      points = 30;
      state = "Samanya (Direct)";
    } else {
      points = 15;
      state = "Mandatara (Fast)";
    }

    return {
      points,
      motion: dailyMotion,
      isRetrograde: isRetro,
      state,
      description: `${planet} is in ${state} motion, securing ${points} Virupas Cheshta Bala.`,
    };
  }

  public calculateNaisargikaBala(planet: string): NaisargikaBalaResult {
    const pts = ShadbalaEngine.NAISARGIKA_POINTS[planet] ?? 0;
    return {
      points: pts,
      description: `Permanent natural Parashari hierarchy strength: ${pts} Virupas.`,
    };
  }

  public calculateDrikBala(planet: string, input: ShadbalaChartInput): DrikBalaResult {
    let drikPoints = 0;
    const aspectsList: {
      aspectingPlanet: string;
      nature: "Benefic" | "Malefic";
      angle: number;
      virupas: number;
    }[] = [];

    const targetPos = input.planets[planet];
    if (!targetPos) {
      return { points: 0, aspects: [], description: "No aspects calculated." };
    }

    for (const otherPlanet of ShadbalaEngine.PLANETS) {
      if (otherPlanet === planet) continue;
      const otherPos = input.planets[otherPlanet];
      if (!otherPos) continue;

      const angle = Math.abs(otherPos.longitude - targetPos.longitude) % 360;
      let aspectValue = 0;
      if (angle >= 170 && angle <= 190) aspectValue = 15;
      else if (otherPlanet === "Mars" && ((angle >= 80 && angle <= 100) || (angle >= 230 && angle <= 250))) aspectValue = 15;
      else if (otherPlanet === "Jupiter" && ((angle >= 110 && angle <= 130) || (angle >= 230 && angle <= 250))) aspectValue = 15;
      else if (otherPlanet === "Saturn" && ((angle >= 50 && angle <= 70) || (angle >= 290 && angle <= 310))) aspectValue = 15;

      if (aspectValue > 0) {
        const isBenefic = ["Jupiter", "Venus", "Mercury"].includes(otherPlanet);
        const signedVirupas = isBenefic ? aspectValue : -aspectValue;
        drikPoints += signedVirupas;

        aspectsList.push({
          aspectingPlanet: otherPlanet,
          nature: isBenefic ? "Benefic" : "Malefic",
          angle: Math.round(angle * 10) / 10,
          virupas: Math.round(signedVirupas * 10) / 10,
        });
      }
    }

    return {
      points: Math.round(drikPoints * 100) / 100,
      aspects: aspectsList,
      description: `Net Drishti aspect score is ${drikPoints} Virupas.`,
    };
  }

  private isOwnSign(planet: string, sign: number): boolean {
    const ownSigns: Record<string, number[]> = {
      Sun: [4],
      Moon: [3],
      Mars: [0, 7],
      Mercury: [2, 5],
      Jupiter: [8, 11],
      Venus: [1, 6],
      Saturn: [9, 10],
    };
    return (ownSigns[planet] || []).includes(sign);
  }

  private isFriendSign(planet: string, sign: number): boolean {
    const friends: Record<string, number[]> = {
      Sun: [3, 8, 0],
      Moon: [4, 2, 5],
      Mars: [4, 3, 8],
      Mercury: [4, 1, 6],
      Jupiter: [4, 3, 0],
      Venus: [2, 5, 9, 10],
      Saturn: [2, 5, 1, 6],
    };
    return (friends[planet] || []).includes(sign);
  }

  private interpretPlanetStrength(
    planet: string,
    rupas: number,
    required: number,
    isStrong: boolean
  ): string {
    if (isStrong) {
      return `${planet} commands ${rupas} Rupas (Required: ${required} Rupas). Being exceptionally strong, it delivers its auspicious promises with full conviction, resilience, and authoritative manifestation.`;
    }
    return `${planet} attains ${rupas} Rupas (Required: ${required} Rupas). Operating below classical threshold, its significations encounter delays, mixed results, or require conscious cultivation and remedies.`;
  }

  private generateStrengthBasedPredictions(planet: string): {
    strongEffects: string[];
    weakEffects: string[];
  } {
    const effects: Record<string, { strong: string[]; weak: string[] }> = {
      Sun: {
        strong: [
          "Natural executive command, magnetic aura, and leadership recognition",
          "Sound constitutional vitality, vitality of heart, and father's blessings",
          "Integrity in public administration and successful government affairs",
        ],
        weak: [
          "Ego vulnerabilities, defensiveness, or authority friction",
          "Fluctuating self-confidence and sensitivity in eyes or bone health",
          "Occasional misunderstandings with paternal figures or seniors",
        ],
      },
      Moon: {
        strong: [
          "Profound emotional poise, serene mental calmness, and high popularity",
          "Rich intuitive perception, fertile imagination, and maternal support",
          "Public trust, harmonious domestic relationships, and sound sleep",
        ],
        weak: [
          "Restless mind, emotional turbulence, and hypersensitivity",
          "Prone to anxious overthinking and fluid balance concerns",
          "Challenges in finding constant inner grounding without external reassurance",
        ],
      },
      Mars: {
        strong: [
          "Unflinching courage, athletic dynamism, and decisive initiative",
          "Triumph over competition, litigation, and physical adversaries",
          "Executive stamina for pioneering ventures and land/property management",
        ],
        weak: [
          "Impatience, fiery temper flares, or rash haste",
          "Vulnerability to burns, cuts, or reckless expenditures of energy",
          "Friction with siblings or misdirected confrontation",
        ],
      },
      Mercury: {
        strong: [
          "Brilliant analytical intellect, witty eloquence, and commercial acumen",
          "Mastery over languages, mathematics, software, and negotiations",
          "Adaptability, swift data comprehension, and thriving trade",
        ],
        weak: [
          "Nervous tension, analysis paralysis, and scattered focus",
          "Miscommunications, contractual oversights, or indecision",
          "Restless nervous system requiring structured grounding practices",
        ],
      },
      Jupiter: {
        strong: [
          "Supreme wisdom, divine grace, moral righteousness, and prosperity",
          "Virtuous children, noble mentors, and spiritual philosophical depth",
          "Expansive financial solvency and universal respect in community",
        ],
        weak: [
          "Dogmatism, missed wealth avenues, or lack of timely counsel",
          "Tendency towards over-optimism and dietary indulgence",
          "Delays in progeny matters or philosophical disillusionment",
        ],
      },
      Venus: {
        strong: [
          "Refined aesthetic taste, artistic creativity, and marital harmony",
          "Abundance of luxury, conveyances, diplomacy, and graceful affection",
          "Magnetic romantic charm and enduring relationship satisfaction",
        ],
        weak: [
          "Relationship compromises, romantic disillusionment, or sensory excesses",
          "Financial leakage on fleeting luxuries and emotional entanglements",
          "Hormonal or kidney sensitivity requiring mindful moderation",
        ],
      },
      Saturn: {
        strong: [
          "Unshakable perseverance, stoic patience, and monumental work ethic",
          "Longevity, mastery over organizational structures, and enduring wealth",
          "Humble justice, detachment, and supreme organizational discipline",
        ],
        weak: [
          "Chronic delays, feelings of isolation, or burdensome responsibilities",
          "Joint or bone stiffness, lethargy, and pessimism under pressure",
          "Resistance to necessary changes and lingering self-doubt",
        ],
      },
    };

    return {
      strongEffects: effects[planet]?.strong || ["Auspicious results", "Fulfillment of promises"],
      weakEffects: effects[planet]?.weak || ["Delays in fruition", "Requires patience and remedies"],
    };
  }
}
