/**
 * Classical Vedic Drishti (Aspects) Engine
 * Brihat Parashara Hora Shastra & Jaimini Upadesha Sutras
 * 
 * Computes:
 * 1. Parashari Graha Drishti (Planetary Aspects with Special Aspects & Drishti Pinda in Virupas 0-60)
 * 2. Jaimini Rashi Drishti (Sign Aspects between Movable, Fixed, and Dual signs)
 * 3. Mutual Aspects (Paraspara Drishti) & Benefic/Malefic Aspectual Balances
 * 4. Coordinate mapping for visual SVG ray overlays on North & South Indian Kundli
 */

import { VEDIC_RASIS } from "@/lib/astronomy/vedic";

export interface GrahaAspect {
  aspectingPlanet: string;
  aspectedPlanet?: string;
  aspectedHouse: number; // 1 to 12
  aspectedSign: string;
  aspectedSignIndex: number;
  aspectType:
    | "3rd (Quarter)"
    | "4th (Three-Quarter)"
    | "5th (Half)"
    | "7th (Universal)"
    | "8th (Three-Quarter)"
    | "9th (Half)"
    | "10th (Quarter)"
    | "4th (Mars Special)"
    | "8th (Mars Special)"
    | "5th (Jupiter Special)"
    | "9th (Jupiter Special)"
    | "3rd (Saturn Special)"
    | "10th (Saturn Special)"
    | "5th (Node 5/7/9 Special — later convention)"
    | "7th (Node 7th-only — later convention)"
    | "9th (Node 5/7/9 Special — later convention)";
  /** Whole-sign BPHS graded aspect: 15, 30, 45 or 60 Virupas. */
  strengthVirupas: number;
  /** Whole-sign aspect grade as a percentage of 60 Virupas. */
  strengthPercent: number;
  /** Exact-longitude Drishti Pinda to the target planet, when one is present. */
  degreeStrengthVirupas?: number;
  degreeStrengthPercent?: number;
  /** Declares the longitude-strength interpretation used for this report. */
  degreeStrengthVariant?: DrishtiVirupaVariant;
  nature: "Benefic" | "Malefic" | "Neutral";
  description: string;
}

export interface MutualAspect {
  planet1: string;
  planet2: string;
  house1: number;
  house2: number;
  sign1: string;
  sign2: string;
  aspectType1To2: string;
  aspectType2To1: string;
  quality: "Auspicious Sambandha" | "Challenging Friction" | "Transformative Matrix";
  description: string;
}

export interface RashiDrishtiInfo {
  signIndex: number; // 0 to 11
  signName: string;
  signSanskrit: string;
  modality: "Movable (Chara)" | "Fixed (Sthira)" | "Dual (Dwisvabhava)";
  aspectedSigns: {
    signIndex: number;
    signName: string;
    signSanskrit: string;
    planetsPresent: string[];
  }[];
  planetsCastingDrishti: string[];
  description: string;
}

export interface DrishtiMatrixReport {
  grahaAspects: GrahaAspect[];
  aspectedByPlanet: Record<string, GrahaAspect[]>; // Keyed by aspecting planet
  aspectedTargetPlanet: Record<string, GrahaAspect[]>; // Keyed by target planet
  mutualAspects: MutualAspect[];
  rashiDrishtis: RashiDrishtiInfo[];
  houseAspectTotals: Record<number, { beneficScore: number; maleficScore: number; netScore: number; aspectingPlanets: string[] }>;
  grahaAspectPolicy: "bphs-chapter-26-seven-grahas";
  nodeAspectRule: NodeAspectRule;
  degreeStrengthVariant: DrishtiVirupaVariant;
}

const BENEFIC_PLANETS = new Set(["Jupiter", "Venus", "Mercury", "Moon"]);
const MALEFIC_PLANETS = new Set(["Saturn", "Mars", "Rahu", "Ketu", "Sun"]);

export type NodeAspectRule = "none" | "seventh-only" | "fifth-seventh-ninth";
export type DrishtiVirupaVariant = "bphs-base-longitude-curve" | "bphs-translator-special-adjustments";

export interface DrishtiMatrixOptions {
  /** BPHS does not explicitly settle node aspects; default is no nodal Graha Drishti. */
  nodeAspectRule?: NodeAspectRule;
  /** The latter variant applies the commonly printed translator-note boosts for Mars/Jupiter/Saturn. */
  degreeStrengthVariant?: DrishtiVirupaVariant;
}

