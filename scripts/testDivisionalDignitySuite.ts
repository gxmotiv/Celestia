import assert from "node:assert/strict";
import { calculateDivisionalChart } from "../lib/vedic/divisionalCalc";
import type { VedicPlanet } from "../lib/astronomy/vedic";

function makeSun(longitude: number, signIndex: number, rasiName: string): VedicPlanet {
  return {
    id: "Sun",
    name: "Sun",
    sanskritName: "Surya",
    symbol: "☉",
    siderealLongitude: longitude,
    rasiIndex: signIndex,
    rasiName,
    rasiSanskrit: rasiName,
    rasiDegree: longitude % 30,
    rasiDegreeFormatted: `10°00' ${rasiName}`,
    house: 1,
    nakshatraIndex: 0,
    nakshatraName: "Ashwini",
    nakshatraLord: "Ketu",
    nakshatraDeity: "Ashwini Kumaras",
    pada: 1,
    navamsaRasiIndex: 0,
    navamsaRasiName: "Aries",
    dignity: "Neutral",
    isRetrograde: false,
  };
}

const sunInCancer = calculateDivisionalChart(
  [makeSun(100, 3, "Cancer")],
  0,
  "D1"
).planets[0];
assert.equal(sunInCancer.dignity, "Friendly",
  "Sun should be friendly in Cancer, a Moon-ruled sign.");

const sunInPisces = calculateDivisionalChart(
  [makeSun(340, 11, "Pisces")],
  0,
  "D1"
).planets[0];
assert.equal(sunInPisces.dignity, "Friendly",
  "Sun should be friendly in Pisces, a Jupiter-ruled sign.");

const sunInVirgo = calculateDivisionalChart(
  [makeSun(160, 5, "Virgo")],
  0,
  "D1"
).planets[0];
assert.equal(sunInVirgo.dignity, "Neutral",
  "Sun should remain neutral in Virgo, ruled by neutral Mercury.");

console.log("Divisional dignity suite passed: 3 assertions.");
