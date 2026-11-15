import assert from "node:assert/strict";
import { calculateCampanusHouses } from "../lib/astronomy/campanusHouses";
import { SwissEphemerisEngine } from "../lib/astronomy/swissEphemeris";
import { calculateWesternChart } from "../lib/astronomy/ephemeris";
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
  cusps: number[];
}

// Golden values captured from the independent PySwissEph / Swiss Ephemeris
// 2.10.03 houses_armc(armc, latitude, obliquity, b"C") reference API.
// The calculator under test uses a separate prime-vertical vector derivation.
const referenceFixtures: ReferenceFixture[] = [
  {
    name: "J2000 equator, ARMC 0°",
    armc: 0,
    latitude: 0,
    obliquity: 23.439166666666665,
    ascendant: 90,
    midheaven: 0,
    cusps: [90, 117.910572103440, 147.818765152243, 180, 212.181234847757, 242.089427896560, 270, 297.910572103440, 327.818765152243, 0, 32.181234847757, 62.089427896560],
  },
  {
    name: "J2000 equator, ARMC 90°",
    armc: 90,
    latitude: 0,
    obliquity: 23.439166666666665,
    ascendant: 180,
    midheaven: 90,
    cusps: [180, 212.181234847757, 242.089427896560, 270, 297.910572103440, 327.818765152243, 0, 32.181234847757, 62.089427896560, 90, 117.910572103440, 147.818765152243],
  },
  {
    name: "Northern midlatitude, ARMC 0°",
    armc: 0,
    latitude: 45,
    obliquity: 23.439166666666665,
    ascendant: 111.691434078073,
    midheaven: 0,
    cusps: [111.691434078073, 138.914240655936, 159.290811154355, 180, 208.398333996441, 250.641252786018, 291.691434078073, 318.914240655936, 339.290811154355, 0, 28.398333996441, 70.641252786018],
  },
  {
    name: "New York latitude",
    armc: 120,
    latitude: 40.7128,
    obliquity: 23.4392911,
    ascendant: 203.740276959854,
    midheaven: 117.910549788060,
    cusps: [203.740276959854, 235.821917545556, 267.952854015066, 297.910549788060, 325.909172043539, 353.869383844505, 23.740276959854, 55.821917545556, 87.952854015066, 117.910549788060, 145.909172043539, 173.869383844505],
  },
  {
    name: "Sydney latitude",
    armc: 250,
    latitude: -33.8688,
    obliquity: 23.4392911,
    ascendant: 343.148157414224,
    midheaven: 251.533971263041,
    cusps: [343.148157414224, 13.013279860037, 42.214374805815, 71.533971263041, 101.646936519868, 132.462384202007, 163.148157414224, 193.013279860037, 222.214374805815, 251.533971263041, 281.646936519868, 312.462384202007],
  },
  {
    name: "Helsinki latitude",
    armc: 318.5,
    latitude: 60.1699,
    obliquity: 23.4392911,
    ascendant: 96.533077253406,
    midheaven: 316.041289526751,
    cusps: [96.533077253406, 120.194598940948, 129.040491276039, 136.041289526751, 145.961346449816, 178.380417122530, 276.533077253406, 300.194598940948, 309.040491276039, 316.041289526751, 325.961346449816, 358.380417122530],
  },
  {
    name: "Northern polar latitude",
    armc: 237.5,
    latitude: 70,
    obliquity: 23.4392911,
    ascendant: 59.295106649054,
    midheaven: 59.693691197757,
    cusps: [59.295106649054, 239.936889028583, 239.751317313636, 239.693691197757, 239.648990302998, 239.584156656693, 239.295106649054, 59.936889028583, 59.751317313636, 59.693691197757, 59.648990302998, 59.584156656693],
  },
  {
    name: "Southern polar latitude",
    armc: 57.5,
    latitude: -70,
    obliquity: 23.4392911,
    ascendant: 239.295106649054,
    midheaven: 239.693691197757,
    cusps: [239.295106649054, 59.936889028583, 59.751317313636, 59.693691197757, 59.648990302998, 59.584156656693, 59.295106649054, 239.936889028583, 239.751317313636, 239.693691197757, 239.648990302998, 239.584156656693],
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
  const actual = calculateCampanusHouses(
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
  for (let index = 0; index < 12; index += 1) {
    check(angularDifference(actual.houseCusps[index], fixture.cusps[index]) < 1e-7,
      `${fixture.name}: house ${index + 1} matches Swiss Ephemeris reference`);
    check(angularDifference(
      actual.houseCusps[(index + 6) % 12],
      actual.houseCusps[index] + 180
    ) < 1e-7,
    `${fixture.name}: house ${index + 1} is opposite house ${((index + 6) % 12) + 1}`);
  }
  const signedSpans = actual.houseCusps.map((cusp, index) => {
    const next = actual.houseCusps[(index + 1) % 12];
    return ((next - cusp + 540) % 360) - 180;
  });
  check(signedSpans.every((span) => Math.abs(span) > 0 && Math.abs(span) < 180),
    `${fixture.name}: adjacent Campanus cusps have finite non-zero arcs`);
  const expectedOrientation = actual.polarShifted ? -360 : 360;
  check(Math.abs(signedSpans.reduce((sum, span) => sum + span, 0) - expectedOrientation) < 1e-7,
    `${fixture.name}: twelve signed house arcs close in the documented polar orientation`);
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
check(invalidInputs === 5, "Reject non-finite and out-of-range Campanus inputs");

// The horizon-circle polar convention rotates the Campanus frame by 180°
// rather than substituting another house method.
const polar = calculateCampanusHouses(237.5, 70, 23.4392911);
check(polar.polarShifted,
  "Campanus applies the Swiss Ephemeris polar orientation correction");
check(angularDifference(polar.ascendant, 59.295106649054) < 1e-7,
  "Campanus northern polar Ascendant matches the independent reference");

const swiss = new SwissEphemerisEngine();
const frame = swiss.calculateHouses(
  2451545.0,
  40.7128,
  -74,
  "C"
);
check(frame.houseSystemUsed === "C",
  "The astronomy facade reports Campanus as the calculation actually used");
const fromFrame = calculateCampanusHouses(
  frame.localSiderealTime,
  40.7128,
  frame.obliquity
);
for (let index = 0; index < 12; index += 1) {
  check(angularDifference(frame.houseCusps[index], fromFrame.houseCusps[index]) < 0.001,
    `The astronomy facade returns Campanus cusp ${index + 1}`);
}

const natal = calculateWesternChart(
  2000, 1, 1, 12, 0,
  40.7128, -74, 0,
  "Campanus"
);
check(natal.houseSystem === "Campanus" && natal.houses.length === 12,
  "The Western natal workflow exposes twelve Campanus houses");

const polarNatal = calculateWesternChart(
  2000, 1, 1, 12, 0,
  70, 20, 1,
  "Campanus"
);
check(polarNatal.houseSystem === "Campanus" && !polarNatal.houseSystemNote,
  "A polar Campanus chart retains Campanus instead of silently switching to Porphyry");

const policy = recommendWesternHouseSystem("campanus-school-natal", 40.7128);
check(policy.status === "supported" &&
  policy.preferredSystem === "Campanus" &&
  policy.resolvedSystem === "Campanus",
  "An explicitly selected Campanus-school profile recommends Campanus");
check(isWesternHouseSystemImplemented("Campanus"),
  "The shared implementation registry recognises Campanus");
check(toWesternTransitHouseSystem("Campanus") === "campanus",
  "The shared mapping converts Campanus into the Western transit configuration key");

const transitDate = new Date("2000-03-01T00:00:00.000Z");
const transit = new MultiSystemTransitEngine(
  { ...TRANSIT_SYSTEM_PRESETS.western, houseSystem: "campanus" },
  natal,
  undefined,
  transitDate
).calculateSystemTransits(transitDate);
check(transit.houseSystemUsed === "campanus",
  "The Western transit workflow uses and reports Campanus houses");

console.log(`Campanus reference/integration suite passed: ${assertions} assertions against Swiss Ephemeris 2.10.03 fixtures.`);
