import assert from "node:assert/strict";
import { calculateRegiomontanusHouses } from "../lib/astronomy/regiomontanusHouses";
import { SwissEphemerisEngine } from "../lib/astronomy/swissEphemeris";
import { calculateWesternChart } from "../lib/astronomy/ephemeris";
import { MultiSystemTransitEngine, TRANSIT_SYSTEM_PRESETS } from "../lib/astronomy/MultiSystemTransitEngine";

interface ReferenceFixture {
  name: string;
  armc: number;
  latitude: number;
  obliquity: number;
  ascendant: number;
  midheaven: number;
  cusps: number[];
}

// Golden values captured from the independent Swiss Ephemeris 2.10.03
// houses_armc(..., b"R") reference API. The implementation under test is a
// separate spherical-vector construction; no Swiss Ephemeris code is vendored.
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
    name: "Midlatitude published example",
    armc: 8.8485279795,
    latitude: 52.2166666666667,
    obliquity: 23.437101628,
    ascendant: 123.507983346,
    midheaven: 9.629898684,
    cusps: [123.507983346, 142.632833417, 162.025544868, 189.629898684, 233.86377991, 276.924805016, 303.507983346, 322.632833417, 342.025544868, 9.629898684, 53.86377991, 96.924805016],
  },
  {
    name: "Northern midlatitude",
    armc: 0,
    latitude: 45,
    obliquity: 23.439166666666665,
    ascendant: 111.691434078,
    midheaven: 0,
    cusps: [111.691434078, 132.845433956, 153.284069031, 180, 220.009511724, 262.484154851, 291.691434078, 312.845433956, 333.284069031, 0, 40.009511724, 82.484154851],
  },
  {
    name: "Northern polar latitude",
    armc: 90,
    latitude: 70,
    obliquity: 23.439166666666665,
    ascendant: 180,
    midheaven: 90,
    cusps: [180, 196.023395034, 220.746937433, 270, 319.253062567, 343.976604966, 0, 16.023395034, 40.746937433, 90, 139.253062567, 163.976604966],
  },
  {
    name: "Southern polar latitude",
    armc: 270,
    latitude: -70,
    obliquity: 23.439166666666665,
    ascendant: 0,
    midheaven: 270,
    cusps: [0, 16.023395034, 40.746937433, 90, 139.253062567, 163.976604966, 180, 196.023395034, 220.746937433, 270, 319.253062567, 343.976604966],
  },
  {
    name: "Northern polar latitude near 0° ARMC wrap",
    armc: 359.75,
    latitude: 66.5622222222,
    obliquity: 23.439166666666665,
    ascendant: 132.413239311,
    midheaven: 359.72751569,
    cusps: [132.413239311, 145.215300478, 158.070677259, 179.72751569, 235.756007076, 291.047208918, 312.413239311, 325.215300478, 338.070677259, 359.72751569, 55.756007076, 111.047208918],
  },
  {
    name: "Southern midlatitude",
    armc: 180,
    latitude: -33.8688,
    obliquity: 23.439166666666665,
    ascendant: 284.948150932,
    midheaven: 180,
    cusps: [284.948150932, 308.543930328, 331.685892622, 0, 37.101865742, 75.279395318, 104.948150932, 128.543930328, 151.685892622, 180, 217.101865742, 255.279395318],
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
  const actual = calculateRegiomontanusHouses(
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
      `${fixture.name}: house ${i + 1} is exactly opposite house ${((i + 6) % 12) + 1}`);
  }

  const arcLengths = actual.houseCusps.map((cusp, index) => {
    const next = actual.houseCusps[(index + 1) % 12];
    return (next - cusp + 360) % 360;
  });
  check(arcLengths.every((arc) => arc > 0 && arc < 180),
    `${fixture.name}: cusps remain in increasing zodiacal order`);
  check(Math.abs(arcLengths.reduce((sum, arc) => sum + arc, 0) - 360) < 1e-7,
    `${fixture.name}: twelve house arcs close to 360 degrees`);
}

let invalidInputRejected = 0;
for (const [armc, latitude, obliquity] of [
  [Number.NaN, 0, 23.4],
  [0, Number.POSITIVE_INFINITY, 23.4],
  [0, 90.1, 23.4],
  [0, -90.1, 23.4],
  [0, 45, Number.NaN],
] as const) {
  try {
    calculateRegiomontanusHouses(armc, latitude, obliquity);
  } catch (error) {
    if (error instanceof RangeError) invalidInputRejected += 1;
  }
}
check(invalidInputRejected === 5,
  "Reject non-finite ARMC/latitude/obliquity and latitude outside ±90°");

// Verify the public compatibility facade routes code "R" to the same
// numerical method and reports the system actually used.
const swissFacade = new SwissEphemerisEngine();
const frame = swissFacade.calculateHouses(
  2451545.0,
  52.2166666666667,
  8.8485279795,
  "R"
);
const expectedFrame = calculateRegiomontanusHouses(
  frame.localSiderealTime,
  52.2166666666667,
  frame.obliquity
);
check(frame.houseSystemUsed === "R",
  "The astronomy facade reports Regiomontanus rather than a fallback system");
for (let i = 0; i < 12; i += 1) {
  // The public facade rounds ARMC and obliquity to four decimal places
  // in its result metadata after computing cusps from full-precision inputs.
  // Allow for that rounded-input difference here; the independent golden
  // fixture tests above retain their 1e-7 degree precision.
  check(angularDifference(frame.houseCusps[i], expectedFrame.houseCusps[i]) < 0.001,
    `The astronomy facade returns the Regiomontanus cusp ${i + 1}`);
}

const natalChart = calculateWesternChart(
  2000, 1, 1, 12, 0,
  52.2166666666667, 8.8485279795, 1,
  "Regiomontanus"
);
check(natalChart.houseSystem === "Regiomontanus" &&
  natalChart.houses.length === 12,
  "The public Western natal calculator exposes twelve Regiomontanus houses");

const transitDate = new Date("2000-03-01T00:00:00.000Z");
const transitEngine = new MultiSystemTransitEngine(
  { ...TRANSIT_SYSTEM_PRESETS.western, houseSystem: "regiomontanus" },
  natalChart,
  undefined,
  transitDate
);
const transitResult = transitEngine.calculateSystemTransits(transitDate);
check(transitResult.houseSystemUsed === "regiomontanus",
  "The multi-system Western transit engine uses and reports Regiomontanus");

console.log(`Regiomontanus reference/integration suite passed: ${assertions} assertions against Swiss Ephemeris 2.10.03 fixtures.`);
