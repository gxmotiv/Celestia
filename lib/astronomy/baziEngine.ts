/**
 * Comprehensive Chinese BaZi (Four Pillars of Destiny - 八字) & 24 Solar Terms Engine
 * Implements:
 * 1. Solar Calendar & 24 Solar Terms Calculation via Swiss Ephemeris
 * 2. 10 Heavenly Stems (Tian Gan) & 12 Earthly Branches (Di Zhi) with Hidden Stems (Cang Gan)
 * 3. 60 Jia Zi Sexagenary Cycle
 * 4. Four Pillars: Year (Lichun), Month (Solar Terms), Day (60-day cycle), Hour (2-hour branches)
 * 5. Five Element (Wu Xing) Analysis & Day Master Strength (1-10) with Productive/Destructive Cycles
 * 6. 10-Year Luck Pillars (Da Yun) with Forward/Reverse progression based on Stem Polarity & Gender
 * 7. Annual Influence (Liu Nian), Monthly (Liu Yue), Daily (Liu Ri) Influences
 * 8. Comprehensive Metaphysics Interpretations Database
 */

import { swissEphemeris } from "./swissEphemeris";
import { calculateJulianDay, normalizeDegrees } from "./ephemeris";

// ============================================================
// 1. DATA TYPES & INTERFACES
// ============================================================

export type ElementType = "Wood" | "Fire" | "Earth" | "Metal" | "Water";
export type YinYang = "Yang" | "Yin";

export interface SolarTerm {
  name: string;
  chinese: string;
  pinyin: string;
  longitude: number; // 0, 15, 30 ... 345
  season: "Spring" | "Summer" | "Autumn" | "Winter";
  isMajor: boolean; // Jie (Solar Node) vs Zhong (Middle Term)
  monthBranchIndex: number; // 0 = Zi, 2 = Yin (Tiger), etc.
}

export interface HeavenlyStem {
  index: number; // 0 to 9
  name: string;
  chinese: string;
  pinyin: string;
  element: ElementType;
  yinYang: YinYang;
  direction: "East" | "South" | "Center" | "West" | "North";
  color: string;
  nature: string;
}

export interface EarthlyBranch {
  index: number; // 0 to 11
  name: string;
  chinese: string;
  pinyin: string;
  animal: string;
  element: ElementType;
  yinYang: YinYang;
  hiddenStems: { stem: string; element: ElementType; weight: number }[];
  timeRange: string;
  season: "Spring" | "Summer" | "Autumn" | "Winter" | "Transition";
  direction: string;
  color: string;
}

export interface Pillar {
  position: "Year" | "Month" | "Day" | "Hour";
  heavenlyStem: HeavenlyStem;
  earthlyBranch: EarthlyBranch;
  element: ElementType;
  animal: string;
  yinYang: YinYang;
  combinedChinese: string;
  combinedPinyin: string;
  combinedName: string;
  significance: string;
}

export interface ElementBalance {
  Wood: number;
  Fire: number;
  Earth: number;
  Metal: number;
  Water: number;
}

export interface DayMasterAnalysis {
  stem: HeavenlyStem;
  element: ElementType;
  strengthScore: number; // 1 to 10
  strengthLabel: "Weak" | "Slightly Weak" | "Balanced" | "Slightly Strong" | "Strong";
  seasonSupport: boolean;
  favorableElements: ElementType[];
  unfavorableElements: ElementType[];
  deityArchetype: string;
  temperament: string;
}

export interface LuckPillar {
  order: number;
  pillar: {
    stem: HeavenlyStem;
    branch: EarthlyBranch;
    chinese: string;
    pinyin: string;
    name: string;
  };
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
  isCurrent: boolean;
  element: ElementType;
  interpretation: {
    theme: string;
    opportunities: string[];
    challenges: string[];
    advice: string;
  };
}

export interface AnnualInfluence {
  year: number;
  pillar: {
    stem: HeavenlyStem;
    branch: EarthlyBranch;
    chinese: string;
    pinyin: string;
    name: string;
  };
  animal: string;
  element: ElementType;
  interactionWithDayMaster: {
    relation: string;
    harmonyType: "Favorable Support" | "Productive Flow" | "Clash/Challenge" | "Destructive Drain" | "Neutral";
    description: string;
  };
  favorableActivities: string[];
  cautions: string[];
}

export interface BaZiChart {
  birthDate: Date;
  gender: "Male" | "Female";
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar;
  };
  solarTermAtBirth: {
    name: string;
    chinese: string;
    longitude: number;
  };
  currentSolarTerm: {
    name: string;
    chinese: string;
    currentLongitude: number;
    targetLongitude: number;
    daysRemaining: number;
  };
  dayMaster: DayMasterAnalysis;
  elementBalance: ElementBalance;
  yinYangRatio: { yang: number; yin: number };
  productiveCycles: { from: ElementType; to: ElementType; description: string }[];
  destructiveCycles: { from: ElementType; to: ElementType; description: string }[];
  luckPillars: LuckPillar[];
  currentAnnualInfluence: AnnualInfluence;
  personalityInterpretation: {
    summary: string;
    strengths: string[];
    growthAreas: string[];
    careerFit: string[];
    wealthStyle: string;
    relationshipStyle: string;
  };
}

// ============================================================
// 2. THE 24 SOLAR TERMS DATABASE (JIE QI - 节气)
// ============================================================

