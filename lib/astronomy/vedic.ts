/**
 * Vedic Astrology (Jyotish) Engine
 * Implements Lahiri Ayanamsa, Sidereal Zodiac (Nirayana), 27 Nakshatras with Padas,
 * Vimshottari Dasha calculation (Mahadasha & Antardasha with current cycle tracker),
 * Navamsa (D9) Chart division, planetary dignities, and auspicious Vedic yogas.
 */

import { WesternChartData, normalizeDegrees } from "./ephemeris";
import { swissEphemeris } from "./swissEphemeris";
import { D9Chart, D9ChartEngine } from "../vedic/d9NavamsaEngine";
import { JaiminiKarakasEngine, JaiminiKarakasResult } from "../vedic/jaiminiKarakas";
import { TaraBalaEngine, TaraBalaResult } from "../vedic/taraBala";
import { GocharVedhaEngine, GocharVedhaReport } from "../vedic/gocharVedha";

export interface VedicPlanet {
  id: string;
  name: string;
  sanskritName: string;
  symbol: string;
  siderealLongitude: number;
  rasiIndex: number; // 0 = Mesha, 11 = Meena
  rasiName: string;
  rasiSanskrit: string;
  rasiDegree: number; // 0 to 29.999
  rasiDegreeFormatted: string;
  house: number; // 1 to 12
  nakshatraIndex: number; // 0 to 26
  nakshatraName: string;
  nakshatraLord: string;
  nakshatraDeity: string;
  pada: number; // 1 to 4
  navamsaRasiIndex: number;
  navamsaRasiName: string;
  dignity: "Exalted" | "Moolatrikona" | "Own Sign" | "Friendly" | "Neutral" | "Enemy" | "Debilitated";
  isRetrograde: boolean;
}

export interface DashaPeriod {
  planet: string;
  planetSanskrit: string;
  startDate: string; // ISO / readable date
  endDate: string;
  durationYears: number;
  isCurrent: boolean;
  subPeriods?: {
    planet: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    isPreNatal?: boolean;
    durationYears?: number;
    balanceYearsAtBirth?: number;
  }[];
}

export interface VedicYoga {
  name: string;
  sanskritName: string;
  description: string;
  isPresent: boolean;
  intensity: "High" | "Moderate" | "Subtle";
}

export interface VedicChartData {
  ayanamsa: number; // Lahiri Ayanamsa in degrees
  ayanamsaFormatted: string;
  lagna: VedicPlanet; // Ascendant
  moonSignRasi: string;
  moonSignSanskrit: string;
  birthNakshatra: string;
  birthPada: number;
  birthNakshatraLord: string;
  birthNakshatraDeity: string;
  planets: VedicPlanet[];
  houses: {
    house: number;
    rasiIndex: number;
    rasiName: string;
    planetsInHouse: string[];
  }[];
  navamsaHouses: {
    house: number;
    rasiIndex: number;
    rasiName: string;
    planetsInHouse: string[];
  }[];
  vimshottariDashas: DashaPeriod[];
  currentMahadasha: string;
  currentAntardasha: string;
  yogas: VedicYoga[];
  d9Chart?: D9Chart;
  jaiminiKarakas?: JaiminiKarakasResult;
  taraBala?: TaraBalaResult;
  gocharVedha?: GocharVedhaReport;
}

export const VEDIC_RASIS = [
  { name: "Aries", sanskrit: "Mesha (मेष)", ruler: "Mars", element: "Fire" },
  { name: "Taurus", sanskrit: "Vrishabha (वृषभ)", ruler: "Venus", element: "Earth" },
  { name: "Gemini", sanskrit: "Mithuna (मिथुन)", ruler: "Mercury", element: "Air" },
  { name: "Cancer", sanskrit: "Karka (कर्क)", ruler: "Moon", element: "Water" },
  { name: "Leo", sanskrit: "Simha (सिंह)", ruler: "Sun", element: "Fire" },
  { name: "Virgo", sanskrit: "Kanya (कन्या)", ruler: "Mercury", element: "Earth" },
  { name: "Libra", sanskrit: "Tula (तुला)", ruler: "Venus", element: "Air" },
  { name: "Scorpio", sanskrit: "Vrischika (वृश्चिक)", ruler: "Mars", element: "Water" },
  { name: "Sagittarius", sanskrit: "Dhanu (धनु)", ruler: "Jupiter", element: "Fire" },
  { name: "Capricorn", sanskrit: "Makara (मकर)", ruler: "Saturn", element: "Earth" },
  { name: "Aquarius", sanskrit: "Kumbha (कुम्भ)", ruler: "Saturn", element: "Air" },
  { name: "Pisces", sanskrit: "Meena (मीन)", ruler: "Jupiter", element: "Water" },
] as const;

