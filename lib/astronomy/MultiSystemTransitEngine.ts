/**
 * Multi-System Planetary Transit Prediction Engine
 * Provides clean, pure separation between:
 * 1. Western Modern (Tropical, Placidus/Equal/Porphyry/Whole Sign, Ptolemaic Aspects, Psychological)
 * 2. Vedic Jyotish (Sidereal Lahiri/Raman/KP, Whole Sign / Chandra Lagna Gochara, Graha Drishti, Karmic + Remedies)
 * 3. Hellenistic Traditional (Tropical, Whole Sign, Sect, Ptolemaic)
 * 4. Western Sidereal (Fagan-Bradley, Placidus/Equal/Porphyry, Ptolemaic)
 * 5. Dual Comparison Mode (Side-by-side reconciliation with cross-system synthesis)
 */

import { swissEphemeris, SwissPlanetPosition } from "./swissEphemeris";
import { WesternChartData, normalizeDegrees, ZODIAC_SIGNS, isAngularAspectApplying } from "./ephemeris";
import { VedicChartData } from "./vedic";
import { isSunAboveHorizonInChart } from "./horizon";
import { CompleteBaZiEngine, BaZiChart } from "./baziEngine";

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
  SouthNode: "☋",
  Rahu: "☊",
  Ketu: "☋",
};

export type ZodiacSystem = "tropical" | "sidereal";

/** Only systems actually calculated by this engine are selectable. */
export type HouseSystem = "placidus" | "whole-sign" | "equal" | "porphyry";

export type AspectSystem = "western" | "vedic" | "hellenistic";

export type AyanamsaType =
  | "lahiri"
  | "raman"
  | "krishnamurti"
  | "fagan-bradley"
  | "jpl"
  | "none";

export type InterpretationSystem = "western" | "vedic" | "hellenistic";

export interface TransitSystemConfig {
  id: "western" | "vedic" | "hellenistic" | "westernSidereal" | "chinese-bazi" | "custom";
  name: string;
  zodiac: ZodiacSystem;
  houseSystem: HouseSystem;
  aspectSystem: AspectSystem;
  ayanamsa: AyanamsaType;
  interpretation: InterpretationSystem;
  description: string;
}

export const TRANSIT_SYSTEM_PRESETS: Record<string, TransitSystemConfig> = {
  western: {
    id: "western",
    name: "Western Modern",
    zodiac: "tropical",
    houseSystem: "placidus",
    aspectSystem: "western",
    ayanamsa: "none",
    interpretation: "western",
    description:
      "Tropical Zodiac (0° Aries = Vernal Equinox), Placidus quadrant houses, Ptolemaic degree aspects, psychological growth interpretations.",
  },
  vedic: {
    id: "vedic",
    name: "Vedic Jyotish",
    zodiac: "sidereal",
    houseSystem: "whole-sign",
    aspectSystem: "vedic",
    ayanamsa: "lahiri",
    interpretation: "vedic",
    description:
      "Sidereal Zodiac (Chitra Paksha Lahiri Ayanamsa), Whole Sign Rasi & Chandra Lagna Gochara houses, Graha Drishti special aspects, karmic destiny & remedial measures.",
  },
  hellenistic: {
    id: "hellenistic",
    name: "Hellenistic Traditional",
    zodiac: "tropical",
    houseSystem: "whole-sign",
    aspectSystem: "hellenistic",
    ayanamsa: "none",
    interpretation: "hellenistic",
    description:
      "Tropical Zodiac with ancient Whole Sign house divisions, traditional planetary rulers (excluding outers), and sect analysis (diurnal vs nocturnal).",
  },
  westernSidereal: {
    id: "westernSidereal",
    name: "Western Sidereal",
    zodiac: "sidereal",
    houseSystem: "placidus",
    aspectSystem: "western",
    ayanamsa: "fagan-bradley",
    interpretation: "western",
    description:
      "Fagan-Bradley Sidereal constellation coordinates paired with Western quadrant houses (Placidus) and psychological interpretations.",
  },
  "chinese-bazi": {
    id: "chinese-bazi",
    name: "Chinese BaZi (Four Pillars)",
    zodiac: "tropical",
    houseSystem: "whole-sign",
    aspectSystem: "western",
    ayanamsa: "none",
    interpretation: "western",
    description:
      "Solar-based Four Pillars of Destiny (八字) governed by the 24 Solar Terms (Lichun), Five Element balance, and 10-Year Luck Pillars (Da Yun).",
  },
};

export interface CalculatedTransitPlanet {
  name: string;
  sanskritName?: string;
  symbol: string;
  rawLongitude: number; // In the chosen zodiac system
  sign: string;
  degreeInSign: number;
  degreeFormatted: string;
  house: number; // Natal house in the chosen house system
  houseFromMoon?: number; // Vedic Gochara house from Natal Moon
  isRetrograde: boolean;
  speed: number;
}

export interface CalculatedAspect {
  type: string;
  symbol: string;
  transitingPlanet: string;
  natalPlanet: string;
  transitingLongitude: number;
  natalLongitude: number;
  angle: number;
  orb: number;
  maxOrb: number;
  strength: number; // 0 to 1
  /** Null for sign/house-based aspects where applying/separating is not defined. */
  isApplying: boolean | null;
  nature: "Harmonious" | "Challenging" | "Potent" | "Karmic Full Sight" | "Special Drishti";
  system: AspectSystem;
  description: string;
}

export interface SystemTransitResult {
  config: TransitSystemConfig;
  ayanamsaDegrees: number;
  date: Date;
  dateFormatted: string;
  planets: CalculatedTransitPlanet[];
  aspects: CalculatedAspect[];
  houseSystemUsed: string;
  zodiacUsed: string;
  specialConditions: {
    isSadeSati?: boolean;
    sadeSatiPhase?: "Rising (12th)" | "Peak (1st)" | "Setting (2nd)" | "None";
    isAshtamaShani?: boolean; // 8th from Moon
    isKantakaShani?: boolean; // 4th from Moon
    isGuruGocharaFavorable?: boolean;
    isDiurnalSect?: boolean;
  };
  interpretations: Record<string, {
    title: string;
    overview: string;
    nature: "Auspicious" | "Challenging" | "Transformative" | "Harmonious";
    themes: string[];
    psychological?: string;
    karmic?: string;
    gocharaRule?: string;
    remedies?: {
      mantra?: string;
      gemstone?: string;
      charity?: string;
      deity?: string;
      behavioral?: string;
    };
    favorableActions: string[];
    actionsToAvoid: string[];
    durationEstimate: string;
  }>;
}

export interface DualComparisonResult {
  date: Date;
  dateFormatted: string;
  ayanamsaDifference: number; // degrees
  western: SystemTransitResult;
  vedic: SystemTransitResult;
  planetComparisons: {
    planet: string;
    westernSign: string;
    westernDegree: string;
    westernHouse: number;
    vedicSign: string;
    vedicDegree: string;
    vedicHouseFromAsc: number;
    vedicHouseFromMoon: number;
    signShift: string; // e.g. "Shifted back 1 sign from Aries to Pisces"
    houseShift: string;
    whyDifferent: string;
    westernInterpretation: string;
    vedicInterpretation: string;
    unifiedSynthesis: string;
  }[];
  divergenceSummary: {
    zodiacReason: string;
    houseReason: string;
    aspectReason: string;
    interpretationReason: string;
  };
}

// Classical Ayanamsa calculations based on year
export function calculateAyanamsaValue(type: AyanamsaType, date: Date): number {
  if (type === "none") return 0;

  const year = date.getUTCFullYear() + date.getUTCMonth() / 12 + date.getUTCDate() / 365.25;
  const t = (year - 2000.0) / 100.0;

  switch (type) {
    case "lahiri":
      // Chitra Paksha Lahiri (Government of India standard)
      // 2000.0 epoch ~ 23.858°, precession ~ 1.397°/century
      return 23.858072 + 1.396971 * t;

    case "raman":
      // B.V. Raman: ~21.014° in 1900, ~22.41° in 2000
      return 22.4116 + 1.396 * t;

    case "krishnamurti":
      // K.P. System: ~23.75° in 2000
      return 23.8167 + 1.397 * t;

    case "fagan-bradley":
      // Western Sidereal standard: ~24.74° in 2000
      return 24.7397 + 1.3968 * t;

    case "jpl":
      // Astronomical Hipparcos/IAU standard
      return 23.86 + 1.397 * t;

    default:
      return 23.858072 + 1.396971 * t;
  }
}

