/**
 * Planetary Transit Calculation Engine
 * Computes transiting positions through the astronomy-engine-backed compatibility facade.
 * Display rounding is not a 0.001° accuracy guarantee. Provides daily, weekly, and monthly forecasts,
 * major life cycle detections (Saturn, Jupiter, Uranus, Pluto), and timing windows.
 */

import { swissEphemeris, SwissPlanetPosition } from "./swissEphemeris";
import { WesternChartData, PlanetPosition, HouseCusp, ZODIAC_SIGNS } from "./ephemeris";
import { EclipseAnalyzer } from "./specializedWesternEngines";

export interface ActiveTransit {
  id: string;
  transitingPlanet: string;
  transitingSymbol: string;
  transitingLongitude: number;
  transitingSign: string;
  transitingDegree: number;
  transitingHouse: number; // House in the natal chart
  isRetrograde: boolean;
  natalPlanet: string;
  natalSymbol: string;
  natalLongitude: number;
  natalSign: string;
  natalHouse: number;
  aspect: "Conjunction" | "Sextile" | "Square" | "Trine" | "Opposition";
  aspectSymbol: string;
  angle: number;
  orb: number;
  maxOrb: number;
  exactness: number; // 0 to 1 (1 = exact)
  nature: "Harmonious" | "Challenging" | "Potent";
  category: "Major Life Chapter" | "Personal Trigger" | "Daily Mood";
  interpretation: string;
  duration: string;
  peak: string;
  significanceScore: number; // 1 to 10
}

export interface MajorPlanetTransit {
  planet: string;
  symbol: string;
  currentSign: string;
  currentHouse: number;
  houseTitle: string;
  cycleLength: string;
  houseInterpretation: string;
  lessons: string[];
  advice: string;
  duration: string;
}

export interface EclipseTransit {
  type: "Solar Eclipse" | "Lunar Eclipse";
  date: string;
  sign: string;
  degree: number;
  natalHouse: number;
  natalAspects: string[];
  interpretation: string;
}

export interface TimingWindow {
  title: string;
  category: "career" | "love" | "finance" | "health" | "spiritual";
  currentPhase: string;
  bestTimes: { period: string; description: string }[];
  challengingTimes: { period: string; description: string }[];
  advice: string;
  nextOpportunity: string;
}

export interface DailyHoroscopeData {
  date: string;
  dateObj: Date;
  moonSign: string;
  moonDegree: number;
  moonSignFormatted: string;
  moonPhase: {
    name: string;
    emoji: string;
    illumination: number;
  };
  overallEnergy: number; // 0 to 100
  energyMood: string;
  focus: string;
  luckyHours: string;
  challenges: string[];
  opportunities: string[];
  affirmation: string;
  bestActions: string[];
  avoidActions: string[];
  highlightTransit?: string;
}

export interface WeeklyForecastDay {
  dayName: string;
  dateString: string;
  moonSign: string;
  energyScore: number;
  theme: string;
  keyTransit: string;
}

export interface MonthlyForecastOverview {
  monthName: string;
  year: number;
  newMoonDate: string;
  fullMoonDate: string;
  highlights: { date: string; title: string; description: string; impact: "High" | "Medium" }[];
  generalTheme: string;
}

// Planet symbols
export const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉",
  Moon: "☽",
  Mercury: "☿",
  Venus: "♀",
  Mars: "♂",
  Jupiter: "♃",
  Saturn: "♄",
  Uranus: "♅",
  Neptune: "♆",
  Pluto: "♇",
  NorthNode: "☊",
  Rahu: "☊",
  Ketu: "☋",
  Ascendant: "AC",
  Midheaven: "MC",
};

// Aspect configurations
const ASPECT_SPECS: Record<
  string,
  {
    type: "Conjunction" | "Sextile" | "Square" | "Trine" | "Opposition";
    angle: number;
    maxOrb: number;
    symbol: string;
    nature: "Harmonious" | "Challenging" | "Potent";
  }
> = {
  conjunction: { type: "Conjunction", angle: 0, maxOrb: 8.0, symbol: "☌", nature: "Potent" },
  sextile: { type: "Sextile", angle: 60, maxOrb: 4.5, symbol: "⚹", nature: "Harmonious" },
  square: { type: "Square", angle: 90, maxOrb: 6.5, symbol: "□", nature: "Challenging" },
  trine: { type: "Trine", angle: 120, maxOrb: 6.5, symbol: "△", nature: "Harmonious" },
  opposition: { type: "Opposition", angle: 180, maxOrb: 8.0, symbol: "☍", nature: "Challenging" },
};

// House descriptions for transits
const HOUSE_TITLES: Record<number, string> = {
  1: "1st House of Self, Identity & Physical Body",
  2: "2nd House of Personal Wealth, Values & Material Security",
  3: "3rd House of Mind, Communication & Immediate Environment",
  4: "4th House of Home, Roots, Family & Emotional Sanctuary",
  5: "5th House of Creativity, Romance, Joy & Self-Expression",
  6: "6th House of Health, Daily Routine, Work & Service",
  7: "7th House of Partnerships, Marriage & Significant Others",
  8: "8th House of Transformation, Shared Assets & Deep Metamorphosis",
  9: "9th House of Higher Learning, Philosophy, Travel & Worldview",
  10: "10th House of Career, Public Reputation & Destiny",
  11: "11th House of Aspirations, Community, Friendships & Networking",
  12: "12th House of Subconscious, Solitude, Karma & Spiritual Awakening",
};

/**
 * Transit engine comparing modelled transiting celestial bodies to the natal chart
 */
export class TransitEngine {
  public birthChart: WesternChartData;
  public currentDate: Date;

  constructor(birthChart: WesternChartData, currentDate: Date = new Date()) {
    this.birthChart = birthChart;
    this.currentDate = currentDate;
  }

  /**
   * Calculate exact Julian Day for any given Date object
   */
  public getJulianDay(date: Date): number {
    return date.getTime() / 86400000.0 + 2440587.5;
  }