/**
 * Exact-longitude Drishti Pinda curve from BPHS Ch. 26, vv. 6–8.
 *
 * The angle is measured forward from the aspecting graha to the aspected
 * point. The optional translator-note variant applies the Mars/Jupiter/Saturn
 * special-aspect boosts commonly printed with the Santhanam/Kapoor edition.
 * It is kept separate because the notes/editions are not identical.
 */
export function calculateLongitudeDrishtiVirupas(
  diffDeg: number,
  planetName: string,
  variant: DrishtiVirupaVariant = "bphs-translator-special-adjustments"
): number {
  if (!Number.isFinite(diffDeg)) {
    throw new RangeError("Drishti longitude difference must be finite.");
  }
  const angle = ((diffDeg % 360) + 360) % 360;
  let value = 0;

  if (angle < 30 || angle >= 300) value = 0;
  else if (angle < 60) value = (angle - 30) / 2;
  else if (angle < 90) value = angle - 45;
  else if (angle < 120) value = (120 - angle) / 2 + 30;
  else if (angle < 150) value = 150 - angle;
  else if (angle < 180) value = 2 * (angle - 150);
  else value = (300 - angle) / 2;

  if (variant === "bphs-translator-special-adjustments") {
    // Translator-note special increases: Mars +15, Jupiter +30, Saturn +45
    // in their respective special-aspect angular bands.
    if (planetName === "Mars" &&
        ((angle >= 90 && angle < 120) || (angle >= 210 && angle < 240))) {
      value += 15;
    } else if (planetName === "Jupiter" &&
        ((angle >= 120 && angle < 150) || (angle >= 240 && angle < 270))) {
      value += 30;
    } else if (planetName === "Saturn" &&
        ((angle >= 60 && angle < 90) || (angle >= 270 && angle < 300))) {
      value += 45;
    }
  }

  return Math.max(0, Math.min(60, value));
}

/**
 * Compatibility wrapper. The houseOffset argument is intentionally ignored:
 * exact Drishti Pinda is a function of angular separation, not a fixed house
 * offset. New code should call calculateLongitudeDrishtiVirupas directly.
 */
export function calculateDrishtiVirupas(
  diffDeg: number,
  planetName: string,
  _houseOffset?: number,
  variant: DrishtiVirupaVariant = "bphs-translator-special-adjustments"
): number {
  return calculateLongitudeDrishtiVirupas(diffDeg, planetName, variant);
}

/** Whole-sign Graha Drishti grades from BPHS Ch. 26, vv. 2–5. */
export function calculateSignDrishtiVirupas(
  planetName: string,
  signOffset: number,
  nodeAspectRule: NodeAspectRule = "none"
): number {
  if (!Number.isInteger(signOffset) || signOffset < 1 || signOffset > 12) {
    throw new RangeError("Graha Drishti sign offset must be an integer from 1 through 12.");
  }

  if (planetName === "Rahu" || planetName === "Ketu") {
    if (nodeAspectRule === "none") return 0;
    if (nodeAspectRule === "seventh-only") return signOffset === 7 ? 60 : 0;
    return [5, 7, 9].includes(signOffset) ? 60 : 0;
  }

  if (signOffset === 7) return 60;
  if ((planetName === "Mars") && (signOffset === 4 || signOffset === 8)) return 60;
  if ((planetName === "Jupiter") && (signOffset === 5 || signOffset === 9)) return 60;
  if ((planetName === "Saturn") && (signOffset === 3 || signOffset === 10)) return 60;
  if (signOffset === 3 || signOffset === 10) return 15;
  if (signOffset === 5 || signOffset === 9) return 30;
  if (signOffset === 4 || signOffset === 8) return 45;
  return 0;
}

