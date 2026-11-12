/**
 * Complete Relationship Astrology Engine:
 * 1. Synastry (Inter-chart aspects, house overlays, categorized affinity scoring, karmic & soulmate markers)
 * 2. Composite Chart (Midpoint relationship chart of the partnership entity)
 * 3. Davison Relationship Chart (Time-Space midpoint chart)
 */

import {
  WesternChartData,
  PlanetPosition,
  AspectData,
  calculateJulianDay,
  calculateWesternChart,
  normalizeDegrees,
  formatDegreeMinute,
  ZODIAC_SIGNS,
} from "./ephemeris";
import { swissEphemeris } from "./swissEphemeris";

// ---------------------------------------------------------------------------
// 1. RELATIONSHIP & GENDER TYPES
// ---------------------------------------------------------------------------

export type RelationshipCategory =
  | "romantic"      // Partner, Spouse, Lover, Dating, Crush
  | "parent"        // Parent (Mother / Father / Biological / Adoptive)
  | "stepparent"    // Step-Parent (Stepfather / Stepmother)
  | "child"         // Child / Stepchild (Son / Daughter)
  | "sibling"       // Sibling / Stepsibling (Brother / Sister)
  | "cousin"        // Cousin / Extended Kinship
  | "relative"      // Relative, Family Member (Aunt, Uncle, Grandparent)
  | "friend"        // Friend, Best Friend, Companion
  | "colleague"     // Colleague, Business Partner, Co-worker
  | "mentor"        // Mentor, Teacher, Guide, Student
  | "karmic"        // Karmic Soul Connection, Spiritual Encounter
  | "stranger";     // Stranger, Random Encounter, Acquaintance

export type GenderType = "male" | "female" | "nonbinary" | "unspecified";

export interface AffinityDimension {
  key: string;
  label: string;
  val: number;
  color: string;
  description: string;
}

// ---------------------------------------------------------------------------
// 2. SYNASTRY TYPES & INTERPRETATIONS
// ---------------------------------------------------------------------------

export interface SynastryAspect {
  planet1: string;
  planet2: string;
  symbol1: string;
  symbol2: string;
  aspectName: "Conjunction" | "Sextile" | "Square" | "Trine" | "Opposition" | "Quincunx";
  symbol: string;
  angle: number;
  orb: number;
  /** Cross-chart natal aspects compare two static birth snapshots; applying/separating is not defined here. */
  isApplying: boolean | null;
  score: number; // Interpretive heuristic weight, not measured compatibility
  nature: "Harmonious" | "Challenging" | "Dynamic" | "Karmic";
  category: string;
  title: string;
  description: string;
  advice: string;
}

export interface HouseOverlay {
  personPlanet: string;
  symbol: string;
  partnerHouse: number;
  interpretation: string;
}

export interface CompatibilityScores {
  emotional: number;     // Moon contacts
  mental: number;        // Mercury contacts
  physical: number;      // Venus/Mars / Vital contacts
  communication: number; // Mercury/Moon contacts
  valuesAlignment: number;// Venus/Jupiter contacts
  longTermPotential: number;// Saturn contacts
  overall: number;       // Heuristic weighted astrology index (25-99), not a probability
  verdict: string;
  dimensions: AffinityDimension[];
  relationshipContextSummary: string;
}

export interface KarmicIndicator {
  type: "Node Contact" | "Vertex Contact" | "Saturnian Bond" | "Chironic Healing";
  description: string;
  intensity: "Tight orb" | "Moderate orb";
}

export interface SynastryReport {
  interAspects: SynastryAspect[];
  p1InP2Houses: HouseOverlay[];
  p2InP1Houses: HouseOverlay[];
  scores: CompatibilityScores;
  strengths: string[];
  challenges: string[];
  karmicConnections: KarmicIndicator[];
  soulmateIndicators: string[];
}

// Key Synastry Aspect Database (50+ combinations)
export const SYNASTRY_INTERPRETATIONS: Record<
  string,
  {
    title: string;
    score: number;
    category: SynastryAspect["category"];
    nature: SynastryAspect["nature"];
    description: string;
    advice: string;
  }
