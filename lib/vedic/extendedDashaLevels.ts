/**
 * Classical Parashari Vimshottari Dasha Engine - Levels 3 & 4
 * Level 3: Pratyantardasha (Sub-Sub-Periods)
 * Level 4: Sookshma (Fine Sub-Periods)
 * Uses classical Vedic year (360 days) and exact Parashari proportional fractions.
 */

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface PratyantardashaInterpretation {
  title: string;
  description: string;
  themes: string[];
  energy: "excellent" | "good" | "mixed" | "challenging" | "difficult";
  bestActions: string[];
  avoidActions: string[];
  mentalState: string;
  opportunities: string[];
  risks: string[];
}

export interface SookshmaInterpretation {
  brief: string;
  energyQuality: "positive" | "neutral" | "challenging";
  recommendedFocus: string;
  avoidDuring: string;
}

export interface SookshmaPeriod {
  lord: string;
  fullName: string; // e.g., "Rahu-Rahu-Rahu-Rahu"
  startDate: Date;
  endDate: Date;
  startDateFormatted: string;
  endDateFormatted: string;
  durationYears: number;
  durationDays: number;
  durationFormatted: string; // e.g., "21d" or "21.9d"
  isCurrent: boolean;
  interpretation: SookshmaInterpretation;
}

export interface PratyantardashaPeriod {
  lord: string;
  fullName: string; // e.g., "Rahu-Rahu-Rahu"
  startDate: Date;
  endDate: Date;
  startDateFormatted: string;
  endDateFormatted: string;
  durationYears: number;
  durationDays: number;
  durationFormatted: string; // e.g., "4m 24d"
  isCurrent: boolean;
  interpretation: PratyantardashaInterpretation;
  sookshmas: SookshmaPeriod[];
}

export interface CurrentExtendedPeriods {
  mahadashaLord: string;
  antardashaLord: string;
  pratyantardasha: PratyantardashaPeriod | null;
  sookshma: SookshmaPeriod | null;
  timeRemainingInPratyantardasha: number; // in days
  timeRemainingInSookshma: number; // in days
  nextPratyantardasha: {
    lord: string;
    fullName: string;
    startDateFormatted: string;
  } | null;
  nextSookshma: {
    lord: string;
    fullName: string;
    startDateFormatted: string;
  } | null;
}

// ============================================================
// EXTENDED DASHA CALCULATOR
// ============================================================

export class ExtendedDashaCalculator {
  // Classical Vimshottari planetary periods (Years summing to 120)
  public static readonly DASHA_YEARS: Record<string, number> = {
    Ketu: 7,
    Venus: 20,
    Sun: 6,
    Moon: 10,
    Mars: 7,
    Rahu: 18,
    Jupiter: 16,
    Saturn: 19,
    Mercury: 17,
  };

  // Fixed Vimshottari Sequence
  public static readonly SEQUENCE: string[] = [
    "Ketu",
    "Venus",
    "Sun",
    "Moon",
    "Mars",
    "Rahu",
    "Jupiter",
    "Saturn",
    "Mercury",
  ];

  public static readonly DAYS_PER_YEAR = 360; // Vedic Savana Calendar
  public static readonly DAYS_PER_MONTH = 30;

  /**
   * Sequence starting from any specified planet
   */
  public getSequenceFrom(startPlanet: string): string[] {
    const startIndex = ExtendedDashaCalculator.SEQUENCE.indexOf(startPlanet);
    if (startIndex === -1) return [...ExtendedDashaCalculator.SEQUENCE];
    const result: string[] = [];
    for (let i = 0; i < 9; i++) {
      result.push(ExtendedDashaCalculator.SEQUENCE[(startIndex + i) % 9]);
    }
    return result;
  }

  /**
   * Generate ALL 9 Pratyantardashas for a given Antardasha
   * Formula: Pratyantardasha Duration = (Antardasha Years * Pratyantardasha Planet Years) / 120
   * Sequence starts with Antardasha lord.
   */
  public generatePratyantardashas(
    mahadashaLord: string,
    antardashaLord: string,
    antardashaStartDate: Date,
    antardashaYears: number,
    referenceDate: Date = new Date()
  ): PratyantardashaPeriod[] {
    const pratyantardashas: PratyantardashaPeriod[] = [];
    let currentMs = antardashaStartDate.getTime();
    const sequence = this.getSequenceFrom(antardashaLord);

    for (let i = 0; i < 9; i++) {
      const pratyantardashaLord = sequence[i];

      // Exact Vedic Parashari calculation
      const pratyantardashaYears =
        (antardashaYears * ExtendedDashaCalculator.DASHA_YEARS[pratyantardashaLord]) / 120;

      const pratyantardashaDays = pratyantardashaYears * ExtendedDashaCalculator.DAYS_PER_YEAR;
      // In milliseconds (360 days Vedic calendar conversion)
      const durationMs = pratyantardashaDays * 24 * 3600 * 1000;

      const startDate = new Date(currentMs);
      const endDate = new Date(currentMs + durationMs);

      const isCurrent =
        referenceDate.getTime() >= startDate.getTime() &&
        referenceDate.getTime() < endDate.getTime();

      // Generate Level 4 Sookshmas
      const sookshmas = this.generateSookshmas(
        mahadashaLord,
        antardashaLord,
        pratyantardashaLord,
        startDate,
        pratyantardashaYears,
        referenceDate
      );

      const pratyantardasha: PratyantardashaPeriod = {
        lord: pratyantardashaLord,
        fullName: `${mahadashaLord}-${antardashaLord}-${pratyantardashaLord}`,
        startDate,
        endDate,
        startDateFormatted: this.formatDate(startDate),
        endDateFormatted: this.formatDate(endDate),
        durationYears: Math.round(pratyantardashaYears * 10000) / 10000,
        durationDays: Math.round(pratyantardashaDays * 10) / 10,
        durationFormatted: this.formatDays(pratyantardashaDays),
        isCurrent,
        interpretation: this.getPratyantardashaInterpretation(
          mahadashaLord,
          antardashaLord,
          pratyantardashaLord
        ),
        sookshmas,
      };

      pratyantardashas.push(pratyantardasha);
      currentMs += durationMs;
    }

    return pratyantardashas;
  }

