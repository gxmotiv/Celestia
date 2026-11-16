import { calculateDivisionalSignIndex } from "./divisionalCalc";
import { PlanetaryHoursCalculator } from "../astronomy/planetaryHours";
import {
  calculateLongitudeDrishtiVirupas,
  type DrishtiVirupaVariant,
} from "./drishtiEngine";

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
    "Nathonnatha Bala now uses exact local apparent solar time derived from the UTC instant, longitude and the Meeus equation of time. Paksha Bala now supports separate BPHS waxing/waning and Raman Ashtami-window readings, selectable Mercury association, and explicit Moon accounting (BPHS Kala plus Cheshta versus Raman doubled within Kala). Tribhaga now uses location-specific NOAA-model sunrise/sunset unequal thirds and explicit unavailable states for missing time/location or polar conditions. Abda, Masa and Ayana still contain fixed placeholders, while Vara and Hora remain provisional and are not yet derived from sunrise-based weekday/hora lords.",
    "Cheshta Bala uses coarse motion bands; non-luminary scores require an actual daily-motion value. Sun and Moon still use provisional constants rather than their textually specified Ayana/Paksha derivations.",
    "Drik Bala now uses directed longitude-based Drishti Pinda for the seven classical grahas, with source-labelled BPHS verse and Raman/translator aspect curves and explicit Mercury/Jupiter full-aspect readings. It still requires validation against a complete independent Shadbala worked chart before the Shadbala module can be promoted beyond partial."
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
  /** Null when exact local apparent birth time is unavailable (except Mercury, always 60). */
  nathonnathaBala: number | null;
  /** Null when a valid Sun/Moon longitude pair is unavailable. */
  pakshaBala: number | null;
  /** Null when birth time, location or sunrise/sunset intervals are unavailable. */
  tribhagaBala: number | null;
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
  unavailableComponents: string[];
  pakshaDetails?: PakshaBalaDetails;
  tribhagaDetails?: TribhagaBalaResult;
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

export type DrikFullAspectReading =
  | "added-to-quarter"
  | "in-place-of-quarter"
  | "quarter-only";

export type DrikMercuryAssociationRule = "same-sign" | "degree-orb";

/** Source-specific rule for when the Moon is classified as benefic for Paksha Bala. */
export type PakshaMoonNatureRule =
  | "bphs-waxing-waning"
  | "raman-ashtami-window-through-krishna-ashtami"
  | "raman-ashtami-window-through-krishna-saptami";

/**
 * Avoid double-counting the Moon:
 * - BPHS 27.18: ordinary Paksha in Kala and the same value in Cheshta.
 * - Raman Ch. V / Example 56: doubled Paksha inside Kala, no separate Moon Cheshta row.
 */
export type PakshaMoonAccountingRule =
  | "bphs-kala-plus-cheshta"
  | "raman-double-in-kala";

export interface PakshaBalaDetails {
  elongationDegrees: number;
  foldedArcDegrees: number;
  beneficShareVirupas: number;
  maleficShareVirupas: number;
  moonNature: "Benefic" | "Malefic";
  mercuryNature: "Benefic" | "Malefic";
  moonNatureRule: PakshaMoonNatureRule;
  moonAccountingRule: PakshaMoonAccountingRule;
  mercuryAssociationRule: DrikMercuryAssociationRule;
}

export interface DrikBalaAspect {
  aspectingPlanet: string;
  nature: "Benefic" | "Malefic";
  /** Directed separation: aspected longitude minus aspecting longitude, [0°, 360°). */
  angle: number;
  /** Unadjusted Sputa Drishti from the selected Ch. 26 curve. */
  rawVirupas: number;
  /** Signed one-quarter contribution under BPHS 27.19. */
  quarterVirupas: number;
  /** Signed full Mercury/Jupiter term under the selected 27.19 reading. */
  fullAspectVirupas: number;
  /** Net signed contribution to Drik Bala. */
  virupas: number;
}

