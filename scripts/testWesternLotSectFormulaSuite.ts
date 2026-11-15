import assert from "node:assert/strict";
import { ArabianPartsCalculator } from "../lib/astronomy/arabianPartsCalculator";

const calculator = new ArabianPartsCalculator();
const houseCusps = Array.from({ length: 12 }, (_, index) => index * 30);
const base = {
  ascendant: 100,
  sun: 20,
  moon: 80,
  mercury: 40,
  venus: 60,
  mars: 180,
  jupiter: 250,
  saturn: 300,
  houseCusps,
};

// Named profile: common Hellenistic sect-reversed Fortune and Spirit.
// Valens, Anthology III.11 (Fortune) and II.23 (Daimon/Spirit).
const day = calculator.calculateAll({ ...base, isDayChart: true });
assert.equal(day.formulaProfile, "common-hellenistic-sect-reversed");
assert.equal(day.partOfFortune.longitude, 160); // ASC + Moon - Sun
assert.equal(day.partOfSpirit.longitude, 40);   // ASC + Sun - Moon
assert.equal(day.partOfFortune.formula, "ASC + Moon - Sun (Day)");
assert.equal(day.partOfSpirit.formula, "ASC + Sun - Moon (Day)");
assert.equal(day.partOfFortune.house, 6);
assert.equal(day.partOfSpirit.house, 2);

// Night reverses both arcs; the two points remain reflections about the Ascendant.
const night = calculator.calculateAll({ ...base, isDayChart: false });
assert.equal(night.formulaProfile, "common-hellenistic-sect-reversed");
assert.equal(night.partOfFortune.longitude, 40); // ASC + Sun - Moon
assert.equal(night.partOfSpirit.longitude, 160); // ASC + Moon - Sun
assert.equal(night.partOfFortune.formula, "ASC + Sun - Moon (Night)");
assert.equal(night.partOfSpirit.formula, "ASC + Moon - Sun (Night)");
assert.equal(night.partOfFortune.house, 2);
assert.equal(night.partOfSpirit.house, 6);

function angularDifference(a: number, b: number): number {
  return Math.abs((((a - b + 540) % 360) - 180));
}
for (const lots of [day, night]) {
  const reflectedSum =
    ((lots.partOfFortune.longitude - base.ascendant) +
      (lots.partOfSpirit.longitude - base.ascendant)) % 360;
  assert.ok(
    angularDifference(reflectedSum, 0) < 0.001,
    "Fortune and Spirit must be opposite arcs projected from the Ascendant"
  );
  assert.equal(lots.allParts.length, 15);
  assert.equal(lots.partOfNemesis.longitude, lots.partOfCatastrophe.longitude);
}

// New Moon: Sun and Moon conjoin, so Fortune and Spirit coincide with the ASC.
for (const isDayChart of [true, false]) {
  const newMoon = calculator.calculateAll({
    ...base,
    sun: 45,
    moon: 45,
    isDayChart,
  });
  assert.equal(newMoon.partOfFortune.longitude, base.ascendant);
  assert.equal(newMoon.partOfSpirit.longitude, base.ascendant);
}

// Full Moon: Sun and Moon oppose, so both Lots coincide with the Descendant.
for (const isDayChart of [true, false]) {
  const fullMoon = calculator.calculateAll({
    ...base,
    sun: 45,
    moon: 225,
    isDayChart,
  });
  assert.equal(fullMoon.partOfFortune.longitude, 280);
  assert.equal(fullMoon.partOfSpirit.longitude, 280);
}

// Malformed cusps must never be represented by an apparently valid chart
// position or an arbitrary House 1 result.
assert.throws(
  () => calculator.calculateAll({ ...base, houseCusps: [0, 30, 60] }),
  /exactly twelve finite house cusps/
);

console.log(
  "Western Lot formula suite passed: common-profile day/night arithmetic, Fortune/Spirit reflection, new/full Moon invariants, house assignment and cusp input validation."
);
