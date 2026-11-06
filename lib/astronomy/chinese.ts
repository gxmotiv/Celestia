/**
 * Chinese Astrology & BaZi (Four Pillars of Destiny - 八字) Engine
 * Calculates Heavenly Stems, Earthly Branches, Four Pillars (Year, Month, Day, Hour),
 * Day Master analysis, Yin/Yang balance, Five Elements (Wu Xing) distribution,
 * Animal signs, Hidden Stems, and Trine/Clash compatibility.
 */

import { calculateJulianDay } from "./ephemeris";

export interface StemData {
  name: string;
  chinese: string;
  pinyin: string;
  element: "Wood" | "Fire" | "Earth" | "Metal" | "Water";
  polarity: "Yang" | "Yin";
  color: string;
}

export interface BranchData {
  name: string;
  chinese: string;
  pinyin: string;
  animal: string;
  element: "Wood" | "Fire" | "Earth" | "Metal" | "Water";
  polarity: "Yang" | "Yin";
  hiddenStems: string[]; // e.g. ["Jia", "Bing", "Wu"]
  color: string;
}

export interface PillarData {
  pillarName: "Year" | "Month" | "Day" | "Hour";
  stem: StemData;
  branch: BranchData;
  combinedName: string; // e.g. "Jia-Chen (Yang Wood Dragon)"
  significance: string;
}

export interface BaZiProfile {
  yearPillar: PillarData;
  monthPillar: PillarData;
  dayPillar: PillarData;
  hourPillar: PillarData;
  dayMaster: {
    stem: StemData;
    symbol: string;
    nature: string;
    strength: "Strong" | "Slightly Strong" | "Balanced" | "Slightly Weak" | "Weak";
    favorableElements: string[];
    unfavorableElements: string[];
  };
  zodiacAnimal: string;
  animalCharacteristics: string;
  elementsBalance: {
    Wood: number;
    Fire: number;
    Earth: number;
    Metal: number;
    Water: number;
  };
  yinYangRatio: {
    yang: number;
    yin: number;
  };
  compatibilities: {
    sanHeTrine: string[]; // Trine allies
    liuHeFriend: string; // Secret friend
    clashSign: string; // Opposing clash
    description: string;
  };
  calculationContext?: {
    timeBasis: "civil-clock" | "local-mean-solar" | "local-apparent-solar";
    dayBoundaryPolicy: "pure-zi" | "early-late-zi";
    solarClockIso: string;
    longitudeDegrees: number;
    equationOfTimeMinutes: number;
  };
}

export const HEAVENLY_STEMS: StemData[] = [
  { name: "Jia", chinese: "甲", pinyin: "Jiǎ", element: "Wood", polarity: "Yang", color: "#10b981" },
  { name: "Yi", chinese: "乙", pinyin: "Yǐ", element: "Wood", polarity: "Yin", color: "#34d399" },
  { name: "Bing", chinese: "丙", pinyin: "Bǐng", element: "Fire", polarity: "Yang", color: "#ef4444" },
  { name: "Ding", chinese: "丁", pinyin: "Dīng", element: "Fire", polarity: "Yin", color: "#f87171" },
  { name: "Wu", chinese: "戊", pinyin: "Wù", element: "Earth", polarity: "Yang", color: "#f59e0b" },
  { name: "Ji", chinese: "己", pinyin: "Jǐ", element: "Earth", polarity: "Yin", color: "#fbbf24" },
  { name: "Geng", chinese: "庚", pinyin: "Gēng", element: "Metal", polarity: "Yang", color: "#e2e8f0" },
  { name: "Xin", chinese: "辛", pinyin: "Xīn", element: "Metal", polarity: "Yin", color: "#cbd5e1" },
  { name: "Ren", chinese: "壬", pinyin: "Rén", element: "Water", polarity: "Yang", color: "#3b82f6" },
  { name: "Gui", chinese: "癸", pinyin: "Guǐ", element: "Water", polarity: "Yin", color: "#60a5fa" },
];

