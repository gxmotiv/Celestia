/**
 * Complete Chinese Lo Shu Grid Engine
 * The Sacred 3x3 Magic Square (Sum = 15):
 * [4, 9, 2]
 * [3, 5, 7]
 * [8, 1, 6]
 *
 * Implements:
 * 1. Personal grid digit frequency analysis
 * 2. 8 Arrows of Strength (Present combinations)
 * 3. 8 Arrows of Weakness / Emptiness (Missing combinations)
 * 4. Missing Numbers analysis with Feng Shui & Elemental Remedies
 * 5. Excess Numbers (3+ occurrences) analysis and balancing advice
 * 6. Dominant Five Elements (Wu Xing) analysis
 */

import {
  LoShuAnalysis,
  LoShuArrow,
  LoShuMissingNumber,
  LoShuExcessNumber,
} from "./types";

export const SACRED_LO_SHU_SQUARE = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
];

export const ELEMENT_MAPPINGS: Record<number, { element: "Water" | "Earth" | "Wood" | "Metal" | "Fire"; baguaArea: string; direction: string }> = {
  1: { element: "Water", baguaArea: "Career & Life Journey", direction: "North" },
  2: { element: "Earth", baguaArea: "Love, Marriage & Relationships", direction: "South-West" },
  3: { element: "Wood", baguaArea: "Family & New Beginnings", direction: "East" },
  4: { element: "Wood", baguaArea: "Wealth, Abundance & Blessings", direction: "South-East" },
  5: { element: "Earth", baguaArea: "Health, Vitality & Sacred Center (Tai Chi)", direction: "Center" },
  6: { element: "Metal", baguaArea: "Helpful People, Mentors & Travel", direction: "North-West" },
  7: { element: "Metal", baguaArea: "Children, Creativity & Legacy", direction: "West" },
  8: { element: "Earth", baguaArea: "Knowledge, Wisdom & Spiritual Growth", direction: "North-East" },
  9: { element: "Fire", baguaArea: "Fame, Reputation & Illumination", direction: "South" },
};

export class LoShuGridCalculator {
  /**
   * Extract all digits from birth date (YYYY-MM-DD)
   */
  public static getAllDigits(year: number, month: number, day: number): number[] {
    const str = `${year}${month < 10 ? "0" + month : month}${day < 10 ? "0" + day : day}`;
    const digits: number[] = [];
    for (const char of str) {
      const d = parseInt(char, 10);
      if (d >= 1 && d <= 9) {
        digits.push(d);
      }
    }
    return digits;
  }

  /**
   * Count occurrences of each digit 1-9
   */
  public static countDigits(digits: number[]): Record<number, number> {
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    for (const d of digits) {
      if (counts[d] !== undefined) {
        counts[d]++;
      }
    }
    return counts;
  }

  /**
   * Build the 3x3 Personal Grid containing counts
   */
  public static buildPersonalGrid(counts: Record<number, number>): number[][] {
    return [
      [counts[4], counts[9], counts[2]],
      [counts[3], counts[5], counts[7]],
      [counts[8], counts[1], counts[6]],
    ];
  }

