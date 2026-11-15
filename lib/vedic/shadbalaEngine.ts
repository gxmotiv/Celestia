import { calculateDivisionalSignIndex } from "./divisionalCalc";

/**
 * Partial Shadbala research estimator.
 *
 * This module exposes the six traditional categories. Saptavargaja uses an
 * explicit seven-varga method and named point scale; other components remain
 * simplified or placeholder-based. See SHADBALA_IMPLEMENTATION_STATUS before
 * presenting a result as complete or source-validated classical Shadbala.
 */

export const SHADBALA_IMPLEMENTATION_STATUS = {
  level: "partial",
  label: "Partial / approximate",
  summary:
    "This is a provisional six-component estimate, not yet an independently verified classical Shadbala calculation.",
  limitations: [
    "Saptavargaja now evaluates D1, D2, D3, D7, D9, D12 and D30 separately. Its default score scale is the R. Santhanam BPHS translation (45/30/20/15/10/4/2); the alternative Raman halving scale can be selected explicitly. Five-fold friendship is derived from D1 relationships, and Moolatrikona is applied in D1 only.",
    "Dig Bala uses the actual sidereal Midheaven when supplied by the chart; callers without a Midheaven retain the disclosed 90° ecliptic fallback.",
    "Kala Bala still contains fixed placeholder values for Tribhaga, year, month and Ayana components, and its Hora estimate is not a sunrise-based planetary-hour calculation.",
    "Cheshta Bala uses coarse motion bands; non-luminary scores require an actual daily-motion value. Sun and Moon still use provisional constants rather than their textually specified Ayana/Paksha derivations.",
    "Drik Bala uses simplified fixed aspect bands and point values rather than a complete angular Drishti-Pinda computation."
  ]
} as const;

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
  state: "Vakra (Retrograde)" | "Anuvakra (Slow)" | "Samanya (Direct)" | "Mandatara (Fast)" | "Unavailable (motion not supplied)";
  available: boolean;
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

export type SaptavargajaScale = "bphs-santhanam" | "raman-halving";

