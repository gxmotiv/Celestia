import assert from "node:assert/strict";
import {
  calculateWesternChart,
  normalizeDegrees,
  type PlanetPosition,
  type WesternChartData,
} from "../lib/astronomy/ephemeris";
import { SwissEphemerisEngine } from "../lib/astronomy/swissEphemeris";
import {
  calculateSolarAltitudeDegrees,
  isSunAboveHorizonInChart,
} from "../lib/astronomy/horizon";
import { calculateHellenisticAnalysis } from "../lib/astronomy/hellenistic";
import { ArabianPartsCalculator } from "../lib/astronomy/arabianPartsCalculator";
import {
  FirdariaEngine,
  ZodiacalReleasingEngine,
} from "../lib/astronomy/predictiveHellenisticEngine";
import { EclipseAnalyzer, FixedStarsEngine, MedicalAstrologyEngine } from "../lib/astronomy/specializedWesternEngines";
import { WesternBenchmarkRunner } from "../lib/astronomy/westernBenchmarkTests";
import {
  MultiSystemTransitEngine,
  TRANSIT_SYSTEM_PRESETS,
} from "../lib/astronomy/MultiSystemTransitEngine";
import { calculateVedicChart } from "../lib/astronomy/vedic";

let assertions = 0;
function check(condition: unknown, message: string): void {
  assert.ok(condition, message);
  assertions += 1;
}
function close(actual: number, expected: number, tolerance: number, message: string): void {
  assert.ok(Math.abs(actual - expected) <= tolerance,
    message + "; expected " + expected + ", received " + actual);
  assertions += 1;
}

function syntheticSun(longitude: number): PlanetPosition {
  return {
    id: "Sun",
    name: "Sun",
    symbol: "☉",
    longitude,
    latitude: 0,
    speed: 0.9856,
    isRetrograde: false,
    sign: "Aries",
    signIndex: 0,
    signDegree: longitude % 30,
    signDegreeFormatted: "0°00' Aries",
    house: 1, // Deliberately wrong for a day chart: sect must ignore this.
    element: "Fire",
    modality: "Cardinal",
  };
}

function syntheticSectChart(localSiderealTime: number): WesternChartData {
  const sun = syntheticSun(0);
  const point = { ...sun, id: "Ascendant", name: "Ascendant" };
  return {
    planets: [sun],
    houses: [],
    aspects: [],
    ascendant: point,
    midheaven: { ...point, id: "Midheaven", name: "Midheaven" },
    descendant: 180,
    imumCoeli: 180,
    julianDay: 2451545,
    siderealTime: localSiderealTime,
    obliquity: 0,
    birthLatitude: 0,
    birthLongitude: 0,
    houseSystem: "Placidus",
  };
}

console.log("Western calculation integrity regression suite");

// 1. Solar altitude and sect are based on real horizon geometry, not house numbers.
close(
  calculateSolarAltitudeDegrees({
    eclipticLongitude: 0,
    obliquity: 0,
    localSiderealTime: 0,
    geographicLatitude: 0,
  }),
  90,
  1e-9,
  "Point on local meridian at equator is at zenith"
);
close(
  calculateSolarAltitudeDegrees({
    eclipticLongitude: 0,
    obliquity: 0,
    localSiderealTime: 180,
    geographicLatitude: 0,
  }),
  -90,
  1e-9,
  "Point on opposite meridian at equator is at nadir"
);
close(
  calculateSolarAltitudeDegrees({
    eclipticLongitude: 0,
    obliquity: 0,
    localSiderealTime: 90,
    geographicLatitude: 0,
  }),
  0,
  1e-9,
  "Point on geometric horizon has zero altitude"
);
check(isSunAboveHorizonInChart(syntheticSectChart(0)) === true,
  "Sun above horizon is a day chart even when supplied house number is 1");
check(isSunAboveHorizonInChart(syntheticSectChart(180)) === false,
  "Sun below horizon is a night chart even when supplied house number is 1");

