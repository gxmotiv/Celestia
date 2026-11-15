import assert from "node:assert/strict";
import {
  SHADBALA_IMPLEMENTATION_STATUS,
  ShadbalaEngine,
} from "../lib/vedic/shadbalaEngine";

assert.equal(SHADBALA_IMPLEMENTATION_STATUS.level, "partial");
assert.ok(SHADBALA_IMPLEMENTATION_STATUS.limitations.length >= 5);

const engine = new ShadbalaEngine();
const missingMotion = engine.calculateCheshtaBala("Jupiter", {
  ascendant: 0,
  planets: { Jupiter: { longitude: 125, isRetrograde: false } },
});
assert.equal(missingMotion.available, false);
assert.equal(missingMotion.points, 0);
assert.match(missingMotion.description, /No default speed is invented/);

const directMotion = engine.calculateCheshtaBala("Jupiter", {
  ascendant: 0,
  planets: { Jupiter: { longitude: 125, isRetrograde: false, speed: 0.8 } },
});
assert.equal(directMotion.available, true);
assert.equal(directMotion.points, 30);

const retrogradeMotion = engine.calculateCheshtaBala("Jupiter", {
  ascendant: 0,
  planets: { Jupiter: { longitude: 125, isRetrograde: true, speed: -0.1 } },
});
assert.equal(retrogradeMotion.available, true);
assert.equal(retrogradeMotion.points, 60);

console.log("Shadbala transparency and real-motion input suite passed.");
