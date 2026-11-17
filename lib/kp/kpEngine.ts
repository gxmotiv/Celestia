/**
 * Krishnamurti Padhdhati (KP) Complete Chart Engine
 * Integrates Cusps, Sub-Lords, Significators, Ruling Planets & Predictions
 */

import { WesternChartData, normalizeDegrees, filterCalculationReadyPoints } from "../astronomy/ephemeris";
import { VedicChartData } from "../astronomy/vedic";
import {
  KPChartData,
  KPPlanet,
  KPCusps,
  KPHouseSignificators,
  KPPlanetSignification,
  KPRulingPlanets,
} from "./kpTypes";
import { KPCuspsCalculator } from "./kpCusps";
import { SubLordCalculator } from "./subLordEngine";
import { KPSignificators } from "./kpSignificators";
import { KPPredictionEngine } from "./kpPredictionEngine";

export class KPEngine {
  private cuspsCalc = new KPCuspsCalculator();
  private subLordCalc = new SubLordCalculator();
  private significatorsCalc = new KPSignificators();
  private predictionEngine = new KPPredictionEngine();

  /**
   * Generates the complete KP System Chart Data
   */
  public generateKPChart(
    westernData: WesternChartData,
    vedicData: VedicChartData,
    birthDate: Date,
    bodySet: "classical-nine" | "extended-twelve" = "classical-nine"
  ): KPChartData {
    const year = birthDate.getUTCFullYear();
    const month = birthDate.getUTCMonth() + 1;
    const day = birthDate.getUTCDate();

    // 1. Calculate KP Cusps with KP Ayanamsa
    const kpCusps: KPCusps = this.cuspsCalc.calculateKPCuspsFromWestern(
      westernData,
      year,
      month,
      day
    );

    const kpAyanamsa = kpCusps.ayanamsa;

    // 2. Convert Western Planets to KP Sidereal with Sub-Lord and Sub-Sub Lord
    const calculationReadyPoints = filterCalculationReadyPoints(westernData.planets);
    const classicalNineNames = new Set([
      "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn",
      "NorthNode", "SouthNode",
    ]);
    const requiredMissing = Array.from(classicalNineNames).filter(
      (name) => !calculationReadyPoints.some((point) => point.name === name)
    );
    if (requiredMissing.length > 0) {
      throw new Error(`KP chart is missing required classical points: ${requiredMissing.join(", ")}.`);
    }

    const selectedPoints = bodySet === "classical-nine"
      ? calculationReadyPoints.filter((point) => classicalNineNames.has(point.name))
      : calculationReadyPoints;

    const kpPlanets: KPPlanet[] = selectedPoints.map((p) => {
      // Western point names are translated into KP's traditional node names.
      // The shared astronomy engine currently provides mean Rahu and its
      // exactly opposite Ketu; the selected node convention is exposed below.
      const kpName = p.name === "NorthNode"
        ? "Rahu"
        : p.name === "SouthNode"
        ? "Ketu"
        : p.name;
      const siderealLon = normalizeDegrees(p.longitude - kpAyanamsa);
      const signIndex = Math.floor(siderealLon / 30);
      const sign = SubLordCalculator.getSignName(signIndex);
      const signLord = SubLordCalculator.getSignLord(signIndex);
      const degreeInSign = siderealLon % 30;
      const degreeFormatted = SubLordCalculator.formatDMS(degreeInSign);

      const subResult = this.subLordCalc.calculateSubLord(siderealLon);
      const house = KPSignificators.getPlanetHouse(siderealLon, kpCusps);

      return {
        id: kpName,
        name: kpName,
        symbol: p.symbol,
        tropicalLon: p.longitude,
        siderealLon,
        signIndex,
        sign,
        degreeInSign,
        degreeFormatted,
        house,
        nakshatraIndex: subResult.nakshatraIndex,
        nakshatraName: subResult.nakshatraName,
        pada: subResult.pada,
        signLord,
        starLord: subResult.starLord,
        subLord: subResult.subLord,
        subSubLord: subResult.subSubLord,
        isRetrograde: p.isRetrograde || false,
        speed: p.speed || 0,
      };
    });

    // 3. Calculate 4-Fold House Significators
    const baseHouseSignificators: Record<number, KPHouseSignificators> =
      this.significatorsCalc.calculateAllHouseSignificators(kpCusps, kpPlanets);

    // 4. Calculate base Planet Significations
    const basePlanetSignifications: Record<string, KPPlanetSignification> =
      this.significatorsCalc.calculateAllPlanetSignifications(kpCusps, kpPlanets);

    // 4a. Resolve nodes from the base A-D table, then apply the preferred
    // KSK Reader VI node tier to Rahu/Ketu and planets in their stars.
    const nodeAgentRule = "reader-vi" as const;
    const nodeRepresentations = this.significatorsCalc.calculateNodeRepresentations(
      kpPlanets,
      basePlanetSignifications,
      nodeAgentRule
    );
    const planetSignifications: Record<string, KPPlanetSignification> =
      this.significatorsCalc.applyNodeAgentSignifications(
        kpPlanets,
        basePlanetSignifications,
        nodeRepresentations
      );
    const houseSignificators: Record<number, KPHouseSignificators> =
      this.significatorsCalc.applyNodeAgentsToHouseSignificators(
        baseHouseSignificators,
        nodeRepresentations
      );

    // 5. Calculate KP Ruling Planets (RP)
    // The local calendar date above remains the input for the existing
    // date-based KP ayanamsa profile. Day lord uses the real shared UTC instant
    // recovered from the chart Julian Day, plus the chart's birthplace.
    const birthInstant = new Date((westernData.julianDay - 2440587.5) * 86_400_000);
    const dayLordContext: KPReaderVIDayLordContext = {
      birthInstant,
      latitude: westernData.birthLatitude ?? Number.NaN,
      longitude: westernData.birthLongitude ?? Number.NaN,
      birthTimeKnown,
    };
    const rulingPlanets: KPRulingPlanets = this.predictionEngine.calculateRulingPlanets(
      kpCusps,
      kpPlanets,
      birthDate,
      dayLordContext
    );

    return {
      bodySet,
      nodeConvention: "mean",
      nodeAgentRule,
      nodeConjunctionPolicy: "same-sidereal-sign-provisional",
      nodeAspectPolicy: "parashari-full-sign-drishti-classical-seven",
      nodeRepresentations,
      ayanamsa: kpAyanamsa,
      ayanamsaFormatted: SubLordCalculator.formatDMS(kpAyanamsa),
      cusps: kpCusps,
      planets: kpPlanets,
      houseSignificators,
      planetSignifications,
      rulingPlanets,
      currentDashaLord: vedicData.currentMahadasha,
      currentAntardashaLord: vedicData.currentAntardasha,
    };
  }
}