> = {
  "Sun-Sun-Conjunction": {
    title: "Twin Solar Resonance",
    score: 9.0,
    category: "Romance & Chemistry",
    nature: "Harmonious",
    description: "Your core vitality, life missions, and egos walk the same wavelength. You recognize yourself in the other with spontaneous mutual admiration.",
    advice: "Celebrate shared creative projects without competing for the spotlight.",
  },
  "Sun-Sun-Trine": {
    title: "Effortless Soul Alignment",
    score: 8.8,
    category: "Romance & Chemistry",
    nature: "Harmonious",
    description: "A harmonious flow of creative will. Mutual respect comes easily and you naturally validate each other's identity.",
    advice: "Harness this natural ease to build an enduring life vision together.",
  },
  "Sun-Sun-Square": {
    title: "Ego Friction & Dynamic Spur",
    score: 5.5,
    category: "Growth & Purpose",
    nature: "Challenging",
    description: "Different fundamental styles of self-expression can lead to pride battles or feeling overshadowed by the partner's will.",
    advice: "Practice generous active listening and honor differing methods of achieving recognition.",
  },
  "Sun-Moon-Conjunction": {
    title: "The Classic Royal Marriage Aspect",
    score: 10.0,
    category: "Romance & Chemistry",
    nature: "Harmonious",
    description: "The ultimate archetypal yin-yang polarity. Person 1's conscious will feels cherished and deeply understood by Person 2's emotional sanctuary.",
    advice: "Cherish this rare intuitive bond; it provides lifelong instinctive loyalty.",
  },
  "Sun-Moon-Trine": {
    title: "Intuitive Heart-Soul Harmony",
    score: 9.5,
    category: "Emotional & Safety",
    nature: "Harmonious",
    description: "Profound organic empathy between Person 1's personality and Person 2's feelings. Domestic life flows smoothly and warmly.",
    advice: "Create regular quality time in private domestic spaces to nurture this warmth.",
  },
  "Sun-Moon-Opposition": {
    title: "Magnetic Soli-Lunar Polarity",
    score: 8.0,
    category: "Romance & Chemistry",
    nature: "Dynamic",
    description: "Full-moon magnetic attraction. You illuminate each other's conscious and unconscious sides like mirror twins.",
    advice: "Embrace the polarity: allow one partner to lead when needed while honoring emotional balance.",
  },
  "Moon-Moon-Conjunction": {
    title: "Instinctive Emotional Telepathy",
    score: 9.8,
    category: "Emotional & Safety",
    nature: "Harmonious",
    description: "You share identical emotional frequencies, comfort foods, nest-building desires, and subconscious rhythms. You feel instantly 'at home'.",
    advice: "Be mindful that shared mood dips do not spiral; one person should consciously maintain grounded cheer.",
  },
  "Moon-Moon-Trine": {
    title: "Seamless Emotional Flow",
    score: 9.2,
    category: "Emotional & Safety",
    nature: "Harmonious",
    description: "Your feelings, sensitivities, and domestic habits blend without friction. Comforting each other is instinctual.",
    advice: "A cornerstone for peaceful cohabitation and lifelong emotional companionship.",
  },
  "Moon-Moon-Square": {
    title: "Mismatched Emotional Wiring",
    score: 4.8,
    category: "Emotional & Safety",
    nature: "Challenging",
    description: "Different coping styles when stressed. One may need solitude while the other craves reassurance, creating misunderstandings.",
    advice: "Do not personalize each other's emotional defense mechanisms; agree on clear safety cues.",
  },
  "Venus-Mars-Conjunction": {
    title: "Instant Electric Magnetism",
    score: 9.9,
    category: "Romance & Chemistry",
    nature: "Harmonious",
    description: "The quintessential aphrodisiac aspect. Venus's receptive romantic charm fuses directly with Mars's erotic drive, creating irresistible physical chemistry.",
    advice: "Channel this passionate drive into shared artistic adventures and creative play.",
  },
  "Venus-Mars-Trine": {
    title: "Harmonious Romantic Passion",
    score: 9.2,
    category: "Romance & Chemistry",
    nature: "Harmonious",
    description: "Smooth, delightful sexual attraction with gentle romantic romance. Desire and affection naturally complement each other.",
    advice: "Cultivate regular romantic rituals to keep the delightful spark continuously glowing.",
  },
  "Venus-Mars-Square": {
    title: "Volcanic Chemistry with Friction",
    score: 6.8,
    category: "Romance & Chemistry",
    nature: "Dynamic",
    description: "Intense, dramatic attraction where love and irritation walk hand in hand. Passion is stimulated through provocative banter.",
    advice: "Ensure erotic tension is grounded in kind respect outside the bedroom to prevent hurt feelings.",
  },
  "Venus-Venus-Conjunction": {
    title: "Shared Aesthetic & Value Resonance",
    score: 9.0,
    category: "Romance & Chemistry",
    nature: "Harmonious",
    description: "You share taste in art, social style, romance, finance, and leisure. Deciding how to spend money or decorate a home is joyful.",
    advice: "Cultivate creative beauty and host shared social gatherings together.",
  },
  "Venus-Venus-Trine": {
    title: "Harmonious Love Languages",
    score: 8.8,
    category: "Romance & Chemistry",
    nature: "Harmonious",
    description: "Complimentary love styles and mutual gentleness. You easily express appreciation in ways the partner values.",
    advice: "A steady foundation for tenderness and shared cultural enjoyment.",
  },
  "Mercury-Mercury-Conjunction": {
    title: "Mental Synchronicity & Rapid Banter",
    score: 9.0,
    category: "Intellect & Dialogue",
    nature: "Harmonious",
    description: "Conversations flow endlessly. You finish each other's sentences, share similar senses of humor, and inspire lively ideas.",
    advice: "Take notes on your shared discussions; you can write books or launch intellectual projects together.",
  },
  "Mercury-Mercury-Trine": {
    title: "Effortless Mental Rapport",
    score: 8.7,
    category: "Intellect & Dialogue",
    nature: "Harmonious",
    description: "Natural intellectual understanding. Solving practical dilemmas together is efficient, respectful, and clear.",
    advice: "Enjoy shared reading, educational travels, and thought-provoking podcasts.",
  },
  "Mercury-Moon-Conjunction": {
    title: "Heart-to-Mind Intimacy",
    score: 9.1,
    category: "Intellect & Dialogue",
    nature: "Harmonious",
    description: "Person 1 can articulate what Person 2 only feels, creating profound emotional relief and understanding.",
    advice: "Maintain open, vulnerable dialogues; speaking feelings aloud heals both partners.",
  },
  "Venus-Jupiter-Conjunction": {
    title: "Abundance, Joy & Generous Grace",
    score: 9.6,
    category: "Romance & Chemistry",
    nature: "Harmonious",
    description: "A golden lucky aspect bringing laughter, generosity, social popularity, and mutual indulgence in life's finest blessings.",
    advice: "Travel, explore worldly horizons, and share your good fortune with loved ones.",
  },
  "Venus-Saturn-Conjunction": {
    title: "The Karmic Anchor of Commitment",
    score: 7.5,
    category: "Commitment & Longevity",
    nature: "Karmic",
    description: "A solemn, enduring pledge of devotion. Saturn anchors Venus's romantic dreams into realistic, rock-solid lifetime loyalty.",
    advice: "Ensure duty does not extinguish affection; make conscious efforts to express warmth.",
  },
  "Venus-Saturn-Trine": {
    title: "Enduring Dedication & Moral Loyalty",
    score: 8.8,
    category: "Commitment & Longevity",
    nature: "Harmonious",
    description: "Long-term partnership hallmark. Trust is steadfast, fidelity is prized, and both partners feel secure in the test of time.",
    advice: "One of the absolute finest indicators of marriage stability and dependable family life.",
  },
  "Venus-Saturn-Square": {
    title: "Love Tested by Fear & Restraint",
    score: 4.5,
    category: "Commitment & Longevity",
    nature: "Challenging",
    description: "Venus feels emotionally evaluated, criticized, or withheld by Saturn's reserve. Fear of rejection can stifle spontaneous romance.",
    advice: "Work on transparent emotional reassurance and replace stoic tests with honest expressions of vulnerability.",
  },
  "Mars-Saturn-Trine": {
    title: "Constructive Teamwork & Perseverance",
    score: 8.5,
    category: "Commitment & Longevity",
    nature: "Harmonious",
    description: "Excellent collaborative stamina. Mars brings dynamic energy while Saturn guides it with methodical focus toward tangible goals.",
    advice: "Tackle ambitious long-range milestones, home building, or fitness goals as a team.",
  },
  "Sun-NorthNode-Conjunction": {
    title: "Nodal Growth Theme",
    score: 9.7,
    category: "Growth & Purpose",
    nature: "Karmic",
    description: "Some modern astrology traditions interpret this close Sun–Node contact as a symbolic growth or life-direction theme. It does not establish destiny or determine either person's future.",
    advice: "Embrace the accelerated personal growth that this union triggers in both lives.",
  },
  "Moon-NorthNode-Conjunction": {
    title: "Nodal Emotional Resonance",
    score: 9.8,
    category: "Growth & Purpose",
    nature: "Karmic",
    description: "Some modern astrology traditions interpret this Moon–Node contact as symbolic emotional familiarity or shared growth themes. It is not evidence of a pre-incarnation agreement.",
    advice: "Honor this deep psychic connection with gratitude and emotional authenticity.",
  },
  "Venus-NorthNode-Conjunction": {
    title: "Venus–Node Affection Theme",
    score: 9.6,
    category: "Romance & Chemistry",
    nature: "Karmic",
    description: "Some astrology traditions read this Venus–Node contact as a symbolic affection or relationship-growth theme. It does not show that a meeting was destined or guarantee a relationship.",
    advice: "Use this symbolism as a prompt to discuss affection, shared values and expectations; it does not identify soulmates.",
  },
  "Sun-Saturn-Trine": {
    title: "Pillar of Respect & Endurance",
    score: 8.6,
    category: "Commitment & Longevity",
    nature: "Harmonious",
    description: "Mature mutual respect. Saturn provides a reliable scaffold for the Sun's aspirations, fostering mutual dependability.",
    advice: "Build structured routines and financial stability; you bring out each other's maturity.",
  },
};

export class SynastryEngine {
  constructor(
    private chart1: WesternChartData,
    private chart2: WesternChartData,
    private name1: string = "Person 1",
    private name2: string = "Person 2",
    private gender1: GenderType = "unspecified",
    private gender2: GenderType = "unspecified",
    private relType: RelationshipCategory = "romantic"
  ) {}