  /**
   * 8 Arrows of Strength (Present when all 3 numbers > 0)
   */
  public static findArrowsOfStrength(counts: Record<number, number>): LoShuArrow[] {
    const arrows: LoShuArrow[] = [];

    // 1. Planning Arrow (1-2-3)
    const has123 = counts[1] > 0 && counts[2] > 0 && counts[3] > 0;
    arrows.push({
      name: "Planning Arrow (1-2-3)",
      type: "Strength",
      numbers: [1, 2, 3],
      isPresent: has123,
      meaning: "Organized, strategic thinker with exceptional methodical planning capability.",
      guidance: "You excel at formulating long-term strategies, orchestrating logistical details, and setting realistic milestones.",
    });

    // 2. Willpower Arrow (4-5-6)
    const has456 = counts[4] > 0 && counts[5] > 0 && counts[6] > 0;
    arrows.push({
      name: "Willpower Arrow (4-5-6)",
      type: "Strength",
      numbers: [4, 5, 6],
      isPresent: has456,
      meaning: "Unshakable determination, relentless persistence, and sovereign stamina.",
      guidance: "You possess monumental grit. Obstacles that defeat others only sharpen your resolve. Avoid stubborn inflexibility.",
    });

    // 3. Action Arrow (7-8-9)
    const has789 = counts[7] > 0 && counts[8] > 0 && counts[9] > 0;
    arrows.push({
      name: "Action Arrow (7-8-9)",
      type: "Strength",
      numbers: [7, 8, 9],
      isPresent: has789,
      meaning: "High kinetic energy, physical execution, and decisive real-world velocity.",
      guidance: "You are a doer who turns concepts into physical reality quickly without wasting time in endless debate.",
    });

    // 4. Thought Arrow (1-4-7)
    const has147 = counts[1] > 0 && counts[4] > 0 && counts[7] > 0;
    arrows.push({
      name: "Thought Arrow (1-4-7)",
      type: "Strength",
      numbers: [1, 4, 7],
      isPresent: has147,
      meaning: "Intellectual acumen, structured analytical thinking, and realistic logic.",
      guidance: "You view the world through clear empirical evidence, robust models, and structured intellectual frameworks.",
    });

    // 5. Emotion Arrow (2-5-8)
    const has258 = counts[2] > 0 && counts[5] > 0 && counts[8] > 0;
    arrows.push({
      name: "Emotion Arrow (2-5-8)",
      type: "Strength",
      numbers: [2, 5, 8],
      isPresent: has258,
      meaning: "Emotional equilibrium, empathic sensitivity, and heart-centered balance.",
      guidance: "You possess profound emotional intelligence, intuitive warmth, and deep spiritual empathy for all living beings.",
    });

    // 6. Expression Arrow (3-6-9)
    const has369 = counts[3] > 0 && counts[6] > 0 && counts[9] > 0;
    arrows.push({
      name: "Expression Arrow (3-6-9)",
      type: "Strength",
      numbers: [3, 6, 9],
      isPresent: has369,
      meaning: "Creative imagination, lyrical rhetoric, artistic radiance, and philosophical vision.",
      guidance: "You are blessed with inspiring creative oratory, writing gifts, and a mind that naturally grasps grand philosophical concepts.",
    });

    // 7. Determination Arrow (1-5-9)
    const has159 = counts[1] > 0 && counts[5] > 0 && counts[9] > 0;
    arrows.push({
      name: "Determination Arrow (1-5-9)",
      type: "Strength",
      numbers: [1, 5, 9],
      isPresent: has159,
      meaning: "Persistent tenacity, patient endurance, and refusal to surrender until victory is achieved.",
      guidance: "You are resilient and laser-focused; failure is simply a diagnostic feedback loop on your way to ultimate success.",
    });

    // 8. Compassion Arrow (3-5-7)
    const has357 = counts[3] > 0 && counts[5] > 0 && counts[7] > 0;
    arrows.push({
      name: "Compassion Arrow (3-5-7)",
      type: "Strength",
      numbers: [3, 5, 7],
      isPresent: has357,
      meaning: "Spiritual benevolence, holistic healing capacity, and empathetic intuition.",
      guidance: "You have a natural healer's aura, deep philosophical wisdom, and serene acceptance of life's mystic mysteries.",
    });

    return arrows;
  }