  /**
   * Generate ALL 9 Sookshmas for a given Pratyantardasha
   * Formula: Sookshma Duration = (Pratyantardasha Years * Sookshma Planet Years) / 120
   * Sequence starts with Pratyantardasha lord.
   */
  public generateSookshmas(
    mahadashaLord: string,
    antardashaLord: string,
    pratyantardashaLord: string,
    pratyantardashaStartDate: Date,
    pratyantardashaYears: number,
    referenceDate: Date = new Date()
  ): SookshmaPeriod[] {
    const sookshmas: SookshmaPeriod[] = [];
    let currentMs = pratyantardashaStartDate.getTime();
    const sequence = this.getSequenceFrom(pratyantardashaLord);

    for (let i = 0; i < 9; i++) {
      const sookshmaLord = sequence[i];

      // Exact Level 4 Parashari calculation
      const sookshmaYears =
        (pratyantardashaYears * ExtendedDashaCalculator.DASHA_YEARS[sookshmaLord]) / 120;

      const sookshmaDays = sookshmaYears * ExtendedDashaCalculator.DAYS_PER_YEAR;
      const durationMs = sookshmaDays * 24 * 3600 * 1000;

      const startDate = new Date(currentMs);
      const endDate = new Date(currentMs + durationMs);

      const isCurrent =
        referenceDate.getTime() >= startDate.getTime() &&
        referenceDate.getTime() < endDate.getTime();

      const sookshma: SookshmaPeriod = {
        lord: sookshmaLord,
        fullName: `${mahadashaLord}-${antardashaLord}-${pratyantardashaLord}-${sookshmaLord}`,
        startDate,
        endDate,
        startDateFormatted: this.formatDate(startDate),
        endDateFormatted: this.formatDate(endDate),
        durationYears: Math.round(sookshmaYears * 100000) / 100000,
        durationDays: Math.round(sookshmaDays * 10) / 10,
        durationFormatted: this.formatDays(sookshmaDays),
        isCurrent,
        interpretation: this.getSookshmaInterpretation(
          mahadashaLord,
          antardashaLord,
          pratyantardashaLord,
          sookshmaLord
        ),
      };

      sookshmas.push(sookshma);
      currentMs += durationMs;
    }

    return sookshmas;
  }

  /**
   * Find current active extended periods and countdowns
   */
  public findCurrentExtendedPeriods(
    pratyantardashas: PratyantardashaPeriod[],
    mahadashaLord: string,
    antardashaLord: string,
    targetDate: Date = new Date()
  ): CurrentExtendedPeriods {
    let currentPD: PratyantardashaPeriod | null = null;
    let nextPD: PratyantardashaPeriod | null = null;
    let currentSK: SookshmaPeriod | null = null;
    let nextSK: SookshmaPeriod | null = null;

    for (let i = 0; i < pratyantardashas.length; i++) {
      const pd = pratyantardashas[i];
      if (targetDate.getTime() >= pd.startDate.getTime() && targetDate.getTime() < pd.endDate.getTime()) {
        currentPD = pd;
        nextPD = pratyantardashas[i + 1] || null;

        // Check Sookshmas inside current Pratyantardasha
        for (let j = 0; j < pd.sookshmas.length; j++) {
          const sk = pd.sookshmas[j];
          if (targetDate.getTime() >= sk.startDate.getTime() && targetDate.getTime() < sk.endDate.getTime()) {
            currentSK = sk;
            nextSK = pd.sookshmas[j + 1] || (nextPD ? nextPD.sookshmas[0] : null);
            break;
          }
        }
        break;
      }
    }

    // Fallback if targetDate outside bounds
    if (!currentPD && pratyantardashas.length > 0) {
      currentPD = pratyantardashas[0];
      currentSK = currentPD.sookshmas[0];
    }

    const timeRemainingPD = currentPD
      ? Math.max(0, Math.ceil((currentPD.endDate.getTime() - targetDate.getTime()) / (1000 * 24 * 3600)))
      : 0;

    const timeRemainingSK = currentSK
      ? Math.max(0, Math.ceil((currentSK.endDate.getTime() - targetDate.getTime()) / (1000 * 24 * 3600)))
      : 0;

    return {
      mahadashaLord,
      antardashaLord,
      pratyantardasha: currentPD,
      sookshma: currentSK,
      timeRemainingInPratyantardasha: timeRemainingPD,
      timeRemainingInSookshma: timeRemainingSK,
      nextPratyantardasha: nextPD
        ? {
            lord: nextPD.lord,
            fullName: nextPD.fullName,
            startDateFormatted: nextPD.startDateFormatted,
          }
        : null,
      nextSookshma: nextSK
        ? {
            lord: nextSK.lord,
            fullName: nextSK.fullName,
            startDateFormatted: nextSK.startDateFormatted,
          }
        : null,
    };
  }

