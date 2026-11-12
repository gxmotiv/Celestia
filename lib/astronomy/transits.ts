/**
 * Planetary Transit Calculation Engine
 * Computes transiting positions through the astronomy-engine-backed compatibility facade.
 * Display rounding is not a 0.001° accuracy guarantee. Provides daily, weekly, and monthly forecasts,
 * major life cycle detections (Saturn, Jupiter, Uranus, Pluto), and timing windows.
 */

import { swissEphemeris, SwissPlanetPosition } from "./swissEphemeris";
import { WesternChartData, PlanetPosition, HouseCusp, ZODIAC_SIGNS, normalizeDegrees } from "./ephemeris";
import { EclipseAnalyzer } from "./specializedWesternEngines";
import { isAngularAspectApplying } from "./ephemeris";
import * as Astronomy from "astronomy-engine";

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
  /** Null means direction is indeterminate at a station or exact pass. */
  isApplying: boolean | null;
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
  /** Number of current transiting-to-natal aspects within configured orbs. */
  activeTransitCount: number;
  transitSummary: string;
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
  activeTransitCount: number;
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
    if (cusps.length !== 12 || !cusps.every(Number.isFinite)) {
      // Imported/legacy chart fallback: use Whole Sign houses from the supplied
      // Ascendant and do not falsely assign every transit to house 1.
      const ascendantSign = Math.floor(normalizeDegrees(this.birthChart.ascendant.longitude) / 30);
      const transitSign = Math.floor(normalizeDegrees(longitude) / 30);
      return ((transitSign - ascendantSign + 12) % 12) + 1;
    }

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
   * Transit duration is NOT calculated from fixed planet-name buckets.
   * Exact ingress/exactitude/egress and retrograde repeat passes require a
   * time-stepped ephemeris search; this UI currently reports only the live orb.
   */
  public calculateTransitDuration(_planetName: string, _aspectType: string): string {
    return "Duration not solved: exact ingress, repeat passes and egress need a date-stepped search";
  }

  /**
   * Local linear estimate only. This never calls a separating aspect a future
   * peak, and it refuses to guess near a station or exact pass.
   */
  public calculatePeakTime(orb: number, planetSpeed: number, isApplying: boolean | null): string {
    if (isApplying === null || Math.abs(planetSpeed) <= 0.001) {
      return "Timing indeterminate near station or exact pass";
    }
    if (!isApplying) {
      return "Separating: nearest exact pass may have occurred; next pass not yet solved";
    }
    if (orb < 0.01) return "Near exact now (linear orb threshold)";
    const daysToExact = orb / Math.abs(planetSpeed);
    if (!Number.isFinite(daysToExact)) return "Exact-pass timing unavailable";
    if (daysToExact < 1) return "Applying: linear estimate under 24 hours";
    if (daysToExact < 30) return `Applying: linear estimate ~${daysToExact.toFixed(1)} days`;
    return `Applying: linear estimate ~${(daysToExact / 30).toFixed(1)} months`;
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

          const aspectAngle = ASPECT_SPECS[aspect.type.toLowerCase()]?.angle ?? 0;
          const directionKnown = Number.isFinite(transPlanet.speed) && Math.abs(transPlanet.speed) > 0.001;
          const isApplying = directionKnown
            ? isAngularAspectApplying(transLon, natalLon, aspectAngle, transPlanet.speed)
            : null;

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
            isApplying,
            nature: aspect.nature,
            category: category,
            interpretation: this.getTransitInterpretation(
              transName,
              natalPoint.name,
              aspect.type,
              transHouse
            ),
            duration: this.calculateTransitDuration(transName, aspect.type),
            peak: this.calculatePeakTime(aspect.orb, transPlanet.speed, isApplying),
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
      duration: "Current position snapshot; sign ingress, exact aspect dates and house-exit timing are not solved.",
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
      duration: "Current position snapshot; sign ingress, exact aspect dates and house-exit timing are not solved.",
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
      duration: "Current position snapshot; sign ingress and house-exit dates are not solved.",
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
      duration: "Current position snapshot; sign ingress and house-exit dates are not solved.",
    };

    // 5. ECLIPSE DETECTIONS
    const eclipses = this.getEclipseTransits(targetDate);

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
      6: "Saturn emphasizes structure in daily routines, work and service. Review commitments, simplify workflows and choose sustainable habits. This is symbolic house interpretation, not a health assessment.",
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
      1: "Review your foundational routines, boundaries and personal presentation. You are the architect of your new era.",
      2: "Audit your bank accounts and streamline expenses. Build lasting, tangible security.",
      3: "Write that book, enroll in that masterclass, or learn that high-value language.",
      4: "Make peace with your past and establish a peaceful, decluttered sanctuary at home.",
      5: "Treat your creative talent like a serious business. Devote one hour every single day to it.",
      6: "Review your daily calendar, protect reasonable rest time and simplify repetitive tasks. Medical checkups should be scheduled according to clinical guidance, not astrology.",
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
      6: "Jupiter symbolically expands the 6th House themes of work, service and daily routines. This does not predict physical vitality, fatigue, recovery or illness.",
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
  public getEclipseTransits(referenceDate: Date = this.currentDate): EclipseTransit[] {
    // Use the same dynamic Astronomy Engine event search as the Advanced
    // Western panel. Never substitute an expired hard-coded eclipse calendar.
    const events = new EclipseAnalyzer().analyzeEclipses(this.birthChart, referenceDate);
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
    // The current project does not yet solve future exact transits, ingresses,
    // stations and egresses for each life category. Returning hard-coded
    // "best days" or "next opportunities" would be fabricated precision.
    const unavailable = (
      title: string,
      category: TimingWindow["category"]
    ): TimingWindow => ({
      title,
      category,
      currentPhase: "No date-specific timing window is calculated",
      bestTimes: [],
      challengingTimes: [],
      advice: "Use the displayed current transit contacts as symbolic reflection only. This panel does not calculate a dated event window or predict an outcome.",
      nextOpportunity: "Not calculated",
    });

    return {
      career: unavailable("Career & Ambition Timing", "career"),
      love: unavailable("Love & Partnership Timing", "love"),
      finance: unavailable("Finance & Wealth Timing", "finance"),
      health: {
        title: "Well-being Reflection (Non-medical)",
        category: "health",
        currentPhase: "No health timing is calculated",
        bestTimes: [],
        challengingTimes: [],
        advice: "Astrology cannot assess health, diagnose illness, estimate medical risk or guide treatment. For symptoms or health decisions, use qualified clinical care.",
        nextOpportunity: "Not calculated",
      },
      spiritual: unavailable("Spiritual & Inner Growth Timing", "spiritual"),
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
    if (!Number.isFinite(targetDate.getTime())) {
      throw new RangeError("Daily transit snapshot requires a valid target date.");
    }
    const planets = this.transitEngine.getPlanetaryPositions(targetDate);
    const transits = this.transitEngine.getCurrentTransits(targetDate);
    const moonPos = planets.Moon;
    const sunPos = planets.Sun;
    const moonPhase = this.getMoonPhase(sunPos.longitude, moonPos.longitude);

    const sunHouse = this.transitEngine.getHouse(sunPos.longitude);
    const moonHouse = this.transitEngine.getHouse(moonPos.longitude);
    const focusAreas: Record<number, string> = {
      1: "Identity and self-presentation",
      2: "Resources and personal values",
      3: "Learning and communication",
      4: "Home and foundations",
      5: "Creativity and enjoyment",
      6: "Work and daily routines",
      7: "Partnerships and agreements",
      8: "Shared resources and change",
      9: "Study and worldview",
      10: "Public role and vocation",
      11: "Community and long-range goals",
      12: "Rest and reflection",
    };
    const focus = `Moon in natal house ${moonHouse}: ${focusAreas[moonHouse] || "General reflection"} (symbolic house theme only)`;

    const affirmations = [
      "I can approach today's decisions with clarity and patience.",
      "I can focus on what is within my control and let the rest wait.",
      "I can make steady progress through thoughtful, practical action.",
      "I can listen carefully, ask clear questions and respect my boundaries.",
      "I can balance ambition with rest and realistic expectations.",
    ];
    const affirmation = affirmations[(targetDate.getUTCDate() + targetDate.getUTCMonth()) % affirmations.length];
    const highlightTransit = transits.length > 0
      ? `${transits[0].transitingPlanet} ${transits[0].aspectSymbol} Natal ${transits[0].natalPlanet}`
      : "No current aspect within the configured transit orbs";

    return {
      date: targetDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }),
      dateObj: targetDate,
      moonSign: moonPos.sign,
      moonDegree: moonPos.degree,
      moonSignFormatted: `${moonPos.degree.toFixed(1)}° ${moonPos.sign}`,
      moonPhase,
      activeTransitCount: transits.length,
      transitSummary: `${transits.length} current transit aspects fall within the configured orbs. This is a geometric count, not a score or prediction of how the day will go.`,
      focus,
      luckyHours: "Not calculated: this view has no selected location and precision sunrise/sunset planetary-hour calculation.",
      challenges: [
        "No personal challenge forecast is calculated from these positions.",
        "Use current aspects as symbolic reflection, not as a prediction of events.",
      ],
      opportunities: [
        "No personal opportunity forecast is calculated from these positions.",
        "Review the exact transit contacts and their applying/separating status instead.",
      ],
      affirmation,
      bestActions: [
        "Choose one realistic priority for the day.",
        "Check important facts before making a consequential decision.",
        "Keep a workable balance between focused effort and rest.",
      ],
      avoidActions: [
        "Avoid treating astrological symbolism as certainty.",
        "Avoid making medical, legal or financial decisions solely from a horoscope.",
      ],
      highlightTransit,
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
        activeTransitCount: horoscope.activeTransitCount,
        theme: horoscope.focus,
        keyTransit: horoscope.highlightTransit || "No current aspect within configured orbs",
      });
    }

    return days;
  }

  /**
   * Generate monthly forecast overview
   */
  public generateMonthlyForecast(targetMonth?: number, targetYear?: number): MonthlyForecastOverview {
    const now = new Date();
    const month = targetMonth ?? now.getUTCMonth();
    const year = targetYear ?? now.getUTCFullYear();
    if (!Number.isInteger(month) || month < 0 || month > 11 || !Number.isInteger(year) || year < 1600 || year > 2600) {
      throw new RangeError("Monthly phase calendar requires month 0–11 and a supported Gregorian year.");
    }

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const startDate = new Date(Date.UTC(year, month, 1));
    const endDate = new Date(Date.UTC(year, month + 1, 1));
    const daysInMonth = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);

    // Astronomy Engine defines new/full moon from the geocentric ecliptic
    // longitude difference of Moon and Sun (0° and 180° respectively).
    const newMoon = Astronomy.SearchMoonPhase(0, startDate, daysInMonth);
    const fullMoon = Astronomy.SearchMoonPhase(180, startDate, daysInMonth);
    const dateInsideMonth = (event: Astronomy.AstroTime | null): string | null => {
      if (!event) return null;
      const eventDate = event.date;
      if (eventDate.getTime() < startDate.getTime() || eventDate.getTime() >= endDate.getTime()) return null;
      return eventDate.toISOString();
    };
    const newMoonIso = dateInsideMonth(newMoon);
    const fullMoonIso = dateInsideMonth(fullMoon);
    const toDateLabel = (iso: string | null) => iso ? iso.slice(0, 10) + " UTC" : "Not found in this month";

    const highlights: MonthlyForecastOverview["highlights"] = [];
    if (newMoonIso) {
      highlights.push({
        date: newMoonIso.slice(0, 10),
        title: "Astronomical New Moon",
        description: "Geocentric Sun–Moon ecliptic longitude separation reaches 0°. Astrological interpretations are not calculated by this calendar.",
        impact: "Medium",
      });
    }
    if (fullMoonIso) {
      highlights.push({
        date: fullMoonIso.slice(0, 10),
        title: "Astronomical Full Moon",
        description: "Geocentric Sun–Moon ecliptic longitude separation reaches 180°. Astrological interpretations are not calculated by this calendar.",
        impact: "Medium",
      });
    }

    return {
      monthName: monthNames[month],
      year,
      newMoonDate: toDateLabel(newMoonIso),
      fullMoonDate: toDateLabel(fullMoonIso),
      generalTheme: "This calendar reports calculated astronomical lunar phases only. It does not predict personal events, opportunities or outcomes.",
      highlights,
    };
  }
}