export const NAKSHATRAS = [
  { name: "Ashwini", lord: "Ketu", deity: "Ashvins (Divine Physicians)", symbol: "Horse's head", gana: "Deva" },
  { name: "Bharani", lord: "Venus", deity: "Yama (God of Dharma & Death)", symbol: "Yoni / Womb", gana: "Manushya" },
  { name: "Krittika", lord: "Sun", deity: "Agni (God of Fire)", symbol: "Razor / Flame", gana: "Rakshasa" },
  { name: "Rohini", lord: "Moon", deity: "Brahma (Creator)", symbol: "Chariot / Temple", gana: "Manushya" },
  { name: "Mrigashira", lord: "Mars", deity: "Soma (Moon God / Nectar)", symbol: "Deer's head", gana: "Deva" },
  { name: "Ardra", lord: "Rahu", deity: "Rudra (Storm / Transformation)", symbol: "Teardrop / Diamond", gana: "Manushya" },
  { name: "Punarvasu", lord: "Jupiter", deity: "Aditi (Cosmic Mother)", symbol: "Bow and Quiver", gana: "Deva" },
  { name: "Pushya", lord: "Saturn", deity: "Brihaspati (Guru of Gods)", symbol: "Flower / Cow's udder", gana: "Deva" },
  { name: "Ashlesha", lord: "Mercury", deity: "Sarpas (Nagas / Serpent wisdom)", symbol: "Coiled serpent", gana: "Rakshasa" },
  { name: "Magha", lord: "Ketu", deity: "Pitris (Ancestral Lineage)", symbol: "Royal Throne", gana: "Rakshasa" },
  { name: "Purva Phalguni", lord: "Venus", deity: "Bhaga (God of Fortune & Love)", symbol: "Front legs of bed", gana: "Manushya" },
  { name: "Uttara Phalguni", lord: "Sun", deity: "Aryaman (God of Contracts & Nobility)", symbol: "Back legs of bed", gana: "Manushya" },
  { name: "Hasta", lord: "Moon", deity: "Savitr (Sun of Inspiration)", symbol: "Open Hand / Fist", gana: "Deva" },
  { name: "Chitra", lord: "Mars", deity: "Tvashtar (Divine Celestial Architect)", symbol: "Bright Jewel", gana: "Rakshasa" },
  { name: "Swati", lord: "Rahu", deity: "Vayu (God of Wind & Prana)", symbol: "Young shoot in wind", gana: "Deva" },
  { name: "Vishakha", lord: "Jupiter", deity: "Indra-Agni (Triumph & Spiritual Fire)", symbol: "Triumphal Arch", gana: "Rakshasa" },
  { name: "Anuradha", lord: "Saturn", deity: "Mitra (God of Friendship & Devotion)", symbol: "Lotus / Triumphant arch", gana: "Deva" },
  { name: "Jyeshtha", lord: "Mercury", deity: "Indra (King of Gods)", symbol: "Circular amulet / Umbrella", gana: "Rakshasa" },
  { name: "Mula", lord: "Ketu", deity: "Nirriti (Goddess of Dissolution)", symbol: "Tied bunch of roots", gana: "Rakshasa" },
  { name: "Purva Ashadha", lord: "Venus", deity: "Apas (Cosmic Waters of Life)", symbol: "Winnowing fan", gana: "Manushya" },
  { name: "Uttara Ashadha", lord: "Sun", deity: "Vishwadevas (Universal Cosmic Principles)", symbol: "Elephant tusk", gana: "Manushya" },
  { name: "Shravana", lord: "Moon", deity: "Vishnu (Preserver of Cosmos)", symbol: "Ear / Three footprints", gana: "Deva" },
  { name: "Dhanishta", lord: "Mars", deity: "Ashta Vasus (Eight Gods of Abundance)", symbol: "Drum / Flute", gana: "Rakshasa" },
  { name: "Shatabhisha", lord: "Rahu", deity: "Varuna (Cosmic Ocean & Mystic Healing)", symbol: "Empty circle / 100 physicians", gana: "Rakshasa" },
  { name: "Purva Bhadrapada", lord: "Jupiter", deity: "Aja Ekapada (One-Footed Cosmic Fire)", symbol: "Sword / Front legs of funeral cot", gana: "Manushya" },
  { name: "Uttara Bhadrapada", lord: "Saturn", deity: "Ahirbudhnya (Serpent of Deep Depths)", symbol: "Twin / Back legs of funeral cot", gana: "Manushya" },
  { name: "Revati", lord: "Mercury", deity: "Pushan (Nourisher of Travelers)", symbol: "Fish / Drum", gana: "Deva" },
];

