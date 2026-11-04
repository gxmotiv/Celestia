/**
 * Modern Krishnamurti Padhdhati (KP) 4-Step Theory & Cuspal Interlinks (CIL) Engine
 * 
 * Includes:
 * 1. Automatic Positional Status (PS) Engine
 *    - In own star OR no tenants in star.
 *    - Node (Rahu/Ketu) special representation.
 * 2. Sunil Gondhalekar 4-Step Theory:
 *    - Step 1 (Source): Planet itself (Active if PS, else secondary)
 *    - Step 2 (The Offer): Star Lord of the Planet
 *    - Step 3 (The Fruit / Decision): Sub Lord of the Planet
 *    - Step 4 (Final Culmination): Star Lord of the Sub Lord
 * 3. Cuspal Interlinks (CIL & CSSL - Khullar / Baskaran):
 *    - Cuspal Sub Lord (CSL) and Cuspal Sub-Sub Lord (CSSL) interlink matrix
 *    - Primary, supporting, and detrimental house connectivity
 */

import {
  KPCusps,
  KPPlanet,
  KPChartData,
  PositionalStatus,
  KPStepDetail,
  KPFourStepData,
  CuspalInterlink,
} from "./kpTypes";
import { KP_EVENT_RULES } from "./kpPredictionEngine";
import { SubLordCalculator } from "./subLordEngine";

export class KPFourStepEngine {
  private subLordCalc = new SubLordCalculator();

  /**
   * 1. Calculate Positional Status (PS) for all 9 planets
   */
  public calculatePositionalStatus(
    cusps: KPCusps,
    planets: KPPlanet[]
  ): Record<string, PositionalStatus> {
    const psMap: Record<string, PositionalStatus> = {};
    const standardPlanets = [
      "Sun",
      "Moon",
      "Mars",
      "Mercury",
      "Jupiter",
      "Venus",
      "Saturn",
      "Rahu",
      "Ketu",
    ];

    // Count tenants in each planet's star
    const starTenants: Record<string, string[]> = {};
    standardPlanets.forEach((p) => {
      starTenants[p] = [];
    });

    planets.forEach((p) => {
      if (starTenants[p.starLord]) {
        starTenants[p.starLord].push(p.name);
      }
    });

    standardPlanets.forEach((pName) => {
      const pObj = planets.find((p) => p.name === pName);
      if (!pObj) {
        psMap[pName] = {
          planet: pName,
          hasPositionalStatus: false,
          reason: "None",
          tenantsInStar: [],
        };
        return;
      }

      // Check condition 1: In own star
      if (pObj.starLord === pName) {
        psMap[pName] = {
          planet: pName,
          hasPositionalStatus: true,
          reason: "In own star",
          tenantsInStar: starTenants[pName] || [],
        };
        return;
      }

      // Check condition 2: No planets in its star
      const tenants = starTenants[pName] || [];
      if (tenants.length === 0) {
        psMap[pName] = {
          planet: pName,
          hasPositionalStatus: true,
          reason: "No planets in its star",
          tenantsInStar: [],
        };
        return;
      }

      psMap[pName] = {
        planet: pName,
        hasPositionalStatus: false,
        reason: "None",
        tenantsInStar: tenants,
      };
    });

    return psMap;
  }

  /**
   * Helper to build Step Detail for any planet
   */
  private buildStepDetail(
    planetName: string,
    cusps: KPCusps,
    planets: KPPlanet[],
    psMap: Record<string, PositionalStatus>
  ): KPStepDetail {
    const planetObj = planets.find((p) => p.name === planetName);
    const occupies = planetObj ? planetObj.house : 1;
    const owns: number[] = [];

    cusps.houseLords.forEach((lord, idx) => {
      if (lord === planetName) {
        owns.push(idx + 1);
      }
    });

    // Special representation for Rahu & Ketu in KP
    if (planetName === "Rahu" || planetName === "Ketu") {
      if (planetObj) {
        const signLord = planetObj.signLord;
        cusps.houseLords.forEach((lord, idx) => {
          if (lord === signLord && !owns.includes(idx + 1)) {
            owns.push(idx + 1);
          }
        });
      }
    }

    const allHouses = Array.from(new Set([occupies, ...owns])).sort((a, b) => a - b);
    const ps = psMap[planetName]?.hasPositionalStatus || false;

    return {
      planet: planetName,
      occupiesHouse: occupies,
      ownsHouses: owns,
      allHouses,
      isRetrograde: planetObj?.isRetrograde || false,
      hasPositionalStatus: ps,
    };
  }

