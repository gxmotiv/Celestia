import { calculateWesternChart, normalizeDegrees } from "../lib/astronomy/ephemeris";
import {
  SolarArcDirectionsEngine,
  ProgressionsEngine,
} from "../lib/astronomy/predictiveHellenisticEngine";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`[FAIL] ${message}`);
  console.log(`[PASS] ${message}`);
}

function angularDifference(a: number, b: number): number {
  const difference = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return Math.min(difference, 360 - difference);
}

const birthDate = new Date("2000-01-01T12:00:00.000Z");
const currentDate = new Date("2026-11-16T12:00:00.000Z");
const chart = calculateWesternChart(2000, 1, 1, 12, 0, 40.7128, -74.006, -5, "Placidus");
const engine = new SolarArcDirectionsEngine();
const report = engine.calculateSolarArc(
  chart,
  birthDate,
  currentDate,
  40.7128,
  -74.006,
  -5,
  1.0
);

const natalSun = chart.planets.find((planet) => planet.name === "Sun");
const natalAsc = chart.ascendant;
const natalMc = chart.midheaven;
if (!natalSun) throw new Error("Natal Sun fixture missing.");

const progressed = new ProgressionsEngine().calculateProgressions(
  birthDate,
  currentDate,
  40.7128,
  -74.006,
  -5
);
const expectedArc = normalizeDegrees(progressed.progressedSun.longitude - natalSun.longitude);

assert(report.age === progressed.age, "Solar Arc report uses completed age from the progression engine");
assert(angularDifference(report.solarArcDegrees, expectedArc) < 0.0001, "Solar Arc is the exact progressed-Sun longitude difference");
assert(report.directedPoints.length === chart.planets.length + 2, "Every natal planet and both natal angles are directed");
assert(report.directedPoints.some((point) => point.name === "Ascendant"), "Ascendant receives the solar arc");
assert(report.directedPoints.some((point) => point.name === "Midheaven"), "Midheaven receives the solar arc");

const directedSun = report.directedPoints.find((point) => point.name === "Sun");
assert(!!directedSun, "Directed Sun is present");
assert(
  angularDifference(directedSun!.directedLongitude, natalSun.longitude + report.solarArcDegrees) < 0.0001,
  "Directed Sun longitude equals natal Sun plus the common arc"
);

const directedAsc = report.directedPoints.find((point) => point.name === "Ascendant");
assert(
  !!directedAsc && angularDifference(directedAsc.directedLongitude, natalAsc.longitude + report.solarArcDegrees) < 0.0001,
  "Directed Ascendant longitude equals natal Ascendant plus the common arc"
);

const directedMc = report.directedPoints.find((point) => point.name === "Midheaven");
assert(
  !!directedMc && angularDifference(directedMc.directedLongitude, natalMc.longitude + report.solarArcDegrees) < 0.0001,
  "Directed Midheaven longitude equals natal Midheaven plus the common arc"
);

assert(report.contacts.every((contact) => contact.orb <= 1.0), "All contacts respect the configured one-degree maximum orb");
assert(report.contacts.every((contact) => contact.directedPoint !== "" && contact.natalPoint !== ""), "Every contact identifies both directed and natal points");
assert(report.contacts.every((contact) => [0, 45, 60, 90, 120, 135, 150, 180].includes(contact.exactAngle)), "Contacts use the documented major and selected minor aspect series");

const atBirth = engine.calculateSolarArc(
  chart,
  birthDate,
  birthDate,
  40.7128,
  -74.006,
  -5,
  1.0
);
assert(atBirth.solarArcDegrees < 0.0001 || atBirth.solarArcDegrees > 359.9999, "At birth, the solar arc is effectively zero");

console.log("\nAdvanced Western Solar Arc regression suite completed.");
