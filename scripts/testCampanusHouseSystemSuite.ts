import assert from "node:assert/strict";
import { calculateCampanusHouses } from "../lib/astronomy/campanusHouses";
import { SwissEphemerisEngine } from "../lib/astronomy/swissEphemeris";
import { calculateWesternChart, getHouseNumber } from "../lib/astronomy/ephemeris";
import { MultiSystemTransitEngine, TRANSIT_SYSTEM_PRESETS } from "../lib/astronomy/MultiSystemTransitEngine";
import {
  isWesternHouseSystemImplemented,
  recommendWesternHouseSystem,
  toWesternTransitHouseSystem,
} from "../lib/astronomy/westernHouseSystemPolicy";

interface ReferenceFixture {
  name: string;
  armc: number;
  latitude: number;
  obliquity: number;
  ascendant: number;
  midheaven: number;
  polarShifted: boolean;
  cusps: number[];
}

// Golden values captured independently with PySwissEph / Swiss Ephemeris
// 2.10.03: swe.houses_armc(armc, latitude, obliquity, b"C").
// The implementation under test is an independent vector/plane intersection.
const referenceFixtures: ReferenceFixture[] = [
  {
    name: "J2000 equator, ARMC 0°",
    armc: 0,
    latitude: 0,
    obliquity: 23.439166666666665,
    ascendant: 90,
    midheaven: 0,
    polarShifted: false,
    cusps: [90, 117.910572103440, 147.818765152243, 180, 212.181234847757, 242.089427896560, 270, 297.910572103440, 327.818765152243, 0, 32.181234847757, 62.089427896560],
  },
  {
    name: "J2000 equator, ARMC 90°",
    armc: 90,
    latitude: 0,
    obliquity: 23.439166666666665,
    ascendant: 180,
    midheaven: 90,
    polarShifted: false,
    cusps: [180, 212.181234847757, 242.089427896560, 270, 297.910572103440, 327.818765152243, 0, 32.181234847757, 62.089427896560, 90, 117.910572103440, 147.818765152243],
  },
  {
    name: "Published Osnabrück midlatitude example",
    armc: 8.8485279795,
    latitude: 52.2166666666667,
    obliquity: 23.437101628,
    ascendant: 123.507983345667,
    midheaven: 9.629898683625,
    polarShifted: false,
    cusps: [123.507983345667, 150.798060162210, 170.242456082329, 189.629898683625, 216.704863954147, 259.984762031008, 303.507983345667, 330.798060162210, 350.242456082329, 9.629898683625, 36.704863954147, 79.984762031008],
  },
  {
    name: "Northern midlatitude, ARMC 0°",
    armc: 0,
    latitude: 45,
    obliquity: 23.439166666666665,
    ascendant: 111.691434078073,
    midheaven: 0,
    polarShifted: false,
    cusps: [111.691434078073, 138.914240655936, 159.290811154355, 180, 208.398333996441, 250.641252786018, 291.691434078073, 318.914240655936, 339.290811154355, 0, 28.398333996441, 70.641252786018],
  },
  {
    name: "Southern midlatitude, ARMC 180°",
    armc: 180,
    latitude: -33.8688,
    obliquity: 23.439166666666665,
    ascendant: 284.948150932339,
    midheaven: 180,
    polarShifted: false,
    cusps: [284.948150932339, 312.143216537322, 335.366921357982, 0, 31.266136542594, 69.646086982182, 104.948150932339, 132.143216537322, 155.366921357982, 180, 211.266136542594, 249.646086982182],
  },
  {
    name: "Northern polar latitude without orientation shift",
    armc: 90,
    latitude: 70,
    obliquity: 23.439166666666665,
    ascendant: 180,
    midheaven: 90,
    polarShifted: false,
    cusps: [180, 220.019493875615, 248.348069506127, 270, 291.651930493873, 319.980506124385, 0, 40.019493875615, 68.348069506127, 90, 111.651930493873, 139.980506124385],
  },
  {
    name: "Northern polar latitude with 180° orientation shift",
    armc: 270,
    latitude: 70,
    obliquity: 23.439166666666665,
    ascendant: 0,
    midheaven: 90,
    polarShifted: true,
    cusps: [0, 275.931949113065, 271.983618772672, 270, 268.016381227328, 264.068050886935, 180, 95.931949113065, 91.983618772672, 90, 88.016381227328, 84.068050886935],
  },
  {
    name: "Southern polar latitude with 180° orientation shift",
    armc: 90,
    latitude: -70,
    obliquity: 23.439166666666665,
    ascendant: 180,
    midheaven: 270,
    polarShifted: true,
    cusps: [180, 95.931949113065, 91.983618772672, 90, 88.016381227328, 84.068050886935, 0, 275.931949113065, 271.983618772672, 270, 268.016381227328, 264.068050886935],
  },
  {
    name: "Near-polar ARMC wrap",
    armc: 359.75,
    latitude: 66.5622222222,
    obliquity: 23.439166666666665,
    ascendant: 132.413239310732,
    midheaven: 359.727515690273,
    polarShifted: false,
    cusps: [132.413239310732, 155.858319056657, 168.272753410323, 179.727515690273, 197.657797606708, 247.175224335028, 312.413239310732, 335.858319056657, 348.272753410323, 359.727515690273, 17.657797606708, 67.175224335028],
  },
];

