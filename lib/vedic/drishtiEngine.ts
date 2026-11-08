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
  aspectType: "7th (Universal)" | "4th (Mars Special)" | "8th (Mars Special)" | "5th (Jupiter/Nodes Special)" | "9th (Jupiter/Nodes Special)" | "3rd (Saturn Special)" | "10th (Saturn Special)" | "Partial";
  strengthVirupas: number; // 0 to 60 (60 = 100% full aspect)
  strengthPercent: number; // 0 to 100%
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
}

const BENEFIC_PLANETS = new Set(["Jupiter", "Venus", "Mercury", "Moon"]);
const MALEFIC_PLANETS = new Set(["Saturn", "Mars", "Rahu", "Ketu", "Sun"]);

/**
 * Calculates continuous Drishti Pinda (Virupas 0 to 60) based on angular distance
 */
export function calculateDrishtiVirupas(diffDeg: number, planetName: string, houseOffset: number): number {
  const normDiff = ((diffDeg % 360) + 360) % 360;

  // Exact 7th aspect (180°) is full (60 Virupas)
  if (houseOffset === 7) return 60;

  // Mars Special: 4th (90°) and 8th (210°)
  if (planetName === "Mars" && (houseOffset === 4 || houseOffset === 8)) return 60;

  // Jupiter & Rahu/Ketu Special: 5th (120°) and 9th (240°)
  if (["Jupiter", "Rahu", "Ketu"].includes(planetName) && (houseOffset === 5 || houseOffset === 9)) return 60;

  // Saturn Special: 3rd (60°) and 10th (270°)
  if (planetName === "Saturn" && (houseOffset === 3 || houseOffset === 10)) return 60;

  // Classical partial aspects
  if (houseOffset === 3 || houseOffset === 10) return planetName === "Saturn" ? 60 : 15; // 1/4 aspect for others
  if (houseOffset === 5 || houseOffset === 9) return ["Jupiter", "Rahu", "Ketu"].includes(planetName) ? 60 : 30; // 1/2 aspect for others
  if (houseOffset === 4 || houseOffset === 8) return planetName === "Mars" ? 60 : 45; // 3/4 aspect for others

  return 0;
}

/**
 * Classical Jaimini Rashi Drishti rules
 */
export function getJaiminiAspectedSigns(signIndex: number): number[] {
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
  house: number;
  rasiIndex: number;
  rasiName: string;
}

export function calculateDrishtiMatrix(
  planets: DrishtiPlanetInput[],
  ascendantSignIndex: number
): DrishtiMatrixReport {
  const grahaAspects: GrahaAspect[] = [];
  const aspectedByPlanet: Record<string, GrahaAspect[]> = {};
  const aspectedTargetPlanet: Record<string, GrahaAspect[]> = {};
  const houseAspectTotals: Record<number, { beneficScore: number; maleficScore: number; netScore: number; aspectingPlanets: string[] }> = {};

  for (let h = 1; h <= 12; h++) {
    houseAspectTotals[h] = { beneficScore: 0, maleficScore: 0, netScore: 0, aspectingPlanets: [] };
  }

  // 1. Calculate Parashari Graha Drishti
  planets.forEach((p1) => {
    aspectedByPlanet[p1.name] = [];
    const p1House = p1.house;
    const isBenefic = BENEFIC_PLANETS.has(p1.name);

    // Check all 12 houses relative to p1
    for (let offset = 1; offset <= 12; offset++) {
      if (offset === 1) continue; // Same house is conjunction, not aspect

      const targetHouse = ((p1House + offset - 2) % 12) + 1;
      const targetSignIdx = ((p1.rasiIndex + offset - 1) % 12);
      const targetSign = VEDIC_RASIS[targetSignIdx].name;

      let aspectType: GrahaAspect["aspectType"] | null = null;

      if (offset === 7) {
        aspectType = "7th (Universal)";
      } else if (p1.name === "Mars" && offset === 4) {
        aspectType = "4th (Mars Special)";
      } else if (p1.name === "Mars" && offset === 8) {
        aspectType = "8th (Mars Special)";
      } else if (["Jupiter", "Rahu", "Ketu"].includes(p1.name) && offset === 5) {
        aspectType = "5th (Jupiter/Nodes Special)";
      } else if (["Jupiter", "Rahu", "Ketu"].includes(p1.name) && offset === 9) {
        aspectType = "9th (Jupiter/Nodes Special)";
      } else if (p1.name === "Saturn" && offset === 3) {
        aspectType = "3rd (Saturn Special)";
      } else if (p1.name === "Saturn" && offset === 10) {
        aspectType = "10th (Saturn Special)";
      }

      if (aspectType) {
        const virupas = calculateDrishtiVirupas(offset * 30, p1.name, offset);
        const percent = Math.round((virupas / 60) * 100);

        // Find target planets in that house
        const targetPlanets = planets.filter((tp) => tp.house === targetHouse && tp.name !== p1.name);

        if (targetPlanets.length > 0) {
          targetPlanets.forEach((tp) => {
            const aspectObj: GrahaAspect = {
              aspectingPlanet: p1.name,
              aspectedPlanet: tp.name,
              aspectedHouse: targetHouse,
              aspectedSign: targetSign,
              aspectedSignIndex: targetSignIdx,
              aspectType: aspectType!,
              strengthVirupas: virupas,
              strengthPercent: percent,
              nature: isBenefic ? "Benefic" : "Malefic",
              description: `${p1.name} casts full ${aspectType} on ${tp.name} in House ${targetHouse} (${targetSign}).`,
            };

            grahaAspects.push(aspectObj);
            aspectedByPlanet[p1.name].push(aspectObj);

            if (!aspectedTargetPlanet[tp.name]) aspectedTargetPlanet[tp.name] = [];
            aspectedTargetPlanet[tp.name].push(aspectObj);
          });
        } else {
          // Empty house aspected
          const aspectObj: GrahaAspect = {
            aspectingPlanet: p1.name,
            aspectedHouse: targetHouse,
            aspectedSign: targetSign,
            aspectedSignIndex: targetSignIdx,
            aspectType: aspectType!,
            strengthVirupas: virupas,
            strengthPercent: percent,
            nature: isBenefic ? "Benefic" : "Malefic",
            description: `${p1.name} casts ${aspectType} onto House ${targetHouse} (${targetSign}).`,
          };

          grahaAspects.push(aspectObj);
          aspectedByPlanet[p1.name].push(aspectObj);
        }

        // Tally on house
        if (isBenefic) {
          houseAspectTotals[targetHouse].beneficScore += virupas;
        } else {
          houseAspectTotals[targetHouse].maleficScore += virupas;
        }
        houseAspectTotals[targetHouse].netScore =
          houseAspectTotals[targetHouse].beneficScore - houseAspectTotals[targetHouse].maleficScore;
        if (!houseAspectTotals[targetHouse].aspectingPlanets.includes(p1.name)) {
          houseAspectTotals[targetHouse].aspectingPlanets.push(p1.name);
        }
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
  };
}
