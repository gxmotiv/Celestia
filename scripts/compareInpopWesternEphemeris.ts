import { readFile } from "node:fs/promises";
import path from "node:path";
import { swissEphemeris } from "../lib/astronomy/swissEphemeris";
import { signedCircularDifferenceDegrees } from "../lib/astronomy/westernEphemerisBenchmarks";
import type { InpopReferenceFixture } from "../lib/astronomy/inpopWesternEphemerisBenchmarks";

interface Dataset { schemaVersion: number; fixtures: InpopReferenceFixture[]; }
interface JplFixture { body: string; epochUtc: string; longitudeDegrees: number; latitudeDegrees: number; }
interface JplDataset { schemaVersion: number; fixtures: JplFixture[]; }

const ROOT = process.cwd();
const INPOP_PATH = path.join(ROOT, "data/benchmarks/inpop-western-ephemeris-reference.json");
const JPL_PATH = path.join(ROOT, "data/benchmarks/western-ephemeris-reference.json");

function signedCoordinateDifference(
  actual: { longitudeDegrees: number; latitudeDegrees: number },
  reference: { longitudeDegrees: number; latitudeDegrees: number }
): { longitude: number; latitude: number } {
  return {
    longitude: signedCircularDifferenceDegrees(actual.longitudeDegrees, reference.longitudeDegrees) * 3600,
    latitude: (actual.latitudeDegrees - reference.latitudeDegrees) * 3600,
  };
}

function summarize(values: number[]): string {
  const absolute = values.map(Math.abs).sort((a, b) => a - b);
  const rms = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length);
  const median = absolute[Math.floor(absolute.length / 2)];
  const p95 = absolute[Math.max(0, Math.ceil(absolute.length * 0.95) - 1)];
  return "abs-med/p95/max=" + median.toFixed(2) + "/" + p95.toFixed(2) + "/" +
    absolute[absolute.length - 1].toFixed(2) + "″; bias=" +
    (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2) +
    "″; RMS=" + rms.toFixed(2) + "″";
}

async function main(): Promise<void> {
  const inpop = JSON.parse(await readFile(INPOP_PATH, "utf8")) as Dataset;
  const jpl = JSON.parse(await readFile(JPL_PATH, "utf8")) as JplDataset;
  if (inpop.schemaVersion !== 1 || jpl.schemaVersion !== 1 ||
      !Array.isArray(inpop.fixtures) || !Array.isArray(jpl.fixtures)) {
    throw new Error("Invalid independent-reference dataset schema.");
  }
  if (inpop.fixtures.length === 0) throw new Error("No INPOP fixtures have been captured.");
  const jplByKey = new Map(jpl.fixtures.map((row) => [row.body + "|" + row.epochUtc, row]));
  const grouped = new Map<string, {
    aeInpopLon: number[]; aeInpopLat: number[];
    aeJplLon: number[]; aeJplLat: number[];
    inpopJplLon: number[]; inpopJplLat: number[];
  }>();

  for (const fixture of inpop.fixtures) {
    const referenceJpl = jplByKey.get(fixture.body + "|" + fixture.epochUtc);
    if (!referenceJpl) {
      throw new Error("Missing matching JPL sample for " + fixture.body + " at " + fixture.epochUtc);
    }
    const date = new Date(fixture.epochUtc);
    if (!Number.isFinite(date.getTime())) throw new Error("Invalid UTC epoch: " + fixture.epochUtc);
    const jd = swissEphemeris.calculateJulianDay(
      date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(),
      date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds() + date.getUTCMilliseconds() / 1000, 0
    );
    const position = swissEphemeris.getApparentGeocentricEclipticPosition(fixture.body, jd);
    const astronomyEngine = {
      longitudeDegrees: position.longitude,
      latitudeDegrees: position.latitude,
    };
    const aeInpop = signedCoordinateDifference(astronomyEngine, fixture);
    const aeJpl = signedCoordinateDifference(astronomyEngine, referenceJpl);
    const inpopJpl = signedCoordinateDifference(fixture, referenceJpl);
    const values = grouped.get(fixture.body) ?? {
      aeInpopLon: [], aeInpopLat: [], aeJplLon: [], aeJplLat: [],
      inpopJplLon: [], inpopJplLat: [],
    };
    values.aeInpopLon.push(aeInpop.longitude);
    values.aeInpopLat.push(aeInpop.latitude);
    values.aeJplLon.push(aeJpl.longitude);
    values.aeJplLat.push(aeJpl.latitude);
    values.inpopJplLon.push(inpopJpl.longitude);
    values.inpopJplLat.push(inpopJpl.latitude);
    grouped.set(fixture.body, values);
    console.log(
      "REVIEW " + fixture.body + " " + fixture.epochUtc +
      " | AE−INPOP λ/β=" + aeInpop.longitude.toFixed(2) + "″/" + aeInpop.latitude.toFixed(2) + "″" +
      " | AE−JPL λ/β=" + aeJpl.longitude.toFixed(2) + "″/" + aeJpl.latitude.toFixed(2) + "″" +
      " | INPOP−JPL λ/β=" + inpopJpl.longitude.toFixed(2) + "″/" + inpopJpl.latitude.toFixed(2) + "″"
    );
  }

  console.log("Per-body signed residual diagnostics (arcseconds; no acceptance thresholds are defined):");
  for (const [body, values] of grouped) {
    console.log(body + " n=" + values.aeInpopLon.length);
    console.log("  Astronomy Engine − INPOP longitude: " + summarize(values.aeInpopLon));
    console.log("  Astronomy Engine − INPOP latitude:  " + summarize(values.aeInpopLat));
    console.log("  Astronomy Engine − JPL longitude:   " + summarize(values.aeJplLon));
    console.log("  Astronomy Engine − JPL latitude:    " + summarize(values.aeJplLat));
    console.log("  INPOP − JPL longitude:              " + summarize(values.inpopJplLon));
    console.log("  INPOP − JPL latitude:               " + summarize(values.inpopJplLat));
  }
  console.log("Rows: " + inpop.fixtures.length +
    "; compared against both INPOP and JPL; all outputs remain REVIEW, not accuracy PASS.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
