import { PlanetPosition } from "./ephemeris";

export type AspectNature = "harmonious" | "challenging" | "spiritual" | "neutral";

export interface AspectDefinition {
  name: string;
  angle: number;
  orb: number;
  nature: AspectNature;
  symbol: string;
  color: string;
  interpretation: string;
  keywords: string[];
  harmonicNumber: number;
  harmonicFamily: string;
  divisionalOrder: string;
}

export interface AspectSettings {
  useMinorAspects: boolean;
  minorOrbMultiplier: number; // 1.0 = standard, 0.5 = tight, 1.5 = wide
  includeHarmonics: boolean;
  harmonicNumber: number; // For harmonic charts (5th, 7th, 9th, etc.)
  showWeakAspects: boolean;
  aspectTypes?: string[];
  filterNature?: "all" | AspectNature;
}

export const DEFAULT_ASPECT_SETTINGS: AspectSettings = {
  useMinorAspects: true,
  minorOrbMultiplier: 1.0,
  includeHarmonics: false,
  harmonicNumber: 5,
  showWeakAspects: false,
  filterNature: "all",
};

export interface MinorAspect {
  planet1: string;
  planet2: string;
  planet1Symbol: string;
  planet2Symbol: string;
  aspectType: AspectDefinition;
  angle: number; // shortest angular difference (0 to 180°)
  orb: number; // difference from exact aspect angle
  maxOrb: number; // maximum allowed orb under active settings
  strength: number; // 0 to 1 (normalized tightness)
  applying: boolean | null;
  interpretation: string;
  keywords: string[];
  harmonicFamily: string;
}

export interface HarmonicBreakdown {
  harmonicNumber: number;
  familyName: string;
  meaning: string;
  count: number;
  aspects: MinorAspect[];
}

