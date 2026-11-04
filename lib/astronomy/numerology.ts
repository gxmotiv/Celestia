/**
 * Pythagorean Numerology Engine
 * Calculates Life Path, Expression (Destiny), Soul Urge (Heart's Desire),
 * Personality, Birthday Number, Maturity Number, Personal Year Number,
 * and Karmic Lessons (missing letters) with full Master Number (11, 22, 33) support.
 */

import {
  CompleteNumerologyReport,
  calculateCompleteNumerologyReport,
  Pinnacle,
  Challenge,
  HiddenPassion,
  ExpressionPlanes,
} from "@/lib/numerology";

export * from "@/lib/numerology";

export interface NumerologyProfile {
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
  attitudeNumber: number;
  currentYear: number;
  pinnacles: Pinnacle[];
  challenges: Challenge[];
  hiddenPassion: HiddenPassion;
  balanceNumber: number;
  balanceInterpretation: string;
  expressionPlanes: ExpressionPlanes;
  completeReport: CompleteNumerologyReport;
  karmicLessons: { number: number; lesson: string }[];
  letterCounts: Record<number, number>;
  detailedInterpretations: {
    lifePath: { title: string; archetype: string; description: string; shadow: string };
    expression: { title: string; archetype: string; description: string };
    soulUrge: { title: string; archetype: string; description: string };
    personality: { title: string; archetype: string; description: string };
    personalYear: { title: string; theme: string; guidance: string };
  };
}

const PYTHAGOREAN_TABLE: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
};

const VOWELS = new Set(["A", "E", "I", "O", "U"]);

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
  let current = num;
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
  const y = reduceToSingleOrMaster(
    year
      .toString()
      .split("")
      .reduce((sum, char) => sum + parseInt(char, 10), 0)
  );

  const total = m + d + y;
  const final = reduceToSingleOrMaster(total);
  const raw = `${m} + ${d} + ${y} = ${total} → ${final}`;
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
  return reduceToSingleOrMaster(sum);
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
      // Y is vowel if between consonants or at end of syllable
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
 * Calculate Personal Year Number for the current calendar year
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

/**
 * Detect Karmic Lessons (missing numbers 1-9 in the birth name)
 */
export function calculateKarmicLessons(name: string): {
  lessons: { number: number; lesson: string }[];
  counts: Record<number, number>;
} {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, "");
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };

  for (const ch of clean) {
    const val = PYTHAGOREAN_TABLE[ch];
    if (val) counts[val] = (counts[val] || 0) + 1;
  }

  const lessonDescriptions: Record<number, string> = {
    1: "Cultivating self-reliance, initiative, and inner authority without seeking external validation.",
    2: "Learning diplomatic cooperation, patience, emotional receptivity, and partnership balance.",
    3: "Unlocking authentic creative expression and overcoming self-doubt in public articulation.",
    4: "Establishing grounded discipline, enduring foundations, and consistent practical work ethic.",
    5: "Embracing constructive adaptability, freedom through responsibility, and courage amidst change.",
    6: "Balancing unconditional service and love with healthy emotional boundaries and self-care.",
    7: "Developing deep spiritual faith, intellectual intuition, and solace in introspective study.",
    8: "Mastering the ethical flow of material abundance, executive empowerment, and righteous leadership.",
    9: "Practicing universal compassion, humanitarian detachment, and gracious surrender of the obsolete.",
  };

  const lessons: { number: number; lesson: string }[] = [];
  for (let num = 1; num <= 9; num++) {
    if (counts[num] === 0) {
      lessons.push({
        number: num,
        lesson: lessonDescriptions[num],
      });
    }
  }

  return { lessons, counts };
}

