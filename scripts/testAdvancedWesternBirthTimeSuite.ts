import { swissEphemeris } from "../lib/astronomy/swissEphemeris";

type Case = {
  name: string;
  input: [number, number, number, number, number, number, number];
  expected: string;
};

const cases: Case[] = [
  {
    name: "India UTC+05:30 midnight rolls back into the prior year",
    input: [2000, 1, 1, 0, 30, 0, 5.5],
    expected: "1999-12-31T19:00:00.000Z",
  },
  {
    name: "UTC-05:00 midnight remains on the correct UTC date",
    input: [2024, 3, 15, 0, 30, 0, -5],
    expected: "2024-03-15T05:30:00.000Z",
  },
  {
    name: "00:00 is preserved as midnight rather than replaced with noon",
    input: [2000, 1, 1, 0, 0, 0, 0],
    expected: "2000-01-01T00:00:00.000Z",
  },
  {
    name: "UTC+14 correctly crosses into leap day",
    input: [2000, 3, 1, 0, 15, 0, 14],
    expected: "2000-02-29T10:15:00.000Z",
  },
  {
    name: "UTC-12 correctly crosses into the next year",
    input: [2000, 12, 31, 23, 30, 0, -12],
    expected: "2001-01-01T11:30:00.000Z",
  },
];

let failures = 0;
for (const testCase of cases) {
  const actual = swissEphemeris.createUTCDate(...testCase.input).toISOString();
  const passed = actual === testCase.expected;
  console.log(`[${passed ? "PASS" : "FAIL"}] ${testCase.name}`);
  if (!passed) {
    failures += 1;
    console.error(`  expected: ${testCase.expected}`);
    console.error(`  actual:   ${actual}`);
  }
}

console.log(`\n${cases.length - failures}/${cases.length} advanced Western birth-time cases passed.`);
if (failures > 0) throw new Error(`${failures} birth-time regression case(s) failed.`);
