import assert from "node:assert/strict";
import { calculateWesternChart } from "../lib/astronomy/ephemeris";
import { KPCuspsCalculator } from "../lib/kp/kpCusps";
import { SubLordCalculator } from "../lib/kp/subLordEngine";
import { KPFourStepEngine } from "../lib/kp/kpFourStepEngine";
import { KPSignificators } from "../lib/kp/kpSignificators";
import { KPPredictionEngine } from "../lib/kp/kpPredictionEngine";
import { KPEngine } from "../lib/kp/kpEngine";
import type { VedicChartData } from "../lib/astronomy/vedic";
import type { KPCusps, KPPlanet, KPPlanetSignification } from "../lib/kp/kpTypes";


const kp249 = SubLordCalculator.generate249Table();
const kp2193 = SubLordCalculator.generate2193Table();

assert.equal(kp249.length, 249, "KP 1-249 table must retain 249 sign-local divisions");
assert.equal(kp2193.length, 2193, "KP 1-2193 table must contain 2,187 base intervals plus six sign-boundary splits");
assert.deepEqual(
  kp2193.map((entry) => entry.seed),
  Array.from({ length: 2193 }, (_, index) => index + 1),
  "KP 1-2193 seeds must be contiguous and one-based"
);

// Published KP 1-2193 reference (AstroNeemo, updated 2016-08-01):
// the first Ketu/Ketu/Ketu interval runs from 0° to 0°02'43⅓",
// followed by Ketu/Ketu/Venus ending at 0°10'30".
const arcSeconds = (degrees: number) => degrees * 3600;
assert.equal(kp2193[0].starLord, "Ketu");
assert.equal(kp2193[0].subLord, "Ketu");
assert.equal(kp2193[0].subSubLord, "Ketu");
assert.ok(
  Math.abs(arcSeconds(kp2193[0].endLongitude) - (7 / 120) * (7 / 120) * (360 / 27) * 3600) < 1e-7,
  "First KP micro-division must be 7/120 of the Ketu sub, itself 7/120 of a nakshatra"
);
assert.ok(
  Math.abs(arcSeconds(kp2193[1].endLongitude) - 10.5 * 60) < 1e-7,
  "Second published KP 1-2193 interval must end at 0°10'30"
);
assert.equal(kp2193[1].subSubLord, "Venus");

// The published reference groups the same longitude subdivisions in Aries,
// Leo and Sagittarius: rows 1, 732 and 1463 are equivalent local positions.
for (const equivalentSeed of [732, 1463]) {
  const equivalent = SubLordCalculator.getHorary2193Entry(equivalentSeed);
  assert.equal(equivalent.starLord, kp2193[0].starLord);
  assert.equal(equivalent.subLord, kp2193[0].subLord);
  assert.equal(equivalent.subSubLord, kp2193[0].subSubLord);
  assert.ok(
    Math.abs((equivalent.startLongitude % 30) - (kp2193[0].startLongitude % 30)) < 1e-10,
    `KP seed ${equivalentSeed} must represent the same sign-local subdivision`
  );
}

// One sub-sub interval straddles the Aries/Taurus boundary. It must be split
// at 30° without restarting its proportion or changing its three lords.
const beforeSignBoundary = kp2193[191];
const afterSignBoundary = kp2193[192];
assert.equal(beforeSignBoundary.seed, 192);
assert.equal(afterSignBoundary.seed, 193);
assert.equal(beforeSignBoundary.subLord, "Rahu");
assert.equal(beforeSignBoundary.subSubLord, "Saturn");
assert.equal(afterSignBoundary.subLord, "Rahu");
assert.equal(afterSignBoundary.subSubLord, "Saturn");
assert.ok(Math.abs(beforeSignBoundary.endLongitude - 30) < 1e-10);
assert.ok(Math.abs(afterSignBoundary.startLongitude - 30) < 1e-10);
assert.equal(beforeSignBoundary.signName, "Aries");
assert.equal(afterSignBoundary.signName, "Taurus");
assert.ok(Math.abs(afterSignBoundary.endLongitude - (30 + 6.333333333333 / 60)) < 1e-8);

