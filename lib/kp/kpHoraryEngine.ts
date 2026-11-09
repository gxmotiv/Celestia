/**
 * Krishnamurti Padhdhati (KP) Horary (Prashna) 1-249 and 1-2193 Calculation Engine
 * 
 * Classical & Modern Rules of KP Horary:
 * 1. The querent gives a sacred seed number between 1 and 249 (or 1 and 2193).
 * 2. The seed fixes the exact sidereal longitude of the Horary Ascendant (Cusp 1).
 * 3. The 12 houses are computed from the Horary Ascendant.
 * 4. The Cuspal Sub Lord (CSL) of the primary house for the query determines the outcome.
 * 5. Ruling Planets (RP) at the moment of query validate the result and timing.
 */

import {
  KPCusp,
  KPCusps,
  KPPlanet,
  KPChartData,
  KPHoraryResult,
  KPRulingPlanets,
} from "./kpTypes";
import { SubLordCalculator, KP249Entry, KP2193Entry } from "./subLordEngine";
import { KPSignificators } from "./kpSignificators";
import { normalizeDegrees } from "../astronomy/ephemeris";

export interface HoraryQueryConfig {
  id: string;
  category: string;
  question: string;
  primaryHouse: number;
  favorableHouses: number[];
  detrimentalHouses: number[];
  remedialTip: string;
}

export const HORARY_QUERIES: HoraryQueryConfig[] = [
  {
    id: "career",
    category: "Career & Employment",
    question: "Will I get the job / promotion / career elevation?",
    primaryHouse: 10,
    favorableHouses: [2, 6, 10, 11],
    detrimentalHouses: [5, 9, 12],
    remedialTip: "Strengthen 10th & 6th house significators; prepare documentation meticulously.",
  },
  {
    id: "marriage",
    category: "Marriage & Union",
    question: "Will the marriage proposal materialize / will I marry?",
    primaryHouse: 7,
    favorableHouses: [2, 7, 11],
    detrimentalHouses: [1, 6, 10, 12],
    remedialTip: "Ensure clarity in family agreements; verify emotional and financial alignment.",
  },
  {
    id: "childbirth",
    category: "Childbirth & Progeny",
    question: "Is conception and healthy childbirth promised?",
    primaryHouse: 5,
    favorableHouses: [2, 5, 11],
    detrimentalHouses: [1, 4, 10],
    remedialTip: "Focus on nourishment, medical consultations, and positive emotional harmony.",
  },
  {
    id: "property",
    category: "Property & Vehicles",
    question: "Will I successfully purchase the property or vehicle?",
    primaryHouse: 4,
    favorableHouses: [4, 11, 12],
    detrimentalHouses: [3, 5, 10],
    remedialTip: "Verify title deeds and loan pre-approvals before executing down payments.",
  },
  {
    id: "finance",
    category: "Wealth & Finance",
    question: "Will I receive the expected financial payout or investment gain?",
    primaryHouse: 2,
    favorableHouses: [2, 6, 11],
    detrimentalHouses: [12, 1, 5],
    remedialTip: "Monitor cash flows and avoid speculative impulse investments.",
  },
  {
    id: "litigation",
    category: "Court & Legal Matters",
    question: "Will I win the legal dispute / court litigation?",
    primaryHouse: 6,
    favorableHouses: [6, 11],
    detrimentalHouses: [5, 12],
    remedialTip: "Maintain firm evidence and seek amicable out-of-court mediation if feasible.",
  },
  {
    id: "health",
    category: "Health Recovery",
    question: "Will the patient recover from illness swiftly?",
    primaryHouse: 1,
    favorableHouses: [1, 5, 11],
    detrimentalHouses: [6, 8, 12],
    remedialTip: "Adhere strictly to medical regimens; 11th house cure significators provide recovery.",
  },
  {
    id: "travel",
    category: "Foreign Travel & Relocation",
    question: "Will the visa / foreign travel / settlement be approved?",
    primaryHouse: 12,
    favorableHouses: [3, 9, 11, 12],
    detrimentalHouses: [4, 8],
    remedialTip: "Ensure travel paperwork and consulate filings are transparent and timely.",
  },
  {
    id: "lost_article",
    category: "Lost Article",
    question: "Will the lost article / missing item be recovered?",
    primaryHouse: 2,
    favorableHouses: [2, 11],
    detrimentalHouses: [8, 12],
    remedialTip: "Search nearby storage, personal closets, or through trusted associates.",
  },
  {
    id: "reconciliation",
    category: "Relationship Reconciliation",
    question: "Will the separated partner / friend reconcile with me?",
    primaryHouse: 11,
    favorableHouses: [2, 7, 11],
    detrimentalHouses: [6, 12],
    remedialTip: "Open honest, compassionate dialogue without bringing up past grievances.",
  },
];

export class KPHoraryEngine {
  private subLordCalc = new SubLordCalculator();