  /**
   * 8 Arrows of Weakness / Emptiness (Present when all 3 numbers == 0)
   */
  public static findArrowsOfWeakness(counts: Record<number, number>): LoShuArrow[] {
    const arrows: LoShuArrow[] = [];

    // 1. Arrow of Frustration (Missing 4-5-6)
    const empty456 = counts[4] === 0 && counts[5] === 0 && counts[6] === 0;
    arrows.push({
      name: "Arrow of Frustration (Empty 4-5-6)",
      type: "Weakness",
      numbers: [4, 5, 6],
      isPresent: empty456,
      meaning: "Prone to discouragement when results take time; vulnerability to feeling stuck.",
      guidance: "Remedy: Strengthen the center with Earth crystals (citrine/pyrite) and establish structured daily perseverance.",
    });

    // 2. Arrow of Inaction / Hesitation (Empty 7-8-9)
    const empty789 = counts[7] === 0 && counts[8] === 0 && counts[9] === 0;
    arrows.push({
      name: "Arrow of Inaction (Empty 7-8-9)",
      type: "Weakness",
      numbers: [7, 8, 9],
      isPresent: empty789,
      meaning: "Over-theorizing ideas while procrastinating on actual physical execution.",
      guidance: "Remedy: Break grand visions into 15-minute daily action sprints; surround yourself with high-execution partners.",
    });

    // 3. Arrow of Disorder / Confusion (Empty 1-2-3)
    const empty123 = counts[1] === 0 && counts[2] === 0 && counts[3] === 0;
    arrows.push({
      name: "Arrow of Disorder (Empty 1-2-3)",
      type: "Weakness",
      numbers: [1, 2, 3],
      isPresent: empty123,
      meaning: "Difficulty in methodical planning and organizing priorities before jumping into work.",
      guidance: "Remedy: Keep physical written planners, visual timelines, and consult methodical mentors before launching.",
    });

    // 4. Arrow of Poor Memory / Mental Fatigue (Empty 3-6-9)
    const empty369 = counts[3] === 0 && counts[6] === 0 && counts[9] === 0;
    arrows.push({
      name: "Arrow of Mental Fatigue (Empty 3-6-9)",
      type: "Weakness",
      numbers: [3, 6, 9],
      isPresent: empty369,
      meaning: "Tendency toward mental exhaustion or difficulty expressing emotions lyrically.",
      guidance: "Remedy: Practice creative journaling, take brain nutrients (Brahmi/Lion's Mane), and paint or sing.",
    });

    // 5. Arrow of Skepticism / Disillusion (Empty 3-5-7)
    const empty357 = counts[3] === 0 && counts[5] === 0 && counts[7] === 0;
    arrows.push({
      name: "Arrow of Skepticism (Empty 3-5-7)",
      type: "Weakness",
      numbers: [3, 5, 7],
      isPresent: empty357,
      meaning: "Cynical mistrust of feelings or spiritual phenomena; emotional guardedness.",
      guidance: "Remedy: Spend time in pristine nature, practice meditation, and open your heart to trust beyond what can be measured.",
    });

    // 6. Arrow of Indecision (Empty 1-5-9)
    const empty159 = counts[1] === 0 && counts[5] === 0 && counts[9] === 0;
    arrows.push({
      name: "Arrow of Indecision (Empty 1-5-9)",
      type: "Weakness",
      numbers: [1, 5, 9],
      isPresent: empty159,
      meaning: "Wavering between competing paths; difficulty maintaining focus to the finish line.",
      guidance: "Remedy: Commit to one primary mission for 90 days without altering course.",
    });

    // 7. Arrow of Hypersensitivity (Empty 2-5-8)
    const empty258 = counts[2] === 0 && counts[5] === 0 && counts[8] === 0;
    arrows.push({
      name: "Arrow of Hypersensitivity (Empty 2-5-8)",
      type: "Weakness",
      numbers: [2, 5, 8],
      isPresent: empty258,
      meaning: "Fragile emotional boundaries; taking criticism deeply to heart; mood swings.",
      guidance: "Remedy: Ground your emotional body through walking barefoot on soil, breathwork, and healthy boundaries.",
    });

    // 8. Arrow of Impracticality (Empty 1-4-7)
    const empty147 = counts[1] === 0 && counts[4] === 0 && counts[7] === 0;
    arrows.push({
      name: "Arrow of Impracticality (Empty 1-4-7)",
      type: "Weakness",
      numbers: [1, 4, 7],
      isPresent: empty147,
      meaning: "Detached idealism without grounding in pragmatic budgets, schedules, or contracts.",
      guidance: "Remedy: Partner with realistic operations managers; establish strict accounting discipline.",
    });

    return arrows;
  }

