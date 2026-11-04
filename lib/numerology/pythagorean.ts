/**
 * Complete Pythagorean Numerology Engine
 * Calculates all 14 Pythagorean numbers:
 * 1. Life Path Number
 * 2. Expression / Destiny Number
 * 3. Soul Urge (Heart's Desire) Number
 * 4. Personality Number
 * 5. Birthday Number
 * 6. Maturity Number
 * 7. Personal Year Number
 * 8. Attitude / Sun Number
 * 9. Four Pinnacles (Life Phases)
 * 10. Four Challenges (Life Obstacles)
 * 11. Karmic Lessons
 * 12. Hidden Passion
 * 13. Balance Number
 * 14. Expression Planes (Physical, Mental, Emotional, Intuitive)
 */

import {
  PythagoreanProfile,
  Pinnacle,
  Challenge,
  KarmicLesson,
  HiddenPassion,
  ExpressionPlanes,
} from "./types";

export const PYTHAGOREAN_TABLE: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
};

export const VOWELS = new Set(["A", "E", "I", "O", "U"]);

/**
 * Reduce a number to single digit or Master Number (11, 22, 33)
 */
export function reduceToSingleOrMaster(num: number): number {
  if (num === 11 || num === 22 || num === 33) return num;
  let current = num;
  while (current > 9 && current !== 11 && current !== 22 && current !== 33) {
    current = current
      .toString()
      .split("")
      .reduce((sum, d) => sum + parseInt(d, 10), 0);
  }
  return current;
}

/**
 * Reduce strictly to single digit 1-9
 */
export function reduceToSingleDigit(num: number): number {
  let current = Math.abs(num);
  while (current > 9) {
    current = current
      .toString()
      .split("")
      .reduce((sum, d) => sum + parseInt(d, 10), 0);
  }
  return current;
}

/**
 * Calculate Life Path Number by reducing Month, Day, and Year individually
 */
export function calculateLifePath(year: number, month: number, day: number): { value: number; raw: string } {
  const m = reduceToSingleOrMaster(month);
  const d = reduceToSingleOrMaster(day);
  const yDigitsSum = year
    .toString()
    .split("")
    .reduce((sum, char) => sum + parseInt(char, 10), 0);
  const y = reduceToSingleOrMaster(yDigitsSum);

  const total = m + d + y;
  const final = reduceToSingleOrMaster(total);
  const raw = `${m} (month) + ${d} (day) + ${y} (year) = ${total} → ${final}`;
  return { value: final, raw };
}

/**
 * Calculate Expression / Destiny Number from full name
 */
export function calculateExpression(name: string): number {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, "");
  let sum = 0;
  for (const ch of clean) {
    sum += PYTHAGOREAN_TABLE[ch] || 0;
  }
  return reduceToSingleOrMaster(sum || 1);
}

/**
 * Calculate Soul Urge (Heart's Desire) Number from vowels
 */
export function calculateSoulUrge(name: string): number {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, "");
  let sum = 0;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (VOWELS.has(ch)) {
      sum += PYTHAGOREAN_TABLE[ch] || 0;
    } else if (ch === "Y") {
      const prevIsConsonant = i > 0 && !VOWELS.has(clean[i - 1]);
      const nextIsConsonant = i < clean.length - 1 && !VOWELS.has(clean[i + 1]);
      if (prevIsConsonant || nextIsConsonant || i === clean.length - 1) {
        sum += PYTHAGOREAN_TABLE[ch] || 0;
      }
    }
  }
  return reduceToSingleOrMaster(sum || 1);
}

/**
 * Calculate Personality Number from consonants
 */
export function calculatePersonality(name: string): number {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, "");
  let sum = 0;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (!VOWELS.has(ch)) {
      if (ch === "Y") {
        const prevIsConsonant = i > 0 && !VOWELS.has(clean[i - 1]);
        if (prevIsConsonant) continue; // treated as vowel
      }
      sum += PYTHAGOREAN_TABLE[ch] || 0;
    }
  }
  return reduceToSingleOrMaster(sum || 1);
}

/**
 * 1. PINNACLES (4 Life Phases)
 */