function getGrahaAspectType(
  planetName: string,
  signOffset: number,
  nodeAspectRule: NodeAspectRule
): GrahaAspect["aspectType"] | null {
  const strength = calculateSignDrishtiVirupas(planetName, signOffset, nodeAspectRule);
  if (strength === 0) return null;

  if (planetName === "Rahu" || planetName === "Ketu") {
    if (signOffset === 7) return "7th (Node 7th-only — later convention)";
    return signOffset === 5
      ? "5th (Node 5/7/9 Special — later convention)"
      : "9th (Node 5/7/9 Special — later convention)";
  }

  if (planetName === "Mars" && (signOffset === 4 || signOffset === 8)) {
    return signOffset === 4 ? "4th (Mars Special)" : "8th (Mars Special)";
  }
  if (planetName === "Jupiter" && (signOffset === 5 || signOffset === 9)) {
    return signOffset === 5 ? "5th (Jupiter Special)" : "9th (Jupiter Special)";
  }
  if (planetName === "Saturn" && (signOffset === 3 || signOffset === 10)) {
    return signOffset === 3 ? "3rd (Saturn Special)" : "10th (Saturn Special)";
  }
  if (signOffset === 3) return "3rd (Quarter)";
  if (signOffset === 4) return "4th (Three-Quarter)";
  if (signOffset === 5) return "5th (Half)";
  if (signOffset === 7) return "7th (Universal)";
  if (signOffset === 8) return "8th (Three-Quarter)";
  if (signOffset === 9) return "9th (Half)";
  if (signOffset === 10) return "10th (Quarter)";
  return null;
}

/**
 * Classical Jaimini Rashi Drishti rules
 */
export function getJaiminiAspectedSigns(signIndex: number): number[] {
  if (!Number.isInteger(signIndex) || signIndex < 0 || signIndex > 11) {
    throw new RangeError("Jaimini Rashi Drishti requires a sign index from 0 through 11.");
  }
  const modality = signIndex % 3; // 0 = Movable, 1 = Fixed, 2 = Dual

  if (modality === 0) {
    // Chara (Movable: Aries 0, Cancer 3, Libra 6, Cap 9)
    // Aspects all Fixed signs EXCEPT the adjacent one
    const adjacentFixed = (signIndex + 1) % 12;
    const allFixed = [1, 4, 7, 10]; // Taurus, Leo, Scorpio, Aquarius
    return allFixed.filter((idx) => idx !== adjacentFixed);
  } else if (modality === 1) {
    // Sthira (Fixed: Taurus 1, Leo 4, Scorpio 7, Aquarius 10)
    // Aspects all Movable signs EXCEPT the adjacent one behind it
    const adjacentMovable = (signIndex + 11) % 12;
    const allMovable = [0, 3, 6, 9]; // Aries, Cancer, Libra, Capricorn
    return allMovable.filter((idx) => idx !== adjacentMovable);
  } else {
    // Dwisvabhava (Dual: Gemini 2, Virgo 5, Sag 8, Pisces 11)
    // Aspects all other Dual signs
    const allDual = [2, 5, 8, 11];
    return allDual.filter((idx) => idx !== signIndex);
  }
}

export interface DrishtiPlanetInput {
  name: string;
  /** Exact sidereal longitude in degrees, normalized to [0, 360). */
  siderealLongitude: number;
  house: number;
  rasiIndex: number;
  rasiName: string;
}

