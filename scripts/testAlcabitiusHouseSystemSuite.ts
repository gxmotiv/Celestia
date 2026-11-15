import assert from "node:assert/strict";
import { calculateAlcabitiusHouses } from "../lib/astronomy/alcabitiusHouses";
import { SwissEphemerisEngine } from "../lib/astronomy/swissEphemeris";
import { calculateWesternChart, getHouseNumber } from "../lib/astronomy/ephemeris";
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
  orientationAdjusted?: boolean;
  cusps: number[];
}

// Golden values captured with PySwissEph / Swiss Ephemeris 2.10.03
// houses_armc(armc, latitude, obliquity, b"B"). The tested engine is an
// independent semi-arc derivation; PySwissEph is not a runtime dependency.
const referenceFixtures: ReferenceFixture[] = [
  {
    name: "Equator, ARMC 0°",
    armc: 0, latitude: 0, obliquity: 23.439166666666665,
    ascendant: 90, midheaven: 0,
    cusps: [90, 117.91057210343975, 147.81876515224323, 180, 212.18123484775677, 242.08942789656027, 270, 297.91057210343973, 327.81876515224326, 0, 32.18123484775676, 62.08942789656025],
  },
  {
    name: "Northern midlatitude, ARMC 0°",
    armc: 0, latitude: 45, obliquity: 23.439166666666665,
    ascendant: 111.69143407807289, midheaven: 0,
    cusps: [111.69143407807289, 133.16023311268978, 156.03456652000153, 180, 220.22590587559168, 256.76871912171487, 291.6914340780729, 313.16023311268975, 336.03456652000153, 0, 40.22590587559167, 76.76871912171488],
  },
  {
    name: "Published midlatitude coordinate",
    armc: 8.8485279795, latitude: 52.2166666666667, obliquity: 23.439166666666665,
    ascendant: 123.50961406862766, midheaven: 9.630046335457951,
    cusps: [123.50961406862766, 144.53065682228913, 166.7811398206347, 189.63004633545796, 230.2797679376072, 267.08890963043524, 303.5096140686277, 324.53065682228913, 346.78113982063473, 9.630046335457951, 50.2797679376072, 87.08890963043524],
  },
  {
    name: "Southern midlatitude, ARMC 180°",
    armc: 180, latitude: -33.8688, obliquity: 23.439166666666665,
    ascendant: 284.9481509323391, midheaven: 180,
    cusps: [284.9481509323391, 308.3935583127512, 333.48884811882, 0, 37.768995992286136, 72.29651609883717, 104.9481509323391, 128.39355831275122, 153.48884811882, 180, 217.76899599228614, 252.2965160988372],
  },
  {
    name: "Northern high latitude below polar circle",
    armc: 0, latitude: 66.5, obliquity: 23.439166666666665,
    ascendant: 132.45290709673162, midheaven: 0,
    cusps: [132.45290709673162, 147.7609849462409, 163.68978037318212, 180, 227.4364972036241, 269.9490726632751, 312.4529070967316, 327.7609849462409, 343.6897803731821, 0, 47.43649720362411, 89.94907266327509],
  },
  {
    name: "Northern polar orientation, ARMC 240°",
    armc: 240, latitude: 80, obliquity: 23.439166666666665,
    ascendant: 18.888572144667876, midheaven: 242.08942789656024, orientationAdjusted: true,
    cusps: [18.888572144667876, 33.86265636821503, 48.269555622592485, 62.08942789656021, 104.56260480283186, 149.50758648008502, 198.88857214466788, 213.86265636821503, 228.2695556225925, 242.08942789656024, 284.56260480283186, 329.507586480085],
  },
  {
    name: "Southern polar orientation, ARMC 60°",
    armc: 60, latitude: -80, obliquity: 23.439166666666665,
    ascendant: 198.88857214466788, midheaven: 62.08942789656025, orientationAdjusted: true,
    cusps: [198.88857214466788, 213.862656368215, 228.26955562259252, 242.08942789656027, 284.5626048028319, 329.507586480085, 18.888572144667876, 33.86265636821497, 48.26955562259252, 62.08942789656025, 104.5626048028319, 149.507586480085],
  },
  {
    name: "Northern polar frame without adjustment",
    armc: 90, latitude: 80, obliquity: 23.439166666666665,
    ascendant: 180, midheaven: 90,
    cusps: [180, 212.1812348477568, 242.08942789656027, 270, 297.9105721034398, 327.81876515224326, 0, 32.1812348477568, 62.08942789656027, 90, 117.91057210343976, 147.81876515224326],
  },
  {
    name: "Southern polar frame without adjustment",
    armc: 270, latitude: -80, obliquity: 23.439166666666665,
    ascendant: 1e-10, midheaven: 270,
    cusps: [1e-10, 32.1812348476002, 62.08942789648841, 90, 117.91057210336788, 147.81876515208666, 180.0000000001, 212.1812348476002, 242.08942789648842, 270, 297.9105721033679, 327.81876515208666],
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
  const actual = calculateAlcabitiusHouses(fixture.armc, fixture.latitude, fixture.obliquity);
  check(angularDifference(actual.ascendant, fixture.ascendant) < 1e-7,
    fixture.name + ": Ascendant reference");
  check(angularDifference(actual.midheaven, fixture.midheaven) < 1e-7,
    fixture.name + ": Midheaven reference");
  check(actual.orientationAdjusted === Boolean(fixture.orientationAdjusted),
    fixture.name + ": orientation adjustment reference");
  check(actual.houseCusps.length === 12, fixture.name + ": twelve cusps");
  for (let index = 0; index < 12; index += 1) {
    check(angularDifference(actual.houseCusps[index], fixture.cusps[index]) < 1e-7,
      fixture.name + ": cusp " + (index + 1) + " reference");
    check(angularDifference(actual.houseCusps[(index + 6) % 12], actual.houseCusps[index] + 180) < 1e-7,
      fixture.name + ": opposite cusp " + (index + 1));
  }
  const spans = actual.houseCusps.map((cusp, index) => normalize(actual.houseCusps[(index + 1) % 12] - cusp));
  check(spans.every((span) => span > 0 && span < 180), fixture.name + ": forward zodiacal order");
  check(Math.abs(spans.reduce((sum, span) => sum + span, 0) - 360) < 1e-7, fixture.name + ": 360° closure");
  for (let index = 0; index < 12; index += 1) {
    const current = actual.houseCusps[index];
    const next = actual.houseCusps[(index + 1) % 12];
    const midpoint = normalize(current + normalize(next - current) / 2);
    check(getHouseNumber(midpoint, actual.houseCusps) === index + 1,
      fixture.name + ": midpoint assigned to house " + (index + 1));
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
  try { calculateAlcabitiusHouses(armc, latitude, obliquity); }
  catch (error) { if (error instanceof RangeError) invalidInputs += 1; }
}
check(invalidInputs === 5, "Reject invalid or non-finite Alcabitius inputs");
assert.throws(() => calculateAlcabitiusHouses(0, 90, 23.439166666666665),
  /exact geographic poles/, "Reject exact-pole semi-arc calculation");
assertions += 1;

const swiss = new SwissEphemerisEngine();
const frame = swiss.calculateHouses(2451545.0, 45, 0, "B");
check(frame.houseSystemUsed === "B", "Facade reports Alcabitius as the actual system");
const poleFrame = swiss.calculateHouses(2451545.0, 90, 20, "B");
check(poleFrame.houseSystemUsed === "O" &&
  poleFrame.houseSystemNote?.includes("exact geographic poles") === true,
  "Exact-pole fallback reports Porphyry and explains why");

const natal = calculateWesternChart(2000, 1, 1, 12, 0, 45, 0, 0, "Alcabitius");
check(natal.houseSystem === "Alcabitius" && natal.houses.length === 12,
  "Western natal calculator exposes twelve Alcabitius houses");
const transitDate = new Date("2000-03-01T00:00:00.000Z");
const transit = new MultiSystemTransitEngine(
  { ...TRANSIT_SYSTEM_PRESETS.western, houseSystem: "alcabitius" }, natal, undefined, transitDate
).calculateSystemTransits(transitDate);
check(transit.houseSystemUsed === "alcabitius", "Western transit engine calculates Alcabitius houses");

const policy = recommendWesternHouseSystem("alcabitius-school-natal", 45);
check(policy.status === "supported" && policy.preferredSystem === "Alcabitius" &&
  policy.resolvedSystem === "Alcabitius", "Named Alcabitius-school profile selects Alcabitius");
const polarPolicy = recommendWesternHouseSystem("alcabitius-school-natal", 90);
check(polarPolicy.preferredSystem === "Alcabitius" && polarPolicy.resolvedSystem === "Porphyry" &&
  polarPolicy.usedPolarFallback, "Exact-pole Alcabitius profile discloses Porphyry fallback");
check(isWesternHouseSystemImplemented("Alcabitius"), "Alcabitius is in the shared implementation registry");

console.log("Alcabitius reference/integration suite passed: " + assertions +
  " assertions against Swiss Ephemeris 2.10.03 fixtures.");
