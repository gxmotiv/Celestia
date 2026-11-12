/**
 * Universal Numerology Engine - Type Definitions
 * Encompasses Pythagorean (14 numbers), Indian Vedic (12 elements + remedies),
 * Chaldean (Compound 10-52), Chinese Lo Shu Grid, Kabbalah Tree of Life,
 * and Tamil En Kaniyam.
 */

// ==========================================
// 1. PYTHAGOREAN SYSTEM TYPES
// ==========================================

export interface Pinnacle {
  number: number;
  isMaster: boolean;
  ageRange: string;
  theme: string;
  description: string;
  opportunity: string;
}

export interface Challenge {
  number: number;
  level: string; // "First Challenge", "Second Challenge", "Third (Main) Challenge", "Fourth Challenge"
  obstacle: string;
  lesson: string;
  advice: string;
}

export interface KarmicLesson {
  number: number;
  lesson: string;
  healingGuidance: string;
}

export interface HiddenPassion {
  numbers: number[];
  count: number;
  meaning: string;
  traits: string[];
}

export interface ExpressionPlanes {
  physical: { count: number; percentage: number; letters: string[] };
  mental: { count: number; percentage: number; letters: string[] };
  emotional: { count: number; percentage: number; letters: string[] };
  intuitive: { count: number; percentage: number; letters: string[] };
  dominantPlane: "Physical" | "Mental" | "Emotional" | "Intuitive" | "Balanced";
  interpretation: string;
}

export interface PythagoreanProfile {
  // Core Numbers
  lifePathNumber: number;
  lifePathRaw: string;
  isMasterLifePath: boolean;
  expressionNumber: number;
  isMasterExpression: boolean;
  soulUrgeNumber: number;
  isMasterSoulUrge: boolean;
  personalityNumber: number;
  isMasterPersonality: boolean;
  birthdayNumber: number;
  maturityNumber: number;
  personalYearNumber: number;
  attitudeNumber: number; // Sun Number (Month + Day)
  currentYear: number;

  // Advanced Numbers
  pinnacles: Pinnacle[];
  challenges: Challenge[];
  karmicLessons: KarmicLesson[];
  hiddenPassion: HiddenPassion;
  balanceNumber: number;
  balanceInterpretation: string;
  expressionPlanes: ExpressionPlanes;

  // Metadata
  letterCounts: Record<number, number>;
  detailedInterpretations: {
    lifePath: { title: string; archetype: string; description: string; shadow: string };
    expression: { title: string; archetype: string; description: string };
    soulUrge: { title: string; archetype: string; description: string };
    personality: { title: string; archetype: string; description: string };
    personalYear: { title: string; theme: string; guidance: string };
    maturity: { title: string; theme: string; description: string };
    attitude: { title: string; theme: string; description: string };
  };
}

// ==========================================
// 2. INDIAN VEDIC (SANKHYA SHASTRA) TYPES
// ==========================================

export interface VedicGemstoneRemedy {
  name: string;
  sanskrit: string;
  carat: string;
  metal: string;
  finger: string;
  day: string;
  time: string;
  substituteGems: string[];
}

export interface VedicMantraRemedy {
  sanskrit: string;
  transliteration: string;
  count: number;
  time: string;
  duration: string;
  beads: string;
}

export interface VedicCharityRemedy {
  items: string[];
  day: string;
  timing: string;
  recipient: string;
}

export interface VedicPlanetDetails {
  number: number;
  planet: string;
  sanskrit: string;
  deity: { primary: string; secondary: string; worship: string };
  day: string;
  color: { favorable: string[]; unfavorable: string[] };
  gemstone: VedicGemstoneRemedy;
  mantra: VedicMantraRemedy;
  metal: string;
  direction: { favorable: string; unfavorable: string };
  friendlyNumbers: number[];
  enemyNumbers: number[];
  neutralNumbers: number[];
  bodyParts: string[];
  career: string[];
  fast: { day: string; method: string };
  yantra: { name: string; material: string; method: string };
  generalRemedies: {
    gemstone: string;
    mantra: string;
    charity: string;
    color: string;
  };
}

export interface VedicNumerologyProfile {
  mulank: number; // Psychic / Driver Number (Day 1-31 reduced to 1-9)
  bhagyank: number; // Destiny / Conductor Number (Total birthdate reduced to 1-9)
  namank: number; // Name Number (Vedic phonetic sum)
  rulingPlanetMulank: VedicPlanetDetails;
  rulingPlanetBhagyank: VedicPlanetDetails;
  mulankBhagyankRelation: "Highly Auspicious" | "Supportive / Friendly" | "Neutral / Karmic" | "Challenging / Enemy";
  relationAnalysis: string;
  favorableDates: number[];
  favorableDays: string[];
  favorableMonths: string[];
  luckyColors: string[];
  unluckyColors: string[];
  gemstoneRemedy: VedicGemstoneRemedy;
  mantraRemedy: VedicMantraRemedy;
  charityRemedy: VedicCharityRemedy;
  careerGuidance: string[];
  healthPredispositions: string[];
}

