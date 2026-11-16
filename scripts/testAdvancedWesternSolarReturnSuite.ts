import { calculateWesternChart, normalizeDegrees } from "../lib/astronomy/ephemeris";
import { SolarReturnEngine } from "../lib/astronomy/predictiveHellenisticEngine";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`[FAIL] ${message}`);
  console.log(`[PASS] ${message}`);
}

function angularDifference(a: number, b: number): number {
  const difference = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return Math.min(difference, 360 - difference);
}

function expectThrow(action: () => unknown, message: string): void {
  let threw = false;
  try {
    action();
  } catch {
    threw = true;
  }
  assert(threw, message);
}

const natalChart = calculateWesternChart(
  2000, 6, 15, 12, 0, 40.7128, -74.006, -5, "Placidus"
);
const engine = new SolarReturnEngine();
const newYork = engine.calculateSolarReturn(
  natalChart,
  2026,
  40.7128,
  -74.006,
  "Placidus"
);
const tokyo = engine.calculateSolarReturn(
  natalChart,
  2026,
  35.6762,
  139.6503,
  "Placidus"
);
const natalSun = natalChart.planets.find((planet) => planet.name === "Sun");
if (!natalSun) throw new Error("Natal Sun fixture missing.");

assert(newYork.targetYear === 2026, "Report identifies the requested return year");
assert(newYork.returnInstantUTC.startsWith("2026-"), "Exact return instant belongs to the requested UTC year");
assert(new Date(newYork.returnInstantUTC).getUTCMonth() === 5, "June natal Sun returns during June in this test fixture");
assert(
  angularDifference(newYork.returnSunLongitude, natalSun.longitude) < 0.001,
  "Return-chart Sun longitude matches the natal Sun longitude within 0.001 degrees"
);
assert(
  angularDifference(
    newYork.returnChart.planets.find((planet) => planet.name === "Sun")!.longitude,
    natalSun.longitude
  ) < 0.001,
  "The Solar Return chart itself contains the returned natal Sun longitude"
);
assert(newYork.returnChart.houses.length === 12, "Solar Return chart contains twelve house cusps");
assert(newYork.houseSystem === "Placidus", "Solar Return report preserves the selected house system");
assert(newYork.returnChart.houseSystem === "Placidus", "Solar Return chart uses the requested house system");
assert(
  newYork.returnInstantUTC === tokyo.returnInstantUTC,
  "Solar Return instant is independent of the location used to cast the return chart"
);
assert(
  angularDifference(newYork.returnChart.ascendant.longitude, tokyo.returnChart.ascendant.longitude) > 0.1,
  "Changing return location changes the Solar Return Ascendant"
);
assert(
  newYork.returnChart.houses.some((house, index) =>
    angularDifference(house.longitude, tokyo.returnChart.houses[index].longitude) > 0.1
  ),
  "Changing return location changes one or more Solar Return house cusps"
);
assert(
  newYork.latitude === 40.7128 && newYork.longitude === -74.006,
  "The report identifies the coordinates used to cast the return chart"
);

expectThrow(
  () => engine.calculateSolarReturn(natalChart, 2026, 91, 0),
  "Invalid return latitude is rejected"
);
expectThrow(
  () => engine.calculateSolarReturn(natalChart, 2026, 0, 181),
  "Invalid return longitude is rejected"
);
expectThrow(
  () => engine.calculateSolarReturn(natalChart, 99, 0, 0),
  "Out-of-range return year is rejected"
);

console.log("\nAdvanced Western Solar Return regression suite completed.");