// Every table midpoint must resolve to the same hierarchical lords through
// the point-calculation path, so seed lookup and chart cusp assignment agree.
const subLordCalculator = new SubLordCalculator();
for (const entry of kp2193) {
  const resolved = subLordCalculator.calculateSubLord(entry.centerLongitude);
  assert.equal(resolved.starLord, entry.starLord, `KP 2193 row ${entry.seed} star lord`);
  assert.equal(resolved.subLord, entry.subLord, `KP 2193 row ${entry.seed} sub lord`);
  assert.equal(resolved.subSubLord, entry.subSubLord, `KP 2193 row ${entry.seed} sub-sub lord`);
}

// The six additional rows must correspond exactly to the six child intervals
// split by a zodiac-sign boundary, not to restarted parent subdivisions.
const signSplitPairCount = kp2193.filter((entry, index) => {
  if (index === 0) return false;
  const previous = kp2193[index - 1];
  return (
    Math.abs(previous.endLongitude - entry.startLongitude) < 1e-10 &&
    previous.signIndex + 1 === entry.signIndex &&
    previous.starLord === entry.starLord &&
    previous.subLord === entry.subLord &&
    previous.subSubLord === entry.subSubLord
  );
}).length;
assert.equal(signSplitPairCount, 6, "Exactly six micro-intervals should be split at sign boundaries");

// Every interval is ordered, contiguous, positive-width, and contained in one sign.
assert.ok(Math.abs(kp2193[0].startLongitude) < 1e-12);
assert.ok(Math.abs(kp2193[kp2193.length - 1].endLongitude - 360) < 1e-10);
for (let index = 0; index < kp2193.length; index += 1) {
  const entry = kp2193[index];
  assert.ok(entry.endLongitude > entry.startLongitude, `KP 2193 row ${index + 1} must have positive width`);
  assert.equal(entry.signIndex, Math.floor(entry.startLongitude / 30));
  assert.ok(
    entry.endLongitude <= (entry.signIndex + 1) * 30 + 1e-10,
    `KP 2193 row ${index + 1} must not cross a sign boundary`
  );
  if (index > 0) {
    assert.ok(
      Math.abs(entry.startLongitude - kp2193[index - 1].endLongitude) < 1e-10,
      `KP 2193 rows ${index} and ${index + 1} must be contiguous`
    );
  }
}

assert.equal(SubLordCalculator.getHorary2193Entry(2193).seed, 2193);
assert.equal(SubLordCalculator.getHorary2193Entry(2194).seed, 2193);
assert.equal(SubLordCalculator.getHorary2193Entry(0).seed, 1);

// KP linear profile date interpolation: Jan 1, 1900 is exactly the
// declared epoch; each calendar year advances by the stated annual rate.
const kp1900Anchor = 22 + 22 / 60 + 14 / 3600;
const kpAnnualRate = 50.2388475;
const kpDaily1900 = kpAnnualRate / (365 * 3600);
assert.ok(
  Math.abs(KPCuspsCalculator.calculateKPAyanamsa(1900, 1, 1) - kp1900Anchor) < 1e-12,
  "KP linear profile must equal its exact 1900.0 anchor at the start of 1 January"
);
assert.ok(
  Math.abs(
    KPCuspsCalculator.calculateKPAyanamsa(1900, 1, 2) -
      (kp1900Anchor + kpDaily1900)
  ) < 1e-12,
  "KP linear profile must interpolate using actual day-of-year, not equal month lengths"
);
assert.ok(
  Math.abs(
    KPCuspsCalculator.calculateKPAyanamsa(1901, 1, 1) -
      (kp1900Anchor + kpAnnualRate / 3600)
  ) < 1e-12,
  "KP linear profile must advance exactly one annual rate between New Year anchors"
);
const kpLeapDay = KPCuspsCalculator.calculateKPAyanamsa(2000, 2, 29);
const kpMarchFirst = KPCuspsCalculator.calculateKPAyanamsa(2000, 3, 1);
assert.ok(
  Math.abs(kpMarchFirst - kpLeapDay - kpAnnualRate / (366 * 3600)) < 1e-12,
  "KP linear profile must interpolate leap-year dates over 366 days"
);
assert.throws(() => KPCuspsCalculator.calculateKPAyanamsa(2023, 2, 29), /outside the selected Gregorian month/);
assert.throws(() => KPCuspsCalculator.calculateKPAyanamsa(2024, 13, 1), /month must be between 1 and 12/);
assert.throws(() => KPCuspsCalculator.calculateKPAyanamsa(2024, 2, 1.5), /integer Gregorian year, month, and day/);

