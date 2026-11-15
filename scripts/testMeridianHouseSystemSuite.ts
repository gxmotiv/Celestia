import assert from "node:assert/strict";
import { calculateMeridianHouses } from "../lib/astronomy/meridianHouses";
import { calculateMorinusHouses } from "../lib/astronomy/morinusHouses";
import { SwissEphemerisEngine } from "../lib/astronomy/swissEphemeris";
import {
  calculateHouses as calculateLegacyHouses,
  calculateWesternChart,
  getHouseNumber,
} from "../lib/astronomy/ephemeris";
import {
  MultiSystemTransitEngine,
  TRANSIT_SYSTEM_PRESETS,
} from "../lib/astronomy/MultiSystemTransitEngine";
import {
  isWesternHouseSystemImplemented,
  recommendWesternHouseSystem,
  toWesternTransitHouseSystem,
} from "../lib/astronomy/westernHouseSystemPolicy";

interface ReferenceFixture {
  armc: number;
  obliquity: number;
  /** Swiss Ephemeris 2.10.03 houses_armc(..., b"X"), all twelve cusps. */
  cusps: readonly number[];
}

const referenceFixtures: readonly ReferenceFixture[] = [
  {
    armc: 0,
    obliquity: 23.439166666666665,
    cusps: [90.00000000, 117.91057210, 147.81876515, 180.00000000, 212.18123485, 242.08942790, 270.00000000, 297.91057210, 327.81876515, 0.00000000, 32.18123485, 62.08942790],
  },
  {
    armc: 0.25,
    obliquity: 23.439166666666665,
    cusps: [90.22937096, 118.14946405, 148.07910819, 180.27248431, 212.44140133, 242.32817118, 270.22937096, 298.14946405, 328.07910819, 0.27248431, 32.44140133, 62.32817118],
  },
  {
    armc: 16.5,
    obliquity: 23.439166666666665,
    cusps: [105.20409974, 134.03367541, 165.33613647, 197.89290753, 228.95525370, 257.57792704, 285.20409974, 314.03367541, 345.33613647, 17.89290753, 48.95525370, 77.57792704],
  },
  {
    armc: 123.456,
    obliquity: 23.4392911,
    cusps: [215.76189251, 245.37707882, 273.17142623, 301.22656468, 331.43306458, 3.76597341, 35.76189251, 65.37707882, 93.17142623, 121.22656468, 151.43306458, 183.76597341],
  },
];

const angularDifference = (a: number, b: number) =>
  Math.abs((((a - b + 540) % 360) + 360) % 360 - 180);
const normalize = (value: number) => ((value % 360) + 360) % 360;

let assertions = 0;
function check(condition: unknown, message: string): void {
  assert.ok(condition, message);
  assertions += 1;
}

for (const fixture of referenceFixtures) {
  const actual = calculateMeridianHouses(fixture.armc, fixture.obliquity);
  check(actual.houseCusps.length === 12, "Reference ARMC " + fixture.armc + ": exactly twelve cusps");
  for (let index = 0; index < 12; index += 1) {
    check(
      angularDifference(actual.houseCusps[index], fixture.cusps[index]) < 0.000001,
      "Reference ARMC " + fixture.armc + ": cusp " + (index + 1) + " matches Swiss Ephemeris X"
    );
    check(
      angularDifference(actual.houseCusps[(index + 6) % 12], actual.houseCusps[index] + 180) < 1e-8,
      "Reference ARMC " + fixture.armc + ": opposite cusps remain 180° apart"
    );
  }

  const spans = actual.houseCusps.map((cusp, index) =>
    normalize(actual.houseCusps[(index + 1) % 12] - cusp)
  );
  check(spans.every((span) => span > 0 && span < 180),
    "Reference ARMC " + fixture.armc + ": cusps follow zodiacal order");
  check(Math.abs(spans.reduce((sum, span) => sum + span, 0) - 360) < 1e-8,
    "Reference ARMC " + fixture.armc + ": house arcs close to 360°");
  for (let index = 0; index < 12; index += 1) {
    const midpoint = normalize(actual.houseCusps[index] + spans[index] / 2);
    check(getHouseNumber(midpoint, actual.houseCusps) === index + 1,
      "Reference ARMC " + fixture.armc + ": midpoint belongs to house " + (index + 1));
  }
}

