import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildJplWesternHorizonsQueryUrl,
  parseHorizonsObserverEclipticRows,
  WESTERN_HORIZONS_BODIES,
} from "../lib/astronomy/westernEphemerisBenchmarks";

interface HorizonsApiPayload {
  result?: string;
  error?: string;
  signature?: { version?: string; source?: string };
}

interface ReferenceFixture {
  body: string;
  targetId: string;
  epochUtc: string;
  longitudeDegrees: number;
  latitudeDegrees: number;
  rawResponseFile: string;
  responseSha256: string;
}

const ROOT = process.cwd();
const DATASET_PATH = path.join(ROOT, "data/benchmarks/western-ephemeris-reference.json");
const RAW_DIR = path.join(ROOT, "data/benchmarks/raw");

async function main(): Promise<void> {
  if (!process.argv.includes("--fetch")) {
    console.log(
      "This script makes live reference requests only when explicitly run with --fetch.\n" +
      "Usage: bun run scripts/fetchJplWesternEphemerisReference.ts --fetch [--overwrite]"
    );
    return;
  }

  const dataset = JSON.parse(await readFile(DATASET_PATH, "utf8")) as {
    schemaVersion: number;
    epochsUtc: string[];
    fixtures: ReferenceFixture[];
    [key: string]: unknown;
  };
  if (dataset.schemaVersion !== 1 || !Array.isArray(dataset.epochsUtc) || !Array.isArray(dataset.fixtures)) {
    throw new Error("The Western Horizons reference dataset has an unsupported schema.");
  }
  if (dataset.fixtures.length > 0 && !process.argv.includes("--overwrite")) {
    throw new Error("Reference fixtures already exist. Pass --overwrite only when intentionally refreshing them.");
  }

  await mkdir(RAW_DIR, { recursive: true });
  const retrievedAtUtc = new Date().toISOString();
  const fixtures: ReferenceFixture[] = [];
  const responseMetadata: Array<{ body: string; signature?: HorizonsApiPayload["signature"]; responseFile: string }> = [];

  // Query bodies sequentially to be polite to the public JPL service.
  for (const target of WESTERN_HORIZONS_BODIES) {
    const url = buildJplWesternHorizonsQueryUrl(target.targetId, dataset.epochsUtc);
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "Celestia-Western-Ephemeris-Benchmark/1.0" },
      signal: AbortSignal.timeout(45000),
    });
    if (!response.ok) {
      throw new Error("JPL Horizons request failed for " + target.name + ": HTTP " + response.status);
    }
    const payload = await response.json() as HorizonsApiPayload;
    if (payload.error) {
      throw new Error("JPL Horizons returned an error for " + target.name + ": " + payload.error);
    }
    if (typeof payload.result !== "string") {
      throw new Error("JPL Horizons response for " + target.name + " did not contain a result table.");
    }

    const rows = parseHorizonsObserverEclipticRows(payload.result, dataset.epochsUtc.length);
    const rawName = "horizons-" + target.name.toLowerCase() + ".json";
    const rawPath = path.join(RAW_DIR, rawName);
    const rawJson = JSON.stringify(payload, null, 2) + "\n";
    await writeFile(rawPath, rawJson, "utf8");
    const responseSha256 = createHash("sha256").update(rawJson).digest("hex");
    const relativeRawPath = path.relative(ROOT, rawPath).split(path.sep).join("/");

    rows.forEach((row, index) => {
      fixtures.push({
        body: target.name,
        targetId: target.targetId,
        epochUtc: dataset.epochsUtc[index],
        longitudeDegrees: row.longitudeDegrees,
        latitudeDegrees: row.latitudeDegrees,
        rawResponseFile: relativeRawPath,
        responseSha256,
      });
    });
    responseMetadata.push({
      body: target.name,
      signature: payload.signature,
      responseFile: relativeRawPath,
    });
    console.log("Captured " + rows.length + " reference epochs for " + target.name + ".");
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  const updatedDataset = {
    ...dataset,
    datasetStatus: "captured-from-jpl-horizons",
    retrievedAtUtc,
    responseMetadata,
    fixtures,
  };
  await writeFile(DATASET_PATH, JSON.stringify(updatedDataset, null, 2) + "\n", "utf8");
  console.log(
    "Saved " + fixtures.length + " JPL Horizons reference rows to " +
    path.relative(ROOT, DATASET_PATH).split(path.sep).join("/") + "."
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
