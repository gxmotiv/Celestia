import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildInpopApiUrl,
  INPOP_OUTER_PLANETS,
  parseInpopRectangularRows,
  validateInpopEpochs,
  type InpopPayload,
  type InpopReferenceFixture,
} from "../lib/astronomy/inpopWesternEphemerisBenchmarks";

interface JplDataset { schemaVersion: number; epochsUtc: string[]; }

const ROOT = process.cwd();
const JPL_DATASET_PATH = path.join(ROOT, "data/benchmarks/western-ephemeris-reference.json");
const DATASET_PATH = path.join(ROOT, "data/benchmarks/inpop-western-ephemeris-reference.json");
const RAW_DIR = path.join(ROOT, "data/benchmarks/inpop-raw");

async function main(): Promise<void> {
  if (!process.argv.includes("--fetch")) {
    console.log("Live IMCCE requests run only with --fetch.");
    return;
  }

  const jpl = JSON.parse(await readFile(JPL_DATASET_PATH, "utf8")) as JplDataset;
  if (jpl.schemaVersion !== 1 || !Array.isArray(jpl.epochsUtc)) {
    throw new Error("The existing JPL dataset does not provide the expected epoch manifest.");
  }
  validateInpopEpochs(jpl.epochsUtc);

  try {
    const existing = JSON.parse(await readFile(DATASET_PATH, "utf8")) as { fixtures?: unknown[] };
    if ((existing.fixtures?.length ?? 0) > 0 && !process.argv.includes("--overwrite")) {
      throw new Error("INPOP reference fixtures already exist. Pass --overwrite only to refresh them.");
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("INPOP reference fixtures")) throw error;
  }

  await mkdir(RAW_DIR, { recursive: true });
  const retrievedAtUtc = new Date().toISOString();
  const fixtures: InpopReferenceFixture[] = [];
  const responseMetadata: Array<Record<string, unknown>> = [];

  for (const body of INPOP_OUTER_PLANETS) {
    const epochsFile = new Blob([jpl.epochsUtc.join("\n") + "\n"], { type: "text/plain" });
    const form = new FormData();
    form.append("epochs", epochsFile, "epochs.txt");
    const url = buildInpopApiUrl(body);
    console.log("Requesting IMCCE Miriade INPOP apparent geocentric coordinates for " + body + ".");
    const response = await fetch(url, {
      method: "POST",
      body: form,
      headers: {
        Accept: "application/json",
        "User-Agent": "Celestia-INPOP-Independent-Ephemeris-Benchmark/1.0",
      },
      signal: AbortSignal.timeout(90000),
    });
    const rawText = await response.text();
    if (!response.ok) {
      throw new Error(
        "Miriade request failed for " + body + ": HTTP " + response.status +
        " — " + rawText.slice(0, 1000)
      );
    }

    let payload: InpopPayload;
    try {
      payload = JSON.parse(rawText) as InpopPayload;
    } catch {
      throw new Error("Miriade returned non-JSON output for " + body + ": " + rawText.slice(0, 1000));
    }
    const rows = parseInpopRectangularRows(payload, body, jpl.epochsUtc);
    const rawName = "miriade-inpop-" + body.toLowerCase() + ".json";
    const rawPath = path.join(RAW_DIR, rawName);
    const rawJson = rawText.trimEnd() + "\n";
    await writeFile(rawPath, rawJson, "utf8");
    const responseSha256 = createHash("sha256").update(rawJson).digest("hex");
    const relativeRawPath = path.relative(ROOT, rawPath).split(path.sep).join("/");

    fixtures.push(...rows);
    responseMetadata.push({
      body,
      requestedTheory: "INPOP",
      reportedTheory: payload.ephemeris?.planetary_theory ?? null,
      timeScale: payload.ephemeris?.time_scale ?? null,
      coordinateMode: payload.ephemeris?.coordinates ?? null,
      referenceFrame: payload.ephemeris?.reference_frame ?? null,
      coordinateSystem: payload.coosys ?? null,
      units: payload.unit ?? null,
      responseFile: relativeRawPath,
      responseSha256,
    });
    console.log(
      "Captured " + rows.length + " INPOP rows for " + body +
      "; reported theory=" + (payload.ephemeris?.planetary_theory ?? "not supplied") + "."
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const dataset = {
    schemaVersion: 1,
    datasetStatus: "captured-from-imcce-miriade-inpop",
    provider: "IMCCE LTE Miriade ephemcc",
    requestedTheory: "INPOP",
    query: {
      observer: "500 (Earth geocenter)",
      timeScale: "UTC",
      ephemerisType: "2 (apparent of date)",
      coordinateType: "2 (rectangular)",
      referencePlane: "2 (ecliptic)",
      vectorUnits: "AU, as reported by the service",
      note: "Ecliptic longitude/latitude are derived from the returned geocentric rectangular vector.",
    },
    bodies: [...INPOP_OUTER_PLANETS],
    epochsUtc: jpl.epochsUtc,
    retrievedAtUtc,
    responseMetadata,
    fixtures,
  };
  await writeFile(DATASET_PATH, JSON.stringify(dataset, null, 2) + "\n", "utf8");
  console.log("Saved " + fixtures.length + " checksummed IMCCE INPOP reference rows.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
