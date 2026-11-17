import { readFile } from "node:fs/promises";
import path from "node:path";
import { swissEphemeris } from "../lib/astronomy/swissEphemeris";
import {
  compareEclipticCoordinates,
  type WesternHorizonsBody,
} from "../lib/astronomy/westernEphemerisBenchmarks";

interface Fixture {
  body: WesternHorizonsBody;
  epochUtc: string;
  longitudeDegrees: number;
  latitudeDegrees: number;
}

interface Dataset {
  schemaVersion: number;
  fixtures: Fixture[];
  acceptanceThresholdsArcseconds: Record<string, { longitude?: number; latitude?: number }>;
}

const DATASET_PATH = path.join(process.cwd(), "data/benchmarks/western-ephemeris-reference.json");

async function main(): Promise<void> {
  const dataset = JSON.parse(await readFile(DATASET_PATH, "utf8")) as Dataset;
  if (dataset.schemaVersion !== 1 || !Array.isArray(dataset.fixtures)) {
    throw new Error("Invalid JPL Western reference dataset.");
  }
  if (dataset.fixtures.length === 0) {
    throw new Error(
      "No JPL reference rows are loaded yet. First run: bun run scripts/fetchJplWesternEphemerisReference.ts --fetch"
    );
  }

  let failed = 0;
  let unthresholded = 0;
  const residualsByBody = new Map<string, { longitude: number[]; latitude: number[] }>();
  for (const fixture of dataset.fixtures) {
    const date = new Date(fixture.epochUtc);
    if (!Number.isFinite(date.getTime())) {
      throw new Error("Invalid UTC timestamp in benchmark fixture: " + fixture.epochUtc);
    }
    const jd = swissEphemeris.calculateJulianDay(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds() + date.getUTCMilliseconds() / 1000,
      0
    );
    const actual = swissEphemeris.getApparentGeocentricEclipticPosition(fixture.body, jd);
    const residual = compareEclipticCoordinates(
      { longitudeDegrees: actual.longitude, latitudeDegrees: actual.latitude },
      { longitudeDegrees: fixture.longitudeDegrees, latitudeDegrees: fixture.latitudeDegrees }
    );
    const threshold = dataset.acceptanceThresholdsArcseconds?.[fixture.body];
    const hasThreshold = Number.isFinite(threshold?.longitude) && Number.isFinite(threshold?.latitude);
    const passed = hasThreshold &&
      residual.longitudeArcseconds <= (threshold?.longitude as number) &&
      residual.latitudeArcseconds <= (threshold?.latitude as number);
    if (!hasThreshold) unthresholded += 1;
    else if (!passed) failed += 1;

    const bodyResiduals = residualsByBody.get(fixture.body) ?? { longitude: [], latitude: [] };
    bodyResiduals.longitude.push(residual.longitudeArcseconds);
    bodyResiduals.latitude.push(residual.latitudeArcseconds);
    residualsByBody.set(fixture.body, bodyResiduals);

    const status = !hasThreshold ? "REVIEW" : passed ? "PASS" : "FAIL";
    console.log(
      status + " " + fixture.body + " " + fixture.epochUtc +
      " | Δλ=" + residual.longitudeArcseconds.toFixed(2) + "″" +
      " | Δβ=" + residual.latitudeArcseconds.toFixed(2) + "″" +
      (hasThreshold
        ? " | limits λ/β=" + threshold.longitude + "/" + threshold.latitude + "″"
        : " | no calibrated acceptance threshold")
    );
  }

  const summarize = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((total, value) => total + value, 0) / values.length;
    const percentile95 = sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)];
    return {
      median: sorted[Math.floor(sorted.length / 2)],
      p95: percentile95,
      maximum: sorted[sorted.length - 1],
      rms: Math.sqrt(values.reduce((total, value) => total + value * value, 0) / values.length),
      mean,
    };
  };

  console.log("Per-body residual summary (arcseconds; descriptive only until thresholds are calibrated):");
  for (const [body, values] of residualsByBody) {
    const longitude = summarize(values.longitude);
    const latitude = summarize(values.latitude);
    console.log(
      body + " n=" + values.longitude.length +
      " | longitude median/p95/max/RMS=" +
      longitude.median.toFixed(2) + "/" + longitude.p95.toFixed(2) + "/" +
      longitude.maximum.toFixed(2) + "/" + longitude.rms.toFixed(2) +
      " | latitude median/p95/max/RMS=" +
      latitude.median.toFixed(2) + "/" + latitude.p95.toFixed(2) + "/" +
      latitude.maximum.toFixed(2) + "/" + latitude.rms.toFixed(2)
    );
  }

  console.log(
    "Rows: " + dataset.fixtures.length +
    "; failed calibrated limits: " + failed +
    "; unthresholded rows requiring review: " + unthresholded + "."
  );
  if (failed > 0 || (process.argv.includes("--strict") && unthresholded > 0)) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
