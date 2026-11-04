/**
 * Master Universal Numerology Orchestrator
 * Integrates:
 * 1. Complete Pythagorean System (14 Numbers)
 * 2. Indian Vedic Sankhya Shastra (12 Elements + Full Remedies)
 * 3. Chaldean System (Compound Numbers 10-52)
 * 4. Chinese Lo Shu Grid (3x3 Magic Square, 16 Arrows, Missing/Excess)
 * 5. Kabbalah Tree of Life (Hebrew Gematria, 10 Sephiroth, 22 Paths & Tarot)
 * 6. Tamil En Kaniyam (Janma En, Vidhi En, Tamil Graha Guidance)
 * 7. Cross-System Synthesis & Resonance Matrix
 */

import { CompleteNumerologyReport } from "./types";
import { calculateCompletePythagoreanProfile } from "./pythagorean";
import { calculateCompleteVedicProfile } from "./vedic";
import { calculateCompleteChaldeanProfile, CHALDEAN_COMPOUND_DATABASE } from "./chaldean";
import { LoShuGridCalculator } from "./loshu";
import { calculateKabbalahProfile } from "./kabbalah";
import { calculateTamilNumerology } from "./tamil";

export * from "./types";
export * from "./pythagorean";
export * from "./vedic";
export * from "./chaldean";
export * from "./loshu";
export * from "./kabbalah";
export * from "./tamil";

export function calculateCompleteNumerologyReport(
  fullName: string,
  birthYear: number,
  birthMonth: number,
  birthDay: number
): CompleteNumerologyReport {
  // 1. Pythagorean Profile (All 14 Numbers)
  const pythagorean = calculateCompletePythagoreanProfile(fullName, birthYear, birthMonth, birthDay);

  // 2. Indian Vedic Profile (All 12 Elements + Full Remedies)
  const vedic = calculateCompleteVedicProfile(fullName, birthYear, birthMonth, birthDay);

  // 3. Chaldean Profile (Compound 10-52)
  const chaldean = calculateCompleteChaldeanProfile(fullName);

  // 4. Chinese Lo Shu Grid (3x3 Magic Square, 16 Arrows)
  const loShu = LoShuGridCalculator.calculate(birthYear, birthMonth, birthDay);

  // 5. Kabbalah Tree of Life (10 Sephiroth, 22 Paths)
  const kabbalah = calculateKabbalahProfile(fullName);

  // 6. Tamil En Kaniyam
  const tamil = calculateTamilNumerology(fullName, birthYear, birthMonth, birthDay);

  // 7. Cross-System Synthesis
  // Assess numerical resonance across systems:
  // - Pythagorean Life Path vs. Vedic Bhagyank vs. Chaldean Root vs. Tamil Vidhi En
  const pythLP = pythagorean.lifePathNumber;
  const vedicBhagyank = vedic.bhagyank;
  const chaldeanRoot = chaldean.fullName.singleRoot;
  const tamilVidhi = tamil.vidhiEn;

  let matchPoints = 0;
  if (pythLP === vedicBhagyank || (pythLP > 9 && pythLP % 9 === vedicBhagyank % 9)) matchPoints += 30;
  if (chaldeanRoot === pythLP || (pythLP > 9 && chaldeanRoot === pythLP % 9)) matchPoints += 25;
  if (tamilVidhi === vedicBhagyank) matchPoints += 25;
  if (loShu.arrowsOfStrength.some((a) => a.isPresent)) matchPoints += 20;

  const resonanceScore = Math.min(98, Math.max(65, matchPoints));

  const archetypesMap: Record<number, string> = {
    1: "The Sovereign Pioneer & Solar Luminary",
    2: "The Sacred Harmonizer & Lunar Peacemaker",
    3: "The Wise Luminary & Creative Visionary",
    4: "The Master Architect & Grounded Foundation",
    5: "The Dynamic Explorer & Mercury Catalyst",
    6: "The Guardian of Beauty & Nurturing Healer",
    7: "The Mystic Philosopher & Truth Seeker",
    8: "The Sovereign Executive & Karmic Magus",
    9: "The Universal Humanitarian & Cosmic Philanthropist",
    11: "The Illuminated Messenger & High Visionary",
    22: "The Master Builder & Monumental Manifestor",
    33: "The Avatar of Cosmic Love & Master Teacher",
  };

  const unifiedArchetype =
    archetypesMap[pythagorean.lifePathNumber] || archetypesMap[vedic.bhagyank] || "The Sacred Universal Creator";

  const coreKarmicTheme = `You are an incarnation of ${unifiedArchetype}. Across global numerology systems, your soul vibrates with the foundational leadership of ${vedic.rulingPlanetMulank.planet}, governed occultly by Chaldean Compound ${chaldean.fullName.compoundNumber} (${chaldean.fullName.compoundMeaning.title}), channeled through Sephirah ${kabbalah.outerLifeSephirah.name} on the Tree of Life.`;

  const actionableDirectives = [
    `Align your primary actions with your Mulank ruler ${vedic.rulingPlanetMulank.planet}; observe ${vedic.rulingPlanetMulank.day} as your sacred weekly power day.`,
    `Heed the ancient Chaldean occult counsel for Compound ${chaldean.fullName.compoundNumber}: ${chaldean.fullName.compoundMeaning.advice}`,
    `Channel your ${pythagorean.expressionPlanes.dominantPlane} Plane dominance into disciplined daily execution.`,
    loShu.missingNumbers.length > 0
      ? `Harmonize missing Lo Shu sector (${loShu.missingNumbers[0].number} - ${loShu.missingNumbers[0].element}): ${loShu.missingNumbers[0].fengShuiRemedy}`
      : "Your Lo Shu energy grid is remarkably saturated; focus on maintaining balance in the central Tai Chi.",
    `Kabbalistic Wisdom: Meditate upon Sephirah ${kabbalah.soulSephirah.name} (${kabbalah.soulSephirah.meaning}) to nourish your deepest soul essence.`,
  ];

  return {
    fullName,
    birthYear,
    birthMonth,
    birthDay,
    pythagorean,
    vedic,
    chaldean,
    loShu,
    kabbalah,
    tamil,
    crossSystemSynthesis: {
      resonanceScore,
      unifiedArchetype,
      coreKarmicTheme,
      actionableDirectives,
    },
  };
}
