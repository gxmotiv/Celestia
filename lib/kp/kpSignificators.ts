/**
 * Krishnamurti Padhdhati (KP) 4-Fold Significators Engine
 * 
 * KP Rule of Signification:
 * Grade I (Level A): Planet in the Star of an Occupant of the house (Strongest).
 * Grade II (Level B): Occupant of the house itself.
 * Grade III (Level C): Planet in the Star of the Lord of the house.
 * Grade IV (Level D): Lord of the house itself (Weakest).
 * 
 * Plus Planet in Sub of the House Lord & Occupants.
 */

import {
  KPCusps,
  KPPlanet,
  KPHouseSignificators,
  KPPlanetSignification,
  SignificatorLevels,
} from "./kpTypes";
import { normalizeDegrees } from "../astronomy/ephemeris";

export class KPSignificators {
  /**
   * Determine which house a planet occupies based on KP cuspal boundaries
   */
  public static isPlanetInHouse(planetLon: number, houseNum: number, cusps: KPCusps): boolean {
    const idx = houseNum - 1;
    const c1 = cusps.cusps[idx];
    const c2 = cusps.cusps[(idx + 1) % 12];
    const norm = normalizeDegrees(planetLon);

    if (c1 <= c2) {
      return norm >= c1 && norm < c2;
    } else {
      // Crosses 0° Aries
      return norm >= c1 || norm < c2;
    }
  }

  /**
   * Find house index (1-12) for a given longitude
   */
  public static getPlanetHouse(planetLon: number, cusps: KPCusps): number {
    for (let h = 1; h <= 12; h++) {
      if (this.isPlanetInHouse(planetLon, h, cusps)) {
        return h;
      }
    }
    return 1;
  }

  /**
   * Calculate Significators for a specific house (1 to 12)
   */
  public calculateSignificators(
    house: number,
    cusps: KPCusps,
    planets: KPPlanet[]
  ): KPHouseSignificators {
    const houseLord = cusps.houseLords[house - 1];
    const occupants: string[] = [];
    const planetsInStar: string[] = [];
    const planetsInSub: string[] = [];

    // 1. Find Occupants (Grade II / Level B)
    planets.forEach((p) => {
      if (KPSignificators.isPlanetInHouse(p.siderealLon, house, cusps)) {
        occupants.push(p.name);
      }
    });

    // 2. Find Planets in Star of House Lord (Grade III / Level C)
    planets.forEach((p) => {
      if (p.starLord === houseLord) {
        planetsInStar.push(p.name);
      }
    });

    // 3. Find Planets in Sub of House Lord
    planets.forEach((p) => {
      if (p.subLord === houseLord) {
        planetsInSub.push(p.name);
      }
    });

    // 4. Classical 4-Fold KP Levels:
    // Level A: Planets in star of occupants
    const levelA: string[] = [];
    occupants.forEach((occName) => {
      planets.forEach((p) => {
        if (p.starLord === occName && !levelA.includes(p.name)) {
          levelA.push(p.name);
        }
      });
    });

    // Level B: Occupants of the house
    const levelB: string[] = [...occupants];

    // Level C: Planets in star of house lord
    const levelC: string[] = [...planetsInStar];

    // Level D: House Lord itself
    const levelD: string[] = houseLord ? [houseLord] : [];

    // Distinct ordered list from strongest to weakest
    const allSet = new Set<string>();
    levelA.forEach((p) => allSet.add(p));
    levelB.forEach((p) => allSet.add(p));
    levelC.forEach((p) => allSet.add(p));
    levelD.forEach((p) => allSet.add(p));

    const levels: SignificatorLevels = {
      levelA,
      levelB,
      levelC,
      levelD,
    };

    return {
      house,
      houseLord,
      occupants,
      planetsInStar,
      planetsInSub,
      levels,
      allSignificators: Array.from(allSet),
    };
  }

  /**
   * Calculate all 12 houses significators
   */
  public calculateAllHouseSignificators(
    cusps: KPCusps,
    planets: KPPlanet[]
  ): Record<number, KPHouseSignificators> {
    const result: Record<number, KPHouseSignificators> = {};
    for (let h = 1; h <= 12; h++) {
      result[h] = this.calculateSignificators(h, cusps, planets);
    }
    return result;
  }

  /**
   * Calculate what houses each planet signifies
   */
  public calculateAllPlanetSignifications(
    cusps: KPCusps,
    planets: KPPlanet[]
  ): Record<string, KPPlanetSignification> {
    const result: Record<string, KPPlanetSignification> = {};

    // Map planet -> house it occupies & houses it owns
    const planetMap: Record<string, { occupies: number; owns: number[] }> = {};
    planets.forEach((p) => {
      const occupies = KPSignificators.getPlanetHouse(p.siderealLon, cusps);
      const owns: number[] = [];
      cusps.houseLords.forEach((lord, idx) => {
        if (lord === p.name) owns.push(idx + 1);
      });
      planetMap[p.name] = { occupies, owns };
    });

    planets.forEach((p) => {
      const selfInfo = planetMap[p.name] || { occupies: 1, owns: [] };
      const starInfo = planetMap[p.starLord] || { occupies: 1, owns: [] };
      const subInfo = planetMap[p.subLord] || { occupies: 1, owns: [] };

      // In KP: Planet strongly signifies houses of Star Lord, then its own
      const housesSet = new Set<number>();
      housesSet.add(starInfo.occupies);
      starInfo.owns.forEach((h) => housesSet.add(h));
      housesSet.add(selfInfo.occupies);
      selfInfo.owns.forEach((h) => housesSet.add(h));

      result[p.name] = {
        planet: p.name,
        occupiesHouse: selfInfo.occupies,
        ownsHouses: selfInfo.owns,
        starLord: p.starLord,
        starLordOccupiesHouse: starInfo.occupies,
        starLordOwnsHouses: starInfo.owns,
        subLord: p.subLord,
        subLordOccupiesHouse: subInfo.occupies,
        subLordOwnsHouses: subInfo.owns,
        signifiedHouses: Array.from(housesSet).sort((a, b) => a - b),
      };
    });

    return result;
  }
}