export const VIMSHOTTARI_LORDS: { name: string; years: number; sanskrit: string }[] = [
  { name: "Ketu", years: 7, sanskrit: "केतु" },
  { name: "Venus", years: 20, sanskrit: "शुक्र" },
  { name: "Sun", years: 6, sanskrit: "सूर्य" },
  { name: "Moon", years: 10, sanskrit: "चन्द्र" },
  { name: "Mars", years: 7, sanskrit: "मंगल" },
  { name: "Rahu", years: 18, sanskrit: "राहु" },
  { name: "Jupiter", years: 16, sanskrit: "बृहस्पति" },
  { name: "Saturn", years: 19, sanskrit: "शनि" },
  { name: "Mercury", years: 17, sanskrit: "बुध" },
];

const PLANET_SANSKRIT: Record<string, string> = {
  Sun: "Surya (सूर्य)",
  Moon: "Chandra (चन्द्र)",
  Mars: "Mangala (मंगल)",
  Mercury: "Budha (बुध)",
  Jupiter: "Guru (बृहस्पति)",
  Venus: "Shukra (शुक्र)",
  Saturn: "Shani (शनि)",
  Rahu: "Rahu (राहु)",
  Ketu: "Ketu (केतु)",
  Ascendant: "Lagna (लग्न)",
};

/**
 * Uses the shared Lahiri-style ayanamsa approximation from the astronomy facade.
 * This keeps Western sidereal positions and Vedic chart conversion on one model.
 * The shared model is not a native Swiss Ephemeris SE_SIDM_LAHIRI calculation.
 */
export function calculateLahiriAyanamsa(jd: number): number {
  return swissEphemeris.getAyanamsa(jd);
}

/**
 * Determine Navamsa (D9) sign from sidereal longitude
 */
export function calculateNavamsa(siderealLon: number): { rasiIndex: number; rasiName: string } {
  const norm = normalizeDegrees(siderealLon);
  const rasiIdx = Math.floor(norm / 30);
  const degInRasi = norm - rasiIdx * 30;
  const navamsaPart = Math.floor(degInRasi / (30.0 / 9.0)); // 0 to 8

  // Fire signs (0, 4, 8) start at Aries (0)
  // Earth signs (1, 5, 9) start at Capricorn (9)
  // Air signs (2, 6, 10) start at Libra (6)
  // Water signs (3, 7, 11) start at Cancer (3)
  const elementStarts = [0, 9, 6, 3];
  const startSign = elementStarts[rasiIdx % 4];
  const navamsaRasiIdx = (startSign + navamsaPart) % 12;

  return {
    rasiIndex: navamsaRasiIdx,
    rasiName: VEDIC_RASIS[navamsaRasiIdx].name,
  };
}

/**
 * Evaluates dignity of a planet in a sidereal sign
 */