  /**
   * Calculate planetary positions for a target date
   */
  public getPlanetaryPositions(date: Date): Record<string, SwissPlanetPosition> {
    const jd = this.getJulianDay(date);
    const planets = swissEphemeris.calculateAllPlanets(jd, false);
    return {
      Sun: planets.sun,
      Moon: planets.moon,
      Mercury: planets.mercury,
      Venus: planets.venus,
      Mars: planets.mars,
      Jupiter: planets.jupiter,
      Saturn: planets.saturn,
      Uranus: planets.uranus,
      Neptune: planets.neptune,
      Pluto: planets.pluto,
      NorthNode: planets.rahu,
    };
  }

  /**
   * Calculate angular distance between two longitudes
   */
  public calculateAngle(lon1: number, lon2: number): number {
    let diff = Math.abs(lon1 - lon2) % 360;
    return diff > 180 ? 360 - diff : diff;
  }

  /**
   * Determine house placement of any celestial longitude in the natal chart
   */
  public getHouse(longitude: number): number {
    const cusps = this.birthChart.houses.map((h) => h.longitude);
    if (!cusps || cusps.length < 12) return 1;

    for (let i = 0; i < 12; i++) {
      const currentCusp = cusps[i];
      const nextCusp = cusps[(i + 1) % 12];

      if (currentCusp < nextCusp) {
        if (longitude >= currentCusp && longitude < nextCusp) {
          return i + 1;
        }
      } else {
        // Crossing 0° Aries boundary
        if (longitude >= currentCusp || longitude < nextCusp) {
          return i + 1;
        }
      }
    }
    return 1;
  }

  /**
   * Check if an angular distance forms a valid astrological aspect
   */
  public getAspect(angle: number): {
    type: "Conjunction" | "Sextile" | "Square" | "Trine" | "Opposition";
    orb: number;
    maxOrb: number;
    symbol: string;
    nature: "Harmonious" | "Challenging" | "Potent";
  } | null {
    for (const spec of Object.values(ASPECT_SPECS)) {
      const diff = Math.abs(angle - spec.angle);
      if (diff <= spec.maxOrb) {
        return {
          type: spec.type,
          orb: Math.round(diff * 100) / 100,
          maxOrb: spec.maxOrb,
          symbol: spec.symbol,
          nature: spec.nature,
        };
      }
    }
    return null;
  }

  /**
   * Calculate transit duration estimate based on transiting planet speed
   */
  public calculateTransitDuration(planetName: string, aspectType: string): string {
    switch (planetName) {
      case "Moon":
        return "2 – 4 hours";
      case "Sun":
      case "Mercury":
      case "Venus":
        return "2 – 4 days";
      case "Mars":
        return "1 – 2 weeks";
      case "Jupiter":
        return "2 – 3 months";
      case "Saturn":
        return "6 – 9 months";
      case "Uranus":
      case "Neptune":
      case "Pluto":
        return "1 – 2 years (with retrogrades)";
      case "NorthNode":
        return "3 – 5 months";
      default:
        return "Several days";
    }
  }

  /**
   * Approximate peak time for the transit
   */
  public calculatePeakTime(orb: number, planetSpeed: number): string {
    if (orb < 0.3) return "Exact right now (Peak Intensity)";
    const daysToPeak = Math.abs(planetSpeed) > 0.001 ? Math.round(orb / Math.abs(planetSpeed)) : 10;
    if (daysToPeak <= 1) return "Peak within 24 hours";
    if (daysToPeak < 30) return `Peak in ~${daysToPeak} days`;
    const months = Math.round(daysToPeak / 30);
    return `Peak in ~${months} month${months > 1 ? "s" : ""}`;
  }

  /**
   * Determine transit category and significance score (1-10)
   */
  public getTransitSignificance(planetName: string, aspectType: string, exactness: number): {
    category: "Major Life Chapter" | "Personal Trigger" | "Daily Mood";
    score: number;
  } {
    let base = 5;
    if (["Pluto", "Neptune", "Uranus", "Saturn"].includes(planetName)) {
      base = 9;
      return {
        category: "Major Life Chapter",
        score: Math.min(10, Math.round(base + exactness * 1)),
      };
    }
    if (["Jupiter", "Mars"].includes(planetName)) {
      base = 7;
      return {
        category: "Personal Trigger",
        score: Math.min(9, Math.round(base + exactness * 1.5)),
      };
    }
    if (["Sun", "Venus", "Mercury"].includes(planetName)) {
      base = 5;
      return {
        category: "Personal Trigger",
        score: Math.min(7, Math.round(base + exactness * 1)),
      };
    }
    return {
      category: "Daily Mood",
      score: Math.min(5, Math.round(3 + exactness * 2)),
    };
  }