export const EARTHLY_BRANCHES: BranchData[] = [
  { name: "Zi", chinese: "子", pinyin: "Zǐ", animal: "Rat", element: "Water", polarity: "Yang", hiddenStems: ["Gui"], color: "#3b82f6" },
  { name: "Chou", chinese: "丑", pinyin: "Chǒu", animal: "Ox", element: "Earth", polarity: "Yin", hiddenStems: ["Ji", "Gui", "Xin"], color: "#fbbf24" },
  { name: "Yin", chinese: "寅", pinyin: "Yín", animal: "Tiger", element: "Wood", polarity: "Yang", hiddenStems: ["Jia", "Bing", "Wu"], color: "#10b981" },
  { name: "Mao", chinese: "卯", pinyin: "Mǎo", animal: "Rabbit", element: "Wood", polarity: "Yin", hiddenStems: ["Yi"], color: "#34d399" },
  { name: "Chen", chinese: "辰", pinyin: "Chén", animal: "Dragon", element: "Earth", polarity: "Yang", hiddenStems: ["Wu", "Yi", "Gui"], color: "#f59e0b" },
  { name: "Si", chinese: "巳", pinyin: "Sì", animal: "Snake", element: "Fire", polarity: "Yin", hiddenStems: ["Bing", "Geng", "Wu"], color: "#f87171" },
  { name: "Wu", chinese: "午", pinyin: "Wǔ", animal: "Horse", element: "Fire", polarity: "Yang", hiddenStems: ["Ding", "Ji"], color: "#ef4444" },
  { name: "Wei", chinese: "未", pinyin: "Wèi", animal: "Goat", element: "Earth", polarity: "Yin", hiddenStems: ["Ji", "Ding", "Yi"], color: "#fbbf24" },
  { name: "Shen", chinese: "申", pinyin: "Shēn", animal: "Monkey", element: "Metal", polarity: "Yang", hiddenStems: ["Geng", "Ren", "Wu"], color: "#e2e8f0" },
  { name: "You", chinese: "酉", pinyin: "Yǒu", animal: "Rooster", element: "Metal", polarity: "Yin", hiddenStems: ["Xin"], color: "#cbd5e1" },
  { name: "Xu", chinese: "戌", pinyin: "Xū", animal: "Dog", element: "Earth", polarity: "Yang", hiddenStems: ["Wu", "Xin", "Ding"], color: "#f59e0b" },
  { name: "Hai", chinese: "亥", pinyin: "Hài", animal: "Pig", element: "Water", polarity: "Yin", hiddenStems: ["Ren", "Jia"], color: "#60a5fa" },
];

/**
 * Solar terms approximate calendar dates (month boundaries for BaZi)
 * Month 1 (Tiger): ~Feb 4 (Lichun)
 * Month 2 (Rabbit): ~Mar 5 (Jingzhe)
 * Month 3 (Dragon): ~Apr 4 (Qingming)
 * Month 4 (Snake): ~May 5 (Lixia)
 * Month 5 (Horse): ~Jun 5 (Mangzhong)
 * Month 6 (Goat): ~Jul 6 (Xiaoshu)
 * Month 7 (Monkey): ~Aug 7 (Liqiu)
 * Month 8 (Rooster): ~Sep 7 (Bailu)
 * Month 9 (Dog): ~Oct 8 (Hanlu)
 * Month 10 (Pig): ~Nov 7 (Lidong)
 * Month 11 (Rat): ~Dec 7 (Daxue)
 * Month 12 (Ox): ~Jan 5 (Xiaohan)
 */
function getSolarMonthBranchIndex(month: number, day: number): number {
  // Approximate day of month transitions:
  const cutoffs = [5, 4, 5, 4, 5, 5, 6, 7, 7, 8, 7, 7]; // month 1 to 12
  const isAfterCutoff = day >= cutoffs[month - 1];

  let branchIdx: number;
  if (month === 2) branchIdx = isAfterCutoff ? 2 : 1; // Feb: Tiger or Ox
  else if (month === 3) branchIdx = isAfterCutoff ? 3 : 2; // Mar: Rabbit or Tiger
  else if (month === 4) branchIdx = isAfterCutoff ? 4 : 3; // Apr: Dragon or Rabbit
  else if (month === 5) branchIdx = isAfterCutoff ? 5 : 4; // May: Snake or Dragon
  else if (month === 6) branchIdx = isAfterCutoff ? 6 : 5; // Jun: Horse or Snake
  else if (month === 7) branchIdx = isAfterCutoff ? 7 : 6; // Jul: Goat or Horse
  else if (month === 8) branchIdx = isAfterCutoff ? 8 : 7; // Aug: Monkey or Goat
  else if (month === 9) branchIdx = isAfterCutoff ? 9 : 8; // Sep: Rooster or Monkey
  else if (month === 10) branchIdx = isAfterCutoff ? 10 : 9; // Oct: Dog or Rooster
  else if (month === 11) branchIdx = isAfterCutoff ? 11 : 10; // Nov: Pig or Dog
  else if (month === 12) branchIdx = isAfterCutoff ? 0 : 11; // Dec: Rat or Pig
  else branchIdx = isAfterCutoff ? 1 : 0; // Jan: Ox or Rat

  return branchIdx;
}

