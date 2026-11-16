import assert from "node:assert/strict";
import { ShadbalaEngine, type ShadbalaChartInput } from "../lib/vedic/shadbalaEngine";

const engine = new ShadbalaEngine();
const basePlanets: ShadbalaChartInput["planets"] = {
  Sun: { longitude: 0 },
  Moon: { longitude: 30 },
  Mars: { longitude: 60 },
  Mercury: { longitude: 90 },
  Jupiter: { longitude: 120 },
  Venus: { longitude: 150 },
  Saturn: { longitude: 180 },
};

function sthana(planet: string, longitude: number) {
  return engine.calculateSthanaBala(planet, {
    ascendant: 0,
    planets: {
      ...basePlanets,
      [planet]: { longitude },
    },
  });
}

// BPHS 27.5: Moon and Venus receive 15 Virupas in even signs;
// every other planet, including Mercury and Saturn, receives 15 in odd signs.
// The same rule is independently applied to the Navamsa sign.
const fullOjayugma: Array<[string, number]> = [
  ["Sun", 0],       // Aries Rasi / Aries Navamsa: odd + odd
  ["Moon", 30],     // Taurus Rasi / Capricorn Navamsa: even + even
  ["Mars", 60],     // Gemini Rasi / Libra Navamsa: odd + odd
  ["Mercury", 0],   // Mercury is included among "the others": odd + odd
  ["Jupiter", 120], // Leo Rasi / Sagittarius Navamsa: odd + odd
  ["Venus", 90],    // Cancer Rasi / Cancer Navamsa: even + even
  ["Saturn", 0],    // Saturn is included among "the others": odd + odd
];
for (const [planet, longitude] of fullOjayugma) {
  assert.equal(sthana(planet, longitude).ojayugmaBala, 30,
    `${planet} must receive 30 Virupas when both Rasi and Navamsa satisfy BPHS 27.5`);
}

const noOjayugma: Array<[string, number]> = [
  ["Sun", 30], ["Mars", 30], ["Jupiter", 30],
  ["Mercury", 30], ["Saturn", 30], // all "other planets" in even Rasi / even Navamsa
  ["Moon", 0], ["Venus", 0],       // Moon/Venus in odd Rasi / odd Navamsa
];
for (const [planet, longitude] of noOjayugma) {
  assert.equal(sthana(planet, longitude).ojayugmaBala, 0,
    `${planet} must receive no Ojayugma when neither Rasi nor Navamsa matches its BPHS group`);
}

// Isolate Rasi and Navamsa contributions: each contributes 15 Virupas.
assert.equal(sthana("Mercury", 10).ojayugmaBala, 15,
  "Mercury in odd Aries Rasi but even Cancer Navamsa receives only Rasi Ojayugma");
assert.equal(sthana("Moon", 10).ojayugmaBala, 15,
  "Moon in odd Aries Rasi but even Cancer Navamsa receives only Navamsa Ojayugma");
assert.equal(sthana("Venus", 40).ojayugmaBala, 15,
  "Venus in even Taurus Rasi but odd Aries Navamsa receives only Rasi Ojayugma");
assert.equal(sthana("Sun", 10).ojayugmaBala, 15,
  "Sun in odd Aries Rasi but even Cancer Navamsa receives only Rasi Ojayugma");

// Exact Navamsa boundaries use the shared D9 half-open interval policy.
const justBeforeNavamsaBoundary = 10 / 3 - 1e-8;
const exactNavamsaBoundary = 10 / 3;
assert.equal(sthana("Sun", justBeforeNavamsaBoundary).ojayugmaBala, 30,
  "Just before 3°20', Aries remains the odd Navamsa");
assert.equal(sthana("Sun", exactNavamsaBoundary).ojayugmaBala, 15,
  "At 3°20', the next (even) Navamsa begins under the half-open boundary rule");