  /**
   * 2. Evaluate 4-Step Theory for a given Planet
   */
  public evaluatePlanetFourStep(
    planetName: string,
    cusps: KPCusps,
    planets: KPPlanet[],
    psMap: Record<string, PositionalStatus>,
    targetHouse?: number
  ): KPFourStepData {
    const pObj = planets.find((p) => p.name === planetName);
    const starLord = pObj ? pObj.starLord : "Sun";
    const subLord = pObj ? pObj.subLord : "Moon";

    // Sub Lord's Star Lord
    const subObj = planets.find((p) => p.name === subLord);
    const subStarLord = subObj ? subObj.starLord : "Mars";

    const step1 = this.buildStepDetail(planetName, cusps, planets, psMap);
    const step2 = this.buildStepDetail(starLord, cusps, planets, psMap);
    const step3 = this.buildStepDetail(subLord, cusps, planets, psMap);
    const step4 = this.buildStepDetail(subStarLord, cusps, planets, psMap);

    // Combine signified houses according to 4-Step principles:
    // If Planet has PS: Step 1 houses are primary.
    // Step 2 (Star Lord) always gives the core source.
    // Step 3 (Sub Lord) is the deciding gatekeeper.
    // Step 4 (Sub's Star) gives final confirmation.
    const allSig = Array.from(
      new Set([
        ...step1.allHouses,
        ...step2.allHouses,
        ...step3.allHouses,
        ...step4.allHouses,
      ])
    ).sort((a, b) => a - b);

    // Event determination if targetHouse is provided
    const rule = targetHouse ? KP_EVENT_RULES[targetHouse] : undefined;
    const favorable = rule ? rule.favorableHouses : [];
    const detrimental = rule ? rule.negationHouses : [];

    let stepVerdict: KPFourStepData["stepVerdict"] = "Favorable";
    let analysisText = "";
    let gondhalekarRule = "";

    if (rule) {
      // In 4-step theory:
      // Star Lord (Step 2) proposes the matter (must connect to favorable).
      // Sub Lord (Step 3) decides whether to allow (+) or deny (-).
      // If Sub Lord signifies detrimental houses (12th from matter), matter is negated.
      const step2Offers = step2.allHouses.some((h) => favorable.includes(h));
      const step3Permits = step3.allHouses.some((h) => favorable.includes(h));
      const step3Denies = step3.allHouses.some((h) => detrimental.includes(h));
      const step4Confirms = step4.allHouses.some((h) => favorable.includes(h));

      if (step3Denies && !step3Permits) {
        stepVerdict = "Unfavorable";
        analysisText = `Step 3 Sub-Lord (${subLord}) signifies detrimental houses [${step3.allHouses.filter((h) => detrimental.includes(h)).join(", ")}], blocking the fruit of ${rule.eventName}.`;
      } else if (step2Offers && step3Permits) {
        stepVerdict = "Favorable";
        analysisText = `Step 2 Star-Lord (${starLord}) offers favorable houses and Step 3 Sub-Lord (${subLord}) grants approval with house connections [${step3.allHouses.filter((h) => favorable.includes(h)).join(", ")}]. ${step4Confirms ? "Step 4 confirms smooth fruit." : "Step 4 indicates mixed pace."}`;
      } else {
        stepVerdict = "Delayed / Mixed";
        analysisText = `Mixed significations across 4 tiers. Step 2 & 3 provide moderate alignment, indicating fruition after persistent effort or during supportive transit.`;
      }

      gondhalekarRule = `4-Step Principle: Source (Step 1 ${step1.hasPositionalStatus ? "★PS Active" : "Weak"} = ${step1.allHouses.join(",")}) → Offer (Step 2 ${starLord} = ${step2.allHouses.join(",")}) → Decision (Step 3 ${subLord} = ${step3.allHouses.join(",")}) → Final End (Step 4 ${subStarLord} = ${step4.allHouses.join(",")}).`;
    } else {
      analysisText = `Planet ${planetName} acts through Star-Lord ${starLord} and is qualified by Sub-Lord ${subLord} and Sub's Star ${subStarLord}. Signifies houses: ${allSig.join(", ")}.`;
      gondhalekarRule = `Gondhalekar 4-Step Chain for ${planetName}: [${step1.planet}] → [${step2.planet}] → [${step3.planet}] → [${step4.planet}].`;
    }

    return {
      subject: planetName,
      type: "planet",
      step1,
      step2,
      step3,
      step4,
      hasPositionalStatus: step1.hasPositionalStatus || false,
      signifiedHouses: allSig,
      favorableHousesForMatter: favorable,
      detrimentalHousesForMatter: detrimental,
      stepVerdict,
      analysisText,
      gondhalekarRule,
    };
  }

