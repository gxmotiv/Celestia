/**
 * Krishnamurti Padhdhati (KP) Cusps Calculator
 * Calculates Placidus cusps with Krishnamurti Ayanamsa & KP boundary rules.
 */

import { KPCusp, KPCusps } from "./kpTypes";
import { SubLordCalculator } from "./subLordEngine";
import { WesternChartData, normalizeDegrees } from "../astronomy/ephemeris";

export interface BirthData {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  latitude: number;
  longitude: number;
  timezoneOffset?: number;
}

export class KPCuspsCalculator {
  private subLordCalc = new SubLordCalculator();

  /**
   * Krishnamurti Ayanamsa:
   * Value at 1900.0 is 22° 22' 14" (22.370555°)
   * Annual precession rate = 50.2388475 arcseconds/year
   */
  public static calculateKPAyanamsa(year: number, month: number, day: number): number {
    const fractionOfYear = (month - 1) / 12 + day / 365.25;
    const decimalYear = year + fractionOfYear;
    const diffYears = decimalYear - 1900.0;
    const ayanamsaSeconds = 22 * 3600 + 22 * 60 + 14 + diffYears * 50.2388475;
    return ayanamsaSeconds / 3600;
  }

  /**
   * Calculate 12 KP Cusps from Western Placidus cusps or Birth Data
   */
  public calculateKPCuspsFromWestern(
    westernData: WesternChartData,
    birthYear = 1990,
    birthMonth = 1,
    birthDay = 1
  ): KPCusps {
    const kpAyanamsa = KPCuspsCalculator.calculateKPAyanamsa(birthYear, birthMonth, birthDay);

    // 1. Convert Western Tropical Placidus Cusps to KP Sidereal
    const siderealPlacidusCusps = westernData.houses.map((h) => {
      return normalizeDegrees(h.longitude - kpAyanamsa);
    });

    // 2. Apply KP Cusp Corrections (as requested in KP specification:
    // If cusp falls in last 3°20' (26°40' or 26.6667°) of sign, move to next sign)
    const correctedCusps = siderealPlacidusCusps.map((cusp) => {
      const signIndex = Math.floor(cusp / 30);
      const degreeInSign = cusp % 30;

      if (degreeInSign >= 26.6667) {
        return normalizeDegrees((signIndex + 1) * 30);
      }
      return cusp;
    });

    // 3. Assemble detailed KPCusp objects
    const houseDetails: KPCusp[] = correctedCusps.map((cuspLon, index) => {
      const houseNum = index + 1;
      const nextCuspLon = correctedCusps[index === 11 ? 0 : index + 1];
      const signIndex = Math.floor(cuspLon / 30);
      const signName = SubLordCalculator.getSignName(signIndex);
      const signLord = SubLordCalculator.getSignLord(signIndex);
      const degreeInSign = cuspLon % 30;

      const subLordInfo = this.subLordCalc.calculateSubLord(cuspLon);

      return {
        house: houseNum,
        longitude: cuspLon,
        signIndex,
        signName,
        degreeInSign,
        degreeFormatted: SubLordCalculator.formatDMS(degreeInSign),
        signLord,
        nakshatraIndex: subLordInfo.nakshatraIndex,
        nakshatraName: subLordInfo.nakshatraName,
        starLord: subLordInfo.starLord,
        subLord: subLordInfo.subLord,
        subSubLord: subLordInfo.subSubLord,
        spanStart: cuspLon,
        spanEnd: nextCuspLon,
      };
    });

    return {
      cusps: correctedCusps,
      houseDetails,
      houseSigns: houseDetails.map((h) => h.signName),
      houseLords: houseDetails.map((h) => h.signLord),
      ayanamsa: kpAyanamsa,
      ayanamsaName: "KP (Krishnamurti) Standard",
    };
  }
}
