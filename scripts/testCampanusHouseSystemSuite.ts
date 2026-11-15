import assert from "node:assert/strict";
import { calculateCampanusHouses } from "../lib/astronomy/campanusHouses";
import { SwissEphemerisEngine } from "../lib/astronomy/swissEphemeris";
import { calculateWesternChart, getHouseNumber } from "../lib/astronomy/ephemeris";
import { MultiSystemTransitEngine, TRANSIT_SYSTEM_PRESETS } from "../lib/astronomy/MultiSystemTransitEngine";

interface ReferenceFixture {
  name: string;
  armc: number;
  latitude: number;
  obliquity: number;
  ascendant: number;
  midheaven: number;
  cusps: number[];
  polarShifted?: boolean;
}

// Golden values captured independently from PySwissEph / Swiss Ephemeris
// 2.10.03 houses_armc(armc, latitude, obliquity, b"C"). The implementation
// under test is a separate prime-vertical plane-normal derivation.
const referenceFixtures: ReferenceFixture[] = [
  {
    name: "J2000 equator, ARMC 0°",
    armc: 0,
    latitude: 0,
    obliquity: 23.439166666666665,
    ascendant: 90,
    midheaven: 0,
    cusps: [
      90, 117.91057210343975, 147.81876515224323, 180,
      212.18123484775677, 242.08942789656027, 270,
      297.91057210343973, 327.81876515224326, 0,
      32.18123484775678, 62.08942789656025,
    ],
  },
  {
    name: "J2000 equator, ARMC 90°",
    armc: 90,
    latitude: 0,
    obliquity: 23.439166666666665,
    ascendant: 180,
    midheaven: 90,
    cusps: [
      180, 212.18123484775677, 242.08942789656027, 270,
      297.910572103440, 327.818765152756, 0,
      32.181234847756, 62.08942789656, 90,
      117.91057210344, 147.81876515224,
    ],
  },
  {
    name: "Northern midlatitude, ARMC 0°",
    armc: 0,
    latitude: 45,
    obliquity: 23.439166666666665,
    ascendant: 111.69143407807289,
    midheaven: 0,
    cusps: [
      111.69143407807289, 138.9142406559362, 159.29081115435534, 180,
      208.398333996441, 250.641252786018, 291.691434078073,
      318.914240655936, 339.290811154355, 0,
      28.398333996441, 70.641252786018,
    ],
  },
  {
    name: "Published midlatitude example",
    armc: 8.8485279795,
    latitude: 52.2166666666667,
    obliquity: 23.437101628,
    ascendant: 123.507983345667,
    midheaven: 9.629898683625,
    cusps: [
      123.507983345667, 150.798060162210, 170.242456082329, 189.629898683625,
      216.704863954147, 259.984762031008, 303.507983345667,
      330.798060162210, 350.242456082329, 9.629898683625,
      36.704863954147, 79.984762031008,
    ],
  },
  {
    name: "Southern midlatitude, ARMC 180°",
    armc: 180,
    latitude: -33.8688,
    obliquity: 23.439166666666665,
    ascendant: 284.948150932339,
    midheaven: 180,
    cusps: [
      284.948150932339, 312.143216537322, 335.366921357982, 0,
      31.266136542594, 69.646086982182, 104.948150932339,
      132.143216537322, 155.366921357982, 180,
      211.266136542594, 249.646086982182,
    ],
  },
  {
    name: "Northern high latitude below polar circle",
    armc: 0,
    latitude: 66.5,
    obliquity: 23.439166666666665,
    ascendant: 132.452907096732,
    midheaven: 0,
    cusps: [
      132.452907096732, 155.973531068351, 168.465611024685, 180,
      198.039602397503, 247.529684110482, 312.452907096732,
      335.973531068351, 348.465611024685, 0,
      18.039602397503, 67.529684110482,
    ],
  },
  {
    name: "Northern polar orientation shift",
    armc: 240,
    latitude: 80,
    obliquity: 23.439166666666665,
    ascendant: 18.888572144668,
    midheaven: 62.089427896560,
    polarShifted: true,
    cusps: [
      18.888572144668, 268.461537629661, 249.058733525119, 242.089427896560,
      236.549612960074, 228.531015344184, 198.888572144668,
      88.461537629661, 69.058733525119, 62.089427896560,
      56.549612960074, 48.531015344184,
    ],
  },
  {
    name: "Southern polar orientation shift",
    armc: 60,
    latitude: -80,
    obliquity: 23.439166666666665,
    ascendant: 198.888572144668,
    midheaven: 242.089427896560,
    polarShifted: true,
    cusps: [
      198.888572144668, 88.461537629661, 69.058733525119, 62.089427896560,
      56.549612960074, 48.531015344184, 18.888572144668,
      268.461537629661, 249.058733525119, 242.089427896560,
      236.549612960074, 228.531015344184,
    ],
  },
  {
    name: "Northern polar frame without shift",
    armc: 90,
    latitude: 80,
    obliquity: 23.439166666666665,
    ascendant: 180,
    midheaven: 90,
    cusps: [
      180, 226.335116040756, 252.351551119994, 270,
      287.648448880006, 313.664883959244, 0,
      46.335116040756, 72.351551119994, 90,
      107.648448880006, 133.664883959244,
    ],
  },
  {
    name: "Southern polar frame without shift",
    armc: 270,
    latitude: -80,
    obliquity: 23.439166666666665,
    ascendant: 0,
    midheaven: 270,
    cusps: [
      0, 46.335116040756, 72.351551119994, 90,
      107.648448880006, 133.664883959244, 180,
      226.335116040756, 252.351551119994, 270,
      287.648448880006, 313.664883959244,
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
  check(actual.polarShifted === Boolean(fixture.polarShifted),
    `${fixture.name}: polar orientation flag matches Swiss Ephemeris reference`);
  check(actual.houseCusps.length === 12,
    `${fixture.name}: exactly twelve cusps are returned`);

  for (let i = 0; i < 12; i += 1) {
    check(angularDifference(actual.houseCusps[i], fixture.cusps[i]) < 1e-7,
      `${fixture.name}: house ${i + 1} matches Swiss Ephemeris reference`);
    check(angularDifference(actual.houseCusps[(i + 6) % 12], actual.houseCusps[i] + 180) < 1e-7,
      `${fixture.name}: house ${i + 1} is exactly opposite house ${((i + 6) % 12) + 1}`);
  }

  const forwardTotal = actual.houseCusps.reduce((total, cusp, index) =>
    total + normalize(actual.houseCusps[(index + 1) % 12] - cusp), 0);
  const reverseTotal = actual.houseCusps.reduce((total, cusp, index) =>
    total + normalize(cusp - actual.houseCusps[(index + 1) % 12]), 0);
  const isForward = forwardTotal < reverseTotal;
  const chosenTotal = isForward ? forwardTotal : reverseTotal;
  check(Math.abs(chosenTotal - 360) < 1e-6,
    `${fixture.name}: house cusp sequence makes one complete zodiacal circuit`);

  // A point halfway inside every house must be assigned to that same house,
  // including the reversed cusp order produced by a polar orientation shift.
  for (let i = 0; i < 12; i += 1) {
    const current = actual.houseCusps[i];
    const next = actual.houseCusps[(i + 1) % 12];
    const arc = isForward ? normalize(next - current) : normalize(current - next);
    const midpoint = isForward
      ? normalize(current + arc / 2)
      : normalize(current - arc / 2);
    check(getHouseNumber(midpoint, actual.houseCusps) === i + 1,
      `${fixture.name}: house-assignment helper resolves midpoint of house ${i + 1}`);
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
check(invalidInputs === 5, "Reject non-finite and out-of-range Campanus inputs");
assert.throws(
  () => calculateCampanusHouses(0, 90, 23.439166666666665),
  /exact geographic poles/,
  "The pure Campanus calculator rejects the exact geographic poles"
);
assertions += 1;

const swiss = new SwissEphemerisEngine();
const frame = swiss.calculateHouses(2451545.0, 45, 0, "C");
check(frame.houseSystemUsed === "C",
  "The astronomy facade reports Campanus as the calculation actually used");
const poleFrame = swiss.calculateHouses(2451545.0, 90, 20, "C");
check(poleFrame.houseSystemUsed === "O" &&
  poleFrame.houseSystemNote?.includes("exact geographic poles") === true,
  "The exact-pole Campanus fallback reports Porphyry and explains why");
const transitDate = new Date("2000-03-01T00:00:00.000Z");
const transitChart = calculateWesternChart(
  2000, 1, 1, 12, 0, 45, 0, 0, "Campanus"
);
check(transitChart.houseSystem === "Campanus" && transitChart.houses.length === 12,
  "The public Western natal calculator exposes twelve Campanus houses");
const transit = new MultiSystemTransitEngine(
  { ...TRANSIT_SYSTEM_PRESETS.western, houseSystem: "campanus" },
  transitChart,
  undefined,
  transitDate
).calculateSystemTransits(transitDate);
check(transit.houseSystemUsed === "campanus",
  "The Western transit workflow uses and reports Campanus houses");

console.log(`Campanus reference/integration suite passed: ${assertions} assertions against Swiss Ephemeris 2.10.03 fixtures.`);