export class MinorAspectsEngine {
  public static readonly MINOR_ASPECTS: AspectDefinition[] = [
    {
      name: "Semisquare",
      angle: 45,
      orb: 2,
      nature: "challenging",
      symbol: "∠",
      color: "#FF6B6B",
      interpretation:
        "Creates internal friction and drive. Indicates areas where you feel agitated or restless, pushing you to make necessary changes.",
      keywords: ["friction", "drive", "agitation", "restlessness", "urgency"],
      harmonicNumber: 8,
      harmonicFamily: "8th Harmonic (Friction, Urgency & Dynamic Drive)",
      divisionalOrder: "360° / 8",
    },
    {
      name: "Sesquiquadrate",
      angle: 135,
      orb: 2,
      nature: "challenging",
      symbol: "⚼",
      color: "#4ECDC4",
      interpretation:
        "Brings external obstacles and crises. Forces adjustments and teaches flexibility through unexpected challenges.",
      keywords: ["obstacles", "crisis", "adjustment", "flexibility", "recalibrating"],
      harmonicNumber: 8,
      harmonicFamily: "8th Harmonic (Friction, Urgency & Dynamic Drive)",
      divisionalOrder: "3 * (360° / 8)",
    },
    {
      name: "Quintile",
      angle: 72,
      orb: 1.5,
      nature: "harmonious",
      symbol: "Q",
      color: "#45B7D1",
      interpretation:
        "Indicates special talent and creativity. Shows where you have unique abilities and potential for excellence.",
      keywords: ["creativity", "talent", "specialization", "excellence", "artistry"],
      harmonicNumber: 5,
      harmonicFamily: "5th Harmonic (Creative Talent, Style & Innovation)",
      divisionalOrder: "360° / 5",
    },
    {
      name: "Biquintile",
      angle: 144,
      orb: 1.5,
      nature: "harmonious",
      symbol: "bQ",
      color: "#96CEB4",
      interpretation:
        "Represents creative manifestation and genius. Shows where you can materialize innovative ideas into physical or artistic form.",
      keywords: ["manifestation", "genius", "innovation", "materialization", "craft"],
      harmonicNumber: 5,
      harmonicFamily: "5th Harmonic (Creative Talent, Style & Innovation)",
      divisionalOrder: "2 * (360° / 5)",
    },
    {
      name: "Semisextile",
      angle: 30,
      orb: 1,
      nature: "neutral",
      symbol: "⚺",
      color: "#FFEAA7",
      interpretation:
        "Creates subtle adjustments and cooperation. Indicates areas requiring minor modifications for smooth functioning.",
      keywords: ["adjustment", "cooperation", "subtle", "modification", "bridge"],
      harmonicNumber: 12,
      harmonicFamily: "12th Harmonic (Adaptation, Growth & Integration)",
      divisionalOrder: "360° / 12",
    },
    {
      name: "Quincunx",
      angle: 150,
      orb: 2,
      nature: "challenging",
      symbol: "⚻",
      color: "#DDA0DD",
      interpretation:
        "Combines incongruent energies. Creates psychosomatic health themes and requires constant recalibration and compromise.",
      keywords: ["incongruent", "health", "readjustment", "imbalance", "blindspot"],
      harmonicNumber: 12,
      harmonicFamily: "12th Harmonic (Adaptation, Growth & Integration)",
      divisionalOrder: "5 * (360° / 12)",
    },
    {
      name: "Septile",
      angle: 51.43,
      orb: 1,
      nature: "spiritual",
      symbol: "Sep",
      color: "#98D8C8",
      interpretation:
        "Brings mystical and karmic influences. Channels non-rational insights, sacred compulsion, and spiritual awakenings.",
      keywords: ["mystical", "karmic", "spiritual", "non-rational", "destiny"],
      harmonicNumber: 7,
      harmonicFamily: "7th Harmonic (Karmic Inevitability & Spiritual Vision)",
      divisionalOrder: "360° / 7",
    },
    {
      name: "Novile",
      angle: 40,
      orb: 1,
      nature: "spiritual",
      symbol: "Nov",
      color: "#F7DC6F",
      interpretation:
        "Represents spiritual initiation and gestation. Indicates a period of inner soul development before outer fruition.",
      keywords: ["initiation", "gestation", "inner development", "emergence", "serenity"],
      harmonicNumber: 9,
      harmonicFamily: "9th Harmonic (Initiation, Fruition & Transcendence)",
      divisionalOrder: "360° / 9",
    },
    {
      name: "Decile",
      angle: 36,
      orb: 1,
      nature: "harmonious",
      symbol: "Dec",
      color: "#BB8FCE",
      interpretation:
        "Indicates minor creativity and organizational abilities. Harmonious, rhythmic flow in technical and structured areas.",
      keywords: ["creativity", "organization", "harmonious", "flow", "precision"],
      harmonicNumber: 10,
      harmonicFamily: "10th Harmonic (Architectural Precision & Applied Skill)",
      divisionalOrder: "360° / 10",
    },
  ];

