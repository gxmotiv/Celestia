import assert from "node:assert/strict";
import { evaluateVedicDignity } from "../lib/astronomy/vedic";

/**
 * BPHS Chapter 3, verses 51-54 (digitized text):
 * https://archive.org/stream/ParasharaHoraSastra/BrihatParasharaHoraSastraVedicAstrologyEbook_djvu.txt
 *
 * Exact sign portions used here:
 * Sun: Leo 0-20 Moolatrikona, 20-30 own.
 * Moon: Taurus 0-3 exaltation, 3-30 Moolatrikona.
 * Mars: Aries 0-12 Moolatrikona, 12-30 own.
 * Mercury: Virgo 0-15 exaltation, 15-20 Moolatrikona, 20-30 own.
 * Jupiter: Sagittarius 0-10 Moolatrikona, 10-30 own.
 * Venus: Libra 0-15 Moolatrikona, 15-30 own.
 * Saturn: Aquarius 0-20 Moolatrikona, 20-30 own.
 *
 * Intervals are half-open: the exact degree at a boundary belongs to the
 * following dignity zone, avoiding overlap at an exact cusp.
 */

const cases = [
  ["Sun", 4, 19.999999, "Moolatrikona"],
  ["Sun", 4, 20, "Own Sign"],
  ["Moon", 1, 2.999999, "Exalted"],
  ["Moon", 1, 3, "Moolatrikona"],
  ["Mars", 0, 11.999999, "Moolatrikona"],
  ["Mars", 0, 12, "Own Sign"],
  ["Mercury", 5, 14.999999, "Exalted"],
  ["Mercury", 5, 15, "Moolatrikona"],
  ["Mercury", 5, 19.999999, "Moolatrikona"],
  ["Mercury", 5, 20, "Own Sign"],
  ["Jupiter", 8, 9.999999, "Moolatrikona"],
  ["Jupiter", 8, 10, "Own Sign"],
  ["Venus", 6, 14.999999, "Moolatrikona"],
  ["Venus", 6, 15, "Own Sign"],
  ["Saturn", 10, 19.999999, "Moolatrikona"],
  ["Saturn", 10, 20, "Own Sign"],
] as const;

for (const [planet, sign, degree, expected] of cases) {
  assert.equal(
    evaluateVedicDignity(planet, sign, degree),
    expected,
    `${planet} in sign index ${sign} at ${degree}° must be ${expected}`
  );
}

// Mercury's former defect specifically returned Moolatrikona for 20°–30° Virgo.
// Verify ordinary own-sign degrees all the way to the end of the sign.
assert.equal(evaluateVedicDignity("Mercury", 5, 25), "Own Sign");
assert.equal(evaluateVedicDignity("Mercury", 5, 29.999999), "Own Sign");

// Invalid degree/sign inputs must not generate an apparently valid dignity.
assert.throws(() => evaluateVedicDignity("Mercury", 5, -0.001), /in-sign degree/);
assert.throws(() => evaluateVedicDignity("Mercury", 5, 30), /in-sign degree/);
assert.throws(() => evaluateVedicDignity("Mercury", 12, 10), /sign index/);

console.log(
  "Parashari natal dignity suite passed: all seven BPHS sign-zone boundaries, Mercury's three Virgo zones, and invalid-input guards."
);