  /**
   * Calculate all inter-chart aspects between Person 1 and Person 2
   */
  public calculateAllInterAspects(): SynastryAspect[] {
    const aspects: SynastryAspect[] = [];
    const planets1 = this.chart1.planets;
    const planets2 = this.chart2.planets;

    const ASPECTS_DEF = [
      { name: "Conjunction" as const, symbol: "☌", angle: 0, orb: 7.5 },
      { name: "Sextile" as const, symbol: "⚹", angle: 60, orb: 5.0 },
      { name: "Square" as const, symbol: "□", angle: 90, orb: 6.5 },
      { name: "Trine" as const, symbol: "△", angle: 120, orb: 7.5 },
      { name: "Opposition" as const, symbol: "☍", angle: 180, orb: 7.0 },
      { name: "Quincunx" as const, symbol: "⚻", angle: 150, orb: 3.0 },
    ];

    const getContextCategory = (rawCategory: string): string => {
      if (this.relType === "romantic") return rawCategory;
      if (this.relType === "parent") {
        if (rawCategory === "Romance & Chemistry") return "Parental Warmth & Vitality";
        if (rawCategory === "Commitment & Longevity") return "Sacred Lineage Duty & Guidance";
        return rawCategory;
      }
      if (this.relType === "stepparent") {
        if (rawCategory === "Romance & Chemistry") return "Blended Household Warmth";
        if (rawCategory === "Commitment & Longevity") return "Earned Respect & Step-Family Duty";
        return rawCategory;
      }
      if (this.relType === "child") {
        if (rawCategory === "Romance & Chemistry") return "Nurturing Warmth & Development";
        if (rawCategory === "Commitment & Longevity") return "Parental Protection & Support";
        return rawCategory;
      }
      if (this.relType === "sibling") {
        if (rawCategory === "Romance & Chemistry") return "Sibling Playfulness & Sparring";
        if (rawCategory === "Commitment & Longevity") return "Lifelong Sibling Alliance";
        return rawCategory;
      }
      if (this.relType === "friend") {
        if (rawCategory === "Romance & Chemistry") return "Camaraderie & Shared Spark";
        if (rawCategory === "Commitment & Longevity") return "Loyalty & Enduring Friendship";
        return rawCategory;
      }
      if (this.relType === "relative" || this.relType === "cousin") {
        if (rawCategory === "Romance & Chemistry") return "Family Vitality & Warmth";
        if (rawCategory === "Commitment & Longevity") return "Kinship Duty & Lifelong Tie";
        return rawCategory;
      }
      if (this.relType === "colleague") {
        if (rawCategory === "Romance & Chemistry") return "Creative & Work Synergy";
        if (rawCategory === "Commitment & Longevity") return "Professional Reliability & Trust";
        return rawCategory;
      }
      if (this.relType === "stranger") {
        if (rawCategory === "Romance & Chemistry") return "Instant Vibe & Spark";
        if (rawCategory === "Commitment & Longevity") return "Unexpected Encounters";
        return rawCategory;
      }
      if (this.relType === "mentor") {
        if (rawCategory === "Romance & Chemistry") return "Inspirational Spark";
        if (rawCategory === "Commitment & Longevity") return "Enduring Guidance";
        return rawCategory;
      }
      if (this.relType === "karmic") {
        if (rawCategory === "Romance & Chemistry") return "Karmic Magnetism";
        return rawCategory;
      }
      return rawCategory;
    };

    const getContextAdvice = (rawAdvice: string, p1Name: string, p2Name: string): string => {
      if (this.relType === "romantic") return rawAdvice;
      if (this.relType === "parent") {
        return `Balance firm guidance with warm emotional acceptance; allow the child space to individuate while knowing the parental door is always open.`;
      }
      if (this.relType === "stepparent") {
        return `Give bonding time and trust space to develop organically without rushing; be a steady adult ally who honors biological bonds while offering sincere support.`;
      }
      if (this.relType === "child") {
        return `Cultivate independent self-expression while honoring parental care; communicate feelings openly without fear of falling short.`;
      }
      if (this.relType === "sibling") {
        return `Celebrate each other's individual triumphs instead of comparing; turn competitive sparks into collaborative teamwork.`;
      }
      if (this.relType === "friend") {
        return `Channel this planetary energy into shared adventures, mutual respect, and loyal companionship without expectations.`;
      }
      if (this.relType === "relative" || this.relType === "cousin") {
        return `Honor individual boundaries and personal autonomy while keeping the ancestral and family bond compassionate.`;
      }
      if (this.relType === "colleague") {
        return `Leverage this dynamic in collaborative goals; define clear deliverables and communicate transparently.`;
      }
      if (this.relType === "stranger") {
        return `Notice the intuitive reflection this person provides; strangers often mirror parts of ourselves needing conscious awareness.`;
      }
      if (this.relType === "mentor") {
        return `Foster open inquiry and reciprocal respect so wisdom flows uninhibited by hierarchy.`;
      }
      return rawAdvice;
    };

    for (const p1 of planets1) {
      for (const p2 of planets2) {
        let diff = Math.abs(p1.longitude - p2.longitude);
        if (diff > 180) diff = 360 - diff;

        for (const def of ASPECTS_DEF) {
          const orbDiff = Math.abs(diff - def.angle);
          if (orbDiff <= def.orb) {
            const key1 = `${p1.name}-${p2.name}-${def.name}`;
            const key2 = `${p2.name}-${p1.name}-${def.name}`;
            const interp = SYNASTRY_INTERPRETATIONS[key1] || SYNASTRY_INTERPRETATIONS[key2] || {
              title: `${p1.name} ${def.name} ${p2.name}`,
              score: def.name === "Trine" || def.name === "Sextile" ? 8.0 : def.name === "Conjunction" ? 8.5 : 5.5,
              category: (["Venus", "Mars"].includes(p1.name) || ["Venus", "Mars"].includes(p2.name))
                ? "Romance & Chemistry"
                : (["Moon"].includes(p1.name) || ["Moon"].includes(p2.name))
                ? "Emotional & Safety"
                : "Growth & Purpose",
              nature: (def.name === "Trine" || def.name === "Sextile"
                ? "Harmonious"
                : def.name === "Square" || def.name === "Opposition"
                ? "Challenging"
                : "Dynamic") as SynastryAspect["nature"],
              description: `A ${def.name.toLowerCase()} dynamic connecting ${this.name1}'s ${p1.name} (${p1.signDegreeFormatted}) and ${this.name2}'s ${p2.name} (${p2.signDegreeFormatted}), weaving their respective drives into mutual relationship awareness.`,
              advice: "Honor each other's inherent differences and communicate openly.",
            };

            const adjustedCategory = getContextCategory(interp.category);
            const adjustedAdvice = getContextAdvice(interp.advice, p1.name, p2.name);

            aspects.push({
              planet1: p1.name,
              planet2: p2.name,
              symbol1: p1.symbol,
              symbol2: p2.symbol,
              aspectName: def.name,
              symbol: def.symbol,
              angle: def.angle,
              orb: Math.round(orbDiff * 100) / 100,
              isApplying: null,
              score: interp.score,
              nature: interp.nature,
              category: adjustedCategory,
              title: interp.title,
              description: interp.description,
              advice: adjustedAdvice,
            });
            break;
          }
        }
      }
    }

    return aspects.sort((a, b) => a.orb - b.orb);
  }