  /**
   * Specific planet-pair interpretations for prominent minor aspect dynamics
   */
  private static readonly SPECIFIC_INTERPRETATIONS: Record<string, Record<string, string>> = {
    "Sun-Moon": {
      Semisquare:
        "Internal friction between conscious will and emotional needs. A persistent inner restlessness that drives you to continually outgrow your comfort zone and achieve personal milestones.",
      Sesquiquadrate:
        "Sharp disconnect between life direction and family or emotional conditioning. External crises compel you to balance personal autonomy with vulnerable emotional intimacy.",
      Quintile:
        "Unique creative talent in harmonizing your conscious identity with emotional intuition. An innate flair for storytelling, personal branding, and expressive warmth.",
      Biquintile:
        "Exceptional gift for manifesting emotional nuance into tangible creative works. You channel deep instinctual knowing into structured creative architecture.",
      Semisextile:
        "Subtle dialogue between ego and feelings. With minor conscious awareness, your instinctual reactions easily support your long-term creative ambitions.",
      Quincunx:
        "Chronic mismatch between what you want to achieve and what makes you feel secure. Overworking to escape vulnerability can trigger fatigue; learn to honor both work and rest.",
      Septile:
        "Fated, mystical alignment between soul purpose and emotional destiny. You experience inexplicable spiritual pulls toward specific life journeys.",
      Novile:
        "Spiritual gestation of identity. You experience tranquil inner revelations where emotional turmoil dissolves into enlightened self-acceptance.",
      Decile:
        "Graceful organizational instinct. You harmonize personal routines and emotional needs with effortless rhythm and quiet confidence.",
    },
    "Venus-Mars": {
      Semisquare:
        "Passionate tension between desire and attraction. Spices romantic life with high intensity and competitive friction; compels creative breakthroughs through emotional heat.",
      Sesquiquadrate:
        "Complex relationship adjustments. Romantic misunderstandings or timing mismatches force you to cultivate patience and emotional refinement.",
      Quintile:
        "Artistic virtuosity and charismatic magnetism. You possess a distinctive, stylized personal aesthetic and an innovative touch in romance and design.",
      Biquintile:
        "Genius in manifesting romantic and aesthetic ideals. You turn raw passionate drive into polished masterpieces, visual elegance, or seductive charm.",
      Semisextile:
        "Delicate harmony between desire and reception. Minor tweaks in communication allow passion to flow with grace and genuine tenderness.",
      Quincunx:
        "Awkward disconnect between sexual drive and romantic values. You may chase partners who cannot fulfill your heart, teaching you deep self-worth.",
      Septile:
        "Karmic romantic bonds and transcendent passion. Relationships often carry an uncanny sense of predestined spiritual encounter.",
      Novile:
        "Sacred tantric integration of the anima and animus. Inner peace achieved when romantic desire transforms into unconditional devotion.",
      Decile:
        "Refined craftsmanship in design, styling, and interpersonal negotiation. You blend assertiveness with charm with surgical precision.",
    },
    "Jupiter-Saturn": {
      Semisquare:
        "Frustration between optimistic expansion and cautious limitation. Fuels a tireless work ethic to prove that big visions can withstand rigorous reality.",
      Sesquiquadrate:
        "Institutional hurdles and societal friction. External economic or bureaucratic challenges force you to rebuild your long-term strategies with ironclad discipline.",
      Quintile:
        "Mastery in practical enterprise and organizational architecture. You know instinctively how to scale a business or system without sacrificing quality.",
      Biquintile:
        "Strategic genius in building lasting institutions. You manifest expansive philosophical visions into concrete, durable societal structures.",
      Semisextile:
        "Steady incremental progress. You smoothly alternate between taking prudent risks and consolidating your assets.",
      Quincunx:
        "Constant push-pull between boundless faith and skepticism. Demands regular realignment between your spiritual beliefs and worldly responsibilities.",
      Septile:
        "A fateful calling to reform social, legal, or philosophical paradigms. You sense historical responsibility guiding your long-range career decisions.",
      Novile:
        "Philosophical ripening and quiet maturity. Deep spiritual patience that realizes enduring legacies require silent incubation.",
      Decile:
        "Superb administrative and civic talent. Exceptional skill in governance, scheduling, resource management, and ethical policy design.",
    },
    "Sun-Saturn": {
      Semisquare:
        "Inner insecurity pushing you to achieve high worldly status. Early doubts about self-worth become the exact catalyst for extraordinary endurance.",
      Sesquiquadrate:
        "Clashes with authority figures or rigid bureaucracies. Teaches you that true sovereignty is earned through impeccable personal accountability.",
      Quintile:
        "Distinctive mastery in leadership, discipline, and temporal pacing. You command respect effortlessly through refined competence.",
      Biquintile:
        "Manifestation of monumental achievements. You turn abstract authority and long-range focus into tangible monuments of personal legacy.",
      Quincunx:
        "Tendency to shoulder undue burdens and guilt, risking physical strain. Requires learning to delegate and letting go of perfectionism.",
      Septile:
        "Karmic test of character and ancestral destiny. You carry a solemn spiritual assignment to break generational cycles of hardship.",
    },
    "Moon-Saturn": {
      Semisquare:
        "Emotional restraint and self-reliance born from early duties. Builds supreme emotional grit and unflappable calmness in high-stakes crises.",
      Sesquiquadrate:
        "Recurring family obligations and emotional bottlenecks. Compels you to establish clear emotional boundaries without turning cold.",
      Quintile:
        "Aesthetic gift for minimalism and emotional containment. You bring structural elegance and serene depth to chaotic environments.",
      Quincunx:
        "Subconscious guilt when seeking emotional comfort. Requires retraining your nervous system to accept love without feeling you must work for it.",
    },
    "Mercury-Uranus": {
      Semisquare:
        "Restless, hyper-accelerated nervous system. Lightning-quick intellect that generates flashes of brilliance alongside mental agitation.",
      Sesquiquadrate:
        "Unconventional opinions colliding with mainstream expectations. Prompts you to articulate disruptive ideas with greater diplomatic craft.",
      Quintile:
        "Inventive intellectual genius. A natural aptitude for coding, astrology, physics, speculative technology, and revolutionary design.",
      Biquintile:
        "Translating futuristic insights into operational inventions. You bridge cutting-edge theory with working real-world systems.",
      Quincunx:
        "Erratic bursts of mental energy causing cognitive burnout. Balance brilliant leaps with rhythmic sensory grounding and digital detox.",
      Septile:
        "Inexplicable telepathic flashes and prophetic insights. You download revolutionary concepts from the collective unconscious.",
    },
    "Mars-Pluto": {
      Semisquare:
        "Volcanic willpower and ferocious determination. Unyielding refusal to be dominated; produces phenomenal stamina when fighting for a cause.",
      Sesquiquadrate:
        "High-stakes power struggles and catalytic confrontations. Teaches you how to navigate intense hostility without resorting to scorched-earth tactics.",
      Quintile:
        "Surgical precision in power dynamics, martial arts, surgery, or deep investigative strategy. A psychological master of leverage.",
      Biquintile:
        "Total transformative manifestation. You can take ruined or abandoned projects and resurrect them into unstoppable powerhouses.",
      Quincunx:
        "Repressed resentment that can erupt in sudden conflicts or somatic tension. Healthy channels for intense primal energy are essential.",
      Septile:
        "Spiritual warfare and profound karmic clearing. You are tasked with transmuting collective shadow energy into radiant spiritual strength.",
    },
    "Venus-Neptune": {
      Semisquare:
        "Romantic disillusionment that sparks profound spiritual longing. Yearning for divine perfection leads to transcendent artistic expression.",
      Quintile:
        "Poetic, ethereal creative genius. You capture otherworldly beauty, cinematic mood, and sublime tenderness in music, poetry, or visual art.",
      Biquintile:
        "Materializing divine visions into breathtaking aesthetic creations. An ability to enchant audiences and evoke universal empathy.",
      Quincunx:
        "Fuzzy boundaries in relationships; falling for rescue projects or projection. Teaches you to love unconditionally while keeping practical boundaries.",
      Septile:
        "Mystical soulmate connections and transcendent devotional love. Love experienced as a sacred portal to the divine.",
    },
    "Sun-Jupiter": {
      Semisquare:
        "Restless ambition and tendency to over-promise. Forces you to anchor grand visions with rigorous execution.",
      Quintile:
        "A natural philosopher and inspiring mentor. Exceptional talent in storytelling, humor, higher education, and motivational leadership.",
      Biquintile:
        "Manifestation of abundant opportunities. You turn broad cultural wisdom into practical enterprises and philanthropic ventures.",
      Novile:
        "Spiritual serenity and profound cosmic optimism. An inner fountain of grace that uplifts everyone in your orbit.",
    },
  };

