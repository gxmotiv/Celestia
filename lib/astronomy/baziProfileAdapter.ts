import {
  BaZiCalculationOptions,
  BaZiChart,
  CompleteBaZiEngine,
  Pillar,
} from "./baziEngine";
import {
  ANIMAL_PROFILES,
  BaZiProfile,
  COMPATIBILITY_TABLE,
  DAY_MASTER_NATURE,
  EARTHLY_BRANCHES as DISPLAY_BRANCHES,
  HEAVENLY_STEMS as DISPLAY_STEMS,
  PillarData,
} from "./chinese";

function toDisplayPillar(pillar: Pillar): PillarData {
  const stem = DISPLAY_STEMS.find((item) => item.name === pillar.heavenlyStem.name);
  const branch = DISPLAY_BRANCHES.find((item) => item.name === pillar.earthlyBranch.name);
  if (!stem || !branch) {
    throw new Error("BaZi engine returned an unknown stem or branch: " + pillar.combinedName);
  }
  return {
    pillarName: pillar.position,
    stem,
    branch,
    combinedName: pillar.combinedName,
    significance: pillar.significance,
  };
}

function percentagesFromBalance(balance: BaZiChart["elementBalance"]): BaZiProfile["elementsBalance"] {
  const keys = ["Wood", "Fire", "Earth", "Metal", "Water"] as const;
  const total = keys.reduce((sum, key) => sum + balance[key], 0);
  if (!(total > 0)) {
    return { Wood: 20, Fire: 20, Earth: 20, Metal: 20, Water: 20 };
  }

  const parts = keys.map((key) => {
    const exact = balance[key] / total * 100;
    return { key, value: Math.floor(exact), remainder: exact - Math.floor(exact) };
  });
  let remaining = 100 - parts.reduce((sum, item) => sum + item.value, 0);
  parts.sort((a, b) => b.remainder - a.remainder);
  for (let index = 0; index < remaining; index++) parts[index].value += 1;
  return Object.fromEntries(parts.map((item) => [item.key, item.value])) as BaZiProfile["elementsBalance"];
}

/**
 * Adapt the calculation engine's output to the existing ChineseView presentation
 * contract. This does not perform a second calculation or use the legacy date-cutoff
 * algorithm in chinese.ts.
 */
export function adaptBaZiChartToProfile(chart: BaZiChart): BaZiProfile {
  const yearPillar = toDisplayPillar(chart.pillars.year);
  const monthPillar = toDisplayPillar(chart.pillars.month);
  const dayPillar = toDisplayPillar(chart.pillars.day);
  const hourPillar = toDisplayPillar(chart.pillars.hour);
  const dayMasterStem = DISPLAY_STEMS.find((item) => item.name === chart.dayMaster.stem.name);
  if (!dayMasterStem) throw new Error("BaZi engine returned an unknown Day Master stem.");

  const nature = DAY_MASTER_NATURE[dayMasterStem.name];
  const zodiacAnimal = chart.pillars.year.earthlyBranch.animal;
  const compatibility = COMPATIBILITY_TABLE[zodiacAnimal] ?? {
    trines: [],
    secretFriend: "Not defined",
    clash: "Not defined",
  };
  const yinYangValues = [
    chart.pillars.year.heavenlyStem.yinYang, chart.pillars.year.earthlyBranch.yinYang,
    chart.pillars.month.heavenlyStem.yinYang, chart.pillars.month.earthlyBranch.yinYang,
    chart.pillars.day.heavenlyStem.yinYang, chart.pillars.day.earthlyBranch.yinYang,
    chart.pillars.hour.heavenlyStem.yinYang, chart.pillars.hour.earthlyBranch.yinYang,
  ];
  const yangCount = yinYangValues.filter((value) => value === "Yang").length;
  const yinCount = yinYangValues.length - yangCount;
  const personality = chart.personalityInterpretation;

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    dayMaster: {
      stem: dayMasterStem,
      symbol: nature?.symbol ?? chart.dayMaster.deityArchetype,
      nature: nature?.nature ?? chart.dayMaster.temperament,
      strength: chart.dayMaster.strengthLabel,
      favorableElements: chart.dayMaster.favorableElements,
      unfavorableElements: chart.dayMaster.unfavorableElements,
    },
    zodiacAnimal,
    animalCharacteristics: ANIMAL_PROFILES[zodiacAnimal] ?? "",
    elementsBalance: percentagesFromBalance(chart.elementBalance),
    yinYangRatio: {
      yang: Math.round(yangCount / yinYangValues.length * 100),
      yin: Math.round(yinCount / yinYangValues.length * 100),
    },
    compatibilities: {
      sanHeTrine: compatibility.trines,
      liuHeFriend: compatibility.secretFriend,
      clashSign: compatibility.clash,
      description: "The compatibility labels are traditional branch relationships, not empirical relationship predictions.",
    },
    ...(chart.calculationContext ? { calculationContext: chart.calculationContext } : {}),
  };
}

/**
 * Generate the live BaZi profile from an authoritative UTC instant and explicit
 * local/solar-clock settings, then adapt it for the existing UI.
 */
export function calculateBaZiProfileFromInstant(
  birthInstantUtc: Date,
  options: BaZiCalculationOptions,
  gender: "Male" | "Female" = "Male",
): BaZiProfile {
  const chart = new CompleteBaZiEngine().generateBaZiChart(
    birthInstantUtc,
    gender,
    new Date(),
    options,
  );
  return adaptBaZiChartToProfile(chart);
}