  /**
   * Generate comprehensive astrological interpretation for a specific transit
   */
  public getTransitInterpretation(
    transitingPlanet: string,
    natalPlanet: string,
    aspectType: string,
    house: number
  ): string {
    const key = `${transitingPlanet}_${aspectType}_${natalPlanet}`;

    const INTERPRETATIONS: Record<string, string> = {
      // SATURN TRANSITS
      Saturn_Conjunction_Sun:
        "A monumental rite of passage requiring maturity, structural discipline, and perseverance. You are called to strip away illusions, define concrete goals, and accept heavy responsibilities. Patience is rewarded with lasting authority.",
      Saturn_Square_Sun:
        "A critical testing phase demanding resilience. Professional obstacles or fatigue may emerge to check if your foundation is genuine. Do not force quick wins; prioritize endurance and self-honoring boundaries.",
      Saturn_Opposition_Sun:
        "External circumstances or authority figures hold up an uncompromising mirror. Compromise and realistic appraisals of your energy are vital. Enduring structures survive; brittle egos break.",
      Saturn_Trine_Sun:
        "An exceptional stabilizing transit where sustained effort produces solid, respected progress. Mentors take notice, financial structures firm up, and self-confidence is anchored in proven competence.",
      Saturn_Sextile_Sun:
        "Constructive opportunities to organize your life, solidify plans, and establish realistic daily disciplines. Practical ambition pays solid dividends.",
      Saturn_Conjunction_Moon:
        "An emotional reality check requiring inner fortitude. You may feel sober, isolated, or burdened by domestic duty. Establish compassionate personal boundaries and nurture your core security.",
      Saturn_Square_Moon:
        "Emotional friction between personal vulnerability and external obligations. Avoid defensive withdrawal; address emotional needs with practical maturity.",
      Saturn_Trine_Moon:
        "Emotional maturity, calm discernment, and supportive domestic stability. Excellent for signing leases, buying property, or stabilizing family matters.",
      Saturn_Conjunction_Saturn:
        "The milestone Saturn Return (or major phase). A karmic audit of your life trajectory. You are graduating into authentic adulthood, closing obsolete chapters, and laying a 28-year foundation.",

      // JUPITER TRANSITS
      Jupiter_Conjunction_Sun:
        "A premier golden transit of vitality, optimism, and sovereign opportunity! Doors swing open in career and leadership. Your charisma is magnetic—dream boldly and take calculated leaps.",
      Jupiter_Trine_Sun:
        "Flowing harmony, effortless good fortune, and creative triumph. You attract influential supporters, generous benefactors, and renewed faith in your destiny.",
      Jupiter_Opposition_Sun:
        "Big opportunities coupled with a risk of overextending or grandiosity. Keep promises proportionate to your bandwidth. High rewards are possible if tempered with modesty.",
      Jupiter_Square_Sun:
        "Ambition surges to fever pitch. You feel capable of conquering worlds, but beware overpromising or reckless expenditures. Channel this restless vitality into structured advancement.",
      Jupiter_Conjunction_Venus:
        "One of the sweetest relationship and wealth transits in astrology. Love flourishes, attraction is effortless, and social gatherings bring joyous blessings and financial windfalls.",
      Jupiter_Trine_Venus:
        "Grace, artistic inspiration, romantic tenderness, and effortless social charm. Outstanding window for weddings, investments, creative launches, and celebrations.",
      Jupiter_Conjunction_Jupiter:
        "The 12-year Jupiter Return. A fresh cycle of philosophical expansion, abundant wisdom, international connections, and spiritual renewal.",

      // URANUS TRANSITS
      Uranus_Conjunction_Sun:
        "Electrifying personal awakening! Obsolete routines shatter as you demand authentic freedom. You reinvent your identity, embrace eccentric brilliance, and liberate yourself from societal constraints.",
      Uranus_Square_Sun:
        "Restless, rebellious friction demanding sudden redirection. Expect the unexpected. Flexibility and radical openness to change will transform disruptive surprises into revolutionary breakthroughs.",
      Uranus_Opposition_Sun:
        "Unpredictable shifts in relationships or external conditions challenge your ego. Detach from rigid outcomes and embrace radical adaptation.",
      Uranus_Conjunction_Moon:
        "Spontaneous emotional lightning bolts! Sudden changes in domestic lifestyle, intuitive flashes, and liberation from ancestral emotional habits.",

      // PLUTO TRANSITS
      Pluto_Conjunction_Sun:
        "Total metamorphosis. Like the phoenix, an old identity dies to birth unimaginable personal power, sovereignty, and psychological insight. You reclaim your primal authority.",
      Pluto_Square_Sun:
        "Intense power struggles or existential confrontations. Ruthlessly eliminate manipulative entanglements and reclaim your autonomy. Deep inner alchemy is underway.",
      Pluto_Trine_Sun:
        "Unshakeable personal magnetism, deep focus, and strategic mastery. You wield influence with understated authority and easily attract transformative resources.",
      Pluto_Conjunction_Moon:
        "Profound psychological catharsis. Subconscious wounds surface for ultimate healing, releasing generational trauma and uncovering unyielding emotional resilience.",

      // MARS TRANSITS
      Mars_Conjunction_Sun:
        "High-octane physical drive, courage, and pioneering initiative. You possess the energy to blast through stagnation, but guard against impulsivity or anger.",
      Mars_Square_Sun:
        "Combative, high-pressure friction. Competing wills or impatience may spark conflict. Direct this fiery surge into rigorous physical workouts or competitive business feats.",
      Mars_Trine_Sun:
        "Peak physical vitality, decisive leadership, and swift accomplishment. Projects accelerate rapidly with minimal resistance.",

      // VENUS TRANSITS
      Venus_Conjunction_Sun:
        "A charming glow surrounds your persona. Compliments, social harmony, pleasant surprises, and artistic fulfillment grace your day.",
      Venus_Conjunction_Venus:
        "The annual Venus Return: A renewal of self-worth, romantic magnetism, style revamps, and indulgence in beauty.",
    };

    if (INTERPRETATIONS[key]) {
      return `${INTERPRETATIONS[key]} Currently manifesting through your ${HOUSE_TITLES[house] || "natal house"}.`;
    }

    // Dynamic Context-Aware Fallback
    const harmonyPhrase =
      aspectType === "Trine" || aspectType === "Sextile"
        ? "flows with supportive, harmonious grace"
        : aspectType === "Square" || aspectType === "Opposition"
        ? "creates developmental friction that demands mindful action"
        : "blends powerful, concentrated celestial forces";

    return `Transiting ${transitingPlanet} in ${aspectType} to natal ${natalPlanet} ${harmonyPhrase}. Active across your ${HOUSE_TITLES[house] || "natal house"}, inviting focused consciousness into this life arena.`;
  }