  /**
   * Determine house overlays with relationship-type awareness
   */
  public calculateHouseOverlays(
    fromPlanets: PlanetPosition[],
    toHouses: WesternChartData["houses"],
    actorName: string,
    targetName: string
  ): HouseOverlay[] {
    const overlays: HouseOverlay[] = [];

    const getHouseNum = (lon: number) => {
      for (let i = 0; i < toHouses.length; i++) {
        const cur = toHouses[i].longitude;
        const next = toHouses[(i + 1) % toHouses.length].longitude;
        if (next > cur) {
          if (lon >= cur && lon < next) return i + 1;
        } else {
          if (lon >= cur || lon < next) return i + 1;
        }
      }
      return 1;
    };

    const getMeaning = (houseNum: number): string => {
      const isRomantic = this.relType === "romantic";
      const isFriend = this.relType === "friend";
      const isParent = this.relType === "parent";
      const isStepParent = this.relType === "stepparent";
      const isChild = this.relType === "child";
      const isSibling = this.relType === "sibling";
      const isRelative = this.relType === "relative" || this.relType === "cousin" || isParent || isStepParent || isChild || isSibling;
      const isWork = this.relType === "colleague";
      const isStranger = this.relType === "stranger";

      switch (houseNum) {
        case 1:
          return "Direct personal magnetism. The other person's presence immediately catches your eye and shapes your conscious awareness.";
        case 2:
          return isWork
            ? "Directly touches financial projects, resource allocation, and material productivity."
            : "Touches your sense of security, material resources, and core self-worth.";
        case 3:
          return isSibling
            ? "Quintessential sibling dynamic: energetic banter, shared childhood environments, and continuous communication."
            : isRelative
            ? "Strong family rapport; lively banter, mutual childhood memories, and shared local surroundings."
            : "Activates vibrant conversation, curiosity, and lively mental camaraderie.";
        case 4:
          return isParent
            ? "Sacred parental roots and ancestral hearth. Maternal nurturing, biological lineage memory, and core emotional security foundation."
            : isStepParent
            ? "Blended household harmony. Building earned emotional trust, cultivating mutual respect, and creating a safe domestic sanctuary."
            : isChild
            ? "Parental sheltering instinct. Deep protective care for the child's emotional wellbeing and childhood home foundation."
            : isRelative
            ? "Ancestral roots and home hearth. Deep biological or familial resonance touching the foundation of your family lineage."
            : "Reaches the deepest private root of your emotional hearth, home foundation, and psychological sanctuary.";
        case 5:
          return isParent || isChild
            ? "Pure parent-child joy, recreational celebration, honoring creative self-expression, and healing the inner child."
            : isFriend || isRelative
            ? "Sparks infectious laughter, shared humor, creative playtime, hobbies, and mutual recreation."
            : isWork
            ? "Ignites creative brainstorms, entrepreneurial risk-taking, and innovative presentations."
            : "Ignites romance, playful flirtation, creative sparks, and spontaneous heart joy.";
        case 6:
          return isWork
            ? "High practical synergy in day-to-day work tasks, scheduling, problem-solving, and efficient team execution."
            : isParent || isStepParent
            ? "Day-to-day household care, parental service, healthy family routines, and mutual support in daily life."
            : "Integrates into daily routines, health habits, helpful mutual service, and everyday cooperation.";
        case 7:
          return isRomantic
            ? "The classical partnership angle. You perceive this person as a natural long-term life partner or marriage candidate."
            : isWork
            ? "Strong fiduciary equality and dedicated business co-venture synergy."
            : "A pillar of equal one-on-one bond, mutual commitment, and balanced mirror reflection.";
        case 8:
          return isWork
            ? "Joint financial investments, shared assets, contractual trust, and catalytic corporate transformation."
            : isFriend || isRelative
            ? "Profound emotional trust, secret confidences, and navigating family/personal transformations together."
            : "Profound psychological and physical bonding; catalytic transformation and deep intimacy.";
        case 9:
          return isParent || isStepParent
            ? "Transmitting wisdom, higher values, educational mentorship, moral philosophy, and broadening horizons."
            : "Broadens horizons through shared philosophy, higher learning, worldview exploration, and travel.";
        case 10:
          return isParent
            ? "Parental authority and role modeling. Instills ambition, career standards, discipline, and generational legacy."
            : isStepParent
            ? "Constructive step-parental guidance and life modeling. Earned respect as an adult ally without usurping biological roles."
            : isWork
            ? "Catalyzes career ambition, public reputation, industry status, and professional achievements."
            : "Elevates social standing, public respect, and mutual admiration for life accomplishments.";
        case 11:
          return isFriend
            ? "Quintessential best-friend alignment! Shared social circles, humanitarian ideals, collective dreams, and unconditional acceptance."
            : "Shared progressive visions, social communities, community impact, and future hopes.";
        case 12:
          return isStranger
            ? "A sudden or familiar-feeling encounter; some astrologers associate this with past-life symbolism, but it is not evidence of a prior connection."
            : "Subconscious soul-merging, dream telepathy, unspoken empathy, and spiritual transcendence.";
        default:
          return "Active astrological house overlay.";
      }
    };

    for (const p of fromPlanets.filter((p) =>
      ["Sun", "Moon", "Venus", "Mars", "Jupiter", "Saturn"].includes(p.name)
    )) {
      const houseNum = getHouseNum(p.longitude);
      overlays.push({
        personPlanet: p.name,
        symbol: p.symbol,
        partnerHouse: houseNum,
        interpretation: `${actorName}'s ${p.name} falls in ${targetName}'s ${houseNum}th House: ${getMeaning(houseNum)}`,
      });
    }

    return overlays;
  }