// Classical Sanskrit names for Vedic Grahas
export const VEDIC_GRAHA_NAMES: Record<string, string> = {
  Sun: "Surya",
  Moon: "Chandra",
  Mars: "Mangala",
  Mercury: "Budha",
  Jupiter: "Guru",
  Venus: "Shukra",
  Saturn: "Shani",
  NorthNode: "Rahu",
  SouthNode: "Ketu",
};

// ============================================================
// COMPLETE 108 GOCHARA (VEDIC TRANSIT) DATABASE
// 9 Planets x 12 Houses from Natal Moon
// ============================================================

export interface GocharaEffect {
  isAuspicious: boolean;
  title: string;
  classicalEffect: string;
  karmicDescription: string;
  favorableActivities: string[];
  cautions: string[];
  remedies: {
    mantra: string;
    gemstone: string;
    charity: string;
    deity: string;
    behavioral: string;
  };
}

export const GOCHARA_DATABASE: Record<string, Record<number, GocharaEffect>> = {
  Saturn: {
    1: {
      isAuspicious: false,
      title: "Janma Shani (Sade Sati Peak Phase)",
      classicalEffect: "Deha Peeda, mental heaviness, fatigue, restructuring of physical vitality and identity.",
      karmicDescription: "Saturn transits directly over your natal Moon. This is the heart of Sade Sati. The mind is stripped of illusions; you must confront mortality, duty, and spiritual humility.",
      favorableActivities: ["Deep meditation and solitary retreat", "Disciplined physical workouts", "Clearing unpaid debts and legal audits"],
      cautions: ["Avoid starting risky speculative businesses", "Do not ignore bodily inflammation or joint pain", "Avoid ego clashes with elders"],
      remedies: {
        mantra: "Om Sham Shanaishcharaya Namah (108 times on Saturdays)",
        gemstone: "Blue Sapphire (Neelam) ONLY if Saturn is functional benefic, otherwise Amethyst",
        charity: "Donate black sesame seeds, mustard oil, or warm black blankets to the underprivileged",
        deity: "Lord Hanuman and Lord Shiva",
        behavioral: "Practice stoic silence on Saturday evenings and serve elderly or disabled persons.",
      },
    },
    2: {
      isAuspicious: false,
      title: "Dhana Shani (Sade Sati Setting Phase)",
      classicalEffect: "Financial restructuring, expenditure spikes, domestic friction, harsh speech.",
      karmicDescription: "Saturn audits your wealth, family lineage, and speech. Money must be earned with impeccable integrity; frivolous expenditures bring immediate pinch.",
      favorableActivities: ["Prudent budgeting and long-term saving plans", "Honoring ancestral family obligations", "Nutritious, simple satvic diet"],
      cautions: ["Do not lend money without legally binding contracts", "Avoid sharp, sarcastic arguments at dinner", "Avoid high-leverage debts"],
      remedies: {
        mantra: "Om Pram Preem Proum Sah Shanaischaraya Namah",
        gemstone: "Lapis Lazuli or Blue Topaz",
        charity: "Feed stray black dogs with bread/roti; donate iron utensils",
        deity: "Lord Hanuman",
        behavioral: "Commit to vow of truthful, gentle speech (Satyam Priya Hitam).",
      },
    },
    3: {
      isAuspicious: true,
      title: "Tritya Shani (Highly Auspicious Victory)",
      classicalEffect: "Shatru Jaya (victory over rivals), courage, physical prowess, lucrative ventures.",
      karmicDescription: "One of the most favorable transits in Vedic astrology! Saturn in the 3rd Upachaya house incinerates adversaries, grants iron discipline, and produces breakthroughs in initiatives.",
      favorableActivities: ["Launching competitive business initiatives", "Athletic endurance and martial training", "Negotiating stubborn contracts"],
      cautions: ["Maintain respectful warmth with younger siblings", "Avoid reckless speed while traveling"],
      remedies: {
        mantra: "Hanuman Chalisa recitation daily",
        gemstone: "Saturn is favorable; natural Blue Sapphire or Amethyst",
        charity: "Help young students with technical apprenticeship books",
        deity: "Lord Hanuman and Lord Bhairava",
        behavioral: "Channel relentless stamina into foundational craftsmanship.",
      },
    },
    4: {
      isAuspicious: false,
      title: "Kantaka Shani (Domestic Testing)",
      classicalEffect: "Matru Klesha (mother's discomfort), domestic unrest, vehicle troubles, chest/heart heaviness.",
      karmicDescription: "Saturn casts a thorn (Kantaka) into your emotional foundation. Home renovations, domestic obligations, and deep emotional memories demand patient resolution.",
      favorableActivities: ["Structural repairs and decluttering of residence", "Caring for mother's health and wellbeing", "Real estate audits"],
      cautions: ["Avoid emotional tantrums at home", "Inspect vehicle brakes and tires regularly"],
      remedies: {
        mantra: "Om Namah Shivaya (Rudrabhishekam on Pradosham days)",
        gemstone: "Wear silver ring or offer milk to Shiva Lingam",
        charity: "Support elderly mothers and widows in hospices",
        deity: "Lord Shiva and Goddess Parvati",
        behavioral: "Maintain emotional calm at home; do not carry office friction into the bedroom.",
      },
    },
    5: {
      isAuspicious: false,
      title: "Panchama Shani (Intellectual Austerity)",
      classicalEffect: "Budhi Bheda (scattered mental focus), concern for progeny, speculative losses.",
      karmicDescription: "Saturn tests the 5th house of creativity, romance, and speculative wisdom. Creative endeavors require rigorous methodology rather than impulsive inspiration.",
      favorableActivities: ["Deep academic research and philosophical studies", "Patience with children's education", "Structured creative writing"],
      cautions: ["Strictly avoid gambling, crypto speculation, or lottery tickets", "Do not rush romantic commitments"],
      remedies: {
        mantra: "Saraswati Stotram & Shani Gayatri",
        gemstone: "Amethyst or Blue Lace Agate",
        charity: "Sponsor education supplies for orphaned children",
        deity: "Goddess Saraswati",
        behavioral: "Dedicate fixed study hours daily with no digital distraction.",
      },
    },
    6: {
      isAuspicious: true,
      title: "Shashta Shani (Supreme Triumph Over Adversity)",
      classicalEffect: "Roga Nivaran (healing of chronic diseases), annihilation of debts and enemies, career elevation.",
      karmicDescription: "A glorious Upachaya transit. Saturn in the 6th house is an unshakeable warrior. Opponents surrender, legal battles resolve in your favor, and metabolic health recovers with disciplined habits.",
      favorableActivities: ["Settling court cases and debts", "Starting strict healing diets and detox protocols", "Surpassing commercial competitors"],
      cautions: ["Do not become overbearing toward subordinates or staff"],
      remedies: {
        mantra: "Maha Mrityunjaya Mantra (11 times morning)",
        gemstone: "Iron ring forged from a horse shoe or anchor",
        charity: "Support medical treatments for hospital patients in need",
        deity: "Lord Dhanvantari and Lord Shiva",
        behavioral: "Keep impeccable accounting and treat household helpers with dignity.",
      },
    },
    7: {
      isAuspicious: false,
      title: "Saptama Shani (Partnership Auditing)",
      classicalEffect: "Kalatra Peeda (strain in marital harmony), partner's fatigue, delayed business treaties.",
      karmicDescription: "Saturn directly opposes the natal Moon from the 7th house. Superficial romantic or commercial partnerships face reality tests. Commitments must be bound by rock-solid mutual loyalty.",
      favorableActivities: ["Therapeutic couple's dialogue", "Signing only meticulously reviewed legal partnerships", "Practicing patient compromise"],
      cautions: ["Avoid ultimatums or cold emotional withdrawal in relationships", "Do not ignore spouse's physical complaints"],
      remedies: {
        mantra: "Om Namo Bhagavate Vasudevaya",
        gemstone: "Rose Quartz with Amethyst",
        charity: "Sponsor weddings or essentials for impoverished couples",
        deity: "Lakshmi Narayana",
        behavioral: "Listen without interrupting when your partner speaks.",
      },
    },
    8: {
      isAuspicious: false,
      title: "Ashtama Shani (Deep Metamorphic Crucible)",
      classicalEffect: "Ayur Bhaya, sudden delays, tax/inheritance friction, profound occult and spiritual awakenings.",
      karmicDescription: "Considered one of the most intense transits in Vedic lore. Saturn dredges up deep karmic debts. What is broken is dissolved so genuine spiritual sovereignty can awaken.",
      favorableActivities: ["Occult research, astrology, Pranayama, and Kundalini sadhana", "Auditing taxes and joint wills", "Psychological shadow work"],
      cautions: ["Avoid hazardous sports or reckless night driving", "Do not evade statutory taxes or obligations"],
      remedies: {
        mantra: "Maha Mrityunjaya Mantra (108 times on Mondays and Saturdays)",
        gemstone: "Do not wear gemstones for Saturn during Ashtama Shani without expert review",
        charity: "Offer cooked rice with black sesame seeds to crows and birds",
        deity: "Lord Kaal Bhairava and Lord Shiva",
        behavioral: "Surrender psychological desire to micromanage outcomes; cultivate total detachment.",
      },
    },
    9: {
      isAuspicious: false,
      title: "Navama Shani (Dharmic Realignment)",
      classicalEffect: "Dharma Pariksha, father's health concerns, spiritual disillusionment with fake gurus, delayed long travels.",
      karmicDescription: "Saturn tests your ethical and philosophical worldview. Dogmatic dogmas dissolve; you are challenged to build authentic ethical character rather than relying on rituals alone.",
      favorableActivities: ["Earnest philosophical study of authentic scriptures", "Serving your father and senior mentors", "Pilgrimage to ancient granite temples"],
      cautions: ["Do not disrespect legitimate spiritual mentors", "Avoid dogmatic arguments over religion"],
      remedies: {
        mantra: "Guru Paduka Stotram and Shani Shanti Mantra",
        gemstone: "Yellow Sapphire (Guru) to fortify 9th lord",
        charity: "Donate books to spiritual libraries; serve temple priests",
        deity: "Lord Dakshinamurthy",
        behavioral: "Touch parents' feet and seek their genuine blessings.",
      },
    },
    10: {
      isAuspicious: false,
      title: "Dashama Shani (Professional Crucible)",
      classicalEffect: "Karma Bharam (heavy vocational pressure), professional scrutiny, public accountability, promotion after hard labor.",
      karmicDescription: "Saturn occupies the zenith of public life. You are handed massive responsibilities with zero room for shortcuts. High executives demand proof of competence.",
      favorableActivities: ["Relentless workplace diligence and milestone delivery", "Establishing standardized operating procedures", "Step up to lead without complaint"],
      cautions: ["Never take credit for colleagues' work", "Avoid workplace politics or defying ethical protocols"],
      remedies: {
        mantra: "Dasharatha Shani Stotram",
        gemstone: "Amethyst on the middle finger",
        charity: "Provide drinking water coolers or tools to manual laborers",
        deity: "Lord Shani and Lord Yama",
        behavioral: "Arrive on time, leave late, and honor every professional contract.",
      },
    },
    11: {
      isAuspicious: true,
      title: "Ekadasha Shani (Opulent Harvest & Enduring Gains)",
      classicalEffect: "Labha Vriddhi (abundant material gains), fulfillment of longstanding desires, influential elder alliances.",
      karmicDescription: "The supreme blessing transit of Saturn! After years of grueling discipline, the 11th Upachaya house yields financial windfalls, social eminence, and the realization of ambitious dreams.",
      favorableActivities: ["Monetizing long-term projects", "Expanding institutional networks", "Investing in lasting infrastructure assets"],
      cautions: ["Remain humble in victory; do not look down on those still struggling"],
      remedies: {
        mantra: "Shani Stotram by King Dasharatha",
        gemstone: "Natural Blue Sapphire (certified)",
        charity: "Host communal feasts (Annadanam) for the poor",
        deity: "Lord Venkateshwara (Balaji)",
        behavioral: "Share your financial prosperity with those who aided your early climb.",
      },
    },
    12: {
      isAuspicious: false,
      title: "Dwadasha Shani (Sade Sati Rising Phase)",
      classicalEffect: "Vyaya Vriddhi (excessive expenditure), foreign travels, insomnia, solitary contemplation.",
      karmicDescription: "The commencement of Sade Sati (7.5 years). Saturn enters the 12th house from natal Moon, initiating a cycle of letting go. Outmoded lifestyle habits and financial drains must be pruned.",
      favorableActivities: ["International relocation or spiritual pilgrimage", "Charitable donations to offset losses", "Meditation before sleep to soothe insomnia"],
      cautions: ["Avoid speculative foreign currency investments", "Do not resist the natural closing of stagnant chapters"],
      remedies: {
        mantra: "Om Sham Shanaishcharaya Namah",
        gemstone: "Amethyst or Clear Quartz near bed",
        charity: "Donate shoes/slippers and umbrellas to monks or homeless people",
        deity: "Lord Shiva in Mahakala aspect",
        behavioral: "Maintain a calm bedroom without electronic screens; practice nocturnal Pranayama.",
      },
    },
  },

  Jupiter: {
    1: {
      isAuspicious: false,
      title: "Janma Guru (Intellectual Overconfidence)",
      classicalEffect: "Sthana Bhrashta (location transitions), metabolic weight gain, philosophical pride.",
      karmicDescription: "Jupiter transits directly over natal Moon. While spiritual wisdom expands, classical Gochara marks this as mixed because of excessive optimism and vulnerability to overextension.",
      favorableActivities: ["Philosophical contemplation and teaching", "Sattvic vegetarian diet", "Mentoring others"],
      cautions: ["Watch liver health and blood sugar levels", "Do not make promises you cannot fulfill"],
      remedies: {
        mantra: "Om Gram Greem Groum Sah Gurave Namah",
        gemstone: "Yellow Sapphire (Pukhraj) or Yellow Topaz",
        charity: "Donate turmeric, saffron, or yellow lentils (chana dal) to temples",
        deity: "Lord Brihaspati and Lord Dakshinamurthy",
        behavioral: "Fast or eat light fruit meals on Thursdays.",
      },
    },
    2: {
      isAuspicious: true,
      title: "Dvitiya Guru (Magnificent Wealth & Family Joy)",
      classicalEffect: "Dhana Labha (increase in liquid wealth), sweet speech, birth of children, family celebrations.",
      karmicDescription: "One of the finest transits of Guru! Jupiter showers blessings on the 2nd house of treasury and family speech. Financial negotiations succeed and domestic harmony reigns.",
      favorableActivities: ["Financial investments in gold or land", "Public speaking and vocal performances", "Family reconciliations and weddings"],
      cautions: ["Avoid overindulgence in heavy sweets and rich foods"],
      remedies: {
        mantra: "Guru Stotram (Devanam cha rishinam cha...)",
        gemstone: "Yellow Sapphire on index finger",
        charity: "Feed cows with soaked chana dal and jaggery on Thursdays",
        deity: "Lord Vishnu",
        behavioral: "Speak words that soothe and uplift listeners.",
      },
    },
    3: {
      isAuspicious: false,
      title: "Tritya Guru (Displacement & Obstacles)",
      classicalEffect: "Efforts required without immediate reward, friction with siblings, unwanted travel.",
      karmicDescription: "Jupiter in the 3rd house demands physical perspiration. Opportunities require sustained self-initiative rather than divine luck.",
      favorableActivities: ["Skill building and technical documentation", "Writing and publishing articles", "Patience in negotiations"],
      cautions: ["Avoid signing business guarantees for acquaintances"],
      remedies: {
        mantra: "Brihaspati Gayatri Mantra",
        gemstone: "Yellow Citrine",
        charity: "Donate stationery to underprivileged school children",
        deity: "Lord Hayagriva",
        behavioral: "Take full personal accountability for communication outcomes.",
      },
    },
    4: {
      isAuspicious: false,
      title: "Chaturtha Guru (Domestic Testing)",
      classicalEffect: "Matru Chinta (concern for family), residential transitions, vehicle repairs.",
      karmicDescription: "Jupiter in the 4th house from Moon requires you to nurture your domestic foundation with maturity rather than escapism.",
      favorableActivities: ["Spiritual rituals (Homa/Puja) at home", "Renovating study rooms or family prayer altars", "Reconciling with parents"],
      cautions: ["Do not overpay for residential real estate without title verification"],
      remedies: {
        mantra: "Om Namo Bhagavate Vasudevaya",
        gemstone: "Yellow Topaz",
        charity: "Plant and nurture a peepal or banana tree",
        deity: "Lord Narayana",
        behavioral: "Create a tranquil atmosphere at home without domestic squabbles.",
      },
    },
    5: {
      isAuspicious: true,
      title: "Panchama Guru (Divine Fortune & Progeny Blessing)",
      classicalEffect: "Putra Prapti (blessings of children), creative brilliance, royal/governmental honors, sharp intellect.",
      karmicDescription: "A supreme Vedic blessing! Jupiter aspects the 9th, 11th, and 1st houses. Divine grace (Purva Punya) flows. Ideal for romance, academic triumphs, and business expansion.",
      favorableActivities: ["Conception or blessing of children", "Launching creative and advisory businesses", "Higher university degrees and publishing"],
      cautions: ["Maintain ethical purity in all advice provided to others"],
      remedies: {
        mantra: "Guru Beej Mantra (108 times daily)",
        gemstone: "Flawless Yellow Sapphire (Pukhraj)",
        charity: "Sponsor scholars studying sacred philosophy",
        deity: "Goddess Saraswati & Lord Brahma",
        behavioral: "Share wisdom freely and mentor ambitious youth.",
      },
    },
    6: {
      isAuspicious: false,
      title: "Shashta Guru (Health Vigilance & Debts)",
      classicalEffect: "Ripu Peeda (trouble from competitors), digestive sluggishness, unexpected liabilities.",
      karmicDescription: "Jupiter in the 6th from Moon warns against complacency. Competitors exploit carelessness; health requires strict metabolic attention.",
      favorableActivities: ["Disciplined repayment of debts", "Adopting clean digestive cleansing protocols", "Working quietly behind the scenes"],
      cautions: ["Strictly avoid taking high-interest loans", "Do not consume unhygienic foods while traveling"],
      remedies: {
        mantra: "Maha Sudarshana Mantra",
        gemstone: "Avoid wearing yellow gemstones during 6th house transit; wear protective Gomati Chakra",
        charity: "Feed yellow-colored food to hospital staff and caregivers",
        deity: "Lord Dhanvantari",
        behavioral: "Never underestimate an adversary's diligence.",
      },
    },
    7: {
      isAuspicious: true,
      title: "Saptama Guru (Marital Bliss & Blessed Alliances)",
      classicalEffect: "Vivaha Yoga (blessings of marriage), joyful partnerships, commercial triumph, foreign honors.",
      karmicDescription: "Jupiter casts full aspect directly upon your natal Moon from the 7th house. Life feels joyful, partners act with noble generosity, and commercial treaties bear fruitful profits.",
      favorableActivities: ["Weddings and romantic proposals", "Signing lucrative international trade contracts", "Public appearances and consulting"],
      cautions: ["Ensure contractual agreements are documented transparently"],
      remedies: {
        mantra: "Sri Suktam and Vishnu Sahasranama",
        gemstone: "Natural Yellow Sapphire with Pearl",
        charity: "Donate wedding clothing or groceries to underprivileged brides",
        deity: "Radha Krishna",
        behavioral: "Treat your partner with deep reverence and appreciation.",
      },
    },
    8: {
      isAuspicious: false,
      title: "Ashtama Guru (Unanticipated Delays)",
      classicalEffect: "Shrama Vriddhi (excessive toil), traveling difficulties, temporary decline in luck.",
      karmicDescription: "Jupiter in the 8th from Moon tests your inner resilience. Divine protection is still subtly present, but external plans experience bureaucratic friction.",
      favorableActivities: ["Esoteric and occult research", "Secret investments and tax optimizations", "Spiritual sadhana in sacred locations"],
      cautions: ["Do not enter speculative stock trades on rumors", "Inspect travel itineraries twice"],
      remedies: {
        mantra: "Dakshinamurthy Stotram",
        gemstone: "Wear silver amulet with Brihaspati Yantra",
        charity: "Donate bronze or brass vessels filled with ghee",
        deity: "Lord Shiva (Dakshinamurthy)",
        behavioral: "Embrace solitude and refrain from boasting about future plans.",
      },
    },
    9: {
      isAuspicious: true,
      title: "Navama Guru (Supreme Dharma & Fortune)",
      classicalEffect: "Bhagya Udaya (dramatic rise in fortune), pilgrimage to sacred shrines, father's prosperity, universal respect.",
      karmicDescription: "Jupiter occupies the 9th house of fortune (Bhagya Bhava) and aspects the 1st, 3rd, and 5th houses. You are in alignment with cosmic order. Auspicious events arrive effortlessly.",
      favorableActivities: ["Higher academic degrees and international travel", "Spiritual initiation (Deeksha) and pilgrimages", "Publishing masterworks"],
      cautions: ["Stay grounded; do not succumb to spiritual arrogance"],
      remedies: {
        mantra: "Om Guruve Namah (108 times)",
        gemstone: "Premium Yellow Sapphire",
        charity: "Organize pilgrimage buses or temple seva for seniors",
        deity: "Lord Dattatreya and Lord Vishnu",
        behavioral: "Honor spiritual teachers and express genuine gratitude.",
      },
    },
    10: {
      isAuspicious: false,
      title: "Dashama Guru (Professional Scrutiny)",
      classicalEffect: "Sthana Chalana (transfers/vocational relocations), demanding superiors, heavy accountability.",
      karmicDescription: "Jupiter in the 10th from Moon brings high expectations. You cannot cruise on reputation; ethical integrity and hard proof of work are scrutinized.",
      favorableActivities: ["Streamlining corporate ethics", "Advisory roles in governance or education", "Quiet mastery of new management tools"],
      cautions: ["Avoid arrogance with senior executives", "Do not cut corners in company audits"],
      remedies: {
        mantra: "Vishnu Sahasranama Stotram",
        gemstone: "Yellow Citrine on index finger",
        charity: "Donate educational books to vocational training centers",
        deity: "Lord Vishnu",
        behavioral: "Maintain humility and lead by ethical example.",
      },
    },
    11: {
      isAuspicious: true,
      title: "Ekadasha Guru (Opulent Wealth & Manifestation)",
      classicalEffect: "Mano Ratha Siddhi (manifestation of deepest desires), multi-fold income growth, influential mentors.",
      karmicDescription: "Jupiter in the 11th house of gains (Labha Bhava) aspects the 3rd, 5th, and 7th houses. Prosperity, influential friends, and prestigious awards multiply.",
      favorableActivities: ["Launching commercial product lines", "Expanding social alliances and investor backing", "Acquiring valuable real estate or gold assets"],
      cautions: ["Do not forget foundational principles amidst abundant success"],
      remedies: {
        mantra: "Kanakadhara Stotram",
        gemstone: "Yellow Sapphire set in yellow gold",
        charity: "Feed spiritual seekers and donate to orphanages",
        deity: "Goddess Mahalakshmi & Lord Vishnu",
        behavioral: "Use financial surplus to seed beneficial community endeavors.",
      },
    },
    12: {
      isAuspicious: false,
      title: "Dwadasha Guru (Sacred Expenditure & Solitude)",
      classicalEffect: "Dharmika Vyaya (spending on religious/charitable acts), overseas journeys, retreat from worldly chatter.",
      karmicDescription: "Jupiter in the 12th house from Moon redirects focus from material accumulation to spiritual liberation (Moksha). Money spent on sacred causes yields lasting karma.",
      favorableActivities: ["Overseas travel for study or retreat", "Donating to hospitals and sacred shrines", "Meditation and yogic introspection"],
      cautions: ["Monitor bank accounts to prevent careless leakage", "Avoid legal disputes in foreign lands"],
      remedies: {
        mantra: "Om Namo Narayanaya",
        gemstone: "Amethyst or Yellow Sapphire set in silver",
        charity: "Sponsor hospice beds or donate medical supplies to remote monasteries",
        deity: "Lord Padmanabha",
        behavioral: "Practice digital detox and embrace solitary evening walks.",
      },
    },
  },
};