export function calculatePinnacles(birthYear: number, birthMonth: number, birthDay: number, lifePathNumber: number): Pinnacle[] {
  const m = reduceToSingleDigit(birthMonth);
  const d = reduceToSingleDigit(birthDay);
  const yDigitsSum = birthYear
    .toString()
    .split("")
    .reduce((sum, char) => sum + parseInt(char, 10), 0);
  const y = reduceToSingleDigit(yDigitsSum);

  const firstPinnacleNum = reduceToSingleOrMaster(m + d);
  const secondPinnacleNum = reduceToSingleOrMaster(d + y);
  const thirdPinnacleNum = reduceToSingleOrMaster(firstPinnacleNum + secondPinnacleNum);
  const fourthPinnacleNum = reduceToSingleOrMaster(m + y);

  // Age spans based on single-digit Life Path
  const lpBase = reduceToSingleDigit(lifePathNumber);
  const p1End = 36 - lpBase;
  const p2Start = p1End + 1;
  const p2End = p2Start + 8;
  const p3Start = p2End + 1;
  const p3End = p3Start + 8;
  const p4Start = p3End + 1;

  const getPinnacleTheme = (num: number): { theme: string; description: string; opportunity: string } => {
    switch (num) {
      case 1:
        return {
          theme: "Individual Leadership & Pioneering",
          description: "A phase demanding self-reliance, original enterprise, stepping onto uncharted ground, and establishing sovereign autonomy.",
          opportunity: "Founding independent ventures, leadership promotions, overcoming fear of standing alone.",
        };
      case 2:
        return {
          theme: "Diplomatic Cooperation & Partnership",
          description: "A cycle emphasizing patience, emotional sensitivity, mediation, harmonious partnerships, and team alignment.",
          opportunity: "Deep romantic unions, prosperous business partnerships, artistic sensitivity, peace-making.",
        };
      case 3:
        return {
          theme: "Creative Radiance & Self-Expression",
          description: "An exuberant period filled with social warmth, artistic flair, public communication, writing, and joyful magnetism.",
          opportunity: "Publishing, artistic success, social recognition, inspirational speaking, uplifting collective morale.",
        };
      case 4:
        return {
          theme: "Foundational Mastery & Diligent Building",
          description: "A disciplined phase requiring hard work, practical order, physical grounding, organizational mastery, and establishing long-term security.",
          opportunity: "Real estate acquisition, solid financial foundations, enduring business structures, operational perfection.",
        };
      case 5:
        return {
          theme: "Dynamic Freedom, Travel & Adaptability",
          description: "A fast-moving cycle characterized by unpredictable changes, travel, exploration, commercial adaptability, and breaking rigid molds.",
          opportunity: "Global travel, innovative career pivots, media expansion, breaking free from obsolete constraints.",
        };
      case 6:
        return {
          theme: "Domestic Harmony, Service & Responsibility",
          description: "A compassionate period centered on family, community service, home sanctification, teaching, healing, and parental duty.",
          opportunity: "Family fulfillment, counseling or healing vocation, interior sanctuary design, civic leadership.",
        };
      case 7:
        return {
          theme: "Spiritual Introspection & Analytical Mastery",
          description: "A contemplative cycle of deep scholarly study, philosophical awakening, scientific research, and inner spiritual solitude.",
          opportunity: "Esoteric mastery, breakthrough research, writing seminal treatises, spiritual illumination.",
        };
      case 8:
        return {
          theme: "Material Empowerment & Executive Authority",
          description: "A powerhouse phase of commercial expansion, financial abundance, executive management, and karmic ethical stewardship.",
          opportunity: "Large-scale enterprise, wealth creation, executive leadership, institutional influence.",
        };
      case 9:
        return {
          theme: "Humanitarian Compassion & Universal Completion",
          description: "A transcendent period requiring broad philanthropic vision, global empathy, artistic culmination, and releasing the outworn.",
          opportunity: "Global humanitarian impact, artistic legacies, philanthropic foundations, universal forgiveness.",
        };
      case 11:
        return {
          theme: "Master Visionary & Spiritual Illuminator",
          description: "A charged Master vibration of acute psychic intuition, spiritual teaching, inspirational charisma, and bridging heaven and earth.",
          opportunity: "Spiritual leadership, awakening communities, channeling transformative creative vision.",
        };
      case 22:
        return {
          theme: "Master Builder & Global Architect",
          description: "The supreme practical vibration capable of turning monumental utopian dreams into enduring physical reality on a world stage.",
          opportunity: "Monumental infrastructure, international organizations, legacy institutions that serve humanity for generations.",
        };
      case 33:
        return {
          theme: "Master Healer & Avatar of Cosmic Love",
          description: "A divine calling of boundless compassion, universal mentorship, profound emotional healing, and uplifting the suffering of all beings.",
          opportunity: "Transcendental mentorship, widespread healing work, embodying unconditional divine grace.",
        };
      default:
        return {
          theme: `Pinnacle Energy ${num}`,
          description: "A significant developmental chapter of life growth and character integration.",
          opportunity: "Personal advancement and self-mastery.",
        };
    }
  };

  const p1Details = getPinnacleTheme(firstPinnacleNum);
  const p2Details = getPinnacleTheme(secondPinnacleNum);
  const p3Details = getPinnacleTheme(thirdPinnacleNum);
  const p4Details = getPinnacleTheme(fourthPinnacleNum);

  return [
    {
      number: firstPinnacleNum,
      isMaster: [11, 22, 33].includes(firstPinnacleNum),
      ageRange: `Ages 0 to ${p1End}`,
      theme: p1Details.theme,
      description: p1Details.description,
      opportunity: p1Details.opportunity,
    },
    {
      number: secondPinnacleNum,
      isMaster: [11, 22, 33].includes(secondPinnacleNum),
      ageRange: `Ages ${p2Start} to ${p2End}`,
      theme: p2Details.theme,
      description: p2Details.description,
      opportunity: p2Details.opportunity,
    },
    {
      number: thirdPinnacleNum,
      isMaster: [11, 22, 33].includes(thirdPinnacleNum),
      ageRange: `Ages ${p3Start} to ${p3End}`,
      theme: p3Details.theme,
      description: p3Details.description,
      opportunity: p3Details.opportunity,
    },
    {
      number: fourthPinnacleNum,
      isMaster: [11, 22, 33].includes(fourthPinnacleNum),
      ageRange: `Ages ${p4Start}+`,
      theme: p4Details.theme,
      description: p4Details.description,
      opportunity: p4Details.opportunity,
    },
  ];
}

/**
 * 2. CHALLENGES (4 Life Obstacles)
 */
