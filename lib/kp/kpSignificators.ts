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
  KPPlanetSignificationGrade,
  KPNodeAgentRule,
  KPNodeAgentSource,
  KPNodeAgentTier,
  KPNodeRepresentation,
  SignificatorLevels,
} from "./kpTypes";
import { normalizeDegrees } from "../astronomy/ephemeris";

export class KPSignificators {
  private static validateCusps(cusps: KPCusps): void {
    if (!Array.isArray(cusps?.cusps) || cusps.cusps.length !== 12 ||
        cusps.cusps.some((cusp) => !Number.isFinite(cusp))) {
      throw new Error("KP house assignment requires twelve finite cusp longitudes.");
    }

    const normalized = cusps.cusps.map(normalizeDegrees);
    const spans = normalized.map((cusp, index) =>
      (normalized[(index + 1) % 12] - cusp + 360) % 360
    );
    if (spans.some((span) => span <= 1e-10) ||
        Math.abs(spans.reduce((sum, span) => sum + span, 0) - 360) > 1e-7) {
      throw new Error("KP house assignment requires twelve distinct, cyclically ordered cusps covering 360 degrees exactly once.");
    }
  }

  private static isPlanetInHouseUnchecked(planetLon: number, houseNum: number, cusps: KPCusps): boolean {
    if (!Number.isInteger(houseNum) || houseNum < 1 || houseNum > 12) {
      throw new Error(`KP house number must be between 1 and 12; received ${houseNum}.`);
    }
    const idx = houseNum - 1;
    const c1 = normalizeDegrees(cusps.cusps[idx]);
    const c2 = normalizeDegrees(cusps.cusps[(idx + 1) % 12]);
    const norm = normalizeDegrees(planetLon);

    if (c1 < c2) return norm >= c1 && norm < c2;
    return norm >= c1 || norm < c2;
  }

  /**
   * Determine which house a planet occupies based on validated KP cuspal boundaries.
   */
  public static isPlanetInHouse(planetLon: number, houseNum: number, cusps: KPCusps): boolean {
    if (!Number.isFinite(planetLon)) {
      throw new Error("KP house assignment requires a finite planetary longitude.");
    }
    KPSignificators.validateCusps(cusps);
    return this.isPlanetInHouseUnchecked(planetLon, houseNum, cusps);
  }

  /**
   * Find house index (1-12) for a given longitude.
   */
  public static getPlanetHouse(planetLon: number, cusps: KPCusps): number {
    if (!Number.isFinite(planetLon)) {
      throw new Error("KP house assignment requires a finite planetary longitude.");
    }
    this.validateCusps(cusps);
    for (let h = 1; h <= 12; h++) {
      if (this.isPlanetInHouseUnchecked(planetLon, h, cusps)) return h;
    }
    throw new Error(`KP could not assign longitude ${planetLon} to any house; refusing to default to house 1.`);
  }