const calculator = new KPCuspsCalculator();
const chartInputs = [2000, 1, 1, 12, 0, 40.7128, -74.006, 0] as const;
const westernPlacidus = calculateWesternChart(...chartInputs, "Placidus");
const westernWholeSign = calculateWesternChart(...chartInputs, "WholeSign");

const kpFromPlacidus = calculator.calculateKPCuspsFromWestern(
  westernPlacidus,
  2000,
  1,
  1
);
const kpFromWholeSign = calculator.calculateKPCuspsFromWestern(
  westernWholeSign,
  2000,
  1,
  1
);

assert.equal(kpFromPlacidus.cusps.length, 12);
assert.equal(kpFromWholeSign.cusps.length, 12);

const kpIntegratedChart = new KPEngine().generateKPChart(
  westernPlacidus,
  {
    currentMahadasha: "Jupiter",
    currentAntardasha: "Venus",
  } as VedicChartData,
  new Date(Date.UTC(2000, 0, 1, 12))
);
assert.equal(kpIntegratedChart.bodySet, "classical-nine", "KP must default to the traditional seven planets plus Rahu and Ketu");
assert.ok(!kpIntegratedChart.planets.some((planet) => ["Uranus", "Neptune", "Pluto"].includes(planet.name)), "Classical-nine KP profile must exclude the optional outer planets");
const kpExtendedChart = new KPEngine().generateKPChart(
  westernPlacidus,
  {
    currentMahadasha: "Jupiter",
    currentAntardasha: "Venus",
  } as VedicChartData,
  new Date(Date.UTC(2000, 0, 1, 12)),
  "extended-twelve"
);
assert.equal(kpExtendedChart.bodySet, "extended-twelve");
assert.ok(kpExtendedChart.planets.some((planet) => planet.name === "Uranus"));
assert.ok(kpExtendedChart.planets.some((planet) => planet.name === "Neptune"));
assert.ok(kpExtendedChart.planets.some((planet) => planet.name === "Pluto"));
assert.ok(!kpExtendedChart.planets.some((planet) => planet.name === "Chiron"), "Unvalidated placeholder bodies remain excluded from both KP profiles");
assert.equal(kpIntegratedChart.nodeConvention, "mean", "KP chart must disclose the inherited mean-node convention");
assert.equal(kpIntegratedChart.nodeAgentRule, "reader-vi", "KP chart must disclose its selected Reader VI node-agent ordering");
assert.equal(kpIntegratedChart.nodeConjunctionPolicy, "same-sidereal-sign-provisional");
assert.equal(kpIntegratedChart.nodeAspectPolicy, "parashari-full-sign-drishti-classical-seven");
assert.ok(kpIntegratedChart.nodeRepresentations?.Rahu, "KP chart must expose the Rahu representative cascade");
assert.ok(kpIntegratedChart.nodeRepresentations?.Ketu, "KP chart must expose the Ketu representative cascade");
assert.equal(kpIntegratedChart.nodeRepresentations?.Rahu?.rule, "reader-vi");
assert.ok(kpIntegratedChart.planetSignifications.Rahu.nodeAgentHouses, "Integrated KP A-D significations must include Rahu's preferred representative houses");
assert.ok(kpIntegratedChart.planetSignifications.Ketu.nodeAgentHouses, "Integrated KP A-D significations must include Ketu's preferred representative houses");
assert.ok(kpIntegratedChart.planets.some((planet) => planet.name === "Rahu"), "Western NorthNode must map to KP Rahu");
assert.ok(kpIntegratedChart.planets.some((planet) => planet.name === "Ketu"), "Western SouthNode must map to KP Ketu");
assert.ok(!kpIntegratedChart.planets.some((planet) => planet.name === "NorthNode" || planet.name === "SouthNode"), "KP must not expose Western point names in its planetary system");
assert.ok(!kpIntegratedChart.planets.some((planet) => planet.name === "Chiron"), "KP must exclude the unvalidated illustrative Chiron point from calculation");