export function calculateChallenges(birthYear: number, birthMonth: number, birthDay: number): Challenge[] {
  const m = reduceToSingleDigit(birthMonth);
  const d = reduceToSingleDigit(birthDay);
  const yDigitsSum = birthYear
    .toString()
    .split("")
    .reduce((sum, char) => sum + parseInt(char, 10), 0);
  const y = reduceToSingleDigit(yDigitsSum);

  const c1 = Math.abs(m - d);
  const c2 = Math.abs(d - y);
  const c3 = Math.abs(c1 - c2); // Major Challenge
  const c4 = Math.abs(m - y);

  const getChallengeData = (num: number, level: string): Challenge => {
    switch (num) {
      case 0:
        return {
          number: 0,
          level,
          obstacle: "The Challenge of Free Choice & High Responsibility",
          lesson: "You are given complete sovereign free will; no single fixed obstacle blocks your path, but you must resist complacency or aimless wandering.",
          advice: "Set conscious high ideals and self-imposed discipline. Your greatest trial is deciding who you wish to become.",
        };
      case 1:
        return {
          number: 1,
          level,
          obstacle: "Struggles with Self-Confidence, Aggression, or Excessive Independence",
          lesson: "Learning to believe in your unique gifts without becoming defensive, arrogant, or trampling upon others' perspectives.",
          advice: "Cultivate inner authority that needs neither approval nor dominance. Stand firm in truth with quiet resolve.",
        };
      case 2:
        return {
          number: 2,
          level,
          obstacle: "Hypersensitivity, Fear of Conflict, and People-Pleasing",
          lesson: "Overcoming fear of disapproval, codependent compromise, and passive-aggressive resentment in relationships.",
          advice: "Establish healthy emotional boundaries. Understand that peaceful cooperation never requires abandoning your personal truth.",
        };
      case 3:
        return {
          number: 3,
          level,
          obstacle: "Scattered Energy, Self-Doubt in Expression, or Superficiality",
          lesson: "Resisting the urge to waste creative vitality on gossip, frivolous distractions, or hiding your authentic voice behind humor.",
          advice: "Focus your expressive talents into disciplined artistic or communicative crafts. Speak with vulnerability and depth.",
        };
      case 4:
        return {
          number: 4,
          level,
          obstacle: "Rigidity, Resistance to Discipline, or Sloth vs. Workaholism",
          lesson: "Balancing structured practical order with flexibility; overcoming resentment of mundane responsibilities.",
          advice: "Embrace routines as sacred scaffolding for your dreams. Avoid both chaotic disorder and dogmatic inflexibility.",
        };
      case 5:
        return {
          number: 5,
          level,
          obstacle: "Fear of Change, Reckless Impulsivity, or Sensual Overindulgence",
          lesson: "Mastering freedom through self-restraint; not confusing escapism or escapades with authentic spiritual liberation.",
          advice: "Anchor your restlessness in purposeful exploration. Use freedom to build rather than escape.",
        };
      case 6:
        return {
          number: 6,
          level,
          obstacle: "Perfectionism, Control Masquerading as Care, and Martyrdom",
          lesson: "Letting go of the need to fix or control loved ones; accepting others as they are without bitter disillusionment.",
          advice: "Give unconditional love without strings attached. Reserve compassion for yourself first.",
        };
      case 7:
        return {
          number: 7,
          level,
          obstacle: "Chronic Cynicism, Intellectual Pride, and Aloof Isolation",
          lesson: "Bridging the analytical mind with spiritual faith; overcoming fear of being emotionally misunderstood or hurt.",
          advice: "Open your heart to trust beyond what can be measured in a lab. Solitude should refresh you, not alienate you.",
        };
      case 8:
        return {
          number: 8,
          level,
          obstacle: "Material Obsession, Fear of Financial Ruin, or Power Struggles",
          lesson: "Understanding that true abundance is an energetic flow governed by integrity, not ruthless domination or hoard mentality.",
          advice: "Use executive power for the upliftment of others. Never sacrifice ethical honor for immediate monetary gain.",
        };
      default:
        return {
          number: num,
          level,
          obstacle: `Challenge Number ${num}`,
          lesson: "A pivotal developmental lesson requiring conscious emotional maturity.",
          advice: "Integrate this vibration with patience and self-honesty.",
        };
    }
  };

  return [
    getChallengeData(c1, "First Challenge (Early Adulthood)"),
    getChallengeData(c2, "Second Challenge (Middle Life)"),
    getChallengeData(c3, "Third Challenge (Main Life Challenge)"),
    getChallengeData(c4, "Fourth Challenge (Senior Life)"),
  ];
}

/**
 * 3. KARMIC LESSONS (Missing numbers 1-9 in name)
 */
export function calculateKarmicLessons(name: string): {
  lessons: KarmicLesson[];
  counts: Record<number, number>;
} {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, "");
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };

  for (const ch of clean) {
    const val = PYTHAGOREAN_TABLE[ch];
    if (val) counts[val] = (counts[val] || 0) + 1;
  }

  const lessonDetails: Record<number, { lesson: string; healing: string }> = {
    1: {
      lesson: "Missing 1: Cultivating self-reliance, initiative, and inner authority without leaning on others for approval.",
      healing: "Take independent decisions without asking for permission; practice sovereign leadership in small daily choices.",
    },
    2: {
      lesson: "Missing 2: Cultivating diplomatic tact, patience, empathy, and working gracefully in collaborative partnerships.",
      healing: "Listen deeply to others without defensive rebuttal; honor the quiet nuances of emotional relationship dynamics.",
    },
    3: {
      lesson: "Missing 3: Unlocking joyful self-expression, artistic vulnerability, and releasing fear of public ridicule.",
      healing: "Express your genuine feelings through art, writing, or candid speech; refuse to conceal your authentic joy.",
    },
    4: {
      lesson: "Missing 4: Establishing consistent work ethic, grounded structure, patience with details, and solid foundations.",
      healing: "Adopt steady daily routines, organize your physical living environment, and follow through on long-term commitments.",
    },
    5: {
      lesson: "Missing 5: Embracing healthy adaptability, curiosity, courage to welcome change, and releasing rigid control.",
      healing: "Step out of familiar comfort zones regularly; experience new cultures, philosophies, and flexible perspectives.",
    },
    6: {
      lesson: "Missing 6: Mastering responsible devotion, emotional commitment, family harmony, and selfless service without resentment.",
      healing: "Show unconditional care for loved ones while establishing firm boundaries that safeguard your energy.",
    },
    7: {
      lesson: "Missing 7: Developing spiritual faith, introspective contemplation, and trusting intuition beyond pure rationalism.",
      healing: "Spend time in quiet nature and meditation; study philosophical or mystical wisdom to calm an overactive intellect.",
    },
    8: {
      lesson: "Missing 8: Mastering executive empowerment, ethical relationship with money, and courageous commercial stewardship.",
      healing: "Manage finances with clarity, embrace your right to fair compensation, and lead others with compassion rather than fear.",
    },
    9: {
      lesson: "Missing 9: Practicing universal compassion, letting go of past grudges, and surrendering attachments with grace.",
      healing: "Engage in selfless charity; release old resentments and recognize the interconnected divinity of all souls.",
    },
  };

  const lessons: KarmicLesson[] = [];
  for (let num = 1; num <= 9; num++) {
    if (counts[num] === 0) {
      lessons.push({
        number: num,
        lesson: lessonDetails[num].lesson,
        healingGuidance: lessonDetails[num].healing,
      });
    }
  }

  return { lessons, counts };
}

