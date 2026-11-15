import assert from "node:assert/strict";
import { calculateWesternChart } from "../lib/astronomy/ephemeris";
import { KPCuspsCalculator } from "../lib/kp/kpCusps";\nimport { SubLordCalculator } from "../lib/kp/subLordEngine";


const kp249 = SubLordCalculator.generate249Table();
const kp2193 = SubLordCalculator.generate2193Table();

assert.equal(kp249.length, 249, "KP 1-249 table must retain 249 sign-local divisions");
assert.equal(kp2193.length, 2193, "KP 1-2193 table must contain 2,187 base intervals plus six sign-boundary splits");
assert.deepEqual(
  kp2193.map((entry) => entry.seed),
  Array.from({ length: 2193 }, (_, index) => index + 1),
  "KP 1-2193 seeds must be contiguous and one-based"
);

// Published KP 1-2193 reference (AstroNeemo, updated 2016-08-01):
// the first Ketu/Ketu/Ketu interval runs from 0° to 0°02'43⅓",
// followed by Ketu/Ketu/Venus ending at 0°10'30".
const arcSeconds = (degrees: number) => degrees * 3600;
assert.equal(kp2193[0].starLord, "Ketu");
assert.equal(kp2193[0].subLord, "Ketu");
assert.equal(kp2193[0].subSubLord, "Ketu");
assert.ok(
  Math.abs(arcSeconds(kp2193[0].endLongitude) - (7 / 120) * (7 / 120) * (360 / 27) * 3600 + 0) < 1e-7,
  "First KP micro-division must be 7/120 of the Ketu sub, itself 7/120 of a nakshatra"
);
assert.ok(
  Math.abs(arcSeconds(kp2193[1].endLongitude) - 10.5 * 60) < 1e-7,
  "Second published KP 1-2193 interval must end at 0°10'30"
);
assert.equal(kp2193[1].subSubLord, "Venus");

// The published reference groups the same longitude subdivisions in Aries,
// Leo and Sagittarius: rows 1, 732 and 1463 are equivalent local positions.
for (const equivalentSeed of [732, 1463]) {
  const equivalent = SubLordCalculator.getHorary2193Entry(equivalentSeed);
  assert.equal(equivalent.starLord, kp2193[0].starLord);
  assert.equal(equivalent.subLord, kp2193[0].subLord);
  assert.equal(equivalent.subSubLord, kp2193[0].subSubLord);
  assert.ok(
    Math.abs((equivalent.startLongitude % 30) - (kp2193[0].startLongitude % 30)) < 1e-10,
    `KP seed ${equivalentSeed} must represent the same sign-local subdivision`
  );
}

// One sub-sub interval straddles the Aries/Taurus boundary. It must be split
// at 30° without restarting its proportion or changing its three lords.
const beforeSignBoundary = kp2193[191];
const afterSignBoundary = kp2193[192];
assert.equal(beforeSignBoundary.seed, 192);
assert.equal(afterSignBoundary.seed, 193);
assert.equal(beforeSignBoundary.subLord, "Rahu");
assert.equal(beforeSignBoundary.subSubLord, "Saturn");
assert.equal(afterSignBoundary.subLord, "Rahu");
assert.equal(afterSignBoundary.subSubLord, "Saturn");
assert.ok(Math.abs(beforeSignBoundary.endLongitude - 30) < 1e-10);
assert.ok(Math.abs(afterSignBoundary.startLongitude - 30) < 1e-10);
assert.equal(beforeSignBoundary.signName, "Aries");
assert.equal(afterSignBoundary.signName, "Taurus");
assert.ok(Math.abs(afterSignBoundary.endLongitude - (30 + 6.333333333333 / 60)) < 1e-8);

// Every interval is ordered, contiguous, positive-width, and contained in one sign.
assert.ok(Math.abs(kp2193[0].startLongitude) < 1e-12);
assert.ok(Math.abs(kp2193[kp2193.length - 1].endLongitude - 360) < 1e-10);
for (let index = 0; index < kp2193.length; index += 1) {
  const entry = kp2193[index];
  assert.ok(entry.endLongitude > entry.startLongitude, `KP 2193 row ${index + 1} must have positive width`);
  assert.equal(entry.signIndex, Math.floor(entry.startLongitude / 30));
  assert.ok(
    entry.endLongitude <= (entry.signIndex + 1) * 30 + 1e-10,
    `KP 2193 row ${index + 1} must not cross a sign boundary`
  );
  if (index > 0) {
    assert.ok(
      Math.abs(entry.startLongitude - kp2193[index - 1].endLongitude) < 1e-10,
      `KP 2193 rows ${index} and ${index + 1} must be contiguous`
    );
  }
}

assert.equal(SubLordCalculator.getHorary2193Entry(2193).seed, 2193);
assert.equal(SubLordCalculator.getHorary2193Entry(2194).seed, 2193);
assert.equal(SubLordCalculator.getHorary2193Entry(0).seed, 1);

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

// KP must retain the exact cusp longitude even near the end of a sign.
// Snapping 29°30' to the next sign would alter its sign lord and star/sub.
const lateSignCuspChart = {
  ...westernPlacidus,
  birthLatitude: undefined,
  birthLongitude: undefined,
  houses: westernPlacidus.houses.map((house, index) =>
    index === 0 ? { ...house, longitude: 29.5 } : house
  ),
};
const lateSignKp = calculator.calculateKPCuspsFromWestern(
  lateSignCuspChart,
  2000,
  1,
  1
);
const expectedExactCusp = ((29.5 - lateSignKp.ayanamsa) % 360 + 360) % 360;
assert.ok(
  Math.abs(lateSignKp.cusps[0] - expectedExactCusp) < 1e-10,
  "KP preserves the exact late-sign cusp instead of snapping it to the next sign"
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