export interface ShadbalaChartInput {
  ascendant: number;
  /** Sidereal Midheaven longitude; used to derive the MC and IC Dig Bala peaks. */
  midheaven?: number;
  /** Source-labelled point scale; defaults to the R. Santhanam BPHS translation. */
  saptavargajaScale?: SaptavargajaScale;
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

const SAPTAVARGA_CODES = ["D1", "D2", "D3", "D7", "D9", "D12", "D30"] as const;

const VARGA_SIGN_LORDS = [
  "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
  "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter",
] as const;

const NATURAL_FRIENDS: Record<string, readonly string[]> = {
  Sun: ["Moon", "Mars", "Jupiter"],
  Moon: ["Sun", "Mercury"],
  Mars: ["Sun", "Moon", "Jupiter"],
  Mercury: ["Sun", "Venus"],
  Jupiter: ["Sun", "Moon", "Mars"],
  Venus: ["Mercury", "Saturn"],
  Saturn: ["Mercury", "Venus"],
};

const NATURAL_ENEMIES: Record<string, readonly string[]> = {
  Sun: ["Venus", "Saturn"],
  Moon: [],
  Mars: ["Mercury"],
  Mercury: ["Moon"],
  Jupiter: ["Mercury", "Venus"],
  Venus: ["Sun", "Moon"],
  Saturn: ["Sun", "Moon", "Mars"],
};

const SAPTAVARGAJA_POINTS: Record<SaptavargajaScale, {
  greatFriend: number;
  friend: number;
  neutral: number;
  enemy: number;
  greatEnemy: number;
}> = {
  "bphs-santhanam": {
    greatFriend: 20,
    friend: 15,
    neutral: 10,
    enemy: 4,
    greatEnemy: 2,
  },
  "raman-halving": {
    greatFriend: 22.5,
    friend: 15,
    neutral: 7.5,
    enemy: 3.75,
    greatEnemy: 1.875,
  },
};

type NaturalRelationship = "friend" | "neutral" | "enemy";
type CompoundRelationship = "greatFriend" | "friend" | "neutral" | "enemy" | "greatEnemy";

function isParashariMoolatrikonaD1(planet: string, longitude: number): boolean {
  const normalized = ((longitude % 360) + 360) % 360;
  const sign = Math.floor(normalized / 30);
  const degree = normalized % 30;

  switch (planet) {
    case "Sun": return sign === 4 && degree <= 20;
    case "Moon": return sign === 1 && degree > 3;
    case "Mars": return sign === 0 && degree <= 12;
    case "Mercury": return sign === 5 && degree > 15 && degree <= 20;
    case "Jupiter": return sign === 8 && degree <= 10;
    case "Venus": return sign === 6 && degree <= 15;
    case "Saturn": return sign === 10 && degree <= 20;
    default: return false;
  }
}

function getNaturalRelationship(planet: string, other: string): NaturalRelationship {
  if (planet === other) return "friend";
  if (NATURAL_FRIENDS[planet]?.includes(other)) return "friend";
  if (NATURAL_ENEMIES[planet]?.includes(other)) return "enemy";
  return "neutral";
}

function getCompoundRelationship(
  planet: string,
  signLord: string,
  input: ShadbalaChartInput
): CompoundRelationship {
  const natural = getNaturalRelationship(planet, signLord);
  const planetPosition = input.planets[planet];
  const lordPosition = input.planets[signLord];
  if (!planetPosition || !lordPosition) {
    throw new RangeError(
      "Saptavargaja requires all seven classical planetary longitudes; missing " +
      [!planetPosition ? planet : "", !lordPosition ? signLord : ""].filter(Boolean).join(" and ") +
      "."
    );
  }

  const planetSign = Math.floor((((planetPosition.longitude % 360) + 360) % 360) / 30);
  const lordSign = Math.floor((((lordPosition.longitude % 360) + 360) % 360) / 30);
  const relativeSignOffset = (lordSign - planetSign + 12) % 12;
  // BPHS 3.56: the 2nd, 3rd, 4th, 10th, 11th and 12th are temporary friends.
  const temporaryFriend = [1, 2, 3, 9, 10, 11].includes(relativeSignOffset);

  if (natural === "friend") return temporaryFriend ? "greatFriend" : "neutral";
  if (natural === "enemy") return temporaryFriend ? "neutral" : "greatEnemy";
  return temporaryFriend ? "friend" : "enemy";
}

/**
 * Saptavargaja Bala across the seven Parashari Vargas.
 *
 * Default weights follow R. Santhanam's BPHS translation, chapter 27 verses
 * 2–4: Moolatrikona 45, own 30, great friend 20, friend 15, neutral 10,
 * enemy 4, great enemy 2 Virupas. The alternate Raman halving table is exposed
 * as a separate input option rather than blended into this source variant.
 *
 * Temporary and natural relationships are combined using BPHS 3.55–58 from
 * the natal Rasi chart. Moolatrikona is evaluated only in D1 using BPHS 3.51–54.
 */
export function calculateSaptavargajaBala(
  planet: string,
  input: ShadbalaChartInput
): number {
  if (!ShadbalaEngine.PLANETS.includes(planet)) {
    throw new RangeError("Saptavargaja is defined here only for the seven classical planets.");
  }
  const natalPosition = input.planets[planet];
  if (!natalPosition || !Number.isFinite(natalPosition.longitude)) {
    throw new RangeError("Saptavargaja requires a finite natal longitude for " + planet + ".");
  }

  const scale = input.saptavargajaScale ?? "bphs-santhanam";
  const points = SAPTAVARGAJA_POINTS[scale];
  if (!points) throw new RangeError("Unknown Saptavargaja scoring scale: " + String(scale));

  let total = 0;
  for (const divisionCode of SAPTAVARGA_CODES) {
    const vargaSign = calculateDivisionalSignIndex(natalPosition.longitude, divisionCode);
    const signLord = VARGA_SIGN_LORDS[vargaSign];

    if (divisionCode === "D1" && isParashariMoolatrikonaD1(planet, natalPosition.longitude)) {
      total += 45;
    } else if (signLord === planet) {
      total += 30;
    } else {
      const relationship = getCompoundRelationship(planet, signLord, input);
      total += points[relationship];
    }
  }

  return Math.round(total * 1000) / 1000;
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

    const saptavargajaBala = calculateSaptavargajaBala(planet, input);

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

  public calculateDigBala(planet: string, input: ShadbalaChartInput): DigBalaResult {
    let strongestHouse = 1;
    const asc = ((input.ascendant % 360) + 360) % 360;
    const hasMidheaven = Number.isFinite(input.midheaven);
    const midheaven = hasMidheaven
      ? (((input.midheaven as number) % 360) + 360) % 360
      : ((asc + 270) % 360);
    let peakLongitude = asc;

    switch (planet) {
      case "Jupiter":
      case "Mercury":
        strongestHouse = 1;
        peakLongitude = asc;
        break;
      case "Sun":
      case "Mars":
        strongestHouse = 10;
        // Dig Bala peaks at the actual Midheaven, not at a fixed 270° offset.
        peakLongitude = hasMidheaven ? midheaven : ((asc + 270) % 360);
        break;
      case "Saturn":
        strongestHouse = 7;
        peakLongitude = (asc + 180) % 360;
        break;
      case "Moon":
      case "Venus":
        strongestHouse = 4;
        // The IC is exactly opposite the supplied MC.
        peakLongitude = hasMidheaven
          ? (midheaven + 180) % 360
          : (asc + 90) % 360;
        break;
    }

    const pPos = input.planets[planet];
    const lon = pPos ? ((pPos.longitude % 360) + 360) % 360 : 0;
    const actualHouse = ((Math.floor(lon / 30) - Math.floor(asc / 30) + 12) % 12) + 1;
    const rawAngularDifference = Math.abs(lon - peakLongitude);
    const angularDiff = Math.min(rawAngularDifference, 360 - rawAngularDifference);
    const points = Math.round(Math.max(0, (1 - angularDiff / 180) * 60) * 100) / 100;

    return {
      points,
      strongestHouse,
      actualHouse,
      angularDistance: Math.round(angularDiff * 10) / 10,
      description: hasMidheaven
        ? `${planet} receives ${points} Virupas relative to its chart-derived directional peak at ${peakLongitude.toFixed(2)}°.`
        : `${planet} receives ${points} Virupas using the approximate quadrant peak for House ${strongestHouse}; no Midheaven was supplied.`,
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
    const dailyMotion = pPos?.dailyMotion ?? pPos?.speed;

    if (planet === "Sun" || planet === "Moon") {
      return {
        points: planet === "Sun" ? 45.0 : 50.0,
        motion: planet === "Sun" ? 1.0 : 13.2,
        isRetrograde: false,
        state: "Samanya (Direct)",
        available: true,
        description: `${planet} uses a provisional motional-strength constant; the source-specified Ayana/Paksha derivation remains to be implemented.`,
      };
    }

    if (dailyMotion === undefined || !Number.isFinite(dailyMotion)) {
      return {
        points: 0,
        motion: 0,
        isRetrograde: isRetro,
        state: "Unavailable (motion not supplied)",
        available: false,
        description: "Cheshta Bala was not estimated because an actual daily-motion value was not supplied. No default speed is invented.",
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
      available: true,
      description: `${planet} is in ${state} motion, securing a provisional ${points} Virupas Cheshta Bala estimate.`,
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
