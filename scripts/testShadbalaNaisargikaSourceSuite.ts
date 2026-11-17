import assert from "node:assert/strict";
import {
  ShadbalaEngine,
  type NaisargikaBalaMethod,
} from "../lib/vedic/shadbalaEngine";

const bphs = {
  Sun: 60.00,
  Moon: 51.43,
  Venus: 42.86,
  Jupiter: 34.29,
  Mercury: 25.71,
  Mars: 17.14,
  Saturn: 8.57,
} as const;

const raman = {
  Sun: 60.00,
  Moon: 51.43,
  Venus: 42.85,
  Jupiter: 34.28,
  Mercury: 25.70,
  Mars: 17.14,
  Saturn: 8.57,
} as const;

assert.deepEqual(ShadbalaEngine.NAISARGIKA_POINTS, bphs);
assert.deepEqual(ShadbalaEngine.RAMAN_NAISARGIKA_POINTS, raman);

const engine = new ShadbalaEngine();
for (const planet of Object.keys(bphs) as (keyof typeof bphs)[]) {
  const defaultResult = engine.calculateNaisargikaBala(planet);
  assert.equal(defaultResult.method, "bphs-sevenths-rounded");
  assert.equal(defaultResult.points, bphs[planet],
    `BPHS 27.14 ${planet} must equal 60/7 multiplied by its rank, rounded to two decimals`);

  const ramanResult = engine.calculateNaisargikaBala(planet, "raman-article-108");
  assert.equal(ramanResult.method, "raman-article-108");
  assert.equal(ramanResult.points, raman[planet],
    `Raman Article 108 ${planet} must preserve the printed decimal`);
}

// The profile choice affects only Naisargika Bala; other component scores are
// unchanged. Partial status remains partial under either precision convention.
const baseInput = {
  ascendant: 0,
  birthTimeKnown: false,
  planets: { Sun: { longitude: 125 } },
};
const defaultSun = engine.calculateShadbala("Sun", baseInput);
const ramanSun = engine.calculateShadbala("Sun", {
  ...baseInput,
  naisargikaBalaMethod: "raman-article-108",
});
assert.equal(defaultSun.naisargikaBala.points, 60);
assert.equal(ramanSun.naisargikaBala.points, 60);
assert.equal(defaultSun.naisargikaBala.method, "bphs-sevenths-rounded");
assert.equal(ramanSun.naisargikaBala.method, "raman-article-108");
assert.equal(defaultSun.totalVirupas, ramanSun.totalVirupas);
assert.equal(defaultSun.isComplete, false);
assert.equal(ramanSun.isComplete, false);

// Venus, Jupiter, and Mercury are the places where Raman's printed table
// differs from mathematically rounded BPHS sevenths.
for (const [planet, expectedBphs, expectedRaman] of [
  ["Venus", 42.86, 42.85],
  ["Jupiter", 34.29, 34.28],
  ["Mercury", 25.71, 25.70],
] as const) {
  assert.equal(engine.calculateNaisargikaBala(planet).points, expectedBphs);
  assert.equal(engine.calculateNaisargikaBala(planet, "raman-article-108").points, expectedRaman);
}

// Prove the selected source flows through calculateShadbala for each of
// the three differing decimals, not only through the standalone component.
for (const [planet, expectedBphs, expectedRaman] of [
  ["Venus", 42.86, 42.85],
  ["Jupiter", 34.29, 34.28],
  ["Mercury", 25.71, 25.70],
] as const) {
  const input = {
    ascendant: 0,
    birthTimeKnown: false,
    planets: { [planet]: { longitude: 125 } },
  };
  const bphsResult = engine.calculateShadbala(planet, input);
  const ramanResult = engine.calculateShadbala(planet, {
    ...input,
    naisargikaBalaMethod: "raman-article-108",
  });
  assert.equal(bphsResult.naisargikaBala.points, expectedBphs);
  assert.equal(ramanResult.naisargikaBala.points, expectedRaman);
  assert.ok(
    Math.abs(
      (ramanResult.totalVirupas - bphsResult.totalVirupas) -
      (expectedRaman - expectedBphs)
    ) < 1e-9,
    `${planet} total Virupas must move only by its source-specific Naisargika decimal difference`
  );
  assert.equal(ramanResult.isComplete, false);
  assert.equal(ramanResult.isStrong, false);
  assert.equal(ramanResult.rank, 0);
}

assert.throws(
  () => engine.calculateNaisargikaBala("Sun", "unknown" as NaisargikaBalaMethod),
  /Unknown Naisargika Bala method/,
  "An unknown source profile must not silently fall back to another decimal table"
);
assert.throws(
  () => engine.calculateNaisargikaBala("Rahu"),
  /seven classical planets/,
  "Rahu and Ketu must not be given a fabricated Naisargika score by the seven-graha Shadbala table"
);

console.log(
  "Shadbala Naisargika source suite passed: BPHS 27.14 rational sevenths, Raman Article 108 printed values, integration isolation, and fail-closed unknown profiles."
);