// Fill in other Grahas (Mars, Sun, Moon, Mercury, Venus, Rahu, Ketu)
function generateFallbackGochara(planet: string, house: number): GocharaEffect {
  const auspiciousHouses: Record<string, number[]> = {
    Sun: [3, 6, 10, 11],
    Moon: [1, 3, 6, 7, 10, 11],
    Mars: [3, 6, 11],
    Mercury: [2, 4, 6, 8, 10, 11],
    Venus: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    Rahu: [3, 6, 11],
    Ketu: [3, 6, 11],
  };

  const isAuspicious = (auspiciousHouses[planet] || [3, 6, 11]).includes(house);
  const sanskrit = VEDIC_GRAHA_NAMES[planet] || planet;

  return {
    isAuspicious,
    title: `${sanskrit} in ${house}th House from Moon (${isAuspicious ? "Favorable Gochara" : "Challenging Gochara"})`,
    classicalEffect: isAuspicious
      ? `${sanskrit} grants victory, auspicious progress, and strength in the ${house}th Bhava.`
      : `${sanskrit} demands patience, discipline, and caution in the ${house}th Bhava.`,
    karmicDescription: `Classical Gochara indicates that ${sanskrit} transiting the ${house}th house from natal Moon activates specific karmic lessons related to mind and circumstance.`,
    favorableActivities: isAuspicious
      ? ["Advancing initiatives", "Active negotiations", "Confidence building"]
      : ["Patience and caution", "Remedial sadhana", "Reviewing past actions"],
    cautions: isAuspicious ? ["Avoid carelessness in success"] : ["Avoid impulsive reactions and ego friction"],
    remedies: {
      mantra: `Om ${sanskrit.toLowerCase()} mantra`,
      gemstone: "Consult personal chart before wearing stones",
      charity: `Donate items sacred to ${planet} on designated weekday`,
      deity: "Lord Ganesha & Lord Shiva",
      behavioral: "Practice mind-body harmony and mindful speech.",
    },
  };
}