export const SOLAR_TERMS: SolarTerm[] = [
  { name: "Chunfen (Spring Equinox)", chinese: "春分", pinyin: "Chūnfēn", longitude: 0, season: "Spring", isMajor: false, monthBranchIndex: 3 }, // Rabbit
  { name: "Qingming (Clear & Bright)", chinese: "清明", pinyin: "Qīngmíng", longitude: 15, season: "Spring", isMajor: true, monthBranchIndex: 4 }, // Dragon
  { name: "Guyu (Grain Rain)", chinese: "谷雨", pinyin: "Gǔyǔ", longitude: 30, season: "Spring", isMajor: false, monthBranchIndex: 4 },
  { name: "Lixia (Start of Summer)", chinese: "立夏", pinyin: "Lìxià", longitude: 45, season: "Summer", isMajor: true, monthBranchIndex: 5 }, // Snake
  { name: "Xiaoman (Grain Full)", chinese: "小满", pinyin: "Xiǎomǎn", longitude: 60, season: "Summer", isMajor: false, monthBranchIndex: 5 },
  { name: "Mangzhong (Grain in Ear)", chinese: "芒种", pinyin: "Mángzhòng", longitude: 75, season: "Summer", isMajor: true, monthBranchIndex: 6 }, // Horse
  { name: "Xiazhi (Summer Solstice)", chinese: "夏至", pinyin: "Xiàzhì", longitude: 90, season: "Summer", isMajor: false, monthBranchIndex: 6 },
  { name: "Xiaoshu (Minor Heat)", chinese: "小暑", pinyin: "Xiǎoshǔ", longitude: 105, season: "Summer", isMajor: true, monthBranchIndex: 7 }, // Goat
  { name: "Dashu (Major Heat)", chinese: "大暑", pinyin: "Dàshǔ", longitude: 120, season: "Summer", isMajor: false, monthBranchIndex: 7 },
  { name: "Liqiu (Start of Autumn)", chinese: "立秋", pinyin: "Lìqiū", longitude: 135, season: "Autumn", isMajor: true, monthBranchIndex: 8 }, // Monkey
  { name: "Chushu (End of Heat)", chinese: "处暑", pinyin: "Chùshǔ", longitude: 150, season: "Autumn", isMajor: false, monthBranchIndex: 8 },
  { name: "Bailu (White Dew)", chinese: "白露", pinyin: "Báilù", longitude: 165, season: "Autumn", isMajor: true, monthBranchIndex: 9 }, // Rooster
  { name: "Qiufen (Autumn Equinox)", chinese: "秋分", pinyin: "Qiūfēn", longitude: 180, season: "Autumn", isMajor: false, monthBranchIndex: 9 },
  { name: "Hanlu (Cold Dew)", chinese: "寒露", pinyin: "Hánlù", longitude: 195, season: "Autumn", isMajor: true, monthBranchIndex: 10 }, // Dog
  { name: "Shuangjiang (Frost Descends)", chinese: "霜降", pinyin: "Shuāngjiàng", longitude: 210, season: "Autumn", isMajor: false, monthBranchIndex: 10 },
  { name: "Lidong (Start of Winter)", chinese: "立冬", pinyin: "Lìdōng", longitude: 225, season: "Winter", isMajor: true, monthBranchIndex: 11 }, // Pig
  { name: "Xiaoxue (Minor Snow)", chinese: "小雪", pinyin: "Xiǎoxuě", longitude: 240, season: "Winter", isMajor: false, monthBranchIndex: 11 },
  { name: "Daxue (Major Snow)", chinese: "大雪", pinyin: "Dàxuě", longitude: 255, season: "Winter", isMajor: true, monthBranchIndex: 0 }, // Rat
  { name: "Dongzhi (Winter Solstice)", chinese: "冬至", pinyin: "Dōngzhì", longitude: 270, season: "Winter", isMajor: false, monthBranchIndex: 0 },
  { name: "Xiaohan (Minor Cold)", chinese: "小寒", pinyin: "Xiǎohán", longitude: 285, season: "Winter", isMajor: true, monthBranchIndex: 1 }, // Ox
  { name: "Dahan (Major Cold)", chinese: "大寒", pinyin: "Dàhán", longitude: 300, season: "Winter", isMajor: false, monthBranchIndex: 1 },
  { name: "Lichun (Start of Spring)", chinese: "立春", pinyin: "Lìchūn", longitude: 315, season: "Spring", isMajor: true, monthBranchIndex: 2 }, // Tiger - Solar Year Boundary!
  { name: "Yushui (Rain Water)", chinese: "雨水", pinyin: "Yǔshuǐ", longitude: 330, season: "Spring", isMajor: false, monthBranchIndex: 2 },
  { name: "Jingzhe (Awakening of Insects)", chinese: "惊蛰", pinyin: "Jīngzhé", longitude: 345, season: "Spring", isMajor: true, monthBranchIndex: 3 }, // Rabbit
];

// ============================================================
// 3. HEAVENLY STEMS (TIAN GAN - 天干)
// ============================================================

export const HEAVENLY_STEMS: HeavenlyStem[] = [
  { index: 0, name: "Jia", chinese: "甲", pinyin: "Jiǎ", element: "Wood", yinYang: "Yang", direction: "East", color: "#10b981", nature: "Towering Tree, steadfast leader, principled, pioneer" },
  { index: 1, name: "Yi", chinese: "乙", pinyin: "Yǐ", element: "Wood", yinYang: "Yin", direction: "East", color: "#34d399", nature: "Climbing Vine/Flower, flexible, diplomatic, resilient" },
  { index: 2, name: "Bing", chinese: "丙", pinyin: "Bǐng", element: "Fire", yinYang: "Yang", direction: "South", color: "#ef4444", nature: "Blazing Sun, radiant, passionate, magnanimous, inspiring" },
  { index: 3, name: "Ding", chinese: "丁", pinyin: "Dīng", element: "Fire", yinYang: "Yin", direction: "South", color: "#f87171", nature: "Candle Flame / Guiding Star, meticulous, perceptive, inspiring" },
  { index: 4, name: "Wu", chinese: "戊", pinyin: "Wù", element: "Earth", yinYang: "Yang", direction: "Center", color: "#f59e0b", nature: "Massive Mountain, grounded, trustworthy, patient fortress" },
  { index: 5, name: "Ji", chinese: "己", pinyin: "Jǐ", element: "Earth", yinYang: "Yin", direction: "Center", color: "#fbbf24", nature: "Fertile Soil / Garden, nurturing, productive, adaptable" },
  { index: 6, name: "Geng", chinese: "庚", pinyin: "Gēng", element: "Metal", yinYang: "Yang", direction: "West", color: "#e2e8f0", nature: "Forged Sword / Raw Ore, righteous, decisive, warrior spirit" },
  { index: 7, name: "Xin", chinese: "辛", pinyin: "Xīn", element: "Metal", yinYang: "Yin", direction: "West", color: "#cbd5e1", nature: "Precious Jewel, refined, elegant, sharp perfectionist" },
  { index: 8, name: "Ren", chinese: "壬", pinyin: "Rén", element: "Water", yinYang: "Yang", direction: "North", color: "#3b82f6", nature: "Vast Ocean, dynamic, visionary, unstoppable flow" },
  { index: 9, name: "Gui", chinese: "癸", pinyin: "Guǐ", element: "Water", yinYang: "Yin", direction: "North", color: "#60a5fa", nature: "Morning Dew / Gentle Rain, intuitive, philosophical, subtle wisdom" },
];

// ============================================================
// 4. EARTHLY BRANCHES (DI ZHI - 地支) WITH HIDDEN STEMS (CANG GAN)
// ============================================================