  /**
   * Calculate Significators for a specific house (1 to 12)
   */
  public calculateSignificators(
    house: number,
    cusps: KPCusps,
    planets: KPPlanet[]
  ): KPHouseSignificators {
    this.validateCusps(cusps);
    if (!Number.isInteger(house) || house < 1 || house > 12) {
      throw new Error(`KP significator house must be between 1 and 12; received ${house}.`);
    }
    if (!Array.isArray(cusps.houseLords) || cusps.houseLords.length !== 12 ||
        cusps.houseLords.some((lord) => typeof lord !== "string" || !lord.trim())) {
      throw new Error("KP house significators require twelve valid cusp sign lords.");
    }
    const houseLord = cusps.houseLords[house - 1];
    const occupants: string[] = [];
    const planetsInStar: string[] = [];
    const planetsInSub: string[] = [];

    // 1. Find Occupants (Grade II / Level B)
    planets.forEach((p) => {
      if (KPSignificators.isPlanetInHouseUnchecked(p.siderealLon, house, cusps)) {
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
   * Resolve Rahu/Ketu as agents using an explicitly selected KSK Reader variant.
   * Reader VI places the node's star lord before aspecting planets; Reader III/V
   * places aspecting planets before the star lord. This method never treats the
   * nodes as sign owners or as aspect-casting planets.
   */
  public calculateNodeRepresentations(
    planets: KPPlanet[],
    planetSignifications: Record<string, KPPlanetSignification>,
    rule: KPNodeAgentRule = "reader-vi"
  ): Partial<Record<"Rahu" | "Ketu", KPNodeRepresentation>> {
    const result: Partial<Record<"Rahu" | "Ketu", KPNodeRepresentation>> = {};
    const nodeNames = ["Rahu", "Ketu"] as const;
    const classicalAspectors = new Set(["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"]);
    const offsetsFor = (name: string): number[] => {
      if (name === "Mars") return [4, 7, 8];
      if (name === "Jupiter") return [5, 7, 9];
      if (name === "Saturn") return [3, 7, 10];
      return [7];
    };

    planets.forEach((planet) => {
      if (!Number.isInteger(planet.signIndex) || planet.signIndex < 0 || planet.signIndex > 11) {
        throw new Error(`KP node representation requires a valid sidereal sign index for ${planet.name}.`);
      }
      if (!Number.isInteger(planet.house) || planet.house < 1 || planet.house > 12) {
        throw new Error(`KP node representation requires a valid occupied house for ${planet.name}.`);
      }
    });

    nodeNames.forEach((nodeName) => {
      const node = planets.find((planet) => planet.name === nodeName);
      if (!node) return;
      if (!node.starLord?.trim() || !node.signLord?.trim()) {
        throw new Error(`KP node representation requires star lord and sign lord data for ${nodeName}.`);
      }

      const conjoined = planets
        .filter((planet) =>
          classicalAspectors.has(planet.name) &&
          planet.name !== nodeName &&
          planet.signIndex === node.signIndex
        )
        .map((planet) => planet.name);

      const starAgent =
        node.starLord && node.starLord !== nodeName &&
        node.starLord !== "Rahu" && node.starLord !== "Ketu" &&
        planets.some((planet) => planet.name === node.starLord)
          ? [node.starLord]
          : [];

      const aspecting = planets
        .filter((planet) => {
          if (!classicalAspectors.has(planet.name)) return false;
          const offset = ((node.signIndex - planet.signIndex + 12) % 12) + 1;
          return offsetsFor(planet.name).includes(offset);
        })
        .map((planet) => planet.name);

      const signAgent =
        node.signLord && node.signLord !== nodeName &&
        node.signLord !== "Rahu" && node.signLord !== "Ketu" &&
        planets.some((planet) => planet.name === node.signLord)
          ? [node.signLord]
          : [];

      const priorityOrder: KPNodeAgentSource[] = rule === "reader-vi"
        ? ["conjunction", "star-lord", "aspect", "sign-lord"]
        : ["conjunction", "aspect", "star-lord", "sign-lord"];
      const agentPlanets: Record<KPNodeAgentSource, string[]> = {
        conjunction: conjoined,
        "star-lord": starAgent,
        aspect: aspecting,
        "sign-lord": signAgent,
      };
      const agentTiers: KPNodeAgentTier[] = priorityOrder.map((source, index) => {
        const names = agentPlanets[source];
        const houses = new Set<number>();
        names.forEach((name) => {
          const agentSignification = planetSignifications[name];
          if (!agentSignification) {
            throw new Error(`KP node agent ${name} has no calculated house signification.`);
          }
          agentSignification.signifiedHouses.forEach((house) => houses.add(house));
        });
        return {
          source,
          priority: index + 1,
          planets: names,
          signifiedHouses: Array.from(houses).sort((a, b) => a - b),
        };
      });

      // KSK material gives the node's occupied house as a direct signification,
      // then the most prominent available representative as the practical agent.
      const preferredTier = agentTiers.find((tier) => tier.planets.length > 0);
      const preferredAgentHouses = preferredTier?.signifiedHouses ?? [];
      const allAgentHouses = Array.from(new Set(
        agentTiers.flatMap((tier) => tier.signifiedHouses)
      )).sort((a, b) => a - b);
      const representedHouses = Array.from(new Set([
        node.house,
        ...preferredAgentHouses,
      ])).sort((a, b) => a - b);

      result[nodeName] = {
        node: nodeName,
        occupiedHouse: node.house,
        sign: node.sign,
        signLord: node.signLord,
        starLord: node.starLord,
        rule,
        conjunctionPolicy: "same-sidereal-sign-provisional",
        aspectPolicy: "parashari-full-sign-drishti-classical-seven",
        priorityOrder,
        agentTiers,
        preferredAgentSource: preferredTier?.source,
        preferredAgentPlanets: preferredTier?.planets ?? [],
        preferredAgentHouses,
        allAgentHouses,
        representedHouses,
      };
    });

    return result;
  }

  /**
   * Apply the selected node-agent chain to the otherwise classical A-D table.
   * Only the preferred Reader tier is injected into the main A-D result;
   * alternate tiers remain visible in the node cascade for auditability.
   */
  public applyNodeAgentSignifications(
    planets: KPPlanet[],
    baseSignifications: Record<string, KPPlanetSignification>,
    nodeRepresentations: Partial<Record<"Rahu" | "Ketu", KPNodeRepresentation>>
  ): Record<string, KPPlanetSignification> {
    const expanded: Record<string, KPPlanetSignification> = {};

    planets.forEach((planet) => {
      const base = baseSignifications[planet.name];
      if (!base) throw new Error(`KP node integration is missing base signification for ${planet.name}.`);

      const isNode = planet.name === "Rahu" || planet.name === "Ketu";
      const nodeForStarLord = planet.starLord === "Rahu" || planet.starLord === "Ketu"
        ? planet.starLord
        : undefined;
      const nodeRepresentation = isNode
        ? nodeRepresentations[planet.name as "Rahu" | "Ketu"]
        : nodeForStarLord
        ? nodeRepresentations[nodeForStarLord]
        : undefined;

      if ((isNode || nodeForStarLord) && !nodeRepresentation) {
        throw new Error(`KP node integration cannot resolve the representative cascade for ${isNode ? planet.name : nodeForStarLord}.`);
      }

      const nodeAgentHouses = isNode
        ? [...(nodeRepresentation?.representedHouses ?? [])]
        : undefined;
      const starLordNodeAgentHouses = nodeForStarLord
        ? [...(nodeRepresentation?.representedHouses ?? [])]
        : undefined;

      const levelA = Array.from(new Set([
        ...base.levels.levelA,
        ...(starLordNodeAgentHouses ?? []),
      ])).sort((a, b) => a - b);
      const signifiedHouses = Array.from(new Set([
        ...base.signifiedHouses,
        ...(nodeAgentHouses ?? []),
        ...(starLordNodeAgentHouses ?? []),
      ])).sort((a, b) => a - b);

      expanded[planet.name] = {
        ...base,
        levels: {
          ...base.levels,
          levelA,
        },
        nodeAgentHouses,
        starLordNodeAgentHouses,
        signifiedHouses,
      };
    });

    return expanded;
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
      const selfInfo = planetMap[p.name];
      const starInfo = planetMap[p.starLord];
      const subInfo = planetMap[p.subLord];
      if (!selfInfo) throw new Error(`KP signification cannot resolve chart position for ${p.name}.`);
      if (!starInfo) throw new Error(`KP signification cannot resolve star lord ${p.starLord} for ${p.name}.`);
      if (!subInfo) throw new Error(`KP signification cannot resolve sub lord ${p.subLord} for ${p.name}.`);

      // Classical KP planet-level four-fold significations. Keep the four
      // grades separate: A=star lord's occupied house, B=planet's occupied
      // house, C=star lord's owned houses, D=planet's owned houses.
      const levels = {
        levelA: [starInfo.occupies],
        levelB: [selfInfo.occupies],
        levelC: [...starInfo.owns],
        levelD: [...selfInfo.owns],
      };

      // Classical "self-strength": no other planet tenants this planet's
      // stars. Keep this test distinct from the modern Gondhalekar own-star
      // Positional Status override, which belongs to the separate 4-Step engine.
      const starTenants = planets
        .filter((candidate) => candidate.name !== p.name && candidate.starLord === p.name)
        .map((candidate) => candidate.name);
      const hasSelfStrength = starTenants.length === 0;
      const strengthOrder: KPPlanetSignificationGrade[] = hasSelfStrength
        ? ["B", "A", "D", "C"]
        : ["A", "B", "C", "D"];

      const housesSet = new Set<number>([
        ...levels.levelA,
        ...levels.levelB,
        ...levels.levelC,
        ...levels.levelD,
      ]);

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
        levels,
        strengthOrder,
        starTenants,
        hasSelfStrength,
        signifiedHouses: Array.from(housesSet).sort((a, b) => a - b),
      };
    });

    return result;
  }
}