// Master Interpretations Dictionary
const ARCHETYPES: Record<
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
    lifePathDesc:
      "You are forged to lead, innovate, and carve uncharted trails. Endowed with fierce determination, originality, and self-sufficiency, your soul journey demands stepping boldly onto the frontlines where others hesitate.",
    shadow: "Impatience, authoritarian tendencies, stubborn isolation, or fear of vulnerability.",
    expressionDesc:
      "Natural executive drive and inventive talent; you thrive when creating independent ventures and steering projects with sovereign vision.",
    soulUrgeDesc:
      "A deep hunger to be first, distinctive, and unencumbered by convention; you yearn for self-sovereignty above all.",
    personalityDesc:
      "Projects a magnetic, direct, and authoritative aura. People perceive you as bold, capable, and decisively self-assured.",
  },
  2: {
    title: "Number 2",
    archetype: "The Harmonizer & Peacemaker",
    lifePathDesc:
      "You are the sacred mediator and intuitive listener. Your life unfolds through exquisite partnership, emotional resonance, diplomatic tact, and weaving discord into serene harmony.",
    shadow: "Hypersensitivity, people-pleasing, passive aggression, or codependent self-erasure.",
    expressionDesc:
      "Talented in negotiations, mediation, counseling, and graceful collaboration behind the scenes.",
    soulUrgeDesc:
      "Yearns for profound emotional intimacy, peaceful environments, reciprocal love, and gentle understanding.",
    personalityDesc:
      "Radiates warmth, gentleness, and thoughtful elegance. Others instantly feel safe, heard, and soothed in your presence.",
  },
  3: {
    title: "Number 3",
    archetype: "The Creative Luminary & Wordsmith",
    lifePathDesc:
      "You are the cosmic storyteller and joyful visionary. Infused with sparkling wit, artistic vitality, and expressive charm, your path elevates collective spirit through beauty, theater, writing, and optimism.",
    shadow: "Scattered focus, superficial escapism, dramatic exaggerations, or anxiety when uninspired.",
    expressionDesc:
      "Lyrical eloquence, performing arts aptitude, and brilliant communication that inspires widespread enthusiasm.",
    soulUrgeDesc:
      "Yearns to express feelings authentically through art, voice, literature, or performance without restraint.",
    personalityDesc:
      "Charismatic, playful, stylish, and engaging. Your presence brightens any gathering with radiant humor and charm.",
  },
  4: {
    title: "Number 4",
    archetype: "The Master Architect & Foundation Stone",
    lifePathDesc:
      "You are the stalwart builder of enduring realities. Endowed with meticulous diligence, practical integrity, and structural genius, your destiny is establishing institutions and frameworks that outlive generations.",
    shadow: "Rigidity, stubborn resistance to evolution, micro-management, or excessive austerity.",
    expressionDesc:
      "Superb organizational prowess, analytical methodology, and unwavering follow-through in complex projects.",
    soulUrgeDesc:
      "A deep core desire for rock-solid stability, predictable order, safety, and tangible mastery.",
    personalityDesc:
      "Dependable, grounded, trustworthy, and poised. Others view you as an unbreakable pillar of competence.",
  },
  5: {
    title: "Number 5",
    archetype: "The Sovereign Explorer & Free Spirit",
    lifePathDesc:
      "You are the dynamic catalyst of metamorphosis. Propelled by insatiable curiosity, multilingual resonance, and a taste for adventure, you demonstrate how to embrace change with adventurous grace.",
    shadow: "Restlessness, impulsivity, sensory indulgence, or avoiding long-term commitment.",
    expressionDesc:
      "Gifted in versatile problem-solving, rapid adaptability, intercultural communication, and trendsetting.",
    soulUrgeDesc:
      "Craves unbridled autonomy, sensational variety, exploratory travel, and liberation from monotony.",
    personalityDesc:
      "Vibrant, fashionable, witty, and progressive. You carry an intoxicating aura of freedom and spontaneity.",
  },
  6: {
    title: "Number 6",
    archetype: "The Cosmic Guardian & Nurturer",
    lifePathDesc:
      "You are the benevolent shepherd, hearth-builder, and healer. Your path is anchored in unconditional compassion, domestic sanctum, artistic harmony, and counseling those navigating life's storms.",
    shadow: "Martyr complex, overbearing meddling, perfectionism, or carrying burdens that belong to others.",
    expressionDesc:
      "Instinctive healing ability, aesthetic interior/design talent, and community leadership grounded in care.",
    soulUrgeDesc:
      "Deeply desires to nurture, build a harmonious family sanctuary, and be appreciated for loving service.",
    personalityDesc:
      "Warm, graceful, protective, and paternal/maternal. People instinctively bring their wounds to your door.",
  },
  7: {
    title: "Number 7",
    archetype: "The Mystic Seeker & Sage",
    lifePathDesc:
      "You are the contemplative alchemist and investigative philosopher. Walking the contemplative borderline between science and sacred mystery, your path unlocks esoteric truths, analytical secrets, and spiritual awakenings.",
    shadow: "Cynical aloofness, social alienation, hyper-intellectualization, or distrust of emotions.",
    expressionDesc:
      "Profound philosophical analysis, research acumen, metaphysical insight, and diagnostic brilliance.",
    soulUrgeDesc:
      "Yearns for solitary communion with nature, esoteric wisdom, and truth beyond mundane superficiality.",
    personalityDesc:
      "Enigmatic, dignified, aristocratic, and quiet. You radiate an aura of deep ancient wisdom and mystery.",
  },
  8: {
    title: "Number 8",
    archetype: "The Sovereign Executive & Manifestor",
    lifePathDesc:
      "You are the alchemist of tangible power, commerce, and worldly manifestation. Born with sharp judgment and strategic courage, your purpose is orchestrating vast resources for high moral and philanthropic impact.",
    shadow: "Materialistic obsession, ruthless domination, fear of vulnerability, or boom-and-bust cycles.",
    expressionDesc:
      "Supreme financial intelligence, large-scale enterprise leadership, and commanding institutional influence.",
    soulUrgeDesc:
      "Desires material sovereignty, executive power, financial legacy, and seeing your grand visions manifested in stone.",
    personalityDesc:
      "Commanding, polished, affluent, and authoritative. Your presence exudes executive gravitas.",
  },
  9: {
    title: "Number 9",
    archetype: "The Universal Philanthropist & Transcendent",
    lifePathDesc:
      "You are the cosmopolitan elder and humanitarian visionary. Holding empathy for all sentient life, your path completes karmic cycles by releasing the obsolete, practicing forgiveness, and inspiring global consciousness.",
    shadow: "Aloof resentment, emotional drama, disillusionment with humanity, or martyrdom.",
    expressionDesc:
      "Humanitarian vision, international cultural resonance, artistic grandeur, and transformative mentoring.",
    soulUrgeDesc:
      "Yearns to serve the highest good, alleviate universal suffering, and transcend selfish barriers.",
    personalityDesc:
      "Generous, charismatic, idealistic, and worldly. Others perceive you as a noble citizen of the cosmos.",
  },
  11: {
    title: "Master Number 11",
    archetype: "The Illuminator & Intuitive Conduit",
    lifePathDesc:
      "You carry the sacred electrical current of illumination. Acting as a bridge between the subconscious and higher realms, you are gifted with prophetic flashes, artistic genius, and inspirational catalytic presence.",
    shadow: "Nervous exhaustion, overwhelming psychic sensitivity, self-doubt, or impractical daydreaming.",
    expressionDesc:
      "Channeled wisdom, spiritual teaching, visionary art, and awakening hearts through electrifying presence.",
    soulUrgeDesc:
      "Deep hunger to live as a beacon of cosmic truth, spiritual revelation, and transcendent love.",
    personalityDesc:
      "Mystical, radiant, arresting, and otherworldly. People sense a supernatural depth behind your eyes.",
  },
  22: {
    title: "Master Number 22",
    archetype: "The Master Builder & Vision Realizer",
    lifePathDesc:
      "You possess the rarest capacity to turn utopian ideals into concrete, global reality. Combining the intuitive vision of 11 with the grounded practicality of 4, you engineer sustainable systems for humanity.",
    shadow: "Crushing feelings of unfulfilled responsibility, self-paralysis from huge expectations, or rigidity.",
    expressionDesc:
      "Engineering global organizations, revolutionary sustainable architectures, and epochal public works.",
    soulUrgeDesc:
      "Desires to leave an indelible monument of service that elevates societal evolution for centuries.",
    personalityDesc:
      "Towering authority softened by calm pragmatic mastery. People intuitively recognize your historic capability.",
  },
  33: {
    title: "Master Number 33",
    archetype: "The Master Teacher & Avatar of Compassion",
    lifePathDesc:
      "The highest octave of unconditional love and spiritual guidance. You carry the cross of selfless devotion, awakening human hearts to divine empathy through personal sacrifice, artistic grace, and profound healing.",
    shadow: "Emotional martyrdom, taking on the suffering of the world, exhaustion, or Messiah complex.",
    expressionDesc:
      "Universal spiritual mentorship, miraculous energetic healing, and awakening collective consciousness through love.",
    soulUrgeDesc:
      "Pure aspiration to transmute suffering into divine grace and radiate unconditional love to every living being.",
    personalityDesc:
      "Deeply compassionate, saintly, serene, and infinitely patient. Your presence feels like a sanctuary.",
  },
};