function evaluateDignity(
  planetName: string,
  rasiIdx: number,
  degInRasi: number
): VedicPlanet["dignity"] {
  switch (planetName) {
    case "Sun":
      if (rasiIdx === 0) return "Exalted"; // Aries
      if (rasiIdx === 6) return "Debilitated"; // Libra
      if (rasiIdx === 4) return degInRasi <= 20 ? "Moolatrikona" : "Own Sign"; // Leo
      if ([8, 3].includes(rasiIdx)) return "Friendly"; // Sagittarius, Cancer
      if ([1, 10, 11].includes(rasiIdx)) return "Enemy"; // Taurus, Capricorn, Aquarius
      return "Neutral";

    case "Moon":
      if (rasiIdx === 1) return degInRasi <= 3 ? "Exalted" : "Moolatrikona"; // Taurus
      if (rasiIdx === 7) return "Debilitated"; // Scorpio
      if (rasiIdx === 3) return "Own Sign"; // Cancer
      if ([0, 2, 4, 5].includes(rasiIdx)) return "Friendly";
      return "Neutral";

    case "Mars":
      if (rasiIdx === 9) return "Exalted"; // Capricorn
      if (rasiIdx === 3) return "Debilitated"; // Cancer
      if (rasiIdx === 0) return degInRasi <= 12 ? "Moolatrikona" : "Own Sign"; // Aries
      if (rasiIdx === 7) return "Own Sign"; // Scorpio
      if ([4, 8, 11].includes(rasiIdx)) return "Friendly";
      return "Neutral";

    case "Mercury":
      if (rasiIdx === 5) return degInRasi <= 15 ? "Exalted" : "Moolatrikona"; // Virgo
      if (rasiIdx === 11) return "Debilitated"; // Pisces
      if (rasiIdx === 2) return "Own Sign"; // Gemini
      if ([1, 4, 6].includes(rasiIdx)) return "Friendly";
      return "Neutral";

    case "Jupiter":
      if (rasiIdx === 3) return "Exalted"; // Cancer
      if (rasiIdx === 9) return "Debilitated"; // Capricorn
      if (rasiIdx === 8) return degInRasi <= 10 ? "Moolatrikona" : "Own Sign"; // Sagittarius
      if (rasiIdx === 11) return "Own Sign"; // Pisces
      if ([0, 4, 7].includes(rasiIdx)) return "Friendly";
      return "Neutral";

    case "Venus":
      if (rasiIdx === 11) return "Exalted"; // Pisces
      if (rasiIdx === 5) return "Debilitated"; // Virgo
      if (rasiIdx === 6) return degInRasi <= 15 ? "Moolatrikona" : "Own Sign"; // Libra
      if (rasiIdx === 1) return "Own Sign"; // Taurus
      if ([2, 9, 10].includes(rasiIdx)) return "Friendly";
      return "Neutral";

    case "Saturn":
      if (rasiIdx === 6) return "Exalted"; // Libra
      if (rasiIdx === 0) return "Debilitated"; // Aries
      if (rasiIdx === 10) return degInRasi <= 20 ? "Moolatrikona" : "Own Sign"; // Aquarius
      if (rasiIdx === 9) return "Own Sign"; // Capricorn
      if ([1, 2, 5].includes(rasiIdx)) return "Friendly";
      return "Neutral";

    case "Rahu":
      if (rasiIdx === 1 || rasiIdx === 2) return "Exalted";
      if (rasiIdx === 7 || rasiIdx === 8) return "Debilitated";
      if (rasiIdx === 10) return "Own Sign";
      return "Neutral";

    case "Ketu":
      if (rasiIdx === 7 || rasiIdx === 8) return "Exalted";
      if (rasiIdx === 1 || rasiIdx === 2) return "Debilitated";
      if (rasiIdx === 8) return "Own Sign";
      return "Neutral";

    default:
      return "Neutral";
  }
}

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function formatDeterministicDate(d: Date, includeDay = true): string {
  const m = MONTHS_SHORT[d.getUTCMonth()];
  const y = d.getUTCFullYear();
  if (!includeDay) return `${m} ${y}`;
  return `${m} ${d.getUTCDate()}, ${y}`;
}

/**
 * Vimshottari Dasha cycle generation starting from birth date and Moon Nakshatra fraction.
 * Reconstructs continuous timeline from the theoretical commencement of the birth Mahadasha,
 * accurately identifying pre-natal vs active vs post-natal Antardashas according to classical Parashari Jyotish.
 */
