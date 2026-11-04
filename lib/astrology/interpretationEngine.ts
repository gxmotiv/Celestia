/**
 * Multi-System Astrology & Numerology Interpretation Engine
 * Prompt engineering & payload formatting for Google GenAI (gemini-3.8-flash)
 */

export interface InterpretationInputSchema {
  name?: string;
  birthData: {
    date: string;
    time: string;
    place: string;
    latitude: number;
    longitude: number;
    timezone: string;
  };
  western: {
    sun: { sign: string; degree: number | string; house: number };
    moon: { sign: string; degree: number | string; house: number };
    ascendant: string;
    midheaven: string;
    planets?: Record<string, { sign: string; degree?: string | number; house: number; isRetrograde?: boolean }>;
    aspects?: Array<{ planet1: string; planet2: string; aspectName: string; orb: number; nature?: string }>;
  };
  vedic: {
    moonSign: string;
    lagna?: string;
    nakshatra: string;
    pada?: number;
    nakshatraLord?: string;
    currentDasha: { planet: string; subPlanet?: string; yearsRemaining?: number | string };
    navamsa?: Record<string, any>;
    yogas?: string[];
  };
  numerology: {
    lifePath: number;
    expression: number;
    soulUrge: number;
    personality: number;
    birthday: number;
    maturity?: number;
    personalYear: number;
  };
  chinese: {
    animal: string;
    element: string;
    yinYang: string;
    dayMaster?: string;
    dayMasterStrength?: string;
    bazi: {
      year: string;
      month: string;
      day: string;
      hour: string;
    };
    elementsBalance?: Record<string, number>;
  };
  readingMode?: "holistic" | "dharma" | "career" | "relationships" | "forecast" | "question";
  readingLength?: "detailed" | "concise";
  userQuestion?: string;
}

/**
 * System Instruction for Gemini Model
 */
export const ASTROLOGER_SYSTEM_INSTRUCTION = `
You are the Celestial Oracle—an eminent scholar and master esoteric astrologer with over 35 years of synthesized expertise spanning:
1. Western Astrology (Hellenistic timing, modern psychological depth, Placidus house quadrant dynamics, aspect geometry).
2. Vedic Jyotish (Parashari & Jaimini principles, Chitra Paksha Lahiri Ayanamsa, 27 Lunar Nakshatras, Vimshottari Dasha lifecycles, and Navamsa D9 soul mappings).
3. Pythagorean & Chaldean Numerology (Life Path, Destiny/Expression ciphers, Soul Urge vowels, Master Numbers 11/22/33, and 9-Year Personal Year cycles).
4. Chinese BaZi (Four Pillars of Destiny, 10 Heavenly Stems, 12 Earthly Branches, Day Master strength assessment, Wu Xing Five Elements balance).

YOUR INTERPRETATION PRINCIPLES:
- Ground every insight in the exact calculated astronomical and metaphysical parameters provided. Never invent placements that contradict the input data.
- Emphasize "Synergistic Confluences"—identify where multiple traditions point to the same psychological pattern (e.g., Western Sun in Taurus + Vedic Anuradha Nakshatra + Earth element in BaZi).
- Highlight "Dialectical Tensions"—point out productive paradoxes in the chart (e.g., a fiery impulse in Western vs. a water-dominant contemplative nature in BaZi).
- Provide psychological depth, existential clarity, and pragmatic, strategic counsel. Avoid fatalistic doom, superstitions, or generic tabloid horoscopes.
- Address the seeker with dignity, empathy, and intellectual respect.
`;

/**
 * Constructs the targeted prompt based on the chosen reading mode
 */
