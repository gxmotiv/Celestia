import assert from "node:assert/strict";
import {
  MedicalAstrologyEngine,
} from "../lib/astronomy/specializedWesternEngines";
import type {
  PlanetPosition,
  WesternChartData,
} from "../lib/astronomy/ephemeris";

function makePlanet(name: string, sign: string, signIndex: number): PlanetPosition {
  return {
    id: name,
    name,
    symbol: name.slice(0, 1),
    longitude: signIndex * 30 + 10,
    latitude: 0,
    speed: 0.5,
    isRetrograde: false,
    sign,
    signIndex,
    signDegree: 10,
    signDegreeFormatted: `10°00' ${sign}`,
    house: 1,
    element: "Fire",
    modality: "Cardinal",
  };
}

const signs = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

const chart: WesternChartData = {
  planets: [
    makePlanet("Sun", "Libra", 6),
    makePlanet("Moon", "Pisces", 11),
    makePlanet("Mars", "Sagittarius", 8),
    makePlanet("Saturn", "Taurus", 1),
  ],
  houses: signs.map((sign, index) => ({
    house: index + 1,
    longitude: index * 30,
    sign,
    signIndex: index,
    signDegreeFormatted: `0°00' ${sign}`,
  })),
  aspects: [],
  ascendant: makePlanet("Ascendant", "Aries", 0),
  midheaven: makePlanet("Midheaven", "Capricorn", 9),
  descendant: 180,
  imumCoeli: 90,
  julianDay: 2451545,
  siderealTime: 100,
  obliquity: 23.4,
  birthLatitude: 0,
  birthLongitude: 0,
  houseSystem: "WholeSign",
};

const report = new MedicalAstrologyEngine().analyzeTraditionalSymbolism(chart);

assert.ok(report.traditionalSummary.includes("historical medical-astrology symbolism"));
assert.ok(report.traditionalSummary.includes("do not describe physical condition"));
assert.ok(report.traditionalSummary.includes("do not diagnose illness"));
assert.equal(report.traditionalCorrespondences.length, 5);
assert.ok(report.traditionalCorrespondences.every((entry) =>
  entry.traditionalInterpretation.includes("historical") &&
  entry.traditionalInterpretation.includes("does not")
));
assert.ok(report.traditionalCorrespondences.every((entry) =>
  entry.chartEmphasis === "Key" || entry.chartEmphasis === "Additional"
));
assert.ok(report.sixthHouseTheme.includes("not a clinical indicator"));
assert.ok(report.twelfthHouseTheme.includes("does not indicate hidden illness"));
assert.equal("preventivePractices" in report, false);
assert.equal("vulnerableSystems" in report, false);

console.log("Medical astrology symbolism suite passed: 9 assertions.");
