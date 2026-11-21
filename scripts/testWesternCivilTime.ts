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

const ianaCases = [
  {
    name: "IANA winter rule resolves New York standard time",
    result: resolveIanaCivilDateTime("2024-01-15", "12:00", "America/New_York"),
    expectedUtc: "2024-01-15T17:00:00.000Z",
    expectedOffset: -5,
  },
  {
    name: "IANA summer rule resolves New York daylight time",
    result: resolveIanaCivilDateTime("2024-07-15", "12:00", "America/New_York"),
    expectedUtc: "2024-07-15T16:00:00.000Z",
    expectedOffset: -4,
  },
  {
    name: "IANA historical local-mean-time offset retains offset seconds",
    result: resolveIanaCivilDateTime("1880-01-01", "12:00", "America/New_York"),
    expectedUtc: "1880-01-01T16:56:02.000Z",
    expectedOffset: -(4 + 56 / 60 + 2 / 3600),
  },
];

for (const test of ianaCases) {
  assert.equal(test.result.status, "resolved", test.name + " status");
  if (test.result.status !== "resolved") throw new Error(test.name + " did not resolve");
  assert.equal(test.result.utcDate.toISOString(), test.expectedUtc, test.name + " UTC instant");
  assert.ok(Math.abs(test.result.offsetHours - test.expectedOffset) < 1e-9, test.name + " offset");
  process.stdout.write("PASS " + test.name + "\n");
}

const gap = resolveIanaCivilDateTime("2024-03-10", "02:30", "America/New_York");
assert.equal(gap.status, "nonexistent", "rejects a clock time skipped by the spring DST change");
process.stdout.write("PASS nonexistent DST wall time is rejected\n");

const overlap = resolveIanaCivilDateTime("2024-11-03", "01:30", "America/New_York");
assert.equal(overlap.status, "ambiguous", "does not silently choose during the autumn DST overlap");
if (overlap.status === "ambiguous") {
  assert.equal(overlap.candidates.length, 2, "autumn overlap has two valid UTC instants");
  assert.equal(overlap.candidates[0].utcDate.toISOString(), "2024-11-03T05:30:00.000Z");
  assert.equal(overlap.candidates[1].utcDate.toISOString(), "2024-11-03T06:30:00.000Z");
}
const earlier = resolveIanaCivilDateTime("2024-11-03", "01:30", "America/New_York", "earlier");
const later = resolveIanaCivilDateTime("2024-11-03", "01:30", "America/New_York", "later");
assert.equal(earlier.status, "resolved");
assert.equal(later.status, "resolved");
if (earlier.status === "resolved" && later.status === "resolved") {
  assert.equal(earlier.utcDate.toISOString(), "2024-11-03T05:30:00.000Z");
  assert.equal(later.utcDate.toISOString(), "2024-11-03T06:30:00.000Z");
}
process.stdout.write("PASS ambiguous DST wall time requires explicit earlier/later selection\n");

assert.throws(
  () => resolveIanaCivilDateTime("2024-01-01", "12:00", "Not/A_Real_Zone"),
  RangeError,
  "rejects unknown IANA time-zone identifiers"
);
process.stdout.write("PASS invalid IANA zone is rejected\n");

process.stdout.write("All civil-time regression tests passed.\n");