  /**
   * Classical Parashari interpretation retriever with rich dynamic synthesis
   */
  public getPratyantardashaInterpretation(
    mahadashaLord: string,
    antardashaLord: string,
    pratyantardashaLord: string
  ): PratyantardashaInterpretation {
    const key = `${mahadashaLord}-${antardashaLord}-${pratyantardashaLord}`;
    if (PRATYANTARDASHA_INTERPRETATIONS[key]) {
      return PRATYANTARDASHA_INTERPRETATIONS[key];
    }
    return this.generateDynamicPratyantardashaInterpretation(
      mahadashaLord,
      antardashaLord,
      pratyantardashaLord
    );
  }

  /**
   * Sookshma Interpretation generator
   */
  public getSookshmaInterpretation(
    mahadashaLord: string,
    antardashaLord: string,
    pratyantardashaLord: string,
    sookshmaLord: string
  ): SookshmaInterpretation {
    return SookshmaInterpretationGenerator.generate(
      mahadashaLord,
      antardashaLord,
      pratyantardashaLord,
      sookshmaLord
    );
  }

  // ============================================================
  // FORMATTING & UTILITIES
  // ============================================================

  public formatDate(date: Date): string {
    const y = date.getUTCFullYear();
    const m = (date.getUTCMonth() + 1).toString().padStart(2, "0");
    const d = date.getUTCDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  public formatDays(totalDays: number): string {
    const roundedTotal = Math.round(totalDays * 10) / 10;
    if (roundedTotal >= 360) {
      const years = Math.floor(roundedTotal / 360);
      const remainingDays = roundedTotal % 360;
      const months = Math.floor(remainingDays / 30);
      const days = Math.round(remainingDays % 30);
      return `${years}y ${months}m ${days}d`;
    } else if (roundedTotal >= 30) {
      const months = Math.floor(roundedTotal / 30);
      const days = Math.round((roundedTotal % 30) * 10) / 10;
      return days > 0 ? `${months}m ${days}d` : `${months}m`;
    } else {
      return `${roundedTotal}d`;
    }
  }

  /**
   * Dynamic Parashari generator synthesizing MD (General Atmosphere),
   * AD (Operational Arena), and PD (Immediate Catalyst).
   */
  private generateDynamicPratyantardashaInterpretation(
    mahadashaLord: string,
    antardashaLord: string,
    pratyantardashaLord: string
  ): PratyantardashaInterpretation {
    const PLANET_ARCHETYPES: Record<
      string,
      {
        nature: "benefic" | "malefic";
        domain: string;
        positiveThemes: string[];
        cautions: string[];
        mind: string;
      }
    > = {
      Ketu: {
        nature: "malefic",
        domain: "Moksha, detachment, psychic insight, sudden closure",
        positiveThemes: ["Spiritual awakening", "Intuitive breakthroughs", "Cutting toxic cords", "Solitude"],
        cautions: ["Disorientation", "Apathy", "Sudden estrangement", "Undiagnosed fatigue"],
        mind: "Introspective, detached, seeking spiritual meaning beyond material illusion.",
      },
      Venus: {
        nature: "benefic",
        domain: "Shukra, beauty, wealth, diplomatic charm, love",
        positiveThemes: ["Harmonious agreements", "Artistic creation", "Financial windfalls", "Sensory joy"],
        cautions: ["Overindulgence", "Vanity", "Extravagance", "Compromising boundaries"],
        mind: "Affectionate, receptive, seeking aesthetic balance and cooperative harmony.",
      },
      Sun: {
        nature: "malefic",
        domain: "Surya, sovereignty, authority, vitality, father, dharma",
        positiveThemes: ["Executive recognition", "Vital physical energy", "Clarity of purpose", "Leadership"],
        cautions: ["Ego clashes with superiors", "Arrogance", "Inflammatory stress", "Impatience"],
        mind: "Commanding, dignified, driven by purpose and authentic self-respect.",
      },
      Moon: {
        nature: "benefic",
        domain: "Chandra, mind, emotional security, public favor, mother",
        positiveThemes: ["Emotional equilibrium", "Public empathy", "Creative flow", "Domestic peace"],
        cautions: ["Mood fluctuations", "Over-sensitivity", "Indecision", "Clinging to the past"],
        mind: "Intuitive, nurturing, sensitive to environments and human connections.",
      },
      Mars: {
        nature: "malefic",
        domain: "Mangala, valor, tactical execution, land, engineering",
        positiveThemes: ["Decisive action", "Courageous breakthroughs", "Physical fitness", "Technical feats"],
        cautions: ["Aggression", "Accident-prone haste", "Impulsive confrontations", "Burnout"],
        mind: "Fierce, competitive, focused on swift achievement and conquering obstacles.",
      },
      Rahu: {
        nature: "malefic",
        domain: "Maya, worldly ambition, foreign affairs, innovation",
        positiveThemes: ["Unconventional advancement", "Foreign opportunities", "Tech breakthroughs", "Bold vision"],
        cautions: ["Illusion", "Obsessive desires", "Speculative losses", "Deceptive alliances"],
        mind: "Hungry, restless, relentlessly pursuing ambition and breaking conventions.",
      },
      Jupiter: {
        nature: "benefic",
        domain: "Guru, supreme wisdom, dharma, wealth, progeny, guidance",
        positiveThemes: ["Expansion of fortune", "Scholarly success", "Ethical triumph", "Mentorship blessings"],
        cautions: ["Complacency", "Over-promising", "Dogmatism", "Excessive optimism"],
        mind: "Magnanimous, philosophical, inspired by noble ideals and expansive wisdom.",
      },
      Saturn: {
        nature: "malefic",
        domain: "Shani, karma, discipline, endurance, time, lasting structures",
        positiveThemes: ["Unshakeable foundations", "Enduring patience", "Karmic maturity", "Systematic mastery"],
        cautions: ["Delays", "Heaviness", "Isolation", "Rigid pessimism"],
        mind: "Stoic, deeply cautious, pragmatic, focused on heavy duty and lasting legacy.",
      },
      Mercury: {
        nature: "benefic",
        domain: "Budha, intellect, commerce, analytics, speech, writing",
        positiveThemes: ["Commercial acumen", "Sharp negotiation", "Learning agility", "Effective media"],
        cautions: ["Nervous anxiety", "Scattered focus", "Overthinking", "Cynical manipulation"],
        mind: "Agile, analytical, curious, seeking rational clarity and efficient solutions.",
      },
    };

    const mdInfo = PLANET_ARCHETYPES[mahadashaLord] || PLANET_ARCHETYPES.Jupiter;
    const adInfo = PLANET_ARCHETYPES[antardashaLord] || PLANET_ARCHETYPES.Mercury;
    const pdInfo = PLANET_ARCHETYPES[pratyantardashaLord] || PLANET_ARCHETYPES.Venus;

    // Energy grade determination
    let beneficCount = 0;
    if (mdInfo.nature === "benefic") beneficCount++;
    if (adInfo.nature === "benefic") beneficCount++;
    if (pdInfo.nature === "benefic") beneficCount += 1.5;

    let energy: PratyantardashaInterpretation["energy"] = "mixed";
    if (beneficCount >= 3) energy = "excellent";
    else if (beneficCount >= 2) energy = "good";
    else if (beneficCount === 1.5) energy = "mixed";
    else if (beneficCount === 1) energy = "challenging";
    else energy = "difficult";

    const title = `${pratyantardashaLord} Catalyst under ${mahadashaLord}-${antardashaLord}`;
    const description = `This Sub-Sub-Period activates ${pratyantardashaLord}'s energy (${pdInfo.domain}) within the broader ${adInfo.domain} arena established by ${antardashaLord}, under the master life theme of ${mahadashaLord}. The immediate focus crystallizes around ${pdInfo.positiveThemes[0].toLowerCase()} and requires balancing with mindful attention to ${pdInfo.cautions[0].toLowerCase()}.`;

    return {
      title,
      description,
      themes: [
        ...pdInfo.positiveThemes.slice(0, 3),
        ...adInfo.positiveThemes.slice(0, 2),
        `Karmic focus on ${pratyantardashaLord}`,
      ],
      energy,
      bestActions: [
        `Engage in ${pdInfo.positiveThemes[0].toLowerCase()}`,
        `Harness ${adInfo.positiveThemes[1] ? adInfo.positiveThemes[1].toLowerCase() : "constructive planning"}`,
        `Direct energy toward systematic progress rather than hasty results`,
      ],
      avoidActions: [
        `Avoid ${pdInfo.cautions[0].toLowerCase()}`,
        `Refrain from ${pdInfo.cautions[1] ? pdInfo.cautions[1].toLowerCase() : "impulsive commitments"}`,
        `Avoid bypassing ethical standards in pursuit of swift gains`,
      ],
      mentalState: `${pdInfo.mind} Filtered through the ${adInfo.domain.toLowerCase()} context of the parent Antardasha.`,
      opportunities: [
        `Progress in ${pdInfo.positiveThemes[0]}`,
        `Strategic resolution of ${adInfo.positiveThemes[0]} matters`,
        `Deepening wisdom in personal mastery`,
      ],
      risks: [
        `Risk of ${pdInfo.cautions[0]}`,
        `Friction arising from ${pdInfo.cautions[1] || "misaligned expectations"}`,
      ],
    };
  }
}

// ============================================================
// SOOKSHMA INTERPRETATION GENERATOR
// ============================================================

export class SookshmaInterpretationGenerator {
  public static readonly PLANET_QUALITIES: Record<
    string,
    { nature: string; focus: string; avoid: string }
  > = {
    Ketu: {
      nature: "Spiritual detachment & psychic clarity",
      focus: "Introspection, meditation, releasing obsolete attachments",
      avoid: "Material fixation, signing hasty speculative documents",
    },
    Venus: {
      nature: "Aesthetic harmony & social refinement",
      focus: "Artistic expression, diplomatic agreements, romance",
      avoid: "Sensory indulgence, financial vanity, compromising values",
    },
    Sun: {
      nature: "Sovereign vitality & executive will",
      focus: "Leadership presentation, vital health, core goals",
      avoid: "Ego confrontations, pride, autocratic behavior",
    },
    Moon: {
      nature: "Intuitive perception & emotional nurturing",
      focus: "Domestic tranquility, team empathy, creative ideation",
      avoid: "Emotional volatility, mood swings, subjective bias",
    },
    Mars: {
      nature: "Tactical courage & physical momentum",
      focus: "Decisive physical action, technical focus, clearing backlogs",
      avoid: "Short-tempered disputes, hazardous haste, conflict",
    },
    Rahu: {
      nature: "Innovative ambition & unconventional reach",
      focus: "Digital technology, strategic networking, bold concepts",
      avoid: "Deceptive allure, greed, speculative risks",
    },
    Jupiter: {
      nature: "Expansive wisdom & benevolent guidance",
      focus: "Higher study, mentorship, generous ethical alliances",
      avoid: "Dogmatic overconfidence, ungrounded optimism",
    },
    Saturn: {
      nature: "Stoic discipline & enduring structure",
      focus: "Rigorous work ethic, fulfilling obligations, patient execution",
      avoid: "Procrastination, defeatism, taking shortcuts",
    },
    Mercury: {
      nature: "Analytical brilliance & commercial dexterity",
      focus: "Negotiation, research, financial accounting, writing",
      avoid: "Mental scatter, cynical gossip, nervous overexertion",
    },
  };

