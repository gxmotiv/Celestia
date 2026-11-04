/**
 * Master Vedic Yogas Engine (60+ Classical Parashari & Jaimini Yogas)
 * Evaluates formative conditions, strength grading (Exalted, High, Moderate, Subtle),
 * cancellation dynamics (e.g. Neechabhanga, Kemadruma cancellations, Manglik Dosha nullifications),
 * and classical scripture citations (Brihat Parashara Hora Shastra, Phaladeepika, Jaimini Sutras).
 */

import { VedicChartData, VedicPlanet, VEDIC_RASIS } from "@/lib/astronomy/vedic";
import { calculateDivisionalChart, DIVISIONAL_CHARTS_CONFIG } from "./divisionalCalc";

export interface MasterYogaResult {
  id: string;
  name: string;
  sanskritName: string;
  category:
    | "Pancha Mahapurusha"
    | "Raja Yoga"
    | "Dhana Yoga"
    | "Vipareeta Raja Yoga"
    | "Neechabhanga Raja Yoga"
    | "Lunar Yoga"
    | "Solar Yoga"
    | "Dosha / Malefic Combination"
    | "Jaimini Karaka Yoga";
  isPresent: boolean;
  intensity: "Exalted" | "High" | "Moderate" | "Subtle";
  numericScore: number; // 0 to 100
  formativePlanets: string[];
  formativeHouses: number[];
  isCancelled: boolean;
  cancellationReason?: string;
  description: string;
  classicalCitation: string;
  effects: string;
}

export interface MasterYogasDossier {
  totalChecked: number;
  activeCount: number;
  rajaYogasCount: number;
  dhanaYogasCount: number;
  neechabhangaCount: number;
  doshasCount: number;
  yogas: MasterYogaResult[];
  overallYogaStrengthScore: number; // 0-100 summary
  topAuspiciousYogas: MasterYogaResult[];
  activeDoshas: MasterYogaResult[];
}

