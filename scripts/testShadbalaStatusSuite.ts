import assert from "node:assert/strict";
import {
  SHADBALA_IMPLEMENTATION_STATUS,
  ShadbalaEngine,
} from "../lib/vedic/shadbalaEngine";

assert.equal(SHADBALA_IMPLEMENTATION_STATUS.level, "partial");
assert.ok(SHADBALA_IMPLEMENTATION_STATUS.limitations.length >= 5);

const engine = new ShadbalaEngine();

// Apparent geocentric daily speed is not a substitute for the classical
// mean-longitude and seeghrocha data required by Chesta Kendra.
const missingKendraInputs = engine.calculateCheshtaBala("Jupiter", {
  ascendant: 0,
  planets: { Jupiter: { longitude: 125, isRetrograde: false, speed: 0.8 } },
});
assert.equal(missingKendraInputs.available, false);
assert.equal(missingKendraInputs.points, 0);
assert.match(missingKendraInputs.description, /missing Jupiter mean longitude and the mean-Sun longitude/);
assert.match(missingKendraInputs.description, /cannot substitute for mean longitude or seeghrocha/);

const incompletePlanetResult = engine.calculateShadbala("Jupiter", {
  ascendant: 0,
  planets: {
    Jupiter: { longitude: 125, speed: 0.8 },
  },
});
assert.equal(incompletePlanetResult.isComplete, false);
assert.equal(incompletePlanetResult.isStrong, false,
  "A partial Virupa subtotal must not be classified as above or below the classical threshold");
assert.equal(incompletePlanetResult.rank, 0,
  "Incomplete Shadbala results must not be ranked against other planets");
assert.ok(
  incompletePlanetResult.unavailableComponents.some((item) => item.includes("Yuddha Bala")),
  "Unimplemented Yuddha Bala must be surfaced as unavailable, not scored as zero"
);
assert.ok(incompletePlanetResult.estimatedComponents.some((item) => item.includes("partial / approximate")));
assert.match(incompletePlanetResult.interpretation, /available subtotal, not a validated six-fold total/);
assert.deepEqual(incompletePlanetResult.predictions.strongEffects, []);
assert.deepEqual(incompletePlanetResult.predictions.weakEffects, [],
  "Strength-based interpretations are withheld when component coverage is incomplete");

const allIncomplete = engine.calculateAllShadbala({
  ascendant: 0,
  planets: {},
});
assert.equal(allIncomplete.length, 7);
assert.ok(allIncomplete.every((item) => !item.isComplete && !item.isStrong && item.rank === 0),
  "The ranker must leave incomplete planet results unranked rather than order partial subtotals");
assert.ok(allIncomplete.every((item) => item.predictions.strongEffects.length === 0 &&
  item.predictions.weakEffects.length === 0));


// Once source-defined mean and seeghrocha longitudes are supplied, Kendra
// determines the score. Daily speed remains diagnostic metadata only.
const directKendra = engine.calculateCheshtaBala("Jupiter", {
  ascendant: 0,
  planets: {
    Sun: { longitude: 300, meanLongitude: 300 },
    Jupiter: { longitude: 130, meanLongitude: 125, speed: 0.8, isRetrograde: false },
  },
});
assert.equal(directKendra.available, true);
assert.equal(directKendra.state, "Kendra computed");
assert.equal(directKendra.details?.midpointLongitude, 127.5);
assert.equal(directKendra.details?.reducedKendraDegrees, 172.5);
assert.equal(directKendra.points, 57.5);
assert.equal(directKendra.motion, 0.8);

// Changing only the apparent motion metadata must not change Chesta Kendra.
const retrogradeMetadata = engine.calculateCheshtaBala("Jupiter", {
  ascendant: 0,
  planets: {
    Sun: { longitude: 300, meanLongitude: 300 },
    Jupiter: { longitude: 130, meanLongitude: 125, speed: -0.1, isRetrograde: true },
  },
});
assert.equal(retrogradeMetadata.available, true);
assert.equal(retrogradeMetadata.points, directKendra.points);
assert.equal(retrogradeMetadata.motion, -0.1);
assert.equal(retrogradeMetadata.isRetrograde, true);

console.log("Shadbala transparency and source-defined Chesta Kendra suite passed.");
