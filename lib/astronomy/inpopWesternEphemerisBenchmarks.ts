import {
  compareEclipticCoordinates,
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
    // Miriade's ISO parser expects integer seconds (no fractional-second suffix or terminal Z).
    return epoch.slice(0, -5);
  }).join("\n") + "\n";
}

function parseUtcDate(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    // Miriade JSON may encode epoch as a Julian day when ISO output is not applied.
    const milliseconds = (value - 2440587.5) * 86400000;
    const date = new Date(milliseconds);
    if (Number.isFinite(date.getTime())) return date.toISOString();
  }
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("Miriade response row is missing an ISO date or numeric Julian epoch.");
  }
  const candidate = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : value + "Z";
  const date = new Date(candidate);
  if (!Number.isFinite(date.getTime())) {
    throw new Error("Miriade returned an invalid UTC date: " + value);
  }
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
      throw new Error(
        "Miriade returned epoch " + epochUtc + " at row " + (index + 1) +
        "; expected " + expectedEpochUtc + "."
      );
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