/**
 * 4. HIDDEN PASSION (Most repeated numbers in name)
 */
export function calculateHiddenPassion(name: string, counts: Record<number, number>): HiddenPassion {
  let maxCount = 0;
  for (let num = 1; num <= 9; num++) {
    if (counts[num] > maxCount) {
      maxCount = counts[num];
    }
  }

  const numbers: number[] = [];
  if (maxCount > 0) {
    for (let num = 1; num <= 9; num++) {
      if (counts[num] === maxCount) {
        numbers.push(num);
      }
    }
  }

  const passionMeanings: Record<number, { meaning: string; traits: string[] }> = {
    1: {
      meaning: "Driving urge to stand alone as an exceptional pioneer, competitive leader, and distinctive originator.",
      traits: ["Pioneering Spirit", "Competitive Drive", "Self-Sufficiency", "Ambition"],
    },
    2: {
      meaning: "Profound desire for romantic harmony, emotional belonging, diplomatic peacemaking, and exquisite balance.",
      traits: ["Peacemaker", "Empathetic Listener", "Devoted Partner", "Gentle Tact"],
    },
    3: {
      meaning: "Irrepressible passion for creative performance, storytelling, humor, social charm, and aesthetic delight.",
      traits: ["Creative Radiance", "Verbal Eloquence", "Social Magnetism", "Artistic Flair"],
    },
    4: {
      meaning: "Instinctive drive for tangible perfection, immaculate organization, steadfast loyalty, and monumental durability.",
      traits: ["Master Builder", "Impeccable Order", "Tenacious Loyalty", "Steadfast Integrity"],
    },
    5: {
      meaning: "Insatiable appetite for adventure, sensory richness, breaking conventional rules, and experiential freedom.",
      traits: ["Adventurous Spirit", "Dynamic Versatility", "Magnetic Charm", "Rapid Evolution"],
    },
    6: {
      meaning: "Sacred instinct to protect, nurture, beautify the home, counsel the wounded, and foster domestic bliss.",
      traits: ["Guardian of Home", "Counselor Heart", "Aesthetic Nurturer", "Deep Devotion"],
    },
    7: {
      meaning: "Mystical quest for ultimate truth, hidden knowledge, scientific precision, and philosophical revelation.",
      traits: ["Seeker of Truth", "Analytical Genius", "Mystical Solitude", "Refined Intuition"],
    },
    8: {
      meaning: "Mighty executive drive for worldly accomplishment, financial supremacy, high authority, and large enterprise.",
      traits: ["Executive Commander", "Financial Architect", "Strategic Power", "Enduring Resilience"],
    },
    9: {
      meaning: "Humanitarian flame yearning to heal the world, champion the underdog, create universal art, and uplift all humanity.",
      traits: ["Universal Philanthropist", "Artistic Visionary", "Selfless Empathy", "Cosmic Wisdom"],
    },
  };

  const primaryNum = numbers[0] || 1;
  const info = passionMeanings[primaryNum] || {
    meaning: "A multifaceted blend of inner passions and talents.",
    traits: ["Versatility", "Dynamic Drive"],
  };

  return {
    numbers,
    count: maxCount,
    meaning: numbers.length > 1
      ? `Dual Passion (${numbers.join(" & ")}): ${info.meaning}`
      : info.meaning,
    traits: info.traits,
  };
}

/**
 * 5. BALANCE NUMBER (Calculated from initials of name)
 */
export function calculateBalanceNumber(name: string): { balanceNumber: number; interpretation: string } {
  const parts = name.trim().toUpperCase().split(/\s+/).filter(Boolean);
  let initialsSum = 0;

  for (const part of parts) {
    const firstChar = part.replace(/[^A-Z]/g, "")[0];
    if (firstChar && PYTHAGOREAN_TABLE[firstChar]) {
      initialsSum += PYTHAGOREAN_TABLE[firstChar];
    }
  }

  const balanceNumber = reduceToSingleDigit(initialsSum || 1);

  const balanceInterpretations: Record<number, string> = {
    1: "In moments of crisis or sudden conflict, you regain balance by taking swift, decisive, independent action. Rely on your own compass rather than seeking consensus.",
    2: "During emotional turbulence, your center returns through gentle dialogue, compromise, and stepping into the shoes of others. Avoid impulsive confrontation.",
    3: "When stressed, restore your equilibrium through creative expression, talking through feelings with close friends, and leaning into levity and optimistic perspective.",
    4: "You find balance in grounding routines, practical task organization, and focusing on one concrete step at a time. Chaos dissolves when you establish order.",
    5: "During setbacks, you regain composure by stepping back, taking a breath of fresh air, shifting perspective, and welcoming adaptable solutions rather than clinging to rigid plans.",
    6: "You stabilize through loving connection with family, soothing physical home surroundings, and offering care to others while guarding your own boundaries.",
    7: "In trials, withdraw into quiet solitude and contemplative study. Analyzing the spiritual and philosophical causes restores your calm far faster than noisy advice.",
    8: "You regain balance by exercising executive control, reviewing practical resources, focusing on facts rather than emotional hysteria, and acting with quiet dignity.",
    9: "Your equilibrium returns through compassionate detachment, universal perspective, and forgiving past wrongs. Releasing resistance brings instant peace.",
  };

  return {
    balanceNumber,
    interpretation: balanceInterpretations[balanceNumber] || "Maintain centered calm and objective clarity.",
  };
}

