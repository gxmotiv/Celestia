/**
 * Krishnamurti Padhdhati (KP) Complete Chart Engine
 * Integrates Cusps, Sub-Lords, Significators, Ruling Planets & Predictions
 */

import { WesternChartData, normalizeDegrees } from "../astronomy/ephemeris";
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
    birthDate: Date
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
    const kpPlanets: KPPlanet[] = westernData.planets.map((p) => {
      const siderealLon = normalizeDegrees(p.longitude - kpAyanamsa);
      const signIndex = Math.floor(siderealLon / 30);
      const sign = SubLordCalculator.getSignName(signIndex);
      const signLord = SubLordCalculator.getSignLord(signIndex);
      const degreeInSign = siderealLon % 30;
      const degreeFormatted = SubLordCalculator.formatDMS(degreeInSign);

      const subResult = this.subLordCalc.calculateSubLord(siderealLon);
      const house = KPSignificators.getPlanetHouse(siderealLon, kpCusps);

      return {
        id: p.id,
        name: p.name,
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
    const houseSignificators: Record<number, KPHouseSignificators> =
      this.significatorsCalc.calculateAllHouseSignificators(kpCusps, kpPlanets);

    // 4. Calculate Planet Significations
    const planetSignifications: Record<string, KPPlanetSignification> =
      this.significatorsCalc.calculateAllPlanetSignifications(kpCusps, kpPlanets);

    // 5. Calculate KP Ruling Planets (RP)
    const rulingPlanets: KPRulingPlanets = this.predictionEngine.calculateRulingPlanets(
      kpCusps,
      kpPlanets,
      birthDate
    );

    return {
      ayanamsa: kpAyanamsa,
      ayanamsaFormatted: SubLordCalculator.formatDMS(kpAyanamsa),
      cusps: kpCusps,
      planets: kpPlanets,
      houseSignificators,
      planetSignifications,
      rulingPlanets,
      currentDashaLord: vedicData.currentMahadasha || "Jupiter",
      currentAntardashaLord: vedicData.currentAntardasha || "Venus",
      currentPratyantardashaLord: "Sun",
    };
  }
}
