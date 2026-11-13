import {
  compareEclipticCoordinates,
  signedCircularDifferenceDegrees,
  type EclipticCoordinate,
  type EclipticResidual,
} from "./westernEphemerisBenchmarks";

export const INPOP_OUTER_PLANETS = ["Saturn", "Uranus", "Neptune"] as const;
export type InpopOuterPlanet = typeof INPOP_OUTER_PLANETS[number];

export interface InpopReferenceFixture extends EclipticCoordinate {
  body: InpopOuterPlanet;
  epochUtc: string;
  xAu: number;
  yAu: number;
  zAu: number;
}

export interface InpopPayload {
  sso?: { name?: string; type?: string };
  coosys?: { epoch?: string; equinox?: string; system?: string };
  ephemeris?: {
    time_scale?: string;
    planetary_theory?: string;
    coordinates?: string;
    reference_frame?: { type?: string; plane?: string; center?: string };
  };
  data?: Array<Record<string, unknown>>;
  unit?: Record<string, string>;
}

export interface FrameRotationSample {
  source: EclipticCoordinate;
  target: EclipticCoordinate;
}

export interface SmallFrameRotationFit {
  sampleCount: number;
  rotationXArcsec: number;
  rotationYArcsec: number;
  rotationZArcsec: number;
  poleRotationArcsec: number;
  rmsResidualArcsec: number;
  maxAbsoluteResidualArcsec: number;
  residualDegreesOfFreedom: number;
}

function solveThreeByThree(matrix: number[][], vector: number[]): number[] {
  const augmented = matrix.map((row, index) => [...row, vector[index]]);
  for (let column = 0; column < 3; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < 3; row += 1) {
      if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row;
    }
    [augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]];
    const divisor = augmented[column][column];
    if (!Number.isFinite(divisor) || Math.abs(divisor) < 1e-12) {
      throw new Error("Frame-rotation fit is rank deficient.");
    }
    for (let index = column; index < 4; index += 1) augmented[column][index] /= divisor;
    for (let row = 0; row < 3; row += 1) {
      if (row === column) continue;
      const factor = augmented[row][column];
      for (let index = column; index < 4; index += 1) {
        augmented[row][index] -= factor * augmented[column][index];
      }
    }
  }
  return augmented.map((row) => row[3]);
}

/** First-order rigid rotation from source to target; diagnostic only, never applied to chart positions. */
export function fitSmallEclipticFrameRotation(samples: FrameRotationSample[]): SmallFrameRotationFit {
  if (!Array.isArray(samples) || samples.length < 2) {
    throw new RangeError("At least two coordinate pairs are required for a frame-rotation fit.");
  }
  const design: number[][] = [];
  const observations: number[] = [];
  for (const sample of samples) {
    const { longitudeDegrees, latitudeDegrees } = sample.source;
    const target = sample.target;
    for (const value of [longitudeDegrees, latitudeDegrees, target.longitudeDegrees, target.latitudeDegrees]) {
      if (!Number.isFinite(value)) throw new TypeError("Frame-rotation samples must contain finite coordinates.");
    }
    if (Math.abs(latitudeDegrees) >= 89.999999) {
      throw new RangeError("Frame-rotation longitude equation is singular near an ecliptic pole.");
    }
    const longitude = longitudeDegrees * Math.PI / 180;
    const latitude = latitudeDegrees * Math.PI / 180;
    const deltaLongitude = signedCircularDifferenceDegrees(target.longitudeDegrees, longitudeDegrees) * 3600;
    const deltaLatitude = (target.latitudeDegrees - latitudeDegrees) * 3600;
    // First-order rotation equations, with all unknowns and observations in arcseconds.
    design.push([
      -Math.tan(latitude) * Math.cos(longitude),
      -Math.tan(latitude) * Math.sin(longitude),
      1,
    ]);
    observations.push(deltaLongitude);
    design.push([Math.sin(longitude), -Math.cos(longitude), 0]);
    observations.push(deltaLatitude);
  }
  const normal = Array.from({ length: 3 }, (_, row) =>
    Array.from({ length: 3 }, (_, column) =>
      design.reduce((sum, values) => sum + values[row] * values[column], 0)
    )
  );
  const right = Array.from({ length: 3 }, (_, row) =>
    design.reduce((sum, values, index) => sum + values[row] * observations[index], 0)
  );
  const rotation = solveThreeByThree(normal, right);
  const residuals = observations.map((value, index) =>
    value - design[index].reduce((sum, component, axis) => sum + component * rotation[axis], 0)
  );
  const rms = Math.sqrt(residuals.reduce((sum, value) => sum + value * value, 0) / residuals.length);
  return {
    sampleCount: samples.length,
    rotationXArcsec: rotation[0],
    rotationYArcsec: rotation[1],
    rotationZArcsec: rotation[2],
    poleRotationArcsec: Math.hypot(rotation[0], rotation[1]),
    rmsResidualArcsec: rms,
    maxAbsoluteResidualArcsec: Math.max(...residuals.map(Math.abs)),
    residualDegreesOfFreedom: residuals.length - 3,
  };
}

export function buildInpopApiUrl(body: InpopOuterPlanet): string {
  const url = new URL("https://ssp.imcce.fr/webservices/miriade/api/ephemcc.php");
  const parameters: Record<string, string> = {
    "-name": "p:" + body,
    "-from": "CelestiaResearch",
    "-tscale": "UTC",
    "-observer": "500",
    "-theory": "INPOP",
    "-teph": "2",
    "-tcoor": "2",
    "-rplane": "2",
    "-mime": "json",
    "-output": "--iso",
  };
  for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, value);
  return url.toString();
}

