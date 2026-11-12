import assert from "node:assert/strict";
import * as Astronomy from "astronomy-engine";
import { SwissEphemerisEngine } from "../lib/astronomy/swissEphemeris";

const engine = new SwissEphemerisEngine();
const toRadians = (degrees: number) => degrees * Math.PI / 180;
const toDegrees = (radians: number) => radians * 180 / Math.PI;
const normalize = (degrees: number) => ((degrees % 360) + 360) % 360;

function expectedAngles(julianDay: number, latitude: number, longitude: number) {
  const time = new Astronomy.AstroTime(julianDay - 2451545.0);
  const gastDegrees = Astronomy.SiderealTime(time) * 15;
  const ramcDegrees = normalize(gastDegrees + longitude);
  const obliquity = toRadians(Astronomy.e_tilt(time).tobl);
  const phi = toRadians(latitude);
  const ramc = toRadians(ramcDegrees);

  const mc = normalize(toDegrees(Math.atan2(
    Math.sin(ramc),
    Math.cos(ramc) * Math.cos(obliquity)
  )));
  const asc = normalize(toDegrees(Math.atan2(
    Math.cos(ramc),
    -Math.sin(ramc) * Math.cos(obliquity) - Math.tan(phi) * Math.sin(obliquity)
  )));
  return { asc, mc };
}

const cases = [
  { jd: 2451545.0, latitude: 0, longitude: 0 },
  { jd: 2460200.25, latitude: 25.033, longitude: 121.5654 },
  { jd: 2440000.75, latitude: -33.8688, longitude: 151.2093 },
];

let assertions = 0;
for (const sample of cases) {
  const expected = expectedAngles(sample.jd, sample.latitude, sample.longitude);
  const actual = engine.calculateHouses(
    sample.jd,
    sample.latitude,
    sample.longitude,
    "P"
  );
  assert.ok(Math.abs(actual.ascendant - expected.asc) < 0.0002,
    `Ascendant frame mismatch at JD ${sample.jd}: expected ${expected.asc}, received ${actual.ascendant}`);
  assertions++;
  assert.ok(Math.abs(actual.midheaven - expected.mc) < 0.0002,
    `Midheaven frame mismatch at JD ${sample.jd}: expected ${expected.mc}, received ${actual.midheaven}`);
  assertions++;
}

console.log(`House apparent-frame consistency suite passed: ${assertions} assertions.`);
