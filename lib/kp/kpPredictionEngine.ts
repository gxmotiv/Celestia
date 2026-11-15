/**
 * Krishnamurti Padhdhati (KP) Prediction Engine & Event Analyzer
 * 
 * Foundational KP Axioms:
 * 1. The Cuspal Sub Lord (CSL) of a house decides the promise of the event.
 * 2. A planet offers the results of its Star Lord, while its Sub Lord qualifies
 *    the favorability or negation of that event.
 * 3. Timing of realization occurs during the conjoint periods (Dasha / Bhukti / Antara)
 *    of significators that are also supported by Ruling Planets (RP).
 */

import {
  KPCusps,
  KPPlanet,
  KPHouseSignificators,
  KPPlanetSignification,
  KPPrediction,
  KPRulingPlanets,
} from "./kpTypes";
import { KPSignificators } from "./kpSignificators";

export interface KPEventRule {
  house: number;
  eventName: string;
  primaryHouses: number[];
  favorableHouses: number[];
  negationHouses: number[];
  description: string;
}

export const KP_EVENT_RULES: Record<number, KPEventRule> = {
  1: {
    house: 1,
    eventName: "Health, Vitality & Self Expression",
    primaryHouses: [1],
    favorableHouses: [1, 3, 9, 11],
    negationHouses: [6, 8, 12],
    description: "Longevity, strong constitution, resilience and self-elevation.",
  },
  2: {
    house: 2,
    eventName: "Wealth, Accumulated Capital & Family",
    primaryHouses: [2],
    favorableHouses: [2, 6, 11],
    negationHouses: [12, 1, 5],
    description: "Inflow of liquid finances, jewellery, family harmony and speech.",
  },
  3: {
    house: 3,
    eventName: "Courage, Short Journeys & Agreements",
    primaryHouses: [3],
    favorableHouses: [3, 9, 11],
    negationHouses: [2, 8],
    description: "Signing contracts, publishing, younger siblings, and short-haul business travel.",
  },
  4: {
    house: 4,
    eventName: "Real Estate, Property, Vehicles & Higher Education",
    primaryHouses: [4],
    favorableHouses: [4, 11, 12],
    negationHouses: [3, 10],
    description: "Acquisition of fixed assets, homes, lands, motor vehicles and formal academic degrees.",
  },
  5: {
    house: 5,
    eventName: "Childbirth, Progeny, Speculation & Romance",
    primaryHouses: [5],
    favorableHouses: [2, 5, 11],
    negationHouses: [1, 4, 10],
    description: "Conception, birth of children, speculative market gains, artistic romance.",
  },
  6: {
    house: 6,
    eventName: "Competitive Exams, Service, Litigation & Debt Clearance",
    primaryHouses: [6],
    favorableHouses: [6, 10, 11],
    negationHouses: [5, 12],
    description: "Winning over opponents, clearing civil court cases, clearing bank loans, getting employed.",
  },
  7: {
    house: 7,
    eventName: "Marriage, Committed Union & Business Partnerships",
    primaryHouses: [7],
    favorableHouses: [2, 7, 11],
    negationHouses: [1, 6, 10],
    description: "Sacred matrimony, finding a life companion, entering lucrative business contracts.",
  },
  8: {
    house: 8,
    eventName: "Inheritance, Insurance, Longevity & Unearned Wealth",
    primaryHouses: [8],
    favorableHouses: [2, 8, 11],
    negationHouses: [1, 5],
    description: "Gratuities, insurance claims, legacy inheritance, mystical knowledge, overcoming crises.",
  },
  9: {
    house: 9,
    eventName: "Higher Philosophy, Long Distance Journeys & Fortune",
    primaryHouses: [9],
    favorableHouses: [9, 11, 12],
    negationHouses: [3, 8],
    description: "Pilgrimages, doctoral research, father's blessings, international travel and dharma.",
  },
  10: {
    house: 10,
    eventName: "Career Elevation, Professional Promotion & Authority",
    primaryHouses: [10],
    favorableHouses: [2, 6, 10, 11],
    negationHouses: [5, 9],
    description: "Promotion to executive rank, government honors, occupational prestige, new business launch.",
  },
  11: {
    house: 11,
    eventName: "Realization of Cherished Ambitions & Financial Windfall",
    primaryHouses: [11],
    favorableHouses: [1, 2, 6, 10, 11],
    negationHouses: [8, 12],
    description: "Sudden expansion of revenues, fulfillment of desires, alliances with powerful benefactors.",
  },
  12: {
    house: 12,
    eventName: "Foreign Relocation, Hospitalization, Expenditure & Moksha",
    primaryHouses: [12],
    favorableHouses: [3, 9, 12],
    negationHouses: [2, 4, 11],
    description: "Permanent overseas relocation, spiritual retreats, investments abroad, liberation.",
  },
};