/**
 * Calculates Year Pillar
 * Year begins on Lichun (~Feb 4). If birth is before Feb 4, belongs to previous solar year.
 */
function calculateYearPillar(year: number, month: number, day: number): { stemIdx: number; branchIdx: number } {
  let solarYear = year;
  if (month === 1 || (month === 2 && day < 4)) {
    solarYear -= 1;
  }
  let stemIdx = (solarYear - 4) % 10;
  if (stemIdx < 0) stemIdx += 10;
  let branchIdx = (solarYear - 4) % 12;
  if (branchIdx < 0) branchIdx += 12;
  return { stemIdx, branchIdx };
}

/**
 * Calculates Month Pillar using Five Tigers Rule (Wu Hu Dun)
 */
function calculateMonthPillar(yearStemIdx: number, month: number, day: number): { stemIdx: number; branchIdx: number } {
  const branchIdx = getSolarMonthBranchIndex(month, day);
  // Five Tigers Rule:
  // Year Stem Jia(0)/Ji(5) -> 1st month (Tiger, branchIdx 2) starts with Bing(2)
  // Year Stem Yi(1)/Geng(6) -> Wu(4)
  // Year Stem Bing(2)/Xin(7) -> Geng(6)
  // Year Stem Ding(3)/Ren(8) -> Ren(8)
  // Year Stem Wu(4)/Gui(9) -> Jia(0)
  const tigerStartStems = [2, 4, 6, 8, 0];
  const tigerStart = tigerStartStems[yearStemIdx % 5];
  // Calculate offset from Tiger (branch index 2)
  const offsetFromTiger = (branchIdx - 2 + 12) % 12;
  const stemIdx = (tigerStart + offsetFromTiger) % 10;

  return { stemIdx, branchIdx };
}

/**
 * Calculates Day Pillar from Julian Day Number (Sexagenary 60-day cycle)
 */
function calculateDayPillar(year: number, month: number, day: number, hour: number): { stemIdx: number; branchIdx: number } {
  // If birth is between 23:00 and 23:59 (Early Zi / Rat hour), in classical BaZi it belongs to the next day's pillar
  let adjDay = day;
  let adjMonth = month;
  let adjYear = year;
  if (hour >= 23) {
    adjDay += 1;
    const maxDays = new Date(adjYear, adjMonth, 0).getDate();
    if (adjDay > maxDays) {
      adjDay = 1;
      adjMonth += 1;
      if (adjMonth > 12) {
        adjMonth = 1;
        adjYear += 1;
      }
    }
  }

  const jd = calculateJulianDay(adjYear, adjMonth, adjDay, 12, 0); // noon JD
  // Sexagenary cycle formula: JDN + 50 % 60
  // Standard anchor: Jan 1, 2000 (JD 2451545.0) was Geng-Chen day (Index 16: Geng=6, Chen=4)
  const cycleIndex = Math.floor((jd + 0.5 + 49) % 60);
  const stemIdx = cycleIndex % 10;
  const branchIdx = cycleIndex % 12;

  return { stemIdx, branchIdx };
}

/**
 * Calculates Hour Pillar from Chinese double-hours (Shi Chen) and Day Stem (Five Rats Rule)
 */
function calculateHourPillar(dayStemIdx: number, hour: number): { stemIdx: number; branchIdx: number } {
  // Chinese 12 Double-hours:
  // 23:00-01:00 = Zi (0), 01:00-03:00 = Chou (1), ...
  let branchIdx = Math.floor(((hour + 1) % 24) / 2);

  // Five Rats Rule (Wu Shu Dun):
  // Day Stem Jia(0)/Ji(5) -> Zi hour starts with Jia(0)
  // Day Stem Yi(1)/Geng(6) -> Bing(2)
  // Day Stem Bing(2)/Xin(7) -> Wu(4)
  // Day Stem Ding(3)/Ren(8) -> Geng(6)
  // Day Stem Wu(4)/Gui(9) -> Ren(8)
  const ratStartStems = [0, 2, 4, 6, 8];
  const ratStart = ratStartStems[dayStemIdx % 5];
  const stemIdx = (ratStart + branchIdx) % 10;

  return { stemIdx, branchIdx };
}

