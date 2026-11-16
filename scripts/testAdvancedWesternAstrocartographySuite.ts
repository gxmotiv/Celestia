import { calculateWesternChart, normalizeDegrees } from "../lib/astronomy/ephemeris";
import { AstrocartographyEngine } from "../lib/astronomy/specializedWesternEngines";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`[FAIL] ${message}`);
  console.log(`[PASS] ${message}`);
}

function angularDifference(a: number, b: number): number {
  const diff = Math.abs(normalizeDegrees(a) - normalizeDegrees(b));
  return Math.min(diff, 360 - diff);
}

const birthLongitude = -74.006;
const chart = calculateWesternChart(2000, 1, 1, 12, 0, 40.7128, birthLongitude, -5, "Placidus");
const report = new AstrocartographyEngine().calculatePowerLines(chart, birthLongitude);

assert(report.powerLines.length >= 40, "Ten classical planets and Chiron receive all four angle-line types where geometrically available");
assert(report.powerLines.every((line) => Number.isFinite(line.longitudeTarget)), "All line reference longitudes are finite");
assert(report.powerLines.every((line) => line.longitudeTarget >= 0 && line.longitudeTarget < 360), "All line reference longitudes are normalized");

const sunMc = report.powerLines.find((line) => line.planet === "Sun" && line.lineType === "MC (Midheaven)");
const sunIc = report.powerLines.find((line) => line.planet === "Sun" && line.lineType === "IC (Imum Coeli)");
const sunAc = report.powerLines.find((line) => line.planet === "Sun" && line.lineType === "AC (Ascendant)");
const sunDc = report.powerLines.find((line) => line.planet === "Sun" && line.lineType === "DC (Descendant)");

assert(!!sunMc && !!sunIc && !!sunAc && !!sunDc, "Sun MC, IC, AC and DC lines are all present");
assert(angularDifference(sunMc!.longitudeTarget, sunIc!.longitudeTarget) === 180, "IC meridian is exactly opposite the MC meridian");
assert(sunAc!.pathPoints.length > 20 && sunDc!.pathPoints.length > 20, "AC and DC are sampled latitude-dependent curves, not single meridian points");
assert(sunAc!.pathPoints.some((point) => point.latitude === 0), "AC curve includes the equator reference");
assert(sunDc!.pathPoints.some((point) => point.latitude === 0), "DC curve includes the equator reference");
assert(angularDifference(sunAc!.longitudeTarget, sunDc!.longitudeTarget) === 180, "AC and DC equator crossings are opposite");

const latitudeSamples = sunAc!.pathPoints.map((point) => point.latitude);
assert(new Set(latitudeSamples).size === latitudeSamples.length, "AC path does not duplicate latitude samples");
assert(report.method.includes("right ascension") && report.method.includes("horizon crossings"), "Report explains the astronomical method and geometric-horizon limitation");

console.log("\nAdvanced Western astrocartography regression suite completed.");
