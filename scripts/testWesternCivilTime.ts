import assert from "node:assert/strict";
import { localCivilDateTimeToUtc, resolveIanaCivilDateTime } from "../lib/astronomy/civilTime";

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
