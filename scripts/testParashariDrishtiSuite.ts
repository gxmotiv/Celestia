import assert from "node:assert/strict";
import {
  calculateDrishtiMatrix,
  calculateDrishtiVirupas,
  calculateLongitudeDrishtiVirupas,
  calculateSignDrishtiVirupas,
  type DrishtiPlanetInput,
} from "../lib/vedic/drishtiEngine";

const base = (angle: number) =>
  calculateLongitudeDrishtiVirupas(angle, "Sun", "bphs-base-longitude-curve");

const baseCases: Array<[number, number]> = [
  [0, 0],
  [29.999, 0],
  [30, 0],
  [45, 7.5],
  [60, 15],
  [75, 30],
  [90, 45],
  [105, 37.5],
  [120, 30],
  [135, 15],
  [150, 0],
  [165, 30],
  [180, 60],
  [210, 45],
  [240, 30],
  [270, 15],
  [299.999, 0.0005],
  [300, 0],
  [330, 0],
  [360, 0],
];
for (const [angle, expected] of baseCases) {
  assert.ok(
    Math.abs(base(angle) - expected) < 1e-9,
    `Base BPHS longitude curve at ${angle}° should be ${expected} Virupas, received ${base(angle)}`
  );
}

assert.equal(
  calculateLongitudeDrishtiVirupas(90, "Mars", "bphs-base-longitude-curve"),
  45,
  "The base longitude curve leaves Mars's special increase out"
);
assert.equal(
  calculateLongitudeDrishtiVirupas(90, "Mars", "bphs-verse-special-formula"),
  60,
  "BPHS 26.11 Mars c=3 formula replaces generic strength with 60"
);
assert.equal(
  calculateLongitudeDrishtiVirupas(105, "Mars", "bphs-verse-special-formula"),
  45,
  "BPHS 26.11 Mars c=3 uses 60 minus degrees past the third sign"
);
assert.equal(
  calculateLongitudeDrishtiVirupas(75, "Saturn", "bphs-verse-special-formula"),
  52.5,
  "BPHS 26.9 Saturn c=2 uses 60 minus half the degrees past the second sign"
);
assert.equal(
  calculateLongitudeDrishtiVirupas(255, "Saturn", "bphs-verse-special-formula"),
  45,
  "BPHS 26.10 Saturn c=8 uses degrees past the eighth sign plus 30"
);
assert.equal(
  calculateLongitudeDrishtiVirupas(255, "Jupiter", "bphs-verse-special-formula"),
  10,
  "BPHS 26.12 Jupiter c=8 uses 60 minus twice the degrees past the eighth sign"
);
assert.equal(
  calculateLongitudeDrishtiVirupas(270, "Jupiter", "bphs-verse-special-formula"),
  0,
  "BPHS Jupiter c=8 formula reaches zero at the 270-degree boundary"
);
assert.equal(
  calculateLongitudeDrishtiVirupas(270, "Jupiter", "bphs-verse-special-formula"),
  0,
  "The verse-special discontinuity is preserved rather than smoothed into the generic c=9 curve"
);
assert.equal(
  calculateLongitudeDrishtiVirupas(75, "Saturn", "bphs-translator-special-adjustments"),
  75,
  "Raman/translator-note Saturn +45 addition is not clipped at 60"
);
assert.equal(
  calculateLongitudeDrishtiVirupas(90, "Mars", "bphs-translator-special-adjustments"),
  60,
  "Raman/translator-note Mars adds 15 to the generic 45 at 90 degrees"
);
assert.equal(calculateLongitudeDrishtiVirupas(210, "Mars", "bphs-verse-special-formula"), 60);
assert.equal(calculateLongitudeDrishtiVirupas(120, "Jupiter", "bphs-verse-special-formula"), 60);
assert.equal(calculateLongitudeDrishtiVirupas(240, "Jupiter", "bphs-verse-special-formula"), 60);
assert.equal(calculateLongitudeDrishtiVirupas(60, "Saturn", "bphs-verse-special-formula"), 60);
assert.equal(calculateLongitudeDrishtiVirupas(270, "Saturn", "bphs-verse-special-formula"), 60);
assert.throws(() => calculateLongitudeDrishtiVirupas(Number.NaN, "Sun"), /must be finite/);

const partialGrades: Array<[string, number, number]> = [
  ["Sun", 3, 15],
  ["Sun", 4, 45],
  ["Sun", 5, 30],
  ["Sun", 7, 60],
  ["Sun", 8, 45],
  ["Sun", 9, 30],
  ["Sun", 10, 15],
  ["Mars", 4, 60],
  ["Mars", 8, 60],
  ["Jupiter", 5, 60],
  ["Jupiter", 9, 60],
  ["Saturn", 3, 60],
  ["Saturn", 10, 60],
  ["Mercury", 4, 45],
  ["Venus", 5, 30],
];
for (const [planet, offset, expected] of partialGrades) {
  assert.equal(
    calculateSignDrishtiVirupas(planet, offset),
    expected,
    `${planet} whole-sign aspect at sign offset ${offset} should be ${expected} Virupas`
  );
}
for (const offset of [2, 6, 11, 12]) {
  assert.equal(calculateSignDrishtiVirupas("Sun", offset), 0);
}
assert.equal(calculateSignDrishtiVirupas("Rahu", 7), 0, "The default BPHS profile does not infer nodal Graha Drishti");
assert.equal(calculateSignDrishtiVirupas("Ketu", 5), 0);
assert.equal(calculateSignDrishtiVirupas("Rahu", 7, "seventh-only"), 60);
assert.equal(calculateSignDrishtiVirupas("Rahu", 5, "seventh-only"), 0);
assert.equal(calculateSignDrishtiVirupas("Ketu", 5, "fifth-seventh-ninth"), 60);
assert.equal(calculateSignDrishtiVirupas("Ketu", 9, "fifth-seventh-ninth"), 60);
assert.throws(() => calculateSignDrishtiVirupas("Sun", 0), /offset must be an integer/);