const integratedKPFourStep = new KPFourStepEngine();
const integratedNodePS = integratedKPFourStep.calculatePositionalStatus(
  kpIntegratedChart.cusps,
  kpIntegratedChart.planets
);
assert.ok(integratedNodePS.Rahu && integratedNodePS.Ketu, "KP Positional Status must include the correctly named lunar nodes");
assert.equal(integratedNodePS.NorthNode, undefined);
const rahuPlanet = kpIntegratedChart.planets.find((planet) => planet.name === "Rahu")!;
const rahuStep = integratedKPFourStep.evaluatePlanetFourStep(
  "Rahu",
  kpIntegratedChart.cusps,
  kpIntegratedChart.planets,
  integratedNodePS
);
const rahuSignLordHouses = kpIntegratedChart.cusps.houseLords
  .map((lord, index) => lord === rahuPlanet.signLord ? index + 1 : 0)
  .filter((house) => house > 0);
assert.deepEqual(
  rahuStep.step1.ownsHouses,
  rahuSignLordHouses,
  "Modern KP 4-Step node representation must include the houses owned by the node's sign lord"
);

assert.equal(kpIntegratedChart.currentDashaLord, "Jupiter");
assert.equal(kpIntegratedChart.currentAntardashaLord, "Venus");

assert.ok(kpFromPlacidus.cusps.every(Number.isFinite));
assert.ok(kpFromWholeSign.cusps.every(Number.isFinite));

// KP cusps must be independent of the separately selected Western natal
// house system because KP recomputes its own tropical Placidus framework.
for (let index = 0; index < 12; index += 1) {
  assert.ok(
    Math.abs(kpFromPlacidus.cusps[index] - kpFromWholeSign.cusps[index]) < 1e-10,
    `KP cusp ${index + 1} must be identical for Placidus and Whole Sign Western inputs`
  );
}

// The KP engine must fail closed when Placidus is unavailable rather than
// silently reporting a Porphyry or Whole Sign fallback as a KP chart.
const polarWesternChart = calculateWesternChart(
  2000,
  1,
  1,
  12,
  0,
  70,
  0,
  0,
  "WholeSign"
);
assert.throws(
  () => calculator.calculateKPCuspsFromWestern(polarWesternChart, 2000, 1, 1),
  /KP requires Placidus house cusps/
);

// KP must retain the exact cusp longitude even near the end of a sign.
// Snapping 29°30' to the next sign would alter its sign lord and star/sub.
const lateSignCuspChart = {
  ...westernPlacidus,
  birthLatitude: undefined,
  birthLongitude: undefined,
  houses: westernPlacidus.houses.map((house, index) =>
    index === 0 ? { ...house, longitude: 29.5 } : house
  ),
};
const lateSignKp = calculator.calculateKPCuspsFromWestern(
  lateSignCuspChart,
  2000,
  1,
  1
);
const expectedExactCusp = ((29.5 - lateSignKp.ayanamsa) % 360 + 360) % 360;
assert.ok(
  Math.abs(lateSignKp.cusps[0] - expectedExactCusp) < 1e-10,
  "KP preserves the exact late-sign cusp instead of snapping it to the next sign"
);

// Without original coordinates, a non-Placidus chart cannot be repurposed.
const chartWithoutBirthGeometry = {
  ...westernWholeSign,
  birthLatitude: undefined,
  birthLongitude: undefined,
};
assert.throws(
  () => calculator.calculateKPCuspsFromWestern(chartWithoutBirthGeometry, 2000, 1, 1),
  /cannot be reused as KP house geometry/
);