export function calculateVimshottariDashas(
  birthDate: Date,
  moonSiderealLon: number,
  referenceDate: Date = new Date()
): { dashas: DashaPeriod[]; currentMaha: string; currentAntar: string } {
  const nakshatraSpan = 360.0 / 27.0; // 13.333333 degrees
  const normMoon = normalizeDegrees(moonSiderealLon);
  const nakshatraIdx = Math.floor(normMoon / nakshatraSpan);
  const degInNakshatra = normMoon - nakshatraIdx * nakshatraSpan;
  const fractionElapsed = degInNakshatra / nakshatraSpan;

  // Identify ruler of the birth nakshatra
  const lordIndexInCycle = nakshatraIdx % 9;
  const initialLord = VIMSHOTTARI_LORDS[lordIndexInCycle];
  const balanceYears = initialLord.years * (1.0 - fractionElapsed);

  const dashas: DashaPeriod[] = [];
  let currentMaha = "";
  let currentAntar = "";

  const birthTimeMs = birthDate.getTime();
  const refTimeMs = referenceDate.getTime();

  // Theoretical commencement instant of the birth Mahadasha prior to birth
  const elapsedYearsPriorToBirth = initialLord.years * fractionElapsed;
  const elapsedPriorMs = elapsedYearsPriorToBirth * 365.2422 * 24 * 3600 * 1000;
  const theoreticalStartMs = birthTimeMs - elapsedPriorMs;

  let cursorTime = birthTimeMs;
  let activeBirthAntarName = "";

  for (let i = 0; i < 9; i++) {
    const lordIdx = (lordIndexInCycle + i) % 9;
    const lord = VIMSHOTTARI_LORDS[lordIdx];
    const duration = i === 0 ? balanceYears : lord.years;
    const durationMs = duration * 365.2422 * 24 * 3600 * 1000;
    const startTime = cursorTime;
    const endTime = startTime + durationMs;
    cursorTime = endTime;

    const startDateObj = new Date(startTime);
    const endDateObj = new Date(endTime);

    // Mahadasha is current if referenceDate falls between this Mahadasha's living start and end
    const isCurrent = refTimeMs >= startTime && refTimeMs < endTime;
    if (isCurrent) {
      currentMaha = lord.name;
    }

    const subPeriods: NonNullable<DashaPeriod["subPeriods"]> = [];

    if (i === 0) {
      // -----------------------------------------------------------------------
      // Birth Mahadasha: Reconstruct continuous Antardasha timeline from theoreticalStartMs
      // -----------------------------------------------------------------------
      let subCursor = theoreticalStartMs;

      for (let j = 0; j < 9; j++) {
        const antarLordIdx = (lordIdx + j) % 9;
        const antarLord = VIMSHOTTARI_LORDS[antarLordIdx];
        // Nominal Antardasha duration = (MahaYears * AntarYears) / 120
        const antarDurationYears = (lord.years * antarLord.years) / 120.0;
        const subDurationMs = antarDurationYears * 365.2422 * 24 * 3600 * 1000;
        const subStart = subCursor;
        const subEnd = subStart + subDurationMs;
        subCursor = subEnd;

        const isPreNatal = subEnd <= birthTimeMs;
        const isActiveAtBirth = subStart <= birthTimeMs && birthTimeMs < subEnd;
        const isPostNatal = subStart > birthTimeMs;

        if (isActiveAtBirth) {
          activeBirthAntarName = antarLord.name;
        }

        // Remaining balance from birth instant (in years)
        let balanceYearsAtBirth = 0;
        if (isActiveAtBirth) {
          balanceYearsAtBirth = (subEnd - birthTimeMs) / (365.2422 * 24 * 3600 * 1000);
        } else if (isPostNatal) {
          balanceYearsAtBirth = antarDurationYears;
        }

        // Antardasha is current if reference date is after birth and inside this Antardasha
        const isSubCurrent = refTimeMs >= Math.max(birthTimeMs, subStart) && refTimeMs < subEnd;
        if (isSubCurrent) {
          currentAntar = antarLord.name;
        }

        subPeriods.push({
          planet: antarLord.name,
          startDate: formatDeterministicDate(new Date(subStart), false),
          endDate: formatDeterministicDate(new Date(subEnd), false),
          isCurrent: isSubCurrent,
          isPreNatal,
          durationYears: Math.round(antarDurationYears * 10000) / 10000,
          balanceYearsAtBirth: Math.round(balanceYearsAtBirth * 10000) / 10000,
        });
      }
    } else {
      // -----------------------------------------------------------------------
      // Subsequent Mahadashas: Standard chronological layout of all 9 Antardashas
      // -----------------------------------------------------------------------
      let subCursor = startTime;

      for (let j = 0; j < 9; j++) {
        const antarLordIdx = (lordIdx + j) % 9;
        const antarLord = VIMSHOTTARI_LORDS[antarLordIdx];
        const antarDurationYears = (lord.years * antarLord.years) / 120.0;
        const subDurationMs = antarDurationYears * 365.2422 * 24 * 3600 * 1000;
        const subStart = subCursor;
        const subEnd = subStart + subDurationMs;
        subCursor = subEnd;

        const isSubCurrent = refTimeMs >= subStart && refTimeMs < subEnd;
        if (isSubCurrent) {
          currentAntar = antarLord.name;
        }

        subPeriods.push({
          planet: antarLord.name,
          startDate: formatDeterministicDate(new Date(subStart), false),
          endDate: formatDeterministicDate(new Date(subEnd), false),
          isCurrent: isSubCurrent,
          isPreNatal: false,
          durationYears: Math.round(antarDurationYears * 10000) / 10000,
          balanceYearsAtBirth: Math.round(antarDurationYears * 10000) / 10000,
        });
      }
    }

    dashas.push({
      planet: lord.name,
      planetSanskrit: lord.sanskrit,
      startDate: formatDeterministicDate(startDateObj, true),
      endDate: formatDeterministicDate(endDateObj, true),
      durationYears: Math.round(duration * 10) / 10,
      isCurrent,
      subPeriods,
    });
  }

  return {
    dashas,
    currentMaha: currentMaha || dashas[0]?.planet,
    currentAntar: currentAntar || activeBirthAntarName || dashas[0]?.planet,
  };
}

/**
 * Detect auspicious Vedic Yogas in the sidereal chart
 */