  /**
   * Compute scores across customized psychological dimensions + overall weighted score
   */
  public computeCompatibilityScores(aspects: SynastryAspect[]): CompatibilityScores {
    let emotionalTotal = 70;
    let mentalTotal = 70;
    let physicalTotal = 70;
    let communicationTotal = 70;
    let valuesTotal = 70;
    let saturnTotal = 70;

    aspects.forEach((asp) => {
      const isHarmonious = asp.nature === "Harmonious";
      const isChallenging = asp.nature === "Challenging";
      const weight = Math.max(1, (8 - asp.orb) * 1.5);

      // Moon contacts
      if (asp.planet1 === "Moon" || asp.planet2 === "Moon") {
        emotionalTotal += isHarmonious ? weight * 2.2 : isChallenging ? -weight * 1.5 : 0;
      }
      // Mercury contacts
      if (asp.planet1 === "Mercury" || asp.planet2 === "Mercury") {
        mentalTotal += isHarmonious ? weight * 2.2 : isChallenging ? -weight * 1.4 : 0;
        communicationTotal += isHarmonious ? weight * 2.0 : isChallenging ? -weight * 1.5 : 0;
      }
      // Venus / Mars / Sun contacts
      if (
        (asp.planet1 === "Venus" && asp.planet2 === "Mars") ||
        (asp.planet1 === "Mars" && asp.planet2 === "Venus") ||
        (asp.planet1 === "Sun" && asp.planet2 === "Venus") ||
        (asp.planet1 === "Sun" && asp.planet2 === "Mars")
      ) {
        physicalTotal += isHarmonious ? weight * 2.6 : isChallenging ? weight * 0.8 : 0;
      }
      // Venus / Jupiter contacts
      if (
        (asp.planet1 === "Venus" && asp.planet2 === "Jupiter") ||
        (asp.planet1 === "Jupiter" && asp.planet2 === "Venus") ||
        (asp.planet1 === "Sun" && asp.planet2 === "Jupiter")
      ) {
        valuesTotal += isHarmonious ? weight * 2.4 : isChallenging ? -weight * 0.8 : 0;
      }
      // Saturn contacts
      if (asp.planet1 === "Saturn" || asp.planet2 === "Saturn") {
        saturnTotal += isHarmonious ? weight * 2.2 : isChallenging ? -weight * 1.2 : 0;
      }
    });

    const clamp = (v: number) => Math.max(25, Math.min(99, Math.round(v)));

    const em = clamp(emotionalTotal);
    const men = clamp(mentalTotal);
    const phys = clamp(physicalTotal);
    const comm = clamp(communicationTotal);
    const val = clamp(valuesTotal);
    const sat = clamp(saturnTotal);

    let overall = 0;
    let dimensions: AffinityDimension[] = [];
    let verdict = "";
    let relationshipContextSummary = "";

    if (this.relType === "parent") {
      overall = Math.round(em * 0.28 + sat * 0.22 + comm * 0.18 + val * 0.16 + men * 0.10 + phys * 0.06);
      dimensions = [
        { key: "emotional", label: "Maternal Hearth & Nurturing (Moon)", val: em, color: "bg-blue-500", description: "Emotional containment, maternal roots, and instinctive parental protection" },
        { key: "guidance", label: "Parental Guidance & Respect (Saturn/Sun)", val: sat, color: "bg-purple-500", description: "Healthy authority, moral structure, discipline, and honoring parental lineage" },
        { key: "comm", label: "Generational Dialogue (Mercury/Moon)", val: comm, color: "bg-cyan-500", description: "Compassionate communication bridging generational perspectives" },
        { key: "values", label: "Family Heritage & Moral Compass (Jupiter)", val: val, color: "bg-emerald-500", description: "Transmitted life principles, ancestral wisdom, and mutual generosity" },
        { key: "mental", label: "Intellectual Encouragement (Mercury)", val: men, color: "bg-amber-500", description: "Educational stimulation, curiosity support, and thoughtful discussions" },
        { key: "boundaries", label: "Autonomous Boundaries (Mars/Sun)", val: phys, color: "bg-rose-500", description: "Respecting the transition from childhood dependency to adult sovereignty" },
      ];
      verdict = overall >= 85 ? "Sacred Parental Pillar & Deep Lineage Blessing" : overall >= 72 ? "Affectionate Parental Bond with Generational Growth" : "Complex Parental Bond with Evolutionary Lessons";
      relationshipContextSummary = `In this sacred parent-child bond, astrology highlights nurturing roots, ancestral heritage, and lifelong guidance. The planetary links show how maternal warmth (Moon) and parental authority (Saturn) nurture the evolving soul into autonomous self-realization (Sun).`;
    } else if (this.relType === "stepparent") {
      overall = Math.round(em * 0.24 + comm * 0.22 + sat * 0.20 + val * 0.18 + men * 0.10 + phys * 0.06);
      dimensions = [
        { key: "trust", label: "Earned Domestic Trust (Moon)", val: em, color: "bg-blue-500", description: "Patience in building comfort, mutual safety, and belonging in the home" },
        { key: "comm", label: "Transparent Household Dialogue (Mercury)", val: comm, color: "bg-cyan-500", description: "Clear, empathetic communication preventing misunderstandings and loyalty tensions" },
        { key: "guidance", label: "Step-Parental Guidance (Saturn)", val: sat, color: "bg-purple-500", description: "Supportive mentor modeling, fair household rules, and earned mutual respect" },
        { key: "values", label: "Blended Family Harmony (Jupiter)", val: val, color: "bg-emerald-500", description: "Uniting different family cultures and traditions into a harmonious shared future" },
        { key: "mental", label: "Casual Rapport & Common Ground (Mercury)", val: men, color: "bg-amber-500", description: "Shared interests, lighthearted banter, and intellectual connection" },
        { key: "boundaries", label: "Patient Grace & Boundaries (Mars/Venus)", val: phys, color: "bg-rose-500", description: "Honoring biological loyalties while cultivating unique, pressure-free bonding" },
      ];
      verdict = overall >= 85 ? "Exemplary Blended Family Alliance & Deep Earned Respect" : overall >= 72 ? "Constructive Step-Parent Bond with Warm Mutual Regard" : "Evolving Step-Parent Dynamic Requiring Patient Boundaries";
      relationshipContextSummary = `In this step-parent dynamic, astrology highlights the beauty of earned belonging. Unlike biological bonds, step-relationships grow through conscious patience, transparent communication, and respecting mutual emotional boundaries without forced expectations.`;
    } else if (this.relType === "child") {
      overall = Math.round(em * 0.28 + sat * 0.20 + comm * 0.20 + val * 0.16 + men * 0.10 + phys * 0.06);
      dimensions = [
        { key: "nurturing", label: "Parental Warmth & Holding (Moon)", val: em, color: "bg-blue-500", description: "Providing emotional safety, unconditional love, and comforting presence" },
        { key: "growth", label: "Self-Actualization & Talents (Sun/Jupiter)", val: val, color: "bg-emerald-500", description: "Encouraging the child's interests, talents, autonomy and joy" },
        { key: "comm", label: "Openhearted Listening (Mercury)", val: comm, color: "bg-cyan-500", description: "Creating a safe space where the child expresses feelings without fear" },
        { key: "anchor", label: "Steadfast Anchor & Structure (Saturn)", val: sat, color: "bg-purple-500", description: "Consistent rules and loving boundaries that provide psychological security" },
        { key: "learning", label: "Curiosity & Wonder (Mercury)", val: men, color: "bg-amber-500", description: "Encouraging exploration, education, and lively intellectual curiosity" },
        { key: "individuation", label: "Healthy Individuation (Mars/Sun)", val: phys, color: "bg-rose-500", description: "Supporting the child's independence and unique personality" },
      ];
      verdict = overall >= 85 ? "Profound Loving Devotion & Harmonious Development" : overall >= 72 ? "Loving Parent-Child Connection with Healthy Growth" : "Dynamic Growth Bond with Evolutionary Lessons";
      relationshipContextSummary = `In this parent-child bond, the stars show how parental support empowers the child's soul journey. The chart interaction offers both deep emotional security and the wings to fly.`;
    } else if (this.relType === "sibling") {
      overall = Math.round(comm * 0.24 + men * 0.22 + em * 0.20 + sat * 0.16 + phys * 0.10 + val * 0.08);
      dimensions = [
        { key: "comm", label: "Sibling Dialogue & Banter (Mercury)", val: comm, color: "bg-cyan-500", description: "Unfiltered communication, playful banter, and shared generational language" },
        { key: "mental", label: "Childhood Wavelength (Mercury)", val: men, color: "bg-amber-500", description: "Mutual humor, secret jokes, and matching mental tempo" },
        { key: "emotional", label: "Shared Hearth Roots (Moon)", val: em, color: "bg-blue-500", description: "Growing up under the same roof and instinctive sibling empathy" },
        { key: "loyalty", label: "Lifelong Sibling Alliance (Saturn)", val: sat, color: "bg-purple-500", description: "Defending each other in tough times and staying united through life changes" },
        { key: "sparring", label: "Playful Sparring & Energy (Mars)", val: phys, color: "bg-rose-500", description: "Healthy competition turned into mutual motivation rather than rivalry" },
        { key: "values", label: "Shared Heritage & Ideals (Jupiter)", val: val, color: "bg-emerald-500", description: "Preserving family pride while supporting each other's adult dreams" },
      ];
      verdict = overall >= 85 ? "Unshakeable Sibling Bond & Lifelong Best Allies" : overall >= 72 ? "Affectionate Sibling Camaraderie with Healthy Boundaries" : "Dynamic Sibling Dynamic with Growth in Independence";
      relationshipContextSummary = `In this sibling relationship, celestial midpoints reflect the 3rd-house magic of shared childhood roots and lifelong camaraderie. Learning to honor each other's distinct adult identity deepens the bond.`;
    } else if (this.relType === "friend") {
      overall = Math.round(men * 0.24 + comm * 0.22 + em * 0.2 + sat * 0.16 + phys * 0.1 + val * 0.08);
      dimensions = [
        { key: "mental", label: "Intellectual Rapport (Mercury)", val: men, color: "bg-amber-500", description: "Shared curiosity, humor, and easy conversational flow" },
        { key: "comm", label: "Transparent Dialogue", val: comm, color: "bg-cyan-500", description: "Honest communication without pretense or fear of judgment" },
        { key: "emotional", label: "Emotional Trust & Safety (Moon)", val: em, color: "bg-blue-500", description: "Mutual loyalty and knowing you have each other's back" },
        { key: "loyalty", label: "Enduring Loyalty (Saturn)", val: sat, color: "bg-purple-500", description: "Steadfast friendship that withstands time, distance, and life changes" },
        { key: "fun", label: "Shared Sparks & Fun (Sun/Mars)", val: phys, color: "bg-rose-500", description: "Spontaneous playtime, adventures, and infectious enthusiasm" },
        { key: "values", label: "Shared Ideals & Ethics (Jupiter)", val: val, color: "bg-emerald-500", description: "Aligned personal philosophies and mutual encouragement" },
      ];
      verdict = overall >= 85 ? "Golden Soul Friendship & Lifelong Camaraderie" : overall >= 72 ? "Vibrant Mutual Trust & Inspiring Companionship" : "Dynamic Friendship with Differing Rhythms";
      relationshipContextSummary = `As friends, your charts foster strong mental camaraderie and shared laughter. Planetary contacts stimulate mutual loyalty, allowing both of you to be authentic without societal masks.`;
    } else if (this.relType === "relative" || this.relType === "cousin") {
      overall = Math.round(em * 0.26 + sat * 0.22 + comm * 0.2 + val * 0.14 + men * 0.1 + phys * 0.08);
      const isCousin = this.relType === "cousin";
      dimensions = [
        { key: "emotional", label: "Ancestral Hearth (Moon)", val: em, color: "bg-blue-500", description: "Familial comfort, domestic sanctuary, and instinctive kinship empathy" },
        { key: "duty", label: "Kinship Duty & Roots (Saturn)", val: sat, color: "bg-purple-500", description: "Lifelong family loyalty, mutual responsibility, and respect for elder lineage" },
        { key: "comm", label: "Family Dialogue & Understanding", val: comm, color: "bg-cyan-500", description: "Healthy expression of thoughts across generational perspectives" },
        { key: "values", label: "Ancestral Values & Honor (Jupiter)", val: val, color: "bg-emerald-500", description: "Shared moral compass, family heritage pride, and generous mutual support" },
        { key: "mental", label: "Generational Rapport (Mercury)", val: men, color: "bg-amber-500", description: "Shared childhood stories, family news, and cultural wavelength" },
        { key: "vitality", label: "Household Harmony (Mars/Sun)", val: phys, color: "bg-rose-500", description: "Respecting boundaries and maintaining peace during family gatherings" },
      ];
      verdict = overall >= 85 ? (isCousin ? "Exceptional Cousin Bond & Lifelong Ally" : "Deep Ancestral Kinship & Family Pillar") : (isCousin ? "Affectionate Kinship with Growth in Boundaries" : "Close Family Bond with Evolutionary Lessons");
      relationshipContextSummary = `In this family/cousin bond, the celestial aspects weave ancestral memories with personal growth. The planetary links provide mutual support while encouraging healthy personal autonomy.`;
    } else if (this.relType === "colleague") {
      overall = Math.round(men * 0.25 + sat * 0.22 + comm * 0.22 + val * 0.15 + phys * 0.1 + em * 0.06);
      dimensions = [
        { key: "mental", label: "Strategic Intellect (Mercury)", val: men, color: "bg-amber-500", description: "Complementary problem-solving, sharp analysis, and project planning" },
        { key: "reliability", label: "Fiduciary Trust & Duty (Saturn)", val: sat, color: "bg-purple-500", description: "Meeting deadlines, honoring contracts, and long-term organizational reliability" },
        { key: "comm", label: "Professional Clarity (Mercury/Moon)", val: comm, color: "bg-cyan-500", description: "Direct, transparent business communication without ambiguity" },
        { key: "ethics", label: "Business Ethics & Vision (Jupiter)", val: val, color: "bg-emerald-500", description: "Aligned professional standards, commercial vision, and fair dealings" },
        { key: "drive", label: "Work Ethic & Execution (Mars)", val: phys, color: "bg-rose-500", description: "Shared drive to execute milestones and deliver high-impact results" },
        { key: "stress", label: "Equanimity Under Pressure (Moon)", val: em, color: "bg-blue-500", description: "Maintaining emotional balance during crunch times and setbacks" },
      ];
      verdict = overall >= 85 ? "High-Impact Commercial Synergy & Trusted Partnership" : overall >= 72 ? "Strong Professional Alignment & Collaborative Drive" : "Viable Work Relationship Requiring Explicit Boundaries";
      relationshipContextSummary = `In a professional context, your planetary midpoints and aspects create a sharp, results-oriented dynamic. Strategic planning and clear task delegation maximize this connection's success.`;
    } else if (this.relType === "stranger") {
      overall = Math.round(men * 0.24 + phys * 0.2 + comm * 0.2 + em * 0.16 + sat * 0.1 + val * 0.1);
      dimensions = [
        { key: "vibe", label: "Instant Resonance & Vibe (Moon)", val: em, color: "bg-blue-500", description: "Spontaneous intuitive comfort despite knowing little about each other" },
        { key: "spark", label: "Energetic Magnetism (Mars/Sun)", val: phys, color: "bg-rose-500", description: "The sudden spark that makes this passing encounter memorable" },
        { key: "curiosity", label: "Intellectual Intrigue (Mercury)", val: men, color: "bg-amber-500", description: "Curiosity to learn who this person is and what they represent" },
        { key: "flow", label: "Effortless Dialogue", val: comm, color: "bg-cyan-500", description: "Talking as if you already know each other from another lifetime" },
        { key: "karmic", label: "Synchronicity Node (Saturn)", val: sat, color: "bg-purple-500", description: "A timing or responsibility theme sometimes explored through Saturn symbolism; it is not evidence that an encounter was engineered or fated." },
        { key: "worldview", label: "Philosophical Mirror (Jupiter)", val: val, color: "bg-emerald-500", description: "A serendipitous conversation that offers a fresh perspective on life" },
      ];
      verdict = overall >= 85 ? "Strong Symbolic Resonance & Mutual Curiosity" : overall >= 72 ? "Interesting Encounter with Fresh Perspectives" : "Brief Connection with Different Rhythms";
      relationshipContextSummary = `Meeting as strangers or acquaintances, this synastry shows why the universe brought your paths together. Even a brief interaction can act as a catalyst for new self-awareness.`;
    } else if (this.relType === "mentor") {
      overall = Math.round(men * 0.28 + val * 0.22 + comm * 0.2 + sat * 0.16 + em * 0.08 + phys * 0.06);
      dimensions = [
        { key: "wisdom", label: "Intellectual Mentorship (Mercury)", val: men, color: "bg-amber-500", description: "Knowledge transmission, intellectual depth, and guided discovery" },
        { key: "philosophy", label: "Philosophical Alignment (Jupiter)", val: val, color: "bg-emerald-500", description: "Shared pursuit of truth, moral elevation, and expanding worldview" },
        { key: "guidance", label: "Socratic Dialogue", val: comm, color: "bg-cyan-500", description: "Insightful questioning and active listening between guide and seeker" },
        { key: "impact", label: "Lasting Legacy & Structure (Saturn)", val: sat, color: "bg-purple-500", description: "Disciplined study, practical accountability, and enduring impact" },
        { key: "safety", label: "Psychological Safety (Moon)", val: em, color: "bg-blue-500", description: "A safe space to make mistakes, ask questions, and evolve" },
        { key: "inspiration", label: "Motivational Energy (Mars/Sun)", val: phys, color: "bg-rose-500", description: "Inspiration that sparks ambition and creative action" },
      ];
      verdict = overall >= 85 ? "Master-Level Guiding Light & Profound Mentorship" : "Constructive Educational Rapport & Intellectual Growth";
      relationshipContextSummary = `In a mentor-student bond, planetary placements favor wisdom transfer, mutual respect, and disciplined personal elevation.`;
    } else {
      overall = Math.round(em * 0.22 + phys * 0.2 + men * 0.18 + comm * 0.15 + sat * 0.15 + val * 0.1);
      dimensions = [
        { key: "emotional", label: "Emotional Sanctuary (Moon)", val: em, color: "bg-blue-500", description: "Deep intuitive empathy and psychological vulnerability" },
        { key: "physical", label: "Magnetic Passion (Venus/Mars)", val: phys, color: "bg-rose-500", description: "Erotic attraction, vitality, and physical resonance" },
        { key: "mental", label: "Intellectual Rapport (Mercury)", val: men, color: "bg-amber-500", description: "Mental stimulation and matching conversational tempo" },
        { key: "comm", label: "Intimate Communication", val: comm, color: "bg-cyan-500", description: "Openhearted dialogue and resolving friction with care" },
        { key: "values", label: "Value Harmony & Vision (Jupiter)", val: val, color: "bg-emerald-500", description: "Shared life ideals, moral alignment, and mutual expansion" },
        { key: "longevity", label: "Marital Longevity (Saturn)", val: sat, color: "bg-purple-500", description: "Enduring commitment, shared responsibility, and devotion" },
      ];
      verdict = overall >= 88 ? "Strong Romantic Affinity Themes" : overall >= 78 ? "Prominent Chemistry & Shared Themes" : overall >= 68 ? "Mixed Attraction and Growth Themes" : "Contrasting Patterns Calling for Clear Communication";
      relationshipContextSummary = `This romantic synastry reveals powerful attraction and emotional depth. Planetary alignments offer both thrilling chemistry and the grounding required for enduring partnership.`;
    }

    return {
      emotional: em,
      mental: men,
      physical: phys,
      communication: comm,
      valuesAlignment: val,
      longTermPotential: sat,
      overall,
      verdict,
      dimensions,
      relationshipContextSummary,
    };
  }