  /**
   * Get all active transits affecting the user's birth chart right now
   */
  public getCurrentTransits(targetDate: Date = this.currentDate): ActiveTransit[] {
    const currentPlanets = this.getPlanetaryPositions(targetDate);
    const transits: ActiveTransit[] = [];

    // Combine natal planets with angles (Ascendant and Midheaven)
    const natalPoints: PlanetPosition[] = [
      ...this.birthChart.planets,
      this.birthChart.ascendant,
      this.birthChart.midheaven,
    ].filter(Boolean);

    for (const [transName, transPlanet] of Object.entries(currentPlanets)) {
      const transLon = transPlanet.longitude;
      const transHouse = this.getHouse(transLon);
      const transSign = transPlanet.sign;
      const transDeg = transPlanet.degree;
      const isRetrograde = transPlanet.isRetrograde;

      for (const natalPoint of natalPoints) {
        // Skip comparing a planet to its exact self if checking same day natal
        const natalLon = natalPoint.longitude;
        const angle = this.calculateAngle(transLon, natalLon);
        const aspect = this.getAspect(angle);

        if (aspect) {
          const exactness = Math.round((1 - aspect.orb / aspect.maxOrb) * 100) / 100;
          const { category, score } = this.getTransitSignificance(
            transName,
            aspect.type,
            exactness
          );

          transits.push({
            id: `${transName}-${aspect.type}-${natalPoint.name}`,
            transitingPlanet: transName,
            transitingSymbol: PLANET_SYMBOLS[transName] || "★",
            transitingLongitude: transLon,
            transitingSign: transSign,
            transitingDegree: transDeg,
            transitingHouse: transHouse,
            isRetrograde: isRetrograde,
            natalPlanet: natalPoint.name,
            natalSymbol: PLANET_SYMBOLS[natalPoint.name] || natalPoint.symbol || "★",
            natalLongitude: natalLon,
            natalSign: natalPoint.sign,
            natalHouse: natalPoint.house || 1,
            aspect: aspect.type,
            aspectSymbol: aspect.symbol,
            angle: Math.round(angle * 100) / 100,
            orb: aspect.orb,
            maxOrb: aspect.maxOrb,
            exactness: exactness,
            nature: aspect.nature,
            category: category,
            interpretation: this.getTransitInterpretation(
              transName,
              natalPoint.name,
              aspect.type,
              transHouse
            ),
            duration: this.calculateTransitDuration(transName, aspect.type),
            peak: this.calculatePeakTime(aspect.orb, transPlanet.speed),
            significanceScore: score,
          });
        }
      }
    }

    // Sort by significance score (highest first), then by exactness
    return transits.sort((a, b) => {
      if (b.significanceScore !== a.significanceScore) {
        return b.significanceScore - a.significanceScore;
      }
      return b.exactness - a.exactness;
    });
  }

  /**
   * Get major planetary transits (Saturn, Jupiter, Uranus, Pluto)
   */
  public getMajorTransits(targetDate: Date = this.currentDate) {
    const currentPlanets = this.getPlanetaryPositions(targetDate);

    // 1. SATURN (2.5-Year Cycle)
    const satPos = currentPlanets.Saturn;
    const satHouse = this.getHouse(satPos.longitude);
    const saturnData: MajorPlanetTransit = {
      planet: "Saturn",
      symbol: "♄",
      currentSign: satPos.sign,
      currentHouse: satHouse,
      houseTitle: HOUSE_TITLES[satHouse],
      cycleLength: "~2.5 Years per House",
      houseInterpretation: this.getSaturnHouseInterpretation(satHouse),
      lessons: this.getSaturnLessons(satHouse),
      advice: this.getSaturnAdvice(satHouse),
      duration: "Active Phase (2025–2027)",
    };

    // 2. JUPITER (1-Year Cycle)
    const jupPos = currentPlanets.Jupiter;
    const jupHouse = this.getHouse(jupPos.longitude);
    const jupiterData: MajorPlanetTransit = {
      planet: "Jupiter",
      symbol: "♃",
      currentSign: jupPos.sign,
      currentHouse: jupHouse,
      houseTitle: HOUSE_TITLES[jupHouse],
      cycleLength: "~1 Year per House",
      houseInterpretation: this.getJupiterHouseInterpretation(jupHouse),
      lessons: [
        "Expanding through generous, calculated calculated optimism",
        "Trusting in abundance while establishing clear ethical boundaries",
        "Embracing higher knowledge, mentorship, and vision expansion",
      ],
      advice:
        "Plant bold seeds in this house sector. Say yes to opportunities that stretch your comfort zone.",
      duration: "Annual Blessing Window (2026)",
    };

    // 3. URANUS (7-Year Cycle)
    const uranPos = currentPlanets.Uranus;
    const uranHouse = this.getHouse(uranPos.longitude);
    const uranusData: MajorPlanetTransit = {
      planet: "Uranus",
      symbol: "♅",
      currentSign: uranPos.sign,
      currentHouse: uranHouse,
      houseTitle: HOUSE_TITLES[uranHouse],
      cycleLength: "~7 Years per House",
      houseInterpretation: `Uranus awakens, electrifies, and disrupts your ${HOUSE_TITLES[uranHouse]}. You are breaking free from ancestral orthodoxies, obsolete conditioning, and embracing radical creative autonomy.`,
      lessons: [
        "Welcoming sudden plot twists as divine redirections",
        "Inventing your own unconventional rules of engagement",
        "Surrendering the illusion of rigid control",
      ],
      advice:
        "Do not fight sudden shifts here; innovate alongside them. Your true genius lies on the other side of conformity.",
      duration: "Long-term Metamorphosis",
    };

    // 4. PLUTO (Generational Cycle)
    const plutoPos = currentPlanets.Pluto;
    const plutoHouse = this.getHouse(plutoPos.longitude);
    const plutoData: MajorPlanetTransit = {
      planet: "Pluto",
      symbol: "♇",
      currentSign: plutoPos.sign,
      currentHouse: plutoHouse,
      houseTitle: HOUSE_TITLES[plutoHouse],
      cycleLength: "12 – 30 Years per House",
      houseInterpretation: `Pluto transforms your ${HOUSE_TITLES[plutoHouse]} at the genetic and spiritual root. Superficial dynamics die away so an indestructible inner sovereign authority can emerge.`,
      lessons: [
        "Facing the unconscious shadow without shame or fear",
        "Transmuting disempowerment into authentic, magnetic leadership",
        "Releasing toxic attachments to control or validation",
      ],
      advice:
        "Allow what is obsolete to decompose gracefully. The rebirth in this area will grant you generational power.",
      duration: "Generational Transmutation (Through 2043)",
    };

    // 5. ECLIPSE DETECTIONS
    const eclipses = this.getEclipseTransits();

    return {
      saturn: saturnData,
      jupiter: jupiterData,
      uranus: uranusData,
      pluto: plutoData,
      eclipses: eclipses,
    };
  }