export const ANIMAL_PROFILES: Record<string, string> = {
  Rat: "Quick-witted, resourceful, charming, and highly perceptive. Masters of opportunity and social dexterity.",
  Ox: "Steadfast, patient, methodical, and deeply trustworthy. Unwavering integrity with heroic endurance.",
  Tiger: "Courageous, charismatic, rebellious, and fiercely independent. Natural leaders driven by heroic conviction.",
  Rabbit: "Refined, diplomatic, compassionate, and aesthetically gifted. Seeks peace, elegance, and tranquil sanctuary.",
  Dragon: "Majestic, visionary, ambitious, and extraordinarily magnetic. Bold innovators meant to make sweeping historical marks.",
  Snake: "Enigmatic, intuitive, deeply philosophical, and discreet. Possesses acute insight and subtle transformative power.",
  Horse: "Spirited, energetic, freedom-loving, and passionate. Craves forward velocity, independence, and inspiring voyages.",
  Goat: "Gentle, empathetic, artistic, and resilient. Creative peacemakers whose subtle grace overcomes harsh friction.",
  Monkey: "Ingenious, versatile, witty, and master problem-solvers. Boundless curiosity and intellectual brilliance.",
  Rooster: "Meticulous, candid, observant, and fiercely hardworking. Precise aesthetic standards and proud loyalty.",
  Dog: "Fiercely loyal, honest, protective, and just. Champion of the underdog with unwavering moral fidelity.",
  Pig: "Generous, sincere, warmhearted, and deeply cultured. Genuine seekers of joy, harmony, and compassionate fellowship.",
};

export const COMPATIBILITY_TABLE: Record<
  string,
  { trines: string[]; secretFriend: string; clash: string }
> = {
  Rat: { trines: ["Dragon", "Monkey"], secretFriend: "Ox", clash: "Horse" },
  Ox: { trines: ["Snake", "Rooster"], secretFriend: "Rat", clash: "Goat" },
  Tiger: { trines: ["Horse", "Dog"], secretFriend: "Pig", clash: "Monkey" },
  Rabbit: { trines: ["Goat", "Pig"], secretFriend: "Dog", clash: "Rooster" },
  Dragon: { trines: ["Rat", "Monkey"], secretFriend: "Rooster", clash: "Dog" },
  Snake: { trines: ["Ox", "Rooster"], secretFriend: "Monkey", clash: "Pig" },
  Horse: { trines: ["Tiger", "Dog"], secretFriend: "Goat", clash: "Rat" },
  Goat: { trines: ["Rabbit", "Pig"], secretFriend: "Horse", clash: "Ox" },
  Monkey: { trines: ["Rat", "Dragon"], secretFriend: "Snake", clash: "Tiger" },
  Rooster: { trines: ["Ox", "Snake"], secretFriend: "Dragon", clash: "Rabbit" },
  Dog: { trines: ["Tiger", "Horse"], secretFriend: "Rabbit", clash: "Dragon" },
  Pig: { trines: ["Rabbit", "Goat"], secretFriend: "Tiger", clash: "Snake" },
};