  /**
   * 3. Evaluate 4-Step Theory for a Cusp (CSL & CSSL)
   */
  public evaluateCuspFourStep(
    houseNum: number,
    cusps: KPCusps,
    planets: KPPlanet[],
    psMap: Record<string, PositionalStatus>
  ): KPFourStepData {
    const cusp = cusps.houseDetails[houseNum - 1];
    const csl = cusp.subLord;
    const result = this.evaluatePlanetFourStep(csl, cusps, planets, psMap, houseNum);

    result.subject = `Cusp ${houseNum} Sub-Lord (${csl})`;
    result.type = "cusp";
    return result;
  }

  /**
   * 4. Compute Cuspal Interlinks (CIL & CSSL) for all 12 Cusps
   * Classical Khullar & Baskaran KP Cuspal Interlink Rules
   */
  public calculateCuspalInterlinks(
    cusps: KPCusps,
    planets: KPPlanet[],
    psMap: Record<string, PositionalStatus>
  ): CuspalInterlink[] {
    const interlinks: CuspalInterlink[] = [];

    for (let h = 1; h <= 12; h++) {
      const cusp = cusps.houseDetails[h - 1];
      const signLord = cusp.signLord;
      const starLord = cusp.starLord;
      const csl = cusp.subLord;
      const cssl = cusp.subSubLord || cusp.subLord;

      const rule = KP_EVENT_RULES[h] || {
        house: h,
        eventName: `House ${h} Affairs`,
        primaryHouses: [h],
        favorableHouses: [h, (h + 10) % 12 || 12],
        negationHouses: [(h + 10) % 12 || 12],
      };

      // CSL planet & its connections
      const cslObj = planets.find((p) => p.name === csl);
      const cslStarLord = cslObj ? cslObj.starLord : "Sun";
      const cslSubLord = cslObj ? cslObj.subLord : "Moon";

      // CSSL planet & its connections
      const csslObj = planets.find((p) => p.name === cssl);
      const csslStarLord = csslObj ? csslObj.starLord : "Mars";

      // Houses linked by CSL & CSSL
      const cslStep = this.buildStepDetail(csl, cusps, planets, psMap);
      const cslStarStep = this.buildStepDetail(cslStarLord, cusps, planets, psMap);
      const csslStep = this.buildStepDetail(cssl, cusps, planets, psMap);
      const csslStarStep = this.buildStepDetail(csslStarLord, cusps, planets, psMap);

      const linkedHouses = Array.from(
        new Set([
          ...cslStep.allHouses,
          ...cslStarStep.allHouses,
          ...csslStep.allHouses,
          ...csslStarStep.allHouses,
        ])
      ).sort((a, b) => a - b);

      const supporting = linkedHouses.filter((house) => rule.favorableHouses.includes(house));
      const detrimental = linkedHouses.filter((house) => rule.negationHouses.includes(house));

      let promiseVerdict: CuspalInterlink["promiseVerdict"] = "Promised";
      if (detrimental.length > 0 && supporting.length === 0) {
        promiseVerdict = "Denied / Negated";
      } else if (detrimental.length > 0 && supporting.length > 0) {
        promiseVerdict = "Delayed with Obstacles";
      } else if (supporting.length > 0) {
        promiseVerdict = "Promised";
      } else {
        promiseVerdict = "Delayed with Obstacles";
      }

      const interlinkChain = `Cusp ${h} (${signLord}) ➔ Star: ${starLord} ➔ CSL: ${csl} (Star: ${cslStarLord}) ➔ CSSL: ${cssl} (Star: ${csslStarLord})`;
      const classicalPrinciple = `CSL ${csl} & CSSL ${cssl} link Cusp ${h} to houses [${linkedHouses.join(", ")}]. ${
        promiseVerdict === "Promised"
          ? `Harmonious connection with favorable houses (${supporting.join(", ")}).`
          : promiseVerdict === "Denied / Negated"
          ? `Inimical link with detrimental houses (${detrimental.join(", ")}).`
          : `Mixed linkages (${supporting.join(", ")} vs ${detrimental.join(", ")}), requiring patience.`
      }`;

      interlinks.push({
        house: h,
        title: rule.eventName,
        signLord,
        starLord,
        csl,
        cslStarLord,
        cslSubLord,
        cssl,
        csslStarLord,
        linkedHouses,
        supportingHouses: supporting,
        detrimentalHouses: detrimental,
        promiseVerdict,
        interlinkChain,
        classicalPrinciple,
      });
    }

    return interlinks;
  }
}
