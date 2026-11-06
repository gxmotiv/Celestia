import { SwissEphemerisEngine } from "../lib/astronomy/swissEphemeris";

const engine = new SwissEphemerisEngine();
const results: { name: string; passed: boolean; expected: string; actual: string }[] = [];

function test(name: string, passed: boolean, expected: string, actual: string) {
  results.push({ name, passed, expected, actual });
}

function normalize(value: number): number {
  return ((value % 360) + 360) % 360;
}

function circularDifference(a: number, b: number): number {
  const difference = Math.abs(normalize(a) - normalize(b));
  return Math.min(difference, 360 - difference);
}

function near(actual: number, expected: number, tolerance = 0.0001): boolean {
  return Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance;
}

const benchmarkInstants = [
  new Date("2000-01-01T12:00:00.000Z"),
  new Date("2024-03-15T19:30:00.000Z"),
  new Date("2026-11-06T00:00:00.000Z"),
];

for (const instant of benchmarkInstants) {
  const jd = instant.getTime() / 86_400_000 + 2_440_587.5;

  for (const zodiacMode of [false, true]) {
    const modeLabel = zodiacMode ? "sidereal" : "tropical";
    const defaultPair = engine.calculateAllPlanets(jd, zodiacMode);
    const explicitMean = engine.calculateAllPlanets(jd, zodiacMode, "mean");
    const explicitTrue = engine.calculateAllPlanets(jd, zodiacMode, "true");

    const expectedMean = engine.calculatePlanetPosition(engine.MEAN_NODE, jd, zodiacMode);
    const expectedTrue = engine.calculatePlanetPosition(engine.TRUE_NODE, jd, zodiacMode);

    test(
      instant.toISOString() + " " + modeLabel + ": default remains mean node",
      near(defaultPair.rahu.longitude, expectedMean.longitude),
      String(expectedMean.longitude),
      String(defaultPair.rahu.longitude)
    );

    for (const [nodeType, pair, expectedAscending] of [
      ["mean", explicitMean, expectedMean],
      ["true", explicitTrue, expectedTrue],
    ] as const) {
      const label = instant.toISOString() + " " + modeLabel + " " + nodeType;

      test(
        label + ": Rahu is the selected ascending node",
        near(pair.rahu.longitude, expectedAscending.longitude),
        String(expectedAscending.longitude),
        String(pair.rahu.longitude)
      );

      const expectedKetuLongitude = normalize(expectedAscending.longitude + 180);
      test(
        label + ": Ketu is exactly opposite the same Rahu model",
        circularDifference(pair.rahu.longitude, pair.ketu.longitude) <= 0.0001 &&
          near(pair.ketu.longitude, expectedKetuLongitude),
        String(expectedKetuLongitude),
        String(pair.ketu.longitude)
      );

      test(
        label + ": Ketu sign and degree agree with its longitude",
        pair.ketu.sign === engine.getZodiacSign(pair.ketu.longitude) &&
          near(pair.ketu.degree, pair.ketu.longitude % 30),
        engine.getZodiacSign(expectedKetuLongitude) + " " + String(expectedKetuLongitude % 30),
        pair.ketu.sign + " " + String(pair.ketu.degree)
      );

      test(
        label + ": both node records share the selected node speed",
        near(pair.rahu.speed, pair.ketu.speed) &&
          pair.rahu.isRetrograde === pair.ketu.isRetrograde,
        String(pair.rahu.speed),
        pair.ketu.speed + " (Rahu " + pair.rahu.speed + ")"
      );

      test(
        label + ": node latitude is zero in the ecliptic-node representation",
        near(pair.rahu.latitude, 0) && near(pair.ketu.latitude, 0),
        "0°, 0°",
        pair.rahu.latitude + "°, " + pair.ketu.latitude + "°"
      );
    }
  }
}

let rejectsUnknownNodeType = false;
try {
  engine.calculateAllPlanets(2_451_545, false, "apparent" as "mean");
} catch (error) {
  rejectsUnknownNodeType = error instanceof RangeError;
}
test(
  "Unknown node model is rejected instead of silently changing convention",
  rejectsUnknownNodeType,
  "RangeError",
  rejectsUnknownNodeType ? "RangeError" : "No error"
);

let passed = 0;
let failed = 0;
for (const result of results) {
  if (result.passed) passed++;
  else failed++;
  console.log("[" + (result.passed ? "PASS" : "FAIL") + "] " + result.name);
  if (!result.passed) {
    console.log("  Expected: " + result.expected);
    console.log("  Actual:   " + result.actual);
  }
}

console.log("TOTAL TESTS: " + results.length);
console.log("PASSED: " + passed);
console.log("FAILED: " + failed);
if (failed > 0) process.exit(1);
