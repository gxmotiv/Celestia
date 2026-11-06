import { swissEphemeris } from "../lib/astronomy/swissEphemeris";
import { calculateWesternChart } from "../lib/astronomy/ephemeris";

const results: { name: string; passed: boolean; expected: string; actual: string }[] = [];
function test(name: string, passed: boolean, expected: string, actual: string) {
  results.push({ name, passed, expected, actual });
}
const jd = swissEphemeris.calculateJulianDay(2024, 6, 21, 12, 0, 0, 0);
const normal = swissEphemeris.calculateHouses(jd, 40, 0, "P");
test("Ordinary-latitude Placidus remains Placidus", !normal.fallbackApplied && normal.requestedSystem === "P" && normal.actualSystem === "P", "requested P / actual P / no fallback", JSON.stringify(normal));
const polar = swissEphemeris.calculateHouses(jd, 89, 0, "P");
test("Polar Placidus failure is disclosed as Equal fallback", polar.fallbackApplied && polar.requestedSystem === "P" && polar.actualSystem === "E" && !!polar.fallbackReason, "requested P / actual E / reason", JSON.stringify({requested:polar.requestedSystem,actual:polar.actualSystem,fallback:polar.fallbackApplied,reason:polar.fallbackReason}));
test("Equal-house fallback has twelve finite cusps", polar.houseCusps.length === 12 && polar.houseCusps.every(Number.isFinite), "12 finite cusps", JSON.stringify(polar.houseCusps));
const equal = swissEphemeris.calculateHouses(jd, 89, 0, "E");
test("Explicit Equal houses are not labelled as fallback", !equal.fallbackApplied && equal.requestedSystem === "E" && equal.actualSystem === "E", "requested E / actual E / no fallback", JSON.stringify(equal));
const whole = swissEphemeris.calculateHouses(jd, 89, 0, "W");
test("Whole Sign houses remain available at polar latitude", !whole.fallbackApplied && whole.requestedSystem === "W" && whole.actualSystem === "W", "requested W / actual W / no fallback", JSON.stringify(whole));
const chart = calculateWesternChart(2024, 6, 21, 12, 0, 89, 0, 0, "Placidus");
test("Western chart exposes requested and actual house system", chart.requestedHouseSystem === "Placidus" && chart.houseSystem === "Equal" && chart.houseSystemFallback, "Placidus requested / Equal actual / fallback true", JSON.stringify({requested:chart.requestedHouseSystem,actual:chart.houseSystem,fallback:chart.houseSystemFallback}));
let invalid = false;
try { swissEphemeris.calculateHouses(jd, 91, 0, "P"); } catch { invalid = true; }
test("Latitude outside geographic bounds is rejected", invalid, "throws", String(invalid));
let passed=0,failed=0;
for(const result of results){if(result.passed)passed++;else failed++;console.log("["+(result.passed?"PASS":"FAIL")+"] "+result.name);if(!result.passed)console.log("  Expected: "+result.expected+"\n  Actual:   "+result.actual);}
console.log("TOTAL TESTS: "+results.length);
console.log("PASSED: "+passed);
console.log("FAILED: "+failed);
if(failed>0)process.exit(1);
