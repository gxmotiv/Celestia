import assert from "node:assert/strict";
import { AntisciaCalculator } from "../lib/astronomy/antisciaCalculator";

const calculator = new AntisciaCalculator();

// Lilly, Christian Astrology (1647), Book I, pp. 90-92:
// Saturn at 20°35′ Leo has its antiscion at 9°25′ Taurus,
// and contra-antiscion at 9°25′ Scorpio.
const lillyExample = calculator.calculate(
  120 + 20 + 35 / 60,
  "Saturn"
);
assert.equal(lillyExample.method, "Lilly-Christian-Astrology-1647");
assert.equal(lillyExample.antiscion.sign, "Taurus");
assert.ok(Math.abs(lillyExample.antiscion.degreeInSign - (9 + 25 / 60)) < 1e-8);
assert.equal(lillyExample.contraAntiscion.sign, "Scorpio");
assert.ok(Math.abs(lillyExample.contraAntiscion.degreeInSign - (9 + 25 / 60)) < 1e-8);

// Lilly's sign-pair table: degrees mirror within the paired signs.
// Use 10° in each source sign; the antiscion degree is 20° in the paired sign.
const signPairs = [
  ["Aries", 0, "Virgo", 5],
  ["Taurus", 1, "Leo", 4],
  ["Gemini", 2, "Cancer", 3],
  ["Cancer", 3, "Gemini", 2],
  ["Leo", 4, "Taurus", 1],
  ["Virgo", 5, "Aries", 0],
  ["Libra", 6, "Pisces", 11],
  ["Scorpio", 7, "Aquarius", 10],
  ["Sagittarius", 8, "Capricorn", 9],
  ["Capricorn", 9, "Sagittarius", 8],
  ["Aquarius", 10, "Scorpio", 7],
  ["Pisces", 11, "Libra", 6],
] as const;
for (const [sourceSign, sourceIndex, targetSign, targetIndex] of signPairs) {
  const result = calculator.calculate(sourceIndex * 30 + 10, sourceSign);
  assert.equal(result.antiscion.sign, targetSign);
  assert.equal(result.antiscion.signIndex, targetIndex);
  assert.ok(Math.abs(result.antiscion.degreeInSign - 20) < 1e-8);
}

// Contra-antiscion is exactly opposite the antiscion, not a declination parallel.
const source = 217.25;
const pair = calculator.calculate(source);
const angularDifference = Math.abs(
  ((((pair.contraAntiscion.longitude - pair.antiscion.longitude) % 360) + 540) % 360) - 180
);
assert.ok(Math.abs(angularDifference - 180) < 1e-8);
assert.ok(
  Math.abs((((source + pair.antiscion.longitude) % 360) + 360) % 360 - 180) < 1e-8,
  "Source longitude and antiscion must sum to 180° modulo 360°"
);

// Solstitial-axis points are fixed by the reflection.
assert.equal(calculator.calculate(90).antiscion.longitude, 90);
assert.equal(calculator.calculate(270).antiscion.longitude, 270);

// Finite values are normalized consistently around the zodiacal circle.
assert.equal(calculator.calculate(-10).sourceLongitude, 350);
assert.equal(calculator.calculate(370).sourceLongitude, 10);
assert.throws(() => calculator.calculate(Number.NaN), /finite ecliptic longitude/);
assert.throws(
  () => calculator.calculateAll([{ name: "Sun", longitude: 10 }, { name: "Sun", longitude: 20 }]),
  /Duplicate antiscia input name/
);
assert.throws(
  () => calculator.calculateAll([{ name: "Moon", longitude: Number.POSITIVE_INFINITY }]),
  /finite ecliptic longitude/
);

const all = calculator.calculateAll([
  { name: "Sun", longitude: 40 },
  { name: "Moon", longitude: 230 },
]);
assert.equal(all.length, 2);
assert.equal(all[0].sourceName, "Sun");
assert.equal(all[1].sourceName, "Moon");

console.log(
  "Western antiscia suite passed: Lilly's degree-minute example, all 12 sign mappings, contra-antiscion opposition, solstitial-axis fixed points and invalid-input guards."
);