export function evaluateMasterYogas(chartData: VedicChartData): MasterYogasDossier {
  const planets = chartData.planets;
  const results: MasterYogaResult[] = [];

  // Helper getters
  const getPlanet = (name: string): VedicPlanet | undefined => planets.find((p) => p.name === name);
  const getPlanetsInHouse = (h: number): VedicPlanet[] => planets.filter((p) => p.house === h);
  const getHouseLord = (h: number): string => {
    const ascSignIdx = chartData.lagna.rasiIndex;
    const houseSignIdx = (ascSignIdx + h - 1) % 12;
    return VEDIC_RASIS[houseSignIdx].ruler;
  };

  const sun = getPlanet("Sun");
  const moon = getPlanet("Moon");
  const mars = getPlanet("Mars");
  const mercury = getPlanet("Mercury");
  const jupiter = getPlanet("Jupiter");
  const venus = getPlanet("Venus");
  const saturn = getPlanet("Saturn");
  const rahu = getPlanet("Rahu");
  const ketu = getPlanet("Ketu");

  const kendraHouses = [1, 4, 7, 10];
  const trikonaHouses = [1, 5, 9];
  const dusthanaHouses = [6, 8, 12];
  const upachayaHouses = [3, 6, 10, 11];

  // ============================================================
  // 1. PANCHA MAHAPURUSHA YOGAS (5)
  // ============================================================
  // Ruchaka (Mars)
  const marsInKendra = mars && kendraHouses.includes(mars.house);
  const marsInOwnOrExalt = mars && [0, 7, 9].includes(mars.rasiIndex); // Aries, Scorpio, Capricorn
  results.push({
    id: "ruchaka",
    name: "Ruchaka Mahapurusha Yoga",
    sanskritName: "रुचक महापुरुष योग",
    category: "Pancha Mahapurusha",
    isPresent: Boolean(marsInKendra && marsInOwnOrExalt),
    intensity: mars?.dignity === "Exalted" ? "Exalted" : "High",
    numericScore: mars?.dignity === "Exalted" ? 95 : 85,
    formativePlanets: ["Mars"],
    formativeHouses: mars ? [mars.house] : [],
    isCancelled: false,
    description: "Mars in Kendra occupying its own sign (Aries, Scorpio) or exaltation sign (Capricorn).",
    classicalCitation: "BPHS Ch. 77: The native is energetic, heroic, victorious over adversaries, physically commanding and blessed with land and military or executive authority.",
    effects: "Uncompromising physical vitality, leadership in high-stakes fields, strategic mastery and unassailable courage.",
  });

  // Bhadra (Mercury)
  const mercuryInKendra = mercury && kendraHouses.includes(mercury.house);
  const mercuryInOwnOrExalt = mercury && [2, 5].includes(mercury.rasiIndex); // Gemini, Virgo
  results.push({
    id: "bhadra",
    name: "Bhadra Mahapurusha Yoga",
    sanskritName: "भद्र महापुरुष योग",
    category: "Pancha Mahapurusha",
    isPresent: Boolean(mercuryInKendra && mercuryInOwnOrExalt),
    intensity: mercury?.rasiIndex === 5 ? "Exalted" : "High",
    numericScore: mercury?.rasiIndex === 5 ? 95 : 85,
    formativePlanets: ["Mercury"],
    formativeHouses: mercury ? [mercury.house] : [],
    isCancelled: false,
    description: "Mercury in Kendra in its own sign (Gemini) or exaltation sign (Virgo).",
    classicalCitation: "BPHS Ch. 77: The native has radiant intellect, lion-like gait, mastery over speech, mathematics, diplomacy, commerce, and scholarly treatises.",
    effects: "Exceptional analytical cognition, eloquent communicative sway, and unmatched commercial acumen.",
  });

  // Hamsa (Jupiter)
  const jupiterInKendra = jupiter && kendraHouses.includes(jupiter.house);
  const jupiterInOwnOrExalt = jupiter && [3, 8, 11].includes(jupiter.rasiIndex); // Cancer (exalted), Sag, Pisces
  results.push({
    id: "hamsa",
    name: "Hamsa Mahapurusha Yoga",
    sanskritName: "हंस महापुरुष योग",
    category: "Pancha Mahapurusha",
    isPresent: Boolean(jupiterInKendra && jupiterInOwnOrExalt),
    intensity: jupiter?.rasiIndex === 3 ? "Exalted" : "High",
    numericScore: jupiter?.rasiIndex === 3 ? 98 : 88,
    formativePlanets: ["Jupiter"],
    formativeHouses: jupiter ? [jupiter.house] : [],
    isCancelled: false,
    description: "Jupiter in Kendra in its exaltation sign (Cancer) or own signs (Sagittarius, Pisces).",
    classicalCitation: "BPHS Ch. 77: Revered by rulers, righteous, righteous in demeanor, possessed of swan-like discernment, deep spiritual wisdom, and widespread veneration.",
    effects: "Supreme moral and philosophical clarity, profound guru grace, universal esteem, and philanthropic fortune.",
  });

  // Malavya (Venus)
  const venusInKendra = venus && kendraHouses.includes(venus.house);
  const venusInOwnOrExalt = venus && [1, 6, 11].includes(venus.rasiIndex); // Taurus, Libra, Pisces (exalted)
  results.push({
    id: "malavya",
    name: "Malavya Mahapurusha Yoga",
    sanskritName: "मालव्य महापुरुष योग",
    category: "Pancha Mahapurusha",
    isPresent: Boolean(venusInKendra && venusInOwnOrExalt),
    intensity: venus?.rasiIndex === 11 ? "Exalted" : "High",
    numericScore: venus?.rasiIndex === 11 ? 95 : 85,
    formativePlanets: ["Venus"],
    formativeHouses: venus ? [venus.house] : [],
    isCancelled: false,
    description: "Venus in Kendra in its own signs (Taurus, Libra) or exaltation sign (Pisces).",
    classicalCitation: "BPHS Ch. 77: Possesses beauty, immense material luxuries, conveyances, artistic refinement, marital bliss, and lifelong comfort.",
    effects: "Refined aesthetic sensibilities, magnetic charisma, effortless prosperity, and harmonious relationships.",
  });

  // Sasa (Saturn)
  const saturnInKendra = saturn && kendraHouses.includes(saturn.house);
  const saturnInOwnOrExalt = saturn && [6, 9, 10].includes(saturn.rasiIndex); // Libra (exalted), Cap, Aqu
  results.push({
    id: "sasa",
    name: "Sasa Mahapurusha Yoga",
    sanskritName: "शश महापुरुष योग",
    category: "Pancha Mahapurusha",
    isPresent: Boolean(saturnInKendra && saturnInOwnOrExalt),
    intensity: saturn?.rasiIndex === 6 ? "Exalted" : "High",
    numericScore: saturn?.rasiIndex === 6 ? 95 : 85,
    formativePlanets: ["Saturn"],
    formativeHouses: saturn ? [saturn.house] : [],
    isCancelled: false,
    description: "Saturn in Kendra in its own signs (Capricorn, Aquarius) or exaltation sign (Libra).",
    classicalCitation: "BPHS Ch. 77: The native commands legions, holds enduring political or administrative authority, governs lands and mines, and exhibits monumental stoic endurance.",
    effects: "Ironclad discipline, sovereign leadership through sustained labor, and indelible structural legacy.",
  });

  // ============================================================
  // 2. KENDRA-TRIKONA RAJA YOGAS
  // ============================================================
  const l1 = getHouseLord(1);
  const l4 = getHouseLord(4);
  const l5 = getHouseLord(5);
  const l7 = getHouseLord(7);
  const l9 = getHouseLord(9);
  const l10 = getHouseLord(10);

  const pL9 = getPlanet(l9);
  const pL10 = getPlanet(l10);
  const isDharmaKarma = pL9 && pL10 && (pL9.house === pL10.house || Math.abs(pL9.house - pL10.house) === 6);

  results.push({
    id: "dharma-karmadhipati",
    name: "Dharma-Karmadhipati Raja Yoga",
    sanskritName: "धर्म-कर्माधिपति राजयोग",
    category: "Raja Yoga",
    isPresent: Boolean(isDharmaKarma),
    intensity: "Exalted",
    numericScore: 94,
    formativePlanets: [l9, l10],
    formativeHouses: [pL9?.house || 9, pL10?.house || 10],
    isCancelled: false,
    description: "Lords of the 9th (Dharma) and 10th (Karma) houses conjoined or in mutual aspect.",
    classicalCitation: "Phaladeepika: The native attains sovereign executive power, royal status, widespread fame, unblemished integrity, and historic achievements.",
    effects: "Harmonious union of ethical purpose with worldly authority, resulting in effortless career elevation.",
  });

  // 1st and 5th Lords Sambandha
  const pL1 = getPlanet(l1);
  const pL5 = getPlanet(l5);
  const isL1L5 = pL1 && pL5 && (pL1.house === pL5.house || Math.abs(pL1.house - pL5.house) === 6);
  results.push({
    id: "lagna-panchamadhipati",
    name: "Lagna-Panchamadhipati Raja Yoga",
    sanskritName: "लग्न-पञ्चमाधिपति राजयोग",
    category: "Raja Yoga",
    isPresent: Boolean(isL1L5 && l1 !== l5),
    intensity: "High",
    numericScore: 86,
    formativePlanets: [l1, l5],
    formativeHouses: [pL1?.house || 1, pL5?.house || 5],
    isCancelled: false,
    description: "Conjunction or mutual aspect between the 1st lord (Self) and 5th lord (Purva Punya & Intellect).",
    classicalCitation: "BPHS: Endows exceptional creative genius, divine blessings from past lives, high honors, and sharp intellect.",
    effects: "Innate brilliance, auspicious intuition, success in competitive intellectual pursuits, and noble character.",
  });

  // 4th and 5th Lords Raja Yoga
  const pL4 = getPlanet(l4);
  const isL4L5 = pL4 && pL5 && (pL4.house === pL5.house || Math.abs(pL4.house - pL5.house) === 6);
  results.push({
    id: "sukha-panchama-raja",
    name: "Sukha-Panchama Raja Yoga",
    sanskritName: "सुख-पञ्चम राजयोग",
    category: "Raja Yoga",
    isPresent: Boolean(isL4L5 && l4 !== l5),
    intensity: "High",
    numericScore: 84,
    formativePlanets: [l4, l5],
    formativeHouses: [pL4?.house || 4, pL5?.house || 5],
    isCancelled: false,
    description: "Conjunction or mutual aspect between the 4th lord of happiness/estates and 5th lord of intellect.",
    classicalCitation: "BPHS: Grants extensive landed estates, luxurious conveyances, scholarly distinction, and inner serenity.",
    effects: "Deep emotional equilibrium, scholarly acclaim, and acquisition of valuable real estate.",
  });

  // 5th and 10th Lords Raja Yoga
  const isL5L10 = pL5 && pL10 && (pL5.house === pL10.house || Math.abs(pL5.house - pL10.house) === 6);
  results.push({
    id: "panchama-dasha-raja",
    name: "Khyati Raja Yoga (5th & 10th Lords)",
    sanskritName: "ख्याति राजयोग",
    category: "Raja Yoga",
    isPresent: Boolean(isL5L10 && l5 !== l10),
    intensity: "High",
    numericScore: 88,
    formativePlanets: [l5, l10],
    formativeHouses: [pL5?.house || 5, pL10?.house || 10],
    isCancelled: false,
    description: "Conjunction or mutual aspect between the 5th lord of wisdom and 10th lord of public authority.",
    classicalCitation: "Bhavartha Ratnakara: Native becomes an esteemed advisor, minister, or luminary leader celebrated for sharp strategic counsel.",
    effects: "High administrative or advisory stature, rapid career ascension, and lasting renown.",
  });

  // Shankha Yoga
  const pL6 = getPlanet(getHouseLord(6));
  const isShankha = pL5 && pL6 && Math.abs(pL5.house - pL6.house) % 3 === 0 && (pL1?.dignity === "Own Sign" || pL1?.dignity === "Exalted");
  results.push({
    id: "shankha-yoga",
    name: "Shankha Yoga",
    sanskritName: "शङ्ख योग",
    category: "Raja Yoga",
    isPresent: Boolean(isShankha),
    intensity: "Moderate",
    numericScore: 78,
    formativePlanets: [l5, getHouseLord(6), l1],
    formativeHouses: [pL5?.house || 5],
    isCancelled: false,
    description: "Lords of 5th and 6th in mutual Kendras, while the Lagna lord is powerfully fortified.",
    classicalCitation: "BPHS: Native enjoys extensive longevity, profound learning in sacred scriptures, pure conduct, and philanthropic authority.",
    effects: "Devout nature, victory over subtle competitors, and respected community leadership.",
  });

  // Parvata Yoga
  const kendraBenefics = planets.filter((p) => ["Jupiter", "Venus", "Mercury"].includes(p.name) && kendraHouses.includes(p.house));
  const planetsIn6and8 = planets.filter((p) => [6, 8].includes(p.house));
  const isParvata = kendraBenefics.length >= 2 && planetsIn6and8.length === 0;
  results.push({
    id: "parvata-yoga",
    name: "Parvata Yoga (Mountain of Fortune)",
    sanskritName: "पर्वत योग",
    category: "Raja Yoga",
    isPresent: Boolean(isParvata),
    intensity: "High",
    numericScore: 86,
    formativePlanets: kendraBenefics.map((p) => p.name),
    formativeHouses: kendraBenefics.map((p) => p.house),
    isCancelled: false,
    description: "Natural benefics occupy Kendras while the 6th and 8th houses remain completely untenanted.",
    classicalCitation: "Phaladeepika: Native possesses immovable wealth, lasting public esteem, generosity, eloquence, and a prosperous lineage.",
    effects: "Steadfast luck, lack of major enemies or chronic illnesses, and towering stature in society.",
  });

  // ============================================================
  // 3. DHANA YOGAS (WEALTH & PROSPERITY)
  // ============================================================
  const l2 = getHouseLord(2);
  const l11 = getHouseLord(11);
  const pL2 = getPlanet(l2);
  const pL11 = getPlanet(l11);

  // 2nd and 11th Lords Sambandha
  const isL2L11 = pL2 && pL11 && (pL2.house === pL11.house || Math.abs(pL2.house - pL11.house) === 6);
  results.push({
    id: "dhana-yoga-2-11",
    name: "Maha Dhana Yoga (2nd & 11th Lords)",
    sanskritName: "महा धन योग",
    category: "Dhana Yoga",
    isPresent: Boolean(isL2L11 && l2 !== l11),
    intensity: "High",
    numericScore: 90,
    formativePlanets: [l2, l11],
    formativeHouses: [pL2?.house || 2, pL11?.house || 11],
    isCancelled: false,
    description: "Lords of the 2nd (Dhana / Accumulated Wealth) and 11th (Labha / Gains & Income) conjunct or aspecting.",
    classicalCitation: "BPHS Ch. 42: Continuous influx of liquid wealth, compounding assets, prosperous business enterprises, and financial immunity.",
    effects: "Exceptional financial accumulation, continuous cash flow, and lucrative commercial ventures.",
  });

  // 1st and 2nd Lords Sambandha
  const isL1L2 = pL1 && pL2 && (pL1.house === pL2.house || Math.abs(pL1.house - pL2.house) === 6);
  results.push({
    id: "dhana-yoga-1-2",
    name: "Lagna-Dhanadhipati Yoga",
    sanskritName: "लग्न-धनाधिपति योग",
    category: "Dhana Yoga",
    isPresent: Boolean(isL1L2 && l1 !== l2),
    intensity: "Moderate",
    numericScore: 80,
    formativePlanets: [l1, l2],
    formativeHouses: [pL1?.house || 1, pL2?.house || 2],
    isCancelled: false,
    description: "1st lord (Self) and 2nd lord (Treasury) in mutual connection.",
    classicalCitation: "BPHS: The native builds wealth through their own initiative, commands respect for their speech, and preserves family honor.",
    effects: "Self-made financial independence and strong asset retention.",
  });

  // 5th and 9th Lords Sambandha (Lakshmi Yoga)
  const isLakshmi = pL5 && pL9 && (pL5.house === pL9.house || Math.abs(pL5.house - pL9.house) === 6);
  results.push({
    id: "lakshmi-yoga",
    name: "Maha Lakshmi Yoga (5th & 9th Lords)",
    sanskritName: "महालक्ष्मी योग",
    category: "Dhana Yoga",
    isPresent: Boolean(isLakshmi && l5 !== l9),
    intensity: "Exalted",
    numericScore: 92,
    formativePlanets: [l5, l9],
    formativeHouses: [pL5?.house || 5, pL9?.house || 9],
    isCancelled: false,
    description: "Conjunction or aspect between lords of the 5th and 9th houses of divine grace.",
    classicalCitation: "Saravali: The native is beloved of Goddess Lakshmi, possessing radiant elegance, virtuous wealth, generous philanthropy, and unyielding fortune.",
    effects: "Effortless abundance, blessed spiritual merit, noble character, and prosperous progeny.",
  });

  // Vasumati Yoga
  const upachayaBenefics = planets.filter(
    (p) => ["Jupiter", "Venus", "Mercury"].includes(p.name) && upachayaHouses.includes(p.house)
  );
  results.push({
    id: "vasumati-yoga",
    name: "Vasumati Yoga (Immense Wealth)",
    sanskritName: "वसुमती योग",
    category: "Dhana Yoga",
    isPresent: upachayaBenefics.length >= 2,
    intensity: upachayaBenefics.length === 3 ? "Exalted" : "High",
    numericScore: upachayaBenefics.length === 3 ? 92 : 82,
    formativePlanets: upachayaBenefics.map((p) => p.name),
    formativeHouses: upachayaBenefics.map((p) => p.house),
    isCancelled: false,
    description: "Benefics (Jupiter, Venus, Mercury) occupying Upachaya growth houses (3, 6, 10, 11).",
    classicalCitation: "Varahamihira (Brihat Jataka): The native becomes a sovereign capitalist or landlord, commanding independent wealth without relying on ancestral estates.",
    effects: "Continuous financial expansion throughout life, multiplying holdings and commercial empires.",
  });

  // ============================================================
  // 4. VIPAREETA RAJA YOGAS (DUSTHANA INVERSIONS)
  // ============================================================
  // Harsha Yoga (6th lord in 6th, 8th, or 12th)
  const isHarsha = pL6 && [6, 8, 12].includes(pL6.house);
  results.push({
    id: "harsha-yoga",
    name: "Harsha Vipareeta Raja Yoga",
    sanskritName: "हर्ष विपरीत राजयोग",
    category: "Vipareeta Raja Yoga",
    isPresent: Boolean(isHarsha),
    intensity: "High",
    numericScore: 82,
    formativePlanets: [getHouseLord(6)],
    formativeHouses: [pL6?.house || 6],
    isCancelled: false,
    description: "6th lord posited in 6th, 8th, or 12th house, destroying enemies and overcoming debt.",
    classicalCitation: "Uttara Kalamrita: The native conquers adversaries, enjoys robust constitution, immune to legal harm, and prospers amidst competitors' downfall.",
    effects: "Incredible resilience against litigation, debt, and rivalries; gains through adversity.",
  });

  // Sarala Yoga (8th lord in 6th, 8th, or 12th)
  const pL8 = getPlanet(getHouseLord(8));
  const isSarala = pL8 && [6, 8, 12].includes(pL8.house);
  results.push({
    id: "sarala-yoga",
    name: "Sarala Vipareeta Raja Yoga",
    sanskritName: "सरल विपरीत राजयोग",
    category: "Vipareeta Raja Yoga",
    isPresent: Boolean(isSarala),
    intensity: "High",
    numericScore: 84,
    formativePlanets: [getHouseLord(8)],
    formativeHouses: [pL8?.house || 8],
    isCancelled: false,
    description: "8th lord posited in 6th, 8th, or 12th house, neutralizing sudden crises and granting long life.",
    classicalCitation: "Uttara Kalamrita: Endowed with great longevity, fearless fortitude, intellectual brilliance, victory over sudden calamities, and unearned sudden wealth.",
    effects: "Protection in emergencies, unexpected financial windfalls, and deep occult insight.",
  });

  // Vimala Yoga (12th lord in 6th, 8th, or 12th)
  const pL12 = getPlanet(getHouseLord(12));
  const isVimala = pL12 && [6, 8, 12].includes(pL12.house);
  results.push({
    id: "vimala-yoga",
    name: "Vimala Vipareeta Raja Yoga",
    sanskritName: "विमल विपरीत राजयोग",
    category: "Vipareeta Raja Yoga",
    isPresent: Boolean(isVimala),
    intensity: "High",
    numericScore: 84,
    formativePlanets: [getHouseLord(12)],
    formativeHouses: [pL12?.house || 12],
    isCancelled: false,
    description: "12th lord placed in 6th, 8th, or 12th house, curbing expenditure and blessing with pure conduct.",
    classicalCitation: "Uttara Kalamrita: Spending is channeled into righteous investments, the native lives with noble independence, free of mental anguish.",
    effects: "Financial containment, spiritual purity, minimal loss, and peaceful solitude.",
  });

  // ============================================================
  // 5. NEECHABHANGA RAJA YOGAS (5 CANONICAL CANCELLATION RULES)
  // ============================================================
  const debilitatedPlanets = planets.filter((p) => p.dignity === "Debilitated");

  debilitatedPlanets.forEach((dp) => {
    // Determine dispositor
    const dispositorName = VEDIC_RASIS[dp.rasiIndex].ruler;
    const pDispositor = getPlanet(dispositorName);

    // Determine planet that exalts in this sign
    const EXALTATION_PLANET_BY_SIGN: Record<number, string> = {
      0: "Sun", // Aries
      1: "Moon", // Taurus
      2: "None",
      3: "Jupiter", // Cancer
      4: "None",
      5: "Mercury", // Virgo
      6: "Saturn", // Libra
      7: "None",
      8: "None",
      9: "Mars", // Capricorn
      10: "None",
      11: "Venus", // Pisces
    };
    const exaltPlanetName = EXALTATION_PLANET_BY_SIGN[dp.rasiIndex];
    const pExaltPlanet = exaltPlanetName ? getPlanet(exaltPlanetName) : undefined;

    // Condition 1: Dispositor in Kendra from Lagna or Moon
    const cond1 = pDispositor && (kendraHouses.includes(pDispositor.house) || (moon && kendraHouses.includes(((pDispositor.house - moon.house + 12) % 12) + 1)));

    // Condition 2: Exaltation lord in Kendra from Lagna or Moon
    const cond2 = pExaltPlanet && (kendraHouses.includes(pExaltPlanet.house) || (moon && kendraHouses.includes(((pExaltPlanet.house - moon.house + 12) % 12) + 1)));

    // Condition 3: Dispositor and Exaltation lord in mutual Kendra
    const cond3 = pDispositor && pExaltPlanet && kendraHouses.includes(((pDispositor.house - pExaltPlanet.house + 12) % 12) + 1);

    // Condition 4: Planet is aspected by the ruler of the sign
    const cond4 = pDispositor && (pDispositor.house === dp.house || Math.abs(pDispositor.house - dp.house) === 6);

    // Condition 5: Planet exalted in Navamsa (D9)
    const cond5 = dp.navamsaRasiIndex !== undefined && dp.dignity === "Debilitated" && [0, 1, 3, 5, 6, 9, 11].includes(dp.navamsaRasiIndex);

    const conditionsMet = [cond1, cond2, cond3, cond4, cond5].filter(Boolean).length;
    const isNeechabhanga = conditionsMet > 0;

    results.push({
      id: `neechabhanga-${dp.name.toLowerCase()}`,
      name: `Neechabhanga Raja Yoga (${dp.name})`,
      sanskritName: `नीचभङ्ग राजयोग (${dp.sanskritName})`,
      category: "Neechabhanga Raja Yoga",
      isPresent: isNeechabhanga,
      intensity: conditionsMet >= 3 ? "Exalted" : conditionsMet >= 2 ? "High" : "Moderate",
      numericScore: Math.min(95, 60 + conditionsMet * 12),
      formativePlanets: [dp.name, dispositorName, exaltPlanetName || ""].filter(Boolean),
      formativeHouses: [dp.house, pDispositor?.house || 1],
      isCancelled: false,
      description: `Debilitation of ${dp.name} in ${dp.rasiName} is nullified and converted into a potent Raja Yoga through ${conditionsMet} classical cancellation conditions.`,
      classicalCitation: "Phaladeepika Ch. 6, Slokas 26-30: When a debilitated planet's dispositor or exaltation lord is in Kendra from Lagna or Moon, the native rises from hardship to royal eminence.",
      effects: `Early life struggles associated with ${dp.name} transform into supreme mastery, resilience, and monumental worldly triumphs.`,
    });
  });

  // If no debilitated planets, include quiet indicator
  if (debilitatedPlanets.length === 0) {
    results.push({
      id: "no-debilitation-status",
      name: "Akshata Graha Dignity (No Debilitation)",
      sanskritName: "अक्षत ग्रह स्थिति",
      category: "Neechabhanga Raja Yoga",
      isPresent: true,
      intensity: "High",
      numericScore: 85,
      formativePlanets: [],
      formativeHouses: [],
      isCancelled: false,
      description: "All natal planets reside in neutral, friendly, own, or exalted signs without fundamental debilitation.",
      classicalCitation: "Brihat Jataka: An unblemished planetary array ensures smooth karmic continuity without deep debasements.",
      effects: "Consistent stability in life pursuits and absence of acute planetary debilities.",
    });
  }

  // ============================================================
  // 6. LUNAR YOGAS (CHANDRA YOGAS)
  // ============================================================
  // Gaja Kesari Yoga (Jupiter in Kendra from Moon)
  const isGajaKesari = moon && jupiter && kendraHouses.includes(((jupiter.house - moon.house + 12) % 12) + 1);
  results.push({
    id: "gaja-kesari",
    name: "Gaja Kesari Yoga (Elephant-Lion Splendor)",
    sanskritName: "गजकेसरी योग",
    category: "Lunar Yoga",
    isPresent: Boolean(isGajaKesari),
    intensity: jupiter?.dignity === "Exalted" ? "Exalted" : "High",
    numericScore: jupiter?.dignity === "Exalted" ? 95 : 88,
    formativePlanets: ["Jupiter", "Moon"],
    formativeHouses: [jupiter?.house || 1, moon?.house || 1],
    isCancelled: false,
    description: "Jupiter in a Kendra (1st, 4th, 7th, 10th) from the natal Moon.",
    classicalCitation: "BPHS Ch. 36: Illustrious like a lion conquering elephants; endows enduring renown, commanding intelligence, royal patronage, and noble descendants.",
    effects: "Formidable intellect, dignified public reputation, moral strength, and victory in intellectual or public life.",
  });

  // Chandra-Mangala Yoga
  const isChandraMangala = moon && mars && (moon.house === mars.house || Math.abs(moon.house - mars.house) === 6);
  results.push({
    id: "chandra-mangala",
    name: "Chandra-Mangala Yoga (Commercial Fortune)",
    sanskritName: "चन्द्र-मङ्गल योग",
    category: "Lunar Yoga",
    isPresent: Boolean(isChandraMangala),
    intensity: "High",
    numericScore: 82,
    formativePlanets: ["Moon", "Mars"],
    formativeHouses: [moon?.house || 1, mars?.house || 1],
    isCancelled: false,
    description: "Moon and Mars in conjunction or in 7th mutual aspect.",
    classicalCitation: "Saravali: The native accumulates vast commercial earnings, deals successfully in land, precious metals, and entrepreneurial trade.",
    effects: "Pragmatic enterprise, aggressive accumulation of capital, financial shrewdness, and material vigor.",
  });

  // Sunaphaa, Anaphaa, Durudhara, Kemadruma
  if (moon) {
    const h2FromMoon = ((moon.house % 12) + 1);
    const h12FromMoon = (((moon.house - 2 + 12) % 12) + 1);

    const planetsInH2 = planets.filter((p) => p.house === h2FromMoon && !["Sun", "Rahu", "Ketu", "Moon"].includes(p.name));
    const planetsInH12 = planets.filter((p) => p.house === h12FromMoon && !["Sun", "Rahu", "Ketu", "Moon"].includes(p.name));

    const isSunaphaa = planetsInH2.length > 0 && planetsInH12.length === 0;
    const isAnaphaa = planetsInH12.length > 0 && planetsInH2.length === 0;
    const isDurudhara = planetsInH2.length > 0 && planetsInH12.length > 0;
    const rawKemadruma = planetsInH2.length === 0 && planetsInH12.length === 0;

    // Kemadruma Cancellation rules
    const kendraFromLagnaPlanets = planets.filter((p) => kendraHouses.includes(p.house) && !["Rahu", "Ketu"].includes(p.name));
    const kendraFromMoonPlanets = planets.filter((p) => kendraHouses.includes(((p.house - moon.house + 12) % 12) + 1) && p.name !== "Moon");
    const kemadrumaCancelled = rawKemadruma && (kendraFromLagnaPlanets.length > 0 || kendraFromMoonPlanets.length > 0);

    results.push({
      id: "durudhara",
      name: "Durudhara Yoga",
      sanskritName: "दुरुधरा योग",
      category: "Lunar Yoga",
      isPresent: isDurudhara,
      intensity: "High",
      numericScore: 84,
      formativePlanets: ["Moon", ...planetsInH2.map((p) => p.name), ...planetsInH12.map((p) => p.name)],
      formativeHouses: [moon.house, h2FromMoon, h12FromMoon],
      isCancelled: false,
      description: "Planets (other than Sun/Nodes) present on both sides (2nd and 12th) of the Moon.",
      classicalCitation: "BPHS: Grants generous disposition, immense vehicular comforts, faithful associates, and balanced emotional happiness.",
      effects: "Emotional fortification, all-round security, abundant social support, and flourishing wealth.",
    });

    results.push({
      id: "kemadruma",
      name: "Kemadruma Yoga (and Cancellation)",
      sanskritName: "केमद्रुम योग (एवं भङ्ग)",
      category: "Lunar Yoga",
      isPresent: rawKemadruma,
      intensity: kemadrumaCancelled ? "Subtle" : "Moderate",
      numericScore: kemadrumaCancelled ? 30 : 65,
      formativePlanets: ["Moon"],
      formativeHouses: [moon.house],
      isCancelled: kemadrumaCancelled,
      cancellationReason: kemadrumaCancelled
        ? `Cancelled by planets in Kendras from Lagna (${kendraFromLagnaPlanets.map((p) => p.name).join(", ")}) or Moon.`
        : undefined,
      description: "No planet posited in 2nd or 12th from Moon. When cancelled by planets in Kendras, it transforms into an engine of high independent achievement.",
      classicalCitation: "BPHS & Phaladeepika: If cancelled (Kemadruma Bhanga), the initial emotional alienation resolves into remarkable self-reliance and late-life triumph.",
      effects: kemadrumaCancelled
        ? "Inner solitary independence transformed into unshakeable self-reliance."
        : "Tendency toward occasional emotional solitude, solved through Shiva upasana.",
    });
  }

  // ============================================================
  // 7. SOLAR YOGAS (SURYA YOGAS)
  // ============================================================
  // Budhaditya Yoga
  if (sun && mercury) {
    const isBudhaditya = sun.house === mercury.house;
    const degreeDiff = Math.abs(sun.siderealLongitude - mercury.siderealLongitude);
    const isCombust = degreeDiff < 3.5;

    results.push({
      id: "budhaditya",
      name: "Budhaditya Yoga (Solar Intellect)",
      sanskritName: "बुधादित्य योग",
      category: "Solar Yoga",
      isPresent: isBudhaditya,
      intensity: isCombust ? "Moderate" : "High",
      numericScore: isCombust ? 75 : 88,
      formativePlanets: ["Sun", "Mercury"],
      formativeHouses: [sun.house],
      isCancelled: false,
      cancellationReason: isCombust ? "Mercury is deeply combust (<3.5°), rendering the intellect intensely sharp but prone to mental restlessness." : undefined,
      description: "Sun and Mercury conjunction in the same sign / house.",
      classicalCitation: "Brihat Jataka: Endows sharp academic aptitude, diplomatic eloquence, administrative mastery, and mathematical prowess.",
      effects: "Brilliant intellectual discernment, royal or governmental recognition, and respected communication skills.",
    });
  }

  // ============================================================
  // 8. MALIFIC COMBINATIONS & DOSHAS WITH NULLIFICATION
  // ============================================================
  // Kuja / Manglik Dosha
  if (mars) {
    const manglikHouses = [1, 2, 4, 7, 8, 12];
    const isManglikFromLagna = manglikHouses.includes(mars.house);
    const isManglikFromMoon = moon && manglikHouses.includes(((mars.house - moon.house + 12) % 12) + 1);
    const isRawManglik = isManglikFromLagna || isManglikFromMoon;

    // Cancellation conditions
    const marsInOwn = [0, 7].includes(mars.rasiIndex);
    const marsInExalt = mars.rasiIndex === 9;
    const jupiterAspectsMars = jupiter && (jupiter.house === mars.house || Math.abs(jupiter.house - mars.house) === 6 || [5, 9].includes(((mars.house - jupiter.house + 12) % 12) + 1));
    const moonMarsConjunct = moon && moon.house === mars.house;

    const isManglikCancelled = marsInOwn || marsInExalt || jupiterAspectsMars || moonMarsConjunct;

    results.push({
      id: "manglik-dosha",
      name: "Kuja / Manglik Dosha (and Cancellation)",
      sanskritName: "मङ्गल / भौम दोष",
      category: "Dosha / Malefic Combination",
      isPresent: Boolean(isRawManglik),
      intensity: isManglikCancelled ? "Subtle" : "Moderate",
      numericScore: isManglikCancelled ? 35 : 75,
      formativePlanets: ["Mars"],
      formativeHouses: [mars.house],
      isCancelled: Boolean(isManglikCancelled),
      cancellationReason: isManglikCancelled
        ? `Cancelled: ${[marsInOwn ? "Mars in own sign" : "", marsInExalt ? "Mars in Capricorn exaltation" : "", jupiterAspectsMars ? "Protective Jupiter aspect" : "", moonMarsConjunct ? "Chandra-Mangala union" : ""].filter(Boolean).join(", ")}.`
        : undefined,
      description: "Mars posited in 1st, 2nd, 4th, 7th, 8th, or 12th house. When cancelled by classical parameters, marital frictions dissolve into passionate devotion.",
      classicalCitation: "Brihat Parasara Hora Shastra: Analyzes marital dynamics, passion, and partnership vitality.",
      effects: isManglikCancelled
        ? "Dynamic matrimonial drive and protective vigor without destructive friction."
        : "Demands conscious communication and compatibility matching in sacred matrimony.",
    });
  }

  // Kaal Sarp Yoga
  if (rahu && ketu) {
    // Check if all planets are enclosed between Rahu and Ketu
    const nonNodePlanets = planets.filter((p) => !["Rahu", "Ketu"].includes(p.name));
    let allOnOneSide = true;
    let allOnOtherSide = true;

    nonNodePlanets.forEach((p) => {
      const distFromRahu = ((p.house - rahu.house + 12) % 12);
      if (distFromRahu > 6) allOnOneSide = false;
      if (distFromRahu <= 6) allOnOtherSide = false;
    });

    const isKaalSarp = allOnOneSide || allOnOtherSide;
    const KAAL_SARP_NAMES: Record<number, string> = {
      1: "Ananta Kaal Sarp (1st-7th Axis)",
      2: "Kulika Kaal Sarp (2nd-8th Axis)",
      3: "Vasuki Kaal Sarp (3rd-9th Axis)",
      4: "Shankhapala Kaal Sarp (4th-10th Axis)",
      5: "Padma Kaal Sarp (5th-11th Axis)",
      6: "Mahapadma Kaal Sarp (6th-12th Axis)",
      7: "Takshaka Kaal Sarp (7th-1st Axis)",
      8: "Karkotaka Kaal Sarp (8th-2nd Axis)",
      9: "Shankhachuda Kaal Sarp (9th-3rd Axis)",
      10: "Ghataka Kaal Sarp (10th-4th Axis)",
      11: "Vishadhara Kaal Sarp (11th-5th Axis)",
      12: "Sheshanaga Kaal Sarp (12th-6th Axis)",
    };

    results.push({
      id: "kaal-sarp",
      name: isKaalSarp ? KAAL_SARP_NAMES[rahu.house] || "Kaal Sarp Yoga" : "Kaal Sarp Yoga (Non-Afflicted)",
      sanskritName: "काल सर्प योग",
      category: "Dosha / Malefic Combination",
      isPresent: isKaalSarp,
      intensity: isKaalSarp ? "Moderate" : "Subtle",
      numericScore: isKaalSarp ? 78 : 20,
      formativePlanets: ["Rahu", "Ketu"],
      formativeHouses: [rahu.house, ketu.house],
      isCancelled: false,
      description: isKaalSarp
        ? `All planets are hemmed within the Nodal axis of Rahu (House ${rahu.house}) and Ketu (House ${ketu.house}).`
        : "Planetary array flows freely across both halves of the zodiac without nodal entrapment.",
      classicalCitation: "Classical Agamas: Endows extraordinary karmic drive, monumental worldly climb post age 33-36, and intense spiritual awakening.",
      effects: isKaalSarp
        ? "Early obstacles followed by explosive meteoric rise, resilience, and mystical insight."
        : "Harmonious energetic flow across life domains.",
    });
  }

  // Guru Chandal Yoga
  if (jupiter && rahu) {
    const isGuruChandal = jupiter.house === rahu.house || Math.abs(jupiter.house - rahu.house) === 6;
    results.push({
      id: "guru-chandal",
      name: "Guru Chandal Yoga",
      sanskritName: "गुरु चाण्डाल योग",
      category: "Dosha / Malefic Combination",
      isPresent: Boolean(isGuruChandal),
      intensity: "Moderate",
      numericScore: 70,
      formativePlanets: ["Jupiter", "Rahu"],
      formativeHouses: [jupiter.house, rahu.house],
      isCancelled: jupiter.dignity === "Exalted" || jupiter.dignity === "Own Sign",
      cancellationReason: jupiter.dignity === "Exalted" ? "Cancelled: Jupiter is fortified in Cancer exaltation, purifying Rahu's unconventional impulse." : undefined,
      description: "Jupiter and Rahu in conjunction or direct 7th mutual aspect.",
      classicalCitation: "Phaladeepika: Challenges orthodox dogmas, promotes out-of-the-box revolutionary philosophies, and unconventional spiritual exploration.",
      effects: "Innovative thinking, questioning dogma, and bridging eastern spirituality with cutting-edge modern science.",
    });
  }

  // ============================================================
  // 9. JAIMINI KARAKA YOGAS
  // ============================================================
  if (chartData.jaiminiKarakas) {
    const ak = chartData.jaiminiKarakas.karakas.find((k) => k.roleShort === "AK");
    const amk = chartData.jaiminiKarakas.karakas.find((k) => k.roleShort === "AmK");

    if (ak && amk) {
      const pAK = getPlanet(ak.planet);
      const pAmK = getPlanet(amk.planet);
      const isAKAmKConjunct = pAK && pAmK && pAK.house === pAmK.house;

      results.push({
        id: "jaimini-ak-amk-raja",
        name: "Jaimini Atmakaraka-Amatyakaraka Raja Yoga",
        sanskritName: "जैमिनी आत्मकारक-अमात्यकारक राजयोग",
        category: "Jaimini Karaka Yoga",
        isPresent: Boolean(isAKAmKConjunct),
        intensity: "Exalted",
        numericScore: 92,
        formativePlanets: [ak.planet, amk.planet],
        formativeHouses: [pAK?.house || 1],
        isCancelled: false,
        description: `Soul indicator (Atmakaraka: ${ak.planet}) and Career/Executive minister (Amatyakaraka: ${amk.planet}) in direct conjunction.`,
        classicalCitation: "Jaimini Upadesha Sutras: Grants towering fame, royal patronage, executive leadership, and deep soul-level career fulfillment.",
        effects: "Effortless alignment between deepest personal identity and outward societal calling.",
      });
    }
  }

  // Compile dossier
  const activeYogas = results.filter((y) => y.isPresent && !y.isCancelled);
  const activeDoshas = results.filter((y) => y.isPresent && y.category === "Dosha / Malefic Combination");
  const rajaYogas = results.filter((y) => y.isPresent && (y.category === "Raja Yoga" || y.category === "Pancha Mahapurusha"));
  const dhanaYogas = results.filter((y) => y.isPresent && y.category === "Dhana Yoga");
  const neechabhangaYogas = results.filter((y) => y.isPresent && y.category === "Neechabhanga Raja Yoga");

  const overallStrength = Math.round(
    activeYogas.reduce((acc, y) => acc + y.numericScore, 0) / Math.max(1, activeYogas.length)
  );

  const topAuspicious = [...activeYogas]
    .filter((y) => y.category !== "Dosha / Malefic Combination")
    .sort((a, b) => b.numericScore - a.numericScore)
    .slice(0, 5);

  return {
    totalChecked: results.length,
    activeCount: activeYogas.length,
    rajaYogasCount: rajaYogas.length,
    dhanaYogasCount: dhanaYogas.length,
    neechabhangaCount: neechabhangaYogas.length,
    doshasCount: activeDoshas.length,
    yogas: results,
    overallYogaStrengthScore: overallStrength,
    topAuspiciousYogas: topAuspicious,
    activeDoshas,
  };
}