export interface DrikBalaResult {
  points: number;
  /** Signed sum of all raw benefic and malefic Drishti Pinda contributions. */
  drishtiPinda: number;
  beneficDrishtiPinda: number;
  maleficDrishtiPinda: number;
  aspects: DrikBalaAspect[];
  available: boolean;
  missingPlanetInputs: string[];
  degreeStrengthVariant: DrishtiVirupaVariant;
  fullAspectReading: DrikFullAspectReading;
  mercuryAssociationRule: DrikMercuryAssociationRule;
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
  /** Exact-longitude Sputa Drishti source profile; defaults to BPHS 26.9-12. */
  drishtiVirupaVariant?: DrishtiVirupaVariant;
  /**
   * BPHS 27.19 says to add Mercury/Jupiter's whole aspect after the quarter
   * terms, but editions/commentators differ on replacement vs addition.
   */
  drikFullAspectReading?: DrikFullAspectReading;
  /** Mercury becomes malefic when conjoined/associated with a malefic. */
  drikMercuryAssociationRule?: DrikMercuryAssociationRule;
  /** Required only by the explicitly chosen degree-orb Mercury association rule. */
  drikMercuryAssociationOrbDeg?: number;
  /** Local apparent solar time since local apparent midnight, in minutes [0, 1440). */
  localApparentTimeMinutes?: number;
  /** Explicitly false for an unknown placeholder birth time. */
  birthTimeKnown?: boolean;
  /** BPHS waxing/waning Moon or B. V. Raman's wider Ashtami-window reading. */
  pakshaMoonNatureRule?: PakshaMoonNatureRule;
  /** Whether the Moon's Paksha is paired with Cheshta or doubled inside Kala. */
  pakshaMoonAccountingRule?: PakshaMoonAccountingRule;
  /** Mercury's company rule for its temporary benefic/malefic Paksha nature. */
  pakshaMercuryAssociationRule?: DrikMercuryAssociationRule;
  /** Required only by the explicitly selected degree-orb Mercury association rule. */
  pakshaMercuryAssociationOrbDeg?: number;
  /** IANA zone identifier for date-specific sunrise/sunset UTC offsets. */
  ianaTimezone?: string;
  /** Exact civil UTC offset at the known birth instant. */
  timezoneOffsetSeconds?: number;
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

/**
 * Nathonnatha Bala (also called Divaratri Bala) using Raman, Graha and Bhava
 * Balas, Chapter V, articles 47-51, Method B; equivalent to Method A's
 * apparent-time Natha/Unnatha ghati calculation.
 *
 * The local apparent clock is measured from local apparent midnight. Diurnal
 * planets peak at apparent noon; nocturnal planets peak at apparent midnight.
 * Mercury always receives 60 Virupas. No civil-clock 06:00/18:00 approximation
 * or unknown-time noon placeholder is substituted.
 */
export function calculateNathonnathaBala(
  planet: string,
  localApparentTimeMinutes?: number,
  birthTimeKnown = true
): number | null {
  if (planet === "Mercury") return 60;
  if (!["Sun", "Jupiter", "Venus", "Moon", "Mars", "Saturn"].includes(planet)) {
    throw new RangeError(`Nathonnatha Bala is defined here only for the seven classical planets; received ${planet}.`);
  }
  if (!birthTimeKnown || !Number.isFinite(localApparentTimeMinutes)) return null;
  if ((localApparentTimeMinutes as number) < 0 || (localApparentTimeMinutes as number) >= 1440) {
    throw new RangeError("Local apparent time must be between 0 and 1440 minutes after apparent midnight.");
  }

  const degreesFromApparentMidnight = (localApparentTimeMinutes as number) / 4;
  const foldedDegrees = degreesFromApparentMidnight > 180
    ? 360 - degreesFromApparentMidnight
    : degreesFromApparentMidnight;

  if (["Sun", "Jupiter", "Venus"].includes(planet)) {
    return Math.max(0, Math.min(60, foldedDegrees / 3));
  }
  return Math.max(0, Math.min(60, (180 - foldedDegrees) / 3));
}

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

/**
 * Folded Moon-Sun elongation for BPHS Ch. 27 vv. 10-11.
 * The short arc is 0° at conjunction and 180° at opposition.
 */
export function calculatePakshaPoolVirupas(
  sunLongitude: number,
  moonLongitude: number
): { elongationDegrees: number; foldedArcDegrees: number; beneficShareVirupas: number; maleficShareVirupas: number } {
  for (const [name, value] of [["Sun", sunLongitude], ["Moon", moonLongitude]] as const) {
    if (!Number.isFinite(value) || value < 0 || value >= 360) {
      throw new RangeError(`Paksha Bala requires normalized [0°, 360°) ${name} longitude.`);
    }
  }
  const elongationDegrees = ((moonLongitude - sunLongitude) % 360 + 360) % 360;
  const foldedArcDegrees = elongationDegrees > 180 ? 360 - elongationDegrees : elongationDegrees;
  const beneficShareVirupas = foldedArcDegrees / 3;
  return {
    elongationDegrees,
    foldedArcDegrees,
    beneficShareVirupas,
    maleficShareVirupas: 60 - beneficShareVirupas,
  };
}

/** Whether the Moon is treated as a Paksha benefic under the named lineage. */
export function isPakshaMoonBenefic(
  elongationDegrees: number,
  rule: PakshaMoonNatureRule = "bphs-waxing-waning"
): boolean {
  if (!Number.isFinite(elongationDegrees) || elongationDegrees < 0 || elongationDegrees >= 360) {
    throw new RangeError("Moon-Sun elongation must be normalized to [0°, 360°).");
  }
  if (rule === "bphs-waxing-waning") {
    // BPHS 3.11: increasing Moon is benefic; decreasing Moon is malefic.
    // At exact New Moon the Moon is assigned to the waning/malefic side;
    // exact Full Moon is retained on the waxing/benefic side.
    return elongationDegrees > 0 && elongationDegrees <= 180;
  }
  if (rule === "raman-ashtami-window-through-krishna-ashtami") {
    // Raman, Graha and Bhava Balas, Ch. V, Art. 53:
    // Shukla Ashtami (84°) up to but not including the end of Krishna Ashtami (276°).
    return elongationDegrees >= 84 && elongationDegrees < 276;
  }
  // Alternate reading: Krishna Ashtami is outside the benefic window.
  return elongationDegrees >= 84 && elongationDegrees < 264;
}

function pakshaGrahaIsMalefic(
  name: string,
  input: ShadbalaChartInput,
  elongationDegrees: number,
  moonNatureRule: PakshaMoonNatureRule,
  mercuryAssociationRule: DrikMercuryAssociationRule
): boolean {
  if (name === "Sun" || name === "Mars" || name === "Saturn") return true;
  if (name === "Jupiter" || name === "Venus") return false;
  if (name === "Moon") return !isPakshaMoonBenefic(elongationDegrees, moonNatureRule);
  if (name === "Mercury") {
    const mercury = input.planets.Mercury;
    if (!mercury) return false;
    if (mercuryAssociationRule === "degree-orb") {
      const orb = input.pakshaMercuryAssociationOrbDeg;
      if (!Number.isFinite(orb) || (orb as number) < 0 || (orb as number) > 30) {
        throw new RangeError("Paksha degree-orb Mercury association requires a finite orb from 0° through 30°.");
      }
    }
    const companions = ["Sun", "Moon", "Mars", "Saturn", "Rahu", "Ketu"]
      .filter((otherName) => Boolean(input.planets[otherName]));
    return companions.some((otherName) => {
      const other = input.planets[otherName];
      const otherIsMalefic = otherName === "Moon"
        ? !isPakshaMoonBenefic(elongationDegrees, moonNatureRule)
        : ["Sun", "Mars", "Saturn", "Rahu", "Ketu"].includes(otherName);
      if (!otherIsMalefic) return false;
      const separation = Math.min(
        ((other.longitude - mercury.longitude) % 360 + 360) % 360,
        ((mercury.longitude - other.longitude) % 360 + 360) % 360
      );
      return mercuryAssociationRule === "same-sign"
        ? Math.floor(other.longitude / 30) === Math.floor(mercury.longitude / 30)
        : separation <= (input.pakshaMercuryAssociationOrbDeg as number);
    });
  }
  return false;
}

export interface PakshaBalaResult {
  planet: string;
  points: number;
  rawShareVirupas: number;
  nature: "Benefic" | "Malefic" | null;
  available: boolean;
  details?: PakshaBalaDetails;
  description: string;
}

/**
 * Paksha Bala (BPHS Ch. 27 vv. 10-11; Moon nature per Ch. 3 v. 11).
 * The Moon's score placement is handled separately so its Paksha strength is
 * never counted three times: see PakshaMoonAccountingRule and Ch. 27 v. 18.
 */
export function calculatePakshaBala(
  planet: string,
  input: ShadbalaChartInput
): PakshaBalaResult {
  const moonNatureRule = input.pakshaMoonNatureRule ?? "bphs-waxing-waning";
  const moonAccountingRule = input.pakshaMoonAccountingRule ?? "bphs-kala-plus-cheshta";
  const mercuryAssociationRule = input.pakshaMercuryAssociationRule ?? "same-sign";
  if (!ShadbalaEngine.PLANETS.includes(planet)) {
    throw new RangeError(`Paksha Bala is defined here only for the seven classical planets; received ${planet}.`);
  }
  if (input.birthTimeKnown === false) {
    return {
      planet,
      points: 0,
      rawShareVirupas: 0,
      nature: null,
      available: false,
      description: "Paksha Bala unavailable: birth time is explicitly unknown, so the Moon longitude may be only a placeholder.",
    };
  }
  const sunLongitude = input.planets.Sun?.longitude;
  const moonLongitude = input.planets.Moon?.longitude;
  if (sunLongitude === undefined || moonLongitude === undefined ||
      !Number.isFinite(sunLongitude) || !Number.isFinite(moonLongitude)) {
    return {
      planet,
      points: 0,
      rawShareVirupas: 0,
      nature: null,
      available: false,
      description: "Paksha Bala unavailable: valid Sun and Moon longitudes are required; no zero-position fallback is substituted.",
    };
  }
  const pool = calculatePakshaPoolVirupas(sunLongitude, moonLongitude);
  const moonNature = isPakshaMoonBenefic(pool.elongationDegrees, moonNatureRule)
    ? "Benefic" : "Malefic";
  const mercuryNature = pakshaGrahaIsMalefic(
    "Mercury", input, pool.elongationDegrees, moonNatureRule, mercuryAssociationRule
  ) ? "Malefic" : "Benefic";
  const planetNature = planet === "Moon"
    ? moonNature
    : planet === "Mercury"
      ? mercuryNature
      : ["Sun", "Mars", "Saturn"].includes(planet) ? "Malefic" : "Benefic";
  const rawShareVirupas = planetNature === "Benefic"
    ? pool.beneficShareVirupas
    : pool.maleficShareVirupas;
  const multiplier = planet === "Moon" && moonAccountingRule === "raman-double-in-kala" ? 2 : 1;
  const points = rawShareVirupas * multiplier;
  const details: PakshaBalaDetails = {
    elongationDegrees: pool.elongationDegrees,
    foldedArcDegrees: pool.foldedArcDegrees,
    beneficShareVirupas: pool.beneficShareVirupas,
    maleficShareVirupas: pool.maleficShareVirupas,
    moonNature,
    mercuryNature,
    moonNatureRule,
    moonAccountingRule,
    mercuryAssociationRule,
  };
  return {
    planet,
    points: Math.round(points * 100) / 100,
    rawShareVirupas: Math.round(rawShareVirupas * 100) / 100,
    nature: planetNature,
    available: true,
    details,
    description:
      `Paksha Bala ${points.toFixed(2)} Virupas from ${planetNature.toLowerCase()} share ${rawShareVirupas.toFixed(2)}; Moon: ${moonNature.toLowerCase()} (${moonNatureRule}); Mercury: ${mercuryNature.toLowerCase()} (${mercuryAssociationRule}); Moon accounting: ${moonAccountingRule}.`,
  };
}

export type TribhagaPart = "first" | "middle" | "last";
export type TribhagaPeriod = "day" | "night";

export interface TribhagaSolarIntervals {
  birthLocalMinutes: number;
  sunriseMinutes: number;
  sunsetMinutes: number;
  previousSunsetMinutes: number;
  nextSunriseMinutes: number;
}

export interface TribhagaBalaResult {
  points: number | null;
  available: boolean;
  period: TribhagaPeriod | null;
  part: TribhagaPart | null;
  awardedLord: string | null;
  intervalStartMinutes: number | null;
  intervalEndMinutes: number | null;
  description: string;
}

const TRIBHAGA_PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const;
const DAY_TRIBHAGA_LORDS = ["Mercury", "Sun", "Saturn"] as const;
const NIGHT_TRIBHAGA_LORDS = ["Moon", "Venus", "Mars"] as const;

/**
 * BPHS 27.12: one rupa to the ruling graha of each of the three unequal
 * daylight/night thirds; Jupiter receives one rupa at all times.
 * Intervals are half-open: sunrise starts the first day part, sunset starts
 * the first night part, and an exact third boundary enters the next part.
 */
export function calculateTribhagaBalaFromSolarIntervals(
  planet: string,
  intervals?: TribhagaSolarIntervals
): TribhagaBalaResult {
  if (!TRIBHAGA_PLANETS.includes(planet as (typeof TRIBHAGA_PLANETS)[number])) {
    throw new RangeError(\`Tribhaga Bala is defined only for the seven classical planets; received \${planet}.\`);
  }
  if (planet === "Jupiter") {
    return {
      points: 60, available: true, period: null, part: null, awardedLord: "Jupiter",
      intervalStartMinutes: null, intervalEndMinutes: null,
      description: "BPHS 27.12: Jupiter receives full Tribhaga Bala (60 Virupas) at all times.",
    };
  }
  if (!intervals) {
    return {
      points: null, available: false, period: null, part: null, awardedLord: null,
      intervalStartMinutes: null, intervalEndMinutes: null,
      description: "Tribhaga Bala unavailable: a known local birth clock, valid latitude/longitude and normal sunrise/sunset intervals are required.",
    };
  }
  const values = [
    intervals.birthLocalMinutes, intervals.sunriseMinutes, intervals.sunsetMinutes,
    intervals.previousSunsetMinutes, intervals.nextSunriseMinutes,
  ];
  if (!values.every(Number.isFinite) || values.some((value) => value < 0 || value >= 1440)) {
    throw new RangeError("Tribhaga local solar times must be finite clock minutes in [0, 1440).");
  }
  if (intervals.sunsetMinutes <= intervals.sunriseMinutes) {
    throw new RangeError("Tribhaga sunrise must precede sunset on the local birth date.");
  }

  let period: TribhagaPeriod;
  let elapsedMinutes: number;
  let intervalDuration: number;
  let intervalStart: number;
  if (
    intervals.birthLocalMinutes >= intervals.sunriseMinutes &&
    intervals.birthLocalMinutes < intervals.sunsetMinutes
  ) {
    period = "day";
    elapsedMinutes = intervals.birthLocalMinutes - intervals.sunriseMinutes;
    intervalDuration = intervals.sunsetMinutes - intervals.sunriseMinutes;
    intervalStart = intervals.sunriseMinutes;
  } else if (intervals.birthLocalMinutes < intervals.sunriseMinutes) {
    period = "night";
    intervalDuration = intervals.sunriseMinutes + 1440 - intervals.previousSunsetMinutes;
    elapsedMinutes = intervals.birthLocalMinutes + 1440 - intervals.previousSunsetMinutes;
    intervalStart = intervals.previousSunsetMinutes;
  } else {
    period = "night";
    intervalDuration = intervals.nextSunriseMinutes + 1440 - intervals.sunsetMinutes;
    elapsedMinutes = intervals.birthLocalMinutes - intervals.sunsetMinutes;
    intervalStart = intervals.sunsetMinutes;
  }
  if (intervalDuration <= 0 || elapsedMinutes < 0 || elapsedMinutes >= intervalDuration) {
    throw new RangeError("Tribhaga birth time does not fall inside the selected sunrise/sunset interval.");
  }

  const partIndex = Math.min(2, Math.floor(elapsedMinutes / (intervalDuration / 3)));
  const part: TribhagaPart = partIndex === 0 ? "first" : partIndex === 1 ? "middle" : "last";
  const awardedLord = period === "day" ? DAY_TRIBHAGA_LORDS[partIndex] : NIGHT_TRIBHAGA_LORDS[partIndex];
  const normalize = (minutes: number) => ((minutes % 1440) + 1440) % 1440;
  const intervalStartMinutes = normalize(intervalStart + partIndex * intervalDuration / 3);
  const intervalEndMinutes = normalize(intervalStart + (partIndex + 1) * intervalDuration / 3);
  const active = planet === awardedLord;
  return {
    points: active ? 60 : 0,
    available: true,
    period,
    part,
    awardedLord,
    intervalStartMinutes,
    intervalEndMinutes,
    description: \`BPHS 27.12: \${period} \${part} third awards 60 Virupas to \${awardedLord}; \${planet} receives \${active ? 60 : 0}. Local unequal sunrise/sunset thirds are used.\`,
  };
}

function offsetSecondsAtWallClock(
  timeZone: string | undefined,
  year: number,
  month: number,
  day: number,
  hour: number,
  fallbackOffsetSeconds: number
): number | null {
  if (!timeZone) return fallbackOffsetSeconds;
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
      hour: "2-digit",
      hourCycle: "h23",
    });
    const wallClockMs = Date.UTC(year, month - 1, day, hour);
    let offset = fallbackOffsetSeconds;
    for (let pass = 0; pass < 3; pass += 1) {
      const candidate = new Date(wallClockMs - offset * 1000);
      const label = formatter.formatToParts(candidate).find((part) => part.type === "timeZoneName")?.value;
      if (!label || label === "GMT" || label === "UTC") {
        offset = 0;
        break;
      }
      const match = /^GMT([+-])(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(label);
      if (!match) return null;
      const sign = match[1] === "-" ? -1 : 1;
      const nextOffset = sign * (
        Number(match[2]) * 3600 + Number(match[3]) * 60 + Number(match[4] ?? "0")
      );
      if (nextOffset === offset) break;
      offset = nextOffset;
    }
    return offset;
  } catch {
    return null;
  }
}

/**
 * Uses the existing NOAA daily solar model for location-specific sunrise and
 * sunset. This is an approximation, not a precision topocentric rise/set
 * ephemeris. Adjacent-date offsets are resolved through the IANA time zone.
 */
export function calculateTribhagaBala(
  planet: string,
  input: ShadbalaChartInput
): TribhagaBalaResult {
  if (!TRIBHAGA_PLANETS.includes(planet as (typeof TRIBHAGA_PLANETS)[number])) {
    throw new RangeError(\`Tribhaga Bala is defined only for the seven classical planets; received \${planet}.\`);
  }
  if (planet === "Jupiter") return calculateTribhagaBalaFromSolarIntervals(planet);
  const birth = input.birthDate;
  if (
    input.birthTimeKnown === false ||
    !(birth instanceof Date) || !Number.isFinite(birth.getTime()) ||
    !Number.isFinite(input.latitude) || !Number.isFinite(input.longitude) ||
    (input.latitude as number) < -90 || (input.latitude as number) > 90 ||
    (input.longitude as number) < -180 || (input.longitude as number) > 180 ||
    !Number.isFinite(input.timezoneOffsetSeconds)
  ) {
    return calculateTribhagaBalaFromSolarIntervals(planet);
  }

  const year = birth.getUTCFullYear();
  const month = birth.getUTCMonth() + 1;
  const day = birth.getUTCDate();
  const birthLocalMinutes = birth.getUTCHours() * 60 + birth.getUTCMinutes() +
    birth.getUTCSeconds() / 60 + birth.getUTCMilliseconds() / 60_000;
  const solar = new PlanetaryHoursCalculator();
  const shiftedDate = (days: number) => {
    const date = new Date(Date.UTC(year, month - 1, day + days));
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
  };
  const getEvent = (
    date: { year: number; month: number; day: number },
    event: "sunrise" | "sunset"
  ) => {
    const localHour = event === "sunrise" ? 6 : 18;
    const offset = offsetSecondsAtWallClock(
      input.ianaTimezone, date.year, date.month, date.day, localHour,
      input.timezoneOffsetSeconds as number
    );
    if (offset === null) return { minute: Number.NaN, condition: "polar-night" as const };
    const result = solar.calculateSunTimes(
      date.year, date.month, date.day,
      input.latitude as number, input.longitude as number, offset / 3600
    );
    return { minute: Math.round(result[event] * 60) % 1440, condition: result.solarCondition };
  };
  const today = { year, month, day };
  const sunrise = getEvent(today, "sunrise");
  const sunset = getEvent(today, "sunset");
  const previousSunset = getEvent(shiftedDate(-1), "sunset");
  const nextSunrise = getEvent(shiftedDate(1), "sunrise");
  if (
    sunrise.condition !== "normal" || sunset.condition !== "normal" ||
    previousSunset.condition !== "normal" || nextSunrise.condition !== "normal" ||
    ![sunrise.minute, sunset.minute, previousSunset.minute, nextSunrise.minute].every(Number.isFinite)
  ) {
    return calculateTribhagaBalaFromSolarIntervals(planet);
  }
  return calculateTribhagaBalaFromSolarIntervals(planet, {
    birthLocalMinutes,
    sunriseMinutes: sunrise.minute,
    sunsetMinutes: sunset.minute,
    previousSunsetMinutes: previousSunset.minute,
    nextSunriseMinutes: nextSunrise.minute,
  });
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
    const bDate = input.birthDate;
    const nathonnathaBala = calculateNathonnathaBala(
      planet,
      input.localApparentTimeMinutes,
      input.birthTimeKnown ?? true
    );

    const pakshaResult = calculatePakshaBala(planet, input);
    const pakshaBala = pakshaResult.available ? pakshaResult.points : null;

    const tribhagaBala = 30;
    const abdaBala = 15;
    const maasaBala = 30;

    const dayOfWeek = bDate instanceof Date && Number.isFinite(bDate.getTime())
      ? bDate.getUTCDay()
      : null;
    const localCivilHour = bDate instanceof Date && Number.isFinite(bDate.getTime())
      ? bDate.getUTCHours()
      : null;
    const weekdayLords = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
    const varaBala = dayOfWeek !== null && weekdayLords[dayOfWeek] === planet ? 45 : 0;
    // This legacy Hora estimate remains explicitly provisional and is not
    // confused with the sunrise-based hora clock used by the planetary-hours engine.
    const horaBala = localCivilHour !== null && Math.floor(localCivilHour % 7) === weekdayLords.indexOf(planet) ? 60 : 0;
    const ayanaBala = 35.5;
    const yuddhaBala = 0;

    const unavailableComponents = [
      ...(nathonnathaBala === null
        ? ["Nathonnatha Bala (requires a known local apparent birth time)"]
        : []),
      ...(!pakshaResult.available
        ? ["Paksha Bala (requires valid Sun and Moon longitudes)"]
        : []),
    ];
    const total =
      Math.round(
        ((nathonnathaBala ?? 0) +
          (pakshaBala ?? 0) +
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
      unavailableComponents,
      ...(pakshaResult.details ? { pakshaDetails: pakshaResult.details } : {}),
      description:
        `Partial temporal estimate of ${total} Virupas. Nathonnatha ${nathonnathaBala === null ? "is unavailable" : `uses Meeus-corrected local apparent time (${nathonnathaBala.toFixed(2)})`}; Paksha ${pakshaBala === null ? "is unavailable" : `uses the ${pakshaResult.details?.moonNatureRule} / ${pakshaResult.details?.moonAccountingRule} profile (${pakshaBala.toFixed(2)} Virupas)`}. Other Kala components still include provisional values.`,
    };
  }

  public calculateCheshtaBala(planet: string, input: ShadbalaChartInput): CheshtaBalaResult {
    const pPos = input.planets[planet];
    const isRetro = pPos?.isRetrograde ?? false;
    const dailyMotion = pPos?.dailyMotion ?? pPos?.speed;

    if (planet === "Moon") {
      const paksha = calculatePakshaBala("Moon", input);
      if (!paksha.available) {
        return {
          points: 0,
          motion: 0,
          isRetrograde: false,
          state: "Unavailable (motion not supplied)",
          available: false,
          description: "Moon Cheshta Bala is unavailable because BPHS 27.18 identifies it with Paksha Bala, which requires valid Sun and Moon longitudes.",
        };
      }
      const accountingRule = input.pakshaMoonAccountingRule ?? "bphs-kala-plus-cheshta";
      return {
        points: accountingRule === "bphs-kala-plus-cheshta" ? paksha.points : 0,
        motion: 0,
        isRetrograde: false,
        state: "Samanya (Direct)",
        available: true,
        description: accountingRule === "bphs-kala-plus-cheshta"
          ? `BPHS 27.18: Moon Cheshta Bala equals its Paksha Bala (${paksha.points.toFixed(2)} Virupas), complementing the undoubled Kala component.`
          : "Raman Chapter V / Example 56: Moon Paksha is doubled within Kala; no separate Moon Cheshta row is added in that worked accounting profile.",
      };
    }

    if (planet === "Sun") {
      return {
        points: 45.0,
        motion: 1.0,
        isRetrograde: false,
        state: "Samanya (Direct)",
        available: true,
        description: "Sun uses a provisional motional-strength constant; the source-specific Ayana Bala equivalence and accounting profile remain to be implemented.",
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
    const degreeStrengthVariant = input.drishtiVirupaVariant ?? "bphs-verse-special-formula";
    const fullAspectReading = input.drikFullAspectReading ?? "added-to-quarter";
    const mercuryAssociationRule = input.drikMercuryAssociationRule ?? "same-sign";
    const missingPlanetInputs = ShadbalaEngine.PLANETS.filter(
      (name) => !input.planets[name]
    );

    const unavailable = (missing: string[], reason: string): DrikBalaResult => ({
      points: 0,
      drishtiPinda: 0,
      beneficDrishtiPinda: 0,
      maleficDrishtiPinda: 0,
      aspects: [],
      available: false,
      missingPlanetInputs: missing,
      degreeStrengthVariant,
      fullAspectReading,
      mercuryAssociationRule,
      description: reason,
    });

    if (!ShadbalaEngine.PLANETS.includes(planet)) {
      throw new RangeError(`Drik Bala is defined here only for the seven classical planets; received ${planet}.`);
    }
    if (mercuryAssociationRule === "degree-orb") {
      const orb = input.drikMercuryAssociationOrbDeg;
      if (!Number.isFinite(orb) || (orb as number) < 0 || (orb as number) > 30) {
        throw new RangeError("Degree-orb Mercury association requires a finite orb from 0° through 30°.");
      }
    }

    const allLongitudes = Object.entries(input.planets);
    allLongitudes.forEach(([name, position]) => {
      if (!Number.isFinite(position.longitude) ||
          position.longitude < 0 || position.longitude >= 360) {
        throw new RangeError(`Drik Bala requires normalized [0°, 360°) longitude for ${name}.`);
      }
    });

    const targetPos = input.planets[planet];
    if (!targetPos) {
      return unavailable(missingPlanetInputs, `Drik Bala unavailable: target position for ${planet} is missing.`);
    }
    if (missingPlanetInputs.length > 0) {
      return unavailable(
        missingPlanetInputs,
        `Drik Bala unavailable: the seven-graha chart is missing ${missingPlanetInputs.join(", ")}; no partial aspect total is substituted.`
      );
    }

    const normalizedAngle = (value: number) => ((value % 360) + 360) % 360;
    const moonLongitude = input.planets.Moon.longitude;
    const sunLongitude = input.planets.Sun.longitude;
    const moonElongation = normalizedAngle(moonLongitude - sunLongitude);
    // BPHS Ch.3 classifies the waxing Moon as benefic and the waning Moon as
    // malefic. At New Moon (0°) the Moon is treated as waning/malefic.
    const isWaxingMoon = moonElongation > 0 && moonElongation <= 180;

    const isMaleficPlanet = (name: string): boolean => {
      if (name === "Sun" || name === "Mars" || name === "Saturn" || name === "Rahu" || name === "Ketu") {
        return true;
      }
      if (name === "Moon") return !isWaxingMoon;
      return false;
    };

    const isMercuryMalefic = (): boolean => {
      const mercury = input.planets.Mercury;
      const associatedMalefics = ["Sun", "Moon", "Mars", "Saturn", "Rahu", "Ketu"]
        .filter((name) => input.planets[name] && isMaleficPlanet(name));
      return associatedMalefics.some((name) => {
        const other = input.planets[name];
        const separation = Math.min(
          normalizedAngle(other.longitude - mercury.longitude),
          normalizedAngle(mercury.longitude - other.longitude)
        );
        if (mercuryAssociationRule === "same-sign") {
          return Math.floor(other.longitude / 30) === Math.floor(mercury.longitude / 30);
        }
        return separation <= (input.drikMercuryAssociationOrbDeg as number);
      });
    };

    const getNature = (name: string): "Benefic" | "Malefic" => {
      if (name === "Mercury") return isMercuryMalefic() ? "Malefic" : "Benefic";
      if (name === "Moon") return isWaxingMoon ? "Benefic" : "Malefic";
      return isMaleficPlanet(name) ? "Malefic" : "Benefic";
    };

    const aspectsList: DrikBalaAspect[] = [];
    let drishtiPinda = 0;
    let beneficDrishtiPinda = 0;
    let maleficDrishtiPinda = 0;

    for (const otherPlanet of ShadbalaEngine.PLANETS) {
      if (otherPlanet === planet) continue;
      const otherPos = input.planets[otherPlanet];
      // Direction is important: BPHS 26.6-8 defines aspected minus aspecting.
      const angle = normalizedAngle(targetPos.longitude - otherPos.longitude);
      const rawVirupas = calculateLongitudeDrishtiVirupas(
        angle,
        otherPlanet,
        degreeStrengthVariant
      );
      if (rawVirupas <= 0) continue;

      const nature = getNature(otherPlanet);
      const sign = nature === "Benefic" ? 1 : -1;
      const quarterVirupas = sign * rawVirupas / 4;
      const isFullAspectPlanet = otherPlanet === "Mercury" || otherPlanet === "Jupiter";
      let fullAspectVirupas = 0;

      if (isFullAspectPlanet) {
        if (fullAspectReading === "added-to-quarter") {
          fullAspectVirupas = sign * rawVirupas;
        } else if (fullAspectReading === "in-place-of-quarter") {
          fullAspectVirupas = sign * rawVirupas;
        }
      }
      const quarterContribution =
        isFullAspectPlanet && fullAspectReading === "in-place-of-quarter"
          ? 0
          : quarterVirupas;
      const netVirupas = quarterContribution + fullAspectVirupas;

      if (nature === "Benefic") beneficDrishtiPinda += rawVirupas;
      else maleficDrishtiPinda += rawVirupas;
      drishtiPinda += sign * rawVirupas;

      aspectsList.push({
        aspectingPlanet: otherPlanet,
        nature,
        angle: Math.round(angle * 1000) / 1000,
        rawVirupas: Math.round(rawVirupas * 100) / 100,
        quarterVirupas: Math.round(quarterContribution * 100) / 100,
        fullAspectVirupas: Math.round(fullAspectVirupas * 100) / 100,
        virupas: Math.round(netVirupas * 100) / 100,
      });
    }

    const points = aspectsList.reduce((sum, aspect) => sum + aspect.virupas, 0);
    const roundedPoints = Math.round(points * 100) / 100;
    const roundedPinda = Math.round(drishtiPinda * 100) / 100;
    return {
      points: roundedPoints,
      drishtiPinda: roundedPinda,
      beneficDrishtiPinda: Math.round(beneficDrishtiPinda * 100) / 100,
      maleficDrishtiPinda: Math.round(maleficDrishtiPinda * 100) / 100,
      aspects: aspectsList,
      available: true,
      missingPlanetInputs: [],
      degreeStrengthVariant,
      fullAspectReading,
      mercuryAssociationRule,
      description:
        `Drik Bala ${roundedPoints} Virupas from signed Drishti Pinda ${roundedPinda}; waxing/waning Moon and Mercury association are evaluated with the ${mercuryAssociationRule} rule. Degree curve: ${degreeStrengthVariant}; Mercury/Jupiter 27.19 reading: ${fullAspectReading}.`,
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
