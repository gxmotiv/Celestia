import assert from "node:assert/strict";
import { calculateWesternChart } from "../lib/astronomy/ephemeris";
import { KPCuspsCalculator } from "../lib/kp/kpCusps";
import { SubLordCalculator } from "../lib/kp/subLordEngine";
import { KPFourStepEngine } from "../lib/kp/kpFourStepEngine";
import { KPSignificators } from "../lib/kp/kpSignificators";
import type { KPCusps, KPPlanet } from "../lib/kp/kpTypes";


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
  Math.abs(arcSeconds(kp2193[0].endLongitude) - (7 / 120) * (7 / 120) * (360 / 27) * 3600) < 1e-7,
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

// Every table midpoint must resolve to the same hierarchical lords through
// the point-calculation path, so seed lookup and chart cusp assignment agree.
const subLordCalculator = new SubLordCalculator();
for (const entry of kp2193) {
  const resolved = subLordCalculator.calculateSubLord(entry.centerLongitude);
  assert.equal(resolved.starLord, entry.starLord, `KP 2193 row ${entry.seed} star lord`);
  assert.equal(resolved.subLord, entry.subLord, `KP 2193 row ${entry.seed} sub lord`);
  assert.equal(resolved.subSubLord, entry.subSubLord, `KP 2193 row ${entry.seed} sub-sub lord`);
}

// The six additional rows must correspond exactly to the six child intervals
// split by a zodiac-sign boundary, not to restarted parent subdivisions.
const signSplitPairCount = kp2193.filter((entry, index) => {
  if (index === 0) return false;
  const previous = kp2193[index - 1];
  return (
    Math.abs(previous.endLongitude - entry.startLongitude) < 1e-10 &&
    previous.signIndex + 1 === entry.signIndex &&
    previous.starLord === entry.starLord &&
    previous.subLord === entry.subLord &&
    previous.subSubLord === entry.subSubLord
  );
}).length;
assert.equal(signSplitPairCount, 6, "Exactly six micro-intervals should be split at sign boundaries");

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

// KP linear profile date interpolation: Jan 1, 1900 is exactly the
// declared epoch; each calendar year advances by the stated annual rate.
const kp1900Anchor = 22 + 22 / 60 + 14 / 3600;
const kpAnnualRate = 50.2388475;
const kpDaily1900 = kpAnnualRate / (365 * 3600);
assert.ok(
  Math.abs(KPCuspsCalculator.calculateKPAyanamsa(1900, 1, 1) - kp1900Anchor) < 1e-12,
  "KP linear profile must equal its exact 1900.0 anchor at the start of 1 January"
);
assert.ok(
  Math.abs(
    KPCuspsCalculator.calculateKPAyanamsa(1900, 1, 2) -
      (kp1900Anchor + kpDaily1900)
  ) < 1e-12,
  "KP linear profile must interpolate using actual day-of-year, not equal month lengths"
);
assert.ok(
  Math.abs(
    KPCuspsCalculator.calculateKPAyanamsa(1901, 1, 1) -
      (kp1900Anchor + kpAnnualRate / 3600)
  ) < 1e-12,
  "KP linear profile must advance exactly one annual rate between New Year anchors"
);
const kpLeapDay = KPCuspsCalculator.calculateKPAyanamsa(2000, 2, 29);
const kpMarchFirst = KPCuspsCalculator.calculateKPAyanamsa(2000, 3, 1);
assert.ok(
  Math.abs(kpMarchFirst - kpLeapDay - kpAnnualRate / (366 * 3600)) < 1e-12,
  "KP linear profile must interpolate leap-year dates over 366 days"
);
assert.throws(() => KPCuspsCalculator.calculateKPAyanamsa(2023, 2, 29), /outside the selected Gregorian month/);
assert.throws(() => KPCuspsCalculator.calculateKPAyanamsa(2024, 13, 1), /month must be between 1 and 12/);
assert.throws(() => KPCuspsCalculator.calculateKPAyanamsa(2024, 2, 1.5), /integer Gregorian year, month, and day/);

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


// Modern KP 4-Step/CIL must fail closed when source-chain data are absent.
// It must never invent house 1 or substitute Sun/Moon/Mars for missing links.
const fourStep = new KPFourStepEngine();
const emptyCusps = {} as unknown as KPCusps;
assert.throws(
  () => fourStep.evaluatePlanetFourStep("Pluto", emptyCusps, [], {}),
  /cannot evaluate missing planet Pluto/
);
const partialPlanet = {
  name: "Venus",
  starLord: "Sun",
  subLord: "Moon",
  house: 1,
} as unknown as KPPlanet;
assert.throws(
  () => fourStep.evaluatePlanetFourStep("Venus", emptyCusps, [partialPlanet], {}),
  /cannot resolve the star lord of Moon/
);
const missingStatusPlanet = {
  name: "Venus",
  starLord: "Sun",
  subLord: "Moon",
  house: 1,
} as unknown as KPPlanet;
const moonWithStar = {
  name: "Moon",
  starLord: "Mars",
  subLord: "Jupiter",
  house: 2,
} as unknown as KPPlanet;
assert.throws(
  () => fourStep.evaluatePlanetFourStep("Venus", emptyCusps, [missingStatusPlanet, moonWithStar], {}),
  /requires positional-status data for Venus/
);
assert.throws(
  () => fourStep.evaluatePlanetFourStep("Venus", emptyCusps, [partialPlanet], {}, 13),
  /target house must be between 1 and 12/
);
assert.throws(
  () => KPSignificators.getPlanetHouse(42, { cusps: [] } as unknown as KPCusps),
  /requires a finite longitude and twelve valid cusps/
);
assert.throws(
  () => KPSignificators.getPlanetHouse(42, {
    cusps: Array.from({ length: 12 }, (_, index) => index * 30),
  } as unknown as KPCusps),
  /could not assign longitude 42/
);
assert.throws(
  () => fourStep.calculateCuspalInterlinks(
    { houseDetails: [{}] } as unknown as KPCusps,
    [],
    {}
  ),
  /requires complete sign, star, sub, and sub-sub lord data for cusp 1/
);

console.log(
  "KP house-system isolation suite passed: KP always uses its own Placidus cusps and rejects unsupported polar fallbacks."
);