/**
 * 6. EXPRESSION PLANES (Physical, Mental, Emotional, Intuitive)
 */
export function calculateExpressionPlanes(name: string): ExpressionPlanes {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, "");
  const total = clean.length || 1;

  // Classical Plane Classifications:
  // Physical: D, E, M, W
  // Mental: A, H, J, N, P, G
  // Emotional: B, I, O, R, S, T, X, Z
  // Intuitive: C, F, K, L, Q, U, V, Y
  const physicalLetters = new Set(["D", "E", "M", "W"]);
  const mentalLetters = new Set(["A", "H", "J", "N", "P", "G"]);
  const emotionalLetters = new Set(["B", "I", "O", "R", "S", "T", "X", "Z"]);
  const intuitiveLetters = new Set(["C", "F", "K", "L", "Q", "U", "V", "Y"]);

  const physicalArr: string[] = [];
  const mentalArr: string[] = [];
  const emotionalArr: string[] = [];
  const intuitiveArr: string[] = [];

  for (const ch of clean) {
    if (physicalLetters.has(ch)) physicalArr.push(ch);
    else if (mentalLetters.has(ch)) mentalArr.push(ch);
    else if (emotionalLetters.has(ch)) emotionalArr.push(ch);
    else if (intuitiveLetters.has(ch)) intuitiveArr.push(ch);
  }

  const pCount = physicalArr.length;
  const mCount = mentalArr.length;
  const eCount = emotionalArr.length;
  const iCount = intuitiveArr.length;

  const pPct = Math.round((pCount / total) * 100);
  const mPct = Math.round((mCount / total) * 100);
  const ePct = Math.round((eCount / total) * 100);
  const iPct = Math.round((iCount / total) * 100);

  const planeScores = [
    { name: "Physical" as const, count: pCount },
    { name: "Mental" as const, count: mCount },
    { name: "Emotional" as const, count: eCount },
    { name: "Intuitive" as const, count: iCount },
  ];

  planeScores.sort((a, b) => b.count - a.count);
  const dominantPlane = planeScores[0].count === planeScores[1].count ? "Balanced" : planeScores[0].name;

  let interpretation = "";
  switch (dominantPlane) {
    case "Physical":
      interpretation = "Physical Plane Dominant: You engage reality through concrete manifestation, tactile experience, practical stamina, and physical endurance.";
      break;
    case "Mental":
      interpretation = "Mental Plane Dominant: You navigate life via rational analysis, intellectual strategy, structured reasoning, and high curiosity.";
      break;
    case "Emotional":
      interpretation = "Emotional Plane Dominant: Your primary lens is heart-resonance, aesthetic sensitivity, relational empathy, and deep emotional feeling.";
      break;
    case "Intuitive":
      interpretation = "Intuitive Plane Dominant: You are guided by spontaneous gut instinct, sixth-sense impressions, visionary flashes, and direct inner knowing.";
      break;
    case "Balanced":
      interpretation = "Harmoniously Balanced Planes: You possess a remarkably even distribution of physical, mental, emotional, and intuitive faculties.";
      break;
  }

  return {
    physical: { count: pCount, percentage: pPct, letters: physicalArr },
    mental: { count: mCount, percentage: mPct, letters: mentalArr },
    emotional: { count: eCount, percentage: ePct, letters: emotionalArr },
    intuitive: { count: iCount, percentage: iPct, letters: intuitiveArr },
    dominantPlane,
    interpretation,
  };
}

/**
 * Maturity Number (Life Path + Expression)
 */
export function calculateMaturityNumber(lifePath: number, expression: number): number {
  return reduceToSingleOrMaster(lifePath + expression);
}

/**
 * Attitude / Sun Number (Month + Day)
 */
export function calculateAttitudeNumber(month: number, day: number): number {
  return reduceToSingleDigit(month + day);
}

/**
 * Personal Year Number
 */
export function calculatePersonalYear(month: number, day: number, currentYear: number): number {
  const m = reduceToSingleDigit(month);
  const d = reduceToSingleDigit(day);
  const y = reduceToSingleDigit(
    currentYear
      .toString()
      .split("")
      .reduce((sum, char) => sum + parseInt(char, 10), 0)
  );
  return reduceToSingleDigit(m + d + y);
}

// Master Interpretations for Pythagorean Core Numbers
export const PYTHAGOREAN_ARCHETYPES: Record<
  number,
  {
    title: string;
    archetype: string;
    lifePathDesc: string;
    shadow: string;
    expressionDesc: string;
    soulUrgeDesc: string;
    personalityDesc: string;
  }