  public static generate(
    mahadashaLord: string,
    antardashaLord: string,
    pratyantardashaLord: string,
    sookshmaLord: string
  ): SookshmaInterpretation {
    const q = this.PLANET_QUALITIES[sookshmaLord] || this.PLANET_QUALITIES.Jupiter;
    const tone = this.calculateOverallTone(
      mahadashaLord,
      antardashaLord,
      pratyantardashaLord,
      sookshmaLord
    );

    return {
      brief: `Under ${mahadashaLord}-${antardashaLord}-${pratyantardashaLord}, this ${sookshmaLord} Sookshma directs focus toward ${q.focus.toLowerCase()}. The planetary atmosphere is characterized by ${q.nature.toLowerCase()}.`,
      energyQuality: tone,
      recommendedFocus: q.focus,
      avoidDuring: q.avoid,
    };
  }

  public static calculateOverallTone(
    mahadashaLord: string,
    antardashaLord: string,
    pratyantardashaLord: string,
    sookshmaLord: string
  ): "positive" | "neutral" | "challenging" {
    const benefics = ["Jupiter", "Venus", "Mercury", "Moon"];
    const malefics = ["Saturn", "Mars", "Rahu", "Ketu", "Sun"];

    let beneficWeight = 0;
    let maleficWeight = 0;

    const planets = [
      { name: mahadashaLord, weight: 1 },
      { name: antardashaLord, weight: 1.5 },
      { name: pratyantardashaLord, weight: 2 },
      { name: sookshmaLord, weight: 2.5 },
    ];

    planets.forEach((p) => {
      if (benefics.includes(p.name)) beneficWeight += p.weight;
      else if (malefics.includes(p.name)) maleficWeight += p.weight;
    });

    if (beneficWeight - maleficWeight >= 1.5) return "positive";
    if (maleficWeight - beneficWeight >= 1.5) return "challenging";
    return "neutral";
  }
}

// ============================================================
// COMPLETE PRATYANTARDASHA INTERPRETATIONS DATABASE
// High-priority Classical Parashari Interpretations
// ============================================================

const PRATYANTARDASHA_INTERPRETATIONS: Record<string, PratyantardashaInterpretation> = {
  // ------------------------------------------------------------
  // RAHU MAHADASHA - RAHU ANTARDASHA
  // ------------------------------------------------------------
  "Rahu-Rahu-Rahu": {
    title: "Triple Intensity of Ambition & Maya",
    description:
      "The zenith of Rahu's catalytic power. Ambitions, foreign connections, and desire for breakthroughs reach maximum intensity. Extraordinary breakthroughs in technology or media are possible, but clarity of vision is tested against illusion.",
    themes: [
      "Intense ambition",
      "Sudden recognition",
      "Foreign opportunities",
      "Technology breakthroughs",
      "Identity recalibration",
    ],
    energy: "mixed",
    bestActions: [
      "Channel relentless energy into focused technological or creative innovation",
      "Pursue international or cross-cultural collaborations",
      "Double-check every legal contract with sober discernment",
    ],
    avoidActions: [
      "Speculative get-rich-quick gambles",
      "Blind trust in unvetted promises",
      "Ignoring physical rest and nervous exhaustion",
    ],
    mentalState: "Hyper-ambitious, mentally energized, but prone to restlessness and illusion.",
    opportunities: [
      "Rapid career elevation through unconventional methods",
      "Breakthrough in digital platforms and innovation",
      "Attracting influential unconventional allies",
    ],
    risks: [
      "Deceptive proposals",
      "Allergic or nervous fatigue",
      "Overextending personal credit and bandwidth",
    ],
  },

  "Rahu-Rahu-Jupiter": {
    title: "Ambition Guided by Divine Wisdom",
    description:
      "Jupiter's noble light illuminates Rahu's raw ambition. High-level educational expansion, spiritual synthesis, and ethical business expansion flourish. Mentors and visionary guides appear to guide worldly drives.",
    themes: [
      "Higher education & publication",
      "Mentorship & spiritual guidance",
      "Ethical wealth expansion",
      "Foreign academic success",
    ],
    energy: "good",
    bestActions: [
      "Enroll in advanced philosophy, science, or leadership curricula",
      "Publish intellectual property and share acquired knowledge",
      "Seek council from venerable and seasoned advisors",
    ],
    avoidActions: [
      "Arrogant displays of pseudo-knowledge",
      "Ignoring legal and moral codes",
      "Overspending on ostentatious displays",
    ],
    mentalState: "Philosophically inspired, generous, balanced between worldly drive and higher truth.",
    opportunities: [
      "Prestigious academic or professional certification",
      "Expansion into lucrative consulting ventures",
      "Spiritual clarity through genuine teachers",
    ],
    risks: [
      "Misguided optimism in unvetted partners",
      "Overextending capital on speculative growth",
    ],
  },

  "Rahu-Rahu-Saturn": {
    title: "Testing of Worldly Desires Through Discipline",
    description:
      "Saturn demands rigorous structural integrity from Rahu's restless desires. Projects experience delays to ensure foundations are impregnable. Those who embrace patient craftsmanship reap lasting rewards.",
    themes: [
      "Disciplined restructuring",
      "Karmic reality check",
      "Patience under scrutiny",
      "Long-range foundation building",
    ],
    energy: "challenging",
    bestActions: [
      "Systematize daily routines and eliminate operational waste",
      "Honor tedious administrative responsibilities with stoic excellence",
      "Prioritize spinal, joint, and bone health",
    ],
    avoidActions: [
      "Cutting corners to expedite deliverables",
      "Pessimistic defeatism during temporary lulls",
      "Rebelling against legitimate institutional authority",
    ],
    mentalState: "Sober, pressured, yet deeply resilient when focused on duty.",
    opportunities: [
      "Building structures that withstand decades",
      "Mastery of difficult technical skills",
      "Clearing legacy karmic obligations",
    ],
    risks: [
      "Mental fatigue from slow progress",
      "Chronic strain on the nervous system",
      "Friction with rigid bureaucracies",
    ],
  },

  "Rahu-Rahu-Mercury": {
    title: "Intellectual Agility & Commercial Penetration",
    description:
      "A fast-paced, intellectually razor-sharp phase. Strategic communications, digital marketing, coding, publishing, and commercial negotiations receive a powerful surge of momentum.",
    themes: [
      "Commercial negotiations",
      "Media and technical agility",
      "Public relations",
      "Rapid analytical insight",
    ],
    energy: "good",
    bestActions: [
      "Launch digital campaigns and communications platforms",
      "Negotiate multi-party agreements with meticulous documentation",
      "Audit commercial and financial spreadsheets",
    ],
    avoidActions: [
      "Spreading energy across too many scattered micro-tasks",
      "Sensationalized claims in promotional copy",
      "Signing contracts without third-party legal review",
    ],
    mentalState: "Electrified, analytical, curious, and quick-witted.",
    opportunities: [
      "Lucrative commercial contracts",
      "Successful media or software deployment",
      "Expansion of professional networks",
    ],
    risks: [
      "Misunderstandings due to rapid, imprecise speech",
      "Restlessness and insomnia from information overload",
    ],
  },

  "Rahu-Rahu-Ketu": {
    title: "Karmic Axis Reckoning & Intuitive Detachment",
    description:
      "The nodal axes align. Intense spiritual purging of obsolete ambitions occurs. You are invited to detach from hollow external validation and anchor in profound inner truth.",
    themes: [
      "Spiritual purification",
      "Cutting false illusions",
      "Sudden redirection of goals",
      "Sacred solitude",
    ],
    energy: "challenging",
    bestActions: [
      "Engage in meditation, breathwork, and sacred retreats",
      "Release toxic entanglements gracefully without vindictiveness",
      "Simplify domestic and financial overhead",
    ],
    avoidActions: [
      "Clinging desperately to collapsing arrangements",
      "High-stakes material acquisitions",
      "Ignoring intuitive red flags",
    ],
    mentalState: "Detached, introspective, disoriented by material superficiality.",
    opportunities: [
      "Profound psychic breakthroughs and spiritual liberation",
      "Eradicating lifelong emotional dependencies",
    ],
    risks: [
      "Feelings of alienation or sudden professional drift",
      "Psychosomatic fatigue if resisting rest",
    ],
  },

  "Rahu-Rahu-Venus": {
    title: "Sensual Charisma, Opulence & Aesthetic Magnetism",
    description:
      "A highly magnetic, luxurious phase. Rahu amplifies Venus's desires for elegance, high art, romantic passion, and wealth generation. Great for creative launches and forging influential alliances.",
    themes: [
      "Romantic magnetism",
      "Artistic eminence",
      "Luxury acquisitions",
      "Social charm & networking",
    ],
    energy: "good",
    bestActions: [
      "Produce and launch premium aesthetic or artistic endeavors",
      "Negotiate win-win agreements with diplomatic grace",
      "Invest in personal wellness and sophisticated styling",
    ],
    avoidActions: [
      "Excessive expenditures on superficial prestige",
      "Entering romantic intrigues that compromise integrity",
      "Overindulgence in rich foods or sensory stimulation",
    ],
    mentalState: "Charming, indulgent, romantically receptive, and socially radiant.",
    opportunities: [
      "Lucrative creative or artistic contracts",
      "Meeting an influential and enchanting partner",
      "High-profile social recognition",
    ],
    risks: [
      "Financial overspending on ephemeral luxuries",
      "Romantic disillusionment if projecting fantasies",
    ],
  },

  "Rahu-Rahu-Sun": {
    title: "Ego Illumination & Authority Testing",
    description:
      "Rahu meets Surya's solar fire. High-stakes encounters with authority figures, executive leaders, or government institutions. Your drive for personal sovereignty is tested against humility.",
    themes: [
      "Executive visibility",
      "Government or corporate audits",
      "Confronting authority",
      "Vitality testing",
    ],
    energy: "mixed",
    bestActions: [
      "Step into visible leadership with impeccable transparency",
      "Resolve tax, governmental, or institutional paperwork",
      "Strengthen cardiovascular and immune vitality",
    ],
    avoidActions: [
      "Hubristic defiance of lawful authority",
      "Taking credit for collective achievements alone",
      "Allowing ego clashes to rupture key partnerships",
    ],
    mentalState: "Proud, fiery, ambitious, yet wary of external scrutiny.",
    opportunities: [
      "Elevation into public or institutional office",
      "Securing major executive sponsorship",
    ],
    risks: [
      "Public reputational scrutiny",
      "Cardiovascular or eye strain from chronic tension",
    ],
  },

  "Rahu-Rahu-Moon": {
    title: "Emotional Tide & Intuitive Churning",
    description:
      "The mind (Manas) undergoes an intense emotional churning (Samudra Manthan). Deep subconscious fears surface alongside psychic clairvoyance and public empathy.",
    themes: [
      "Subconscious healing",
      "Public emotional resonance",
      "Psychic intuition",
      "Fluctuating emotional states",
    ],
    energy: "mixed",
    bestActions: [
      "Channel deep emotional currents into music, poetry, or counseling",
      "Spend restorative time near moving natural water bodies",
      "Practice grounding breathwork morning and evening",
    ],
    avoidActions: [
      "Making permanent life decisions during emotional peaks",
      "Absorbing other people's psychic drama",
      "Neglecting regular sleep rhythms",
    ],
    mentalState: "Highly sensitive, perceptive, prone to emotional waves.",
    opportunities: [
      "Deep creative mastery touching the hearts of thousands",
      "Healing maternal or ancestral emotional wounds",
    ],
    risks: [
      "Anxiety or phantom fears",
      "Water retention or digestive irregularities",
    ],
  },

  "Rahu-Rahu-Mars": {
    title: "High-Octane Drive & Courageous Conquest",
    description:
      "Rahu and Mars create Angaraka-like fiery propulsion. Tremendous courage, athletic prowess, and technical problem-solving are unlocked, requiring disciplined focus to prevent combustible conflict.",
    themes: [
      "Decisive conquest",
      "Physical and athletic feats",
      "Engineering breakthroughs",
      "Courage under fire",
    ],
    energy: "challenging",
    bestActions: [
      "Tackle formidable physical, technical, or competitive tasks",
      "Engage in rigorous cardiovascular workouts to ground excess heat",
      "Advocate fearlessly for worthy causes",
    ],
    avoidActions: [
      "Reckless driving or impulsive physical maneuvers",
      "Engaging in combative arguments or litigation",
      "Suppression of anger until explosive eruptions occur",
    ],
    mentalState: "Combative, courageous, impatient, and fiercely driven.",
    opportunities: [
      "Smashing through long-standing stagnation or rivalries",
      "Rapid completion of high-difficulty technical goals",
    ],
    risks: [
      "Minor burns, cuts, or inflammatory fevers",
      "Alienating collaborators through blunt aggressiveness",
    ],
  },

  // ------------------------------------------------------------
  // SATURN MAHADASHA - KEY PRATYANTARDASHAS
  // ------------------------------------------------------------
  "Saturn-Saturn-Saturn": {
    title: "Triple Shani: The Ultimate Crucible of Character",
    description:
      "The purest distillation of Saturnian energy in classical Jyotish. Maximum karmic audits, heavy obligations, and unyielding lessons in humility. What is built here will endure for decades.",
    themes: [
      "Supreme karmic testing",
      "Enduring fortitude",
      "Humility & service",
      "Foundation for decades",
    ],
    energy: "difficult",
    bestActions: [
      "Embrace heavy responsibilities with quiet, uncomplaining grace",
      "Perform selfless service (Seva) for the elderly and underprivileged",
      "Establish strict long-range financial austerity",
    ],
    avoidActions: [
      "Self-pity, complaining, or blaming fate",
      "Abandoning lawful commitments",
      "Impatience with inevitable chronological delays",
    ],
    mentalState: "Austere, deeply serious, introspective, building indestructible inner fortitude.",
    opportunities: [
      "Laying a 30-year foundation of unimpeachable reputation",
      "Exhausting heavy generational karmic debts",
      "Developing master-level self-reliance",
    ],
    risks: [
      "Isolation, depression, and somatic joint/bone stiffness",
      "Severe delays in anticipated rewards",
    ],
  },

  "Saturn-Saturn-Mercury": {
    title: "Practical Pragmatism & Structured Intellect",
    description:
      "Mercury's commercial intelligence provides relief and operational agility to Saturn's heavy discipline. Ideal for writing technical treatises, restructuring accounting systems, and concluding contracts.",
    themes: [
      "Technical writing & codification",
      "Systematic business management",
      "Pragmatic negotiations",
      "Legal settlements",
    ],
    energy: "good",
    bestActions: [
      "Document standard operating procedures and workflows",
      "Finalize contracts that establish long-term security",
      "Study challenging scientific, legal, or astronomical subjects",
    ],
    avoidActions: [
      "Cynical skepticism or pedantic perfectionism",
      "Neglecting mental relaxation",
    ],
    mentalState: "Disciplined, clear, analytical, and highly productive.",
    opportunities: [
      "Codification of successful enterprise systems",
      "Solid, dependable financial returns from careful planning",
    ],
    risks: ["Nerve fatigue", "Excessive worry over minute details"],
  },

  // ------------------------------------------------------------
  // JUPITER MAHADASHA - KEY PRATYANTARDASHAS
  // ------------------------------------------------------------
  "Jupiter-Jupiter-Jupiter": {
    title: "Triple Guru: Supreme Sovereign Grace & Expansion",
    description:
      "The most auspicious and blessed Parashari combination possible. Divine grace, philosophical wisdom, academic honors, and opulent wealth expansion flow naturally. A golden hour of destiny.",
    themes: [
      "Divine grace & blessings",
      "Spiritual illumination",
      "Opulent wealth growth",
      "Academic & teaching honors",
      "Progeny & family celebration",
    ],
    energy: "excellent",
    bestActions: [
      "Launch major philanthropic, academic, or spiritual initiatives",
      "Mentor others and share accumulated prosperity generously",
      "Seek higher knowledge and pilgrimage",
    ],
    avoidActions: [
      "Complacent arrogance or spiritual pride",
      "Financial overexpansion without conservative risk management",
      "Overindulgence in celebratory rich foods",
    ],
    mentalState: "Joyous, serene, profoundly wise, radiating noble benevolence.",
    opportunities: [
      "Landmark career promotions and global prestige",
      "Arrival of cherished children or family blessings",
      "Spiritual initiation into sacred traditions",
    ],
    risks: [
      "Weight gain or metabolic sluggishness",
      "Neglecting practical details in the midst of grand visions",
    ],
  },

  "Jupiter-Jupiter-Venus": {
    title: "The Meeting of the Two Great Gurus (Brihaspati & Shukra)",
    description:
      "Divine wisdom harmonizes with supreme aesthetic luxury. Wealth accumulation, marital happiness, exquisite artistic creations, and diplomatic triumph characterize this rare and blessed period.",
    themes: [
      "Supreme wealth & prosperity",
      "Marital harmony & celebrations",
      "High cultural patronage",
      "Diplomatic triumph",
    ],
    energy: "excellent",
    bestActions: [
      "Celebrate weddings, partnerships, and high cultural galas",
      "Invest in enduring art, fine real estate, and ethical wealth",
      "Bring reconciliation to estranged family or allies",
    ],
    avoidActions: [
      "Extravagant overspending to impress peers",
      "Indulgence that compromises physical purity",
    ],
    mentalState: "Harmonious, loving, expansive, filled with gratitude and peace.",
    opportunities: [
      "Significant financial windfall or inheritance",
      "Flourishing of sacred partnership and love",
    ],
    risks: ["Overindulgence in sweetness and luxury"],
  },
};