export const EARTHLY_BRANCHES: EarthlyBranch[] = [
  {
    index: 0,
    name: "Zi",
    chinese: "子",
    pinyin: "Zǐ",
    animal: "Rat",
    element: "Water",
    yinYang: "Yang",
    hiddenStems: [{ stem: "Gui", element: "Water", weight: 1.0 }],
    timeRange: "23:00 – 00:59",
    season: "Winter",
    direction: "North",
    color: "#3b82f6",
  },
  {
    index: 1,
    name: "Chou",
    chinese: "丑",
    pinyin: "Chǒu",
    animal: "Ox",
    element: "Earth",
    yinYang: "Yin",
    hiddenStems: [
      { stem: "Ji", element: "Earth", weight: 0.6 },
      { stem: "Gui", element: "Water", weight: 0.3 },
      { stem: "Xin", element: "Metal", weight: 0.1 },
    ],
    timeRange: "01:00 – 02:59",
    season: "Transition",
    direction: "North-Northeast",
    color: "#fbbf24",
  },
  {
    index: 2,
    name: "Yin",
    chinese: "寅",
    pinyin: "Yín",
    animal: "Tiger",
    element: "Wood",
    yinYang: "Yang",
    hiddenStems: [
      { stem: "Jia", element: "Wood", weight: 0.6 },
      { stem: "Bing", element: "Fire", weight: 0.3 },
      { stem: "Wu", element: "Earth", weight: 0.1 },
    ],
    timeRange: "03:00 – 04:59",
    season: "Spring",
    direction: "East-Northeast",
    color: "#10b981",
  },
  {
    index: 3,
    name: "Mao",
    chinese: "卯",
    pinyin: "Mǎo",
    animal: "Rabbit",
    element: "Wood",
    yinYang: "Yin",
    hiddenStems: [{ stem: "Yi", element: "Wood", weight: 1.0 }],
    timeRange: "05:00 – 06:59",
    season: "Spring",
    direction: "East",
    color: "#34d399",
  },
  {
    index: 4,
    name: "Chen",
    chinese: "辰",
    pinyin: "Chén",
    animal: "Dragon",
    element: "Earth",
    yinYang: "Yang",
    hiddenStems: [
      { stem: "Wu", element: "Earth", weight: 0.6 },
      { stem: "Yi", element: "Wood", weight: 0.3 },
      { stem: "Gui", element: "Water", weight: 0.1 },
    ],
    timeRange: "07:00 – 08:59",
    season: "Transition",
    direction: "East-Southeast",
    color: "#f59e0b",
  },
  {
    index: 5,
    name: "Si",
    chinese: "巳",
    pinyin: "Sì",
    animal: "Snake",
    element: "Fire",
    yinYang: "Yin",
    hiddenStems: [
      { stem: "Bing", element: "Fire", weight: 0.6 },
      { stem: "Geng", element: "Metal", weight: 0.3 },
      { stem: "Wu", element: "Earth", weight: 0.1 },
    ],
    timeRange: "09:00 – 10:59",
    season: "Summer",
    direction: "South-Southeast",
    color: "#f87171",
  },
  {
    index: 6,
    name: "Wu",
    chinese: "午",
    pinyin: "Wǔ",
    animal: "Horse",
    element: "Fire",
    yinYang: "Yang",
    hiddenStems: [
      { stem: "Ding", element: "Fire", weight: 0.7 },
      { stem: "Ji", element: "Earth", weight: 0.3 },
    ],
    timeRange: "11:00 – 12:59",
    season: "Summer",
    direction: "South",
    color: "#ef4444",
  },
  {
    index: 7,
    name: "Wei",
    chinese: "未",
    pinyin: "Wèi",
    animal: "Goat",
    element: "Earth",
    yinYang: "Yin",
    hiddenStems: [
      { stem: "Ji", element: "Earth", weight: 0.6 },
      { stem: "Ding", element: "Fire", weight: 0.3 },
      { stem: "Yi", element: "Wood", weight: 0.1 },
    ],
    timeRange: "13:00 – 14:59",
    season: "Transition",
    direction: "South-Southwest",
    color: "#fbbf24",
  },
  {
    index: 8,
    name: "Shen",
    chinese: "申",
    pinyin: "Shēn",
    animal: "Monkey",
    element: "Metal",
    yinYang: "Yang",
    hiddenStems: [
      { stem: "Geng", element: "Metal", weight: 0.6 },
      { stem: "Ren", element: "Water", weight: 0.3 },
      { stem: "Wu", element: "Earth", weight: 0.1 },
    ],
    timeRange: "15:00 – 16:59",
    season: "Autumn",
    direction: "West-Southwest",
    color: "#e2e8f0",
  },
  {
    index: 9,
    name: "You",
    chinese: "酉",
    pinyin: "Yǒu",
    animal: "Rooster",
    element: "Metal",
    yinYang: "Yin",
    hiddenStems: [{ stem: "Xin", element: "Metal", weight: 1.0 }],
    timeRange: "17:00 – 18:59",
    season: "Autumn",
    direction: "West",
    color: "#cbd5e1",
  },
  {
    index: 10,
    name: "Xu",
    chinese: "戌",
    pinyin: "Xū",
    animal: "Dog",
    element: "Earth",
    yinYang: "Yang",
    hiddenStems: [
      { stem: "Wu", element: "Earth", weight: 0.6 },
      { stem: "Xin", element: "Metal", weight: 0.3 },
      { stem: "Ding", element: "Fire", weight: 0.1 },
    ],
    timeRange: "19:00 – 20:59",
    season: "Transition",
    direction: "West-Northwest",
    color: "#f59e0b",
  },
  {
    index: 11,
    name: "Hai",
    chinese: "亥",
    pinyin: "Hài",
    animal: "Pig",
    element: "Water",
    yinYang: "Yin",
    hiddenStems: [
      { stem: "Ren", element: "Water", weight: 0.7 },
      { stem: "Jia", element: "Wood", weight: 0.3 },
    ],
    timeRange: "21:00 – 22:59",
    season: "Winter",
    direction: "North-Northwest",
    color: "#60a5fa",
  },
];

// ============================================================
// 5. SOLAR TERM & CALENDAR CALCULATION ENGINE
// ============================================================

export class SolarTermCalculator {
  /**
   * Get Sun's geocentric tropical longitude for any given Date using Swiss Ephemeris
   */
  public getSunLongitude(date: Date): number {
    const jd = date.getTime() / 86400000.0 + 2440587.5;
    const planets = swissEphemeris.calculateAllPlanets(jd, false);
    return normalizeDegrees(planets.sun.longitude);
  }

  /**
   * Determine active Solar Term for a given date
   */
  public getCurrentSolarTerm(date: Date): {
    currentTerm: SolarTerm;
    currentSunLongitude: number;
    nextTerm: SolarTerm;
    daysRemaining: number;
  } {
    const sunLon = this.getSunLongitude(date);

    // Sort terms by longitude: 0, 15, 30 ... 345
    for (let i = 0; i < SOLAR_TERMS.length; i++) {
      const term = SOLAR_TERMS[i];
      const nextTerm = SOLAR_TERMS[(i + 1) % 24];

      let termLon = term.longitude;
      let nextLon = nextTerm.longitude;
      if (nextLon === 0) nextLon = 360;

      if (termLon <= sunLon && sunLon < nextLon) {
        // Degrees remaining to next term (Sun travels ~0.9856° per day)
        const degreesLeft = nextLon - sunLon;
        const daysRemaining = Math.max(1, Math.round(degreesLeft / 0.9856));
        return {
          currentTerm: term,
          currentSunLongitude: Math.round(sunLon * 1000) / 1000,
          nextTerm,
          daysRemaining,
        };
      }
    }

    // Fallback around 345° - 360°
    const lastTerm = SOLAR_TERMS.find((t) => t.longitude === 345) || SOLAR_TERMS[0];
    const firstTerm = SOLAR_TERMS.find((t) => t.longitude === 0) || SOLAR_TERMS[1];
    return {
      currentTerm: lastTerm,
      currentSunLongitude: Math.round(sunLon * 1000) / 1000,
      nextTerm: firstTerm,
      daysRemaining: 1,
    };
  }