export const DAY_MASTER_NATURE: Record<string, { symbol: string; nature: string }> = {
  Jia: {
    symbol: "Yang Wood (Giant Oak / Pine)",
    nature: "Upright, ambitious, principled, deeply rooted, and protective of others. Seeks towering growth and shelter for those in its shade.",
  },
  Yi: {
    symbol: "Yin Wood (Flowering Vine / Bamboo)",
    nature: "Flexible, resilient, graceful, diplomatic, and wonderfully adaptable. Bends in violent storms without breaking and wraps around obstacles.",
  },
  Bing: {
    symbol: "Yang Fire (The Blazing Sun)",
    nature: "Generous, radiant, magnanimous, outspoken, and illuminating. Sheds warmth unconditionally without expecting repayment, leading from the front.",
  },
  Ding: {
    symbol: "Yin Fire (Candle Flame / Star)",
    nature: "Inspiring, intuitive, perceptive, cultured, and intensely focused. Illuminates dark corners of consciousness and ignites creative awakenings.",
  },
  Wu: {
    symbol: "Yang Earth (Mighty Mountain / Fortress)",
    nature: "Solid, dependable, broad-shouldered, patient, and grounded. A sanctuary of stability that provides enduring foundation for civilization.",
  },
  Ji: {
    symbol: "Yin Earth (Nourishing Garden Soil)",
    nature: "Nurturing, fertile, tolerant, thoughtful, and endlessly resourceful. Welcomes diverse seeds and nurtures them silently until full harvest.",
  },
  Geng: {
    symbol: "Yang Metal (Forged Sword / Ore)",
    nature: "Resolute, decisive, chivalrous, courageous, and disciplined. Thrives when tested through fire and hardship, shaping raw reality with sharp precision.",
  },
  Xin: {
    symbol: "Yin Metal (Polished Jewel / Precision Scalpel)",
    nature: "Elegant, discerning, aristocratic, perfectionist, and precious. Possesses exquisite taste and sharp diagnostic intellect that cuts straight to essence.",
  },
  Ren: {
    symbol: "Yang Water (Mighty Ocean / Vast River)",
    nature: "Expansive, dynamic, powerful, adventurous, and freedom-loving. Sweeps obstacles away through sheer tidal momentum and boundless wisdom.",
  },
  Gui: {
    symbol: "Yin Water (Gentle Rain / Morning Dew)",
    nature: "Intuitive, gentle, mysterious, penetrating, and contemplative. Seeps quietly into hidden crevices, nourishing life unobtrusively.",
  },
};

/**
 * Main BaZi (Four Pillars) calculation function
 */