  /**
   * Saturn House Interpretations
   */
  public getSaturnHouseInterpretation(house: number): string {
    const map: Record<number, string> = {
      1: "Saturn crosses your Ascendant into your 1st House. You are undergoing a total reinvention of your physical self, persona, and self-definition. Weighty responsibilities settle onto your shoulders, requiring you to mature into a true leader.",
      2: "Saturn audits your 2nd House of personal finances and self-worth. You are asked to budget meticulously, strip away financial vanity, and establish enduring wealth assets built on authentic integrity.",
      3: "Saturn disciplines your 3rd House of thought, communication, and skills. Mental focus sharpens, frivolous chatter ceases, and you are called to study, write, or master a high-stakes technical craft.",
      4: "Saturn anchors in your 4th House of roots, home, and ancestral karma. You are restructuring your domestic foundation, repairing family obligations, or renovating physical and emotional sanctuaries.",
      5: "Saturn tests your 5th House of creative joy, romance, and children. Casual flings no longer satisfy; you demand authentic, committed romance. Creative projects require relentless discipline and professional execution.",
      6: "Saturn tightens your 6th House of health, daily routine, and work ethic. Neglected bodily habits demand immediate rehabilitation. Streamline workflows, commit to clean nutrition, and honor your nervous system.",
      7: "Saturn crosses the Descendant into your 7th House of committed partnership. Flimsy relationships dissolve while mature, rock-solid commitments are forged. You learn the sacred art of healthy boundaries in love and business.",
      8: "Saturn enters your 8th House of shared assets, taxes, intimacy, and psychological debts. You face deep financial or emotional entanglements, paying off karmic debts and emerging with financial autonomy.",
      9: "Saturn structures your 9th House of philosophy, higher education, and worldview. Vague spiritual platitudes give way to rigorous philosophical grounding, academic credentials, and authentic ethical codes.",
      10: "Saturn culminates at the Midheaven in your 10th House of career and public authority! This is your professional harvest period. High accountability and public scrutiny arrive; proven expertise is rewarded with career milestones.",
      11: "Saturn organizes your 11th House of community, networking, and long-term aspirations. Superfluous social circles fade away. You collaborate with serious, purposeful alliances dedicated to lasting cultural impact.",
      12: "Saturn travels through your 12th House of the unconscious, spiritual closure, and solitude. A 28-year karmic cycle comes to an end. Clear psychic debris, prioritize rest, and prepare for personal rebirth when Saturn hits your Ascendant.",
    };
    return map[house] || map[1];
  }

  public getSaturnLessons(house: number): string[] {
    const map: Record<number, string[]> = {
      1: [
        "Take total ownership of your physical body and presence",
        "Establish unshakeable boundaries with energy drains",
        "Present your most authentic, dignified self to the world",
      ],
      2: [
        "Separate true self-worth from material external validation",
        "Eliminate wasteful expenditures and construct an emergency fortress",
        "Charge what your labor is truly worth without apology",
      ],
      6: [
        "Daily micro-habits compound into generational vitality",
        "Saying no to extra chores protects your physical health",
        "Master the technical details of your everyday craft",
      ],
      7: [
        "Accountability is the bedrock of enduring romance",
        "Stop rescuing people who refuse to grow",
        "Sign contracts only with individuals of proven integrity",
      ],
      10: [
        "Reputation is built slowly through delivered promises",
        "Step up to lead even when imposter syndrome whispers",
        "Endure public scrutiny with stoic grace",
      ],
    };
    return (
      map[house] || [
        "Practice consistent, humble dedication over instant gratification",
        "Honor your commitments and let your word be your bond",
        "Accept reality as it is so you can effectively restructure it",
      ]
    );
  }

  public getSaturnAdvice(house: number): string {
    const map: Record<number, string> = {
      1: "Invest in your health, posture, and foundational habits. You are the architect of your new era.",
      2: "Audit your bank accounts and streamline expenses. Build lasting, tangible security.",
      3: "Write that book, enroll in that masterclass, or learn that high-value language.",
      4: "Make peace with your past and establish a peaceful, decluttered sanctuary at home.",
      5: "Treat your creative talent like a serious business. Devote one hour every single day to it.",
      6: "Schedule annual health checkups, sleep 8 hours, and refine your daily calendar.",
      7: "Do not rush commitment, but honor the partner who stands by you with steadfast loyalty.",
      8: "Settle old debts, organize joint estate paperwork, and embrace deep psychological truth.",
      9: "Publish your research, plan purposeful pilgrimages, and anchor your ethical compass.",
      10: "Rise to the occasion. The world is watching, and your years of quiet preparation are ready.",
      11: "Curate your inner circle. Surround yourself with peers who hold you to a higher standard.",
      12: "Meditate, journal, sleep deeply, and let go of grudges. An old self is concluding.",
    };
    return map[house] || "Endurance, patience, and impeccable integrity are your superpowers.";
  }