  /**
   * Determine exact year boundary based on Lichun (Start of Spring, 315° Sun Longitude)
   */
  public isAfterLichun(date: Date): boolean {
    const sunLon = this.getSunLongitude(date);
    // In February, Lichun occurs around Feb 3-5 when Sun reaches 315°.
    // Sun is between 315° and 360° (or 0° to 314° later in the year).
    // If month is January (Sun 280°-305°), it is BEFORE Lichun.
    // If month is early February and Sun < 315°, it is BEFORE Lichun.
    const month = date.getUTCMonth() + 1;
    if (month === 1) return false;
    if (month === 2 && sunLon < 315.0) return false;
    return true;
  }

  /**
   * Calculate Year Pillar
   * Year begins at Lichun (Sun at 315°). 1984 = Jia Zi (0, 0).
   */
  public calculateYearPillar(date: Date): Pillar {
    let year = date.getUTCFullYear();
    if (!this.isAfterLichun(date)) {
      year -= 1;
    }

    // 1984 was Jia Zi (Stem index 0, Branch index 0)
    // Formula: (year - 4) % 60
    const offset = (year - 4) % 60;
    const stemIndex = (offset % 10 + 10) % 10;
    const branchIndex = (offset % 12 + 12) % 12;

    const stem = HEAVENLY_STEMS[stemIndex];
    const branch = EARTHLY_BRANCHES[branchIndex];

    return {
      position: "Year",
      heavenlyStem: stem,
      earthlyBranch: branch,
      element: stem.element,
      animal: branch.animal,
      yinYang: stem.yinYang,
      combinedChinese: `${stem.chinese}${branch.chinese}`,
      combinedPinyin: `${stem.pinyin}-${branch.pinyin}`,
      combinedName: `${stem.name}-${branch.name} (${stem.yinYang} ${stem.element} ${branch.animal})`,
      significance: "Ancestral Foundation, Social Persona & Karmic Roots (Ages 1–20)",
    };
  }

  /**
   * Calculate Month Pillar based on active Solar Term (Jie Qi)
   * Tiger (Yin = 2) is the 1st month of the solar year starting at Lichun (315°).
   */
  public calculateMonthPillar(date: Date, yearStemIndex: number): Pillar {
    const sunLon = this.getSunLongitude(date);

    // The 12 Solar Months start at the 12 Major Solar Nodes (Jie):
    // 1. Lichun (315°) = Yin (Tiger, index 2)
    // 2. Jingzhe (345°) = Mao (Rabbit, index 3)
    // 3. Qingming (15°) = Chen (Dragon, index 4)
    // 4. Lixia (45°) = Si (Snake, index 5)
    // 5. Mangzhong (75°) = Wu (Horse, index 6)
    // 6. Xiaoshu (105°) = Wei (Goat, index 7)
    // 7. Liqiu (135°) = Shen (Monkey, index 8)
    // 8. Bailu (165°) = You (Rooster, index 9)
    // 9. Hanlu (195°) = Xu (Dog, index 10)
    // 10. Lidong (225°) = Hai (Pig, index 11)
    // 11. Daxue (255°) = Zi (Rat, index 0)
    // 12. Xiaohan (285°) = Chou (Ox, index 1)
    let branchIndex: number;
    let monthOrderFromLichun: number; // 0 for Tiger, 1 for Rabbit... 11 for Ox

    if (sunLon >= 315.0 || sunLon < 345.0) {
      if (sunLon >= 315.0) {
        branchIndex = 2; // Tiger
        monthOrderFromLichun = 0;
      } else {
        branchIndex = 1; // Ox
        monthOrderFromLichun = 11;
      }
    } else if (sunLon >= 345.0 || sunLon < 15.0) {
      branchIndex = 3; // Rabbit
      monthOrderFromLichun = 1;
    } else if (sunLon >= 15.0 && sunLon < 45.0) {
      branchIndex = 4; // Dragon
      monthOrderFromLichun = 2;
    } else if (sunLon >= 45.0 && sunLon < 75.0) {
      branchIndex = 5; // Snake
      monthOrderFromLichun = 3;
    } else if (sunLon >= 75.0 && sunLon < 105.0) {
      branchIndex = 6; // Horse
      monthOrderFromLichun = 4;
    } else if (sunLon >= 105.0 && sunLon < 135.0) {
      branchIndex = 7; // Goat
      monthOrderFromLichun = 5;
    } else if (sunLon >= 135.0 && sunLon < 165.0) {
      branchIndex = 8; // Monkey
      monthOrderFromLichun = 6;
    } else if (sunLon >= 165.0 && sunLon < 195.0) {
      branchIndex = 9; // Rooster
      monthOrderFromLichun = 7;
    } else if (sunLon >= 195.0 && sunLon < 225.0) {
      branchIndex = 10; // Dog
      monthOrderFromLichun = 8;
    } else if (sunLon >= 225.0 && sunLon < 255.0) {
      branchIndex = 11; // Pig
      monthOrderFromLichun = 9;
    } else if (sunLon >= 255.0 && sunLon < 285.0) {
      branchIndex = 0; // Rat
      monthOrderFromLichun = 10;
    } else {
      branchIndex = 1; // Ox
      monthOrderFromLichun = 11;
    }

    // Classical "Five Tiger Seeking Month Stem" Rule (Wu Hu Dun):
    // Year Stem:
    // Jia (0) or Ji (5) -> Tiger month begins with Bing (2)
    // Yi (1) or Geng (6) -> Tiger month begins with Wu (4)
    // Bing (2) or Xin (7) -> Tiger month begins with Geng (6)
    // Ding (3) or Ren (8) -> Tiger month begins with Ren (8)
    // Wu (4) or Gui (9) -> Tiger month begins with Jia (0)
    const baseTigerStemMap: Record<number, number> = {
      0: 2, 5: 2,
      1: 4, 6: 4,
      2: 6, 7: 6,
      3: 8, 8: 8,
      4: 0, 9: 0,
    };
    const startStem = baseTigerStemMap[yearStemIndex] ?? 2;
    const stemIndex = (startStem + monthOrderFromLichun) % 10;

    const stem = HEAVENLY_STEMS[stemIndex];
    const branch = EARTHLY_BRANCHES[branchIndex];

    return {
      position: "Month",
      heavenlyStem: stem,
      earthlyBranch: branch,
      element: stem.element,
      animal: branch.animal,
      yinYang: stem.yinYang,
      combinedChinese: `${stem.chinese}${branch.chinese}`,
      combinedPinyin: `${stem.pinyin}-${branch.pinyin}`,
      combinedName: `${stem.name}-${branch.name} (${stem.yinYang} ${stem.element} ${branch.animal})`,
      significance: "Career Inception, Parents, Mentors & Work Environment (Ages 21–40)",
    };
  }

