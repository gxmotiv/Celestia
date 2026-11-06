import { createBaZiClock, equationOfTimeMinutes } from "../lib/astronomy/timeEngine";

const results: { name: string; passed: boolean; expected: string; actual: string }[] = [];
function test(name: string, passed: boolean, expected: string, actual: string) {
  results.push({ name, passed, expected, actual });
}
function close(actual: number, expected: number, tolerance: number) {
  return Math.abs(actual - expected) <= tolerance;
}

const eotCases = [
  ["2024-02-11T12:00:00.000Z", -14.23],
  ["2024-05-14T12:00:00.000Z", 3.64],
  ["2024-07-26T12:00:00.000Z", -6.55],
  ["2024-11-03T12:00:00.000Z", 16.49],
] as const;
for (const [iso, expected] of eotCases) {
  const actual = equationOfTimeMinutes(new Date(iso));
  test("Meeus EOT benchmark " + iso, close(actual, expected, 0.03), expected.toFixed(2), actual.toFixed(4));
}

const instant = new Date("2024-03-15T19:30:00.000Z");
const civil = createBaZiClock(instant, {
  timeBasis: "civil-clock",
  longitudeDegrees: 77.209,
  civilUtcOffsetSeconds: 19800,
});
test("Civil clock applies supplied historical offset", civil.clockDate.toISOString() === "2024-03-16T01:00:00.000Z", "2024-03-16T01:00:00.000Z", civil.clockDate.toISOString());

const lmst = createBaZiClock(instant, { timeBasis: "local-mean-solar", longitudeDegrees: 77.209 });
test("LMST uses east-positive longitude times four minutes", lmst.clockDate.toISOString() === "2024-03-16T00:38:50.160Z", "2024-03-16T00:38:50.160Z", lmst.clockDate.toISOString());

const last = createBaZiClock(instant, { timeBasis: "local-apparent-solar", longitudeDegrees: 77.209 });
test("LAST equals LMST plus Equation of Time", Math.abs(last.clockDate.getTime() - (lmst.clockDate.getTime() + equationOfTimeMinutes(instant) * 60_000)) < 1, "LMST + EOT", last.clockDate.toISOString());

const west = createBaZiClock(instant, { timeBasis: "local-mean-solar", longitudeDegrees: -122.4194 });
test("West longitude moves local mean solar clock earlier", west.clockDate.getTime() < instant.getTime(), "earlier than UTC", west.clockDate.toISOString());

let invalid = false;
try { createBaZiClock(instant, { timeBasis: "civil-clock", longitudeDegrees: 77.2 }); } catch { invalid = true; }
test("Civil mode refuses missing resolved offset", invalid, "throws", String(invalid));

invalid = false;
try { createBaZiClock(instant, { timeBasis: "local-mean-solar", longitudeDegrees: 181 }); } catch { invalid = true; }
test("Longitude outside valid range is rejected", invalid, "throws", String(invalid));

invalid = false;
try { equationOfTimeMinutes(new Date("invalid")); } catch { invalid = true; }
test("Invalid UTC instant is rejected", invalid, "throws", String(invalid));

let passed = 0, failed = 0;
for (const result of results) {
  if (result.passed) passed++; else failed++;
  console.log("[" + (result.passed ? "PASS" : "FAIL") + "] " + result.name);
  if (!result.passed) console.log("  Expected: " + result.expected + "\n  Actual:   " + result.actual);
}
console.log("TOTAL TESTS: " + results.length);
console.log("PASSED: " + passed);
console.log("FAILED: " + failed);
if (failed > 0) process.exit(1);