// Modern KP 4-Step/CIL must fail closed when source-chain data are absent.
// It must never invent house 1 or substitute Sun/Moon/Mars for missing links.
const fourStep = new KPFourStepEngine();
const emptyCusps = { houseLords: Array.from({ length: 12 }, () => "Sun") } as unknown as KPCusps;
assert.throws(
  () => fourStep.evaluatePlanetFourStep("Pluto", emptyCusps, [], {}),
  /cannot evaluate missing planet Pluto/
);
const partialPlanet = {
  name: "Venus",
  starLord: "Sun",
  subLord: "Moon",
  house: 1,
} as unknown as KPPlanet;
assert.throws(
  () => fourStep.evaluatePlanetFourStep("Venus", emptyCusps, [partialPlanet], {}),
  /cannot resolve the star lord of Moon/
);
const missingStatusPlanet = {
  name: "Venus",
  starLord: "Sun",
  subLord: "Moon",
  house: 1,
} as unknown as KPPlanet;
const moonWithStar = {
  name: "Moon",
  starLord: "Mars",
  subLord: "Jupiter",
  house: 2,
} as unknown as KPPlanet;
assert.throws(
  () => fourStep.evaluatePlanetFourStep("Venus", emptyCusps, [missingStatusPlanet, moonWithStar], {}),
  /requires positional-status data for Venus/
);
assert.throws(
  () => fourStep.evaluatePlanetFourStep("Venus", emptyCusps, [partialPlanet, moonWithStar], {}, 13),
  /target house must be between 1 and 12/
);
assert.throws(
  () => KPSignificators.getPlanetHouse(42, { cusps: [] } as unknown as KPCusps),
  /requires twelve finite cusp longitudes/
);
assert.throws(
  () => KPSignificators.getPlanetHouse(42, {
    cusps: Array.from({ length: 12 }, () => 0),
  } as unknown as KPCusps),
  /twelve distinct, cyclically ordered cusps/
);
assert.throws(
  () => KPSignificators.isPlanetInHouse(42, 13, {
    cusps: Array.from({ length: 12 }, (_, index) => index * 30),
  } as unknown as KPCusps),
  /house number must be between 1 and 12/
);
assert.throws(
  () => fourStep.calculateCuspalInterlinks(
    { houseDetails: [{}] } as unknown as KPCusps,
    [],
    {}
  ),
  /requires complete sign, star, sub, and sub-sub lord data for cusp 1/
);

const strengthCusps = {
  cusps: Array.from({ length: 12 }, (_, index) => index * 30),
  houseLords: [
    "Mercury", "Sun", "Jupiter", "Saturn", "Mercury", "Mercury",
    "Sun", "Sun", "Mars", "Venus", "Venus", "Jupiter",
  ],
} as unknown as KPCusps;
const strengthPlanet = (name: string, house: number, starLord: string, subLord = "Moon", signLord = "Mars") =>
  ({
    name, house, starLord, subLord, signLord, isRetrograde: false,
    siderealLon: (house - 1) * 30 + 10,
  }) as unknown as KPPlanet;
const strengthPlanets = [
  strengthPlanet("Mercury", 1, "Mercury"),
  strengthPlanet("Sun", 2, "Venus"),
  strengthPlanet("Moon", 3, "Mars"),
  strengthPlanet("Mars", 4, "Saturn"),
  strengthPlanet("Venus", 9, "Sun"),
  strengthPlanet("Saturn", 6, "Jupiter"),
  strengthPlanet("Jupiter", 8, "Saturn"),
  strengthPlanet("Rahu", 11, "Mercury"),
  strengthPlanet("Ketu", 12, "Jupiter"),
];
const strengthPS = fourStep.calculatePositionalStatus(strengthCusps, strengthPlanets);
assert.equal(strengthPS.Mercury.hasPositionalStatus, true, "A planet in its own star retains PS even when a planet tenants its star");
assert.equal(strengthPS.Venus.hasPositionalStatus, false, "A non-own-star planet with a tenant in its star has no PS");
assert.equal(strengthPS.Sun.hasPositionalStatus, false, "Sun has a tenant in its star because Venus is in Sun's star");
assert.equal(strengthPS.Ketu.hasPositionalStatus, true, "A planet with no tenants in its stars has Positional Status");
const mercuryFourStep = fourStep.evaluatePlanetFourStep("Mercury", strengthCusps, strengthPlanets, strengthPS);
assert.ok(mercuryFourStep.step1.primaryHouses.includes(1), "Own-star planet must be primary for its occupied house, even when it also owns that same occupied house");
assert.ok(mercuryFourStep.step2.primaryHouses.includes(1), "Star lord's occupied and owned house must remain primary");
assert.ok(mercuryFourStep.step1.primaryHouses.includes(5), "PS planet must be primary for its empty owned house");
assert.ok(mercuryFourStep.step1.secondaryHouses.includes(6), "PS planet's occupied owned house must be secondary");
assert.deepEqual(
  mercuryFourStep.step1.allHouses,
  [...mercuryFourStep.step1.primaryHouses, ...mercuryFourStep.step1.secondaryHouses].sort((a, b) => a - b),
  "The compatibility house union must equal primary plus secondary house sets"
);
const venusFourStep = fourStep.evaluatePlanetFourStep("Venus", strengthCusps, strengthPlanets, strengthPS);
assert.ok(venusFourStep.step1.secondaryHouses.includes(9), "Planet without PS must be secondary for its occupied house");
assert.ok(venusFourStep.step1.secondaryHouses.includes(10), "Planet without PS remains secondary for an empty owned house");
assert.ok(venusFourStep.step2.primaryHouses.includes(2), "Step 2 star lord is primary for its occupied house");
assert.ok(venusFourStep.step2.primaryHouses.includes(7), "Step 2 star lord is primary for an empty owned house");
assert.ok(venusFourStep.step2.secondaryHouses.includes(8), "Step 2 star lord is secondary for its occupied owned house");
assert.equal(venusFourStep.step2.strengthRule, "star-lord-principal");