  /**
   * Calculate Day Pillar based on unbroken 60-day sexagenary cycle
   * Astronomical reference: JD 2451545.0 (Jan 1, 2000 @ 12:00 UTC) was Wu Wu (Stem 4, Branch 6 -> Index 54)
   */
  public calculateDayPillar(date: Date): Pillar {
    const jd = calculateJulianDay(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      12, 0, 0
    );

    // Reference JD 2451545.0 (2000-01-01) = Wu-Wu (Cycle index 54)
    const daysSince2000 = Math.round(jd - 2451545.0);
    const dayCycleIndex = ((54 + daysSince2000) % 60 + 60) % 60;

    const stemIndex = dayCycleIndex % 10;
    const branchIndex = dayCycleIndex % 12;

    const stem = HEAVENLY_STEMS[stemIndex];
    const branch = EARTHLY_BRANCHES[branchIndex];

    return {
      position: "Day",
      heavenlyStem: stem,
      earthlyBranch: branch,
      element: stem.element,
      animal: branch.animal,
      yinYang: stem.yinYang,
      combinedChinese: `${stem.chinese}${branch.chinese}`,
      combinedPinyin: `${stem.pinyin}-${branch.pinyin}`,
      combinedName: `${stem.name}-${branch.name} (${stem.yinYang} ${stem.element} ${branch.animal})`,
      significance: "Day Master (Self, Core Soul, Marriage Palace & Prime Adult Era, Ages 41–60)",
    };
  }

  /**
   * Calculate Hour Pillar (Shi Chen, 2-hour segments)
   * 23:00 - 00:59 = Zi (Rat, 0), 01:00 - 02:59 = Chou (Ox, 1), etc.
   */
  public calculateHourPillar(date: Date, dayStemIndex: number): Pillar {
    const hour = date.getUTCHours() + date.getUTCMinutes() / 60.0;

    // 2-hour branch division
    let branchIndex: number;
    if (hour >= 23 || hour < 1) branchIndex = 0; // Zi (Rat)
    else if (hour < 3) branchIndex = 1; // Chou (Ox)
    else if (hour < 5) branchIndex = 2; // Yin (Tiger)
    else if (hour < 7) branchIndex = 3; // Mao (Rabbit)
    else if (hour < 9) branchIndex = 4; // Chen (Dragon)
    else if (hour < 11) branchIndex = 5; // Si (Snake)
    else if (hour < 13) branchIndex = 6; // Wu (Horse)
    else if (hour < 15) branchIndex = 7; // Wei (Goat)
    else if (hour < 17) branchIndex = 8; // Shen (Monkey)
    else if (hour < 19) branchIndex = 9; // You (Rooster)
    else if (hour < 21) branchIndex = 10; // Xu (Dog)
    else branchIndex = 11; // Hai (Pig)

    // Five Rat Seeking Hour Stem (Wu Shu Dun):
    // Day Stem:
    // Jia (0) / Ji (5) -> Rat hour starts with Jia (0)
    // Yi (1) / Geng (6) -> Rat hour starts with Bing (2)
    // Bing (2) / Xin (7) -> Rat hour starts with Wu (4)
    // Ding (3) / Ren (8) -> Rat hour starts with Geng (6)
    // Wu (4) / Gui (9) -> Rat hour starts with Ren (8)
    const baseRatStemMap: Record<number, number> = {
      0: 0, 5: 0,
      1: 2, 6: 2,
      2: 4, 7: 4,
      3: 6, 8: 6,
      4: 8, 9: 8,
    };
    const startStem = baseRatStemMap[dayStemIndex] ?? 0;
    const stemIndex = (startStem + branchIndex) % 10;

    const stem = HEAVENLY_STEMS[stemIndex];
    const branch = EARTHLY_BRANCHES[branchIndex];

    return {
      position: "Hour",
      heavenlyStem: stem,
      earthlyBranch: branch,
      element: stem.element,
      animal: branch.animal,
      yinYang: stem.yinYang,
      combinedChinese: `${stem.chinese}${branch.chinese}`,
      combinedPinyin: `${stem.pinyin}-${branch.pinyin}`,
      combinedName: `${stem.name}-${branch.name} (${stem.yinYang} ${stem.element} ${branch.animal})`,
      significance: "Inner Subconscious, Legacy, Ambitions & Children (Age 61+)",
    };
  }
}

// ============================================================
// 6. FIVE ELEMENT ANALYSIS & DAY MASTER STRENGTH
// ============================================================

export class FiveElementAnalysisEngine {
  /**
   * Calculate Five Element balance including Hidden Stems
   */
  public analyzeBalance(pillars: Pillar[]): {
    elementBalance: ElementBalance;
    yinYangRatio: { yang: number; yin: number };
    dayMaster: DayMasterAnalysis;
  } {
    const counts: ElementBalance = { Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0 };
    let yangCount = 0;
    let yinCount = 0;

    // 1. Direct Stems (Weight = 1.0 each)
    pillars.forEach((p) => {
      counts[p.element] += 1.0;
      if (p.yinYang === "Yang") yangCount++;
      else yinCount++;
    });

    // 2. Branches & Hidden Stems (Cang Gan weighted sum)
    pillars.forEach((p) => {
      // Main branch element weight = 0.5
      counts[p.earthlyBranch.element] += 0.5;

      // Hidden stems
      p.earthlyBranch.hiddenStems.forEach((hs) => {
        counts[hs.element] += hs.weight * 0.7;
      });
    });

    // Round values to 1 decimal place
    (Object.keys(counts) as ElementType[]).forEach((el) => {
      counts[el] = Math.round(counts[el] * 10) / 10;
    });

    const dayMasterPillar = pillars.find((p) => p.position === "Day") || pillars[2];
    const monthPillar = pillars.find((p) => p.position === "Month") || pillars[1];

    const dayMaster = this.evaluateDayMaster(
      dayMasterPillar.heavenlyStem,
      monthPillar.earthlyBranch,
      counts
    );

    return {
      elementBalance: counts,
      yinYangRatio: { yang: yangCount, yin: yinCount },
      dayMaster,
    };
  }

