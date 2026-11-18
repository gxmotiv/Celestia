/**
 * Differential ephemeris regression against frozen NASA/JPL Horizons vectors.
 *
 * This test compares directions in the same near-J2000 equatorial frame.
 * It intentionally compares GeoVector() before Ecliptic() conversion, because
 * Horizons fixtures are Cartesian ICRF vectors while Ecliptic() produces ECT.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as Astronomy from "astronomy-engine";

type Fixture = {
  id: string;
  body: string;
  targetId: string;
  epochUT: string;
  source: string;
  vectorAU: { x: number; y: number; z: number };
};

type FixtureDocument = {
  comparison: {
    initialThresholdArcseconds: number;
  };
  fixtures: Fixture[];
};

type Vector = { x: number; y: number; z: number };

const BODY_MAP: Record<string, Astronomy.Body> = {
  Sun: Astronomy.Body.Sun,
  Moon: Astronomy.Body.Moon,
  Mercury: Astronomy.Body.Mercury,
  Venus: Astronomy.Body.Venus,
  Mars: Astronomy.Body.Mars,
  Jupiter: Astronomy.Body.Jupiter,
  Saturn: Astronomy.Body.Saturn,
  Uranus: Astronomy.Body.Uranus,
  Neptune: Astronomy.Body.Neptune,
  Pluto: Astronomy.Body.Pluto,
};

function parseUniversalTime(epochUT: string): Date {
  const [datePart, timePart] = epochUT.split("T");
  if (!datePart || !timePart) {
    throw new Error(`Invalid UT epoch in JPL fixture: ${epochUT}`);
  }

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);
  const values = [year, month, day, hour, minute, second];
  if (values.some((value) => !Number.isInteger(value)) ||
      month < 1 || month > 12 || day < 1 || day > 31 ||
      hour < 0 || hour > 23 || minute < 0 || minute > 59 ||
      second < 0 || second > 59) {
    throw new Error(`Invalid calendar fields in JPL fixture: ${epochUT}`);
  }

  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

function angularErrorArcseconds(actual: Vector, reference: Vector): number {
  const crossX = actual.y * reference.z - actual.z * reference.y;
  const crossY = actual.z * reference.x - actual.x * reference.z;
  const crossZ = actual.x * reference.y - actual.y * reference.x;
  const crossMagnitude = Math.hypot(crossX, crossY, crossZ);
  const dot = actual.x * reference.x + actual.y * reference.y + actual.z * reference.z;
  const radians = Math.atan2(crossMagnitude, dot);
  return radians * (180 / Math.PI) * 3600;
}

function main(): void {
  const fixturePath = join(process.cwd(), "tests", "fixtures", "jpl-horizons-vectors.json");
  const document = JSON.parse(readFileSync(fixturePath, "utf8")) as FixtureDocument;
  const threshold = document.comparison.initialThresholdArcseconds;

  if (!Number.isFinite(threshold) || threshold <= 0) {
    throw new Error("JPL fixture threshold must be a positive finite number.");
  }
  if (!Array.isArray(document.fixtures) || document.fixtures.length === 0) {
    throw new Error("JPL fixture set is empty.");
  }

  let passed = 0;
  let failed = 0;
  let maxError = 0;

  console.log("\n=========== JPL HORIZONS VECTOR REGRESSION ===========");
  console.log(`Reference fixtures: ${document.fixtures.length}`);
  console.log(`Angular threshold: ${threshold.toFixed(2)} arcsec`);
  console.log("Metric: direction-only angular separation (AU range is not compared)\n");

  for (const fixture of document.fixtures) {
    const body = BODY_MAP[fixture.body];
    if (!body) {
      throw new Error(`Unsupported body "${fixture.body}" in fixture ${fixture.id}`);
    }

    const epoch = new Astronomy.AstroTime(parseUniversalTime(fixture.epochUT));
    const actual = Astronomy.GeoVector(body, epoch, true);
    const error = angularErrorArcseconds(actual, fixture.vectorAU);
    const ok = Number.isFinite(error) && error <= threshold;

    if (ok) passed++;
    else failed++;
    maxError = Math.max(maxError, Number.isFinite(error) ? error : Number.POSITIVE_INFINITY);

    console.log(
      `[${ok ? "PASS" : "FAIL"}] ${fixture.id} ${fixture.body}: ${error.toFixed(3)} arcsec ` +
      `(JPL target ${fixture.targetId}, ${fixture.source})`
    );
  }

  console.log("\n======================================================");
  console.log(`TOTAL: ${document.fixtures.length}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log(`MAX ANGULAR ERROR: ${maxError.toFixed(3)} arcsec`);
  console.log("======================================================\n");

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