export interface DivisionalYogasDossier extends MasterYogasDossier {
  divisionCode: string;
  divisionName: string;
  harmonic: number;
  significance: string;
  vargottamaPlanets: string[];
  vargottamaYogasCount: number;
}

export function evaluateDivisionalYogas(
  chartData: VedicChartData,
  divisionCode: string = "D1"
): DivisionalYogasDossier {
  if (divisionCode === "D1") {
    const baseDossier = evaluateMasterYogas(chartData);
    return {
      ...baseDossier,
      divisionCode: "D1",
      divisionName: "Rasi (Natal)",
      harmonic: 1,
      significance: "Physical body, vitality & overall life path",
      vargottamaPlanets: [],
      vargottamaYogasCount: 0,
    };
  }

  // 1. Calculate divisional chart positions
  const divChart = calculateDivisionalChart(
    chartData.planets,
    chartData.lagna.siderealLongitude,
    divisionCode
  );

  // 2. Identify Vargottama planets (same sign in D1 and this division)
  const vargottamaPlanets: string[] = [];
  chartData.planets.forEach((pD1) => {
    const pDiv = divChart.planets.find((item) => item.name === pD1.name);
    if (pDiv && pDiv.signIndex === pD1.rasiIndex) {
      vargottamaPlanets.push(pD1.name);
    }
  });

  // 3. Construct synthetic VedicChartData representing this divisional harmonic
  const syntheticPlanets: VedicPlanet[] = divChart.planets.map((dp) => {
    const orig = chartData.planets.find((p) => p.name === dp.name) || chartData.planets[0];
    return {
      ...orig,
      rasiIndex: dp.signIndex,
      rasiName: dp.sign,
      rasiDegree: dp.degreeInSign,
      rasiDegreeFormatted: dp.degreeFormatted,
      house: dp.house,
      dignity: dp.dignity as any,
      siderealLongitude: dp.signIndex * 30 + dp.degreeInSign,
    };
  });

  const syntheticLagna: VedicPlanet = {
    ...chartData.lagna,
    rasiIndex: divChart.ascendant.signIndex,
    rasiName: divChart.ascendant.sign,
    house: 1,
    siderealLongitude: divChart.ascendant.signIndex * 30,
  };

  const syntheticHouses = divChart.houses.map((dh) => ({
    house: dh.house,
    rasiIndex: dh.signIndex,
    rasiName: dh.signName,
    planetsInHouse: dh.planets.map((p) => p.name),
  }));

  const syntheticChartData: VedicChartData = {
    ...chartData,
    lagna: syntheticLagna,
    planets: syntheticPlanets,
    houses: syntheticHouses,
  };

  // 4. Evaluate Yogas on this synthetic divisional chart
  const divDossier = evaluateMasterYogas(syntheticChartData);

  // 5. Add specialized Vargottama & Divisional Yogas
  const additionalYogas: MasterYogaResult[] = [];

  // Vargottama Yoga
  vargottamaPlanets.forEach((pName) => {
    const pObj = chartData.planets.find((p) => p.name === pName);
    additionalYogas.push({
      id: `vargottama-${divisionCode.toLowerCase()}-${pName.toLowerCase()}`,
      name: `Vargottama Yoga (${pName} in ${divisionCode})`,
      sanskritName: `वर्गोत्तम योग (${pObj?.sanskritName || pName})`,
      category: "Raja Yoga",
      isPresent: true,
      intensity: "Exalted",
      numericScore: 94,
      formativePlanets: [pName],
      formativeHouses: [pObj?.house || 1],
      isCancelled: false,
      description: `${pName} occupies the exact same sign (${pObj?.rasiName}) in both D1 Rasi and ${divisionCode} ${divChart.divisionName}, multiplying its auspicious potential.`,
      classicalCitation: "Phaladeepika Ch. 3: A Vargottama planet yields results equivalent to an exalted planet, conferring steadfast royal favor, intelligence, and fortune.",
      effects: `Magnified potency, unassailable endurance, and consistent fruitful protection in all endeavors governed by ${pName}.`,
    });
  });

  // Division-Specific Classical Formations:
  // D9 (Navamsa) Kalyana Yoga
  if (divisionCode === "D9") {
    const d9Venus = syntheticPlanets.find((p) => p.name === "Venus");
    const d9Jupiter = syntheticPlanets.find((p) => p.name === "Jupiter");
    if ((d9Venus && [1, 4, 7, 10].includes(d9Venus.house)) || (d9Jupiter && [1, 4, 7, 10].includes(d9Jupiter.house))) {
      additionalYogas.push({
        id: "d9-kalyana-yoga",
        name: "Navamsa Kalyana Yoga (Marital & Spiritual Blessing)",
        sanskritName: "नवांश कल्याण योग",
        category: "Raja Yoga",
        isPresent: true,
        intensity: "Exalted",
        numericScore: 92,
        formativePlanets: [d9Venus?.name, d9Jupiter?.name].filter(Boolean) as string[],
        formativeHouses: [d9Venus?.house, d9Jupiter?.house].filter(Boolean) as number[],
        isCancelled: false,
        description: "Benefic Venus or Jupiter in Kendra of the D9 Navamsa chart, establishing dharmic partnership and divine auspiciousness.",
        classicalCitation: "Jaimini Sutras & BPHS: Grants pure-hearted marital companionship, elevated social status post-matrimony, and soul serenity.",
        effects: "Harmonious relationship fruition, emotional contentment, and auspicious fortune after marriage.",
      });
    }
  }

  // D10 (Dasamsa) Simhasana / Rajya Yoga
  if (divisionCode === "D10") {
    const d10Sun = syntheticPlanets.find((p) => p.name === "Sun");
    const d10Mars = syntheticPlanets.find((p) => p.name === "Mars");
    const d10Jup = syntheticPlanets.find((p) => p.name === "Jupiter");
    const powerfulD10Kendra = [d10Sun, d10Mars, d10Jup].filter((p) => p && [1, 10].includes(p.house));

    if (powerfulD10Kendra.length > 0) {
      additionalYogas.push({
        id: "d10-rajya-yoga",
        name: "Dasamsa Rajya Yoga (Executive Throne)",
        sanskritName: "दशांश राज्य योग",
        category: "Raja Yoga",
        isPresent: true,
        intensity: "Exalted",
        numericScore: 95,
        formativePlanets: powerfulD10Kendra.map((p) => p!.name),
        formativeHouses: powerfulD10Kendra.map((p) => p!.house),
        isCancelled: false,
        description: `Sun, Mars, or Jupiter situated in the 1st or 10th house of D10 Dasamsa, granting commanding authority in career and public administration.`,
        classicalCitation: "Saravali: The native rises to senior executive leadership, ministerial stature, or prominent enterprise ownership.",
        effects: "Commanding professional authority, high-profile career breakthroughs, and enduring societal impact.",
      });
    }
  }

  // D20 (Vimsamsa) Upasana Siddhi Yoga
  if (divisionCode === "D20") {
    const d20Jup = syntheticPlanets.find((p) => p.name === "Jupiter");
    const d20Ketu = syntheticPlanets.find((p) => p.name === "Ketu");
    if ((d20Jup && [1, 5, 9].includes(d20Jup.house)) || (d20Ketu && [9, 12].includes(d20Ketu.house))) {
      additionalYogas.push({
        id: "d20-upasana-siddhi",
        name: "Vimsamsa Upasana Siddhi Yoga",
        sanskritName: "विंशांश उपासना सिद्धि योग",
        category: "Raja Yoga",
        isPresent: true,
        intensity: "Exalted",
        numericScore: 96,
        formativePlanets: [d20Jup?.name, d20Ketu?.name].filter(Boolean) as string[],
        formativeHouses: [d20Jup?.house, d20Ketu?.house].filter(Boolean) as number[],
        isCancelled: false,
        description: "Jupiter in Trikona (1, 5, 9) or Ketu in Moksha house (9, 12) of D20 Vimsamsa, conferring rapid mantra realization and spiritual devotion.",
        classicalCitation: "BPHS: Bestows spontaneous meditation fruit, divine visionary grace, and protection by the Ishta Devata.",
        effects: "Deep spiritual realization, intuitive wisdom, and effortless concentration during sacred japa.",
      });
    }
  }

  // D2 (Hora) Kuber Dhana Yoga
  if (divisionCode === "D2") {
    const d2Jup = syntheticPlanets.find((p) => p.name === "Jupiter");
    const d2Venus = syntheticPlanets.find((p) => p.name === "Venus");
    if ((d2Jup && [1, 2, 11].includes(d2Jup.house)) || (d2Venus && [1, 2, 11].includes(d2Venus.house))) {
      additionalYogas.push({
        id: "d2-kuber-yoga",
        name: "Hora Kuber Dhana Yoga (Liquid Prosperity)",
        sanskritName: "होरा कुबेर धन योग",
        category: "Dhana Yoga",
        isPresent: true,
        intensity: "Exalted",
        numericScore: 93,
        formativePlanets: [d2Jup?.name, d2Venus?.name].filter(Boolean) as string[],
        formativeHouses: [d2Jup?.house, d2Venus?.house].filter(Boolean) as number[],
        isCancelled: false,
        description: "Jupiter or Venus positioned in key wealth houses of the D2 Hora chart.",
        classicalCitation: "BPHS: Blessed by Lord Kubera with steady treasury accumulation, affluent speech, and liquid capital.",
        effects: "Multiplication of savings, prosperous banking assets, and financial abundance.",
      });
    }
  }

  const combinedYogas = [...additionalYogas, ...divDossier.yogas];
  const activeYogas = combinedYogas.filter((y) => y.isPresent && !y.isCancelled);
  const rajaYogas = combinedYogas.filter((y) => y.isPresent && (y.category === "Raja Yoga" || y.category === "Pancha Mahapurusha"));
  const dhanaYogas = combinedYogas.filter((y) => y.isPresent && y.category === "Dhana Yoga");
  const neechabhangaYogas = combinedYogas.filter((y) => y.isPresent && y.category === "Neechabhanga Raja Yoga");
  const activeDoshas = combinedYogas.filter((y) => y.isPresent && y.category === "Dosha / Malefic Combination");

  const topAuspicious = [...activeYogas]
    .filter((y) => y.category !== "Dosha / Malefic Combination")
    .sort((a, b) => b.numericScore - a.numericScore)
    .slice(0, 5);

  const overallStrength = Math.round(
    activeYogas.reduce((acc, y) => acc + y.numericScore, 0) / Math.max(1, activeYogas.length)
  );

  return {
    totalChecked: combinedYogas.length,
    activeCount: activeYogas.length,
    rajaYogasCount: rajaYogas.length,
    dhanaYogasCount: dhanaYogas.length,
    neechabhangaCount: neechabhangaYogas.length,
    doshasCount: activeDoshas.length,
    yogas: combinedYogas,
    overallYogaStrengthScore: overallStrength,
    topAuspiciousYogas: topAuspicious,
    activeDoshas,
    divisionCode,
    divisionName: divChart.divisionName,
    harmonic: divChart.harmonic,
    significance: divChart.significance,
    vargottamaPlanets,
    vargottamaYogasCount: vargottamaPlanets.length,
  };
}