const PERSONAL_YEAR_THEMES: Record<number, { theme: string; guidance: string }> = {
  1: {
    theme: "New Beginnings, Seeds of the 9-Year Cycle & Bold Initiative",
    guidance: "A brand-new 9-year chapter opens. Plant fearless seeds, embrace total autonomy, launch ventures, and redefine who you are.",
  },
  2: {
    theme: "Patience, Alliances, Gestation & Emotional Attunement",
    guidance: "Tend the seeds planted last year in quiet stillness. Focus on diplomatic partnerships, emotional maturity, and graceful collaboration.",
  },
  3: {
    theme: "Creative Blossom, Joyful Expression, Social Expansion & Flow",
    guidance: "Your voice, creativity, and charisma take center stage. Write, perform, network, celebrate, and share your inner truth with infectious passion.",
  },
  4: {
    theme: "Foundations, Hard Work, Systematic Discipline & Real Estate",
    guidance: "A year of dedicated effort and structural organization. Put solid systems under your castles in the air; health and financial budgets flourish.",
  },
  5: {
    theme: "Dynamic Pivot, Freedom, Unexpected Opportunities & Travel",
    guidance: "The midpoint of the cycle brings exhilarating winds of change. Break out of stagnant ruts, travel, pivot career angles, and welcome surprise turns.",
  },
  6: {
    theme: "Home, Sacred Duty, Family Harmony, Relationships & Service",
    guidance: "The spotlight shifts to domestic harmony, marriage, family healing, and community stewardship. Beautify your sanctuary and honor commitments.",
  },
  7: {
    theme: "Introspection, Spiritual Solitude, Research & Inner Rebirth",
    guidance: "A sabbatical year for the soul. Step back from aggressive worldly ambition; read, meditate, commune with nature, and upgrade your spiritual wisdom.",
  },
  8: {
    theme: "Harvest, Executive Empowerment, Financial Mastery & Karma",
    guidance: "The peak year of worldly manifestation. Step into sovereign leadership, negotiate significant contracts, and reap the material rewards of ethical toil.",
  },
  9: {
    theme: "Culmination, Karmic Closure, Forgiveness & Clearing the Slate",
    guidance: "The final year of the 9-year cycle. Release outgrown relationships, forgive old wounds, declutter possessions, and make clean space for rebirth.",
  },
};