export function formatInpopEpochFile(epochsUtc: string[]): string {
  validateInpopEpochs(epochsUtc);
  return epochsUtc.map((epoch) => {
    if (!epoch.endsWith(".000Z")) {
      throw new Error(
        "Miriade ISO input supports integer seconds only; benchmark epoch has non-zero milliseconds: " + epoch
      );
    }
    return epoch.slice(0, -5);
  }).join("\n") + "\n";
}

function parseUtcDate(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    const milliseconds = (value - 2440587.5) * 86400000;
    const date = new Date(milliseconds);
    if (Number.isFinite(date.getTime())) return date.toISOString();
  }
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("Miriade response row is missing an ISO date or numeric Julian epoch.");
  }
  const candidate = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : value + "Z";
  const date = new Date(candidate);
  if (!Number.isFinite(date.getTime())) throw new Error("Miriade returned an invalid UTC date: " + value);
  return date.toISOString();
}

function readVectorComponent(row: Record<string, unknown>, component: "x" | "y" | "z"): number {
  const normalized = new Map(
    Object.entries(row).map(([key, value]) => [key.toLowerCase().replace(/[^a-z]/g, ""), value])
  );
  const aliases = [component, "p" + component, component + "au", "p" + component + "au", component + "coord", component + "coordinate"];
  for (const alias of aliases) {
    const value = normalized.get(alias);
    if (value !== undefined && value !== null && value !== "") {
      const numeric = typeof value === "number" ? value : Number(value);
      if (Number.isFinite(numeric)) return numeric;
    }
  }
  throw new Error(
    "Miriade rectangular row is missing finite " + component.toUpperCase() +
    " coordinate. Returned columns: " + Object.keys(row).join(", ")
  );
}

export function parseInpopRectangularRows(
  payload: InpopPayload,
  body: InpopOuterPlanet,
  expectedEpochsUtc: string[]
): InpopReferenceFixture[] {
  validateInpopEpochs(expectedEpochsUtc);
  const model = payload.ephemeris?.planetary_theory ?? "";
  if (!model.toUpperCase().includes("INPOP")) {
    throw new Error("Miriade did not identify an INPOP planetary theory: " + (model || "missing"));
  }
  const coordinateMode = payload.ephemeris?.coordinates ?? "";
  if (!coordinateMode.toLowerCase().includes("rectangular")) {
    throw new Error("Miriade response is not rectangular coordinates: " + (coordinateMode || "missing"));
  }
  const frame = payload.ephemeris?.reference_frame;
  if (!frame?.plane?.toLowerCase().includes("ecliptic")) {
    throw new Error("Miriade response is not in the requested ecliptic plane.");
  }
  const center = frame.center?.toLowerCase() ?? "";
  if (!/(geocenter|geocentric|earth center)/.test(center)) {
    throw new Error("Miriade response is not geocentric: " + (frame.center || "missing"));
  }
  if (!frame.type?.toLowerCase().includes("apparent")) {
    throw new Error("Miriade response is not apparent-of-date coordinates: " + (frame.type || "missing"));
  }
  if ((payload.ephemeris?.time_scale ?? "").toUpperCase() !== "UTC") {
    throw new Error("Miriade response time scale is not UTC.");
  }
  if (!Array.isArray(payload.data)) throw new Error("Miriade response does not contain a data array.");
  const rows: InpopReferenceFixture[] = payload.data.map((row, index) => {
    const epochUtc = parseUtcDate(row.epoch ?? row.Date ?? row.date);
    const expectedEpochUtc = expectedEpochsUtc[index];
    if (epochUtc !== expectedEpochUtc) {
      throw new Error("Miriade returned epoch " + epochUtc + " at row " + (index + 1) +
        "; expected " + expectedEpochUtc + ".");
    }
    const xAu = readVectorComponent(row, "x");
    const yAu = readVectorComponent(row, "y");
    const zAu = readVectorComponent(row, "z");
    const planarDistance = Math.hypot(xAu, yAu);
    const distance = Math.hypot(planarDistance, zAu);
    if (!Number.isFinite(distance) || distance === 0) {
      throw new Error("Miriade returned a zero or non-finite geocentric vector.");
    }
    const longitudeDegrees = (Math.atan2(yAu, xAu) * 180 / Math.PI + 360) % 360;
    const latitudeDegrees = Math.atan2(zAu, planarDistance) * 180 / Math.PI;
    return { body, epochUtc, longitudeDegrees, latitudeDegrees, xAu, yAu, zAu };
  });
  if (rows.length !== expectedEpochsUtc.length) {
    throw new Error("Miriade returned " + rows.length + " rows; expected " + expectedEpochsUtc.length + ".");
  }
  return rows;
}

export function compareInpopCoordinates(
  actual: EclipticCoordinate,
  reference: EclipticCoordinate
): EclipticResidual {
  return compareEclipticCoordinates(actual, reference);
}

export function validateInpopEpochs(epochsUtc: string[]): void {
  if (!Array.isArray(epochsUtc) || epochsUtc.length === 0) {
    throw new RangeError("At least one UTC epoch is required.");
  }
  for (const epoch of epochsUtc) {
    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(epoch) ||
      !Number.isFinite(Date.parse(epoch)) ||
      new Date(epoch).toISOString() !== epoch
    ) throw new Error("Invalid canonical UTC benchmark epoch: " + epoch);
  }
  for (let index = 1; index < epochsUtc.length; index += 1) {
    if (Date.parse(epochsUtc[index]) <= Date.parse(epochsUtc[index - 1])) {
      throw new Error("INPOP benchmark epochs must be in strictly ascending order.");
    }
  }
}