const angularDifference = (a: number, b: number) =>
  Math.abs((((a - b + 540) % 360) + 360) % 360 - 180);
const normalize = (value: number) => ((value % 360) + 360) % 360;
const signedStep = (from: number, to: number) =>
  ((to - from + 540) % 360) - 180;

let assertions = 0;
function check(condition: unknown, message: string): void {
  assert.ok(condition, message);
  assertions += 1;
}

for (const fixture of referenceFixtures) {
  const actual = calculateCampanusHouses(
    fixture.armc,
    fixture.latitude,
    fixture.obliquity
  );
  check(angularDifference(actual.ascendant, fixture.ascendant) < 1e-7,
    fixture.name + ": Ascendant matches Swiss Ephemeris 2.10.03");
  check(angularDifference(actual.midheaven, fixture.midheaven) < 1e-7,
    fixture.name + ": Midheaven matches Swiss Ephemeris 2.10.03");
  check(actual.polarShifted === fixture.polarShifted,
    fixture.name + ": polar orientation state is correct");
  check(actual.houseCusps.length === 12,
    fixture.name + ": exactly twelve cusps are returned");

  for (let i = 0; i < 12; i += 1) {
    check(angularDifference(actual.houseCusps[i], fixture.cusps[i]) < 1e-7,
      fixture.name + ": cusp " + (i + 1) + " matches Swiss Ephemeris 2.10.03");
    check(angularDifference(
      actual.houseCusps[(i + 6) % 12],
      actual.houseCusps[i] + 180
    ) < 1e-7,
    fixture.name + ": cusp " + (i + 1) + " is opposite cusp " + (((i + 6) % 12) + 1));
  }

  const signedSpans = actual.houseCusps.map((cusp, index) =>
    signedStep(cusp, actual.houseCusps[(index + 1) % 12])
  );
  const direction = fixture.polarShifted ? -1 : 1;
  check(signedSpans.every((span) => direction * span > 0 && direction * span < 180),
    fixture.name + ": cusps follow one consistent house direction");
  check(Math.abs(signedSpans.reduce((sum, span) => sum + span, 0) - direction * 360) < 1e-7,
    fixture.name + ": twelve directed house arcs close to 360 degrees");

  for (let i = 0; i < 12; i += 1) {
    const cusp = actual.houseCusps[i];
    check(getHouseNumber(cusp, actual.houseCusps) === i + 1,
      fixture.name + ": exact cusp " + (i + 1) + " belongs to house " + (i + 1));
    const width = direction * signedSpans[i];
    const midpoint = normalize(cusp + direction * width / 2);
    check(getHouseNumber(midpoint, actual.houseCusps) === i + 1,
      fixture.name + ": midpoint of house " + (i + 1) + " is assigned correctly");
  }
}

