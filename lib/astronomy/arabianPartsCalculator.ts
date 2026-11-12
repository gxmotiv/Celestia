/**
 * Arabian Parts (Lots) Calculation System
 * Implements classical diurnal/nocturnal Hellenistic and Medieval Arabic formulas:
 * - Part of Fortune: Day: ASC + Moon - Sun; Night: ASC + Sun - Moon
 * - Part of Spirit (Pars Solis): Day: ASC + Sun - Moon; Night: ASC + Moon - Sun
 * - Part of Eros: Day: ASC + Venus - Spirit; Night: ASC + Spirit - Venus
 * - Part of Necessity: Day: ASC + Fortune - Mercury; Night: ASC + Mercury - Fortune
 * - Part of Courage: Day: ASC + Fortune - Mars; Night: ASC + Mars - Fortune
 * - Part of Victory: Day: ASC + Jupiter - Spirit; Night: ASC + Spirit - Jupiter
 * - Part of Marriage: selected ASC/DSC/Venus variant; traditions differ
 * - Part of Death: ASC + 8th Cusp - Moon
 * - Part of Mother: Day: ASC + Moon - Venus; Night: ASC + Venus - Moon
 * - Part of Father: Day: ASC + Sun - Saturn; Night: ASC + Saturn - Sun
 * - Part of Career / Profession: Day: ASC + Moon - Saturn; Night: ASC + Saturn - Moon
 * - Part of Foreign Travel: ASC + 9th-house degree - 9th-house ruler (same by day and night)
 * - Health/Sickness and Mars-Saturn lots are historical/experimental symbolic variants, not medical predictors
 * - Part of Nemesis: Day: ASC + Fortune - Saturn; Night: ASC + Saturn - Fortune
 */

import { normalizeDegrees, formatDegreeMinute, ZODIAC_SIGNS } from "./ephemeris";

export interface ArabianPart {
  id: string;
  name: string;
  formula: string;
  longitude: number;
  sign: string;
  signIndex: number;
  signDegree: number;
  signDegreeFormatted: string;
  house: number;
  interpretation: string;
  symbol: string;
}

export interface ArabianPartsResult {
  isDayChart: boolean;
  partOfFortune: ArabianPart;
  partOfSpirit: ArabianPart;
  partOfLove: ArabianPart;
  partOfNecessity: ArabianPart;
  partOfCourage: ArabianPart;
  partOfVictory: ArabianPart;
  partOfMarriage: ArabianPart;
  partOfDeath: ArabianPart;
  partOfMother: ArabianPart;
  partOfFather: ArabianPart;
  partOfCareer: ArabianPart;
  partOfTravel: ArabianPart;
  partOfHealth: ArabianPart;
  partOfSurgery: ArabianPart;
  partOfCatastrophe: ArabianPart;
  /** Clear canonical name; alias retained for backwards compatibility. */
  partOfNemesis: ArabianPart;
  allParts: ArabianPart[];
}

export class ArabianPartsCalculator {
  private assignHouse(lon: number, cusps: number[]): number {
    if (!cusps || cusps.length < 12) return 1;
    for (let i = 0; i < 12; i++) {
      const current = cusps[i];
      const next = cusps[(i + 1) % 12];
      if (next > current) {
        if (lon >= current && lon < next) return i + 1;
      } else {
        if (lon >= current || lon < next) return i + 1;
      }
    }
    return 1;
  }

  private buildPart(
    id: string,
    name: string,
    formula: string,
    rawLon: number,
    cusps: number[],
    interpretation: string,
    symbol = "⊗"
  ): ArabianPart {
    const lon = normalizeDegrees(rawLon);
    const signIndex = Math.floor(lon / 30);
    const signData = ZODIAC_SIGNS[signIndex] || ZODIAC_SIGNS[0];
    const signDegree = lon - signIndex * 30;
    const house = this.assignHouse(lon, cusps);

    return {
      id,
      name,
      formula,
      longitude: Math.round(lon * 1000) / 1000,
      sign: signData.name,
      signIndex,
      signDegree: Math.round(signDegree * 1000) / 1000,
      signDegreeFormatted: formatDegreeMinute(lon),
      house,
      interpretation: `${interpretation} Located in ${signData.name} in the ${house}th House.`,
      symbol,
    };
  }

