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

    // KP uses the actual sidereal Placidus cusp longitude. Do not snap or
    // advance a cusp that happens to fall in the last 3°20' of a sign:
    // that would alter the house boundary and its star/sub-lord calculation.
    const siderealPlacidusCusps = westernData.houses.map((h) =>
      normalizeDegrees(h.longitude - kpAyanamsa)
    );

    // Assemble detailed KPCusp objects from the unmodified calculated cusps.
    const houseDetails: KPCusp[] = siderealPlacidusCusps.map((cuspLon, index) => {
      const houseNum = index + 1;
      const nextCuspLon = siderealPlacidusCusps[index === 11 ? 0 : index + 1];
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
      cusps: siderealPlacidusCusps,
      houseDetails,
      houseSigns: houseDetails.map((h) => h.signName),
      houseLords: houseDetails.map((h) => h.signLord),
      ayanamsa: kpAyanamsa,
      ayanamsaName: "KP (Krishnamurti) Standard",
    };
  }
}