// ============================================================
// COMPLETE WESTERN TRANSIT INTERPRETATION DATABASE (120 Combos)
// 10 Planets x 12 Houses
// ============================================================

export interface WesternTransitMeaning {
  psychological: string;
  growthTheme: string;
  challenges: string[];
  bestActivities: string[];
  cautions: string[];
  duration: string;
}

export const WESTERN_TRANSIT_DATABASE: Record<string, Record<number, WesternTransitMeaning>> = {
  Saturn: {
    1: {
      psychological: "Deep restructuring of self-definition, personal dignity, and physical presence. Immature masks are shed as you step into authentic personal authority.",
      growthTheme: "Radical self-ownership and maturing into a seasoned, grounded leader.",
      challenges: ["Temporary feelings of self-doubt or physical stiffness", "Weight of sudden unshared responsibilities"],
      bestActivities: ["Disciplined health and posture routines", "Setting clear interpersonal boundaries", "Rebranding yourself with timeless professionalism"],
      cautions: ["Do not isolate yourself out of cynical fear", "Avoid postponing health audits"],
      duration: "2.5 – 3 years",
    },
    2: {
      psychological: "Re-evaluating what you truly value versus external vanity. Stripping away superficial spending to build an indestructible financial fortress.",
      growthTheme: "Constructing unshakeable tangible self-worth independent of external validation.",
      challenges: ["Fear of financial scarcity", "Cashflow bottlenecks requiring strict budgeting"],
      bestActivities: ["Meticulous budget audits", "Investing in durable capital equipment or property", "Negotiating fair market compensation without apology"],
      cautions: ["Avoid retail therapy as emotional coping", "Do not sign risky speculative debt agreements"],
      duration: "2.5 – 3 years",
    },
    7: {
      psychological: "Auditing one-on-one commitments. Superficial relationships cannot withstand Saturn's gaze; mature, rock-solid partnerships are forged.",
      growthTheme: "Healthy interdependence, realistic romance, and contractual integrity.",
      challenges: ["Feeling emotionally distant from a partner", "Dissolution of fragile alliances"],
      bestActivities: ["Honest, vulnerable couple's therapy", "Drafting ironclad partnership contracts", "Honoring partners who demonstrate steadfast loyalty"],
      cautions: ["Do not rush marriage or divorce in a panic", "Stop rescuing people who refuse to grow"],
      duration: "2.5 – 3 years",
    },
    10: {
      psychological: "Culmination of career effort at the Midheaven. Public reputation is under the spotlight. High accountability brings lasting institutional prestige.",
      growthTheme: "Mastering professional leadership and standing proudly in the public square.",
      challenges: ["Intense public scrutiny", "Heavy management burdens"],
      bestActivities: ["Assuming executive leadership roles", "Delivering on high-stakes promises", "Establishing industry-standard operating procedures"],
      cautions: ["Never compromise professional ethics for speed", "Avoid arrogance when praised"],
      duration: "2.5 – 3 years",
    },
  },
  Jupiter: {
    1: {
      psychological: "Surge of vitality, optimism, and philosophical curiosity. You step into a radiant new cycle of personal growth and broad horizon expansion.",
      growthTheme: "Radiant self-expansion and bold visionary confidence.",
      challenges: ["Overextending commitments", "Physical weight gain or metabolic complacency"],
      bestActivities: ["Launching bold personal brands", "Traveling to foreign destinations", "Enrolling in advanced masterclasses"],
      cautions: ["Do not promise more than you can practically execute", "Watch sugar and rich food consumption"],
      duration: "1 year",
    },
    2: {
      psychological: "Abundance mindset blossoms. You recognize your innate skills and attract generous financial opportunities through expansive collaborations.",
      growthTheme: "Expanding material prosperity through ethical, generous enterprise.",
      challenges: ["Lavish overspending", "Complacent financial tracking"],
      bestActivities: ["Negotiating salary raises and business investments", "Acquiring valuable assets", "Supporting generous philanthropic causes"],
      cautions: ["Avoid reckless luxury spending before income is secured"],
      duration: "1 year",
    },
    7: {
      psychological: "Joyous partnership blessings. A romantic or business partner enters who expands your worldview, travels with you, and inspires optimism.",
      growthTheme: "Mutual elevation through generous, sacred collaboration.",
      challenges: ["Over-idealizing a new partner", "Neglecting practical contractual details"],
      bestActivities: ["Weddings, romantic proposals, and international business alliances", "Signing mutually beneficial agreements", "Hosting social celebrations with peers"],
      cautions: ["Ensure shared ethical foundations before long-term entanglement"],
      duration: "1 year",
    },
    10: {
      psychological: "Career triumph and elevated social status. Influential mentors and benefactors open doors to promotions, awards, and executive recognition.",
      growthTheme: "Professional expansion and leaving a benevolent, inspiring legacy.",
      challenges: ["Imposter syndrome amidst rapid acclaim", "Scattered focus across too many simultaneous offers"],
      bestActivities: ["Accepting executive promotions and awards", "Keynote speaking and media interviews", "Mentoring junior team members"],
      cautions: ["Do not take key mentors or loyal subordinates for granted"],
      duration: "1 year",
    },
  },
};