  /**
   * Casts Horary chart and returns complete judgment
   */
  public calculateHoraryJudgment(
    seed: number,
    tableType: "1-249" | "1-2193",
    queryId: string,
    currentKPChart: KPChartData,
    queryDate: Date = new Date()
  ): KPHoraryResult {
    const query = HORARY_QUERIES.find((q) => q.id === queryId) || HORARY_QUERIES[0];

    // 1. Calculate Horary Ascendant Longitude from Seed
    let ascLon = 0;
    let ascSign = "Aries";
    let ascSignIndex = 0;
    let ascSignLord = "Mars";
    let ascStarLord = "Ketu";
    let ascSubLord = "Ketu";
    let ascSubSubLord: string | undefined = undefined;
    let spanStartFormatted = "";
    let spanEndFormatted = "";

    if (tableType === "1-249") {
      const entry: KP249Entry = SubLordCalculator.getHorary249Entry(seed);
      ascLon = entry.centerLongitude;
      ascSign = entry.signName;
      ascSignIndex = entry.signIndex;
      ascSignLord = entry.signLord;
      ascStarLord = entry.starLord;
      ascSubLord = entry.subLord;
      spanStartFormatted = SubLordCalculator.formatDMS(entry.startLongitude % 30);
      spanEndFormatted = SubLordCalculator.formatDMS(entry.endLongitude % 30);
    } else {
      const entry: KP2193Entry = SubLordCalculator.getHorary2193Entry(seed);
      ascLon = entry.centerLongitude;
      ascSign = entry.signName;
      ascSignIndex = entry.signIndex;
      ascSignLord = entry.signLord;
      ascStarLord = entry.starLord;
      ascSubLord = entry.subLord;
      ascSubSubLord = entry.subSubLord;
      spanStartFormatted = SubLordCalculator.formatDMS(entry.startLongitude % 30);
      spanEndFormatted = SubLordCalculator.formatDMS(entry.endLongitude % 30);
    }

    // 2. Cast Horary Cusps from the Horary Ascendant
    // In KP Horary, the houses are derived from the Horary Lagna
    // (preserving the angular house intervals or standard Placidus progression)
    const horaryCusps = this.generateHoraryCusps(ascLon, currentKPChart.cusps);

    // 3. Map query planets into the new Horary houses
    const horaryPlanets: KPPlanet[] = currentKPChart.planets.map((p) => {
      const house = KPSignificators.getPlanetHouse(p.siderealLon, horaryCusps);
      return {
        ...p,
        house,
      };
    });

    // 4. Calculate 4-Fold Significators for the Horary chart
    const significatorsCalc = new KPSignificators();
    const houseSignificators = significatorsCalc.calculateAllHouseSignificators(
      horaryCusps,
      horaryPlanets
    );
    const planetSignifications = significatorsCalc.calculateAllPlanetSignifications(
      horaryCusps,
      horaryPlanets
    );

    const horaryChartData: KPChartData = {
      ayanamsa: currentKPChart.ayanamsa,
      ayanamsaFormatted: currentKPChart.ayanamsaFormatted,
      cusps: horaryCusps,
      planets: horaryPlanets,
      houseSignificators,
      planetSignifications,
      rulingPlanets: currentKPChart.rulingPlanets,
      currentDashaLord: currentKPChart.currentDashaLord,
      currentAntardashaLord: currentKPChart.currentAntardashaLord,
      currentPratyantardashaLord: currentKPChart.currentPratyantardashaLord,
    };

    // 5. Evaluate Query Judgment
    const primaryCuspDetail = horaryCusps.houseDetails[query.primaryHouse - 1];
    const primaryCsl = primaryCuspDetail.subLord;
    const primaryCslPlanet = horaryPlanets.find((p) => p.name === primaryCsl) || horaryPlanets[0];
    const cslSignification = planetSignifications[primaryCsl] || {
      signifiedHouses: [primaryCuspDetail.house],
      starLordOccupiesHouse: 1,
      starLordOwnsHouses: [],
    };

    const cslStarLord = primaryCslPlanet.starLord;
    const cslSubLord = primaryCslPlanet.subLord;

    // Check favorable vs detrimental connections
    const favorableConnected = cslSignification.signifiedHouses.filter((h) =>
      query.favorableHouses.includes(h)
    );
    const detrimentalConnected = cslSignification.signifiedHouses.filter((h) =>
      query.detrimentalHouses.includes(h)
    );

    // Ruling Planets match check
    const rpList = currentKPChart.rulingPlanets.rulingPlanetsOrdered;
    const allQuerySignificators = Array.from(
      new Set(
        query.favorableHouses.flatMap((h) => houseSignificators[h]?.allSignificators || [])
      )
    );
    const matchingRP = rpList.filter((rp) => allQuerySignificators.includes(rp));

    // Moon check (Mind of querent in KP)
    const moon = horaryPlanets.find((p) => p.name === "Moon");
    const isMoonAligned = moon
      ? query.favorableHouses.includes(moon.house) ||
        rpList.includes(moon.starLord) ||
        rpList.includes(moon.subLord)
      : true;

    // Rule-weighted horary score; not empirically calibrated confidence.
    let heuristicScore = 50;
    if (favorableConnected.length > 0) heuristicScore += 25;
    if (favorableConnected.length >= 2) heuristicScore += 10;
    if (matchingRP.length >= 2) heuristicScore += 10;
    if (isMoonAligned) heuristicScore += 5;
    if (detrimentalConnected.length > 0) heuristicScore -= detrimentalConnected.length * 15;
    if (primaryCslPlanet.isRetrograde) heuristicScore -= 15;

    heuristicScore = Math.max(10, Math.min(95, heuristicScore));

    let verdict: KPHoraryResult["verdict"] = "YES - Delayed / After Effort";
    if (heuristicScore >= 75) {
      verdict = "YES - Strongly Promised";
    } else if (heuristicScore <= 40) {
      verdict = "NO - Denied / Not Feasible";
    }

    const detailedJudgment: string[] = [
      `1. Horary Ascendant Seed #${seed} (${tableType}): Cast at ${SubLordCalculator.formatDMS(
        ascLon % 30
      )} ${ascSign}. Sign Lord: ${ascSignLord}, Star Lord: ${ascStarLord}, Sub-Lord: ${ascSubLord}${
        ascSubSubLord ? `, Sub-Sub: ${ascSubSubLord}` : ""
      }.`,
      `2. Primary House Evaluated: Cusp ${query.primaryHouse} (${query.category}). Cuspal Sub Lord (CSL) is ${primaryCsl}.`,
      `3. CSL Star Lord: ${cslStarLord} (Resides in House ${cslSignification.starLordOccupiesHouse}, owns [${cslSignification.starLordOwnsHouses.join(
        ", "
      )}]).`,
      `4. House Significations: CSL ${primaryCsl} signifies houses [${cslSignification.signifiedHouses.join(
        ", "
      )}]. Favorable matches: [${favorableConnected.join(", ") || "None"}], Detrimental matches: [${detrimentalConnected.join(
        ", "
      ) || "None"}].`,
      `5. Ruling Planets Alignment: Active RPs (${rpList.join(", ")}) share [${matchingRP.join(
        ", "
      ) || "moderate"}] with query significators.`,
      `6. Retrograde Factor: CSL ${primaryCsl} is ${
        primaryCslPlanet.isRetrograde ? "Retrograde (Indicates delays/repeats)" : "Direct (Smooth progress)"
      }.`,
    ];

    return {
      horaryNumber: seed,
      tableType,
      queryCategory: query.category,
      queryQuestion: query.question,
      horaryAscendant: {
        longitude: ascLon,
        sign: ascSign,
        signIndex: ascSignIndex,
        degreeFormatted: SubLordCalculator.formatDMS(ascLon % 30),
        signLord: ascSignLord,
        starLord: ascStarLord,
        subLord: ascSubLord,
        subSubLord: ascSubSubLord,
        spanStartFormatted,
        spanEndFormatted,
      },
      horaryChart: horaryChartData,
      primaryCusp: query.primaryHouse,
      primaryCsl,
      rulingPlanetsMatch: {
        rpList,
        matchingSignificators: matchingRP,
        isMoonCslAligned: isMoonAligned,
      },
      verdict,
      heuristicScore,
      detailedJudgment,
      recommendedAction: query.remedialTip,
    };
  }