  /**
   * Complete Synastry Calculation Pipeline
   */
  public calculateCompleteSynastry(): SynastryReport {
    const interAspects = this.calculateAllInterAspects();
    const p1InP2Houses = this.calculateHouseOverlays(
      this.chart1.planets,
      this.chart2.houses,
      this.name1,
      this.name2
    );
    const p2InP1Houses = this.calculateHouseOverlays(
      this.chart2.planets,
      this.chart1.houses,
      this.name2,
      this.name1
    );
    const scores = this.computeCompatibilityScores(interAspects);

    const strengths: string[] = [];
    const challenges: string[] = [];
    const karmicConnections: KarmicIndicator[] = [];
    const soulmateIndicators: string[] = [];

    interAspects.forEach((a) => {
      if (a.score >= 8.5) {
        strengths.push(`${a.title} (${a.planet1} ${a.symbol} ${a.planet2})`);
      } else if (a.score <= 5.5) {
        challenges.push(`${a.title} (${a.planet1} ${a.symbol} ${a.planet2})`);
      }

      if (a.nature === "Karmic" || a.planet1.includes("Node") || a.planet2.includes("Node")) {
        karmicConnections.push({
          type: "Node Contact",
          description: `${a.planet1} ${a.aspectName} ${a.planet2}: a close nodal contact sometimes interpreted as a karmic theme in modern astrology. This is not evidence of a soul contract or past-life bond.`,
          intensity: a.orb < 2.0 ? "Tight orb" : "Moderate orb",
        });
      }

      if (
        (a.planet1 === "Sun" && a.planet2 === "Moon") ||
        (a.planet1 === "Moon" && a.planet2 === "Sun") ||
        (a.planet1 === "Venus" && a.planet2 === "Mars" && a.aspectName === "Conjunction")
      ) {
        soulmateIndicators.push(`${a.title}: A Sun–Moon or Venus–Mars contact sometimes read as a symbolic affinity theme; it does not establish a soulmate bond.`);
      }
    });

    return {
      interAspects,
      p1InP2Houses,
      p2InP1Houses,
      scores,
      strengths: Array.from(new Set(strengths)).slice(0, 8),
      challenges: Array.from(new Set(challenges)).slice(0, 6),
      karmicConnections,
      soulmateIndicators: Array.from(new Set(soulmateIndicators)),
    };
  }
}