// Cross-check Ojayugma against the longitudes in Raman's Standard Horoscope
// (primary scan, pp. 2, 26). Expected values are 30/15/15/30/15/30/15.
const ramanStandardHoroscope: ShadbalaChartInput = {
  ascendant: 298 + 27 / 60, // 298°27' from Raman, p. 3
  // Primary-source positions: Raman, Graha and Bhava Balas, p. 2.
  planets: {
    Sun: { longitude: 180 + 53 / 60 + 55 / 3600 },
    Moon: { longitude: 311 + 17 / 60 + 19 / 3600 },
    Mars: { longitude: 229 + 30 / 60 + 34 / 3600 },
    Mercury: { longitude: 181 + 31 / 60 + 34 / 3600 },
    Jupiter: { longitude: 84 + 0 / 60 + 49 / 3600 },
    Venus: { longitude: 171 + 9 / 60 + 56 / 3600 },
    Saturn: { longitude: 124 + 22 / 60 + 41 / 3600 },
  },
};
const ramanOjayugma: Array<[string, number]> = [
  ["Sun", 30], ["Moon", 15], ["Mars", 15], ["Mercury", 30],
  ["Jupiter", 15], ["Venus", 30], ["Saturn", 15],
];
for (const [planet, expected] of ramanOjayugma) {
  const result = engine.calculateSthanaBala(planet, ramanStandardHoroscope);
  assert.equal(result.ojayugmaBala, expected,
    `Raman Standard Horoscope Ojayugma for ${planet} must match the independently transcribed worked-chart table`);
}

// Raman's own Standard Horoscope, Example 12, p. 28, yields 15 for
// Sun in first and Venus in last Drekkana; every other planet gets zero.
// This agrees with the BPHS Sanskrit order (male / neuter / female).
const ramanDrekkanaExpected: Array<[string, number]> = [
  ["Sun", 15], ["Moon", 0], ["Mars", 0], ["Mercury", 0],
  ["Jupiter", 0], ["Venus", 15], ["Saturn", 0],
];
for (const [planet, expected] of ramanDrekkanaExpected) {
  assert.equal(sthana(planet, ramanStandardHoroscope.planets[planet].longitude).drekkanaBala, expected,
    `BPHS Sanskrit/Raman Drekkana Bala for ${planet} must match Raman Example 12`);
}

// Santhanam Vol. I, Chapter 27, pp. 266–267 explicitly maps female planets
// to the middle Drekkana and eunuch planets to the last. Expose that as a
// separate translation/edition profile, not as the Sanskrit/Raman default.
const santhanamExpected: Array<[string, number, number]> = [
  ["Sun", 5, 15], ["Mars", 5, 0], ["Jupiter", 25, 0],
  ["Moon", 15, 15], ["Venus", 25, 0],
  ["Mercury", 25, 15], ["Saturn", 25, 15],
];
for (const [planet, longitude, expected] of santhanamExpected) {
  const result = engine.calculateSthanaBala(planet, {
    ascendant: 0,
    planets: { ...basePlanets, [planet]: { longitude } },
    drekkanaBalaMethod: "santhanam-english-translation",
  });
  assert.equal(result.drekkanaBala, expected,
    `Santhanam English Drekkana order must score ${planet} correctly`);
  assert.equal(result.drekkanaBalaMethod, "santhanam-english-translation");
}

// Unknown method IDs fail closed rather than silently falling back.
assert.throws(
  () => engine.calculateSthanaBala("Sun", {
    ascendant: 0,
    planets: basePlanets,
    drekkanaBalaMethod: "invented-order" as never,
  }),
  /Unknown Drekkana Bala source method/
);

// BPHS 27.6 Sanskrit orders the decanates and classes as masculine,
// neuter and feminine: male first, Mercury/Saturn middle, female last.
const drekkanaMatches: Array<[string, number]> = [
  ["Sun", 5], ["Mars", 5], ["Jupiter", 5],
  ["Mercury", 15], ["Saturn", 15],
  ["Moon", 25], ["Venus", 25],
];
for (const [planet, longitude] of drekkanaMatches) {
  assert.equal(sthana(planet, longitude).drekkanaBala, 15,
    `${planet} must receive BPHS 27.6 Drekkana Bala in its corresponding decanate`);
}
const drekkanaMismatches: Array<[string, number]> = [
  ["Sun", 15], ["Mercury", 5], ["Venus", 15],
];
for (const [planet, longitude] of drekkanaMismatches) {
  assert.equal(sthana(planet, longitude).drekkanaBala, 0,
    `${planet} must not receive Drekkana Bala in a non-matching decanate`);
}

console.log("Shadbala Sthana Bala suite passed: BPHS Ojayugma Rasi/Navamsa grouping, D9 boundaries, Raman's primary worked example, and both Drekkana source orders.");
