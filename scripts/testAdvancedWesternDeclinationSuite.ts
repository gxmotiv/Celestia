import { calculateWesternChart } from "../lib/astronomy/ephemeris";
import { DeclinationCalculator } from "../lib/astronomy/advancedWesternCalculators";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`[FAIL] ${message}`);
  console.log(`[PASS] ${message}`);
}

const chart = calculateWesternChart(2000, 1, 1, 12, 0, 40.7128, -74.006, -5, "Placidus");
const sun = chart.planets.find((planet) => planet.name === "Sun");
if (!sun) throw new Error("Sun fixture not found");

const calculator = new DeclinationCalculator();
const highObliquityPoint = {
  ...sun,
  longitude: 90,
  latitude: -0.3,
};
const highEpoch = calculator.calculateAll([highObliquityPoint], 24.0);
assert(!highEpoch.declinations[0].isOutOfBounds, "Declination below a 24° epoch-specific obliquity is not flagged OOB");

const beyondHighObliquityPoint = {
  ...sun,
  longitude: 90,
  latitude: 1.0,
};
const beyondHighEpoch = calculator.calculateAll([beyondHighObliquityPoint], 24.0);
assert(beyondHighEpoch.declinations[0].isOutOfBounds, "Declination beyond a 24° epoch-specific obliquity is flagged OOB");

const modernEpoch = calculator.calculateAll([beyondHighObliquityPoint], 23.43929);
assert(modernEpoch.declinations[0].isOutOfBounds, "Modern obliquity threshold is applied when supplied");

console.log("\nAdvanced Western declination regression suite completed.");