// ---------------------------------------------------------------------------
// 2. COMPOSITE CHART ENGINE (Midpoint Method)
// ---------------------------------------------------------------------------

export interface CompositePlanet {
  name: string;
  symbol: string;
  longitude: number;
  sign: string;
  signDegreeFormatted: string;
  house: number;
  interpretation: string;
}

export interface CompositeChart {
  planets: CompositePlanet[];
  ascendant: CompositePlanet;
  midheaven: CompositePlanet;
  relationshipPurpose: string;
  coreStrengths: string[];
  growthChallenges: string[];
}

export class CompositeChartEngine {
  private calculateMidpoint(lon1: number, lon2: number): number {
    let diff = lon2 - lon1;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return normalizeDegrees(lon1 + diff / 2);
  }

  public calculateComposite(
    chart1: WesternChartData,
    chart2: WesternChartData,
    relType: RelationshipCategory = "romantic"
  ): CompositeChart {
    const compPlanets: CompositePlanet[] = [];

    // Midpoint for Ascendant & Midheaven
    const compAscLon = this.calculateMidpoint(chart1.ascendant.longitude, chart2.ascendant.longitude);
    const compMcLon = this.calculateMidpoint(chart1.midheaven.longitude, chart2.midheaven.longitude);

    // Approximate equal houses from Composite Ascendant for clean house assignments
    const getHouse = (lon: number) => {
      const diff = normalizeDegrees(lon - compAscLon);
      return Math.floor(diff / 30) + 1;
    };

    const makeCompPlanet = (name: string, symbol: string, lon1: number, lon2: number): CompositePlanet => {
      const mid = this.calculateMidpoint(lon1, lon2);
      const signIdx = Math.floor(mid / 30);
      const sign = ZODIAC_SIGNS[signIdx]?.name || "Aries";
      const house = getHouse(mid);

      const INTERPS: Record<string, string> = {
        Sun: relType === "parent"
          ? `The generational anchor and lineage pillar of this bond shines in ${sign} in House ${house}, illuminating parental guidance and individual sovereignty.`
          : relType === "stepparent"
          ? `The blended family vessel centers in ${sign} in House ${house}, building earned respect, domestic support, and conscious mentorship.`
          : relType === "child"
          ? `The nurturing and growth vessel centers in ${sign} in House ${house}, empowering the child's unfolding potential and creative self-expression.`
          : relType === "sibling"
          ? `The sibling alliance and shared generational roots anchor in ${sign} in House ${house}, fostering mutual loyalty and shared memories.`
          : relType === "friend"
          ? `The core identity of this friendship shines in ${sign} in House ${house}, uniting you in shared creative goals and mutual loyalty.`
          : relType === "relative" || relType === "cousin"
          ? `The family pillar and shared roots of this bond anchor in ${sign} in House ${house}, sustaining ancestral continuity.`
          : relType === "colleague"
          ? `The mission and enterprise identity of this collaboration operates through ${sign} in House ${house}, generating tangible career output.`
          : relType === "stranger"
          ? `The synchronicity node of this encounter sparks through ${sign} in House ${house}, presenting a spontaneous mirror.`
          : `The core identity of this relationship thrives in ${sign} in the ${house}th House. You present a united front centered on mutual vitality.`,
        Moon: `The emotional home and heart of the partnership rests in ${sign} in House ${house}. Feeling safe together requires honoring these emotional needs.`,
        Mercury: `The mental wavelength of your bond expresses through ${sign} in House ${house}, stimulating shared plans and collaborative dialogue.`,
        Venus: relType === "colleague"
          ? `The team harmony and shared aesthetic of your work manifests in ${sign} in House ${house}.`
          : `The affection, harmony, and creative beauty of the union blossoms in ${sign} in House ${house}, seeking reciprocal warmth.`,
        Mars: relType === "colleague"
          ? `The commercial drive and executive execution of the collaboration acts through ${sign} in House ${house}.`
          : `The shared drive, passion, and vitality of the relationship acts through ${sign} in House ${house}, generating productive momentum.`,
        Jupiter: `Where the partnership experiences luck, growth, and shared joy: ${sign} in House ${house}.`,
        Saturn: `The foundation of duty, loyalty, and long-term endurance for the union is anchored in ${sign} in House ${house}.`,
      };

      return {
        name,
        symbol,
        longitude: Math.round(mid * 1000) / 1000,
        sign,
        signDegreeFormatted: formatDegreeMinute(mid),
        house,
        interpretation: INTERPS[name] || `Composite ${name} placed in ${sign} in House ${house}.`,
      };
    };

    const coreNames = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"];
    for (const name of coreNames) {
      const p1 = chart1.planets.find((p) => p.name === name);
      const p2 = chart2.planets.find((p) => p.name === name);
      if (p1 && p2) {
        compPlanets.push(makeCompPlanet(name, p1.symbol, p1.longitude, p2.longitude));
      }
    }

    const compAsc = makeCompPlanet("Ascendant", "AC", chart1.ascendant.longitude, chart2.ascendant.longitude);
    const compMc = makeCompPlanet("Midheaven", "MC", chart1.midheaven.longitude, chart2.midheaven.longitude);

    const compSun = compPlanets.find((p) => p.name === "Sun");
    const compMoon = compPlanets.find((p) => p.name === "Moon");

    let purposeText = `The composite chart reveals the third entity created by your union. With Composite Sun in ${compSun?.sign} in House ${compSun?.house} and Composite Moon in ${compMoon?.sign} in House ${compMoon?.house}, this partnership exists to awaken creative sovereignty, mutual sanctuary, and long-term accomplishment.`;
    if (relType === "parent") {
      purposeText = `This Composite midpoint chart illuminates the sacred parent-child entity. With Composite Sun in ${compSun?.sign} (House ${compSun?.house}) and Moon in ${compMoon?.sign} (House ${compMoon?.house}), the core spiritual purpose of your relationship is generational stewardship, emotional containment, and empowering the child's soul to shine with its own sovereign light.`;
    } else if (relType === "stepparent") {
      purposeText = `This Composite midpoint chart embodies the blended family journey. With Composite Sun in ${compSun?.sign} (House ${compSun?.house}) and Moon in ${compMoon?.sign} (House ${compMoon?.house}), your dynamic is purposed around conscious integration, cultivating earned trust, and offering dependable guidance as an ally and guardian.`;
    } else if (relType === "child") {
      purposeText = `This Composite midpoint chart reflects the generational bridge between you and your child. With Composite Sun in ${compSun?.sign} (House ${compSun?.house}) and Moon in ${compMoon?.sign} (House ${compMoon?.house}), your dynamic is purposed around mutual learning, unconditional holding, and fostering healthy individuation.`;
    } else if (relType === "sibling") {
      purposeText = `This Composite midpoint chart captures the sibling alliance. With Composite Sun in ${compSun?.sign} (House ${compSun?.house}) and Moon in ${compMoon?.sign} (House ${compMoon?.house}), your bond preserves shared childhood hearth memories, lively camaraderie, and lifelong mutual backup.`;
    } else if (relType === "friend") {
      purposeText = `This Composite midpoint chart reveals the independent spirit of your friendship. With Composite Sun in ${compSun?.sign} (House ${compSun?.house}) and Moon in ${compMoon?.sign} (House ${compMoon?.house}), your camaraderie is built on mutual authenticity, unconditional encouragement, and shared loyalty.`;
    } else if (relType === "relative" || relType === "cousin") {
      purposeText = `This Composite midpoint chart embodies your shared family lineage. With Composite Sun in ${compSun?.sign} (House ${compSun?.house}) and Moon in ${compMoon?.sign} (House ${compMoon?.house}), your kinship preserves ancestral warmth while fostering mutual respect for individual life journeys.`;
    } else if (relType === "colleague") {
      purposeText = `This Composite chart represents the enterprise vessel of your professional association. With Composite Sun in ${compSun?.sign} (House ${compSun?.house}) and Moon in ${compMoon?.sign} (House ${compMoon?.house}), your collaboration achieves maximum productivity through organized strategy and clear fiduciary responsibility.`;
    } else if (relType === "stranger") {
      purposeText = `This Composite chart reflects the cosmic intersection of two unique timelines meeting at a crossroads. With Composite Sun in ${compSun?.sign} (House ${compSun?.house}), this encounter offers a spark of unexpected clarity and fresh perspective.`;
    }

    return {
      planets: compPlanets,
      ascendant: compAsc,
      midheaven: compMc,
      relationshipPurpose: purposeText,
      coreStrengths: [
        `United purpose in ${compSun?.sign} House ${compSun?.house}`,
        `Shared emotional anchor in ${compMoon?.sign}`,
        `Mutual resonance channeled through composite planetary alignment`,
      ],
      growthChallenges: [
        "Navigating individual autonomy vs relationship expectations",
        "Balancing shared commitments with private personal space",
      ],
    };
  }
}

