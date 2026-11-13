import assert from "node:assert/strict";
import {
  buildInpopApiUrl,
  formatInpopEpochFile,
  parseInpopRectangularRows,
  validateInpopEpochs,
} from "../lib/astronomy/inpopWesternEphemerisBenchmarks";

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

const epochs = ["2000-01-01T12:00:00.000Z", "2024-02-29T00:00:00.000Z"];
const url = new URL(buildInpopApiUrl("Uranus"));
check(url.hostname === "ssp.imcce.fr", "Capture points to the official IMCCE LTE host");
check(url.searchParams.get("-name") === "p:Uranus", "Miriade target identifier is explicit");
check(url.searchParams.get("-observer") === "500", "Miriade observer is Earth geocenter");
check(url.searchParams.get("-theory") === "INPOP", "Miriade is explicitly requested to use INPOP");
check(url.searchParams.get("-teph") === "2" &&
  url.searchParams.get("-tcoor") === "2" &&
  url.searchParams.get("-rplane") === "2",
  "Miriade query requests apparent-of-date rectangular ecliptic coordinates");
check(url.searchParams.get("-tscale") === "UTC" && url.searchParams.get("-mime") === "json",
  "Miriade query fixes UTC and a machine-readable response");
validateInpopEpochs(epochs);
assertions += 1;
check(formatInpopEpochFile(epochs) === "2000-01-01T12:00:00\n2024-02-29T00:00:00\n",
  "Miriade epoch upload uses whole-second ISO strings without fractional seconds or trailing Z");
assertions += 1;
assert.throws(() => formatInpopEpochFile(["2000-01-01T12:00:00.125Z"]),
  /integer seconds only/, "Epoch serializer rejects lossy millisecond truncation");
assertions += 1;
assert.throws(() => validateInpopEpochs([epochs[1], epochs[0]]),
  /strictly ascending/, "Epoch manifest must be ordered");
assertions += 1;
assert.throws(() => validateInpopEpochs(["not-a-date"]),
  /Invalid canonical UTC/, "Epoch validation rejects malformed timestamps");
assertions += 1;

const payload = {
  ephemeris: {
    time_scale: "UTC",
    planetary_theory: "INPOP21A",
    coordinates: "rectangular",
    reference_frame: { type: "apparent of date", plane: "ecliptic", center: "geocenter" },
  },
  data: [
    { epoch: "2000-01-01T12:00:00.000", X: 1, Y: 1, Z: 1 },
    { epoch: "2024-02-29T00:00:00.000", x: -1, y: 0, z: 0 },
  ],
};
const rows = parseInpopRectangularRows(payload, "Uranus", epochs);
check(rows.length === 2, "Parser returns every requested ephemeris row");
check(rows[0].epochUtc === epochs[0] && rows[1].epochUtc === epochs[1],
  "Parser preserves the requested UTC epochs");
close(rows[0].longitudeDegrees, 45, 1e-10, "Rectangular vector converts to ecliptic longitude");
close(rows[0].latitudeDegrees, Math.asin(1 / Math.sqrt(3)) * 180 / Math.PI, 1e-10,
  "Rectangular vector converts to ecliptic latitude");
close(rows[1].longitudeDegrees, 180, 1e-10, "Parser handles negative x-axis longitude");
close(rows[1].latitudeDegrees, 0, 1e-10, "Parser handles zero ecliptic latitude");

assert.throws(() => parseInpopRectangularRows(
  { ...payload, ephemeris: { ...payload.ephemeris, planetary_theory: "DE441" } },
  "Uranus", epochs
), /INPOP/, "Parser rejects a response using a non-INPOP theory");
assertions += 1;
assert.throws(() => parseInpopRectangularRows(
  { ...payload, ephemeris: { ...payload.ephemeris, reference_frame: { ...payload.ephemeris.reference_frame, plane: "equator" } } },
  "Uranus", epochs
), /ecliptic/, "Parser rejects a response in the wrong reference plane");
assertions += 1;
assert.throws(() => parseInpopRectangularRows(
  { ...payload, data: [{ epoch: "2024-02-29T00:00:00.000", X: 1, Y: 1, Z: 1 }] },
  "Uranus", epochs
), /at row 1/, "Parser rejects an unexpected first epoch");
assertions += 1;
assert.throws(() => parseInpopRectangularRows(
  { ...payload, data: [{ epoch: "2000-01-01T12:00:00.000", X: 1, Y: 1 }] },
  "Uranus", [epochs[0]]
), /missing finite Z coordinate/, "Parser rejects incomplete position vectors");
assertions += 1;
assert.throws(() => parseInpopRectangularRows(
  { ...payload, data: [{ epoch: "2000-01-01T12:00:00.000", X: 0, Y: 0, Z: 0 }] },
  "Uranus", [epochs[0]]
), /zero or non-finite/, "Parser rejects a zero vector");
assertions += 1;

console.log("Independent INPOP harness passed: " + assertions +
  " assertions. It validates request configuration and response parsing only, not astronomical accuracy.");
