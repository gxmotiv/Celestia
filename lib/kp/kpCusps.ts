/**
 * Krishnamurti Padhdhati (KP) Cusps Calculator
 * Calculates Placidus cusps with an explicitly labelled KP-compatible
 * ayanamsa approximation and KP boundary rules.
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
   * KP Old-style fixed-rate compatibility approximation; not a transcription
   * of K.S. Krishnamurti's original 1840–2001 table.
   *
   * Configured anchor: 22°21′50″ at 1900-01-01 00:00 UT (JD 2415020.5).
   * The implementation adds a fixed 50.2388475 arcseconds per Gregorian
   * calendar year, using the fraction of the current Gregorian year.
   *
   * Provenance caveat: the accessible OCR of KP Reader I lists an annual
   * ayanamsa table through 2001 and quotes approximately 50.2388475″ for
   * subsequent years, but does not establish this code's anchor/interpolation
   * as the original table method or identify that slope as the B1900 rate.
   * A later technical analysis identifies 50.2388475″ as Newcomb's rate at
   * B1821. Newcomb's conventional B1900 general-precession rate is
   * 50.2564″ per Besselian year (5025.64″ per tropical century), with an
   * epoch-dependent rate. This fixed-slope Gregorian interpolation is not
   * a full Newcomb integration, not KP New / VP291, and not an independently
   * certified reproduction of the original KP table.
   *
   * The formula is retained for compatibility until the competing KP
   * ayanamsa lineages and the original tabulated values are independently
   * collated. It is not presented as a canonical KP ayanamsa.
   */
  public static calculateKPAyanamsa(year: number, month: number, day: number): number {
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
      throw new Error("KP ayanamsa date requires integer year, month and day.");
    }
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      !Number.isFinite(date.getTime()) ||
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() + 1 !== month ||
      date.getUTCDate() !== day
    ) {
      throw new Error("KP ayanamsa date is not a valid calendar date.");
    }
    const yearStart = Date.UTC(year, 0, 1);
    const nextYearStart = Date.UTC(year + 1, 0, 1);
    const fractionOfYear = (date.getTime() - yearStart) / (nextYearStart - yearStart);
    const elapsedYears = year - 1900 + fractionOfYear;
    const ayanamsaSeconds = 22 * 3600 + 21 * 60 + 50 + elapsedYears * 50.2388475;
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
      ayanamsaName: "KP Old-style fixed-rate approximation (unverified lineage)",
    };
  }
}