// 2. Western house systems resolve consistently and polar fallbacks are explicit.
const swiss = new SwissEphemerisEngine();
const args = [2000, 1, 1, 12, 0, 40.7128, -74.006, -5] as const;
const autoChart = calculateWesternChart(...args, "Auto");
check(autoChart.requestedHouseSystem === "Auto", "Auto selection is preserved as the requested mode");
check(autoChart.houseSystem === "Placidus", "Auto selects Placidus for the modern Western profile at ordinary latitude");
check(autoChart.houses.length === 12, "Auto Western chart returns twelve house cusps");
check(autoChart.houses.every((house) => Number.isFinite(house.longitude)), "Auto Western chart has twelve finite cusp longitudes");
const wholeSignChart = calculateWesternChart(...args, "WholeSign");
const equalChart = calculateWesternChart(...args, "Equal");
const porphyryChart = calculateWesternChart(...args, "Porphyry");
check(wholeSignChart.houseSystem === "WholeSign", "Whole Sign request reports the actual system used");
check(equalChart.houseSystem === "Equal", "Equal request reports the actual system used");
check(porphyryChart.houseSystem === "Porphyry", "Porphyry request reports the actual system used");
for (const entry of [
  ["Whole Sign", wholeSignChart],
  ["Equal", equalChart],
  ["Porphyry", porphyryChart],
] as const) {
  check(entry[1].houses.length === 12, entry[0] + " returns twelve cusps");
  check(entry[1].houses.every((house) => Number.isFinite(house.longitude)), entry[0] + " returns twelve finite cusp longitudes");
  close(
    normalizeDegrees(entry[1].houses[6].longitude - entry[1].houses[0].longitude),
    180,
    0.001,
    entry[0] + " keeps the 1st/7th axis antipodal"
  );
}
const polarAuto = calculateWesternChart(2000, 1, 1, 12, 0, 70, 0, 0, "Auto");
check(polarAuto.houseSystem === "Porphyry", "Auto switches to Porphyry at polar latitude where Placidus is undefined");
check(Boolean(polarAuto.houseSystemNote && polarAuto.houseSystemNote.includes("polar")),
  "Polar fallback is disclosed to the user");
check(polarAuto.houses.length === 12, "Polar fallback returns twelve cusps");
check(polarAuto.houses.every((house) => Number.isFinite(house.longitude)), "Polar fallback returns twelve finite cusp longitudes");
const polarExplicitPlacidus = calculateWesternChart(2000, 1, 1, 12, 0, 70, 0, 0, "Placidus");
check(polarExplicitPlacidus.houseSystem === "Porphyry",
  "Explicit Placidus request reports Porphyry when polar fallback is used");
check(swiss.calculateHouses(2451545, 70, 0, "O").houseSystemUsed === "O",
  "Porphyry system code is recorded in house-calculation metadata");
let invalidCoordinatesRejected = false;
try {
  calculateWesternChart(2000, 1, 1, 12, 0, 91, 0, 0, "Auto");
} catch {
  invalidCoordinatesRejected = true;
}
check(invalidCoordinatesRejected, "Invalid latitude is rejected instead of generating a plausible-looking chart");

// 3. Hellenistic sect and planetary joys do not inherit Western quadrant house numbers.
const hellenisticPlacidus = calculateHellenisticAnalysis(autoChart);
const hellenisticWholeSign = calculateHellenisticAnalysis(wholeSignChart);
check(
  hellenisticPlacidus.isDiurnal === hellenisticWholeSign.isDiurnal,
  "Hellenistic sect is invariant when Western house system changes"
);
assert.deepEqual(
  hellenisticPlacidus.joys.map((item) => [item.planet, item.actualHouse, item.hasJoy]),
  hellenisticWholeSign.joys.map((item) => [item.planet, item.actualHouse, item.hasJoy]),
  "Hellenistic planetary joys always use Whole Sign placements"
);
assertions += 1;