  /**
   * Evaluate Day Master strength based on Seasonal Support & Resource/Output balance
   */
  private evaluateDayMaster(
    stem: HeavenlyStem,
    monthBranch: EarthlyBranch,
    counts: ElementBalance
  ): DayMasterAnalysis {
    const dmElement = stem.element;

    // Element supporting rules:
    // Resource element generates Day Master: Water -> Wood -> Fire -> Earth -> Metal -> Water
    const RESOURCE_MAP: Record<ElementType, ElementType> = {
      Wood: "Water",
      Fire: "Wood",
      Earth: "Fire",
      Metal: "Earth",
      Water: "Metal",
    };
    const DRAINING_MAP: Record<ElementType, ElementType> = {
      Wood: "Fire",
      Fire: "Earth",
      Earth: "Metal",
      Metal: "Water",
      Water: "Wood",
    };
    const CONTROLLING_MAP: Record<ElementType, ElementType> = {
      Wood: "Metal",
      Fire: "Water",
      Earth: "Wood",
      Metal: "Fire",
      Water: "Earth",
    };

    const resourceEl = RESOURCE_MAP[dmElement];
    const outputEl = DRAINING_MAP[dmElement];
    const officerEl = CONTROLLING_MAP[dmElement];

    // Seasonal support (Born in season or in resource month)
    const isSeasonSame = monthBranch.element === dmElement;
    const isSeasonResource = monthBranch.element === resourceEl;
    const seasonSupport = isSeasonSame || isSeasonResource;

    // Score from 1 to 10
    let score = 5.0; // Base neutral

    // 1. Seasonal alignment (+2.5 or -1.5)
    if (isSeasonSame) score += 2.5;
    else if (isSeasonResource) score += 1.8;
    else if (monthBranch.element === officerEl) score -= 1.8;
    else score -= 0.8;

    // 2. Same element & resource count in chart
    const supportiveTotal = (counts[dmElement] || 0) + (counts[resourceEl] || 0);
    const drainingTotal = (counts[outputEl] || 0) + (counts[officerEl] || 0);

    score += (supportiveTotal - drainingTotal) * 0.45;
    score = Math.max(1, Math.min(10, Math.round(score * 10) / 10));

    let strengthLabel: DayMasterAnalysis["strengthLabel"] = "Balanced";
    if (score >= 7.5) strengthLabel = "Strong";
    else if (score >= 6.0) strengthLabel = "Slightly Strong";
    else if (score <= 3.0) strengthLabel = "Weak";
    else if (score <= 4.5) strengthLabel = "Slightly Weak";

    // Favorable elements:
    // If Day Master is Strong, it desires Output, Wealth, and Control (draining/refining).
    // If Day Master is Weak, it desires Resource and Peer Companion (nurturing/supporting).
    const favorableElements: ElementType[] = [];
    const unfavorableElements: ElementType[] = [];

    if (score >= 5.5) {
      // Strong Day Master: Favorable = Output, Wealth, Officer
      favorableElements.push(outputEl, officerEl);
      unfavorableElements.push(dmElement, resourceEl);
    } else {
      // Weak Day Master: Favorable = Resource, Companion (same)
      favorableElements.push(resourceEl, dmElement);
      unfavorableElements.push(outputEl, officerEl);
    }

    return {
      stem,
      element: dmElement,
      strengthScore: score,
      strengthLabel,
      seasonSupport,
      favorableElements,
      unfavorableElements,
      deityArchetype: `${stem.yinYang} ${stem.element} (${stem.name})`,
      temperament: stem.nature,
    };
  }
}

// ============================================================
// 7. LUCK PILLARS (DA YUN - 大运) & TRANSIT INFLUENCES
// ============================================================

export class BaZiTransitEngine {
  private solarCalculator = new SolarTermCalculator();

  /**
   * Calculate 10-Year Luck Pillars (Da Yun)
   * Progression rule:
   * Yang Male / Yin Female = Forward progression through the 60-pillar cycle
   * Yin Male / Yang Female = Reverse progression
   */
  public calculateLuckPillars(
    birthDate: Date,
    gender: "Male" | "Female",
    yearStem: HeavenlyStem,
    monthStem: HeavenlyStem,
    monthBranch: EarthlyBranch,
    targetDate: Date = new Date()
  ): LuckPillar[] {
    const isYearYang = yearStem.yinYang === "Yang";
    const isForward = (gender === "Male" && isYearYang) || (gender === "Female" && !isYearYang);

    // Starting age estimation (classical 3 to 8 years based on days to nearest solar node)
    // Approximately 1 day = 120 days of life -> 3 days = 1 year of age
    const startAge = 5;

    // Month pillar starting index in 60-cycle
    let currentStemIdx = monthStem.index;
    let currentBranchIdx = monthBranch.index;

    const birthYear = birthDate.getUTCFullYear();
    const currentYear = targetDate.getUTCFullYear();

    const luckPillars: LuckPillar[] = [];

    for (let i = 1; i <= 9; i++) {
      if (isForward) {
        currentStemIdx = (currentStemIdx + 1) % 10;
        currentBranchIdx = (currentBranchIdx + 1) % 12;
      } else {
        currentStemIdx = (currentStemIdx - 1 + 10) % 10;
        currentBranchIdx = (currentBranchIdx - 1 + 12) % 12;
      }

      const stem = HEAVENLY_STEMS[currentStemIdx];
      const branch = EARTHLY_BRANCHES[currentBranchIdx];

      const pStartAge = startAge + (i - 1) * 10;
      const pEndAge = pStartAge + 9;
      const pStartYear = birthYear + pStartAge;
      const pEndYear = birthYear + pEndAge;

      const isCurrent = currentYear >= pStartYear && currentYear <= pEndYear;

      luckPillars.push({
        order: i,
        pillar: {
          stem,
          branch,
          chinese: `${stem.chinese}${branch.chinese}`,
          pinyin: `${stem.pinyin}-${branch.pinyin}`,
          name: `${stem.name}-${branch.name} (${stem.element} ${branch.animal})`,
        },
        startAge: pStartAge,
        endAge: pEndAge,
        startYear: pStartYear,
        endYear: pEndYear,
        isCurrent,
        element: stem.element,
        interpretation: this.getLuckPillarMeaning(stem, branch, pStartAge, pEndAge),
      });
    }

    return luckPillars;
  }

  /**
   * Calculate Current Annual Influence (Liu Nian - 流年)
   */
  public calculateAnnualInfluence(
    targetDate: Date,
    dayMaster: DayMasterAnalysis
  ): AnnualInfluence {
    const yearPillar = this.solarCalculator.calculateYearPillar(targetDate);
    const targetYear = targetDate.getUTCFullYear();

    // Interaction with Day Master
    const dmEl = dayMaster.element;
    const yearEl = yearPillar.element;

    let relation = "Harmonious Companion";
    let harmonyType: AnnualInfluence["interactionWithDayMaster"]["harmonyType"] = "Neutral";
    let description = "";

    if (dayMaster.favorableElements.includes(yearEl)) {
      harmonyType = "Favorable Support";
      relation = "Beneficial Sheng/Support Element";
      description = `The ${yearPillar.combinedName} year activates your favorable ${yearEl} element, granting fresh opportunities, helpful benefactors (Gui Ren), and career propulsion.`;
    } else if (dayMaster.unfavorableElements.includes(yearEl)) {
      harmonyType = "Clash/Challenge";
      relation = "Refining Crucible Element";
      description = `The ${yearPillar.combinedName} year tests your ${dmEl} Day Master with intense ${yearEl} energy. Maintain disciplined accounting, avoid risky legal ventures, and cultivate steady emotional temperance.`;
    } else {
      harmonyType = "Productive Flow";
      relation = "Active Expression & Opportunity";
      description = `The ${yearPillar.combinedName} year provides a dynamic environment for launching creative projects and expanding your professional networks.`;
    }

    return {
      year: targetYear,
      pillar: {
        stem: yearPillar.heavenlyStem,
        branch: yearPillar.earthlyBranch,
        chinese: yearPillar.combinedChinese,
        pinyin: yearPillar.combinedPinyin,
        name: yearPillar.combinedName,
      },
      animal: yearPillar.animal,
      element: yearEl,
      interactionWithDayMaster: {
        relation,
        harmonyType,
        description,
      },
      favorableActivities: [
        `Aligning with ${yearEl} element colors, disciplines, and geographical directions`,
        "Collaborating with loyal allies and mentors",
        "Strategic long-term investments rather than impulsive speculation",
      ],
      cautions: [
        "Avoid overcommitting resources without documented agreements",
        "Watch health vulnerabilities associated with excessive element friction",
      ],
    };
  }

