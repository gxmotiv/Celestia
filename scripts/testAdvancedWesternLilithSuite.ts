import { swissEphemeris } from "../lib/astronomy/swissEphemeris";
import { LunarPointsCalculator } from "../lib/astronomy/lunarPointsCalculator";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`[FAIL] ${message}`);
  console.log(`[PASS] ${message}`);
}

function angularDifference(a: number, b: number): number {
  const difference = Math.abs(((a - b) % 360 + 360) % 360);
  return Math.min(difference, 360 - difference);
}

const calculator = new LunarPointsCalculator();
const j2000 = calculator.calculateMeanLilithLon(2451545.0);
assert(angularDifference(j2000.lon, 263.3532465) < 0.00001, "Mean apogee is 263.3532465° at J2000.0");
assert(j2000.speed > 0.11 && j2000.speed < 0.112, "Mean apogee daily motion is approximately 0.1114°/day");
assert(j2000.lon >= 0 && j2000.lon < 360, "Mean apogee longitude is normalized");

const dates = [
  [1452, 4, 15, 21, 0],
  [2000, 1, 1, 12, 0],
  [2026, 11, 16, 12, 0],
];
for (const [year, month, day, hour, minute] of dates) {
  const jd = swissEphemeris.calculateJulianDay(year, month, day, hour, minute, 0, 0);
  const mean = calculator.calculateMeanLilithLon(jd);
  const osculating = calculator.calculateTrueLilithLon(jd);
  assert(Number.isFinite(mean.lon) && mean.lon >= 0 && mean.lon < 360, `Mean apogee is finite and normalized for ${year}`);
  assert(Number.isFinite(osculating.lon) && osculating.lon >= 0 && osculating.lon < 360, `Osculating apogee is finite and normalized for ${year}`);
  assert(Number.isFinite(osculating.speed) && Math.abs(osculating.speed) < 1, `Osculating apogee speed is finite and physically bounded for ${year}`);
  assert(angularDifference(mean.lon, osculating.lon) < 25, `Mean and osculating apogee remain in the same broad orbital neighborhood for ${year}`);
}

console.log("\nAdvanced Western lunar apogee regression suite completed.");