export function detectVedicYogas(planets: VedicPlanet[], lagnaRasi: number): VedicYoga[] {
  const yogas: VedicYoga[] = [];

  const getPlanet = (name: string) => planets.find((p) => p.name === name);
  const sun = getPlanet("Sun");
  const moon = getPlanet("Moon");
  const mars = getPlanet("Mars");
  const mercury = getPlanet("Mercury");
  const jupiter = getPlanet("Jupiter");
  const venus = getPlanet("Venus");
  const saturn = getPlanet("Saturn");

  // 1. Gaja Kesari Yoga: Jupiter in Kendra (1, 4, 7, 10) from Moon
  if (jupiter && moon) {
    const diff = (jupiter.rasiIndex - moon.rasiIndex + 12) % 12;
    if ([0, 3, 6, 9].includes(diff)) {
      yogas.push({
        name: "Gaja Kesari Yoga",
        sanskritName: "गजकेसरी योग",
        description:
          "Formed when Jupiter is in a quadrant (1st, 4th, 7th, 10th) from Moon. Grants commanding presence, wisdom, spotless reputation, and boundless intellectual resources.",
        isPresent: true,
        intensity: diff === 0 || jupiter.dignity === "Exalted" ? "High" : "Moderate",
      });
    }
  }

  // 2. Budhaditya Yoga: Sun and Mercury together in the same Rasi
  if (sun && mercury && sun.rasiIndex === mercury.rasiIndex) {
    yogas.push({
      name: "Budhaditya Yoga",
      sanskritName: "बुधादित्य योग",
      description:
        "Formed when the Sun and Mercury conjoin in the same sign. Confers intellectual brilliance, razor-sharp analytical powers, eloquent speech, and administrative mastery.",
      isPresent: true,
      intensity: Math.abs(sun.siderealLongitude - mercury.siderealLongitude) < 5 ? "High" : "Moderate",
    });
  }

  // 3. Chandra-Mangala Yoga: Moon and Mars together or mutually aspecting
  if (moon && mars && (moon.rasiIndex === mars.rasiIndex || (moon.rasiIndex - mars.rasiIndex + 12) % 12 === 6)) {
    yogas.push({
      name: "Chandra Mangala Yoga",
      sanskritName: "चन्द्र मंगल योग",
      description:
        "Combination of Moon (intuition/water) and Mars (action/fire). Generates tremendous commercial acumen, fierce protective determination, and wealth-building momentum.",
      isPresent: true,
      intensity: "Moderate",
    });
  }

  // 4. Pancha Mahapurusha Yogas (Hamsa, Malavya, Ruchaka, Bhadra, Sasa)
  // Mars in Kendra (1, 4, 7, 10 from Lagna) in Own/Exalted sign -> Ruchaka Yoga
  if (mars && [0, 3, 6, 9].includes((mars.rasiIndex - lagnaRasi + 12) % 12) && ["Exalted", "Own Sign"].includes(mars.dignity)) {
    yogas.push({
      name: "Ruchaka Yoga (Mahapurusha)",
      sanskritName: "रुचक महापुरुष योग",
      description:
        "Mars exalted or in own house in an angle from Lagna. Bestows heroic physical vitality, unyielding courage, tactical leadership, and victorious enterprise.",
      isPresent: true,
      intensity: "High",
    });
  }

  // Jupiter in Kendra in Own/Exalted -> Hamsa Yoga
  if (jupiter && [0, 3, 6, 9].includes((jupiter.rasiIndex - lagnaRasi + 12) % 12) && ["Exalted", "Own Sign"].includes(jupiter.dignity)) {
    yogas.push({
      name: "Hamsa Yoga (Mahapurusha)",
      sanskritName: "हंस महापुरुष योग",
      description:
        "Jupiter exalted or in own house in a Kendra from Lagna. Bestows divine virtue, spiritual radiance, pure conscience, and universal respect as a mentor or guide.",
      isPresent: true,
      intensity: "High",
    });
  }

  // Venus in Kendra in Own/Exalted -> Malavya Yoga
  if (venus && [0, 3, 6, 9].includes((venus.rasiIndex - lagnaRasi + 12) % 12) && ["Exalted", "Own Sign"].includes(venus.dignity)) {
    yogas.push({
      name: "Malavya Yoga (Mahapurusha)",
      sanskritName: "मालव्य महापुरुष योग",
      description:
        "Venus exalted or in own house in an angle from Lagna. Bestows supreme aesthetic refinement, sensual magnetism, luxurious comforts, and artistic eminence.",
      isPresent: true,
      intensity: "High",
    });
  }

  // Saturn in Kendra in Own/Exalted -> Sasa Yoga
  if (saturn && [0, 3, 6, 9].includes((saturn.rasiIndex - lagnaRasi + 12) % 12) && ["Exalted", "Own Sign"].includes(saturn.dignity)) {
    yogas.push({
      name: "Sasa Yoga (Mahapurusha)",
      sanskritName: "शश महापुरुष योग",
      description:
        "Saturn exalted or in own sign in a Kendra. Bestows profound endurance, sovereign authority over large bodies of people, mastery of time, and lasting historical legacy.",
      isPresent: true,
      intensity: "High",
    });
  }

  // 5. Amala Yoga: Natural benefic (Jupiter, Venus, or Mercury) in 10th house from Lagna or Moon
  const tenthFromLagna = (lagnaRasi + 9) % 12;
  if (
    (jupiter && jupiter.rasiIndex === tenthFromLagna) ||
    (venus && venus.rasiIndex === tenthFromLagna) ||
    (mercury && mercury.rasiIndex === tenthFromLagna)
  ) {
    yogas.push({
      name: "Amala Yoga",
      sanskritName: "अमल योग",
      description:
        "A benefic occupies the 10th house of worldly actions. Grants an unblemished moral career, widespread philanthropic influence, and lasting noble honors.",
      isPresent: true,
      intensity: "Moderate",
    });
  }

  return yogas;
}