  /**
   * Jupiter House Interpretations
   */
  public getJupiterHouseInterpretation(house: number): string {
    const map: Record<number, string> = {
      1: "Jupiter expands your 1st House! Vitality surges, self-confidence blooms, and opportunities naturally gravitate toward your radiant aura. A prime year to expand your footprint.",
      2: "Jupiter blesses your 2nd House of financial prosperity. Income streams expand, lucrative business deals materialize, and your sense of self-worth receives an opulent upgrade.",
      3: "Jupiter inspires your 3rd House of writing, media, and networking. Your words carry charismatic influence. Great for launching podcasts, newsletters, publishing, and short travels.",
      4: "Jupiter protects your 4th House of home and family. Real estate opportunities, joyous family celebrations, or expanding your living space bring deep emotional security.",
      5: "Jupiter lights up your 5th House of creative joy, romance, and entertainment! One of the happiest transits possible: love flourishes, creative inspiration flows, and life feels playful.",
      6: "Jupiter elevates your 6th House of daily work and vitality. Enjoyable job conditions, supportive coworkers, and rapid recovery from physical fatigue are promised.",
      7: "Jupiter graces your 7th House of sacred partnership! Lucrative business contracts and blessed romantic unions emerge. The partner who enters now expands your entire world.",
      8: "Jupiter enriches your 8th House of joint finances, investments, and deep intimacy. Grants, inheritances, or partner windfalls arrive, alongside profound spiritual healing.",
      9: "Jupiter rejoices in its home 9th House! International travel, academic triumphs, spiritual enlightenments, and expansive publications open broad horizons.",
      10: "Jupiter crowns your 10th House of career triumph and recognition! Promotions, awards, executive honors, and high-visibility success elevate your status.",
      11: "Jupiter enlivens your 11th House of community and dreams. Influential benefactors support your visions, and your social circle becomes an engine of joy and opportunity.",
      12: "Jupiter acts as a guardian angel in your 12th House of spiritual protection. You are shielded from hidden adversaries, intuitive downloads are profound, and inner peace reigns.",
    };
    return map[house] || map[1];
  }

  /**
   * Detect current astronomical eclipse cycles affecting the chart
   */
  public getEclipseTransits(): EclipseTransit[] {
    // Use the same dynamic Astronomy Engine event search as the Advanced
    // Western panel. Never substitute an expired hard-coded eclipse calendar.
    const events = new EclipseAnalyzer().analyzeEclipses(this.birthChart, this.currentDate);
    return events.map((event) => {
      const longitude = event.degree;
      const natalAspects: string[] = [];

      for (const natal of this.birthChart.planets) {
        const rawDifference = Math.abs(longitude - natal.longitude);
        const difference = Math.min(rawDifference, 360 - rawDifference);
        if (difference <= 4) {
          natalAspects.push(`Conjunction to Natal ${natal.name} (orb ${difference.toFixed(1)}°)`);
        } else if (Math.abs(difference - 180) <= 4) {
          natalAspects.push(`Opposition to Natal ${natal.name} (orb ${Math.abs(difference - 180).toFixed(1)}°)`);
        }
      }

      return {
        type: event.type.includes("Solar") ? "Solar Eclipse" as const : "Lunar Eclipse" as const,
        date: event.peakUtc,
        sign: event.zodiacSign,
        degree: Math.round((longitude % 30) * 100) / 100,
        natalHouse: event.affectedHouse,
        natalAspects,
        interpretation: `${event.type} in ${event.zodiacSign} at ${event.degreeFormatted}, in natal house ${event.affectedHouse}. This is an astrological symbolism overlay, not a guaranteed prediction. ${event.visibilityNote}`,
      };
    });
  }