export class KPPredictionEngine {
  private significatorsEngine = new KPSignificators();

  /**
   * Predict life event for a specific house in KP
   */
  public predictEvent(
    house: number,
    cusps: KPCusps,
    planets: KPPlanet[],
    dashaLord: string,
    antardashaLord: string,
    pratyantardashaLord?: string
  ): KPPrediction {
    if (!Number.isInteger(house) || house < 1 || house > 12) {
      throw new Error(`KP prediction house must be between 1 and 12; received ${house}.`);
    }
    if (!Array.isArray(cusps.cusps) || cusps.cusps.length !== 12 ||
        cusps.cusps.some((value) => !Number.isFinite(value))) {
      throw new Error("KP prediction requires twelve finite cusp longitudes.");
    }
    if (!Array.isArray(cusps.houseLords) || cusps.houseLords.length !== 12 ||
        cusps.houseLords.some((lord) => typeof lord !== "string" || !lord.trim())) {
      throw new Error("KP prediction requires twelve valid cusp sign lords.");
    }
    if (!Array.isArray(cusps.houseDetails) || cusps.houseDetails.length !== 12) {
      throw new Error("KP prediction requires twelve complete cusp records.");
    }
    if (!Array.isArray(planets)) {
      throw new Error("KP prediction requires a planetary position array.");
    }

    const rule = KP_EVENT_RULES[house];
    if (!rule) throw new Error(`KP prediction has no declared event rule for house ${house}.`);
    const cusp = cusps.houseDetails[house - 1];
    if (!cusp?.subLord) throw new Error(`KP prediction requires cusp ${house} sub-lord data.`);
    const csl = cusp.subLord;
    const cslPlanet = planets.find((p) => p.name === csl);
    if (!cslPlanet) throw new Error(`KP prediction cannot resolve CSL planet ${csl} for house ${house}.`);
    if (!cslPlanet.starLord || !cslPlanet.subLord) {
      throw new Error(`KP prediction requires star-lord and sub-lord data for CSL planet ${csl}.`);
    }
    if (!dashaLord?.trim() || !antardashaLord?.trim()) {
      throw new Error("KP prediction requires explicit Mahadasha and Antardasha lords.");
    }
    if (!planets.some((planet) => planet.name === dashaLord)) {
      throw new Error(`KP prediction cannot resolve Mahadasha lord ${dashaLord} in the chart.`);
    }
    if (!planets.some((planet) => planet.name === antardashaLord)) {
      throw new Error(`KP prediction cannot resolve Antardasha lord ${antardashaLord} in the chart.`);
    }
    if (pratyantardashaLord && !planets.some((planet) => planet.name === pratyantardashaLord)) {
      throw new Error(`KP prediction cannot resolve Pratyantardasha lord ${pratyantardashaLord} in the chart.`);
    }

    // Calculate Significators across chart
    const baseHouseSignificators = this.significatorsEngine.calculateAllHouseSignificators(cusps, planets);
    const basePlanetSignifications = this.significatorsEngine.calculateAllPlanetSignifications(cusps, planets);
    const nodeRepresentations = this.significatorsEngine.calculateNodeRepresentations(
      planets,
      basePlanetSignifications,
      "reader-vi"
    );
    const planetSignifications = this.significatorsEngine.applyNodeAgentSignifications(
      planets,
      basePlanetSignifications,
      nodeRepresentations
    );
    const houseSignificators = this.significatorsEngine.applyNodeAgentsToHouseSignificators(
      baseHouseSignificators,
      nodeRepresentations
    );

    // Get CSL signification
    const cslSignification = planetSignifications[csl];
    if (!cslSignification) {
      throw new Error(`KP prediction could not calculate house signification for CSL planet ${csl}.`);
    }

    const cslSignifiedHouses = cslSignification.signifiedHouses;

    // Check favorable vs negation overlap
    const favorableMatches = rule.favorableHouses.filter((h) => cslSignifiedHouses.includes(h));
    const negationMatches = rule.negationHouses.filter((h) => cslSignifiedHouses.includes(h));

    // Promise is favorable if favorable matches exceed or equal negation matches
    // and at least one favorable house is signified
    const isPromiseFavorable =
      favorableMatches.length > 0 &&
      (negationMatches.length === 0 || favorableMatches.length >= negationMatches.length);

    // Evaluate Dasha & Antardasha significators for favorable houses
    const allFavorableSignificators = new Set<string>();
    rule.favorableHouses.forEach((fh) => {
      const sig = houseSignificators[fh];
      if (sig) {
        sig.allSignificators.forEach((p) => allFavorableSignificators.add(p));
      }
    });

    const isDashaSignificator = allFavorableSignificators.has(dashaLord);
    const isAntardashaSignificator = allFavorableSignificators.has(antardashaLord);
    const isPratyantarSignificator = pratyantardashaLord
      ? allFavorableSignificators.has(pratyantardashaLord)
      : undefined;

    // Timing analysis string
    let timing = "";
    if (isDashaSignificator && isAntardashaSignificator) {
      timing = `Conjoint activation: Both Mahadasha lord (${dashaLord}) and Antardasha lord (${antardashaLord}) are potent significators of houses ${rule.favorableHouses.join(", ")}. Event fruition is primed in this period.`;
    } else if (isAntardashaSignificator) {
      timing = `Sub-period active: Antardasha lord (${antardashaLord}) signifies favorable houses ${rule.favorableHouses.join(", ")}, facilitating event fruition during favorable transit triggers.`;
    } else if (isDashaSignificator) {
      timing = `Macro climate ready: Mahadasha lord (${dashaLord}) provides foundational support, awaiting supportive Antardasha or Pratyantardasha sub-lords.`;
    } else {
      timing = `Latent timing: Neither current Mahadasha (${dashaLord}) nor Antardasha (${antardashaLord}) directly activate houses ${rule.favorableHouses.join(", ")}. Event awaits periods of ${Array.from(allFavorableSignificators).slice(0, 3).join(", ")}.`;
    }

    // Rule-weighted heuristic score; not calibrated against observed events.
    let heuristicScore = 35;
    if (isPromiseFavorable) heuristicScore += 30;
    if (favorableMatches.length >= 2) heuristicScore += 10;
    if (isDashaSignificator) heuristicScore += 12;
    if (isAntardashaSignificator) heuristicScore += 13;
    if (negationMatches.length > 0) heuristicScore -= negationMatches.length * 8;
    heuristicScore = Math.min(95, Math.max(15, heuristicScore));

    // Verdict
    let verdict: KPPrediction["verdict"] = "Mixed / Moderate";
    if (heuristicScore >= 78) {
      verdict = "Highly Favorable";
    } else if (heuristicScore >= 60) {
      verdict = "Favorable";
    } else if (heuristicScore <= 38) {
      verdict = "Unfavorable";
    }

    // Rule breakdown steps
    const kpRuleBreakdown = [
      `1. Primary Cuspal Sub Lord (CSL) of House ${house}: ${csl} (at ${cusp.degreeFormatted} ${cusp.signName}).`,
      `2. CSL's Star Lord: ${cslPlanet.starLord} (residing in House ${cslSignification.starLordOccupiesHouse}, owning ${cslSignification.starLordOwnsHouses.join(", ") || "none"}).`,
      `3. CSL Signification: Signifies houses [${cslSignifiedHouses.join(", ")}]. Favorable: [${favorableMatches.join(", ") || "none"}], Negation: [${negationMatches.join(", ") || "none"}].`,
      `4. Current Dasha Concurrence: Dasha Lord ${dashaLord} (${isDashaSignificator ? "Significator ✓" : "Not direct"}) · Antardasha Lord ${antardashaLord} (${isAntardashaSignificator ? "Significator ✓" : "Not direct"}).`,
    ];

    const details = isPromiseFavorable
      ? `According to Krishnamurti Padhdhati, the Cuspal Sub Lord ${csl} of house ${house} actively connects with favorable houses (${favorableMatches.join(", ")}), thereby validating the natal promise for ${rule.eventName.toLowerCase()}.`
      : `The Cuspal Sub Lord ${csl} of house ${house} connects with negation/detrimental houses (${negationMatches.join(", ")}), suggesting delays or modifications requiring patient remedial alignment.`;

    return {
      house,
      event: rule.eventName,
      primaryCuspalSubLord: csl,
      cslStarLord: cslPlanet.starLord,
      cslSubLord: cslPlanet.subLord,
      favorableHouses: rule.favorableHouses,
      negationHouses: rule.negationHouses,
      cslSignifiedHouses,
      isPromiseFavorable,
      timing,
      heuristicScore,
      details,
      dashaAnalysis: {
        dashaLord,
        isDashaSignificator,
        antardashaLord,
        isAntardashaSignificator,
        pratyantardashaLord,
        isPratyantarSignificator,
        verdict: timing,
      },
      verdict,
      kpRuleBreakdown,
    };
  }