for (const [armc, obliquity] of [
  [Number.NaN, 23.4],
  [0, Number.POSITIVE_INFINITY],
  [0, Number.NaN],
  [0, -0.1],
  [0, 90],
] as const) {
  assert.throws(
    () => calculateMeridianHouses(armc, obliquity),
    RangeError,
    "Reject invalid Meridian inputs"
  );
  assertions += 1;
}

const morinus = calculateMorinusHouses(0, 23.439166666666665);
const meridian = calculateMeridianHouses(0, 23.439166666666665);
check(
  angularDifference(morinus.houseCusps[1], meridian.houseCusps[1]) > 1,
  "Meridian and Morinus use distinct transformations and do not share the same cusp calculation"
);

const swiss = new SwissEphemerisEngine();
const referenceDateJd = 2451545.0;
const latitudeFrames = [-80, -45, 0, 45, 80].map((latitude) =>
  swiss.calculateHouses(referenceDateJd, latitude, 0, "X")
);
for (const frame of latitudeFrames) {
  check(frame.houseSystemUsed === "X", "The facade reports Meridian / Axial Rotation as used");
  check(frame.houseCusps.length === 12 && frame.houseCusps.every(Number.isFinite),
    "Meridian returns twelve finite cusps for each tested latitude");
  const expected = calculateMeridianHouses(frame.localSiderealTime, frame.obliquity);
  check(
    frame.houseCusps.every((cusp, index) => angularDifference(cusp, expected.houseCusps[index]) < 0.0001),
    "The Swiss-compatible facade passes its actual ARMC and obliquity into the Meridian engine"
  );
}
const baselineCusps = latitudeFrames[2].houseCusps;
for (const frame of latitudeFrames) {
  for (let index = 0; index < 12; index += 1) {
    check(angularDifference(frame.houseCusps[index], baselineCusps[index]) < 1e-8,
      "Meridian cusp " + (index + 1) + " is latitude-independent");
  }
}

const latitudeFrame = swiss.calculateHouses(referenceDateJd, 45, 0, "X");
const ascendantToMidheaven = ((latitudeFrame.ascendant - latitudeFrame.midheaven + 540) % 360) - 180;
check(ascendantToMidheaven >= 0,
  "Meridian keeps the astronomical Ascendant on its conventional eastern orientation");

const legacy = calculateLegacyHouses(16.5, 45, 23.439166666666665, "Meridian");
const legacyReference = calculateMeridianHouses(16.5, 23.439166666666665);
check(
  legacy.cusps.every((cusp, index) => angularDifference(cusp, legacyReference.houseCusps[index]) < 1e-8),
  "The legacy Western house helper exposes the Meridian calculation"
);

const natal = calculateWesternChart(
  2000, 1, 1, 12, 0, 45, 0, 0, "Meridian"
);
check(natal.houseSystem === "Meridian" && natal.houses.length === 12,
  "The public Western natal calculator exposes twelve Meridian houses");
check(
  angularDifference(natal.houses[0].longitude, natal.ascendant.longitude) > 0.1,
  "Meridian cusp 1 remains distinct from the astronomical Ascendant"
);

const transitDate = new Date("2000-03-01T00:00:00.000Z");
const transit = new MultiSystemTransitEngine(
  { ...TRANSIT_SYSTEM_PRESETS.western, houseSystem: "meridian" },
  natal,
  undefined,
  transitDate
).calculateSystemTransits(transitDate);
check(transit.houseSystemUsed === "meridian",
  "The Western transit engine uses and reports Meridian houses");

const policy = recommendWesternHouseSystem("meridian-house-profile");
check(
  policy.status === "supported" &&
  policy.preferredSystem === "Meridian" &&
  policy.resolvedSystem === "Meridian" &&
  !policy.usedPolarFallback,
  "The named Meridian house profile selects the implemented method"
);
check(toWesternTransitHouseSystem("Meridian") === "meridian",
  "The shared natal-to-transit mapping includes Meridian");
check(isWesternHouseSystemImplemented("Meridian"),
  "The shared implementation registry recognises Meridian");

console.log(
  "Meridian / Axial Rotation reference/integration suite passed: " +
  assertions +
  " assertions against Swiss Ephemeris 2.10.03 X fixtures."
);