  /**
   * Helper to derive 12 houses starting from the Horary Ascendant
   */
  private generateHoraryCusps(horaryAscLon: number, natalCusps: KPCusps): KPCusps {
    const ascDiff = normalizeDegrees(horaryAscLon - natalCusps.cusps[0]);
    const shiftedCusps: number[] = natalCusps.cusps.map((c) =>
      normalizeDegrees(c + ascDiff)
    );

    const houseDetails: KPCusp[] = shiftedCusps.map((lon, idx) => {
      const house = idx + 1;
      const signIndex = Math.floor(lon / 30);
      const signName = SubLordCalculator.getSignName(signIndex);
      const degreeInSign = lon % 30;
      const degreeFormatted = SubLordCalculator.formatDMS(degreeInSign);
      const signLord = SubLordCalculator.getSignLord(signIndex);
      const subResult = this.subLordCalc.calculateSubLord(lon);

      const nextLon = shiftedCusps[(idx + 1) % 12];

      return {
        house,
        longitude: lon,
        signIndex,
        signName,
        degreeInSign,
        degreeFormatted,
        signLord,
        nakshatraIndex: subResult.nakshatraIndex,
        nakshatraName: subResult.nakshatraName,
        starLord: subResult.starLord,
        subLord: subResult.subLord,
        subSubLord: subResult.subSubLord,
        spanStart: lon,
        spanEnd: nextLon,
      };
    });

    const houseSigns = houseDetails.map((h) => h.signName);
    const houseLords = houseDetails.map((h) => h.signLord);

    return {
      cusps: shiftedCusps,
      houseDetails,
      houseSigns,
      houseLords,
      ayanamsa: natalCusps.ayanamsa,
      ayanamsaName: natalCusps.ayanamsaName,
    };
  }
}
