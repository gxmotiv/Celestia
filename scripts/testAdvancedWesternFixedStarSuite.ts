import { swissEphemeris } from "../lib/astronomy/swissEphemeris";
import { FixedStarsEngine } from "../lib/astronomy/specializedWesternEngines";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`[FAIL] ${message}`);
  console.log(`[PASS] ${message}`);
}

const engine = new FixedStarsEngine();
const regulus = FixedStarsEngine.FIXED_STARS.find((star) => star.name.includes("Regulus"));
if (!regulus) throw new Error("Regulus reference star missing");

const j2000 = engine.getStarLongitudeAtEpoch(regulus, 2451545.0);
assert(Math.abs(j2000.correctionDegrees) < 1e-9, "J2000 epoch applies zero precession correction");
assert(Math.abs(j2000.longitude - regulus.longitude) < 1e-9, "J2000 longitude is unchanged at its catalogue epoch");

const jd2011 = swissEphemeris.calculateJulianDay(2011, 1, 1, 0, 0, 0, 0);
const epoch2011 = engine.getStarLongitudeAtEpoch(regulus, jd2011);
assert(epoch2011.correctionDegrees > 0.14 && epoch2011.correctionDegrees < 0.17, "2011 epoch applies the expected positive general-precession estimate");

const jd1452 = swissEphemeris.calculateJulianDay(1452, 4, 15, 21, 0, 0, 0);
const historical = engine.getStarLongitudeAtEpoch(regulus, jd1452);
assert(historical.correctionDegrees < -7 && historical.correctionDegrees > -8, "Fifteenth-century charts receive a negative epoch correction of several degrees");
assert(historical.longitude >= 0 && historical.longitude < 360, "Precession-adjusted longitude remains normalized");

console.log("\nAdvanced Western fixed-star epoch regression suite completed.");