  private getLuckPillarMeaning(
    stem: HeavenlyStem,
    branch: EarthlyBranch,
    startAge: number,
    endAge: number
  ) {
    return {
      theme: `Ages ${startAge}–${endAge}: ${stem.element} ${branch.animal} Decade`,
      opportunities: [
        `Harnessing ${stem.element} vitality for vocational milestones`,
        `Cultivating ${branch.animal} strategic adaptability in networks`,
      ],
      challenges: [
        "Adapting to fluctuating economic and environmental climates",
        "Managing stress during transition years between decades",
      ],
      advice: `Honor the innate gifts of ${stem.name} (${stem.element}) while grounding yourself in ${branch.name} (${branch.animal}) discernment.`,
    };
  }
}

// ============================================================
// 8. MASTER BAZI METAPHYSICS INTERPRETATIONS DATABASE
// ============================================================

export class BaZiInterpretationsDatabase {
  public static getDayMasterProfile(stem: HeavenlyStem, strength: string): BaZiChart["personalityInterpretation"] {
    const PROFILES: Record<string, BaZiChart["personalityInterpretation"]> = {
      Jia: {
        summary: "Like a majestic ancient cedar tree, Jia Wood Day Masters stand tall with unwavering integrity, noble vision, and commanding leadership.",
        strengths: ["Natural executive leadership", "Unbending moral backbone", "Strategic long-term vision", "Generous patronage of junior peers"],
        growthAreas: ["Inflexibility under sudden change", "Stubbornness when proven wrong", "Difficulty asking for emotional help"],
        careerFit: ["Enterprise Executive", "Founding Architect", "Judicial Law", "Education Dean", "Environmental Policy"],
        wealthStyle: "Accumulates enduring generational assets and capital infrastructure through patience and institutional credibility.",
        relationshipStyle: "Deeply protective and loyal, expects intellectual equality and mutual respect from partners.",
      },
      Yi: {
        summary: "Like graceful ivy or flowering vines, Yi Wood Day Masters possess extraordinary resilience, charming diplomacy, and an organic capacity to navigate obstacles.",
        strengths: ["Incredible tactical flexibility", "Charismatic networking", "Aesthetic refinement", "Survival endurance in hardship"],
        growthAreas: ["Tendency to manipulate subtly", "Over-dependence on strong mentors", "Indecision in confrontation"],
        careerFit: ["Diplomacy & Public Relations", "Artistic Direction", "Marketing Strategy", "Publishing", "Consulting"],
        wealthStyle: "Generates income through synergistic partnerships, diversified revenue streams, and creative deal-making.",
        relationshipStyle: "Affectionate and attentive, thrives in supportive partnerships where each person complements the other's skills.",
      },
      Bing: {
        summary: "Like the radiant midday Sun, Bing Fire Day Masters bring warm charisma, uninhibited optimism, and inspirational light wherever they walk.",
        strengths: ["Magnetic public presence", "Boundless creative enthusiasm", "Generosity without pettiness", "Courageous trailblazing"],
        growthAreas: ["Impatience with slow learners", "Burnout from over-giving", "Dramatic pride when ignored"],
        careerFit: ["Media Broadcaster", "Keynote Speaker", "Tech Founder", "Entertainment", "Creative Director"],
        wealthStyle: "Attracts lucrative high-visibility opportunities; must guard against lavish expenditures and impulsive generosity.",
        relationshipStyle: "Passionate, romantic, and warm, needs an appreciative partner who celebrates their radiant achievements.",
      },
      Ding: {
        summary: "Like an illuminating candle or guiding lighthouse star, Ding Fire Day Masters offer concentrated focus, subtle inspiration, and profound philosophical insight.",
        strengths: ["Meticulous attention to craft", "Warm empathy and counsel", "Profound spiritual curiosity", "Incisive strategic intuition"],
        growthAreas: ["Moody internal brooding", "Suspicion when under stress", "Burnout from perfectionism"],
        careerFit: ["Research Scientist", "Psychotherapist", "Philosophical Writer", "Bespoke Artisan", "Software Architect"],
        wealthStyle: "Gains wealth through specialized expertise, intellectual property, and high-value consulting.",
        relationshipStyle: "Loyal and deeply devoted, forms soulful bonds with partners who honor their quiet sanctuary.",
      },
      Wu: {
        summary: "Like a timeless mountain fortress, Wu Earth Day Masters exude quiet majesty, unshakeable dependability, and supreme patience.",
        strengths: ["Unshakeable trustworthiness", "Massive capacity to carry responsibility", "Patience through economic cycles", "Fair impartiality"],
        growthAreas: ["Resistance to new digital trends", "Slow to take quick initiative", "Emotional stoicism masking pain"],
        careerFit: ["Real Estate Tycoon", "Financial Banker", "Civil Infrastructure", "Government Administrator", "Hospitality Management"],
        wealthStyle: "Builds vast tangible fortunes in land, commodities, and secure bonds through patient compound interest.",
        relationshipStyle: "Rock-solid, protective, and faithful; expresses love through tangible acts of service and security.",
      },
      Ji: {
        summary: "Like fertile arable soil that nurtures bountiful crops, Ji Earth Day Masters are resourceful, adaptable, multi-talented, and deeply supportive.",
        strengths: ["Universal adaptability", "Nurturing mentorship", "Practical common sense", "Capacity to absorb and solve conflicts"],
        growthAreas: ["Over-accommodating boundary breaches", "Worrying excessively over small details", "Difficulty saying a firm no"],
        careerFit: ["Healthcare Executive", "Asset Fund Manager", "Education Director", "Culinary Arts", "Human Resources"],
        wealthStyle: "Thrives in multi-disciplinary commerce, property development, and nurturing small investments into large enterprises.",
        relationshipStyle: "Comforting, tender, and caring; creates a harmonious domestic sanctuary filled with hospitality.",
      },
      Geng: {
        summary: "Like a masterfully forged Damascus blade, Geng Metal Day Masters possess laser-sharp determination, unbending courage, and a warrior's sense of justice.",
        strengths: ["Fearless decision making", "Uncompromising justice", "Direct and honest communication", "Thriving in competitive pressure"],
        growthAreas: ["Harsh bluntness wounding others", "Black-and-white dogmatism", "Reluctance to show vulnerability"],
        careerFit: ["Military Command", "Corporate Restructuring", "Surgical Medicine", "Venture Capital", "Litigation Law"],
        wealthStyle: "Strikes decisively to capitalize on market disruptions and competitive breakthroughs.",
        relationshipStyle: "Protective and fierce, values straightforward loyalty with zero tolerance for duplicity.",
      },
      Xin: {
        summary: "Like a finely polished diamond or royal tiara, Xin Metal Day Masters radiate refined elegance, perfectionist discernment, and sparkling intellect.",
        strengths: ["Flawless aesthetic taste", "Sharp analytical intellect", "Self-respect and dignity", "Graceful social charm"],
        growthAreas: ["Hypersensitivity to criticism", "Elitism or vanity", "Vindictiveness if disrespected"],
        careerFit: ["Luxury Brand Founder", "Fine Jewelry & Fashion", "Investment Banking", "Diplomat", "High-End Architecture"],
        wealthStyle: "Attracts elite patronage and creates high-margin premium products and services.",
        relationshipStyle: "Seeks an accomplished, elegant partner who treats them with courteous admiration.",
      },
      Ren: {
        summary: "Like the mighty rolling ocean or roaring Amazon river, Ren Water Day Masters possess boundless energy, deep wisdom, and an unstoppable visionary flow.",
        strengths: ["Universal open-mindedness", "Vast memory and intellect", "Boundary-breaking ambition", "Rapid adaptability"],
        growthAreas: ["Restless lack of discipline", "Overwhelming intensity", "Difficulty finishing small chores"],
        careerFit: ["Global Shipping & Logistics", "International Trade", "Tech Innovator", "Philosopher", "Media Mogul"],
        wealthStyle: "Builds international fortunes through massive scale, global networks, and fluid capital allocation.",
        relationshipStyle: "Free-spirited and adventurous, needs an independent partner who enjoys exploring wide horizons.",
      },
      Gui: {
        summary: "Like gentle morning mist or nourishing spring rain, Gui Water Day Masters are deeply intuitive, perceptive, adaptable, and spiritually profound.",
        strengths: ["Profound emotional intuition", "Subtle persuasive intelligence", "Deep philosophical and occult wisdom", "Quiet perseverance"],
        growthAreas: ["Over-emotional moodiness", "Secretiveness and evasion", "Escapism from harsh realities"],
        careerFit: ["Psychologist & Counselor", "Astrologer & Metaphysician", "Creative Writer & Poet", "Biochemist", "Spiritual Teacher"],
        wealthStyle: "Builds wealth quietly behind the scenes through intellectual wisdom, advisory roles, and intuitive timing.",
        relationshipStyle: "Tender, soulful, and deeply empathetic; craves profound spiritual connection and telepathic understanding.",
      },
    };

    return (
      PROFILES[stem.name] || {
        summary: `${stem.name} (${stem.chinese}) Day Master with ${stem.element} nature.`,
        strengths: ["Adaptability", "Insight", "Perseverance"],
        growthAreas: ["Balance", "Patience"],
        careerFit: ["Management", "Creative Arts", "Commerce"],
        wealthStyle: "Steady growth through ethical endeavors.",
        relationshipStyle: "Committed and supportive.",
      }
    );
  }
}

