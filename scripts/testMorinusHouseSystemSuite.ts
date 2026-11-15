import assert from "node:assert/strict";
import { calculateMorinusHouses } from "../lib/astronomy/morinusHouses";
import { SwissEphemerisEngine } from "../lib/astronomy/swissEphemeris";
import { calculateHouses as calculateLegacyHouses, calculateWesternChart, getHouseNumber } from "../lib/astronomy/ephemeris";
import { MultiSystemTransitEngine, TRANSIT_SYSTEM_PRESETS } from "../lib/astronomy/MultiSystemTransitEngine";
import {
  isWesternHouseSystemImplemented,
  recommendWesternHouseSystem,
  toWesternTransitHouseSystem,
} from "../lib/astronomy/westernHouseSystemPolicy";

interface PublishedTableFixture {
  name: string;
  armc: number;
  obliquity: number;
  /** Swiss Ephemeris table values rounded to the nearest arcminute:
   * [cusp 10, 11, 12, 1, 2, 3]. */
  primaryCusps: [number, number, number, number, number, number];
}

// Published Astrodienst / Swiss Ephemeris Morinus Tables of Houses.
// hts_M_e.pdf and hcs_M_e.pdf use the mean ecliptic of 2000-01-01,
// epsilon = 23°26'21". The tabulated cusp values are rounded to one minute,
// so comparisons allow less than 0.02° (72 arcseconds).
const publishedFixtures: PublishedTableFixture[] = [
  {
    name: "ARMC 0°00' (sidereal time 0h00m)",
    armc: 0,
    obliquity: 23 + 26 / 60 + 21 / 3600,
    primaryCusps: [
      0,
      27 + 55 / 60,
      57 + 49 / 60,
      90,
      122 + 11 / 60,
      152 + 5 / 60,
    ],
  },
  {
    name: "ARMC 0°15' (sidereal time 0h01m)",
    armc: 0.25,
    obliquity: 23 + 26 / 60 + 21 / 3600,
    primaryCusps: [
      14 / 60,
      28 + 9 / 60,
      58 + 5 / 60,
      90 + 16 / 60,
      122 + 26 / 60,
      152 + 20 / 60,
    ],
  },
  {
    name: "ARMC 16°30' (sidereal time 1h06m)",
    armc: 16.5,
    obliquity: 23 + 26 / 60 + 21 / 3600,
    primaryCusps: [
      15 + 12 / 60,
      44 + 2 / 60,
      75 + 20 / 60,
      107 + 54 / 60,
      138 + 57 / 60,
      167 + 35 / 60,
    ],
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

for (const fixture of publishedFixtures) {
  const actual = calculateMorinusHouses(fixture.armc, fixture.obliquity);
  const selectedIndices = [9, 10, 11, 0, 1, 2];
  for (let index = 0; index < selectedIndices.length; index += 1) {
    const cuspIndex = selectedIndices[index];
    check(
      angularDifference(actual.houseCusps[cuspIndex], fixture.primaryCusps[index]) < 0.02,
      fixture.name + ": cusp " + (cuspIndex + 1) + " matches the published table within 1.2 arcminutes"
    );
  }

  check(actual.houseCusps.length === 12, fixture.name + ": exactly twelve cusps");
  for (let index = 0; index < 12; index += 1) {
    check(
      angularDifference(actual.houseCusps[(index + 6) % 12], actual.houseCusps[index] + 180) < 1e-9,
      fixture.name + ": cusp " + (index + 1) + " is opposite its paired cusp"
    );
  }
  const spans = actual.houseCusps.map((cusp, index) =>
    normalize(actual.houseCusps[(index + 1) % 12] - cusp)
  );
  check(spans.every((span) => span > 0 && span < 180),
    fixture.name + ": house cusps are in increasing zodiacal order");
  check(Math.abs(spans.reduce((sum, span) => sum + span, 0) - 360) < 1e-8,
    fixture.name + ": house arcs close to 360°");

  for (let index = 0; index < 12; index += 1) {
    const current = actual.houseCusps[index];
    const next = actual.houseCusps[(index + 1) % 12];
    const midpoint = normalize(current + normalize(next - current) / 2);
    check(getHouseNumber(midpoint, actual.houseCusps) === index + 1,
      fixture.name + ": midpoint belongs to house " + (index + 1));
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
    () => calculateMorinusHouses(armc, obliquity),
    RangeError,
    "Reject invalid Morinus inputs"
  );
  assertions += 1;
}

const legacy = calculateLegacyHouses(0, 45, 23 + 26 / 60 + 21 / 3600, "Morinus");
check(angularDifference(legacy.cusps[9], 0) < 0.02 &&
  angularDifference(legacy.cusps[10], 27 + 55 / 60) < 0.02,
  "The legacy Western house helper also exposes Morinus cusps");

const swiss = new SwissEphemerisEngine();
const referenceDateJd = 2451545.0;
const latitudeFrames = [-80, -45, 0, 45, 80].map((latitude) =>
  swiss.calculateHouses(referenceDateJd, latitude, 0, "M")
);
for (const frame of latitudeFrames) {
  check(frame.houseSystemUsed === "M",
    "The astronomy facade reports Morinus as the method used");
  check(frame.houseCusps.length === 12 && frame.houseCusps.every(Number.isFinite),
    "Morinus returns twelve finite cusps at latitude " + latitudeFrames.indexOf(frame));
}
const baselineCusps = latitudeFrames[2].houseCusps;
for (const frame of latitudeFrames) {
  for (let index = 0; index < 12; index += 1) {
    check(angularDifference(frame.houseCusps[index], baselineCusps[index]) < 1e-8,
      "Morinus cusp " + (index + 1) + " is latitude-independent");
  }
}

const natal = calculateWesternChart(
  2000, 1, 1, 12, 0, 45, 0, 0, "Morinus"
);
check(natal.houseSystem === "Morinus" && natal.houses.length === 12,
  "The public Western natal calculator exposes twelve Morinus houses");
check(
  angularDifference(natal.houses[0].longitude, natal.ascendant.longitude) > 0.1,
  "Morinus cusp 1 remains distinct from the astronomical Ascendant"
);

const transitDate = new Date("2000-03-01T00:00:00.000Z");
const transit = new MultiSystemTransitEngine(
  { ...TRANSIT_SYSTEM_PRESETS.western, houseSystem: "morinus" },
  natal,
  undefined,
  transitDate
).calculateSystemTransits(transitDate);
check(transit.houseSystemUsed === "morinus",
  "The Western transit engine uses and reports Morinus houses");

const policy = recommendWesternHouseSystem("morinus-house-profile");
check(
  policy.status === "supported" &&
  policy.preferredSystem === "Morinus" &&
  policy.resolvedSystem === "Morinus" &&
  !policy.usedPolarFallback,
  "The named Morinus house profile selects the implemented calculation without a latitude fallback"
);
check(toWesternTransitHouseSystem("Morinus") === "morinus",
  "The shared natal-to-transit mapping includes Morinus");
check(isWesternHouseSystemImplemented("Morinus"),
  "The shared implementation registry recognises Morinus");

console.log(
  "Morinus reference/integration suite passed: " +
  assertions +
  " assertions against published Swiss Ephemeris Morinus tables."
);
