/**
 * Krishnamurti Padhdhati (KP) Cusps Calculator
 * Calculates Placidus cusps with Krishnamurti Ayanamsa & KP boundary rules.
 */

import { KPCusp, KPCusps } from "./kpTypes";
import { SubLordCalculator } from "./subLordEngine";
import { WesternChartData, normalizeDegrees } from "../astronomy/ephemeris";
import { swissEphemeris } from "../astronomy/swissEphemeris";

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

    // 1. KP uses Placidus cusps regardless of the user's separate Western
    // natal house preference. Recalculate tropical Placidus from the chart's
    // own UTC Julian Day and birthplace before applying KP ayanamsa.
    // Reusing westernData.houses directly would silently import Whole Sign,
    // Morinus, Meridian, etc. into KP when the user selected another system.
    let tropicalPlacidusCusps: number[];
    const hasBirthGeometry =
      Number.isFinite(westernData.julianDay) &&
      Number.isFinite(westernData.birthLatitude) &&
      Number.isFinite(westernData.birthLongitude);

    if (hasBirthGeometry) {
      const placidus = swissEphemeris.calculateHouses(
        westernData.julianDay,
        westernData.birthLatitude as number,
        westernData.birthLongitude as number,
        "P"
      );
      if (placidus.houseSystemUsed !== "P") {
        throw new RangeError(
          "KP requires Placidus house cusps. Placidus is undefined for this birthplace/epoch in the current calculation, so KP cusps were not silently replaced by another house system."
        );
      }
      tropicalPlacidusCusps = placidus.houseCusps;
    } else if (westernData.houseSystem === "Placidus") {
      // Backward-compatible path for callers that supply a verified Placidus
      // chart without its original birthplace geometry.
      tropicalPlacidusCusps = westernData.houses.map((house) => house.longitude);
    } else {
      throw new RangeError(
        "KP requires Placidus cusps and the original birth latitude/longitude. The supplied Western chart uses " +
        westernData.houseSystem +
        " and cannot be reused as KP house geometry."
      );
    }

    if (tropicalPlacidusCusps.length !== 12 || !tropicalPlacidusCusps.every(Number.isFinite)) {
      throw new RangeError("KP Placidus cusp calculation must produce twelve finite cusps.");
    }

    // Convert only the KP-required tropical Placidus cusps to the KP sidereal frame.
    const siderealPlacidusCusps = tropicalPlacidusCusps.map((cusp) =>
      normalizeDegrees(cusp - kpAyanamsa)
    );

    // 2. Preserve the exact KP sidereal cusp longitude. Determine its sign,
    // star and sub at that precise point; never snap a late-sign cusp to 0°
    // of the next sign. That would change the cusp's sign lord and can change
    // its star/sub lord, contradicting minute-accurate KP cusp work.
    // 3. Assemble detailed KPCusp objects
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