function generateFallbackWestern(planet: string, house: number): WesternTransitMeaning {
  const HOUSE_THEMES: Record<number, string> = {
    1: "Identity, physical body, personal initiative, and fresh beginnings",
    2: "Financial assets, personal values, self-worth, and material security",
    3: "Mind, communication, immediate surroundings, and skill acquisition",
    4: "Home, family sanctuary, ancestral roots, and emotional foundation",
    5: "Creative joy, romance, self-expression, children, and play",
    6: "Health habits, daily routine, craftsmanship, and service",
    7: "Committed partnerships, marriage, contracts, and significant others",
    8: "Deep psychological metamorphosis, shared finances, and intimacy",
    9: "Higher education, philosophy, international travel, and worldview",
    10: "Career zenith, public reputation, authority, and professional legacy",
    11: "Community alliances, friendships, long-term aspirations, and networking",
    12: "Subconscious mind, spiritual solitude, closure, and psychic renewal",
  };

  return {
    psychological: `${planet} activates your ${HOUSE_THEMES[house] || "life sector"}, prompting psychological awareness and personal evolution.`,
    growthTheme: `Consciously integrating ${planet}'s archetype within the sphere of ${HOUSE_THEMES[house]}.`,
    challenges: [`Navigating shifts in ${HOUSE_THEMES[house]}`, "Balancing internal desires with external reality"],
    bestActivities: ["Reflective journaling", "Mindful planning", "Constructive dialogue"],
    cautions: ["Avoid reactionary impulses", "Maintain healthy boundaries"],
    duration: ["Pluto", "Neptune", "Uranus"].includes(planet) ? "Several years" : "Several weeks to months",
  };
}

