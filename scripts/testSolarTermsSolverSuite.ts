import { calculateSolarTermsForUtcYear, SOLAR_TERM_LONGITUDES_DEGREES } from "../lib/astronomy/solarTerms";

const results: { name: string; passed: boolean; expected: string; actual: string }[] = [];
function test(name: string, passed: boolean, expected: string, actual: string) {
  results.push({ name, passed, expected, actual });
}
const terms = calculateSolarTermsForUtcYear(2024);
test("A Gregorian year contains 24 solar-longitude crossings", terms.length === 24, "24", String(terms.length));
test("Solar-term longitudes contain every 15° boundary exactly once",
  terms.length === 24 && new Set(terms.map(term => term.targetLongitude)).size === 24 &&
    SOLAR_TERM_LONGITUDES_DEGREES.every(value => terms.some(term => term.targetLongitude === value)),
  "0,15,...,345 exactly once",
  terms.map(term => term.targetLongitude).join(","));
test("Every solved crossing has a <=1ms final bracket",
  terms.every(term => term.bracketWidthMilliseconds <= 1),
  "<=1ms",
  Math.max(...terms.map(term => term.bracketWidthMilliseconds)) + "ms");
test("Every solved crossing has a small longitude residual",
  terms.every(term => term.residualDegrees < 0.00001),
  "<0.00001°",
  Math.max(...terms.map(term => term.residualDegrees)).toExponential(3) + "°");
const lichun = terms.find(term => term.targetLongitude === 315);
const lichunIso = lichun?.instantUtc.toISOString() ?? "missing";
test("2024 Lichun crossing occurs in early February",
  !!lichun && lichun.instantUtc.getUTCMonth() === 1 && lichun.instantUtc.getUTCDate() >= 3 && lichun.instantUtc.getUTCDate() <= 6,
  "Feb 3–6 UTC",
  lichunIso);
const qingming = terms.find(term => term.targetLongitude === 15);
const qingmingIso = qingming?.instantUtc.toISOString() ?? "missing";
test("2024 Qingming crossing occurs in early April",
  !!qingming && qingming.instantUtc.getUTCMonth() === 3 && qingming.instantUtc.getUTCDate() >= 3 && qingming.instantUtc.getUTCDate() <= 6,
  "Apr 3–6 UTC",
  qingmingIso);
let passed=0,failed=0;
for(const result of results){if(result.passed)passed++;else failed++;console.log("["+(result.passed?"PASS":"FAIL")+"] "+result.name);if(!result.passed)console.log("  Expected: "+result.expected+"\n  Actual:   "+result.actual);}
console.log("TOTAL TESTS: "+results.length);
console.log("PASSED: "+passed);
console.log("FAILED: "+failed);
if(failed>0)process.exit(1);
