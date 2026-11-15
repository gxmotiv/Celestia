import assert from "node:assert/strict";
import { calculateWesternChart } from "../lib/astronomy/ephemeris";
import { KPCuspsCalculator } from "../lib/kp/kpCusps";

const calculator = new KPCuspsCalculator();
const chartInputs = [2000, 1, 1, 12, 0, 40.7128, -74.006, 0] as const;
const westernPlacidus = calculateWesternChart(...chartInputs, "Placidus");
const westernWholeSign = calculateWesternChart(...chartInputs, "WholeSign");

const kpFromPlacidus = calculator.calculateKPCuspsFromWestern(
  westernPlacidus,
  2000,
  1,
  1
);
const kpFromWholeSign = calculator.calculateKPCuspsFromWestern(
  westernWholeSign,
  2000,
  1,
  1
);

assert.equal(kpFromPlacidus.cusps.length, 12);
assert.equal(kpFromWholeSign.cusps.length, 12);
assert.ok(kpFromPlacidus.cusps.every(Number.isFinite));
assert.ok(kpFromWholeSign.cusps.every(Number.isFinite));

// KP cusps must be independent of the separately selected Western natal
// house system because KP recomputes its own tropical Placidus framework.
for (let index = 0; index < 12; index += 1) {
  assert.ok(
    Math.abs(kpFromPlacidus.cusps[index] - kpFromWholeSign.cusps[index]) < 1e-10,
    `KP cusp ${index + 1} must be identical for Placidus and Whole Sign Western inputs`
  );
}

// The KP engine must fail closed when Placidus is unavailable rather than
// silently reporting a Porphyry or Whole Sign fallback as a KP chart.
const polarWesternChart = calculateWesternChart(
  2000,
  1,
  1,
  12,
  0,
  70,
  0,
  0,
  "WholeSign"
);
assert.throws(
  () => calculator.calculateKPCuspsFromWestern(polarWesternChart, 2000, 1, 1),
  /KP requires Placidus house cusps/
);

// Without original coordinates, a non-Placidus chart cannot be repurposed.
const chartWithoutBirthGeometry = {
  ...westernWholeSign,
  birthLatitude: undefined,
  birthLongitude: undefined,
};
assert.throws(
  () => calculator.calculateKPCuspsFromWestern(chartWithoutBirthGeometry, 2000, 1, 1),
  /cannot be reused as KP house geometry/
);

console.log(
  "KP house-system isolation suite passed: KP always uses its own Placidus cusps and rejects unsupported polar fallbacks."
);