// 4. Vedic and Hellenistic transit presets retain their own Whole Sign framework.
const birthInstant = new Date("2000-01-01T17:00:00.000Z");
const vedicChart = calculateVedicChart(autoChart, birthInstant);
const vedicTransit = new MultiSystemTransitEngine(
  TRANSIT_SYSTEM_PRESETS.vedic,
  autoChart,
  vedicChart,
  new Date("2026-11-12T00:00:00.000Z")
);
check(vedicTransit.houseSystemUsed === "whole-sign", "Vedic transit preset selects Whole Sign houses");
check(
  vedicTransit.calculateHouse(vedicChart.lagna.siderealLongitude, true) === 1,
  "Vedic Whole Sign transit frame puts sidereal Ascendant in house 1"
);
const hellenisticTransit = new MultiSystemTransitEngine(
  TRANSIT_SYSTEM_PRESETS.hellenistic,
  autoChart,
  vedicChart,
  new Date("2026-11-12T00:00:00.000Z")
);
check(hellenisticTransit.houseSystemUsed === "whole-sign", "Hellenistic transit preset selects Whole Sign houses");
check(
  hellenisticTransit.calculateHouse(autoChart.ascendant.longitude, false) === 1,
  "Hellenistic Whole Sign transit frame puts tropical Ascendant in house 1"
);

// 5. Firdaria: true sect, correct major/sub-period sequence, no false node sub-periods.
const firdaria = new FirdariaEngine();
const dayChart = syntheticSectChart(0);
const nightChart = syntheticSectChart(180);
const dayVenusStart = firdaria.calculateFirdaria(dayChart, 10.5);
check(dayVenusStart.isDiurnal, "Firdaria detects daytime from solar altitude");
check(dayVenusStart.activeMajorLord === "Venus", "Day Firdaria enters Venus major at age 10");
check(dayVenusStart.activeSubLord === "Venus", "Venus major begins with Venus sub-period");
const dayVenusMercury = firdaria.calculateFirdaria(dayChart, 11.2);
check(dayVenusMercury.activeMajorLord === "Venus", "Age 11.2 remains within Venus major");
check(dayVenusMercury.activeSubLord === "Mercury", "Venus major sub-periods follow Chaldean order from Venus");
const dayNode = firdaria.calculateFirdaria(dayChart, 72);
check(dayNode.activeMajorLord === "NorthNode", "Age 72 is within the North Node major period");
check(dayNode.activeSubLord.includes("No sub-period"), "Node major is not divided into seven false sub-periods");
const repeatedCycle = firdaria.calculateFirdaria(dayChart, 76);
check(repeatedCycle.activeMajorLord === "Sun", "The 75-year Firdaria cycle repeats from the beginning");
const nightStart = firdaria.calculateFirdaria(nightChart, 0);
check(!nightStart.isDiurnal, "Firdaria detects night chart from actual solar altitude");
check(nightStart.activeMajorLord === "Moon", "Night Firdaria begins with Moon major");
check(nightStart.activeSubLord === "Moon", "Night Moon major begins with Moon sub-period");

// 6. Zodiacal Releasing: active L1/L2, 360-day year, angularity from Fortune and LoB.
const zr = new ZodiacalReleasingEngine();
const zrBirth = new Date("2000-01-01T00:00:00.000Z");
const zrOneYear = new Date(zrBirth.getTime() + 360 * 86400000);
const zrAtOneYear = zr.calculateReleasing(
  zrBirth,
  15,
  "Spirit (Career & Purpose)",
  zrOneYear,
  65
);
check(zrAtOneYear.currentL1Period.sign === "Aries", "ZR L1 identifies active Aries chapter after one 360-day year");
check(zrAtOneYear.currentL2Period.sign === "Aries", "ZR L2 starts from parent L1 sign");
check(zrAtOneYear.currentL1Period.angleFromFortune === 11, "ZR angularity is counted from Lot of Fortune");
check(zrAtOneYear.currentL1Period.isPeak === false, "ZR does not mark 11th from Fortune as a peak");
const zrGeminiStart = new Date(zrBirth.getTime() + 23 * 360 * 86400000);
const zrAfterLoB = new Date(zrGeminiStart.getTime() + (211 * 30 + 5) * 86400000);
const zrLoBReport = zr.calculateReleasing(
  zrGeminiStart,
  65,
  "Spirit (Career & Purpose)",
  zrAfterLoB,
  65
);
check(zrLoBReport.currentL1Period.sign === "Gemini", "ZR locates Gemini L1 after Aries and Taurus periods");
check(zrLoBReport.currentL2Period.sign === "Sagittarius", "ZR jumps to sign opposite Gemini after the 211-month L2 circuit");
check(zrLoBReport.currentL2Period.isLoosingOfBond === true, "ZR flags the Loosing of the Bond period");

