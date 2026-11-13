import assert from "node:assert/strict";
import {
  buildJplWesternHorizonsQueryUrl,
  compareEclipticCoordinates,
  parseHorizonsObserverEclipticRows,
  signedCircularDifferenceDegrees,
  WESTERN_HORIZONS_BODIES,
} from "../lib/astronomy/westernEphemerisBenchmarks";

let assertions = 0;
function check(condition: unknown, message: string): void {
  assert.ok(condition, message);
  assertions += 1;
}

function close(actual: number, expected: number, tolerance: number, message: string): void {
  assert.ok(Math.abs(actual - expected) <= tolerance,
    message + "; expected " + expected + ", received " + actual);
  assertions += 1;
}

const output = [
  "JPL/HORIZONS observer table",
  "Output quantities: 31",
  "$$SOE",
  " 2000-Jan-01 12:00:00.000          280.12345678   -0.00012345",
  " 2024-Feb-29 00:00:00.000           12.50000000    1.25000000",
  "$$EOE",
].join("\n");
const parsed = parseHorizonsObserverEclipticRows(output, 2);
const queryEpochs = [
  "2000-01-01T12:00:00.000Z",
  "2024-02-29T00:00:00.000Z",
];
const queryUrl = new URL(buildJplWesternHorizonsQueryUrl("10", queryEpochs));
check(queryUrl.hostname === "ssd.jpl.nasa.gov",
  "Horizons request uses the official documented API hostname");
check(queryUrl.searchParams.get("TLIST") ===
  "'2000-Jan-01 12:00:00.000' '2024-Feb-29 00:00:00.000'",
  "Horizons TLIST URL contains separate individually quoted calendar times");
check(queryUrl.toString().includes("%20"),
  "Horizons discrete date list encodes date separators as percent-encoded spaces");
check(queryUrl.searchParams.get("TLIST")?.startsWith("'") === true &&
  queryUrl.searchParams.get("TLIST")?.endsWith("'") === true &&
  queryUrl.searchParams.get("TLIST")?.includes("' '") === true,
  "Horizons TLIST is a space-separated sequence of quoted epochs, not one quoted string");
check(queryUrl.searchParams.get("CENTER") === "'500@399'" &&
  queryUrl.searchParams.get("EPHEM_TYPE") === "'OBSERVER'" &&
  queryUrl.searchParams.get("QUANTITIES") === "'31'",
  "Horizons reference query fixes Earth geocenter, observer output, and quantity 31");
assert.throws(() => buildJplWesternHorizonsQueryUrl("10", ["not-a-date"]),
  /Invalid canonical UTC/, "Horizons query builder rejects non-canonical timestamps");
assertions += 1;
assert.throws(() => buildJplWesternHorizonsQueryUrl("Earth", queryEpochs),
  /target id/, "Horizons query builder rejects non-numeric target IDs");
assertions += 1;

check(parsed.length === 2, "Horizons quantity-31 parser returns both observation rows");
close(parsed[0].longitudeDegrees, 280.12345678, 1e-10, "Parser extracts ecliptic longitude in degrees");
close(parsed[0].latitudeDegrees, -0.00012345, 1e-10, "Parser extracts ecliptic latitude in degrees");
close(parsed[1].longitudeDegrees, 12.5, 1e-10, "Parser handles a second date row");
close(parsed[1].latitudeDegrees, 1.25, 1e-10, "Parser handles positive ecliptic latitude");

close(signedCircularDifferenceDegrees(0.1, 359.9), 0.2, 1e-10,
  "Circular longitude residual crosses the 0°/360° boundary correctly");
close(signedCircularDifferenceDegrees(359.9, 0.1), -0.2, 1e-10,
  "Circular longitude residual preserves signed wrap direction");
close(signedCircularDifferenceDegrees(180, 0), -180, 1e-10,
  "Circular longitude difference is bounded at the opposition boundary");

const residual = compareEclipticCoordinates(
  { longitudeDegrees: 0.1, latitudeDegrees: 2.0 },
  { longitudeDegrees: 359.9, latitudeDegrees: 1.5 }
);
close(residual.longitudeArcseconds, 720, 1e-7,
  "Coordinate comparison reports the shortest longitude separation in arcseconds");
close(residual.latitudeArcseconds, 1800, 1e-7,
  "Coordinate comparison reports absolute latitude residual in arcseconds");

assert.throws(() => parseHorizonsObserverEclipticRows("no table markers here", 1),
  /valid.*SOE.*EOE/, "Parser rejects missing Horizons data markers");
assertions += 1;
assert.throws(() => parseHorizonsObserverEclipticRows(output, 1),
  /expected 1/, "Parser rejects an unexpected observation-row count");
assertions += 1;
assert.throws(() => parseHorizonsObserverEclipticRows(
  "$$SOE\n 2000-Jan-01 12:00:00.000 not-a-number 0.0\n$$EOE", 1
), /numeric longitude\/latitude/, "Parser rejects non-numeric reference coordinates");
assertions += 1;

check(WESTERN_HORIZONS_BODIES.length === 10,
  "Benchmark manifest covers the Sun, Moon and eight major planets");
check(WESTERN_HORIZONS_BODIES.some((body) => body.name === "Pluto" && body.targetId === "999"),
  "Pluto is captured as its own target rather than silently omitted");
check(!WESTERN_HORIZONS_BODIES.some((body) => (body.name as string) === "NorthNode"),
  "Astrological lunar nodes are not misrepresented as direct Horizons major-body targets");

console.log("Western JPL reference harness passed: " + assertions + " assertions. " +
  "This validates parsing and residual arithmetic only; no external ephemeris values are asserted.");
