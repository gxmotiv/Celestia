import { calculateWesternChart } from "../lib/astronomy/ephemeris";
import { MidpointCalculator } from "../lib/astronomy/advancedWesternCalculators";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`[FAIL] ${message}`);
  console.log(`[PASS] ${message}`);
}

const chart = calculateWesternChart(2000, 1, 1, 12, 0, 40.7128, -74.006, -5, "Placidus");
const calculator = new MidpointCalculator();
const planetsOnly = calculator.calculateAllMidpoints(chart.planets);
const angles = [
  { ...chart.ascendant, name: "ASC" },
  { ...chart.midheaven, name: "MC" },
];
const complete = calculator.calculateAllMidpoints(chart.planets, angles);

assert(complete.length > planetsOnly.length, "Adding natal angles expands the midpoint matrix");
assert(complete.some((item) => item.planet1 === "Sun" && item.planet2 === "ASC"), "Sun/ASC midpoint is calculated");
assert(complete.some((item) => item.planet1 === "Sun" && item.planet2 === "MC"), "Sun/MC midpoint is calculated");
assert(complete.some((item) => item.planet1 === "ASC" && item.planet2 === "MC"), "ASC/MC midpoint is calculated");
assert(complete.every((item) => item.dial90 >= 0 && item.dial90 < 90), "All midpoint 90° dial values remain normalized");
assert(complete.some((item) => item.planet1 === "NorthNode" || item.planet2 === "NorthNode"), "North Node remains included in midpoint calculations");
assert(complete.some((item) => item.planet1 === "SouthNode" || item.planet2 === "SouthNode"), "South Node is included in midpoint calculations");

console.log("\nAdvanced Western midpoint regression suite completed.");
