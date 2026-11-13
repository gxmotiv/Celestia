import { isRelationshipChartTimeReady, parseBirthClockTime } from "../lib/astronomy/timeInput";

interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

const results: TestResult[] = [];
function test(name: string, passed: boolean, expected: string, actual: string) {
  results.push({ name, passed, expected, actual });
}

function show(value: string) {
  const parsed = parseBirthClockTime(value);
  return parsed.hour.toString().padStart(2, "0") + ":" + parsed.minute.toString().padStart(2, "0");
}
function usedFallback(value: string) {
  return parseBirthClockTime(value).usedFallback;
}

test("Midnight 00:00 remains 00:00", show("00:00") === "00:00", "00:00", show("00:00"));
test("Midnight hour with nonzero minutes is preserved", show("00:45") === "00:45", "00:45", show("00:45"));
test("Noon is preserved", show("12:00") === "12:00", "12:00", show("12:00"));
test("Late evening is preserved", show("23:59") === "23:59", "23:59", show("23:59"));
test("Valid time is not marked as a fallback", !usedFallback("23:59"), "usedFallback=false", String(usedFallback("23:59")));
test("Invalid hour returns a marked placeholder", show("24:00") === "12:00" && usedFallback("24:00"), "12:00, usedFallback=true", show("24:00") + ", usedFallback=" + usedFallback("24:00"));
test("Invalid minute returns a marked placeholder", show("12:60") === "12:00" && usedFallback("12:60"), "12:00, usedFallback=true", show("12:60") + ", usedFallback=" + usedFallback("12:60"));
test("Missing value returns a marked placeholder", show("") === "12:00" && usedFallback(""), "12:00, usedFallback=true", show("") + ", usedFallback=" + usedFallback(""));
test("Malformed one-digit hour uses fallback", show("9:05") === "12:00", "12:00", show("9:05"));
const nonString = parseBirthClockTime(null as unknown as string);
test("Non-string legacy value uses fallback", nonString.hour === 12 && nonString.minute === 0 && nonString.usedFallback, "12:00 with usedFallback=true",  nonString.hour.toString().padStart(2, "0") + ":" + nonString.minute.toString().padStart(2, "0"));

const readyBase = {
  birthDate: "2000-01-01",
  birthTime: "12:30",
  timezoneMode: "automatic" as const,
  hasResolvedInstant: false,
  manualOffsetConfirmed: false,
  timezoneOffset: 5.5,
};
test(
  "Automatic relationship time is ready only with a resolver-produced instant",
  isRelationshipChartTimeReady({ ...readyBase, hasResolvedInstant: true }),
  "true",
  String(isRelationshipChartTimeReady({ ...readyBase, hasResolvedInstant: true }))
);
test(
  "Automatic ambiguous time without a selected candidate remains on hold",
  !isRelationshipChartTimeReady(readyBase),
  "false",
  String(isRelationshipChartTimeReady(readyBase))
);
test(
  "Manual relationship time requires explicit confirmation",
  !isRelationshipChartTimeReady({ ...readyBase, timezoneMode: "manual", manualOffsetConfirmed: false }),
  "false",
  String(isRelationshipChartTimeReady({ ...readyBase, timezoneMode: "manual", manualOffsetConfirmed: false }))
);
test(
  "Confirmed in-range manual offset permits relationship reports",
  isRelationshipChartTimeReady({ ...readyBase, timezoneMode: "manual", manualOffsetConfirmed: true }),
  "true",
  String(isRelationshipChartTimeReady({ ...readyBase, timezoneMode: "manual", manualOffsetConfirmed: true }))
);
test(
  "Manual offset outside supported range remains on hold",
  !isRelationshipChartTimeReady({ ...readyBase, timezoneMode: "manual", manualOffsetConfirmed: true, timezoneOffset: 14.5 }),
  "false",
  String(isRelationshipChartTimeReady({ ...readyBase, timezoneMode: "manual", manualOffsetConfirmed: true, timezoneOffset: 14.5 }))
);
test(
  "Invalid Gregorian date remains on hold even with a resolved UTC candidate",
  !isRelationshipChartTimeReady({ ...readyBase, birthDate: "2024-02-30", hasResolvedInstant: true }),
  "false",
  String(isRelationshipChartTimeReady({ ...readyBase, birthDate: "2024-02-30", hasResolvedInstant: true }))
);
test(
  "Invalid clock time remains on hold even with a resolved UTC candidate",
  !isRelationshipChartTimeReady({ ...readyBase, birthTime: "24:00", hasResolvedInstant: true }),
  "false",
  String(isRelationshipChartTimeReady({ ...readyBase, birthTime: "24:00", hasResolvedInstant: true }))
);

let passed = 0;
let failed = 0;
for (const result of results) {
  if (result.passed) passed++;
  else failed++;
  console.log("[" + (result.passed ? "PASS" : "FAIL") + "] " + result.name);
  if (!result.passed) {
    console.log("  Expected: " + result.expected);
    console.log("  Actual:   " + result.actual);
  }
}
console.log("TOTAL TESTS: " + results.length);
console.log("PASSED: " + passed);
console.log("FAILED: " + failed);
if (failed > 0) process.exit(1);