  /**
   * Calculate shortest angular distance on the 360° circle (0° to 180°)
   */
  public calculateAngle(p1: PlanetPosition, p2: PlanetPosition): number {
    let diff = Math.abs(p1.longitude - p2.longitude);
    if (diff > 180) diff = 360 - diff;
    return Math.round(diff * 1000) / 1000;
  }

  /**
   * Determine whether the aspect orb is closing or widening from the supplied
   * instantaneous longitude speeds (degrees per day).
   *
   * No average-speed fallback is used: zero is a real stationary speed, while
   * a missing/non-finite speed means phase cannot be established. The sign of
   * the shortest-arc separation derivative gives the instantaneous direction,
   * avoiding a finite forward projection that could jump over exactitude.
   */
  public isAspectApplying(
    p1: PlanetPosition,
    p2: PlanetPosition,
    targetAngle: number
  ): boolean | null {
    if (
      !Number.isFinite(p1.longitude) ||
      !Number.isFinite(p2.longitude) ||
      !Number.isFinite(targetAngle) ||
      typeof p1.speed !== "number" ||
      typeof p2.speed !== "number" ||
      !Number.isFinite(p1.speed) ||
      !Number.isFinite(p2.speed)
    ) {
      return null;
    }

    const relativeSpeed = p2.speed - p1.speed;
    if (Math.abs(relativeSpeed) < 1e-12) return null;

    const directedDifference = ((p2.longitude - p1.longitude) % 360 + 360) % 360;
    const currentAngle = Math.min(directedDifference, 360 - directedDifference);
    const offsetFromAspect = currentAngle - targetAngle;

    // At exactitude, a non-stationary pair is leaving the exact aspect.
    if (Math.abs(offsetFromAspect) < 1e-12) return false;

    // Derivative of shortest angular separation. At 0°/180° the distance
    // function has a cusp, so use its correct one-sided derivative.
    const separationRate = directedDifference === 0
      ? Math.abs(relativeSpeed)
      : directedDifference === 180
        ? -Math.abs(relativeSpeed)
        : directedDifference < 180
          ? relativeSpeed
          : -relativeSpeed;

    // The absolute orb is |separation - targetAngle|.
    const orbRate = Math.sign(offsetFromAspect) * separationRate;
    return orbRate < 0;
  }