  /**
   * Calculate seven Hermetic Lots plus selected additional medieval formula variants
   */
  public calculateAll(params: {
    ascendant: number;
    sun: number;
    moon: number;
    mercury: number;
    venus: number;
    mars: number;
    jupiter: number;
    saturn: number;
    houseCusps: number[];
    /** Must be derived from actual solar altitude, never inferred from ecliptic arc alone. */
    isDayChart: boolean;
  }): ArabianPartsResult {
    const { ascendant: ASC, sun: Sun, moon: Moon, mercury: Mercury, venus: Venus, mars: Mars, jupiter: Jupiter, saturn: Saturn, houseCusps, isDayChart } = params;
    const isDay = isDayChart;
    const coordinates = [ASC, Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn];
    if (!coordinates.every(Number.isFinite)) {
      throw new RangeError("Lot calculations require finite planetary and Ascendant longitudes.");
    }
    if (houseCusps.length !== 12 || !houseCusps.every(Number.isFinite)) {
      throw new RangeError("Lot calculations require exactly twelve finite house cusps.");
    }

    const cusp8 = houseCusps[7];
    const cusp9 = houseCusps[8];
    const DSC = normalizeDegrees(ASC + 180);

    // 1. Part of Fortune (Pars Fortunae)
    const fortuneLon = isDay ? ASC + Moon - Sun : ASC + Sun - Moon;
    const partOfFortune = this.buildPart(
      "fortune",
      "Part of Fortune",
      isDay ? "ASC + Moon - Sun (Day)" : "ASC + Sun - Moon (Night)",
      fortuneLon,
      houseCusps,
      "Represents the physical vessel, bodily vitality, material prosperity, spontaneous fortune, and worldly fulfillment.",
      "⊕"
    );

    // 2. Part of Spirit (Pars Solis)
    const spiritLon = isDay ? ASC + Sun - Moon : ASC + Moon - Sun;
    const partOfSpirit = this.buildPart(
      "spirit",
      "Part of Spirit",
      isDay ? "ASC + Sun - Moon (Day)" : "ASC + Moon - Sun (Night)",
      spiritLon,
      houseCusps,
      "Represents the inner divine spark, willpower, intellect, creative vocation, and soul intentions.",
      "☉"
    );

    // 3. Part of Love / Eros
    const loveLon = isDay ? ASC + Venus - spiritLon : ASC + spiritLon - Venus;
    const partOfLove = this.buildPart(
      "love",
      "Part of Love (Eros)",
      isDay ? "ASC + Venus - Spirit (Day)" : "ASC + Spirit - Venus (Night)",
      loveLon,
      houseCusps,
      "Points to devotional passion, romantic ideal, what the heart seeks unconditionally, and aesthetic magnetism.",
      "♡"
    );

    // 4. Part of Marriage
    const marriageLon = isDay ? ASC + DSC - Venus : ASC + Venus - DSC;
    const partOfMarriage = this.buildPart(
      "marriage",
      "Part of Marriage (selected formula variant)",
      isDay ? "ASC + DSC - Venus (Day)" : "ASC + Venus - DSC (Night)",
      marriageLon,
      houseCusps,
      "A selected partnership formula variant. Historical authors give multiple marriage Lots and methods; this point is not a universal formula or a prediction of marriage.",
      "⚭"
    );

    // 4a. Lot of Necessity (Hermetic lot; Mercury)
    const necessityLon = isDay ? ASC + fortuneLon - Mercury : ASC + Mercury - fortuneLon;
    const partOfNecessity = this.buildPart(
      "necessity",
      "Lot of Necessity",
      isDay ? "ASC + Fortune - Mercury (Day)" : "ASC + Mercury - Fortune (Night)",
      necessityLon,
      houseCusps,
      "The Hermetic Lot associated with Mercury: traditional symbolism of constraints, obligations and what must be negotiated. It does not predict unavoidable events.",
      "☿"
    );

    // 4b. Lot of Courage (Hermetic lot; Mars)
    const courageLon = isDay ? ASC + fortuneLon - Mars : ASC + Mars - fortuneLon;
    const partOfCourage = this.buildPart(
      "courage",
      "Lot of Courage",
      isDay ? "ASC + Fortune - Mars (Day)" : "ASC + Mars - Fortune (Night)",
      courageLon,
      houseCusps,
      "The Hermetic Lot associated with Mars: traditional symbolism of courage, boldness and conflict. This is interpretive symbolism, not a forecast of violence or injury.",
      "♂"
    );

    // 4c. Lot of Victory (Hermetic lot; Jupiter)
    const victoryLon = isDay ? ASC + Jupiter - spiritLon : ASC + spiritLon - Jupiter;
    const partOfVictory = this.buildPart(
      "victory",
      "Lot of Victory",
      isDay ? "ASC + Jupiter - Spirit (Day)" : "ASC + Spirit - Jupiter (Night)",
      victoryLon,
      houseCusps,
      "The Hermetic Lot associated with Jupiter: traditional symbolism of success, support and accomplishment. It is not a measured probability of success.",
      "♃"
    );

    // 5. Part of Death
    const deathLon = ASC + cusp8 - Moon;
    const partOfDeath = this.buildPart(
      "death",
      "Lot of Death (historical formula variant)",
      "ASC + Cusp 8 - Moon",
      deathLon,
      houseCusps,
      "A historical Lot associated with death-related topics in some sources. It does not predict death, lifespan or a fatal event.",
      "†"
    );

    // 6. Part of Mother
    const motherLon = isDay ? ASC + Moon - Venus : ASC + Venus - Moon;
    const partOfMother = this.buildPart(
      "mother",
      "Part of Mother",
      isDay ? "ASC + Moon - Venus (Day)" : "ASC + Venus - Moon (Night)",
      motherLon,
      houseCusps,
      "A selected historical family Lot associated with maternal topics; its formula and interpretation vary by author.",
      "☾"
    );

    // 7. Part of Father
    const fatherLon = isDay ? ASC + Sun - Saturn : ASC + Saturn - Sun;
    const partOfFather = this.buildPart(
      "father",
      "Part of Father",
      isDay ? "ASC + Sun - Saturn (Day)" : "ASC + Saturn - Sun (Night)",
      fatherLon,
      houseCusps,
      "A selected historical family Lot associated with paternal topics; its formula and interpretation vary by author.",
      "♄"
    );

    // 8. Part of Career / Profession
    const careerLon = isDay ? ASC + Moon - Saturn : ASC + Saturn - Moon;
    const partOfCareer = this.buildPart(
      "career",
      "Part of Career & Vocation",
      isDay ? "ASC + Moon - Saturn (Day)" : "ASC + Saturn - Moon (Night)",
      careerLon,
      houseCusps,
      "A selected career-related Lot formula variant. It is an interpretive technique, not a forecast of employment or public honors.",
      "⚖"
    );

    // 9. Part of Travel & Pilgrimage
    const ninthSignIndex = Math.floor(normalizeDegrees(cusp9) / 30);
    const traditionalSignRulers = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
    const ninthLordName = traditionalSignRulers[ninthSignIndex];
    const ninthLordLongitude: Record<string, number> = {
      Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn,
    };
    const ninthLordLon = ninthLordLongitude[ninthLordName];
    if (!Number.isFinite(ninthLordLon)) {
      throw new RangeError("The selected ninth-sign ruler has no supplied planetary longitude.");
    }
    // Abū Maʿshar / al-Qabīsī give this travel Lot from the 9th-house
    // lord to the degree of the 9th house in both day and night charts.
    const travelLon = ASC + cusp9 - ninthLordLon;
    const partOfTravel = this.buildPart(
      "travel",
      "Part of Foreign Travel (Abū Maʿshar / al-Qabīsī)",
      `ASC + 9th Cusp - 9th Lord (${ninthLordName}) (same by day and night)`,
      travelLon,
      houseCusps,
      "A medieval Lot associated with foreign travel in Abū Maʿshar and al-Qabīsī. It is a traditional symbolic topic, not a guarantee of travel or migration.",
      "✈"
    );

    // 10. Part of Health / Sickness
    const healthLon = isDay ? ASC + Mars - Saturn : ASC + Saturn - Mars;
    const partOfHealth = this.buildPart(
      "health",
      "Health/Sickness Lot (historical symbolism only)",
      isDay ? "ASC + Mars - Saturn (Day)" : "ASC + Saturn - Mars (Night)",
      healthLon,
      houseCusps,
      "A selected historical formula sometimes associated with illness symbolism. It cannot identify bodily vulnerability, diagnose disease or estimate health risk.",
      "⚕"
    );

    // 11. Part of Surgery / Operations
    const surgeryLon = isDay ? ASC + Saturn - Mars : ASC + Mars - Saturn;
    const partOfSurgery = this.buildPart(
      "surgery",
      "Mars–Saturn Separation Lot (experimental symbolism)",
      isDay ? "ASC + Saturn - Mars (Day)" : "ASC + Mars - Saturn (Night)",
      surgeryLon,
      houseCusps,
      "An experimental Mars–Saturn formula. It does not predict surgery, operations, injury or medical treatment.",
      "✂"
    );

    // 12. Part of Catastrophe / Nemesis
    const catastropheLon = isDay ? ASC + fortuneLon - Saturn : ASC + Saturn - fortuneLon;
    const partOfCatastrophe = this.buildPart(
      "catastrophe",
      "Lot of Nemesis",
      isDay ? "ASC + Fortune - Saturn (Day)" : "ASC + Saturn - Fortune (Night)",
      catastropheLon,
      houseCusps,
      "The Hermetic Lot associated with Saturn: traditional symbolism of limits, adversity and accountability. It does not guarantee misfortune.",
      "⚡"
    );

    const allParts = [
      partOfFortune,
      partOfSpirit,
      partOfLove,
      partOfNecessity,
      partOfCourage,
      partOfVictory,
      partOfMarriage,
      partOfDeath,
      partOfMother,
      partOfFather,
      partOfCareer,
      partOfTravel,
      partOfHealth,
      partOfSurgery,
      partOfCatastrophe,
    ];

    return {
      isDayChart: isDay,
      partOfFortune,
      partOfSpirit,
      partOfLove,
      partOfNecessity,
      partOfCourage,
      partOfVictory,
      partOfMarriage,
      partOfDeath,
      partOfMother,
      partOfFather,
      partOfCareer,
      partOfTravel,
      partOfHealth,
      partOfSurgery,
      partOfCatastrophe,
      partOfNemesis: partOfCatastrophe,
      allParts,
    };
  }
}