const nodePlanet = (name: string, signIndex: number, house: number, starLord: string, signLord: string) =>
  ({
    id: name, name, symbol: name, tropicalLon: signIndex * 30 + 10,
    siderealLon: signIndex * 30 + 10, signIndex, sign: String(signIndex),
    degreeInSign: 10, degreeFormatted: "10°00′", house,
    nakshatraIndex: 0, nakshatraName: "Test", pada: 1,
    signLord, starLord, subLord: "Moon", subSubLord: "Mars",
    isRetrograde: false, speed: 0,
  }) as KPPlanet;
const nodeTestPlanets = [
  nodePlanet("Sun", 9, 10, "Mercury", "Venus"),
  nodePlanet("Moon", 6, 7, "Venus", "Mercury"),
  nodePlanet("Mercury", 7, 8, "Saturn", "Jupiter"),
  nodePlanet("Venus", 1, 2, "Sun", "Mars"),
  nodePlanet("Mars", 0, 1, "Saturn", "Jupiter"),
  nodePlanet("Jupiter", 8, 9, "Saturn", "Saturn"),
  nodePlanet("Saturn", 5, 6, "Jupiter", "Mercury"),
  nodePlanet("Rahu", 3, 4, "Jupiter", "Venus"),
  nodePlanet("Ketu", 9, 10, "Saturn", "Mercury"),
  nodePlanet("Pluto", 4, 5, "Rahu", "Mars"),
  nodePlanet("Uranus", 3, 4, "Sun", "Mercury"),
];
const nodeTestSignifications = Object.fromEntries(
  nodeTestPlanets.map((planet) => [
    planet.name,
    {
      planet: planet.name,
      occupiesHouse: planet.house,
      ownsHouses: [],
      starLord: planet.starLord,
      starLordOccupiesHouse: planet.house,
      starLordOwnsHouses: [],
      subLord: planet.subLord,
      subLordOccupiesHouse: planet.house,
      subLordOwnsHouses: [],
      levels: {
        levelA: [],
        levelB: [planet.house],
        levelC: [],
        levelD: [],
      },
      strengthOrder: ["A", "B", "C", "D"],
      starTenants: [],
      hasSelfStrength: false,
      signifiedHouses: [planet.house],
    } as KPPlanetSignification,
  ])
) as Record<string, KPPlanetSignification>;
const nodeCalculator = new KPSignificators();
const readerVINodes = nodeCalculator.calculateNodeRepresentations(
  nodeTestPlanets,
  nodeTestSignifications,
  "reader-vi"
);
assert.deepEqual(readerVINodes.Rahu?.priorityOrder, ["conjunction", "star-lord", "aspect", "sign-lord"]);
assert.deepEqual(readerVINodes.Rahu?.agentTiers.map((tier) => tier.planets), [[], ["Jupiter"], ["Sun", "Mars"], ["Venus"]]);
assert.equal(readerVINodes.Rahu?.agentTiers[0].planets.length, 0, "The classical KP node conjunction tier excludes modern outer planets such as Uranus");
assert.equal(readerVINodes.Rahu?.preferredAgentSource, "star-lord", "Reader VI prefers star lord before aspecting planets");
assert.deepEqual(readerVINodes.Rahu?.preferredAgentHouses, [9], "Rahu inherits the preferred agent's chart signification");
assert.ok(readerVINodes.Rahu?.representedHouses.includes(4), "Rahu always signifies its own occupied house");
assert.ok(!readerVINodes.Rahu?.agentTiers.some((tier) => tier.planets.includes("Ketu")), "A node must never treat the opposite node as an agent");
const readerIIINodes = nodeCalculator.calculateNodeRepresentations(
  nodeTestPlanets,
  nodeTestSignifications,
  "reader-iii-v"
);
assert.deepEqual(readerIIINodes.Rahu?.priorityOrder, ["conjunction", "aspect", "star-lord", "sign-lord"]);
assert.equal(readerIIINodes.Rahu?.preferredAgentSource, "aspect", "Reader III/V puts aspecting planets before the star lord");
assert.deepEqual(readerIIINodes.Rahu?.preferredAgentPlanets, ["Sun", "Mars"]);
assert.equal(readerVINodes.Ketu?.preferredAgentSource, "conjunction", "Conjunction remains first in both reader variants");
assert.deepEqual(readerVINodes.Ketu?.preferredAgentPlanets, ["Sun"]);