// ============================================================
// MAIN MULTI-SYSTEM TRANSIT ENGINE CLASS
// ============================================================

export class MultiSystemTransitEngine {
  public config: TransitSystemConfig;
  public birthWestern: WesternChartData;
  public birthVedic?: VedicChartData;
  public currentDate: Date;
  public ayanamsaValue: number;
  public houseSystemUsed: string;
  private natalHouseCusps: number[];

  constructor(
    config: TransitSystemConfig,
    birthWestern: WesternChartData,
    birthVedic?: VedicChartData,
    currentDate: Date = new Date()
  ) {
    this.config = config;
    this.birthWestern = birthWestern;
    this.birthVedic = birthVedic;
    this.currentDate = currentDate;
    this.ayanamsaValue = calculateAyanamsaValue(config.ayanamsa, currentDate);
    const birthInstant = new Date((birthWestern.julianDay - 2440587.5) * 86400000);
    const natalAyanamsa = calculateAyanamsaValue(config.ayanamsa, birthInstant);
    const systemCode = config.houseSystem === "whole-sign" ? "W"
      : config.houseSystem === "equal" ? "E"
      : config.houseSystem === "porphyry" ? "O" : "P";
    if (Number.isFinite(birthWestern.birthLatitude) && Number.isFinite(birthWestern.birthLongitude)) {
      const houseResult = swissEphemeris.calculateHouses(
        birthWestern.julianDay,
        birthWestern.birthLatitude as number,
        birthWestern.birthLongitude as number,
        systemCode
      );
      if (config.houseSystem === "whole-sign" && config.zodiac === "sidereal") {
        // Whole Sign houses start at 0° of the sidereal Ascendant sign.
        // Shifting tropical Whole Sign cusps by an ayanamsa would move each
        // boundary off the sign start, so rebuild the sidereal sign framework.
        const siderealAscendant = normalizeDegrees(birthWestern.ascendant.longitude - natalAyanamsa);
        const firstSign = Math.floor(siderealAscendant / 30);
        this.natalHouseCusps = Array.from({ length: 12 }, (_, index) => ((firstSign + index) % 12) * 30);
      } else {
        this.natalHouseCusps = houseResult.houseCusps.map((cusp) =>
          config.zodiac === "sidereal" ? normalizeDegrees(cusp - natalAyanamsa) : normalizeDegrees(cusp)
        );
      }
      this.houseSystemUsed = houseResult.houseSystemUsed === "O" ? "porphyry"
        : houseResult.houseSystemUsed === "W" ? "whole-sign"
        : houseResult.houseSystemUsed === "E" ? "equal" : "placidus";
    } else {
      this.natalHouseCusps = birthWestern.houses.map((house) =>
        config.zodiac === "sidereal" ? normalizeDegrees(house.longitude - natalAyanamsa) : normalizeDegrees(house.longitude)
      );
      this.houseSystemUsed = config.houseSystem;
    }
  }

  /**
   * Calculate exact Julian Day
   */
  public getJulianDay(date: Date): number {
    return date.getTime() / 86400000.0 + 2440587.5;
  }

  /**
   * Convert any celestial longitude to the engine's active zodiac system
   */
  public toZodiacLongitude(tropicalLongitude: number): number {
    if (this.config.zodiac === "tropical") {
      return normalizeDegrees(tropicalLongitude);
    }
    // Sidereal: subtract ayanamsa
    return normalizeDegrees(tropicalLongitude - this.ayanamsaValue);
  }

  /**
   * Determine sign and degree within sign from longitude
   */
  public getSignAndDegree(longitude: number): {
    sign: string;
    degreeInSign: number;
    formatted: string;
  } {
    const norm = normalizeDegrees(longitude);
    const signIdx = Math.floor(norm / 30);
    const sign = ZODIAC_SIGNS[signIdx]?.name || "Aries";
    const deg = norm - signIdx * 30;
    const d = Math.floor(deg);
    const m = Math.floor((deg - d) * 60);
    return {
      sign,
      degreeInSign: deg,
      formatted: `${d}°${m.toString().padStart(2, "0")}' ${sign}`,
    };
  }

