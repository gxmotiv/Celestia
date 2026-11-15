import assert from "node:assert/strict";
import {
  calculateDivisionalChart,
  calculateDivisionalDegreeInSign,
  calculateDivisionalSignIndex,
  DIVISIONAL_CHARTS_CONFIG,
} from "../lib/vedic/divisionalCalc";
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

assert.equal(Object.keys(DIVISIONAL_CHARTS_CONFIG).length, 16,
  "The configured Parashari Shodashavarga set should contain 16 charts.");

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

// D30 Trimsamsa: BPHS 6.27 gives the unequal widths and lords.
// The chart's commonly used sign mapping follows each segment lord's
// corresponding odd/even domicile (Aries ... Libra / Taurus ... Scorpio).
const oddD30Cases = [
  [2.5, 0],   // Mars -> Aries
  [5, 10],    // Saturn -> Aquarius, exact boundary
  [10, 8],    // Jupiter -> Sagittarius, exact boundary
  [18, 2],    // Mercury -> Gemini, exact boundary
  [25, 6],    // Venus -> Libra, exact boundary
] as const;
for (const [degree, expectedSign] of oddD30Cases) {
  assert.equal(
    calculateDivisionalSignIndex(degree, "D30"),
    expectedSign,
    `Odd-sign D30 at ${degree}° must map to sign index ${expectedSign}`
  );
}
const evenD30Cases = [
  [2.5, 1],   // Venus -> Taurus
  [5, 5],     // Mercury -> Virgo, exact boundary
  [12, 11],   // Jupiter -> Pisces, exact boundary
  [20, 9],    // Saturn -> Capricorn, exact boundary
  [25, 7],    // Mars -> Scorpio, exact boundary
] as const;
for (const [degree, expectedSign] of evenD30Cases) {
  assert.equal(
    calculateDivisionalSignIndex(30 + degree, "D30"),
    expectedSign,
    `Even-sign D30 at ${degree}° must map to sign index ${expectedSign}`
  );
}

// D30's five segment boundaries must remain half-open and the transformed
// degree must start at 0° in the new D30 sign.
assert.equal(calculateDivisionalDegreeInSign(25, "D30"), 0);
assert.equal(calculateDivisionalDegreeInSign(27.5, "D30"), 15);

// The previously incorrect final odd-sign segment must now produce Libra,
// where the Sun is debilitated; it must never be misreported as Taurus.
const sunInOddFinalD30Segment = calculateDivisionalChart(
  [makeSun(27, 0, "Aries")],
  0,
  "D30"
).planets[0];
assert.equal(sunInOddFinalD30Segment.signIndex, 6);
assert.equal(sunInOddFinalD30Segment.sign, "Libra");
assert.equal(sunInOddFinalD30Segment.dignity, "Debilitated");

// Neither luminary's domicile is a destination in this five-lord D30 variant.
for (let sign = 0; sign < 12; sign += 1) {
  for (const degree of [2.5, 7.5, 14, 21.5, 27.5]) {
    const d30Sign = calculateDivisionalSignIndex(sign * 30 + degree, "D30");
    assert.notEqual(d30Sign, 3, "Cancer must not appear as a D30 destination");
    assert.notEqual(d30Sign, 4, "Leo must not appear as a D30 destination");
  }
}

console.log("Divisional dignity suite passed: D30 odd/even mappings and boundary regression checks.");