// 7. Arabian Parts: sect override and 9th-house ruler Travel Lot.
const lotsCalculator = new ArabianPartsCalculator();
const lotCusps = Array.from({ length: 12 }, (_, index) => normalizeDegrees(15 + index * 30));
const lotParams = {
  ascendant: 15,
  sun: 20,
  moon: 70,
  mercury: 80,
  venus: 90,
  mars: 100,
  jupiter: 200,
  saturn: 150,
  houseCusps: lotCusps,
};
const dayLots = lotsCalculator.calculateAll({ ...lotParams, isDayChart: true });
const nightLots = lotsCalculator.calculateAll({ ...lotParams, isDayChart: false });
close(dayLots.partOfFortune.longitude, 65, 1e-9, "Day Fortune uses ASC + Moon - Sun");
close(nightLots.partOfFortune.longitude, 325, 1e-9, "Night Fortune reverses luminary arc");
close(dayLots.partOfTravel.longitude, 70, 1e-9, "Day Travel Lot uses ASC + 9th cusp - 9th ruler");
close(nightLots.partOfTravel.longitude, 320, 1e-9, "Night Travel Lot reverses 9th cusp and ruler");
check(dayLots.partOfTravel.formula.includes("Day"), "Travel Lot formula label exposes day convention");
check(nightLots.partOfTravel.formula.includes("Night"), "Travel Lot formula label exposes night convention");

// 8. Eclipse events are dynamically searched, sorted, and not drawn from expired fixed dates.
const eclipseChart = calculateWesternChart(2000, 1, 1, 12, 0, 40.7128, -74.006, -5, "Placidus");
const eclipseStart = new Date("2026-11-12T00:00:00.000Z");
const eclipses = new EclipseAnalyzer().analyzeEclipses(eclipseChart, eclipseStart, 2);
check(eclipses.length >= 2, "Dynamic eclipse search returns events in next two years");
check(eclipses.some((event) => event.type.includes("Solar")), "Dynamic eclipse search includes a global solar event");
check(eclipses.some((event) => event.type.includes("Lunar")), "Dynamic eclipse search includes a lunar event");
check(
  eclipses.every((event) => new Date(event.peakUtc).getTime() >= eclipseStart.getTime()),
  "Dynamic eclipse search does not return expired hard-coded events"
);
check(
  eclipses.every((event, index) => index === 0 || eclipses[index - 1].peakUtc <= event.peakUtc),
  "Dynamic eclipse events are sorted by peak time"
);

// 9. Fixed-star data are explicitly reference entries, not a falsely claimed 35+ catalogue.
check(FixedStarsEngine.FIXED_STARS.length === 20, "Fixed-star catalogue count matches the 20 implemented reference entries");
const regulus = FixedStarsEngine.FIXED_STARS.find((star) => star.name.includes("Regulus"));
check(Boolean(regulus && Math.abs(regulus.longitude - 149.83) < 0.05),
  "Regulus J2000 tropical longitude reference is near Leo 29 degrees 50 minutes");

// 10. The dedicated deep Western benchmark runner must report meaningful passing assertions.
const benchmarkChart = calculateWesternChart(2000, 1, 1, 12, 0, 51.4769, 0, 0, "Placidus");
const benchmark = new WesternBenchmarkRunner().runFullSuite(benchmarkChart);
check(benchmark.totalTests >= 25, "Western deep benchmark suite executes its expected test set");
check(
  benchmark.failedCount === 0,
  "Western deep benchmark suite has no failed assertions: " +
    benchmark.results.filter((item) => !item.passed).map((item) => item.id + ":" + item.actual).join(" | ")
);

console.log("Western calculation integrity suite passed: " + assertions + " assertions; deep benchmark " +
  benchmark.passedCount + "/" + benchmark.totalTests + ".");