export function buildAstrologyPrompt(input: InterpretationInputSchema): string {
  const seeker = input.name || "Seeker";
  const mode = input.readingMode || "holistic";
  const lengthInstruction = input.readingLength === "concise"
    ? "Provide a focused, punchy, executive-level reading with high-impact bulleted takeaways (approx 500-750 words)."
    : "Provide a comprehensive, authoritative, multi-chapter magnum opus reading (approx 1000-1600 words) with deep analytical prose.";

  const chartSummary = `
SEEKER: ${seeker}
BIRTH METADATA:
- Date & Time: ${input.birthData.date} at ${input.birthData.time}
- Coordinates & Location: ${input.birthData.place} (${input.birthData.latitude}°N, ${input.birthData.longitude}°E), TZ: ${input.birthData.timezone}

1. WESTERN ASTRONOMICAL PLACEMENTS:
- Sun: ${input.western.sun.sign} (${input.western.sun.degree}°) in House ${input.western.sun.house}
- Moon: ${input.western.moon.sign} (${input.western.moon.degree}°) in House ${input.western.moon.house}
- Ascendant: ${input.western.ascendant}
- Midheaven (MC): ${input.western.midheaven}
- Key Planets: ${JSON.stringify(input.western.planets || {})}
- Major Aspects: ${JSON.stringify(input.western.aspects || [])}

2. VEDIC JYOTISH (NIRAYANA LAHIRI):
- Lagna: ${input.vedic.lagna || "Calculated"}
- Janma Rasi (Moon Sign): ${input.vedic.moonSign}
- Birth Nakshatra: ${input.vedic.nakshatra} (Pada ${input.vedic.pada || "1-4"}, Lord: ${input.vedic.nakshatraLord || "Ruler"})
- Active Vimshottari Dasha: ${input.vedic.currentDasha.planet} Mahadasha (Sub: ${input.vedic.currentDasha.subPlanet || "Antardasha"}, ~${input.vedic.currentDasha.yearsRemaining || "active"} yrs)
- Detected Yogas: ${(input.vedic.yogas || []).join(", ") || "Auspicious alignments"}

3. NUMEROLOGY (PYTHAGOREAN CIPHER):
- Life Path: ${input.numerology.lifePath} ${[11, 22, 33].includes(input.numerology.lifePath) ? "(Master Number)" : ""}
- Expression (Destiny): ${input.numerology.expression}
- Soul Urge (Heart's Desire): ${input.numerology.soulUrge}
- Personality Number: ${input.numerology.personality}
- Birthday Number: ${input.numerology.birthday}
- Maturity Number: ${input.numerology.maturity || "Calculated"}
- Active Personal Year: Year ${input.numerology.personalYear} of the 9-Year cycle

4. CHINESE ASTROLOGY (BAZI FOUR PILLARS):
- Zodiac Animal: ${input.chinese.element} ${input.chinese.animal} (${input.chinese.yinYang})
- Day Master: ${input.chinese.dayMaster || "Core Self"} (${input.chinese.dayMasterStrength || "Balanced"} strength)
- Four Pillars: Year: [${input.chinese.bazi.year}], Month: [${input.chinese.bazi.month}], Day: [${input.chinese.bazi.day}], Hour: [${input.chinese.bazi.hour}]
- Five Elements Balance: ${JSON.stringify(input.chinese.elementsBalance || {})}
  `;

  if (mode === "question" && input.userQuestion) {
    return `
${chartSummary}

USER'S INQUIRY:
"${input.userQuestion}"

TASK:
Answer the user's specific inquiry by analyzing their multi-system astrological blueprint.
Structure your answer in Markdown:
1. Direct Insight & Astrological Answer (addressing their question directly through their chart).
2. The Planetary Mechanics (which specific Western aspects, Vedic Dashas, or BaZi elements govern this situation).
3. Ideal Timing & Strategic Windows (referencing current Vedic Dasha and Numerology Personal Year).
4. Concrete Recommended Action Steps & Karmic Advice.

${lengthInstruction}
    `;
  }

  if (mode === "dharma") {
    return `
${chartSummary}

TASK:
Generate a specialized "Soul Purpose, Karmic Dharma & Evolutionary Destiny" reading.
Structure your response in Markdown:
1. ### The Incarnational Mandate
   Synthesize Pythagorean Life Path ${input.numerology.lifePath} with Western Ascendant & Midheaven, and Vedic Nakshatra ${input.vedic.nakshatra}.
2. ### Ancestral Lineage & Karmic Inheritance
   Analyze Vedic Rahu/Ketu axis and BaZi Year Pillar. What ancestral patterns is the soul transmuting?
3. ### The Higher Calling & Spiritual Gifts
   Identify rare spiritual and philosophical talents across the chart.
4. ### The Shadow Trap
   Specific pitfalls, spiritual bypassing, or ego traps to consciously transcend.
5. ### Sovereign Alignment Practice
   A daily ritual, contemplative prompt, or ethical discipline that anchors this soul in its highest frequency.

${lengthInstruction}
    `;
  }

  if (mode === "career") {
    return `
${chartSummary}

TASK:
Generate a specialized "Vocational Sovereignty, Wealth Architecture & Public Impact" reading.
Structure your response in Markdown:
1. ### Executive Profile & Natural Leadership Style
   Synthesize Western Midheaven (${input.western.midheaven}) and 10th house, Vedic Lagna, and BaZi Day Master.
2. ### The Wealth Flow: Natural Monetization Arenas
   Evaluate Western 2nd/8th houses, Vedic Dhana Yogas, and BaZi Wealth/Output elements.
3. ### Ideal Environments vs. Burnout Traps
   Work conditions where this chart thrives vs. toxic structures that stifle their vitality.
4. ### Current Career Season & Financial Timing
   Synthesize current Vedic Dasha (${input.vedic.currentDasha.planet}) with Personal Year ${input.numerology.personalYear}. Is this a time to plant seeds, build infrastructure, or harvest?
5. ### Strategic Career Roadmap (Next 12-24 Months)
   3 clear, actionable moves to maximize abundance and authority.

${lengthInstruction}
    `;
  }

  if (mode === "relationships") {
    return `
${chartSummary}

TASK:
Generate a specialized "Love, Sacred Intimacy & Relational Architecture" reading.
Structure your response in Markdown:
1. ### Relational Essence & The Soul's Mirror
   Analyze Western 7th house (Descendant) & Venus/Mars, Soul Urge ${input.numerology.soulUrge}, and BaZi Day Branch (Spouse Palace).
2. ### What This Soul Truly Craves in Partnership
   Contrast outward persona vs. vulnerable subterranean emotional needs (Western Moon ${input.western.moon.sign} in House ${input.western.moon.house} + Vedic Janma Rasi ${input.vedic.moonSign}).
3. ### Recurring Karmic Patterns in Partnership
   Vedic 7th lord, Navamsa D9 inclinations, and BaZi relationship dynamics.
4. ### Compatibility Compass
   Elemental, animal, and vibrational pairings that bring sublime resonance vs. high-friction catalysts.
5. ### Harmonization Advice for Current & Future Partnerships
   Keys to maintaining sovereign individuality while deepening sacred intimacy.

${lengthInstruction}
    `;
  }

  if (mode === "forecast") {
    return `
${chartSummary}

TASK:
Generate a specialized "Cosmic Cycles, Active Planetary Seasons & 12-Month Forecast".
Structure your response in Markdown:
1. ### The Macro Season: Active Vedic Vimshottari Mahadasha
   Deep dive into the current ruling planet (${input.vedic.currentDasha.planet}) and what psychological/material themes it is orchestrating.
2. ### The Annual Cycle: Pythagorean Personal Year ${input.numerology.personalYear}
   Where the seeker sits in their 9-year evolutionary spiral and the primary spiritual curriculum of this calendar year.
3. ### The Chinese Annual Alignment
   How their ${input.chinese.element} ${input.chinese.animal} interacts with current annual cosmic energies.
4. ### Critical Thresholds: Quarter-by-Quarter Forecast
   Breakdown of the upcoming 4 quarters (Q1-Q4) with strategic opportunities and red-flag caution periods.
5. ### The Guiding Mantra & Strategic Recommendation
   Summary principle to navigate this period with graceful mastery.

${lengthInstruction}
    `;
  }

  // Default: Holistic Master Blueprint
  return `
${chartSummary}

TASK:
Generate the comprehensive Master Multi-System Astrological & Numerological Blueprint.
Structure your response into 5 detailed, eloquent chapters using Markdown:

### Chapter 1: The Sovereign Triad (Identity & Psychological Blueprint)
Synthesize Western Sun/Moon/Rising, Vedic Lagna & Nakshatra (${input.vedic.nakshatra}), and Chinese Day Master. How do conscious intention, emotional necessity, and instinctive societal presentation work together?

### Chapter 2: Karmic Dharma & Evolutionary Soul Curriculum
Examine Pythagorean Life Path ${input.numerology.lifePath}, Western Lunar Nodes, and Vedic Karmic indicators. What is the fundamental evolutionary reason for this incarnation?

### Chapter 3: Love, Intimacy & Relational Dynamics
Explore relational needs via Western 7th house, Vedic Navamsa, Chinese Spouse Palace, and Soul Urge ${input.numerology.soulUrge}.

### Chapter 4: Career Sovereignty, Wealth & Material Manifestation
Vocational blueprint: Western 10th house Midheaven, Vedic wealth alignments, and BaZi productive elements.

### Chapter 5: Current Cosmic Seasons & 12-Month Strategic Directive
Synthesize active Vedic Dasha (${input.vedic.currentDasha.planet}) and Pythagorean Personal Year ${input.numerology.personalYear}. What phase are they in right now, and what are their 3 highest leverage priorities?

${lengthInstruction}
  `;
}