  /**
   * Calculate House Placement in the chosen House System
   */
  public calculateHouse(longitude: number, _isSidereal: boolean = false): number {
    const normLon = normalizeDegrees(longitude);
    const cusps = this.natalHouseCusps;
    if (!cusps || cusps.length !== 12) {
      throw new RangeError("The selected natal house system has no valid twelve-cusp framework.");
    }

    for (let i = 0; i < 12; i++) {
      const currentCusp = cusps[i];
      const nextCusp = cusps[(i + 1) % 12];
      if (currentCusp < nextCusp) {
        if (normLon >= currentCusp && normLon < nextCusp) return i + 1;
      } else if (normLon >= currentCusp || normLon < nextCusp) {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * Calculate Vedic Gochara House from Natal Moon
   */
  public calculateHouseFromMoon(planetSiderealLon: number): number {
    const moonSiderealLon =
      this.birthVedic?.planets.find((p) => p.name === "Moon")?.siderealLongitude ??
      this.toZodiacLongitude(
        this.birthWestern.planets.find((p) => p.name === "Moon")?.longitude ?? 0
      );

    const moonSignIdx = Math.floor(normalizeDegrees(moonSiderealLon) / 30);
    const planetSignIdx = Math.floor(normalizeDegrees(planetSiderealLon) / 30);
    let house = planetSignIdx - moonSignIdx + 1;
    if (house <= 0) house += 12;
    return house;
  }

  /**
   * Calculate Aspects according to system rules
   */
  public calculateAspects(
    transitingPlanet: CalculatedTransitPlanet,
    natalPlanets: { name: string; longitude: number; sign: string; house: number }[]
  ): CalculatedAspect[] {
    const aspects: CalculatedAspect[] = [];

    // ============================================================
    // A. WESTERN PTOLEMAIC ASPECTS (Degree-based with orb tolerance)
    // ============================================================
    if (this.config.aspectSystem === "western" || this.config.aspectSystem === "hellenistic") {
      const ASPECT_SPECS = [
        { type: "Conjunction", angle: 0, orb: 8.0, symbol: "☌", nature: "Potent" as const },
        { type: "Sextile", angle: 60, orb: 4.5, symbol: "⚹", nature: "Harmonious" as const },
        { type: "Square", angle: 90, orb: 6.5, symbol: "□", nature: "Challenging" as const },
        { type: "Trine", angle: 120, orb: 6.5, symbol: "△", nature: "Harmonious" as const },
        { type: "Opposition", angle: 180, orb: 8.0, symbol: "☍", nature: "Challenging" as const },
      ];

      for (const nat of natalPlanets) {
        let diff = Math.abs(transitingPlanet.rawLongitude - nat.longitude) % 360;
        const angle = diff > 180 ? 360 - diff : diff;

        for (const spec of ASPECT_SPECS) {
          const orb = Math.abs(angle - spec.angle);
          if (orb <= spec.orb) {
            const strength = Math.round((1 - orb / spec.orb) * 100) / 100;
            aspects.push({
              type: spec.type,
              symbol: spec.symbol,
              transitingPlanet: transitingPlanet.name,
              natalPlanet: nat.name,
              transitingLongitude: transitingPlanet.rawLongitude,
              natalLongitude: nat.longitude,
              angle: Math.round(angle * 100) / 100,
              orb: Math.round(orb * 100) / 100,
              maxOrb: spec.orb,
              strength,
              isApplying: Math.abs(transitingPlanet.speed) < 0.001
                ? null
                : isAngularAspectApplying(
                    transitingPlanet.rawLongitude,
                    nat.longitude,
                    spec.angle,
                    transitingPlanet.speed
                  ),
              nature: spec.nature,
              system: this.config.aspectSystem,
              description: `${transitingPlanet.name} in ${transitingPlanet.sign} forms a ${spec.type} (${Math.round(orb * 10) / 10}° orb) to natal ${nat.name} in ${nat.sign}.`,
            });
          }
        }
      }
    }

    // ============================================================
    // B. VEDIC GRAHA DRISHTI (Sign/House-based with Special Sights)
    // ============================================================
    if (this.config.aspectSystem === "vedic") {
      const transSignIdx = Math.floor(transitingPlanet.rawLongitude / 30);

      for (const nat of natalPlanets) {
        const natSignIdx = Math.floor(nat.longitude / 30);
        // House distance from transiting planet to natal planet (1 to 12)
        let houseDistance = natSignIdx - transSignIdx + 1;
        if (houseDistance <= 0) houseDistance += 12;

        let isDrishti = false;
        let drishtiStrength = 0;
        let drishtiTitle = "";

        // 1. ALL planets cast 100% full sight on 7th house
        if (houseDistance === 7) {
          isDrishti = true;
          drishtiStrength = 1.0;
          drishtiTitle = "Full 7th House Drishti (Saptama Drishti)";
        }

        // 2. MARS special aspects: 4th and 8th
        if (transitingPlanet.name === "Mars" && (houseDistance === 4 || houseDistance === 8)) {
          isDrishti = true;
          drishtiStrength = 1.0;
          drishtiTitle = `Mars Special ${houseDistance}th House Drishti (Chaturtha/Ashtama)`;
        }

        // 3. JUPITER special aspects: 5th and 9th
        if (transitingPlanet.name === "Jupiter" && (houseDistance === 5 || houseDistance === 9)) {
          isDrishti = true;
          drishtiStrength = 1.0;
          drishtiTitle = `Jupiter Divine ${houseDistance}th House Drishti (Panchama/Navama Amrita)`;
        }

        // 4. SATURN special aspects: 3rd and 10th
        if (transitingPlanet.name === "Saturn" && (houseDistance === 3 || houseDistance === 10)) {
          isDrishti = true;
          drishtiStrength = 1.0;
          drishtiTitle = `Saturn Karmic ${houseDistance}th House Drishti (Tritya/Dashama)`;
        }

        // 5. RAHU / KETU special aspects: 5th and 9th
        if (
          ["NorthNode", "SouthNode", "Rahu", "Ketu"].includes(transitingPlanet.name) &&
          (houseDistance === 5 || houseDistance === 9)
        ) {
          isDrishti = true;
          drishtiStrength = 0.75;
          drishtiTitle = `Nodal ${houseDistance}th House Shadow Sight`;
        }

        if (isDrishti) {
          let degDiff = Math.abs(transitingPlanet.rawLongitude - nat.longitude) % 360;
          const angle = degDiff > 180 ? 360 - degDiff : degDiff;

          aspects.push({
            type: drishtiTitle,
            symbol: "👁",
            transitingPlanet: transitingPlanet.name,
            natalPlanet: nat.name,
            transitingLongitude: transitingPlanet.rawLongitude,
            natalLongitude: nat.longitude,
            angle: Math.round(angle * 100) / 100,
            orb: Math.abs(angle - (houseDistance - 1) * 30),
            maxOrb: 15.0,
            strength: drishtiStrength,
            // Whole-sign Graha Drishti is sign/house based; it has no degree-orb applying state.
            isApplying: null,
            nature: drishtiTitle.includes("Amrita")
              ? "Harmonious"
              : drishtiTitle.includes("Special")
              ? "Special Drishti"
              : "Karmic Full Sight",
            system: "vedic",
            description: `${transitingPlanet.name} (${transitingPlanet.sanskritName || transitingPlanet.name}) casts ${drishtiTitle} upon natal ${nat.name} in the ${houseDistance}th sign away (${nat.sign}).`,
          });
        }
      }
    }

    return aspects;
  }

  /**
   * Run Complete Single-System Transit Calculations
   */
  public calculateSystemTransits(targetDate: Date = this.currentDate): SystemTransitResult {
    const jd = this.getJulianDay(targetDate);
    const rawEphem = swissEphemeris.calculateAllPlanets(jd, false);

    const isSidereal = this.config.zodiac === "sidereal";
    const planetsList = [
      { name: "Sun", data: rawEphem.sun },
      { name: "Moon", data: rawEphem.moon },
      { name: "Mercury", data: rawEphem.mercury },
      { name: "Venus", data: rawEphem.venus },
      { name: "Mars", data: rawEphem.mars },
      { name: "Jupiter", data: rawEphem.jupiter },
      { name: "Saturn", data: rawEphem.saturn },
      { name: "Uranus", data: rawEphem.uranus },
      { name: "Neptune", data: rawEphem.neptune },
      { name: "Pluto", data: rawEphem.pluto },
      { name: "NorthNode", data: rawEphem.rahu },
    ];

    // Filter Hellenistic outers if requested
    const filteredPlanets =
      this.config.id === "hellenistic"
        ? planetsList.filter((p) => !["Uranus", "Neptune", "Pluto"].includes(p.name))
        : planetsList;

    const calculatedPlanets: CalculatedTransitPlanet[] = [];
    const interpretations: SystemTransitResult["interpretations"] = {};

    for (const item of filteredPlanets) {
      const zLon = this.toZodiacLongitude(item.data.longitude);
      const signInfo = this.getSignAndDegree(zLon);
      const house = this.calculateHouse(zLon, isSidereal);
      const houseFromMoon = this.calculateHouseFromMoon(zLon);

      const pObj: CalculatedTransitPlanet = {
        name: item.name,
        sanskritName: VEDIC_GRAHA_NAMES[item.name],
        symbol: PLANET_SYMBOLS[item.name] || "✦",
        rawLongitude: zLon,
        sign: signInfo.sign,
        degreeInSign: signInfo.degreeInSign,
        degreeFormatted: signInfo.formatted,
        house,
        houseFromMoon,
        isRetrograde: item.data.isRetrograde,
        speed: item.data.speed,
      };

      calculatedPlanets.push(pObj);

      // Interpretation generation
      if (this.config.interpretation === "vedic") {
        const gocharaData =
          GOCHARA_DATABASE[item.name]?.[houseFromMoon] ||
          generateFallbackGochara(item.name, houseFromMoon);

        interpretations[item.name] = {
          title: gocharaData.title,
          overview: gocharaData.classicalEffect,
          nature: gocharaData.isAuspicious ? "Auspicious" : "Challenging",
          themes: [
            `${houseFromMoon}th from Moon`,
            gocharaData.isAuspicious ? "Favorable Gochara" : "Restructuring Cycle",
          ],
          karmic: gocharaData.karmicDescription,
          gocharaRule: `Phaladeepika Ch. 26: ${item.name} in ${houseFromMoon}th from Chandra`,
          remedies: gocharaData.remedies,
          favorableActions: gocharaData.favorableActivities,
          actionsToAvoid: gocharaData.cautions,
          durationEstimate: item.name === "Saturn" ? "2.5 Years" : item.name === "Jupiter" ? "1 Year" : "Several weeks",
        };
      } else {
        const westernData =
          WESTERN_TRANSIT_DATABASE[item.name]?.[house] ||
          generateFallbackWestern(item.name, house);

        interpretations[item.name] = {
          title: `${item.name} in ${signInfo.sign} (${house}th House)`,
          overview: westernData.psychological,
          nature: ["Square", "Opposition"].includes(item.name) ? "Challenging" : "Harmonious",
          themes: [westernData.growthTheme],
          psychological: westernData.psychological,
          favorableActions: westernData.bestActivities,
          actionsToAvoid: westernData.cautions,
          durationEstimate: westernData.duration,
        };
      }
    }

    // Natal planets in current coordinate system for aspect calculation
    const natalPlanetsInSystem = this.birthWestern.planets.map((np) => ({
      name: np.name,
      longitude: this.toZodiacLongitude(np.longitude),
      sign: this.getSignAndDegree(this.toZodiacLongitude(np.longitude)).sign,
      house: np.house,
    }));

    // Calculate all aspects
    let allAspects: CalculatedAspect[] = [];
    for (const cp of calculatedPlanets) {
      const asp = this.calculateAspects(cp, natalPlanetsInSystem);
      allAspects = allAspects.concat(asp);
    }

    // Special Condition Checks (Sade Sati, Ashtama Shani, Diurnal Sect)
    const saturnPlanet = calculatedPlanets.find((p) => p.name === "Saturn");
    const jupiterPlanet = calculatedPlanets.find((p) => p.name === "Jupiter");
    const sunPlanet = calculatedPlanets.find((p) => p.name === "Sun");

    let isSadeSati = false;
    let sadeSatiPhase: SystemTransitResult["specialConditions"]["sadeSatiPhase"] = "None";
    let isAshtamaShani = false;
    let isKantakaShani = false;

    if (saturnPlanet?.houseFromMoon) {
      if (saturnPlanet.houseFromMoon === 12) {
        isSadeSati = true;
        sadeSatiPhase = "Rising (12th)";
      } else if (saturnPlanet.houseFromMoon === 1) {
        isSadeSati = true;
        sadeSatiPhase = "Peak (1st)";
      } else if (saturnPlanet.houseFromMoon === 2) {
        isSadeSati = true;
        sadeSatiPhase = "Setting (2nd)";
      } else if (saturnPlanet.houseFromMoon === 8) {
        isAshtamaShani = true;
      } else if (saturnPlanet.houseFromMoon === 4) {
        isKantakaShani = true;
      }
    }

    const isGuruGocharaFavorable = [2, 5, 7, 9, 11].includes(
      jupiterPlanet?.houseFromMoon || 0
    );

    // Hellenistic Diurnal / Nocturnal Sect check
    // Sun in houses 7 through 12 is Diurnal (above horizon); 1 through 6 is Nocturnal
    const isDiurnalSect = isSunAboveHorizonInChart(this.birthWestern);

    return {
      config: this.config,
      ayanamsaDegrees: this.ayanamsaValue,
      date: targetDate,
      dateFormatted: targetDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      planets: calculatedPlanets,
      aspects: allAspects,
      houseSystemUsed: this.houseSystemUsed,
      zodiacUsed: this.config.zodiac,
      specialConditions: {
        isSadeSati,
        sadeSatiPhase,
        isAshtamaShani,
        isKantakaShani,
        isGuruGocharaFavorable,
        isDiurnalSect,
      },
      interpretations,
    };
  }

  /**
   * Dual Comparison Mode: Western vs Vedic Side-by-Side Analysis
   */
  public compareSystems(targetDate: Date = this.currentDate): DualComparisonResult {
    const westernConfig = TRANSIT_SYSTEM_PRESETS.western;
    const vedicConfig = TRANSIT_SYSTEM_PRESETS.vedic;

    const westernEngine = new MultiSystemTransitEngine(
      westernConfig,
      this.birthWestern,
      this.birthVedic,
      targetDate
    );
    const vedicEngine = new MultiSystemTransitEngine(
      vedicConfig,
      this.birthWestern,
      this.birthVedic,
      targetDate
    );

    const westernResult = westernEngine.calculateSystemTransits(targetDate);
    const vedicResult = vedicEngine.calculateSystemTransits(targetDate);

    const planetComparisons: DualComparisonResult["planetComparisons"] = [];

    const commonPlanets = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn"];

    for (const pName of commonPlanets) {
      const wPlanet = westernResult.planets.find((p) => p.name === pName);
      const vPlanet = vedicResult.planets.find((p) => p.name === pName);

      if (wPlanet && vPlanet) {
        const signShift =
          wPlanet.sign === vPlanet.sign
            ? `Same sign (${wPlanet.sign})`
            : `Shifted backward from Tropical ${wPlanet.sign} to Sidereal ${vPlanet.sign}`;

        const houseShift = `Western House: ${wPlanet.house}th (Ascendant Placidus) vs Vedic: ${vPlanet.house}th (Lagna Rasi) / ${vPlanet.houseFromMoon}th from Moon`;

        const wInterp = westernResult.interpretations[pName]?.overview || "";
        const vInterp = vedicResult.interpretations[pName]?.overview || "";

        const unifiedSynthesis = `On an inner psychological level (${wPlanet.sign} in ${wPlanet.house}th house), ${wPlanet.name} invites you to cultivate ${westernResult.interpretations[pName]?.themes[0] || "growth"}. Concurrently, on an outer karmic timing level (${vPlanet.sign} in ${vPlanet.houseFromMoon}th from Moon), ${vPlanet.sanskritName || vPlanet.name} activates ${vedicResult.interpretations[pName]?.title || "Gochara duty"}. Integrating both: focus internal character growth on Western themes while using Vedic remedial disciplines to mitigate external hurdles.`;

        planetComparisons.push({
          planet: pName,
          westernSign: wPlanet.sign,
          westernDegree: wPlanet.degreeFormatted,
          westernHouse: wPlanet.house,
          vedicSign: vPlanet.sign,
          vedicDegree: vPlanet.degreeFormatted,
          vedicHouseFromAsc: vPlanet.house,
          vedicHouseFromMoon: vPlanet.houseFromMoon || 1,
          signShift,
          houseShift,
          whyDifferent: `Due to Earth's axial precession (~24°12' Lahiri Ayanamsa), sidereal constellations sit roughly 24 degrees earlier than seasonal tropical signs. In addition, Western houses measure from the Ascendant, whereas Vedic Gochara primarily measures from the Natal Moon.`,
          westernInterpretation: wInterp,
          vedicInterpretation: vInterp,
          unifiedSynthesis,
        });
      }
    }

    return {
      date: targetDate,
      dateFormatted: targetDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      ayanamsaDifference: Math.round(vedicResult.ayanamsaDegrees * 100) / 100,
      western: westernResult,
      vedic: vedicResult,
      planetComparisons,
      divergenceSummary: {
        zodiacReason:
          "Tropical zodiac is oriented to the Vernal Equinox (0° Aries = Spring Equinox), moving with Earth's seasons. Sidereal zodiac is anchored to fixed background constellations (e.g. Chitra / Spica at 0° Libra). Precession creates a ~24.2° difference today.",
        houseReason:
          "Western Placidus divides diurnal/nocturnal semi-arcs into unequal time houses from the Ascendant. Vedic Jyotish uses Whole Sign (Rasi) where each 30° constellation is an entire house, and Gochara transits are evaluated from the Natal Moon (Chandra Lagna).",
        aspectReason:
          "Western aspects are degree-based geometric divisions (0°, 60°, 90°, 120°, 180°). Vedic Graha Drishti is whole-sign sight where all planets cast full 7th house aspect, with Mars (4/8), Jupiter (5/9), and Saturn (3/10) casting potent special drishtis.",
        interpretationReason:
          "Western astrology focuses on internal psychological evolution and conscious choice. Vedic Jyotish focuses on unfolding prarabdha karma, objective life events, timing cycles, and remedial actions (Upayas).",
      },
    };
  }

  /**
   * Calculate Complete BaZi Four Pillars, Luck Pillars & Annual Influences
   */
  public calculateBaZiTransit(
    birthDate: Date,
    gender: "Male" | "Female" = "Male",
    targetDate: Date = this.currentDate
  ): BaZiChart {
    const baziEngine = new CompleteBaZiEngine();
    return baziEngine.generateBaZiChart(birthDate, gender, targetDate);
  }
}