const expandedNodeSignifications = nodeCalculator.applyNodeAgentSignifications(
  nodeTestPlanets,
  nodeTestSignifications,
  readerVINodes
);
assert.deepEqual(expandedNodeSignifications.Rahu.nodeAgentHouses, [4, 9], "Rahu's own signification must include its house and preferred agent's KP houses");
assert.ok(expandedNodeSignifications.Rahu.signifiedHouses.includes(9));
assert.deepEqual(expandedNodeSignifications.Pluto.starLordNodeAgentHouses, [4, 9], "A planet in Rahu's star must inherit Rahu's preferred agent cascade");
assert.deepEqual(expandedNodeSignifications.Pluto.levels.levelA, [4, 9], "Node agent houses must be represented in the star-lord A grade");

const baseNodeHouseSignifications = nodeCalculator.calculateAllHouseSignificators(
  strengthCusps,
  nodeTestPlanets
);
const expandedNodeHouseSignifications = nodeCalculator.applyNodeAgentsToHouseSignificators(
  baseNodeHouseSignifications,
  readerVINodes
);
assert.ok(baseNodeHouseSignifications[9].levels.levelB.includes("Jupiter"));
assert.ok(!baseNodeHouseSignifications[9].levels.levelB.includes("Rahu"));

assert.ok(baseNodeHouseSignifications[6].levels.levelA.includes("Jupiter"), "Jupiter is Grade I in House 6 because it occupies Saturn's star");
assert.ok(expandedNodeHouseSignifications[6].levels.levelA.includes("Rahu"), "Rahu inherits Jupiter's Grade I role in House 6");
assert.ok(!expandedNodeHouseSignifications[9].levels.levelA.includes("Rahu"), "Rahu must not be promoted to Grade I merely because Jupiter's separate planet-to-house A grade contains House 9");
assert.ok(expandedNodeHouseSignifications[9].levels.levelB.includes("Rahu"), "Rahu inherits Jupiter's actual Grade II occupant role in House 9");
assert.ok(expandedNodeHouseSignifications[9].allSignificators.includes("Rahu"));
assert.ok(expandedNodeHouseSignifications[10].levels.levelB.includes("Ketu"), "Ketu must inherit its preferred conjoined Sun's Level B house signification");

assert.equal(
  nodeCalculator.getStrongestHouseSignificatorGrade("Rahu", [6, 9], expandedNodeHouseSignifications),
  "I",
  "Grade I must outrank Grade II when a period lord matches multiple favorable houses"
);
assert.equal(
  nodeCalculator.getStrongestHouseSignificatorGrade("Rahu", [9], expandedNodeHouseSignifications),
  "II",
  "Rahu's House 9 occupancy inherits the agent's actual Grade II"
);
assert.equal(
  nodeCalculator.getStrongestHouseSignificatorGrade("Pluto", [6, 9], expandedNodeHouseSignifications),
  undefined,
  "A planet absent from favorable house grades must not be treated as a direct period significator"
);
assert.ok(baseNodeHouseSignifications[9].levels.levelB.includes("Jupiter"), "Raw source house significations remain unchanged");