> = {
  1: {
    title: "Number 1",
    archetype: "The Pioneer & Catalyst",
    lifePathDesc: "Forged to lead, innovate, and carve uncharted trails. Endowed with fierce determination, originality, and self-sufficiency, your soul journey demands stepping boldly onto the frontlines where others hesitate.",
    shadow: "Impatience, authoritarian tendencies, stubborn isolation, or fear of vulnerability.",
    expressionDesc: "Natural executive drive and inventive talent; you thrive when creating independent ventures and steering projects with sovereign vision.",
    soulUrgeDesc: "A deep hunger to be first, distinctive, and unencumbered by convention; you yearn for self-sovereignty above all.",
    personalityDesc: "Projects a magnetic, direct, and authoritative aura. People perceive you as bold, capable, and decisively self-assured.",
  },
  2: {
    title: "Number 2",
    archetype: "The Harmonizer & Peacemaker",
    lifePathDesc: "The sacred mediator and intuitive listener. Your life unfolds through exquisite partnership, emotional resonance, diplomatic tact, and weaving discord into serene harmony.",
    shadow: "Hypersensitivity, people-pleasing, passive aggression, or codependent self-erasure.",
    expressionDesc: "Talented in negotiations, mediation, counseling, and graceful collaboration behind the scenes.",
    soulUrgeDesc: "Yearns for profound emotional intimacy, peaceful environments, reciprocal love, and gentle understanding.",
    personalityDesc: "Radiates warmth, gentleness, and thoughtful elegance. Others instantly feel safe, heard, and soothed in your presence.",
  },
  3: {
    title: "Number 3",
    archetype: "The Creative Luminary & Wordsmith",
    lifePathDesc: "The cosmic storyteller and joyful visionary. Infused with sparkling wit, artistic vitality, and expressive charm, your path elevates collective spirit through beauty, theater, writing, and optimism.",
    shadow: "Scattered focus, superficial escapism, dramatic exaggerations, or anxiety when uninspired.",
    expressionDesc: "Lyrical eloquence, performing arts aptitude, and brilliant communication that inspires widespread enthusiasm.",
    soulUrgeDesc: "Yearns to express feelings authentically through art, voice, literature, or performance without restraint.",
    personalityDesc: "Charismatic, playful, stylish, and engaging. Your presence brightens any gathering with radiant humor and charm.",
  },
  4: {
    title: "Number 4",
    archetype: "The Master Architect & Anchor",
    lifePathDesc: "The foundational bedrock of society. Grounded in meticulous discipline, practical logic, and unyielding integrity, you turn volatile ideas into enduring, monolithic realities.",
    shadow: "Dogmatic rigidity, stubborn resistance to change, workaholism, or emotional austerity.",
    expressionDesc: "Extraordinary methodical execution, systems engineering, project management, and reliable craftsmanship.",
    soulUrgeDesc: "Yearns for profound stability, physical order, tangible security, and knowing that structures will stand the test of time.",
    personalityDesc: "Exudes quiet strength, reliability, modesty, and grounded authority. People trust your word implicitly.",
  },
  5: {
    title: "Number 5",
    archetype: "The Free Spirit & Explorer",
    lifePathDesc: "The dynamic voyager of human experience. Guided by insatiable curiosity, quicksilver adaptability, and love for sensual freedom, your life is an electrifying odyssey of transformation.",
    shadow: "Restlessness, fear of commitment, escapist addictions, or reckless impulsivity.",
    expressionDesc: "Gifted in multifaceted communication, public relations, rapid learning, marketing, and cross-cultural synthesis.",
    soulUrgeDesc: "Craves boundless experiential liberty, adventurous discovery, and freedom from suffocating routine.",
    personalityDesc: "Magnetic, witty, energetic, and effortlessly chic. People view you as exciting, progressive, and captivating.",
  },
  6: {
    title: "Number 6",
    archetype: "The Nurturing Guardian & Healer",
    lifePathDesc: "The heart-centered guardian and community protector. Gifted with deep empathy, aesthetic refinement, and moral responsibility, your mission is to bring healing, justice, and sanctuary to those around you.",
    shadow: "Meddling perfectionism, emotional martyr complex, guilt trips, or self-neglect.",
    expressionDesc: "Exceptional abilities in mentorship, healthcare, interior design, culinary arts, education, and family guidance.",
    soulUrgeDesc: "Yearns to establish a harmonious domestic sanctuary, cherish loved ones, and be appreciated for heartfelt devotion.",
    personalityDesc: "Warm, dignified, maternal/paternal, and beautifully welcoming. You project an aura of reliable safety.",
  },
  7: {
    title: "Number 7",
    archetype: "The Mystic Sage & Analyst",
    lifePathDesc: "The sacred philosopher and truth-seeker. Operating on a higher intellectual and spiritual frequency, your path bridges rigorous scientific scrutiny with profound metaphysical understanding.",
    shadow: "Aloof isolation, intellectual arrogance, cynical skepticism, or chronic mistrust.",
    expressionDesc: "Unrivaled acumen in esoteric research, technical architecture, philosophical writing, and intuitive diagnosis.",
    soulUrgeDesc: "Desires holy solitude, silent contemplation, scholarly revelation, and uncovering the secret laws of the cosmos.",
    personalityDesc: "Quietly enigmatic, dignified, observant, and deeply intriguing. Others sense profound depth behind your watchful eyes.",
  },
  8: {
    title: "Number 8",
    archetype: "The Sovereign Executive & Magus",
    lifePathDesc: "The master of material mastery and karmic balance. Endowed with immense vision, endurance, and strategic acumen, your destiny is to command enterprise, mobilize wealth, and wield power ethically.",
    shadow: "Ruthless ambition, fear of weakness, materialistic fixation, or controlling domination.",
    expressionDesc: "Executive leadership, financial architecture, commercial empire-building, and high-stakes problem resolution.",
    soulUrgeDesc: "Hungers for tangible legacy, executive autonomy, material sovereignty, and the power to enact large-scale impact.",
    personalityDesc: "Commanding, polished, prosperous, and formidable. You exude natural leadership and executive presence.",
  },
  9: {
    title: "Number 9",
    archetype: "The Cosmic Philanthropist & Luminary",
    lifePathDesc: "The universal soul walking the culmination of the single digits. Overflowing with transcendent compassion, global consciousness, and creative wisdom, you teach humanity the grace of unconditional love and surrender.",
    shadow: "Disillusionment, aloof detachment, clinging to past grievances, or dramatic self-pity.",
    expressionDesc: "Profound artistic brilliance, global advocacy, transformative spiritual teaching, and diplomatic statesmanship.",
    soulUrgeDesc: "Yearns to heal the suffering of the world, champion humanitarian rights, and leave planet Earth better than you found it.",
    personalityDesc: "Inspiring, aristocratic, deeply compassionate, and universally approachable. You possess an otherworldly grace.",
  },
  11: {
    title: "Master Number 11",
    archetype: "The Illuminated Messenger & Visionary",
    lifePathDesc: "The spiritual conduit and intuitive luminary. Charged with electric psychic sensitivity and prophetic insight, your sacred calling is to inspire and awaken human consciousness through profound vision.",
    shadow: "Nervous exhaustion, overwhelming anxiety, imposter syndrome, or fear of stepping into the spotlight.",
    expressionDesc: "Visionary creative mediumship, inspirational oratory, metaphysical philosophy, and transformative spiritual art.",
    soulUrgeDesc: "A spiritual ache to illuminate minds, serve as an antenna for divine truth, and awaken others to their soul potential.",
    personalityDesc: "Radiates an ethereal, mesmerizing, and deeply inspiring frequency. Others feel spiritually activated in your presence.",
  },
  22: {
    title: "Master Number 22",
    archetype: "The Master Builder & Manifestor",
    lifePathDesc: "The most powerful creative force in numerology. You possess the spiritual vision of the 11 combined with the grounded structural genius of the 4, capable of manifesting monumental institutions for humanity.",
    shadow: "Paralyzing fear of failure, crushing self-imposed pressure, ruthless rigidity, or feeling burdened by monumental potential.",
    expressionDesc: "Grand-scale engineering, international infrastructure, global financial systems, and enduring humanitarian institutions.",
    soulUrgeDesc: "Hungers to leave an indelible physical legacy that elevates world civilization for generations to come.",
    personalityDesc: "Immensely competent, authoritative, visionary, and pragmatic. People immediately recognize you as someone who gets titanic things done.",
  },
  33: {
    title: "Master Number 33",
    archetype: "The Avatar of Compassion & Master Teacher",
    lifePathDesc: "The supreme teacher of unconditional cosmic love. Your soul operates as a beacon of selfless healing, spiritual wisdom, and radiant devotion, lifting collective sorrow through transcendent grace.",
    shadow: "Total self-sacrifice leading to health breakdown, martyr complex, or feeling crushed by the suffering of the world.",
    expressionDesc: "Transcendental healing, profound spiritual mentorship, universal artistic ministry, and global philanthropic leadership.",
    soulUrgeDesc: "Yearns to embody divine love, heal emotional wounds of humanity, and guide souls toward spiritual liberation.",
    personalityDesc: "Exudes saintly benevolence, gentle authority, and profound inner peace. People feel unconditional love in your presence.",
  },
};