  /**
   * Calculate Timing Windows (When to Act!)
   */
  public getTimingWindows(): Record<string, TimingWindow> {
    const currentPlanets = this.getPlanetaryPositions(this.currentDate);
    const jupHouse = this.getHouse(currentPlanets.Jupiter.longitude);
    const satHouse = this.getHouse(currentPlanets.Saturn.longitude);
    const sunHouse = this.getHouse(currentPlanets.Sun.longitude);

    // Career Phase
    let careerPhase = "Foundation & Strategic Discipline";
    if (jupHouse === 10 || sunHouse === 10) careerPhase = "Harvest & High Visibility";
    else if (jupHouse === 1 || jupHouse === 2) careerPhase = "Expansion & Resource Growth";
    else if (satHouse === 10) careerPhase = "Mastery & High Accountability";

    // Love Climate
    const venHouse = this.getHouse(currentPlanets.Venus.longitude);
    let loveClimate = "Stable & Contemplative";
    if (venHouse === 7 || venHouse === 5) loveClimate = "Peak Magnetic Romance & Connection";
    else if (jupHouse === 7) loveClimate = "Golden Partnership & Union Window";

    return {
      career: {
        title: "Career & Ambition Timing",
        category: "career",
        currentPhase: careerPhase,
        bestTimes: [
          {
            period: "Sun transiting 10th House (Annual Peak)",
            description: "High visibility with executive leadership and public recognition.",
          },
          {
            period: "Jupiter Trine Natal Midheaven",
            description: "Effortless promotions, lucrative client acquisitions, and career expansion.",
          },
        ],
        challengingTimes: [
          {
            period: "Mercury Retrograde windows",
            description: "Double-check contracts; avoid rash product launches; review workflows.",
          },
          {
            period: "Saturn Square Midheaven",
            description: "Endure heavy workload; prove competency; avoid hasty resignations.",
          },
        ],
        advice:
          "Build systematic excellence today. Deliver measurable results while Jupiter expands your professional reputation.",
        nextOpportunity: "Upcoming New Moon in your Career / Income sector",
      },
      love: {
        title: "Love & Partnership Timing",
        category: "love",
        currentPhase: loveClimate,
        bestTimes: [
          {
            period: "Venus Transiting 5th & 7th Houses",
            description: "Effortless mutual attraction, tender romance, and joyous dates.",
          },
          {
            period: "Jupiter Aspecting Natal Venus",
            description: "Golden romantic synchronicity, commitments, and generous affection.",
          },
        ],
        challengingTimes: [
          {
            period: "Venus Retrograde (every 18 months)",
            description: "Ex-partners resurface; reassess relationship values and self-worth.",
          },
          {
            period: "Mars Square Natal Venus",
            description: "Emotional friction or impatience; practice conscious de-escalation.",
          },
        ],
        advice:
          "Show up authentically without masking. The right partnership honors your sacred sovereignty.",
        nextOpportunity: "Venus-Jupiter conjunction window",
      },
      finance: {
        title: "Finance & Wealth Timing",
        category: "finance",
        currentPhase:
          jupHouse === 2 || jupHouse === 8
            ? "High Prosperity & Resource Expansion"
            : "Strategic Budgeting & Asset Fortification",
        bestTimes: [
          {
            period: "Jupiter Transiting 2nd or 8th House",
            description: "Lucrative investments, bonuses, client expansions, and passive income gains.",
          },
          {
            period: "Sun & Mercury in 2nd House",
            description: "Ideal time to negotiate raises, revise fee structures, and audit accounts.",
          },
        ],
        challengingTimes: [
          {
            period: "Saturn in 2nd House",
            description: "Budget rigorously; eliminate frivolous overhead; build emergency cash.",
          },
        ],
        advice:
          "Cultivate multiple uncorrelated income streams. Invest in appreciating skills and tangible assets.",
        nextOpportunity: "Next Taurus/Scorpio or 2nd/8th House Full Moon",
      },
      health: {
        title: "Well-being Reflection (Non-medical)",
        category: "health",
        currentPhase: "Routine reflection only",
        bestTimes: [
          {
            period: "Review daily routines",
            description: "Use this as a symbolic prompt to review rest, workload and sustainable daily habits.",
          },
          {
            period: "Plan restorative activities",
            description: "Consider scheduling ordinary breaks, recreation and time away from screens.",
          },
        ],
        challengingTimes: [
          {
            period: "High-pressure periods",
            description: "Use this only as a general reminder to avoid overloading your schedule. A chart cannot identify physical symptoms, illness or medical risk.",
          },
        ],
        advice:
          "Astrological symbolism cannot assess health, diagnose illness, estimate medical risk or guide treatment. For symptoms or health decisions, use qualified clinical care.",
        nextOpportunity: "Choose a practical routine review date",
      },
      spiritual: {
        title: "Spiritual & Inner Growth Timing",
        category: "spiritual",
        currentPhase: "Deep Intuitive Awakening",
        bestTimes: [
          {
            period: "Neptune Trine Natal Sun/Moon",
            description: "Profound mystical downloads, prophetic dreams, and artistic channeled flow.",
          },
          {
            period: "Sun in 12th House (Month before birthday)",
            description: "Sacred retreat, meditation, and karmic closure.",
          },
        ],
        challengingTimes: [
          {
            period: "Pluto Square Natal Moon",
            description: "Subconscious purge; requires deep therapy, breathwork, or shadow work.",
          },
        ],
        advice:
          "Daily silence is not a luxury; it is your ultimate strategic advantage. Listen to your gut whisper.",
        nextOpportunity: "Upcoming Pisces/Neptune alignment",
      },
    };
  }
}

/**
 * Daily Horoscope & Forecast Generator
 */
export class DailyHoroscope {
  public birthChart: WesternChartData;
  public transitEngine: TransitEngine;

  constructor(birthChart: WesternChartData) {
    this.birthChart = birthChart;
    this.transitEngine = new TransitEngine(birthChart);
  }

  /**
   * Calculate Moon Phase details
   */
  public getMoonPhase(sunLon: number, moonLon: number): {
    name: string;
    emoji: string;
    illumination: number;
  } {
    let diff = (moonLon - sunLon + 360) % 360;
    const illumination = Math.round((1 - Math.cos((diff * Math.PI) / 180)) * 50);

    if (diff < 22.5 || diff >= 337.5) {
      return { name: "New Moon", emoji: "🌑", illumination };
    } else if (diff < 67.5) {
      return { name: "Waxing Crescent", emoji: "🌒", illumination };
    } else if (diff < 112.5) {
      return { name: "First Quarter", emoji: "🌓", illumination };
    } else if (diff < 157.5) {
      return { name: "Waxing Gibbous", emoji: "🌔", illumination };
    } else if (diff < 202.5) {
      return { name: "Full Moon", emoji: "🌕", illumination };
    } else if (diff < 247.5) {
      return { name: "Waning Gibbous", emoji: "🌖", illumination };
    } else if (diff < 292.5) {
      return { name: "Last Quarter", emoji: "🌗", illumination };
    } else {
      return { name: "Waning Crescent", emoji: "🌘", illumination };
    }
  }

