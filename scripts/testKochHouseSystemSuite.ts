import assert from "node:assert/strict";
import { calculateKochHouses } from "../lib/astronomy/kochHouses";
import { SwissEphemerisEngine } from "../lib/astronomy/swissEphemeris";
import { calculateWesternChart } from "../lib/astronomy/ephemeris";
import { MultiSystemTransitEngine, TRANSIT_SYSTEM_PRESETS } from "../lib/astronomy/MultiSystemTransitEngine";
import {
  isWesternHouseSystemImplemented,
  recommendWesternHouseSystem,
} from "../lib/astronomy/westernHouseSystemPolicy";

interface ReferenceFixture {
  name: string;
  armc: number;
  latitude: number;
  obliquity: number;
  ascendant: number;
  midheaven: number;
  cusps: number[];
}

// Golden values captured from the independent PySwissEph / Swiss Ephemeris
// 2.10.03 houses_armc(armc, latitude, obliquity, b"K") reference API.
// The implementation below is an independent trigonometric derivation.
const referenceFixtures: ReferenceFixture[] = [
  {
    name: "J2000 equator, ARMC 0°",
    armc: 0,
    latitude: 0,
    obliquity: 23.439166666666665,
    ascendant: 90,
    midheaven: 0,
    cusps: [90, 117.910572103, 147.818765152, 180, 212.181234848, 242.089427897, 270, 297.910572103, 327.818765152, 0, 32.181234848, 62.089427897],
  },
  {
    name: "J2000 equator, ARMC 90°",
    armc: 90,
    latitude: 0,
    obliquity: 23.439166666666665,
    ascendant: 180,
    midheaven: 90,
    cusps: [180, 212.181234848, 242.089427897, 270, 297.910572103, 327.818765152, 0, 32.181234848, 62.089427897, 90, 117.910572103, 147.818765152],
  },
  {
    name: "Northern midlatitude, ARMC 0°",
    armc: 0,
    latitude: 45,
    obliquity: 23.439166666666665,
    ascendant: 111.691434078,
    midheaven: 0,
    cusps: [111.691434078, 134.683719015, 157.249554793, 180, 231.56530266, 265.973145469, 291.691434078, 314.683719015, 337.249554793, 0, 51.56530266, 85.973145469],
  },
  {
    name: "Published midlatitude example",
    armc: 8.8485279795,
    latitude: 52.2166666666667,
    obliquity: 23.437101628,
    ascendant: 123.507983346,
    midheaven: 9.629898684,
    cusps: [123.507983346, 145.556826115, 167.52463266, 189.629898684, 248.138082421, 279.700139349, 303.507983346, 325.556826115, 347.52463266, 9.629898684, 68.138082421, 99.700139349],
  },
  {
    name: "Southern midlatitude, ARMC 180°",
    armc: 180,
    latitude: -33.8688,
    obliquity: 23.439166666666665,
    ascendant: 284.948150932,
    midheaven: 180,
    cusps: [284.948150932, 309.962684733, 334.778980074, 0, 43.462347132, 77.514584462, 104.948150932, 129.962684733, 154.778980074, 180, 223.462347132, 257.514584462],
  },
  {
    name: "Tropical latitude, ARMC 270°",
    armc: 270,
    latitude: 23.5,
    obliquity: 23.439166666666665,
    ascendant: 0,
    midheaven: 270,
    cusps: [0, 34.394709571, 64.347193508, 90, 115.652806492, 145.605290429, 180, 214.394709571, 244.347193508, 270, 295.652806492, 325.605290429],
  },
  {
    name: "Northern high latitude below polar circle",
    armc: 0,
    latitude: 60,
    obliquity: 23.439166666666665,
    ascendant: 124.565551565,
    midheaven: 0,
    cusps: [124.565551565, 142.962916844, 161.374439587, 180, 258.074744729, 284.887258319, 304.565551565, 322.962916844, 341.374439587, 0, 78.074744729, 104.887258319],
  },
  {
    name: "Near northern Koch polar limit",
    armc: 0,
    latitude: 66.5,
    obliquity: 23.439166666666665,
    ascendant: 132.452907097,
    midheaven: 0,
    cusps: [132.452907097, 147.768725497, 163.695639942, 180, 283.523546128, 297.772834538, 312.452907097, 327.768725497, 343.695639942, 0, 103.523546128, 117.772834538],
  },
  {
    name: "Southern high latitude below polar circle",
    armc: 180,
    latitude: -60,
    obliquity: 23.439166666666665,
    ascendant: 304.565551565,
    midheaven: 180,
    cusps: [304.565551565, 322.962916844, 341.374439587, 0, 78.074744729, 104.887258319, 124.565551565, 142.962916844, 161.374439587, 180, 258.074744729, 284.887258319],
  },
];

