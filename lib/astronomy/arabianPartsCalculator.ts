/**
 * Arabian Parts (Lots) Calculation System
 * Implements classical diurnal/nocturnal Hellenistic and Medieval Arabic formulas:
 * - Part of Fortune: Day: ASC + Moon - Sun; Night: ASC + Sun - Moon
 * - Part of Spirit (Pars Solis): Day: ASC + Sun - Moon; Night: ASC + Moon - Sun
 * - Part of Love / Eros: Day: ASC + Venus - Spirit; Night: ASC + Spirit - Venus
 * - Part of Marriage (Hermetic): Day: ASC + Descendant - Venus; Night: ASC + Venus - Descendant
 * - Part of Death: ASC + 8th Cusp - Moon
 * - Part of Mother: Day: ASC + Moon - Venus; Night: ASC + Venus - Moon
 * - Part of Father: Day: ASC + Sun - Saturn; Night: ASC + Saturn - Sun
 * - Part of Career / Profession: Day: ASC + Moon - Saturn; Night: ASC + Saturn - Moon
 * - Part of Travel: Day: ASC + 9th Cusp - Lord of 9th; Night: ASC + Lord of 9th - 9th Cusp (or 9th cusp distance)
 * - Part of Health / Sickness: Day: ASC + Mars - Saturn; Night: ASC + Saturn - Mars
 * - Part of Surgery / Wounds: Day: ASC + Saturn - Mars; Night: ASC + Mars - Saturn
 * - Part of Catastrophe / Nemesis: Day: ASC + Fortune - Saturn; Night: ASC + Saturn - Fortune
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
  partOfMarriage: ArabianPart;
  partOfDeath: ArabianPart;
  partOfMother: ArabianPart;
  partOfFather: ArabianPart;
  partOfCareer: ArabianPart;
  partOfTravel: ArabianPart;
  partOfHealth: ArabianPart;
  partOfSurgery: ArabianPart;
  partOfCatastrophe: ArabianPart;
  allParts: ArabianPart[];
}

export class ArabianPartsCalculator {
  /**
   * Determine whether a chart is Diurnal (Day) or Nocturnal (Night)
   * A chart is Diurnal if the Sun is above the Horizon (Houses 7 through 12).
   */
  public isDayChart(sunLon: number, ascLon: number): boolean {
    const sunDistFromAsc = normalizeDegrees(sunLon - ascLon);
    // Houses 7 to 12 correspond to 180° to 360° counter-clockwise from Ascendant
    return sunDistFromAsc >= 180 && sunDistFromAsc < 360;
  }

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
   * Calculate all 12 major classical Arabian Parts
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
    /** Prefer the astronomical horizon result supplied by the natal chart engine. */
    isDayChart?: boolean;
  }): ArabianPartsResult {
    const { ascendant: ASC, sun: Sun, moon: Moon, mercury: Mercury, venus: Venus, mars: Mars, jupiter: Jupiter, saturn: Saturn, houseCusps } = params;
    const isDay = typeof params.isDayChart === "boolean" ? params.isDayChart : this.isDayChart(Sun, ASC);

    const cusp8 = houseCusps[7] ?? normalizeDegrees(ASC + 210);
    const cusp9 = houseCusps[8] ?? normalizeDegrees(ASC + 240);
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
      "Part of Marriage & Partnership",
      isDay ? "ASC + DSC - Venus (Day)" : "ASC + Venus - DSC (Night)",
      marriageLon,
      houseCusps,
      "Highlights union, contractual partnership, loyalty covenants, and emotional fidelity.",
      "⚭"
    );

    // 5. Part of Death
    const deathLon = ASC + cusp8 - Moon;
    const partOfDeath = this.buildPart(
      "death",
      "Part of Death & Rebirth",
      "ASC + Cusp 8 - Moon",
      deathLon,
      houseCusps,
      "Indicates profound existential crisis points, inheritance, psychic rebirth, and release of mortal fear.",
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
      "Illuminates the maternal lineage, ancestral nurturing, domestic roots, and primal emotional protection.",
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
      "Reveals patriarchal legacy, moral structure, authority figures, and inherited discipline.",
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
      "Guides public achievement, authoritative standing, mastery of social roles, and public honors.",
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
    // Abū Maʿshar / al-Qabīsī give this travel Lot from the 9th-house
    // lord to the degree of the 9th house in both day and night charts.
    const travelLon = ASC + cusp9 - ninthLordLon;
    const partOfTravel = this.buildPart(
      "travel",
      "Part of Foreign Travel (Abū Maʿshar / al-Qabīsī)",
      `ASC + 9th Cusp - 9th Lord (${ninthLordName}) (same by day and night)`,
      travelLon,
      houseCusps,
      "Indicates journeys across distant seas, philosophical awakening, foreign lands, and pilgrimage.",
      "✈"
    );

    // 10. Part of Health / Sickness
    const healthLon = isDay ? ASC + Mars - Saturn : ASC + Saturn - Mars;
    const partOfHealth = this.buildPart(
      "health",
      "Part of Health & Constitutional Vulnerability",
      isDay ? "ASC + Mars - Saturn (Day)" : "ASC + Saturn - Mars (Night)",
      healthLon,
      houseCusps,
      "Identifies bodily friction, constitutional vulnerability, and points where conscious wellness is required.",
      "⚕"
    );

    // 11. Part of Surgery / Operations
    const surgeryLon = isDay ? ASC + Saturn - Mars : ASC + Mars - Saturn;
    const partOfSurgery = this.buildPart(
      "surgery",
      "Part of Surgery & Decisive Cut",
      isDay ? "ASC + Saturn - Mars (Day)" : "ASC + Mars - Saturn (Night)",
      surgeryLon,
      houseCusps,
      "Marks the scalpel of decisive surgical action, radical cutting away of toxic elements, and endurance under stress.",
      "✂"
    );

    // 12. Part of Catastrophe / Nemesis
    const catastropheLon = isDay ? ASC + fortuneLon - Saturn : ASC + Saturn - fortuneLon;
    const partOfCatastrophe = this.buildPart(
      "catastrophe",
      "Part of Nemesis & Radical Fate",
      isDay ? "ASC + Fortune - Saturn (Day)" : "ASC + Saturn - Fortune (Night)",
      catastropheLon,
      houseCusps,
      "Warns against blind spots, karmic hubris, unseen obstacles, and tests requiring humble integrity.",
      "⚡"
    );

    const allParts = [
      partOfFortune,
      partOfSpirit,
      partOfLove,
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
      partOfMarriage,
      partOfDeath,
      partOfMother,
      partOfFather,
      partOfCareer,
      partOfTravel,
      partOfHealth,
      partOfSurgery,
      partOfCatastrophe,
      allParts,
    };
  }
}