// ---------------------------------------------------------------------------
// 3. DAVISON RELATIONSHIP CHART (Time-Space Midpoint)
// ---------------------------------------------------------------------------

export interface DavisonPersonInput {
  birthDate: string; // YYYY-MM-DD
  birthTime: string; // HH:MM or HH:MM:SS
  latitude: number;
  longitude: number;
  timezoneOffset?: number; // Numeric UTC offset in decimal hours (e.g. -5 for EST, +5.5 for IST). Defaults to 0 if undefined.
}

export interface DavisonChartResult {
  midpointDate: string; // UTC string (backward-compatible)
  midpointDateUtc: string; // ISO 8601 UTC timestamp
  midpointLmt: string; // Formatted Local Mean Time (LMT) string
  lmtOffsetHours: number; // LMT offset in decimal hours relative to UTC (midLon / 15.0)
  midpointLocation: { latitude: number; longitude: number; label: string };
  chartData: WesternChartData;
  interpretation: string;
}

/**
 * Converts a person's local birth date, time, and timezone offset to a precise UTC timestamp (in milliseconds).
 * Accounts for date rollovers, month/year boundaries, leap years, and fractional offsets.
 */
function parsePersonToUtcMs(
  birthDate: string,
  birthTime: string,
  timezoneOffsetHours: number = 0
): number {
  const [year, month, day] = birthDate.split("-").map(Number);
  const timeParts = birthTime.split(":").map(Number);
  const hour = timeParts[0] || 0;
  const minute = timeParts[1] || 0;
  const second = timeParts[2] || 0;

  const { utcYear, utcMonth, utcDay, utcDecimalHour } = swissEphemeris.normalizeLocalToUTC(
    year,
    month,
    day,
    hour,
    minute,
    second,
    timezoneOffsetHours
  );

  const baseDate = new Date(Date.UTC(utcYear, utcMonth - 1, utcDay, 0, 0, 0, 0));
  if (utcYear >= 0 && utcYear <= 99) {
    baseDate.setUTCFullYear(utcYear);
  }

  const msInDay = Math.round(utcDecimalHour * 3600 * 1000);
  return baseDate.getTime() + msInDay;
}

export class DavisonChartEngine {
  public calculateDavison(
    person1: DavisonPersonInput,
    person2: DavisonPersonInput
  ): DavisonChartResult {
    // 1. Timezone-normalized UTC birth instants (in ms)
    const tz1 = person1.timezoneOffset ?? 0;
    const tz2 = person2.timezoneOffset ?? 0;
    const time1 = parsePersonToUtcMs(person1.birthDate, person1.birthTime, tz1);
    const time2 = parsePersonToUtcMs(person2.birthDate, person2.birthTime, tz2);

    // 2. Exact Time Midpoint
    const midTimeMs = (time1 + time2) / 2;
    const midDateObj = new Date(midTimeMs);

    const midYear = midDateObj.getUTCFullYear();
    const midMonth = midDateObj.getUTCMonth() + 1;
    const midDay = midDateObj.getUTCDate();
    const midHour = midDateObj.getUTCHours();
    const midMinute = midDateObj.getUTCMinutes();
    const midSecond = midDateObj.getUTCSeconds() + midDateObj.getUTCMilliseconds() / 1000.0;

    // 3. Geographic Midpoint
    // Standard astrological Davison convention: arithmetic mean of latitudes
    let midLat = (person1.latitude + person2.latitude) / 2;
    // Terrestrial latitude clamping [-90, +90]
    midLat = Math.max(-90, Math.min(90, midLat));

    // Shortest angular arc across the sphere, correctly handling the ±180° anti-meridian (Date Line)
    let diff = person2.longitude - person1.longitude;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;

    // Deterministic tie-breaking for exact antipodal longitudes (|diff| == 180°):
    // resolve eastward from person 1
    if (Math.abs(Math.abs(diff) - 180) < 1e-7) {
      diff = 180;
    }

    let midLon = person1.longitude + diff / 2;
    while (midLon > 180) midLon -= 360;
    while (midLon < -180) midLon += 360;

    // 4. Local Mean Time (LMT) at the Midpoint Location
    // Astronomical definition: LMT = UTC + (longitude / 15.0) hours
    const lmtOffsetHours = midLon / 15.0;
    const lmtMs = midTimeMs + lmtOffsetHours * 3600 * 1000;
    const lmtDateObj = new Date(lmtMs);
    const lmtYear = lmtDateObj.getUTCFullYear();
    const lmtMonth = String(lmtDateObj.getUTCMonth() + 1).padStart(2, "0");
    const lmtDay = String(lmtDateObj.getUTCDate()).padStart(2, "0");
    const lmtHour = String(lmtDateObj.getUTCHours()).padStart(2, "0");
    const lmtMinute = String(lmtDateObj.getUTCMinutes()).padStart(2, "0");
    const lmtSecond = String(lmtDateObj.getUTCSeconds()).padStart(2, "0");

    const sign = lmtOffsetHours >= 0 ? "+" : "-";
    const absOffset = Math.abs(lmtOffsetHours);
    const offH = Math.floor(absOffset);
    const offM = Math.round((absOffset - offH) * 60);
    const offStr = `${sign}${String(offH).padStart(2, "0")}:${String(offM).padStart(2, "0")}`;
    const midpointLmt = `${lmtYear}-${lmtMonth}-${lmtDay} ${lmtHour}:${lmtMinute}:${lmtSecond} LMT (UTC${offStr})`;

    // 5. High-precision Western Natal Chart for the Midpoint Event
    // Because midYear..midSecond are already strictly in UTC, timezoneOffsetHours is passed as 0
    const chartData = calculateWesternChart(
      midYear,
      midMonth,
      midDay,
      midHour,
      midMinute,
      midLat,
      midLon,
      0, // UTC
      "Placidus",
      midSecond
    );

    const dateFormatted = midDateObj.toUTCString();
    const midpointDateUtc = midDateObj.toISOString();

    return {
      midpointDate: dateFormatted,
      midpointDateUtc,
      midpointLmt,
      lmtOffsetHours,
      midpointLocation: {
        latitude: Math.round(midLat * 100) / 100,
        longitude: Math.round(midLon * 100) / 100,
        label: `${Math.abs(midLat).toFixed(2)}°${midLat >= 0 ? "N" : "S"}, ${Math.abs(midLon).toFixed(2)}°${midLon >= 0 ? "E" : "W"}`,
      },
      chartData,
      interpretation: `The Davison Relationship Chart casts an actual astronomical event at the precise physical midpoint in time (${dateFormatted}) and terrestrial space. Unlike the Composite chart which uses mathematical planetary midpoints, the Davison chart represents the tangible incarnation of your relationship in the space-time continuum.`,
    };
  }
}