/**
 * Main Vedic Chart generator from Western calculated data
 */
export function calculateVedicChart(
  westernData: WesternChartData,
  birthDate: Date
): VedicChartData {
  const ayanamsa = calculateLahiriAyanamsa(westernData.julianDay);
  const d = Math.floor(ayanamsa);
  const m = Math.floor((ayanamsa - d) * 60);
  const s = Math.round(((ayanamsa - d) * 60 - m) * 60);
  const ayanamsaFormatted = `${d}°${m.toString().padStart(2, "0")}'${s.toString().padStart(2, "0")}" (Lahiri)`;

  // Convert Ascendant to Sidereal
  const siderealAscLon = normalizeDegrees(westernData.ascendant.longitude - ayanamsa);
  const lagnaRasiIdx = Math.floor(siderealAscLon / 30);
  const lagnaDegInRasi = siderealAscLon - lagnaRasiIdx * 30;
  const lagnaNavamsa = calculateNavamsa(siderealAscLon);
  const nakshatraSpan = 360.0 / 27.0;
  const lagnaNakIdx = Math.floor(siderealAscLon / nakshatraSpan);
  const lagnaPada = Math.floor((siderealAscLon - lagnaNakIdx * nakshatraSpan) / (nakshatraSpan / 4)) + 1;

  const lagnaPlanet: VedicPlanet = {
    id: "Ascendant",
    name: "Ascendant",
    sanskritName: "Lagna (लग्न)",
    symbol: "AC",
    siderealLongitude: siderealAscLon,
    rasiIndex: lagnaRasiIdx,
    rasiName: VEDIC_RASIS[lagnaRasiIdx].name,
    rasiSanskrit: VEDIC_RASIS[lagnaRasiIdx].sanskrit,
    rasiDegree: lagnaDegInRasi,
    rasiDegreeFormatted: `${Math.floor(lagnaDegInRasi)}°${Math.floor((lagnaDegInRasi % 1) * 60)}' ${VEDIC_RASIS[lagnaRasiIdx].name}`,
    house: 1,
    nakshatraIndex: lagnaNakIdx,
    nakshatraName: NAKSHATRAS[lagnaNakIdx]?.name || "Ashwini",
    nakshatraLord: NAKSHATRAS[lagnaNakIdx]?.lord || "Ketu",
    nakshatraDeity: NAKSHATRAS[lagnaNakIdx]?.deity || "",
    pada: lagnaPada,
    navamsaRasiIndex: lagnaNavamsa.rasiIndex,
    navamsaRasiName: lagnaNavamsa.rasiName,
    dignity: "Neutral",
    isRetrograde: false,
  };

  // Process all planets to Sidereal
  const vedicPlanets: VedicPlanet[] = [];

  for (const wp of westernData.planets) {
    const siderealLon = normalizeDegrees(wp.longitude - ayanamsa);
    const rasiIdx = Math.floor(siderealLon / 30);
    const degInRasi = siderealLon - rasiIdx * 30;
    const nakIdx = Math.floor(siderealLon / nakshatraSpan);
    const pada = Math.floor((siderealLon - nakIdx * nakshatraSpan) / (nakshatraSpan / 4)) + 1;
    const nav = calculateNavamsa(siderealLon);
    const dignity = evaluateDignity(wp.name, rasiIdx, degInRasi);

    // In Vedic Whole Sign house system (standard Jyotish), house = (rasiIdx - lagnaRasiIdx + 12) % 12 + 1
    const house = ((rasiIdx - lagnaRasiIdx + 12) % 12) + 1;

    vedicPlanets.push({
      id: wp.id,
      name: wp.name,
      sanskritName: PLANET_SANSKRIT[wp.name] || wp.name,
      symbol: wp.symbol,
      siderealLongitude: siderealLon,
      rasiIndex: rasiIdx,
      rasiName: VEDIC_RASIS[rasiIdx].name,
      rasiSanskrit: VEDIC_RASIS[rasiIdx].sanskrit,
      rasiDegree: degInRasi,
      rasiDegreeFormatted: `${Math.floor(degInRasi)}°${Math.floor((degInRasi % 1) * 60)}' ${VEDIC_RASIS[rasiIdx].name}`,
      house,
      nakshatraIndex: nakIdx,
      nakshatraName: NAKSHATRAS[nakIdx]?.name || "Ashwini",
      nakshatraLord: NAKSHATRAS[nakIdx]?.lord || "Ketu",
      nakshatraDeity: NAKSHATRAS[nakIdx]?.deity || "",
      pada,
      navamsaRasiIndex: nav.rasiIndex,
      navamsaRasiName: nav.rasiName,
      dignity,
      isRetrograde: wp.isRetrograde,
    });
  }

  // Moon details
  const moon = vedicPlanets.find((p) => p.name === "Moon") || vedicPlanets[0];
  const moonSignRasi = moon.rasiName;
  const moonSignSanskrit = moon.rasiSanskrit;
  const birthNakshatra = moon.nakshatraName;
  const birthPada = moon.pada;
  const birthNakshatraLord = moon.nakshatraLord;
  const birthNakshatraDeity = moon.nakshatraDeity;

  // Build 12 Vedic Houses (Rasi Kundli)
  const houses = [];
  for (let h = 1; h <= 12; h++) {
    const rasiIdx = (lagnaRasiIdx + h - 1) % 12;
    const planetsInH = vedicPlanets
      .filter((p) => p.house === h)
      .map((p) => p.name);
    if (h === 1) planetsInH.unshift("Lagna");

    houses.push({
      house: h,
      rasiIndex: rasiIdx,
      rasiName: VEDIC_RASIS[rasiIdx].name,
      planetsInHouse: planetsInH,
    });
  }

  // Build Navamsa (D9) Houses
  const navamsaLagnaRasi = lagnaPlanet.navamsaRasiIndex;
  const navamsaHouses = [];
  for (let h = 1; h <= 12; h++) {
    const rasiIdx = (navamsaLagnaRasi + h - 1) % 12;
    const planetsInH = vedicPlanets
      .filter((p) => ((p.navamsaRasiIndex - navamsaLagnaRasi + 12) % 12) + 1 === h)
      .map((p) => p.name);
    if (h === 1) planetsInH.unshift("Lagna");

    navamsaHouses.push({
      house: h,
      rasiIndex: rasiIdx,
      rasiName: VEDIC_RASIS[rasiIdx].name,
      planetsInHouse: planetsInH,
    });
  }

  // Vimshottari Dashas
  const { dashas, currentMaha, currentAntar } = calculateVimshottariDashas(birthDate, moon.siderealLongitude);

  // Yogas
  const yogas = detectVedicYogas(vedicPlanets, lagnaRasiIdx);

  // Complete D9 Navamsa Chart & Analysis
  const d9Chart = new D9ChartEngine().calculateCompleteD9Chart({
    ascendant: lagnaPlanet.siderealLongitude,
    planets: Object.fromEntries(
      vedicPlanets.map((p) => [p.name, { longitude: p.siderealLongitude, isRetrograde: p.isRetrograde }])
    ),
  });

  // Jaimini Chara Karakas (7-Karaka System)
  const jaiminiEngine = new JaiminiKarakasEngine();
  const jaiminiKarakas = jaiminiEngine.calculate7Karakas(vedicPlanets);

  // Tara Bala (9-Tara Chakra for birth Nakshatra)
  const taraBalaEngine = new TaraBalaEngine();
  const taraBala = taraBalaEngine.calculateTaraBala(moon.nakshatraIndex);

  // Gochar Vedha (Classical transit obstruction relative to natal Moon)
  const gocharEngine = new GocharVedhaEngine();
  const gocharVedha = gocharEngine.evaluateAllTransits(
    moon.rasiIndex,
    vedicPlanets.map((p) => ({ planet: p.name, rasiIndex: p.rasiIndex }))
  );

  return {
    ayanamsa,
    ayanamsaFormatted,
    lagna: lagnaPlanet,
    moonSignRasi,
    moonSignSanskrit,
    birthNakshatra,
    birthPada,
    birthNakshatraLord,
    birthNakshatraDeity,
    planets: vedicPlanets,
    houses,
    navamsaHouses,
    vimshottariDashas: dashas,
    currentMahadasha: currentMaha,
    currentAntardasha: currentAntar,
    yogas,
    d9Chart,
    jaiminiKarakas,
    taraBala,
    gocharVedha,
  };
}