  /**
   * Calculate the five KP Ruling Planets in the Reader VI preference order:
   * 1. Lagna Star Lord
   * 2. Lagna Sign Lord
   * 3. Moon Star Lord
   * 4. Moon Sign Lord
   * 5. Day Lord
   *
   * Limitation: weekday currently uses the UTC civil date, not local sunrise.
   */
  public calculateRulingPlanets(
    cusps: KPCusps,
    planets: KPPlanet[],
    birthDate: Date
  ): KPRulingPlanets {
    if (!(birthDate instanceof Date) || !Number.isFinite(birthDate.getTime())) {
      throw new Error("KP ruling planets require a valid birth/judgment Date.");
    }
    const dayNames = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
    const dayLord = dayNames[birthDate.getUTCDay()];
    const moon = planets.find((p) => p.name === "Moon");
    if (!moon) throw new Error("KP ruling planets require Moon position data; no substitute is permitted.");
    if (!moon.signLord || !moon.starLord || !moon.subLord) {
      throw new Error("KP ruling planets require Moon sign, star, and sub-lord data.");
    }
    const lagna = cusps.houseDetails?.[0];
    if (!lagna?.signLord || !lagna.starLord || !lagna.subLord) {
      throw new Error("KP ruling planets require complete first-cusp sign, star, and sub-lord data.");
    }

    // KP Reader VI's five-ruler preference order: Lagna star, Lagna sign,
    // Moon star, Moon sign, then weekday lord. The weekday below currently
    // uses the UTC civil date; a local sunrise-to-sunrise boundary is a
    // separately disclosed limitation until birth-place sunrise data is wired.
    const ordered = [lagna.starLord, lagna.signLord, moon.starLord, moon.signLord, dayLord];
    const uniqueOrdered = Array.from(new Set(ordered));

    return {
      dayLord,
      moonSignLord: moon.signLord,
      moonStarLord: moon.starLord,
      moonSubLord: moon.subLord,
      lagnaSignLord: lagna.signLord,
      lagnaStarLord: lagna.starLord,
      lagnaSubLord: lagna.subLord,
      rulingPlanetsOrdered: uniqueOrdered,
    };
  }
}