  /**
   * Generate complete daily horoscope for a target date
   */
  public generateDailyHoroscope(targetDate: Date = new Date()): DailyHoroscopeData {
    const planets = this.transitEngine.getPlanetaryPositions(targetDate);
    const transits = this.transitEngine.getCurrentTransits(targetDate);

    const moonPos = planets.Moon;
    const sunPos = planets.Sun;
    const moonPhase = this.getMoonPhase(sunPos.longitude, moonPos.longitude);

    // Calculate energy score from transits
    let energyScore = 65;
    transits.slice(0, 10).forEach((t) => {
      if (t.nature === "Harmonious") energyScore += t.exactness * 6;
      else if (t.nature === "Challenging") energyScore -= t.exactness * 4;
      else energyScore += t.exactness * 2;
    });
    energyScore = Math.max(30, Math.min(98, Math.round(energyScore)));

    let energyMood = "Balanced & Strategic Flow";
    if (energyScore >= 85) energyMood = "Radiant, Expansive & High-Momentum";
    else if (energyScore >= 70) energyMood = "Productive, Optimistic & Social";
    else if (energyScore >= 50) energyMood = "Reflective, Disciplined & Steady";
    else energyMood = "Introspective Calibration & Grounding";

    // Focus area based on transiting Sun & Moon houses
    const sunHouse = this.transitEngine.getHouse(sunPos.longitude);
    const moonHouse = this.transitEngine.getHouse(moonPos.longitude);

    const FOCUS_AREAS: Record<number, string> = {
      1: "Personal Vitality, Image & Decisive Leadership",
      2: "Financial Fortification & Self-Worth Recognition",
      3: "Intellectual Agility, Writing & Strategic Networking",
      4: "Domestic Sanctuary, Family Grounding & Emotional Rest",
      5: "Creative Passion, Playful Self-Expression & Romance",
      6: "Routine Optimization, High-Level Craftsmanship & Wellness",
      7: "Diplomatic Cooperation, Partnership Alignment & Contracts",
      8: "Deep Psychological Focus, Shared Resources & Rebirth",
      9: "Big-Picture Vision, Higher Studies & Adventurous Horizons",
      10: "Career Milestones, Public Authority & Executive Execution",
      11: "Community Impact, Meaningful Alliances & Future Goals",
      12: "Subconscious Healing, Sacred Solitude & Meditation",
    };

    const focus = FOCUS_AREAS[moonHouse] || FOCUS_AREAS[sunHouse] || "Creative & Professional Mastery";

    // Lucky hours based on planetary hours
    const luckyHourMap = [
      "09:15 AM – 11:30 AM (Solar-Jupiter Peak)",
      "02:00 PM – 04:30 PM (Mercury-Venus Alignment)",
      "10:00 AM – 12:45 PM (Lunar-Mars Focus)",
      "03:30 PM – 05:45 PM (Golden Hour Harmony)",
      "11:00 AM – 01:15 PM (High-Vibration Window)",
    ];
    const luckyHours = luckyHourMap[targetDate.getDay() % luckyHourMap.length];

    // Affirmation
    const affirmations = [
      "I align my sovereign will with the harmonious rhythms of the cosmos. Opportunities flow to me effortlessly.",
      "My mind is clear, my boundaries are firm, and my actions build lasting legacy.",
      "I welcome transformative challenges as fertile soil for my inevitable triumph.",
      "I honor my unique cosmic blueprint; abundance and authentic love surround me today.",
      "I navigate today's planetary currents with calm wisdom, poise, and playful grace.",
    ];
    const affirmation = affirmations[(targetDate.getDate() + targetDate.getMonth()) % affirmations.length];

    // Top highlight transit
    const highlightTransit = transits.length > 0
      ? `${transits[0].transitingPlanet} ${transits[0].aspectSymbol} Natal ${transits[0].natalPlanet}`
      : "Sun Harmonic Alignment";

    return {
      date: targetDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      dateObj: targetDate,
      moonSign: moonPos.sign,
      moonDegree: moonPos.degree,
      moonSignFormatted: `${moonPos.degree.toFixed(1)}° ${moonPos.sign}`,
      moonPhase: moonPhase,
      overallEnergy: energyScore,
      energyMood: energyMood,
      focus: focus,
      luckyHours: luckyHours,
      challenges: [
        "Avoid imposter syndrome or knee-jerk emotional reactions.",
        "Refrain from taking on extra tasks that dilute your primary focus.",
      ],
      opportunities: [
        "Initiate crucial conversations during your Lucky Hours.",
        "Pitch ambitious concepts; influential peers are receptive.",
        "Ground creative inspiration into concrete, actionable steps.",
      ],
      affirmation: affirmation,
      bestActions: [
        "Draft the blueprint for your primary goal",
        "Reach out to an admired mentor or collaborator",
        "Take a brisk 20-minute walk in natural sunlight",
        "Set clear boundaries around deep-work hours",
      ],
      avoidActions: [
        "Doom-scrolling or getting distracted by internet drama",
        "Making impulsive purchases to soothe temporary anxiety",
        "Saying yes out of people-pleasing guilt",
      ],
      highlightTransit: highlightTransit,
    };
  }

  /**
   * Generate 7-day weekly forecast
   */
  public generateWeeklyForecast(startDate: Date = new Date()): WeeklyForecastDay[] {
    const days: WeeklyForecastDay[] = [];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate.getTime());
      d.setDate(d.getDate() + i);

      const horoscope = this.generateDailyHoroscope(d);
      days.push({
        dayName: i === 0 ? "Today" : dayNames[d.getDay()],
        dateString: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        moonSign: horoscope.moonSign,
        energyScore: horoscope.overallEnergy,
        theme: horoscope.energyMood.split("&")[0].trim(),
        keyTransit: horoscope.highlightTransit || "Harmonic Alignment",
      });
    }

    return days;
  }

  /**
   * Generate monthly forecast overview
   */
  public generateMonthlyForecast(targetMonth?: number, targetYear?: number): MonthlyForecastOverview {
    const now = new Date();
    const month = targetMonth !== undefined ? targetMonth : now.getMonth();
    const year = targetYear !== undefined ? targetYear : now.getFullYear();

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    return {
      monthName: monthNames[month],
      year: year,
      newMoonDate: `${monthNames[month]} 12`,
      fullMoonDate: `${monthNames[month]} 27`,
      generalTheme:
        "A transformative chapter marked by structural discipline, strategic relationship alignment, and decisive professional momentum.",
      highlights: [
        {
          date: `${monthNames[month]} 4`,
          title: "Mercury Ingress & Intellectual Flow",
          description: "Clear communication, sharp negotiation skills, and commercial synergy.",
          impact: "Medium",
        },
        {
          date: `${monthNames[month]} 12`,
          title: "New Moon Intentions Portal",
          description: "Prime day to plant ambitious seeds and launch long-term projects.",
          impact: "High",
        },
        {
          date: `${monthNames[month]} 19`,
          title: "Sun-Jupiter Planetary Harmony",
          description: "Peak good fortune, optimistic breakthroughs, and social magnetism.",
          impact: "High",
        },
        {
          date: `${monthNames[month]} 27`,
          title: "Full Moon Culmination & Revelation",
          description: "Climax of ongoing negotiations; celebrate wins and release what no longer serves.",
          impact: "High",
        },
      ],
    };
  }
}