// ==========================================
// 3. CHALDEAN SYSTEM TYPES
// ==========================================

export interface ChaldeanCompoundMeaning {
  number: number;
  title: string;
  nature: string;
  occultSignificance: string;
  warning: string;
  advice: string;
  fortuneCategory: "Extremely Fortunate" | "Fortunate" | "Karmic Trial / Warning" | "Mystic / Dual" | "Caution Required" | "Neutral";
}

export interface ChaldeanNameComponent {
  name: string;
  compoundNumber: number;
  singleRoot: number;
  compoundMeaning: ChaldeanCompoundMeaning;
}

export interface ChaldeanProfile {
  fullName: ChaldeanNameComponent;
  firstName: ChaldeanNameComponent;
  lastName: ChaldeanNameComponent;
  vibrationalCompatibility: string;
  cheiroGuidance: string;
}

// ==========================================
// 4. CHINESE LO SHU GRID TYPES
// ==========================================

export interface LoShuArrow {
  name: string;
  type: "Strength" | "Weakness";
  numbers: number[];
  isPresent: boolean;
  meaning: string;
  guidance: string;
}

export interface LoShuMissingNumber {
  number: number;
  element: "Water" | "Earth" | "Wood" | "Metal" | "Fire";
  weakness: string;
  fengShuiRemedy: string;
  remedyItems: string[];
}

export interface LoShuExcessNumber {
  number: number;
  count: number;
  trait: string;
  advice: string;
}

export interface LoShuAnalysis {
  grid: number[][]; // 3x3 array containing counts of digits in their standard Lo Shu positions
  originalSquare: number[][]; // [[4,9,2], [3,5,7], [8,1,6]]
  digitCounts: Record<number, number>;
  arrowsOfStrength: LoShuArrow[];
  arrowsOfWeakness: LoShuArrow[];
  missingNumbers: LoShuMissingNumber[];
  excessNumbers: LoShuExcessNumber[];
  dominantElement: string;
  lifeBalanceScore: number; // 0 - 100
  overallInterpretation: string;
}

// ==========================================
// 5. KABBALAH NUMEROLOGY TYPES
// ==========================================

export interface Sephirah {
  number: number;
  name: string;
  hebrew: string;
  meaning: string;
  planet: string;
  element: string;
  divineAttribute: string;
  spiritualLesson: string;
}

export interface KabbalahPath {
  pathNumber: number;
  fromSephirah: number;
  toSephirah: number;
  hebrewLetter: string;
  tarotCard: string;
  meaning: string;
}

export interface KabbalahProfile {
  hebrewGematriaValue: number;
  hebrewReducedValue: number;
  soulSephirah: Sephirah;
  outerLifeSephirah: Sephirah;
  connectingPath?: KabbalahPath;
  allSephiroth: Sephirah[];
  allPaths: KabbalahPath[];
  transliteratedLetters: { letter: string; hebrew: string; value: number }[];
  mysticalReading: string;
}

// ==========================================
// 6. TAMIL NUMEROLOGY (EN KANIYAM) TYPES
// ==========================================

export interface TamilNumerologyProfile {
  janmaEn: number; // Birth number
  vidhiEn: number; // Destiny number
  peyarEn: number; // Name number in Tamil system
  tamilGraha: string;
  auspiciousDays: string[];
  auspiciousColors: string[];
  auspiciousGems: string[];
  auspiciousDirections: string[];
  luckyInitialSounds: string[];
  marriageHarmonyNumbers: number[];
  businessHarmonyNumbers: number[];
  tamilProverbGuidance: string;
}

// ==========================================
// 7. MASTER UNIVERSAL NUMEROLOGY REPORT
// ==========================================

export interface CompleteNumerologyReport {
  fullName: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  pythagorean: PythagoreanProfile;
  vedic: VedicNumerologyProfile;
  chaldean: ChaldeanProfile;
  loShu: LoShuAnalysis;
  kabbalah: KabbalahProfile;
  tamil: TamilNumerologyProfile;
  crossSystemSynthesis: {
    resonanceScore: number; // 0 - 100
    unifiedArchetype: string;
    coreKarmicTheme: string;
    actionableDirectives: string[];
  };
}