let invalidInputs = 0;
for (const [armc, latitude, obliquity] of [
  [Number.NaN, 0, 23.4],
  [0, Number.POSITIVE_INFINITY, 23.4],
  [0, 90.1, 23.4],
  [0, -90.1, 23.4],
  [0, 45, Number.NaN],
] as const) {
  try {
    calculateCampanusHouses(armc, latitude, obliquity);
  } catch (error) {
    if (error instanceof RangeError) invalidInputs += 1;
  }
}
check(invalidInputs === 5,
  "Reject non-finite ARMC/latitude/obliquity and latitude outside ±90°");
assert.throws(
  () => calculateCampanusHouses(0, 90, 23.439166666666665),
  /indeterminate at the geographic poles/,
  "Reject the exactly geographic pole instead of fabricating a local east/north direction"
);
assertions += 1;

const swissFacade = new SwissEphemerisEngine();
const frame = swissFacade.calculateHouses(
  2451545.0,
  52.2166666666667,
  8.8485279795,
  "C"
);
check(frame.houseSystemUsed === "C",
  "The astronomy facade reports Campanus as the method actually calculated");
const frameReference = calculateCampanusHouses(
  frame.localSiderealTime,
  52.2166666666667,
  frame.obliquity
);
for (let i = 0; i < 12; i += 1) {
  check(angularDifference(frame.houseCusps[i], frameReference.houseCusps[i]) < 0.001,
    "The public astronomy facade returns Campanus cusp " + (i + 1));
}

const natal = calculateWesternChart(
  2000, 1, 1, 12, 0,
  52.2166666666667, 8.8485279795, 1,
  "Campanus"
);
check(natal.requestedHouseSystem === "Campanus" &&
  natal.houseSystem === "Campanus" && natal.houses.length === 12,
  "The Western natal workflow exposes twelve Campanus houses");

const polarNatal = calculateWesternChart(
  2000, 1, 1, 12, 0,
  70, -90, 0,
  "Campanus"
);
check(polarNatal.houseSystem === "Campanus" &&
  polarNatal.houseSystemNote?.includes("polar orientation") === true,
  "A polar Campanus chart keeps the system and discloses its orientation adjustment");

const transitDate = new Date("2000-03-01T00:00:00.000Z");
const transitEngine = new MultiSystemTransitEngine(
  { ...TRANSIT_SYSTEM_PRESETS.western, houseSystem: "campanus" },
  natal,
  undefined,
  transitDate
);
const transitResult = transitEngine.calculateSystemTransits(transitDate);
check(transitResult.houseSystemUsed === "campanus",
  "The Western transit workflow uses and reports Campanus houses");
for (let i = 0; i < 12; i += 1) {
  check(transitEngine.calculateHouse(natal.houses[i].longitude) === i + 1,
    "The Western transit house mapper preserves Campanus cusp " + (i + 1));
}

const policy = recommendWesternHouseSystem("campanus-school-natal", 52.2);
check(policy.status === "supported" &&
  policy.preferredSystem === "Campanus" &&
  policy.resolvedSystem === "Campanus",
  "The named Campanus-school natal profile selects the implemented Campanus calculation");
check(isWesternHouseSystemImplemented("Campanus"),
  "The central registry recognises Campanus as implemented");
check(toWesternTransitHouseSystem("Campanus") === "campanus",
  "The central policy maps Campanus to the Western transit engine");

console.log("Campanus reference/integration suite passed: " + assertions + " assertions against Swiss Ephemeris 2.10.03 fixtures.");