/**
 * Main Numerology Profile generator
 */
export function calculateNumerologyProfile(
  fullName: string,
  year: number,
  month: number,
  day: number
): NumerologyProfile {
  const currentYear = new Date().getFullYear();
  const nameToUse = fullName.trim() || "Cosmic Soul";

  const { value: lifePathNumber, raw: lifePathRaw } = calculateLifePath(year, month, day);
  const expressionNumber = calculateExpression(nameToUse);
  const soulUrgeNumber = calculateSoulUrge(nameToUse);
  const personalityNumber = calculatePersonality(nameToUse);
  const birthdayNumber = reduceToSingleOrMaster(day);
  const maturityNumber = reduceToSingleOrMaster(lifePathNumber + expressionNumber);
  const personalYearNumber = calculatePersonalYear(month, day, currentYear);

  const { lessons: karmicLessons, counts: letterCounts } = calculateKarmicLessons(nameToUse);

  const lpArch = ARCHETYPES[lifePathNumber] || ARCHETYPES[1];
  const expArch = ARCHETYPES[expressionNumber] || ARCHETYPES[1];
  const suArch = ARCHETYPES[soulUrgeNumber] || ARCHETYPES[1];
  const persArch = ARCHETYPES[personalityNumber] || ARCHETYPES[1];
  const pyInfo = PERSONAL_YEAR_THEMES[personalYearNumber] || PERSONAL_YEAR_THEMES[1];

  const report = calculateCompleteNumerologyReport(nameToUse, year, month, day);

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
    attitudeNumber: report.pythagorean.attitudeNumber,
    currentYear,
    pinnacles: report.pythagorean.pinnacles,
    challenges: report.pythagorean.challenges,
    hiddenPassion: report.pythagorean.hiddenPassion,
    balanceNumber: report.pythagorean.balanceNumber,
    balanceInterpretation: report.pythagorean.balanceInterpretation,
    expressionPlanes: report.pythagorean.expressionPlanes,
    completeReport: report,
    karmicLessons,
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
    },
  };
}