assert.throws(
  () => nodeCalculator.applyNodeAgentSignifications(
    nodeTestPlanets,
    nodeTestSignifications,
    { Rahu: readerVINodes.Rahu }
  ),
  /cannot resolve the representative cascade for Ketu/
);


const classicalPlanetSignifications = new KPSignificators().calculateAllPlanetSignifications(
  strengthCusps,
  strengthPlanets
);
const venusClassicalStrength = classicalPlanetSignifications.Venus;
assert.deepEqual(venusClassicalStrength.levels.levelA, [2], "Level A is the house occupied by Venus's star lord Sun");
assert.deepEqual(venusClassicalStrength.levels.levelB, [9], "Level B is the house occupied by Venus itself");
assert.deepEqual(venusClassicalStrength.levels.levelC, [2, 7, 8], "Level C is the set of houses owned by Venus's star lord Sun");
assert.deepEqual(venusClassicalStrength.levels.levelD, [10, 11], "Level D is the set of houses owned by Venus itself");
assert.equal(venusClassicalStrength.hasSelfStrength, false, "A planet with a tenant in its stars uses standard A-B-C-D order");
assert.deepEqual(venusClassicalStrength.strengthOrder, ["A", "B", "C", "D"]);
assert.deepEqual(venusClassicalStrength.starTenants, ["Sun"]);
const mercuryClassicalStrength = classicalPlanetSignifications.Mercury;
assert.equal(mercuryClassicalStrength.hasSelfStrength, false, "A planet with another tenant in its stars remains standard-grade even when the modern own-star PS rule applies");
assert.deepEqual(mercuryClassicalStrength.strengthOrder, ["A", "B", "C", "D"]);
const sunClassicalStrength = classicalPlanetSignifications.Sun;
assert.equal(sunClassicalStrength.hasSelfStrength, true, "A planet with no other planets in its stars receives self-strength");
assert.deepEqual(sunClassicalStrength.starTenants, []);
assert.deepEqual(sunClassicalStrength.strengthOrder, ["B", "A", "D", "C"], "Tenantless planet must prefer own occupation, then stellar occupation, then own ownership, then stellar ownership");



const predictionEngine = new KPPredictionEngine();
assert.throws(
  () => predictionEngine.predictEvent(13, emptyCusps, [], "Jupiter", "Venus"),
  /house must be between 1 and 12/
);
const missingCslCusps = {
  ...kpFromPlacidus,
  houseDetails: kpFromPlacidus.houseDetails.map((cusp, index) =>
    index === 9 ? { ...cusp, subLord: "Pluto" } : cusp
  ),
};
assert.throws(
  () => predictionEngine.predictEvent(10, missingCslCusps, [], "Jupiter", "Venus"),
  /cannot resolve CSL planet Pluto/
);

const rulingPlanetCusps = {
  ...kpFromPlacidus,
  houseDetails: kpFromPlacidus.houseDetails.map((cusp, index) =>
    index === 0
      ? { ...cusp, signLord: "Mercury", starLord: "Saturn", subLord: "Venus" }
      : cusp
  ),
};
const moonForRulingPlanets = {
  name: "Moon",
  signLord: "Venus",
  starLord: "Mars",
  subLord: "Jupiter",
} as KPPlanet;
const rulingPlanets = predictionEngine.calculateRulingPlanets(
  rulingPlanetCusps,
  [moonForRulingPlanets],
  new Date(Date.UTC(2000, 0, 2))
);
assert.deepEqual(
  rulingPlanets.rulingPlanetsOrdered,
  ["Saturn", "Mercury", "Mars", "Venus", "Sun"],
  "KP ruling planets must follow Lagna star, Lagna sign, Moon star, Moon sign, Day Lord preference"
);
assert.throws(
  () => predictionEngine.calculateRulingPlanets(rulingPlanetCusps, [], new Date(Date.UTC(2000, 0, 2))),
  /require Moon position data/
);
assert.throws(
  () => predictionEngine.calculateRulingPlanets(rulingPlanetCusps, [moonForRulingPlanets], new Date(Number.NaN)),
  /valid birth\/judgment Date/
);


console.log(
  "KP house-system isolation suite passed: KP always uses its own Placidus cusps and rejects unsupported polar fallbacks."
);
