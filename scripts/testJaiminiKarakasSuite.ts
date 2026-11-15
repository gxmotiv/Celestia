import assert from "node:assert/strict";
import { JaiminiKarakasEngine } from "../lib/vedic/jaiminiKarakas";
import { getJaiminiAspectedSigns } from "../lib/vedic/drishtiEngine";

const engine = new JaiminiKarakasEngine();
const signNames = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

type Position = {
  name: string;
  siderealLongitude: number;
  house: number;
  rasiName: string;
};

function position(name: string, degree: number, house: number, signIndex = 0): Position {
  return {
    name,
    siderealLongitude: signIndex * 30 + degree,
    house,
    rasiName: signNames[signIndex],
  };
}

const sevenPositions = [
  position("Sun", 29, 1),
  position("Moon", 25, 2),
  position("Mars", 22, 3),
  position("Mercury", 18, 4),
  position("Jupiter", 14, 5),
  position("Venus", 10, 6),
  position("Saturn", 5, 7),
];

const seven = engine.calculate7Karakas(sevenPositions, 90);
assert.equal(seven.scheme, "7-Karaka");
assert.equal(seven.karakas.length, 7);
assert.equal(seven.atmakaraka.planet, "Sun");
assert.deepEqual(
  seven.karakas.map((item) => item.planet),
  ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"],
  "Seven-karaka ranking must use the seven classical planets in descending in-sign degree"
);
assert.equal(seven.karakas[4].roleShort, "PK", "Seven-karaka scheme has no separate Pitrikaraka");
assert.equal(seven.karakamsaSignIndex, 8, "Karakamsa uses the Atmakaraka's uninterrupted D9 division");
assert.equal(seven.karakamsaHouseFromLagna, 6, "Karakamsa house is counted from the supplied sidereal Lagna");

const eightPositions = [
  ...sevenPositions,
  position("Rahu", 2, 8),
];
const eight = engine.calculate8Karakas(eightPositions, 90);
assert.equal(eight.scheme, "8-Karaka");
assert.equal(eight.karakas.length, 8);
assert.deepEqual(
  eight.karakas.map((item) => item.planet),
  ["Sun", "Rahu", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"],
  "Eight-karaka scheme must reverse Rahu's in-sign degree before ranking"
);
assert.equal(eight.karakas[1].rasiDegree, 2, "Displayed Rahu degree remains its actual in-sign longitude");
assert.equal(eight.karakas[1].rankingDegree, 28, "Rahu's ranking degree is 30° minus its actual degree");
assert.equal(eight.karakas[4].roleShort, "PiK", "Eight-karaka scheme inserts Pitrikaraka after Matrikaraka");

const zeroDegreeRahu = engine.calculate8Karakas(
  [...sevenPositions, position("Rahu", 0, 8)],
  90
);
assert.equal(zeroDegreeRahu.atmakaraka.planet, "Rahu");
assert.equal(zeroDegreeRahu.atmakaraka.rankingDegree, 30,
  "At exactly 0° Rahu receives the maximum reversed ranking degree; actual position remains separate");

assert.throws(
  () => engine.calculate7Karakas([
    position("Sun", 10, 1),
    position("Moon", 10, 2),
    ...sevenPositions.slice(2),
  ], 90),
  /Unresolved Jaimini Chara Karaka tie/,
  "Exact rank ties must not be broken by array order"
);
assert.throws(
  () => engine.calculate7Karakas([
    position("Sun", 10, 1),
    position("Moon", 10.00002, 2),
    ...sevenPositions.slice(2),
  ], 90),
  /Unresolved Jaimini Chara Karaka tie/,
  "Sub-arcsecond differences that collapse at the declared rank precision must fail closed"
);

assert.throws(
  () => engine.calculate7Karakas(
    [...sevenPositions.slice(0, 6), position("Saturn", 5, 2.5)],
    90
  ),
  /incomplete or invalid/,
  "Fractional house values are not accepted"
);
assert.throws(
  () => engine.calculate7Karakas(
    [...sevenPositions.slice(0, 6), { ...sevenPositions[6], siderealLongitude: 360 }],
    90
  ),
  /incomplete or invalid/,
  "Longitudes must be in the normalized [0°, 360°) range"
);
assert.throws(
  () => engine.calculate7Karakas(
    [...sevenPositions.slice(0, 6), { ...sevenPositions[6], rasiName: "Pisces" }],
    90
  ),
  /resolves to Aries/,
  "Displayed sign must agree with the sidereal longitude"
);
assert.throws(
  () => engine.calculate7Karakas(
    [...sevenPositions, { ...sevenPositions[0] }],
    90
  ),
  /Duplicate Jaimini position/,
  "Duplicate required grahas are rejected"
);
assert.throws(
  () => engine.calculate8Karakas(sevenPositions, 90),
  /requires positions for: Rahu/,
  "Eight-karaka scheme requires Rahu rather than silently reusing the seven-karaka scheme"
);
assert.throws(
  () => engine.calculate7Karakas(sevenPositions, 360),
  /sidereal Ascendant longitude in \[0°, 360°\)/,
  "Ascendant longitude must be normalized"
);
assert.throws(
  () => engine.calculate7Karakas(sevenPositions),
  /requires the sidereal Ascendant longitude/,
  "Direct API does not fabricate the Lagna"
);

const expectedRashiAspects: number[][] = [
  [4, 7, 10], [3, 6, 9], [5, 8, 11], [1, 7, 10],
  [0, 6, 9], [2, 8, 11], [1, 4, 10], [0, 3, 9],
  [2, 5, 11], [1, 4, 7], [0, 3, 6], [2, 5, 8],
];
for (let signIndex = 0; signIndex < 12; signIndex += 1) {
  assert.deepEqual(
    getJaiminiAspectedSigns(signIndex),
    expectedRashiAspects[signIndex],
    `Jaimini Rashi Drishti for ${signNames[signIndex]} must follow Chara/Sthira/Dwisvabhava rules`
  );
}
assert.throws(() => getJaiminiAspectedSigns(-1), /./, "Invalid sign index must not return a plausible aspect set");
assert.throws(() => getJaiminiAspectedSigns(12), /./, "Sign index 12 is outside the zodiac");

console.log(
  "Jaimini bottom-up suite passed: 7/8 Karaka variants, Rahu reversal, tie and input validation, Karakamsa, and all 12 Rashi Drishti maps."
);