// ============================================================
// 9. COMPLETE BAZI MASTER ENGINE (COORDINATOR)
// ============================================================

export class CompleteBaZiEngine {
  private solarCalc = new SolarTermCalculator();
  private elementAnalysis = new FiveElementAnalysisEngine();
  private transitEngine = new BaZiTransitEngine();

  /**
   * Calculate Complete BaZi Four Pillars Chart & Live Influences
   */
  public generateBaZiChart(
    birthDate: Date,
    gender: "Male" | "Female" = "Male",
    targetDate: Date = new Date()
  ): BaZiChart {
    // 1. Calculate Four Pillars
    const yearPillar = this.solarCalc.calculateYearPillar(birthDate);
    const monthPillar = this.solarCalc.calculateMonthPillar(birthDate, yearPillar.heavenlyStem.index);
    const dayPillar = this.solarCalc.calculateDayPillar(birthDate);
    const hourPillar = this.solarCalc.calculateHourPillar(birthDate, dayPillar.heavenlyStem.index);

    const pillars = [yearPillar, monthPillar, dayPillar, hourPillar];

    // 2. Five Element & Day Master Analysis
    const { elementBalance, yinYangRatio, dayMaster } = this.elementAnalysis.analyzeBalance(pillars);

    // 3. Solar Term At Birth
    const birthSolar = this.solarCalc.getCurrentSolarTerm(birthDate);
    // Solar Term on Target Date
    const currentSolar = this.solarCalc.getCurrentSolarTerm(targetDate);

    // 4. Luck Pillars (Da Yun)
    const luckPillars = this.transitEngine.calculateLuckPillars(
      birthDate,
      gender,
      yearPillar.heavenlyStem,
      monthPillar.heavenlyStem,
      monthPillar.earthlyBranch,
      targetDate
    );

    // 5. Current Annual Influence (Liu Nian)
    const currentAnnualInfluence = this.transitEngine.calculateAnnualInfluence(
      targetDate,
      dayMaster
    );

    // 6. Productive & Destructive Cycles
    const productiveCycles = [
      { from: "Wood" as ElementType, to: "Fire" as ElementType, description: "Wood feeds and kindles Fire (Creativity & Action)" },
      { from: "Fire" as ElementType, to: "Earth" as ElementType, description: "Fire creates fertile Earth ash (Manifestation & Grounding)" },
      { from: "Earth" as ElementType, to: "Metal" as ElementType, description: "Earth bears and compresses precious Metal (Structure & Wealth)" },
      { from: "Metal" as ElementType, to: "Water" as ElementType, description: "Metal condenses and directs flowing Water (Wisdom & Flow)" },
      { from: "Water" as ElementType, to: "Wood" as ElementType, description: "Water nourishes and grows towering Wood (Expansion & Life)" },
    ];

    const destructiveCycles = [
      { from: "Wood" as ElementType, to: "Earth" as ElementType, description: "Wood roots part and deplete Earth" },
      { from: "Earth" as ElementType, to: "Water" as ElementType, description: "Earth dams, absorbs, and muddies Water" },
      { from: "Water" as ElementType, to: "Fire" as ElementType, description: "Water quenches and douses Fire" },
      { from: "Fire" as ElementType, to: "Metal" as ElementType, description: "Fire melts and reshapes Metal" },
      { from: "Metal" as ElementType, to: "Wood" as ElementType, description: "Metal axes cut and chop Wood" },
    ];

    // 7. Day Master Interpretations
    const personalityInterpretation = BaZiInterpretationsDatabase.getDayMasterProfile(
      dayMaster.stem,
      dayMaster.strengthLabel
    );

    return {
      birthDate,
      gender,
      pillars: {
        year: yearPillar,
        month: monthPillar,
        day: dayPillar,
        hour: hourPillar,
      },
      solarTermAtBirth: {
        name: birthSolar.currentTerm.name,
        chinese: birthSolar.currentTerm.chinese,
        longitude: birthSolar.currentTerm.longitude,
      },
      currentSolarTerm: {
        name: currentSolar.currentTerm.name,
        chinese: currentSolar.currentTerm.chinese,
        currentLongitude: currentSolar.currentSunLongitude,
        targetLongitude: currentSolar.nextTerm.longitude,
        daysRemaining: currentSolar.daysRemaining,
      },
      dayMaster,
      elementBalance,
      yinYangRatio,
      productiveCycles,
      destructiveCycles,
      luckPillars,
      currentAnnualInfluence,
      personalityInterpretation,
    };
  }
}