  /**
   * Find Missing Numbers and their Feng Shui / Elemental Remedies
   */
  public static findMissingNumbers(counts: Record<number, number>): LoShuMissingNumber[] {
    const missing: LoShuMissingNumber[] = [];

    const remedies: Record<number, { weakness: string; fengShui: string; items: string[] }> = {
      1: {
        weakness: "Missing Water (1): Career ambiguity, difficulty articulating personal identity, or lack of fluid adaptability.",
        fengShui: "Activate the North sector of your home/workspace with flowing water features, aquariums, or dark blue/black decor.",
        items: ["Desktop water fountain", "Blue quartz / Lapis Lazuli", "Curved mirrors", "North-facing water artwork"],
      },
      2: {
        weakness: "Missing Earth (2): Impatience in partnerships, difficulty sensing others' feelings, or loneliness.",
        fengShui: "Enhance the South-West sector with pairs of objects (two rose quartz hearts, two mandarin ducks) and warm terracotta tones.",
        items: ["Rose Quartz crystals", "Paired ceramic lamps", "Pink/peach textiles", "South-West earth pottery"],
      },
      3: {
        weakness: "Missing Wood (3): Lack of creative confidence, difficulty initiating new family traditions, or low optimism.",
        fengShui: "Energize the East sector with thriving living plants, bamboo, and vibrant emerald green accents.",
        items: ["Lucky Bamboo in water", "Jade plant", "Wooden wind chimes", "East-facing botanical art"],
      },
      4: {
        weakness: "Missing Wood (4): Financial disorganization, difficulty retaining wealth, or lack of disciplined order.",
        fengShui: "Fortify the South-East wealth corner with a money plant, citrine crystals, and healthy wooden furniture.",
        items: ["Crassula Ovata (Jade Money Plant)", "Natural Citrine cluster", "Wooden jewelry box", "Purple/green wealth accents"],
      },
      5: {
        weakness: "Missing Earth (5 - Tai Chi Center): Instability, fluctuating energy levels, or feeling ungrounded in life.",
        fengShui: "Sanctify the center of your home with crystal chandeliers, natural yellow stone globes, or ceramic vases. Keep this area clutter-free.",
        items: ["Yellow calcite or Pyrite sphere", "Terracotta pottery in center", "Warm golden lighting", "Clear center space"],
      },
      6: {
        weakness: "Missing Metal (6): Feeling unsupported by mentors, difficulty receiving help from superiors, or family friction.",
        fengShui: "Activate the North-West sector with hollow metallic wind chimes, silver bowls, and symbols of wise mentors.",
        items: ["6-rod hollow brass wind chime", "Polished silver coin bowl", "Clear Quartz point", "North-West metallic decor"],
      },
      7: {
        weakness: "Missing Metal (7): Struggles with completing creative projects, lack of analytical patience, or detachment from children.",
        fengShui: "Place round metallic objects, white ceramic sculptures, or creative instruments in the West sector.",
        items: ["Singing bowl (brass/bronze)", "Hematite or Pyrite stone", "Round metal photo frames", "West creativity corner"],
      },
      8: {
        weakness: "Missing Earth (8): Difficulty in disciplined study, financial oversight, or spiritual restlessness.",
        fengShui: "Enhance the North-East knowledge sector with a library corner, amethyst geode, and quiet meditation lighting.",
        items: ["Amethyst crystal cluster", "Study desk facing North-East", "Rock salt lamp", "Spiritual books collection"],
      },
      9: {
        weakness: "Missing Fire (9): Lack of public recognition, suppressed ambition, or low enthusiasm for social visibility.",
        fengShui: "Illuminate the South reputation sector with red candles, triangular shapes, radiant lighting, and diploma certificates.",
        items: ["Red Himalayan salt lamp", "Awards and framed credentials", "Carnelian / Red Jasper", "South-facing bright light"],
      },
    };

    for (let i = 1; i <= 9; i++) {
      if (counts[i] === 0) {
        missing.push({
          number: i,
          element: ELEMENT_MAPPINGS[i].element,
          weakness: remedies[i].weakness,
          fengShuiRemedy: remedies[i].fengShui,
          remedyItems: remedies[i].items,
        });
      }
    }

    return missing;
  }