const angularDifference = (a: number, b: number) =>
  Math.abs((((a - b + 540) % 360) + 360) % 360 - 180);

let assertions = 0;
function check(condition: unknown, message: string): void {
  assert.ok(condition, message);
  assertions += 1;
}

for (const fixture of referenceFixtures) {
  const actual = calculateKochHouses(
    fixture.armc,
    fixture.latitude,
    fixture.obliquity
  );
  check(angularDifference(actual.ascendant, fixture.ascendant) < 1e-7,
    `${fixture.name}: Ascendant matches Swiss Ephemeris reference`);
  check(angularDifference(actual.midheaven, fixture.midheaven) < 1e-7,
    `${fixture.name}: Midheaven matches Swiss Ephemeris reference`);
  check(actual.houseCusps.length === 12,
    `${fixture.name}: exactly twelve cusps are returned`);
  for (let i = 0; i < 12; i += 1) {
    check(angularDifference(actual.houseCusps[i], fixture.cusps[i]) < 1e-7,
      `${fixture.name}: house ${i + 1} matches Swiss Ephemeris reference`);
    check(angularDifference(actual.houseCusps[(i + 6) % 12], actual.houseCusps[i] + 180) < 1e-7,
      `${fixture.name}: house ${i + 1} is opposite house ${((i + 6) % 12) + 1}`);
  }
  const spans = actual.houseCusps.map((cusp, index) =>
    (actual.houseCusps[(index + 1) % 12] - cusp + 360) % 360
  );
  check(spans.every((span) => span > 0 && span < 180),
    `${fixture.name}: cusps are in increasing zodiacal order`);
  check(Math.abs(spans.reduce((sum, span) => sum + span, 0) - 360) < 1e-7,
    `${fixture.name}: house arcs close to 360 degrees`);
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
    calculateKochHouses(armc, latitude, obliquity);
  } catch (error) {
    if (error instanceof RangeError) invalidInputs += 1;
  }
}
check(invalidInputs === 5, "Reject non-finite and out-of-range Koch inputs");

assert.throws(
  () => calculateKochHouses(0, 70, 23.439166666666665),
  /undefined within the polar circle/,
  "The pure Koch calculator rejects polar-circle coordinates rather than inventing cusps"
);
assertions += 1;

const swiss = new SwissEphemerisEngine();
const frame = swiss.calculateHouses(
  2451545.0,
  52.2166666666667,
  8.8485279795,
  "K"
);
check(frame.houseSystemUsed === "K",
  "The astronomy facade reports Koch as the calculation actually used");
const fromFrame = calculateKochHouses(
  frame.localSiderealTime,
  52.2166666666667,
  frame.obliquity
);
for (let i = 0; i < 12; i += 1) {
  check(angularDifference(frame.houseCusps[i], fromFrame.houseCusps[i]) < 0.001,
    `The astronomy facade returns Koch cusp ${i + 1}`);
}

const natal = calculateWesternChart(
  2000, 1, 1, 12, 0,
  52.2166666666667, 8.8485279795, 1,
  "Koch"
);
check(natal.houseSystem === "Koch" && natal.houses.length === 12,
  "The Western natal workflow exposes twelve Koch houses");

const polarNatal = calculateWesternChart(
  2000, 1, 1, 12, 0,
  70, 20, 1,
  "Koch"
);
check(polarNatal.houseSystem === "Porphyry" &&
  polarNatal.houseSystemNote?.includes("Koch") === true,
  "A polar Koch request visibly reports its Porphyry fallback");

const policy = recommendWesternHouseSystem("koch-school-natal", 52.2);
check(policy.status === "supported" &&
  policy.preferredSystem === "Koch" &&
  policy.resolvedSystem === "Koch",
  "The named Koch-school natal profile selects the implemented Koch calculation");
check(isWesternHouseSystemImplemented("Koch"),
  "The shared implementation registry recognises Koch");

const transitDate = new Date("2000-03-01T00:00:00.000Z");
const transit = new MultiSystemTransitEngine(
  { ...TRANSIT_SYSTEM_PRESETS.western, houseSystem: "koch" },
  natal,
  undefined,
  transitDate
).calculateSystemTransits(transitDate);
check(transit.houseSystemUsed === "koch",
  "The Western transit workflow uses and reports Koch houses");

console.log(`Koch reference/integration suite passed: ${assertions} assertions against Swiss Ephemeris 2.10.03 fixtures.`);
