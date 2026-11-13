/**
 * Helpers for independent JPL Horizons comparisons of Celestia's apparent
 * geocentric ecliptic planet coordinates.
 *
 * These helpers deliberately do not assume the two providers have identical
 * correction models or frames. Residuals are measurements, not accuracy claims.
 */

export const WESTERN_HORIZONS_BODIES = [
  { name: "Sun", targetId: "10" },
  { name: "Moon", targetId: "301" },
  { name: "Mercury", targetId: "199" },
  { name: "Venus", targetId: "299" },
  { name: "Mars", targetId: "499" },
  { name: "Jupiter", targetId: "599" },
  { name: "Saturn", targetId: "699" },
  { name: "Uranus", targetId: "799" },
  { name: "Neptune", targetId: "899" },
  { name: "Pluto", targetId: "999" },
] as const;

export type WesternHorizonsBody = typeof WESTERN_HORIZONS_BODIES[number]["name"];

export interface HorizonsEclipticRow {
  longitudeDegrees: number;
  latitudeDegrees: number;
}

export interface EclipticResidual {
  longitudeArcseconds: number;
  latitudeArcseconds: number;
}

export function signedCircularDifferenceDegrees(
  actualDegrees: number,
  referenceDegrees: number
): number {
  if (!Number.isFinite(actualDegrees) || !Number.isFinite(referenceDegrees)) {
    throw new RangeError("Angular comparison requires finite degree values.");
  }
  const raw = ((actualDegrees - referenceDegrees) % 360 + 360) % 360;
  return raw >= 180 ? raw - 360 : raw;
}

export function compareEclipticCoordinates(
  actual: HorizonsEclipticRow,
  reference: HorizonsEclipticRow
): EclipticResidual {
  if (
    !Number.isFinite(actual.longitudeDegrees) ||
    !Number.isFinite(actual.latitudeDegrees) ||
    !Number.isFinite(reference.longitudeDegrees) ||
    !Number.isFinite(reference.latitudeDegrees)
  ) {
    throw new RangeError("Ecliptic comparison requires finite longitude and latitude values.");
  }
  return {
    longitudeArcseconds:
      Math.abs(signedCircularDifferenceDegrees(actual.longitudeDegrees, reference.longitudeDegrees)) * 3600,
    latitudeArcseconds:
      Math.abs(actual.latitudeDegrees - reference.latitudeDegrees) * 3600,
  };
}

/**
 * Parses the numeric data rows between Horizons' $$SOE / $$EOE markers for a
 * query requesting QUANTITIES=31 only. Observer quantity 31 is emitted as the
 * final two numeric fields: ecliptic longitude and latitude in degrees.
 */
export function parseHorizonsObserverEclipticRows(
  outputText: string,
  expectedRowCount: number
): HorizonsEclipticRow[] {
  if (!Number.isInteger(expectedRowCount) || expectedRowCount <= 0) {
    throw new RangeError("Expected Horizons row count must be a positive integer.");
  }
  const startMarker = outputText.indexOf("$$SOE");
  const endMarker = outputText.indexOf("$$EOE");
  if (startMarker < 0 || endMarker < 0 || endMarker <= startMarker) {
    throw new Error("Horizons output is missing a valid $$SOE / $$EOE data section.");
  }

  const dataSection = outputText.slice(startMarker + 5, endMarker);
  const lines = dataSection.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const rows: HorizonsEclipticRow[] = [];
  for (const line of lines) {
    const fields = line.split(/\s+/);
    if (fields.length < 4) {
      throw new Error("Unexpected Horizons quantity-31 row: " + line);
    }
    const longitudeToken = fields[fields.length - 2];
    const latitudeToken = fields[fields.length - 1];
    const longitudeDegrees = Number(longitudeToken);
    const latitudeDegrees = Number(latitudeToken);
    if (!Number.isFinite(longitudeDegrees) || !Number.isFinite(latitudeDegrees)) {
      throw new Error("Horizons quantity-31 row does not end in numeric longitude/latitude: " + line);
    }
    if (longitudeDegrees < 0 || longitudeDegrees >= 360 || latitudeDegrees < -90 || latitudeDegrees > 90) {
      throw new Error("Horizons returned ecliptic coordinates outside valid angular ranges: " + line);
    }
    rows.push({ longitudeDegrees, latitudeDegrees });
  }

  if (rows.length !== expectedRowCount) {
    throw new Error(
      "Horizons returned " + rows.length + " data rows; expected " + expectedRowCount + "."
    );
  }
  return rows;
}