  /**
   * Find Excess Numbers (3 or more occurrences)
   */
  public static findExcessNumbers(counts: Record<number, number>): LoShuExcessNumber[] {
    const excess: LoShuExcessNumber[] = [];

    const excessInfo: Record<number, { trait: string; advice: string }> = {
      1: {
        trait: "Excess 1s (3+): Intense self-focus, argumentative tendencies, or difficulty taking advice from others.",
        advice: "Practice active listening; validate others' points of view before asserting your own.",
      },
      2: {
        trait: "Excess 2s (3+): Over-sensitivity, emotional dependency, or living in fear of being rejected.",
        advice: "Strengthen emotional autonomy; do not define your self-worth by others' approval.",
      },
      3: {
        trait: "Excess 3s (3+): Hyperactive imagination leading to anxiety, excessive talking, or scattered attention.",
        advice: "Channel excess verbal and artistic energy into structured writing or disciplined performance.",
      },
      4: {
        trait: "Excess 4s (3+): Dogmatic rigidity, perfectionist paralysis, or extreme fear of financial risk.",
        advice: "Introduce play, flexibility, and spontaneous fun into your structured schedule.",
      },
      5: {
        trait: "Excess 5s (3+): Reckless sensation-seeking, severe restlessness, or emotional volatility.",
        advice: "Practice daily breathwork and yoga; ground your restless spirit in nature walks.",
      },
      6: {
        trait: "Excess 6s (3+): Smothering over-protectiveness, micromanaging loved ones, or martyr complex.",
        advice: "Allow loved ones the dignity of making their own mistakes. Focus on self-nurturing.",
      },
      7: {
        trait: "Excess 7s (3+): Cynical aloofness, emotional isolation, or living exclusively in the intellectual head.",
        advice: "Open your heart; express warmth and vulnerability to trusted companions.",
      },
      8: {
        trait: "Excess 8s (3+): Materialistic fixation, workaholism, or aggressive executive control.",
        advice: "Practice generous charitable donations and recognize that the best things in life are non-material.",
      },
      9: {
        trait: "Excess 9s (3+): Unrealistic utopian ideals, dramatized grief, or carrying the weight of the universe.",
        advice: "Focus on small, tangible local kindnesses rather than torturing yourself over global tragedies.",
      },
    };

    for (let i = 1; i <= 9; i++) {
      if (counts[i] >= 3) {
        excess.push({
          number: i,
          count: counts[i],
          trait: excessInfo[i].trait,
          advice: excessInfo[i].advice,
        });
      }
    }

    return excess;
  }

  /**
   * Master Lo Shu Analysis Generator
   */
  public static calculate(birthYear: number, birthMonth: number, birthDay: number): LoShuAnalysis {
    const digits = this.getAllDigits(birthYear, birthMonth, birthDay);
    const digitCounts = this.countDigits(digits);
    const grid = this.buildPersonalGrid(digitCounts);
    const arrowsOfStrength = this.findArrowsOfStrength(digitCounts);
    const arrowsOfWeakness = this.findArrowsOfWeakness(digitCounts);
    const missingNumbers = this.findMissingNumbers(digitCounts);
    const excessNumbers = this.findExcessNumbers(digitCounts);

    // Calculate Element distribution
    const elementCounts: Record<string, number> = { Water: 0, Earth: 0, Wood: 0, Metal: 0, Fire: 0 };
    for (let i = 1; i <= 9; i++) {
      const el = ELEMENT_MAPPINGS[i].element;
      elementCounts[el] += digitCounts[i];
    }

    let dominantElement = "Earth";
    let maxElCount = -1;
    for (const [el, cnt] of Object.entries(elementCounts)) {
      if (cnt > maxElCount) {
        maxElCount = cnt;
        dominantElement = el;
      }
    }

    // Balance score: 100 - (missing * 6) - (weaknessArrows * 8) + (strengthArrows * 10)
    const activeStrength = arrowsOfStrength.filter((a) => a.isPresent).length;
    const activeWeakness = arrowsOfWeakness.filter((a) => a.isPresent).length;
    let score = 50 + activeStrength * 8 - activeWeakness * 6 - (missingNumbers.length > 5 ? 10 : 0);
    score = Math.max(20, Math.min(98, score));

    const overallInterpretation = `Your Lo Shu Grid reveals ${activeStrength} Active Arrow(s) of Strength and ${activeWeakness} Arrow(s) of Emptiness. Your primary elemental powerhouse is ${dominantElement} (${maxElCount} occurrences). Balancing missing sectors through targeted Feng Shui remedies will harmonize your cosmic life matrix.`;

    return {
      grid,
      originalSquare: SACRED_LO_SHU_SQUARE,
      digitCounts,
      arrowsOfStrength,
      arrowsOfWeakness,
      missingNumbers,
      excessNumbers,
      dominantElement,
      lifeBalanceScore: score,
      overallInterpretation,
    };
  }
}
