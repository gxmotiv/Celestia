import { parseBirthClockTime } from "../lib/astronomy/timeInput";

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

test("Midnight 00:00 remains 00:00", show("00:00") === "00:00", "00:00", show("00:00"));
test("Midnight hour with nonzero minutes is preserved", show("00:45") === "00:45", "00:45", show("00:45"));
test("Noon is preserved", show("12:00") === "12:00", "12:00", show("12:00"));
test("Late evening is preserved", show("23:59") === "23:59", "23:59", show("23:59"));
test("Invalid hour uses fallback", show("24:00") === "12:00", "12:00", show("24:00"));
test("Invalid minute uses fallback", show("12:60") === "12:00", "12:00", show("12:60"));
test("Missing value uses fallback", show("") === "12:00", "12:00", show(""));
test("Malformed one-digit hour uses fallback", show("9:05") === "12:00", "12:00", show("9:05"));
const nonString = parseBirthClockTime(null as unknown as string);
test("Non-string legacy value uses fallback", nonString.hour === 12 && nonString.minute === 0, "12:00", nonString.hour.toString().padStart(2, "0") + ":" + nonString.minute.toString().padStart(2, "0"));

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