  /**
   * Calculate normalized strength score from 0.0 to 1.0 based on orb tightness
   */
  public calculateStrength(orb: number, maxOrb: number): number {
    if (maxOrb <= 0) return 0;
    const ratio = Math.max(0, Math.min(1, orb / maxOrb));
    // Non-linear curve prioritizing very tight exact aspects (< 0.5°)
    return Math.round((1 - Math.pow(ratio, 1.25)) * 100) / 100;
  }

  /**
   * Calculate all minor aspects across planets in the chart
   */
  public calculateMinorAspects(
    planets: PlanetPosition[],
    settings: AspectSettings = DEFAULT_ASPECT_SETTINGS
  ): MinorAspect[] {
    if (!settings.useMinorAspects || !planets || planets.length < 2) {
      return [];
    }

    const aspects: MinorAspect[] = [];
    const orbMultiplier = settings.minorOrbMultiplier || 1.0;

    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const p1 = planets[i];
        const p2 = planets[j];

        // Skip Lunar Nodes opposing each other
        if (
          (p1.id === "NorthNode" && p2.id === "SouthNode") ||
          (p1.id === "SouthNode" && p2.id === "NorthNode")
        ) {
          continue;
        }

        const angle = this.calculateAngle(p1, p2);

        for (const aspectDef of MinorAspectsEngine.MINOR_ASPECTS) {
          // If specific aspect types are filtered
          if (settings.aspectTypes && settings.aspectTypes.length > 0) {
            if (!settings.aspectTypes.includes(aspectDef.name)) continue;
          }

          // If nature filter is set
          if (settings.filterNature && settings.filterNature !== "all") {
            if (aspectDef.nature !== settings.filterNature) continue;
          }

          const maxAllowedOrb = aspectDef.orb * orbMultiplier;
          const orb = Math.abs(angle - aspectDef.angle);

          if (orb <= maxAllowedOrb) {
            const strength = this.calculateStrength(orb, maxAllowedOrb);

            // Filter out weak aspects unless user requested them
            if (!settings.showWeakAspects && strength < 0.25) {
              continue;
            }

            const applying = this.isAspectApplying(p1, p2, aspectDef.angle);
            const interpretation = this.getDetailedInterpretation(p1, p2, aspectDef);

            aspects.push({
              planet1: p1.name,
              planet2: p2.name,
              planet1Symbol: p1.symbol || "✦",
              planet2Symbol: p2.symbol || "✦",
              aspectType: aspectDef,
              angle: Math.round(angle * 100) / 100,
              orb: Math.round(orb * 100) / 100,
              maxOrb: Math.round(maxAllowedOrb * 100) / 100,
              strength,
              applying,
              interpretation,
              keywords: aspectDef.keywords,
              harmonicFamily: aspectDef.harmonicFamily,
            });
          }
        }
      }
    }

    // Sort by strength descending (tightest orbs first)
    return aspects.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Provide comprehensive psychological and esoteric interpretations
   */
  public getDetailedInterpretation(
    planet1: PlanetPosition,
    planet2: PlanetPosition,
    aspectType: AspectDefinition
  ): string {
    const p1 = planet1.name;
    const p2 = planet2.name;

    // Check direct combination: P1-P2
    const key1 = `${p1}-${p2}`;
    if (
      MinorAspectsEngine.SPECIFIC_INTERPRETATIONS[key1] &&
      MinorAspectsEngine.SPECIFIC_INTERPRETATIONS[key1][aspectType.name]
    ) {
      return MinorAspectsEngine.SPECIFIC_INTERPRETATIONS[key1][aspectType.name];
    }

    // Check inverse combination: P2-P1
    const key2 = `${p2}-${p1}`;
    if (
      MinorAspectsEngine.SPECIFIC_INTERPRETATIONS[key2] &&
      MinorAspectsEngine.SPECIFIC_INTERPRETATIONS[key2][aspectType.name]
    ) {
      return MinorAspectsEngine.SPECIFIC_INTERPRETATIONS[key2][aspectType.name];
    }

    // Contextual Synthesis Engine
    const p1Role = this.getPlanetPrinciple(p1);
    const p2Role = this.getPlanetPrinciple(p2);

    switch (aspectType.name) {
      case "Semisquare":
        return `Internal tension between ${p1Role} and ${p2Role}. Creates restless creative friction and prompts you to actively conquer self-doubt through decisive adjustments.`;
      case "Sesquiquadrate":
        return `Outer friction and recurring stumbling blocks connecting ${p1Role} with ${p2Role}. Teaches patience, strategic maturity, and practical resilience in the face of sudden surprises.`;
      case "Quintile":
        return `Distinctive creative gift linking ${p1Role} and ${p2Role}. Endows you with an ingenious, highly individualized approach to problem-solving, aesthetic design, or intellectual synthesis.`;
      case "Biquintile":
        return `Exceptional capacity to materialize ${p1Role} and ${p2Role} into tangible real-world results. You turn visionary concepts into masterfully structured systems or artworks.`;
      case "Semisextile":
        return `Subtle adjacent resonance between ${p1Role} and ${p2Role}. Encourages conscious bridging between different facets of your life, rewarding small, consistent daily refinements.`;
      case "Quincunx":
        return `Incongruent dynamics between ${p1Role} and ${p2Role}. Operating on different wavelengths, they require regular conscious balancing to prevent physical fatigue or psychological strain.`;
      case "Septile":
        return `Sacred, fated karmic link between ${p1Role} and ${p2Role}. You experience deep, non-rational spiritual callings and mysterious synchronistic encounters around these themes.`;
      case "Novile":
        return `Spiritual gestation and inner soul integration of ${p1Role} and ${p2Role}. Points to a quiet inner sanctum where peaceful understanding and transcendental wisdom mature over time.`;
      case "Decile":
        return `Precise craftsmanship and organizational alignment of ${p1Role} with ${p2Role}. Provides effortless flow in structured, technical, and analytical endeavors.`;
      default:
        return `${p1} ${aspectType.name} ${p2} (${aspectType.angle}°): ${aspectType.interpretation}`;
    }
  }

  /**
   * Helper returning core psychological principles for planets
   */
  private getPlanetPrinciple(name: string): string {
    const principles: Record<string, string> = {
      Sun: "vital self-expression and core purpose",
      Moon: "instinctive emotional security and intuitive sanctuary",
      Mercury: "cognitive processing, analytical thought and communication",
      Venus: "aesthetic values, relational harmony and attraction",
      Mars: "initiating drive, courage and assertive action",
      Jupiter: "philosophical expansion, optimism and quest for truth",
      Saturn: "discipline, structural reality and long-term mastery",
      Uranus: "innovative breakthroughs, originality and liberation",
      Neptune: "transcendent imagination, empathy and spiritual ideals",
      Pluto: "catalytic transformation, psychological depth and primal power",
      Chiron: "healing wisdom and sacred vulnerability",
      NorthNode: "evolutionary growth path and future destiny",
      SouthNode: "inherited past conditioning and innate familiarity",
      Ascendant: "physical persona, vitality and outer horizon",
      Midheaven: "public vocation, legacy and worldly reputation",
    };
    return principles[name] || `${name.toLowerCase()} vibration`;
  }

  /**
   * Group aspects by harmonic family (5th, 7th, 8th, 9th, 10th, 12th)
   */
  public getHarmonicBreakdown(aspects: MinorAspect[]): HarmonicBreakdown[] {
    const families: Record<
      number,
      { familyName: string; meaning: string; aspects: MinorAspect[] }
    > = {
      5: {
        familyName: "5th Harmonic (Quintiles & Biquintiles)",
        meaning: "Special talent, individual style, creative play, and unique brilliance.",
        aspects: [],
      },
      7: {
        familyName: "7th Harmonic (Septiles)",
        meaning: "Karmic destiny, spiritual vision, sacred compulsion, and transcendental insight.",
        aspects: [],
      },
      8: {
        familyName: "8th Harmonic (Semisquares & Sesquiquadrates)",
        meaning: "Urgent friction, internal agitation, crisis resolution, and ambition.",
        aspects: [],
      },
      9: {
        familyName: "9th Harmonic (Noviles)",
        meaning: "Spiritual fruition, initiation, peaceful gestation, and soul completion.",
        aspects: [],
      },
      10: {
        familyName: "10th Harmonic (Deciles)",
        meaning: "Technical craft, organizational elegance, and precise execution.",
        aspects: [],
      },
      12: {
        familyName: "12th Harmonic (Semisextiles & Quincunxes)",
        meaning: "Subtle adaptation, psychosomatic health, recalibration, and integration.",
        aspects: [],
      },
    };

    aspects.forEach((asp) => {
      const hNum = asp.aspectType.harmonicNumber;
      if (families[hNum]) {
        families[hNum].aspects.push(asp);
      }
    });

    return Object.entries(families)
      .map(([num, data]) => ({
        harmonicNumber: parseInt(num, 10),
        familyName: data.familyName,
        meaning: data.meaning,
        count: data.aspects.length,
        aspects: data.aspects,
      }))
      .filter((group) => group.count > 0)
      .sort((a, b) => b.count - a.count);
  }
}