const position = (
  name: string,
  siderealLongitude: number,
  house: number
): DrishtiPlanetInput => {
  const rasiIndex = Math.floor(siderealLongitude / 30);
  return {
    name,
    siderealLongitude,
    house,
    rasiIndex,
    rasiName: [
      "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
      "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
    ][rasiIndex],
  };
};

// Cancer Ascendant: Aries = 10th; Gemini = 12th in whole-sign houses.
// Sun at 10° Aries aspects Gemini as the 3rd sign, while the Moon at 5° Gemini
// is 55° forward from the Sun. Sign grade and exact degree strength must differ.
const sun = position("Sun", 10, 10);
const moon = position("Moon", 65, 12);
const report = calculateDrishtiMatrix([sun, moon], 3);
assert.equal(report.grahaAspectPolicy, "bphs-chapter-26-seven-grahas");
assert.equal(report.nodeAspectRule, "none");
assert.equal(report.degreeStrengthVariant, "bphs-verse-special-formula");
const sunMoon = report.grahaAspects.find(
  (aspect) => aspect.aspectingPlanet === "Sun" && aspect.aspectedPlanet === "Moon"
);
assert.ok(sunMoon, "The Sun's 3rd-sign partial aspect on the Moon must be represented");
assert.equal(sunMoon.aspectType, "3rd (Quarter)");
assert.equal(sunMoon.aspectedSign, "Gemini");
assert.equal(sunMoon.aspectedHouse, 12, "Target whole-sign house is mapped from the sidereal Ascendant sign, not a guessed Bhava offset");
assert.equal(sunMoon.strengthVirupas, 15, "The whole-sign grade is one quarter");
assert.equal(sunMoon.degreeStrengthVirupas, 12.5, "Exact Drishti Pinda uses the actual 55° longitude separation");
assert.equal(sunMoon.degreeStrengthPercent, 21);

// Exact 7th aspects are mutual when both planets stand in opposite signs.
const mercury = position("Mercury", 190, 4);
const mutualReport = calculateDrishtiMatrix([sun, mercury], 3);
assert.ok(
  mutualReport.mutualAspects.some(
    (aspect) => aspect.planet1 === "Mercury" && aspect.planet2 === "Sun" ||
      aspect.planet1 === "Sun" && aspect.planet2 === "Mercury"
  ),
  "Mutual 7th-sign aspects must remain discoverable"
);

// Nodal options are separate profiles and affect only Graha Drishti, not the
// underlying Jaimini Rashi Drishti calculation.
const rahu = position("Rahu", 10, 10);
const jupiter = position("Jupiter", 130, 2);
const noNodeAspects = calculateDrishtiMatrix([rahu, jupiter], 3);
assert.ok(!noNodeAspects.grahaAspects.some((aspect) => aspect.aspectingPlanet === "Rahu"));
const node7th = calculateDrishtiMatrix([rahu, jupiter], 3, { nodeAspectRule: "seventh-only" });
assert.ok(!node7th.grahaAspects.some((aspect) => aspect.aspectingPlanet === "Rahu" && aspect.aspectedPlanet === "Jupiter"));
const node579 = calculateDrishtiMatrix([rahu, jupiter], 3, { nodeAspectRule: "fifth-seventh-ninth" });
assert.ok(
  node579.grahaAspects.some((aspect) => aspect.aspectingPlanet === "Rahu" && aspect.aspectedPlanet === "Jupiter"),
  "The later 5/7/9 nodal profile should include Rahu's 5th-sign aspect to Jupiter"
);
assert.equal(node579.nodeAspectRule, "fifth-seventh-ninth");
assert.ok(node579.rashiDrishtis.length === 12, "Jaimini sign aspects remain a distinct complete 12-sign matrix");

// Fail closed on mismatched longitude/sign/house metadata and invalid ascendant.
assert.throws(() => calculateDrishtiMatrix([sun], 12), /Ascendant sign index/);
assert.throws(
  () => calculateDrishtiMatrix([{ ...sun, rasiIndex: 1 }], 3),
  /inconsistent longitude, sign or house/
);
assert.throws(
  () => calculateDrishtiMatrix([{ ...sun, siderealLongitude: 360 }], 3),
  /inconsistent longitude, sign or house/
);
assert.throws(
  () => calculateDrishtiMatrix([{ ...sun, house: 10.5 }], 3),
  /inconsistent longitude, sign or house/
);
assert.throws(
  () => calculateDrishtiMatrix([sun, sun], 3),
  /Duplicate Drishti position/
);

console.log(
  "Parashari Drishti bottom-up suite passed: exact-degree Virupa boundaries, sign-grade quarters, special upgrades, nodal variants, whole-sign house mapping and invalid-input rejection."
);