/**
 * Master Pythagorean Calculator
 */
export function calculateCompletePythagoreanProfile(
  fullName: string,
  birthYear: number,
  birthMonth: number,
  birthDay: number
): PythagoreanProfile {
  const currentYear = new Date().getFullYear();

  // Core Numbers
  const { value: lifePathNumber, raw: lifePathRaw } = calculateLifePath(birthYear, birthMonth, birthDay);
  const expressionNumber = calculateExpression(fullName);
  const soulUrgeNumber = calculateSoulUrge(fullName);
  const personalityNumber = calculatePersonality(fullName);
  const birthdayNumber = reduceToSingleDigit(birthDay);
  const maturityNumber = calculateMaturityNumber(lifePathNumber, expressionNumber);
  const personalYearNumber = calculatePersonalYear(birthMonth, birthDay, currentYear);
  const attitudeNumber = calculateAttitudeNumber(birthMonth, birthDay);

  // Advanced Numbers
  const pinnacles = calculatePinnacles(birthYear, birthMonth, birthDay, lifePathNumber);
  const challenges = calculateChallenges(birthYear, birthMonth, birthDay);
  const { lessons: karmicLessons, counts: letterCounts } = calculateKarmicLessons(fullName);
  const hiddenPassion = calculateHiddenPassion(fullName, letterCounts);
  const { balanceNumber, interpretation: balanceInterpretation } = calculateBalanceNumber(fullName);
  const expressionPlanes = calculateExpressionPlanes(fullName);

  // Interpretations
  const lpArch = PYTHAGOREAN_ARCHETYPES[lifePathNumber] || PYTHAGOREAN_ARCHETYPES[1];
  const expArch = PYTHAGOREAN_ARCHETYPES[expressionNumber] || PYTHAGOREAN_ARCHETYPES[1];
  const suArch = PYTHAGOREAN_ARCHETYPES[soulUrgeNumber] || PYTHAGOREAN_ARCHETYPES[1];
  const persArch = PYTHAGOREAN_ARCHETYPES[personalityNumber] || PYTHAGOREAN_ARCHETYPES[1];

  const maturityTheme: Record<number, { theme: string; desc: string }> = {
    1: { theme: "Sovereign Independence", desc: "Your mature years will be characterized by greater personal authority, pioneering new projects, and enjoying self-reliance." },
    2: { theme: "Deep Relationship Wisdom", desc: "Later life brings exquisite peace, loving partnerships, gentle mediation, and emotional balance." },
    3: { theme: "Artistic & Joyful Fulfillment", desc: "Mature years bring joyful creative blossoming, social laughter, writing, and celebrating life's beauty." },
    4: { theme: "Solid Material Legacy", desc: "Later life anchors security, durable investments, structural order, and enduring peace of mind." },
    5: { theme: "Adventurous Freedom", desc: "Mature years invite exciting travel, dynamic curiosity, freedom from obsolete restrictions, and versatile pursuits." },
    6: { theme: "Beloved Family & Community Sanctum", desc: "Later life centers on domestic bliss, nurturing children/grandchildren, community honors, and heartful contentment." },
    7: { theme: "Spiritual Illumination & Peace", desc: "Mature years offer deep philosophical clarity, scholarly study, mystical wisdom, and peaceful introspection." },
    8: { theme: "Executive Wealth & Influence", desc: "Later life brings commercial mastery, financial prosperity, philanthropic leadership, and respected authority." },
    9: { theme: "Universal Humanitarian Legacy", desc: "Mature years culminate in wide-reaching philanthropic work, artistic mastery, and global spiritual mentorship." },
    11: { theme: "Visionary Inspiration", desc: "Mature years activate profound psychic clarity, teaching, and serving as an inspirational beacon." },
    22: { theme: "Monumental Manifestation", desc: "Mature years witness the tangible manifestation of your grandest lifelong vision on the physical plane." },
    33: { theme: "Cosmic Healing Presence", desc: "Mature years radiate boundless compassion, healing, and universal love to all whose lives you touch." },
  };

  const matInfo = maturityTheme[maturityNumber] || { theme: `Maturity ${maturityNumber}`, desc: "Growth and integration in mature life." };

  const attitudeTheme: Record<number, { theme: string; desc: string }> = {
    1: { theme: "Bold & Direct", desc: "First impressions: You meet life with decisive action, proactive initiative, and refusal to be intimidated." },
    2: { theme: "Gentle & Receptive", desc: "First impressions: You approach situations with listening ears, diplomatic warmth, and intuitive sensitivity." },
    3: { theme: "Radiant & Witty", desc: "First impressions: You meet people with sparkling humor, communicative warmth, and magnetic charm." },
    4: { theme: "Steady & Pragmatic", desc: "First impressions: You approach projects with realistic scrutiny, organized discipline, and dependable presence." },
    5: { theme: "Exciting & Adaptable", desc: "First impressions: You enter new spaces with rapid versatility, curiosity, and infectious adventurousness." },
    6: { theme: "Warm & Caring", desc: "First impressions: You radiate welcoming protection, hospitality, and natural concern for others' comfort." },
    7: { theme: "Observant & Enigmatic", desc: "First impressions: You step back to analyze, projecting intellectual depth, quiet dignity, and perceptive discernment." },
    8: { theme: "Confident & Competent", desc: "First impressions: You project executive strength, commercial acumen, and unmistakable capability." },
    9: { theme: "Noble & Compassionate", desc: "First impressions: You meet humanity with broad-minded benevolence, philosophical dignity, and generous grace." },
  };

  const attInfo = attitudeTheme[attitudeNumber] || { theme: `Attitude ${attitudeNumber}`, desc: "Your natural outward approach to life's events." };

  const personalYearThemes: Record<number, { theme: string; guidance: string }> = {
    1: { theme: "New Beginnings & Fresh Planting", guidance: "A potent year of sowing seeds. Launch ventures, initiate projects, and step forward with sovereign confidence." },
    2: { theme: "Patience, Cooperation & Deepening Roots", guidance: "A gentle year of waiting, diplomacy, and nurturing partnerships. Allow seeds to germinate quietly beneath the soil." },
    3: { theme: "Creative Expansion & Social Radiance", guidance: "A blossoming year of artistic expression, social connections, joy, and public communication. Share your voice." },
    4: { theme: "Hard Work, Order & Foundation Building", guidance: "A disciplined year of construction, financial budgeting, health maintenance, and establishing unbreakable structures." },
    5: { theme: "Dynamic Change, Travel & Freedom", guidance: "A whirlwind year of pivots, travel, unexpected breakthroughs, and expanding horizons. Embrace adaptability." },
    6: { theme: "Family, Domestic Duty & Healing", guidance: "A heart-centered year focused on home renovation, marital harmony, service to loved ones, and community healing." },
    7: { theme: "Spiritual Reflection & Scholarly Study", guidance: "A contemplative year best spent in study, meditation, rest, and scientific or metaphysical research. Go within." },
    8: { theme: "Harvest, Executive Power & Material Flow", guidance: "A powerhouse year of financial culmination, professional advancement, legal victories, and executive achievement." },
    9: { theme: "Completion, Releasing & Humanitarian Surrender", guidance: "A transcendent year of closure. Complete pending projects, release outworn relationships, and prepare for the next 9-year cycle." },
  };

  const pyInfo = personalYearThemes[personalYearNumber] || { theme: `Year ${personalYearNumber}`, guidance: "Navigate with mindfulness and intentional focus." };

  return {
    lifePathNumber,
    lifePathRaw,
    isMasterLifePath: [11, 22, 33].includes(lifePathNumber),
    expressionNumber,
    isMasterExpression: [11, 22, 33].includes(expressionNumber),
    soulUrgeNumber,
    isMasterSoulUrge: [11, 22, 33].includes(soulUrgeNumber),
    personalityNumber,
    isMasterPersonality: [11, 22, 33].includes(personalityNumber),
    birthdayNumber,
    maturityNumber,
    personalYearNumber,
    attitudeNumber,
    currentYear,
    pinnacles,
    challenges,
    karmicLessons,
    hiddenPassion,
    balanceNumber,
    balanceInterpretation,
    expressionPlanes,
    letterCounts,
    detailedInterpretations: {
      lifePath: {
        title: lpArch.title,
        archetype: lpArch.archetype,
        description: lpArch.lifePathDesc,
        shadow: lpArch.shadow,
      },
      expression: {
        title: expArch.title,
        archetype: expArch.archetype,
        description: expArch.expressionDesc,
      },
      soulUrge: {
        title: suArch.title,
        archetype: suArch.archetype,
        description: suArch.soulUrgeDesc,
      },
      personality: {
        title: persArch.title,
        archetype: persArch.archetype,
        description: persArch.personalityDesc,
      },
      personalYear: {
        title: `Personal Year ${personalYearNumber} (${currentYear})`,
        theme: pyInfo.theme,
        guidance: pyInfo.guidance,
      },
      maturity: {
        title: `Maturity Number ${maturityNumber}`,
        theme: matInfo.theme,
        description: matInfo.desc,
      },
      attitude: {
        title: `Attitude / Sun Number ${attitudeNumber}`,
        theme: attInfo.theme,
        description: attInfo.desc,
      },
    },
  };
}