export function calculateBaZiProfile(
  year: number,
  month: number,
  day: number,
  hour = 12
): BaZiProfile {
  // Year Pillar
  const { stemIdx: yStem, branchIdx: yBranch } = calculateYearPillar(year, month, day);
  // Month Pillar
  const { stemIdx: mStem, branchIdx: mBranch } = calculateMonthPillar(yStem, month, day);
  // Day Pillar
  const { stemIdx: dStem, branchIdx: dBranch } = calculateDayPillar(year, month, day, hour);
  // Hour Pillar
  const { stemIdx: hStem, branchIdx: hBranch } = calculateHourPillar(dStem, hour);

  const makePillar = (
    pillarName: PillarData["pillarName"],
    sIdx: number,
    bIdx: number,
    significance: string
  ): PillarData => {
    const s = HEAVENLY_STEMS[sIdx];
    const b = EARTHLY_BRANCHES[bIdx];
    return {
      pillarName,
      stem: s,
      branch: b,
      combinedName: `${s.name}-${b.animal} (${s.polarity} ${s.element} ${b.animal})`,
      significance,
    };
  };

  const yearPillar = makePillar("Year", yStem, yBranch, "Represents ancestral roots, public reputation, grandparents, and early formative childhood (ages 1-16).");
  const monthPillar = makePillar("Month", mStem, mBranch, "Represents career trajectory, parent influence, work environment, and ambitious youth (ages 17-32).");
  const dayPillar = makePillar("Day", dStem, dBranch, "Represents the core Self (Day Master Stem), spouse/intimate partner (Branch), and mature prime (ages 33-48).");
  const hourPillar = makePillar("Hour", hStem, hBranch, "Represents secret aspirations, children, creative legacy, and golden later years (ages 49+).");

  // Day Master
  const dayMasterStem = HEAVENLY_STEMS[dStem];
  const dayMasterInfo = DAY_MASTER_NATURE[dayMasterStem.name];

  // Five Elements count (from 4 stems, 4 branches, and their primary hidden stems)
  const elementsCount: Record<"Wood" | "Fire" | "Earth" | "Metal" | "Water", number> = {
    Wood: 0,
    Fire: 0,
    Earth: 0,
    Metal: 0,
    Water: 0,
  };

  let yangCount = 0;
  let yinCount = 0;

  const registerItem = (element: "Wood" | "Fire" | "Earth" | "Metal" | "Water", polarity: "Yang" | "Yin", weight = 1) => {
    elementsCount[element] += weight;
    if (polarity === "Yang") yangCount += weight;
    else yinCount += weight;
  };

  // Register 4 Stems (Weight 1.0 each)
  registerItem(yearPillar.stem.element, yearPillar.stem.polarity, 1.0);
  registerItem(monthPillar.stem.element, monthPillar.stem.polarity, 1.0);
  registerItem(dayPillar.stem.element, dayPillar.stem.polarity, 1.2); // Day Master emphasis
  registerItem(hourPillar.stem.element, hourPillar.stem.polarity, 1.0);

  // Register 4 Branches (Weight 1.5 each because Earthly Branches hold seasonal command)
  registerItem(yearPillar.branch.element, yearPillar.branch.polarity, 1.2);
  registerItem(monthPillar.branch.element, monthPillar.branch.polarity, 1.8); // Season commanding general!
  registerItem(dayPillar.branch.element, dayPillar.branch.polarity, 1.4);
  registerItem(hourPillar.branch.element, hourPillar.branch.polarity, 1.2);

  // Convert to percentages
  const totalWeight = Object.values(elementsCount).reduce((a, b) => a + b, 0);
  const elementsBalance = {
    Wood: Math.round((elementsCount.Wood / totalWeight) * 100),
    Fire: Math.round((elementsCount.Fire / totalWeight) * 100),
    Earth: Math.round((elementsCount.Earth / totalWeight) * 100),
    Metal: Math.round((elementsCount.Metal / totalWeight) * 100),
    Water: Math.round((elementsCount.Water / totalWeight) * 100),
  };

  // Day Master Strength assessment:
  // Supported by same element (Friends) and producing element (Resource)
  const dmElem = dayMasterStem.element;
  const generatingMap: Record<string, string> = {
    Wood: "Water",
    Fire: "Wood",
    Earth: "Fire",
    Metal: "Earth",
    Water: "Metal",
  };
  const controllingMap: Record<string, string> = {
    Wood: "Metal",
    Fire: "Water",
    Earth: "Wood",
    Metal: "Fire",
    Water: "Earth",
  };

  const resourceElem = generatingMap[dmElem];
  const drainingElem = controllingMap[dmElem];

  const supportingPct = (elementsBalance[dmElem as keyof typeof elementsBalance] || 0) + (elementsBalance[resourceElem as keyof typeof elementsBalance] || 0);

  let dmStrength: "Strong" | "Balanced" | "Weak" = "Balanced";
  let favorable: string[] = [];
  let unfavorable: string[] = [];

  if (supportingPct > 48) {
    dmStrength = "Strong";
    favorable = ["Output / Wealth elements (to channel your abundant vital energy)", drainingElem];
    unfavorable = [dmElem, resourceElem];
  } else if (supportingPct < 32) {
    dmStrength = "Weak";
    favorable = [dmElem, resourceElem];
    unfavorable = [drainingElem, "Excessive Output/Pressure"];
  } else {
    dmStrength = "Balanced";
    favorable = ["Harmony among all five elements", resourceElem, dmElem];
    unfavorable = ["Extreme sudden shifts in any single element"];
  }

  // Animal & Compatibility
  const zodiacAnimal = yearPillar.branch.animal;
  const animalCharacteristics = ANIMAL_PROFILES[zodiacAnimal] || "";
  const compatData = COMPATIBILITY_TABLE[zodiacAnimal] || {
    trines: ["Dragon", "Monkey"],
    secretFriend: "Ox",
    clash: "Horse",
  };

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    dayMaster: {
      stem: dayMasterStem,
      symbol: dayMasterInfo.symbol,
      nature: dayMasterInfo.nature,
      strength: dmStrength,
      favorableElements: favorable,
      unfavorableElements: unfavorable,
    },
    zodiacAnimal,
    animalCharacteristics,
    elementsBalance,
    yinYangRatio: {
      yang: Math.round((yangCount / (yangCount + yinCount)) * 100),
      yin: Math.round((yinCount / (yangCount + yinCount)) * 100),
    },
    compatibilities: {
      sanHeTrine: compatData.trines,
      liuHeFriend: compatData.secretFriend,
      clashSign: compatData.clash,
      description: `In Chinese metaphysics, the ${zodiacAnimal} forms a blessed San He (Three Harmonies) Trine of boundless affinity with the ${compatData.trines.join(
        " and "
      )}. Your secret ally (Liu He) is the ${compatData.secretFriend}. The opposing clash sign is the ${compatData.clash}, which triggers catalytic growth through tension.`,
    },
  };
}
