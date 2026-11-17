import { swissEphemeris } from "../lib/astronomy/swissEphemeris";
import { calculateLahiriAyanamsa } from "../lib/astronomy/vedic";

const cases = [
  { name: "J2000.0", jd: 2451545.0 },
  { name: "1900-01-01", jd: 2415020.5 },
  { name: "2026-11-06", jd: new Date("2026-11-06T00:00:00Z").getTime() / 86400000 + 2440587.5 },
  { name: "2100-01-01", jd: 2488069.5 },
];

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, expected: string, actual: string) {
  if (condition) {
    passed++;
    console.log("[PASS] " + name);
  } else {
    failed++;
    console.log("[FAIL] " + name);
    console.log("  Expected: " + expected);
    console.log("  Actual:   " + actual);
  }
}

function normalize(value: number): number {
  return ((value % 360) + 360) % 360;
}

function near(actual: number, expected: number, tolerance = 1e-10): boolean {
  return Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance;
}

const expectedJ2000 = 85885.53 / 3600;
check(
  "J2000 Lahiri-style zero point is anchored to 23°51′25.53″",
  near(swissEphemeris.getAyanamsa(2451545.0), expectedJ2000),
  String(expectedJ2000),
  String(swissEphemeris.getAyanamsa(2451545.0))
);

for (const item of cases) {
  const shared = swissEphemeris.getAyanamsa(item.jd);
  const vedic = calculateLahiriAyanamsa(item.jd);
  check(
    item.name + ": Vedic and Western facade use exactly the same ayanamsa model",
    near(vedic, shared),
    String(shared),
    String(vedic)
  );

  const tropicalSun = swissEphemeris.calculatePlanetPosition(swissEphemeris.SUN, item.jd, false);
  const siderealSun = swissEphemeris.calculatePlanetPosition(swissEphemeris.SUN, item.jd, true);
  const appliedOffset = normalize(tropicalSun.longitude - siderealSun.longitude);
  check(
    item.name + ": sidereal Sun applies the shared ayanamsa (rounded output tolerance)",
    Math.abs(appliedOffset - shared) <= 0.0002 || Math.abs(appliedOffset - shared + 360) <= 0.0002,
    "offset " + shared + "°",
    "offset " + appliedOffset + "°"
  );
}

const before = swissEphemeris.getAyanamsa(2451545.0 - 36525);
const epoch = swissEphemeris.getAyanamsa(2451545.0);
const after = swissEphemeris.getAyanamsa(2451545.0 + 36525);
check(
  "Shared ayanamsa increases across the tested 1900–2100 interval",
  before < epoch && epoch < after,
  "before < J2000 < after",
  before + " < " + epoch + " < " + after
);

console.log("TOTAL TESTS: " + (passed + failed));
console.log("PASSED: " + passed);
console.log("FAILED: " + failed);
if (failed > 0) process.exit(1);