export function calculateDrishtiMatrix(
  planets: DrishtiPlanetInput[],
  ascendantSignIndex: number,
  options: DrishtiMatrixOptions = {}
): DrishtiMatrixReport {
  if (!Array.isArray(planets)) {
    throw new TypeError("Graha Drishti requires a planetary position array.");
  }
  if (!Number.isInteger(ascendantSignIndex) || ascendantSignIndex < 0 || ascendantSignIndex > 11) {
    throw new RangeError("Graha Drishti requires an Ascendant sign index from 0 through 11.");
  }

  const nodeAspectRule = options.nodeAspectRule ?? "none";
  const degreeStrengthVariant = options.degreeStrengthVariant ?? "bphs-translator-special-adjustments";
  const names = new Set<string>();
  planets.forEach((planet) => {
    if (!planet || typeof planet.name !== "string" || !planet.name.trim()) {
      throw new RangeError("Every Drishti position requires a planet name.");
    }
    if (names.has(planet.name)) {
      throw new RangeError("Duplicate Drishti position supplied for " + planet.name + ".");
    }
    names.add(planet.name);
    if (!Number.isFinite(planet.siderealLongitude) ||
        planet.siderealLongitude < 0 || planet.siderealLongitude >= 360 ||
        !Number.isInteger(planet.rasiIndex) || planet.rasiIndex < 0 || planet.rasiIndex > 11 ||
        planet.rasiIndex !== Math.floor(planet.siderealLongitude / 30) ||
        planet.rasiName !== VEDIC_RASIS[planet.rasiIndex].name ||
        !Number.isInteger(planet.house) || planet.house < 1 || planet.house > 12) {
      throw new RangeError("Drishti position for " + planet.name + " has inconsistent longitude, sign or house metadata.");
    }
  });

  const grahaAspects: GrahaAspect[] = [];
  const aspectedByPlanet: Record<string, GrahaAspect[]> = {};
  const aspectedTargetPlanet: Record<string, GrahaAspect[]> = {};
  const houseAspectTotals: Record<number, { beneficScore: number; maleficScore: number; netScore: number; aspectingPlanets: string[] }> = {};

  for (let house = 1; house <= 12; house += 1) {
    houseAspectTotals[house] = { beneficScore: 0, maleficScore: 0, netScore: 0, aspectingPlanets: [] };
  }

  // Whole-sign Graha Drishti is counted from the planet's Rasi, not its
  // Bhava-house number. The target sign is mapped back to a whole-sign house
  // from the supplied sidereal Ascendant sign.
  planets.forEach((source) => {
    aspectedByPlanet[source.name] = [];
    const isBenefic = BENEFIC_PLANETS.has(source.name);

    for (let signOffset = 2; signOffset <= 12; signOffset += 1) {
      const strengthVirupas = calculateSignDrishtiVirupas(
        source.name,
        signOffset,
        nodeAspectRule
      );
      if (strengthVirupas === 0) continue;

      const aspectType = getGrahaAspectType(source.name, signOffset, nodeAspectRule);
      if (!aspectType) continue;

      const targetSignIndex = (source.rasiIndex + signOffset - 1) % 12;
      const targetSign = VEDIC_RASIS[targetSignIndex].name;
      const targetHouse = ((targetSignIndex - ascendantSignIndex + 12) % 12) + 1;
      const targetPlanets = planets.filter(
        (target) => target.rasiIndex === targetSignIndex && target.name !== source.name
      );

      const makeAspect = (target?: DrishtiPlanetInput): GrahaAspect => {
        const degreeStrengthVirupas = target
          ? calculateLongitudeDrishtiVirupas(
              target.siderealLongitude - source.siderealLongitude,
              source.name,
              degreeStrengthVariant
            )
          : undefined;
        const degreeStrengthPercent = degreeStrengthVirupas === undefined
          ? undefined
          : Math.round((degreeStrengthVirupas / 60) * 100);

        return {
          aspectingPlanet: source.name,
          aspectedPlanet: target?.name,
          aspectedHouse: targetHouse,
          aspectedSign: targetSign,
          aspectedSignIndex: targetSignIndex,
          aspectType,
          strengthVirupas,
          strengthPercent: Math.round((strengthVirupas / 60) * 100),
          degreeStrengthVirupas,
          degreeStrengthPercent,
          degreeStrengthVariant: target ? degreeStrengthVariant : undefined,
          nature: isBenefic ? "Benefic" : "Malefic",
          description: target
            ? source.name + " casts " + aspectType + " on " + target.name +
              " in " + targetSign + " (House " + targetHouse + "); whole-sign grade " +
              strengthVirupas + " Virupas" +
              (degreeStrengthVirupas === undefined ? "" : ", exact-longitude " + degreeStrengthVirupas.toFixed(2) + " Virupas") + "."
            : source.name + " casts " + aspectType + " on " + targetSign +
              " (House " + targetHouse + ") at whole-sign grade " + strengthVirupas + " Virupas.",
        };
      };

      if (targetPlanets.length > 0) {
        targetPlanets.forEach((target) => {
          const aspect = makeAspect(target);
          grahaAspects.push(aspect);
          aspectedByPlanet[source.name].push(aspect);
          if (!aspectedTargetPlanet[target.name]) aspectedTargetPlanet[target.name] = [];
          aspectedTargetPlanet[target.name].push(aspect);
        });
      } else {
        const aspect = makeAspect();
        grahaAspects.push(aspect);
        aspectedByPlanet[source.name].push(aspect);
      }

      if (isBenefic) houseAspectTotals[targetHouse].beneficScore += strengthVirupas;
      else houseAspectTotals[targetHouse].maleficScore += strengthVirupas;
      houseAspectTotals[targetHouse].netScore =
        houseAspectTotals[targetHouse].beneficScore - houseAspectTotals[targetHouse].maleficScore;
      if (!houseAspectTotals[targetHouse].aspectingPlanets.includes(source.name)) {
        houseAspectTotals[targetHouse].aspectingPlanets.push(source.name);
      }
    }
  });

  // 2. Identify Mutual Aspects (Paraspara Drishti)
  const mutualAspects: MutualAspect[] = [];
  const checkedPairs = new Set<string>();

  planets.forEach((p1) => {
    planets.forEach((p2) => {
      if (p1.name === p2.name) return;
      const pairKey = [p1.name, p2.name].sort().join("-");
      if (checkedPairs.has(pairKey)) return;

      const p1AspectsP2 = grahaAspects.find(
        (a) => a.aspectingPlanet === p1.name && a.aspectedPlanet === p2.name
      );
      const p2AspectsP1 = grahaAspects.find(
        (a) => a.aspectingPlanet === p2.name && a.aspectedPlanet === p1.name
      );

      if (p1AspectsP2 && p2AspectsP1) {
        checkedPairs.add(pairKey);

        const bothBenefic = BENEFIC_PLANETS.has(p1.name) && BENEFIC_PLANETS.has(p2.name);
        const bothMalefic = MALEFIC_PLANETS.has(p1.name) && MALEFIC_PLANETS.has(p2.name);

        let quality: MutualAspect["quality"] = "Auspicious Sambandha";
        let desc = "";

        if (bothBenefic) {
          quality = "Auspicious Sambandha";
          desc = `Harmonious celestial resonance between ${p1.name} and ${p2.name}, multiplying wisdom, protection, and auspicious fortune.`;
        } else if (bothMalefic) {
          quality = "Challenging Friction";
          desc = `Intense energetic polarization between ${p1.name} and ${p2.name}, requiring patient discipline and remedial propitiation.`;
        } else {
          quality = "Transformative Matrix";
          desc = `Dynamic catalytic interaction between benefic and malefic planetary wills, driving worldly striving and spiritual grit.`;
        }

        mutualAspects.push({
          planet1: p1.name,
          planet2: p2.name,
          house1: p1.house,
          house2: p2.house,
          sign1: p1.rasiName,
          sign2: p2.rasiName,
          aspectType1To2: p1AspectsP2.aspectType,
          aspectType2To1: p2AspectsP1.aspectType,
          quality,
          description: desc,
        });
      }
    });
  });

  // 3. Jaimini Rashi Drishti (Sign Aspects)
  const rashiDrishtis: RashiDrishtiInfo[] = [];

  for (let s = 0; s < 12; s++) {
    const signObj = VEDIC_RASIS[s];
    const modality = s % 3 === 0 ? "Movable (Chara)" : s % 3 === 1 ? "Fixed (Sthira)" : "Dual (Dwisvabhava)";
    const targetSignIndices = getJaiminiAspectedSigns(s);

    const aspectedSigns = targetSignIndices.map((targetIdx) => {
      const targetObj = VEDIC_RASIS[targetIdx];
      const planetsInTarget = planets
        .filter((p) => p.rasiIndex === targetIdx)
        .map((p) => p.name);

      return {
        signIndex: targetIdx,
        signName: targetObj.name,
        signSanskrit: targetObj.sanskrit,
        planetsPresent: planetsInTarget,
      };
    });

    const planetsInThisSign = planets
      .filter((p) => p.rasiIndex === s)
      .map((p) => p.name);

    rashiDrishtis.push({
      signIndex: s,
      signName: signObj.name,
      signSanskrit: signObj.sanskrit,
      modality,
      aspectedSigns,
      planetsCastingDrishti: planetsInThisSign,
      description: `${signObj.name} (${modality}) casts Jaimini Rashi Drishti onto ${aspectedSigns.map((as) => as.signName).join(", ")}.`,
    });
  }

  return {
    grahaAspects,
    aspectedByPlanet,
    aspectedTargetPlanet,
    mutualAspects,
    rashiDrishtis,
    houseAspectTotals,
    grahaAspectPolicy: "bphs-chapter-26-seven-grahas",
    nodeAspectRule,
    degreeStrengthVariant,
  };
}
