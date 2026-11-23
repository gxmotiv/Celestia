import assert from "node:assert/strict";
import { localCivilDateTimeToUtc } from "../lib/astronomy/civilTime";
import { ProgressionsEngine } from "../lib/astronomy/predictiveHellenisticEngine";
import { swissEphemeris } from "../lib/astronomy/swissEphemeris";

const cases = [
  {
    name: "India standard time converts local noon to UTC",
    actual: localCivilDateTimeToUtc("1990-01-01", "12:00", 5.5).toISOString(),
    expected: "1990-01-01T06:30:00.000Z",
  },
  {
    name: "midnight remains midnight before offset conversion",
    actual: localCivilDateTimeToUtc("2024-02-29", "00:00", 0).toISOString(),
    expected: "2024-02-29T00:00:00.000Z",
  },
  {
    name: "positive offset can roll UTC date to previous day",
    actual: localCivilDateTimeToUtc("2024-01-01", "00:15", 5.5).toISOString(),
    expected: "2023-12-31T18:45:00.000Z",
  },
  {
    name: "negative offset can roll UTC date to next day",
    actual: localCivilDateTimeToUtc("2024-01-01", "23:30", -5).toISOString(),
    expected: "2024-01-02T04:30:00.000Z",
  },
  {
    name: "fractional 15-minute offset is preserved",
    actual: localCivilDateTimeToUtc("2000-01-01", "12:00", 5.75).toISOString(),
    expected: "2000-01-01T06:15:00.000Z",
  },
];

for (const test of cases) {
  assert.equal(test.actual, test.expected, test.name);
  process.stdout.write("PASS " + test.name + "\n");
}

assert.throws(
  () => localCivilDateTimeToUtc("2023-02-29", "12:00", 0),
  RangeError,
  "rejects impossible calendar dates"
);
assert.throws(
  () => localCivilDateTimeToUtc("2024-01-01", "24:00", 0),
  RangeError,
  "rejects out-of-range clock times"
);
assert.throws(
  () => localCivilDateTimeToUtc("2024-01-01", "12:00", 15),
  RangeError,
  "rejects unsupported UTC offsets"
);

process.stdout.write("PASS invalid input guards\n");
process.stdout.write("All civil-time regression tests passed.\n");

const progressionBirth = new Date("1990-01-01T12:00:00.000Z");
const progressionNow = new Date("2025-01-01T12:00:00.000Z");
const progressionReport = new ProgressionsEngine().calculateProgressions(
  progressionBirth,
  progressionNow,
  40.7128,
  -74.006
);
assert.ok(progressionReport.moonSignChanges.length > 0, "progression fixture contains Moon sign ingresses");

for (const event of progressionReport.moonSignChanges) {
  const chronologicalMs = Date.parse(event.eventDate);
  assert.ok(Number.isFinite(chronologicalMs), "ingress event date is valid ISO UTC");
  assert.equal(new Date(chronologicalMs).getUTCFullYear(), event.year, "event year matches the mapped ingress date");

  // Invert the day-for-a-year mapping to recover the progressed ephemeris minute.
  const progressedMs = progressionBirth.getTime() +
    ((chronologicalMs - progressionBirth.getTime()) / (365.2422 * 86400000)) * 86400000;
  const ingressMinuteMs = Math.round(progressedMs / 60000) * 60000;
  const before = new Date(ingressMinuteMs - 60000);
  const at = new Date(ingressMinuteMs);
  const beforeJd = swissEphemeris.calculateJulianDay(
    before.getUTCFullYear(), before.getUTCMonth() + 1, before.getUTCDate(),
    before.getUTCHours(), before.getUTCMinutes()
  );
  const atJd = swissEphemeris.calculateJulianDay(
    at.getUTCFullYear(), at.getUTCMonth() + 1, at.getUTCDate(),
    at.getUTCHours(), at.getUTCMinutes()
  );
  const beforeMoon = swissEphemeris.calculatePlanetPosition(swissEphemeris.MOON, beforeJd);
  const atMoon = swissEphemeris.calculatePlanetPosition(swissEphemeris.MOON, atJd);
  assert.equal(beforeMoon.sign, event.fromSign, "minute before ingress remains in source sign");
  assert.equal(atMoon.sign, event.toSign, "ingress minute is in destination sign");
  assert.equal(
    event.age,
    Math.floor((chronologicalMs - progressionBirth.getTime()) / (365.2422 * 86400000)),
    "event age is completed chronological age"
  );
}
process.stdout.write("PASS progressed Moon ingress dates map to the actual sign-boundary minute\n");

assert.throws(
  () => new ProgressionsEngine().calculateProgressions(
    progressionBirth, new Date("1989-12-31T12:00:00.000Z"), 0, 0
  ),
  RangeError,
  "progressions reject a current date before birth"
);
process.stdout.write("PASS progression date validation\\n");
