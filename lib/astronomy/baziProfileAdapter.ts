import type { BaZiChart, Pillar } from "./baziEngine";
import {
  ANIMAL_PROFILES,
  COMPATIBILITY_TABLE,
  EARTHLY_BRANCHES,
  HEAVENLY_STEMS,
  type BaZiProfile,
  type PillarData,
} from "./chinese";

/**
 * Adapts the active astronomical BaZi engine output to the existing view model.
 * This keeps the UI contract stable while ensuring displayed pillars and
 * element analysis come from CompleteBaZiEngine rather than the legacy
 * approximate-date calculator.
 */
export function createBaZiProfileFromChart(chart: BaZiChart): BaZiProfile {
  const toPillarData = (pillar: Pillar): PillarData => {
    const stem = HEAVENLY_STEMS[pillar.heavenlyStem.index];
    const branch = EARTHLY_BRANCHES[pillar.earthlyBranch.index];
    if (!stem || !branch) {
      throw new RangeError("BaZi engine returned an invalid stem or branch index.");
    }
    return {
      pillarName: pillar.position,
      stem,
      branch,
      combinedName: pillar.combinedName,
      significance: pillar.significance,
    };
  };

  const yearPillar = toPillarData(chart.pillars.year);
  const monthPillar = toPillarData(chart.pillars.month);
  const dayPillar = toPillarData(chart.pillars.day);
  const hourPillar = toPillarData(chart.pillars.hour);

  const dayStem = HEAVENLY_STEMS[chart.dayMaster.stem.index];
  if (!dayStem) {
    throw new RangeError("BaZi engine returned an invalid Day Master stem index.");
  }

  const elementTotal = Object.values(chart.elementBalance).reduce(
    (sum, value) => sum + value,
    0
  );
  const toPercent = (value: number) =>
    elementTotal > 0 ? Math.round((value / elementTotal) * 100) : 0;

  const polarityTotal = chart.yinYangRatio.yang + chart.yinYangRatio.yin;
  const animal = chart.pillars.year.earthlyBranch.animal;
  const compatibility = COMPATIBILITY_TABLE[animal];
  const strength =
    chart.dayMaster.strengthLabel === "Strong" ||
    chart.dayMaster.strengthLabel === "Slightly Strong"
      ? "Strong"
      : chart.dayMaster.strengthLabel === "Weak" ||
          chart.dayMaster.strengthLabel === "Slightly Weak"
        ? "Weak"
        : "Balanced";

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    dayMaster: {
      stem: dayStem,
      symbol: chart.dayMaster.deityArchetype,
      nature: chart.dayMaster.temperament,
      strength,
      favorableElements: chart.dayMaster.favorableElements,
      unfavorableElements: chart.dayMaster.unfavorableElements,
    },
    zodiacAnimal: animal,
    animalCharacteristics:
      ANIMAL_PROFILES[animal] ??
      "Traditional Chinese zodiac-animal interpretation is not available for this branch.",
    elementsBalance: {
      Wood: toPercent(chart.elementBalance.Wood),
      Fire: toPercent(chart.elementBalance.Fire),
      Earth: toPercent(chart.elementBalance.Earth),
      Metal: toPercent(chart.elementBalance.Metal),
      Water: toPercent(chart.elementBalance.Water),
    },
    yinYangRatio: {
      yang:
        polarityTotal > 0
          ? Math.round((chart.yinYangRatio.yang / polarityTotal) * 100)
          : 0,
      yin:
        polarityTotal > 0
          ? Math.round((chart.yinYangRatio.yin / polarityTotal) * 100)
          : 0,
    },
    compatibilities: {
      sanHeTrine: compatibility?.trines ?? [],
      liuHeFriend: compatibility?.secretFriend ?? "Not available",
      clashSign: compatibility?.clash ?? "Not available",
      description: compatibility
        ? `${animal} traditional zodiac compatibility associations.`
        : "Traditional zodiac compatibility data is not available.",
    },
    ...(chart.calculationContext
      ? {
          calculationContext: {
            birthTimeKnown: chart.calculationContext.birthTimeKnown,
            utcInstantIso: chart.calculationContext.utcInstantIso,
            timeBasis: chart.calculationContext.timeBasis,
            dayBoundaryPolicy: chart.calculationContext.dayBoundaryPolicy,
            solarClockIso: chart.calculationContext.solarClockIso,
            longitudeDegrees: chart.calculationContext.longitudeDegrees,
            civilUtcOffsetSeconds:
              chart.calculationContext.civilUtcOffsetSeconds,
            uncertainPillars: chart.calculationContext.uncertainPillars,
            warnings: chart.calculationContext.warnings,
          },
        }
      : {}),
  };
}
